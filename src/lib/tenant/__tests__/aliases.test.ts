import {
  CANONICAL_TENANT_KEYS,
  canonicalTenantKey,
  resolveTenantAlias,
  tenantAliasesFor,
} from "../aliases";

describe("tenant aliases", () => {
  it.each(CANONICAL_TENANT_KEYS)(
    "round-trips the canonical tenant key %s through the alias registry",
    (tenantKey) => {
      expect(canonicalTenantKey(tenantKey)).toBe(tenantKey);
      expect(resolveTenantAlias(tenantKey)?.canonicalKey).toBe(tenantKey);
      expect(tenantAliasesFor(tenantKey)).toContain(tenantKey);
    },
  );

  it("treats the command-center SkyHarbor Global key as Airline Demo", () => {
    expect(canonicalTenantKey("skyharbor_global")).toBe("skyharbor-air");
    expect(canonicalTenantKey("skyharbor-global")).toBe("skyharbor-air");
    expect(resolveTenantAlias("SkyHarbor Global")?.appClientKey).toBe(
      "skyharbor",
    );
    expect(tenantAliasesFor("skyharbor-air")).toContain("skyharbor_global");
  });
});
