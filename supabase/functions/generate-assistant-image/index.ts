import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { prompt } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const authHeader = req.headers.get('Authorization');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    // Call Lovable AI Image model
    const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!imageResponse.ok) throw new Error(await imageResponse.text());
    
    const imgData = await imageResponse.json();
    const generatedImageUrl = imgData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    // Log the image generation history
    let userId = null;
    if (authHeader && supabaseUrl && supabaseServiceKey) {
      try {
        const token = authHeader.replace('Bearer ', '');
        userId = JSON.parse(atob(token.split('.')[1])).sub;
        if (userId) {
          const adminClient = createClient(supabaseUrl, supabaseServiceKey);
          await adminClient.from('generated_activities').insert({
            user_id: userId,
            activity_type: 'logo', // Use generic logo/media type
            details: { content: prompt, imageUrl: generatedImageUrl, isChat: true }
          });
        }
      } catch (e) {
        console.error("JWT/Logging error:", e);
      }
    }

    return new Response(JSON.stringify({ imageUrl: generatedImageUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
