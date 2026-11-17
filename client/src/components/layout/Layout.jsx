import { Suspense } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import BottomNav from './BottomNav.jsx';
import OfflineIndicator from '../ui/OfflineIndicator.jsx';
import InstallPrompt from '../pwa/InstallPrompt.jsx';
import SyncErrorBridge from './SyncErrorBridge.jsx';
import CommandPalette from '../quickadd/CommandPalette.jsx';
import { useCardSpotlight } from '../../hooks/useCardSpotlight.js';
import { useApp } from '../../context/AppContext.jsx';

export default function Layout({ demo = false }) {
  useCardSpotlight();
  const location = useLocation();
  const { settings, activeSemester } = useApp();
  const showMobileIdentity = location.pathname === (demo ? '/demo' : '/');
  return (
    <div className="flex h-screen overflow-hidden">
      <a href="#main" className="skip-link">Skip to content</a>
      <Sidebar demo={demo} />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <OfflineIndicator />
        {showMobileIdentity && <div className="md:hidden app-mobile-identity no-print"><Link to={demo ? '/demo/profile' : '/profile'} className="font-display font-bold tracking-tight"><span className="text-primary">ultra</span>Grade</Link><span className="truncate text-xs text-base-content/55">{activeSemester?.name || settings.studentName || 'Your student life OS'}</span></div>}
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
      <BottomNav demo={demo} />
      <CommandPalette demo={demo} />
      {!demo && <InstallPrompt />}
      {!demo && <SyncErrorBridge />}
    </div>
  );
}
