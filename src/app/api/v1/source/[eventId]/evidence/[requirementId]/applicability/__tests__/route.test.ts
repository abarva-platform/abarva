import type { NextRequest } from "next/server";

const tenancy = { clientId: "client", clientKey: "test-tenant", userId: "owner-1", role: "client_admin" };
const currentUser = { personId: "owner-1", clerkUserId: "owner-1", email: "owner@example.test", metadataClientKey: "test-tenant" };
const access = { canApproveSourceStages: true, accessLevel: "client_admin" };
const writes: Array<Record<string, unknown>> = [];
let eventClientKey = "test-tenant";
let evidenceState = "Not Requested";
let sourceArtifactId: string | null = null;
let schemaAvailable = true;
let concurrentUpdate = false;
let eventCreatedBy = "owner-1";
const exactUpdatedAt = "2026-09-28 00:00:00.123456+00";
const roundedUpdatedAt = new Date("2026-09-28T00:00:00.123Z");

function stateRow() {
  return {
    id: "evidence-1", source_event_id: "event-1", tenant_key: "test-tenant",
    requirement_id: "EVID-SRC-STR-INCUMBENT", stage_key: "strategy",
    current_state: evidenceState, source_artifact_id: sourceArtifactId,
    ...(schemaAvailable ? { applicability_status: "applicable" } : {}),
    updated_at: roundedUpdatedAt,
  };
}

jest.mock("@/lib/auth/tenancy", () => ({ requireTenancy: jest.fn(async () => tenancy), tenancyErrorResponse: jest.fn(() => Response.json({ error: "tenancy" }, { status: 403 })) }));
jest.mock("@/lib/active-client", () => ({ getActiveClientRow: jest.fn(async () => ({ id: "client", key: "test-tenant" })) }));
jest.mock("@/lib/auth/current-user", () => ({ getCurrentUser: jest.fn(async () => currentUser) }));
jest.mock("@/lib/auth/source-access-policy", () => ({ loadUserSourceAccessPolicy: jest.fn(async () => access) }));
jest.mock("@/lib/data-plane/postgresCompat", () => ({ getAzureWriteFluentClient: jest.fn(() => db()) }));
jest.mock("@/lib/data-plane/azureRead", () => ({ azureRead: {
  query: jest.fn(async () => [{ ...stateRow(), updated_at_exact: exactUpdatedAt }]),
} }));

import { POST } from "../route";
import { azureRead } from "@/lib/data-plane/azureRead";

function db() {
  return {
    from(table: string) {
      let payload: Record<string, unknown> | null = null;
      let updateVersion: unknown;
      const query = {
        select: () => query,
        eq: (column: string, value: unknown) => {
          if (payload && column === "updated_at") updateVersion = value;
          return query;
        },
        update: (next: Record<string, unknown>) => { payload = next; writes.push({ table, ...next }); return query; },
        maybeSingle: async () => ({
          data: table === "source_events"
            ? { id: "event-1", client_key: eventClientKey, current_stage_key: "strategy", lifecycle_state: "active", created_by_user_id: eventCreatedBy }
            : table === "source_event_evidence_states"
              ? payload && (concurrentUpdate || updateVersion !== exactUpdatedAt) ? null
              : { ...stateRow(), ...payload }
              : null,
          error: null,
        }),
        single: async () => ({ data: payload ? { id: "evidence-1", ...payload } : null, error: null }),
      };
      return query;
    },
  };
}

function request(body: unknown): NextRequest {
  return { json: async () => body } as unknown as NextRequest;
}

function ctx(requirementId = "EVID-SRC-STR-INCUMBENT") {
  return { params: Promise.resolve({ eventId: "event-1", requirementId }) };
}

beforeEach(() => {
  jest.clearAllMocks();
  writes.length = 0;
  eventClientKey = "test-tenant";
  evidenceState = "Not Requested";
  sourceArtifactId = null;
  schemaAvailable = true;
  concurrentUpdate = false;
  eventCreatedBy = "owner-1";
  access.canApproveSourceStages = true;
  access.accessLevel = "client_admin";
  tenancy.userId = "owner-1";
});

describe("Source requirement applicability decision", () => {
  const reason = "No incumbent exists for this net-new service; no agreement can be supplied.";

  it("records a specific accountable absence despite a microsecond database version", async () => {
    const response = await POST(request({ decision: "not_applicable", reason, confirmsAbsence: true }), ctx());
    expect(response.status).toBe(200);
    expect(writes).toContainEqual(expect.objectContaining({
      table: "source_event_evidence_states",
      applicability_status: "not_applicable",
      applicability_reason: reason,
      applicability_actor_user_id: "owner-1",
    }));
    expect(writes[0]).not.toHaveProperty("current_state", "Available");
    expect(azureRead.query).toHaveBeenCalledWith(
      expect.stringMatching(/updated_at::text AS updated_at_exact[\s\S]*tenant_key = \$3/),
      ["event-1", "EVID-SRC-STR-INCUMBENT", "test-tenant"],
    );
  });

  it("refuses an unrelated requirement before any write", async () => {
    const response = await POST(request({ decision: "not_applicable", reason, confirmsAbsence: true }), ctx("EVID-SRC-STR-SPONSOR-COMMIT"));
    expect(response.status).toBe(422);
    expect(writes).toEqual([]);
  });

  it("requires an explicit confirmation and substantial reason", async () => {
    const response = await POST(request({ decision: "not_applicable", reason: "No spend", confirmsAbsence: false }), ctx());
    expect(response.status).toBe(400);
    expect(writes).toEqual([]);
  });

  it("refuses another tenant and a row with an existing source artifact", async () => {
    eventClientKey = "another-tenant";
    expect((await POST(request({ decision: "not_applicable", reason, confirmsAbsence: true }), ctx())).status).toBe(404);
    eventClientKey = "test-tenant";
    sourceArtifactId = "artifact-1";
    expect((await POST(request({ decision: "not_applicable", reason, confirmsAbsence: true }), ctx())).status).toBe(409);
    expect(writes).toEqual([]);
  });

  it("refuses a non-approver and a stale evidence row", async () => {
    access.canApproveSourceStages = false;
    expect((await POST(request({ decision: "not_applicable", reason, confirmsAbsence: true }), ctx())).status).toBe(403);
    access.canApproveSourceStages = true;
    evidenceState = "Available";
    expect((await POST(request({ decision: "not_applicable", reason, confirmsAbsence: true }), ctx())).status).toBe(409);
    expect(writes).toEqual([]);
  });

  it("fails closed before the applicability schema is present", async () => {
    schemaAvailable = false;
    const response = await POST(request({ decision: "not_applicable", reason, confirmsAbsence: true }), ctx());
    expect(response.status).toBe(503);
    expect(writes).toEqual([]);
  });

  it("rejects a delegated approver who is neither owner nor client admin", async () => {
    access.accessLevel = "event_contributor";
    eventCreatedBy = "another-user";
    const response = await POST(request({ decision: "not_applicable", reason, confirmsAbsence: true }), ctx());
    expect(response.status).toBe(403);
    expect(writes).toEqual([]);
  });

  it("does not confirm a decision if the evidence row changed concurrently", async () => {
    concurrentUpdate = true;
    const response = await POST(request({ decision: "not_applicable", reason, confirmsAbsence: true }), ctx());
    expect(response.status).toBe(409);
    expect((await response.json()).error).toBe("stale_requirement");
  });
});
