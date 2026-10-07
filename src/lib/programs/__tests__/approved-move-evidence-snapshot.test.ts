const mockReviewRows: Array<Record<string, unknown>> = [];
const mockEvidenceRows: Array<Record<string, unknown>> = [];
const mockFilters: Array<{ table: string; column: string; value: unknown }> =
  [];
const mockFrom = jest.fn();

jest.mock("server-only", () => ({}));
jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureReadFluentClient: () => ({
    from: (table: string) => mockFrom(table),
  }),
}));

import {
  approvedMoveEvidenceRevisionForPhase,
  isApprovedMoveEvidenceBasisCurrent,
  loadApprovedMoveEvidenceSnapshot,
} from "../approved-move-evidence-snapshot";
import { effectivePhaseAfterEvidenceChange } from "../phase-gate-evidence-binding";

beforeEach(() => {
  mockReviewRows.length = 0;
  mockEvidenceRows.length = 0;
  mockFilters.length = 0;
  mockFrom.mockReset();
  mockFrom.mockImplementation((table: string) => {
    const queryFilters: Array<{ column: string; value: unknown }> = [];
    const record = (column: string, value: unknown) => {
      mockFilters.push({ table, column, value });
      queryFilters.push({ column, value });
      return query;
    };
    // The review queries end at `.limit(...)`, the evidence-items query ends at
    // its `.in("id", ...)`, and the tenant scope is now an `.in(...)` mid-chain
    // — so the builder has to be both chainable and awaitable rather than
    // resolving from one terminal method.
    const query = {
      select: () => query,
      eq: (column: string, value: unknown) => record(column, value),
      in: (column: string, value: unknown) => record(column, value),
      order: () => query,
      then: (
        resolve: (result: {
          data: Array<Record<string, unknown>>;
          error: null;
        }) => unknown,
      ) => resolve({ data: mockEvidenceRows, error: null }),
      limit: async (count?: number) => {
        let rows = mockReviewRows;
        const decision = queryFilters.find(
          (filter) => filter.column === "decision",
        );
        if (decision) {
          rows = rows.filter((row) => row.decision === decision.value);
        }
        rows = [...rows].sort((a, b) =>
          String(
            b.updated_at ?? b.reviewed_at ?? b.created_at ?? "",
          ).localeCompare(
            String(a.updated_at ?? a.reviewed_at ?? a.created_at ?? ""),
          ),
        );
        return {
          data: count === undefined ? rows : rows.slice(0, count),
          error: null,
        };
      },
    };
    return query;
  });
});

