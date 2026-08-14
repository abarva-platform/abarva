import "server-only";

import {
  createTxSession,
  type SqlRunner,
  type TxSessionRunner,
} from "@/lib/data-plane/read-adapters/azureSession";
import { canonicalTenantKey, tenantAliasesFor } from "@/lib/tenant/aliases";

export type ContractOptimizationWorkflowAction =
  | "create_approval_request"
  | "approve_request"
  | "send_back_request"
  | "record_agreed_outcome";

export interface ContractOptimizationWorkflowActionInput {
  readonly tenantKey: string;
  readonly contractId: string;
  readonly opportunityId?: string | null;
  readonly action: ContractOptimizationWorkflowAction;
  readonly rationale?: string | null;
  readonly actorRole?: string | null;
  readonly actorUserId?: string | null;
}

export interface ContractOptimizationWorkflowActionResult {
  readonly ok: true;
  readonly action: ContractOptimizationWorkflowAction;
  readonly tenantKey: string;
  readonly contractId: string;
  readonly datasetVersion: string;
  readonly optimizationCaseId: string;
  readonly opportunityId: string;
  readonly approvalRequestId: string | null;
  readonly negotiatedOutcomeId: string | null;
  readonly caseState: string;
  readonly message: string;
}

type Row = Record<string, unknown>;

const STAGE_RANK: Record<string, number> = {
  baseline_conflict: 0,
  evidence_required: 0,
  workflow_required: 0,
  signal: 1,
  quantified: 2,
  validated: 3,
  approval_required: 4,
  target_position: 5,
  agreed: 6,
  finance_confirmed: 7,
};

export class ContractOptimizationWorkflowActionError extends Error {
  constructor(
    public readonly code:
      | "missing_dataset"
      | "missing_baseline"
      | "baseline_conflict"
      | "missing_case"
      | "missing_opportunity"
      | "opportunity_not_ready"
      | "missing_pending_request"
      | "missing_approved_request"
      | "invalid_action",
    message: string,
  ) {
    super(message);
  }
}

export function createContractOptimizationWorkflowActionRunner(
  session: TxSessionRunner = createTxSession("source-optimize-workflow-action"),
) {
  return async function runContractOptimizationWorkflowAction(
    input: ContractOptimizationWorkflowActionInput,
  ): Promise<ContractOptimizationWorkflowActionResult> {
    const tenantKey = input.tenantKey.trim();
    const contractId = input.contractId.trim();
    const aliases = tenantAliasesFor(tenantKey);
    const rlsTenantKey = canonicalTenantKey(tenantKey);
    if (!contractId) {
      throw new ContractOptimizationWorkflowActionError(
        "missing_opportunity",
        "Contract id is required.",
      );
    }

    return session(async (run) => {
      await run("SELECT set_config('app.tenant_key', $1, true)", [
        rlsTenantKey,
      ]);
      if (input.actorUserId) {
        await run("SELECT set_config('abarva.actor_user_id', $1, true)", [
          input.actorUserId,
        ]);
      }

      const context = await loadActionContext(run, {
        aliases,
        contractId,
        opportunityId: input.opportunityId?.trim() || null,
      });

      switch (input.action) {
        case "create_approval_request":
          return createApprovalRequest(run, input, context);
        case "approve_request":
          return decideApprovalRequest(run, input, context, "approved");
        case "send_back_request":
          return decideApprovalRequest(run, input, context, "sent_back");
        case "record_agreed_outcome":
          return recordAgreedOutcome(run, input, context);
        default:
          throw new ContractOptimizationWorkflowActionError(
            "invalid_action",
            "Unsupported optimization workflow action.",
          );
      }
    });
  };
}

export const runContractOptimizationWorkflowAction =
  createContractOptimizationWorkflowActionRunner();

