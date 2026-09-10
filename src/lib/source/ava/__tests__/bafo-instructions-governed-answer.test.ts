import {
  buildBafoInstructionsGovernedAnswer,
  looksLikeBafoInstructionsQuestion,
} from "@/lib/source/ava/bafo-instructions-governed-answer";
import { readNormalizedVendorResponsePackages } from "@/lib/source/vendor-response-persistence";

jest.mock("@/lib/source/vendor-response-persistence", () => ({
  readNormalizedVendorResponsePackages: jest.fn(),
}));

const mockReadPackages = jest.mocked(readNormalizedVendorResponsePackages);

describe("BAFO instruction intent", () => {
  it("matches cure and ask questions without capturing generic BAFO mentions", () => {
    expect(
      looksLikeBafoInstructionsQuestion(
        "What are the must-resolve BAFO asks for each vendor?",
      ),
    ).toBe(true);
    expect(
      looksLikeBafoInstructionsQuestion("When does BAFO start?"),
    ).toBe(false);
  });
});

describe("buildBafoInstructionsGovernedAnswer", () => {
  beforeEach(() => {
    mockReadPackages.mockReset();
  });

  it("derives vendor-specific asks from normalized response exceptions", async () => {
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

    const answer = await buildBafoInstructionsGovernedAnswer({
      eventId: "event-1",
      eventName: "Managed Services Event",
      clientKey: "meridian",
      tenantId: "tenant-1",
      question: "What are the must-resolve BAFO asks for each vendor?",
    });

    expect(answer?.status).toBe("answered");
    expect(answer?.directAnswer).toContain("vendor-specific asks");
    expect(answer?.directAnswer).toContain("must-resolve conditions");
    expect(answer?.artifacts[0]).toMatchObject({
      artifact: "table",
      id: "source-bafo-instructions-by-vendor",
      rows: [
        expect.objectContaining({
          vendor: "Supplier Alpha",
          asks: expect.any(Number),
          topAsks: expect.stringContaining("Required response:"),
        }),
      ],
    });
    expect(JSON.stringify(answer)).not.toContain("Vendor A");
  });

  it("fails closed when normalized challenges are absent", async () => {
    mockReadPackages.mockResolvedValue([]);

    const answer = await buildBafoInstructionsGovernedAnswer({
      eventId: "event-1",
      clientKey: "meridian",
      tenantId: "tenant-1",
      question: "Draft the BAFO asks.",
    });

    expect(answer?.status).toBe("no_data");
    expect(answer?.directAnswer).toContain(
      "does not yet have normalized response challenges",
    );
  });
});
