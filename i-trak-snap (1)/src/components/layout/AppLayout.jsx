import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import { ChevronLeft } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { pageVariants } from '@/App';

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isRoot = location.pathname === '/';

  const pageLabels = {
    '/scan': 'Scan',
    '/map': 'Map View',
    '/favorites': 'Favorites',
    '/inventory': 'Inventory',
    '/settings': 'Settings',
  };

  return (
    <div className="flex h-full bg-background font-inter">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header — height accounts for iOS status bar */}
        <header
          className="md:hidden flex items-end px-4 pb-2 bg-card/95 backdrop-blur-xl border-b border-border sticky top-0 z-40 select-none"
          style={{
            paddingTop: 'calc(env(safe-area-inset-top) + 8px)',
            minHeight: 'calc(env(safe-area-inset-top) + 48px)',
          }}
        >
          {!isRoot ? (
            <button
              className="flex items-center gap-1 text-primary font-medium text-sm min-w-[44px] min-h-[44px] -ml-2 px-2"
              onClick={() => navigate(-1)}
            >
              <ChevronLeft className="w-5 h-5" />
              Back
            </button>
          ) : (
            <div className="flex items-center gap-2 min-h-[44px]">
              <span className="font-bold text-foreground">Item Finder</span>
            </div>
          )}
          {!isRoot && (
            <span className="absolute left-1/2 -translate-x-1/2 bottom-2 font-semibold text-foreground text-sm">
              {pageLabels[location.pathname] || ''}
            </span>
          )}
        </header>
        <main className="flex-1 overflow-hidden" style={{ paddingBottom: 'calc(4.5rem + env(safe-area-inset-bottom))' }}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="h-full overflow-y-auto overscroll-contain -webkit-overflow-scrolling-touch"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}