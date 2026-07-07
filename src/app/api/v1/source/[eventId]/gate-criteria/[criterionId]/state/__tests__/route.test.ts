const tenancy = {
  clientId: "client-1",
  clientKey: "skyharbor-air",
  userId: "clerk-user-1",
  role: "maestro",
};

const currentUser = {
  personId: "person-1",
  clerkUserId: "clerk-user-1",
  email: "anand.sundaram+skyharbor@thesundaram.com",
  name: "Anand Sundaram",
  primaryRole: "maestro",
  metadataClientKey: "skyharbor-air",
};

const criterionRow = {
  id: "crit-row-1",
  source_event_id: "evt-1",
  tenant_key: "skyharbor-air",
  criterion_id: "GATE-SCOPE-02",
  from_stage: "scope",
  to_stage: "rfp",
  state: "pending",
  reviewer_user_id: null,
  reviewed_at: null,
  notes: null,
  evidence_artifact_ids: [],
  waiver_approval_id: null,
  created_at: "2026-06-16T00:00:00.000Z",
  updated_at: "2026-06-16T00:00:00.000Z",
};

const writeAdapter = {
  insertCriterionApproval: jest.fn(async () => ({
    ok: true,
    data: { id: "approval-1" },
  })),
  updateGateCriterion: jest.fn(async (input) => ({
    ok: true,
    data: {
      ...criterionRow,
      state: input.state,
      reviewer_user_id: input.reviewerUserId,
      reviewed_at: input.reviewedAtIso,
      notes: input.notes ?? null,
      waiver_approval_id: input.waiverApprovalId ?? null,
      updated_at: input.updatedAtIso,
    },
  })),
  insertActivityLog: jest.fn(async () => ({ ok: true })),
};
const emitSourceApprovalNotificationBestEffort = jest.fn();

jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: jest.fn(async () => tenancy),
  tenancyErrorResponse: jest.fn(() => {
    throw new Error("tenancy error");
  }),
}));

jest.mock("@/lib/active-client", () => ({
  getActiveClientRow: jest.fn(async () => ({ key: "skyharbor-air" })),
}));

jest.mock("@/lib/auth/current-user", () => ({
  getCurrentUser: jest.fn(async () => currentUser),
}));

jest.mock("@/lib/auth/source-access-policy", () => ({
  loadUserSourceAccessPolicy: jest.fn(async () => ({
    canApproveSourceStages: true,
  })),
}));

jest.mock("@/lib/auth/gate-approval-strict-mode", () => ({
  isGateApprovalStrictMode: jest.fn(() => false),
  isStrictModeApprovalRole: jest.fn(() => true),
}));

jest.mock("@/lib/source/queries", () => ({
  scaffoldNewEventSubstrate: jest.fn(async () => undefined),
}));

jest.mock("@/lib/data-plane/write-adapters/sourceWriteAdapter", () => ({
  selectSourceWriteAdapter: jest.fn(() => writeAdapter),
}));

jest.mock("@/lib/source/approval-notifications", () => ({
  emitSourceApprovalNotificationBestEffort: (...args: unknown[]) =>
    emitSourceApprovalNotificationBestEffort(...args),
}));

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureReadFluentClient: jest.fn(() => fakeFluentClient()),
}));

import { PATCH } from "../route";

function fakeFluentClient() {
  return {
    from(table: string) {
      const filters: Record<string, unknown> = {};
      const chain: Record<string, unknown> = {
        select: () => chain,
        eq: (key: string, value: unknown) => {
          filters[key] = value;
          return chain;
        },
        maybeSingle: async () => {
          if (table === "source_events") {
            return {
              data: {
                id: "evt-1",
                client_key: "skyharbor-air",
                event_name: "SkyHarbor Air Managed Services",
                event_code: "SKYH-MANAGED-SERVICES",
                decision_owner: "Tomas Singh",
                created_by_user_id: "clerk-user-1",
              },
              error: null,
            };
          }
          if (table === "source_event_gate_criterion_states") {
            return {
              data:
                filters.criterion_id === "GATE-SCOPE-02"
                  ? criterionRow
                  : null,
              error: null,
            };
          }
          return { data: null, error: null };
        },
      };
      chain.then = (resolve: (value: unknown) => unknown) =>
        resolve({ data: [], error: null });
      return chain;
    },
  };
}

function request(body: unknown): import("next/server").NextRequest {
  return {
    json: async () => body,
  } as unknown as import("next/server").NextRequest;
}

const ctx = {
  params: Promise.resolve({
    eventId: "evt-1",
    criterionId: "GATE-SCOPE-02",
  }),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("PATCH Source gate criterion state", () => {
  it("rejects waived without a human reason", async () => {
    const res = await PATCH(request({ state: "waived", reason: "short" }), ctx);
    expect(res.status).toBe(409);
    const json = (await res.json()) as { error?: string };
    expect(json.error).not.toBe("waiver_required");
    expect(writeAdapter.insertCriterionApproval).not.toHaveBeenCalled();
  });

  it("accepts waived when an approval record can be created", async () => {
    const res = await PATCH(
      request({
        state: "waived",
        reason: "Sponsor reviewed scope package and approved waiver.",
      }),
      ctx,
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as Record<string, unknown>;
    expect(json.ok).toBe(true);
    expect(writeAdapter.insertCriterionApproval).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: "evt-1",
        approvalAction: "stage_advance",
        approvedByUserId: "person-1",
        fromState: "pending",
        toState: "waived",
      }),
    );
    expect(writeAdapter.updateGateCriterion).toHaveBeenCalledWith(
      expect.objectContaining({
        criterionRowId: "crit-row-1",
        state: "waived",
        waiverApprovalId: "approval-1",
      }),
    );
    expect(emitSourceApprovalNotificationBestEffort).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantKey: "skyharbor-air",
        eventType: "source.approval_needed",
        targetResourceId: "evt-1",
      }),
    );
  });

  it("rejects waived when the approval record cannot be created", async () => {
    writeAdapter.insertCriterionApproval.mockResolvedValueOnce({
      ok: false,
      error: "db unavailable",
    } as never);
    const res = await PATCH(
      request({
        state: "waived",
        reason: "Sponsor reviewed scope package and approved waiver.",
      }),
      ctx,
    );
    expect(res.status).toBe(500);
    const json = (await res.json()) as { error?: string };
    expect(json.error).toBe("approval_record_failed");
    expect(writeAdapter.updateGateCriterion).not.toHaveBeenCalled();
  });
});
