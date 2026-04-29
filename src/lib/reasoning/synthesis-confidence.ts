/**
 * Synthesis confidence scoring — REASON-30
 *
 * Computes a 0–100 confidence score over a SynthesisContext, summarising
 * how well-grounded the synthesis is given:
 *   • gate criterion completeness
 *   • active contradictions
 *   • active failure-mode detections
 *   • evidence / citation count
 *
 * Pure function: same inputs → same outputs. No side-effects.
 */

import type { SynthesisContext } from '@/lib/reasoning/types';

// ─── Public types ─────────────────────────────────────────────────────────────

export type ConfidenceGrade = 'high' | 'medium' | 'low';

export interface SynthesisConfidenceResult {
  /** Numeric confidence score clamped to [0, 100]. */
  score: number;
  /** Coarse grade derived from the score. */
  grade: ConfidenceGrade;
  /** Human-readable factor descriptions used in the tooltip. */
  factors: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PENALTY_PER_UNMET_GATE = 5;
const PENALTY_PER_CONTRADICTION = 8;
const PENALTY_PER_FAILURE_MODE = 6;
const PENALTY_LOW_EVIDENCE = 10;
const BONUS_HIGH_EVIDENCE = 5;

const EVIDENCE_LOW_THRESHOLD = 3;
const EVIDENCE_HIGH_THRESHOLD = 5;

const GRADE_HIGH_MIN = 75;
const GRADE_MEDIUM_MIN = 45;

// ─── Implementation ───────────────────────────────────────────────────────────

/**
 * Compute a synthesis confidence result from a SynthesisContext.
 *
 * Algorithm (start at 100):
 *   - Each unmet gate criterion:       −5
 *   - Each active contradiction:       −8
 *   - Each active failure mode:        −6
 *   - Evidence count < 3:             −10
 *   - Evidence count ≥ 5:             +5 (bonus)
 *   - Clamp to [0, 100]
 *
 * Grade thresholds: high ≥ 75 · medium ≥ 45 · low < 45
 */
export function computeSynthesisConfidence(
  context: SynthesisContext,
): SynthesisConfidenceResult {
  let score = 100;
  const factors: string[] = [];

  // ── Gate criteria ──────────────────────────────────────────────────────────
  const totalGates = context.gatesSummary.total;
  const metGates = context.gatesSummary.met;
  const unmetGates = Math.max(0, totalGates - metGates);

  if (totalGates > 0) {
    factors.push(`${metGates}/${totalGates} gate criteria met`);
  }

  if (unmetGates > 0) {
    const penalty = unmetGates * PENALTY_PER_UNMET_GATE;
    score -= penalty;
    factors.push(`${unmetGates} unmet gate criteria (−${penalty})`);
  }

  // ── Contradictions ─────────────────────────────────────────────────────────
  const contradictionCount = context.activeContradictions.length;
  if (contradictionCount > 0) {
    const penalty = contradictionCount * PENALTY_PER_CONTRADICTION;
    score -= penalty;
    factors.push(`${contradictionCount} active contradiction${contradictionCount === 1 ? '' : 's'} (−${penalty})`);
  }

  // ── Failure modes ──────────────────────────────────────────────────────────
  const failureModeCount = context.failureModes.length;
  if (failureModeCount > 0) {
    const penalty = failureModeCount * PENALTY_PER_FAILURE_MODE;
    score -= penalty;
    factors.push(`${failureModeCount} active failure mode${failureModeCount === 1 ? '' : 's'} (−${penalty})`);
  }

  // ── Evidence / citations ───────────────────────────────────────────────────
  const evidenceCount = context.citations.length;

  if (evidenceCount < EVIDENCE_LOW_THRESHOLD) {
    score -= PENALTY_LOW_EVIDENCE;
    factors.push(`Only ${evidenceCount} evidence citation${evidenceCount === 1 ? '' : 's'} (−${PENALTY_LOW_EVIDENCE})`);
  } else if (evidenceCount >= EVIDENCE_HIGH_THRESHOLD) {
    score += BONUS_HIGH_EVIDENCE;
    factors.push(`${evidenceCount} evidence citations (+${BONUS_HIGH_EVIDENCE})`);
  } else {
    factors.push(`${evidenceCount} evidence citations`);
  }

  // ── Clamp & grade ──────────────────────────────────────────────────────────
  const clamped = Math.min(100, Math.max(0, score));
  const grade = gradeFromScore(clamped);

  return { score: clamped, grade, factors };
}

function gradeFromScore(score: number): ConfidenceGrade {
  if (score >= GRADE_HIGH_MIN) return 'high';
  if (score >= GRADE_MEDIUM_MIN) return 'medium';
  return 'low';
}
