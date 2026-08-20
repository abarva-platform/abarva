import { computeRiskTier, type RiskTierInputs } from "../risk-tier-scoring";

// Baseline with every dimension Low and every escalator not triggered —
// individual tests below override only the fields they care about.
const BASELINE: RiskTierInputs = {
  d1DataSensitivity: "Low",
  d2HumanOversight: "Low",
  d3IntegrationImpact: "Low",
  d4BuildOrigin: "Low",
  d5DomainBreadth: "Low",
  e1PhiExposure: "NotTriggered",
  e2AutonomousAction: "NotTriggered",
  e3ClinicalDecisioning: "NotTriggered",
  e4OrganizationReadiness: "NotTriggered",
  e5CrossDomainIntegration: "NotTriggered",
  e6PublicRegulatoryExposure: "NotTriggered",
  e7BrandReputationRisk: "NotTriggered",
  e8PatientFacingExposure: "NotTriggered",
};

describe("computeRiskTier", () => {
  describe("golden fixtures from the source risk-tiering model", () => {
    it("matches the worked 'Ambient Listening from Epic' example exactly (dimension 12, escalator 6, total 18, Moderate)", () => {
      const result = computeRiskTier({
        ...BASELINE,
        d1DataSensitivity: "Critical", // PII and PHI
        d2HumanOversight: "Low", // Assistive (Co-pilot)
        d3IntegrationImpact: "Critical", // Write
        d4BuildOrigin: "Moderate", // Vendor Configured
        d5DomainBreadth: "Low", // Single
        e1PhiExposure: "Critical",
        e4OrganizationReadiness: "Moderate",
      });

      expect(result.dimensionScore).toBe(12);
      expect(result.escalatorScore).toBe(6);
      expect(result.totalScore).toBe(18);
      expect(result.band).toBe("Moderate");
      expect(result.escalatorsTriggered).toBe(2);
      expect(result.anyEscalatorTriggered).toBe(true);
      expect(result.governanceCouncilReviewRequired).toBe(true);
    });

    it("matches the worked 'uPerform AI-Enabled Epic Training' example exactly (dimension 9, escalator 11, total 20, Moderate)", () => {
      const result = computeRiskTier({
        ...BASELINE,
        d1DataSensitivity: "High", // PII
        d2HumanOversight: "Low", // Assistive (Co-pilot)
        d3IntegrationImpact: "Moderate", // Read-only
        d4BuildOrigin: "Low", // SaaS
        d5DomainBreadth: "Moderate", // Multi
        e1PhiExposure: "High",
        e4OrganizationReadiness: "High",
        e5CrossDomainIntegration: "Moderate",
        e7BrandReputationRisk: "High",
      });

      expect(result.dimensionScore).toBe(9);
      expect(result.escalatorScore).toBe(11);
      expect(result.totalScore).toBe(20);
      expect(result.band).toBe("Moderate");
      expect(result.escalatorsTriggered).toBe(4);
    });
  });

  describe("band thresholds", () => {
    // Dimension score can never be below 5 (all-Low floor) or above 20
    // (all-Critical ceiling), and escalator score never below 0 or above 32
    // (8 escalators x Critical=4) — so "Unknown" (0-4) is unreachable via a
    // full computation; it represents "not yet assessed," not a possible
    // scored outcome. Each case below is hand-verified, not formula-derived,
    // to avoid a fragile shared construction.

    it("all-Low, no escalators -> total 5 -> Low (the minimum reachable band)", () => {
      const result = computeRiskTier(BASELINE);
      expect(result.totalScore).toBe(5);
      expect(result.band).toBe("Low");
    });

    it("total 14 (top of Low) -> Low", () => {
      // dimension 5 + escalator (High+High+High = 3+3+3 = 9) = 14
      const result = computeRiskTier({
        ...BASELINE,
        e1PhiExposure: "High",
        e4OrganizationReadiness: "High",
        e5CrossDomainIntegration: "High",
      });
      expect(result.totalScore).toBe(14);
      expect(result.band).toBe("Low");
    });

    it("total 15 (bottom of Moderate) -> Moderate", () => {
      // dimension 5 + escalator (Critical+Critical+Moderate = 4+4+2 = 10) = 15
      const result = computeRiskTier({
        ...BASELINE,
        e1PhiExposure: "Critical",
        e4OrganizationReadiness: "Critical",
        e5CrossDomainIntegration: "Moderate",
      });
      expect(result.totalScore).toBe(15);
      expect(result.band).toBe("Moderate");
    });

    it("total 24 (top of Moderate) -> Moderate", () => {
      // dimension 5 + escalator (4 x Critical + 1 x High = 16+3 = 19) = 24
      const result = computeRiskTier({
        ...BASELINE,
        e1PhiExposure: "Critical",
        e2AutonomousAction: "Critical",
        e4OrganizationReadiness: "Critical",
        e5CrossDomainIntegration: "Critical",
        e6PublicRegulatoryExposure: "High",
      });
      expect(result.totalScore).toBe(24);
      expect(result.band).toBe("Moderate");
    });

    it("total 25 (bottom of High) -> High", () => {
      // dimension 5 + escalator (5 x Critical = 20) = 25
      const result = computeRiskTier({
        ...BASELINE,
        e1PhiExposure: "Critical",
        e2AutonomousAction: "Critical",
        e4OrganizationReadiness: "Critical",
        e5CrossDomainIntegration: "Critical",
        e6PublicRegulatoryExposure: "Critical",
      });
      expect(result.totalScore).toBe(25);
      expect(result.band).toBe("High");
    });

    it("total 34 (top of High) -> High", () => {
      // dimension 5 + escalator (6 x Critical + High + Moderate = 24+3+2 = 29) = 34
      const result = computeRiskTier({
        ...BASELINE,
        e1PhiExposure: "Critical",
        e2AutonomousAction: "Critical",
        e4OrganizationReadiness: "Critical",
        e5CrossDomainIntegration: "Critical",
        e6PublicRegulatoryExposure: "Critical",
        e7BrandReputationRisk: "Critical",
        e8PatientFacingExposure: "High",
        e3ClinicalDecisioning: "Moderate",
      });
      expect(result.totalScore).toBe(34);
      expect(result.band).toBe("High");
    });

    it("total 35 (bottom of Critical) -> Critical", () => {
      // dimension 5 + escalator (7 x Critical + Moderate = 28+2 = 30) = 35
      const result = computeRiskTier({
        ...BASELINE,
        e1PhiExposure: "Critical",
        e2AutonomousAction: "Critical",
        e4OrganizationReadiness: "Critical",
        e5CrossDomainIntegration: "Critical",
        e6PublicRegulatoryExposure: "Critical",
        e7BrandReputationRisk: "Critical",
        e8PatientFacingExposure: "Critical",
        e3ClinicalDecisioning: "Moderate",
      });
      expect(result.totalScore).toBe(35);
      expect(result.band).toBe("Critical");
    });

    it("everything maxed (dimension 20 + escalator 32 = 52) -> Critical", () => {
      const result = computeRiskTier({
        d1DataSensitivity: "Critical",
        d2HumanOversight: "Critical",
        d3IntegrationImpact: "Critical",
        d4BuildOrigin: "Critical",
        d5DomainBreadth: "Critical",
        e1PhiExposure: "Critical",
        e2AutonomousAction: "Critical",
        e3ClinicalDecisioning: "Critical",
        e4OrganizationReadiness: "Critical",
        e5CrossDomainIntegration: "Critical",
        e6PublicRegulatoryExposure: "Critical",
        e7BrandReputationRisk: "Critical",
        e8PatientFacingExposure: "Critical",
      });
      expect(result.dimensionScore).toBe(20);
      expect(result.escalatorScore).toBe(32);
      expect(result.totalScore).toBe(52);
      expect(result.band).toBe("Critical");
      expect(result.severeConditionOverrideApplied).toBe(true);
    });
  });

  describe("governance council routing ('$250K routes, but does not tier' equivalent)", () => {
    it("requires council review when any single escalator is triggered, even at a low total score", () => {
      const result = computeRiskTier({
        ...BASELINE, // dimension score 5, would band Unknown alone
        e8PatientFacingExposure: "Moderate", // escalator score 2, total 7 -> Low band
      });
      expect(result.band).toBe("Low");
      expect(result.anyEscalatorTriggered).toBe(true);
      expect(result.governanceCouncilReviewRequired).toBe(true);
    });

    it("does not require council review when no escalator is triggered, regardless of dimension score", () => {
      const result = computeRiskTier({
        ...BASELINE,
        d1DataSensitivity: "Critical",
        d2HumanOversight: "Critical",
        d3IntegrationImpact: "Critical",
        d4BuildOrigin: "Critical",
        d5DomainBreadth: "Critical",
      });
      expect(result.dimensionScore).toBe(20);
      expect(result.anyEscalatorTriggered).toBe(false);
      expect(result.governanceCouncilReviewRequired).toBe(false);
    });
  });

  describe("severe-condition override", () => {
    it("floors the band at Critical when D2 is Critical (Autonomous/Agentic) AND E3 (Clinical Decisioning) is triggered, even if the additive total would only be Low", () => {
      const result = computeRiskTier({
        ...BASELINE,
        d2HumanOversight: "Critical",
        e3ClinicalDecisioning: "Moderate",
      });
      // dimension 5+3=8, escalator 2, total 10 -> additive band Low
      expect(result.additiveBand).toBe("Low");
      expect(result.severeConditionOverrideApplied).toBe(true);
      expect(result.band).toBe("Critical");
    });

    it("floors the band at Critical when D2 is Critical AND E2 (Autonomous/Agentic Action) is Critical", () => {
      const result = computeRiskTier({
        ...BASELINE,
        d2HumanOversight: "Critical",
        e2AutonomousAction: "Critical",
      });
      expect(result.severeConditionOverrideApplied).toBe(true);
      expect(result.band).toBe("Critical");
    });

    it("does NOT apply the override when D2 is Critical but no clinical-decisioning/autonomous-action escalator fires", () => {
      const result = computeRiskTier({
        ...BASELINE,
        d2HumanOversight: "Critical",
      });
      expect(result.severeConditionOverrideApplied).toBe(false);
      expect(result.band).toBe(result.additiveBand);
    });

    it("does NOT apply the override when the escalator fires but D2 is not Critical", () => {
      const result = computeRiskTier({
        ...BASELINE,
        e3ClinicalDecisioning: "High",
      });
      expect(result.severeConditionOverrideApplied).toBe(false);
    });

    it("never lets the override lower a band that's already higher than Critical-would-be (idempotent at the top)", () => {
      const result = computeRiskTier({
        d1DataSensitivity: "Critical",
        d2HumanOversight: "Critical",
        d3IntegrationImpact: "Critical",
        d4BuildOrigin: "Critical",
        d5DomainBreadth: "Critical",
        e1PhiExposure: "Critical",
        e2AutonomousAction: "Critical",
        e3ClinicalDecisioning: "Critical",
        e4OrganizationReadiness: "Critical",
        e5CrossDomainIntegration: "Critical",
        e6PublicRegulatoryExposure: "Critical",
        e7BrandReputationRisk: "Critical",
        e8PatientFacingExposure: "Critical",
      });
      expect(result.additiveBand).toBe("Critical");
      expect(result.band).toBe("Critical");
    });
  });

  describe("all-Low / all-NotTriggered baseline", () => {
    it("scores the minimum possible (dimension 5, escalator 0, total 5, Low band)", () => {
      const result = computeRiskTier(BASELINE);
      expect(result.dimensionScore).toBe(5);
      expect(result.escalatorScore).toBe(0);
      expect(result.totalScore).toBe(5);
      expect(result.band).toBe("Low");
      expect(result.governanceCouncilReviewRequired).toBe(false);
    });
  });
});
