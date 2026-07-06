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
});
