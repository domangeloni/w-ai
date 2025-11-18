import { Home, Clock, Layers, MessageCircle } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';

export default function BottomNav() {
  const [location, navigate] = useLocation();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;

  const navItems = [
    { path: '/app', label: 'Início', icon: Home },
    { path: '/history', label: 'Histórico', icon: Clock },
    { path: '/strategies', label: 'Estratégias', icon: Layers },
    { path: '/chat', label: 'Chat', icon: MessageCircle },
  ];

  const isActive = (path: string) => location === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-white/10 px-4 py-2 flex justify-around items-center h-20 max-w-full z-50">
      {navItems.map(({ path, label, icon: Icon }) => (
        <button
          key={path}
          onClick={() => navigate(path)}
          className={`flex flex-col items-center gap-1 py-2 px-3 transition-colors ${
            isActive(path)
              ? 'text-accent'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Icon size={24} strokeWidth={1.5} />
          <span className="text-xs font-medium">{label}</span>
        </button>
      ))}
    </nav>
  );
}
