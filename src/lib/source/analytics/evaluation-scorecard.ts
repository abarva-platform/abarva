import type {
  EvaluationCategoryScore,
  EvaluationCriterionEvidenceInput,
  EvaluationCriterionScoreReadiness,
  VendorEvaluationInput,
  VendorEvaluationResult,
} from "./types";
import {
  calculateEvidenceCompleteness,
  detectMissingEvidence,
} from "./evidence-readiness";

export function calculateWeightedVendorScore(
  categoryScores: EvaluationCategoryScore[],
): number {
  const totalWeight = categoryScores.reduce(
    (sum, item) => sum + item.weight,
    0,
  );
  if (!totalWeight) return 0;
  const weighted = categoryScores.reduce(
    (sum, item) => sum + item.score * item.weight,
    0,
  );
  return round1(weighted / totalWeight);
}

export function calculateRiskAdjustedScore(args: {
  weightedScore: number;
  unresolvedConditions: string[];
  evidenceCompletenessScore: number;
}): number {
  const conditionPenalty = args.unresolvedConditions.length * 0.15;
  const evidencePenalty =
    args.evidenceCompletenessScore < 80
      ? (80 - args.evidenceCompletenessScore) / 100
      : 0;
  return round1(
    Math.max(0, args.weightedScore - conditionPenalty - evidencePenalty),
  );
}

export function assessEvaluationCriterionScoreReadiness(
  input: EvaluationCriterionEvidenceInput,
): EvaluationCriterionScoreReadiness {
  const evidenceCompletenessScore = calculateEvidenceCompleteness(
    input.evidenceRefs,
    input.requiredEvidence,
  );
  const evidenceMissing = detectMissingEvidence(
    input.evidenceRefs,
    input.requiredEvidence,
  );
  const evidenceUsed = Array.from(
    new Set(input.evidenceRefs.map((ref) => ref.evidenceType)),
  );
  const blockers: string[] = [];

  if (
    !Number.isFinite(input.proposedScore) ||
    input.proposedScore < 0 ||
    input.proposedScore > 10
  ) {
    blockers.push("Proposed score must be a 0-10 value.");
  }
  if (!input.rationale.trim()) {
    blockers.push(
      "Evaluator rationale is required before a score can be suggested.",
    );
  }
  if (input.evidenceRefs.length === 0) {
    blockers.push(
      "At least one cited evidence item is required before scoring.",
    );
  }

  const onlyLowConfidence =
    input.evidenceRefs.length > 0 &&
    input.evidenceRefs.every((ref) => ref.confidence === "low");

  if (blockers.length > 0) {
    return {
      vendorId: input.vendorId,
      vendorName: input.vendorName,
      category: input.category,
      eligibility: "not_scoreable",
      score: null,
      evidenceCompletenessScore,
      evidenceUsed,
      evidenceMissing,
      blockers,
      nextAction:
        "Load cited evidence and rationale before generating any score.",
    };
  }

  if (evidenceMissing.length > 0 || onlyLowConfidence) {
    return {
      vendorId: input.vendorId,
      vendorName: input.vendorName,
      category: input.category,
      eligibility: "clarification_required",
      score: null,
      evidenceCompletenessScore,
      evidenceUsed,
      evidenceMissing,
      blockers: [
        ...evidenceMissing.map((type) => `Missing required evidence: ${type}.`),
        ...(onlyLowConfidence
          ? ["Only low-confidence evidence is available."]
          : []),
      ],
      nextAction:
        input.clarificationPrompt ??
        "Request the missing or higher-confidence evidence before treating this criterion as scoreable.",
    };
  }

  return {
    vendorId: input.vendorId,
    vendorName: input.vendorName,
    category: input.category,
    eligibility: "scoreable",
    score: {
      category: input.category,
      weight: input.weight,
      score: input.proposedScore,
      rationale: input.rationale,
    },
    evidenceCompletenessScore,
    evidenceUsed,
    evidenceMissing,
    blockers: [],
    nextAction: "Ready for named evaluator review. AI suggestion is not final.",
  };
}

export function calculatePostBafoScenario(args: {
  riskAdjustedScore: number;
  curedConditions: number;
  maxImprovement?: number;
}): number {
  const maxImprovement = args.maxImprovement ?? 0.7;
  const improvement = Math.min(maxImprovement, args.curedConditions * 0.25);
  return round1(args.riskAdjustedScore + improvement);
}

export function assignEvaluationReadiness(
  result: Pick<
    VendorEvaluationResult,
    "riskAdjustedScore" | "unresolvedConditions"
  >,
): VendorEvaluationResult["readiness"] {
  if (
    result.riskAdjustedScore >= 7.2 &&
    result.unresolvedConditions.length <= 1
  ) {
    return "advance";
  }
  if (result.riskAdjustedScore >= 6.2) return "conditional";
  return "hold";
}

export function rankVendors(
  inputs: VendorEvaluationInput[],
): VendorEvaluationResult[] {
  const unranked = inputs.map((input) => {
    const weightedScore = calculateWeightedVendorScore(input.categoryScores);
    const riskAdjustedScore = calculateRiskAdjustedScore({
      weightedScore,
      unresolvedConditions: input.unresolvedConditions,
      evidenceCompletenessScore: input.evidenceCompletenessScore,
    });
    const provisional = {
      vendorId: input.vendorId,
      vendorName: input.vendorName,
      weightedScore,
      riskAdjustedScore,
      rank: 0,
      readiness: "conditional" as const,
      unresolvedConditions: input.unresolvedConditions,
      executiveTradeoff: input.posture,
      postBafoScore: calculatePostBafoScenario({
        riskAdjustedScore,
        curedConditions: input.unresolvedConditions.length,
      }),
      categoryScores: input.categoryScores,
    };
    return {
      ...provisional,
      readiness: assignEvaluationReadiness(provisional),
    };
  });

  return unranked
    .sort((a, b) => b.riskAdjustedScore - a.riskAdjustedScore)
    .map((result, index) => ({ ...result, rank: index + 1 }));
}

export function buildExecutiveTradeoffSummary(
  results: VendorEvaluationResult[],
): string[] {
  return results
    .slice()
    .sort((a, b) => a.rank - b.rank)
    .map(
      (result) =>
        `${result.vendorName}: ${result.riskAdjustedScore.toFixed(1)} risk-adjusted score; ${result.readiness}; ${result.executiveTradeoff}`,
    );
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
