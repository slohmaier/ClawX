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
import { useAnnounce } from './useAnnounce';

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

  // ── Streaming complete ──
  const hasStreaming = useChatStore((s) => Boolean(s.streamingMessage));
  const prevStreaming = useRef(false);
  useEffect(() => {
    if (prevStreaming.current && !hasStreaming) {
      announce(t('a11y.streaming.complete'), 'polite');
    }
    prevStreaming.current = hasStreaming;
  }, [hasStreaming, announce, t]);

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
