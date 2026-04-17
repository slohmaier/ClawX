/**
 * Vitest Test Setup
 * Global test configuration and mocks
 */
import { expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { toHaveNoViolations } from 'jest-axe';

// Enable `expect(container).toHaveNoViolations()` in a11y tests under
// tests/unit/a11y/. Individual specs import `axe` from 'jest-axe' directly.
expect.extend(toHaveNoViolations);

// Provide a minimal `electron` mock so tests that transitively import
// main-process code (logger, store, etc.) don't blow up when the Electron
// binary is not present (e.g. CI with ELECTRON_SKIP_BINARY_DOWNLOAD=1).
// Individual test files can override with their own vi.mock('electron', ...).
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn().mockReturnValue('/tmp/clawx-test'),
    getVersion: vi.fn().mockReturnValue('0.0.0-test'),
    getName: vi.fn().mockReturnValue('clawx-test'),
    isPackaged: false,
    isReady: vi.fn().mockResolvedValue(true),
    on: vi.fn(),
    off: vi.fn(),
    quit: vi.fn(),
    whenReady: vi.fn().mockResolvedValue(undefined),
  },
  BrowserWindow: vi.fn(),
  ipcMain: { on: vi.fn(), handle: vi.fn(), removeHandler: vi.fn() },
  dialog: { showOpenDialog: vi.fn(), showMessageBox: vi.fn() },
  shell: { openExternal: vi.fn() },
  session: { defaultSession: { webRequest: { onBeforeSendHeaders: vi.fn() } } },
  utilityProcess: {},
}));

// Mock window.electron API
const mockElectron = {
  ipcRenderer: {
    invoke: vi.fn(),
    on: vi.fn(),
    once: vi.fn(),
    off: vi.fn(),
  },
  openExternal: vi.fn(),
  platform: 'darwin',
  isDev: true,
};

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'electron', {
    value: mockElectron,
    writable: true,
  });
}

// Provide an in-memory localStorage so zustand `persist` middleware works in
// jsdom tests that touch stores like useSettingsStore. jsdom ships a Storage
// by default, but `vi.resetAllMocks()` in some specs clobbers the methods —
// define our own that survives resets.
if (typeof window !== 'undefined') {
  const store = new Map<string, string>();
  const localStorageMock: Storage = {
    get length() { return store.size; },
    clear: () => { store.clear(); },
    getItem: (key) => (store.has(key) ? store.get(key)! : null),
    key: (i) => Array.from(store.keys())[i] ?? null,
    removeItem: (key) => { store.delete(key); },
    setItem: (key, value) => { store.set(key, String(value)); },
  };
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });
}

// Mock matchMedia
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

// Reset mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});
