/**
 * Subscribes to app-wide state and announces meaningful transitions to the
 * global ARIA live region (Phase D1).
 *
 * Events announced:
 *   - Gateway connect / disconnect / reconnecting
 *   - Streaming complete (assistant finishes a reply)
 *   - Tool runs that transition to `error`
 *
 * Why a hook, not inlined into each store consumer?
 *   - Keeps announcement strings in one place (i18n-friendly).
 *   - Avoids duplicate announcements when multiple components subscribe.
 *   - Single mount at the App root — easy to disable in tests.
 *
 * We intentionally do NOT announce every streaming token: the LiveRegion
 * would become a firehose and screen readers would spam the user. Only the
 * start/stop boundaries are narrated.
 */
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { useGatewayStore } from '@/stores/gateway';
import { useChatStore } from '@/stores/chat';
import { extractText } from '@/pages/Chat/message-utils';
import { useAnnounce } from './useAnnounce';

/** Soft cap for announced assistant text. VoiceOver handles long content fine
 *  but we truncate pathological 10k-token dumps so they don't monopolise the
 *  screen reader. The user can still scroll to read the full reply. */
const MAX_ANNOUNCE_CHARS = 2000;

/** Move keyboard focus to the most recently added chat message so VoiceOver
 *  announces it and the user can Tab/arrow-read from there. Skipped when the
 *  user is actively typing in the composer or another interactive element,
 *  since yanking focus mid-type would be worse than the quiet live-region
 *  read that already happens. */
function focusLatestMessageIfIdle(): void {
  if (typeof document === 'undefined') return;
  const active = document.activeElement;
  // Respect the user if they're in any editable field.
  if (active instanceof HTMLElement) {
    const tag = active.tagName;
    if (tag === 'TEXTAREA' || tag === 'INPUT' || active.isContentEditable) return;
  }
  const nodes = document.querySelectorAll<HTMLElement>('[data-chat-message-role="assistant"]');
  const last = nodes[nodes.length - 1];
  if (last) {
    last.scrollIntoView({ block: 'nearest' });
    last.focus({ preventScroll: true });
  }
}

export function useAppAnnouncements() {
  const { t } = useTranslation('common');
  const announce = useAnnounce();

  // ── Gateway connect / disconnect ──
  const gatewayState = useGatewayStore((s) => s.status.state);
  const gatewayReady = useGatewayStore((s) => s.status.gatewayReady);
  const prevGatewayKey = useRef<string>('');

  useEffect(() => {
    // Compress state + ready flag into a single key so we only announce
    // transitions that matter to the user, not intermediate bookkeeping.
    const key = `${gatewayState}:${gatewayReady ? '1' : '0'}`;
    if (prevGatewayKey.current === key) return;
    const prev = prevGatewayKey.current;
    prevGatewayKey.current = key;

    // Skip the very first render — we don't want a cold-load to announce
    // "connected" on its own. The second transition onward is real news.
    if (!prev) return;

    if (gatewayState === 'running' && gatewayReady) {
      announce(t('a11y.connection.connected'), 'polite');
    } else if (gatewayState === 'reconnecting') {
      announce(t('a11y.connection.reconnecting'), 'polite');
    } else if (gatewayState === 'stopped' || gatewayState === 'error') {
      announce(t('a11y.connection.disconnected'), 'assertive');
    }
  }, [gatewayState, gatewayReady, announce, t]);

  // ── Streaming complete: announce the full reply text ──
  //
  // Two things happen when streaming ends:
  //   1. The actual assistant text is pushed to the polite live region so
  //      VoiceOver reads the reply in full. The previous implementation only
  //      announced a generic "reply complete" which isn't useful — SR users
  //      want to hear the content, not a status cue.
  //   2. If the user isn't typing in the composer, keyboard/VO focus moves
  //      to the newly added <article>. This lets VO announce it via the
  //      focus path (belt-and-braces against flaky aria-live behaviour) and
  //      lets keyboard users Tab/arrow from the fresh message onward.
  const hasStreaming = useChatStore((s) => Boolean(s.streamingMessage));
  const prevStreaming = useRef(false);
  useEffect(() => {
    if (prevStreaming.current && !hasStreaming) {
      const messages = useChatStore.getState().messages;
      // Walk backwards for the most recent assistant message so we pick the
      // one that just finished, not an older turn.
      let lastAssistant;
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i]?.role === 'assistant') {
          lastAssistant = messages[i];
          break;
        }
      }
      const text = lastAssistant ? extractText(lastAssistant).trim() : '';
      if (text) {
        const truncated = text.length > MAX_ANNOUNCE_CHARS
          ? `${text.slice(0, MAX_ANNOUNCE_CHARS)}…`
          : text;
        announce(truncated, 'polite');
      } else {
        // Fallback cue for replies without extractable text (pure tool use).
        announce(t('a11y.streaming.complete'), 'polite');
      }
      // Give React a frame to render the final message before we focus it.
      window.requestAnimationFrame(() => focusLatestMessageIfIdle());
    }
    prevStreaming.current = hasStreaming;
  }, [hasStreaming, announce, t]);

  // ── New messages that arrive while we're NOT actively streaming ──
  // Covers history load, user typing, tool-result pushes. We announce the
  // last assistant text if one is appended without a streaming session
  // (e.g. a remote channel pushes a reply directly into the log).
  const messagesLength = useChatStore((s) => s.messages.length);
  const prevMessagesLength = useRef<number>(messagesLength);
  const initialLoadSeen = useRef(false);
  useEffect(() => {
    const prev = prevMessagesLength.current;
    prevMessagesLength.current = messagesLength;

    // Skip the initial history hydration — those aren't "new" messages to
    // the user. Only messages added after the first settled render count.
    if (!initialLoadSeen.current) {
      initialLoadSeen.current = messagesLength > 0;
      return;
    }
    if (messagesLength <= prev) return;
    // If streaming is in progress the streaming-complete effect above will
    // handle announcement on finish — don't double-read.
    if (useChatStore.getState().streamingMessage) return;

    const messages = useChatStore.getState().messages;
    const latest = messages[messages.length - 1];
    if (!latest || latest.role !== 'assistant') return;
    const text = extractText(latest).trim();
    if (!text) return;
    const truncated = text.length > MAX_ANNOUNCE_CHARS
      ? `${text.slice(0, MAX_ANNOUNCE_CHARS)}…`
      : text;
    announce(truncated, 'polite');
    window.requestAnimationFrame(() => focusLatestMessageIfIdle());
  }, [messagesLength, announce]);

  // ── Tool error ──
  // We track *ids* that have already been announced so a re-render with the
  // same error tool doesn't re-announce. Using the stable toolCallId/id means
  // each tool failure is narrated at most once per session.
  const streamingTools = useChatStore((s) => s.streamingTools);
  const announcedErrors = useRef<Set<string>>(new Set());
  useEffect(() => {
    for (const tool of streamingTools) {
      if (tool.status !== 'error') continue;
      const id = tool.toolCallId || tool.id || tool.name;
      if (!id || announcedErrors.current.has(id)) continue;
      announcedErrors.current.add(id);
      announce(
        t('a11y.tool.errorAnnouncement', { name: tool.name || 'tool' }),
        'assertive',
      );
    }
  }, [streamingTools, announce, t]);
}
