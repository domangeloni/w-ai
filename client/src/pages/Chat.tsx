import { Lock } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation } from 'wouter';
import { getLoginUrl } from '@/const';
import { trpc } from '@/lib/trpc';

export default function Chat() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const { data: subscription } = trpc.subscription.checkPremium.useQuery();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-24 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-background border-b border-white/10 px-4 py-4 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
            <span className="text-sm">✨</span>
          </div>
          <div>
            <h1 className="text-lg font-light">AI Assistant</h1>
            <p className="text-muted-foreground text-xs">Ask me anything about trading</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-6">
        {!subscription?.hasPremium ? (
          <div className="relative bg-card rounded-2xl p-8 border border-white/10 min-h-96 flex flex-col items-center justify-center">
            <div className="absolute inset-0 bg-black/60 rounded-2xl flex flex-col items-center justify-center gap-6 backdrop-blur-sm">
              <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center">
                <Lock className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-center text-foreground font-light text-lg">
                Unlock AI Chat Assistant
              </p>
              <button
                onClick={() => navigate('/subscribe')}
                className="btn-upgrade"
              >
                Fazer Upgrade
              </button>
            </div>
            
            <div className="text-center opacity-30">
              <h3 className="text-lg font-light mb-4">AI Chat Assistant</h3>
              <p className="text-muted-foreground text-sm">
                Faça perguntas sobre trading
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-muted-foreground text-center py-12">
              Chat coming soon
            </p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
