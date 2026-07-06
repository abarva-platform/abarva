import { buildArchetypeAdvisoryBlock } from "../archetype-advisory";
import { AMS_MANAGED_SERVICES } from "@/lib/source/archetypes/registry";
import type { SourceEventArchetype } from "@/lib/source/archetypes/types";

describe("buildArchetypeAdvisoryBlock", () => {
  it("returns empty string when no archetype resolved", () => {
    expect(buildArchetypeAdvisoryBlock(null)).toBe("");
    expect(buildArchetypeAdvisoryBlock(undefined)).toBe("");
  });

  it("names the archetype and forbids substituting generic advice", () => {
    const block = buildArchetypeAdvisoryBlock(AMS_MANAGED_SERVICES);
    expect(block).toContain(AMS_MANAGED_SERVICES.name);
    expect(block).toContain("do not substitute generic sourcing advice");
  });

  it("projects the AMS pricing traps verbatim", () => {
    const block = buildArchetypeAdvisoryBlock(AMS_MANAGED_SERVICES);
    expect(block).toContain("Pricing traps to surface");
    for (const trap of AMS_MANAGED_SERVICES.pricingModel.traps) {
      expect(block).toContain(trap);
    }
  });

  it("separates RFP-stage levers from BAFO-reserved levers by timing", () => {
    const block = buildArchetypeAdvisoryBlock(AMS_MANAGED_SERVICES);
    const bafo = AMS_MANAGED_SERVICES.negotiationLevers.filter((l) => l.timing === "bafo");
    if (bafo.length > 0) {
      expect(block).toContain("reserve for BAFO");
      expect(block).toContain(bafo[0].label);
    }
    const rfp = AMS_MANAGED_SERVICES.negotiationLevers.filter(
      (l) => l.timing === "rfp" || l.timing === "pre_rfp",
    );
    if (rfp.length > 0) expect(block).toContain("build in at the RFP stage");
  });

  it("includes vendor assumptions to challenge and evaluation disqualifiers", () => {
    const block = buildArchetypeAdvisoryBlock(AMS_MANAGED_SERVICES);
    if (AMS_MANAGED_SERVICES.vendorDiscussionGuide.challengeAssumptions.length > 0) {
      expect(block).toContain("assumptions to challenge");
    }
    if (AMS_MANAGED_SERVICES.evaluationModel.disqualifiers.length > 0) {
      expect(block).toContain("disqualifiers (auto-fail");
    }
  });

  it("omits a section when the archetype has no entries for it", () => {
    const bare: SourceEventArchetype = {
      ...AMS_MANAGED_SERVICES,
      pricingModel: { ...AMS_MANAGED_SERVICES.pricingModel, traps: [] },
    };
    expect(buildArchetypeAdvisoryBlock(bare)).not.toContain("Pricing traps to surface");
  });

  it("renders value-lever rules with their basis, BAFO ask, and confidence, and the range/caveat discipline", () => {
    expect((AMS_MANAGED_SERVICES.valueLeverRules ?? []).length).toBeGreaterThan(0);
    const block = buildArchetypeAdvisoryBlock(AMS_MANAGED_SERVICES);
    expect(block).toContain("Value levers");
    expect(block).toContain("range with a confidence band");
    expect(block).toContain("never a bare guaranteed number");
    const first = AMS_MANAGED_SERVICES.valueLeverRules![0];
    expect(block).toContain(first.name);
    expect(block).toContain(first.valueBasis);
    expect(block).toContain(first.bafoAsk);
    expect(block).toContain(`confidence ${first.defaultConfidence}`);
  });

  it("classifies each lever by value type and forbids chasing a single savings %", () => {
    const block = buildArchetypeAdvisoryBlock(AMS_MANAGED_SERVICES);
    expect(block).toContain("do not chase a single savings %");
    expect(block).toContain("OPENING POSITION");
    const first = AMS_MANAGED_SERVICES.valueLeverRules![0];
    expect(block).toContain(`type ${first.valueType}`);
  });

  it("carries the deterministic derivation (formula + inputs) and the insufficient-evidence guard", () => {
    const block = buildArchetypeAdvisoryBlock(AMS_MANAGED_SERVICES);
    expect(block).toContain("DETERMINISTIC");
    expect(block).toContain("insufficient evidence");
    const first = AMS_MANAGED_SERVICES.valueLeverRules![0];
    expect(block).toContain(first.computation.method);
    expect(block).toContain(first.computation.inputs[0].key);
  });

  it("omits the value-levers section when an archetype has no rules yet", () => {
    const noRules: SourceEventArchetype = { ...AMS_MANAGED_SERVICES, valueLeverRules: [] };
    expect(buildArchetypeAdvisoryBlock(noRules)).not.toContain("Value levers");
  });
});
