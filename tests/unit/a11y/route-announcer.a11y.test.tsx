/**
 * useRouteTitle / useRouteAnnouncer a11y behaviour (B8).
 *
 * Covers:
 *   - `useRouteTitle` resolves localised titles for known routes.
 *   - `useRouteAnnouncer` syncs `document.title` on navigation.
 *   - `useRouteAnnouncer` focuses `#main-content` so keyboard/SR users land on
 *     the newly rendered view.
 *
 * The announcer store is real; we render the hook via a thin harness inside
 * MemoryRouter so navigation plays out end-to-end.
 */
import { describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';

import { useRouteAnnouncer, useRouteTitle } from '@/hooks/useRouteAnnouncer';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'sidebar.chat': 'Chat',
        'sidebar.models': 'Models',
        'sidebar.agents': 'Agents',
        'sidebar.channels': 'Channels',
        'sidebar.skills': 'Skills',
        'sidebar.cronTasks': 'Cron',
        'sidebar.settings': 'Settings',
      };
      return map[key] ?? key;
    },
  }),
}));

function Harness() {
  useRouteAnnouncer({ skipInitial: false });
  const title = useRouteTitle();
  const navigate = useNavigate();
  return (
    <>
      <main id="main-content" tabIndex={-1} data-testid="main">
        <h1>{title}</h1>
      </main>
      <button type="button" onClick={() => navigate('/models')}>go models</button>
      <button type="button" onClick={() => navigate('/settings/general')}>go settings</button>
    </>
  );
}

describe('useRouteAnnouncer', () => {
  it('resolves the localised title for the initial route', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Harness />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Chat');
  });

  it('resolves the longest matching prefix so nested routes inherit the parent title', () => {
    render(
      <MemoryRouter initialEntries={['/settings/general']}>
        <Harness />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Settings');
  });

  it('updates document.title and moves focus to #main-content on navigation', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Harness />
      </MemoryRouter>,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'go models' }));
    });

    expect(document.title).toBe('Models · ClawX');
    expect(document.activeElement).toBe(screen.getByTestId('main'));
  });
});
