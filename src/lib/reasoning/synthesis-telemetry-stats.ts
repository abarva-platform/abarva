/**
 * Synthesis telemetry — pure aggregation helpers.
 *
 * `summarizeTelemetry(events)` collapses a list of telemetry events into a
 * `TelemetrySummary` view-model. No I/O, no randomness, no time references.
 * Designed to be called from server components and from tests with the same
 * inputs and outputs.
 *
 * Counts and rates are computed from the input slice only — callers decide
 * how many events to include (full buffer, last 200, etc.).
 */

import type {
  SynthesisSurface,
  SynthesisTelemetryEvent,
} from '@/lib/reasoning/synthesis-telemetry';

export const SYNTHESIS_SURFACES: ReadonlyArray<SynthesisSurface> = [
  'source',
  'programs',
  'tower',
];

export interface SurfaceStats {
  surface: SynthesisSurface;
  events: number;
  cacheHits: number;
  /** Cache hit rate, 0..1. `0` when `events === 0`. */
  cacheHitRate: number;
  meanLatencyMs: number;
  medianLatencyMs: number;
  thumbsUp: number;
  thumbsDown: number;
}

export interface FeedbackStats {
  thumbsUp: number;
  thumbsDown: number;
  noFeedback: number;
  /**
   * Ratio of thumbs-up to total events with feedback (up + down). `0` when
   * no events have feedback. Range 0..1.
   */
  ratio: number;
}

export interface TopPattern {
  patternId: string;
  count: number;
}

export interface TelemetrySummary {
  totalEvents: number;
  bySurface: Record<SynthesisSurface, SurfaceStats>;
  /** Overall cache hit rate, 0..1. `0` when `totalEvents === 0`. */
  cacheHitRate: number;
  meanLatencyMs: number;
  medianLatencyMs: number;
  meanCitationCount: number;
  meanContradictionCount: number;
  meanFailureModeCount: number;
  feedback: FeedbackStats;
  /** Top 3 pattern ids by event count, descending. Excludes `null` patternId. */
  topPatterns: TopPattern[];
}

function emptySurfaceStats(surface: SynthesisSurface): SurfaceStats {
  return {
    surface,
    events: 0,
    cacheHits: 0,
    cacheHitRate: 0,
    meanLatencyMs: 0,
    medianLatencyMs: 0,
    thumbsUp: 0,
    thumbsDown: 0,
  };
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  let sum = 0;
  for (const v of values) sum += v;
  return sum / values.length;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = values.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

export function summarizeTelemetry(
  events: ReadonlyArray<SynthesisTelemetryEvent>,
): TelemetrySummary {
  const bySurface: Record<SynthesisSurface, SurfaceStats> = {
    source: emptySurfaceStats('source'),
    programs: emptySurfaceStats('programs'),
    tower: emptySurfaceStats('tower'),
  };

  const latenciesBySurface: Record<SynthesisSurface, number[]> = {
    source: [],
    programs: [],
    tower: [],
  };
  const allLatencies: number[] = [];

  let cacheHits = 0;
  let citationSum = 0;
  let contradictionSum = 0;
  let failureModeSum = 0;
  let thumbsUp = 0;
  let thumbsDown = 0;
  const patternCounts = new Map<string, number>();

  for (const event of events) {
    const surfaceStats = bySurface[event.surface];
    if (!surfaceStats) continue;
    surfaceStats.events += 1;
    if (event.cacheHit) {
      surfaceStats.cacheHits += 1;
      cacheHits += 1;
    }
    latenciesBySurface[event.surface].push(event.latencyMs);
    allLatencies.push(event.latencyMs);

    citationSum += event.citationCount;
    contradictionSum += event.contradictionCount;
    failureModeSum += event.failureModeCount;

    if (event.feedback === 'up') {
      surfaceStats.thumbsUp += 1;
      thumbsUp += 1;
    } else if (event.feedback === 'down') {
      surfaceStats.thumbsDown += 1;
      thumbsDown += 1;
    }

    if (event.patternId) {
      patternCounts.set(event.patternId, (patternCounts.get(event.patternId) ?? 0) + 1);
    }
  }

  for (const surface of SYNTHESIS_SURFACES) {
    const stats = bySurface[surface];
    const latencies = latenciesBySurface[surface];
    stats.cacheHitRate = stats.events === 0 ? 0 : stats.cacheHits / stats.events;
    stats.meanLatencyMs = mean(latencies);
    stats.medianLatencyMs = median(latencies);
  }

  const totalEvents = events.length;
  const noFeedback = totalEvents - thumbsUp - thumbsDown;
  const feedbackTotal = thumbsUp + thumbsDown;
  const feedbackRatio = feedbackTotal === 0 ? 0 : thumbsUp / feedbackTotal;

  const topPatterns: TopPattern[] = Array.from(patternCounts.entries())
    .map(([patternId, count]) => ({ patternId, count }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.patternId.localeCompare(b.patternId);
    })
    .slice(0, 3);

  return {
    totalEvents,
    bySurface,
    cacheHitRate: totalEvents === 0 ? 0 : cacheHits / totalEvents,
    meanLatencyMs: mean(allLatencies),
    medianLatencyMs: median(allLatencies),
    meanCitationCount: totalEvents === 0 ? 0 : citationSum / totalEvents,
    meanContradictionCount: totalEvents === 0 ? 0 : contradictionSum / totalEvents,
    meanFailureModeCount: totalEvents === 0 ? 0 : failureModeSum / totalEvents,
    feedback: {
      thumbsUp,
      thumbsDown,
      noFeedback,
      ratio: feedbackRatio,
    },
    topPatterns,
  };
}
