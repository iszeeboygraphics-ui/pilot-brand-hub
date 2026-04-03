import { ArrowRight, Box, Image as ImageIcon, Layout, Sparkles, FolderHeart, Phone, Mail, Instagram, Twitter, Linkedin } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function Index() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground overflow-hidden selection:bg-primary/30">
      {/* Background ambient light */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-primary/10 rounded-full blur-[120px] -translate-y-1/2 mx-auto max-w-4xl pointer-events-none" />

      {/* Navigation */}
      <header className="relative z-10 container mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30 glow-primary">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <span className="font-bold text-xl tracking-tight">Pilot Brand Hub</span>
        </div>
        <nav className="flex items-center gap-4">
          {user ? (
            <Link to="/dashboard">
              <Button variant="ghost" className="hover:bg-primary/10 hover:text-primary transition-colors">
                Go to Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/auth">
                <Button variant="ghost" className="hover:bg-primary/10 hover:text-primary transition-colors">
                  Login
                </Button>
              </Link>
              <Link to="/auth">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(139,92,246,0.25)] hover:shadow-[0_0_25px_rgba(139,92,246,0.4)] transition-all">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col relative z-10 pt-16 md:pt-24 pb-20">
        <div className="container mx-auto px-6 flex flex-col items-center text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">The Ultimate Brand Management Platform</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150 fill-mode-both">
            Unleash Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent glow-primary relative">Brand's</span> Potential
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl balance px-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 fill-mode-both">
            Centralize your assets, build stunning scenes, and orchestrate your content strategy all from one intelligent, unified hub.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500 fill-mode-both">
            <Link to={user ? "/dashboard" : "/auth"}>
              <Button size="lg" className="h-14 px-8 text-lg rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:shadow-[0_0_40px_rgba(139,92,246,0.5)] transition-all group">
                {user ? "Enter Dashboard" : "Start your journey"}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="container mx-auto px-6 mt-32 max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              delay="delay-700"
              icon={<FolderHeart className="w-8 h-8 text-primary" />}
              title="Brand Vault"
              description="Securely store, organize, and share all your brand assets in a centralized, searchable repository."
            />
            <FeatureCard 
              delay="delay-1000"
              icon={<ImageIcon className="w-8 h-8 text-accent" />}
              title="Scene Creator"
              description="Design breathtaking scenes with intuitive tools tailored for high-quality visual output."
            />
            <FeatureCard 
              delay="delay-[1300ms]"
              icon={<Layout className="w-8 h-8 text-success" />}
              title="Content Hub"
              description="Seamlessly orchestrate your media, campaigns, and distributions across all your channels."
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 relative z-10 py-10">
        <div className="container mx-auto px-6 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="font-bold text-sm tracking-tight">Pilot Brand Hub</span>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 text-sm text-muted-foreground">
              <a href="tel:+2348159319278" className="hover:text-primary transition-colors flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                +234 815 931 9278
              </a>
              <span className="hidden sm:inline text-border">|</span>
              <a href="mailto:iszeeboygraphics@gmail.com" className="hover:text-primary transition-colors flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                iszeeboygraphics@gmail.com
              </a>
            </div>
          </div>
          <div className="border-t border-border/30 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="text-muted-foreground text-xs">
              &copy; {new Date().getFullYear()} Pilot Brand Hub. All rights reserved.
            </div>
            <div className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              Elevating brands globally <Box className="w-4 h-4 ml-1 inline text-primary" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ 
  icon, 
  title, 
  description, 
  delay 
}: { 
  icon: React.ReactNode, 
  title: string, 
  description: string,
  delay: string
}) {
  return (
    <div className={`card-neural p-8 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-12 duration-1000 fill-mode-both ${delay}`}>
      <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center border border-border/50 mb-4">
        {icon}
      </div>
      <h3 className="text-2xl font-bold">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
