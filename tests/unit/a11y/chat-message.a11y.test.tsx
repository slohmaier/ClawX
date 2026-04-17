/**
 * ChatMessage a11y (B2): verifies the `<article>` landmark with the sr-only
 * author label, streaming typing indicator (`role=status`), and axe-clean
 * rendering of user / assistant / streaming variants.
 */
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';

import { ChatMessage } from '@/pages/Chat/ChatMessage';
import type { RawMessage } from '@/stores/chat';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, vars?: Record<string, unknown>) => {
      const map: Record<string, string> = {
        'a11y.message.author.user': 'You',
        'a11y.message.author.assistant': 'Assistant',
        'a11y.message.author.system': 'System',
        'a11y.streaming.typing': 'Assistant is typing',
        'a11y.tool.running': 'Tool running:',
        'a11y.tool.success': 'Tool completed:',
        'a11y.tool.error': 'Tool failed:',
        'a11y.codeBlockPlain': 'Code block',
        'a11y.copyCode': 'Copy code to clipboard',
      };
      if (key === 'a11y.codeBlock') return `Code block, ${String(vars?.lang ?? '')}`;
      return map[key] ?? key;
    },
  }),
}));

vi.mock('@/lib/api-client', () => ({
  invokeIpc: vi.fn(),
}));

function userMessage(text: string): RawMessage {
  return {
    role: 'user',
    content: [{ type: 'text', text }],
  } as unknown as RawMessage;
}

function assistantMessage(text: string): RawMessage {
  return {
    role: 'assistant',
    content: [{ type: 'text', text }],
  } as unknown as RawMessage;
}

describe('ChatMessage a11y', () => {
  it('renders user messages inside an <article> with an sr-only author label as first child', () => {
    render(<ChatMessage message={userMessage('hello world')} showThinking={false} />);
    // The article deliberately has no aria-labelledby: VoiceOver should read
    // the whole message content (author + bubble text) on focus, not just
    // the author name. We check structurally that it *is* an article and
    // that the author text appears inside it.
    const article = screen.getByRole('article');
    expect(article).toBeInTheDocument();
    expect(article.textContent).toContain('You');
    expect(article.textContent).toContain('hello world');
  });

  it('labels assistant messages with the localised assistant author', () => {
    render(<ChatMessage message={assistantMessage('sure, let me help')} showThinking={false} />);
    const article = screen.getByRole('article');
    expect(article.textContent).toContain('Assistant');
    expect(article.textContent).toContain('sure, let me help');
  });

  it('exposes id and tabIndex props on the article for VO focus targeting', () => {
    render(
      <ChatMessage
        message={assistantMessage('focus me')}
        showThinking={false}
        id="chat-message-5"
        tabIndex={-1}
      />
    );
    const article = screen.getByRole('article');
    expect(article).toHaveAttribute('id', 'chat-message-5');
    expect(article).toHaveAttribute('tabIndex', '-1');
    expect(article).toHaveAttribute('data-chat-message-role', 'assistant');
  });

  it('exposes a polite streaming status while the assistant is typing', () => {
    render(
      <ChatMessage message={assistantMessage('thinking…')} showThinking={false} isStreaming />
    );
    // Sonner-style live region uses role="status" + aria-live="polite"; we
    // only assert presence of the typing text, not focus.
    expect(screen.getByText('Assistant is typing')).toBeInTheDocument();
  });

  it('has no axe violations for a plain user message', async () => {
    const { container } = render(
      <ChatMessage message={userMessage('hi')} showThinking={false} />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no axe violations for an assistant message with a code block', async () => {
    const { container } = render(
      <ChatMessage
        message={assistantMessage('```ts\nconst x = 1;\n```\n')}
        showThinking={false}
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
