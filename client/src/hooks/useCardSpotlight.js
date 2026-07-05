import { useEffect } from 'react';

/**
 * A single, app-wide pointer spotlight for glass surfaces.
 *
 * Rather than wiring a listener into every card, this mounts one delegated
 * `pointermove` handler that finds the `.glass-card` under the cursor and
 * writes `--mx`/`--my` (pointer position, in px, relative to the card) plus
 * `--spot` (fade-in flag). The CSS `.glass-card::before` radial-gradient reads
 * those variables, so the highlight tracks the cursor — subtle, non-blocking,
 * and free of per-frame React renders.
 *
 * Call once, high in the tree (Layout). No-ops for coarse pointers (touch) and
 * for users who prefer reduced motion.
 */
export function useCardSpotlight() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const fine = window.matchMedia?.('(pointer: fine)').matches;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!fine || reduced) return;

    let current = null;
    let frame = 0;
    let pending = null;

    const paint = () => {
      frame = 0;
      if (!pending) return;
      const { card, x, y } = pending;
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${x - rect.left}px`);
      card.style.setProperty('--my', `${y - rect.top}px`);
      card.style.setProperty('--spot', '1');
    };

    const onMove = (e) => {
      const card = e.target?.closest?.('.glass-card');
      if (card !== current) {
        if (current) current.style.setProperty('--spot', '0');
        current = card || null;
      }
      if (!card) return;
      pending = { card, x: e.clientX, y: e.clientY };
      if (!frame) frame = requestAnimationFrame(paint);
    };

    const onLeave = () => {
      if (current) current.style.setProperty('--spot', '0');
      current = null;
    };

    document.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    window.addEventListener('blur', onLeave);

    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('blur', onLeave);
      if (frame) cancelAnimationFrame(frame);
      if (current) current.style.setProperty('--spot', '0');
    };
  }, []);
}
