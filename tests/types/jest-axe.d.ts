/**
 * Minimal ambient types for jest-axe under Vitest.
 *
 * jest-axe 10 does not ship .d.ts files and @types/jest-axe targets Jest
 * specifically. This module declares only the surface we actually use:
 *   - `axe(container)` from jest-axe
 *   - `expect(...).toHaveNoViolations()` extension on Vitest's Assertion
 *
 * Keep this file lean — full axe-core typings live in `axe-core` itself and
 * can be imported directly if a spec needs them.
 */
declare module 'jest-axe' {
  import type { AxeResults, RunOptions } from 'axe-core';

  export function axe(
    element: Element | Document | string,
    options?: RunOptions
  ): Promise<AxeResults>;

  export const toHaveNoViolations: {
    toHaveNoViolations(results: AxeResults): {
      pass: boolean;
      message: () => string;
    };
  };

  export function configureAxe(options?: RunOptions): typeof axe;
}

// Extend Vitest's expect interface so `expect(results).toHaveNoViolations()`
// type-checks in spec files.
import 'vitest';

declare module 'vitest' {
  interface Assertion {
    toHaveNoViolations(): void;
  }
  interface AsymmetricMatchersContaining {
    toHaveNoViolations(): void;
  }
}

export {};
