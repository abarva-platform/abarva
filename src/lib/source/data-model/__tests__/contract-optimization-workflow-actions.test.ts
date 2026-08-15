import {
  ContractOptimizationWorkflowActionError,
  createContractOptimizationWorkflowActionRunner,
} from "../contract-optimization-workflow-actions";
import type { SqlRunner } from "@/lib/data-plane/read-adapters/azureSession";

type Scenario = "ready" | "conflict" | "missing";

function makeSession(options: {
  readonly baseline?: Scenario;
  readonly stage?: string;
  readonly approvalState?: "pending" | "approved" | null;
  readonly hasAgreedOutcome?: boolean;
}) {
  const calls: Array<{ sql: string; params: unknown[] }> = [];
  const run: SqlRunner = async <R>(sql: string, params: unknown[]) => {
    calls.push({ sql, params });
    if (sql.includes("set_config")) return [] as R[];
    if (
      sql.includes("FROM source.optimization_opportunity") &&
      sql.includes("GROUP BY dataset_version")
    ) {
      return [{ dataset_version: "source-v4-golden-contract-evidence" }] as R[];
    }
    if (sql.includes("FROM source.optimization_baseline")) {
      if (options.baseline === "missing") return [] as R[];
      return [
        {
          baseline_state: options.baseline === "conflict" ? "conflict" : "ready",
        },
      ] as R[];
    }
    if (sql.includes("FROM source.optimization_case")) {
      return [
        {
          tenant_key: "skyharbor_global",
          dataset_version: "source-v4-golden-contract-evidence",
          optimization_case_id: "CASE-CTR090",
          contract_id: "CTR-090",
        },
      ] as R[];
    }
    if (
      sql.includes("FROM source.optimization_opportunity") &&
      !sql.includes("GROUP BY dataset_version")
    ) {
      return [
        {
          tenant_key: "skyharbor_global",
          opportunity_id: "OPP-CTR090-RATE",
          stage: options.stage ?? "target_position",
          value_type: "recoverable_leakage",
          amount_usd: 755000,
          evidence_grade: "system_evidenced",
          confidence: 0.88,
          owner: "Procurement",
          next_action: "Ask the supplier to credit governed rate variance.",
          overlap_treatment: "included",
          payload: {
            short_label: "Rate-card variance",
            source_systems: ["AP / ERP", "CLM / contract repository"],
          },
        },
      ] as R[];
    }
    if (sql.includes("FROM source.approval_request")) {
      if (!options.approvalState) return [] as R[];
      return [
        {
          approval_request_id: "APR-CASE-CTR090-OPP-CTR090-RATE-STRATEGY",
          approval_state: options.approvalState,
        },
      ] as R[];
    }
    if (sql.includes("FROM source.negotiated_outcome")) {
      if (!options.hasAgreedOutcome) return [] as R[];
      return [
        {
          outcome_id: "OUT-CASE-CTR090-OPP-CTR090-RATE-AGREED",
          outcome_state: "agreed",
        },
      ] as R[];
    }
    return [] as R[];
  };

  return {
    calls,
    runner: createContractOptimizationWorkflowActionRunner(async (fn) =>
      fn(run),
    ),
  };
}

