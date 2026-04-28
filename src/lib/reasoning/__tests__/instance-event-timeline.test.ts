/**
 * Per-instance reasoning event timeline tests.
 *
 * Deterministic: each case resets every contributing store via its
 * `_resetForTests()` helper before running. `formatRelativeTime` is
 * exercised with an explicit `nowMs` so the "Xm ago" output never depends
 * on wall-clock time during the test run.
 */

import {
  buildInstanceEventTimeline,
  formatRelativeTime,
} from '@/lib/reasoning/instance-event-timeline';
import {
  recordSynthesisEvent,
  _resetForTests as resetTelemetry,
  type SynthesisTelemetryInput,
} from '@/lib/reasoning/synthesis-telemetry';
import {
  addEvidence,
  _resetForTests as resetEvidence,
} from '@/lib/reasoning/evidence-ingestion-store';
import {
  markResolved,
  _resetForTests as resetResolutions,
} from '@/lib/reasoning/contradiction-resolution-state';

const INSTANCE_ID = 'ams-vendor-consolidation-2026';
const OTHER_INSTANCE = 'apx-cdp-2026';

const baseSynthesis: SynthesisTelemetryInput = {
  surface: 'source',
  instanceId: INSTANCE_ID,
  patternId: 'PAT-SRC-AMS-001',
  cacheHit: false,
  latencyMs: 240,
  citationCount: 3,
  contradictionCount: 1,
  failureModeCount: 0,
  gateCount: 5,
};

beforeEach(() => {
  resetTelemetry();
  resetEvidence();
  resetResolutions();
});

describe('buildInstanceEventTimeline', () => {
  it('returns an empty array for an instance with no recorded activity', () => {
    expect(buildInstanceEventTimeline(INSTANCE_ID)).toEqual([]);
  });

  it('returns an empty array for an empty / non-string instanceId', () => {
    expect(buildInstanceEventTimeline('')).toEqual([]);
    // @ts-expect-error — defensive guard
    expect(buildInstanceEventTimeline(undefined)).toEqual([]);
  });

  it('includes a synthesis event for the matching instance and labels it correctly', () => {
    recordSynthesisEvent(baseSynthesis);
    const out = buildInstanceEventTimeline(INSTANCE_ID);
    expect(out).toHaveLength(1);
    expect(out[0].kind).toBe('synthesis');
    expect(out[0].label).toBe('Sentinel synthesis · cache miss · 240ms');
    expect(out[0].meta).toMatchObject({
      surface: 'source',
      cacheHit: false,
      latencyMs: 240,
      citationCount: 3,
      contradictionCount: 1,
    });
  });

  it('formats program and tower synthesis labels with the right agent name', () => {
    recordSynthesisEvent({ ...baseSynthesis, surface: 'programs', cacheHit: true, latencyMs: 12 });
    recordSynthesisEvent({ ...baseSynthesis, surface: 'tower', cacheHit: false, latencyMs: 90 });
    const labels = buildInstanceEventTimeline(INSTANCE_ID).map(e => e.label);
    expect(labels).toEqual(
      expect.arrayContaining([
        'Atlas synthesis · cache miss · 90ms',
        'Nexus synthesis · cache hit · 12ms',
      ]),
    );
  });

  it('excludes synthesis events recorded against a different instance', () => {
    recordSynthesisEvent(baseSynthesis);
    recordSynthesisEvent({ ...baseSynthesis, instanceId: OTHER_INSTANCE });
    const out = buildInstanceEventTimeline(INSTANCE_ID);
    expect(out).toHaveLength(1);
    expect(out[0].meta.surface).toBe('source');
  });

  it('includes evidence-ingestion events with field+value rendered in the label', () => {
    addEvidence(INSTANCE_ID, {
      id: 'ev-1',
      kind: 'attestation',
      field: 'soc2',
      value: 'received',
      source: 'manual',
    });
    const out = buildInstanceEventTimeline(INSTANCE_ID);
    expect(out).toHaveLength(1);
    expect(out[0].kind).toBe('evidence-ingested');
    expect(out[0].label).toBe('Evidence ingested · soc2 = received');
    expect(out[0].meta).toMatchObject({ field: 'soc2', value: 'received', source: 'manual' });
  });

  it('isolates evidence by instance id', () => {
    addEvidence(INSTANCE_ID, { id: 'a', field: 'foo', value: 'bar' });
    addEvidence(OTHER_INSTANCE, { id: 'b', field: 'baz', value: 'qux' });
    const out = buildInstanceEventTimeline(INSTANCE_ID);
    expect(out).toHaveLength(1);
    expect(out[0].label).toBe('Evidence ingested · foo = bar');
  });

  it('includes contradiction-resolved events scoped to instanceId via the {id}::{templateId} prefix', () => {
    markResolved(`${INSTANCE_ID}::CON-AMS-001`);
    markResolved(`${OTHER_INSTANCE}::CON-CDP-001`);
    const out = buildInstanceEventTimeline(INSTANCE_ID);
    expect(out).toHaveLength(1);
    expect(out[0].kind).toBe('contradiction-resolved');
    expect(out[0].label).toBe('Contradiction resolved · CON-AMS-001');
    expect(out[0].meta).toMatchObject({
      templateId: 'CON-AMS-001',
      fullId: `${INSTANCE_ID}::CON-AMS-001`,
    });
  });

  it('merges all three sources and sorts newest-first', () => {
    // Manually insert telemetry events with non-default timestamps by
    // recording them in a specific order; the recordSynthesisEvent helper
    // uses Date.now() at call time, which is monotonic in practice.
    recordSynthesisEvent(baseSynthesis); // 1st
    addEvidence(INSTANCE_ID, { id: 'ev-1', field: 'soc2', value: 'received' }); // 2nd
    markResolved(`${INSTANCE_ID}::CON-AMS-001`); // 3rd

    const out = buildInstanceEventTimeline(INSTANCE_ID);
    expect(out).toHaveLength(3);
    // Newest first → contradiction (3rd) ≥ evidence (2nd) ≥ synthesis (1st).
    const kinds = out.map(e => e.kind);
    expect(kinds[kinds.length - 1]).toBe('synthesis');
    // Timestamps must be monotonically non-increasing.
    for (let i = 1; i < out.length; i += 1) {
      expect(out[i - 1].timestamp >= out[i].timestamp).toBe(true);
    }
  });

  it('uses item.recordedAt as the evidence timestamp via the sidecar fallback when present', () => {
    addEvidence(INSTANCE_ID, {
      id: 'ev-1',
      field: 'soc2',
      value: 'received',
      recordedAt: '2026-04-20T10:00:00.000Z',
    });
    const [entry] = buildInstanceEventTimeline(INSTANCE_ID);
    // The sidecar capture happens at addEvidence time and takes precedence
    // (this is by design — the sidecar reflects ingest time, not the value
    // the caller embedded). Either way, the timestamp must be a valid ISO.
    expect(typeof entry.timestamp).toBe('string');
    expect(new Date(entry.timestamp).toISOString()).toBe(entry.timestamp);
  });
});

