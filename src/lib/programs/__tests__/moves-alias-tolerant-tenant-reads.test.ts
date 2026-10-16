/**
 * Moves rows for one tenant are persisted under more than one spelling of its
 * key (the app client key, the canonical key, and legacy spellings a
 * canonicalization pass rewrites to the canonical one). Every tenant-fenced read
 * must therefore accept the whole per-tenant alias set, or a row that exists
 * reads back as absent. These cases run two readers against an in-memory store
 * whose filters BEHAVE like the database's, so a reader that filtered on one
 * spelling would fail here by returning nothing, not by failing a call-shape
 * assertion that a renamed method could satisfy.
 */
type Row = Record<string, unknown>;
const tables: Record<string, Row[]> = {};

function compare(a: unknown, b: unknown): number {
  return String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0;
}

function makeFilterAwareClient() {
  return {
    from(table: string) {
      let rows: Row[] = [...(tables[table] ?? [])];
      const q = {
        select: () => q,
        eq: (column: string, value: unknown) => {
          rows = rows.filter((row) => row[column] === value);
          return q;
        },
        in: (column: string, values: unknown[]) => {
          rows = rows.filter((row) => values.includes(row[column]));
          return q;
        },
        gte: (column: string, value: unknown) => {
          rows = rows.filter((row) => compare(row[column], value) >= 0);
          return q;
        },
        lte: (column: string, value: unknown) => {
          rows = rows.filter((row) => compare(row[column], value) <= 0);
          return q;
        },
        order: (column: string, opts: { ascending: boolean }) => {
          rows.sort((x, y) => (opts.ascending ? 1 : -1) * compare(x[column], y[column]));
          return q;
        },
        limit: (n: number) => {
          rows = rows.slice(0, n);
          return q;
        },
        maybeSingle: async () => ({ data: rows[0] ?? null, error: null }),
        then(
          resolve: (value: { data: Row[]; error: null }) => unknown,
          reject: (error: unknown) => unknown,
        ) {
          try {
            resolve({ data: rows, error: null });
          } catch (error) {
            reject(error);
          }
        },
      };
      return q;
    },
  };
}

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureWriteFluentClient: () => makeFilterAwareClient(),
  getAzureReadFluentClient: () => makeFilterAwareClient(),
}));
jest.mock("../origination-close", () => ({ closeP0OnApproval: jest.fn() }));
jest.mock("../p0-source-evidence", () => ({ assertP0SourceEvidenceReady: jest.fn() }));

import { listApprovalAuditForTenant } from "../approval";
import { getLatestApprovedInputsPack } from "../approved-inputs-pack-store";
import { APPROVED_INPUTS_PACK_TYPE } from "@/lib/programs/phase-templates";

// The demo tenant's app spelling and canonical spelling; a third tenant's key.
const APP_KEY = "meridian";
const CANONICAL_KEY = "meridian-health";
const OTHER_TENANT = "apex-retail";

function approvalRow(overrides: Row): Row {
  return {
    id: "req-1",
    tenant_key: APP_KEY,
    program_id: "move-1",
    requested_by_user_id: "user-1",
    requested_at: "2026-10-01T10:00:00.000Z",
    request_status: "pending",
    decided_by_user_id: null,
    decided_at: null,
    decision_rationale: null,
    brief_snapshot: { name: "Synthetic Move", archetype: "workflow_automation" },
    created_at: "2026-10-01T10:00:00.000Z",
    updated_at: "2026-10-01T10:00:00.000Z",
    ...overrides,
  };
}

function packRow(overrides: Row): Row {
  return {
    id: "pack-1",
    tenant_key: APP_KEY,
    program_id: "move-1",
    phase: 3,
    evidence_type: APPROVED_INPUTS_PACK_TYPE,
    created_at: "2026-10-01T10:00:00.000Z",
    created_by_user_id: "approver-1",
    extracted_structured: {
      moveId: "move-1",
      targetPhase: 3,
      moveScopedOnly: true,
      enterprisePromotion: "not_eligible",
      sections: [],
    },
    ...overrides,
  };
}

beforeEach(() => {
  for (const key of Object.keys(tables)) delete tables[key];
});

describe("listApprovalAuditForTenant — rows under any spelling of the tenant key", () => {
  it("returns the tenant's requests stored under its canonical and app spellings, and no other tenant's", async () => {
    tables.program_approval_requests = [
      approvalRow({ id: "req-canonical", tenant_key: CANONICAL_KEY, requested_at: "2026-10-02T10:00:00.000Z" }),
      approvalRow({ id: "req-app", tenant_key: APP_KEY, requested_at: "2026-10-01T10:00:00.000Z" }),
      approvalRow({ id: "req-other", tenant_key: OTHER_TENANT, requested_at: "2026-10-03T10:00:00.000Z" }),
    ];

    const out = await listApprovalAuditForTenant({ tenantKey: APP_KEY });

    expect(out.map((request) => request.id)).toEqual(["req-canonical", "req-app"]);
  });

  it("returns the same rows when asked under the canonical spelling", async () => {
    tables.program_approval_requests = [
      approvalRow({ id: "req-app", tenant_key: APP_KEY }),
      approvalRow({ id: "req-other", tenant_key: OTHER_TENANT }),
    ];

    const out = await listApprovalAuditForTenant({ tenantKey: CANONICAL_KEY });

    expect(out.map((request) => request.id)).toEqual(["req-app"]);
  });

  it("still applies the status window inside the tenant's rows", async () => {
    tables.program_approval_requests = [
      approvalRow({ id: "req-approved", tenant_key: CANONICAL_KEY, request_status: "approved" }),
      approvalRow({ id: "req-pending", tenant_key: CANONICAL_KEY, request_status: "pending" }),
    ];

    const out = await listApprovalAuditForTenant({ tenantKey: APP_KEY, status: "approved" });

    expect(out.map((request) => request.id)).toEqual(["req-approved"]);
  });
});

describe("getLatestApprovedInputsPack — the pack stored under any spelling of the tenant key", () => {
  it("finds a pack stored under the canonical spelling when read with the app spelling", async () => {
    tables.program_evidence_items = [packRow({ id: "pack-canonical", tenant_key: CANONICAL_KEY })];

    const out = await getLatestApprovedInputsPack({ tenantKey: APP_KEY, moveId: "move-1", phase: 3 });

    expect(out?.id).toBe("pack-canonical");
    expect(out?.approvedBy).toBe("approver-1");
  });

  it("returns the newest of the tenant's packs across spellings", async () => {
    tables.program_evidence_items = [
      packRow({ id: "pack-older", tenant_key: APP_KEY, created_at: "2026-10-01T10:00:00.000Z" }),
      packRow({ id: "pack-newer", tenant_key: CANONICAL_KEY, created_at: "2026-10-05T10:00:00.000Z" }),
    ];

    const out = await getLatestApprovedInputsPack({ tenantKey: APP_KEY, moveId: "move-1", phase: 3 });

    expect(out?.id).toBe("pack-newer");
  });

  it("does not return another tenant's pack for the same Move id and phase", async () => {
    tables.program_evidence_items = [packRow({ id: "pack-other", tenant_key: OTHER_TENANT })];

    const out = await getLatestApprovedInputsPack({ tenantKey: APP_KEY, moveId: "move-1", phase: 3 });

    expect(out).toBeNull();
  });
});
