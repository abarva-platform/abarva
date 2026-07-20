const getProgramByIdMock = jest.fn();
const fromMock = jest.fn();

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  __esModule: true,
  getAzureWriteFluentClient: () => ({ from: fromMock }),
}));

jest.mock("../queries", () => ({
  __esModule: true,
  getProgramById: (...args: unknown[]) => getProgramByIdMock(...args),
}));

import {
  getRoleApprovalSummary,
  recordRoleApprovalDecision,
  requiredApprovalRolesFor,
  REQUIRED_APPROVAL_ROLES,
  APPROVAL_ROLE_LABELS,
} from "../deliverable-role-approvals";
import { DELIVERABLE_REGISTRY } from "../deliverable-registry";

const CTX = { clientId: "client-1", userId: "person-1", email: "approver@example.com" };

function selectApprovals(rows: unknown[]) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockResolvedValue({ data: rows, error: null }),
  };
}

function selectDeliverableExists(result: unknown) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue(result),
  };
}

describe("REQUIRED_APPROVAL_ROLES registry", () => {
  it("requires business+finance for a business case, technology+risk_security for a target state architecture", () => {
    expect(requiredApprovalRolesFor("business_case")).toEqual(["business", "finance"]);
    expect(requiredApprovalRolesFor("target_state_architecture")).toEqual([
      "technology",
      "risk_security",
    ]);
  });

  it("requires no roles for an artifact type absent from the registry — existing single-actor sign-off is unaffected", () => {
    expect(requiredApprovalRolesFor("charter")).toEqual([]);
    expect(requiredApprovalRolesFor("some_future_type")).toEqual([]);
  });

  it("has a human-readable label for every role referenced by the registry", () => {
    for (const role of REQUIRED_APPROVAL_ROLES.business_case ?? []) {
      expect(APPROVAL_ROLE_LABELS[role]).toBeTruthy();
    }
    expect(APPROVAL_ROLE_LABELS.risk_security).toBe("Risk/security approver");
  });

  it("every key matches a real deliverableTypeKey in deliverable-registry.ts — the same key space actually written to deliverables_v2.deliverable_type_key", () => {
    // Regression guard: an earlier version of this registry keyed the
    // operating-model entry as "operating_model" (the orchestrator's
    // internal mapped name from orchestrated-deliverable-map.ts) instead of
    // the registry's real "operating_model_design" key that deliverables_v2
    // rows are actually written with — silently making that type never
    // require any role approval. Every key here must exist verbatim in
    // DELIVERABLE_REGISTRY.
    const realKeys = new Set(DELIVERABLE_REGISTRY.map((spec) => spec.deliverableTypeKey));
    for (const key of Object.keys(REQUIRED_APPROVAL_ROLES)) {
      expect(realKeys.has(key)).toBe(true);
    }
  });

  it("requires business+technology for the real operating-model-design registry key", () => {
    expect(requiredApprovalRolesFor("operating_model_design")).toEqual(["business", "technology"]);
    // The orchestrator-mapped name is NOT the key deliverables_v2 stores.
    expect(requiredApprovalRolesFor("operating_model")).toEqual([]);
  });
});

describe("getRoleApprovalSummary", () => {
  beforeEach(() => {
    fromMock.mockReset();
    getProgramByIdMock.mockReset();
    getProgramByIdMock.mockResolvedValue({ id: "move-1" });
  });

  it("synthesizes 'pending' for required roles with no recorded decision yet", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "deliverable_role_approvals") return selectApprovals([]);
      throw new Error(`Unexpected table ${table}`);
    });

    const summary = await getRoleApprovalSummary(
      CTX,
      "move-1",
      "deliverable-1",
      "business_case",
    );

    expect(summary.requiredRoles).toEqual(["business", "finance"]);
    expect(summary.records).toEqual([
      expect.objectContaining({ role: "business", status: "pending" }),
      expect.objectContaining({ role: "finance", status: "pending" }),
    ]);
    expect(summary.allRequiredApproved).toBe(false);
    expect(summary.anyRejected).toBe(false);
  });

  it("reports allRequiredApproved only when EVERY required role is approved", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "deliverable_role_approvals")
        return selectApprovals([
          {
            role: "business",
            status: "approved",
            approver_user_id: "person-1",
            approver_name: "Jane Doe, CFO",
            outstanding_conditions: null,
            decided_at: "2026-07-20T00:00:00Z",
          },
          {
            role: "finance",
            status: "reviewed",
            approver_user_id: "person-2",
            approver_name: null,
            outstanding_conditions: "Awaiting FY26 budget confirmation",
            decided_at: null,
          },
        ]);
      throw new Error(`Unexpected table ${table}`);
    });

    const partial = await getRoleApprovalSummary(CTX, "move-1", "deliverable-1", "business_case");
    expect(partial.allRequiredApproved).toBe(false);

    fromMock.mockImplementation((table: string) => {
      if (table === "deliverable_role_approvals")
        return selectApprovals([
          {
            role: "business",
            status: "approved",
            approver_user_id: "person-1",
            approver_name: "Jane Doe, CFO",
            outstanding_conditions: null,
            decided_at: "2026-07-20T00:00:00Z",
          },
          {
            role: "finance",
            status: "approved",
            approver_user_id: "person-2",
            approver_name: "John Smith, CFO",
            outstanding_conditions: null,
            decided_at: "2026-07-20T00:05:00Z",
          },
        ]);
      throw new Error(`Unexpected table ${table}`);
    });
    const full = await getRoleApprovalSummary(CTX, "move-1", "deliverable-1", "business_case");
    expect(full.allRequiredApproved).toBe(true);
  });

  it("flags anyRejected when a required role is explicitly rejected", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "deliverable_role_approvals")
        return selectApprovals([
          {
            role: "technology",
            status: "rejected",
            approver_user_id: "person-3",
            approver_name: "Enterprise Architect",
            outstanding_conditions: "Guardrail gap on data residency",
            decided_at: "2026-07-20T00:10:00Z",
          },
        ]);
      throw new Error(`Unexpected table ${table}`);
    });
    const summary = await getRoleApprovalSummary(
      CTX,
      "move-1",
      "deliverable-1",
      "target_state_architecture",
    );
    expect(summary.anyRejected).toBe(true);
    expect(summary.allRequiredApproved).toBe(false);
  });

  it("returns an empty required set for an artifact type with no role requirement", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "deliverable_role_approvals") return selectApprovals([]);
      throw new Error(`Unexpected table ${table}`);
    });
    const summary = await getRoleApprovalSummary(CTX, "move-1", "deliverable-1", "charter");
    expect(summary.requiredRoles).toEqual([]);
    expect(summary.allRequiredApproved).toBe(false); // vacuous requirement is never "satisfied", just moot
  });
});

