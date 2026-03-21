import { useState } from 'react';
import { useBrandProfile } from '@/hooks/useBrandProfile';
import { Button } from '@/components/ui/button';
import { Wand2, Download, Image as ImageIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const styles = [
  { id: 'minimalist', label: 'Minimalist' },
  { id: 'modern', label: 'Modern' },
  { id: 'vintage', label: 'Vintage' },
  { id: 'playful', label: 'Playful' },
];

export default function LogoCreator() {
  const { profile } = useBrandProfile();
  const [brandName, setBrandName] = useState(profile?.brand_name || '');
  const [selectedStyle, setSelectedStyle] = useState<string>(styles[0].id);
  const [generating, setGenerating] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!brandName) {
      toast.error('Please enter a brand name');
      return;
    }
    
    setGenerating(true);
    setLogoUrl(null);

    // Mocking generation delay
    setTimeout(() => {
      // Mock generated logo using Placehold.co with Brand Name and Primary Color
      const color = profile?.color_1 ? profile.color_1.replace('#', '') : '8B5CF6';
      const text = encodeURIComponent(brandName.substring(0, 2).toUpperCase());
      setLogoUrl(`https://placehold.co/400x400/${color}/FFFFFF?text=${text}`);
      setGenerating(false);
      toast.success('Logo generated successfully!');
    }, 2000);
  };

  const handleDownload = () => {
    if (!logoUrl) return;
    const a = document.createElement('a');
    a.href = logoUrl;
    a.download = `logo-${brandName}-${Date.now()}.png`;
    // For mocked external URL, direct download might not work as cleanly via a tag without fetch, 
    // but we'll leave it as standard behavior for when the real endpoint returns a base64 or blob.
    a.target = '_blank';
    a.click();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold tracking-tight">Logo Creator</h1>
        <p className="text-muted-foreground mt-1">Generate a unique logo for your brand instantly</p>
      </div>

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

          <Button onClick={handleGenerate} disabled={generating || !brandName} className="w-full h-12">
            <Wand2 className={`w-4 h-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
            {generating ? 'Designing logo...' : 'Generate Logo'}
          </Button>
        </div>

        {/* Right Panel: Preview */}
        <div className="card-neural p-6 flex flex-col items-center justify-center animate-fade-in min-h-[400px]" style={{ animationDelay: '200ms' }}>
          {generating ? (
            <div className="w-full h-full flex items-center justify-center">
               <Skeleton className="w-64 h-64 rounded-full" />
            </div>
          ) : logoUrl ? (
            <div className="flex flex-col items-center space-y-6">
              <div className="w-64 h-64 rounded-xl overflow-hidden shadow-2xl border border-border bg-white flex items-center justify-center">
                <img src={logoUrl} alt="Generated Logo" className="w-full h-full object-cover" />
              </div>
              <Button variant="outline" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" /> Download Logo
              </Button>
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
