/**
 * Hook to wire a registered shortcut (from `src/lib/shortcuts.ts`) to a handler.
 *
 *   useShortcut('sidebar.toggle', () => setSidebarCollapsed(v => !v));
 *
 * The hook:
 *   - Resolves the shortcut spec from the registry by id.
 *   - Skips firing when the target is a text field (input/textarea/contenteditable)
 *     unless the spec explicitly opts in — prevents ⌘N from stealing focus
 *     from a chat composer.
 *   - Honours an optional `enabled` flag so consumers can conditionally
 *     disable without unmounting.
 *
 * For in-component scoped shortcuts (e.g. ArrowDown inside a menu),
 * use a local keydown handler — this hook is for app-wide defaults.
 */
import { useEffect } from 'react';

import { getShortcut, matchesShortcut } from '@/lib/shortcuts';

interface Options {
  enabled?: boolean;
  /** Fire even when focus is in an input/textarea/contenteditable. */
  allowInTextFields?: boolean;
  /** Call `event.preventDefault()` when the handler fires. Default: true. */
  preventDefault?: boolean;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  return false;
}

export function useShortcut(
  id: string,
  handler: (event: KeyboardEvent) => void,
  { enabled = true, allowInTextFields = false, preventDefault = true }: Options = {}
) {
  useEffect(() => {
    if (!enabled) return;
    const shortcut = getShortcut(id);
    if (!shortcut) {
      if (typeof console !== 'undefined') {
        console.warn(`[useShortcut] unknown shortcut id: ${id}`);
      }
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (shortcut.when && !shortcut.when()) return;
      if (!allowInTextFields && isEditableTarget(event.target)) return;
      if (!matchesShortcut(event, shortcut.keys)) return;
      if (preventDefault) event.preventDefault();
      handler(event);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [id, handler, enabled, allowInTextFields, preventDefault]);
}
