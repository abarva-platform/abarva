import {
  getIntelligenceBindingPayload,
  hasIntelligenceBindingPayload,
} from "../binding-payload";

describe("intelligence binding payloads", () => {
  it("resolves every pilot tenant binding key", () => {
    expect(getIntelligenceBindingPayload("first-capital")?.tenant.key).toBe(
      "first-capital",
    );
    expect(getIntelligenceBindingPayload("skyharbor")?.tenant.key).toBe(
      "skyharbor-air",
    );
    expect(getIntelligenceBindingPayload("meridian")?.tenant.key).toBe(
      "meridian-health",
    );
    expect(getIntelligenceBindingPayload("lakeshore")?.tenant.key).toBe(
      "lakeshore",
    );
    expect(getIntelligenceBindingPayload("apexretail")?.tenant.key).toBe(
      "apex-retail",
    );
  });

  it("resolves Northstar aliases to the v2 binding payload", () => {
    const payload = getIntelligenceBindingPayload("northstar");

    expect(payload?.tenant).toEqual({
      key: "northstar-clinical",
      displayName: "Northstar Clinical Technologies",
      industry: "Medtech / Clinical Technology",
    });
    expect(hasIntelligenceBindingPayload("northstar-clinical")).toBe(true);
    expect(
      getIntelligenceBindingPayload("northstar-clinical-technologies")?.tenant
        .key,
    ).toBe("northstar-clinical");
  });

  it("keeps Northstar evidence-rich enough for the v2 Intelligence surface", () => {
    const payload = getIntelligenceBindingPayload("northstar");

    expect(payload?.context).toHaveLength(8);
    expect(payload?.signals.length).toBeGreaterThanOrEqual(5);
    expect(payload?.trustLine.evidencePoints).toBeGreaterThan(6000);
    expect(
      payload?.signals.flatMap((signal) => signal.evidenceRefs),
    ).toEqual(expect.arrayContaining(["NST-DEMO-FACT-002", "NST-AI-005"]));
  });
});
