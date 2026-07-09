import { Toaster } from 'sonner';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { useThemeTransition } from '../../hooks/useThemeTransition.js';

/**
 * Sonner styled to match the app's glass surface — replaces the old
 * hand-rolled ToastProvider. `unstyled: true` strips Sonner's own
 * background/border/layout so `.glass-card` fully controls the look; the
 * close button loses its default absolute positioning when unstyled (it's
 * DOM-first, before the icon), so it's pushed to the end of the flex row
 * with `order-last` instead.
 */
export default function AppToaster() {
  const { isLight } = useThemeTransition();

  return (
    <Toaster
      theme={isLight ? 'light' : 'dark'}
      position="top-center"
      duration={4500}
      offset={{ top: 'max(1rem, calc(env(safe-area-inset-top) + 0.5rem))' }}
      closeButton
      closeButtonAriaLabel="Dismiss notification"
      icons={{
        success: <CheckCircle2 size={18} className="text-success shrink-0" aria-hidden="true" />,
        error: <AlertTriangle size={18} className="text-error shrink-0" aria-hidden="true" />,
        info: <Info size={18} className="text-info shrink-0" aria-hidden="true" />,
        close: <X size={14} />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            'glass-card w-full flex items-start gap-3 px-4 py-3 shadow-ambient pointer-events-auto',
          icon: 'shrink-0 mt-0.5',
          content: 'flex-1',
          title: 'text-sm text-base-content leading-snug',
          closeButton: 'order-last btn btn-ghost btn-xs btn-circle shrink-0',
        },
      }}
    />
  );
}
