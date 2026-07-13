import { getObjectStorageAdapter } from "@/lib/data-plane/objectStorage";
import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import type { TenancyCtx } from "@/lib/programs/types.db";
import { saveMoveArtifact, type ArtifactFamily } from "../move-artifacts";

jest.mock("@/lib/data-plane/objectStorage", () => ({
  getObjectStorageAdapter: jest.fn(),
}));

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureWriteFluentClient: jest.fn(),
}));

const uploadMock = jest.fn();
let insertedRow: Record<string, unknown> | null = null;
let updatedRow: Record<string, unknown> | null = null;
let priorVersion = 3;

const ctx = {
  clientId: "tenant-1",
  clientKey: "meridian",
  userId: "user-1",
  role: "maestro",
  email: "maestro@example.com",
} as TenancyCtx;

beforeEach(() => {
  jest.clearAllMocks();
  insertedRow = null;
  updatedRow = null;
  priorVersion = 3;
  uploadMock.mockResolvedValue(undefined);
  (getObjectStorageAdapter as jest.Mock).mockReturnValue({
    upload: uploadMock,
  });
  (getAzureWriteFluentClient as jest.Mock).mockReturnValue({
    from: () => ({
      select: () => ({
        eq: function eq() {
          return this;
        },
        order: function order() {
          return this;
        },
        limit: async () => ({
          data: [{ artifact_id: "prior-artifact", version: priorVersion }],
          error: null,
        }),
      }),
      insert: (row: Record<string, unknown>) => {
        insertedRow = row;
        return {
          select: () => ({
            single: async () => ({
              data: { artifact_id: "new-artifact" },
              error: null,
            }),
          }),
        };
      },
      update: (row: Record<string, unknown>) => {
        updatedRow = row;
        return {
          eq: async () => ({ data: null, error: null }),
        };
      },
    }),
  });
});

describe("saveMoveArtifact", () => {
  it.each([
    {
      family: "session_artifact" as ArtifactFamily,
      artifactType: "p2_phase_execution_package",
      expectedSegment: "/sessions/p2_phase_execution_package/v4/",
    },
    {
      family: "uploaded_evidence" as ArtifactFamily,
      artifactType: "uploaded_evidence",
      expectedSegment: "/uploads/uploaded_evidence/v4/",
    },
    {
      family: "approval_artifact" as ArtifactFamily,
      artifactType: "gate_decision",
      expectedSegment: "/approvals/p2/v4/",
    },
    {
      family: "generated_deliverable" as ArtifactFamily,
      artifactType: "discovery_report",
      expectedSegment: "/generated/p2/discovery_report/v4/",
    },
  ])(
    "uses versioned blob paths for $family artifacts",
    async ({ family, artifactType, expectedSegment }) => {
      const saved = await saveMoveArtifact(ctx, {
        moveId: "move-1",
        phase: 2,
        artifactType,
        artifactFamily: family,
        title: "Artifact",
        fileName: "artifact.md",
        fileFormat: "md",
        body: "artifact body",
      });

      expect(saved.version).toBe(4);
      expect(saved.blobPath).toContain(expectedSegment);
      expect(uploadMock).toHaveBeenCalledWith(
        "context-drops",
        expect.stringContaining(expectedSegment),
        expect.any(Buffer),
        expect.objectContaining({ contentType: "text/markdown; charset=utf-8" }),
      );
      expect(insertedRow?.blob_path).toContain(expectedSegment);
      expect(updatedRow).toMatchObject({
        lifecycle_state: "superseded",
        status: "superseded",
        superseded_by_artifact_id: "new-artifact",
      });
    },
  );
});
