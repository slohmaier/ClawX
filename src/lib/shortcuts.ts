/**
 * Typed keyboard shortcut registry.
 *
 * Single source of truth for everything the in-app shortcut-help dialog
 * (Phase D2) will render, and the target of `useShortcut` / `useGlobalShortcuts`.
 *
 * Conventions:
 *   - `id`       — stable key, also the i18n namespace under `shortcuts.<id>`.
 *   - `keys`     — normalized spec; `Mod` maps to ⌘ on macOS and Ctrl elsewhere.
 *   - `scope`    — "global" fires anywhere; "chat" / "sidebar" / "modal" may be
 *                  gated by the consuming component.
 *   - `when`     — optional runtime predicate (e.g. disable during IME compose).
 *
 * Adding a shortcut:
 *   1. Add an entry here.
 *   2. Add `shortcuts.<id>.{label,description}` to all four locale files
 *      (`src/i18n/locales/{en,zh,ja,ru}/common.json`).
 *   3. Update `docs/keyboard-shortcuts.md`.
 *   4. Wire the handler with `useShortcut(id, handler)`.
 */

export type ShortcutScope = 'global' | 'chat' | 'sidebar' | 'modal';

/**
 * Logical modifier names. Normalization to the platform happens in the matcher.
 *   - `Mod`   — ⌘ on macOS, Ctrl on Windows/Linux (mirrors VS Code's convention).
 *   - `Shift` / `Alt` — same on every platform.
 */
export type ShortcutModifier = 'Mod' | 'Shift' | 'Alt' | 'Ctrl' | 'Meta';

export interface ShortcutSpec {
  /** Modifiers required, in any order. */
  modifiers?: ShortcutModifier[];
  /**
   * Non-modifier key. Values come from `KeyboardEvent.key` (e.g. 'k', '/', 'Escape').
   * Case is normalized lowercase for letter keys.
   */
  key: string;
}

export interface ShortcutDefinition {
  id: string;
  scope: ShortcutScope;
  keys: ShortcutSpec;
  /** Optional — if omitted, the shortcut still fires. */
  when?: () => boolean;
}

/**
 * Registry seed. Handlers are attached at runtime via `useShortcut`; this list
 * is the declarative manifest for the help dialog and platform normalization.
 */
export const SHORTCUTS: ShortcutDefinition[] = [
  {
    id: 'help.open',
    scope: 'global',
    keys: { modifiers: ['Mod'], key: '/' },
  },
  {
    id: 'command.palette',
    scope: 'global',
    keys: { modifiers: ['Mod'], key: 'k' },
  },
  {
    id: 'sidebar.toggle',
    scope: 'global',
    keys: { modifiers: ['Mod'], key: 'b' },
  },
  {
    id: 'settings.open',
    scope: 'global',
    keys: { modifiers: ['Mod'], key: ',' },
  },
  {
    id: 'chat.new',
    scope: 'global',
    keys: { modifiers: ['Mod'], key: 'n' },
  },
  {
    id: 'chat.send',
    scope: 'chat',
    keys: { key: 'Enter' },
  },
  {
    id: 'chat.newline',
    scope: 'chat',
    keys: { modifiers: ['Shift'], key: 'Enter' },
  },
  {
    id: 'modal.close',
    scope: 'modal',
    keys: { key: 'Escape' },
  },
];

export function isMacPlatform(): boolean {
  if (typeof navigator === 'undefined') return false;
  // navigator.platform is deprecated; userAgent is the best we have in Electron.
  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);
}

/**
 * Returns true when the given KeyboardEvent matches the spec on the current
 * platform. Handles the `Mod` → ⌘/Ctrl abstraction and normalizes letter keys.
 */
export function matchesShortcut(event: KeyboardEvent, spec: ShortcutSpec): boolean {
  const isMac = isMacPlatform();
  const mods = spec.modifiers ?? [];

  const needsMeta = mods.includes('Meta') || (isMac && mods.includes('Mod'));
  const needsCtrl = mods.includes('Ctrl') || (!isMac && mods.includes('Mod'));
  const needsShift = mods.includes('Shift');
  const needsAlt = mods.includes('Alt');

  if (Boolean(event.metaKey) !== needsMeta) return false;
  if (Boolean(event.ctrlKey) !== needsCtrl) return false;
  if (Boolean(event.shiftKey) !== needsShift) return false;
  if (Boolean(event.altKey) !== needsAlt) return false;

  const eventKey = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  const specKey = spec.key.length === 1 ? spec.key.toLowerCase() : spec.key;
  return eventKey === specKey;
}

/**
 * Platform-aware display string (e.g. "⌘K" on Mac, "Ctrl+K" on Win/Linux).
 * Used by the help dialog.
 */
export function formatShortcut(spec: ShortcutSpec): string {
  const isMac = isMacPlatform();
  const mods = spec.modifiers ?? [];
  const parts: string[] = [];

  for (const mod of mods) {
    if (mod === 'Mod') parts.push(isMac ? '⌘' : 'Ctrl');
    else if (mod === 'Meta') parts.push(isMac ? '⌘' : 'Win');
    else if (mod === 'Ctrl') parts.push('Ctrl');
    else if (mod === 'Shift') parts.push(isMac ? '⇧' : 'Shift');
    else if (mod === 'Alt') parts.push(isMac ? '⌥' : 'Alt');
  }

  const keyLabel =
    spec.key === ' ' ? 'Space' :
    spec.key.length === 1 ? spec.key.toUpperCase() :
    spec.key;
  parts.push(keyLabel);

  return isMac ? parts.join('') : parts.join('+');
}

export function getShortcut(id: string): ShortcutDefinition | undefined {
  return SHORTCUTS.find((s) => s.id === id);
}