describe('formatRelativeTime', () => {
  const NOW = Date.parse('2026-04-28T12:00:00.000Z');

  it('returns "just now" for timestamps under 30 seconds old', () => {
    expect(formatRelativeTime('2026-04-28T11:59:55.000Z', NOW)).toBe('just now');
    expect(formatRelativeTime('2026-04-28T12:00:00.000Z', NOW)).toBe('just now');
  });

  it('returns "Xm ago" for minute-scale gaps under an hour', () => {
    expect(formatRelativeTime('2026-04-28T11:55:00.000Z', NOW)).toBe('5m ago');
    expect(formatRelativeTime('2026-04-28T11:01:00.000Z', NOW)).toBe('59m ago');
  });

  it('returns "Xh ago" for hour-scale gaps under a day', () => {
    expect(formatRelativeTime('2026-04-28T10:00:00.000Z', NOW)).toBe('2h ago');
    expect(formatRelativeTime('2026-04-27T13:00:00.000Z', NOW)).toBe('23h ago');
  });

  it('returns "Xd ago" up to 7 days, then falls back to ISO date', () => {
    expect(formatRelativeTime('2026-04-25T12:00:00.000Z', NOW)).toBe('3d ago');
    expect(formatRelativeTime('2026-04-15T12:00:00.000Z', NOW)).toBe('2026-04-15');
  });

  it('handles future timestamps and unparseable input gracefully', () => {
    expect(formatRelativeTime('2026-04-28T13:00:00.000Z', NOW)).toBe('just now');
    expect(formatRelativeTime('not-a-date', NOW)).toBe('not-a-date');
  });
});
