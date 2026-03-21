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
    { role: 'assistant', content: "Hello! I'm your personalized Brand Assistant. Ask me anything, tell me to write a post, or ask me to generate a graphic for your brand!" }
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
    
    setMessages(chatHistory);
    setInput('');
    setIsLoading(true);

    try {
      // Map history for API
      const apiMessages = chatHistory.map(m => ({ role: m.role, content: m.content }));
      
      const { data, error } = await supabase.functions.invoke('brand-assistant', {
        body: { messages: apiMessages },
        headers: {
           Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.content,
        imageUrl: data.imageUrl
      }]);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to generate response");
      setMessages(prev => [...prev, { role: 'assistant', content: "Oops, something went wrong on my end. Please try again later."}]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card-neural flex flex-col h-[650px] shadow-sm overflow-hidden animate-fade-in">
      <div className="flex items-center gap-3 p-4 border-b border-border bg-muted/20 shrink-0">
        <Sparkles className="w-5 h-5 text-primary animate-pulse-glow" />
        <div>
          <h2 className="font-semibold">Brand Assistant</h2>
          <p className="text-xs text-muted-foreground leading-tight mt-0.5">Always on-brand intelligence</p>
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
             placeholder="Ask a question, write a prompt, or request an image..."
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
