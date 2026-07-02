import type {
  EvaluationCategoryScore,
  VendorEvaluationInput,
  VendorEvaluationResult,
} from "./types";

export function calculateWeightedVendorScore(
  categoryScores: EvaluationCategoryScore[],
): number {
  const totalWeight = categoryScores.reduce((sum, item) => sum + item.weight, 0);
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
  return round1(Math.max(0, args.weightedScore - conditionPenalty - evidencePenalty));
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
  result: Pick<VendorEvaluationResult, "riskAdjustedScore" | "unresolvedConditions">,
): VendorEvaluationResult["readiness"] {
  if (result.riskAdjustedScore >= 7.2 && result.unresolvedConditions.length <= 1) {
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
