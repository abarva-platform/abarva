/**
 * Synthesis diff — REASON-32
 *
 * Pure functions that compute the delta between two SynthesisContext snapshots.
 * Used by SynthesisDiffPanel to render what changed when evidence is added.
 *
 * Algorithm:
 *   • gatesImproved  — criteria whose status changed from non-met to met/waived
 *   • gatesWorsened  — criteria whose status changed from met/waived to non-met
 *   • newContradictions     — templateIds present in `after` but not `before`
 *   • resolvedContradictions — templateIds present in `before` but not `after`
 *   • confidenceDelta — after.score − before.score (uses synthesis-confidence)
 *   • evidenceDelta   — after.citations.length − before.citations.length
 *
 * Both "before" and "after" are ordinary SynthesisContext objects, so the
 * caller controls how the comparison states are constructed (e.g. real
 * before/after snapshots, or a simulated "remove one evidence item" snapshot).
 */

import type { SynthesisContext, GateEvaluation, ContradictionDetection } from '@/lib/reasoning/types';
import { computeSynthesisConfidence } from '@/lib/reasoning/synthesis-confidence';

// ─── Public types ─────────────────────────────────────────────────────────────

export interface SynthesisDiff {
  /** Gate criteria that changed from unmet/partial → met/waived. */
  gatesImproved: GateEvaluation[];
  /** Gate criteria that changed from met/waived → unmet/partial. */
  gatesWorsened: GateEvaluation[];
  /** Contradiction detections newly present in `after` but absent in `before`. */
  newContradictions: ContradictionDetection[];
  /** Contradiction detections present in `before` but absent from `after`. */
  resolvedContradictions: ContradictionDetection[];
  /**
   * Change in synthesis confidence score (integer, can be negative).
   * Computed as Math.round(afterScore − beforeScore).
   */
  confidenceDelta: number;
  /**
   * Change in citation/evidence count.
   * Computed as after.citations.length − before.citations.length.
   */
  evidenceDelta: number;
}

// ─── Implementation ───────────────────────────────────────────────────────────

/**
 * Compute the diff between two SynthesisContext snapshots.
 *
 * Both `before` and `after` must reference the same instance (i.e. same
 * instanceId) — the function does not validate this; callers are responsible.
 *
 * Gate matching is keyed on `criterionId` so renaming stageIds does not
 * produce spurious diffs.
 *
 * Contradiction matching is keyed on `templateId`.
 */
export function computeSynthesisDiff(
  before: SynthesisContext,
  after: SynthesisContext,
): SynthesisDiff {
  // ── Gate diff ──────────────────────────────────────────────────────────────
  // Collect all gate evaluations from both snapshots, keyed by criterionId.
  // The SynthesisContext only carries `gatesSummary.blocked` (hard unmet gates);
  // to reconstruct the full per-criterion map we use blocked + met/total counts.
  // For a clean diff we work with the blocked sets directly:
  //   • a criterion that was blocked before but not after → improved
  //   • a criterion that is blocked after but was not before → worsened
  const beforeBlockedIds = new Set(before.gatesSummary.blocked.map((g) => g.criterionId));
  const afterBlockedIds = new Set(after.gatesSummary.blocked.map((g) => g.criterionId));

  // Criteria that were blocked before and are no longer blocked → improved
  const gatesImproved: GateEvaluation[] = before.gatesSummary.blocked.filter(
    (g) => !afterBlockedIds.has(g.criterionId),
  );

  // Criteria that are blocked now but were not blocked before → worsened
  const gatesWorsened: GateEvaluation[] = after.gatesSummary.blocked.filter(
    (g) => !beforeBlockedIds.has(g.criterionId),
  );

  // ── Contradiction diff ─────────────────────────────────────────────────────
  const beforeContradictionIds = new Set(
    before.activeContradictions.map((c) => c.templateId),
  );
  const afterContradictionIds = new Set(
    after.activeContradictions.map((c) => c.templateId),
  );

  const newContradictions: ContradictionDetection[] = after.activeContradictions.filter(
    (c) => !beforeContradictionIds.has(c.templateId),
  );

  const resolvedContradictions: ContradictionDetection[] = before.activeContradictions.filter(
    (c) => !afterContradictionIds.has(c.templateId),
  );

  // ── Confidence delta ───────────────────────────────────────────────────────
  const beforeScore = computeSynthesisConfidence(before).score;
  const afterScore = computeSynthesisConfidence(after).score;
  const confidenceDelta = Math.round(afterScore - beforeScore);

  // ── Evidence delta ─────────────────────────────────────────────────────────
  const evidenceDelta = after.citations.length - before.citations.length;

  return {
    gatesImproved,
    gatesWorsened,
    newContradictions,
    resolvedContradictions,
    confidenceDelta,
    evidenceDelta,
  };
}

