/**
 * Cascade telemetry tests.
 *
 * Deterministic: no network, no LLM calls, no randomness. Each case calls
 * `_resetForTests()` to clear the in-memory ring buffer between tests.
 */

import {
  recordCascadeEvent,
  getRecentCascadeEvents,
  _resetForTests,
  CASCADE_TELEMETRY_CAPACITY,
  type CascadeTelemetryInput,
} from '@/lib/reasoning/cascade-telemetry';

const baseInput: CascadeTelemetryInput = {
  sourceInstanceId: 'ams-vendor-consolidation-2026',
  targetInstanceId: 'apx-cdp-2026',
  linkType: 'unblocks',
  severity: 'high',
  impactSeverity: 'high',
  buildContext: 'source-synthesis',
};

beforeEach(() => {
  _resetForTests();
});

describe('recordCascadeEvent', () => {
  it('returns an event with id and ISO timestamp populated', () => {
    const event = recordCascadeEvent(baseInput);
    expect(event.id).toMatch(/^csc_/);
    expect(typeof event.timestamp).toBe('string');
    expect(new Date(event.timestamp).toISOString()).toBe(event.timestamp);
  });

  it('preserves all caller-supplied fields verbatim', () => {
    const event = recordCascadeEvent(baseInput);
    expect(event.sourceInstanceId).toBe('ams-vendor-consolidation-2026');
    expect(event.targetInstanceId).toBe('apx-cdp-2026');
    expect(event.linkType).toBe('unblocks');
    expect(event.severity).toBe('high');
    expect(event.impactSeverity).toBe('high');
    expect(event.buildContext).toBe('source-synthesis');
  });

  it('assigns unique ids to back-to-back events', () => {
    const a = recordCascadeEvent(baseInput);
    const b = recordCascadeEvent(baseInput);
    const c = recordCascadeEvent(baseInput);
    const ids = new Set([a.id, b.id, c.id]);
    expect(ids.size).toBe(3);
  });

  it('accepts events without optional impactSeverity', () => {
    const { impactSeverity: _drop, ...withoutImpact } = baseInput;
    void _drop;
    const event = recordCascadeEvent(withoutImpact);
    expect(event.impactSeverity).toBeUndefined();
    expect(event.severity).toBe('high');
  });
});

describe('getRecentCascadeEvents', () => {
  it('returns events in reverse chronological order (newest first)', () => {
    const a = recordCascadeEvent({ ...baseInput, targetInstanceId: 't-1' });
    const b = recordCascadeEvent({ ...baseInput, targetInstanceId: 't-2' });
    const c = recordCascadeEvent({ ...baseInput, targetInstanceId: 't-3' });

    const recent = getRecentCascadeEvents();
    expect(recent.map((e) => e.id)).toEqual([c.id, b.id, a.id]);
  });

  it('honors the limit parameter', () => {
    for (let i = 0; i < 10; i += 1) {
      recordCascadeEvent({ ...baseInput, targetInstanceId: `t-${i}` });
    }
    expect(getRecentCascadeEvents(3)).toHaveLength(3);
    expect(getRecentCascadeEvents(0)).toHaveLength(0);
    expect(getRecentCascadeEvents()).toHaveLength(10);
  });

  it('returns an empty array when no events have been recorded', () => {
    expect(getRecentCascadeEvents()).toEqual([]);
  });

  it('does not mutate the internal buffer when slicing', () => {
    recordCascadeEvent(baseInput);
    const first = getRecentCascadeEvents();
    first.push({
      id: 'fake',
      timestamp: new Date().toISOString(),
      tenantId: 'apex-retail',
      sourceInstanceId: 'x',
      targetInstanceId: 'y',
      linkType: 'depends-on',
      severity: 'low',
      buildContext: 'tower-synthesis',
    });
    expect(getRecentCascadeEvents()).toHaveLength(1);
  });
});

describe('ring buffer capacity', () => {
  it('caps the buffer at CASCADE_TELEMETRY_CAPACITY (FIFO eviction)', () => {
    const overfill = CASCADE_TELEMETRY_CAPACITY + 25;
    for (let i = 0; i < overfill; i += 1) {
      recordCascadeEvent({ ...baseInput, targetInstanceId: `t-${i}` });
    }
    const recent = getRecentCascadeEvents();
    expect(recent).toHaveLength(CASCADE_TELEMETRY_CAPACITY);
    // Newest event should be the last one we recorded.
    expect(recent[0]?.targetInstanceId).toBe(`t-${overfill - 1}`);
    // Oldest retained event should be `overfill - capacity`.
    expect(recent[recent.length - 1]?.targetInstanceId).toBe(
      `t-${overfill - CASCADE_TELEMETRY_CAPACITY}`,
    );
  });
});

describe('_resetForTests', () => {
  it('clears the buffer and resets the id counter', () => {
    recordCascadeEvent(baseInput);
    recordCascadeEvent(baseInput);
    expect(getRecentCascadeEvents()).toHaveLength(2);

    _resetForTests();
    expect(getRecentCascadeEvents()).toEqual([]);

    // After reset, a fresh event is accepted.
    const fresh = recordCascadeEvent(baseInput);
    expect(fresh.id).toMatch(/^csc_/);
    expect(getRecentCascadeEvents()).toHaveLength(1);
  });
});

describe('buildContext discrimination', () => {
  it('records distinct events for each synthesis builder', () => {
    recordCascadeEvent({ ...baseInput, buildContext: 'source-synthesis' });
    recordCascadeEvent({ ...baseInput, buildContext: 'program-synthesis' });
    recordCascadeEvent({ ...baseInput, buildContext: 'tower-synthesis' });

    const recent = getRecentCascadeEvents();
    const contexts = recent.map((e) => e.buildContext);
    expect(contexts).toContain('source-synthesis');
    expect(contexts).toContain('program-synthesis');
    expect(contexts).toContain('tower-synthesis');
    expect(recent).toHaveLength(3);
  });
});