async function loadActionContext(
  run: SqlRunner,
  input: {
    readonly aliases: readonly string[];
    readonly contractId: string;
    readonly opportunityId: string | null;
  },
) {
  const versionRows = await run<{ dataset_version: string }>(
    `SELECT dataset_version
       FROM source.optimization_opportunity
      WHERE tenant_key = ANY($1::text[])
        AND contract_id = $2
      GROUP BY dataset_version
      ORDER BY max(updated_at) DESC NULLS LAST
      LIMIT 1`,
    [input.aliases, input.contractId],
  );
  const datasetVersion = versionRows[0]?.dataset_version;
  if (!datasetVersion) {
    throw new ContractOptimizationWorkflowActionError(
      "missing_dataset",
      "No governed optimization opportunity spine is available for this contract.",
    );
  }

  const [baselineRows, caseRows, opportunityRows] = await Promise.all([
    run<Row>(
      `SELECT *
         FROM source.optimization_baseline
        WHERE tenant_key = ANY($1::text[])
          AND dataset_version = $2
          AND contract_id = $3
        ORDER BY baseline_id
        LIMIT 1`,
      [input.aliases, datasetVersion, input.contractId],
    ),
    run<Row>(
      `SELECT *
         FROM source.optimization_case
        WHERE tenant_key = ANY($1::text[])
          AND dataset_version = $2
          AND contract_id = $3
        ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, optimization_case_id
        LIMIT 1`,
      [input.aliases, datasetVersion, input.contractId],
    ),
    run<Row>(
      input.opportunityId
        ? `SELECT *
             FROM source.optimization_opportunity
            WHERE tenant_key = ANY($1::text[])
              AND dataset_version = $2
              AND contract_id = $3
              AND opportunity_id = $4
            LIMIT 1`
        : `SELECT opportunity.*
             FROM source.optimization_opportunity opportunity
             LEFT JOIN source.case_opportunity case_opportunity
               ON case_opportunity.tenant_key = opportunity.tenant_key
              AND case_opportunity.dataset_version = opportunity.dataset_version
              AND case_opportunity.opportunity_id = opportunity.opportunity_id
              AND case_opportunity.selected_for_action = true
            WHERE opportunity.tenant_key = ANY($1::text[])
              AND opportunity.dataset_version = $2
              AND opportunity.contract_id = $3
            ORDER BY case_opportunity.selected_for_action DESC NULLS LAST,
                     opportunity.amount_usd DESC NULLS LAST,
                     opportunity.opportunity_id
            LIMIT 1`,
      input.opportunityId
        ? [input.aliases, datasetVersion, input.contractId, input.opportunityId]
        : [input.aliases, datasetVersion, input.contractId],
    ),
  ]);

  const baseline = baselineRows[0] ?? null;
  const baselineState = textValue(baseline?.baseline_state) ?? "missing";
  if (!baseline || baselineState === "missing") {
    throw new ContractOptimizationWorkflowActionError(
      "missing_baseline",
      "No governed commercial baseline is ready for this contract.",
    );
  }
  if (baselineState === "conflict") {
    throw new ContractOptimizationWorkflowActionError(
      "baseline_conflict",
      "Baseline inputs conflict; resolve the commercial baseline before approval.",
    );
  }

  const optimizationCase = caseRows[0] ?? null;
  if (!optimizationCase) {
    throw new ContractOptimizationWorkflowActionError(
      "missing_case",
      "No governed optimization case exists for this contract.",
    );
  }
  const opportunity = opportunityRows[0] ?? null;
  if (!opportunity) {
    throw new ContractOptimizationWorkflowActionError(
      "missing_opportunity",
      "No governed optimization opportunity is selected for this contract.",
    );
  }

  return {
    datasetVersion,
    tenantKey: textValue(opportunity.tenant_key) ?? input.aliases[0] ?? "",
    contractId: input.contractId,
    caseId: textValue(optimizationCase.optimization_case_id) ?? "",
    opportunityId: textValue(opportunity.opportunity_id) ?? "",
    opportunityStage: textValue(opportunity.stage) ?? "signal",
  };
}

