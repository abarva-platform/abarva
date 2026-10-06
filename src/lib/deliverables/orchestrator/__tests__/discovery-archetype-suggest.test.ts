import {
  suggestDiscoveryArchetypes,
  getDiscoveryBlueprint,
} from "../briefs/discovery-blueprint";

describe("suggestDiscoveryArchetypes (setup-time suggestion, not authority)", () => {
  it("suggests the data-foundation archetype for governance text", () => {
    const out = suggestDiscoveryArchetypes(
      "we need a governed data foundation: data governance, semantic layer, lineage, data quality, medallion lakehouse",
    );
    expect(out[0]?.blueprintId).toBe("governed_data_foundation");
    expect(out[0]?.score).toBeGreaterThan(1);
  });

  it("suggests contact-center for contact-center text", () => {
    const out = suggestDiscoveryArchetypes(
      "contact center agent assist with crm and member service for claims",
    );
    expect(out[0]?.blueprintId).toBe("healthcare_contact_center_agent_assist");
  });

  it("ranks by number of keyword hits", () => {
    const out = suggestDiscoveryArchetypes(
      "commercial lending loan credit kyc sanctions collateral covenant servicing",
    );
    expect(out[0]?.blueprintId).toBe(
      "financial_services_commercial_lending_agent_assist",
    );
    // scores are non-increasing
    for (let i = 1; i < out.length; i += 1) {
      expect(out[i - 1].score).toBeGreaterThanOrEqual(out[i].score);
    }
  });

  it("never suggests the general default and returns [] on no signal", () => {
    expect(
      suggestDiscoveryArchetypes("something entirely unrelated").every(
        (s) => s.blueprintId !== "general_default",
      ),
    ).toBe(true);
    expect(suggestDiscoveryArchetypes("")).toEqual([]);
    expect(suggestDiscoveryArchetypes("   ")).toEqual([]);
  });

  it("respects the limit", () => {
    const out = suggestDiscoveryArchetypes(
      "data governance claims loan operations recovery contact center",
      2,
    );
    expect(out.length).toBeLessThanOrEqual(2);
  });

  it("is only a hint — resolution still requires an explicit declaration", () => {
    // a suggestion does not change what an undeclared Move resolves to
    const text = "governed data foundation with claims and prior-auth";
    expect(suggestDiscoveryArchetypes(text)[0]?.blueprintId).toBe(
      "governed_data_foundation",
    );
    // but with nothing declared, resolution still uses inference (not the suggestion)
    expect(getDiscoveryBlueprint(text).blueprintId).not.toBe(
      "governed_data_foundation",
    );
    // declaring it is what makes resolution pick it
    expect(
      getDiscoveryBlueprint(text, "governed_data_foundation").blueprintId,
    ).toBe("governed_data_foundation");
  });
});
