/**
 * home-knowledge-v4-review.ts — pack-lifecycle regression tests
 *
 * The first automated tests for the V4 approve/reject/retire/rollback
 * transaction shapes (none existed before this PR — the only prior
 * verification was an ad hoc manual QA transcript, per
 * docs/releases/records/2026-07-25-home-v4-quality-governance.md). Covers
 * exactly what the user asked PR2 to prove: state transitions, one-active-
 * pack enforcement, tenant isolation, and rollback.
 *
 * `pg` is mocked with a small in-memory transactional store rather than a
 * real Postgres connection (none is reachable from this environment — the
 * real database sits inside a private VNet). The mock matches on
 * distinctive normalized-SQL substrings unique to each query in the real
 * module, so these tests exercise the real control flow (BEGIN/COMMIT/
 * ROLLBACK sequencing, precondition checks, thrown errors) against a
 * faithful simulation of what each statement does, not a stubbed-out
 * bypass of the logic under test.
 */

let mockRows: Array<Record<string, unknown>> = [];
let mockTxRows: Array<Record<string, unknown>> | null = null;
let mockNowCounter = 0;

function mockNow(): string {
  mockNowCounter += 1;
  return `MOCK_NOW_${mockNowCounter}`;
}

function activeRows(): Array<Record<string, unknown>> {
  return mockTxRows ?? mockRows;
}

function normalize(sql: string): string {
  return sql.replace(/\s+/g, " ").trim();
}

