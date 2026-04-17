# Keyboard shortcuts

Single source of truth for all ClawX keyboard shortcuts. The in-app **Keyboard shortcuts** dialog (`⌘/` on macOS, `Ctrl+/` elsewhere, once Phase D2 ships) renders directly from the registry that reflects this list.

Shortcuts use macOS notation below. On Windows/Linux, replace `⌘` with `Ctrl`, `⌥` with `Alt`, and `⇧` with `Shift`.

## Global

| Shortcut | Action |
|---|---|
| `⌘/` | Open keyboard shortcuts reference |
| `⌘K` | Open command / session search |
| `⌘B` | Toggle sidebar |
| `⌘,` | Open settings |
| `Esc` | Close the active modal / dismiss popovers |

## Chat

| Shortcut | Action |
|---|---|
| `Enter` | Send message |
| `⇧Enter` | Insert newline |
| `@` | Open agent mention picker |
| `↑` / `↓` (in mention picker) | Move selection |
| `Home` / `End` (in mention picker) | Jump to first / last |
| `Enter` (in mention picker) | Insert selected agent |
| `Esc` (in mention picker) | Close picker, keep caret |

## Sidebar

| Shortcut | Action |
|---|---|
| `⌘N` | New chat session |
| `⌘⇧]` | Next session |
| `⌘⇧[` | Previous session |

## Modals

| Shortcut | Action |
|---|---|
| `Tab` / `⇧Tab` | Move focus through focusable elements (wrapped) |
| `Enter` | Activate the default button |
| `Esc` | Cancel / close |

## Adding or changing shortcuts

1. Update this file.
2. Add or edit the entry in `src/lib/shortcuts.ts` (landing in Phase A6).
3. Add or update localized labels/descriptions in each locale file:
   - `src/i18n/locales/en/common.json`
   - `src/i18n/locales/zh/common.json`
   - `src/i18n/locales/ja/common.json`
   - `src/i18n/locales/ru/common.json`
4. If the shortcut affects a user-visible flow, update `README.md` and its translated siblings per the Doc Sync rule in `AGENTS.md`.
