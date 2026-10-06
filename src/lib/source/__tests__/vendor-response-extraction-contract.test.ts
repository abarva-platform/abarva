import type { SourceArtifactRegistryRecord } from "../artifact-registry/types";
import type { NormalizedVendorResponsePackage } from "../vendor-response-matrix";
import { extractAcceptedResponseQuestions } from "../vendor-response-extraction-contract";

const artifact = {
  id: "response-artifact-1",
  tenantKey: "example-client",
  sourceEventId: "event-1",
  stageKey: "responses",
  deletedAt: null,
} as SourceArtifactRegistryRecord;

const responsePackage = {
  artifactId: "response-artifact-1",
  vendorId: "supplier-1",
  reviewState: "accepted",
  authority: {
    acceptedArtifactOnly: true,
    source: "artifact_acceptance",
    acceptedAt: "2026-03-10T12:00:00Z",
    downstreamContextPolicy: "include",
  },
  rows: [
    {
      questionId: "question-1",
      requirementId: "REQ-1",
      responseNarrative: "A documented response.",
      pricingRef: "price-1",
      exceptionRef: "exception-1",
      evidenceRefs: ["evidence-1"],
      reviewState: "accepted",
      provenance: {
        artifactId: "response-artifact-1",
        artifactName: "response.xlsx",
        receivedAt: "2026-03-10T10:00:00Z",
        parser: "source_normalized_vendor_response_v1",
        factKey: "supplier-1::REQ-1",
      },
    },
  ],
} as NormalizedVendorResponsePackage;

const input = {
  eventId: "event-1",
  tenantKey: "example-client",
  supplierId: "supplier-1",
  roundId: "round-1",
  parserConfidence: 0.96,
  artifact,
  responsePackage,
};

describe("extractAcceptedResponseQuestions", () => {
  it("binds question-level facts to tenant, event, supplier, round, review and provenance", () => {
    const result = extractAcceptedResponseQuestions(input);
    expect(result).toMatchObject({
      state: "available",
      blockers: [],
      rows: [
        {
          tenantKey: "example-client",
          eventId: "event-1",
          supplierId: "supplier-1",
          roundId: "round-1",
          questionId: "question-1",
          answer: "A documented response.",
          pricingCell: "price-1",
          exception: "exception-1",
          evidenceReferences: ["evidence-1"],
          parserVersion: "source_normalized_vendor_response_v1",
          confidence: 0.96,
          reviewState: "accepted",
          downstreamEligible: true,
        },
      ],
    });
  });

  it("refuses an artifact from another tenant or event", () => {
    expect(
      extractAcceptedResponseQuestions({
        ...input,
        artifact: { ...artifact, sourceEventId: "event-2" },
      }),
    ).toMatchObject({ state: "blocked", rows: [] });
    expect(
      extractAcceptedResponseQuestions({
        ...input,
        artifact: { ...artifact, tenantKey: "other-client" },
      }),
    ).toMatchObject({ state: "blocked", rows: [] });
  });

  it("keeps unreviewed extraction out of every downstream decision", () => {
    const result = extractAcceptedResponseQuestions({
      ...input,
      responsePackage: {
        ...responsePackage,
        reviewState: undefined,
        authority: undefined,
      },
    });
    expect(result).toMatchObject({ state: "blocked", rows: [] });
  });

  it("shows parsed rows but refuses downstream use without round or confidence", () => {
    const result = extractAcceptedResponseQuestions({
      ...input,
      roundId: null,
      parserConfidence: null,
    });
    expect(result.state).toBe("review_required");
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({
      roundId: null,
      confidence: null,
      downstreamEligible: false,
    });
    expect(result.blockers).toEqual(
      expect.arrayContaining([
        "Response round is not recorded.",
        "Parser confidence is not recorded.",
      ]),
    );
  });

  it("never makes an unreviewed question scoring-eligible", () => {
    const result = extractAcceptedResponseQuestions({
      ...input,
      responsePackage: {
        ...responsePackage,
        rows: [{ ...responsePackage.rows[0], reviewState: undefined }],
      },
    });
    expect(result.state).toBe("review_required");
    expect(result.rows[0]).toMatchObject({
      reviewState: "unreviewed",
      downstreamEligible: false,
    });
  });

  it("holds every question when one question lacks provenance", () => {
    const result = extractAcceptedResponseQuestions({
      ...input,
      responsePackage: {
        ...responsePackage,
        rows: [
          responsePackage.rows[0],
          {
            ...responsePackage.rows[0],
            questionId: "question-2",
            requirementId: "REQ-2",
            provenance: undefined,
          },
        ],
      },
    });
    expect(result.state).toBe("review_required");
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].downstreamEligible).toBe(false);
  });
});
