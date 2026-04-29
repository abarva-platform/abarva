/**
 * Weekly digest tests — deterministic.
 *
 * Uses a fixed `nowMs` and seeds the in-memory telemetry buffer via the
 * public `recordSynthesisEvent` API (so the buffer stays the single
 * source of truth). Resets the buffer between cases.
 */
import {
  _resetForTests,
  recordSynthesisEvent,
  recordFeedback,
  setRetentionDays,
} from '@/lib/reasoning/synthesis-telemetry';
import {
  buildWeeklyDigest,
  WEEKLY_DIGEST_WINDOW_DAYS,
} from '@/lib/reasoning/weekly-digest';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';

const MS_PER_DAY = 86_400_000;
// Anchor 1 hour ahead of the wall clock so events recorded via
// `recordSynthesisEvent` (which uses real `Date.now()` for the event
// timestamp) fall comfortably inside the rolling 7-day window. The
// digest itself remains deterministic — same inputs in, same outputs
// out — even though the anchor is computed at test time.
const NOW_MS = Date.now() + 3_600_000;

describe('buildWeeklyDigest — empty buffer', () => {
  beforeEach(() => {
    _resetForTests();
    // Disable retention so older seed events are not pruned at write time.
    setRetentionDays(0);
  });
  afterEach(() => {
    _resetForTests();
  });

  it('returns zeroed counters and a stable window', () => {
    const digest = buildWeeklyDigest(NOW_MS);
    expect(digest.synthesisEventCount).toBe(0);
    expect(digest.cacheHitRate).toBe(0);
    expect(digest.feedbackUpCount).toBe(0);
    expect(digest.feedbackDownCount).toBe(0);
    expect(digest.topPatterns).toEqual([]);
  });

  it('window endpoints span exactly 7 days', () => {
    const digest = buildWeeklyDigest(NOW_MS);
    const start = Date.parse(digest.windowStart);
    const end = Date.parse(digest.windowEnd);
    expect(end - start).toBe(WEEKLY_DIGEST_WINDOW_DAYS * MS_PER_DAY);
    expect(end).toBe(NOW_MS);
  });

  it('still emits a perInstance row for every catalogued instance', () => {
    const digest = buildWeeklyDigest(NOW_MS);
    // At least the canonical AMS source event + the Apex program instances.
    const expectedMin =
      SOURCE_EVENT_INSTANCES.length + APEX_RETAIL_PROGRAM_INSTANCES.length;
    expect(digest.perInstance.length).toBeGreaterThanOrEqual(expectedMin);
    // Every row has zero synthesis count when no telemetry was recorded.
    for (const row of digest.perInstance) {
      expect(row.synthesisCount).toBe(0);
    }
  });
});

