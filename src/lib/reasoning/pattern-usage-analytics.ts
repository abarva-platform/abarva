/**
 * Pattern usage analytics — pure aggregation across the reasoning layer.
 *
 * For each lifecycle pattern (7 source-event + 6 program = 13), this module
 * computes the operational footprint: how many fixture instances are bound,
 * how much of the contradiction / failure-mode template surface actually
 * fires on those instances, and how many synthesis + cascade telemetry
 * events have referenced the pattern recently.
 *
 * The output drives `/admin/reasoning/patterns`. It is the per-pattern
 * companion to the surface-level `summarizeTelemetry` view-model and the
 * cross-pattern `auditAll` coverage view — finer-grained than the former,
 * richer than the latter.
 *
 * Pure: no I/O, no clock reads (the synthesis-event telemetry buffer carries
 * its own ISO timestamps; we read those, but do not re-stamp). The only
 * non-deterministic input is the `now` parameter used for the 24-hour window
 * on synthesis events; tests pin it for reproducibility, while callers in
 * production pass `Date.now()`.
 */

import type { LifecyclePatternSeed } from '@/lib/intelligence/seed-types';
import type { SynthesisTelemetryEvent } from '@/lib/reasoning/synthesis-telemetry';
import type { CascadeTelemetryEvent } from '@/lib/reasoning/cascade-telemetry';
import {
  getAllLifecyclePatterns,
} from '@/lib/reasoning/lifecycle-pattern-lookup';
import { getRecentSynthesisEvents } from '@/lib/reasoning/synthesis-telemetry';
import { getRecentCascadeEvents } from '@/lib/reasoning/cascade-telemetry';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import {
  buildEvidenceMap,
  type SourceEventInstance,
} from '@/lib/source/source-event-instance';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import {
  buildProgramEvidenceMap,
  type ProgramInstance,
} from '@/lib/programs/program-instance';
import { createContradictionDetector } from './contradiction-detector';
import { createFailureModeDetector } from './failure-mode-detector';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Per-pattern aggregate row. One per LifecyclePatternSeed (7 source + 6 program).
 *
 * `totalEvents` is the sum used for sorting:
 *   synthesisEventCount + cascadeAsSourceCount + cascadeAsTargetCount.
 *
 * Coverage ratios are 0..1 with 0 returned for empty totals (rather than NaN).
 */
export interface PatternUsageRow {
  patternId: string;
  patternLabel: string;
  /** Slug for cross-linking into `/source/patterns/[patternId]`. */
  patternSlug: string;
  /** 'source-event' for PAT-SRC-*, 'program' for PAT-PRG-*. */
  family: 'source-event' | 'program';

  /** Bound fixture instances. */
  instanceCount: number;
  /** Stable list of bound instance ids, in fixture declaration order. */
  instanceIds: string[];

  /** How many contradiction templates the pattern declares. */
  contradictionTemplateCount: number;
  /** How many of those templates fire on at least one bound instance. */
  contradictionTemplatesCovered: number;
  /** coveredTemplates / templateCount; 0 when templateCount === 0. */
  contradictionCoverageRatio: number;

  /** How many failure-mode templates the pattern declares. */
  failureModeTemplateCount: number;
  /** How many of those failure-modes fire on at least one bound instance. */
  failureModesCovered: number;
  /** coveredTemplates / templateCount; 0 when templateCount === 0. */
  failureModeCoverageRatio: number;

  /** Total synthesis telemetry events referencing this pattern. */
  synthesisEventCount: number;
  /** Synthesis telemetry events recorded within the last 24h. */
  synthesisEventCountLast24h: number;
  /** Cascade events where this pattern's instance was the trigger. */
  cascadeAsSourceCount: number;
  /** Cascade events where this pattern's instance was the target. */
  cascadeAsTargetCount: number;
  /** Sort key — sum of all three telemetry counts. */
  totalEvents: number;
}

