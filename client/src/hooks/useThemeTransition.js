import { useEffect, useRef, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';

const CLASSIC = 'ultragrade-classic';
const LIGHT = 'ultragrade-light';

// Two themes. Ids stay stable (they're persisted in user settings); only the
// user-facing labels changed to plain "Dark" / "Light".
export const THEMES = [CLASSIC, LIGHT];
export const THEME_META = {
  [CLASSIC]: { label: 'Dark', hint: 'Ink and evergreen', Icon: Moon },
  [LIGHT]: { label: 'Light', hint: 'Pearl and evergreen', Icon: Sun },
};

// Opaque page colour per theme (base-100) — drives <meta name="theme-color">
// so the iOS/Android browser chrome matches the page.
export const THEME_COLOR = { [CLASSIC]: '#101612', [LIGHT]: '#f5f6f3' };

// Pre-paint key read by the inline script in index.html. Settings themselves
// are namespaced per user, which the pre-paint script can't know.
export const THEME_STORAGE_KEY = 'ultragrade_theme';

const normalize = (t) => (THEMES.includes(t) ? t : CLASSIC);
const nextInCycle = (t) => THEMES[(THEMES.indexOf(normalize(t)) + 1) % THEMES.length];

/** Apply a theme to the document instantly (no transition, no fade). */
export function applyThemeToDocument(theme) {
  const t = normalize(theme);
  const root = document.documentElement;
  if (root.getAttribute('data-theme') !== t) root.setAttribute('data-theme', t);
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', THEME_COLOR[t]));
  try { localStorage.setItem(THEME_STORAGE_KEY, t); } catch { /* storage unavailable */ }
}

// Kept for App.jsx's data-theme reconciler; theme swaps are synchronous now.
export function isThemeSweepActive() {
  return false;
}

export function useThemeTransition() {
  const { settings, updateSettings } = useApp();
  const theme = normalize(settings.theme);

  const [displayTheme, setDisplayTheme] = useState(theme);
  useEffect(() => { setDisplayTheme(theme); }, [theme]);

  // Debounced persist so rapid toggling doesn't fire a settings write per tap.
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

  const setTheme = (next) => {
    const t = normalize(next);
    setDisplayTheme(t);
    applyThemeToDocument(t);
    persist(t);
  };

  const toggle = () => setTheme(nextInCycle(document.documentElement.getAttribute('data-theme')));

  const toggleProps = { onClick: toggle, 'data-theme-toggle': '' };

  return {
    theme: displayTheme,
    busy: false,
    meta: THEME_META[displayTheme] || THEME_META[CLASSIC],
    nextMeta: THEME_META[nextInCycle(displayTheme)] || THEME_META[CLASSIC],
    isLight: displayTheme === LIGHT,
    toggle,
    setTheme,
    toggleProps,
  };
}
