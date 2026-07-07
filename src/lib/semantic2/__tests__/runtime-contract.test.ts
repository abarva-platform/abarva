import {
  assertNotLegacySemanticLayerTable,
  isLegacySemanticLayerTable,
  isSemantic2CrownJewelTable,
  normalizeSemantic2RuntimeTenantKey,
  SEMANTIC2_CROWN_JEWEL_PROMPT_VERSION,
  Semantic2RuntimeContractError,
} from "../runtime-contract";

describe("semantic2 runtime contract", () => {
  it("normalizes only active product tenants and aliases", () => {
    expect(normalizeSemantic2RuntimeTenantKey("skyharbor")).toBe("skyharbor-air");
    expect(normalizeSemantic2RuntimeTenantKey("lakeshore")).toBe(
      "lakeshore-holdings",
    );
    expect(normalizeSemantic2RuntimeTenantKey("first-capital")).toBe(
      "first-capital",
    );
    expect(normalizeSemantic2RuntimeTenantKey("first-capital-financial")).toBe(
      "first-capital",
    );
    expect(normalizeSemantic2RuntimeTenantKey("arcturus")).toBe(
      "first-capital",
    );
    expect(normalizeSemantic2RuntimeTenantKey("mona street")).toBe(
      "lakeshore-holdings",
    );
  });

  it("rejects archived, unknown, UUID, and lab-only tenant scopes", () => {
    for (const tenantKey of [
      "archived:first-capital",
      "unknown",
      "0834e0e7-5b56-46fe-9912-5aa9bc0d66c9",
      "northstar-clinical",
      "lakefront-capital",
    ]) {
      expect(() => normalizeSemantic2RuntimeTenantKey(tenantKey)).toThrow(
        Semantic2RuntimeContractError,
      );
    }
  });

  it("identifies legacy seed semantic tables separately from semantic2 crown-jewel tables", () => {
    expect(isSemantic2CrownJewelTable("semantic2_dossiers")).toBe(true);
    expect(isSemantic2CrownJewelTable("semantic2_metrics")).toBe(true);
    expect(isLegacySemanticLayerTable("semantic_metrics")).toBe(true);
    expect(isLegacySemanticLayerTable("tenant_question_readiness")).toBe(true);
    expect(isLegacySemanticLayerTable("semantic2_dossiers")).toBe(false);
  });

  it("throws before runtime code can read old seed semantic tables", () => {
    expect(() =>
      assertNotLegacySemanticLayerTable("semantic_metrics", "home-know"),
    ).toThrow(Semantic2RuntimeContractError);
  });

  it("pins the crown-jewel prompt version used by runtime loaders", () => {
    expect(SEMANTIC2_CROWN_JEWEL_PROMPT_VERSION).toBe(
      "semantic2-l3-enriched-buildtime-claude-v2",
    );
  });
});
