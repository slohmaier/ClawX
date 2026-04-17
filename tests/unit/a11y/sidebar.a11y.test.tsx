/**
 * Sidebar a11y smoke test.
 *
 * Covers B1: primary-nav landmark, session-list landmark with semantic
 * <ul>/<li>, date-bucket headings tied to their list via aria-labelledby,
 * aria-current on the active session, delete button labelled with the
 * session name, and axe finds no static WCAG violations.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { axe } from 'jest-axe';
import { MemoryRouter } from 'react-router-dom';

import { Sidebar } from '@/components/layout/Sidebar';

const { agentsState, chatState, settingsState, gatewayState } = vi.hoisted(() => ({
  agentsState: {
    agents: [{ id: 'main', name: 'Main' }],
    fetchAgents: () => Promise.resolve(),
  },
  chatState: {
    sessions: [
      { key: 'session-a', displayName: 'Refactor PR', label: 'Refactor PR' },
      { key: 'session-b', displayName: 'Docs rewrite', label: 'Docs rewrite' },
    ] as Array<{ key: string; displayName: string; label: string }>,
    currentSessionKey: 'session-a',
    sessionLabels: {} as Record<string, string>,
    sessionLastActivity: {
      'session-a': Date.now(),
      'session-b': Date.now() - 3 * 24 * 60 * 60 * 1000,
    } as Record<string, number>,
    messages: [] as unknown[],
    switchSession: vi.fn(),
    newSession: vi.fn(),
    deleteSession: vi.fn(),
    loadSessions: vi.fn().mockResolvedValue(undefined),
    loadHistory: vi.fn().mockResolvedValue(undefined),
  },
  settingsState: {
    sidebarCollapsed: false,
    setSidebarCollapsed: vi.fn(),
  },
  gatewayState: {
    status: { state: 'stopped' as const },
  },
}));

vi.mock('@/stores/agents', () => ({
  useAgentsStore: Object.assign(
    (selector: (state: typeof agentsState) => unknown) => selector(agentsState),
    { getState: () => agentsState },
  ),
}));

vi.mock('@/stores/chat', () => ({
  useChatStore: Object.assign(
    (selector: (state: typeof chatState) => unknown) => selector(chatState),
    { getState: () => chatState },
  ),
}));

vi.mock('@/stores/settings', () => ({
  useSettingsStore: Object.assign(
    (selector: (state: typeof settingsState) => unknown) => selector(settingsState),
    { getState: () => settingsState },
  ),
}));

vi.mock('@/stores/gateway', () => ({
  useGatewayStore: Object.assign(
    (selector: (state: typeof gatewayState) => unknown) => selector(gatewayState),
    { getState: () => gatewayState },
  ),
}));

vi.mock('@/lib/host-api', () => ({
  hostApiFetch: vi.fn(),
}));

vi.mock('@/extensions/registry', () => ({
  rendererExtensionRegistry: {
    getHiddenRoutes: () => new Set<string>(),
    getExtraNavItems: () => [] as Array<Record<string, unknown>>,
    getExtraRoutes: () => [] as Array<Record<string, unknown>>,
  },
}));

vi.mock('react-i18next', () => {
  const t = (key: string, vars?: Record<string, unknown>) => {
    const map: Record<string, string> = {
      'sidebar.models': 'Models',
      'sidebar.agents': 'Agents',
      'sidebar.channels': 'Channels',
      'sidebar.skills': 'Skills',
      'sidebar.cronTasks': 'Cron',
      'sidebar.newChat': 'New Chat',
      'sidebar.settings': 'Settings',
      'common:sidebar.openClawPage': 'OpenClaw Page',
      'common:actions.confirm': 'Confirm',
      'common:actions.delete': 'Delete',
      'common:actions.cancel': 'Cancel',
      'common:a11y.sidebar.nav': 'Primary navigation',
      'common:a11y.sidebar.sessions': 'Chat sessions',
      'common:a11y.sidebar.collapse': 'Collapse sidebar',
      'common:a11y.sidebar.expand': 'Expand sidebar',
      'chat:historyBuckets.today': 'Today',
      'chat:historyBuckets.yesterday': 'Yesterday',
      'chat:historyBuckets.withinWeek': 'This week',
      'chat:historyBuckets.withinTwoWeeks': 'Two weeks',
      'chat:historyBuckets.withinMonth': 'This month',
      'chat:historyBuckets.older': 'Older',
    };
    if (key === 'common:a11y.sidebar.deleteSession') {
      return `Delete session ${String(vars?.label ?? '')}`;
    }
    if (key === 'common:sidebar.deleteSessionConfirm') {
      return `Delete ${String(vars?.label ?? '')}?`;
    }
    return map[key] ?? key;
  };
  return {
    useTranslation: () => ({ t, i18n: { changeLanguage: vi.fn() } }),
  };
});

function renderSidebar() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Sidebar />
    </MemoryRouter>,
  );
}

describe('Sidebar a11y', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exposes primary and session navigation landmarks', () => {
    renderSidebar();
    expect(screen.getByRole('navigation', { name: 'Primary navigation' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Chat sessions' })).toBeInTheDocument();
  });

  it('renders date-bucket headings that label their session list', () => {
    renderSidebar();
    const today = screen.getByRole('heading', { name: 'Today', level: 2 });
    const list = screen.getByRole('list', { name: 'Today' });
    expect(today).toBeInTheDocument();
    expect(list).toBeInTheDocument();
  });

  it('marks the active session with aria-current="page"', () => {
    renderSidebar();
    // Session button's accessible name concatenates agent + label with no space.
    const active = screen.getByRole('button', { name: 'MainRefactor PR' });
    expect(active).toHaveAttribute('aria-current', 'page');
    const inactive = screen.getByRole('button', { name: 'MainDocs rewrite' });
    expect(inactive).not.toHaveAttribute('aria-current');
  });

  it('labels the delete button with the session name', () => {
    renderSidebar();
    expect(
      screen.getByRole('button', { name: 'Delete session Refactor PR' }),
    ).toBeInTheDocument();
  });

  it('uses a localised label on the collapse toggle reflecting state', () => {
    renderSidebar();
    expect(screen.getByRole('button', { name: 'Collapse sidebar' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('has no axe violations', async () => {
    const { container } = renderSidebar();
    // Scope axe to the sidebar region so unrelated document-level rules
    // (e.g. `region`, which requires a full landmark tree) don't false-positive.
    const region = container.querySelector('aside') ?? container;
    const results = await axe(region);
    expect(results).toHaveNoViolations();
  });

  it('lists sessions as <li> inside a role="list"', () => {
    renderSidebar();
    const list = screen.getByRole('list', { name: 'Today' });
    const items = within(list).getAllByRole('listitem');
    expect(items.length).toBeGreaterThanOrEqual(1);
  });
});
