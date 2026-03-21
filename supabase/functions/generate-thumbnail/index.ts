import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { title, imageBase64 } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!title) {
      return new Response(JSON.stringify({ error: "title is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get('Authorization');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    let profile = null;
    let userId = null;
    let supabaseClient = null;
    
    if (authHeader && supabaseUrl && supabaseKey) {
      supabaseClient = createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: authHeader } }
      });
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (user) {
        userId = user.id;
        const { data } = await supabaseClient.from('brand_profiles').select('*').eq('user_id', userId).single();
        profile = data;
      }
    }

    let prompt = `Create a bold, eye-catching YouTube/social media thumbnail (16:9 landscape ratio). The main headline text is: "${title}". Use large, impactful typography that is easy to read. The text should have strong contrast against the background with outlines or shadows for legibility. Make it vibrant, attention-grabbing, and professional. High energy composition with dynamic colors.`;

    if (profile?.color_1) {
      prompt += ` Subtly incorporate the brand's primary color ${profile.color_1} into the design.`;
    }

    const messages: any[] = [];

    if (imageBase64) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: `Use this image as the background/main visual for the thumbnail. ${prompt}` },
          { type: "image_url", image_url: { url: imageBase64 } },
        ],
      });
    } else {
      messages.push({ role: "user", content: prompt });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages,
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

    if (supabaseClient && userId) {
      await supabaseClient.from('generated_activities').insert({
        user_id: userId,
        activity_type: 'thumbnail',
        details: { imageUrl: generatedImage, title }
      });
    }

    return new Response(JSON.stringify({ image: generatedImage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-thumbnail error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
