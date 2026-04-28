/**
 * Gate Evaluator — REASON-6
 *
 * Deterministic, pure gate evaluation for lifecycle pattern instances.
 * No LLM calls, no network access, no randomness.
 *
 * The evaluator takes a LifecyclePatternSeed and evaluates gate criteria
 * against a flat evidence map (Record<string, unknown>) that the caller
 * extracts from their instance.  This keeps the evaluator instance-type-agnostic
 * and forward-compatible as SourceEventInstance shapes evolve.
 *
 * Evaluation strategy: field-presence + evidence extraction.
 * - Direct key match:  evidenceMap[criterion.id] === true | 'met' | 'done' → 'met'
 * - Waiver key:        evidenceMap[`${criterion.id}_waived`] === true        → 'waived'
 * - Keyword match:     evidenceMap keys that contain words from criterion.description → 'partial'
 * - No match:                                                                 → 'unmet'
 */

import type {
  GateEvaluation,
  GateCriterionResult,
  StageEvaluationResult,
  GateStatus,
  PatternRef,
  ArtifactExpectation,
} from './types';
import type {
  LifecyclePatternSeed,
  GateCriterion,
} from '@/lib/intelligence/seed-types';

// ─── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Extract the evidence strings that a criterion can claim from the evidence map.
 *
 * Two sources:
 * 1. Direct key match — the criterion id itself as a key in the map.
 * 2. Keyword scan — map keys that contain at least one non-trivial word from the
 *    criterion description (case-insensitive substring).
 */
function extractEvidence(
  criterion: GateCriterion,
  evidenceMap: Record<string, unknown>,
): string[] {
  const evidence: string[] = [];

  // 1. Direct key match
  const directValue = evidenceMap[criterion.id];
  if (directValue !== undefined && directValue !== null) {
    evidence.push(formatEvidence(criterion.id, directValue));
  }

  // 2. Keyword scan against criterion description
  // Waiver keys (_waived suffix) are skipped — they are control signals, not evidence.
  const keywords = extractKeywords(criterion.description);
  for (const [key, value] of Object.entries(evidenceMap)) {
    // Skip the direct key (already handled above), any waiver keys, and
    // any criterion-id-style keys to avoid cross-criterion contamination.
    if (key === criterion.id) continue;
    if (key.endsWith('_waived')) continue;
    const keyLower = key.toLowerCase();
    if (keywords.some((kw) => keyLower.includes(kw))) {
      evidence.push(formatEvidence(key, value));
    }
  }

  return evidence;
}

/**
 * Format a key+value pair from the evidence map as a readable string.
 */
function formatEvidence(key: string, value: unknown): string {
  if (typeof value === 'boolean' || typeof value === 'number') {
    return `${key}=${String(value)}`;
  }
  if (typeof value === 'string') {
    return `${key}="${value}"`;
  }
  return `${key}=${JSON.stringify(value)}`;
}

/**
 * Extract meaningful keywords from a criterion description.
 * Strips common stop-words and short tokens so keyword matching is signal-rich.
 */
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'in', 'on', 'at', 'to', 'of', 'for',
  'with', 'by', 'is', 'are', 'was', 'be', 'as', 'per', 'from', 'has',
  'each', 'all', 'any', 'not', 'no', 'up', 'via', 'its', 'that',
]);

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s\W]+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

/**
 * Determine the GateStatus for a criterion given the evidence map and
 * already-extracted evidence strings.
 */
function determineStatus(
  criterion: GateCriterion,
  evidenceMap: Record<string, unknown>,
  matchingEvidence: string[],
): GateStatus {
  // Explicit waiver takes priority
  if (evidenceMap[`${criterion.id}_waived`] === true) return 'waived';

  // Direct confirmation — criterion id as key with a truthy confirm value
  const directValue = evidenceMap[criterion.id];
  if (directValue === true || directValue === 'met' || directValue === 'done') {
    return 'met';
  }

  // Numeric confirmation — any numeric evidence key with value ≥ 1 → partial
  // (full numeric threshold logic is pattern-specific; we conservatively use partial)

  // Keyword evidence present but can't fully confirm → partial
  if (matchingEvidence.length > 0) return 'partial';

  return 'unmet';
}

