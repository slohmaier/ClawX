/**
 * Read the user's `prefers-reduced-motion` OS setting as a reactive boolean.
 *
 * CSS-only animations are already gated in `globals.css` via the matching
 * media query. This hook exists for animation libraries (Framer Motion,
 * custom `requestAnimationFrame` loops) whose durations live in JS and
 * cannot be tamed by CSS alone.
 *
 * Usage:
 *   const reduce = useReducedMotion();
 *   <motion.div transition={{ duration: reduce ? 0 : 0.3 }} />
 */
import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia(QUERY).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia(QUERY);
    const handler = (event: MediaQueryListEvent) => setReduced(event.matches);
    // addEventListener is supported on all evergreen browsers + Electron.
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return reduced;
}
