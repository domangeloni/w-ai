import { ChevronLeft, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { useLocation, useRoute } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { getLoginUrl } from '@/const';
import { trpc } from '@/lib/trpc';
import TradingChart from '@/components/TradingChart';

export default function AnalysisResult() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [, params] = useRoute('/analysis/:id');
  const { data: subscription } = trpc.subscription.checkPremium.useQuery();
  
  const analysisId = params?.id ? parseInt(params.id) : null;
  const { data: analysis, isLoading, error } = trpc.analysis.get.useQuery(
    { id: analysisId || 0 },
    { enabled: !!analysisId && isAuthenticated }
  );

  if (authLoading) {
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={32} className="animate-spin text-accent" />
          <p className="text-muted-foreground">Carregando análise...</p>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto mb-4 text-destructive" />
          <p className="text-foreground mb-4">Análise não encontrada</p>
          <button
            onClick={() => navigate('/app')}
            className="btn-primary"
          >
            Voltar para Home
          </button>
        </div>
      </div>
    );
  }

  const analysisData = (analysis.analysisRaw as any) || {
    trend: analysis.trend,
    confidence: analysis.confidence,
    rsiValue: analysis.rsiValue,
    rsiStatus: analysis.rsiStatus,
    macdSignal: analysis.macdSignal,
    maStatus: analysis.maStatus,
    patterns: analysis.patterns || [],
    buyZoneMin: '',
    buyZoneMax: '',
    stopLoss: '',
    takeProfit1: '',
    riskLevel: '',
    volatility: '',
    riskReward: '',
  };

  const trendColor = analysisData.trend?.toLowerCase() === 'bullish' ? 'text-accent' : 'text-destructive';
  const trendIcon = analysisData.trend?.toLowerCase() === 'bullish' ? '📈' : '📉';

  // Mock chart data for demonstration
  const mockCandleData = [
    { time: '2024-01-01', open: 45000, high: 46000, low: 44500, close: 45500 },
    { time: '2024-01-02', open: 45500, high: 47000, low: 45000, close: 46500 },
    { time: '2024-01-03', open: 46500, high: 48000, low: 46000, close: 47500 },
    { time: '2024-01-04', open: 47500, high: 49000, low: 47000, close: 48500 },
    { time: '2024-01-05', open: 48500, high: 50000, low: 48000, close: 49500 },
  ];

  const mockMA10 = [
    { time: '2024-01-01', value: 45200 },
    { time: '2024-01-02', value: 45700 },
    { time: '2024-01-03', value: 46700 },
    { time: '2024-01-04', value: 47700 },
    { time: '2024-01-05', value: 48700 },
  ];

  const mockMA30 = [
    { time: '2024-01-01', value: 45000 },
    { time: '2024-01-02', value: 45500 },
    { time: '2024-01-03', value: 46500 },
    { time: '2024-01-04', value: 47500 },
    { time: '2024-01-05', value: 48500 },
  ];

  const mockMA60 = [
    { time: '2024-01-01', value: 44800 },
    { time: '2024-01-02', value: 45300 },
    { time: '2024-01-03', value: 46300 },
    { time: '2024-01-04', value: 47300 },
    { time: '2024-01-05', value: 48300 },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-background border-b border-white/10 px-4 py-4 z-40 flex items-center gap-3">
        <button
          onClick={() => navigate('/app')}
          className="text-foreground hover:text-accent transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-light">Resultado da Análise</h1>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Interactive Trading Chart */}
        <div className="bg-card rounded-2xl p-4 border border-white/10 overflow-hidden">
          <p className="text-muted-foreground text-xs mb-3">Gráfico Interativo</p>
          <TradingChart
            candleData={mockCandleData}
            ma10={mockMA10}
            ma30={mockMA30}
            ma60={mockMA60}
            buySignals={analysisData.trend?.toLowerCase() === 'bullish' ? [{ time: '2024-01-02', price: 46500 }] : []}
            supportLevel={44000}
            resistanceLevel={50000}
            theme="dark"
          />
        </div>

        {/* Chart Preview */}
        {analysis.imageUrl && (
          <div className="bg-card rounded-2xl p-4 border border-white/10 overflow-hidden">
            <p className="text-muted-foreground text-xs mb-2">Imagem Original Analisada</p>
            <img
              src={analysis.imageUrl}
              alt="Gráfico analisado"
              className="w-full rounded-lg max-h-64 object-cover"
            />
          </div>
        )}

        {/* Main Trend Card */}
        <div className={`bg-card rounded-2xl p-6 border ${analysisData.trend?.toLowerCase() === 'bullish' ? 'border-accent/30' : 'border-destructive/30'}`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-muted-foreground text-sm mb-1">Tendência do Mercado</p>
              <p className={`${trendColor} font-light text-3xl flex items-center gap-2`}>
                <span>{trendIcon}</span>
                {analysisData.trend || 'N/A'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-muted-foreground text-sm">Confiança</p>
              <p className={trendColor}>{analysisData.confidence || 0}%</p>
            </div>
          </div>
        </div>

        {/* Technical Analysis Section */}
        <div className="bg-card rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-foreground font-light">Análise Técnica</h3>
            <span className="text-accent text-xs font-bold bg-accent/20 px-2 py-1 rounded-full">
              GRÁTIS
            </span>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <p className="text-muted-foreground">RSI</p>
              <p className="text-foreground">
                {analysisData.rsiValue !== undefined ? `${analysisData.rsiValue} - ${analysisData.rsiStatus || 'N/A'}` : 'N/A'}
              </p>
            </div>
            
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <p className="text-muted-foreground">MACD</p>
              <p className="text-foreground">{analysisData.macdSignal || 'N/A'}</p>
            </div>
            
            <div className="flex justify-between items-center">
              <p className="text-muted-foreground">Moving Averages</p>
              <p className="text-foreground">{analysisData.maStatus || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Patterns Section */}
        {analysisData.patterns && analysisData.patterns.length > 0 && (
          <div className="bg-card rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-foreground font-light">Padrões Identificados</h3>
              <span className="text-accent text-xs font-bold bg-accent/20 px-2 py-1 rounded-full">
                GRÁTIS
              </span>
            </div>
            
            <div className="space-y-2">
              {analysisData.patterns.map((pattern: string, idx: number) => (
                <div key={idx} className="bg-black/30 rounded-lg p-3">
                  <p className="text-foreground text-sm">{pattern}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Premium Locked Sections */}
        {!subscription?.hasPremium && (
          <>
            <div className="relative bg-card rounded-2xl p-6 border border-white/10">
              <div className="absolute inset-0 bg-black/60 rounded-2xl flex flex-col items-center justify-center gap-4 backdrop-blur-sm">
                <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-center text-foreground font-light">
                  Desbloqueie Sinais de Trading
                </p>
                <button
                  onClick={() => navigate('/subscribe')}
                  className="btn-upgrade text-sm"
                >
                  Fazer Upgrade
                </button>
              </div>
              
              <div className="opacity-30">
                <h3 className="text-foreground font-light mb-4">Sinais de Trading</h3>
                <p className="text-muted-foreground text-sm">Acesso a sinais avançados</p>
              </div>
            </div>

            <div className="relative bg-card rounded-2xl p-6 border border-white/10">
              <div className="absolute inset-0 bg-black/60 rounded-2xl flex flex-col items-center justify-center gap-4 backdrop-blur-sm">
                <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-center text-foreground font-light">
                  Desbloqueie Análise de Risco
                </p>
                <button
                  onClick={() => navigate('/subscribe')}
                  className="btn-upgrade text-sm"
                >
                  Fazer Upgrade
                </button>
              </div>
              
              <div className="opacity-30">
                <h3 className="text-foreground font-light mb-4">Análise de Risco</h3>
                <p className="text-muted-foreground text-sm">Análise detalhada de risco</p>
              </div>
            </div>
          </>
        )}

        {/* Premium Features (if user has premium) */}
        {subscription?.hasPremium && (
          <>
            <div className="bg-card rounded-2xl p-6 border border-accent/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-foreground font-light">Sinais de Trading</h3>
                <span className="text-accent text-xs font-bold bg-accent/20 px-2 py-1 rounded-full">
                  PREMIUM
                </span>
              </div>
              
              <div className="space-y-3">
                <div className="bg-black/30 rounded-lg p-3">
                  <p className="text-accent text-sm font-light">
                    {analysisData.trend?.toLowerCase() === 'bullish' ? '🟢 COMPRAR' : '🔴 VENDER'}
                  </p>
                </div>
                <div className="text-muted-foreground text-xs space-y-1">
                  <p>Zona de Compra: {(analysisData as any).buyZoneMin || 'N/A'} - {(analysisData as any).buyZoneMax || 'N/A'}</p>
                  <p>Stop Loss: {(analysisData as any).stopLoss || 'N/A'}</p>
                  <p>Take Profit: {(analysisData as any).takeProfit1 || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-2xl p-6 border border-accent/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-foreground font-light">Análise de Risco</h3>
                <span className="text-accent text-xs font-bold bg-accent/20 px-2 py-1 rounded-full">
                  PREMIUM
                </span>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-3 border-b border-white/10">
                  <p className="text-muted-foreground">Nível de Risco</p>
                  <p className="text-foreground">{(analysisData as any).riskLevel || 'N/A'}</p>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-white/10">
                  <p className="text-muted-foreground">Volatilidade</p>
                  <p className="text-foreground">{(analysisData as any).volatility || 'N/A'}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-muted-foreground">Razão Risco/Recompensa</p>
                  <p className="text-foreground">{(analysisData as any).riskReward || 'N/A'}</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Disclaimer */}
        <div className="bg-card rounded-2xl p-4 border border-yellow-600/30 flex gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <p className="text-muted-foreground text-sm">
            Esta análise é apenas para fins educacionais. W-AI não fornece aconselhamento financeiro. Sempre faça sua própria pesquisa e consulte um profissional financeiro antes de tomar decisões de investimento.
          </p>
        </div>

        {/* New Analysis Button */}
        <button
          onClick={() => navigate('/app')}
          className="btn-primary w-full"
        >
          Nova Análise
        </button>
      </div>
    </div>
  );
}
