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

  it("renders Meridian aliases as Healthcare Demo", () => {
    expect(getClientOption("meridian").name).toBe("Healthcare Demo");
    expect(canonicalClientDisplayName({ key: "meridian" })).toBe(
      "Healthcare Demo",
    );
    expect(
      canonicalClientDisplayName({
        key: "meridian",
        name: "Meridian Health",
      }),
    ).toBe("Healthcare Demo");
    expect(canonicalClientDisplayName({ name: "Meridian Health" })).toBe(
      "Healthcare Demo",
    );
  });

  it("scrubs tenant names embedded in visible move titles and codes", () => {
    expect(
      demoSafeClientText(
        "CANARY - SkyHarbor Recovery Command IROPS Architecture - skyharbor-canary-20260622161738",
      ),
    ).toBe(
      "CANARY - Airline Demo Recovery Command IROPS Architecture - Airline Demo-canary-20260622161738",
    );
    expect(
      demoSafeClientText(
        "Lakeshore Enterprise Finance & Treasury Modernization",
      ),
    ).toBe("Lakeshore Holdings Enterprise Finance & Treasury Modernization");
  });

  it("does not stack canonical tenant aliases into duplicated display names", () => {
    expect(demoSafeClientText("SkyHarbor Air Air Intelligence advisor")).toBe(
      "Airline Demo Intelligence advisor",
    );
    expect(
      demoSafeClientText("Lakeshore Holdings Holdings Intelligence advisor"),
    ).toBe("Lakeshore Holdings Intelligence advisor");
    expect(canonicalClientDisplayName({ name: "SkyHarbor Air Air" })).toBe(
      "Airline Demo",
    );
    expect(
      canonicalClientDisplayName({ name: "Lakeshore Holdings Holdings" }),
    ).toBe("Lakeshore Holdings");
    expect(
      demoSafeClientText("Apex Retail Group Retail Group Group advisor"),
    ).toBe("Retail Demo advisor");
  });

  it("scrubs legacy names inside JSON-escaped prompt strings", () => {
    expect(
      demoSafeClientText(
        String.raw`Current deterministic answer:\nSkyHarbor Air Group is using the V6 Home contract pack.`,
      ),
    ).toBe(
      String.raw`Current deterministic answer:\nAirline Demo is using the V6 Home contract pack.`,
    );
  });

  it("uses generic demo names for all launch-demo tenants", () => {
    expect(getClientOption("skyharbor").name).toBe("Airline Demo");
    expect(getClientOption("lakeshore").name).toBe("Lakeshore Holdings");
    expect(getClientOption("arcturus").name).toBe("Financial Services Demo");
    expect(canonicalClientDisplayName({ name: "First Capital Financial" })).toBe(
      "Financial Services Demo",
    );
    expect(canonicalClientDisplayName({ name: "Arcturus Financial Group" })).toBe(
      "Financial Services Demo",
    );
  });
});
