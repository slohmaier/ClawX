/**
 * Route-transition announcer.
 *
 * Mount ONCE near the router root (e.g. in App.tsx, inside the HashRouter).
 * On every path change it:
 *   1. Announces the new route's title via the polite live region.
 *   2. Updates document.title so the OS window/screen-reader both pick up
 *      the new page.
 *   3. Moves keyboard focus to `#main-content` so Tab/SR users land on the
 *      newly rendered view, not on whatever was focused on the previous page.
 *
 * `useRouteTitle` is exported separately so MainLayout can render an
 * `sr-only <h1>` that mirrors the announced title — belt-and-braces for SRs
 * that don't honor live-region-only announcements on navigation.
 */
import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useAnnounce } from './useAnnounce';

interface Options {
  /** Skip the first mount — many apps don't want to announce the initial load. */
  skipInitial?: boolean;
}

/**
 * Map of route paths to translation keys (under the `common.sidebar` namespace,
 * since those labels already exist). Extend as new routes land.
 */
const ROUTE_TITLE_KEYS: Record<string, string> = {
  '/': 'sidebar.chat',
  '/models': 'sidebar.models',
  '/agents': 'sidebar.agents',
  '/channels': 'sidebar.channels',
  '/skills': 'sidebar.skills',
  '/cron': 'sidebar.cronTasks',
  '/settings': 'sidebar.settings',
};

const APP_TITLE = 'ClawX';

function routeTitleFor(pathname: string, t: ReturnType<typeof useTranslation>['t']): string {
  // Match longest prefix first so `/settings/general` falls back to `/settings`.
  const sorted = Object.keys(ROUTE_TITLE_KEYS).sort((a, b) => b.length - a.length);
  for (const prefix of sorted) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return t(ROUTE_TITLE_KEYS[prefix]);
    }
  }
  return pathname;
}

/**
 * Resolves the localised title for the current route. Use from anywhere that
 * needs to render the page title (e.g. MainLayout's `sr-only <h1>`).
 */
export function useRouteTitle(): string {
  const location = useLocation();
  const { t } = useTranslation('common');
  return useMemo(() => routeTitleFor(location.pathname, t), [location.pathname, t]);
}

export function useRouteAnnouncer({ skipInitial = true }: Options = {}) {
  const location = useLocation();
  const { t } = useTranslation('common');
  const announce = useAnnounce();

  useEffect(() => {
    const title = routeTitleFor(location.pathname, t);

    // Keep the OS-level window title in sync so alt-tab / accessibility
    // tools surface the current page. Skip when the title is a raw path
    // (unknown route) to avoid showing ugly URLs.
    if (typeof document !== 'undefined' && !title.startsWith('/')) {
      document.title = `${title} · ${APP_TITLE}`;
    }

    if (skipInitial) {
      // One-shot guard: on first run we set a ref-like flag via closure.
      // Using a module-scoped set would leak across HMR; a single sentinel is
      // fine because the hook is mounted at most once in the app tree.
      if (!hasAnnouncedOnce) {
        hasAnnouncedOnce = true;
        return;
      }
    }

    announce(title, 'polite');

    const main = document.getElementById('main-content');
    if (main) {
      // tabIndex=-1 on #main-content lets us focus it programmatically.
      // Blurring on the next frame avoids a persistent outline for mouse users.
      main.focus({ preventScroll: true });
      window.requestAnimationFrame(() => {
        if (document.activeElement === main) {
          main.blur();
        }
      });
    }
  }, [location.pathname, t, announce, skipInitial]);
}

let hasAnnouncedOnce = false;
