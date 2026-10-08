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

import {
  CANONICAL_TENANT_KEYS,
  appClientKeyForTenant,
  canonicalTenantKey,
} from "@/lib/tenant/aliases";
import { loadP0MinimumEvidenceStatus } from "../p0-source-evidence";

// Tenant keys come from code, never hand-typed. These cases turn on ONE tenant
// being stored under more than one of its own keys, so both keys are derived
// from the alias table itself, and a second, unrelated tenant comes from the
// same source.
const SPLIT_KEY_TENANT = CANONICAL_TENANT_KEYS.find(
  (key) => appClientKeyForTenant(key) !== key,
)!;
const APP_KEY = appClientKeyForTenant(SPLIT_KEY_TENANT)!;
const CANONICAL_KEY = canonicalTenantKey(SPLIT_KEY_TENANT);
const OTHER_TENANT_KEY = CANONICAL_TENANT_KEYS.find(
  (key) => key !== SPLIT_KEY_TENANT,
)!;

beforeEach(() => {
  mockReviewRows.length = 0;
  mockEvidenceRows.length = 0;
  mockMoveArtifactRows.length = 0;
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
      // Resolve on the query's LAST filter, named by column, rather than on a
      // count of `in` calls: the reader scopes `tenant_key` with `in` too, so a
      // count silently resolves one filter early as soon as a scope widens.
      in: (column: string, values: unknown[]) => {
        mockFilters.push({ table, column, value: values });
        queryFilters.push({ column, value: values });
        const terminalColumn =
          table === "program_evidence_items"
            ? "id"
            : table === "move_artifacts"
              ? "artifact_id"
              : null;
        if (column !== terminalColumn) {
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
    // Every read stays fenced to the Move and to this tenant. The tenant fence
    // is a key SET now; `tenant-a` resolves to no alias profile, so the set is
    // exactly that one key — an unrecognised key is never widened.
    expect(mockFilters).toEqual(
      expect.arrayContaining([
        { table: "program_evidence_reviews", column: "tenant_key", value: ["tenant-a"] },
        { table: "program_evidence_reviews", column: "program_id", value: "move-a" },
        { table: "program_evidence_items", column: "tenant_key", value: ["tenant-a"] },
        { table: "program_evidence_items", column: "program_id", value: "move-a" },
        { table: "move_artifacts", column: "tenant_key", value: ["tenant-a"] },
        { table: "move_artifacts", column: "move_id", value: "move-a" },
      ]),
    );
    expect(
      mockFilters.filter((filter) => filter.column === "tenant_key"),
    ).toHaveLength(3);
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

  it("counts an approved file stored under the tenant's canonical substrate key", async () => {
    // The product writes the app client key; a data-plane load writes the
    // canonical substrate key. Both name the same tenant, and before this the
    // P0 read saw only the first, so a loaded-and-approved source file read as
    // no evidence at all.
    mockReviewRows.push({
      evidence_id: "loaded-evidence",
      decision: "approved",
      phase: 0,
      tenant_key: CANONICAL_KEY,
      program_id: "move-a",
      source_ref: { move_artifact_id: "artifact-a", filename: "brief.md" },
    });
    mockEvidenceRows.push({
      id: "loaded-evidence",
      tenant_key: CANONICAL_KEY,
      program_id: "move-a",
      phase: 0,
      title: "brief.md",
      summary: "Reviewed source summary.",
      extracted_text: "Source text",
    });
    mockMoveArtifactRows.push({
      artifact_id: "artifact-a",
      artifact_family: "uploaded_evidence",
      tenant_key: CANONICAL_KEY,
      move_id: "move-a",
      phase: 0,
      lifecycle_state: "current",
    });

    await expect(
      loadP0MinimumEvidenceStatus({ tenantKey: APP_KEY, moveId: "move-a" }),
    ).resolves.toMatchObject({
      available: true,
      approvedSourceFileCount: 1,
      evidenceTitles: ["brief.md"],
    });
  });

  it("does not count another tenant's rows for the same Move id", async () => {
    // Widening is per-tenant. A key outside this tenant's own profile stays
    // unreadable, so the scope set can never become a way in.
    mockReviewRows.push({
      evidence_id: "other-tenant-evidence",
      decision: "approved",
      phase: 0,
      tenant_key: OTHER_TENANT_KEY,
      program_id: "move-a",
      source_ref: { move_artifact_id: "artifact-a", filename: "brief.md" },
    });
    mockEvidenceRows.push({
      id: "other-tenant-evidence",
      tenant_key: OTHER_TENANT_KEY,
      program_id: "move-a",
      phase: 0,
      title: "brief.md",
      summary: "Reviewed source summary.",
      extracted_text: "Source text",
    });
    mockMoveArtifactRows.push({
      artifact_id: "artifact-a",
      artifact_family: "uploaded_evidence",
      tenant_key: OTHER_TENANT_KEY,
      move_id: "move-a",
      phase: 0,
      lifecycle_state: "current",
    });

    await expect(
      loadP0MinimumEvidenceStatus({ tenantKey: APP_KEY, moveId: "move-a" }),
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
