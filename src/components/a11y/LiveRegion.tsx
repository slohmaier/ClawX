/**
 * Global ARIA live-region.
 *
 * Mount ONCE at the root (MainLayout). The component renders two visually
 * hidden <div>s — one polite, one assertive — driven by `useAnnouncer`.
 *
 * Why two regions instead of toggling the aria-live attribute?
 *   - Screen readers cache a region's politeness at DOM insertion time;
 *     flipping aria-live at runtime is inconsistent across VO/NVDA/JAWS.
 *   - Keeping both mounted lets callers choose per-message without races.
 *
 * Why the `nonce`-driven text reset?
 *   - Live regions only announce when the *text* changes. Repeating the same
 *     message silently does nothing. We blank the DOM for one tick and then
 *     write the new text on the next macrotask so every call speaks.
 */
import { useEffect, useRef } from 'react';

import { useAnnouncer } from '@/stores/announcerStore';

const srOnly =
  'absolute h-px w-px overflow-hidden whitespace-nowrap border-0 p-0 [clip:rect(0_0_0_0)]';

export function LiveRegion() {
  const politeMessage = useAnnouncer((s) => s.politeMessage);
  const politeNonce = useAnnouncer((s) => s.politeNonce);
  const assertiveMessage = useAnnouncer((s) => s.assertiveMessage);
  const assertiveNonce = useAnnouncer((s) => s.assertiveNonce);

  const politeRef = useRef<HTMLDivElement>(null);
  const assertiveRef = useRef<HTMLDivElement>(null);

  // We mutate textContent directly rather than via React state so we can
  // perform the clear-then-set dance without tripping React's
  // "setState-in-effect" lint (and without extra re-renders). The live region
  // DOM is still owned by React — we're just bypassing its render cycle for
  // transient text manipulation that screen readers need.
  useEffect(() => {
    const node = politeRef.current;
    if (!node) return;
    node.textContent = '';
    if (!politeMessage) return;
    const id = window.setTimeout(() => {
      if (politeRef.current) politeRef.current.textContent = politeMessage;
    }, 40);
    return () => window.clearTimeout(id);
  }, [politeMessage, politeNonce]);

  useEffect(() => {
    const node = assertiveRef.current;
    if (!node) return;
    node.textContent = '';
    if (!assertiveMessage) return;
    const id = window.setTimeout(() => {
      if (assertiveRef.current) assertiveRef.current.textContent = assertiveMessage;
    }, 40);
    return () => window.clearTimeout(id);
  }, [assertiveMessage, assertiveNonce]);

  return (
    <>
      <div
        ref={politeRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={srOnly}
      />
      <div
        ref={assertiveRef}
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className={srOnly}
      />
    </>
  );
}
