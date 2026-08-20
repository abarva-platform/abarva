// =============================================================================
// Risk-tier scoring — D1-D5 dimensions + E1-E8 escalators
// -----------------------------------------------------------------------------
// Pure implementation of the additive risk-scoring model: dimension score
// (5-20, from 5 structural-risk dimensions) + escalator score (0-4 each, from
// up to 8 usage-based escalators) = total score, banded into a tier.
//
// The point scale (Low=1, Moderate=2, High=3, Critical=4 per dimension;
// NotTriggered=0, Moderate=2, High=3, Critical=4 per escalator — escalators
// skip 1, an asymmetry preserved faithfully from the source model, not
// smoothed over) and the band thresholds are reverse-engineered from two
// worked examples and cross-checked against both:
//   - Ambient Listening from Epic: D1=PHI+PII(4) D2=Assistive(1) D3=Write(4)
//     D4=Vendor Configured(2) D5=Single(1) -> dimension 12; E1=Critical(4)
//     E4=Moderate(2) -> escalator 6; total 18 -> Moderate.
//   - uPerform AI-Enabled Epic Training: D1=PII(3) D2=Assistive(1)
//     D3=Read-only(2) D4=SaaS(1) D5=Multi(2) -> dimension 9; E1=High(3)
//     E4=High(3) E5=Moderate(2) E7=High(3) -> escalator 11; total 20 ->
//     Moderate.
// Both are exact golden fixtures in the test file — this is the strongest
// verification available since they come from the source model itself, not
// an invented fixture.
// =============================================================================

export type DimensionLevel = "Low" | "Moderate" | "High" | "Critical";
export type EscalatorSeverity =
  | "NotTriggered"
  | "Moderate"
  | "High"
  | "Critical";
export type RiskTierBand = "Unknown" | "Low" | "Moderate" | "High" | "Critical";

export interface RiskTierInputs {
  /** What type of data is involved — Public / — / PII / PHI or PII+PHI. */
  d1DataSensitivity: DimensionLevel;
  /** What level of independent AI operation is involved — Assistive / Advisory or Automated / — / Autonomous or Agentic. */
  d2HumanOversight: DimensionLevel;
  /** What the AI does to core systems — None / Read-only / — / Write. */
  d3IntegrationImpact: DimensionLevel;
  /** Where the capability came from — SaaS / Vendor Configured / Fine-tuned / Internally Built. */
  d4BuildOrigin: DimensionLevel;
  /** How many domains this touches — Single / Multi / — / Enterprise. */
  d5DomainBreadth: DimensionLevel;
  /** E1: PHI / Sensitive Data Exposure. */
  e1PhiExposure: EscalatorSeverity;
  /** E2: Autonomous / Agentic Action. */
  e2AutonomousAction: EscalatorSeverity;
  /** E3: Clinical Decisioning. */
  e3ClinicalDecisioning: EscalatorSeverity;
  /** E4: Organization Readiness / Ability to Adopt. */
  e4OrganizationReadiness: EscalatorSeverity;
  /** E5: Cross-Domain Integration Impact. */
  e5CrossDomainIntegration: EscalatorSeverity;
  /** E6: Public / Regulatory Exposure. */
  e6PublicRegulatoryExposure: EscalatorSeverity;
  /** E7: Brand / Reputation Risk. */
  e7BrandReputationRisk: EscalatorSeverity;
  /** E8: Patient-Facing Exposure. */
  e8PatientFacingExposure: EscalatorSeverity;
}

