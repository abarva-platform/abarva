import {
  canonicalClientDisplayName,
  demoSafeClientText,
  getClientOption,
} from "@/lib/client-config";

describe("canonicalClientDisplayName", () => {
  it("renders Apex aliases as Apex Retail Group", () => {
    expect(getClientOption("apexretail").name).toBe("Apex Retail Group");
    expect(canonicalClientDisplayName({ key: "apexretail" })).toBe(
      "Apex Retail Group",
    );
    expect(canonicalClientDisplayName({ key: "apex-retail" })).toBe(
      "Apex Retail Group",
    );
    expect(canonicalClientDisplayName({ name: "Apex Retail" })).toBe(
      "Apex Retail Group",
    );
    expect(canonicalClientDisplayName({ name: "Apex Retail Group" })).toBe(
      "Apex Retail Group",
    );
  });

  it("renders Meridian aliases as Meridian Health System", () => {
    expect(getClientOption("meridian").name).toBe("Meridian Health System");
    expect(canonicalClientDisplayName({ key: "meridian" })).toBe(
      "Meridian Health System",
    );
    expect(
      canonicalClientDisplayName({
        key: "meridian",
        name: "Meridian Health",
      }),
    ).toBe("Meridian Health System");
    expect(canonicalClientDisplayName({ name: "Meridian Health" })).toBe(
      "Meridian Health System",
    );
  });

  it("scrubs tenant names embedded in visible move titles and codes", () => {
    expect(
      demoSafeClientText(
        "CANARY - SkyHarbor Recovery Command IROPS Architecture - skyharbor-canary-20260622161738",
      ),
    ).toBe(
      "CANARY - SkyHarbor Air Recovery Command IROPS Architecture - SkyHarbor Air-canary-20260622161738",
    );
    expect(
      demoSafeClientText(
        "Lakeshore Enterprise Finance & Treasury Modernization",
      ),
    ).toBe("Lakeshore Holdings Enterprise Finance & Treasury Modernization");
  });

  it("does not stack canonical tenant aliases into duplicated display names", () => {
    expect(demoSafeClientText("SkyHarbor Air Air Intelligence advisor")).toBe(
      "SkyHarbor Air Intelligence advisor",
    );
    expect(
      demoSafeClientText("Lakeshore Holdings Holdings Intelligence advisor"),
    ).toBe("Lakeshore Holdings Intelligence advisor");
    expect(canonicalClientDisplayName({ name: "SkyHarbor Air Air" })).toBe(
      "SkyHarbor Air",
    );
    expect(
      canonicalClientDisplayName({ name: "Lakeshore Holdings Holdings" }),
    ).toBe("Lakeshore Holdings");
    expect(
      demoSafeClientText("Apex Retail Group Retail Group Group advisor"),
    ).toBe("Apex Retail Group advisor");
  });
});
