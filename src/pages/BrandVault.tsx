import { useState, useEffect, useCallback } from 'react';
import { useBrandProfile } from '@/hooks/useBrandProfile';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, Save, Palette, X, Check, ChevronsUpDown, Sparkles, Loader2, Type } from 'lucide-react';
import { toast } from 'sonner';
import { FeatureIntro } from '@/components/FeatureIntro';

interface PaletteSuggestion {
  name: string;
  reason: string;
  colors: string[];
}

interface FontSuggestion {
  name: string;
  reason: string;
  heading: string;
  body: string;
}

const INDUSTRIES = [
  'Advertising & Marketing', 'Agriculture', 'Architecture & Design', 'Automotive',
  'Beauty & Cosmetics', 'Biotechnology', 'Blockchain & Web3', 'Construction',
  'Consulting', 'E-Commerce', 'Education & EdTech', 'Energy & Utilities',
  'Entertainment & Media', 'Fashion & Apparel', 'Finance & Banking', 'Fitness & Wellness',
  'Food & Beverage', 'Gaming', 'Government & Public Sector', 'Healthcare & Medical',
  'Hospitality & Tourism', 'Insurance', 'Interior Design', 'Legal Services',
  'Logistics & Supply Chain', 'Manufacturing', 'Music & Audio', 'Non-Profit & NGO',
  'Pets & Animals', 'Pharmaceuticals', 'Photography & Videography', 'Real Estate',
  'Retail', 'SaaS & Software', 'Sports', 'Sustainability & CleanTech',
  'Telecommunications', 'Transportation', 'Travel & Aviation', 'Venture Capital & Startups',
];

const BRAND_VOICES = [
  { value: 'luxury', label: 'Luxury', desc: 'Refined, exclusive, aspirational' },
  { value: 'bold', label: 'Bold', desc: 'Confident, daring, impactful' },
  { value: 'minimalist', label: 'Minimalist', desc: 'Clean, simple, understated' },
  { value: 'friendly', label: 'Friendly', desc: 'Warm, approachable, conversational' },
  { value: 'professional', label: 'Professional', desc: 'Polished, authoritative, trustworthy' },
  { value: 'playful', label: 'Playful', desc: 'Fun, witty, lighthearted' },
  { value: 'edgy', label: 'Edgy', desc: 'Provocative, rebellious, unconventional' },
  { value: 'inspirational', label: 'Inspirational', desc: 'Uplifting, motivational, empowering' },
  { value: 'technical', label: 'Technical', desc: 'Precise, data-driven, expert' },
  { value: 'storytelling', label: 'Storytelling', desc: 'Narrative, emotional, immersive' },
  { value: 'casual', label: 'Casual', desc: 'Relaxed, informal, down-to-earth' },
  { value: 'corporate', label: 'Corporate', desc: 'Formal, structured, institutional' },
];

