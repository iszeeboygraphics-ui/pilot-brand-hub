import { useBrandProfile } from '@/hooks/useBrandProfile';
import { useAuth } from '@/hooks/useAuth';
import { Progress } from '@/components/ui/progress';
import { Palette, Layers, FileText, TrendingUp, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const { profile, completionScore, isLoading } = useBrandProfile();
  const navigate = useNavigate();

  const quickActions = [
    { title: 'Brand Vault', desc: 'Configure your identity', icon: Palette, url: '/brand-vault', color: 'text-primary' },
    { title: 'Scene Creator', desc: 'Product environments', icon: Layers, url: '/scene-creator', color: 'text-success' },
    { title: 'Content Hub', desc: 'One-click remixes', icon: FileText, url: '/content-hub', color: 'text-accent' },
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
    </div>
  );
}
