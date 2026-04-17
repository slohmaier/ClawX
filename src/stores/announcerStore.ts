/**
 * Announcer store — the imperative side of ClawX's global ARIA live-region.
 *
 * Pattern:
 *   - `<LiveRegion>` mounts once in MainLayout and subscribes to this store.
 *   - Any code can call `useAnnouncer.getState().announce(msg, politeness)`.
 *   - The store bumps a `nonce` so identical messages re-trigger screen readers
 *     (live regions only announce when text *changes*; repeating the same
 *     string silently is a common gotcha).
 *   - Messages are cleared after a short delay so focus-return doesn't re-read
 *     stale content.
 *
 * Politeness:
 *   - "polite"   (default) — queued, announced when the SR is idle. Use for
 *                            streaming status, route changes, tool results.
 *   - "assertive"          — interrupts current speech. Use sparingly: errors,
 *                            connection loss, destructive-action confirmations.
 */
import { create } from 'zustand';

export type AnnouncePoliteness = 'polite' | 'assertive';

interface AnnouncerState {
  politeMessage: string;
  politeNonce: number;
  assertiveMessage: string;
  assertiveNonce: number;
  announce: (message: string, politeness?: AnnouncePoliteness) => void;
  clear: (politeness?: AnnouncePoliteness) => void;
}

export const useAnnouncer = create<AnnouncerState>((set) => ({
  politeMessage: '',
  politeNonce: 0,
  assertiveMessage: '',
  assertiveNonce: 0,
  announce: (message, politeness = 'polite') => {
    const trimmed = message.trim();
    if (!trimmed) return;
    set((state) =>
      politeness === 'assertive'
        ? { assertiveMessage: trimmed, assertiveNonce: state.assertiveNonce + 1 }
        : { politeMessage: trimmed, politeNonce: state.politeNonce + 1 }
    );
  },
  clear: (politeness) => {
    set((state) => {
      if (politeness === 'assertive') {
        return { assertiveMessage: '', assertiveNonce: state.assertiveNonce + 1 };
      }
      if (politeness === 'polite') {
        return { politeMessage: '', politeNonce: state.politeNonce + 1 };
      }
      return {
        politeMessage: '',
        politeNonce: state.politeNonce + 1,
        assertiveMessage: '',
        assertiveNonce: state.assertiveNonce + 1,
      };
    });
  },
}));
