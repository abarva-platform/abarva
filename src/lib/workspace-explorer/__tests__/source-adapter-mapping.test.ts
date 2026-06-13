import {
  buildSourceWorkspaceItems,
  sourceRegistryArtifactToWorkspaceItem,
} from "../source-adapter-mapping";
import type { SourceArtifactRegistryRecord } from "@/lib/source/artifact-registry/types";
import type {
  SourceEventArtifactState,
  SourceEventEvidence,
  SourceEventGateCriterion,
} from "@/lib/source/canvas-substrate";

const baseRegistryArtifact: SourceArtifactRegistryRecord = {
  id: "artifact-1",
  tenantKey: "apexretail",
  sourceEventId: "event-1",
  sourceEventRowId: "event-row-1",
  stageKey: "responses",
  artifactFamily: "proposal",
  artifactKind: "vendor_response_pack",
  sourceOrigin: "uploaded",
  sourceFormat: "pdf",
  originalName: "Vendor A Response.pdf",
  blobUri: "source-artifacts/apex/event-1/artifact-1/vendor-a.pdf",
  uploaderUserId: "user-1",
  mimeType: "application/pdf",
  sizeBytes: 1000,
  sha256: "abc",
  parseStatus: "parsed",
  embeddingStatus: "embedded",
  graphStatus: "not_applicable",
  classificationStatus: "classified",
  dataClassification: "Confidential",
  evidenceState: "cited",
  approvalState: "not_required",
  version: 2,
  supersedesArtifactVersionId: null,
  createdBy: "user-1",
  validatedBy: null,
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-02T00:00:00.000Z",
  deletedAt: null,
};

const artifactState: SourceEventArtifactState = {
  id: "state-1",
  sourceEventId: "event-1",
  tenantKey: "apexretail",
  artifactCode: "d01_strategy_memo",
  stage: "strategy",
  family: "sourcing_strategy",
  tier: "rich",
  status: "drafting",
  requirementLevel: "required",
  gateDefining: true,
  linkedArtifactId: null,
  notes: null,
  body: null,
  bodyFormat: "markdown",
  bodyAuthoredBy: null,
  bodyUpdatedAt: null,
  bodyGenerationMetadata: null,
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-03T00:00:00.000Z",
};

const evidenceState: SourceEventEvidence = {
  id: "evidence-1",
  sourceEventId: "event-1",
  tenantKey: "apexretail",
  requirementId: "ticket_history",
  stage: "scope",
  currentState: "Usable Evidence",
  sourceArtifactId: "artifact-1",
  notes: "Ticket history parsed and ready.",
  lastSyncedAt: "2026-06-02T00:00:00.000Z",
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-02T00:00:00.000Z",
};

const gateCriterion: SourceEventGateCriterion = {
  id: "gate-1",
  sourceEventId: "event-1",
  tenantKey: "apexretail",
  criterionId: "scope_signed",
  fromStage: "scope",
  toStage: "rfp",
  state: "met",
  reviewerUserId: "user-2",
  reviewedAt: "2026-06-04T00:00:00.000Z",
  notes: "Sponsor signed scope.",
  evidenceArtifactIds: ["artifact-1"],
  waiverApprovalId: null,
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-04T00:00:00.000Z",
};

describe("SourceWorkspaceAdapter mapping", () => {
  it("maps vendor response uploads to tenant-scoped workspace items", () => {
    const item = sourceRegistryArtifactToWorkspaceItem(baseRegistryArtifact);

    expect(item).toMatchObject({
      id: "artifact-1",
      module: "source",
      kind: "vendor_response",
      origin: "uploaded",
      state: "usable",
      stageKey: "responses",
      classification: "Confidential",
      blobPath: "source-artifacts/apex/event-1/artifact-1/vendor-a.pdf",
    });
    expect(item.href).toBe("/api/v1/source/artifacts/artifact-1/download");
    expect(item.lineage.status).toBe("not_recorded");
  });

  it("combines registry, canvas artifacts, evidence, and approval records without duplicating linked artifacts", () => {
    const linkedArtifactState = {
      ...artifactState,
      id: "state-linked",
      linkedArtifactId: "artifact-1",
    };

    const items = buildSourceWorkspaceItems({
      registryArtifacts: [baseRegistryArtifact],
      artifactStates: [artifactState, linkedArtifactState],
      evidenceStates: [evidenceState],
      gateCriterionStates: [gateCriterion],
    });

    expect(items.map((item) => item.kind).sort()).toEqual([
      "approval",
      "deliverable",
      "evidence",
      "vendor_response",
    ]);
    expect(
      items.some((item) => item.id === "source-artifact-state:state-linked"),
    ).toBe(false);
    expect(
      items.find((item) => item.id === "source-gate:gate-1")?.lineage,
    ).toMatchObject({
      cites: ["artifact-1"],
      status: "recorded",
    });
  });
});
