import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const plans = [
  {
    id: "weekly",
    name: "1 Week",
    price: "$7.99",
    period: "week",
    badge: null,
  },
  {
    id: "yearly",
    name: "1 Year",
    price: "$39.99",
    period: "year",
    badge: "Save 80%",
  },
];

export default function Subscribe() {
  const [selectedPlan, setSelectedPlan] = useState("yearly");
  const [, navigate] = useLocation();
  const { isAuthenticated, loading } = useAuth();

  const checkoutMutation = trpc.stripe.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        toast.info("Redirecting to checkout...");
        window.open(data.url, "_blank");
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleContinue = () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    
    checkoutMutation.mutate({ plan: selectedPlan as "weekly" | "yearly" });
  };

  const handleSkip = () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    
    navigate("/app");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background px-6 py-12">
      <div className="max-w-md w-full mx-auto flex-1 flex flex-col items-center justify-center">
        {/* Header */}
        <div className="text-center pb-12">
          <h1 className="text-4xl font-light text-foreground mb-4">
            Maximize Your Profits!
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed">
            Unlock AI-powered trade insights, personalized analysis, and market signals. Spot opportunities faster, minimize risks, and maximize your profits!
          </p>
        </div>

        {/* Phone Preview Card */}
        <div className="w-full mb-12 bg-card rounded-3xl p-6 border border-white/10">
          <div className="bg-black rounded-2xl p-4 aspect-video flex items-center justify-center">
            <p className="text-muted-foreground text-sm">App Preview</p>
          </div>
          
          <div className="mt-6 space-y-4">
            <div className="flex gap-3">
              <div className="w-16 h-16 bg-black/30 rounded-lg flex-shrink-0"></div>
              <div className="flex-1">
                <p className="text-muted-foreground text-xs mb-1">Asset</p>
                <p className="text-foreground font-medium">Bitcoin</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="w-16 h-16 bg-black/30 rounded-lg flex-shrink-0"></div>
              <div className="flex-1">
                <p className="text-muted-foreground text-xs mb-1">Strategy</p>
                <p className="text-foreground font-medium">Auto</p>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10">
              <h3 className="text-foreground font-light mb-3">Key Insights</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/30 rounded-lg p-3">
                  <p className="text-muted-foreground text-xs">Trend</p>
                  <p className="text-accent font-medium">Bullish</p>
                </div>
                <div className="bg-black/30 rounded-lg p-3">
                  <p className="text-muted-foreground text-xs">Signal</p>
                  <p className="text-blue-400 font-medium">Hold</p>
                </div>
                <div className="bg-black/30 rounded-lg p-3">
                  <p className="text-muted-foreground text-xs">Risk Level</p>
                  <p className="text-yellow-600 font-medium">Medium</p>
                </div>
                <div className="bg-black/30 rounded-lg p-3">
                  <p className="text-muted-foreground text-xs">Volume</p>
                  <p className="text-foreground font-medium">High</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Plans */}
        <div className="w-full space-y-4 mb-8">
          {plans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`w-full p-6 rounded-2xl border-2 transition-all text-center ${
                selectedPlan === plan.id
                  ? 'border-white/50 bg-card'
                  : 'border-white/10 bg-card hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="text-foreground font-light text-lg">{plan.name}</p>
                  <p className="text-muted-foreground text-sm">{plan.price} / {plan.period}</p>
                </div>
                {plan.badge && (
                  <span className="bg-accent text-black text-xs font-bold px-3 py-1 rounded-full">
                    {plan.badge}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          disabled={checkoutMutation.isPending}
          className="btn-primary mb-4"
        >
          {checkoutMutation.isPending ? "Processing..." : "Continue"}
        </button>

        {/* Footer Links */}
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <a href="#" className="hover:text-foreground transition-colors underline">
            Terms
          </a>
          <span>|</span>
          <a href="#" className="hover:text-foreground transition-colors underline">
            Privacy
          </a>
          <span>|</span>
          <a href="#" className="hover:text-foreground transition-colors underline">
            Restore
          </a>
        </div>
      </div>
    </div>
  );
}
