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

import { loadApprovedMoveEvidenceSnapshot } from "../approved-move-evidence-snapshot";
import { effectivePhaseAfterEvidenceChange } from "../phase-gate-evidence-binding";

beforeEach(() => {
  mockReviewRows.length = 0;
  mockEvidenceRows.length = 0;
  mockFilters.length = 0;
  mockFrom.mockReset();
  mockFrom.mockImplementation((table: string) => {
    const queryFilters: Array<{ column: string; value: unknown }> = [];
    const query = {
      select: () => query,
      eq: (column: string, value: unknown) => {
        mockFilters.push({ table, column, value });
        queryFilters.push({ column, value });
        return query;
      },
      order: () => query,
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
      in: async () => ({ data: mockEvidenceRows, error: null }),
    };
    return query;
  });
});

describe("approved Move evidence snapshot", () => {
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
          value: "tenant-a",
        },
        {
          table: "program_evidence_reviews",
          column: "program_id",
          value: "move-a",
        },
        {
          table: "program_evidence_items",
          column: "tenant_key",
          value: "tenant-a",
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

  it("reopens a legacy phase approval when reviewed_at is newer than updated_at", async () => {
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
            }
          : null,
      ),
    ).toBe(1);
  });

  it("reopens a legacy approval when an approved evidence item was created later", async () => {
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
