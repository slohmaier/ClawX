/**
 * FeedbackState a11y (B7): loading / empty / error variants should each
 * expose a proper live-region role and pass axe.
 */
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';

import { FeedbackState } from '@/components/common/FeedbackState';

describe('FeedbackState a11y', () => {
  it('loading variant is a polite status region', () => {
    render(<FeedbackState state="loading" title="Loading…" />);
    const region = screen.getByRole('status');
    expect(region).toHaveAttribute('aria-busy', 'true');
    expect(region).toHaveAttribute('aria-live', 'polite');
  });

  it('error variant is an assertive alert', () => {
    render(<FeedbackState state="error" title="Something failed" />);
    const region = screen.getByRole('alert');
    expect(region).toHaveAttribute('aria-live', 'assertive');
  });

  it('empty variant is a polite status region', () => {
    render(<FeedbackState state="empty" title="Nothing here" />);
    const region = screen.getByRole('status');
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).not.toHaveAttribute('aria-busy');
  });

  it.each(['loading', 'empty', 'error'] as const)(
    'has no axe violations in %s state',
    async (state) => {
      const { container } = render(
        <FeedbackState state={state} title={`${state} title`} description="A description" />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    },
  );
});
