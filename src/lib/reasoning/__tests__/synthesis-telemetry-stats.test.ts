/**
 * Synthesis telemetry stats tests.
 *
 * Pure aggregation — deterministic inputs, deterministic outputs. No reset
 * needed because `summarizeTelemetry` reads only its argument array.
 */

import {
  summarizeTelemetry,
  type TelemetrySummary,
} from '@/lib/reasoning/synthesis-telemetry-stats';
import type {
  SynthesisSurface,
  SynthesisTelemetryEvent,
  SynthesisFeedback,
} from '@/lib/reasoning/synthesis-telemetry';

interface PartialEvent {
  surface?: SynthesisSurface;
  instanceId?: string;
  patternId?: string | null;
  cacheHit?: boolean;
  latencyMs?: number;
  citationCount?: number;
  contradictionCount?: number;
  failureModeCount?: number;
  gateCount?: number;
  feedback?: SynthesisFeedback;
  id?: string;
  timestamp?: string;
}

let counter = 0;
function ev(p: PartialEvent = {}): SynthesisTelemetryEvent {
  counter += 1;
  return {
    id: p.id ?? `tlm_test_${counter}`,
    timestamp: p.timestamp ?? `2026-04-28T00:00:${String(counter).padStart(2, '0')}.000Z`,
    surface: p.surface ?? 'source',
    instanceId: p.instanceId ?? 'instance-1',
    patternId: p.patternId === undefined ? 'PAT-001' : p.patternId,
    cacheHit: p.cacheHit ?? false,
    latencyMs: p.latencyMs ?? 100,
    citationCount: p.citationCount ?? 0,
    contradictionCount: p.contradictionCount ?? 0,
    failureModeCount: p.failureModeCount ?? 0,
    gateCount: p.gateCount ?? 0,
    feedback: p.feedback,
  };
}

