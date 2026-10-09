// `saveMoveArtifact` against a prior-version read that FAILS.
//
// The compat data-plane client never rejects — it returns `{data: null, error}`
// — so the `try/catch` that used to wrap this read could not be reached by a
// query failure, and the `error` was destructured away. The lineage restarted
// at v1, which is the blob path of the version already stored, so the new bytes
// overwrote it while the prior row went on recording that path and its sha.
//
// These cases run the real `saveMoveArtifact` and assert the ORDER: the refusal
// must land before the blob upload and before the registry insert, because
// that is what makes a retry safe.
import { getObjectStorageAdapter } from "@/lib/data-plane/objectStorage";
import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import type { TenancyCtx } from "@/lib/programs/types.db";
import { MOVE_ARTIFACT_SUPERSEDE_FAILED } from "../move-artifact-version-lineage";
import { saveMoveArtifact } from "../move-artifacts";

jest.mock("@/lib/data-plane/objectStorage", () => ({
  getObjectStorageAdapter: jest.fn(),
}));

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureWriteFluentClient: jest.fn(),
}));

const uploadMock = jest.fn();
const insertMock = jest.fn();
const updateEqMock = jest.fn();

/** What the prior-version read answers. */
let priorRead: { data: unknown; error: { message: string } | null } = {
  data: [],
  error: null,
};
/** What the supersede update answers. */
let supersedeResult: { data: null; error: { message: string } | null } = {
  data: null,
  error: null,
};

const ctx = {
  clientId: "tenant-1",
  clientKey: "meridian",
  userId: "user-1",
  role: "maestro",
  email: "maestro@example.com",
} as TenancyCtx;

const input = {
  moveId: "move-1",
  phase: 3,
  artifactType: "solution_architecture",
  title: "Solution architecture",
  fileName: "solution-architecture.html",
  fileFormat: "html",
  body: "<p>plan</p>",
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "warn").mockImplementation(() => {});
  priorRead = { data: [], error: null };
  supersedeResult = { data: null, error: null };
  uploadMock.mockResolvedValue(undefined);
  (getObjectStorageAdapter as jest.Mock).mockReturnValue({
    upload: uploadMock,
    download: jest.fn(),
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
        limit: async () => priorRead,
      }),
      insert: (row: Record<string, unknown>) => {
        insertMock(row);
        return {
          select: () => ({
            single: async () => ({
              data: { artifact_id: "new-artifact" },
              error: null,
            }),
          }),
        };
      },
      update: (row: Record<string, unknown>) => ({
        eq: async (_column: string, value: string) => {
          updateEqMock(row, value);
          return supersedeResult;
        },
      }),
    }),
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("saveMoveArtifact version lineage", () => {
  it("refuses by name when the prior-version read failed", async () => {
    priorRead = { data: null, error: { message: "statement timeout" } };
    await expect(saveMoveArtifact(ctx, input)).rejects.toThrow(
      "artifact_version_lineage_unreadable",
    );
  });

  it("writes NOTHING when the prior-version read failed", async () => {
    // The whole point of refusing at this exit: a retry is safe because no
    // bytes were stored under a path we guessed and no row was registered.
    priorRead = { data: null, error: { message: "statement timeout" } };
    await expect(saveMoveArtifact(ctx, input)).rejects.toThrow();
    expect(uploadMock).not.toHaveBeenCalled();
    expect(insertMock).not.toHaveBeenCalled();
    expect(updateEqMock).not.toHaveBeenCalled();
  });

  it("does not overwrite the stored v1 path when the read failed", async () => {
    // The defect, stated as the harm: a failed read used to upload to the v1
    // path of a Move that already had a v1 stored there.
    priorRead = { data: null, error: { message: "statement timeout" } };
    await expect(saveMoveArtifact(ctx, input)).rejects.toThrow();
    expect(
      uploadMock.mock.calls.some((call) => String(call[1]).includes("/v1/")),
    ).toBe(false);
  });

  it("names the read failure in the operator log", async () => {
    priorRead = { data: null, error: { message: "statement timeout" } };
    await expect(saveMoveArtifact(ctx, input)).rejects.toThrow();
    expect(console.warn).toHaveBeenCalledWith(
      "[move-artifacts] artifact_version_lineage_unreadable",
      expect.objectContaining({
        artifactType: "solution_architecture",
        moveId: "move-1",
        reason: "read_failed",
      }),
    );
  });

  it("still starts at v1 when the read succeeded and found no prior", async () => {
    priorRead = { data: [], error: null };
    const saved = await saveMoveArtifact(ctx, input);
    expect(saved.version).toBe(1);
    expect(uploadMock.mock.calls[0][1]).toContain(
      "/generated/p3/solution_architecture/v1/",
    );
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ supersedes_artifact_id: null, version: 1 }),
    );
    expect(updateEqMock).not.toHaveBeenCalled();
  });

  it("advances past a prior version and supersedes it", async () => {
    priorRead = {
      data: [{ artifact_id: "prior-artifact", version: 3 }],
      error: null,
    };
    const saved = await saveMoveArtifact(ctx, input);
    expect(saved.version).toBe(4);
    expect(uploadMock.mock.calls[0][1]).toContain(
      "/generated/p3/solution_architecture/v4/",
    );
    expect(updateEqMock).toHaveBeenCalledWith(
      expect.objectContaining({
        lifecycle_state: "superseded",
        superseded_by_artifact_id: "new-artifact",
      }),
      "prior-artifact",
    );
  });

  it("refuses a prior row whose version is not a usable number", async () => {
    priorRead = {
      data: [{ artifact_id: "prior-artifact", version: "3" }],
      error: null,
    };
    // Unguarded, `"3" + 1` is the string "31" and the bytes land under /v31/.
    await expect(saveMoveArtifact(ctx, input)).rejects.toThrow(
      "artifact_version_lineage_unreadable",
    );
    expect(uploadMock).not.toHaveBeenCalled();
  });
});

describe("saveMoveArtifact supersede failure", () => {
  beforeEach(() => {
    priorRead = {
      data: [{ artifact_id: "prior-artifact", version: 3 }],
      error: null,
    };
    supersedeResult = { data: null, error: { message: "deadlock detected" } };
  });

  it("does not turn a committed save into a refusal", async () => {
    // Both writes have landed by this point. A throw here would be read as
    // "nothing happened" and the caller would file a second copy.
    const saved = await saveMoveArtifact(ctx, input);
    expect(saved).toEqual(
      expect.objectContaining({ artifactId: "new-artifact", version: 4 }),
    );
  });

  it("names the repair owed, with both rows, in the operator log", async () => {
    await saveMoveArtifact(ctx, input);
    expect(console.warn).toHaveBeenCalledWith(
      `[move-artifacts] ${MOVE_ARTIFACT_SUPERSEDE_FAILED}`,
      expect.objectContaining({
        detail: "deadlock detected",
        priorArtifactId: "prior-artifact",
        supersededByArtifactId: "new-artifact",
      }),
    );
  });

  it("says nothing when the supersede took", async () => {
    supersedeResult = { data: null, error: null };
    await saveMoveArtifact(ctx, input);
    expect(console.warn).not.toHaveBeenCalledWith(
      `[move-artifacts] ${MOVE_ARTIFACT_SUPERSEDE_FAILED}`,
      expect.anything(),
    );
  });
});
