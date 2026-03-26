import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/components/ThemeProvider';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { User, Mail, LogOut, Sun, Moon, Monitor } from 'lucide-react';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account</p>
      </div>

      <div className="card-neural p-6 space-y-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
        <h2 className="font-semibold flex items-center gap-2">
          <User className="w-4 h-4 text-primary" /> Account
        </h2>
        <div className="flex items-center gap-3 text-sm">
          <Mail className="w-4 h-4 text-muted-foreground" />
          <span>{user?.email}</span>
        </div>
        <Button variant="destructive" size="sm" onClick={signOut}>
          <LogOut className="w-4 h-4 mr-2" /> Sign Out
        </Button>
      </div>

      <div className="card-neural p-6 space-y-4 animate-fade-in" style={{ animationDelay: '200ms' }}>
        <h2 className="font-semibold flex items-center gap-2">
          <Sun className="w-4 h-4 text-primary" /> Appearance
        </h2>
        <p className="text-sm text-muted-foreground">Choose your preferred theme</p>

        <RadioGroup value={theme} onValueChange={(val) => setTheme(val as 'dark' | 'light' | 'system')} className="grid grid-cols-3 gap-3">
          {[
            { value: 'dark', label: 'Dark', icon: Moon, desc: 'Deep neural dark' },
            { value: 'light', label: 'Light', icon: Sun, desc: 'Clean and bright' },
            { value: 'system', label: 'System', icon: Monitor, desc: 'Match your OS' },
          ].map(({ value, label, icon: Icon, desc }) => (
            <Label
              key={value}
              htmlFor={`theme-${value}`}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border cursor-pointer transition-all ${
                theme === value ? 'border-primary bg-primary/10' : 'border-border hover:border-muted-foreground/40'
              }`}
            >
              <RadioGroupItem value={value} id={`theme-${value}`} className="sr-only" />
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{label}</span>
              <span className="text-xs text-muted-foreground text-center">{desc}</span>
            </Label>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
}
