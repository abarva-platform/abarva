import { comparePage, type CrawlPageObservation } from "../baseline-compare";
import { resolveCrawlPersonas } from "../persona-switcher";

function observation(
  overrides: Partial<CrawlPageObservation> = {},
): CrawlPageObservation {
  return {
    tenantKey: "skyharbor",
    expectedTenantName: "SkyHarbor Air",
    personaKey: "skyharbor-cto",
    surfaceId: "intelligence-root",
    path: "/intelligence",
    url: "https://app.abarva.ai/intelligence",
    visibleText: "SkyHarbor Air intelligence overview",
    consoleErrors: [],
    networkErrors: [],
    evidenceChipCount: 0,
    proofPointCount: 0,
    citationDensity: 0,
    hardQuestionExactFieldCitations: 2,
    watchlistTopEntries: [],
    visualCanon: {
      backgroundOk: true,
      headersOk: true,
      bodyOk: true,
      buttonsOk: true,
    },
    ...overrides,
  };
}

describe("post-deploy crawl guard", () => {
  it("includes SkyHarbor personas in the standard production crawl", () => {
    const personaKeys = resolveCrawlPersonas().map((persona) => persona.key);

    expect(personaKeys).toEqual(
      expect.arrayContaining(["skyharbor-cto", "skyharbor-cio"]),
    );
  });

  it("flags the known Meridian healthcare bleed terms as P0 only for SkyHarbor", () => {
    const skyharborFindings = comparePage(
      observation({
        visibleText:
          "SkyHarbor Air Art of Possible Clinical care ambient AI MH-07 Innovaccer revenue cycle",
      }),
    );

    expect(skyharborFindings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "P0",
          dimension: "tenant-specific-leakage",
          evidence: {
            forbidden: [
              "Clinical care",
              "ambient AI",
              "MH-07",
              "Innovaccer",
              "revenue cycle",
            ],
          },
        }),
      ]),
    );

    const meridianFindings = comparePage(
      observation({
        tenantKey: "meridian",
        expectedTenantName: "Meridian Health",
        personaKey: "meridian-cdio",
        visibleText:
          "Meridian Health uses Clinical care ambient AI with MH-07 and Innovaccer in revenue cycle planning",
      }),
    );

    expect(
      meridianFindings.some(
        (finding) => finding.dimension === "tenant-specific-leakage",
      ),
    ).toBe(false);
  });
});
