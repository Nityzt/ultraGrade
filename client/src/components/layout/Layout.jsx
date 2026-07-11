import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import BottomNav from './BottomNav.jsx';
import OfflineIndicator from '../ui/OfflineIndicator.jsx';
import InstallPrompt from '../pwa/InstallPrompt.jsx';
import SyncErrorBridge from './SyncErrorBridge.jsx';
import CommandPalette from '../quickadd/CommandPalette.jsx';
import { useCardSpotlight } from '../../hooks/useCardSpotlight.js';

export default function Layout() {
  useCardSpotlight();
  const location = useLocation();
  return (
    <div className="flex h-screen overflow-hidden">
      <a href="#main" className="skip-link">Skip to content</a>
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <OfflineIndicator />
        <main id="main" tabIndex={-1} className="flex-1 overflow-y-auto pb-28 md:pb-0 pl-safe pr-safe focus:outline-none">
          {/* Inner boundary: a route chunk loading swaps only the content area,
              keeping the sidebar/bottom-nav chrome mounted (no shell flash). */}
          <Suspense
            fallback={
              <div className="min-h-[40vh] flex items-center justify-center">
                <span className="loading loading-spinner loading-lg text-primary" />
              </div>
            }
          >
            {/* Route enter reveal — CSS-only, keyed by pathname. Interruptible
                and freeze-proof (no AnimatePresence: that has a documented freeze
                history in this codebase). */}
            {/* h-full so pages with `h-full`/`min-h-full` roots (Grades,
                Timetable, Planner, Settings) still resolve against <main>'s
                definite height, as they did before this wrapper existed. */}
            <div key={location.pathname} className="page-enter h-full">
              <Outlet />
            </div>
          </Suspense>
        </main>
      </div>
      <BottomNav />
      <CommandPalette />
      <InstallPrompt />
      <SyncErrorBridge />
    </div>
  );
}
