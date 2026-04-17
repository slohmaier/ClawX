# Accessibility

ClawX aims for WCAG 2.1 AA conformance and a first-class screen-reader experience on macOS (VoiceOver), Windows (NVDA, JAWS), and Linux (Orca). This document tracks what is in place, what is still in progress, and how to test and extend the work.

## Status matrix

| Area | Status | Notes |
|---|---|---|
| Automated lint (`eslint-plugin-jsx-a11y`) | ✅ active | Hard rules error, heuristic rules warn. See `eslint.config.mjs`. |
| Unit-level axe scans (`jest-axe`) | ✅ wired | Specs under `tests/unit/a11y/`. |
| End-to-end axe scans (`@axe-core/playwright`) | ✅ wired | `tests/e2e/a11y.spec.ts` covers setup wizard and main layout. |
| Skip-to-content link | ⏳ planned | Phase A4. |
| Global live region (announcer) | ⏳ planned | Phase A5. |
| Keyboard shortcut registry + help dialog | ⏳ planned | Phases A6 + D2. |
| Sidebar / session list semantics | ⏳ planned | Phase B1. |
| Chat message article landmarks + streaming announcements | ⏳ planned | Phase B2. |
| Chat input mention-picker keyboard nav | ⏳ planned | Phase B3. |
| ChannelConfigModal → Radix Dialog | ⏳ planned | Phase B4. |
| Settings form `aria-required` / `aria-invalid` | ⏳ planned | Phase B5. |
| Onboarding stepper semantics | ⏳ planned | Phase B6. |
| Toast `role=status` / `role=alert` | ⏳ planned | Phase B7. |
| Route change announcements | ⏳ planned | Phase B8. |
| Gateway connect/disconnect announcements | ⏳ planned | Phase D1. |
| High-contrast / `forced-colors` | ⏳ planned | Phase D3. |
| `prefers-reduced-motion` (CSS) | ✅ respected | `src/styles/globals.css`. Further JS-driven motion audit in D4. |

See [`.claude/plans/partitioned-drifting-candle.md`](.claude/plans/partitioned-drifting-candle.md) for the full execution plan.

## Screen-reader test procedure

### macOS — VoiceOver

1. Enable VoiceOver: `⌘F5` (or System Settings → Accessibility → VoiceOver).
2. Launch ClawX in dev mode: `pnpm dev`.
3. Verify:
   - The first focus stop is the **Skip to main content** link.
   - The sidebar exposes a navigation landmark; session list is announced as a list with date-bucket headings.
   - Sending a chat message announces streaming start, and — when finished — a short completion.
   - Opening a modal traps focus, Escape closes it, focus returns to the trigger.
   - Route changes announce the new page title and move focus to the main region.

### Windows — NVDA

1. Install NVDA from [nvaccess.org](https://www.nvaccess.org/).
2. `NVDA+Space` toggles between browse mode and focus mode — ClawX is fully focus-mode navigable.
3. Same checks as above; additionally verify that `NVDA+F7` lists landmarks and headings cleanly.

### Linux — Orca

1. `Super+Alt+S` toggles Orca.
2. Repeat the VoiceOver checks. Chromium-driven Electron apps generally behave the same as Chrome under Orca.

## Keyboard shortcuts

See [`docs/keyboard-shortcuts.md`](docs/keyboard-shortcuts.md). The in-app shortcut reference dialog is reachable via `⌘/` (macOS) or `Ctrl+/` (Windows/Linux) once Phase D2 ships.

## Contributing

Any PR that touches user-visible UI must:

1. Pass `pnpm run lint` without new `jsx-a11y` violations.
2. Ship an axe test — either a new spec under `tests/unit/a11y/` for a component, or a coverage addition to `tests/e2e/a11y.spec.ts` for a route.
3. Update the appropriate locale files (`src/i18n/locales/{en,zh,ja,ru}/`) for any new `aria-label` / `aria-describedby` strings.
4. Update this file's status matrix if it flips a row from ⏳ to ✅.

Follow the repo-wide Doc Sync rule (`AGENTS.md`): README changes in `README.md` are mirrored into `README.zh-CN.md`, `README.ja-JP.md`, and `README.ru-RU.md` in the same PR.

## Known limitations

- **Deep OpenClaw runtime output** (streaming tool logs, execution graph) is announced as summaries rather than full live-text to avoid screen-reader flooding. The full detail remains navigable as expandable regions.
- **Third-party skill UIs** rendered via the extension registry are not audited here; the skill owner is responsible for their own a11y.

## References

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Radix UI Accessibility](https://www.radix-ui.com/primitives/docs/overview/accessibility)
