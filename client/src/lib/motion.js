/**
 * Shared motion tokens for the Kinetic Moss / Apple-fluid feel.
 *
 * These mirror the CSS custom properties in index.css (`--ease-out`,
 * `--dur-*`). Import from framer-motion callers as touched, so all animation
 * — CSS and JS — sings the same house tune.
 */

// House curve — strong initial acceleration then a long calm settle. Same
// bezier used in `.glass-card`, `.pressable`, `.page-enter`, and CategoryRow's
// width transition. Never use easeInOut for exits (they feel sluggish); use
// EASE for both, and clip exits ~30% shorter than enters.
export const EASE = [0.22, 1, 0.36, 1];

// Snappy interruptible spring — the BottomNav / DaySelector active indicator.
export const SPRING = { type: 'spring', stiffness: 500, damping: 40 };

// Durations, in ms (framer wants numbers here, CSS wants seconds — see index.css).
export const DUR = {
  press: 160,
  fast: 200,
  base: 250,
};
