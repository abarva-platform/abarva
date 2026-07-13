import { comparePage, type CrawlPageObservation } from "../baseline-compare";
import {
  resolveCrawlPersonas,
  resolveCrawlSurfaces,
} from "../persona-switcher";

function observation(
  overrides: Partial<CrawlPageObservation> = {},
): CrawlPageObservation {
  return {
    tenantKey: "skyharbor",
    expectedTenantName: "SkyHarbor Air",
    personaKey: "agent-skyharbor",
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
  it("includes required personas in the standard production crawl", () => {
    const personaKeys = resolveCrawlPersonas().map((persona) => persona.key);

    expect(personaKeys).toEqual(
      expect.arrayContaining(["agent-meridian", "agent-skyharbor"]),
    );
  });

  it("includes the Admin Data Layer Explorer as a directly targetable crawl surface", () => {
    expect(resolveCrawlSurfaces("admin-data-layer-explorer")).toEqual([
      expect.objectContaining({
        id: "admin-data-layer-explorer",
        path: "/admin/data-layer-explorer",
      }),
    ]);
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
        expectedTenantName: "Meridian Health System",
        personaKey: "agent-meridian",
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

  it("does not flag release-ledger audit records that describe prior SkyHarbor findings", () => {
    const findings = comparePage(
      observation({
        surfaceId: "admin-releases",
        path: "/admin/releases",
        url: "https://app.abarva.ai/admin/releases",
        visibleText:
          "SkyHarbor Air release record: guard terms Clinical care ambient AI MH-07 Innovaccer revenue cycle are documented here as audit evidence.",
      }),
    );

    expect(
      findings.some(
        (finding) => finding.dimension === "tenant-specific-leakage",
      ),
    ).toBe(false);
  });

  it("does not require hard-question citations on the Source events portfolio", () => {
    const findings = comparePage(
      observation({
        tenantKey: "apexretail",
        expectedTenantName: "Apex Retail Group",
        personaKey: "agent-apexretail",
        surfaceId: "source-events",
        path: "/source/events",
        visibleText:
          "Apex Retail Group Source sourcing portfolio with two active events",
        hardQuestionExactFieldCitations: 0,
      }),
    );

    expect(
      findings.some(
        (finding) => finding.dimension === "hard-question-citation-depth",
      ),
    ).toBe(false);
  });

  it("still requires hard-question citations on real agent ask surfaces", () => {
    const findings = comparePage(
      observation({
        surfaceId: "intelligence-ask",
        path: "/intelligence/ask",
        visibleText: "SkyHarbor Air ask Sentinel",
        hardQuestionExactFieldCitations: 0,
        hardQuestionGroundingEvidence: 0,
      }),
    );

    expect(findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "P1",
          dimension: "hard-question-citation-depth",
        }),
      ]),
    );
  });

  it("accepts structured source events as hard-question grounding evidence", () => {
    const findings = comparePage(
      observation({
        surfaceId: "intelligence-ask",
        path: "/intelligence/ask",
        visibleText: "SkyHarbor Air ask Sentinel",
        hardQuestionExactFieldCitations: 0,
        hardQuestionGroundingEvidence: 2,
      }),
    );

    expect(
      findings.some(
        (finding) => finding.dimension === "hard-question-citation-depth",
      ),
    ).toBe(false);
  });

  it("classifies crawl auth bootstrap failures as P1 without tenant-leakage noise", () => {
    const findings = comparePage(
      observation({
        surfaceId: "auth-bootstrap",
        path: "/sign-in",
        visibleText:
          "Auth bootstrap failed for Apex Retail Group: You have been banned.",
      }),
    );

    expect(findings).toEqual([
      expect.objectContaining({
        severity: "P1",
        dimension: "auth-bootstrap",
      }),
    ]);
  });
});
