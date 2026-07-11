import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches,
  );
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  const reduce = useReducedMotion();
  const isMobile = useIsMobile();
  // Layout must NOT depend on motion preference — a reduced-motion user on
  // mobile still wants the bottom-sheet layout, just without the slide-in
  // (it fades instead) and without drag-to-dismiss.
  const isSheet = isMobile;
  const dialogRef = useRef(null);
  const openerRef = useRef(null);
  const titleId = useId();

  // Escape to close
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Move focus into the dialog on open; restore to the opener on close
  useEffect(() => {
    if (!isOpen) return;
    openerRef.current = document.activeElement;
    const node = dialogRef.current;
    const first = node?.querySelector(FOCUSABLE);
    (first || node)?.focus?.();
    return () => { openerRef.current?.focus?.(); };
  }, [isOpen]);

  // Trap Tab within the dialog
  const onKeyDown = (e) => {
    if (e.key !== 'Tab') return;
    const node = dialogRef.current;
    if (!node) return;
    const items = Array.from(node.querySelectorAll(FOCUSABLE)).filter((el) => el.offsetParent !== null);
    if (items.length === 0) { e.preventDefault(); return; }
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  const sizeClasses = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  const handleDragEnd = (e, info) => {
    if (info.offset.y > 120 || info.velocity.y > 600) onClose();
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.15 }}
          className={`fixed inset-0 z-50 flex p-4 bg-black/70 backdrop-blur-md ${isSheet ? 'items-end p-0' : 'items-center justify-center'}`}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-label={title ? undefined : 'Dialog'}
            tabIndex={-1}
            onKeyDown={onKeyDown}
            drag={isSheet && !reduce ? 'y' : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={isSheet && !reduce ? handleDragEnd : undefined}
            initial={reduce ? { opacity: 0 } : isSheet ? { opacity: 1, y: '100%' } : { opacity: 0, scale: 0.95, y: 8 }}
            animate={reduce ? { opacity: 1 } : isSheet ? { opacity: 1, y: 0 } : { opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : isSheet ? { opacity: 1, y: '100%' } : { opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: reduce ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }}
            className={`relative w-full bg-base-200 shadow-2xl border-base-300 flex flex-col focus:outline-none pb-safe ${
              isSheet
                ? 'rounded-t-3xl border-t max-h-[85vh]'
                : `${sizeClasses[size]} rounded-3xl border max-h-[90vh]`
            }`}
          >
            {isSheet && (
              <div className="shrink-0 flex justify-center pt-2.5 pb-1 touch-none">
                <span className="w-10 h-1.5 rounded-full bg-base-content/20" />
              </div>
            )}
            {title ? (
              <div className="flex items-center justify-between px-6 py-4 border-b border-base-300 shrink-0">
                <h3 id={titleId} className="font-semibold text-base-content">{title}</h3>
                <button onClick={onClose} className="pressable w-11 h-11 -m-2 flex items-center justify-center rounded-full text-base-content/70 hover:bg-base-300 transition-colors" aria-label="Close">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={onClose}
                className="pressable w-11 h-11 flex items-center justify-center rounded-full text-base-content/70 hover:bg-base-300 transition-colors absolute top-2 right-2 z-10"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            )}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
