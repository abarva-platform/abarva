import {
  buildAwardReadinessGovernedAnswer,
  looksLikeAwardReadinessQuestion,
} from "@/lib/source/ava/award-readiness-governed-answer";
import { readNormalizedVendorResponsePackages } from "@/lib/source/vendor-response-persistence";

jest.mock("@/lib/source/vendor-response-persistence", () => ({
  readNormalizedVendorResponsePackages: jest.fn(),
}));

const mockReadPackages = jest.mocked(readNormalizedVendorResponsePackages);

describe("award-readiness intent", () => {
  it("matches held-award questions without capturing accepted-decision asks", () => {
    expect(
      looksLikeAwardReadinessQuestion(
        "Why is no vendor ready for award yet?",
      ),
    ).toBe(true);
    expect(
      looksLikeAwardReadinessQuestion(
        "Which suppliers are held by must-resolve conditions?",
      ),
    ).toBe(true);
    expect(
      looksLikeAwardReadinessQuestion("Why was Supplier Alpha selected?"),
    ).toBe(false);
  });
});

describe("buildAwardReadinessGovernedAnswer", () => {
  beforeEach(() => {
    mockReadPackages.mockReset();
  });

  it("names the real vendor and explains its must-resolve award hold", async () => {
    mockReadPackages.mockResolvedValue([
      {
        artifactId: "artifact-alpha",
        originalName: "supplier-alpha-response.xlsx",
        receivedAt: "2026-09-09T12:00:00.000Z",
        vendorId: "supplier-alpha",
        vendorName: "Supplier Alpha",
        rows: [
          {
            requirementId: "REQ-024",
            category: "staffing and location",
            section: "Staffing",
            requirement: "Provide role, shift, and location coverage.",
            requirementLevel: "Mandatory",
            responseType: "Staffing",
            evidenceRequired: true,
            responseDisposition: "Exception",
            responseNarrative:
              "Coverage is conditional pending a revised staffing exhibit.",
            evidenceRefs: ["Staffing schedule"],
            exceptionRef: "Exceptions / EXC-024",
          },
        ],
        analytics: {
          requirementCount: 1,
          requirementCoverageScore: 100,
          mandatoryCompletenessScore: 100,
          evidenceCoverageScore: 100,
          pricingTraceabilityScore: 0,
          slaTraceabilityScore: 0,
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

    const answer = await buildAwardReadinessGovernedAnswer({
      eventId: "event-1",
      eventName: "Managed Services Event",
      clientKey: "meridian",
      tenantId: "tenant-1",
      question: "Why is no vendor ready for award yet?",
    });

    expect(answer?.status).toBe("partial");
    expect(answer?.directAnswer).toContain(
      "No vendor is decision-ready for an unconditional award",
    );
    expect(answer?.artifacts[0]).toMatchObject({
      artifact: "table",
      id: "source-award-readiness-by-vendor",
      rows: [
        expect.objectContaining({
          vendor: "Supplier Alpha",
          awardReadiness: "Held",
          mustResolve: expect.any(Number),
        }),
      ],
    });
    expect(JSON.stringify(answer)).not.toContain("documented selection for");
  });

  it("fails closed when no normalized responses exist", async () => {
    mockReadPackages.mockResolvedValue([]);

    const answer = await buildAwardReadinessGovernedAnswer({
      eventId: "event-1",
      clientKey: "meridian",
      tenantId: "tenant-1",
      question: "Is any vendor ready for award?",
    });

    expect(answer?.status).toBe("no_data");
    expect(answer?.directAnswer).toContain(
      "no normalized vendor response packages",
    );
  });
});
