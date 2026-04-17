/**
 * Wires up app-wide keyboard shortcuts. Mount ONCE in App.tsx.
 *
 * Handlers live here (not in individual pages) because the shortcuts fire
 * regardless of route — Cmd+B toggles sidebar whether you're in Chat or
 * Settings. Page-scoped shortcuts (like arrow-key navigation in a list)
 * belong in their component.
 *
 * The Cmd+/ help dialog itself lands in Phase D2; for now this hook only
 * handles the registry entries that don't need new UI.
 */
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { useSettingsStore } from '@/stores/settings';

import { useShortcut } from './useShortcut';

export function useGlobalShortcuts() {
  const navigate = useNavigate();
  const sidebarCollapsed = useSettingsStore((s) => s.sidebarCollapsed);
  const setSidebarCollapsed = useSettingsStore((s) => s.setSidebarCollapsed);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(!sidebarCollapsed);
  }, [sidebarCollapsed, setSidebarCollapsed]);

  const goSettings = useCallback(() => {
    navigate('/settings');
  }, [navigate]);

  useShortcut('sidebar.toggle', toggleSidebar);
  useShortcut('settings.open', goSettings);

  // Shortcuts reserved for Phase D2 (help dialog) and the command palette
  // intentionally don't fire here — they'll be wired once those features ship.
}
