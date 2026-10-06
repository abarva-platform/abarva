import { retrieveSurfaceContextSources } from "../retrievers/surface-context";

const QUERY = "What is the current state of our estate?";

function facts(prefix: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => `${prefix} fact ${i + 1}`);
}

describe("tenant substrate domain budgets", () => {
  it("no longer starves late buckets behind a single flat cap", () => {
    // Before: all buckets were merged and cut at 34, so a large tenantFacts
    // list consumed the whole budget and every later domain vanished.
    const sources = retrieveSurfaceContextSources(
      {
        activeTab: "intelligence",
        activeClient: "Demo Client",
        clientKey: "demo",
        tenantFacts: facts("Enterprise", 40),
        strategyFacts: facts("Strategy", 5),
        vendorFacts: facts("Vendor", 5),
        useCaseFacts: facts("UseCase", 5),
        riskFacts: facts("Risk", 5),
        qualityFacts: facts("Quality", 5),
        sourceFacts: facts("Source", 5),
      },
      QUERY,
    );

    const tenant = sources.find((source) => source.type === "TENANT");
    expect(tenant).toBeDefined();
    for (const prefix of [
      "Strategy",
      "Vendor",
      "UseCase",
      "Risk",
      "Quality",
      "Source",
    ]) {
      expect(tenant!.detail).toContain(`${prefix} fact 1`);
    }
  });

  it("labels each domain so the model can tell them apart", () => {
    const sources = retrieveSurfaceContextSources(
      {
        activeTab: "intelligence",
        activeClient: "Demo Client",
        clientKey: "demo",
        tenantFacts: ["Enterprise fact 1"],
        vendorFacts: ["Vendor fact 1"],
        riskFacts: ["Risk fact 1"],
      },
      QUERY,
    );
    const detail = sources.find((s) => s.type === "TENANT")!.detail;
    expect(detail).toContain("Enterprise and operating context:");
    expect(detail).toContain("Vendors, contracts and spend:");
    expect(detail).toContain("Risk, controls and reliability:");
    // Empty domains must not emit a bare heading.
    expect(detail).not.toContain("Evidence sources:");
  });

  it("caps each domain independently", () => {
    const sources = retrieveSurfaceContextSources(
      {
        activeTab: "intelligence",
        activeClient: "Demo Client",
        tenantFacts: facts("Enterprise", 40),
      },
      QUERY,
    );
    const detail = sources.find((s) => s.type === "TENANT")!.detail;
    expect(detail).toContain("Enterprise fact 14");
    expect(detail).not.toContain("Enterprise fact 15");
  });

  it("dedupes a fact carried in two buckets", () => {
    const sources = retrieveSurfaceContextSources(
      {
        activeTab: "intelligence",
        activeClient: "Demo Client",
        tenantFacts: ["Shared fact"],
        vendorFacts: ["Shared fact"],
      },
      QUERY,
    );
    const detail = sources.find((s) => s.type === "TENANT")!.detail;
    expect(detail.split("Shared fact").length - 1).toBe(1);
  });

  it("keeps the SURFACE/TENANT/GRAPH source contract intact", () => {
    const sources = retrieveSurfaceContextSources(
      {
        activeTab: "intelligence",
        activeClient: "Demo Client",
        stageFacts: ["Stage fact"],
        tenantFacts: ["Enterprise fact"],
        graphFacts: ["Graph edge"],
      },
      QUERY,
    );
    expect(sources.map((s) => s.type)).toEqual(["SURFACE", "TENANT", "GRAPH"]);
  });

  it("promotes Source 360 claim guardrails as first-class aVa evidence", () => {
    const sources = retrieveSurfaceContextSources(
      {
        module: "Source",
        activeTab: "Portfolio / Verdict",
        activeClient: "Demo Client",
        clientKey: "demo",
        pageFacts: ["Portfolio totals: 230 contracts, 102 vendors."],
        groundingStatus: {
          contractRows: 230,
          vendorRows: 102,
          performanceRows: 36,
          actionCandidates: 47,
          claimCards: 7,
          avaGroundingBundles: 11,
          availableLenses: ["contract_360", "vendor_360", "optimize"],
        },
        claimContract: {
          posture:
            "Answer only from the current Source 360 page context and governed read-model facts.",
          allowedClaims: ["Portfolio and action-candidate facts in Source 360."],
          forbiddenClaims: [
            "Do not claim realized savings unless finance confirmation is explicitly loaded.",
          ],
          requiredEvidenceForClaims: [
            "Savings or ROI: finance confirmation state plus calculation run and evidence rows.",
          ],
          refusalTriggers: [
            "Finance-confirmed value requested when only candidate rows exist.",
          ],
          responseShape: ["Name the Source basis before the answer leaves the page."],
        },
        capabilities: {
          source360: {
            canAnswer: ["Which action candidates are present?"],
            cannotAnswerWithoutMoreEvidence: [
              "Final supplier recommendation for an event not represented in the current read model.",
            ],
          },
          optimize: {
            candidateRows: 47,
            claimCards: 7,
            financeConfirmedRows: 0,
            rule:
              "Optimize can prepare governed actions but must not call them realized value.",
          },
          newEvent: {
            rule:
              "New Event questions require selected event scoring, pricing, trap-log, BAFO, and approval context.",
          },
        },
        refusalExamples: [
          {
            userIntent: "total savings",
            answerDiscipline:
              "Report candidate amounts and refuse realized savings unless confirmed.",
          },
        ],
      },
      "What can aVa say about total savings and which vendor should we pick?",
    );

    const claimSource = sources.find(
      (source) => source.id === "source-ava-claim-contract",
    );
    expect(claimSource).toMatchObject({
      type: "SURFACE",
      name: "Demo Client Source aVa claim contract",
      confidence: 0.99,
    });
    expect(claimSource!.detail).toContain("230 contract rows");
    expect(claimSource!.detail).toContain("102 vendor rows");
    expect(claimSource!.detail).toContain("47 action candidates");
    expect(claimSource!.detail).toContain("Do not claim realized savings");
    expect(claimSource!.detail).toContain("Savings or ROI");
    expect(claimSource!.detail).toContain("New Event boundary");
    expect(claimSource!.detail).toContain("total savings");
  });
});
