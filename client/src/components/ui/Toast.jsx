import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
};

const ACCENT = {
  success: 'text-success',
  error: 'text-error',
  info: 'text-info',
};

let seq = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());
  const reduce = useReducedMotion();

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) { clearTimeout(timer); timers.current.delete(id); }
  }, []);

  const push = useCallback((message, { type = 'info', duration = 4500 } = {}) => {
    const id = ++seq;
    setToasts((prev) => [...prev, { id, message, type }]);
    if (duration > 0) {
      timers.current.set(id, setTimeout(() => dismiss(id), duration));
    }
    return id;
  }, [dismiss]);

  const toast = useMemo(() => ({
    push,
    success: (m, o) => push(m, { ...o, type: 'success' }),
    error: (m, o) => push(m, { ...o, type: 'error' }),
    info: (m, o) => push(m, { ...o, type: 'info' }),
    dismiss,
  }), [push, dismiss]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {createPortal(
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-2 w-[calc(100%-2rem)] max-w-sm pt-safe pointer-events-none"
          aria-live="polite"
          aria-atomic="false"
        >
          <AnimatePresence initial={false}>
            {toasts.map((t) => {
              const Icon = ICONS[t.type] || Info;
              return (
                <motion.div
                  key={t.id}
                  layout={!reduce}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.98 }}
                  role={t.type === 'error' ? 'alert' : 'status'}
                  className="glass-card pointer-events-auto w-full flex items-start gap-3 px-4 py-3 shadow-ambient"
                >
                  <Icon size={18} className={`${ACCENT[t.type] || ACCENT.info} shrink-0 mt-0.5`} aria-hidden="true" />
                  <p className="text-sm text-base-content flex-1 leading-snug">{t.message}</p>
                  <button
                    onClick={() => dismiss(t.id)}
                    className="btn btn-ghost btn-xs btn-circle -mr-1 -mt-1 shrink-0"
                    aria-label="Dismiss notification"
                  >
                    <X size={14} />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
