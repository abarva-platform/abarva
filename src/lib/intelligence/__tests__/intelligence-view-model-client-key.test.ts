import { resolveIntelligenceViewModelClientKey } from "@/lib/intelligence/intelligence-view-model-client-key";

describe("resolveIntelligenceViewModelClientKey", () => {
  it("converts Meridian canonical tenant keys back to the app client key", () => {
    expect(
      resolveIntelligenceViewModelClientKey({
        clientKey: "meridian-health",
        requestedClient: "meridian",
        contextTenantKey: "meridian-health",
      }),
    ).toBe("meridian");
  });

  it("uses the requested client when the active row is missing", () => {
    expect(
      resolveIntelligenceViewModelClientKey({
        requestedClient: "meridian",
        contextTenantKey: "meridian-health",
      }),
    ).toBe("meridian");
  });

  it("does not fall back to Apex for known canonical aliases", () => {
    expect(
      resolveIntelligenceViewModelClientKey({
        contextTenantKey: "skyharbor-air",
      }),
    ).toBe("skyharbor");
    expect(
      resolveIntelligenceViewModelClientKey({
        contextTenantKey: "lakeshore-holdings",
      }),
    ).toBe("lakeshore");
  });
});
