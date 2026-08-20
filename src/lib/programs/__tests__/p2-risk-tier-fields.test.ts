import {
  applyRiskTierInputsIfEnabled,
  embedRiskTierInputsInCharter,
  readRiskTierInputsFromCharter,
} from "../p2-risk-tier-fields";
import type { RiskTierInputs } from "../risk-tier-scoring";

const INPUTS: RiskTierInputs = {
  d1DataSensitivity: "Critical",
  d2HumanOversight: "Low",
  d3IntegrationImpact: "Critical",
  d4BuildOrigin: "Moderate",
  d5DomainBreadth: "Low",
  e1PhiExposure: "Critical",
  e2AutonomousAction: "NotTriggered",
  e3ClinicalDecisioning: "NotTriggered",
  e4OrganizationReadiness: "Moderate",
  e5CrossDomainIntegration: "NotTriggered",
  e6PublicRegulatoryExposure: "NotTriggered",
  e7BrandReputationRisk: "NotTriggered",
  e8PatientFacingExposure: "NotTriggered",
};

describe("p2-risk-tier-fields", () => {
  it("embeds and reads the inputs back exactly", () => {
    const charter = embedRiskTierInputsInCharter({ existing: "value" }, INPUTS);
    expect(charter).toEqual({
      existing: "value",
      p2_risk_tier_inputs_v1: INPUTS,
    });
    expect(readRiskTierInputsFromCharter(charter)).toEqual(INPUTS);
  });

  it("does not disturb existing charter content when embedding", () => {
    const charter = {
      p0_extended_intake_fields_v1: { tier: "Straightforward" },
    };
    const next = embedRiskTierInputsInCharter(charter, INPUTS);
    expect(next.p0_extended_intake_fields_v1).toEqual({
      tier: "Straightforward",
    });
    expect(next.p2_risk_tier_inputs_v1).toEqual(INPUTS);
  });

  it("returns null for a legacy/missing charter", () => {
    expect(readRiskTierInputsFromCharter(null)).toBeNull();
    expect(readRiskTierInputsFromCharter({})).toBeNull();
  });

  it("returns null when the stored bundle is malformed (missing a required field)", () => {
    const charter = {
      p2_risk_tier_inputs_v1: { ...INPUTS, d1DataSensitivity: undefined },
    };
    expect(readRiskTierInputsFromCharter(charter)).toBeNull();
  });

  it("returns null when a stored value isn't a recognized dimension level or escalator severity", () => {
    const charter = {
      p2_risk_tier_inputs_v1: { ...INPUTS, d1DataSensitivity: "Extreme" },
    };
    expect(readRiskTierInputsFromCharter(charter)).toBeNull();
  });

  describe("applyRiskTierInputsIfEnabled", () => {
    it("is byte-identical (same reference) when the flag is off, regardless of inputs", () => {
      const charter = { existing: "value" };
      expect(applyRiskTierInputsIfEnabled(charter, INPUTS, false)).toBe(
        charter,
      );
    });

    it("is byte-identical (same reference) when inputs is null, regardless of the flag", () => {
      const charter = { existing: "value" };
      expect(applyRiskTierInputsIfEnabled(charter, null, true)).toBe(charter);
    });

    it("embeds the inputs only when the flag is on AND inputs are present", () => {
      const charter = { existing: "value" };
      const next = applyRiskTierInputsIfEnabled(charter, INPUTS, true);
      expect(next).toEqual({
        existing: "value",
        p2_risk_tier_inputs_v1: INPUTS,
      });
    });
  });
});
