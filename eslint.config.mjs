import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

export default [
  {
    ignores: ['dist/**', 'dist-electron/**', 'openclaw/**', 'release/**', 'build/**'],
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2020,
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'jsx-a11y': jsxA11y,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tsPlugin.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      // TypeScript handles these checks natively, disable ESLint duplicates
      'no-undef': 'off',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', destructuredArrayIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      // jsx-a11y — progressive enablement. Strict for hard errors, warn for
      // stylistic/heuristic rules so the team can clean up over time without
      // blocking CI on day 1. Upgrade warns to errors phase-by-phase.
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-proptypes': 'error',
      'jsx-a11y/aria-role': 'error',
      'jsx-a11y/aria-unsupported-elements': 'error',
      'jsx-a11y/role-has-required-aria-props': 'error',
      'jsx-a11y/role-supports-aria-props': 'error',
      'jsx-a11y/no-redundant-roles': 'error',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
      'jsx-a11y/no-autofocus': 'warn',
      'jsx-a11y/label-has-associated-control': 'warn',
      'jsx-a11y/anchor-is-valid': 'warn',
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.type='MemberExpression'][callee.property.name='invoke'][callee.object.type='MemberExpression'][callee.object.property.name='ipcRenderer'][callee.object.object.type='MemberExpression'][callee.object.object.property.name='electron'][callee.object.object.object.name='window']",
          message: 'Use invokeIpc from @/lib/api-client instead of window.electron.ipcRenderer.invoke.',
        },
        {
          selector: "CallExpression[callee.name='fetch'] Literal[value=/^https?:\\/\\/(127\\.0\\.0\\.1|localhost)(:\\d+)?\\//]",
          message: 'Do not call local endpoints directly from renderer. Route through host-api/api-client proxies.',
        },
      ],
    },
  },
  {
    files: ['src/lib/api-client.ts'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
];
