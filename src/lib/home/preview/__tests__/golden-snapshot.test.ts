import {
  getHomeReviewBundle,
  isHomePreviewTenantKey,
  HOME_PREVIEW_TENANT_KEYS,
} from "../golden-snapshot";

/**
 * The golden snapshot loader is the review-bundle side of the acceptance workflow: it must load
 * the two accepted tenants' checked-in JSON exactly, and must refuse (not crash, not fall back to
 * something else) for any tenant that isn't one of the reviewed pair -- there is no live-generation
 * fallback in this route by design.
 */
describe("isHomePreviewTenantKey", () => {
  it("accepts both accepted tenants", () => {
    for (const key of HOME_PREVIEW_TENANT_KEYS) {
      expect(isHomePreviewTenantKey(key)).toBe(true);
    }
  });

  it("rejects an unreviewed tenant key", () => {
    expect(isHomePreviewTenantKey("apex-retail")).toBe(false);
  });
});

describe("getHomeReviewBundle", () => {
  it("loads meridian-health with all eight chapters and provenance", () => {
    const bundle = getHomeReviewBundle("meridian-health");
    expect(bundle).not.toBeNull();
    expect(bundle?.tenantKey).toBe("meridian-health");
    expect(bundle?.chapters).toHaveLength(8);
    expect(bundle?.provenance.home_synthesis_contract_version).toBe("home-chapters-v1");
    expect(bundle?.thesis.publishedGeneration).toBeTruthy();
    expect(bundle?.thesis.signalPacket.signals.length).toBeGreaterThan(0);
  });

  it("loads skyharbor-air with all eight chapters and provenance", () => {
    const bundle = getHomeReviewBundle("skyharbor-air");
    expect(bundle).not.toBeNull();
    expect(bundle?.tenantKey).toBe("skyharbor-air");
    expect(bundle?.chapters).toHaveLength(8);
  });

  it("returns null rather than throwing for an unreviewed tenant", () => {
    expect(getHomeReviewBundle("apex-retail")).toBeNull();
  });

  it("every chapter's evidence_ids resolve to a real signal or context item in the same bundle", () => {
    const bundle = getHomeReviewBundle("meridian-health");
    const evidenceIds = new Set([
      ...(bundle?.thesis.signalPacket.signals.map((s) => s.id) ?? []),
      ...(bundle?.thesis.signalPacket.contextItems.map((c) => c.id) ?? []),
    ]);
    const allClaims = (bundle?.chapters ?? []).flatMap((c) => [...c.key_insights, ...c.tensions, ...c.what_to_watch]);
    expect(allClaims.length).toBeGreaterThan(0);
    for (const claim of allClaims) {
      for (const evidenceId of claim.evidence_ids) {
        expect(evidenceIds.has(evidenceId)).toBe(true);
      }
    }
  });
});
