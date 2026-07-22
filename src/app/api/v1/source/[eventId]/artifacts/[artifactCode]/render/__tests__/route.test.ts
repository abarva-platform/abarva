import type { SourceArtifactRecord } from "@/lib/source/file-cabinet/types";

const mockTenancy = {
  clientId: "client-1",
  clientKey: "skyharbor",
  userId: "user-1",
};
let mockArtifacts: SourceArtifactRecord[] = [];

const mockRenderSourceDeliverable = jest.fn(async () => ({
  buffer: Buffer.from("generated pdf"),
  contentType: "application/pdf",
  filename: "generated.pdf",
  format: "pdf",
}));

jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: jest.fn(async () => mockTenancy),
  tenancyErrorResponse: jest.fn(() =>
    Response.json({ error: "tenancy" }, { status: 401 }),
  ),
}));

jest.mock("@/lib/active-client", () => ({
  getActiveClientRow: jest.fn(async () => ({
    id: "client-1",
    key: "skyharbor",
  })),
}));

jest.mock("@/lib/auth/current-user", () => ({
  getCurrentUser: jest.fn(async () => ({ email: "reviewer@example.com" })),
}));

jest.mock("@/lib/auth/canonical-auth-roster", () => ({
  CANONICAL_CLIENT_ADMIN_EMAILS: [],
}));

jest.mock("@/lib/auth/source-access-policy", () => ({
  loadUserSourceAccessPolicy: jest.fn(async () => ({
    canUploadSourceArtifacts: true,
    canGenerateSourcingArtifacts: false,
  })),
}));

jest.mock("@/lib/source/agent-generation/server", () => ({
  buildSourceGenerationContext: jest.fn(async () => ({
    event: { id: "event-1", code: "SKYH-SKYHARBOR-AMS-OUTSOURCING-2026" },
  })),
}));

jest.mock("@/lib/source/exports/spec-builder", () => ({
  buildSourceDeliverableSpec: jest.fn(async () => ({
    eventCode: "SPEC-EVENT",
  })),
  canonicalArtifactCodeFor: jest.fn((artifactCode: string) => artifactCode),
  kindForArtifactCode: jest.fn(() => "rfp_pack"),
}));

jest.mock("@/lib/source/exports/metadata", () => ({
  eventCodeFromSpec: jest.fn(() => "SKYH-SKYHARBOR-AMS-OUTSOURCING-2026"),
}));

jest.mock("@/lib/source/exports/dispatch", () => ({
  renderSourceDeliverable: () => mockRenderSourceDeliverable(),
}));

jest.mock("@/lib/source/file-cabinet/repository", () => ({
  listSourceArtifacts: jest.fn(async () => mockArtifacts),
}));

jest.mock("@/lib/source/file-cabinet/blob-store", () => ({
  downloadArtifactBytes: jest.fn(async () => Buffer.from("client final docx")),
}));

import { GET } from "../route";

function req(url: string): import("next/server").NextRequest {
  return { url } as unknown as import("next/server").NextRequest;
}

function artifactFixture(
  overrides: Partial<SourceArtifactRecord> = {},
): SourceArtifactRecord {
  return {
    id: "artifact-1",
    clientId: "client-1",
    tenantKey: "skyharbor",
    sourceEventId: "event-1",
    sourcingStage: "rfp",
    artifactGroup: "upload",
    artifactType: "d09_rfp_pack",
    artifactFamily: "rfp",
    title: "Client Final RFP Pack",
    description: null,
    fileName: "Client Final RFP Pack.docx",
    fileFormat: "docx",
    blobContainer: "source-artifacts",
    blobPath: "skyharbor/event-1/client-final.docx",
    fileSize: 1234,
    version: 4,
    status: "client_final",
    generatedBy: null,
    generatedAt: "2026-07-03T00:00:00.000Z",
    sourceBasis: "client-final",
    confidence: "high",
    citationReady: true,
    evidenceFamiliesUsed: [],
    sourceRegisterId: null,
    contextBundleTraceId: null,
    approvalState: null,
    approvedBy: null,
    approvedAt: null,
    maestroOverrideId: null,
    missingInputs: [],
    clientCompleteItems: [],
    assumptions: [],
    supersedesArtifactId: "generated-draft",
    supersededByArtifactId: null,
    lifecycleState: "current",
    blobSha256: "sha256",
    isClientFinal: true,
    isCurrentAuthoritative: true,
    sourceGeneratedArtifactId: "generated-draft",
    clientFinalUploadedBy: "user-1",
    clientFinalUploadedAt: "2026-07-04T00:00:00.000Z",
    clientFinalAcceptedBy: "user-1",
    clientFinalAcceptedAt: "2026-07-04T01:00:00.000Z",
    clientFinalNote: "Accepted after client legal review.",
    clientFinalReviewMeetingDate: "2026-07-04",
    clientFinalStakeholderGroup: "Sourcing steering committee",
    clientFinalChangeSummary: {},
    createdAt: "2026-07-03T00:00:00.000Z",
    updatedAt: "2026-07-04T01:00:00.000Z",
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockArtifacts = [];
});

describe("GET /api/v1/source/[eventId]/artifacts/[artifactCode]/render", () => {
  it("returns an explicit client-final format mismatch instead of silently regenerating", async () => {
    mockArtifacts = [artifactFixture()];

    const res = await GET(
      req(
        "https://app.abarva.ai/api/v1/source/event-1/artifacts/d09_rfp_pack/render?format=pdf",
      ),
      {
        params: Promise.resolve({
          eventId: "event-1",
          artifactCode: "d09_rfp_pack",
        }),
      },
    );

    expect(res.status).toBe(409);
    expect(res.headers.get("x-source-artifact-authoritative")).toBe(
      "client-final-format-mismatch",
    );
    expect(res.headers.get("x-source-client-final-format")).toBe("docx");
    expect(res.headers.get("x-source-requested-artifact-format")).toBe("pdf");
    await expect(res.json()).resolves.toMatchObject({
      error: "client_final_format_mismatch",
      artifactId: "artifact-1",
      artifactCode: "d09_rfp_pack",
      availableFormat: "docx",
      requestedFormat: "pdf",
    });
    expect(mockRenderSourceDeliverable).not.toHaveBeenCalled();
  });

  it("labels generated fallback responses when no client-final artifact exists", async () => {
    mockArtifacts = [
      artifactFixture({
        id: "generated-draft",
        artifactGroup: "generated",
        fileName: "Generated RFP Pack.pdf",
        fileFormat: "pdf",
        status: "draft",
        isClientFinal: false,
        isCurrentAuthoritative: false,
      }),
    ];

    const res = await GET(
      req(
        "https://app.abarva.ai/api/v1/source/event-1/artifacts/d09_rfp_pack/render?format=pdf",
      ),
      {
        params: Promise.resolve({
          eventId: "event-1",
          artifactCode: "d09_rfp_pack",
        }),
      },
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("x-source-artifact-authoritative")).toBe(
      "generated-fallback",
    );
    expect(mockRenderSourceDeliverable).toHaveBeenCalledTimes(1);
  });
});
