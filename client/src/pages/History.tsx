import { Trash2 } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation } from 'wouter';
import { getLoginUrl } from '@/const';

export default function History() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

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

  // Mock data - in real app would fetch from API
  const analyses = [
    {
      id: 1,
      trend: 'Bearish',
      asset: 'Bitcoin',
      date: 'Nov 18, 2025',
      confidence: '75%',
      image: null,
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-background border-b border-white/10 px-4 py-4 z-40">
        <h1 className="text-lg font-light">History</h1>
        <p className="text-muted-foreground text-sm">Last 3 analyses</p>
      </div>

      <div className="px-4 py-6 space-y-4">
        {analyses.length > 0 ? (
          <>
            {analyses.map((analysis) => (
              <button
                key={analysis.id}
                onClick={() => navigate(`/analysis/${analysis.id}`)}
                className="w-full bg-card rounded-2xl p-4 border border-white/10 hover:border-white/20 transition-colors text-left"
              >
                <div className="flex gap-4">
                  {/* Chart placeholder */}
                  <div className="w-24 h-24 bg-black/30 rounded-lg flex-shrink-0"></div>
                  
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <p className={`font-light text-lg ${
                        analysis.trend === 'Bearish' ? 'text-destructive' : 'text-accent'
                      }`}>
                        {analysis.trend}
                      </p>
                      <p className="text-foreground text-sm">{analysis.asset}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-muted-foreground text-xs">{analysis.date} • {analysis.confidence} confidence</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle delete
                        }}
                        className="text-destructive hover:text-destructive/80 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </button>
            ))}

            {/* Upgrade banner */}
            <div className="bg-card rounded-2xl p-6 border border-white/10 text-center mt-8">
              <p className="text-muted-foreground text-sm mb-4">
                Upgrade to access your complete analysis history
              </p>
              <a href="#" className="text-accent underline hover:no-underline transition-all">
                View Premium Plans
              </a>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No analyses yet</p>
            <button
              onClick={() => navigate('/app')}
              className="text-accent underline hover:no-underline transition-all"
            >
              Start analyzing
            </button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
