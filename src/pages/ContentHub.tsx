import { useState } from 'react';
import { useBrandProfile } from '@/hooks/useBrandProfile';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Sparkles, Copy, Check, RefreshCw, PenTool, Wand2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { FeatureIntro } from '@/components/FeatureIntro';
import { ImageResultEditor } from '@/components/ImageResultEditor';
import { Skeleton } from '@/components/ui/skeleton';

export default function ContentHub() {
  const { profile } = useBrandProfile();
  const [productImage, setProductImage] = useState<string | null>(null);
  const [caption, setCaption] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [generatingCustom, setGeneratingCustom] = useState(false);

  const brandColors = [
    profile?.color_1 || '#8B5CF6',
    profile?.color_2 || '#06B6D4',
    profile?.color_3 || '#F1F5F9',
  ];

  const handleUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setProductImage(URL.createObjectURL(file));
        setCaption(null);
      }
    };
    input.click();
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-caption', {
        body: {
          brandName: profile?.brand_name,
          industry: profile?.industry,
          brandVoice: profile?.brand_voice,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setCaption(data.caption);
      toast.success('Caption generated!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to generate caption');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (caption) {
      navigator.clipboard.writeText(caption);
      setCopied(true);
      toast.success('Caption copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!productImage) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="animate-fade-in">
          <h1 className="text-2xl font-bold tracking-tight">Content Hub</h1>
          <p className="text-muted-foreground mt-1">One-click product-to-story remix</p>
        </div>

        <FeatureIntro
          featureKey="content-hub"
          title="What is the Content Hub?"
          description="Turn any product image into ready-to-post social media content. Upload a photo and AI will generate on-brand captions using your brand voice and identity."
          tips={[
            "Upload a product image to get started",
            "Captions are generated using your brand voice and industry from Brand Vault",
            "Copy captions directly to clipboard for quick posting",
            "Generate multiple variations to find the perfect tone",
          ]}
        />

        <div className="card-neural p-12 flex flex-col items-center gap-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <Upload className="w-12 h-12 text-muted-foreground/40" />
          <p className="text-muted-foreground">Select a product image to get started</p>
          <Button onClick={handleUpload}>
            <Upload className="w-4 h-4 mr-2" /> Upload Product Image
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Content Hub</h1>
          <p className="text-muted-foreground mt-1">One-click product-to-story remix</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleUpload}>
          Change Image
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Column A — The Flyer (1080x1080) */}
        <div className="card-neural p-4 space-y-3 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <h3 className="font-semibold text-sm">The Flyer — 1080×1080</h3>
          <div className="aspect-square rounded-lg overflow-hidden relative" style={{ backgroundColor: brandColors[0] }}>
            <img src={productImage} alt="Product" className="w-full h-full object-contain p-6" />
            <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between" style={{ backgroundColor: brandColors[1] + 'dd' }}>
              <span className="text-xs font-bold text-white truncate">
                {profile?.brand_name || 'Your Brand'}
              </span>
              <div className="flex gap-1">
                {brandColors.map((c, i) => (
                  <div key={i} className="w-3 h-3 rounded-full border border-white/30" style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            {profile?.logo_url && (
              <img src={profile.logo_url} alt="Logo" className="absolute top-3 left-3 h-6 w-auto object-contain drop-shadow-lg" />
            )}
          </div>
        </div>

        {/* Column B — The Story (1080x1920) */}
        <div className="card-neural p-4 space-y-3 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <h3 className="font-semibold text-sm">The Story — 1080×1920</h3>
          <div className="aspect-[9/16] rounded-lg overflow-hidden relative" style={{ background: `linear-gradient(135deg, ${brandColors[0]}, ${brandColors[1]})` }}>
            <img src={productImage} alt="Product" className="w-full h-full object-contain p-6" />
            <div className="absolute bottom-4 left-3 right-3 space-y-2">
              <p className="text-white text-xs font-semibold text-center drop-shadow">Would you rock this? 🔥</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg py-2 text-center text-white text-xs font-medium">
                  Absolutely 🙌
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg py-2 text-center text-white text-xs font-medium">
                  Need more 👀
                </div>
              </div>
            </div>
            {profile?.logo_url && (
              <img src={profile.logo_url} alt="Logo" className="absolute top-3 left-3 h-5 w-auto object-contain drop-shadow-lg" />
            )}
          </div>
        </div>

        {/* Column C — Sales Copy */}
        <div className="card-neural p-4 space-y-3 animate-fade-in" style={{ animationDelay: '300ms' }}>
          <h3 className="font-semibold text-sm">Sales Copy — AIDA</h3>
          <div className="bg-background rounded-lg border border-border p-4 min-h-[300px] flex flex-col">
            {caption ? (
              <div className="flex-1">
                <pre className="whitespace-pre-wrap text-sm text-foreground font-sans leading-relaxed">{caption}</pre>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                Generate a high-conversion caption
              </div>
            )}
            <div className="flex gap-2 mt-4">
              {!caption ? (
                <Button onClick={handleGenerate} disabled={generating} size="sm" className="flex-1">
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  {generating ? 'Generating…' : 'Generate Caption'}
                </Button>
              ) : (
                <Button onClick={handleGenerate} disabled={generating} size="sm" className="flex-1">
                  <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${generating ? 'animate-spin' : ''}`} />
                  {generating ? 'Regenerating…' : 'Regenerate'}
                </Button>
              )}
              {caption && (
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
