const mockReviewRows: Array<Record<string, unknown>> = [];
const mockEvidenceRows: Array<Record<string, unknown>> = [];
const mockFrom = jest.fn();

jest.mock("server-only", () => ({}));
jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureReadFluentClient: () => ({
    from: (table: string) => mockFrom(table),
  }),
}));

import {
  CANONICAL_TENANT_KEYS,
  appClientKeyForTenant,
  canonicalTenantKey,
} from "@/lib/tenant/aliases";
import { loadApprovedMoveEvidenceSnapshot } from "../approved-move-evidence-snapshot";

// Tenant keys come from code, never hand-typed. Every case here turns on ONE
// tenant's rows being stored under a key other than the one the caller passes,
// so both keys are derived from the alias table and the foreign tenant comes
// from the same source.
const SPLIT_KEY_TENANT = CANONICAL_TENANT_KEYS.find(
  (key) => appClientKeyForTenant(key) !== key,
)!;
const APP_KEY = appClientKeyForTenant(SPLIT_KEY_TENANT)!;
const CANONICAL_KEY = canonicalTenantKey(SPLIT_KEY_TENANT);
const OTHER_TENANT_KEY = CANONICAL_TENANT_KEYS.find(
  (key) => key !== SPLIT_KEY_TENANT,
)!;

const MOVE_ID = "move-under-review";

/**
 * A fluent-client fake that actually APPLIES the tenant scope.
 *
 * The sibling suite's fake serves its rows regardless of the filters, which is
 * fine for the hashing and freshness cases it covers but would make every case
 * here pass whether the scope is one key or the whole alias set. This one
 * filters, so a narrowed scope is observable as missing evidence.
 */
function installFake() {
  mockFrom.mockReset();
  mockFrom.mockImplementation((table: string) => {
    const filters: Array<{ column: string; value: unknown }> = [];
    const matches = (row: Record<string, unknown>) =>
      filters.every(({ column, value }) => {
        const cell = row[column];
        if (Array.isArray(value)) return value.includes(cell as never);
        if (value === undefined) return true;
        return cell === value;
      });
    const rowsFor = () =>
      (table === "program_evidence_reviews"
        ? mockReviewRows
        : mockEvidenceRows
      ).filter(matches);
    const query = {
      select: () => query,
      eq: (column: string, value: unknown) => {
        filters.push({ column, value });
        return query;
      },
      in: (column: string, value: unknown) => {
        filters.push({ column, value });
        return query;
      },
      order: () => query,
      then: (
        resolve: (result: {
          data: Array<Record<string, unknown>>;
          error: null;
        }) => unknown,
      ) => resolve({ data: rowsFor(), error: null }),
      limit: async () => ({ data: rowsFor(), error: null }),
    };
    return query;
  });
}

function pushApprovedEvidence(tenantKey: string, evidenceId: string) {
  mockReviewRows.push({
    tenant_key: tenantKey,
    program_id: MOVE_ID,
    evidence_id: evidenceId,
    decision: "approved",
    reviewed_at: "2026-10-06T12:00:00.000Z",
    updated_at: "2026-10-06T12:00:00.000Z",
    created_at: "2026-10-06T11:00:00.000Z",
  });
  mockEvidenceRows.push({
    id: evidenceId,
    tenant_key: tenantKey,
    program_id: MOVE_ID,
    phase: 2,
    evidence_type: "upload",
    title: "Current-state evidence",
    summary: "Approved discovery input.",
    extracted_structured: {},
    created_at: "2026-10-06T11:00:00.000Z",
  });
}

/**
 * A review that was DECIDED but not approved.
 *
 * The snapshot runs a second, decision-agnostic query for review activity, and
 * that query's scope is a separate predicate from the approved-evidence one. A
 * rejection is activity (it moves the Move's evidence basis forward) without
 * being approved evidence, so it is the only fixture that tells the two
 * queries' scopes apart.
 */
