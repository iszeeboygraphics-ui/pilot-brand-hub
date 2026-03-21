import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const presetPrompts: Record<string, string> = {
  office: "Place this product on a clean minimalist office desk with soft natural window light, white walls, a plant in the background, and a modern aesthetic. Professional product photography style.",
  cafe: "Place this product on a marble table inside a luxury café with warm ambient lighting, gold accents, espresso cups nearby, and elegant décor. High-end lifestyle photography.",
  street: "Place this product in an urban street-style setting with concrete textures, graffiti walls, neon signage, and moody evening lighting. Trendy editorial photography.",
  studio: "Place this product in a professional photography studio with dramatic studio lighting, clean backdrop, perfect shadows, and commercial-grade presentation.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageBase64, preset, refinement } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!imageBase64 || !preset) {
      return new Response(JSON.stringify({ error: "imageBase64 and preset are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    let prompt = presetPrompts[preset] || presetPrompts.studio;
    if (profile?.color_1) {
      prompt += ` Subtly incorporate the brand's primary color ${profile.color_1} into the lighting or background elements.`;
    }
    if (refinement) {
      prompt += ` \n\nUSER REFINEMENT INSTRUCTIONS: Please apply the following explicit adjustments to the design: ${refinement}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: imageBase64 } },
            ],
          },
        ],
        modalities: ["image", "text"],
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
    const generatedImage = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!generatedImage) {
      throw new Error("No image was generated");
    }

    if (supabaseUrl && supabaseServiceKey && userId) {
      const adminClient = createClient(supabaseUrl, supabaseServiceKey);
      const { error } = await adminClient.from('generated_activities').insert({
        user_id: userId,
        activity_type: 'scene',
        details: { imageUrl: generatedImage, preset }
      });
      if (error) console.error("DB Insert Error:", error);
    }

    return new Response(JSON.stringify({ image: generatedImage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("scene-composite error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
