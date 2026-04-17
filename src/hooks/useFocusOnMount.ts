/**
 * Focus an element as soon as it mounts (or when `condition` flips true).
 *
 * Useful for:
 *   - Opening a modal and landing focus on the cancel / confirm button.
 *   - Bringing up a mention picker and moving focus to the first option.
 *   - Programmatic focus-restoration after a list re-renders.
 *
 *   const ref = useRef<HTMLButtonElement>(null);
 *   useFocusOnMount(ref, open);   // focus ref.current when `open` is true
 */
import { useEffect, type RefObject } from 'react';

export function useFocusOnMount<T extends HTMLElement>(
  ref: RefObject<T>,
  condition: boolean = true
) {
  useEffect(() => {
    if (!condition) return;
    // rAF so we focus after the element has its final layout (especially
    // after modal open animations that use CSS transitions).
    const id = window.requestAnimationFrame(() => {
      ref.current?.focus();
    });
    return () => window.cancelAnimationFrame(id);
  }, [condition, ref]);
}
