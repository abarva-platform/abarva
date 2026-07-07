import {
  buildEvidenceReadinessSummary,
  VENDOR_RESPONSE_REQUIRED_EVIDENCE,
} from "./evidence-readiness";
import type {
  SourceAnalyticFinding,
  VendorResponseAnalytics,
  VendorResponseMveInput,
} from "./types";

export function calculateResponseCompleteness(
  sections: VendorResponseMveInput["sections"],
): number {
  if (!sections.length) return 0;
  const answered = sections.filter((section) => section.answered).length;
  return Math.round((answered / sections.length) * 100);
}

export function detectUnsupportedClaims(
  claims: VendorResponseMveInput["claims"],
): string[] {
  return claims
    .filter((claim) => !claim.supported || !claim.commercialCommitment)
    .map((claim) => claim.claim);
}

export function calculatePricingComparability(
  pricing: VendorResponseMveInput["pricing"],
): number {
  let score = pricing.comparable ? 80 : 45;
  if (pricing.fiveYearTcoUsd) score += 10;
  if (pricing.yearOneRunCostUsd) score += 5;
  if (pricing.transitionCostUsd !== null && pricing.transitionCostUsd !== undefined) {
    score += 5;
  }
  score -= pricing.gaps.length * 10;
  return clamp(score);
}

export function calculateTransitionReadiness(
  transition: VendorResponseMveInput["transition"],
): number {
  return clamp(
    (transition.milestonesProvided ? 35 : 0) +
      (transition.dependenciesProvided ? 30 : 0) +
      (transition.exitCriteriaProvided ? 25 : 0) -
      transition.riskNotes.length * 8,
  );
}

export function calculateSlaStrength(sla: VendorResponseMveInput["sla"]): number {
  return clamp(
    (sla.targetsProvided ? 25 : 0) +
      (sla.creditsProvided ? 30 : 0) +
      (sla.capsProvided ? 20 : 0) +
      (sla.exclusionsProvided ? 15 : 0) -
      sla.riskNotes.length * 8,
  );
}

export function calculateStaffingCoverageRisk(
  staffing: VendorResponseMveInput["staffing"],
): number {
  const maturity =
    (staffing.rolesProvided ? 30 : 0) +
    (staffing.locationMixProvided ? 25 : 0) +
    (staffing.coverageModelProvided ? 35 : 0);
  return clamp(100 - maturity + staffing.riskNotes.length * 10);
}

export function buildVendorResponseAnalytics(
  input: VendorResponseMveInput,
): VendorResponseAnalytics {
  const readiness = buildEvidenceReadinessSummary({
    evidenceRefs: input.evidenceRefs,
    requiredEvidence: VENDOR_RESPONSE_REQUIRED_EVIDENCE,
  });
  const responseCompletenessScore = calculateResponseCompleteness(input.sections);
  const unsupportedClaims = detectUnsupportedClaims(input.claims);
  const pricingComparabilityScore = calculatePricingComparability(input.pricing);
  const transitionReadinessScore = calculateTransitionReadiness(input.transition);
  const slaStrengthScore = calculateSlaStrength(input.sla);
  const staffingCoverageRiskScore = calculateStaffingCoverageRisk(input.staffing);
  const findings = buildFindings(input, {
    unsupportedClaims,
    pricingComparabilityScore,
    transitionReadinessScore,
    slaStrengthScore,
    staffingCoverageRiskScore,
  });

  return {
    vendorId: input.vendorId,
    vendorName: input.vendorName,
    readiness,
    responseCompletenessScore,
    unsupportedClaims,
    pricingComparabilityScore,
    transitionReadinessScore,
    slaStrengthScore,
    staffingCoverageRiskScore,
    readyForEvaluation:
      readiness.mode === "evidence_rich" &&
      responseCompletenessScore >= 85 &&
      unsupportedClaims.length === 0
        ? "yes"
        : responseCompletenessScore >= 60
          ? "conditional"
          : "no",
    clarificationQuestions: [
      ...unsupportedClaims.map(
        (claim) => `Provide exhibit-backed support and commercial commitment for: ${claim}`,
      ),
      ...input.pricing.gaps.map((gap) => `Resolve pricing gap: ${gap}`),
      ...input.sla.riskNotes.map((note) => `Resolve SLA gap: ${note}`),
      ...input.staffing.riskNotes.map((note) => `Resolve staffing gap: ${note}`),
      ...input.transition.riskNotes.map((note) => `Resolve transition gap: ${note}`),
    ],
    findings,
  };
}

function buildFindings(
  input: VendorResponseMveInput,
  scores: {
    unsupportedClaims: string[];
    pricingComparabilityScore: number;
    transitionReadinessScore: number;
    slaStrengthScore: number;
    staffingCoverageRiskScore: number;
  },
): SourceAnalyticFinding[] {
  const evidenceUsed = input.evidenceRefs;
  const findings: SourceAnalyticFinding[] = [];
  if (scores.unsupportedClaims.length) {
    findings.push({
      id: `${input.vendorId}.unsupported_claims`,
      title: "Unsupported vendor claims",
      category: "vendor_claims",
      severity: "high",
      finding: `${scores.unsupportedClaims.length} claim(s) lack exhibit support or commercial commitment.`,
      evidenceUsed,
      evidenceMissing: ["vendor_claim_register"],
      confidence: "medium",
      assumptions: [],
      recommendedAction: "Require vendor to reconcile narrative claims to the claim register and pricing/SLA exhibits before scoring.",
      sourcingStage: "responses",
      businessImpact: ["risk", "vendor_accountability"],
    });
  }
  if (scores.pricingComparabilityScore < 75) {
    findings.push({
      id: `${input.vendorId}.pricing_gap`,
      title: "Pricing is not fully comparable",
      category: "pricing",
      severity: "high",
      finding: input.pricing.gaps.join("; ") || "Pricing workbook lacks comparable TCO detail.",
      evidenceUsed,
      evidenceMissing: ["pricing_workbook"],
      confidence: "medium",
      assumptions: [],
      recommendedAction: "Normalize run, transition, optional, one-time, and five-year TCO fields before evaluation.",
      sourcingStage: "pricing",
      businessImpact: ["cost", "risk"],
    });
  }
  if (scores.transitionReadinessScore < 70) {
    findings.push({
      id: `${input.vendorId}.transition_gap`,
      title: "Transition readiness is conditional",
      category: "transition",
      severity: "medium",
      finding: input.transition.riskNotes.join("; ") || "Transition plan needs stronger dependencies and exit criteria.",
      evidenceUsed,
      evidenceMissing: ["transition_plan"],
      confidence: "medium",
      assumptions: [],
      recommendedAction: "Require milestone, dependency, cutover, stabilization, and exit criteria commitments before award.",
      sourcingStage: "evaluation",
      businessImpact: ["speed", "risk"],
    });
  }
  return findings;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}
