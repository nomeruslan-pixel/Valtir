import React from 'react';
import { RefreshCw } from 'lucide-react';
import usePullToRefresh from '@/hooks/usePullToRefresh';

export default function PullToRefreshWrapper({ onRefresh, children, className = '' }) {
  const { pulling, pullDistance, refreshing, threshold, onTouchStart, onTouchMove, onTouchEnd } = usePullToRefresh(onRefresh);

  const progress = Math.min(pullDistance / threshold, 1);

  return (
    <div
      className={`relative overflow-auto ${className}`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {/* Pull indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center z-10 pointer-events-none transition-all duration-200"
        style={{ height: `${pullDistance}px`, opacity: pulling || refreshing ? 1 : 0 }}
      >
        <div
          className="w-8 h-8 rounded-full bg-card border border-border shadow flex items-center justify-center"
          style={{ transform: `rotate(${progress * 360}deg)` }}
        >
          <RefreshCw className={`w-4 h-4 text-primary ${refreshing ? 'animate-spin' : ''}`} />
        </div>
      </div>
      <div style={{ transform: `translateY(${pullDistance}px)`, transition: pulling ? 'none' : 'transform 0.25s ease' }}>
        {children}
      </div>
    </div>
  );
}