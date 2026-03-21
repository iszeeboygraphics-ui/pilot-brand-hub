import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { brandName: reqBrand, style, primaryColor: reqColor } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const authHeader = req.headers.get('Authorization');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    let profile = null;
    let userId = null;
    
    if (authHeader && supabaseUrl && supabaseAnonKey && supabaseServiceKey) {
      const authClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });
      const { data: { user } } = await authClient.auth.getUser();
      if (user) {
        userId = user.id;
        const adminClient = createClient(supabaseUrl, supabaseServiceKey);
        const { data } = await adminClient.from('brand_profiles').select('*').eq('user_id', userId).single();
        profile = data;
      }
    }

    const brandName = profile?.brand_name || reqBrand;
    const primaryColor = profile?.color_1 || reqColor;

    if (!brandName) {
      return new Response(JSON.stringify({ error: "brandName is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const styleGuide: Record<string, string> = {
      minimalist: "Clean, simple, geometric shapes. Minimal use of color. Flat design with no gradients or shadows. Think Apple or Muji.",
      modern: "Sleek and contemporary. Bold geometry, clean lines, subtle gradients. Think Stripe or Airbnb.",
      vintage: "Retro-inspired with classic typography, badges, crests, or hand-drawn elements. Warm, nostalgic feel. Think craft brewery or heritage brand.",
      playful: "Fun, colorful, rounded shapes, friendly characters or mascots. Energetic and approachable. Think Slack or Mailchimp.",
    };

    const styleInstruction = styleGuide[style] || styleGuide.modern;
    const colorInstruction = primaryColor ? `Use ${primaryColor} as the primary brand color.` : "";

    const prompt = `Design a professional logo for a brand called "${brandName}". Style: ${styleInstruction} ${colorInstruction} The logo should be centered on a clean white background, suitable for use on websites, business cards, and social media. Vector-style, high contrast, crisp edges. No mockups, no text other than the brand name if it fits naturally.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [{ role: "user", content: prompt }],
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
        activity_type: 'logo',
        details: { imageUrl: generatedImage, brandName, style }
      });
      if (error) console.error("DB Insert Error:", error);
    }

    return new Response(JSON.stringify({ image: generatedImage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-logo error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
