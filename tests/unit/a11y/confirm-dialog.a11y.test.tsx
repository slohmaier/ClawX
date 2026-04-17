/**
 * Accessibility smoke test for ConfirmDialog.
 *
 * Serves as the reference pattern for all other specs under tests/unit/a11y/.
 * New per-component a11y specs should mirror this structure:
 *   1. Render with realistic props
 *   2. Run axe on the container
 *   3. Assert toHaveNoViolations()
 *
 * Wider a11y behaviour (focus trap, Escape, restore) is covered by component
 * tests; this suite focuses on static WCAG rule violations axe can detect.
 */
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';

describe('ConfirmDialog a11y', () => {
  it('has no axe violations when open', async () => {
    const { container } = render(
      <ConfirmDialog
        open
        title="Delete session"
        message="This will remove the selected session permanently."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('renders nothing when closed (no violations on empty tree)', async () => {
    const { container } = render(
      <ConfirmDialog
        open={false}
        title="Delete session"
        message="This will remove the selected session permanently."
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
