import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './Sidebar.jsx';
import BottomNav from './BottomNav.jsx';
import OfflineIndicator from '../ui/OfflineIndicator.jsx';

export default function Layout() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-base-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <OfflineIndicator />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
