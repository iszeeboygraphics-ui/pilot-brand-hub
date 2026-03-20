
-- Create brand_profiles table
CREATE TABLE public.brand_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_name TEXT,
  industry TEXT,
  brand_voice TEXT CHECK (brand_voice IN ('luxury', 'bold', 'minimalist', 'friendly')),
  color_1 TEXT DEFAULT '#8B5CF6',
  color_2 TEXT DEFAULT '#06B6D4',
  color_3 TEXT DEFAULT '#F1F5F9',
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.brand_profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own brand profile"
  ON public.brand_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own brand profile"
  ON public.brand_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own brand profile"
  ON public.brand_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own brand profile"
  ON public.brand_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_brand_profiles_updated_at
  BEFORE UPDATE ON public.brand_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for logos
INSERT INTO storage.buckets (id, name, public) VALUES ('brand-assets', 'brand-assets', true);

CREATE POLICY "Brand assets are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'brand-assets');

CREATE POLICY "Users can upload brand assets"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'brand-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update brand assets"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'brand-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete brand assets"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'brand-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
