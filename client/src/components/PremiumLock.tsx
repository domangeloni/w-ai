import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface PremiumLockProps {
  title: string;
  description?: string;
}

export default function PremiumLock({ title, description }: PremiumLockProps) {
  const [, setLocation] = useLocation();

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
        <Lock className="w-10 h-10 text-muted-foreground" />
      </div>
      
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      
      {description && (
        <p className="text-muted-foreground mb-6 max-w-md">
          {description}
        </p>
      )}
      
      <Button
        onClick={() => setLocation("/subscribe")}
        className="px-8"
      >
        Fazer Upgrade
      </Button>
    </div>
  );
}