async function mockQuery(sql: string, params: unknown[] = []): Promise<{ rows: Array<Record<string, unknown>> }> {
  const q = normalize(sql);

  if (q === "BEGIN") {
    mockTxRows = JSON.parse(JSON.stringify(mockRows));
    return { rows: [] };
  }
  if (q === "COMMIT") {
    if (mockTxRows) mockRows = mockTxRows;
    mockTxRows = null;
    return { rows: [] };
  }
  if (q === "ROLLBACK") {
    mockTxRows = null;
    return { rows: [] };
  }

  const rows = activeRows();

  // 1. listHomeKnowledgeV4CandidatesForReview
  if (q.includes("DISTINCT ON (tenant_key)")) {
    const [artifactType] = params as [string];
    const matching = rows.filter((r) => r.artifact_type === artifactType);
    const byTenant = new Map<string, Record<string, unknown>>();
    for (const row of matching) {
      const existing = byTenant.get(row.tenant_key as string);
      if (!existing || (row.created_at as string) > (existing.created_at as string)) {
        byTenant.set(row.tenant_key as string, row);
      }
    }
    return { rows: [...byTenant.values()].sort((a, b) => (a.tenant_key as string).localeCompare(b.tenant_key as string)) };
  }

  // getHomeKnowledgeV4LatestCandidateRenderPack -- checked before the history
  // query below since both share the same WHERE/ORDER BY clause; this one
  // is distinguished by selecting render_pack and a LIMIT 1.
  if (q.includes("render_pack") && q.includes("LIMIT 1") && q.includes("ORDER BY created_at DESC")) {
    const [tenantKey, artifactType] = params as [string, string];
    const match = rows
      .filter((r) => r.tenant_key === tenantKey && r.artifact_type === artifactType)
      .sort((a, b) => (b.created_at as string).localeCompare(a.created_at as string))[0];
    return { rows: match ? [match] : [] };
  }

  // 2. listHomeKnowledgeV4PackHistoryForTenant
  if (q.includes("WHERE tenant_key = $1 AND artifact_type = $2 ORDER BY created_at DESC")) {
    const [tenantKey, artifactType] = params as [string, string];
    return {
      rows: rows
        .filter((r) => r.tenant_key === tenantKey && r.artifact_type === artifactType)
        .sort((a, b) => (b.created_at as string).localeCompare(a.created_at as string)),
    };
  }

  // 3. approve: latest candidate select
  if (q.includes("AND status = 'candidate' ORDER BY created_at DESC LIMIT 1")) {
    const [tenantKey, artifactType] = params as [string, string];
    const match = rows
      .filter((r) => r.tenant_key === tenantKey && r.artifact_type === artifactType && r.status === "candidate")
      .sort((a, b) => (b.created_at as string).localeCompare(a.created_at as string))[0];
    return { rows: match ? [match] : [] };
  }

  // 4. approve: retire-prior (no RETURNING)
  if (q.includes("SET effective_to = now(), status = 'retired', updated_at = now()")) {
    const [tenantKey] = params as [string];
    for (const row of rows) {
      if (row.tenant_key === tenantKey && row.status === "approved" && row.effective_to == null) {
        row.status = "retired";
        row.effective_to = mockNow();
      }
    }
    return { rows: [] };
  }

  // 5. approve: final activation update
  if (q.includes("override_reason = $3, overridden_by = $4, overridden_at = $5, findings_acknowledged = $6")) {
    const [id, approvedBy, overrideReason, overriddenBy, overriddenAt, findingsJson] = params as string[];
    const row = rows.find((r) => r.id === id);
    if (!row) return { rows: [] };
    row.status = "approved";
    row.approved_by = approvedBy;
    row.approved_at = mockNow();
    row.effective_from = mockNow();
    row.override_reason = overrideReason;
    row.overridden_by = overriddenBy;
    row.overridden_at = overriddenAt;
    row.findings_acknowledged = JSON.parse(findingsJson);
    return { rows: [{ id: row.id, tenant_key: row.tenant_key, pack_version: row.pack_version }] };
  }

  // 6. reject: select
  if (q.includes("SELECT id, status FROM public.home_knowledge_packs WHERE id = $1 AND artifact_type = $2 FOR UPDATE")) {
    const [id, artifactType] = params as [string, string];
    const row = rows.find((r) => r.id === id && r.artifact_type === artifactType);
    return { rows: row ? [{ id: row.id, status: row.status }] : [] };
  }

  // 7. reject: update
  if (q.includes("SET status = 'rejected', rejected_by = $2, rejected_at = now(), reject_reason = $3, updated_at = now()")) {
    const [id, rejectedBy, reason] = params as string[];
    const row = rows.find((r) => r.id === id);
    if (!row) return { rows: [] };
    row.status = "rejected";
    row.rejected_by = rejectedBy;
    row.rejected_at = mockNow();
    row.reject_reason = reason;
    return { rows: [{ id: row.id, tenant_key: row.tenant_key, pack_version: row.pack_version }] };
  }

  // 8. retire: select active
  if (q.includes("SELECT id FROM public.home_knowledge_packs WHERE tenant_key = $1 AND artifact_type = $2 AND status = 'approved' AND effective_to IS NULL FOR UPDATE")) {
    const [tenantKey, artifactType] = params as [string, string];
    const row = rows.find((r) => r.tenant_key === tenantKey && r.artifact_type === artifactType && r.status === "approved" && r.effective_to == null);
    return { rows: row ? [{ id: row.id }] : [] };
  }

  // 9. retire: update by id
  if (q.includes("SET status = 'retired', effective_to = now(), retired_by = $2, retire_reason = $3, updated_at = now() WHERE id = $1")) {
    const [id, retiredBy, reason] = params as string[];
    const row = rows.find((r) => r.id === id);
    if (!row) return { rows: [] };
    row.status = "retired";
    row.effective_to = mockNow();
    row.retired_by = retiredBy;
    row.retire_reason = reason;
    return { rows: [{ id: row.id, tenant_key: row.tenant_key, pack_version: row.pack_version }] };
  }

  // 10. rollback: target select
  if (q.includes("SELECT id, tenant_key, status FROM public.home_knowledge_packs WHERE id = $1 AND artifact_type = $2 AND tenant_key = $3 FOR UPDATE")) {
    const [id, artifactType, tenantKey] = params as string[];
    const row = rows.find((r) => r.id === id && r.artifact_type === artifactType && r.tenant_key === tenantKey);
    return { rows: row ? [{ id: row.id, tenant_key: row.tenant_key, status: row.status }] : [] };
  }

  // 11. rollback: displace current active
  if (q.includes("WHERE tenant_key = $1 AND status = 'approved' AND effective_to IS NULL RETURNING id")) {
    const [tenantKey, retiredBy, reasonText] = params as string[];
    const row = rows.find((r) => r.tenant_key === tenantKey && r.status === "approved" && r.effective_to == null);
    if (!row) return { rows: [] };
    row.status = "retired";
    row.effective_to = mockNow();
    row.retired_by = retiredBy;
    row.retire_reason = reasonText;
    return { rows: [{ id: row.id }] };
  }

  // 12. rollback: reactivate target
  if (q.includes("rollback_of_pack_id = $3")) {
    const [id, rolledBackBy, rollbackOfPackId, overrideReasonText] = params as string[];
    const row = rows.find((r) => r.id === id);
    if (!row) return { rows: [] };
    row.status = "approved";
    row.approved_by = rolledBackBy;
    row.approved_at = mockNow();
    row.effective_from = mockNow();
    row.effective_to = null;
    row.rollback_of_pack_id = rollbackOfPackId ?? null;
    row.override_reason = overrideReasonText;
    row.overridden_by = rolledBackBy;
    row.overridden_at = mockNow();
    return { rows: [{ id: row.id, tenant_key: row.tenant_key, pack_version: row.pack_version }] };
  }

  // job-run failures listing -- unused in these tests, keep harmless.
  if (q.includes("home_knowledge_v4_job_runs")) {
    return { rows: [] };
  }

  throw new Error(`mock pg query not recognized: ${q}`);
}