/**
 * Evaluate a single criterion against the evidence map and return a GateEvaluation.
 */
function evaluateCriterion(
  criterion: GateCriterion,
  evidenceMap: Record<string, unknown>,
  patternRef: PatternRef,
): GateEvaluation {
  const evidence = extractEvidence(criterion, evidenceMap);
  const status = determineStatus(criterion, evidenceMap, evidence);

  return {
    criterionId: criterion.id,
    stageId: criterion.stageId,
    status,
    gateType: criterion.gateType,
    evidence,
    patternRef: {
      ...patternRef,
      section: `§ Gate criteria — ${criterion.stageId}`,
    },
    evaluatedAt: Date.now(),
  };
}

// ─── LifecycleGateEvaluator ────────────────────────────────────────────────────

/**
 * Evaluates gate criteria for a given stage against a loose instance evidence map.
 *
 * `evaluateStage(currentStageId, evidenceMap)` returns the criteria the instance
 * must satisfy to ADVANCE FROM `currentStageId` to the next stage — i.e. criteria
 * whose `criterion.stageId` equals the ID of the next stage in the pattern.
 *
 * This matches the convention in LifecyclePatternSeed where each GateCriterion's
 * `stageId` names the DESTINATION stage it guards entry to.
 *
 * Example: `evaluateStage('BAFO', {})` returns GATE-AMS-BAFO-* criteria because
 * those criteria have `stageId: 'Selection'` (the next stage after BAFO).
 */
export class LifecycleGateEvaluator {
  private readonly pattern: LifecyclePatternSeed;
  private readonly patternRef: PatternRef;

