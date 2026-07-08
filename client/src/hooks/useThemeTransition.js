import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Sparkles, Sun } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';

const CLASSIC = 'ultragrade-classic';
const LIGHT = 'ultragrade-light';

// Two coexisting themes. The toggle flips between them; Settings jumps directly.
export const THEMES = [CLASSIC, LIGHT];
export const THEME_META = {
  [CLASSIC]: { label: 'Classic', hint: 'Electric lime', Icon: Sparkles },
  [LIGHT]: { label: 'Light', hint: 'Emerald day', Icon: Sun },
};

const normalize = (t) => (THEMES.includes(t) ? t : CLASSIC);
const nextInCycle = (t) => THEMES[(THEMES.indexOf(normalize(t)) + 1) % THEMES.length];

const DURATION = 650;
const EASE = 'cubic-bezier(0.33, 0, 0.15, 1)';
// The toggle stays LOCKED (disabled, visibly dimmed) from sweep start until
// COOLDOWN elapses — that's the rate limit. There is deliberately no queue:
// a locked control that ignores input is honest UX; deferred catch-up sweeps
// raced the settings persist and produced un-animated cross-fade commits.
const COOLDOWN = DURATION + 350;

// ── Module-level lock, shared by every mounted instance (Sidebar / Header /
// Login / Settings) — only one document-level view transition can exist at a
// time, so the lock must be global, and every toggle button must dim at once.
let locked = false;
let lockTimer = null;
const subscribers = new Set();
const setLocked = (v) => {
  if (locked === v) return;
  locked = v;
  subscribers.forEach((fn) => fn());
};
const subscribe = (fn) => { subscribers.add(fn); return () => subscribers.delete(fn); };
const getLocked = () => locked;

let activeTransition = null;

// Lets App.jsx's data-theme reconciler stay quiet while a sweep is composing —
// a setAttribute from outside the transition callback mutates the live page
// being revealed.
export function isThemeSweepActive() {
  return activeTransition !== null;
}

const setAttr = (t) => document.documentElement.setAttribute('data-theme', t);

/**
 * Content-aware circular reveal via the View Transitions API: the browser
 * snapshots the page in the OLD theme, the NEW theme is applied underneath,
 * and a hard circular clip on `::view-transition-new(root)` grows out of the
 * click point — real content on both sides of the wavefront at all times.
 *
 * Stability rules — each earned by a real "Aw, Snap" (renderer error 5):
 * 1. NEVER two snapshots in flight or closer than COOLDOWN apart. Enforced by
 *    the lock: while a sweep runs (+ cooldown) every toggle is `disabled` and
 *    `apply()` ignores calls outright. Snapshot storms are what froze the
 *    renderer (>10 clicks/sec with interrupt-and-restart, and still with
 *    chained coalesced sweeps).
 * 2. The clip animation has NO `fill:'forwards'` and is explicitly cancelled
 *    on finish — forwards-filled animations targeting
 *    `::view-transition-new(root)` outlive their transition, re-attach to
 *    every later transition's pseudo, and accumulate without bound.
 * 3. `html.theme-switching` freezes the universal 150ms colour transition
 *    during the swap — otherwise every themed element spawns its own
 *    CSSTransition beneath the snapshot (thousands per sweep).
 * 4. A hidden tab never starts or keeps a transition (paused rendering never
 *    resolves ready/finished): instant swap on start, `skipTransition()` on
 *    visibilitychange, DURATION+400ms watchdog as last resort.
 */
function startSweep(next, x, y) {
  const root = document.documentElement;
  if (root.getAttribute('data-theme') === next) return;
  if (document.hidden || typeof document.startViewTransition !== 'function') {
    setAttr(next);
    return;
  }

  setLocked(true);
  clearTimeout(lockTimer);
  lockTimer = setTimeout(() => setLocked(false), COOLDOWN);

  const transition = document.startViewTransition(() => {
    root.classList.add('theme-switching');
    setAttr(next);
  });
  activeTransition = transition;

  let clipAnim = null;
  const forceFinish = () => { try { transition.skipTransition(); } catch { /* already done */ } };
  const onVisibilityChange = () => { if (document.hidden) forceFinish(); };
  document.addEventListener('visibilitychange', onVisibilityChange);
  const watchdog = setTimeout(forceFinish, DURATION + 400);

  const cleanup = () => {
    clearTimeout(watchdog);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    try { clipAnim && clipAnim.cancel(); } catch { /* already gone */ }
    if (activeTransition === transition) activeTransition = null;
    // Unfreeze one frame later so the committed colours are on screen before
    // per-element transitions come back.
    setTimeout(() => root.classList.remove('theme-switching'), 30);
  };
  transition.finished.then(cleanup, cleanup);

  transition.ready.then(() => {
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 2;
    clipAnim = root.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
      // No `fill: 'forwards'` — see rule 2. When the clip finishes, the
      // unclipped pseudo shows the identical fully-revealed frame.
      { duration: DURATION, easing: EASE, pseudoElement: '::view-transition-new(root)' },
    );
  }).catch(() => {
    // skipped before it was ready — data-theme is already applied
  });
}

export function useThemeTransition() {
  const { settings, updateSettings } = useApp();
  const theme = normalize(settings.theme);

  // All mounted toggles share the lock — every button dims together.
  const busy = useSyncExternalStore(subscribe, getLocked, getLocked);

  const [displayTheme, setDisplayTheme] = useState(theme);
  useEffect(() => { setDisplayTheme(theme); }, [theme]);

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

  const apply = (next, event, { force = false } = {}) => {
    // The toggle hard-drops while locked (its button is disabled anyway).
    // Deliberate selections (Settings segmented control, onboarding picker)
    // pass force: they must never be silently lost, so while locked they
    // apply instantly instead of sweeping — never a second snapshot.
    if (locked && !force) return;

    const t = normalize(next);
    setDisplayTheme(t); // icon/label flip on ACCEPTED changes only

    persist(t);

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    const x = event && typeof event.clientX === 'number' ? event.clientX : null;
    const y = event && typeof event.clientY === 'number' ? event.clientY : null;

    if (locked || reduce || x == null || typeof document.startViewTransition !== 'function') {
      setAttr(t);
      return;
    }
    startSweep(t, x, y);
  };

  const toggle = (event) => {
    const base = normalize(document.documentElement.getAttribute('data-theme'));
    apply(nextInCycle(base), event);
  };
  const setTheme = (next, event) => apply(next, event, { force: true });

  // onClick fires for mouse, touch, and keyboard (Enter/Space) alike, and
  // carries the click coordinates so the reveal blooms from the pointer.
  // Keyboard-synthesised clicks report (0,0) → fall back to the button centre.
  // While locked the button is `disabled` (visibly inactive, unclickable) —
  // and even a click that sneaks through another path is ignored by apply().
  const toggleProps = {
    onClick: (e) => {
      let x = e.clientX, y = e.clientY;
      if (!x && !y) {
        const r = e.currentTarget.getBoundingClientRect();
        x = r.left + r.width / 2; y = r.top + r.height / 2;
      }
      toggle({ clientX: x, clientY: y });
    },
    disabled: busy,
    'aria-busy': busy || undefined,
    'data-theme-toggle': '',
  };

  return {
    theme: displayTheme,
    busy,
    meta: THEME_META[displayTheme] || THEME_META[CLASSIC],
    nextMeta: THEME_META[nextInCycle(displayTheme)] || THEME_META[CLASSIC],
    isLight: displayTheme === LIGHT,
    toggle,
    setTheme,
    toggleProps,
  };
}
