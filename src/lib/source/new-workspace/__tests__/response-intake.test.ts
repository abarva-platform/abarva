import { buildSourceNewResponseIntake } from "../response-intake";
import type { SourceNewFileRow } from "@/components/source/new-workspace/SourceNewFiles";
import type { SourceArtifactRegistryRecord } from "@/lib/source/artifact-registry/types";
import type { NormalizedVendorResponsePackage } from "@/lib/source/vendor-response-matrix";
import type { SourceNewStage04VendorPanel } from "../stage04-vendor-panel";

const acceptedPanel: SourceNewStage04VendorPanel = {
  status: "available",
  blockers: [],
  asOf: "2026-03-10",
  suggestions: {
    status: "available",
    blockers: [],
    rows: [],
    excludedCount: 0,
  },
  counts: {
    eligible_candidate: 1,
    existing_contract_vendor: 0,
    selected_respondent: 0,
  },
  notRecorded: [],
  rows: [
    {
      authorityId: "authority-alpha",
      legalEntityId: "supplier-alpha",
      legalName: "Northstar Field Services",
      group: "eligible_candidate",
      acceptedByName: "Named Procurement Reviewer",
      acceptedAt: "2026-03-09T14:00:00Z",
      evidenceReference: "candidate-panel-v1",
    },
  ],
};

const artifact: SourceArtifactRegistryRecord = {
  id: "artifact-response-1",
  tenantKey: "example-client",
  sourceEventId: "event-1",
  sourceEventRowId: "row-1",
  stageKey: "responses",
  artifactFamily: "proposal",
  artifactKind: "vendor_response_workbook",
  sourceOrigin: "uploaded",
  sourceFormat: "xlsx",
  originalName: "northstar-response.xlsx",
  blobUri: "source/event-1/artifact-response-1/northstar-response.xlsx",
  uploaderUserId: "user-1",
  mimeType:
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  sizeBytes: 2048,
  sha256: "sha-response",
  parseStatus: "parsed",
  embeddingStatus: "pending",
  graphStatus: "pending",
  classificationStatus: "classified",
  dataClassification: "Internal",
  evidenceState: "parsed_uncited",
  approvalState: "draft",
  version: 1,
  supersedesArtifactVersionId: null,
  createdBy: "user-1",
  validatedBy: null,
  createdAt: "2026-03-10T10:00:00Z",
  updatedAt: "2026-03-10T10:00:00Z",
  deletedAt: null,
};

const fileRow: SourceNewFileRow = {
  id: "file-response-1",
  sourceRegisterId: "artifact-response-1",
  phase: "other",
  artifactGroup: "upload",
  artifactType: "vendor_response_workbook",
  artifactFamily: "proposal",
  description: "Candidate response workbook",
  title: "Northstar response workbook",
  fileName: "northstar-response.xlsx",
  fileFormat: "xlsx",
  fileSize: 2048,
  version: 1,
  status: "approved",
  lifecycleState: "current",
  generatedAt: "2026-03-10T10:00:00Z",
  generatedBy: "user-1",
  sourceBasis: "uploaded source document",
  confidence: null,
  citationReady: false,
  evidenceFamiliesUsed: ["proposal"],
  contextBundleTraceId: null,
  missingInputs: [],
  clientCompleteItems: [],
  assumptions: [],
  supersedesArtifactId: null,
  supersededByArtifactId: null,
  blobSha256: "sha-response",
  approvalState: "approved",
  approvedBy: "Named Evidence Reviewer",
  approvedAt: "2026-03-10T12:00:00Z",
  isClientFinal: false,
  isCurrentAuthoritative: false,
  sourceGeneratedArtifactId: null,
  clientFinalUploadedBy: null,
  clientFinalUploadedAt: null,
  clientFinalAcceptedBy: null,
  clientFinalAcceptedAt: null,
  clientFinalNote: null,
  clientFinalReviewMeetingDate: null,
  clientFinalStakeholderGroup: null,
  createdAt: "2026-03-10T10:00:00Z",
  updatedAt: "2026-03-10T12:00:00Z",
};

