import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Download, RefreshCw, SlidersHorizontal, Sparkles } from 'lucide-react';

interface ImageResultEditorProps {
  imageUrl: string;
  onRefine: (prompt: string) => void;
  isRefining: boolean;
}

export function ImageResultEditor({ imageUrl, onRefine, isRefining }: ImageResultEditorProps) {
  const [brightness, setBrightness] = useState([100]);
  const [contrast, setContrast] = useState([100]);
  const [saturation, setSaturation] = useState([100]);
  const [refinement, setRefinement] = useState('');

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const img = new Image();
      img.crossOrigin = "anonymous";
      const objectUrl = URL.createObjectURL(blob);
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.filter = `brightness(${brightness[0]}%) contrast(${contrast[0]}%) saturate(${saturation[0]}%)`;
        ctx.drawImage(img, 0, 0);
        
        const link = document.createElement('a');
        link.download = `brand-asset-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        URL.revokeObjectURL(objectUrl);
      };
      img.src = objectUrl;
    } catch (error) {
      console.error('Error downloading image:', error);
      // Fallback
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `brand-asset-${Date.now()}.png`;
      link.target = '_blank';
      link.click();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="relative rounded-lg overflow-hidden border border-border bg-muted/30 flex justify-center p-4">
        <img 
          src={imageUrl} 
          alt="Generated Result" 
          className="w-full max-w-2xl h-auto object-contain max-h-[400px] rounded shadow-sm"
          style={{ filter: `brightness(${brightness[0]}%) contrast(${contrast[0]}%) saturate(${saturation[0]}%)`, transition: 'filter 0.1s ease-out' }}
        />
      </div>

      <div className="space-y-6">
        {/* CSS Editor */}
        <div className="space-y-4 card-neural p-5">
          <div className="flex items-center gap-2 mb-4">
            <SlidersHorizontal className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Live Adjustments</h3>
          </div>
          
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                <label>Brightness</label>
                <span>{brightness[0]}%</span>
              </div>
              <Slider value={brightness} onValueChange={setBrightness} min={0} max={200} step={1} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                <label>Contrast</label>
                <span>{contrast[0]}%</span>
              </div>
              <Slider value={contrast} onValueChange={setContrast} min={0} max={200} step={1} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                <label>Saturation</label>
                <span>{saturation[0]}%</span>
              </div>
              <Slider value={saturation} onValueChange={setSaturation} min={0} max={200} step={1} />
            </div>
          </div>
          
          <Button onClick={handleDownload} className="w-full mt-6" variant="default">
            <Download className="w-4 h-4 mr-2" /> Download Image
          </Button>
        </div>

        {/* AI Refinement */}
        <div className="space-y-4 card-neural p-5">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-accent animate-pulse-glow" />
            <h3 className="font-semibold">AI Remix</h3>
          </div>
          <p className="text-sm text-muted-foreground">Give the AI specific instructions to regenerate and refine this image.</p>
          <div className="pt-2">
            <Input 
              value={refinement} 
              onChange={(e) => setRefinement(e.target.value)} 
              placeholder="e.g. 'Make it darker', 'Cinematic lighting'" 
              className="input-neural h-11"
            />
          </div>
          <Button 
            onClick={() => onRefine(refinement)} 
            disabled={!refinement.trim() || isRefining} 
            className="w-full mt-2"
            variant="secondary"
          >
            {isRefining ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            {isRefining ? 'Remixing...' : 'Remix Image'}
          </Button>
        </div>
      </div>
    </div>
  );
}