describe("contract optimization workflow actions", () => {
  it("creates an idempotent strategy approval request only after baseline and target position are ready", async () => {
    const session = makeSession({ baseline: "ready", stage: "target_position" });

    const result = await session.runner({
      tenantKey: "skyharbor_global",
      contractId: "CTR-090",
      opportunityId: "OPP-CTR090-RATE",
      action: "create_approval_request",
      actorRole: "sourcing_lead",
      actorUserId: "user-1",
    });

    expect(result).toMatchObject({
      ok: true,
      action: "create_approval_request",
      caseState: "outreach_approval",
      approvalRequestId: "APR-CASE-CTR090-OPP-CTR090-RATE-STRATEGY",
    });
    expect(
      session.calls.some((call) =>
        call.sql.includes("INSERT INTO source.approval_request"),
      ),
    ).toBe(true);
    expect(
      session.calls.some((call) =>
        call.sql.includes("UPDATE source.optimization_case"),
      ),
    ).toBe(true);
    const approvalInsert = session.calls.find((call) =>
      call.sql.includes("INSERT INTO source.approval_request"),
    );
    const approvalPayload = JSON.parse(
      String(approvalInsert?.params[6] ?? "{}"),
    ) as {
      strategy_packet?: {
        title?: string;
        amount_usd?: number;
        target_ask?: string;
        evidence_basis?: { source_systems?: string[] };
        guardrails?: string[];
      };
    };
    expect(approvalPayload.strategy_packet).toMatchObject({
      title: "Rate-card variance",
      amount_usd: 755000,
      target_ask: "Ask the supplier to credit governed rate variance.",
    });
    expect(
      approvalPayload.strategy_packet?.evidence_basis?.source_systems,
    ).toEqual(["AP / ERP", "CLM / contract repository"]);
    expect(approvalPayload.strategy_packet?.guardrails).toContain(
      "No vendor concession or realized value is recorded by this request.",
    );
  });

  it("does not create approval state when the baseline conflicts", async () => {
    const session = makeSession({
      baseline: "conflict",
      stage: "target_position",
    });

    await expect(
      session.runner({
        tenantKey: "skyharbor_global",
        contractId: "CTR-090",
        opportunityId: "OPP-CTR090-RATE",
        action: "create_approval_request",
      }),
    ).rejects.toMatchObject<Partial<ContractOptimizationWorkflowActionError>>({
      code: "baseline_conflict",
    });
    expect(
      session.calls.some((call) =>
        call.sql.includes("INSERT INTO source.approval_request"),
      ),
    ).toBe(false);
  });

  it("requires a pending request before recording approval", async () => {
    const session = makeSession({
      baseline: "ready",
      stage: "target_position",
      approvalState: "pending",
    });

    const result = await session.runner({
      tenantKey: "skyharbor_global",
      contractId: "CTR-090",
      opportunityId: "OPP-CTR090-RATE",
      action: "approve_request",
      rationale: "Approved for controlled outreach.",
      actorRole: "approver",
    });

    expect(result).toMatchObject({
      action: "approve_request",
      caseState: "outreach_approval",
      approvalRequestId: "APR-CASE-CTR090-OPP-CTR090-RATE-STRATEGY",
    });
    expect(
      session.calls.some((call) =>
        call.sql.includes("INSERT INTO source.approval_decision"),
      ),
    ).toBe(true);
  });

  it("does not record an agreed outcome without an approved request", async () => {
    const session = makeSession({
      baseline: "ready",
      stage: "target_position",
      approvalState: null,
    });

    await expect(
      session.runner({
        tenantKey: "skyharbor_global",
        contractId: "CTR-090",
        opportunityId: "OPP-CTR090-RATE",
        action: "record_agreed_outcome",
      }),
    ).rejects.toMatchObject<Partial<ContractOptimizationWorkflowActionError>>({
      code: "missing_approved_request",
    });
    expect(
      session.calls.some((call) =>
        call.sql.includes("INSERT INTO source.negotiated_outcome"),
      ),
    ).toBe(false);
  });

  it("creates a Finance/Tower confirmation request after an agreed outcome without recording realized value", async () => {
    const session = makeSession({
      baseline: "ready",
      stage: "target_position",
      approvalState: "approved",
      hasAgreedOutcome: true,
    });

    const result = await session.runner({
      tenantKey: "skyharbor_global",
      contractId: "CTR-090",
      opportunityId: "OPP-CTR090-RATE",
      action: "request_finance_confirmation",
      rationale: "Vendor outcome is agreed; Finance should confirm measured value.",
      actorRole: "sourcing_lead",
    });

    expect(result).toMatchObject({
      action: "request_finance_confirmation",
      caseState: "finance_handoff",
      approvalRequestId:
        "APR-CASE-CTR090-OPP-CTR090-RATE-FINANCE-CONFIRMATION",
      negotiatedOutcomeId: "OUT-CASE-CTR090-OPP-CTR090-RATE-AGREED",
    });
    expect(
      session.calls.some(
        (call) =>
          call.sql.includes("INSERT INTO source.approval_request") &&
          call.sql.includes("finance_value_confirmation"),
      ),
    ).toBe(true);
    expect(
      session.calls.some((call) =>
        call.sql.includes("INSERT INTO source.finance_realization"),
      ),
    ).toBe(false);
  });

  it("does not request Finance/Tower confirmation before the vendor outcome is agreed", async () => {
    const session = makeSession({
      baseline: "ready",
      stage: "target_position",
      approvalState: "approved",
      hasAgreedOutcome: false,
    });

    await expect(
      session.runner({
        tenantKey: "skyharbor_global",
        contractId: "CTR-090",
        opportunityId: "OPP-CTR090-RATE",
        action: "request_finance_confirmation",
      }),
    ).rejects.toMatchObject<Partial<ContractOptimizationWorkflowActionError>>({
      code: "missing_agreed_outcome",
    });
    expect(
      session.calls.some(
        (call) =>
          call.sql.includes("INSERT INTO source.approval_request") &&
          call.sql.includes("finance_value_confirmation"),
      ),
    ).toBe(false);
  });
});
