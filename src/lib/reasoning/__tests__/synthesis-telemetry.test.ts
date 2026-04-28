/**
 * Synthesis telemetry tests.
 *
 * Deterministic: no network, no LLM calls, no randomness. Each case calls
 * `_resetForTests()` to clear the in-memory ring buffer between tests.
 */

import {
  recordSynthesisEvent,
  getRecentSynthesisEvents,
  recordFeedback,
  _resetForTests,
  SYNTHESIS_TELEMETRY_CAPACITY,
  type SynthesisTelemetryInput,
} from '@/lib/reasoning/synthesis-telemetry';

const baseInput: SynthesisTelemetryInput = {
  surface: 'source',
  instanceId: 'ams-vendor-consolidation-2026',
  patternId: 'PAT-SRC-AMS-001',
  cacheHit: false,
  latencyMs: 250,
  citationCount: 3,
  contradictionCount: 1,
  failureModeCount: 0,
  gateCount: 5,
};

beforeEach(() => {
  _resetForTests();
});

describe('recordSynthesisEvent', () => {
  it('returns an event with id and ISO timestamp populated', () => {
    const event = recordSynthesisEvent(baseInput);
    expect(event.id).toMatch(/^tlm_/);
    expect(typeof event.timestamp).toBe('string');
    // ISO-8601 sanity check (e.g. "2026-04-28T12:34:56.789Z")
    expect(new Date(event.timestamp).toISOString()).toBe(event.timestamp);
  });

  it('preserves all caller-supplied fields', () => {
    const event = recordSynthesisEvent(baseInput);
    expect(event.surface).toBe('source');
    expect(event.instanceId).toBe('ams-vendor-consolidation-2026');
    expect(event.patternId).toBe('PAT-SRC-AMS-001');
    expect(event.cacheHit).toBe(false);
    expect(event.latencyMs).toBe(250);
    expect(event.citationCount).toBe(3);
    expect(event.contradictionCount).toBe(1);
    expect(event.failureModeCount).toBe(0);
    expect(event.gateCount).toBe(5);
  });

  it('assigns unique ids to back-to-back events', () => {
    const a = recordSynthesisEvent(baseInput);
    const b = recordSynthesisEvent(baseInput);
    const c = recordSynthesisEvent(baseInput);
    const ids = new Set([a.id, b.id, c.id]);
    expect(ids.size).toBe(3);
  });

  it('does not pre-populate feedback fields', () => {
    const event = recordSynthesisEvent(baseInput);
    expect(event.feedback).toBeUndefined();
    expect(event.feedbackTimestamp).toBeUndefined();
  });
});

describe('getRecentSynthesisEvents', () => {
  it('returns events newest-first', () => {
    const a = recordSynthesisEvent({ ...baseInput, instanceId: 'a' });
    const b = recordSynthesisEvent({ ...baseInput, instanceId: 'b' });
    const c = recordSynthesisEvent({ ...baseInput, instanceId: 'c' });

    const events = getRecentSynthesisEvents();
    expect(events.map(e => e.id)).toEqual([c.id, b.id, a.id]);
  });

  it('honours the optional limit parameter', () => {
    recordSynthesisEvent({ ...baseInput, instanceId: 'a' });
    recordSynthesisEvent({ ...baseInput, instanceId: 'b' });
    recordSynthesisEvent({ ...baseInput, instanceId: 'c' });

    expect(getRecentSynthesisEvents(2)).toHaveLength(2);
    expect(getRecentSynthesisEvents(0)).toHaveLength(0);
  });

  it('returns an empty array when the buffer is empty', () => {
    expect(getRecentSynthesisEvents()).toEqual([]);
  });

  it('evicts oldest entries when capacity is exceeded', () => {
    const overflow = 5;
    const total = SYNTHESIS_TELEMETRY_CAPACITY + overflow;
    for (let i = 0; i < total; i += 1) {
      recordSynthesisEvent({ ...baseInput, instanceId: `inst-${i}` });
    }
    const events = getRecentSynthesisEvents();
    expect(events).toHaveLength(SYNTHESIS_TELEMETRY_CAPACITY);
    // First event recorded (inst-0) should have been evicted.
    expect(events.find(e => e.instanceId === 'inst-0')).toBeUndefined();
    // The newest events (inst-(total-1)) should still be there.
    expect(events[0].instanceId).toBe(`inst-${total - 1}`);
  });
});

describe('recordFeedback', () => {
  it('attaches feedback to an existing event', () => {
    const event = recordSynthesisEvent(baseInput);
    const ok = recordFeedback(event.id, 'up');
    expect(ok).toBe(true);

    const stored = getRecentSynthesisEvents().find(e => e.id === event.id);
    expect(stored?.feedback).toBe('up');
    expect(typeof stored?.feedbackTimestamp).toBe('string');
  });

  it('overwrites prior feedback when a user changes their mind', () => {
    const event = recordSynthesisEvent(baseInput);
    expect(recordFeedback(event.id, 'up')).toBe(true);
    expect(recordFeedback(event.id, 'down')).toBe(true);

    const stored = getRecentSynthesisEvents().find(e => e.id === event.id);
    expect(stored?.feedback).toBe('down');
  });

  it('returns false for unknown event ids', () => {
    recordSynthesisEvent(baseInput);
    expect(recordFeedback('tlm_does_not_exist', 'up')).toBe(false);
  });

  it('only mutates the targeted event', () => {
    const a = recordSynthesisEvent({ ...baseInput, instanceId: 'a' });
    const b = recordSynthesisEvent({ ...baseInput, instanceId: 'b' });

    recordFeedback(b.id, 'down');

    const events = getRecentSynthesisEvents();
    expect(events.find(e => e.id === a.id)?.feedback).toBeUndefined();
    expect(events.find(e => e.id === b.id)?.feedback).toBe('down');
  });
});

describe('surface coverage', () => {
  it('records events for all three surfaces independently', () => {
    recordSynthesisEvent({ ...baseInput, surface: 'source', instanceId: 's1' });
    recordSynthesisEvent({ ...baseInput, surface: 'programs', instanceId: 'p1' });
    recordSynthesisEvent({ ...baseInput, surface: 'tower', instanceId: 'tower', patternId: null });

    const events = getRecentSynthesisEvents();
    const surfaces = events.map(e => e.surface).sort();
    expect(surfaces).toEqual(['programs', 'source', 'tower']);

    const tower = events.find(e => e.surface === 'tower');
    expect(tower?.patternId).toBeNull();
    expect(tower?.instanceId).toBe('tower');
  });
});
