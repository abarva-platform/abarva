import { getObjectStorageAdapter } from "@/lib/data-plane/objectStorage";
import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import type { TenancyCtx } from "@/lib/programs/types.db";
import {
  downloadArtifactBytes,
  downloadArtifactOutcome,
  saveMoveArtifact,
  type ArtifactFamily,
} from "../move-artifacts";

jest.mock("@/lib/data-plane/objectStorage", () => ({
  getObjectStorageAdapter: jest.fn(),
}));

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureWriteFluentClient: jest.fn(),
}));

const uploadMock = jest.fn();
const downloadMock = jest.fn();
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
    download: downloadMock,
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
        expect.objectContaining({
          contentType: "text/markdown; charset=utf-8",
        }),
      );
      expect(insertedRow?.blob_path).toContain(expectedSegment);
      expect(updatedRow).toMatchObject({
        lifecycle_state: "superseded",
        status: "superseded",
        superseded_by_artifact_id: "new-artifact",
      });
    },
  );

  it("fences original downloads to the requested Move and tenant", async () => {
    const filters: Array<[string, unknown]> = [];
    const query = {
      eq(column: string, value: unknown) {
        filters.push([column, value]);
        return query;
      },
      maybeSingle: async () => ({
        data: {
          blob_container: "context-drops",
          blob_path: "moves/tenant-1/move-1/uploads/source/v1/source.txt",
          file_name: "source.txt",
          file_format: "txt",
          tenant_key: "meridian",
        },
        error: null,
      }),
    };
    (getAzureWriteFluentClient as jest.Mock).mockReturnValue({
      from: () => ({ select: () => query }),
    });
    downloadMock.mockResolvedValue(Buffer.from("source bytes"));

    const result = await downloadArtifactBytes(ctx, "artifact-1", "move-1");

    expect(result?.bytes.toString()).toBe("source bytes");
    expect(filters).toEqual([
      ["artifact_id", "artifact-1"],
      ["tenant_key", "meridian"],
      ["move_id", "move-1"],
    ]);
    expect(downloadMock).toHaveBeenCalledWith(
      "context-drops",
      "moves/tenant-1/move-1/uploads/source/v1/source.txt",
    );
  });
});

