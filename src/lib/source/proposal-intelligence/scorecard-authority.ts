import { canonicalTenantKey } from "@/lib/tenant/aliases";

export type ScorecardAuthorityState = "ready" | "blocked";
export type ScorecardScoreLockState = "locked" | "unlocked";
export type ScorecardAuthorityCompletenessState = "complete" | "incomplete";
export type ScorecardAuthorityConflictState = "none" | "conflict";

export interface ScorecardAuthorityCriterionRecord {
  tenantKey: string;
  sourceEventId: string;
  criterionId: string;
  criterionVersion: string;
  label: string;
  weight: number;
  weightsFrozen: boolean;
  approvedCriterionVersion: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
}

export interface ScorecardAuthorityScoreRecord {
  tenantKey: string;
  sourceEventId: string;
  vendorId: string;
  vendorName: string;
  criterionId: string;
  criterionVersion: string;
  evaluatorId: string | null;
  evaluatorName: string | null;
  evaluatorScore: number | null;
  evidenceReference: string | null;
  overrideReason: string | null;
  overrideReasonRequired: boolean;
  lockState: ScorecardScoreLockState;
  lockedBy: string | null;
  lockedAt: string | null;
}

export interface ScorecardAuthorityBlocker {
  blockerId: string;
  label: string;
  detail: string;
  nextAction: string;
}

export interface ScorecardAuthorityCriterionView {
  criterionId: string;
  label: string;
  criterionVersion: string;
  approvedCriterionVersion: string | null;
  weight: number;
  weightsFrozen: boolean;
  approvedBy: string | null;
  approvedAt: string | null;
}

export interface ScorecardAuthorityScoreView {
  scoreId: string;
  vendorId: string;
  vendorName: string;
  criterionId: string;
  criterionVersion: string;
  evaluatorName: string | null;
  evaluatorScore: number | null;
  evidenceReference: string | null;
  overrideReason: string | null;
  overrideReasonRequired: boolean;
  lockState: ScorecardScoreLockState;
  lockedBy: string | null;
  lockedAt: string | null;
}

export interface ScorecardAuthorityVendorRow {
  vendorId: string;
  vendorName: string;
  lockedScoreCount: number;
  requiredScoreCount: number;
  completenessState: ScorecardAuthorityCompletenessState;
  conflictState: ScorecardAuthorityConflictState;
}

export interface ScorecardAuthorityView {
  state: ScorecardAuthorityState;
  rankAllowed: boolean;
  advanceAllowed: boolean;
  bafoReady: boolean;
  weightTotal: number;
  criteria: ScorecardAuthorityCriterionView[];
  scoreRows: ScorecardAuthorityScoreView[];
  vendorRows: ScorecardAuthorityVendorRow[];
  blockers: ScorecardAuthorityBlocker[];
  guardrail: string;
}

