import {
  canonicalTenantKey,
  resolveTenantAlias,
  tenantAliasesFor,
} from "../aliases";

describe("tenant aliases", () => {
  it("treats the command-center SkyHarbor Global key as Airline Demo", () => {
    expect(canonicalTenantKey("skyharbor_global")).toBe("skyharbor-air");
    expect(canonicalTenantKey("skyharbor-global")).toBe("skyharbor-air");
    expect(resolveTenantAlias("SkyHarbor Global")?.appClientKey).toBe(
      "skyharbor",
    );
    expect(tenantAliasesFor("skyharbor-air")).toContain("skyharbor_global");
  });
});
