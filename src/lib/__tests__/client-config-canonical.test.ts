import {
  canonicalClientDisplayName,
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