export default function BrandVault() {
  const { user } = useAuth();
  const { profile, upsert } = useBrandProfile();

  const [brandName, setBrandName] = useState('');
  const [industry, setIndustry] = useState('');
  const [brandVoice, setBrandVoice] = useState('');
  const [colors, setColors] = useState(['#8B5CF6', '#06B6D4', '#F1F5F9']);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [industryOpen, setIndustryOpen] = useState(false);
  const [paletteSuggestions, setPaletteSuggestions] = useState<PaletteSuggestion[]>([]);
  const [suggestingPalette, setSuggestingPalette] = useState(false);
  const [fontSuggestions, setFontSuggestions] = useState<FontSuggestion[]>([]);
  const [suggestingFonts, setSuggestingFonts] = useState(false);

  const handleSuggestPalette = async () => {
    if (!brandName && !industry && !brandVoice) {
      toast.error('Please fill in at least one field (name, industry, or voice) first');
      return;
    }
    setSuggestingPalette(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-palette', {
        body: { brandName, industry, brandVoice },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setPaletteSuggestions(data.palettes || []);
      toast.success('Palette suggestions ready!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to suggest palettes');
    } finally {
      setSuggestingPalette(false);
    }
  };

  const handleSuggestFonts = async () => {
    if (!brandName && !industry && !brandVoice) {
      toast.error('Please fill in at least one field first');
      return;
    }
    setSuggestingFonts(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-fonts', {
        body: { brandName, industry, brandVoice },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setFontSuggestions(data.fonts || []);
      toast.success('Font suggestions ready!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to suggest fonts');
    } finally {
      setSuggestingFonts(false);
    }
  };

  const applyPalette = (palette: PaletteSuggestion) => {
    setColors([palette.colors[0], palette.colors[1], palette.colors[2]]);
    toast.success(`Applied "${palette.name}" palette`);
  };

  useEffect(() => {
    if (profile) {
      setBrandName(profile.brand_name || '');
      setIndustry(profile.industry || '');
      setBrandVoice(profile.brand_voice || '');
      setColors([profile.color_1 || '#8B5CF6', profile.color_2 || '#06B6D4', profile.color_3 || '#F1F5F9']);
      setLogoUrl(profile.logo_url);
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      await upsert.mutateAsync({
        brand_name: brandName || null,
        industry: industry || null,
        brand_voice: brandVoice || null,
        color_1: colors[0],
        color_2: colors[1],
        color_3: colors[2],
        logo_url: logoUrl,
      });
      toast.success('Brand profile saved!');
    } catch {
      toast.error('Failed to save profile');
    }
  };

  const uploadLogo = useCallback(async (file: File) => {
    if (!user) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/logo.${ext}`;
      const { error } = await supabase.storage.from('brand-assets').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('brand-assets').getPublicUrl(path);
      setLogoUrl(data.publicUrl);
      toast.success('Logo uploaded!');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  }, [user]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadLogo(file);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold tracking-tight">Brand Vault</h1>
        <p className="text-muted-foreground mt-1">Define your global brand identity</p>
      </div>

      <FeatureIntro
        featureKey="brand-vault"
        title="What is the Brand Vault?"
        description="Your brand's single source of truth. Set up your brand name, industry, voice, color palette, and logo here — all other BrandPilot tools pull from this profile automatically."
        tips={[
          "Fill in all fields to reach 100% Brand Consistency on your dashboard",
          "Your color palette is used across Logo Creator, Scene Creator, and Content Hub",
          "Upload a master logo to use as a base for AI-generated variations",
          "Choose a brand voice to shape the tone of AI-generated captions and content",
        ]}
      />

      {/* Brand Info */}
      <div className="card-neural p-6 space-y-5 animate-fade-in" style={{ animationDelay: '100ms' }}>
        <h2 className="font-semibold flex items-center gap-2">
          <Palette className="w-4 h-4 text-primary" /> Brand Configuration
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Brand Name</Label>
            <Input value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="Acme Corp" className="bg-background" />
          </div>
          <div className="space-y-2">
            <Label>Industry</Label>
            <Popover open={industryOpen} onOpenChange={setIndustryOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={industryOpen} className="w-full justify-between bg-background font-normal">
                  {industry || 'Select industry...'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search industries..." />
                  <CommandList>
                    <CommandEmpty>No industry found.</CommandEmpty>
                    <CommandGroup>
                      <ScrollArea className="h-56">
                        {INDUSTRIES.map((ind) => (
                          <CommandItem
                            key={ind}
                            value={ind}
                            onSelect={(val) => { setIndustry(val); setIndustryOpen(false); }}
                          >
                            <Check className={`mr-2 h-4 w-4 ${industry === ind ? 'opacity-100' : 'opacity-0'}`} />
                            {ind}
                          </CommandItem>
                        ))}
                      </ScrollArea>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Brand Voice</Label>
          <Select value={brandVoice} onValueChange={setBrandVoice}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Select voice" />
            </SelectTrigger>
            <SelectContent>
              {BRAND_VOICES.map((v) => (
                <SelectItem key={v.value} value={v.value}>
                  <span className="font-medium">{v.label}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{v.desc}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Colors */}
      <div className="card-neural p-6 space-y-4 animate-fade-in" style={{ animationDelay: '200ms' }}>
        <h2 className="font-semibold">Visual Identity — Color Palette</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {colors.map((color, i) => (
            <div key={i} className="space-y-2">
              <Label className="text-xs text-muted-foreground">Color {i + 1}</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => {
                    const next = [...colors];
                    next[i] = e.target.value;
                    setColors(next);
                  }}
                  className="w-10 h-10 rounded-lg border border-border cursor-pointer bg-transparent"
                />
                <Input
                  value={color}
                  onChange={(e) => {
                    const next = [...colors];
                    next[i] = e.target.value;
                    setColors(next);
                  }}
                  className="bg-background font-mono text-sm uppercase"
                  maxLength={7}
                />
              </div>
            </div>
          ))}
        </div>
        {/* Preview strip */}
        <div className="flex rounded-lg overflow-hidden h-8">
          {colors.map((c, i) => (
            <div key={i} className="flex-1" style={{ backgroundColor: c }} />
          ))}
        </div>

        {/* AI Palette Suggestions */}
        <div className="pt-2 space-y-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSuggestPalette}
            disabled={suggestingPalette}
            className="w-full"
          >
            {suggestingPalette ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            {suggestingPalette ? 'Generating suggestions…' : 'Suggest AI Color Palettes'}
          </Button>

          {paletteSuggestions.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {paletteSuggestions.map((p, i) => (
                <button
                  key={i}
                  onClick={() => applyPalette(p)}
                  className="p-3 rounded-lg border border-border hover:border-primary/50 transition-all text-left space-y-2 hover:bg-primary/5"
                >
                  <div className="flex rounded overflow-hidden h-6">
                    {p.colors.map((c, j) => (
                      <div key={j} className="flex-1" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <p className="text-xs font-semibold">{p.name}</p>
                  <p className="text-xs text-muted-foreground leading-snug">{p.reason}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Font Suggestions */}
      <div className="card-neural p-6 space-y-4 animate-fade-in" style={{ animationDelay: '250ms' }}>
        <h2 className="font-semibold flex items-center gap-2">
          <Type className="w-4 h-4 text-primary" /> Typography — Font Pairing
        </h2>
        <p className="text-sm text-muted-foreground">Get AI-suggested Google Font pairings that match your brand identity.</p>

        <Button
          variant="outline"
          size="sm"
          onClick={handleSuggestFonts}
          disabled={suggestingFonts}
          className="w-full"
        >
          {suggestingFonts ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Type className="w-4 h-4 mr-2" />
          )}
          {suggestingFonts ? 'Generating suggestions…' : 'Suggest AI Font Pairings'}
        </Button>

        {fontSuggestions.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {fontSuggestions.map((f, i) => {
              const headingUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(f.heading)}:wght@700&display=swap`;
              const bodyUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(f.body)}:wght@400&display=swap`;
              return (
                <div
                  key={i}
                  className="p-3 rounded-lg border border-border hover:border-primary/50 transition-all text-left space-y-2 hover:bg-primary/5"
                >
                  <link href={headingUrl} rel="stylesheet" />
                  <link href={bodyUrl} rel="stylesheet" />
                  <p className="text-lg font-bold" style={{ fontFamily: `'${f.heading}', sans-serif` }}>
                    {f.heading}
                  </p>
                  <p className="text-sm" style={{ fontFamily: `'${f.body}', sans-serif` }}>
                    {f.body} — The quick brown fox jumps over the lazy dog.
                  </p>
                  <p className="text-xs font-semibold text-primary">{f.name}</p>
                  <p className="text-xs text-muted-foreground leading-snug">{f.reason}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="card-neural p-6 space-y-4 animate-fade-in" style={{ animationDelay: '300ms' }}>
        <h2 className="font-semibold">Master Logo</h2>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer ${
            dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/40'
          }`}
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) uploadLogo(file);
            };
            input.click();
          }}
        >
          {logoUrl ? (
            <div className="relative">
              <img src={logoUrl} alt="Brand logo" className="max-h-24 max-w-48 object-contain" />
              <button
                onClick={(e) => { e.stopPropagation(); setLogoUrl(null); }}
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {uploading ? 'Uploading...' : 'Drag & drop or click to upload'}
              </p>
            </>
          )}
        </div>
      </div>

      <Button onClick={handleSave} disabled={upsert.isPending} className="w-full sm:w-auto">
        <Save className="w-4 h-4 mr-2" />
        {upsert.isPending ? 'Saving...' : 'Save Brand Identity'}
      </Button>
    </div>
  );
}