jest.mock("pg", () => ({
  Client: class {
    async connect() {}
    async end() {}
    async query(sql: string, params?: unknown[]) {
      return mockQuery(sql, params);
    }
  },
}));

process.env.DATABASE_URL = "postgres://mock/mock";

import {
  approveHomeKnowledgeV4Candidate,
  getHomeKnowledgeV4LatestCandidateRenderPack,
  HomeKnowledgeV4ApprovalError,
  listHomeKnowledgeV4CandidatesForReview,
  listHomeKnowledgeV4PackHistoryForTenant,
  rejectHomeKnowledgeV4Candidate,
  retireHomeKnowledgeV4ActivePack,
  rollbackHomeKnowledgeV4Pack,
} from "../home-knowledge-v4-review";

const ARTIFACT_TYPE = "NexusHomeKnowledgePackV4Book";

function seedRow(overrides: Partial<Record<string, unknown>>): Record<string, unknown> {
  return {
    id: "row-id",
    tenant_key: "tenant-a",
    tenant_name: "Tenant A",
    pack_version: "v1",
    status: "candidate",
    artifact_type: ARTIFACT_TYPE,
    validation_status: "pass",
    quality_report: { violations: [] },
    created_at: "2026-07-25T00:00:00.000Z",
    approved_by: null,
    approved_at: null,
    override_reason: null,
    overridden_by: null,
    overridden_at: null,
    rejected_by: null,
    rejected_at: null,
    reject_reason: null,
    retired_by: null,
    retire_reason: null,
    rollback_of_pack_id: null,
    effective_from: null,
    effective_to: null,
    ...overrides,
  };
}

function activeCountForTenant(tenantKey: string): number {
  return mockRows.filter((r) => r.tenant_key === tenantKey && r.status === "approved" && r.effective_to == null).length;
}

beforeEach(() => {
  mockRows = [];
  mockTxRows = null;
  mockNowCounter = 0;
});

