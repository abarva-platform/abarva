import {
  buildPricingComparisonGovernedAnswer,
  looksLikePricingComparisonQuestion,
} from "@/lib/source/ava/pricing-comparison-governed-answer";
import { readNormalizedVendorResponsePackages } from "@/lib/source/vendor-response-persistence";

jest.mock("@/lib/source/vendor-response-persistence", () => ({
  readNormalizedVendorResponsePackages: jest.fn(),
}));

const mockReadPackages = jest.mocked(readNormalizedVendorResponsePackages);

describe("pricing comparison intent", () => {
  it("matches vendor price comparisons without capturing value-ledger questions", () => {
    expect(
      looksLikePricingComparisonQuestion(
        "Compare the four vendors' prices and tell me the savings.",
      ),
    ).toBe(true);
    expect(looksLikePricingComparisonQuestion("Show the value waterfall.")).toBe(
      false,
    );
    expect(
      looksLikePricingComparisonQuestion("Why was Supplier Alpha selected?"),
    ).toBe(false);
  });
});

describe("buildPricingComparisonGovernedAnswer", () => {
  beforeEach(() => {
    mockReadPackages.mockReset();
  });

  it("refuses price ranking when packages cite pricing but accepted amounts are absent", async () => {
    mockReadPackages.mockResolvedValue([
      {
        artifactId: "artifact-alpha",
        originalName: "supplier-alpha-response.xlsx",
        receivedAt: "2026-09-09T12:00:00.000Z",
        vendorId: "supplier-alpha",
        vendorName: "Supplier Alpha",
        rows: [
          {
            requirementId: "REQ-081",
            category: "commercial and pricing",
            section: "Commercial",
            requirement: "Submit normalized pricing.",
            requirementLevel: "Mandatory",
            responseType: "Pricing",
            evidenceRequired: true,
            responseDisposition: "Comply",
            responseNarrative: "Pricing is supplied in the cited exhibit.",
            evidenceRefs: ["Pricing workbook"],
            pricingRef: "Pricing Response / REQ-081",
          },
        ],
        analytics: {
          requirementCount: 1,
          requirementCoverageScore: 100,
          mandatoryCompletenessScore: 100,
          evidenceCoverageScore: 100,
          pricingTraceabilityScore: 100,
          slaTraceabilityScore: 100,
          exceptionDisclosureScore: 100,
          criterionLinkageScore: 100,
          readyForEvaluation: "conditional",
          nonConformances: [],
          clarificationQuestions: [],
        },
        parserWarnings: [],
        syntheticDemo: true,
      },
    ]);

    const answer = await buildPricingComparisonGovernedAnswer({
      eventId: "event-1",
      eventName: "Managed Services Event",
      clientKey: "meridian",
      tenantId: "tenant-1",
      question: "Compare the vendors' prices and tell me the savings.",
    });

    expect(answer).not.toBeNull();
    expect(answer?.status).toBe("partial");
    expect(answer?.directAnswer).toContain("cannot compare vendor prices");
    expect(answer?.directAnswer).toContain("0/1 expose accepted numeric");
    expect(answer?.directAnswer).not.toContain("value ledger");
    expect(answer?.artifacts[0]).toMatchObject({
      artifact: "table",
      id: "source-vendor-pricing-comparability",
      rows: [
        expect.objectContaining({
          vendor: "Supplier Alpha",
          pricingRows: 1,
          pricingRefs: 1,
          numericBasis: "Not established",
        }),
      ],
    });
    expect(answer?.gaps[0]?.label).toBe(
      "Accepted numeric pricing basis missing",
    );
    expect(mockReadPackages).toHaveBeenCalledWith({
      eventId: "event-1",
      tenantKey: "meridian",
    });
  });

  it("fails closed when no normalized response package exists", async () => {
    mockReadPackages.mockResolvedValue([]);

    const answer = await buildPricingComparisonGovernedAnswer({
      eventId: "event-1",
      clientKey: "meridian",
      tenantId: "tenant-1",
      question: "Compare vendor prices.",
    });

    expect(answer?.status).toBe("no_data");
    expect(answer?.directAnswer).toContain(
      "no normalized vendor response packages",
    );
  });
});
