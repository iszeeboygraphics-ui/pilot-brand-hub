import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, User, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string | null;
}

export function BrandAssistant() {
  const { session } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hello! I'm your AI Assistant. Ask me anything, search the web, have a conversation, or tell me to generate a graphic!" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || !session?.access_token) return;
    
    const newMsg: Message = { role: 'user', content: input };
    const chatHistory = [...messages, newMsg];
    
    setMessages([...chatHistory, { role: 'assistant', content: "" }]);
    setInput('');
    setIsLoading(true);

    try {
      const apiMessages = chatHistory.map(m => ({ role: m.role, content: m.content }));
      
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/brand-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ messages: apiMessages })
      });

      if (!response.ok) throw new Error(`Network response was not ok: ${response.status}`);
      if (!response.body) throw new Error("No readable stream");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantResponse = "";
      let buffer = "";

      // Turn off generic loading spinner since we are streaming live now
      setIsLoading(false);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        let newlineIndex;
        while ((newlineIndex = buffer.indexOf('\n\n')) >= 0) {
           const message = buffer.slice(0, newlineIndex);
           buffer = buffer.slice(newlineIndex + 2);
           
           if (message.startsWith('data: ')) {
              const dataStr = message.slice(6);
              if (dataStr === '[DONE]') continue;
              
              try {
                 const data = JSON.parse(dataStr);
                 const textChunk = data.choices?.[0]?.delta?.content || "";
                 if (textChunk) {
                    assistantResponse += textChunk;
                    setMessages(prev => {
                       const newMsgs = [...prev];
                       newMsgs[newMsgs.length - 1].content = assistantResponse;
                       return newMsgs;
                    });
                 }
              } catch (e) {
                 // Ignore partial json chunk errors
              }
           }
        }
      }

      // STREAM COMPLETE. Check for action tags.
      const imageTagRegex = /\[GENERATE_IMAGE:\s*([^\]]+)\]/is;
      const searchTagRegex = /\[SEARCH:\s*([^\]]+)\]/is;
      
      const imageMatch = assistantResponse.match(imageTagRegex);
      const searchMatch = assistantResponse.match(searchTagRegex);

      if (imageMatch && imageMatch[1]) {
         const imagePrompt = imageMatch[1].trim();
         const cleanedText = assistantResponse.replace(imageTagRegex, "").trim() || "Generating your image based on your brand principles...";
         
         setMessages(prev => {
           const newMsgs = [...prev];
           newMsgs[newMsgs.length - 1].content = cleanedText;
           return newMsgs;
         });

         setIsLoading(true); // Restart loading for image generation
         try {
            const { data: imgData, error: imgError } = await supabase.functions.invoke('generate-assistant-image', {
               body: { prompt: imagePrompt }
            });
            if (imgError) throw imgError;
            
            setMessages(prev => {
              const newMsgs = [...prev];
              newMsgs[newMsgs.length - 1].imageUrl = imgData?.imageUrl;
              return newMsgs;
            });
         } catch (e) {
            console.error("Assistant Image Error:", e);
            toast.error("Failed to generate the image from the request.");
         }
      } else if (searchMatch && searchMatch[1]) {
         const searchQuery = searchMatch[1].trim();
         
         setMessages(prev => {
           const newMsgs = [...prev];
           newMsgs[newMsgs.length - 1].content = `🔍 Searching the web for: "${searchQuery}"...`;
           return newMsgs;
         });

         setIsLoading(true); 
         try {
            const { data: searchData, error: searchError } = await supabase.functions.invoke('web-search', {
               body: { query: searchQuery }
            });
            if (searchError) throw searchError;
            
            const searchResults = searchData.results;
            
            // Re-trigger the stream with the search context
            const invisibleSearchHistory = [
               ...apiMessages, 
               { role: 'assistant', content: `[SEARCH: ${searchQuery}]` },
               { role: 'user', content: `SYSTEM MESSAGE - WEB SEARCH RESULTS for "${searchQuery}":\n${searchResults}\n\nPlease formulate your final helpful answer using these results.` }
            ];

            const response2 = await fetch(`${supabase.supabaseUrl}/functions/v1/brand-assistant`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`
              },
              body: JSON.stringify({ messages: invisibleSearchHistory })
            });

            if (!response2.ok) throw new Error("Network error during search resolution");
            if (!response2.body) throw new Error("No readable stream");

            setMessages(prev => {
               const newMsgs = [...prev];
               newMsgs[newMsgs.length - 1].content = "";
               return newMsgs;
            });

            const reader2 = response2.body.getReader();
            const decoder2 = new TextDecoder();
            let finalResponse = "";
            let buffer2 = "";

            setIsLoading(false);

            while (true) {
              const { value, done } = await reader2.read();
              if (done) break;
              
              buffer2 += decoder2.decode(value, { stream: true });
              let newlineIndex;
              while ((newlineIndex = buffer2.indexOf('\n\n')) >= 0) {
                 const message = buffer2.slice(0, newlineIndex);
                 buffer2 = buffer2.slice(newlineIndex + 2);
                 if (message.startsWith('data: ')) {
                    const dataStr = message.slice(6);
                    if (dataStr === '[DONE]') continue;
                    try {
                       const data = JSON.parse(dataStr);
                       const textChunk = data.choices?.[0]?.delta?.content || "";
                       if (textChunk) {
                          finalResponse += textChunk;
                          setMessages(prev => {
                             const newMsgs = [...prev];
                             newMsgs[newMsgs.length - 1].content = finalResponse;
                             return newMsgs;
                          });
                       }
                    } catch (e) { }
                 }
              }
            }

         } catch (e) {
            console.error("Web Search Error:", e);
            setMessages(prev => {
               const newMsgs = [...prev];
               newMsgs[newMsgs.length - 1].content = "*(Web search failed or was blocked. I cannot access real-time info right now).*";
               return newMsgs;
            });
         } finally {
            setIsLoading(false);
         }
      }

    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to generate response");
      setMessages(prev => {
        const newMsgs = [...prev];
        if (!newMsgs[newMsgs.length-1].content) {
          newMsgs[newMsgs.length-1].content = "Oops, something went wrong on my end. Please try again later.";
        }
        return newMsgs;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card-neural flex flex-col h-[calc(100vh-12rem)] min-h-[500px] md:h-[650px] shadow-sm overflow-hidden animate-fade-in">
      <div className="flex items-center gap-3 p-4 border-b border-border bg-muted/20 shrink-0">
        <Sparkles className="w-5 h-5 text-primary animate-pulse-glow" />
        <div>
          <h2 className="font-semibold">AI Assistant</h2>
          <p className="text-xs text-muted-foreground leading-tight mt-0.5">General-purpose AI with brand intelligence</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}>
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            </div>
            
            <div className={`max-w-[85%] space-y-3 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              {msg.content && (
                 <div className={`p-4 text-sm leading-relaxed shadow-sm ${
                   msg.role === 'user' 
                     ? 'bg-primary text-primary-foreground rounded-[20px] rounded-tr-[4px]' 
                     : 'bg-background border border-border rounded-[20px] rounded-tl-[4px] text-foreground'
                 }`}>
                   <p className="whitespace-pre-wrap">{msg.content}</p>
                 </div>
              )}
              {msg.imageUrl && (
                 <div className={`rounded-xl overflow-hidden border border-border shadow-sm max-w-sm cursor-pointer hover:opacity-95 transition-opacity ${msg.role === 'user' ? 'ml-auto' : ''}`}>
                   <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer">
                     <img src={msg.imageUrl} alt="AI Generated" className="w-full h-auto object-cover" loading="lazy" />
                   </a>
                 </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 animate-fade-in">
             <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm bg-primary/10 text-primary">
               <Sparkles className="w-4 h-4" />
             </div>
             <div className="p-4 bg-background border border-border rounded-[20px] rounded-tl-[4px] shadow-sm flex items-center gap-2 h-[52px]">
                <span className="flex space-x-1">
                  <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce"></span>
                </span>
             </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 bg-background border-t border-border shrink-0">
         <form 
           onSubmit={(e) => { e.preventDefault(); handleSend(); }}
           className="flex items-center gap-2"
         >
           <Input 
             value={input} 
             onChange={e => setInput(e.target.value)}
             placeholder="Ask a factual question, search the web, prompt an image, or just chat..."
             className="h-12 input-neural shadow-sm rounded-full px-5"
             disabled={isLoading}
           />
           <Button type="submit" disabled={!input.trim() || isLoading} className="h-12 w-12 rounded-full px-0 shrink-0 shadow-sm transition-transform active:scale-95">
             <Send className="w-5 h-5 ml-1" />
           </Button>
         </form>
      </div>
    </div>
  );
}