export function buildScorecardAuthorityView(input: {
  tenantKey: string;
  sourceEventId: string;
  criteria: readonly ScorecardAuthorityCriterionRecord[];
  scores: readonly ScorecardAuthorityScoreRecord[];
}): ScorecardAuthorityView {
  const tenantKey = canonicalTenantKey(input.tenantKey);
  const criteria = input.criteria.filter(
    (criterion) =>
      canonicalTenantKey(criterion.tenantKey) === tenantKey &&
      criterion.sourceEventId === input.sourceEventId,
  );
  const scores = input.scores.filter(
    (score) =>
      canonicalTenantKey(score.tenantKey) === tenantKey &&
      score.sourceEventId === input.sourceEventId,
  );

  const blockers: ScorecardAuthorityBlocker[] = [];

  if (criteria.length === 0) {
    blockers.push({
      blockerId: "scorecard-authority-missing",
      label: "Scorecard authority missing",
      detail: "No tenant-scoped scorecard authority is loaded for this event.",
      nextAction:
        "Load approved scorecard criteria, frozen weights and named evaluator scores before review.",
    });
  }

  const criteriaById = new Map<string, ScorecardAuthorityCriterionRecord>();
  for (const criterion of criteria) {
    criteriaById.set(criterion.criterionId, criterion);
    if (!criterion.weightsFrozen) {
      blockers.push({
        blockerId: `criterion-${criterion.criterionId}-weights-not-frozen`,
        label: "Weights not frozen",
        detail: `${criterion.label} weights are not frozen.`,
        nextAction:
          "Freeze the criterion weights before using the scorecard for authority review.",
      });
    }
    if (
      !criterion.approvedBy?.trim() ||
      !criterion.approvedAt?.trim() ||
      criterion.approvedCriterionVersion !== criterion.criterionVersion
    ) {
      blockers.push({
        blockerId: `criterion-${criterion.criterionId}-version-not-approved`,
        label: "Criterion version not approved",
        detail: `${criterion.label} is not approved at version ${criterion.criterionVersion}.`,
        nextAction:
          "Record named approval for the exact criterion version before scoring.",
      });
    }
    if (!Number.isFinite(criterion.weight) || criterion.weight <= 0) {
      blockers.push({
        blockerId: `criterion-${criterion.criterionId}-weight-invalid`,
        label: "Criterion weight invalid",
        detail: `${criterion.label} does not have a positive numeric weight.`,
        nextAction:
          "Record a positive frozen weight before using the criterion.",
      });
    }
  }

  if (criteria.length > 0 && scores.length === 0) {
    blockers.push({
      blockerId: "scorecard-scores-missing",
      label: "Evaluator scores missing",
      detail:
        "No named evaluator scores are loaded for the approved scorecard criteria.",
      nextAction:
        "Record named evaluator scores with evidence references before review.",
    });
  }

  const scoresByVendor = new Map<string, ScorecardAuthorityScoreRecord[]>();
  for (const score of scores) {
    const criterion = criteriaById.get(score.criterionId);
    if (!criterion || criterion.criterionVersion !== score.criterionVersion) {
      blockers.push({
        blockerId: `score-${score.vendorId}-${score.criterionId}-criterion-unapproved`,
        label: "Score does not match approved criterion",
        detail: `${score.vendorName} has a score for ${score.criterionId} that is not tied to an approved criterion version.`,
        nextAction:
          "Tie every score to the approved criterion version before review.",
      });
    }
    if (!score.evaluatorId?.trim() || !score.evaluatorName?.trim()) {
      blockers.push({
        blockerId: `score-${score.vendorId}-${score.criterionId}-named-evaluator-missing`,
        label: "Named evaluator missing",
        detail: `${score.vendorName} is missing a named evaluator for ${score.criterionId}.`,
        nextAction:
          "Record the evaluator identity before using the score in authority posture.",
      });
    }
    if (
      score.evaluatorScore === null ||
      !Number.isFinite(score.evaluatorScore)
    ) {
      blockers.push({
        blockerId: `score-${score.vendorId}-${score.criterionId}-evaluator-score-missing`,
        label: "Evaluator score missing",
        detail: `${score.vendorName} is missing the evaluator score for ${score.criterionId}.`,
        nextAction: "Record a human evaluator score before review.",
      });
    }
    if (!score.evidenceReference?.trim()) {
      blockers.push({
        blockerId: `score-${score.vendorId}-${score.criterionId}-evidence-missing`,
        label: "Evidence reference missing",
        detail: `${score.vendorName} is missing score evidence for ${score.criterionId}.`,
        nextAction:
          "Attach the evidence reference used by the evaluator before ranking.",
      });
    }
    if (score.overrideReasonRequired && !score.overrideReason?.trim()) {
      blockers.push({
        blockerId: `score-${score.vendorId}-${score.criterionId}-override-reason-missing`,
        label: "Override reason missing",
        detail: `${score.vendorName} has an evaluator override without a recorded reason for ${score.criterionId}.`,
        nextAction:
          "Record the evaluator override reason before locking the score.",
      });
    }
    if (
      score.lockState !== "locked" ||
      !score.lockedBy?.trim() ||
      !score.lockedAt?.trim()
    ) {
      blockers.push({
        blockerId: `score-${score.vendorId}-${score.criterionId}-not-locked`,
        label: "Score not locked",
        detail: `${score.vendorName} does not have a locked score for ${score.criterionId}.`,
        nextAction:
          "Lock the named evaluator score before using it for authority review.",
      });
    }

    const list = scoresByVendor.get(score.vendorId) ?? [];
    list.push(score);
    scoresByVendor.set(score.vendorId, list);
  }

  for (const [vendorId, vendorScores] of scoresByVendor) {
    const present = new Set(vendorScores.map((score) => score.criterionId));
    for (const criterion of criteria) {
      if (!present.has(criterion.criterionId)) {
        const vendorName = vendorScores[0]?.vendorName ?? vendorId;
        blockers.push({
          blockerId: `score-${vendorId}-${criterion.criterionId}-missing`,
          label: "Criterion score missing",
          detail: `${vendorName} is missing a score for ${criterion.label}.`,
          nextAction:
            "Record every approved criterion score before completing authority review.",
        });
      }
    }
    const scoreGroups = new Map<string, ScorecardAuthorityScoreRecord[]>();
    for (const score of vendorScores) {
      const group = scoreGroups.get(score.criterionId) ?? [];
      group.push(score);
      scoreGroups.set(score.criterionId, group);
    }
    for (const [criterionId, groupedScores] of scoreGroups) {
      if (groupedScores.length < 2) continue;
      const distinctScoreValues = new Set(
        groupedScores.map((score) => String(score.evaluatorScore)),
      );
      const distinctEvidence = new Set(
        groupedScores.map((score) => score.evidenceReference?.trim() ?? ""),
      );
      if (distinctScoreValues.size <= 1 && distinctEvidence.size <= 1) {
        continue;
      }
      const vendorName = vendorScores[0]?.vendorName ?? vendorId;
      blockers.push({
        blockerId: `score-${vendorId}-${criterionId}-conflict`,
        label: "Evaluator score conflict",
        detail: `${vendorName} has conflicting evaluator score authority for ${criterionId}.`,
        nextAction:
          "Resolve duplicate or conflicting evaluator score records before authority review.",
      });
    }
  }

  const ready = blockers.length === 0;
  const weightTotal = criteria.reduce((total, item) => total + item.weight, 0);
  const vendorRows = ready
    ? [...scoresByVendor.entries()].map(([vendorId, vendorScores]) => {
        const criterionIds = new Set(
          vendorScores.map((score) => score.criterionId),
        );
        const conflictState: ScorecardAuthorityConflictState = criteria.some(
          (criterion) => {
            const matching = vendorScores.filter(
              (score) => score.criterionId === criterion.criterionId,
            );
            if (matching.length < 2) return false;
            const scoreValues = new Set(
              matching.map((score) => String(score.evaluatorScore)),
            );
            const evidenceValues = new Set(
              matching.map((score) => score.evidenceReference?.trim() ?? ""),
            );
            return scoreValues.size > 1 || evidenceValues.size > 1;
          },
        )
          ? "conflict"
          : "none";
        const completenessState: ScorecardAuthorityCompletenessState =
          criterionIds.size === criteria.length ? "complete" : "incomplete";
        return {
          vendorId,
          vendorName: vendorScores[0]?.vendorName ?? vendorId,
          lockedScoreCount: vendorScores.length,
          requiredScoreCount: criteria.length,
          completenessState,
          conflictState,
        };
      })
    : [];

  return {
    state: ready ? "ready" : "blocked",
    rankAllowed: false,
    advanceAllowed: false,
    bafoReady: false,
    weightTotal,
    criteria: criteria.map((criterion) => ({
      criterionId: criterion.criterionId,
      label: criterion.label,
      criterionVersion: criterion.criterionVersion,
      approvedCriterionVersion: criterion.approvedCriterionVersion,
      weight: criterion.weight,
      weightsFrozen: criterion.weightsFrozen,
      approvedBy: criterion.approvedBy,
      approvedAt: criterion.approvedAt,
    })),
    scoreRows: scores.map((score) => ({
      scoreId: `${score.vendorId}:${score.criterionId}`,
      vendorId: score.vendorId,
      vendorName: score.vendorName,
      criterionId: score.criterionId,
      criterionVersion: score.criterionVersion,
      evaluatorName: score.evaluatorName,
      evaluatorScore: score.evaluatorScore,
      evidenceReference: score.evidenceReference,
      overrideReason: score.overrideReason,
      overrideReasonRequired: score.overrideReasonRequired,
      lockState: score.lockState,
      lockedBy: score.lockedBy,
      lockedAt: score.lockedAt,
    })),
    vendorRows,
    blockers,
    guardrail:
      "AI suggestions remain advisory. This read-only authority view checks frozen approved criteria, named evaluator scores, evidence references, override reasons when required, and locked score state. It does not rank suppliers, advance stages, create BAFO rounds, or approve awards.",
  };
}
