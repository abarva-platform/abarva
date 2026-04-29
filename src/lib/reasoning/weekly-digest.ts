/**
 * Weekly digest — executive sweep of the reasoning layer.
 *
 * Pure aggregation over the in-process telemetry buffer + the canonical
 * Apex Retail program / Source-event catalogues. Produces a snapshot for
 * the last 7 days suitable for an admin dashboard or scheduled email.
 *
 * Inputs (read-only):
 *   - `getRecentSynthesisEvents()`        — all in-buffer telemetry
 *   - `SOURCE_EVENT_INSTANCES`            — canonical Source instances
 *   - `APEX_RETAIL_PROGRAM_INSTANCES`     — canonical program instances
 *   - `SOURCE_LIFECYCLE_PATTERNS` /
 *     `PROGRAM_LIFECYCLE_PATTERNS`        — pattern catalogues
 *
 * Pure: no I/O, no randomness, no implicit `Date.now()` (caller may pass
 * a fixed `nowMs` for deterministic tests + a single time anchor when
 * computing the rolling 7-day window). Same inputs always produce the
 * same outputs.
 */
import {
  getRecentSynthesisEvents,
  type SynthesisTelemetryEvent,
} from '@/lib/reasoning/synthesis-telemetry';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { SOURCE_LIFECYCLE_PATTERNS } from '@/lib/intelligence/source-lifecycle-patterns';
import { PROGRAM_LIFECYCLE_PATTERNS } from '@/lib/intelligence/program-lifecycle-patterns';
import { deriveMissionsFromInstance } from '@/lib/reasoning/mission-derivation';
import { buildSourceSynthesisContext } from '@/lib/reasoning/synthesis-context-builder';
import { buildProgramSynthesisContext } from '@/lib/reasoning/program-synthesis-context-builder';
import type { LifecyclePatternSeed } from '@/lib/intelligence/seed-types';
import type { SourceEventInstance } from '@/lib/source/source-event-instance';
import type { ProgramInstance } from '@/lib/programs/program-instance';

const MS_PER_DAY = 86_400_000;
export const WEEKLY_DIGEST_WINDOW_DAYS = 7;

export interface WeeklyDigestPerInstance {
  /** Stable instance id (matches `instanceId` on telemetry events). */
  instanceId: string;
  /** Human-readable label (program / event name). */
  instanceLabel: string;
  /** Synthesis events recorded for this instance inside the window. */
  synthesisCount: number;
  /** Pending derived missions (any priority). */
  missionsPending: number;
  /** Active contradictions inferred from the synthesis context. */
  contradictionCount: number;
  /** Failure-mode signals inferred from the synthesis context. */
  failureModeCount: number;
}

export interface WeeklyDigestTopPattern {
  patternId: string;
  count: number;
}

export interface WeeklyDigest {
  /** Window start, ISO-8601 — `nowMs - 7d`. */
  windowStart: string;
  /** Window end, ISO-8601 — `nowMs`. */
  windowEnd: string;
  /** Number of synthesis events in the window. */
  synthesisEventCount: number;
  /** Cache hit rate over the window, 0..1. `0` when empty. */
  cacheHitRate: number;
  feedbackUpCount: number;
  feedbackDownCount: number;
  perInstance: WeeklyDigestPerInstance[];
  /** Top 5 patterns in the window by event count, descending. */
  topPatterns: WeeklyDigestTopPattern[];
}

type ReasoningInstance = SourceEventInstance | ProgramInstance;

function isProgramInstance(
  instance: ReasoningInstance,
): instance is ProgramInstance {
  return (
    typeof (instance as ProgramInstance).currentPhase === 'number' &&
    Array.isArray((instance as ProgramInstance).phases)
  );
}

/**
 * Filter telemetry events down to the rolling window. An event is kept
 * when its `timestamp` parses to a number in `[windowStartMs, nowMs]`.
 * Events with unparseable timestamps are silently dropped — defensive.
 */
function filterEventsToWindow(
  events: ReadonlyArray<SynthesisTelemetryEvent>,
  windowStartMs: number,
  nowMs: number,
): SynthesisTelemetryEvent[] {
  const out: SynthesisTelemetryEvent[] = [];
  for (const ev of events) {
    const ts = Date.parse(ev.timestamp);
    if (!Number.isFinite(ts)) continue;
    if (ts < windowStartMs) continue;
    if (ts > nowMs) continue;
    out.push(ev);
  }
  return out;
}

