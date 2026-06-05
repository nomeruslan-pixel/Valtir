import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bluetooth, LayoutDashboard, Map, Star, Radio, Package, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/inventory', label: 'Inventory', icon: Package },
  { path: '/scan', label: 'Scan', icon: Radio },
  { path: '/map', label: 'Map View', icon: Map },
  { path: '/favorites', label: 'Favorites', icon: Star },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border min-h-screen font-inter">
      <div className="p-6 border-b border-border">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Bluetooth className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">Item Finder</h1>

          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="px-4 py-3 rounded-xl bg-muted/50">
          <p className="text-xs text-muted-foreground">Web Bluetooth API</p>
          <p className="text-xs font-medium text-foreground mt-1">
            {navigator.bluetooth ? '✓ Supported' : '✗ Not supported'}
          </p>
        </div>
      </div>
    </aside>
  );
}