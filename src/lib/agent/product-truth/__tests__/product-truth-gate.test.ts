import { runProductTruthGate } from "../product-truth-gate";

describe("runProductTruthGate", () => {
  it("passes clean, grounded, compliant text", () => {
    const result = runProductTruthGate(
      "This Move has $2.0M at stake per the current-state baseline.",
      { tenantKey: "lakeshore", groundingText: "Value at stake: $2.0M." },
    );
    expect(result.pass).toBe(true);
    expect(result.violations).toEqual([]);
  });

  it("aggregates violations across all three guards", () => {
    const result = runProductTruthGate(
      "AbarVa replaces Gartner, this platform automatically flags stale records, and savings will be $99M.",
      { tenantKey: "lakeshore", groundingText: "" },
    );
    expect(result.pass).toBe(false);
    const categories = result.violations.map((v) => v.category);
    expect(categories).toContain("third_party_replacement_claim");
    expect(categories).toContain("capability_overreach");
    expect(categories).toContain("unsupported_tenant_claim");
  });

  it("skips tenant-evidence checking when groundingText is not supplied", () => {
    const result = runProductTruthGate("Savings will be $99M.", { tenantKey: "lakeshore" });
    expect(result.violations.some((v) => v.category === "unsupported_tenant_claim")).toBe(false);
  });
});
