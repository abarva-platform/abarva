import { evaluateOfacScreening } from "../ofac-screening";

describe("OFAC screening evaluator", () => {
  it("allows onboarding when no watchlist hits are returned", () => {
    const decision = evaluateOfacScreening({
      subject: {
        customerName: "Example Customer Inc.",
        aliases: ["Example Customer"],
        country: "US",
      },
      hits: [],
      screenedAt: "2026-06-03T12:00:00.000Z",
      screenedBy: "manual",
    });

    expect(decision).toMatchObject({
      status: "clear",
      canProceed: true,
      requiresManualReview: false,
      highestScore: 0,
    });
    expect(decision.evidenceRequired).toContain("watchlist_source_version");
  });

  it("blocks high-confidence OFAC matches until compliance clears", () => {
    const decision = evaluateOfacScreening({
      subject: {
        customerName: "Blocked Customer LLC",
        aliases: [],
        country: null,
      },
      hits: [
        {
          listName: "OFAC SDN",
          matchedName: "Blocked Customer",
          score: 0.97,
          program: "SDGT",
          sourceUrl: "https://sanctionssearch.ofac.treas.gov/",
        },
      ],
      screenedAt: "2026-06-03T12:00:00.000Z",
      screenedBy: "api",
    });

    expect(decision).toMatchObject({
      status: "blocked",
      canProceed: false,
      requiresManualReview: true,
      highestScore: 0.97,
    });
    expect(decision.reason).toMatch(/do not proceed/);
    expect(decision.evidenceRequired).toContain("compliance_clearance");
  });

  it("requires manual review for possible matches", () => {
    const decision = evaluateOfacScreening({
      subject: {
        customerName: "Similar Name Holdings",
        aliases: ["Similar Name"],
        country: "GB",
      },
      hits: [
        {
          listName: "OFAC Non-SDN",
          matchedName: "Similar Name",
          score: 0.86,
          program: null,
          sourceUrl: "https://sanctionssearch.ofac.treas.gov/",
        },
      ],
      screenedAt: "2026-06-03T12:00:00.000Z",
      screenedBy: "batch",
    });

    expect(decision.status).toBe("possible_match");
    expect(decision.canProceed).toBe(false);
    expect(decision.evidenceRequired).toContain("manual_review_disposition");
  });

  it("fails closed on low-confidence hits until a reviewer records disposition", () => {
    const decision = evaluateOfacScreening({
      subject: {
        customerName: "Ambiguous Customer",
        aliases: [],
        country: "US",
      },
      hits: [
        {
          listName: "Other sanctions list",
          matchedName: "Ambiguous",
          score: 0.4,
          program: null,
          sourceUrl: "https://example.com/sanctions",
        },
      ],
      screenedAt: "2026-06-03T12:00:00.000Z",
      screenedBy: "manual",
    });

    expect(decision.status).toBe("manual_review_required");
    expect(decision.canProceed).toBe(false);
    expect(decision.reason).toMatch(/record manual review/);
  });
});
