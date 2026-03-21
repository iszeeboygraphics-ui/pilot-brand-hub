import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  
  try {
    const { query } = await req.json();
    if (!query) throw new Error("Search query required");

    console.log("Executing Web Search for:", query);

    // Call DuckDuckGo Lite
    const ddgResponse = await fetch("https://lite.duckduckgo.com/lite/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      body: `q=${encodeURIComponent(query)}`
    });
    
    if (!ddgResponse.ok) throw new Error("External search engine failed to respond");
    
    const html = await ddgResponse.text();
    
    // Parse HTML manually since Deno Deploy lacks full DOMParser by default
    const snippetRegex = /<td class='result-snippet'>([\s\S]*?)<\/td>/g;
    let match;
    const results = [];
    
    while ((match = snippetRegex.exec(html)) !== null && results.length < 5) {
      // Strip HTML tags and decode basic HTML entities
      let text = match[1].replace(/<[^>]*>?/gm, '').trim();
      text = text.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
      if (text) results.push(text);
    }
    
    const summary = results.length > 0 
      ? results.join("\n\n") 
      : "No specific internet results found. Provide the best answer based on your general knowledge.";

    return new Response(JSON.stringify({ results: summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Web search error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
