import {
  CANONICAL_TENANT_KEYS,
  LEGACY_TENANT_ALIASES,
  TENANT_KEY_ALIASES,
  canonicalTenantKey,
  isLegacyTenantAlias,
} from "@/lib/tenant-keys";

describe("canonicalTenantKey", () => {
  // The alias map is the source of truth that the SQL migration and I10
  // canonical tenant guard are derived from. If anyone adds aliases here,
  // the migration/guard needs a matching update.
  it("exposes the documented tenant alias map", () => {
    expect(TENANT_KEY_ALIASES).toEqual({
      "airline demo": "skyharbor-air",
      apex: "apex-retail",
      "apex retail": "apex-retail",
      "apex retail group": "apex-retail",
      apexretail: "apex-retail",
      arcturus: "first-capital",
      "first capital": "first-capital",
      "first capital financial": "first-capital",
      "first-capital-financial": "first-capital",
      firstcapital: "first-capital",
      "clinical technology demo": "northstar-clinical",
      "financial services demo": "first-capital",
      "healthcare demo": "meridian-health",
      heliara: "meridian-health",
      "heliara health": "meridian-health",
      lakeshore: "lakeshore-holdings",
      "lakeshore holdings": "lakeshore-holdings",
      meridian: "meridian-health",
      "meridian health": "meridian-health",
      "meridian health system": "meridian-health",
      "meridian-health-global": "meridian-health",
      northstar: "northstar-clinical",
      "northstar clinical technologies": "northstar-clinical",
      "retail demo": "apex-retail",
      skyharbor: "skyharbor-air",
      "skyharbor air": "skyharbor-air",
      "skyharbor airlines": "skyharbor-air",
      "skyharbor global": "skyharbor-air",
      "skyharbor global airlines group": "skyharbor-air",
      "skyharbor-global": "skyharbor-air",
    });
  });

  it("rewrites each documented alias to its canonical form", () => {
    expect(canonicalTenantKey("apexretail")).toBe("apex-retail");
    expect(canonicalTenantKey("meridian")).toBe("meridian-health");
    expect(canonicalTenantKey("arcturus")).toBe("first-capital");
    expect(canonicalTenantKey("northstar-clinical")).toBe("northstar-clinical");
    expect(canonicalTenantKey("skyharbor")).toBe("skyharbor-air");
    expect(canonicalTenantKey("lakeshore")).toBe("lakeshore-holdings");
    expect(canonicalTenantKey("lakeshore holdings")).toBe("lakeshore-holdings");
  });

  it("does not silently normalize retired Lakeshore aliases", () => {
    expect(canonicalTenantKey("lakeshore-industries")).toBe(
      "lakeshore-industries",
    );
    expect(canonicalTenantKey("lakeshore industries")).toBe(
      "lakeshore industries",
    );
    expect(canonicalTenantKey("morganstreet")).toBe("morganstreet");
    expect(canonicalTenantKey("morgan-street")).toBe("morgan-street");
    expect(canonicalTenantKey("mona-street")).toBe("mona-street");
  });

  it("is idempotent — canonical values pass through unchanged", () => {
    for (const canon of CANONICAL_TENANT_KEYS) {
      expect(canonicalTenantKey(canon)).toBe(canon);
      expect(canonicalTenantKey(canonicalTenantKey(canon))).toBe(canon);
    }
  });

  it("passes unknown tenant keys through unchanged", () => {
    expect(canonicalTenantKey("northstar-health")).toBe("northstar-health");
  });

  it("passes the empty string through unchanged (validation lives elsewhere)", () => {
    expect(canonicalTenantKey("")).toBe("");
  });

  it("preserves null and undefined", () => {
    expect(canonicalTenantKey(null)).toBeNull();
    expect(canonicalTenantKey(undefined)).toBeUndefined();
  });

  it("normalizes alias casing before lookup", () => {
    expect(canonicalTenantKey("APEXRETAIL")).toBe("apex-retail");
    expect(canonicalTenantKey("Meridian")).toBe("meridian-health");
  });
});

describe("isLegacyTenantAlias", () => {
  it("returns true only for documented aliases", () => {
    for (const alias of LEGACY_TENANT_ALIASES) {
      expect(isLegacyTenantAlias(alias)).toBe(true);
    }
  });

  it("returns false for canonical keys and unknown strings", () => {
    expect(isLegacyTenantAlias("apex-retail")).toBe(false);
    expect(isLegacyTenantAlias("meridian-health")).toBe(false);
    expect(isLegacyTenantAlias("first-capital")).toBe(false);
    expect(isLegacyTenantAlias("keystone")).toBe(false);
    expect(isLegacyTenantAlias("")).toBe(false);
  });

  it("returns false for non-string inputs", () => {
    expect(isLegacyTenantAlias(null)).toBe(false);
    expect(isLegacyTenantAlias(undefined)).toBe(false);
    expect(isLegacyTenantAlias(42)).toBe(false);
    expect(isLegacyTenantAlias({})).toBe(false);
  });
});

describe("LEGACY_TENANT_ALIASES / CANONICAL_TENANT_KEYS", () => {
  it("LEGACY_TENANT_ALIASES enumerates exactly the alias-map keys", () => {
    expect(new Set(LEGACY_TENANT_ALIASES)).toEqual(
      new Set(Object.keys(TENANT_KEY_ALIASES)),
    );
  });

  it("CANONICAL_TENANT_KEYS enumerates the deduped alias-map targets", () => {
    expect(new Set(CANONICAL_TENANT_KEYS)).toEqual(
      new Set(Object.values(TENANT_KEY_ALIASES)),
    );
  });

  it("canonical and alias sets are disjoint", () => {
    for (const canon of CANONICAL_TENANT_KEYS) {
      expect(LEGACY_TENANT_ALIASES).not.toContain(canon);
    }
  });
});