describe("approveHomeKnowledgeV4Candidate", () => {
  it("approves a clean candidate and enforces one active pack for the tenant", async () => {
    mockRows.push(seedRow({ id: "c1", status: "candidate", validation_status: "pass", created_at: "2026-07-25T01:00:00.000Z" }));
    const result = await approveHomeKnowledgeV4Candidate({ tenantKey: "tenant-a", approvedBy: "reviewer@abarva.ai" });
    expect(result.id).toBe("c1");
    expect(result.overridden).toBe(false);
    const row = mockRows.find((r) => r.id === "c1")!;
    expect(row.status).toBe("approved");
    expect(row.effective_to).toBeNull();
    expect(activeCountForTenant("tenant-a")).toBe(1);
  });

  it("retires the prior active pack before activating the new one (one-active-pack enforcement)", async () => {
    mockRows.push(seedRow({ id: "old", status: "approved", effective_to: null, created_at: "2026-07-24T00:00:00.000Z" }));
    mockRows.push(seedRow({ id: "new", status: "candidate", validation_status: "pass", created_at: "2026-07-25T00:00:00.000Z" }));
    await approveHomeKnowledgeV4Candidate({ tenantKey: "tenant-a", approvedBy: "reviewer@abarva.ai" });
    const old = mockRows.find((r) => r.id === "old")!;
    const fresh = mockRows.find((r) => r.id === "new")!;
    expect(old.status).toBe("retired");
    expect(old.effective_to).not.toBeNull();
    expect(fresh.status).toBe("approved");
    expect(activeCountForTenant("tenant-a")).toBe(1);
  });

  it("refuses to approve a failed candidate without an override reason", async () => {
    mockRows.push(seedRow({ id: "bad", status: "candidate", validation_status: "fail" }));
    await expect(
      approveHomeKnowledgeV4Candidate({ tenantKey: "tenant-a", approvedBy: "reviewer@abarva.ai" }),
    ).rejects.toThrow(HomeKnowledgeV4ApprovalError);
    expect(mockRows.find((r) => r.id === "bad")!.status).toBe("candidate");
  });

  it("approves a failed candidate with an override reason and records it", async () => {
    mockRows.push(
      seedRow({ id: "bad", status: "candidate", validation_status: "fail", quality_report: { violations: [{ type: "x" }] } }),
    );
    const result = await approveHomeKnowledgeV4Candidate({
      tenantKey: "tenant-a",
      approvedBy: "reviewer@abarva.ai",
      overrideReason: "Reviewed manually, findings are false positives.",
    });
    expect(result.overridden).toBe(true);
    const row = mockRows.find((r) => r.id === "bad")!;
    expect(row.status).toBe("approved");
    expect(row.override_reason).toBe("Reviewed manually, findings are false positives.");
    expect(row.findings_acknowledged).toEqual([{ type: "x" }]);
  });

  it("throws when no candidate exists for the tenant", async () => {
    await expect(
      approveHomeKnowledgeV4Candidate({ tenantKey: "no-such-tenant", approvedBy: "reviewer@abarva.ai" }),
    ).rejects.toThrow(HomeKnowledgeV4ApprovalError);
  });

  it("does not touch another tenant's active pack (tenant isolation)", async () => {
    mockRows.push(seedRow({ id: "other-active", tenant_key: "tenant-b", status: "approved", effective_to: null }));
    mockRows.push(seedRow({ id: "c1", tenant_key: "tenant-a", status: "candidate", validation_status: "pass" }));
    await approveHomeKnowledgeV4Candidate({ tenantKey: "tenant-a", approvedBy: "reviewer@abarva.ai" });
    expect(mockRows.find((r) => r.id === "other-active")!.status).toBe("approved");
    expect(activeCountForTenant("tenant-b")).toBe(1);
    expect(activeCountForTenant("tenant-a")).toBe(1);
  });
});

describe("rejectHomeKnowledgeV4Candidate", () => {
  it("rejects a candidate and records who/why", async () => {
    mockRows.push(seedRow({ id: "c1", status: "candidate" }));
    const result = await rejectHomeKnowledgeV4Candidate({ packId: "c1", rejectedBy: "reviewer@abarva.ai", reason: "Boilerplate narrative." });
    expect(result.id).toBe("c1");
    const row = mockRows.find((r) => r.id === "c1")!;
    expect(row.status).toBe("rejected");
    expect(row.rejected_by).toBe("reviewer@abarva.ai");
    expect(row.reject_reason).toBe("Boilerplate narrative.");
  });

  it("refuses to reject without a reason", async () => {
    mockRows.push(seedRow({ id: "c1", status: "candidate" }));
    await expect(
      rejectHomeKnowledgeV4Candidate({ packId: "c1", rejectedBy: "reviewer@abarva.ai", reason: "" }),
    ).rejects.toThrow(HomeKnowledgeV4ApprovalError);
  });

  it("refuses to reject a pack that is not a candidate", async () => {
    mockRows.push(seedRow({ id: "c1", status: "approved", effective_to: null }));
    await expect(
      rejectHomeKnowledgeV4Candidate({ packId: "c1", rejectedBy: "reviewer@abarva.ai", reason: "test" }),
    ).rejects.toThrow(HomeKnowledgeV4ApprovalError);
    expect(mockRows.find((r) => r.id === "c1")!.status).toBe("approved");
  });
});

