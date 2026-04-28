/**
 * Mission derivation — auto-derives Steward mission queue entries from the
 * gate evaluator output so the queue stays in sync with reality without
 * manual fixture maintenance.
 *
 * A pending or partial gate criterion IS a mission: "upload pricing
 * comparison artifact to satisfy the BAFO compliance gate".
 *
 * Pure module — no IO, no Date.now(), no randomness. Same inputs always
 * produce the same outputs.
 */

import type { LifecyclePatternSeed } from '@/lib/intelligence/seed-types';
import type { SourceEventInstance } from '@/lib/source/source-event-instance';
import type { ProgramInstance } from '@/lib/programs/program-instance';
import { buildEvidenceMap } from '@/lib/source/source-event-instance';
import { buildProgramEvidenceMap } from '@/lib/programs/program-instance';
import { createGateEvaluator } from './gate-evaluator';
import type { StageEvaluationResult } from './types';

// ─── Public types ─────────────────────────────────────────────────────────────

export type DerivedMissionPriority = 'high' | 'medium' | 'low';

export interface DerivedMission {
  /** Stable id of the form `${instanceId}:${criterionId}`. */
  readonly id: string;
  /** Identifier of the originating instance (program or source event). */
  readonly instanceId: string;
  /** Human-readable label for the originating instance. */
  readonly instanceLabel: string;
  /** Pattern that authored the criterion. */
  readonly patternId: string;
  /** Stage that the criterion guards. */
  readonly stageId: string;
  /** Stable id of the gate criterion. */
  readonly criterionId: string;
  /** Short imperative label suitable for a mission strip / list. */
  readonly label: string;
  /** Plain-language description of the criterion (from the pattern). */
  readonly description: string;
  /** Whether the gate is hard (blocks advancement) or soft. */
  readonly gateType: 'hard' | 'soft';
  /**
   * Priority for queue ordering.
   * - hard pending → high
   * - hard partial → medium
   * - soft pending or partial → low
   */
  readonly priority: DerivedMissionPriority;
  /** Hint text describing what evidence would satisfy the criterion. */
  readonly evaluationHint: string;
}

// ─── Instance type narrowing ──────────────────────────────────────────────────

type ReasoningInstance = SourceEventInstance | ProgramInstance;

function isProgramInstance(
  instance: ReasoningInstance,
): instance is ProgramInstance {
  return (
    typeof (instance as ProgramInstance).currentPhase === 'number' &&
    Array.isArray((instance as ProgramInstance).phases)
  );
}

function instanceLabel(instance: ReasoningInstance): string {
  return instance.name;
}

function currentStageId(instance: ReasoningInstance): string {
  if (isProgramInstance(instance)) {
    const current = instance.phases.find(
      (p) => p.phaseId === instance.currentPhase,
    );
    if (current) {
      // Program patterns use the phase label as stage id (e.g. "Synthesis").
      return current.phaseLabel;
    }
    return String(instance.currentPhase);
  }
  return instance.currentStage;
}

function buildEvidence(instance: ReasoningInstance): Record<string, unknown> {
  if (isProgramInstance(instance)) {
    return buildProgramEvidenceMap(instance);
  }
  return buildEvidenceMap(instance);
}

// ─── Derivation helpers ───────────────────────────────────────────────────────

/**
 * Map a gate evaluation result to a DerivedMission priority.
 *
 * | gateType | status   | priority |
 * | -------- | -------- | -------- |
 * | hard     | unmet    | high     |
 * | hard     | partial  | medium   |
 * | soft     | unmet    | low      |
 * | soft     | partial  | low      |
 */
function priorityFor(
  gateType: 'hard' | 'soft',
  status: 'unmet' | 'partial',
): DerivedMissionPriority {
  if (gateType === 'hard' && status === 'unmet') return 'high';
  if (gateType === 'hard' && status === 'partial') return 'medium';
  return 'low';
}

/**
 * Build a short imperative label from a criterion description.
 *
 * The pattern descriptions are typically declarative ("BAFO responses
 * received from at least two finalists"). For the mission strip we want an
 * imperative phrasing that reads as a next action. We do this by prefixing
 * "Satisfy " when the description does not already start with a verb.
 */