describe('buildWeeklyDigest — counts events inside the window', () => {
  beforeEach(() => {
    _resetForTests();
    setRetentionDays(0);
  });
  afterEach(() => {
    _resetForTests();
  });

  function seed(opts: {
    surface?: 'source' | 'programs' | 'tower';
    instanceId?: string;
    patternId?: string | null;
    cacheHit?: boolean;
    latencyMs?: number;
  } = {}) {
    return recordSynthesisEvent({
      surface: opts.surface ?? 'source',
      instanceId: opts.instanceId ?? 'inst-x',
      patternId: opts.patternId === undefined ? 'PAT-A' : opts.patternId,
      cacheHit: opts.cacheHit ?? false,
      latencyMs: opts.latencyMs ?? 100,
      citationCount: 0,
      contradictionCount: 0,
      failureModeCount: 0,
      gateCount: 0,
    });
  }

  it('counts every event in the buffer when all are inside the window', () => {
    seed();
    seed();
    seed({ cacheHit: true });
    const digest = buildWeeklyDigest(NOW_MS);
    expect(digest.synthesisEventCount).toBe(3);
    expect(digest.cacheHitRate).toBeCloseTo(1 / 3, 6);
  });

  it('aggregates feedback up/down counts', () => {
    const a = seed();
    const b = seed();
    const c = seed();
    recordFeedback(a.id, 'up');
    recordFeedback(b.id, 'up');
    recordFeedback(c.id, 'down');
    const digest = buildWeeklyDigest(NOW_MS);
    expect(digest.feedbackUpCount).toBe(2);
    expect(digest.feedbackDownCount).toBe(1);
  });

  it('returns the top patterns sorted by count desc, ties by id asc', () => {
    seed({ patternId: 'PAT-A' });
    seed({ patternId: 'PAT-A' });
    seed({ patternId: 'PAT-B' });
    seed({ patternId: 'PAT-B' });
    seed({ patternId: 'PAT-C' });
    seed({ patternId: null }); // null pattern should be excluded
    const digest = buildWeeklyDigest(NOW_MS);
    expect(digest.topPatterns).toEqual([
      { patternId: 'PAT-A', count: 2 },
      { patternId: 'PAT-B', count: 2 },
      { patternId: 'PAT-C', count: 1 },
    ]);
  });

  it('caps top patterns at 5 entries', () => {
    for (let i = 0; i < 8; i += 1) {
      seed({ patternId: `PAT-${i}` });
    }
    const digest = buildWeeklyDigest(NOW_MS);
    expect(digest.topPatterns).toHaveLength(5);
  });

  it('reflects synthesisCount on the matching perInstance row', () => {
    const knownId = SOURCE_EVENT_INSTANCES[0]?.id;
    expect(typeof knownId).toBe('string');
    if (!knownId) return;
    seed({ instanceId: knownId });
    seed({ instanceId: knownId });
    seed({ instanceId: 'unknown-id' }); // should not raise the row
    const digest = buildWeeklyDigest(NOW_MS);
    const row = digest.perInstance.find((r) => r.instanceId === knownId);
    expect(row).toBeDefined();
    expect(row?.synthesisCount).toBe(2);
  });

  it('produces deterministic output for identical seeded inputs', () => {
    seed({ patternId: 'PAT-A' });
    seed({ patternId: 'PAT-B' });
    const a = buildWeeklyDigest(NOW_MS);
    // No new events between calls.
    const b = buildWeeklyDigest(NOW_MS);
    expect(b).toEqual(a);
  });
});

describe('buildWeeklyDigest — window enforcement', () => {
  beforeEach(() => {
    _resetForTests();
    setRetentionDays(0);
  });
  afterEach(() => {
    _resetForTests();
  });

  it('drops events older than 7 days from the window', () => {
    // Record an event with a synthetic-old timestamp by manipulating buffer
    // through the public API: we record now, then assert filtering by
    // calling buildWeeklyDigest with a shifted nowMs that pushes the
    // recorded event out of the window.
    recordSynthesisEvent({
      surface: 'source',
      instanceId: 'inst-x',
      patternId: 'PAT-A',
      cacheHit: false,
      latencyMs: 100,
      citationCount: 0,
      contradictionCount: 0,
      failureModeCount: 0,
      gateCount: 0,
    });
    // Anchor 30 days in the future — recorded event falls outside window.
    const future = Date.now() + 30 * MS_PER_DAY;
    const digest = buildWeeklyDigest(future);
    expect(digest.synthesisEventCount).toBe(0);
  });

  it('drops events with timestamps after nowMs (clock skew)', () => {
    recordSynthesisEvent({
      surface: 'source',
      instanceId: 'inst-x',
      patternId: 'PAT-A',
      cacheHit: false,
      latencyMs: 100,
      citationCount: 0,
      contradictionCount: 0,
      failureModeCount: 0,
      gateCount: 0,
    });
    // Anchor 30 days in the past — recorded event timestamp is "in the future".
    const past = Date.now() - 30 * MS_PER_DAY;
    const digest = buildWeeklyDigest(past);
    expect(digest.synthesisEventCount).toBe(0);
  });
});
