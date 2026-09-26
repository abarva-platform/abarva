/**
 * @jest-environment node
 */

const requireTenancyMock = jest.fn();
const tenancyErrorResponseMock = jest.fn((err: unknown) => {
  const code =
    err && typeof err === "object" && "code" in err
      ? (err as { code: string }).code
      : "unknown";
  return Response.json({ error: code }, { status: code === "unauthenticated" ? 401 : 403 });
});

jest.mock("@/app/api/v1/programs/_auth", () => ({
  requireTenancy: () => requireTenancyMock(),
  tenancyErrorResponse: (err: unknown) => tenancyErrorResponseMock(err),
}));

const getProgramByIdMock = jest.fn();
jest.mock("@/lib/programs/queries", () => ({
  getProgramById: (...args: unknown[]) => getProgramByIdMock(...args),
}));

const getActiveClientRowMock = jest.fn();
jest.mock("@/lib/active-client", () => ({
  getActiveClientRow: () => getActiveClientRowMock(),
}));

jest.mock("@/lib/agent/tools/intelligence/_shared", () => ({
  clientKeyToBrokerTenantKey: (key: string) => `tenant:${key}`,
}));

const recordAttachmentUploadMock = jest.fn();
const buildStoragePathMock = jest.fn(
  ({
    tenantKey,
    programId,
    attachmentId,
    filename,
  }: {
    tenantKey: string;
    programId: string;
    attachmentId: string;
    filename: string;
  }) => `${tenantKey}/${programId}/${attachmentId}/${filename}`,
);
jest.mock("@/lib/programs/attachments", () => ({
  recordAttachmentUpload: (input: Record<string, unknown>) =>
    recordAttachmentUploadMock(input),
  buildStoragePath: (args: {
    tenantKey: string;
    programId: string;
    attachmentId: string;
    filename: string;
  }) => buildStoragePathMock(args),
}));

const storageUploadMock = jest.fn<
  Promise<void>,
  [unknown, unknown, unknown, unknown]
>(async () => undefined);
const storageRemoveMock = jest.fn<Promise<void>, [unknown, unknown]>(
  async () => undefined,
);
jest.mock("@/lib/data-plane/objectStorage", () => ({
  getObjectStorageAdapter: () => ({
    upload: (bucket: unknown, path: unknown, body: unknown, opts: unknown) =>
      storageUploadMock(bucket, path, body, opts),
    remove: (bucket: unknown, paths: unknown) =>
      storageRemoveMock(bucket, paths),
  }),
}));

const ingestUploadedMoveEvidenceMock = jest.fn();
jest.mock("@/lib/programs/current-state-doc-ingest", () => ({
  ingestUploadedMoveEvidence: (ctx: unknown, args: unknown) =>
    ingestUploadedMoveEvidenceMock(ctx, args),
}));

const loadDiscoveryEvidenceReadinessMock = jest.fn();
jest.mock("@/lib/programs/discovery/evidence-readiness", () => ({
  loadDiscoveryEvidenceReadiness: (ctx: unknown, moveId: unknown) =>
    loadDiscoveryEvidenceReadinessMock(ctx, moveId),
}));

const extractAndChunkMock = jest.fn<Promise<void>, [unknown]>(
  async () => undefined,
);
jest.mock("@/lib/programs/doc-parser", () => ({
  extractAndChunk: (args: unknown) => extractAndChunkMock(args),
}));

import { POST } from "@/app/api/programs/workspace/[moveId]/upload/route";

const MOVE_ID = "move-1";
const MOVE_PARAMS = { params: Promise.resolve({ moveId: MOVE_ID }) };
const PPTX_MIME =
  "application/vnd.openxmlformats-officedocument.presentationml.presentation";

