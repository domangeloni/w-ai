import { Camera, TrendingUp, Rocket, Brain, Sparkles } from "lucide-react";
import { useLocation } from "wouter";

const features = [
  {
    emoji: "📷",
    title: "Snap & Analyze Instantly",
  },
  {
    emoji: "📈",
    title: "Understand Key Market Trends",
  },
  {
    emoji: "🚀",
    title: "Get Actionable Insights",
  },
  {
    emoji: "🧠",
    title: "Define Your Own Strategy",
  },
  {
    emoji: "⭐",
    title: "Start Trading Like a Pro",
  },
];

export default function Features() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background px-6 py-12">
      <div className="max-w-md w-full mx-auto flex-1 flex flex-col items-center">
        {/* Title */}
        <div className="text-center pt-12 pb-12">
          <h1 className="text-4xl font-light text-foreground leading-tight text-balance">
            Transform your trading journey!
          </h1>
        </div>

        {/* Features List */}
        <div className="flex-1 space-y-6 w-full bg-card rounded-3xl p-8 border border-white/10">
          {features.map((feature, index) => (
            <div key={index} className="flex gap-4 items-start">
              <div className="text-3xl flex-shrink-0 w-8">
                {feature.emoji}
              </div>
              <div className="flex-1">
                <h3 className="font-light text-foreground text-lg">
                  {feature.title}
                </h3>
              </div>
            </div>
          ))}
        </div>

        {/* Continue Button */}
        <div className="w-full pt-12">
          <button
            onClick={() => navigate("/subscribe")}
            className="btn-primary"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
