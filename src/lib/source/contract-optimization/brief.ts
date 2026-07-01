import type { ContractOptimizationMveProfile } from "./types";

const money = (value: number | null): string => {
  if (!value || !Number.isFinite(value)) return "Value to test";
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  return `$${Math.round(value / 1_000)}K`;
};

export function buildContractOptimizationBriefMarkdown(
  profile: ContractOptimizationMveProfile,
): string {
  const evidencedExposure = profile.levers.reduce(
    (sum, lever) => sum + (lever.annualImpactHighUsd ?? 0),
    0,
  );
  return [
    `# ${profile.contractName} Optimization Brief`,
    "",
    "## Executive Summary",
    "",
    `${profile.incumbentVendorName} should not be renewed as-is. The minimum viable sourcing record supports a controlled renegotiation path now, with a competitive RFP fallback if cure conditions remain unresolved before the renewal notice window.`,
    "",
    `- Current annual run rate: ${money(profile.contractBaseline.currentAnnualRunRateUsd)}`,
    `- Evidenced high-side exposure: ${money(evidencedExposure)}`,
    `- Ready for optimization: ${profile.readyForOptimization}`,
    `- Decision owner: ${profile.recommendedPath.decisionOwnerRole}`,
    "",
    "## Recommended Path",
    "",
    `- Immediate action: ${profile.recommendedPath.immediateAction}`,
    `- Primary path: ${profile.recommendedPath.primaryPath}`,
    `- Fallback path: ${profile.recommendedPath.fallbackPath}`,
    `- Do not do: ${profile.recommendedPath.doNotDo}`,
    "",
    "## Optimization Findings",
    "",
    ...profile.findings.flatMap((finding) => [
      `### ${finding.title}`,
      "",
      `- Severity: ${finding.severity}`,
      `- Current state: ${finding.currentState}`,
      `- Sourcing implication: ${finding.sourcingImplication}`,
      `- Recommended action: ${finding.recommendedAction}`,
      `- Estimated annual impact: ${money(finding.estimatedAnnualImpactUsd)}`,
      `- Evidence: ${finding.evidenceLabels.join("; ")}`,
      "",
    ]),
    "## Negotiation Levers",
    "",
    ...profile.levers.flatMap((lever) => [
      `### ${lever.buyerAsk}`,
      "",
      `- Priority: ${lever.priority}`,
      `- Value basis: ${lever.valueBasis.replaceAll("_", " ")}`,
      `- Impact range: ${money(lever.annualImpactLowUsd)} to ${money(lever.annualImpactHighUsd)}`,
      `- Negotiation language: ${lever.negotiationLanguage}`,
      `- Owner role: ${lever.ownerRole}`,
      "",
    ]),
    "## Evidence Caveats",
    "",
    profile.syntheticDemo
      ? "- This proof uses tenant/use-case-specific synthetic demo evidence and must not be represented as a real client contract."
      : "- Client evidence is required for external use.",
    ...profile.clientToComplete.map((gap) => `- Client to complete: ${gap}`),
    profile.clientToComplete.length
      ? ""
      : "- No minimum evidence gaps detected for a draft optimization workshop.",
  ].join("\n");
}
