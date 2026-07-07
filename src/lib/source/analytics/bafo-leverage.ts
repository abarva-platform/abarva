import type { BafoLever, BafoLeverInput } from "./types";

export function estimateLeverageImpact(input: BafoLeverInput): number | null {
  if (typeof input.valueAtStakeUsd === "number" && input.valueAtStakeUsd > 0) {
    return input.valueAtStakeUsd;
  }
  return null;
}

export function calculateConditionToScoreImpact(input: BafoLeverInput): number {
  return Math.max(0, Math.min(1, input.scoreImpact));
}

export function rankNegotiationLevers(inputs: BafoLeverInput[]): BafoLever[] {
  return inputs
    .map((input) => ({
      vendorId: input.vendorId,
      vendorName: input.vendorName,
      issue: input.issue,
      rank: 0,
      severity: input.severity,
      estimatedImpactUsd: estimateLeverageImpact(input),
      scoreImpact: calculateConditionToScoreImpact(input),
      recommendedAsk: buildAsk(input),
      suggestedBafoLanguage: buildLanguage(input),
      cureCondition: input.cureCondition,
      decisionImplication:
        input.severity === "high"
          ? "Do not treat as finalist-ready until this condition is cured."
          : "Advance only with the condition tracked in BAFO governance.",
      confidence: input.valueAtStakeUsd ? ("medium" as const) : ("low" as const),
      evidenceBasis: input.evidenceBasis,
    }))
    .sort((a, b) => {
      const severityDelta = severityRank(b.severity) - severityRank(a.severity);
      if (severityDelta) return severityDelta;
      return b.scoreImpact - a.scoreImpact;
    })
    .map((lever, index) => ({ ...lever, rank: index + 1 }));
}

export function buildVendorSpecificBafoAsks(inputs: BafoLeverInput[]): Record<string, BafoLever[]> {
  return rankNegotiationLevers(inputs).reduce<Record<string, BafoLever[]>>(
    (acc, lever) => {
      acc[lever.vendorId] = [...(acc[lever.vendorId] ?? []), lever];
      return acc;
    },
    {},
  );
}

export function buildBafoScenarioTable(inputs: BafoLeverInput[]): Array<{
  vendorId: string;
  vendorName: string;
  issue: string;
  scoreImpact: number;
  cureCondition: string;
}> {
  return rankNegotiationLevers(inputs).map((lever) => ({
    vendorId: lever.vendorId,
    vendorName: lever.vendorName,
    issue: lever.issue,
    scoreImpact: lever.scoreImpact,
    cureCondition: lever.cureCondition,
  }));
}

function buildAsk(input: BafoLeverInput): string {
  return `Cure ${input.issue} with evidence-backed commitment for ${input.category}.`;
}

function buildLanguage(input: BafoLeverInput): string {
  return `Vendor must resolve ${input.issue} by providing ${input.cureCondition}; otherwise the evaluation will treat the item as unresolved commercial risk.`;
}

function severityRank(severity: BafoLeverInput["severity"]): number {
  return severity === "high" ? 3 : severity === "medium" ? 2 : 1;
}
