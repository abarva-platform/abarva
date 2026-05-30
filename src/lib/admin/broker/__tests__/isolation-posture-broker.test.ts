/**
 * Isolation Posture broker contract tests · Wave 2 PR-2
 *
 * Verifies:
 *   • Empty tenant (no client id) → estimated fallback.
 *   • Empty query result → zeros, evidence 'estimated' (RLS % hardcoded).
 *   • Anomaly detection (deny, error, error_message present,
 *     intended/resolved metadata mismatch).
 *   • Severity mapping (error → high, deny → med, restricted+allow → med,
 *     redact_required → low, else low).
 *   • topAnomaly picked by severity desc then ts desc.
 *   • RLS coverage is hardcoded 100 with evidence='estimated' regardless
 *     of query success.
 *   • Error path → estimated fallback + structured console.warn.
 *   • PII columns (prompt_hash, response_hash, snapshot refs) are NOT
 *     selected by the broker.
 */

import { getIsolationPosture } from "../isolation-posture-broker";
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
  user_id: string | null;
  workflow: string;
  provider: string;
  model: string | null;
  route: string;
  data_class: string;
  policy_decision: string;
  decision_reason: string;
  request_metadata: Record<string, unknown>;
  error_message: string | null;
  created_at: string | Date;
}

function row(overrides: Partial<FakeRow> = {}): FakeRow {
  return {
    id: overrides.id ?? "evt-1",
    tenant_id: overrides.tenant_id ?? "client-uuid-1",
    user_id: overrides.user_id ?? "user_clerk_1",
    workflow: overrides.workflow ?? "intelligence.ask",
    provider: overrides.provider ?? "anthropic",
    model: overrides.model ?? "claude-opus-4-7",
    route: overrides.route ?? "pre-flight",
    data_class: overrides.data_class ?? "internal",
    policy_decision: overrides.policy_decision ?? "allow",
    decision_reason: overrides.decision_reason ?? "policy allows",
    request_metadata: overrides.request_metadata ?? {},
    error_message: overrides.error_message ?? null,
    created_at: overrides.created_at ?? "2026-05-30T10:00:00Z",
  };
}

