const mockReviewRows: Array<Record<string, unknown>> = [];
const mockEvidenceRows: Array<Record<string, unknown>> = [];
const mockMoveArtifactRows: Array<Record<string, unknown>> = [];
const mockFilters: Array<{ table: string; column: string; value: unknown }> =
  [];
const mockFrom = jest.fn();

jest.mock("server-only", () => ({}));
jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureReadFluentClient: () => ({ from: (table: string) => mockFrom(table) }),
}));

import { loadP0MinimumEvidenceStatus } from "../p0-source-evidence";

beforeEach(() => {
  mockReviewRows.length = 0;
  mockEvidenceRows.length = 0;
  mockMoveArtifactRows.length = 0;
  mockFilters.length = 0;
  mockFrom.mockReset();
  mockFrom.mockImplementation((table: string) => {
    const queryFilters: Array<{ column: string; value: unknown }> = [];
    let inCallCount = 0;
    const query = {
      select: () => query,
      eq: (column: string, value: unknown) => {
        mockFilters.push({ table, column, value });
        queryFilters.push({ column, value });
        return query;
      },
      in: (column: string, values: unknown[]) => {
        mockFilters.push({ table, column, value: values });
        queryFilters.push({ column, value: values });
        inCallCount += 1;
        if (
          table === "program_evidence_reviews" ||
          (table === "move_artifacts" && inCallCount === 1)
        ) {
          return query;
        }
        const rows =
          table === "program_evidence_items"
            ? mockEvidenceRows
            : mockMoveArtifactRows;
        return Promise.resolve({
          data: rows.filter((row) =>
            queryFilters.every((filter) =>
              Array.isArray(filter.value)
                ? filter.value.includes(row[filter.column])
                : row[filter.column] === filter.value,
            ),
          ),
          error: null,
        });
      },
      limit: async () => ({
        data: mockReviewRows.filter(
          (row) =>
            queryFilters.every((filter) =>
              Array.isArray(filter.value)
                ? filter.value.includes(row[filter.column])
                : row[filter.column] === filter.value,
            ) &&
            row.phase === 0 &&
            ["approved", "pending"].includes(String(row.decision)),
        ),
        error: null,
      }),
    };
    return query;
  });
});

describe("P0 source evidence read model", () => {
  it("counts only linked, parsed P0 files and scopes both reads to the tenant and Move", async () => {
    mockReviewRows.push(
      {
        evidence_id: "approved-evidence",
        decision: "approved",
        phase: 0,
        tenant_key: "tenant-a",
        program_id: "move-a",
        source_ref: { move_artifact_id: "artifact-a", filename: "brief.md" },
      },
      {
        evidence_id: "pending-evidence",
        decision: "pending",
        phase: 0,
        tenant_key: "tenant-a",
        program_id: "move-a",
        source_ref: { move_artifact_id: "artifact-b", filename: "notes.md" },
      },
    );
    mockEvidenceRows.push(
      {
        id: "approved-evidence",
        tenant_key: "tenant-a",
        program_id: "move-a",
        phase: 0,
        title: "brief.md",
        summary: "Reviewed source summary.",
        extracted_text: "Source text",
      },
      {
        id: "pending-evidence",
        tenant_key: "tenant-a",
        program_id: "move-a",
        phase: 0,
        title: "notes.md",
        summary: "Pending source summary.",
        extracted_text: "Source text",
      },
    );
    mockMoveArtifactRows.push(
      {
        artifact_id: "artifact-a",
        artifact_family: "uploaded_evidence",
        tenant_key: "tenant-a",
        move_id: "move-a",
        phase: 0,
        lifecycle_state: "current",
      },
      {
        artifact_id: "artifact-b",
        artifact_family: "session_artifact",
        tenant_key: "tenant-a",
        move_id: "move-a",
        phase: 0,
        lifecycle_state: "current",
      },
    );

    const status = await loadP0MinimumEvidenceStatus({
      tenantKey: "tenant-a",
      moveId: "move-a",
    });

    expect(status).toEqual({
      available: true,
      approvedSourceFileCount: 1,
      pendingReviewCount: 1,
      evidenceTitles: ["brief.md"],
    });
    expect(mockFilters).toEqual(
      expect.arrayContaining([
        { table: "program_evidence_reviews", column: "tenant_key", value: "tenant-a" },
        { table: "program_evidence_reviews", column: "program_id", value: "move-a" },
        { table: "program_evidence_items", column: "tenant_key", value: "tenant-a" },
        { table: "program_evidence_items", column: "program_id", value: "move-a" },
        { table: "move_artifacts", column: "tenant_key", value: "tenant-a" },
        { table: "move_artifacts", column: "move_id", value: "move-a" },
      ]),
    );
  });

  it("does not accept an evidence reference whose uploaded artifact is absent", async () => {
    mockReviewRows.push({
      evidence_id: "approved-evidence",
      decision: "approved",
      phase: 0,
      tenant_key: "tenant-a",
      program_id: "move-a",
      source_ref: { move_artifact_id: "missing-artifact", filename: "brief.md" },
    });
    mockEvidenceRows.push({
      id: "approved-evidence",
      tenant_key: "tenant-a",
      program_id: "move-a",
      phase: 0,
      title: "brief.md",
      summary: "Reviewed source summary.",
      extracted_text: "Source text",
    });

    await expect(
      loadP0MinimumEvidenceStatus({ tenantKey: "tenant-a", moveId: "move-a" }),
    ).resolves.toMatchObject({
      available: true,
      approvedSourceFileCount: 0,
      evidenceTitles: [],
    });
  });

  it("fails closed when the tenant-scoped evidence read fails", async () => {
    mockFrom.mockImplementation(() => {
      throw new Error("read unavailable");
    });

    await expect(
      loadP0MinimumEvidenceStatus({ tenantKey: "tenant-a", moveId: "move-a" }),
    ).resolves.toMatchObject({ available: false, approvedSourceFileCount: 0 });
  });
});