describe("approved Move evidence snapshot", () => {
  it("verifies new phase-scoped bases and migrates legacy hashes only when relevant evidence is unchanged", async () => {
    mockReviewRows.push({
      evidence_id: "p2-evidence",
      decision: "approved",
      reviewed_at: "2026-09-29T18:00:00.000Z",
      updated_at: "2026-09-29T18:00:00.000Z",
      created_at: "2026-09-29T18:00:00.000Z",
    });
    mockEvidenceRows.push({
      id: "p2-evidence",
      tenant_key: "tenant-a",
      program_id: "move-a",
      phase: 2,
      evidence_type: "upload",
      title: "P2 discovery evidence",
      summary: "Approved discovery input.",
      extracted_structured: {},
      created_at: "2026-09-29T17:30:00.000Z",
    });

    const snapshot = await loadApprovedMoveEvidenceSnapshot({
      tenantKey: "tenant-a",
      moveId: "move-a",
    });
    expect(snapshot).not.toBeNull();
    if (!snapshot) return;

    const generatedAt = "2026-09-29T17:00:00.000Z";
    const phaseRevision = approvedMoveEvidenceRevisionForPhase(snapshot, 2);
    expect(
      isApprovedMoveEvidenceBasisCurrent({
        snapshot,
        phase: 2,
        recordedRevision: phaseRevision,
        scope: "phase",
        generatedAt: "2026-09-29T19:00:00.000Z",
      }),
    ).toBe(true);
    expect(
      isApprovedMoveEvidenceBasisCurrent({
        snapshot,
        phase: 2,
        recordedRevision: phaseRevision,
        scope: "phase",
        generatedAt: "2026-09-29T17:00:00.000Z",
      }),
    ).toBe(false);
    expect(
      isApprovedMoveEvidenceBasisCurrent({
        snapshot,
        phase: 2,
        recordedRevision: snapshot.revision,
        generatedAt: "2026-09-29T17:00:00.000Z",
      }),
    ).toBe(false);
    expect(
      isApprovedMoveEvidenceBasisCurrent({
        snapshot,
        phase: 1,
        recordedRevision: "legacy-whole-move-hash",
        generatedAt,
      }),
    ).toBe(true);
    expect(
      isApprovedMoveEvidenceBasisCurrent({
        snapshot,
        phase: 2,
        recordedRevision: "legacy-whole-move-hash",
        generatedAt: "2026-09-29T17:00:00.000Z",
      }),
    ).toBe(false);
    expect(
      isApprovedMoveEvidenceBasisCurrent({
        snapshot,
        phase: 2,
        recordedRevision: "wrong-phase-hash",
        scope: "phase",
      }),
    ).toBe(false);
  });

  // C-576. Every assertion above hands the predicate a loaded snapshot, so the
  // one input the worker's premium guard most depends on -- no approved
  // evidence at all -- was asserted nowhere. This is where that invariant is
  // enforced: the `!snapshot` arm of the early return at the top of
  // `isApprovedMoveEvidenceBasisCurrent`. It is the reason the worker's own
  // `|| !evidenceSnapshot` can never be the deciding operand of its guard, and
  // asserting it here rather than through the worker is deliberate -- a
  // mutation that deletes `!snapshot ||` makes this case throw, where through
  // the worker the same mutation only shifts a completed run's status.
  it("refuses an absent approved-evidence snapshot rather than reading through it", () => {
    expect(
      isApprovedMoveEvidenceBasisCurrent({
        snapshot: null,
        phase: 2,
        recordedRevision: "p2-revision-current",
        scope: "phase",
        generatedAt: "2026-09-29T19:00:00.000Z",
      }),
    ).toBe(false);
    // Pinned with every other conjunct of that early return satisfied, so a
    // mutation that drops this one arm cannot be covered by a sibling arm:
    // the revision is present, the phase is in 1..5, and generatedAt parses.
    expect(
      isApprovedMoveEvidenceBasisCurrent({
        snapshot: null,
        phase: 1,
        recordedRevision: "legacy-whole-move-hash",
        generatedAt: "2026-09-29T17:00:00.000Z",
      }),
    ).toBe(false);
  });

  it("loads only the approved evidence scoped to the exact tenant and Move", async () => {
    mockReviewRows.push({
      evidence_id: "evidence-1",
      decision: "approved",
      reviewed_at: "2026-09-28T12:30:00.000Z",
      updated_at: "2026-09-28T12:30:00.000Z",
      source_ref: null,
    });
    mockEvidenceRows.push({
      id: "evidence-1",
      tenant_key: "tenant-a",
      program_id: "move-a",
      phase: 2,
      evidence_type: "workshop_notes",
      title: "Workshop notes",
      summary: "Human-reviewed notes.",
      extracted_text: "Source text",
      extracted_structured: { decisions: [] },
      confidence: 0.9,
      created_at: "2026-09-28T12:00:00.000Z",
    });

    const snapshot = await loadApprovedMoveEvidenceSnapshot({
      tenantKey: "tenant-a",
      moveId: "move-a",
    });

    expect(snapshot).toMatchObject({
      approvedEvidenceCount: 1,
      latestEvidenceActivityAt: "2026-09-28T12:30:00.000Z",
    });
    expect(snapshot?.revision).toMatch(/^[a-f0-9]{64}$/);
    expect(mockFilters).toEqual(
      expect.arrayContaining([
        {
          table: "program_evidence_reviews",
          column: "tenant_key",
          // An unrecognised key widens to itself, so the scope here is the one
          // key — the alias widening is proven in the tenant-scope suite.
          value: ["tenant-a"],
        },
        {
          table: "program_evidence_reviews",
          column: "program_id",
          value: "move-a",
        },
        {
          table: "program_evidence_items",
          column: "tenant_key",
          value: ["tenant-a"],
        },
        {
          table: "program_evidence_items",
          column: "program_id",
          value: "move-a",
        },
      ]),
    );
  });

  it("excludes pending review activity from approved-evidence freshness", async () => {
    mockReviewRows.push(
      {
        evidence_id: "evidence-approved",
        decision: "approved",
        updated_at: "2026-09-28T12:30:00.000Z",
      },
      {
        evidence_id: "evidence-pending",
        decision: "pending",
        updated_at: "2026-09-29T12:30:00.000Z",
      },
    );
    mockEvidenceRows.push({
      id: "evidence-approved",
      tenant_key: "tenant-a",
      program_id: "move-a",
      phase: 1,
      evidence_type: "upload",
      title: "Approved evidence",
      summary: "Reviewed and accepted.",
      extracted_structured: {},
      created_at: "2026-09-28T12:00:00.000Z",
    });

    const snapshot = await loadApprovedMoveEvidenceSnapshot({
      tenantKey: "tenant-a",
      moveId: "move-a",
    });

    expect(snapshot).toMatchObject({
      approvedEvidenceCount: 1,
      latestEvidenceActivityAt: "2026-09-28T12:30:00.000Z",
    });
    expect(mockFilters).toContainEqual({
      table: "program_evidence_reviews",
      column: "decision",
      value: "approved",
    });
  });

  it("does not reopen an earlier phase for later evidence assigned to another phase", async () => {
    mockReviewRows.push(
      {
        evidence_id: "older-review",
        decision: "approved",
        updated_at: "2026-09-29T18:00:00.000Z",
        reviewed_at: "2026-09-29T18:00:00.000Z",
        created_at: "2026-09-29T17:30:00.000Z",
      },
      {
        evidence_id: "later-review",
        decision: "approved",
        updated_at: "2026-09-29T17:00:00.000Z",
        reviewed_at: "2026-09-29T19:00:00.000Z",
        created_at: "2026-09-29T16:30:00.000Z",
      },
    );
    mockEvidenceRows.push(
      {
        id: "older-review",
        tenant_key: "tenant-a",
        program_id: "move-a",
        phase: 1,
        evidence_type: "upload",
        title: "Earlier evidence",
        summary: "Previously reviewed.",
        extracted_structured: {},
        created_at: "2026-09-29T17:00:00.000Z",
      },
      {
        id: "later-review",
        tenant_key: "tenant-a",
        program_id: "move-a",
        phase: 2,
        evidence_type: "upload",
        title: "Later evidence",
        summary: "Approved after the legacy phase gate.",
        extracted_structured: {},
        created_at: "2026-09-29T16:00:00.000Z",
      },
    );

    const evidence = await loadApprovedMoveEvidenceSnapshot({
      tenantKey: "tenant-a",
      moveId: "move-a",
    });
    expect(evidence?.latestEvidenceActivityAt).toBe("2026-09-29T19:00:00.000Z");

    expect(
      effectivePhaseAfterEvidenceChange(
        2,
        [
          {
            id: "legacy-p1-approval",
            engagementId: "move-a",
            phaseNumber: 1,
            phaseName: null,
            snapshot: {},
            lockedByUserId: null,
            lockedAt: "2026-09-29T18:30:00.000Z",
            approvalStatus: "approved",
            createdAt: "2026-09-29T18:30:00.000Z",
          },
        ],
        evidence
          ? {
              revision: evidence.revision,
              latestEvidenceActivityAt: evidence.latestEvidenceActivityAt,
              revisionByPhase: evidence.revisionByPhase,
              latestEvidenceActivityAtByPhase:
                evidence.latestEvidenceActivityAtByPhase,
            }
          : null,
      ),
    ).toBe(2);
  });

  it("does not reopen an earlier phase for a later evidence item assigned to another phase", async () => {
    mockReviewRows.push({
      evidence_id: "evidence-created-later",
      decision: "approved",
      reviewed_at: "2026-09-29T18:00:00.000Z",
      updated_at: "2026-09-29T18:00:00.000Z",
      created_at: "2026-09-29T17:30:00.000Z",
    });
    mockEvidenceRows.push({
      id: "evidence-created-later",
      tenant_key: "tenant-a",
      program_id: "move-a",
      phase: 2,
      evidence_type: "upload",
      title: "Newly approved evidence",
      summary: "Approved after the legacy phase gate.",
      extracted_structured: {},
      created_at: "2026-09-29T19:00:00.000Z",
    });

    const evidence = await loadApprovedMoveEvidenceSnapshot({
      tenantKey: "tenant-a",
      moveId: "move-a",
    });

    expect(evidence?.latestEvidenceActivityAt).toBe("2026-09-29T19:00:00.000Z");
    expect(
      effectivePhaseAfterEvidenceChange(
        2,
        [
          {
            id: "legacy-p1-approval",
            engagementId: "move-a",
            phaseNumber: 1,
            phaseName: null,
            snapshot: {},
            lockedByUserId: null,
            lockedAt: "2026-09-29T18:30:00.000Z",
            approvalStatus: "approved",
            createdAt: "2026-09-29T18:30:00.000Z",
          },
        ],
        evidence
          ? {
              revision: evidence.revision,
              latestEvidenceActivityAt: evidence.latestEvidenceActivityAt,
              revisionByPhase: evidence.revisionByPhase,
              latestEvidenceActivityAtByPhase:
                evidence.latestEvidenceActivityAtByPhase,
            }
          : null,
      ),
    ).toBe(2);
  });

  it("reopens a phase when its own approved evidence is reviewed after approval", async () => {
    mockReviewRows.push({
      evidence_id: "same-phase-later",
      decision: "approved",
      reviewed_at: "2026-09-29T19:00:00.000Z",
      updated_at: "2026-09-29T19:00:00.000Z",
      created_at: "2026-09-29T18:30:00.000Z",
    });
    mockEvidenceRows.push({
      id: "same-phase-later",
      tenant_key: "tenant-a",
      program_id: "move-a",
      phase: 1,
      evidence_type: "upload",
      title: "New phase evidence",
      summary: "Approved after the phase gate.",
      extracted_structured: {},
      created_at: "2026-09-29T18:00:00.000Z",
    });

    const evidence = await loadApprovedMoveEvidenceSnapshot({
      tenantKey: "tenant-a",
      moveId: "move-a",
    });

    expect(
      effectivePhaseAfterEvidenceChange(
        2,
        [
          {
            id: "legacy-p1-approval",
            engagementId: "move-a",
            phaseNumber: 1,
            phaseName: null,
            snapshot: {},
            lockedByUserId: null,
            lockedAt: "2026-09-29T18:30:00.000Z",
            approvalStatus: "approved",
            createdAt: "2026-09-29T18:30:00.000Z",
          },
        ],
        evidence
          ? {
              revision: evidence.revision,
              latestEvidenceActivityAt: evidence.latestEvidenceActivityAt,
              revisionByPhase: evidence.revisionByPhase,
              latestEvidenceActivityAtByPhase:
                evidence.latestEvidenceActivityAtByPhase,
            }
          : null,
      ),
    ).toBe(1);
  });

  it("fails closed instead of hashing a truncated approved-evidence set", async () => {
    mockReviewRows.push(
      ...Array.from({ length: 81 }, (_, index) => ({
        evidence_id: `evidence-${index}`,
        decision: "approved",
      })),
    );

    await expect(
      loadApprovedMoveEvidenceSnapshot({
        tenantKey: "tenant-a",
        moveId: "move-a",
      }),
    ).resolves.toBeNull();
    expect(mockFrom).toHaveBeenCalledTimes(2);
  });

  it("fails closed when review activity exceeds the bounded freshness scan", async () => {
    mockReviewRows.push(
      ...Array.from({ length: 501 }, (_, index) => ({
        evidence_id: `pending-${index}`,
        decision: "approved",
        created_at: `2026-09-${String(1 + (index % 28)).padStart(2, "0")}T12:00:00.000Z`,
      })),
    );

    await expect(
      loadApprovedMoveEvidenceSnapshot({
        tenantKey: "tenant-a",
        moveId: "move-a",
      }),
    ).resolves.toBeNull();
  });

  it("fails closed when an approved review has no tenant-scoped evidence row", async () => {
    mockReviewRows.push({
      evidence_id: "missing-evidence",
      decision: "approved",
    });

    await expect(
      loadApprovedMoveEvidenceSnapshot({
        tenantKey: "tenant-a",
        moveId: "move-a",
      }),
    ).resolves.toBeNull();
  });
});
