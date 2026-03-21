import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { brandName: reqBrand, industry: reqInd, brandVoice: reqVoice } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const authHeader = req.headers.get('Authorization');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    let profile = null;
    let userId = null;
    
    if (authHeader && supabaseUrl && supabaseServiceKey) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const payloadBase64 = token.split('.')[1];
        const payload = JSON.parse(atob(payloadBase64));
        userId = payload.sub;
      } catch (e) {
        console.error("JWT decode error:", e);
      }
      if (userId) {
        const adminClient = createClient(supabaseUrl, supabaseServiceKey);
        const { data } = await adminClient.from('brand_profiles').select('*').eq('user_id', userId).maybeSingle();
        profile = data;
      }
    }
    
    const brandName = profile?.brand_name || reqBrand;
    const industry = profile?.industry || reqInd;
    const brandVoice = profile?.brand_voice || reqVoice;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const voiceGuide: Record<string, string> = {
      luxury: "Use sophisticated, aspirational language. Evoke exclusivity and premium quality.",
      bold: "Use punchy, confident, high-energy language. Be direct and commanding.",
      minimalist: "Use clean, concise language. Let the product speak for itself with understated elegance.",
      friendly: "Use warm, conversational, approachable language. Feel like a trusted friend recommending something great.",
    };

    const voiceInstruction = voiceGuide[(brandVoice || "bold").toLowerCase()] || voiceGuide.bold;

    const systemPrompt = `You are an expert social media copywriter. Write captions using the AIDA framework (Attention, Interest, Desire, Action). 
${voiceInstruction}
Output ONLY the caption text — no labels, no markdown, no explanations. Include relevant emojis and 5-7 hashtags at the end.`;

    const userPrompt = `Write a high-conversion Instagram/social media sales caption for "${brandName || "a premium brand"}" in the ${industry || "lifestyle"} industry. The caption should stop scrollers, build desire, and drive action.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited — please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted — please add funds in Settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      throw new Error(`AI gateway error [${status}]`);
    }

    const data = await response.json();
    const caption = data.choices?.[0]?.message?.content;

    if (supabaseUrl && supabaseServiceKey && userId && caption) {
      const adminClient = createClient(supabaseUrl, supabaseServiceKey);
      const { error } = await adminClient.from('generated_activities').insert({
        user_id: userId,
        activity_type: 'caption',
        details: { content: caption }
      });
      if (error) console.error("DB Insert Error:", error);
    }

    return new Response(JSON.stringify({ caption }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-caption error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