export interface PatternUsageReport {
  /** Rows sorted by totalEvents desc, then patternId asc. */
  rows: PatternUsageRow[];
  /** Total patterns considered (always 13 for the current catalogue). */
  totalPatterns: number;
  /** Patterns with at least one bound fixture instance. */
  totalBound: number;
  /**
   * Mean of (contradictionCoverageRatio + failureModeCoverageRatio) / 2 across
   * patterns that have at least one declared template in either category.
   * 0 when no patterns qualify.
   */
  meanCoverageRatio: number;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

const MS_PER_DAY = 86_400_000;

function indexSourceInstancesByPattern(): Map<string, SourceEventInstance[]> {
  const map = new Map<string, SourceEventInstance[]>();
  for (const inst of SOURCE_EVENT_INSTANCES) {
    const list = map.get(inst.patternId) ?? [];
    list.push(inst);
    map.set(inst.patternId, list);
  }
  return map;
}

function indexProgramInstancesByPattern(): Map<string, ProgramInstance[]> {
  const map = new Map<string, ProgramInstance[]>();
  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    const list = map.get(inst.patternId) ?? [];
    list.push(inst);
    map.set(inst.patternId, list);
  }
  return map;
}

interface BoundInstance {
  id: string;
  evidenceMap: Record<string, unknown>;
}

function instancesForPattern(
  patternId: string,
  srcIndex: Map<string, SourceEventInstance[]>,
  prgIndex: Map<string, ProgramInstance[]>,
): BoundInstance[] {
  const out: BoundInstance[] = [];
  for (const inst of srcIndex.get(patternId) ?? []) {
    out.push({ id: inst.id, evidenceMap: buildEvidenceMap(inst) });
  }
  for (const inst of prgIndex.get(patternId) ?? []) {
    out.push({ id: inst.id, evidenceMap: buildProgramEvidenceMap(inst) });
  }
  return out;
}

function familyForPattern(patternId: string): 'source-event' | 'program' {
  return patternId.startsWith('PAT-PRG-') ? 'program' : 'source-event';
}

function safeRatio(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return numerator / denominator;
}

function countContradictionsCovered(
  pattern: LifecyclePatternSeed,
  instances: BoundInstance[],
): number {
  if (instances.length === 0 || pattern.contradictionTemplates.length === 0) {
    return 0;
  }
  const detector = createContradictionDetector(pattern);
  let covered = 0;
  for (const template of pattern.contradictionTemplates) {
    const fires = instances.some((inst) =>
      detector.detect(inst.evidenceMap).some((d) => d.templateId === template.id),
    );
    if (fires) covered += 1;
  }
  return covered;
}

function countFailureModesCovered(
  pattern: LifecyclePatternSeed,
  instances: BoundInstance[],
): number {
  if (instances.length === 0 || pattern.failureModes.length === 0) return 0;
  const detector = createFailureModeDetector(pattern);
  let covered = 0;
  for (const failureMode of pattern.failureModes) {
    const fires = instances.some((inst) =>
      detector
        .detect(inst.evidenceMap)
        .some((d) => d.failureModeId === failureMode.id),
    );
    if (fires) covered += 1;
  }
  return covered;
}

function countSynthesisEvents(
  patternId: string,
  events: ReadonlyArray<SynthesisTelemetryEvent>,
  now: number,
): { total: number; last24h: number } {
  let total = 0;
  let last24h = 0;
  const cutoff = now - MS_PER_DAY;
  for (const event of events) {
    if (event.patternId !== patternId) continue;
    total += 1;
    const ts = Date.parse(event.timestamp);
    if (Number.isFinite(ts) && ts >= cutoff) last24h += 1;
  }
  return { total, last24h };
}