describe('summarizeTelemetry', () => {
  it('returns a zeroed summary for an empty input', () => {
    const summary: TelemetrySummary = summarizeTelemetry([]);
    expect(summary.totalEvents).toBe(0);
    expect(summary.cacheHitRate).toBe(0);
    expect(summary.meanLatencyMs).toBe(0);
    expect(summary.medianLatencyMs).toBe(0);
    expect(summary.meanCitationCount).toBe(0);
    expect(summary.meanContradictionCount).toBe(0);
    expect(summary.meanFailureModeCount).toBe(0);
    expect(summary.feedback).toEqual({
      thumbsUp: 0,
      thumbsDown: 0,
      noFeedback: 0,
      ratio: 0,
    });
    expect(summary.topPatterns).toEqual([]);
    expect(summary.bySurface.source.events).toBe(0);
    expect(summary.bySurface.programs.events).toBe(0);
    expect(summary.bySurface.tower.events).toBe(0);
  });

  it('counts events by surface', () => {
    const events = [
      ev({ surface: 'source' }),
      ev({ surface: 'source' }),
      ev({ surface: 'programs' }),
      ev({ surface: 'tower' }),
    ];
    const summary = summarizeTelemetry(events);
    expect(summary.totalEvents).toBe(4);
    expect(summary.bySurface.source.events).toBe(2);
    expect(summary.bySurface.programs.events).toBe(1);
    expect(summary.bySurface.tower.events).toBe(1);
  });

  it('computes cache hit rate overall and per surface', () => {
    const events = [
      ev({ surface: 'source', cacheHit: true }),
      ev({ surface: 'source', cacheHit: false }),
      ev({ surface: 'programs', cacheHit: true }),
      ev({ surface: 'programs', cacheHit: true }),
    ];
    const summary = summarizeTelemetry(events);
    expect(summary.cacheHitRate).toBeCloseTo(0.75);
    expect(summary.bySurface.source.cacheHitRate).toBeCloseTo(0.5);
    expect(summary.bySurface.programs.cacheHitRate).toBeCloseTo(1.0);
    expect(summary.bySurface.tower.cacheHitRate).toBe(0);
  });

  it('computes mean and median latency overall and per surface', () => {
    const events = [
      ev({ surface: 'source', latencyMs: 100 }),
      ev({ surface: 'source', latencyMs: 200 }),
      ev({ surface: 'source', latencyMs: 300 }),
      ev({ surface: 'programs', latencyMs: 1000 }),
    ];
    const summary = summarizeTelemetry(events);
    expect(summary.meanLatencyMs).toBe((100 + 200 + 300 + 1000) / 4);
    expect(summary.medianLatencyMs).toBe(250); // mid of 100,200,300,1000
    expect(summary.bySurface.source.meanLatencyMs).toBe(200);
    expect(summary.bySurface.source.medianLatencyMs).toBe(200);
    expect(summary.bySurface.programs.medianLatencyMs).toBe(1000);
  });

  it('computes mean citation, contradiction, and failure-mode counts', () => {
    const events = [
      ev({ citationCount: 3, contradictionCount: 1, failureModeCount: 0 }),
      ev({ citationCount: 5, contradictionCount: 0, failureModeCount: 2 }),
      ev({ citationCount: 1, contradictionCount: 2, failureModeCount: 1 }),
    ];
    const summary = summarizeTelemetry(events);
    expect(summary.meanCitationCount).toBeCloseTo(3);
    expect(summary.meanContradictionCount).toBeCloseTo(1);
    expect(summary.meanFailureModeCount).toBeCloseTo(1);
  });

  it('aggregates feedback into up/down/no-feedback with ratio', () => {
    const events = [
      ev({ feedback: 'up' }),
      ev({ feedback: 'up' }),
      ev({ feedback: 'up' }),
      ev({ feedback: 'down' }),
      ev({ /* none */ }),
      ev({ /* none */ }),
    ];
    const summary = summarizeTelemetry(events);
    expect(summary.feedback.thumbsUp).toBe(3);
    expect(summary.feedback.thumbsDown).toBe(1);
    expect(summary.feedback.noFeedback).toBe(2);
    // ratio = 3 / (3 + 1) = 0.75
    expect(summary.feedback.ratio).toBeCloseTo(0.75);
  });

  it('reports zero feedback ratio when no events have feedback', () => {
    const events = [ev({}), ev({}), ev({})];
    const summary = summarizeTelemetry(events);
    expect(summary.feedback.thumbsUp).toBe(0);
    expect(summary.feedback.thumbsDown).toBe(0);
    expect(summary.feedback.noFeedback).toBe(3);
    expect(summary.feedback.ratio).toBe(0);
  });

  it('attributes feedback to the per-surface stats', () => {
    const events = [
      ev({ surface: 'source', feedback: 'up' }),
      ev({ surface: 'source', feedback: 'down' }),
      ev({ surface: 'programs', feedback: 'up' }),
      ev({ surface: 'tower' }),
    ];
    const summary = summarizeTelemetry(events);
    expect(summary.bySurface.source.thumbsUp).toBe(1);
    expect(summary.bySurface.source.thumbsDown).toBe(1);
    expect(summary.bySurface.programs.thumbsUp).toBe(1);
    expect(summary.bySurface.programs.thumbsDown).toBe(0);
    expect(summary.bySurface.tower.thumbsUp).toBe(0);
  });

  it('returns the top 3 patternIds by count, ignoring null', () => {
    const events = [
      ev({ patternId: 'PAT-A' }),
      ev({ patternId: 'PAT-A' }),
      ev({ patternId: 'PAT-A' }),
      ev({ patternId: 'PAT-B' }),
      ev({ patternId: 'PAT-B' }),
      ev({ patternId: 'PAT-C' }),
      ev({ patternId: 'PAT-D' }),
      ev({ patternId: null }),
      ev({ patternId: null }),
    ];
    const summary = summarizeTelemetry(events);
    expect(summary.topPatterns).toHaveLength(3);
    expect(summary.topPatterns[0]).toEqual({ patternId: 'PAT-A', count: 3 });
    expect(summary.topPatterns[1]).toEqual({ patternId: 'PAT-B', count: 2 });
    // PAT-C and PAT-D both have count 1; tie broken by patternId asc.
    expect(summary.topPatterns[2]).toEqual({ patternId: 'PAT-C', count: 1 });
  });

  it('handles a single event without crashing on median', () => {
    const summary = summarizeTelemetry([ev({ latencyMs: 42 })]);
    expect(summary.totalEvents).toBe(1);
    expect(summary.medianLatencyMs).toBe(42);
    expect(summary.meanLatencyMs).toBe(42);
  });

  it('does not double-count events across surfaces', () => {
    const events = [
      ev({ surface: 'source' }),
      ev({ surface: 'programs' }),
      ev({ surface: 'tower' }),
    ];
    const summary = summarizeTelemetry(events);
    const sum =
      summary.bySurface.source.events +
      summary.bySurface.programs.events +
      summary.bySurface.tower.events;
    expect(sum).toBe(summary.totalEvents);
  });
});