describe("retireHomeKnowledgeV4ActivePack", () => {
  it("retires the currently-active pack without promoting a replacement", async () => {
    mockRows.push(seedRow({ id: "active", status: "approved", effective_to: null }));
    const result = await retireHomeKnowledgeV4ActivePack({ tenantKey: "tenant-a", retiredBy: "admin@abarva.ai", reason: "Falling back to V2 on purpose." });
    expect(result.id).toBe("active");
    const row = mockRows.find((r) => r.id === "active")!;
    expect(row.status).toBe("retired");
    expect(row.effective_to).not.toBeNull();
    expect(row.retire_reason).toBe("Falling back to V2 on purpose.");
    expect(activeCountForTenant("tenant-a")).toBe(0);
  });

  it("throws when the tenant has no active pack", async () => {
    await expect(
      retireHomeKnowledgeV4ActivePack({ tenantKey: "tenant-a", retiredBy: "admin@abarva.ai", reason: "test" }),
    ).rejects.toThrow(HomeKnowledgeV4ApprovalError);
  });

  it("refuses to retire without a reason", async () => {
    mockRows.push(seedRow({ id: "active", status: "approved", effective_to: null }));
    await expect(
      retireHomeKnowledgeV4ActivePack({ tenantKey: "tenant-a", retiredBy: "admin@abarva.ai", reason: "" }),
    ).rejects.toThrow(HomeKnowledgeV4ApprovalError);
  });
});

describe("rollbackHomeKnowledgeV4Pack", () => {
  it("reactivates a retired pack and displaces the current active one", async () => {
    mockRows.push(seedRow({ id: "current", status: "approved", effective_to: null, created_at: "2026-07-25T02:00:00.000Z" }));
    mockRows.push(seedRow({ id: "old", status: "retired", effective_to: "2026-07-25T00:00:00.000Z", created_at: "2026-07-24T00:00:00.000Z" }));
    const result = await rollbackHomeKnowledgeV4Pack({
      tenantKey: "tenant-a",
      targetPackId: "old",
      rolledBackBy: "admin@abarva.ai",
      reason: "Current pack has a regression.",
    });
    expect(result.id).toBe("old");
    expect(result.displacedPackId).toBe("current");
    const old = mockRows.find((r) => r.id === "old")!;
    const current = mockRows.find((r) => r.id === "current")!;
    expect(old.status).toBe("approved");
    expect(old.effective_to).toBeNull();
    expect(old.rollback_of_pack_id).toBe("current");
    expect(current.status).toBe("retired");
    expect(activeCountForTenant("tenant-a")).toBe(1);
  });

  it("can roll back to a rejected pack, not just a retired one", async () => {
    mockRows.push(seedRow({ id: "rejected-pack", status: "rejected" }));
    const result = await rollbackHomeKnowledgeV4Pack({
      tenantKey: "tenant-a",
      targetPackId: "rejected-pack",
      rolledBackBy: "admin@abarva.ai",
      reason: "Reconsidered after further review.",
    });
    expect(result.id).toBe("rejected-pack");
    expect(result.displacedPackId).toBeNull();
    expect(mockRows.find((r) => r.id === "rejected-pack")!.status).toBe("approved");
  });

  it("refuses to roll back to a pack that is still a candidate", async () => {
    mockRows.push(seedRow({ id: "still-candidate", status: "candidate" }));
    await expect(
      rollbackHomeKnowledgeV4Pack({ tenantKey: "tenant-a", targetPackId: "still-candidate", rolledBackBy: "admin@abarva.ai", reason: "test" }),
    ).rejects.toThrow(HomeKnowledgeV4ApprovalError);
  });

  it("refuses to roll back to a pack belonging to a different tenant (tenant isolation)", async () => {
    mockRows.push(seedRow({ id: "foreign", tenant_key: "tenant-b", status: "retired" }));
    await expect(
      rollbackHomeKnowledgeV4Pack({ tenantKey: "tenant-a", targetPackId: "foreign", rolledBackBy: "admin@abarva.ai", reason: "test" }),
    ).rejects.toThrow(HomeKnowledgeV4ApprovalError);
  });
});