function pushRejectedEvidence(
  tenantKey: string,
  evidenceId: string,
  decidedAt: string,
) {
  mockReviewRows.push({
    tenant_key: tenantKey,
    program_id: MOVE_ID,
    evidence_id: evidenceId,
    decision: "rejected",
    reviewed_at: decidedAt,
    updated_at: decidedAt,
    created_at: "2026-10-06T11:00:00.000Z",
  });
  mockEvidenceRows.push({
    id: evidenceId,
    tenant_key: tenantKey,
    program_id: MOVE_ID,
    phase: 2,
    evidence_type: "upload",
    title: "Rejected evidence",
    summary: "Returned to the client.",
    extracted_structured: {},
    created_at: "2026-10-06T11:00:00.000Z",
  });
}

beforeEach(() => {
  mockReviewRows.length = 0;
  mockEvidenceRows.length = 0;
  installFake();
});

describe("approved Move evidence snapshot tenant scope", () => {
  it("the fixture these cases rest on exists: a tenant with two distinct keys", () => {
    // Without this the derivation could be undefined and the cases below would
    // compare a key against itself and pass for the wrong reason.
    expect(SPLIT_KEY_TENANT).toBeTruthy();
    expect(APP_KEY).toBeTruthy();
    expect(CANONICAL_KEY).toBeTruthy();
    expect(APP_KEY).not.toEqual(CANONICAL_KEY);
    expect(OTHER_TENANT_KEY).toBeTruthy();
    expect(OTHER_TENANT_KEY).not.toEqual(CANONICAL_KEY);
  });

  it("sees evidence a data-plane load stored under the canonical substrate key", async () => {
    pushApprovedEvidence(CANONICAL_KEY, "loaded-evidence");

    const snapshot = await loadApprovedMoveEvidenceSnapshot({
      tenantKey: APP_KEY,
      moveId: MOVE_ID,
    });

    // The whole point: approved under one of this tenant's keys, read with the
    // other. A single-key scope answers 0 here, and 0 approved evidence is what
    // the gate evaluator and every generation path then act on.
    expect(snapshot?.approvedEvidenceCount).toBe(1);
    expect(snapshot?.rows.map((row) => row.id)).toEqual([
      "loaded-evidence",
    ]);
  });

  it("sees evidence the product stored under the app client key", async () => {
    pushApprovedEvidence(APP_KEY, "uploaded-evidence");

    const snapshot = await loadApprovedMoveEvidenceSnapshot({
      tenantKey: APP_KEY,
      moveId: MOVE_ID,
    });

    expect(snapshot?.approvedEvidenceCount).toBe(1);
  });

  it("is reflexive: either of the tenant's keys reads the same evidence", async () => {
    pushApprovedEvidence(CANONICAL_KEY, "loaded-evidence");
    pushApprovedEvidence(APP_KEY, "uploaded-evidence");

    const viaAppKey = await loadApprovedMoveEvidenceSnapshot({
      tenantKey: APP_KEY,
      moveId: MOVE_ID,
    });
    const viaCanonicalKey = await loadApprovedMoveEvidenceSnapshot({
      tenantKey: CANONICAL_KEY,
      moveId: MOVE_ID,
    });

    expect(viaAppKey?.approvedEvidenceCount).toBe(2);
    expect(viaCanonicalKey?.approvedEvidenceCount).toBe(2);
    expect(new Set(viaCanonicalKey?.rows.map((row) => row.id))).toEqual(
      new Set(viaAppKey?.rows.map((row) => row.id)),
    );
  });

  it("counts both producers' rows for the same Move rather than one of them", async () => {
    pushApprovedEvidence(CANONICAL_KEY, "loaded-evidence");
    pushApprovedEvidence(APP_KEY, "uploaded-evidence");

    const snapshot = await loadApprovedMoveEvidenceSnapshot({
      tenantKey: APP_KEY,
      moveId: MOVE_ID,
    });

    expect(snapshot?.approvedEvidenceCount).toBe(2);
  });

  it("never reads another tenant's approved evidence", async () => {
    pushApprovedEvidence(OTHER_TENANT_KEY, "other-tenant-evidence");

    const snapshot = await loadApprovedMoveEvidenceSnapshot({
      tenantKey: APP_KEY,
      moveId: MOVE_ID,
    });

    // The mirror of the widening. Without it the cases above would also pass
    // for a scope that matched every tenant.
    expect(snapshot?.approvedEvidenceCount).toBe(0);
    expect(snapshot?.rows).toEqual([]);
  });

  it("does not let a foreign tenant's row ride along beside this tenant's", async () => {
    pushApprovedEvidence(CANONICAL_KEY, "loaded-evidence");
    pushApprovedEvidence(OTHER_TENANT_KEY, "other-tenant-evidence");

    const snapshot = await loadApprovedMoveEvidenceSnapshot({
      tenantKey: APP_KEY,
      moveId: MOVE_ID,
    });

    expect(snapshot?.rows.map((row) => row.id)).toEqual([
      "loaded-evidence",
    ]);
  });

  it("keeps the evidence-item join on the same scope as the review lookup", async () => {
    // A review row under the canonical key whose evidence item is reachable
    // only on the same widened scope: a snapshot that widened the review query
    // alone would find the review and then drop the row for a missing item.
    pushApprovedEvidence(CANONICAL_KEY, "loaded-evidence");

    const snapshot = await loadApprovedMoveEvidenceSnapshot({
      tenantKey: APP_KEY,
      moveId: MOVE_ID,
    });

    expect(snapshot?.rows).toHaveLength(1);
    expect(snapshot?.rows[0]?.title).toBe("Current-state evidence");
  });

  it("reports the reader's own key on the snapshot, not the stored one", async () => {
    pushApprovedEvidence(CANONICAL_KEY, "loaded-evidence");

    const snapshot = await loadApprovedMoveEvidenceSnapshot({
      tenantKey: APP_KEY,
      moveId: MOVE_ID,
    });

    // The revision hashes the requested key, so widening the read must not
    // change which tenant a snapshot claims to be for — otherwise a recorded
    // basis would stop matching for a reason that has nothing to do with the
    // evidence.
    expect(snapshot?.tenantKey).toBe(APP_KEY);
  });

  it("counts a review decided under the canonical key as evidence activity", async () => {
    pushApprovedEvidence(APP_KEY, "uploaded-evidence");
    pushRejectedEvidence(
      CANONICAL_KEY,
      "returned-evidence",
      "2026-10-06T18:00:00.000Z",
    );

    const snapshot = await loadApprovedMoveEvidenceSnapshot({
      tenantKey: APP_KEY,
      moveId: MOVE_ID,
    });

    // The activity query is a SEPARATE predicate from the approved-evidence
    // one, and its scope decides whether a decision recorded under the other
    // key moves this Move's evidence basis. Scoped to one key it answers the
    // approved row's own timestamp and the rejection is invisible.
    expect(snapshot?.approvedEvidenceCount).toBe(1);
    expect(snapshot?.latestEvidenceActivityAt).toBe("2026-10-06T18:00:00.000Z");
  });

  it("does not count another tenant's decision as this Move's evidence activity", async () => {
    pushApprovedEvidence(APP_KEY, "uploaded-evidence");
    pushRejectedEvidence(
      OTHER_TENANT_KEY,
      "other-tenant-evidence",
      "2026-10-06T18:00:00.000Z",
    );

    const snapshot = await loadApprovedMoveEvidenceSnapshot({
      tenantKey: APP_KEY,
      moveId: MOVE_ID,
    });

    expect(snapshot?.latestEvidenceActivityAt).toBe("2026-10-06T12:00:00.000Z");
  });

  it("answers an empty snapshot, not another tenant's, when nothing is approved", async () => {
    const snapshot = await loadApprovedMoveEvidenceSnapshot({
      tenantKey: APP_KEY,
      moveId: MOVE_ID,
    });

    expect(snapshot?.approvedEvidenceCount).toBe(0);
    expect(snapshot?.revision).toMatch(/^[a-f0-9]{64}$/);
  });
});