async function createApprovalRequest(
  run: SqlRunner,
  input: ContractOptimizationWorkflowActionInput,
  context: Awaited<ReturnType<typeof loadActionContext>>,
): Promise<ContractOptimizationWorkflowActionResult> {
  assertOpportunityReadyForApproval(context.opportunityStage);
  const approvalRequestId = stableId("APR", [
    context.caseId,
    context.opportunityId,
    "strategy",
  ]);
  const role = input.actorRole?.trim() || "sourcing_owner";
  const payload = {
    contract_id: context.contractId,
    opportunity_id: context.opportunityId,
    requested_by_user_id: input.actorUserId ?? null,
    rationale: input.rationale?.trim() || null,
  };

  await run(
    `INSERT INTO source.approval_request
       (tenant_key, dataset_version, approval_request_id, optimization_case_id,
        opportunity_id, approval_type, approval_state, requested_by_role, payload)
     VALUES ($1,$2,$3,$4,$5,'vendor_outreach_strategy','pending',$6,$7::jsonb)
     ON CONFLICT (tenant_key, dataset_version, approval_request_id)
     DO UPDATE SET
       approval_state = CASE
         WHEN source.approval_request.approval_state = 'sent_back' THEN 'pending'
         ELSE source.approval_request.approval_state
       END,
       requested_by_role = EXCLUDED.requested_by_role,
       payload = source.approval_request.payload || EXCLUDED.payload`,
    [
      context.tenantKey,
      context.datasetVersion,
      approvalRequestId,
      context.caseId,
      context.opportunityId,
      role,
      JSON.stringify(payload),
    ],
  );

  await updateCaseState(run, context, {
    caseState: "outreach_approval",
    nextAction:
      "Review and approve the vendor-outreach strategy before any external commitment.",
  });

  return result(input, context, {
    approvalRequestId,
    negotiatedOutcomeId: null,
    caseState: "outreach_approval",
    message: "Strategy approval request is ready for review.",
  });
}

async function decideApprovalRequest(
  run: SqlRunner,
  input: ContractOptimizationWorkflowActionInput,
  context: Awaited<ReturnType<typeof loadActionContext>>,
  decision: "approved" | "sent_back",
): Promise<ContractOptimizationWorkflowActionResult> {
  const request = await latestApprovalRequest(run, context, "pending");
  if (!request) {
    throw new ContractOptimizationWorkflowActionError(
      "missing_pending_request",
      "No pending strategy approval request is available for this contract.",
    );
  }
  const approvalRequestId = textValue(request.approval_request_id) ?? "";
  const role = input.actorRole?.trim() || "approver";
  const rationale =
    input.rationale?.trim() ||
    (decision === "approved"
      ? "Approved for governed vendor outreach."
      : "Sent back for revision.");

  await run(
    `UPDATE source.approval_request
        SET approval_state = $4,
            payload = payload || $5::jsonb
      WHERE tenant_key = $1
        AND dataset_version = $2
        AND approval_request_id = $3`,
    [
      context.tenantKey,
      context.datasetVersion,
      approvalRequestId,
      decision,
      JSON.stringify({ decided_by_user_id: input.actorUserId ?? null }),
    ],
  );
  await run(
    `INSERT INTO source.approval_decision
       (tenant_key, dataset_version, approval_request_id, decision, rationale,
        decided_by_role, payload)
     VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb)`,
    [
      context.tenantKey,
      context.datasetVersion,
      approvalRequestId,
      decision,
      rationale,
      role,
      JSON.stringify({ actor_user_id: input.actorUserId ?? null }),
    ],
  );

  const caseState =
    decision === "approved" ? "outreach_approval" : "calculation_validated";
  await updateCaseState(run, context, {
    caseState,
    nextAction:
      decision === "approved"
        ? "Record the negotiated vendor outcome when the commercial response is known."
        : "Revise the target position and resubmit the strategy approval request.",
  });

  return result(input, context, {
    approvalRequestId,
    negotiatedOutcomeId: null,
    caseState,
    message:
      decision === "approved"
        ? "Strategy approval is recorded; negotiated outcome remains pending."
        : "Strategy approval request was sent back for revision.",
  });
}

