import type {
  DecisionOptionsDossier,
  IntelligenceRoute,
  TenantEvidenceDossier,
  CorpusPatternDossier,
  ExpertCouncilDossier,
} from "./types";

function optionTitles(route: IntelligenceRoute): string[] {
  if (route.intelligenceIntent === "sourcing_strategy" || route.intelligenceIntent === "vendor_concentration") {
    return ["Renegotiate and rationalize", "Sequence replacement", "Hold and strengthen controls"];
  }
  if (route.primaryDimension === "data_analytics") {
    return ["Fix data foundation first", "Pilot on certified domains", "Defer scale until lineage is proven"];
  }
  if (route.primaryDimension === "applications_systems") {
    return ["Modernize constrained dependencies", "Contain technical debt", "Sequence API/integration exposure"];
  }
  if (route.intelligenceIntent === "cost_optimization") {
    return ["Harvest run-cost leakage", "Fund change with vendor leverage", "Protect value-critical platforms"];
  }
  return ["Scale bounded wins", "Sequence foundations", "Hold unsupported bets"];
}

export function buildDecisionOptionsDossier(input: {
  route: IntelligenceRoute;
  tenantEvidenceDossier: TenantEvidenceDossier;
  corpusPatternDossier: CorpusPatternDossier;
  expertCouncilDossier: ExpertCouncilDossier;
}): DecisionOptionsDossier {
  const tenantFacts = input.tenantEvidenceDossier.sections
    .map((section) => section.label)
    .slice(0, 4);
  const corpusSupport = input.corpusPatternDossier.patternFamilies.slice(0, 3);
  const advisorySupport = input.route.expertLensesRequired.slice(0, 3);
  const missingEvidence = input.tenantEvidenceDossier.gaps.map((gap) => gap.label).slice(0, 3);

  const options = optionTitles(input.route).map((title, index) => ({
    optionId: `option-${index + 1}`,
    title,
    description: `${title} using the loaded ${input.route.primaryDimension.replaceAll("_", " ")} evidence as the decision anchor.`,
    tenantEvidenceSupport: tenantFacts,
    corpusSupport,
    expertSupport: advisorySupport,
    expectedValue: index === 0 ? "highest near-term value if prerequisites hold" : index === 1 ? "medium value with lower sequencing risk" : "risk control and option preservation",
    executionComplexity: (index === 0 ? "medium" : index === 1 ? "high" : "low") as "low" | "medium" | "high",
    riskLevel: (index === 0 ? "medium" : index === 1 ? "high" : "low") as "low" | "medium" | "high",
    prerequisites: input.route.tenantEvidenceRequired.slice(0, 3),
    missingEvidence,
    recommendedUse: (index === 0 ? "scale" : index === 1 ? "sequence" : "hold") as "scale" | "pilot" | "hold" | "sequence" | "avoid" | "investigate",
  }));

  return {
    options,
    tradeoffs: [
      "Moving faster increases value capture but requires stronger tenant evidence and controls.",
      "Sequencing foundations lowers execution risk but delays visible value.",
      "Holding unsupported bets preserves capital but may miss timing if prerequisites are already in place.",
    ],
    recommendedDecisionFrame: input.route.decisionFrameRequired
      ? "Separate proven tenant facts, corpus precedent, advisory lens concerns, and missing evidence before recommending scale, hold, or sequence."
      : "Answer as interpretation first; do not force a decision frame unless the question asks for one.",
    confidence:
      input.tenantEvidenceDossier.confidence === "strong"
        ? "strong"
        : input.tenantEvidenceDossier.confidence === "partial"
          ? "moderate"
          : "directional",
  };
}
