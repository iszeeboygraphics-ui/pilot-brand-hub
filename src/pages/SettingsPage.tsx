import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { User, Mail, LogOut } from 'lucide-react';

export default function SettingsPage() {
  const { user, signOut } = useAuth();

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
    </div>
  );
}
