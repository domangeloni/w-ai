import { TrendingUp } from "lucide-react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";

export default function Home() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 py-12">
      <div className="max-w-md w-full space-y-12 text-center flex flex-col items-center">
        {/* Icon */}
        <div className="pt-12">
          <TrendingUp className="w-12 h-12 text-accent" strokeWidth={1.5} />
        </div>

        {/* Title */}
        <div className="space-y-6">
          <h1 className="text-5xl font-light text-foreground leading-tight text-balance">
            Your next winning trade starts with a photo.
          </h1>
        </div>

        {/* Actions */}
        <div className="space-y-3 w-full pt-8">
          <button
            onClick={() => navigate("/welcome")}
            className="btn-secondary"
          >
            I have an account
          </button>
          
          <button
            onClick={() => navigate("/welcome")}
            className="btn-primary"
          >
            Continue
          </button>
        </div>

        {/* Footer Links */}
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground pt-12">
          <a href="#" className="hover:text-foreground transition-colors underline">
            Privacy Policy
          </a>
          <span>|</span>
          <a href="#" className="hover:text-foreground transition-colors underline">
            Terms of Use
          </a>
        </div>
      </div>
    </div>
  );
}
