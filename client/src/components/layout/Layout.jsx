import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import BottomNav from './BottomNav.jsx';
import OfflineIndicator from '../ui/OfflineIndicator.jsx';
import InstallPrompt from '../pwa/InstallPrompt.jsx';
import SyncErrorBridge from './SyncErrorBridge.jsx';
import { useCardSpotlight } from '../../hooks/useCardSpotlight.js';

export default function Layout() {
  useCardSpotlight();
  return (
    <div className="flex h-screen overflow-hidden">
      <a href="#main" className="skip-link">Skip to content</a>
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <OfflineIndicator />
        <main id="main" tabIndex={-1} className="flex-1 overflow-y-auto pb-28 md:pb-0 focus:outline-none">
          <Outlet />
        </main>
      </div>
      <BottomNav />
      <InstallPrompt />
      <SyncErrorBridge />
    </div>
  );
}
