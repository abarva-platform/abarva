import {
  canonicalClientDisplayName,
  canonicalClientDisplayNameOrNull,
  demoSafeClientText,
  getClientOption,
} from "@/lib/client-config";

describe("canonicalClientDisplayName", () => {
  it("renders Apex aliases as Retail Demo", () => {
    expect(getClientOption("apexretail").name).toBe("Retail Demo");
    expect(canonicalClientDisplayName({ key: "apexretail" })).toBe(
      "Retail Demo",
    );
    expect(canonicalClientDisplayName({ key: "apex-retail" })).toBe(
      "Retail Demo",
    );
    expect(canonicalClientDisplayName({ name: "Apex Retail" })).toBe(
      "Retail Demo",
    );
    expect(canonicalClientDisplayName({ name: "Apex Retail Group" })).toBe(
      "Retail Demo",
    );
  });

  it("renders Meridian aliases as Meridian Health", () => {
    expect(getClientOption("meridian").name).toBe("Meridian Health");
    expect(canonicalClientDisplayName({ key: "meridian" })).toBe(
      "Meridian Health",
    );
    expect(canonicalClientDisplayName({ key: "meridian-health" })).toBe(
      "Meridian Health",
    );
    expect(
      canonicalClientDisplayName({
        key: "meridian",
        name: "Meridian Health",
      }),
    ).toBe("Meridian Health");
    expect(canonicalClientDisplayName({ name: "Meridian Health" })).toBe(
      "Meridian Health",
    );
  });

  it("scrubs tenant names embedded in visible move titles and codes", () => {
    expect(
      demoSafeClientText(
        "QA-SYNTHETIC - Baggage Disruption Recovery Control Tower",
      ),
    ).toBe("Baggage Disruption Recovery Control Tower");
    expect(demoSafeClientText("proof: Baggage Disruption Recovery")).toBe(
      "Baggage Disruption Recovery",
    );
    expect(
      demoSafeClientText(
        "CANARY - SkyHarbor Recovery Command IROPS Architecture - skyharbor-canary-20260622161738",
      ),
    ).toBe(
      "CANARY - SkyHarbor Global Recovery Command IROPS Architecture - SkyHarbor Global-canary-20260622161738",
    );
    expect(
      demoSafeClientText(
        "Lakeshore Enterprise Finance & Treasury Modernization",
      ),
    ).toBe("Lakeshore Holdings Enterprise Finance & Treasury Modernization");
  });

  it("does not stack canonical tenant aliases into duplicated display names", () => {
    expect(demoSafeClientText("SkyHarbor Air Air Intelligence advisor")).toBe(
      "SkyHarbor Global Intelligence advisor",
    );
    expect(
      demoSafeClientText("Lakeshore Holdings Holdings Intelligence advisor"),
    ).toBe("Lakeshore Holdings Intelligence advisor");
    expect(canonicalClientDisplayName({ name: "SkyHarbor Air Air" })).toBe(
      "SkyHarbor Global",
    );
    expect(
      canonicalClientDisplayName({ name: "Lakeshore Holdings Holdings" }),
    ).toBe("Lakeshore Holdings");
    expect(
      demoSafeClientText("Apex Retail Group Retail Group Group advisor"),
    ).toBe("Retail Demo advisor");
  });

  it("maps retired Lakeshore Industries aliases to Lakeshore Holdings", () => {
    expect(canonicalClientDisplayName({ key: "lakeshore" })).toBe(
      "Lakeshore Holdings",
    );
    expect(canonicalClientDisplayName({ name: "Lakeshore Industries" })).toBe(
      "Lakeshore Holdings",
    );
    expect(
      canonicalClientDisplayName({ name: "Lakeshore Holdings Industries" }),
    ).toBe("Lakeshore Holdings");
    expect(
      demoSafeClientText(
        "For Lakeshore Holdings Industries, the stale alias must not surface.",
      ),
    ).toBe("For Lakeshore Holdings, the stale alias must not surface.");
  });

  it("scrubs legacy names inside JSON-escaped prompt strings", () => {
    expect(
      demoSafeClientText(
        String.raw`Current deterministic answer:\nSkyHarbor Air Group is using the V6 Home contract pack.`,
      ),
    ).toBe(
      String.raw`Current deterministic answer:\nSkyHarbor Global is using the V6 Home contract pack.`,
    );
  });

  it("uses the active display names for launch-demo tenants", () => {
    expect(getClientOption("skyharbor").name).toBe("SkyHarbor Global");
    expect(getClientOption("lakeshore").name).toBe("Lakeshore Holdings");
    expect(getClientOption("arcturus").name).toBe("FS Demo");
    expect(canonicalClientDisplayName({ key: "skyharbor-air" })).toBe(
      "SkyHarbor Global",
    );
    expect(canonicalClientDisplayName({ key: "first-capital" })).toBe(
      "FS Demo",
    );
    expect(
      canonicalClientDisplayName({ name: "First Capital Financial" }),
    ).toBe("FS Demo");
    expect(
      canonicalClientDisplayName({ name: "Arcturus Financial Group" }),
    ).toBe("FS Demo");
  });
});

/*
 * U-511. `canonicalClientDisplayName` answers with the default account for any
 * input it cannot resolve, which is correct for a surface that is already
 * inside a tenant and wrong for a guard deciding whether it may name one at
 * all. The strict variant exists for the second case, so it is the one that
 * has to be unable to invent a name.
 */
describe("canonicalClientDisplayNameOrNull", () => {
  it("resolves every registered key and alias exactly as the lenient form does", () => {
    for (const args of [
      { key: "apexretail" },
      { key: "apex-retail" },
      { key: "meridian" },
      { key: "meridian-health" },
      { key: "arcturus" },
      { key: "first-capital" },
      { key: "skyharbor-air" },
      { key: "northstar" },
      { key: "lakeshore" },
      { name: "Apex Retail Group" },
      { name: "Heliara Health Alliance" },
      { name: "First Capital Financial" },
      { name: "Lakeshore Industries" },
      { key: "meridian", name: "Meridian Health" },
    ]) {
      expect(canonicalClientDisplayNameOrNull(args)).toBe(
        canonicalClientDisplayName(args),
      );
      expect(canonicalClientDisplayNameOrNull(args)).not.toBeNull();
    }
  });

  it("answers null rather than the default account when nothing resolves", () => {
    for (const args of [
      {},
      { key: null, name: null },
      { key: undefined, name: undefined },
      { key: "" },
      { key: "   " },
      { key: "not-a-registered-key" },
    ]) {
      expect(canonicalClientDisplayNameOrNull(args)).toBeNull();
      // The lenient form still answers with the default account for the same
      // input -- that behaviour is relied on across the product and is
      // deliberately unchanged here. The difference between the two is the fix.
      expect(canonicalClientDisplayName(args)).toBe(
        getClientOption(args.key).name,
      );
    }
  });

  it("still passes an unrecognized free-text name through, as the lenient form does", () => {
    // An unregistered *name* is not an unresolved tenant: something named the
    // account, and both forms have always echoed it rather than overriding it.
    expect(canonicalClientDisplayNameOrNull({ name: "Some Other Co" })).toBe(
      "Some Other Co",
    );
    expect(canonicalClientDisplayName({ name: "Some Other Co" })).toBe(
      "Some Other Co",
    );
  });
});

