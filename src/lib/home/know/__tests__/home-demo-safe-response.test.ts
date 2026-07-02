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

    expect(safe.tenantKey).toBe("skyharbor");
    expect(safe.route).toBe("/api/home/know/ask");
    expect(safe.tables[0].rows[0].client).toBe("skyharbor");
    expect(safe.prose).toContain("Airline Demo");
    expect(safe.facts[0].label).toContain("Airline Demo");
    expect(safe.facts[0].value).toContain("Airline Demo");
    expect(safe.tables[0].rows[0].name).toContain("Airline Demo");
    expect(safe.citations[0].label).toContain("Industrial Demo");
    expect(safe.citations[0].excerpt).toContain("Retail Demo");
    expect(
      JSON.stringify({
        prose: safe.prose,
        facts: safe.facts,
        tables: safe.tables,
        citations: safe.citations,
      }),
    ).not.toMatch(
      /SkyHarbor Air Group|SkyHarbor Air|SkyHarbor Airlines|Lakeshore Industries|Apex Retail Group/i,
    );
    expect(safe.safety.composerTrace.promptSnapshot.full).toBe(
      "Airline Demo and Industrial Demo appeared in the prompt.",
    );
  });

  it("collapses duplicate demo tenant openings after name sanitization", () => {
    const safe = sanitizeHomeKnowVisiblePayload({
      prose:
        "For SkyHarbor Air, For SkyHarbor Air, the enterprise profile is strong enough to orient leadership.",
    });

    expect(safe.prose).toBe(
      "For Airline Demo, the enterprise profile is strong enough to orient leadership.",
    );
  });
});