/**
 * Returns true when a SynthesisDiff contains no changes — all arrays are
 * empty and all numeric deltas are zero. Useful for rendering "No changes
 * detected" fallback UI.
 */
export function isSynthesisDiffEmpty(diff: SynthesisDiff): boolean {
  return (
    diff.gatesImproved.length === 0 &&
    diff.gatesWorsened.length === 0 &&
    diff.newContradictions.length === 0 &&
    diff.resolvedContradictions.length === 0 &&
    diff.confidenceDelta === 0 &&
    diff.evidenceDelta === 0
  );
}

/**
 * Derive a simulated "before" SynthesisContext by removing the last citation
 * from `current`. This is a lightweight simulation of what the context looked
 * like before the most recent evidence was added; it does not re-run the full
 * gate evaluator. Used by SynthesisDiffPanel when no historical snapshot is
 * available.
 *
 * The returned context inherits all fields from `current` except:
 *   • `citations`    — last item removed
 *   • `gatesSummary` — approximated: if citations shrinks below the
 *                      evidence threshold, shift one met gate to unmet to
 *                      reflect the lower evidence coverage signal. This is
 *                      intentionally approximate; exact re-evaluation would
 *                      require re-running the gate evaluator.
 *   • `builtAt`      — set to current.builtAt − 1 to signal "older"
 */
export function simulateBeforeContext(current: SynthesisContext): SynthesisContext {
  if (current.citations.length === 0) {
    // Nothing to remove — return a shallow clone with zero confidence delta
    return { ...current, builtAt: current.builtAt - 1 };
  }

  const trimmedCitations = current.citations.slice(0, -1);

  // If the current context has some met gates and removing a citation drops
  // evidence below the "low evidence" penalty threshold (3 in synthesis-confidence),
  // simulate one extra blocked gate so the confidence bar shows a visible drop.
  const LOW_EVIDENCE_THRESHOLD = 3;
  let simulatedBlocked = current.gatesSummary.blocked;
  let simulatedMet = current.gatesSummary.met;

  if (
    current.citations.length >= LOW_EVIDENCE_THRESHOLD &&
    trimmedCitations.length < LOW_EVIDENCE_THRESHOLD &&
    current.gatesSummary.met > 0 &&
    simulatedBlocked.length < current.gatesSummary.total
  ) {
    // Construct a synthetic gate entry for the "evidence coverage" signal
    const syntheticGate = {
      criterionId: '__evidence-coverage-gate__',
      stageId: current.currentStage,
      status: 'unmet' as const,
      gateType: 'hard' as const,
      evidence: [],
      description: 'Evidence coverage threshold',
      evaluationHint: 'Add at least 3 evidence citations to improve synthesis coverage.',
      patternRef: {
        patternId: current.patternId,
        patternVersion: current.patternVersion,
        section: '§ Evidence coverage',
      },
      evaluatedAt: current.builtAt - 1,
    };
    simulatedBlocked = [...simulatedBlocked, syntheticGate];
    simulatedMet = Math.max(0, simulatedMet - 1);
  }

  return {
    ...current,
    citations: trimmedCitations,
    gatesSummary: {
      ...current.gatesSummary,
      met: simulatedMet,
      unmet: current.gatesSummary.total - simulatedMet,
      blocked: simulatedBlocked,
    },
    builtAt: current.builtAt - 1,
  };
}