describe("getIsolationPosture", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    resolveClientIdMock.mockResolvedValue("client-uuid-1");
  });

  it("returns estimated fallback when tenant cannot be resolved", async () => {
    resolveClientIdMock.mockResolvedValue(null);
    const result = await getIsolationPosture("unknown-tenant");
    expect(result).toEqual({
      rlsCoveragePct: 100,
      tenantResolutionEvents24h: 0,
      anomaliesLast24h: 0,
      topAnomaly: null,
      recentEvents: [],
      evidence: "estimated",
    });
    // Should NOT have queried the audit table.
    expect(selectMock).not.toHaveBeenCalled();
  });

  it('returns zeros with evidence "estimated" when the audit window is empty', async () => {
    selectMock.mockResolvedValue([]);
    const result = await getIsolationPosture("apex-retail");
    expect(result.tenantResolutionEvents24h).toBe(0);
    expect(result.anomaliesLast24h).toBe(0);
    expect(result.topAnomaly).toBeNull();
    expect(result.recentEvents).toEqual([]);
    // RLS coverage is hardcoded → evidence stays estimated.
    expect(result.evidence).toBe("estimated");
    expect(result.rlsCoveragePct).toBe(100);
  });

  it("flags deny / error / error_message / metadata-mismatch as anomalies", async () => {
    selectMock.mockResolvedValue([
      row({
        id: "a",
        policy_decision: "deny",
        decision_reason: "kernel-only mode",
      }),
      row({
        id: "b",
        policy_decision: "error",
        decision_reason: "provider failed",
        error_message: "upstream 500",
      }),
      row({
        id: "c",
        policy_decision: "allow",
        error_message: "partial result",
      }),
      row({
        id: "d",
        policy_decision: "allow",
        decision_reason: "allowed",
        request_metadata: {
          intendedTenantKey: "apex-retail",
          resolvedTenantKey: "meridian-health",
        },
      }),
      // Non-anomaly: clean allow with no metadata mismatch.
      row({ id: "e", policy_decision: "allow" }),
      // Non-anomaly: redact_required (policy did its job).
      row({ id: "f", policy_decision: "redact_required" }),
    ]);

    const result = await getIsolationPosture("apex-retail");

    expect(result.tenantResolutionEvents24h).toBe(6);
    expect(result.anomaliesLast24h).toBe(4);
    const anomalies = result.recentEvents
      .filter((e) => e.anomaly)
      .map((e) => e.id);
    expect(anomalies.sort()).toEqual(["a", "b", "c", "d"]);
  });

  it("maps severity: error→high, deny→med, restricted+allow→med, redact_required→low", async () => {
    selectMock.mockResolvedValue([
      row({ id: "err", policy_decision: "error", error_message: "boom" }),
      row({ id: "deny", policy_decision: "deny" }),
      row({ id: "restr", policy_decision: "allow", data_class: "restricted" }),
      row({ id: "redact", policy_decision: "redact_required" }),
      row({ id: "allow", policy_decision: "allow", data_class: "internal" }),
    ]);
    const result = await getIsolationPosture("apex-retail");
    const sevById = Object.fromEntries(
      result.recentEvents.map((e) => [e.id, e.severity]),
    );
    expect(sevById).toEqual({
      err: "high",
      deny: "med",
      restr: "med",
      redact: "low",
      allow: "low",
    });
  });

  it("picks topAnomaly by severity desc, then ts desc", async () => {
    selectMock.mockResolvedValue([
      row({
        id: "high-old",
        policy_decision: "error",
        decision_reason: "old high",
        created_at: "2026-05-30T08:00:00Z",
        error_message: "boom",
      }),
      row({
        id: "high-new",
        policy_decision: "error",
        decision_reason: "new high",
        created_at: "2026-05-30T11:00:00Z",
        error_message: "boom",
      }),
      row({
        id: "med",
        policy_decision: "deny",
        decision_reason: "med",
        created_at: "2026-05-30T11:30:00Z",
      }),
    ]);
    const result = await getIsolationPosture("apex-retail");
    expect(result.topAnomaly).toEqual({
      id: "high-new",
      description: "new high",
      severity: "high",
      ts: "2026-05-30T11:00:00Z",
    });
  });

  it("returns estimated fallback when the query throws", async () => {
    selectMock.mockRejectedValue(new Error("connection refused"));
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const result = await getIsolationPosture("apex-retail");
    expect(result.evidence).toBe("estimated");
    expect(result.tenantResolutionEvents24h).toBe(0);
    expect(result.anomaliesLast24h).toBe(0);
    expect(warnSpy).toHaveBeenCalled();
    const logged = warnSpy.mock.calls[0]?.[0];
    expect(typeof logged).toBe("string");
    expect(logged as string).toMatch(/isolation_posture\.audit_query_failed/);
    warnSpy.mockRestore();
  });

  it("returns estimated fallback when tenant resolution throws", async () => {
    resolveClientIdMock.mockRejectedValue(new Error("clients table missing"));
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const result = await getIsolationPosture("apex-retail");
    expect(result.evidence).toBe("estimated");
    expect(selectMock).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
    const logged = warnSpy.mock.calls[0]?.[0];
    expect(logged as string).toMatch(
      /isolation_posture\.client_resolve_failed/,
    );
    warnSpy.mockRestore();
  });

  it("does NOT request payload-fingerprint columns from ai_egress_audit", async () => {
    // PII safety: prompt_hash, response_hash, prompt_snapshot_ref,
    // response_snapshot_ref must not appear in the broker's column
    // allow-list. The lane is metadata-only.
    selectMock.mockResolvedValue([]);
    await getIsolationPosture("apex-retail");
    expect(selectMock).toHaveBeenCalledTimes(1);
    const req = selectMock.mock.calls[0][0];
    const cols = (req.columns ?? []) as readonly string[];
    expect(cols).toEqual(
      expect.arrayContaining([
        "id",
        "tenant_id",
        "workflow",
        "policy_decision",
        "decision_reason",
        "created_at",
      ]),
    );
    const banned = [
      "prompt_hash",
      "response_hash",
      "prompt_snapshot_ref",
      "response_snapshot_ref",
    ];
    for (const b of banned) {
      expect(cols).not.toContain(b);
    }
    expect(req.table).toBe("ai_egress_audit");
    expect(req.missingTable).toBe("empty");
  });

  it("surfaces metadata-stamped intended/resolved tenant keys", async () => {
    selectMock.mockResolvedValue([
      row({
        id: "m",
        policy_decision: "allow",
        request_metadata: {
          intendedTenantKey: "apex-retail",
          resolvedTenantKey: "meridian-health",
        },
      }),
    ]);
    const result = await getIsolationPosture("apex-retail");
    const event = result.recentEvents[0];
    expect(event.intendedTenant).toBe("apex-retail");
    expect(event.resolvedTenant).toBe("meridian-health");
    expect(event.anomaly).toBe(true);
  });

  it("caps recent events at 50 via the query limit", async () => {
    selectMock.mockResolvedValue([]);
    await getIsolationPosture("apex-retail");
    const req = selectMock.mock.calls[0][0];
    expect(req.limit).toBe(50);
    expect(req.orderBy).toEqual({ column: "created_at", direction: "desc" });
  });

  it("serializes pg Date created_at values before returning recent events", async () => {
    selectMock.mockResolvedValue([
      row({ id: "date-row", created_at: new Date("2026-05-30T13:20:00.000Z") }),
    ]);

    const result = await getIsolationPosture("apex-retail");

    expect(result.recentEvents[0]?.ts).toBe("2026-05-30T13:20:00.000Z");
  });
});