const normalizedPackage: NormalizedVendorResponsePackage = {
  artifactId: "artifact-response-1",
  vendorId: "supplier-alpha",
  vendorName: "Northstar Field Services",
  receivedAt: "2026-03-10T10:00:00Z",
  originalName: "northstar-response.xlsx",
  rows: Array.from({ length: 18 }, (_, index) => ({
    questionId: `q-${index}`,
    requirementId: `REQ-${index}`,
    category: "service scope",
    section: "Service model",
    requirement: "Describe service coverage.",
    requirementLevel: "Mandatory",
    responseType: "Narrative",
    evidenceRequired: false,
    evaluationCriterionId: null,
    responseDisposition: "Comply",
    responseNarrative: "Complies.",
    evidenceRefs: [],
    pricingRef: null,
    slaRef: null,
    exceptionRef: null,
    vendorOwner: null,
    responseCategory: "comply",
    reviewState: "accepted",
    provenance: {
      artifactId: "artifact-response-1",
      artifactName: "northstar-response.xlsx",
      receivedAt: "2026-03-10T10:00:00Z",
      parser: "source_normalized_vendor_response_v1",
      factKey: `fact-${index}`,
    },
  })),
  analytics: {
    requirementCount: 18,
    requirementCoverageScore: 1,
    mandatoryCompletenessScore: 1,
    evidenceCoverageScore: 0,
    pricingTraceabilityScore: 0,
    slaTraceabilityScore: 0,
    exceptionDisclosureScore: 1,
    criterionLinkageScore: 0,
    readyForEvaluation: "conditional",
    nonConformances: [],
    clarificationQuestions: [],
  },
  parserWarnings: [],
  syntheticDemo: true,
  reviewState: "accepted",
  authority: {
    acceptedArtifactOnly: true,
    source: "artifact_acceptance",
    acceptedAt: "2026-03-10T12:00:00Z",
    downstreamContextPolicy: "include",
  },
};

describe("buildSourceNewResponseIntake", () => {
  it("keeps upload, parse and availability-only review as separate states", () => {
    const intake = buildSourceNewResponseIntake({
      eventId: "event-1",
      asOf: "2026-03-10",
      uploadActionHref: "/api/v1/source/event-1/artifacts/upload",
      vendorPanel: acceptedPanel,
      files: [fileRow],
      responseArtifacts: [artifact],
      normalizedPackages: [normalizedPackage],
    });

    expect(intake.status).toBe("available");
    expect(intake.blockers).toEqual([]);
    expect(intake.rows).toEqual([
      expect.objectContaining({
        legalName: "Northstar Field Services",
        uploadState: "uploaded",
        parseState: "parsed",
        availabilityReviewState: "available",
        parsedRequirementCount: 18,
      }),
    ]);
    expect(intake.nextAction.label).toBe(
      "Review normalized response availability",
    );
  });

  it("fails closed when the artifact readback is unavailable", () => {
    const intake = buildSourceNewResponseIntake({
      eventId: "event-1",
      asOf: "2026-03-10",
      uploadActionHref: "/api/v1/source/event-1/artifacts/upload",
      vendorPanel: acceptedPanel,
      files: [],
      responseArtifacts: null,
      normalizedPackages: [],
    });

    expect(intake.status).toBe("blocked");
    expect(intake.blockers).toContain(
      "The response artifact registry could not be read.",
    );
    expect(intake.rows).toEqual([]);
  });

  it("does not treat an uploaded parsed workbook as availability-reviewed", () => {
    const intake = buildSourceNewResponseIntake({
      eventId: "event-1",
      asOf: "2026-03-10",
      uploadActionHref: "/api/v1/source/event-1/artifacts/upload",
      vendorPanel: acceptedPanel,
      files: [{ ...fileRow, approvalState: "approved", approvedBy: null }],
      responseArtifacts: [artifact],
      normalizedPackages: [normalizedPackage],
    });

    expect(intake.rows[0]).toMatchObject({
      uploadState: "uploaded",
      parseState: "parsed",
      availabilityReviewState: "not_reviewed",
    });
    expect(intake.blockers).toContain(
      "At least one parsed workbook still needs availability-only review.",
    );
    expect(intake.nextAction.label).toBe("Record availability-only review");
  });
});
