import BottomNav from "@/components/BottomNav";
import { useState, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { getLoginUrl, APP_TITLE } from "@/const";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { TrendingUp, Camera, Upload, Loader2 } from "lucide-react";

const assets = [
  { value: "bitcoin", label: "Bitcoin" },
  { value: "ethereum", label: "Ethereum" },
  { value: "bnb", label: "BNB" },
  { value: "solana", label: "Solana" },
];

const strategies = [
  { value: "auto", label: "Auto" },
  { value: "scalping", label: "Scalping" },
  { value: "swing", label: "Swing Trading" },
  { value: "position", label: "Position Trading" },
];

export default function AppHome() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [selectedAsset, setSelectedAsset] = useState("bitcoin");
  const [selectedStrategy, setSelectedStrategy] = useState("auto");
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  const analyzeMutation = trpc.analyze.image.useMutation();

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

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem");
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = async (e) => {
      const base64Image = e.target?.result as string;
      setPreviewImage(base64Image);
      setUploading(true);
      
      try {
        // Send to OpenAI for analysis
        const result = await analyzeMutation.mutateAsync({
          imageBase64: base64Image,
          assetName: selectedAsset,
          strategy: selectedStrategy,
        });
        
        if (result?.id) {
          toast.success("Análise concluída!");
          navigate(`/analysis/${result.id}`);
        }
      } catch (error: any) {
        console.error("Analysis error:", error);
        
        if (error.message?.includes("Free tier limit")) {
          toast.error("Limite de análises grátis atingido. Faça upgrade para continuar.");
          navigate("/subscribe");
        } else {
          toast.error("Erro ao analisar imagem. Tente novamente.");
        }
        
        setUploading(false);
        setPreviewImage(null);
      }
    };
    
    reader.onerror = () => {
      toast.error("Erro ao ler arquivo");
      setUploading(false);
    };
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleGalleryClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-background border-b border-white/10 px-4 py-4 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp size={24} className="text-accent" strokeWidth={1.5} />
            <h1 className="text-lg font-light">W-AI</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/5 transition-colors">
              <span className="text-xs">🇧🇷</span>
            </button>
            <button className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/5 transition-colors">
              <span className="text-xs">🌐</span>
            </button>
            <button className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/5 transition-colors">
              <span className="text-xs">ℹ️</span>
            </button>
            <button className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/5 transition-colors">
              <span className="text-xs">🔖</span>
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Selectors Card */}
        <div className="bg-card rounded-2xl p-6 border border-white/10">
          <div className="flex gap-3 mb-4">
            <select
              value={selectedAsset}
              onChange={(e) => setSelectedAsset(e.target.value)}
              className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-foreground text-sm font-light focus:outline-none focus:border-accent/50"
            >
              {assets.map((asset) => (
                <option key={asset.value} value={asset.value}>
                  Ativo: {asset.label}
                </option>
              ))}
            </select>
            
            <select
              value={selectedStrategy}
              onChange={(e) => setSelectedStrategy(e.target.value)}
              className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-foreground text-sm font-light focus:outline-none focus:border-accent/50"
            >
              {strategies.map((strategy) => (
                <option key={strategy.value} value={strategy.value}>
                  Estratégia: {strategy.label}
                </option>
              ))}
            </select>
          </div>

          {/* Upload Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleCameraClick}
              disabled={uploading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <Camera size={18} />
                  Tirar Foto
                </>
              )}
            </button>
            
            <button
              onClick={handleGalleryClick}
              disabled={uploading}
              className="btn-secondary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload size={18} />
              Carregar da Galeria
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Preview Image */}
        {previewImage && (
          <div className="bg-card rounded-2xl p-4 border border-white/10">
            <p className="text-muted-foreground text-xs mb-2">Preview da Imagem</p>
            <img
              src={previewImage}
              alt="Preview"
              className="w-full rounded-lg max-h-64 object-cover"
            />
          </div>
        )}

        {/* Key Insights */}
        <div className="space-y-3">
          <h2 className="text-foreground font-light text-lg">Insights Principais</h2>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card rounded-2xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">📈</span>
                <p className="text-muted-foreground text-xs">Tendência</p>
              </div>
              <p className="text-accent font-light">Alta</p>
            </div>
            
            <div className="bg-card rounded-2xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">⚠️</span>
                <p className="text-muted-foreground text-xs">Sinal</p>
              </div>
              <p className="text-blue-400 font-light">Manter</p>
            </div>
            
            <div className="bg-card rounded-2xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">📊</span>
                <p className="text-muted-foreground text-xs">Nível de Risco</p>
              </div>
              <p className="text-yellow-500 font-light">Médio</p>
            </div>
            
            <div className="bg-card rounded-2xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">📉</span>
                <p className="text-muted-foreground text-xs">Volume</p>
              </div>
              <p className="text-foreground font-light">Alto</p>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
