import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
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

    const brandName = profile?.brand_name || "the user's brand";
    const industry = profile?.industry || "creative industry";
    const voice = profile?.brand_voice || "friendly, helpful, and professional";
    const colors = profile?.color_1 ? `${profile.color_1}, ${profile.color_2}, ${profile.color_3}` : "standard elegant colors";

    const systemPrompt = `You are a highly capable AI Brand Marketer and Assistant for "${brandName}". 
Industry: ${industry}
Brand Voice: ${voice}
Color Palette: ${colors}

You are helping the user manage their brand, brainstorm marketing ideas, write copy, answer questions, or generate images.

**CRITICAL INSTRUCTION FOR IMAGES**:
If the user asks you to generate, design, or create an image, logo, thumbnail, photo, or scene, you MUST NOT refuse and you must NOT simply describe it.
Instead, you must include a special tag anywhere in your text response exactly matching this format:
[GENERATE_IMAGE: <detailed visual prompt describing the requested image in high quality>]

Example 1 (User asks for a thumbnail):
"Sure! Here is a YouTube thumbnail for your tech review:
[GENERATE_IMAGE: High energy YouTube thumbnail with bold text 'TECH REVIEW', vibrant neon colors, futuristic style, incorporating ${profile?.color_1 || 'blue'}]"

Example 2 (User asks for advice):
"To improve your engagement, try posting more behind the scenes..." (No tag included since no image was asked for).

Ensure you always apply the brand's voice and principles to everything you write or generate.`;

    const aiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    const chatResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o", 
        messages: aiMessages,
        temperature: 0.7,
      }),
    });

    if (!chatResponse.ok) {
      throw new Error(`AI Gateway Text Error: ${chatResponse.status} ${await chatResponse.text()}`);
    }

    const chatData = await chatResponse.json();
    let assistantReply = chatData.choices?.[0]?.message?.content || "";
    let generatedImageUrl = null;

    const imageTagRegex = /\[GENERATE_IMAGE:\s*([^\]]+)\]/is;
    const match = assistantReply.match(imageTagRegex);

    if (match && match[1]) {
      const imagePrompt = match[1].trim();
      console.log("Image generation tag detected! Prompt:", imagePrompt);
      
      assistantReply = assistantReply.replace(imageTagRegex, "").trim();
      
      if (!assistantReply) assistantReply = "Here is the image you requested based on your brand principles:";

      const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-pro-image-preview",
          messages: [{ role: "user", content: imagePrompt }],
          modalities: ["image", "text"],
        }),
      });

      if (imageResponse.ok) {
         const imgData = await imageResponse.json();
         generatedImageUrl = imgData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      } else {
         console.warn(`AI Gateway Image Error: ${imageResponse.status} ${await imageResponse.text()}`);
         assistantReply += "\n\n*(Error: The image generation service failed to produce an image at this time).*";
      }
    }

    if (supabaseUrl && supabaseServiceKey && userId) {
      const adminClient = createClient(supabaseUrl, supabaseServiceKey);
      await adminClient.from('generated_activities').insert({
        user_id: userId,
        activity_type: generatedImageUrl ? 'logo' : 'caption', 
        details: { content: "Conversational Request", imageUrl: generatedImageUrl, isChat: true }
      });
    }

    return new Response(JSON.stringify({ 
      role: 'assistant', 
      content: assistantReply,
      imageUrl: generatedImageUrl 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("brand-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
