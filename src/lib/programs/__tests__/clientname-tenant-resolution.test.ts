import { canonicalClientDisplayName } from "@/lib/client-config";

// Regression guard for the Move-card tenant-name leak (transformers.ts
// `canonicalProgramClientName`). The old code ran a 4-name if-cascade and
// defaulted everything else to "Apex Retail Group", so SkyHarbor / Northstar
// Moves rendered as "APEX RETAIL GROUP". The fix delegates to
// canonicalClientDisplayName, which resolves each tenant from its (key, name).
//
// Move cards always pass the tenant's DB name (clients.name), so this asserts
// the realistic resolution path: each tenant resolves to ITSELF, never Apex.
describe("Move-card tenant name resolution (no cross-tenant Apex default)", () => {
  const cases: Array<[string, string]> = [
    ["skyharbor", "SkyHarbor Air"],
    ["northstar", "Northstar Clinical Technologies"],
    ["lakeshore", "Lakeshore Holdings"],
    ["apexretail", "Apex Retail Group"],
  ];

  it.each(cases)("resolves %s from its DB name -> %s", (key, name) => {
    expect(canonicalClientDisplayName({ key, name })).toBe(name);
  });

  it("never collapses a non-Apex tenant to Apex Retail Group", () => {
    expect(
      canonicalClientDisplayName({ key: "skyharbor", name: "SkyHarbor Air" }),
    ).not.toBe("Apex Retail Group");
    expect(
      canonicalClientDisplayName({
        key: "northstar",
        name: "Northstar Clinical Technologies",
      }),
    ).not.toBe("Apex Retail Group");
  });

  it("returns the raw name for an unmapped tenant rather than inventing Apex", () => {
    expect(canonicalClientDisplayName({ name: "Some Other Co" })).toBe(
      "Some Other Co",
    );
  });
});
