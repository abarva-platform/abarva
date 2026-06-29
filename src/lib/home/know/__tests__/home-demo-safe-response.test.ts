import { sanitizeHomeKnowVisiblePayload } from "../home-demo-safe-response";

describe("home demo-safe response sanitizer", () => {
  it("converts old tenant names in user-visible Home KNOW payload strings", () => {
    const safe = sanitizeHomeKnowVisiblePayload({
      tenantKey: "skyharbor",
      route: "/api/home/know/ask",
      prose:
        "For SkyHarbor Air Group, the loaded context shows SkyHarbor Air operations.",
      facts: [
        {
          id: "fact-1",
          dimensionId: "enterprise_profile",
          label: "SkyHarbor Air business context",
          value: "SkyHarbor Airlines source packet",
          citationIds: ["citation-1"],
        },
      ],
      tables: [
        {
          id: "table-1",
          rows: [
            {
              client: "skyharbor",
              name: "SkyHarbor Air Group",
            },
          ],
        },
      ],
      citations: [
        {
          id: "citation-1",
          label: "Lakeshore Industries comparison should be hidden",
          excerpt: "Apex Retail Group should also be hidden.",
        },
      ],
      safety: {
        composerTrace: {
          route: "/api/home/know/ask",
          promptSnapshot: {
            full: "SkyHarbor Air and Lakeshore Holdings appeared in the prompt.",
          },
        },
      },
    });

    const serialized = JSON.stringify(safe);

    expect(safe.tenantKey).toBe("skyharbor");
    expect(safe.route).toBe("/api/home/know/ask");
    expect(safe.tables[0].rows[0].client).toBe("skyharbor");
    expect(serialized).toContain("Airline Demo");
    expect(serialized).toContain("Industrial Demo");
    expect(serialized).toContain("Retail Demo");
    expect(serialized).not.toMatch(
      /SkyHarbor Air Group|SkyHarbor Air|SkyHarbor Airlines|Lakeshore Industries|Lakeshore Holdings|Apex Retail Group/i,
    );
  });
});