function countCascadeEvents(
  instanceIds: ReadonlyArray<string>,
  events: ReadonlyArray<CascadeTelemetryEvent>,
): { asSource: number; asTarget: number } {
  if (instanceIds.length === 0) return { asSource: 0, asTarget: 0 };
  const idSet = new Set(instanceIds);
  let asSource = 0;
  let asTarget = 0;
  for (const event of events) {
    if (idSet.has(event.sourceInstanceId)) asSource += 1;
    if (idSet.has(event.targetInstanceId)) asTarget += 1;
  }
  return { asSource, asTarget };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface ComputePatternUsageOptions {
  /** Synthesis telemetry events to read; defaults to the live ring buffer. */
  synthesisEvents?: ReadonlyArray<SynthesisTelemetryEvent>;
  /** Cascade telemetry events to read; defaults to the live ring buffer. */
  cascadeEvents?: ReadonlyArray<CascadeTelemetryEvent>;
  /** Reference timestamp for the 24h synthesis window. Defaults to `Date.now()`. */
  now?: number;
}

/**
 * Compute per-pattern usage analytics.
 *
 * Pure aggregation: enumerate every lifecycle pattern, count bound
 * fixtures, run the keyword-based template-coverage audit, and tally
 * synthesis + cascade telemetry events. Returns rows sorted by
 * `totalEvents` desc with `patternId` as the deterministic tie-break.
 *
 * Tests should pass deterministic `synthesisEvents`, `cascadeEvents`, and
 * `now` to avoid coupling to global ring-buffer state.
 */
export function computePatternUsage(
  options: ComputePatternUsageOptions = {},
): PatternUsageReport {
  const synthesisEvents = options.synthesisEvents ?? getRecentSynthesisEvents();
  const cascadeEvents = options.cascadeEvents ?? getRecentCascadeEvents();
  const now = options.now ?? Date.now();

  const srcIndex = indexSourceInstancesByPattern();
  const prgIndex = indexProgramInstancesByPattern();

  const patterns = getAllLifecyclePatterns();
  const rows: PatternUsageRow[] = [];

  let totalBound = 0;
  let coverageSum = 0;
  let coverageCount = 0;

  for (const pattern of patterns) {
    const instances = instancesForPattern(pattern.patternId, srcIndex, prgIndex);
    const instanceIds = instances.map((i) => i.id);

    const cTemplateCount = pattern.contradictionTemplates.length;
    const fTemplateCount = pattern.failureModes.length;
    const cCovered = countContradictionsCovered(pattern, instances);
    const fCovered = countFailureModesCovered(pattern, instances);
    const cRatio = safeRatio(cCovered, cTemplateCount);
    const fRatio = safeRatio(fCovered, fTemplateCount);

    const synthesisCounts = countSynthesisEvents(pattern.patternId, synthesisEvents, now);
    const cascadeCounts = countCascadeEvents(instanceIds, cascadeEvents);

    const totalEvents =
      synthesisCounts.total + cascadeCounts.asSource + cascadeCounts.asTarget;

    if (instances.length > 0) totalBound += 1;
    if (cTemplateCount > 0 || fTemplateCount > 0) {
      // Average of the two ratios; categories with zero declared templates
      // contribute 0 to the per-pattern average rather than NaN.
      coverageSum += (cRatio + fRatio) / 2;
      coverageCount += 1;
    }

    rows.push({
      patternId: pattern.patternId,
      patternLabel: pattern.title,
      patternSlug: pattern.slug,
      family: familyForPattern(pattern.patternId),
      instanceCount: instances.length,
      instanceIds,
      contradictionTemplateCount: cTemplateCount,
      contradictionTemplatesCovered: cCovered,
      contradictionCoverageRatio: cRatio,
      failureModeTemplateCount: fTemplateCount,
      failureModesCovered: fCovered,
      failureModeCoverageRatio: fRatio,
      synthesisEventCount: synthesisCounts.total,
      synthesisEventCountLast24h: synthesisCounts.last24h,
      cascadeAsSourceCount: cascadeCounts.asSource,
      cascadeAsTargetCount: cascadeCounts.asTarget,
      totalEvents,
    });
  }

  rows.sort((a, b) => {
    if (b.totalEvents !== a.totalEvents) return b.totalEvents - a.totalEvents;
    return a.patternId.localeCompare(b.patternId);
  });

  return {
    rows,
    totalPatterns: patterns.length,
    totalBound,
    meanCoverageRatio: coverageCount === 0 ? 0 : coverageSum / coverageCount,
  };
}
