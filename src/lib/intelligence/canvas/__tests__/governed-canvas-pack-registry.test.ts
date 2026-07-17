import { getIntelligenceCanvasGovernance } from "../governed-canvas-pack-registry";

describe("getIntelligenceCanvasGovernance", () => {
  it("returns an approved deterministic tenant plus industry pack when a tenant pack exists", () => {
    const governance = getIntelligenceCanvasGovernance({
      clientKey: "meridian",
      tenantName: "Healthcare Demo",
      contextAreaCount: 14,
      sourceCount: 89,
      strongestArea: "Risk & Model Governance",
    });

    expect(governance.status).toBe("approved");
    expect(governance.deterministic).toBe(true);
    expect(governance.sourceMode).toBe("tenant_plus_industry");
    expect(governance.validation.passed).toBe(true);
    expect(governance.provenance.map((item) => item.basis)).toEqual([
      "tenant_loaded",
      "industry_corpus",
      "derived_benchmark",
      "inference_boundary",
    ]);
  });

  it("marks unknown tenants as fallback guidance", () => {
    const governance = getIntelligenceCanvasGovernance({
      clientKey: "new-tenant",
      tenantName: "New Tenant",
      contextAreaCount: 3,
      sourceCount: 0,
    });

    expect(governance.status).toBe("fallback");
    expect(governance.sourceMode).toBe("industry_fallback");
    expect(governance.validation.passed).toBe(true);
    expect(governance.validation.warnings).toEqual(
      expect.arrayContaining([
        expect.stringContaining("No source trails were available"),
        expect.stringContaining("not tenant-approved"),
      ]),
    );
  });
});
