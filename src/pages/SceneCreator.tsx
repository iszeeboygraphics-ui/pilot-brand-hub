import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Download, Wand2, Image as ImageIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ImageResultEditor } from '@/components/ImageResultEditor';
import { FeatureIntro } from '@/components/FeatureIntro';

const presets = [
  { id: 'office', label: 'Minimalist Office', emoji: '🏢' },
  { id: 'cafe', label: 'Luxury Café', emoji: '☕' },
  { id: 'street', label: 'Street Style', emoji: '🌆' },
  { id: 'studio', label: 'Studio Lighting', emoji: '💡' },
  { id: 'beach', label: 'Beach Vibes', emoji: '🏖️' },
  { id: 'kitchen', label: 'Kitchen Counter', emoji: '🍳' },
  { id: 'nature', label: 'Nature Trail', emoji: '🌿' },
  { id: 'holiday', label: 'Holiday Display', emoji: '🎄' },
  { id: 'gym', label: 'Gym & Fitness', emoji: '🏋️' },
  { id: 'rooftop', label: 'Rooftop Terrace', emoji: '🌇' },
  { id: 'library', label: 'Cozy Library', emoji: '📚' },
  { id: 'marble', label: 'Marble Surface', emoji: '🪨' },
  { id: 'neon', label: 'Neon Night', emoji: '🌃' },
  { id: 'garden', label: 'Botanical Garden', emoji: '🌺' },
  { id: 'workspace', label: 'Creative Workspace', emoji: '🎨' },
  { id: 'runway', label: 'Fashion Runway', emoji: '👗' },
];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function SceneCreator() {
  const [productImage, setProductImage] = useState<string | null>(null);
  const [productFile, setProductFile] = useState<File | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);

  const handleUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setProductImage(URL.createObjectURL(file));
        setProductFile(file);
        setResultImage(null);
      }
    };
    input.click();
  };

  const handleProcess = async (refinementPrompt?: string) => {
    if (!productFile || !selectedPreset) return;
    setProcessing(true);
    if (!refinementPrompt) {
      setResultImage(null);
    }

    try {
      const imageBase64 = await fileToBase64(productFile);

      const { data, error } = await supabase.functions.invoke('scene-composite', {
        body: { 
          imageBase64, 
          preset: selectedPreset,
          refinement: typeof refinementPrompt === 'string' ? refinementPrompt : undefined,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResultImage(data.image);
      toast.success('Scene generated!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to generate scene');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const a = document.createElement('a');
    a.href = resultImage;
    a.download = `scene-${selectedPreset}-${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold tracking-tight">Scene Creator</h1>
        <p className="text-muted-foreground mt-1">Place your products in professional environments using AI</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left panel */}
        <div className="lg:col-span-2 space-y-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
          {/* Upload */}
          <div className="card-neural p-5 space-y-3">
            <h3 className="font-semibold text-sm">Raw Product Image</h3>
            <div
              onClick={handleUpload}
              className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer hover:border-muted-foreground/40 transition-colors"
            >
              {productImage ? (
                <img src={productImage} alt="Product" className="max-h-32 object-contain rounded" />
              ) : (
                <>
                  <Upload className="w-6 h-6 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Click to upload</p>
                </>
              )}
            </div>
          </div>

          {/* Presets */}
          <div className="card-neural p-5 space-y-3">
            <h3 className="font-semibold text-sm">Environment Presets</h3>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPreset(p.id)}
                  className={`p-3 rounded-lg border text-left text-sm transition-all active:scale-[0.97] ${
                    selectedPreset === p.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-muted-foreground/40'
                  }`}
                >
                  <span className="text-lg block mb-1">{p.emoji}</span>
                  <span className="text-xs">{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={() => handleProcess()}
            disabled={!productImage || !selectedPreset || processing}
            className="w-full"
          >
            <Wand2 className="w-4 h-4 mr-2" />
            {processing ? 'Generating scene…' : 'Process Image'}
          </Button>
        </div>

        {/* Right — Preview Canvas */}
        <div className="lg:col-span-3 animate-fade-in" style={{ animationDelay: '200ms' }}>
          {processing && !resultImage ? (
            <div className="card-neural p-5 space-y-4">
              <h3 className="font-semibold text-sm">Preview Canvas</h3>
              <div className="aspect-[4/3] rounded-lg bg-background border border-border flex items-center justify-center overflow-hidden">
                 <div className="w-full h-full p-4 space-y-3">
                   <Skeleton className="w-full h-full rounded-lg" />
                 </div>
              </div>
            </div>
          ) : resultImage ? (
            <div className="w-full">
               <ImageResultEditor 
                 imageUrl={resultImage} 
                 onRefine={(prompt) => handleProcess(prompt)} 
                 isRefining={processing} 
               />
            </div>
          ) : (
            <div className="card-neural p-5 space-y-4">
              <h3 className="font-semibold text-sm">Preview Canvas</h3>
              <div className="aspect-[4/3] rounded-lg bg-background border border-border flex items-center justify-center overflow-hidden">
                <div className="text-center text-muted-foreground">
                  <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Upload a product & select a preset</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
