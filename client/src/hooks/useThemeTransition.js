import { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';

const DARK = 'ultragrade-dark';
const LIGHT = 'ultragrade-light';
const DURATION = 550; // ms — the reveal sweep
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

/**
 * Theme switching with a content-aware, chainable circular reveal.
 *
 * The browser snapshots the page in both themes (View Transitions API) and we
 * drive a growing circular clip on the *new* snapshot via WAAPI, so each element
 * repaints into the new theme as the wave passes over it — nothing is hidden.
 *
 * Chaining: a click during a reveal interrupts it (`skipTransition()`) and starts
 * a fresh wave from the new click point, so every click fires its own wave. A
 * `target` ref tracks the latest theme synchronously and the icon/label flip
 * instantly via `displayTheme`, so rapid toggles resolve to the correct final
 * theme with no `InvalidStateError`.
 *
 * Chrome collapses the captured page to the root snapshot for hit-testing during a
 * transition (a click over the toggle resolves to <html>, so its onClick never
 * fires), so we also delegate the toggle at the window level — see the effect.
 */
export function useThemeTransition() {
  const { settings, updateSettings } = useApp();
  const theme = settings.theme || DARK;

  // Icon/label reflect the target the instant you click (optimistic).
  const [displayTheme, setDisplayTheme] = useState(theme);
  useEffect(() => { setDisplayTheme(theme); }, [theme]);

  const target = useRef(null); // desired final theme, set synchronously per click
  const origin = useRef({ x: null, y: null });
  const busy = useRef(false);
  const active = useRef(null); // in-flight ViewTransition, so we can interrupt it

  const applied = () => document.documentElement.getAttribute('data-theme') || theme;

  // Persist debounced + de-duped: rapid chaining coalesces to one write, and a
  // chain that returns to its starting theme writes nothing — that stray re-render
  // was the "repaint after the last wave".
  const lastPersisted = useRef(theme);
  useEffect(() => { lastPersisted.current = theme; }, [theme]);
  const persistTimer = useRef(null);
  const persist = (value) => {
    clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      if (lastPersisted.current === value) return;
      lastPersisted.current = value;
      updateSettings({ theme: value });
    }, 250);
  };
  useEffect(() => () => clearTimeout(persistTimer.current), []);

  const reveal = (next, x, y, done) => {
    const root = document.documentElement;
    const supported = typeof document.startViewTransition === 'function';
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

    if (!supported || reduce || x == null) {
      root.setAttribute('data-theme', next);
      done();
      return;
    }

    // Idempotent — the class spans the whole chain (removed once, on settle, in
    // step), so the colour-freeze recalc happens twice per chain, not per wave.
    root.classList.add('theme-switching');
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    const transition = document.startViewTransition(() => {
      root.setAttribute('data-theme', next);
    });
    active.current = transition;

    transition.ready
      .then(() => {
        root.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${endRadius}px at ${x}px ${y}px)`,
            ],
          },
          { duration: DURATION, easing: EASE, pseudoElement: '::view-transition-new(root)', fill: 'backwards' },
        );
      })
      .catch(() => {});

    transition.finished
      .catch(() => {})
      .finally(() => {
        if (active.current === transition) active.current = null;
        done();
      });
  };

  const step = () => {
    if (busy.current) return;
    const next = target.current;
    if (!next || next === applied()) {
      // Chain settled: drop the sweep class and persist ONCE, with the final theme.
      // Persisting per-wave instead fired a stale value mid-chain (debounce < chain
      // length), which the App.jsx reconciler then wrote back — desyncing the DOM so
      // the chain never settled (stuck class, flip-back repaint).
      document.documentElement.classList.remove('theme-switching');
      persist(applied());
      return;
    }
    busy.current = true;
    reveal(next, origin.current.x, origin.current.y, () => {
      busy.current = false;
      step(); // continue if the target moved again while animating
    });
  };

  const apply = (next, event) => {
    target.current = next;
    setDisplayTheme(next);
    origin.current = {
      x: event && typeof event.clientX === 'number' ? event.clientX : null,
      y: event && typeof event.clientY === 'number' ? event.clientY : null,
    };
    // Interrupt the running wave so this click fires a fresh one from its point;
    // otherwise start the first wave. step() then resolves to the latest target.
    if (busy.current) active.current?.skipTransition?.();
    else step();
  };

  const currentTarget = () => target.current ?? applied();
  const toggle = (event) => apply(currentTarget() === DARK ? LIGHT : DARK, event);
  const setTheme = (next, event) => apply(next, event);

  // Props for the toggle button. Firing on **pointerdown** (not click) means a
  // single physical click can never trigger two paths — the old onClick-based setup
  // double-fired at the sweep boundary: a press during a wave was caught by the
  // window delegation (interrupt), then the click that landed after the wave ended
  // fired the button's onClick too (restart). Now an idle press hits the button's
  // onPointerDown; a press during a sweep (hit-testing collapsed to <html>) is
  // caught by the window delegation. The shared event's `__themeToggleHandled` flag
  // dedupes the rare overlap. Keyboard uses onKeyDown, origin at the button centre.
  const toggleProps = {
    onPointerDown: (e) => { if (e.button === 0 && !e.__themeToggleHandled) toggle(e); },
    onKeyDown: (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      const r = e.currentTarget.getBoundingClientRect();
      toggle({ clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 });
    },
    'data-theme-toggle': '',
  };

  // Keep the toggle live mid-sweep. Hit-testing (clicks AND elementFromPoint)
  // collapses to <html> during a transition, so the button's onClick never fires.
  // The raw pointer event still reaches window and the button keeps a valid layout
  // box, so we match the pointer against [data-theme-toggle]'s bounding rect
  // (coordinate match, NOT hit-testing) and fire the toggle ourselves. Only while a
  // transition runs — otherwise the button's native click handles it (no double
  // fire); the __themeToggleHandled flag dedupes the Sidebar+Header listener pair.
  const toggleRef = useRef(toggle);
  toggleRef.current = toggle;
  useEffect(() => {
    const onPointerDown = (e) => {
      if (e.__themeToggleHandled || !busy.current || e.button !== 0) return;
      for (const btn of document.querySelectorAll('[data-theme-toggle]')) {
        const r = btn.getBoundingClientRect();
        if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
          e.__themeToggleHandled = true;
          toggleRef.current(e);
          return;
        }
      }
    };
    window.addEventListener('pointerdown', onPointerDown, true);
    return () => window.removeEventListener('pointerdown', onPointerDown, true);
  }, []);

  return { theme: displayTheme, isDark: displayTheme === DARK, toggle, setTheme, toggleProps };
}