function makeMultipartRequest(
  filename: string,
  mime: string,
  content: string,
  fields: Record<string, string> = {},
): Request {
  const fd = new FormData();
  fd.append("file", new File([content], filename, { type: mime }));
  for (const [key, value] of Object.entries(fields)) fd.append(key, value);
  return new Request(`http://localhost/api/programs/workspace/${MOVE_ID}/upload`, {
    method: "POST",
    body: fd,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  requireTenancyMock.mockResolvedValue({
    clientId: "client-1",
    clientKey: "skyharbor",
    userId: "user-1",
    role: "admin",
  });
  getProgramByIdMock.mockResolvedValue({
    id: MOVE_ID,
    archetype: "operating_move",
    currentPhase: 3,
    archivedAt: null,
    deletedAt: null,
  });
  getActiveClientRowMock.mockResolvedValue({
    id: "client-1",
    key: "skyharbor",
    name: "Cover Tenant",
  });
  recordAttachmentUploadMock.mockImplementation(
    async (input: Record<string, unknown>) => ({
      id: "attachment-1",
      tenantKey: input.tenantKey,
      programId: input.programId,
      phase: input.phase ?? null,
      originalName: input.originalName,
      mimeType: input.mimeType,
      scanStatus: input.scanStatus ?? "pending",
      scanFindings: input.scanFindings ?? null,
      storagePath: input.storagePath,
      sha256: input.sha256,
      createdAt: "2026-09-24T00:00:00Z",
    }),
  );
  ingestUploadedMoveEvidenceMock.mockResolvedValue({
    evidenceId: "evidence-1",
    evidenceType: "workshop_output",
    parseMethod: "pptx-jszip",
    warnings: ["speaker notes omitted"],
    whatFound: ["phase workshop decisions", "risk register"],
    whereUsed: ["P3 approach gate", "P4 build plan"],
    reviewId: "review-1",
    reviewState: "pending_review",
    quarantined: false,
    discoveryReceipt: {
      ok: true,
      applied: true,
      fieldsUpdated: ["scope_boundary"],
    },
  });
  loadDiscoveryEvidenceReadinessMock.mockResolvedValue({
    moveId: MOVE_ID,
    ready: false,
    acceptedEvidenceCount: 1,
    pendingEvidenceCount: 1,
  });
});

describe("POST /api/programs/workspace/[moveId]/upload", () => {
  it("captures PPTX uploads through the governed evidence pipeline and marks scan state consistently", async () => {
    const req = makeMultipartRequest(
      "p3-workshop-readout.pptx",
      PPTX_MIME,
      "Decision: Select option B. Risk: Integration owner not confirmed.",
      {
        phase: "4",
        purpose: "artifact_review",
        artifactType: "solution_design",
      },
    );

    const res = await POST(req, MOVE_PARAMS);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      attachmentId: string;
      evidence: {
        id: string;
        status: string;
        parseMethod: string;
        warnings: string[];
        whatFound: string[];
        whereUsed: string[];
        reviewId: string;
        reviewStatus: string;
        maturityLevel: string;
        attachmentStatus: string;
      };
      discovery: { applied: boolean; fieldsUpdated: string[] };
      discoveryReadiness: { pendingEvidenceCount: number };
      review: { artifactType: string; extractedFeedback: unknown[]; reviewStatus: string };
    };

    expect(recordAttachmentUploadMock.mock.calls[0][0]).toMatchObject({
      tenantKey: "tenant:skyharbor",
      programId: MOVE_ID,
      phase: 4,
      scanStatus: "skipped",
      scanFindings: { reason: "synchronous_text_extraction_path" },
      mimeType: PPTX_MIME,
    });
    expect(ingestUploadedMoveEvidenceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: "client-1",
        clientKey: "skyharbor",
        userId: "user-1",
      }),
      expect.objectContaining({
        moveId: MOVE_ID,
        archetypeId: "operating_move",
        phase: 4,
        filename: "p3-workshop-readout.pptx",
        mimeType: PPTX_MIME,
        attachmentId: "attachment-1",
      }),
    );
    expect(loadDiscoveryEvidenceReadinessMock).toHaveBeenCalledWith(
      expect.any(Object),
      MOVE_ID,
    );
    expect(extractAndChunkMock).toHaveBeenCalledWith(
      expect.objectContaining({
        attachmentId: "attachment-1",
        moveId: MOVE_ID,
        phase: 4,
        mimeType: PPTX_MIME,
      }),
    );
    expect(body.evidence).toMatchObject({
      id: "evidence-1",
      status: "pending_review",
      parseMethod: "pptx-jszip",
      warnings: ["speaker notes omitted"],
      whatFound: ["phase workshop decisions", "risk register"],
      whereUsed: ["P3 approach gate", "P4 build plan"],
      reviewId: "review-1",
      reviewStatus: "pending_review",
      maturityLevel: "uploaded",
      attachmentStatus: "attached_to_move",
    });
    expect(body.discovery).toMatchObject({
      applied: true,
      fieldsUpdated: ["scope_boundary"],
    });
    expect(body.discoveryReadiness).toMatchObject({ pendingEvidenceCount: 1 });
    expect(body.review).toMatchObject({
      artifactType: "solution_design",
      reviewStatus: "needs_triage",
    });
    expect(body.review.extractedFeedback).toHaveLength(2);
  });

  it("returns not_captured evidence without hiding the durable attachment when ingestion fails", async () => {
    ingestUploadedMoveEvidenceMock.mockRejectedValue(new Error("parser failed"));
    const req = makeMultipartRequest(
      "meeting-notes.txt",
      "text/plain",
      "Meeting notes",
    );

    const res = await POST(req, MOVE_PARAMS);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      attachmentId: string;
      evidence: { id: null; status: string; warning: string };
    };

    expect(body.attachmentId).toBe("attachment-1");
    expect(body.evidence).toEqual({
      id: null,
      status: "not_captured",
      warning: "parser failed",
    });
    expect(loadDiscoveryEvidenceReadinessMock).not.toHaveBeenCalled();
  });
});
