import React, { useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Radio, Map, Star, Package, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', label: 'Home', icon: LayoutDashboard },
  { path: '/inventory', label: 'Inv', icon: Package },
  { path: '/scan', label: 'Scan', icon: Radio },
  { path: '/map', label: 'Map', icon: Map },
  { path: '/favorites', label: 'Favs', icon: Star },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleTabPress = useCallback((item) => {
    if (location.pathname === item.path) {
      // Already on this tab — scroll main content to top
      const main = document.querySelector('main [data-page-scroll]');
      if (main) {
        main.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        // Fallback: scroll the motion div inside main
        const motionDiv = document.querySelector('main > div');
        if (motionDiv) motionDiv.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      navigate(item.path);
    }
  }, [location.pathname, navigate]);

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border z-50 font-inter select-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)', paddingLeft: 'env(safe-area-inset-left)', paddingRight: 'env(safe-area-inset-right)' }}
    >
      <div className="flex items-center justify-around px-1 py-1.5">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => handleTabPress(item)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-200 min-w-[48px] min-h-[48px] justify-center active:scale-95",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <item.icon className={cn("w-5 h-5", isActive && "drop-shadow-sm")} />
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && <div className="w-1 h-1 rounded-full bg-primary mt-0.5" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}