async function recordAgreedOutcome(
  run: SqlRunner,
  input: ContractOptimizationWorkflowActionInput,
  context: Awaited<ReturnType<typeof loadActionContext>>,
): Promise<ContractOptimizationWorkflowActionResult> {
  const request = await latestApprovalRequest(run, context, "approved");
  if (!request) {
    throw new ContractOptimizationWorkflowActionError(
      "missing_approved_request",
      "No approved strategy request exists; record approval before outcome.",
    );
  }
  const approvalRequestId = textValue(request.approval_request_id) ?? "";
  const outcomeId = stableId("OUT", [
    context.caseId,
    context.opportunityId,
    "agreed",
  ]);

  await run(
    `INSERT INTO source.negotiated_outcome
       (tenant_key, dataset_version, outcome_id, optimization_case_id,
        opportunity_id, outcome_state, agreed_amount_usd, effective_date,
        source_document_id, payload)
     VALUES ($1,$2,$3,$4,$5,'agreed',NULL,NULL,NULL,$6::jsonb)
     ON CONFLICT (tenant_key, dataset_version, outcome_id)
     DO UPDATE SET
       outcome_state = 'agreed',
       payload = source.negotiated_outcome.payload || EXCLUDED.payload`,
    [
      context.tenantKey,
      context.datasetVersion,
      outcomeId,
      context.caseId,
      context.opportunityId,
      JSON.stringify({
        recorded_by_user_id: input.actorUserId ?? null,
        rationale: input.rationale?.trim() || null,
        note:
          "Agreement state only. Realized value remains pending until Finance/Tower confirmation.",
      }),
    ],
  );

  await updateCaseState(run, context, {
    caseState: "outcome_recorded",
    nextAction:
      "Send the outcome to Finance/Tower for realized-value confirmation.",
  });

  return result(input, context, {
    approvalRequestId,
    negotiatedOutcomeId: outcomeId,
    caseState: "outcome_recorded",
    message:
      "Negotiated outcome is recorded. Realized value still requires Finance/Tower confirmation.",
  });
}

async function latestApprovalRequest(
  run: SqlRunner,
  context: Awaited<ReturnType<typeof loadActionContext>>,
  state: "pending" | "approved",
): Promise<Row | null> {
  const rows = await run<Row>(
    `SELECT *
       FROM source.approval_request
      WHERE tenant_key = $1
        AND dataset_version = $2
        AND optimization_case_id = $3
        AND opportunity_id = $4
        AND approval_state = $5
      ORDER BY requested_at DESC NULLS LAST, approval_request_id
      LIMIT 1`,
    [
      context.tenantKey,
      context.datasetVersion,
      context.caseId,
      context.opportunityId,
      state,
    ],
  );
  return rows[0] ?? null;
}

async function updateCaseState(
  run: SqlRunner,
  context: Awaited<ReturnType<typeof loadActionContext>>,
  input: { readonly caseState: string; readonly nextAction: string },
): Promise<void> {
  await run(
    `UPDATE source.optimization_case
        SET case_state = $4,
            next_action = $5,
            updated_at = now()
      WHERE tenant_key = $1
        AND dataset_version = $2
        AND optimization_case_id = $3`,
    [
      context.tenantKey,
      context.datasetVersion,
      context.caseId,
      input.caseState,
      input.nextAction,
    ],
  );
}

function assertOpportunityReadyForApproval(stage: string): void {
  if ((STAGE_RANK[stage] ?? 0) < STAGE_RANK.target_position) {
    throw new ContractOptimizationWorkflowActionError(
      "opportunity_not_ready",
      "No negotiation target position is set for this opportunity.",
    );
  }
}

function result(
  input: ContractOptimizationWorkflowActionInput,
  context: Awaited<ReturnType<typeof loadActionContext>>,
  values: {
    readonly approvalRequestId: string | null;
    readonly negotiatedOutcomeId: string | null;
    readonly caseState: string;
    readonly message: string;
  },
): ContractOptimizationWorkflowActionResult {
  return {
    ok: true,
    action: input.action,
    tenantKey: context.tenantKey,
    contractId: context.contractId,
    datasetVersion: context.datasetVersion,
    optimizationCaseId: context.caseId,
    opportunityId: context.opportunityId,
    approvalRequestId: values.approvalRequestId,
    negotiatedOutcomeId: values.negotiatedOutcomeId,
    caseState: values.caseState,
    message: values.message,
  };
}

function stableId(prefix: string, parts: readonly string[]): string {
  const body = parts
    .join("-")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
  return `${prefix}-${body}`;
}

function textValue(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
