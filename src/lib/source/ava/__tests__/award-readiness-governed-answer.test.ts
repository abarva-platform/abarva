import {
  buildAwardReadinessGovernedAnswer,
  looksLikeAwardReadinessQuestion,
  governedCandidateFromPackage,
} from "@/lib/source/ava/award-readiness-governed-answer";
import { readNormalizedVendorResponsePackages } from "@/lib/source/vendor-response-persistence";
import type { NormalizedVendorResponsePackage } from "@/lib/source/vendor-response-matrix";

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
    expect(
      looksLikeAwardReadinessQuestion(
        "What selection decision was recorded, and what conditions remain?",
      ),
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

function pkg(
  overrides: Partial<NormalizedVendorResponsePackage> = {},
): NormalizedVendorResponsePackage {
  return {
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
    ...overrides,
  };
}

const scope = { clientKey: "meridian-health", tenantId: "tenant-1" };

describe("governedCandidateFromPackage confidence — award readiness", () => {
  it("is high only when a human accepted the package", () => {
    expect(
      governedCandidateFromPackage(
        pkg({
          authority: {
            acceptedArtifactOnly: true,
            source: "artifact_acceptance",
            acceptedAt: "2026-09-10T00:00:00.000Z",
            downstreamContextPolicy: "include",
          },
        }),
        scope,
      ).confidence_level,
    ).toBe("high");

    expect(
      governedCandidateFromPackage(pkg({ reviewState: "accepted" }), scope)
        .confidence_level,
    ).toBe("high");
  });

  it("comes back BELOW high for an unaccepted package — the case the literal could never produce", () => {
    // Read cleanly, cites its source, but nobody has accepted it.
    expect(
      governedCandidateFromPackage(pkg(), scope).confidence_level,
    ).toBe("medium");

    // Neither read cleanly nor citing anything.
    expect(
      governedCandidateFromPackage(
        pkg({
          parserWarnings: ["sheet 2 unreadable"],
          rows: [
            {
              requirementId: "REQ-001",
              category: "staffing and location",
              section: "Staffing",
              requirement: "Provide coverage.",
              requirementLevel: "Mandatory",
              responseType: "Staffing",
              evidenceRequired: true,
            },
          ],
        }),
        scope,
      ).confidence_level,
    ).toBe("low");
  });


  it("reaches medium by EITHER rung on its own — so neither is a redundant guard", () => {
    // Parsed cleanly, cites nothing.
    expect(
      governedCandidateFromPackage(
        pkg({
          rows: [
            {
              requirementId: "REQ-001",
              category: "staffing and location",
              section: "Staffing",
              requirement: "Provide coverage.",
              requirementLevel: "Mandatory",
              responseType: "Staffing",
              evidenceRequired: true,
            },
          ],
        }),
        scope,
      ).confidence_level,
    ).toBe("medium");

    // Cites its source, did not parse cleanly.
    expect(
      governedCandidateFromPackage(
        pkg({ parserWarnings: ["sheet 2 unreadable"] }),
        scope,
      ).confidence_level,
    ).toBe("medium");
  });

  it("keeps the always-honest governed fields unchanged by the derivation", () => {
    const candidate = governedCandidateFromPackage(
      pkg({ reviewState: "accepted" }),
      scope,
    );
    expect(candidate.id).toBe("artifact-alpha");
    expect(candidate.client_key).toBe("meridian-health");
    expect(candidate.tenant_id).toBe("tenant-1");
    expect(candidate.source_layer).toBe("vendor");
    expect(candidate.source_basis).toBe("supplier-alpha-response.xlsx");
    expect(candidate.classification).toBe("confidential");
    expect(candidate.retrievability).toBe("not_indexed");
    expect(candidate.agent_readiness_status).toBe("not_reviewed");
    expect(candidate.cited_render_verified_at).toBeNull();
  });
});
