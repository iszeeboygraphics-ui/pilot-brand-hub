import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Wand2, Download, Image as ImageIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ImageResultEditor } from '@/components/ImageResultEditor';

export default function ThumbnailCreator() {
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [generating, setGenerating] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  const handleUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setBackgroundImage(reader.result as string);
          setThumbnailUrl(null);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleGenerate = async (refinementPrompt?: string) => {
    if (!title) {
      toast.error('Please enter a thumbnail title');
      return;
    }
    
    setGenerating(true);
    if (!refinementPrompt) {
      setThumbnailUrl(null);
    }

    try {
      const { data, error } = await supabase.functions.invoke('generate-thumbnail', {
        body: {
          title,
          imageBase64: backgroundImage || null,
          refinement: typeof refinementPrompt === 'string' ? refinementPrompt : undefined,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.image) {
        setThumbnailUrl(data.image);
        toast.success('Thumbnail generated successfully!');
      } else {
        throw new Error('No image returned');
      }
    } catch (e: any) {
      console.error('Thumbnail generation error:', e);
      toast.error(e.message || 'Failed to generate thumbnail');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!thumbnailUrl) return;
    const a = document.createElement('a');
    a.href = thumbnailUrl;
    a.download = `thumbnail-${Date.now()}.png`;
    a.target = '_blank';
    a.click();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold tracking-tight">Thumbnail Creator</h1>
        <p className="text-muted-foreground mt-1">Design eye-catching thumbnails for your content</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Panel: Settings */}
        <div className="lg:col-span-2 space-y-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="card-neural p-5 space-y-4">
            <h3 className="font-semibold text-sm">Background Image (optional)</h3>
            <div
              onClick={handleUpload}
              className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer hover:border-muted-foreground/40 transition-colors"
            >
              {backgroundImage ? (
                <img src={backgroundImage} alt="Background" className="max-h-32 object-cover rounded" />
              ) : (
                <>
                  <Upload className="w-6 h-6 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground text-center">Click to upload image</p>
                </>
              )}
            </div>
          </div>

          <div className="card-neural p-5 space-y-4">
            <h3 className="font-semibold text-sm">Thumbnail Text</h3>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 rounded-lg border border-border bg-background text-foreground"
              placeholder="e.g. HOW I GREW MY BRAND"
            />
          </div>

          <Button onClick={handleGenerate} disabled={generating || !title} className="w-full h-12">
            <Wand2 className={`w-4 h-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
            {generating ? 'Generating thumbnail...' : 'Generate Thumbnail'}
          </Button>
        </div>

        {/* Right Panel: Preview */}
        <div className={`lg:col-span-3 flex flex-col items-center justify-center animate-fade-in min-h-[400px] ${!thumbnailUrl ? 'card-neural p-6 bg-background/50' : ''}`} style={{ animationDelay: '200ms' }}>
          {generating && !thumbnailUrl ? (
            <div className="w-full h-full flex items-center justify-center">
               <Skeleton className="w-full aspect-video rounded-xl" />
            </div>
          ) : thumbnailUrl ? (
            <div className="w-full">
               <ImageResultEditor 
                 imageUrl={thumbnailUrl} 
                 onRefine={(prompt) => handleGenerate(prompt)} 
                 isRefining={generating} 
               />
            </div>
          ) : (
             <div className="text-center text-muted-foreground flex flex-col items-center">
               <ImageIcon className="w-16 h-16 mb-4 opacity-20" />
               <p>Enter a title to generate your thumbnail</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
