/**
 * Main Layout Component
 * TitleBar at top, then sidebar + content below.
 */
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LiveRegion } from '@/components/a11y/LiveRegion';
import { useRouteTitle } from '@/hooks/useRouteAnnouncer';
import { Sidebar } from './Sidebar';
import { TitleBar } from './TitleBar';

const srOnly = 'absolute h-px w-px overflow-hidden whitespace-nowrap border-0 p-0 [clip:rect(0_0_0_0)]';

export function MainLayout() {
  const { t } = useTranslation('common');
  const routeTitle = useRouteTitle();

  return (
    <div data-testid="main-layout" className="flex h-screen flex-col overflow-hidden bg-background">
      {/*
        Skip-to-content links. Visually hidden until focused. Must be the
        first focusable elements so keyboard / screen-reader users can bypass
        the title bar and sidebar to jump straight to the main region.
      */}
      <a
        href="#main-content"
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:left-3 focus-visible:top-3 focus-visible:z-[100] focus-visible:rounded-md focus-visible:bg-primary focus-visible:px-3 focus-visible:py-2 focus-visible:text-sm focus-visible:font-medium focus-visible:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {t('a11y.skipToContent')}
      </a>
      <a
        href="#sidebar-nav"
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:left-3 focus-visible:top-14 focus-visible:z-[100] focus-visible:rounded-md focus-visible:bg-primary focus-visible:px-3 focus-visible:py-2 focus-visible:text-sm focus-visible:font-medium focus-visible:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {t('a11y.skipToSidebar')}
      </a>

      {/* Global ARIA live-region — single mount for the whole app. */}
      <LiveRegion />

      {/* Title bar: drag region on macOS, icon + controls on Windows */}
      <TitleBar />

      {/* Below the title bar: sidebar + content */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar />
        <main
          id="main-content"
          data-testid="main-content"
          tabIndex={-1}
          className="min-h-0 flex-1 overflow-auto p-6 focus:outline-none"
        >
          {/*
            Single SR-only <h1> per page, driven by the current route. Visible
            H1s inside each page component would compete; keeping this landmark
            heading invisible means SRs still get a proper document outline
            while the visual design stays unchanged.
          */}
          <h1 className={srOnly} key={routeTitle}>{routeTitle}</h1>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