describe("recordRoleApprovalDecision", () => {
  beforeEach(() => {
    fromMock.mockReset();
    getProgramByIdMock.mockReset();
    getProgramByIdMock.mockResolvedValue({ id: "move-1" });
  });

  it("upserts a role decision keyed on (deliverable_id, role)", async () => {
    let upsertPayload: { decided_at: string | null } | null = null;
    fromMock.mockImplementation((table: string) => {
      if (table === "deliverables_v2") return selectDeliverableExists({ data: { id: "deliverable-1" }, error: null });
      if (table === "deliverable_role_approvals") {
        return {
          upsert: jest.fn((payload, opts) => {
            upsertPayload = payload;
            expect(opts).toEqual({ onConflict: "deliverable_id,role" });
            return {
              select: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: {
                  role: payload.role,
                  status: payload.status,
                  approver_user_id: payload.approver_user_id,
                  approver_name: payload.approver_name,
                  outstanding_conditions: payload.outstanding_conditions,
                  decided_at: payload.decided_at,
                },
                error: null,
              }),
            };
          }),
        };
      }
      throw new Error(`Unexpected table ${table}`);
    });

    const record = await recordRoleApprovalDecision(CTX, "move-1", "deliverable-1", {
      role: "finance",
      status: "approved",
      approverName: "Jane Doe, CFO",
    });

    expect(record).toEqual(
      expect.objectContaining({ role: "finance", status: "approved", approverName: "Jane Doe, CFO" }),
    );
    expect(upsertPayload).toEqual(
      expect.objectContaining({
        deliverable_id: "deliverable-1",
        role: "finance",
        status: "approved",
        approver_user_id: "person-1",
        approver_name: "Jane Doe, CFO",
      }),
    );
    // approved/rejected decisions stamp decided_at; pending/reviewed do not
    expect(upsertPayload!.decided_at).toBeTruthy();
  });

  it("does not stamp decided_at for a 'reviewed' (non-terminal) decision", async () => {
    let upsertPayload: { decided_at: string | null } | null = null;
    fromMock.mockImplementation((table: string) => {
      if (table === "deliverables_v2") return selectDeliverableExists({ data: { id: "deliverable-1" }, error: null });
      if (table === "deliverable_role_approvals") {
        return {
          upsert: jest.fn((payload) => {
            upsertPayload = payload;
            return {
              select: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: { role: payload.role, status: payload.status, approver_user_id: payload.approver_user_id, approver_name: payload.approver_name, outstanding_conditions: payload.outstanding_conditions, decided_at: payload.decided_at },
                error: null,
              }),
            };
          }),
        };
      }
      throw new Error(`Unexpected table ${table}`);
    });

    await recordRoleApprovalDecision(CTX, "move-1", "deliverable-1", {
      role: "technology",
      status: "reviewed",
    });
    expect(upsertPayload!.decided_at).toBeNull();
  });

  it("throws when the deliverable does not exist in this program (tenancy boundary)", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "deliverables_v2") return selectDeliverableExists({ data: null, error: null });
      throw new Error(`Unexpected table ${table}`);
    });
    await expect(
      recordRoleApprovalDecision(CTX, "move-1", "missing-deliverable", {
        role: "business",
        status: "approved",
      }),
    ).rejects.toThrow(/not found/i);
  });
});
