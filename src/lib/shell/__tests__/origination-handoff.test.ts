/**
 * @jest-environment jsdom
 *
 * Origination → active program handoff bridge · PR-K tests
 *
 * Verifies the sessionStorage round-trip and the staleness/clear
 * semantics — these are what guarantee the chat thread bridges
 * router.push from /programs/new to /programs/<id> without leaking
 * old conversations on refresh.
 */

import {
  buildHandoffMarker,
  consumeOriginationHandoff,
  persistOriginationHandoff,
  __resetForTests,
} from '../origination-handoff';
import type { ChatTurn } from '../atlas-page-state';

beforeEach(() => {
  __resetForTests();
});

const sampleTurns: ChatTurn[] = [
  {
    id: 't1',
    role: 'user',
    agentName: 'user',
    text: 'I want to set up a CDP program',
    timestamp: 1000,
  },
  {
    id: 't2',
    role: 'agent',
    agentName: 'Steward',
    text: 'Got it — what are you trying to enable downstream?',
    timestamp: 1100,
  },
  {
    id: 't3',
    role: 'user',
    agentName: 'user',
    text: 'Personalised marketing journeys for the loyalty cohort.',
    timestamp: 1200,
  },
];

describe('persistOriginationHandoff + consumeOriginationHandoff', () => {
  it('persists turns and reads them back when programId matches', () => {
    persistOriginationHandoff({
      programId: 'apx-cdp-2026',
      programName: 'Apex Retail CDP Activation',
      turns: sampleTurns,
      capturedAt: Date.now(),
    });

    const got = consumeOriginationHandoff('apx-cdp-2026');
    expect(got).not.toBeNull();
    expect(got).toHaveLength(3);
    expect(got?.[0].text).toContain('CDP program');
  });

  it('returns null when programId mismatches', () => {
    persistOriginationHandoff({
      programId: 'apx-cdp-2026',
      programName: 'X',
      turns: sampleTurns,
      capturedAt: Date.now(),
    });

    const got = consumeOriginationHandoff('different-id');
    expect(got).toBeNull();
  });

  it('clears storage on consume so refresh does NOT replay', () => {
    persistOriginationHandoff({
      programId: 'apx-cdp-2026',
      programName: 'X',
      turns: sampleTurns,
      capturedAt: Date.now(),
    });

    const first = consumeOriginationHandoff('apx-cdp-2026');
    expect(first).toHaveLength(3);

    const second = consumeOriginationHandoff('apx-cdp-2026');
    expect(second).toBeNull();
  });

  it('rejects payloads older than the freshness window', () => {
    persistOriginationHandoff({
      programId: 'apx-cdp-2026',
      programName: 'X',
      turns: sampleTurns,
      // 5 minutes ago — well past the 90s window
      capturedAt: Date.now() - 5 * 60 * 1000,
    });

    const got = consumeOriginationHandoff('apx-cdp-2026');
    expect(got).toBeNull();
  });

  it('rejects payloads with missing fields', () => {
    window.sessionStorage.setItem(
      'abarva.programHandoff',
      JSON.stringify({ programId: 'x' /* no turns */ }),
    );
    expect(consumeOriginationHandoff('x')).toBeNull();
  });

  it('returns null when no payload has been written', () => {
    expect(consumeOriginationHandoff('any')).toBeNull();
  });
});

describe('buildHandoffMarker', () => {
  it('produces a turn with the magic agentName so renderers can detect it', () => {
    const marker = buildHandoffMarker('Apex Retail CDP Activation');
    expect(marker.role).toBe('agent');
    expect(marker.agentName).toBe('__handoff__');
    expect(marker.text).toContain('Apex Retail CDP Activation');
    expect(marker.text).toContain('Nexus');
  });

  it('falls back to a generic phrase when caller passes a placeholder', () => {
    const marker = buildHandoffMarker('your program');
    expect(marker.text).toContain('your program');
  });

  it('marker has a stable shape that round-trips through persist/consume', () => {
    const marker = buildHandoffMarker('Test Program');
    persistOriginationHandoff({
      programId: 'p1',
      programName: 'Test Program',
      turns: [...sampleTurns, marker],
      capturedAt: Date.now(),
    });
    const got = consumeOriginationHandoff('p1');
    expect(got).toHaveLength(4);
    expect(got?.[3].agentName).toBe('__handoff__');
  });
});