function lookupPattern(
  instance: ReasoningInstance,
  patterns: ReadonlyArray<LifecyclePatternSeed>,
): LifecyclePatternSeed | undefined {
  return patterns.find((p) => p.patternId === instance.patternId);
}

/**
 * Produce the per-instance row for a single instance. Counts derived
 * missions + reads contradictions / failure modes off the synthesis
 * context (same builder the surfaces use). Returns `null` if the pattern
 * is missing — caller filters those out.
 */
function buildPerInstanceRow(
  instance: ReasoningInstance,
  windowEvents: ReadonlyArray<SynthesisTelemetryEvent>,
): WeeklyDigestPerInstance | null {
  const allPatterns: ReadonlyArray<LifecyclePatternSeed> = [
    ...SOURCE_LIFECYCLE_PATTERNS,
    ...PROGRAM_LIFECYCLE_PATTERNS,
  ];
  const pattern = lookupPattern(instance, allPatterns);
  if (!pattern) return null;

  const missions = deriveMissionsFromInstance(instance, pattern);

  let contradictionCount = 0;
  let failureModeCount = 0;
  try {
    const ctx = isProgramInstance(instance)
      ? buildProgramSynthesisContext(instance, pattern)
      : buildSourceSynthesisContext(instance, pattern);
    contradictionCount = ctx.activeContradictions.length;
    failureModeCount = ctx.failureModes.length;
  } catch {
    // Defensive — if a builder throws on a malformed fixture, we still
    // want the digest row to render with zeros rather than 500.
    contradictionCount = 0;
    failureModeCount = 0;
  }

  let synthesisCount = 0;
  for (const ev of windowEvents) {
    if (ev.instanceId === instance.id) synthesisCount += 1;
  }

  return {
    instanceId: instance.id,
    instanceLabel: instance.name,
    synthesisCount,
    missionsPending: missions.length,
    contradictionCount,
    failureModeCount,
  };
}

/**
 * Build the weekly digest. Pure: pass `nowMs` to anchor the rolling
 * window deterministically (tests + scheduled jobs); omit it to use the
 * current wall clock.
 */
export function buildWeeklyDigest(nowMs?: number): WeeklyDigest {
  const anchorMs = typeof nowMs === 'number' ? nowMs : Date.now();
  const windowStartMs = anchorMs - WEEKLY_DIGEST_WINDOW_DAYS * MS_PER_DAY;

  const allEvents = getRecentSynthesisEvents();
  const windowEvents = filterEventsToWindow(allEvents, windowStartMs, anchorMs);

  let cacheHits = 0;
  let feedbackUp = 0;
  let feedbackDown = 0;
  const patternCounts = new Map<string, number>();
  for (const ev of windowEvents) {
    if (ev.cacheHit) cacheHits += 1;
    if (ev.feedback === 'up') feedbackUp += 1;
    else if (ev.feedback === 'down') feedbackDown += 1;
    if (ev.patternId) {
      patternCounts.set(ev.patternId, (patternCounts.get(ev.patternId) ?? 0) + 1);
    }
  }

  const synthesisEventCount = windowEvents.length;
  const cacheHitRate =
    synthesisEventCount === 0 ? 0 : cacheHits / synthesisEventCount;

  // Per-instance rows — Source events first (alphabetical by id), then
  // program instances (alphabetical by id). Stable ordering so digests
  // diff cleanly across runs.
  const orderedInstances: ReasoningInstance[] = [
    ...[...SOURCE_EVENT_INSTANCES].sort((a, b) =>
      a.id < b.id ? -1 : a.id > b.id ? 1 : 0,
    ),
    ...[...APEX_RETAIL_PROGRAM_INSTANCES].sort((a, b) =>
      a.id < b.id ? -1 : a.id > b.id ? 1 : 0,
    ),
  ];

  const perInstance: WeeklyDigestPerInstance[] = [];
  for (const instance of orderedInstances) {
    const row = buildPerInstanceRow(instance, windowEvents);
    if (row) perInstance.push(row);
  }

  const topPatterns: WeeklyDigestTopPattern[] = Array.from(
    patternCounts.entries(),
  )
    .map(([patternId, count]) => ({ patternId, count }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.patternId.localeCompare(b.patternId);
    })
    .slice(0, 5);

  return {
    windowStart: new Date(windowStartMs).toISOString(),
    windowEnd: new Date(anchorMs).toISOString(),
    synthesisEventCount,
    cacheHitRate,
    feedbackUpCount: feedbackUp,
    feedbackDownCount: feedbackDown,
    perInstance,
    topPatterns,
  };
}
