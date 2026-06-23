import {
  getIntelligenceBindingPayload,
  hasIntelligenceBindingPayload,
} from "../binding-payload";
import rawBindingData from "../all-tenants.json";
import { UNIVERSAL_CONTEXT_DIMENSIONS } from "../universal-dimensions";

type RawBindingFile = {
  tenants: Record<
    string,
    {
      trustLine: { dimensionsLoaded: number };
      context: Array<{ dimension: string }>;
    }
  >;
};

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

    expect(payload?.context).toHaveLength(19);
    expect(payload?.signals.length).toBeGreaterThanOrEqual(5);
    expect(payload?.trustLine.evidencePoints).toBeGreaterThan(6000);
    expect(
      payload?.signals.flatMap((signal) => signal.evidenceRefs),
    ).toEqual(expect.arrayContaining(["NST-DEMO-FACT-002", "NST-AI-005"]));
  });

  it("expands every tenant to the canonical 19 enterprise dimensions", () => {
    const expectedDimensions = UNIVERSAL_CONTEXT_DIMENSIONS.map(
      (dimension) => dimension.dimension,
    );

    for (const tenant of [
      "apexretail",
      "skyharbor",
      "meridian",
      "first-capital",
      "lakeshore",
      "northstar",
    ]) {
      const payload = getIntelligenceBindingPayload(tenant);

      expect(payload?.trustLine.dimensionsLoaded).toBe(19);
      expect(payload?.context.map((dimension) => dimension.dimension)).toEqual(
        expectedDimensions,
      );
      expect(payload?.context.every((dimension) => dimension.evidence > 0)).toBe(
        true,
      );
    }
  });

  it("keeps the committed binding artifact at 19 dimensions, not 8 rollups", () => {
    const file = rawBindingData as RawBindingFile;

    for (const [tenantKey, tenant] of Object.entries(file.tenants)) {
      expect({
        tenantKey,
        dimensionsLoaded: tenant.trustLine.dimensionsLoaded,
      }).toEqual({ tenantKey, dimensionsLoaded: 19 });
      expect(tenant.context).toHaveLength(19);
    }
  });
});
