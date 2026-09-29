const mockReviewRows: Array<Record<string, unknown>> = [];
const mockEvidenceRows: Array<Record<string, unknown>> = [];
const mockFilters: Array<{ table: string; column: string; value: unknown }> = [];
const mockFrom = jest.fn();

jest.mock("server-only", () => ({}));
jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureReadFluentClient: () => ({ from: (table: string) => mockFrom(table) }),
}));

import { loadApprovedMoveEvidenceSnapshot } from "../approved-move-evidence-snapshot";

beforeEach(() => {
  mockReviewRows.length = 0;
  mockEvidenceRows.length = 0;
  mockFilters.length = 0;
  mockFrom.mockReset();
  mockFrom.mockImplementation((table: string) => {
    const query = {
      select: () => query,
      eq: (column: string, value: unknown) => {
        mockFilters.push({ table, column, value });
        return query;
      },
      order: () => query,
      limit: async () => ({ data: mockReviewRows, error: null }),
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

    expect(snapshot).toMatchObject({ approvedEvidenceCount: 1 });
    expect(snapshot?.revision).toMatch(/^[a-f0-9]{64}$/);
    expect(mockFilters).toEqual(
      expect.arrayContaining([
        { table: "program_evidence_reviews", column: "tenant_key", value: "tenant-a" },
        { table: "program_evidence_reviews", column: "program_id", value: "move-a" },
        { table: "program_evidence_items", column: "tenant_key", value: "tenant-a" },
        { table: "program_evidence_items", column: "program_id", value: "move-a" },
      ]),
    );
  });

  it("fails closed instead of hashing a truncated approved-evidence set", async () => {
    mockReviewRows.push(
      ...Array.from({ length: 81 }, (_, index) => ({
        evidence_id: `evidence-${index}`,
        decision: "approved",
      })),
    );

    await expect(
      loadApprovedMoveEvidenceSnapshot({ tenantKey: "tenant-a", moveId: "move-a" }),
    ).resolves.toBeNull();
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });

  it("fails closed when an approved review has no tenant-scoped evidence row", async () => {
    mockReviewRows.push({
      evidence_id: "missing-evidence",
      decision: "approved",
    });

    await expect(
      loadApprovedMoveEvidenceSnapshot({ tenantKey: "tenant-a", moveId: "move-a" }),
    ).resolves.toBeNull();
  });
});
