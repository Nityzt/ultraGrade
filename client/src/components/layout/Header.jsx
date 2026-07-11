import { useEffect, useState, useRef } from 'react';
import { useThemeTransition } from '../../hooks/useThemeTransition.js';

/**
 * useScrolled — micro hook: true once the passed scroll container has scrolled
 * past `threshold` px. Passive listener, rAF-throttled so a fast scroll never
 * fires more than 60 setStates/sec. iOS Safari doesn't support scroll-driven
 * animation-timeline yet — so this is a plain listener, not @scroll-timeline.
 */
function useScrolled(threshold = 8) {
  const [scrolled, setScrolled] = useState(false);
  const raf = useRef(0);
  useEffect(() => {
    // The scrolling element is the <main> — Layout gives it `overflow-y-auto`.
    const el = document.getElementById('main');
    if (!el) return;
    const read = () => {
      raf.current = 0;
      setScrolled(el.scrollTop > threshold);
    };
    const onScroll = () => {
      if (raf.current) return;
      raf.current = requestAnimationFrame(read);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    // Prime once (route change may leave us mid-scroll).
    read();
    return () => {
      el.removeEventListener('scroll', onScroll);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [threshold]);
  return scrolled;
}

/**
 * Unified sticky glass header — evolved from the original app bar to also
 * absorb the ex-PageHeader responsibilities (subtitle, icon chip).
 *
 * Scroll-edge treatment: no permanent bottom border; the hairline appears only
 * once the page has scrolled past a few pixels — that's the Apple app-bar cue.
 * The scrolled state also switches to a heavier glass fill for legibility on
 * the mobile no-blur fallback (see index.css mobile media query).
 */
export default function Header({ title, subtitle, icon: Icon, actions }) {
  const { meta, nextMeta, toggleProps } = useThemeTransition();
  const ThemeIcon = meta.Icon;
  const scrolled = useScrolled(8);

  return (
    <header
      className={`no-print sticky top-0 z-30 flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4 px-4 md:px-6 pb-4 pt-[calc(0.9rem+env(safe-area-inset-top,0px))] transition-[background-color,box-shadow,backdrop-filter] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        scrolled
          ? 'bg-base-100/92 backdrop-blur-xl shadow-[0_1px_0_0_hsl(var(--b3)/0.6)]'
          : 'bg-base-100/70 backdrop-blur-xl'
      }`}
    >
      <div className="min-w-0 flex items-center gap-2.5">
        {Icon && (
          <span className="w-9 h-9 rounded-2xl bg-primary/12 border border-primary/20 flex items-center justify-center shrink-0">
            <Icon size={18} className="text-primary" />
          </span>
        )}
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-display font-bold text-base-content tracking-tight leading-tight truncate">
            {title}<span className="text-primary">.</span>
          </h1>
          {subtitle && (
            <p className="text-sm text-base-content/55 mt-0.5 truncate">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {actions}
        <button
          {...toggleProps}
          className="btn btn-sm btn-ghost btn-circle pressable md:hidden text-base-content/50 hover:text-primary"
          aria-label={`Theme: ${meta.label}. Click to switch to ${nextMeta.label}`}
          title={`${meta.label} — tap for ${nextMeta.label}`}
        >
          <ThemeIcon size={16} />
        </button>
      </div>
    </header>
  );
}
