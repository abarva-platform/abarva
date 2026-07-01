import { canonicalClientDisplayName } from "@/lib/client-config";

// Regression guard for the Move-card tenant-name leak (transformers.ts
// `canonicalProgramClientName`). The old code ran a 4-name if-cascade and
// defaulted everything else to "Apex Retail Group", so SkyHarbor / Northstar
// Moves rendered as "APEX RETAIL GROUP". The fix delegates to
// canonicalClientDisplayName, which resolves each tenant from its (key, name).
//
// Move cards always pass the tenant's DB name (clients.name), so this asserts
// the realistic resolution path: each tenant resolves to its demo-safe label,
// never Apex.
describe("Move-card tenant name resolution (no cross-tenant Apex default)", () => {
  const cases: Array<[string, string, string]> = [
    ["skyharbor", "SkyHarbor Air", "Airline Demo"],
    ["northstar", "Northstar Clinical Technologies", "Clinical Technology Demo"],
    ["lakeshore", "Lakeshore Holdings", "Industrial Demo"],
    ["apexretail", "Apex Retail Group", "Retail Demo"],
  ];

  it.each(cases)("resolves %s from DB name %s -> %s", (key, name, expected) => {
    expect(canonicalClientDisplayName({ key, name })).toBe(expected);
  });

  it("never collapses a non-Apex tenant to Retail Demo", () => {
    expect(
      canonicalClientDisplayName({ key: "skyharbor", name: "SkyHarbor Air" }),
    ).not.toBe("Retail Demo");
    expect(
      canonicalClientDisplayName({
        key: "northstar",
        name: "Northstar Clinical Technologies",
      }),
    ).not.toBe("Retail Demo");
  });

  it("returns the raw name for an unmapped tenant rather than inventing Apex", () => {
    expect(canonicalClientDisplayName({ name: "Some Other Co" })).toBe(
      "Some Other Co",
    );
  });
});
