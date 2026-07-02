import type { ContractOptimizationMveProfile } from "./types";
import { computeContractOptimizationExposureRollup } from "./exposure";

const money = (value: number | null): string => {
  if (!value || !Number.isFinite(value)) return "Value to be quantified during vendor cure review";
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  return `$${Math.round(value / 1_000)}K`;
};

const urgencyLabel = (
  priority: ContractOptimizationMveProfile["levers"][number]["priority"],
): string => {
  if (priority === "P0") return "Immediate";
  if (priority === "P1") return "Before renewal notice";
  return "Post-cure governance";
};

const impactRange = (
  low: number | null,
  high: number | null,
): string => {
  if (!low && !high) return "Value to be quantified during vendor cure review";
  if (!low) return `Up to ${money(high)}`;
  if (!high) return `At least ${money(low)}`;
  return `${money(low)} to ${money(high)}`;
};

export function buildContractOptimizationBriefMarkdown(
  profile: ContractOptimizationMveProfile,
): string {
  const exposure = computeContractOptimizationExposureRollup(profile);
  const highFindings = profile.findings.filter(
    (finding) => finding.severity === "high",
  ).length;
  return [
    `# ${profile.contractName} Optimization Brief`,
    "",
    "## Executive Summary",
    "",
    `${profile.incumbentVendorName} should not be renewed as-is. The minimum viable sourcing record supports a controlled renegotiation path now, with a competitive RFP fallback if cure conditions remain unresolved before the renewal notice window.`,
    "",
    `- Current annual run rate: ${money(profile.contractBaseline.currentAnnualRunRateUsd)}`,
    `- Identified exposure: ${exposure.label}`,
    `- Ready for optimization: ${profile.readyForOptimization}`,
    `- Decision owner: ${profile.recommendedPath.decisionOwnerRole}`,
    `- High-priority findings: ${highFindings}`,
    "",
    "## Decision Snapshot",
    "",
    "| Decision area | Executive read | Action |",
    "|---|---|---|",
    `| Renewal posture | Do not renew as-is | ${profile.recommendedPath.immediateAction} |`,
    `| Commercial baseline | ${money(profile.contractBaseline.currentAnnualRunRateUsd)} run rate with identified exposure of ${exposure.label} | Reconcile invoice, staffing, SLA, and change-order drivers before renewal pricing |`,
    `| Fallback | ${profile.recommendedPath.fallbackPath} | Keep the competitive event ready until cure evidence is received |`,
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
    ...profile.findings.flatMap((finding, index) => [
      `### Finding ${index + 1}: ${finding.title}`,
      "",
      `- Severity: ${finding.severity}`,
      `- Observed issue: ${finding.currentState}`,
      `- Sourcing implication: ${finding.sourcingImplication}`,
      `- Recommended action: ${finding.recommendedAction}`,
      `- Estimated annual impact: ${money(finding.estimatedAnnualImpactUsd)}`,
      `- Evidence: ${finding.evidenceLabels.join("; ")}`,
      "",
    ]),
    "## Negotiation Levers",
    "",
    ...profile.levers.flatMap((lever, index) => [
      `### Lever ${index + 1}: ${lever.buyerAsk}`,
      "",
      `- Timing: ${urgencyLabel(lever.priority)}`,
      `- Value basis: ${lever.valueBasis.replaceAll("_", " ")}`,
      `- Impact range: ${impactRange(lever.annualImpactLowUsd, lever.annualImpactHighUsd)}`,
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
