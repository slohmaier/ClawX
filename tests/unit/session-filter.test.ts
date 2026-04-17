/**
 * Session-filter helpers — verify heartbeat and subagent sessions are
 * excluded from the user-facing sidebar list. Guards against regressions
 * when openclaw changes the key shape.
 */
import { describe, expect, it } from 'vitest';

import {
  isHeartbeatOriginSession,
  isHeartbeatSessionKey,
  isSubagentSessionKey,
  isUserFacingSession,
} from '@/stores/chat/helpers';

describe('isHeartbeatSessionKey', () => {
  it('flags isolated heartbeat session keys', () => {
    expect(isHeartbeatSessionKey('agent:main:session-123:heartbeat')).toBe(true);
  });

  it('flags nested heartbeat chains produced by re-isolation', () => {
    expect(isHeartbeatSessionKey('agent:main:s1:heartbeat:heartbeat')).toBe(true);
  });

  it('does not flag regular sessions', () => {
    expect(isHeartbeatSessionKey('agent:main:session-1700000000000')).toBe(false);
    expect(isHeartbeatSessionKey('agent:main:main')).toBe(false);
  });

  it('is case-insensitive on the suffix', () => {
    expect(isHeartbeatSessionKey('agent:main:s1:HEARTBEAT')).toBe(true);
  });

  it('rejects empty keys', () => {
    expect(isHeartbeatSessionKey('')).toBe(false);
  });
});

describe('isSubagentSessionKey', () => {
  it('flags agent-scoped subagent keys (rest starts with subagent:)', () => {
    expect(isSubagentSessionKey('agent:main:subagent:abc')).toBe(true);
  });

  it('flags raw subagent keys', () => {
    expect(isSubagentSessionKey('subagent:abc')).toBe(true);
  });

  it('flags nested subagent descendants', () => {
    expect(isSubagentSessionKey('agent:main:subagent:parent:subagent:child')).toBe(true);
  });

  it('does not flag regular sessions', () => {
    expect(isSubagentSessionKey('agent:main:session-1')).toBe(false);
  });

  it('rejects empty keys', () => {
    expect(isSubagentSessionKey('')).toBe(false);
  });
});

describe('isHeartbeatOriginSession', () => {
  it('flags sessions whose origin.provider is heartbeat', () => {
    expect(isHeartbeatOriginSession({ origin: { provider: 'heartbeat' } })).toBe(true);
  });

  it('flags sessions whose origin.from is heartbeat', () => {
    expect(isHeartbeatOriginSession({ origin: { provider: 'webchat', from: 'heartbeat' } })).toBe(true);
  });

  it('flags sessions whose origin.label is heartbeat', () => {
    expect(isHeartbeatOriginSession({ origin: { label: 'heartbeat' } })).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(isHeartbeatOriginSession({ origin: { provider: 'HEARTBEAT' } })).toBe(true);
  });

  it('does not flag missing or regular origins', () => {
    expect(isHeartbeatOriginSession({})).toBe(false);
    expect(isHeartbeatOriginSession({ origin: { provider: 'webchat', from: 'user' } })).toBe(false);
  });
});

describe('isUserFacingSession', () => {
  it('keeps regular user sessions', () => {
    expect(isUserFacingSession({ key: 'agent:main:session-123' })).toBe(true);
    expect(isUserFacingSession({ key: 'agent:main:main' })).toBe(true);
  });

  it('drops heartbeat sessions', () => {
    expect(isUserFacingSession({ key: 'agent:main:s1:heartbeat' })).toBe(false);
  });

  it('drops subagent sessions', () => {
    expect(isUserFacingSession({ key: 'agent:main:subagent:xyz' })).toBe(false);
  });

  it('drops non-main sessions whose origin marks them as heartbeat-driven', () => {
    expect(
      isUserFacingSession({
        key: 'agent:main:session-1776194100677',
        origin: { provider: 'webchat', from: 'heartbeat', to: 'heartbeat' },
      }),
    ).toBe(false);
  });

  it('keeps the main session even when origin is heartbeat (entry point for the user)', () => {
    // The main session must stay visible — hiding it would leave the user
    // with no session to chat in when the gateway pollutes origin metadata.
    expect(
      isUserFacingSession({
        key: 'agent:main:main',
        origin: { provider: 'heartbeat', from: 'heartbeat' },
      }),
    ).toBe(true);
  });
});