function buildLabel(description: string): string {
  const trimmed = description.trim();
  if (trimmed.length === 0) return 'Satisfy gate criterion';
  const firstWord = trimmed.split(/\s+/, 1)[0]?.toLowerCase() ?? '';
  // Heuristic: if the description already opens with a recognised imperative
  // verb, use it as-is; otherwise prefix "Satisfy".
  const IMPERATIVE_VERBS = new Set([
    'upload',
    'submit',
    'confirm',
    'capture',
    'attach',
    'record',
    'review',
    'execute',
    'lock',
    'issue',
    'normalize',
    'normalise',
    'receive',
    'present',
    'sign',
    'verify',
    'complete',
    'finalize',
    'finalise',
    'approve',
    'gather',
    'identify',
    'demonstrate',
    'document',
    'validate',
  ]);
  if (IMPERATIVE_VERBS.has(firstWord)) {
    return trimmed;
  }
  return `Satisfy: ${trimmed}`;
}

/**
 * Pure derivation — returns DerivedMission[] for every pending/partial gate
 * criterion across all stages of the pattern, sorted with high → medium → low,
 * tie-broken by (stageId, criterionId).
 */
export function deriveMissionsFromInstance(
  instance: ReasoningInstance,
  pattern: LifecyclePatternSeed,
): DerivedMission[] {
  const evaluator = createGateEvaluator(pattern);
  const evidenceMap = buildEvidence(instance);
  const stages: StageEvaluationResult[] = evaluator.evaluateAllStages(
    currentStageId(instance),
    evidenceMap,
  );

  // Build a quick lookup from criterionId → criterion (for description / hint).
  const criterionLookup = new Map<
    string,
    LifecyclePatternSeed['gateCriteria'][number]
  >();
  for (const c of pattern.gateCriteria) {
    criterionLookup.set(c.id, c);
  }

  // Dedupe by criterionId — `evaluateAllStages` may return the same criterion
  // twice when the gate-evaluator's "fallback to current-stage criteria" path
  // overlaps with the "criteria-guarding-next-stage" path on the final stage.
  const seen = new Set<string>();
  const missions: DerivedMission[] = [];
  for (const stage of stages) {
    for (const evaluation of stage.gateEvaluations) {
      if (
        evaluation.status !== 'unmet' &&
        evaluation.status !== 'partial'
      ) {
        continue;
      }
      if (seen.has(evaluation.criterionId)) continue;
      seen.add(evaluation.criterionId);
      const criterion = criterionLookup.get(evaluation.criterionId);
      const description = criterion?.description ?? '';
      const evaluationHint = criterion?.evaluationHint ?? '';
      missions.push({
        id: `${instance.id}:${evaluation.criterionId}`,
        instanceId: instance.id,
        instanceLabel: instanceLabel(instance),
        patternId: pattern.patternId,
        stageId: evaluation.stageId,
        criterionId: evaluation.criterionId,
        label: buildLabel(description),
        description,
        gateType: evaluation.gateType,
        priority: priorityFor(evaluation.gateType, evaluation.status),
        evaluationHint,
      });
    }
  }

  return sortMissions(missions);
}

/**
 * Iterate across an instance list and derive missions for every (instance,
 * pattern) pair where a matching pattern is present.
 *
 * Matching is by `patternId`. Instances with no matching pattern in the given
 * `patterns` array are silently skipped — callers that want to enforce
 * coverage should validate ahead of time.
 */
export function deriveAllMissions(
  instances: readonly ReasoningInstance[],
  patterns: readonly LifecyclePatternSeed[],
): DerivedMission[] {
  const patternLookup = new Map<string, LifecyclePatternSeed>();
  for (const pattern of patterns) {
    patternLookup.set(pattern.patternId, pattern);
  }

  const all: DerivedMission[] = [];
  for (const instance of instances) {
    const pattern = patternLookup.get(instance.patternId);
    if (!pattern) continue;
    for (const mission of deriveMissionsFromInstance(instance, pattern)) {
      all.push(mission);
    }
  }

  return sortMissions(all);
}

// ─── Sorting ─────────────────────────────────────────────────────────────────

const PRIORITY_RANK: Record<DerivedMissionPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

/**
 * Stable sort by:
 *   1. priority (high → medium → low)
 *   2. instanceId (so missions cluster by instance within priority band)
 *   3. stageId
 *   4. criterionId
 */
function sortMissions(missions: DerivedMission[]): DerivedMission[] {
  return [...missions].sort((a, b) => {
    const priorityDelta = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (priorityDelta !== 0) return priorityDelta;
    if (a.instanceId !== b.instanceId) {
      return a.instanceId < b.instanceId ? -1 : 1;
    }
    if (a.stageId !== b.stageId) {
      return a.stageId < b.stageId ? -1 : 1;
    }
    if (a.criterionId !== b.criterionId) {
      return a.criterionId < b.criterionId ? -1 : 1;
    }
    return 0;
  });
}
