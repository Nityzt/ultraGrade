import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Download, X } from 'lucide-react';

const DISMISS_KEY = 'ultragrade_install_dismissed';

/**
 * Subtle, dismissible "Install ultraGrade" pill.
 * Appears only when the browser fires `beforeinstallprompt` (Chromium/Android),
 * the app isn't already installed, and the user hasn't dismissed it before.
 */
export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null);
  const [visible, setVisible] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    // Already installed → never show.
    const installed = window.matchMedia?.('(display-mode: standalone)')?.matches
      || window.navigator.standalone === true;
    if (installed || localStorage.getItem(DISMISS_KEY) === '1') return;

    const onPrompt = (e) => {
      e.preventDefault();
      setDeferred(e);
      setVisible(true);
    };
    const onInstalled = () => {
      setVisible(false);
      setDeferred(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice.catch(() => {});
    setDeferred(null);
    setVisible(false);
  };

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
          className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-40 pb-safe"
          role="dialog"
          aria-label="Install ultraGrade"
        >
          <div className="pill pill-hover flex items-center gap-3 py-2 pl-4 pr-2 shadow-ambient">
            <Download size={16} className="text-primary shrink-0" aria-hidden="true" />
            <span className="text-sm font-medium">Install ultraGrade</span>
            <button
              onClick={install}
              className="btn btn-primary btn-xs rounded-full px-3"
            >
              Install
            </button>
            <button
              onClick={dismiss}
              className="btn btn-ghost btn-xs btn-circle"
              aria-label="Dismiss install prompt"
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
