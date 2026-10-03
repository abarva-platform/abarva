import {
  comparePage,
  hasBlockingCrawlProofFinding,
  isAuthAutomationBlockMessage,
  type CrawlPageObservation,
} from "../baseline-compare";
import {
  resolveCrawlPersonas,
  resolveCrawlSurfaces,
} from "../persona-switcher";
import {
  appendClerkTestingTokenToRequestUrl,
  clerkFrontendApiHostFromPublishableKey,
  installClerkTestingTokenInterceptor,
} from "../clerk-testing-token";
import type { Page } from "@playwright/test";

function observation(
  overrides: Partial<CrawlPageObservation> = {},
): CrawlPageObservation {
  return {
    tenantKey: "skyharbor",
    expectedTenantName: "SkyHarbor Global",
    personaKey: "agent-skyharbor",
    surfaceId: "intelligence-root",
    path: "/intelligence",
    url: "https://app.abarva.ai/intelligence",
    visibleText: "SkyHarbor Global intelligence overview",
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
  it("derives the exact custom Clerk FAPI host from the publishable key", () => {
    const publishableKey = `pk_live_${Buffer.from("clerk.abarva.ai$").toString("base64")}`;

    expect(clerkFrontendApiHostFromPublishableKey(publishableKey)).toBe(
      "clerk.abarva.ai",
    );
    expect(
      clerkFrontendApiHostFromPublishableKey("pk_live_invalid"),
    ).toBeNull();
  });

  it("adds the testing token only to Clerk Frontend API requests, including a custom domain", () => {
    const baseUrl = "https://app.abarva.ai";
    const host = "clerk.abarva.ai";
    const tokenized = appendClerkTestingTokenToRequestUrl(
      "https://clerk.abarva.ai/v1/client/sign_ins?foo=bar",
      baseUrl,
      host,
      "test-token",
    );

    expect(new URL(tokenized!).searchParams.get("foo")).toBe("bar");
    expect(new URL(tokenized!).searchParams.get("__clerk_testing_token")).toBe(
      "test-token",
    );
    expect(
      appendClerkTestingTokenToRequestUrl(
        "https://clerk.abarva.ai/npm/@clerk/clerk-js@6/dist/clerk.browser.js",
        baseUrl,
        host,
        "test-token",
      ),
    ).toBeNull();
    expect(
      appendClerkTestingTokenToRequestUrl(
        "http://clerk.abarva.ai/v1/client/sign_ins",
        baseUrl,
        host,
        "test-token",
      ),
    ).toBeNull();
    expect(
      appendClerkTestingTokenToRequestUrl(
        "https://untrusted.example/__clerk/v1/client",
        baseUrl,
        host,
        "test-token",
      ),
    ).toBeNull();
    expect(
      appendClerkTestingTokenToRequestUrl(
        "https://app.abarva.ai/__clerk/v1/client",
        baseUrl,
        host,
        "test-token",
      ),
    ).toContain("__clerk_testing_token=test-token");
    expect(
      appendClerkTestingTokenToRequestUrl(
        "http://app.abarva.ai/__clerk/v1/client",
        "http://app.abarva.ai",
        host,
        "test-token",
      ),
    ).toBeNull();
  });

  it("wires the testing token through Playwright routing before navigation", async () => {
    const originalKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = `pk_live_${Buffer.from(
      "clerk.abarva.ai$",
    ).toString("base64")}`;
    type TestRoute = {
      request: () => { url: () => string };
      continue: (options?: { url: string }) => Promise<void>;
    };
    let requestHandler: ((route: TestRoute) => Promise<void>) | undefined;
    const page = {
      route: jest.fn(
        async (
          _pattern: string,
          handler: (route: TestRoute) => Promise<void>,
        ) => {
          requestHandler = handler;
        },
      ),
    } as unknown as Page;

    try {
      await installClerkTestingTokenInterceptor(
        page,
        "test-token",
        "https://app.abarva.ai",
      );
      expect(page.route).toHaveBeenCalledWith("**/*", expect.any(Function));

      const continueRoute = jest.fn().mockResolvedValue(undefined);
      await requestHandler?.({
        request: () => ({
          url: () => "https://clerk.abarva.ai/v1/client/sign_ins",
        }),
        continue: continueRoute,
      });
      expect(continueRoute).toHaveBeenCalledWith({
        url: "https://clerk.abarva.ai/v1/client/sign_ins?__clerk_testing_token=test-token",
      });
    } finally {
      if (originalKey === undefined) {
        delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
      } else {
        process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = originalKey;
      }
    }
  });

  it("keeps the standard production crawl on the active automation tenant roster only", () => {
    const personaKeys = resolveCrawlPersonas().map((persona) => persona.key);

    expect(personaKeys).toEqual(["agent-meridian", "agent-skyharbor"]);
    expect(personaKeys).not.toContain("agent-apexretail");
    expect(personaKeys).not.toContain("agent-firstcapital");
    expect(personaKeys).not.toContain("agent-lakeshore");
    expect(personaKeys).not.toContain("agent-northstar");
  });

  it("uses active UI display names for tenant identity checks", () => {
    expect(
      resolveCrawlPersonas("agent-meridian").map(
        (persona) => persona.tenantName,
      ),
    ).toEqual(["Meridian Health"]);
    expect(
      resolveCrawlPersonas("agent-skyharbor").map(
        (persona) => persona.tenantName,
      ),
    ).toEqual(["SkyHarbor Global"]);
  });

  it("accepts uppercase tenant headings as visible tenant identity", () => {
    const findings = comparePage(
      observation({
        visibleText:
          "IT INVESTMENT TOWER · FY26 · SKYHARBOR GLOBAL\nValue proof dashboard",
      }),
    );

    expect(
      findings.some((finding) => finding.dimension === "tenant-identity"),
    ).toBe(false);
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
          "SkyHarbor Global Art of Possible Clinical care ambient AI MH-07 Innovaccer revenue cycle",
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
          "SkyHarbor Global release record: guard terms Clinical care ambient AI MH-07 Innovaccer revenue cycle are documented here as audit evidence.",
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
        visibleText: "SkyHarbor Global ask Sentinel",
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
        visibleText: "SkyHarbor Global ask Sentinel",
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

  it("fails the crawl when auth bootstrap is blocked even if the severity tally is 0 P0", () => {
    const authFinding = comparePage(
      observation({
        surfaceId: "auth-bootstrap",
        path: "/sign-in",
        visibleText:
          "Auth bootstrap failed for SkyHarbor Global: This ticket is invalid.",
      }),
    )[0];
    const comparison = {
      p0: 0,
      findings: [authFinding],
    };

    expect(authFinding?.severity).toBe("P1");
    expect(hasBlockingCrawlProofFinding(comparison)).toBe(true);
  });

  it("fails the crawl when the candidate-preview auth bootstrap is blocked", () => {
    expect(
      hasBlockingCrawlProofFinding({
        p0: 0,
        findings: [
          {
            severity: "P1",
            tenantKey: "skyharbor",
            personaKey: "agent-skyharbor",
            surfaceId: "admin-candidate-preview",
            dimension: "candidate-preview-auth-bootstrap",
            message: "Authentication did not reach the route.",
          },
        ],
      }),
    ).toBe(true);
  });

  it("does not turn an unrelated P1 product observation into a harness failure", () => {
    expect(
      hasBlockingCrawlProofFinding({
        p0: 0,
        findings: [
          {
            severity: "P1",
            tenantKey: "skyharbor",
            personaKey: "agent-skyharbor",
            surfaceId: "intelligence-ask",
            dimension: "hard-question-citation-depth",
            message: "The answer lacks citation depth.",
          },
        ],
      }),
    ).toBe(false);
  });

  it("detects Clerk automation blocks separately from product failures", () => {
    expect(
      isAuthAutomationBlockMessage(
        "page.evaluate: e: You have been banned. If you think this was by mistake, please contact support.",
      ),
    ).toBe(true);
    expect(
      isAuthAutomationBlockMessage(
        "Signed-in browser did not land on /admin/candidate-preview.",
      ),
    ).toBe(false);
  });
});
