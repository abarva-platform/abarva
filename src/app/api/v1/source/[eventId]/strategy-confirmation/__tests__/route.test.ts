import { strategyConfirmationVersion } from "@/lib/source/strategy-confirmation";

const event = {
  id: "event-1",
  client_key: "tenant-1",
  current_stage_key: "strategy",
  approval_policy_code: "self_v1",
  created_by_user_id: "owner-1",
  decision_owner: "Event Owner",
  trigger_description: "Synthetic renewal planning",
  scope_description: "Scope boundary: Planning scope only\nValue target: Hypothetical service improvement",
  estimated_value_usd: null,
  updated_at: "2026-09-28T12:00:00.123Z",
};

let persistedEvent = { ...event };
let actorId = "owner-1";
let canApprove = true;
let activityWriteError: string | null = null;
const activityRows: Array<Record<string, unknown>> = [];

jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: jest.fn(async () => ({ userId: actorId, role: "client_admin" })),
  tenancyErrorResponse: jest.fn(() => Response.json({ error: "unauthorized" }, { status: 401 })),
}));
jest.mock("@/lib/active-client", () => ({
  getActiveClientRow: jest.fn(async () => ({ key: "tenant-1" })),
}));
jest.mock("@/lib/auth/current-user", () => ({
  getCurrentUser: jest.fn(async () => ({ personId: actorId, name: "Event Owner", primaryRole: "client_admin" })),
}));
jest.mock("@/lib/auth/source-access-policy", () => ({
  loadUserSourceAccessPolicy: jest.fn(async () => ({ canApproveSourceStages: canApprove, accessLevel: "event_owner" })),
}));
jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureWriteFluentClient: jest.fn(() => ({
    from: (table: string) => {
      const filters: Record<string, unknown> = {};
      let insertPayload: Record<string, unknown> | null = null;
      const chain = {
        select: () => chain,
        eq: (key: string, value: unknown) => { filters[key] = value; return chain; },
        order: () => chain,
        limit: () => chain,
        insert: (value: Record<string, unknown>) => { insertPayload = value; return chain; },
        maybeSingle: async () => table === "source_events"
          ? { data: persistedEvent.id === filters.id && persistedEvent.client_key === filters.client_key ? persistedEvent : null, error: null }
          : { data: null, error: null },
        single: async () => {
          if (table === "source_event_activity" && insertPayload) {
            if (activityWriteError) return { data: null, error: { message: activityWriteError } };
            activityRows.push(insertPayload);
            return { data: { id: "receipt-1", ...insertPayload }, error: null };
          }
          return { data: null, error: null };
        },
      };
      return chain;
    },
  })),
}));

import { POST } from "../route";

function request(version: string): import("next/server").NextRequest {
  return { json: async () => ({ version, confirmed: true }) } as import("next/server").NextRequest;
}

const ctx = { params: Promise.resolve({ eventId: "event-1" }) };

beforeEach(() => {
  persistedEvent = { ...event };
  actorId = "owner-1";
  canApprove = true;
  activityWriteError = null;
  activityRows.length = 0;
});

describe("POST Strategy Event Owner confirmation", () => {
  it("records the current owner decision, not a sponsor sign-off or stage approval", async () => {
    const response = await POST(request(strategyConfirmationVersion(event)), ctx);
    expect(response.status).toBe(200);
    expect(activityRows).toHaveLength(1);
    expect(activityRows[0]).toMatchObject({
      event_id: "event-1", client_key: "tenant-1", actor_user_id: "owner-1",
      action_type: "strategy_owner_confirmed", stage_key: "strategy",
      metadata: { version: strategyConfirmationVersion(event) },
    });
    expect(activityRows[0].action_label).toBe("Event Owner confirmed current strategy basis");
    expect(activityRows[0].metadata).toMatchObject({ decision: "event_owner_strategy_confirmation" });
  });

  it("rejects a changed mandate without writing a decision", async () => {
    const shownVersion = strategyConfirmationVersion(event);
    persistedEvent.trigger_description = "Changed mandate after page render";
    const response = await POST(request(shownVersion), ctx);
    expect(response.status).toBe(409);
    expect(activityRows).toEqual([]);
  });

  it("does not confirm a placeholder mandate or value thesis", async () => {
    persistedEvent.trigger_description = "";
    persistedEvent.scope_description = "";
    persistedEvent.decision_owner = "";
    const response = await POST(request(strategyConfirmationVersion(persistedEvent)), ctx);
    expect(response.status).toBe(409);
    expect(activityRows).toEqual([]);
  });

  it("does not disclose or write another tenant's event", async () => {
    persistedEvent.client_key = "other-tenant";
    const response = await POST(request(strategyConfirmationVersion(event)), ctx);
    expect(response.status).toBe(404);
    expect(activityRows).toEqual([]);
  });

  it("requires an explicit confirmed action on the active Strategy stage", async () => {
    const unconfirmed = { json: async () => ({ version: strategyConfirmationVersion(event), confirmed: false }) } as import("next/server").NextRequest;
    expect((await POST(unconfirmed, ctx)).status).toBe(400);
    persistedEvent.current_stage_key = "scope";
    expect((await POST(request(strategyConfirmationVersion(event)), ctx)).status).toBe(409);
    expect(activityRows).toEqual([]);
  });

  it("rejects a different actor and a denied approver", async () => {
    actorId = "other-1";
    expect((await POST(request(strategyConfirmationVersion(event)), ctx)).status).toBe(403);
    actorId = "owner-1";
    canApprove = false;
    expect((await POST(request(strategyConfirmationVersion(event)), ctx)).status).toBe(403);
    expect(activityRows).toEqual([]);
  });

  it("does not relax a historical strict-policy event", async () => {
    persistedEvent.approval_policy_code = "legacy_signed_scope_v1";
    const response = await POST(request(strategyConfirmationVersion(persistedEvent)), ctx);
    expect(response.status).toBe(403);
    expect(activityRows).toEqual([]);
  });

  it("fails closed when the append-only decision cannot be saved", async () => {
    activityWriteError = "database unavailable";
    const response = await POST(request(strategyConfirmationVersion(event)), ctx);
    expect(response.status).toBe(500);
    expect(activityRows).toEqual([]);
  });
});
