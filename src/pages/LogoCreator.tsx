import { useState } from 'react';
import { useBrandProfile } from '@/hooks/useBrandProfile';
import { Button } from '@/components/ui/button';
import { Wand2, Download, Image as ImageIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { runWithProgress } from '@/lib/progressToast';
import { supabase } from '@/integrations/supabase/client';
import { ImageResultEditor } from '@/components/ImageResultEditor';
import { FeatureIntro } from '@/components/FeatureIntro';
import { PageSeo } from '@/components/PageSeo';

const styles = [
  { id: 'minimalist', label: 'Minimalist' },
  { id: 'modern', label: 'Modern' },
  { id: 'vintage', label: 'Vintage' },
  { id: 'playful', label: 'Playful' },
  { id: 'geometric', label: 'Geometric' },
  { id: 'hand-drawn', label: 'Hand-Drawn' },
  { id: 'luxury', label: 'Luxury' },
  { id: 'tech', label: 'Tech' },
  { id: 'organic', label: 'Organic' },
  { id: 'retro', label: 'Retro' },
  { id: 'bold', label: 'Bold' },
  { id: 'elegant', label: 'Elegant' },
];

export default function LogoCreator() {
  const { profile } = useBrandProfile();
  const [brandName, setBrandName] = useState(profile?.brand_name || '');
  const [selectedStyle, setSelectedStyle] = useState<string>(styles[0].id);
  const [generating, setGenerating] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const handleGenerate = async (refinementPrompt?: string) => {
    if (!brandName) {
      toast.error('Please enter a brand name');
      return;
    }
    
    setGenerating(true);
    // Only clear logoUrl if it's not a refinement
    if (!refinementPrompt) {
      setLogoUrl(null);
    }

    try {
      const styleLabel = styles.find((s) => s.id === selectedStyle)?.label || selectedStyle;
      const data = await runWithProgress(
        async () => {
          const { data, error } = await supabase.functions.invoke('generate-logo', {
            body: {
              brandName,
              style: selectedStyle,
              primaryColor: profile?.color_1 || null,
              refinement: typeof refinementPrompt === 'string' ? refinementPrompt : undefined,
            },
          });
          if (error) throw error;
          if (data?.error) throw new Error(data.error);
          if (!data?.image) throw new Error('No image returned');
          return data;
        },
        {
          steps: refinementPrompt
            ? [
                `Applying your refinement to ${brandName}'s logo…`,
                'Adjusting shapes and proportions…',
                'Polishing the final mark…',
              ]
            : [
                `Analyzing ${brandName} for ${styleLabel} direction…`,
                'Sketching logo concepts…',
                profile?.color_1 ? `Applying brand color ${profile.color_1}…` : 'Selecting a balanced palette…',
                'Refining typography and spacing…',
                'Rendering the final logo…',
              ],
          success: 'Logo generated successfully!',
          errorFallback: 'Failed to generate logo',
        },
      );
      setLogoUrl(data.image);
    } catch (e) {
      console.error('Logo generation error:', e);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!logoUrl) return;
    const a = document.createElement('a');
    a.href = logoUrl;
    a.download = `logo-${brandName}-${Date.now()}.png`;
    a.target = '_blank';
    a.click();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageSeo
        title="Logo Creator | Pilot Brand Hub"
        description="Generate unique, AI-powered logo concepts for your brand in seconds — ready to refine and download."
        image="/og/og-logo-creator.jpg"
        pathname="/logo-creator"
      />
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold tracking-tight">Logo Creator</h1>
        <p className="text-muted-foreground mt-1">Generate a unique logo for your brand instantly</p>
      </div>

      <FeatureIntro
        featureKey="logo-creator"
        title="How Logo Creator Works"
        description="Enter your brand name, pick a style, and AI will generate a professional logo using your brand colors. Refine it until it's perfect."
        tips={[
          "Choose from 12 styles: Minimalist, Luxury, Geometric, Hand-Drawn, and more",
          "Your primary brand color from Brand Vault is used automatically",
          "Use the refine feature to tweak colors, layout, or style after generation",
          "Download your logo and upload it back to Brand Vault as your master logo",
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Panel: Settings */}
        <div className="card-neural p-6 space-y-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="space-y-3">
            <label className="text-sm font-semibold">Brand Name</label>
            <input 
              type="text" 
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              className="w-full p-3 rounded-lg border border-border bg-background text-foreground"
              placeholder="Enter your brand name"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold">Style</label>
            <div className="grid grid-cols-2 gap-3">
              {styles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`p-3 rounded-lg border text-sm transition-all active:scale-[0.97] ${
                    selectedStyle === style.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-muted-foreground/40'
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={() => handleGenerate()} disabled={generating || !brandName} className="w-full h-12">
            <Wand2 className={`w-4 h-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
            {generating ? 'Designing logo...' : 'Generate Logo'}
          </Button>
        </div>

        {/* Right Panel: Preview */}
        <div className="card-neural p-6 flex flex-col items-center justify-center animate-fade-in min-h-[400px]" style={{ animationDelay: '200ms' }}>
          {generating && !logoUrl ? (
            <div className="w-full h-full flex items-center justify-center">
               <Skeleton className="w-64 h-64 rounded-full" />
            </div>
          ) : logoUrl ? (
            <div className="w-full">
               <ImageResultEditor 
                 imageUrl={logoUrl} 
                 onRefine={(prompt) => handleGenerate(prompt)} 
                 isRefining={generating} 
               />
            </div>
          ) : (
             <div className="text-center text-muted-foreground flex flex-col items-center">
               <ImageIcon className="w-16 h-16 mb-4 opacity-20" />
               <p>Your generated logo will appear here</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