describe("listHomeKnowledgeV4CandidatesForReview", () => {
  it("returns only the latest row per tenant", async () => {
    mockRows.push(seedRow({ id: "old", tenant_key: "tenant-a", created_at: "2026-07-24T00:00:00.000Z" }));
    mockRows.push(seedRow({ id: "new", tenant_key: "tenant-a", created_at: "2026-07-25T00:00:00.000Z" }));
    mockRows.push(seedRow({ id: "b1", tenant_key: "tenant-b", created_at: "2026-07-25T00:00:00.000Z" }));
    const result = await listHomeKnowledgeV4CandidatesForReview();
    expect(result).toHaveLength(2);
    expect(result.find((r) => r.tenant_key === "tenant-a")!.id).toBe("new");
    expect(result.find((r) => r.tenant_key === "tenant-b")!.id).toBe("b1");
  });
});

describe("listHomeKnowledgeV4PackHistoryForTenant", () => {
  it("returns full history for a tenant, newest first, isolated from other tenants", async () => {
    mockRows.push(seedRow({ id: "a-old", tenant_key: "tenant-a", created_at: "2026-07-24T00:00:00.000Z" }));
    mockRows.push(seedRow({ id: "a-new", tenant_key: "tenant-a", created_at: "2026-07-25T00:00:00.000Z" }));
    mockRows.push(seedRow({ id: "b1", tenant_key: "tenant-b", created_at: "2026-07-25T00:00:00.000Z" }));
    const result = await listHomeKnowledgeV4PackHistoryForTenant("tenant-a");
    expect(result.map((r) => r.id)).toEqual(["a-new", "a-old"]);
  });
});

describe("getHomeKnowledgeV4LatestCandidateRenderPack", () => {
  it("returns the latest candidate's full render_pack for the requested tenant", async () => {
    mockRows.push(
      seedRow({
        id: "sky-old",
        tenant_key: "skyharbor-air",
        created_at: "2026-07-25T00:00:00.000Z",
        render_pack: { tenant: { canonical_key: "skyharbor-air" }, dimensions: [], version: "old" },
      }),
    );
    mockRows.push(
      seedRow({
        id: "sky-new",
        tenant_key: "skyharbor-air",
        created_at: "2026-07-26T00:00:00.000Z",
        pack_version: "home-pack-v4-book-skyharbor-air-new",
        validation_status: "candidate_review_ready",
        quality_report: { violations: [] },
        render_pack: { tenant: { canonical_key: "skyharbor-air" }, dimensions: [{ dimension_key: "apps" }], version: "new" },
      }),
    );
    const result = await getHomeKnowledgeV4LatestCandidateRenderPack("skyharbor-air");
    expect(result?.id).toBe("sky-new");
    expect(result?.pack_version).toBe("home-pack-v4-book-skyharbor-air-new");
    expect((result?.render_pack as { version: string }).version).toBe("new");
    expect(result?.violations).toEqual([]);
  });

  it("returns null when no row exists for the tenant, rather than another tenant's data", async () => {
    mockRows.push(
      seedRow({ id: "other", tenant_key: "meridian-health", render_pack: { tenant: { canonical_key: "meridian-health" }, dimensions: [] } }),
    );
    const result = await getHomeKnowledgeV4LatestCandidateRenderPack("skyharbor-air");
    expect(result).toBeNull();
  });

  it("surfaces validation_status and finding count from the real row", async () => {
    mockRows.push(
      seedRow({
        id: "failed-row",
        tenant_key: "skyharbor-air",
        status: "candidate",
        validation_status: "candidate_failed",
        quality_report: { violations: [{ type: "x", message: "y" }] },
        render_pack: { tenant: { canonical_key: "skyharbor-air" }, dimensions: [] },
      }),
    );
    const result = await getHomeKnowledgeV4LatestCandidateRenderPack("skyharbor-air");
    expect(result?.validation_status).toBe("candidate_failed");
    expect(result?.violations).toHaveLength(1);
  });
});
