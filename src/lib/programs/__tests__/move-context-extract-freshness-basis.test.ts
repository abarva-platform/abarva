/**
 * The freshness loader used to fold TWO facts into one `rebuild_required`: a
 * basis it could not READ, and an extract that recorded no revision. Only the
 * second is fixed by refreshing the extract. These cases pin that the loader now
 * reports which one it found — a correct classifier reached by nothing would
 * leave the worker's claim exactly as wrong as before.
 */
const maybeSingle = jest.fn();
const tenantFilter = jest.fn();

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureReadFluentClient: () => {
    const chain: Record<string, unknown> = {};
    for (const method of ["from", "select", "eq", "limit"]) {
      chain[method] = jest.fn(() => chain);
    }
    chain.in = jest.fn((column: string, values: unknown[]) => {
      tenantFilter(column, values);
      return chain;
    });
    chain.maybeSingle = maybeSingle;
    return chain;
  },
}));

const loadApprovedMoveEvidenceSnapshot = jest.fn();
const isApprovedMoveEvidenceBasisCurrent = jest.fn();

jest.mock("@/lib/programs/approved-move-evidence-snapshot", () => ({
  loadApprovedMoveEvidenceSnapshot: (args: unknown) =>
    loadApprovedMoveEvidenceSnapshot(args),
  isApprovedMoveEvidenceBasisCurrent: (args: unknown) =>
    isApprovedMoveEvidenceBasisCurrent(args),
}));

import { loadCurrentMoveContextExtractFreshness } from "@/lib/programs/move-context-extract-freshness";
import { tenantKeyReadValues } from "@/lib/programs/tenant-key-filter";

const EXTRACT_ROW = {
  generated_at: "2026-10-01T00:00:00.000Z",
  created_at: "2026-10-01T00:00:00.000Z",
  metadata: {
    moveContextExtract: {
      freshness: {
        extractId: "extract-1",
        moveId: "move-1",
        tenantKey: "demo-tenant",
        evidenceFingerprint: "fp-1",
        approvedEvidenceRevision: "rev-1",
        blueprintId: "bp-1",
        blueprintVersion: "1",
        createdAt: "2026-10-01T00:00:00.000Z",
        freshnessStatus: "fresh",
      },
    },
  },
};

const ARGS = { tenantKey: "demo-tenant", moveId: "move-1", phase: 3 };

beforeEach(() => {
  jest.clearAllMocks();
  maybeSingle.mockResolvedValue({ data: EXTRACT_ROW, error: null });
  isApprovedMoveEvidenceBasisCurrent.mockReturnValue(true);
});

describe("loadCurrentMoveContextExtractFreshness — the basis it compared against", () => {
  it("reports an unreadable snapshot as unevaluable, not as a stale extract", async () => {
    loadApprovedMoveEvidenceSnapshot.mockResolvedValue(null);

    const result = await loadCurrentMoveContextExtractFreshness(ARGS);

    expect(result?.freshnessStatus).toBe("rebuild_required");
    expect(result?.basisUnevaluableReason).toBe("snapshot_unavailable");
    // No comparison may be claimed when the basis could not be read.
    expect(isApprovedMoveEvidenceBasisCurrent).not.toHaveBeenCalled();
  });

  it("reports a snapshot load that threw apart from one that returned null", async () => {
    loadApprovedMoveEvidenceSnapshot.mockRejectedValue(new Error("read failed"));

    const result = await loadCurrentMoveContextExtractFreshness(ARGS);

    expect(result?.basisUnevaluableReason).toBe("snapshot_load_failed");
    expect(isApprovedMoveEvidenceBasisCurrent).not.toHaveBeenCalled();
  });

  it("does not issue the read at all with no tenant key, and says so", async () => {
    const result = await loadCurrentMoveContextExtractFreshness({
      ...ARGS,
      tenantKey: "",
    });

    expect(result?.basisUnevaluableReason).toBe("tenant_scope_unresolved");
    expect(loadApprovedMoveEvidenceSnapshot).not.toHaveBeenCalled();
  });

  it("leaves the reason unset when the extract records no revision", async () => {
    loadApprovedMoveEvidenceSnapshot.mockResolvedValue({ revision: "rev-2" });
    maybeSingle.mockResolvedValue({
      data: {
        ...EXTRACT_ROW,
        metadata: {
          moveContextExtract: {
            freshness: {
              ...EXTRACT_ROW.metadata.moveContextExtract.freshness,
              approvedEvidenceRevision: null,
            },
          },
        },
      },
      error: null,
    });

    const result = await loadCurrentMoveContextExtractFreshness(ARGS);

    // Both arrive as `rebuild_required`; the absent reason is what separates
    // this rebuild-shaped case from the unreadable one.
    expect(result?.freshnessStatus).toBe("rebuild_required");
    expect(result?.basisUnevaluableReason ?? null).toBeNull();
  });

  it("leaves the reason unset when the comparison ran and answered stale", async () => {
    loadApprovedMoveEvidenceSnapshot.mockResolvedValue({ revision: "rev-2" });
    isApprovedMoveEvidenceBasisCurrent.mockReturnValue(false);

    const result = await loadCurrentMoveContextExtractFreshness(ARGS);

    expect(result?.freshnessStatus).toBe("stale");
    expect(result?.basisUnevaluableReason ?? null).toBeNull();
  });

  it("leaves the reason unset when the comparison ran and answered fresh", async () => {
    loadApprovedMoveEvidenceSnapshot.mockResolvedValue({
      revision: "rev-1",
      approvedEvidenceCount: 4,
    });

    const result = await loadCurrentMoveContextExtractFreshness(ARGS);

    expect(result?.freshnessStatus).toBe("fresh");
    expect(result?.basisUnevaluableReason ?? null).toBeNull();
    expect(result?.currentApprovedEvidenceCount).toBe(4);
  });

  it("returns null when no current extract row is readable", async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });
    expect(await loadCurrentMoveContextExtractFreshness(ARGS)).toBeNull();
  });
});

describe("loadCurrentMoveContextExtractFreshness — the tenant filter it reads under", () => {
  it("asks for the extract under every spelling of the tenant key, never one", async () => {
    loadApprovedMoveEvidenceSnapshot.mockResolvedValue({ revision: "rev-1" });

    await loadCurrentMoveContextExtractFreshness({ ...ARGS, tenantKey: "meridian" });

    expect(tenantFilter).toHaveBeenCalledWith("tenant_key", tenantKeyReadValues("meridian"));
    const [, values] = tenantFilter.mock.calls[0] as [string, string[]];
    // The demo tenant's rows are persisted under both its app and canonical
    // spellings; a filter that carried only the one it was called with would
    // report the extract absent and the P3 sign-off precondition would refuse.
    expect(values).toEqual(expect.arrayContaining(["meridian", "meridian-health"]));
    expect(values.length).toBeGreaterThan(1);
  });
});