  constructor(pattern: LifecyclePatternSeed) {
    this.pattern = pattern;
    this.patternRef = {
      patternId: pattern.patternId,
      patternVersion: pattern.version,
      section: '§ Gate criteria',
    };
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  /**
   * Returns the stage that immediately follows `stageId` in pattern order,
   * or null if `stageId` is the last stage.
   */
  private nextStageId(stageId: string): string | null {
    const sorted = [...this.pattern.stages].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((s) => s.id === stageId);
    if (idx === -1 || idx === sorted.length - 1) return null;
    return sorted[idx + 1].id;
  }

  /**
   * Returns criteria for a given current stage: those with `criterion.stageId`
   * equal to the next stage's id (gate criteria that must be cleared to advance).
   *
   * Falls back to criteria directly tagged with `currentStageId` if none are
   * found via the next-stage lookup (supports patterns that tag criteria directly
   * on the stage they govern rather than the destination stage).
   */
  private criteriaForStage(currentStageId: string): GateCriterion[] {
    const nextId = this.nextStageId(currentStageId);

    // Primary: criteria guarding entry to the NEXT stage
    if (nextId !== null) {
      const nextStageCriteria = this.pattern.gateCriteria.filter(
        (c) => c.stageId === nextId,
      );
      if (nextStageCriteria.length > 0) return nextStageCriteria;
    }

    // Fallback: criteria directly tagged with the current stage id
    return this.pattern.gateCriteria.filter((c) => c.stageId === currentStageId);
  }

  // ─── Public API ──────────────────────────────────────────────────────────────

  /**
   * Evaluate all gate criteria for a specific stage.
   * Returns one GateEvaluation per criterion defined for that stage.
   */
  evaluateStage(
    stageId: string,
    evidenceMap: Record<string, unknown>,
  ): GateEvaluation[] {
    const criteria = this.criteriaForStage(stageId);
    return criteria.map((c) => evaluateCriterion(c, evidenceMap, this.patternRef));
  }

  /**
   * Returns only unmet criteria as GateCriterionResult (includes description + hint).
   */
  unmetCriteria(
    stageId: string,
    evidenceMap: Record<string, unknown>,
  ): GateCriterionResult[] {
    const evaluations = this.evaluateStage(stageId, evidenceMap);
    const criteria = this.criteriaForStage(stageId);

    return evaluations
      .filter((e) => e.status !== 'met' && e.status !== 'waived')
      .map((e) => {
        const criterion = criteria.find((c) => c.id === e.criterionId);
        return {
          ...e,
          description: criterion?.description ?? '',
          evaluationHint: criterion?.evaluationHint ?? '',
        };
      });
  }

  /**
   * True if all HARD gate criteria for this stage are met or waived.
   */
  isHardGateMet(
    stageId: string,
    evidenceMap: Record<string, unknown>,
  ): boolean {
    const evaluations = this.evaluateStage(stageId, evidenceMap);
    return evaluations
      .filter((e) => e.gateType === 'hard')
      .every((e) => e.status === 'met' || e.status === 'waived');
  }

  /**
   * True if the instance can advance to the next stage (all hard gates met).
   */
  canAdvance(
    stageId: string,
    evidenceMap: Record<string, unknown>,
  ): boolean {
    return this.isHardGateMet(stageId, evidenceMap);
  }

  /**
   * Full evaluation for all stages in order.
   *
   * Stage statuses:
   * - `passed`   — stage is before the current stage
   * - `current`  — stage matches currentStageId and all hard gates are met
   * - `blocked`  — stage matches currentStageId but at least one hard gate is unmet
   * - `upcoming` — stage is after the current stage
   */
  evaluateAllStages(
    currentStageId: string,
    evidenceMap: Record<string, unknown>,
  ): StageEvaluationResult[] {
    const sorted = [...this.pattern.stages].sort((a, b) => a.order - b.order);
    const currentIdx = sorted.findIndex((s) => s.id === currentStageId);

    return sorted.map((stage, idx) => {
      const gateEvaluations = this.evaluateStage(stage.id, evidenceMap);
      const gatesMet = gateEvaluations.filter(
        (e) => e.status === 'met' || e.status === 'waived',
      ).length;

      // Artifacts expected at this stage that are not present
      const missingArtifacts: ArtifactExpectation[] = this.pattern.expectedArtifacts
        .filter((a) => a.stageId === stage.id)
        .map((a) => ({
          artifactId: a.id,
          label: a.label,
          stageId: a.stageId,
          requirement: a.requirement,
          gateType: a.gateType,
          present: false,
          patternRef: {
            ...this.patternRef,
            section: `§ Expected artifacts — ${stage.id}`,
          },
        }));

      let status: StageEvaluationResult['status'];
      if (idx < currentIdx) {
        status = 'passed';
      } else if (idx === currentIdx) {
        const hardGatesMet = gateEvaluations
          .filter((e) => e.gateType === 'hard')
          .every((e) => e.status === 'met' || e.status === 'waived');
        status = hardGatesMet ? 'current' : 'blocked';
      } else {
        status = 'upcoming';
      }

      return {
        stageId: stage.id,
        stageLabel: stage.label,
        order: stage.order,
        status,
        gateEvaluations,
        gatesMet,
        gatesTotal: gateEvaluations.length,
        missingArtifacts,
      };
    });
  }
}

// ─── Factory functions ─────────────────────────────────────────────────────────

/**
 * Creates a LifecycleGateEvaluator for the given lifecycle pattern.
 * Prefer this over `new LifecycleGateEvaluator(...)` so consumers don't need
 * to import the class directly.
 */
export function createGateEvaluator(
  pattern: LifecyclePatternSeed,
): LifecycleGateEvaluator {
  return new LifecycleGateEvaluator(pattern);
}

/**
 * Convenience: evaluate gates for a single stage against a loose evidence map.
 * Returns typed results ready for synthesis context building.
 */
export function evaluateStageGates(
  pattern: LifecyclePatternSeed,
  stageId: string,
  evidenceMap: Record<string, unknown>,
): GateEvaluation[] {
  return createGateEvaluator(pattern).evaluateStage(stageId, evidenceMap);
}
