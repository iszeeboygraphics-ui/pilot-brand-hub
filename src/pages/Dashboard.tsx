import { useBrandProfile } from '@/hooks/useBrandProfile';
import { useAuth } from '@/hooks/useAuth';
import { Progress } from '@/components/ui/progress';
import { Palette, Layers, FileText, TrendingUp, CheckCircle2, Wand2, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';

export default function Dashboard() {
  const { user } = useAuth();
  const { profile, completionScore, isLoading } = useBrandProfile();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    async function fetchActivities() {
      if (!user) return;
      const { data } = await (supabase
        .from('generated_activities' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5) as any);
      if (data) setActivities(data);
    }
    fetchActivities();
  }, [user]);

  const quickActions = [
    { title: 'Brand Vault', desc: 'Configure your identity', icon: Palette, url: '/brand-vault', color: 'text-primary' },
    { title: 'Scene Creator', desc: 'Product environments', icon: Layers, url: '/scene-creator', color: 'text-success' },
    { title: 'Content Hub', desc: 'One-click remixes', icon: FileText, url: '/content-hub', color: 'text-accent' },
    { title: 'Logo Creator', desc: 'Instant branding', icon: Wand2, url: '/logo-creator', color: 'text-purple-500' },
    { title: 'Thumbnail Creator', desc: 'Eye-catching covers', icon: ImageIcon, url: '/thumbnail-creator', color: 'text-blue-500' },
  ];

  const completionItems = [
    { label: 'Brand Name', done: !!profile?.brand_name },
    { label: 'Industry', done: !!profile?.industry },
    { label: 'Brand Voice', done: !!profile?.brand_voice },
    { label: 'Color Palette', done: !!(profile?.color_1 && profile?.color_2 && profile?.color_3) },
    { label: 'Master Logo', done: !!profile?.logo_url },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back{profile?.brand_name ? `, ${profile.brand_name}` : ''}
        </h1>
        <p className="text-muted-foreground mt-1">Your brand command center</p>
      </div>

      {/* Brand Consistency */}
      <div className="card-neural p-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Brand Consistency</h2>
          </div>
          <span className="text-sm font-medium text-primary">{completionScore}%</span>
        </div>
        <Progress value={completionScore} className="h-2 mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {completionItems.map((item) => (
            <div key={item.label} className="flex items-center gap-1.5 text-xs">
              <CheckCircle2 className={`w-3.5 h-3.5 flex-shrink-0 ${item.done ? 'text-success' : 'text-muted-foreground/40'}`} />
              <span className={item.done ? 'text-foreground' : 'text-muted-foreground'}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {quickActions.map((action, i) => (
          <button
            key={action.title}
            onClick={() => navigate(action.url)}
            className="card-neural p-6 text-left group animate-fade-in"
            style={{ animationDelay: `${200 + i * 80}ms` }}
          >
            <action.icon className={`w-8 h-8 ${action.color} mb-3`} />
            <h3 className="font-semibold">{action.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{action.desc}</p>
          </button>
        ))}
      </div>

      {/* Recent Activities */}
      <div className="card-neural p-6 animate-fade-in" style={{ animationDelay: '400ms' }}>
        <h2 className="font-semibold mb-4">Recent Generations</h2>
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activities found.</p>
        ) : (
          <div className="space-y-4">
            {activities.map((act) => (
              <div key={act.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background/50">
                 <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    {act.activity_type === 'caption' && <FileText className="w-4 h-4" />}
                    {act.activity_type === 'scene' && <Layers className="w-4 h-4" />}
                    {act.activity_type === 'logo' && <Wand2 className="w-4 h-4" />}
                    {act.activity_type === 'thumbnail' && <ImageIcon className="w-4 h-4" />}
                 </div>
                 <div className="flex-1">
                    <p className="text-sm font-medium capitalize">{act.activity_type} Generated</p>
                    <p className="text-xs text-muted-foreground">
                       {new Date(act.created_at).toLocaleDateString()}
                    </p>
                 </div>
                 {act.activity_type === 'caption' && <div className="text-xs text-muted-foreground max-w-[200px] truncate">{act.details?.content}</div>}
                 {act.details?.imageUrl && (
                   <a href={act.details.imageUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 cursor-pointer hover:opacity-80 transition-opacity" title="Click to view full image">
                     <img src={act.details.imageUrl} className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded shadow-sm border border-border" alt="Generated" />
                   </a>
                 )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