// The three ways a download produces no bytes. `downloadArtifactOutcome` is the
// only thing that can tell them apart — the route reads one answer and cannot
// re-derive the cause — so these cases exercise the PRODUCER, not a mock of it.
describe("downloadArtifactOutcome", () => {
  function stubRow(
    row: Record<string, unknown> | null,
    opts: { readError?: unknown } = {},
  ): { selected: string[] } {
    const selected: string[] = [];
    const query = {
      eq() {
        return query;
      },
      maybeSingle: async () => ({
        data: row,
        error: opts.readError ?? null,
      }),
    };
    (getAzureWriteFluentClient as jest.Mock).mockReturnValue({
      from: () => ({
        select: (columns: string) => {
          selected.push(columns);
          return query;
        },
      }),
    });
    return { selected };
  }

  const storedRow = (metadata: unknown) => ({
    blob_container: "context-drops",
    blob_path: "moves/tenant-1/move-1/uploads/source/v1/source.txt",
    file_name: "source.txt",
    file_format: "txt",
    tenant_key: "meridian",
    metadata,
  });

  it("asks for the metadata column that carries the storage stamp", async () => {
    // Without `metadata` the two failure causes below are indistinguishable at
    // the source, and the route falls back to one sentence for both.
    const { selected } = stubRow(storedRow({ storage: "azure_blob" }));
    downloadMock.mockResolvedValue(Buffer.from("source bytes"));

    await downloadArtifactOutcome(ctx, "artifact-1", "move-1");

    expect(selected).toHaveLength(1);
    expect(selected[0].split(/\s*,\s*/)).toContain("metadata");
  });

  it("reports an absent row as not found", async () => {
    stubRow(null);

    await expect(
      downloadArtifactOutcome(ctx, "artifact-1", "move-1"),
    ).resolves.toEqual({ ok: false, reason: "artifact_not_found" });
    expect(downloadMock).not.toHaveBeenCalled();
  });

  it("reports a read error as not found, identically to an absent row", async () => {
    stubRow(null, { readError: { message: "connection reset" } });

    await expect(
      downloadArtifactOutcome(ctx, "artifact-1", "move-1"),
    ).resolves.toEqual({ ok: false, reason: "artifact_not_found" });
  });

  it("reports a row of another tenant as not found, leaking nothing", async () => {
    stubRow(storedRow({ storage: "azure_blob" }));
    (getAzureWriteFluentClient as jest.Mock).mockReturnValue({
      from: () => ({
        select: () => {
          const q = {
            eq() {
              return q;
            },
            maybeSingle: async () => ({
              data: {
                ...storedRow({ storage: "azure_blob" }),
                tenant_key: "apex",
              },
              error: null,
            }),
          };
          return q;
        },
      }),
    });

    await expect(
      downloadArtifactOutcome(ctx, "artifact-1", "move-1"),
    ).resolves.toEqual({ ok: false, reason: "artifact_not_found" });
    expect(downloadMock).not.toHaveBeenCalled();
  });

  it("reports an unfetchable row stamped unconfigured as bytes never retained", async () => {
    // `saveMoveArtifact` writes this stamp when its best-effort Blob upload
    // fails. The only copy was the request body and nothing re-attempts it, so
    // this is permanent and the reader must be told to replace the file.
    stubRow(storedRow({ sha256: "abc", storage: "unconfigured" }));
    downloadMock.mockRejectedValue(new Error("BlobNotFound"));

    await expect(
      downloadArtifactOutcome(ctx, "artifact-1", "move-1"),
    ).resolves.toEqual({ ok: false, reason: "bytes_never_retained" });
  });

  it("reports an unfetchable row stamped azure_blob as unreachable storage", async () => {
    stubRow(storedRow({ sha256: "abc", storage: "azure_blob" }));
    downloadMock.mockRejectedValue(
      new Error("ENOTFOUND blob.core.windows.net"),
    );

    await expect(
      downloadArtifactOutcome(ctx, "artifact-1", "move-1"),
    ).resolves.toEqual({ ok: false, reason: "storage_unreachable" });
  });

  it("does not report loss for a row whose metadata records no stamp", async () => {
    stubRow(storedRow({ sha256: "abc" }));
    downloadMock.mockRejectedValue(
      new Error("ENOTFOUND blob.core.windows.net"),
    );

    await expect(
      downloadArtifactOutcome(ctx, "artifact-1", "move-1"),
    ).resolves.toEqual({ ok: false, reason: "storage_unreachable" });
  });

  it("serves a row stamped unconfigured whose bytes ARE fetchable", async () => {
    // The stamp records one past write attempt, not the present state, so
    // fetchable bytes win over it.
    stubRow(storedRow({ storage: "unconfigured" }));
    downloadMock.mockResolvedValue(Buffer.from("recovered bytes"));

    const outcome = await downloadArtifactOutcome(ctx, "artifact-1", "move-1");

    expect(outcome.ok).toBe(true);
    expect(outcome.ok && outcome.file.bytes.toString()).toBe("recovered bytes");
  });

  it.each([
    ["an absent row", null, undefined],
    [
      "unretained bytes",
      { storage: "unconfigured" },
      new Error("BlobNotFound"),
    ],
    ["unreachable storage", { storage: "azure_blob" }, new Error("ENOTFOUND")],
  ])(
    "keeps downloadArtifactBytes answering null for %s, for its nine other callers",
    async (_label, metadata, downloadError) => {
      stubRow(metadata === null ? null : storedRow(metadata));
      if (downloadError) downloadMock.mockRejectedValue(downloadError);

      await expect(
        downloadArtifactBytes(ctx, "artifact-1", "move-1"),
      ).resolves.toBeNull();
    },
  );
});
