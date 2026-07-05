import { useApp } from '../context/AppContext.jsx';

const DARK = 'ultragrade-dark';
const LIGHT = 'ultragrade-light';

/**
 * Theme switching with a fluid circular-reveal animation.
 *
 * Uses the View Transitions API to expand the new theme from the click origin.
 * Falls back to an instant switch when the API is unavailable or the user prefers
 * reduced motion. Persistence goes through `updateSettings` (Supabase-backed);
 * the attribute is also set synchronously here so the transition captures it.
 */
export function useThemeTransition() {
  const { settings, updateSettings } = useApp();
  const theme = settings.theme || DARK;

  const apply = (next, event) => {
    const root = document.documentElement;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

    // Origin for the reveal — the pointer position, or top-center for keyboard toggles.
    if (event && typeof event.clientX === 'number' && (event.clientX || event.clientY)) {
      root.style.setProperty('--vt-x', `${event.clientX}px`);
      root.style.setProperty('--vt-y', `${event.clientY}px`);
    } else {
      root.style.setProperty('--vt-x', '50%');
      root.style.setProperty('--vt-y', '0px');
    }

    const commit = () => root.setAttribute('data-theme', next);

    if (!reduce && typeof document.startViewTransition === 'function') {
      try {
        const transition = document.startViewTransition(commit);
        // A transition can be aborted (rapid re-toggle, navigation mid-reveal).
        // Both `ready` and `finished` reject on abort — swallow both so it never
        // surfaces as an unhandled rejection.
        transition.ready?.catch(() => {});
        transition.finished?.catch(() => {});
      } catch {
        commit();
      }
    } else {
      commit();
    }
    updateSettings({ theme: next });
  };

  const toggle = (event) => apply(theme === DARK ? LIGHT : DARK, event);
  const setTheme = (next, event) => apply(next, event);

  return { theme, isDark: theme === DARK, toggle, setTheme };
}