export interface RiskTierResult {
  dimensionScore: number;
  escalatorScore: number;
  totalScore: number;
  /** The additive band, before any override. */
  additiveBand: RiskTierBand;
  /** The final band, after the severe-conditions override (if any). */
  band: RiskTierBand;
  escalatorsTriggered: number;
  anyEscalatorTriggered: boolean;
  /**
   * "$250K routes, but does not tier" is the source model's own framing for
   * cost — the equivalent rule here is "any escalator triggered routes to
   * Governance Council, regardless of the numeric band." This flag is that
   * routing signal, computed independently of `band`.
   */
  governanceCouncilReviewRequired: boolean;
  /**
   * AbarVa's operationalization of the source model's qualitative "severe
   * conditions can override" rule (which names examples — autonomous
   * clinical action, patient-direct GenAI — but gives no exact formula).
   * Narrow interpretation: D2 Critical (Autonomous/Agentic) combined with
   * E2 Critical (Autonomous/Agentic Action) or E3 triggered (Clinical
   * Decisioning) floors the band at Critical. Documented as a judgment call,
   * not a literal transcription of the source.
   */
  severeConditionOverrideApplied: boolean;
}

const DIMENSION_POINTS: Record<DimensionLevel, number> = {
  Low: 1,
  Moderate: 2,
  High: 3,
  Critical: 4,
};

const ESCALATOR_POINTS: Record<EscalatorSeverity, number> = {
  NotTriggered: 0,
  Moderate: 2,
  High: 3,
  Critical: 4,
};

const BAND_THRESHOLDS: Array<{ min: number; band: RiskTierBand }> = [
  { min: 35, band: "Critical" },
  { min: 25, band: "High" },
  { min: 15, band: "Moderate" },
  { min: 5, band: "Low" },
  { min: 0, band: "Unknown" },
];

function bandForScore(score: number): RiskTierBand {
  return BAND_THRESHOLDS.find((t) => score >= t.min)?.band ?? "Unknown";
}

const BAND_RANK: Record<RiskTierBand, number> = {
  Unknown: 0,
  Low: 1,
  Moderate: 2,
  High: 3,
  Critical: 4,
};

function higherBand(a: RiskTierBand, b: RiskTierBand): RiskTierBand {
  return BAND_RANK[a] >= BAND_RANK[b] ? a : b;
}

export function computeRiskTier(inputs: RiskTierInputs): RiskTierResult {
  const dimensionScore =
    DIMENSION_POINTS[inputs.d1DataSensitivity] +
    DIMENSION_POINTS[inputs.d2HumanOversight] +
    DIMENSION_POINTS[inputs.d3IntegrationImpact] +
    DIMENSION_POINTS[inputs.d4BuildOrigin] +
    DIMENSION_POINTS[inputs.d5DomainBreadth];

  const escalators: EscalatorSeverity[] = [
    inputs.e1PhiExposure,
    inputs.e2AutonomousAction,
    inputs.e3ClinicalDecisioning,
    inputs.e4OrganizationReadiness,
    inputs.e5CrossDomainIntegration,
    inputs.e6PublicRegulatoryExposure,
    inputs.e7BrandReputationRisk,
    inputs.e8PatientFacingExposure,
  ];
  const escalatorScore = escalators.reduce(
    (sum, sev) => sum + ESCALATOR_POINTS[sev],
    0,
  );
  const escalatorsTriggered = escalators.filter(
    (sev) => sev !== "NotTriggered",
  ).length;
  const anyEscalatorTriggered = escalatorsTriggered > 0;

  const totalScore = dimensionScore + escalatorScore;
  const additiveBand = bandForScore(totalScore);

  const severeConditionOverrideApplied =
    inputs.d2HumanOversight === "Critical" &&
    (inputs.e2AutonomousAction === "Critical" ||
      inputs.e3ClinicalDecisioning !== "NotTriggered");

  const band = severeConditionOverrideApplied
    ? higherBand(additiveBand, "Critical")
    : additiveBand;

  return {
    dimensionScore,
    escalatorScore,
    totalScore,
    additiveBand,
    band,
    escalatorsTriggered,
    anyEscalatorTriggered,
    governanceCouncilReviewRequired: anyEscalatorTriggered,
    severeConditionOverrideApplied,
  };
}
