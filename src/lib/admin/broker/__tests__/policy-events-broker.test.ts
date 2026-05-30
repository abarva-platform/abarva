/**
 * Policy Events broker contract tests · Wave 2 PR-3
 *
 * Verifies:
 *   • Empty tenant (no client id) → [].
 *   • Empty query result → [].
 *   • Row mapping (action, actor, target, ts, reason clamping).
 *   • Null `actor_label` → `actor: 'system'`.
 *   • `missingTable: 'empty'` is honored (table missing → [] not throw).
 *   • Client-resolve error → [] with structured warn.
 *   • Query error → [] with structured warn.
 *   • Column allow-list: `prior_policy`, `new_policy`, `actor_id` are
 *     NEVER selected (payload-fingerprint safety).
 *   • `sinceIso` override is passed through to the where clause.
 */

import { getRecentPolicyEvents } from "../policy-events-broker";
import { azureRead } from "@/lib/data-plane/azureRead";
import * as helpers from "@/lib/admin/data/admin-db-helpers";

jest.mock("@/lib/data-plane/azureRead", () => ({
  azureRead: {
    select: jest.fn(),
    maybeSingle: jest.fn(),
    count: jest.fn(),
    query: jest.fn(),
    withSession: jest.fn(),
  },
}));

jest.mock("@/lib/admin/data/admin-db-helpers", () => ({
  resolveClientId: jest.fn(),
}));

const selectMock = azureRead.select as jest.MockedFunction<
  typeof azureRead.select
>;
const resolveClientIdMock = helpers.resolveClientId as jest.MockedFunction<
  typeof helpers.resolveClientId
>;

interface FakeRow {
  id: string;
  tenant_id: string;
  actor_label: string | null;
  reason: string;
  created_at: string | Date;
}

function row(overrides: Partial<FakeRow> = {}): FakeRow {
  return {
    id: overrides.id ?? "pol-1",
    tenant_id: overrides.tenant_id ?? "client-uuid-1",
    // Use 'actor_label' in overrides to explicitly set; falls back to
    // default when key absent. null is preserved via the `'actor_label' in`
    // check so callers can test the "null actor → 'system'" path.
    actor_label:
      "actor_label" in overrides
        ? (overrides.actor_label ?? null)
        : "Admin · CIO",
    reason: overrides.reason ?? "Tightened external AI egress.",
    created_at: overrides.created_at ?? "2026-05-30T09:00:00Z",
  };
}

describe("getRecentPolicyEvents", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    resolveClientIdMock.mockResolvedValue("client-uuid-1");
  });

  it("returns [] when the tenant cannot be resolved", async () => {
    resolveClientIdMock.mockResolvedValue(null);
    const events = await getRecentPolicyEvents("unknown-tenant");
    expect(events).toEqual([]);
    expect(selectMock).not.toHaveBeenCalled();
  });

  it("returns [] when the resolve helper throws (with structured warn)", async () => {
    resolveClientIdMock.mockRejectedValue(new Error("db down"));
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const events = await getRecentPolicyEvents("apex-retail");
    expect(events).toEqual([]);
    expect(warnSpy).toHaveBeenCalled();
    expect(String(warnSpy.mock.calls[0]?.[0])).toMatch(
      /policy_events\.client_resolve_failed/,
    );
    warnSpy.mockRestore();
  });

  it("returns [] when the query result is empty", async () => {
    selectMock.mockResolvedValue([]);
    const events = await getRecentPolicyEvents("apex-retail");
    expect(events).toEqual([]);
  });

  it("maps rows to PolicyEvent shape with action, actor, target, ts", async () => {
    selectMock.mockResolvedValue([
      row({
        id: "pol-A",
        actor_label: "Priya Sharma",
        reason: "Allowed Claude for confidential tier.",
        created_at: "2026-05-30T10:30:00Z",
      }),
    ]);

    const events = await getRecentPolicyEvents("apex-retail");
    expect(events).toEqual([
      {
        id: "pol-A",
        ts: "2026-05-30T10:30:00Z",
        actor: "Priya Sharma",
        action: "policy updated",
        target: "apex-retail",
        reason: "Allowed Claude for confidential tier.",
      },
    ]);
  });

  it("falls back to actor=system when actor_label is null", async () => {
    selectMock.mockResolvedValue([row({ actor_label: null })]);
    const [event] = await getRecentPolicyEvents("apex-retail");
    expect(event.actor).toBe("system");
  });

  it("clamps overly long reason strings to keep ribbon payload bounded", async () => {
    const huge = "x".repeat(1000);
    selectMock.mockResolvedValue([row({ reason: huge })]);
    const [event] = await getRecentPolicyEvents("apex-retail");
    expect(event.reason.length).toBeLessThanOrEqual(280);
    expect(event.reason.endsWith("…")).toBe(true);
  });

  it("NEVER selects prior_policy / new_policy / actor_id (payload-safety)", async () => {
    selectMock.mockResolvedValue([]);
    await getRecentPolicyEvents("apex-retail");

    expect(selectMock).toHaveBeenCalledTimes(1);
    const args = selectMock.mock.calls[0][0];
    const columns = args.columns as ReadonlyArray<string>;
    expect(columns).toEqual([
      "id",
      "tenant_id",
      "actor_label",
      "reason",
      "created_at",
    ]);
    expect(columns).not.toContain("prior_policy");
    expect(columns).not.toContain("new_policy");
    expect(columns).not.toContain("actor_id");
  });

  it("queries tenant_policy_audit with missingTable empty", async () => {
    selectMock.mockResolvedValue([]);
    await getRecentPolicyEvents("apex-retail");
    const args = selectMock.mock.calls[0][0];
    expect(args.table).toBe("tenant_policy_audit");
    expect(args.missingTable).toBe("empty");
    expect(args.orderBy).toEqual({ column: "created_at", direction: "desc" });
    expect(args.where?.tenant_id).toBe("client-uuid-1");
  });

  it("returns [] AND warns when the query throws", async () => {
    selectMock.mockRejectedValue(
      new Error("relation tenant_policy_audit blocked"),
    );
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    const events = await getRecentPolicyEvents("apex-retail");
    expect(events).toEqual([]);
    expect(warnSpy).toHaveBeenCalled();
    expect(String(warnSpy.mock.calls[0]?.[0])).toMatch(
      /policy_events\.query_failed/,
    );

    warnSpy.mockRestore();
  });

  it("passes the sinceIso override through to the where clause", async () => {
    selectMock.mockResolvedValue([]);
    await getRecentPolicyEvents("apex-retail", "2026-05-01T00:00:00Z");
    const args = selectMock.mock.calls[0][0];
    expect(args.where?.created_at).toEqual({
      op: "gte",
      value: "2026-05-01T00:00:00Z",
    });
  });

  it("returns multiple rows preserving DB sort order (created_at desc)", async () => {
    selectMock.mockResolvedValue([
      row({ id: "a", created_at: "2026-05-30T11:00:00Z" }),
      row({ id: "b", created_at: "2026-05-30T09:30:00Z" }),
      row({ id: "c", created_at: "2026-05-30T07:15:00Z" }),
    ]);
    const events = await getRecentPolicyEvents("apex-retail");
    expect(events.map((e) => e.id)).toEqual(["a", "b", "c"]);
  });

  it("serializes pg Date created_at values before returning events", async () => {
    selectMock.mockResolvedValue([
      row({ id: "date-row", created_at: new Date("2026-05-30T13:15:00.000Z") }),
    ]);

    const [event] = await getRecentPolicyEvents("apex-retail");

    expect(event.ts).toBe("2026-05-30T13:15:00.000Z");
  });
});
