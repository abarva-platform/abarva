// Evaluator scoring workflow — AI suggests, the human decides.
//
// Pure state-transition engine for VendorScore rows. Hard rules enforced here:
//  - An AI suggestion alone can NEVER become a final score.
//  - Overriding away from the AI suggestion requires a reason.
//  - Locking requires a named evaluator and an evaluator-decided final score.
//  - Locked scores are immutable except through an explicit unlock (with reason).
//  - Criteria must be client-approved before any score can be locked against them.

import type { EvaluationCriterion, VendorScore } from "./types";

export interface ScoreActionResult {
  ok: boolean;
  score?: VendorScore;
  error?: string;
}

/** Record an AI suggestion. Never touches evaluator/final fields. */
export function applyAiSuggestion(
  score: VendorScore,
  suggestion: {
    score: number;
    rationale: string;
    evidenceReference: string | null;
    confidence: "high" | "medium" | "low";
  },
): ScoreActionResult {
  if (score.locked) return { ok: false, error: "score is locked" };
  return {
    ok: true,
    score: {
      ...score,
      aiSuggestedScore: suggestion.score,
      aiRationale: suggestion.rationale,
      evidenceReference: suggestion.evidenceReference,
      aiConfidence: suggestion.confidence,
    },
  };
}

/** Evaluator sets their score/comment. A reason is required when departing from the AI suggestion. */
export function applyEvaluatorScore(
  score: VendorScore,
  input: {
    evaluatorId: string;
    score: number;
    comment?: string;
    overrideReason?: string;
  },
): ScoreActionResult {
  if (score.locked) return { ok: false, error: "score is locked" };
  if (!input.evaluatorId.trim())
    return { ok: false, error: "a named evaluator is required" };
  const departs =
    score.aiSuggestedScore !== null && input.score !== score.aiSuggestedScore;
  if (departs && !input.overrideReason?.trim()) {
    return {
      ok: false,
      error: "override reason required when departing from the AI suggestion",
    };
  }
  return {
    ok: true,
    score: {
      ...score,
      evaluatorScore: input.score,
      evaluatorComment: input.comment?.trim() || score.evaluatorComment,
      evaluatorId: input.evaluatorId,
      overrideReason: departs
        ? input.overrideReason!.trim()
        : score.overrideReason,
      finalScore: input.score, // final = the evaluator's decision
    },
  };
}

/** Lock the final score. Requires approved criteria + an evaluator-decided final. */
export function lockScore(
  score: VendorScore,
  criterion: EvaluationCriterion,
  by: string,
  atIso: string,
): ScoreActionResult {
  if (score.locked) return { ok: false, error: "score is already locked" };
  if (!by.trim()) return { ok: false, error: "a named locker is required" };
  if (!criterion.approvedBy) {
    return {
      ok: false,
      error: "criteria must be client-approved before scores can lock",
    };
  }
  if (score.finalScore === null || score.evaluatorId === null) {
    // hard rule: AI alone never finalizes
    return {
      ok: false,
      error:
        "an evaluator must set the score before it can lock — AI suggestions are never final",
    };
  }
  return {
    ok: true,
    score: { ...score, locked: true, lockedBy: by, lockedAt: atIso },
  };
}

/** Unlock requires an explicit reason (kept in evaluatorComment trail). */
export function unlockScore(
  score: VendorScore,
  by: string,
  reason: string,
): ScoreActionResult {
  if (!score.locked) return { ok: false, error: "score is not locked" };
  if (!reason.trim()) return { ok: false, error: "unlock reason required" };
  return {
    ok: true,
    score: {
      ...score,
      locked: false,
      lockedBy: null,
      lockedAt: null,
      evaluatorComment:
        `${score.evaluatorComment ?? ""}\n[unlocked by ${by}: ${reason.trim()}]`.trim(),
    },
  };
}

export interface VendorTotal {
  vendorName: string;
  /** weighted total over locked finals only; null when nothing is locked. */
  weightedTotal: number | null;
  lockedCount: number;
  totalCriteria: number;
  /** criteria where evaluator departed from the AI suggestion. */
  overrideCount: number;
}

/** Weighted totals — counts ONLY locked, evaluator-decided finals. */
export function computeVendorTotals(
  criteria: EvaluationCriterion[],
  scores: VendorScore[],
): VendorTotal[] {
  const weightById = new Map(criteria.map((c) => [c.criteriaId, c.weight]));
  const byVendor = new Map<string, VendorScore[]>();
  for (const s of scores) {
    const list = byVendor.get(s.vendorName) ?? [];
    list.push(s);
    byVendor.set(s.vendorName, list);
  }
  const totals: VendorTotal[] = [];
  for (const [vendorName, list] of byVendor) {
    const locked = list.filter((s) => s.locked && s.finalScore !== null);
    let weighted: number | null = null;
    if (locked.length > 0) {
      let sum = 0;
      let weightSum = 0;
      for (const s of locked) {
        const w = weightById.get(s.criteriaId) ?? 0;
        sum += (s.finalScore as number) * w;
        weightSum += w;
      }
      weighted =
        weightSum > 0 ? Math.round((sum / weightSum) * 100) / 100 : null;
    }
    totals.push({
      vendorName,
      weightedTotal: weighted,
      lockedCount: locked.length,
      totalCriteria: criteria.length,
      overrideCount: list.filter((s) => s.overrideReason !== null).length,
    });
  }
  return totals.sort(
    (a, b) => (b.weightedTotal ?? -1) - (a.weightedTotal ?? -1),
  );
}
