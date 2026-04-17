/**
 * Thin React hook around `useAnnouncer` for ergonomic usage in components.
 *
 *   const announce = useAnnounce();
 *   announce('Message sent');                    // polite
 *   announce('Connection lost', 'assertive');    // assertive
 *
 * The returned function is stable across renders so it's safe to put in
 * effect dep arrays or pass to memoized callbacks.
 */
import { useCallback } from 'react';

import { useAnnouncer, type AnnouncePoliteness } from '@/stores/announcerStore';

export function useAnnounce() {
  return useCallback(
    (message: string, politeness: AnnouncePoliteness = 'polite') => {
      useAnnouncer.getState().announce(message, politeness);
    },
    []
  );
}
