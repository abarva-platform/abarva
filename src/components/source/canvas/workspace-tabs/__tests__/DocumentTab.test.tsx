/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { DocumentTab } from "../DocumentTab";
import type { SourceArtifactRegistryRecord } from "@/lib/source/artifact-registry/types";
import type { SourceEventArtifactState } from "@/lib/source/canvas-substrate/types";

jest.mock("../UploadEventDocumentButton", () => ({
  UploadEventDocumentButton: () => (
    <button type="button">Upload document</button>
  ),
}));
jest.mock("../VendorPricingSubmissionsPanel", () => ({
  VendorPricingSubmissionsPanel: () => null,
}));
jest.mock("../VendorResponsePackPanel", () => ({
  VendorResponsePackPanel: () => null,
}));
jest.mock("../AcceptClientFinalButton", () => ({
  AcceptClientFinalButton: () => (
    <button type="button">Accept Client Final</button>
  ),
}));

const baseArtifact: SourceEventArtifactState = {
  id: "state-1",
  sourceEventId: "event-1",
  tenantKey: "skyharbor-air",
  artifactCode: "d01_strategy_memo",
  stage: "strategy",
  family: "sourcing_strategy",
  tier: "outline",
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
  createdAt: "2026-06-12T00:00:00.000Z",
  updatedAt: "2026-06-12T00:00:00.000Z",
};

const registryDoc: SourceArtifactRegistryRecord = {
  id: "doc-1",
  tenantKey: "skyharbor-air",
  sourceEventId: "event-1",
  sourceEventRowId: "event-1",
  stageKey: "strategy",
  artifactFamily: "scope_document",
  artifactKind: "evidence_room::01_Application_Portfolio.csv",
  sourceOrigin: "uploaded",
  sourceFormat: "csv",
  originalName: "01_Application_Portfolio.csv",
  blobUri: "skyharbor-air/event-1/doc-1/01_Application_Portfolio.csv",
  uploaderUserId: "user-1",
  mimeType: "text/csv",
  sizeBytes: 2048,
  sha256: "abc123",
  parseStatus: "parsed",
  embeddingStatus: "embedded",
  graphStatus: "projected",
  classificationStatus: "classified",
  dataClassification: "Internal",
  evidenceState: "cited",
  approvalState: "draft",
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
  clientFinalChangeSummary: {},
  version: 1,
  supersedesArtifactVersionId: null,
  createdBy: "user-1",
  validatedBy: null,
  createdAt: "2026-06-12T00:00:00.000Z",
  updatedAt: "2026-06-12T00:00:00.000Z",
  deletedAt: null,
};

describe("DocumentTab event documents", () => {
  it("renders explicit open and download actions for registry documents", () => {
    render(
      <DocumentTab
        eventId="event-1"
        stage="strategy"
        artifacts={[baseArtifact]}
        registryArtifacts={[registryDoc]}
        templateByCode={{ d01_strategy_memo: "# Strategy memo" }}
      />,
    );

    expect(screen.getByText("1 document available")).toBeInTheDocument();
    expect(screen.getByText("01_Application_Portfolio.csv")).toHaveAttribute(
      "href",
      "/source/events/event-1/artifacts/doc-1",
    );
    expect(screen.getByText("Open detail")).toHaveAttribute(
      "href",
      "/source/events/event-1/artifacts/doc-1",
    );
    expect(screen.getByText("Download file")).toHaveAttribute(
      "href",
      "/api/v1/source/artifacts/doc-1/download",
    );
  });

  it("shows the artifact-level client-final accept action", () => {
    render(
      <DocumentTab
        eventId="event-1"
        stage="strategy"
        artifacts={[baseArtifact]}
        registryArtifacts={[registryDoc]}
        templateByCode={{ d01_strategy_memo: "# Strategy memo" }}
      />,
    );

    expect(screen.getByText("Accept Client Final")).toBeInTheDocument();
  });

  it("shows client-final authoritative status from artifact metadata and shelf rows", () => {
    render(
      <DocumentTab
        eventId="event-1"
        stage="strategy"
        artifacts={[
          {
            ...baseArtifact,
            body: "# Strategy memo",
            bodyGenerationMetadata: {
              clientFinal: {
                fileName: "Strategy Memo - Client Final.docx",
                acceptedAt: "2026-07-03T12:00:00.000Z",
                note: "Approved by steering committee.",
              },
            },
          },
        ]}
        registryArtifacts={[
          {
            ...registryDoc,
            isClientFinal: true,
            isCurrentAuthoritative: true,
            originalName: "Strategy Memo - Client Final.docx",
          },
        ]}
        templateByCode={{ d01_strategy_memo: "# Strategy memo" }}
      />,
    );

    expect(
      screen.getByText(
        "Client Final accepted — this version is authoritative.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Client Final")).toBeInTheDocument();
    expect(screen.getAllByText(/authoritative/).length).toBeGreaterThanOrEqual(
      2,
    );
  });

  it("shows a compact unverified marker when required sections are missing", () => {
    render(
      <DocumentTab
        eventId="event-1"
        stage="strategy"
        artifacts={[
          {
            ...baseArtifact,
            body: "# Strategy memo",
            bodyGenerationMetadata: {
              model: "claude-sonnet-4-6",
              promptTemplateId: "d01_strategy_memo",
              promptTemplateVersion: 1,
              upstreamBoundCodes: [],
              generatedAt: "2026-06-16T00:00:00.000Z",
              generatedByUserId: "user-1",
              tokensIn: 100,
              tokensOut: 200,
              stopReason: "end_turn",
              sectionVerification: {
                status: "incomplete",
                checkedAt: "2026-06-16T00:00:00.000Z",
                requiredSections: ["Executive summary", "Why now"],
                missingSections: ["Executive summary"],
              },
            },
          },
        ]}
        templateByCode={{ d01_strategy_memo: "# Strategy memo" }}
      />,
    );

    expect(screen.getByText("Unverified · 1 section missing")).toHaveAttribute(
      "title",
      "Missing: Executive summary",
    );
  });

  it("shows a quiet verified marker when required sections pass", () => {
    render(
      <DocumentTab
        eventId="event-1"
        stage="strategy"
        artifacts={[
          {
            ...baseArtifact,
            body: "# Strategy memo",
            bodyGenerationMetadata: {
              model: "claude-sonnet-4-6",
              promptTemplateId: "d01_strategy_memo",
              promptTemplateVersion: 1,
              upstreamBoundCodes: [],
              generatedAt: "2026-06-16T00:00:00.000Z",
              generatedByUserId: "user-1",
              tokensIn: 100,
              tokensOut: 200,
              stopReason: "end_turn",
              sectionVerification: {
                status: "verified",
                checkedAt: "2026-06-16T00:00:00.000Z",
                requiredSections: ["Executive summary", "Why now"],
                missingSections: [],
              },
            },
          },
        ]}
        templateByCode={{ d01_strategy_memo: "# Strategy memo" }}
      />,
    );

    expect(screen.getByText("Verified")).toHaveAttribute(
      "title",
      "Required sections present: Executive summary, Why now",
    );
  });
});
