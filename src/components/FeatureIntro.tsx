import { Info, X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface FeatureIntroProps {
  featureKey: string;
  title: string;
  description: string;
  tips: string[];
}

export const FeatureIntro = React.forwardRef<HTMLDivElement, FeatureIntroProps>(function FeatureIntro({ featureKey, title, description, tips }, _ref) {
  const storageKey = `brandpilot_intro_dismissed_${featureKey}`;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(storageKey);
    if (!dismissed) setVisible(true);
  }, [storageKey]);

  const dismiss = () => {
    localStorage.setItem(storageKey, 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="relative card-neural border-primary/20 bg-primary/5 p-5 animate-fade-in">
      <button
        onClick={dismiss}
        className="absolute top-3 right-3 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
          <Info className="w-4 h-4" />
        </div>
        <div className="space-y-2 pr-6">
          <h3 className="font-semibold text-sm">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          <ul className="space-y-1">
            {tips.map((tip, i) => (
              <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                <span className="text-primary mt-0.5">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
