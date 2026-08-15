import { Client } from "pg";

import { postgresClientOptions } from "../../src/scripts/postgres-client-options";

type Row = Record<string, unknown>;

const DEFAULT_TENANT_KEY = "skyharbor_global";
const DEFAULT_DATASET_VERSION = "v4-golden-evidence";
const DEFAULT_CONTRACT_ID = "CTR-090";

interface Args {
  readonly apply: boolean;
  readonly tenantKey: string;
  readonly datasetVersion: string;
  readonly contractId: string;
  readonly actorRole: string;
  readonly rationale: string;
}

interface Context {
  readonly tenantKey: string;
  readonly datasetVersion: string;
  readonly contractId: string;
  readonly optimizationCaseId: string;
  readonly opportunityId: string;
  readonly negotiatedOutcomeId: string;
  readonly approvalRequestId: string;
  readonly previousCaseState: string;
  readonly financeRealizationCountBefore: number;
  readonly financeRequestCountBefore: number;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const value = (name: string): string | undefined => {
    const index = argv.indexOf(name);
    if (index >= 0) return argv[index + 1];
    return argv
      .find((arg) => arg.startsWith(`${name}=`))
      ?.slice(name.length + 1);
  };

  const apply =
    argv.includes("--apply") ||
    process.env.SOURCE_CONTRACT_OPTIMIZATION_FINANCE_HANDOFF_APPLY === "true";
  return {
    apply,
    tenantKey:
      value("--tenant-key") ??
      process.env.SOURCE_CONTRACT_OPTIMIZATION_TENANT_KEY ??
      DEFAULT_TENANT_KEY,
    datasetVersion:
      value("--dataset-version") ??
      process.env.SOURCE_CONTRACT_OPTIMIZATION_DATASET_VERSION ??
      DEFAULT_DATASET_VERSION,
    contractId:
      value("--contract-id") ??
      process.env.SOURCE_CONTRACT_OPTIMIZATION_CONTRACT_ID ??
      DEFAULT_CONTRACT_ID,
    actorRole:
      value("--actor-role") ??
      process.env.SOURCE_CONTRACT_OPTIMIZATION_ACTOR_ROLE ??
      "finance_handoff_owner",
    rationale:
      value("--rationale") ??
      process.env.SOURCE_CONTRACT_OPTIMIZATION_HANDOFF_RATIONALE ??
      "Finance value proof exists; record the Finance/Tower handoff request.",
  };
}

function databaseUrl(): string {
  const url =
    process.env.SOURCE_CONTEXT_DATABASE_URL ||
    process.env.AZURE_LAB_DATABASE_URL ||
    process.env.LAB_DATABASE_URL ||
    process.env.ABARVA_AZURE_DATABASE_URL ||
    process.env.AZURE_DATABASE_URL ||
    process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "Missing SOURCE_CONTEXT_DATABASE_URL, AZURE_LAB_DATABASE_URL, LAB_DATABASE_URL, ABARVA_AZURE_DATABASE_URL, AZURE_DATABASE_URL, or DATABASE_URL.",
    );
  }
  return url;
}

async function loadContext(client: Client, args: Args): Promise<Context> {
  const baselineResult = await client.query<Row>(
    `SELECT baseline_state
       FROM source.optimization_baseline
      WHERE tenant_key = $1
        AND dataset_version = $2
        AND contract_id = $3
      ORDER BY baseline_id
      LIMIT 1`,
    [args.tenantKey, args.datasetVersion, args.contractId],
  );
  const baselineState = textValue(baselineResult.rows[0]?.baseline_state);
  if (!baselineState || baselineState === "missing") {
    throw new Error("No governed commercial baseline is ready for this contract.");
  }
  if (baselineState === "conflict") {
    throw new Error(
      "Baseline inputs conflict; resolve the commercial baseline before Finance/Tower handoff.",
    );
  }

  const caseResult = await client.query<Row>(
    `SELECT *
       FROM source.optimization_case
      WHERE tenant_key = $1
        AND dataset_version = $2
        AND contract_id = $3
      ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, optimization_case_id
      LIMIT 1`,
    [args.tenantKey, args.datasetVersion, args.contractId],
  );
  const optimizationCase = caseResult.rows[0];
  const optimizationCaseId = textValue(optimizationCase?.optimization_case_id);
  if (!optimizationCaseId) {
    throw new Error("No governed optimization case exists for this contract.");
  }

  const opportunityResult = await client.query<Row>(
    `SELECT opportunity.*
       FROM source.optimization_opportunity opportunity
       LEFT JOIN source.case_opportunity case_opportunity
         ON case_opportunity.tenant_key = opportunity.tenant_key
        AND case_opportunity.dataset_version = opportunity.dataset_version
        AND case_opportunity.opportunity_id = opportunity.opportunity_id
        AND case_opportunity.selected_for_action = true
      WHERE opportunity.tenant_key = $1
        AND opportunity.dataset_version = $2
        AND opportunity.contract_id = $3
      ORDER BY case_opportunity.selected_for_action DESC NULLS LAST,
               opportunity.amount_usd DESC NULLS LAST,
               opportunity.opportunity_id
      LIMIT 1`,
    [args.tenantKey, args.datasetVersion, args.contractId],
  );
  const opportunityId = textValue(opportunityResult.rows[0]?.opportunity_id);
  if (!opportunityId) {
    throw new Error("No governed optimization opportunity is selected for this contract.");
  }

  const outcomeResult = await client.query<Row>(
    `SELECT outcome_id
       FROM source.negotiated_outcome
      WHERE tenant_key = $1
        AND dataset_version = $2
        AND optimization_case_id = $3
        AND opportunity_id = $4
        AND outcome_state = 'agreed'
      ORDER BY effective_date DESC NULLS LAST, outcome_id
      LIMIT 1`,
    [args.tenantKey, args.datasetVersion, optimizationCaseId, opportunityId],
  );
  const negotiatedOutcomeId = textValue(outcomeResult.rows[0]?.outcome_id);
  if (!negotiatedOutcomeId) {
    throw new Error(
      "No agreed negotiated outcome exists; record the vendor outcome before Finance/Tower confirmation.",
    );
  }

  const [financeRequestCountBefore, financeRealizationCountBefore] =
    await Promise.all([
      countFinanceRequests(client, args, optimizationCaseId),
      countFinanceRealizations(client, args, optimizationCaseId),
    ]);

  return {
    tenantKey: args.tenantKey,
    datasetVersion: args.datasetVersion,
    contractId: args.contractId,
    optimizationCaseId,
    opportunityId,
    negotiatedOutcomeId,
    approvalRequestId: stableId("APR", [
      optimizationCaseId,
      opportunityId,
      "finance-confirmation",
    ]),
    previousCaseState: textValue(optimizationCase?.case_state) ?? "unknown",
    financeRequestCountBefore,
    financeRealizationCountBefore,
  };
}

async function countFinanceRequests(
  client: Client,
  args: Args,
  optimizationCaseId: string,
): Promise<number> {
  const result = await client.query<{ readonly count: string }>(
    `SELECT count(*)::text AS count
       FROM source.approval_request
      WHERE tenant_key = $1
        AND dataset_version = $2
        AND optimization_case_id = $3
        AND approval_type = 'finance_value_confirmation'`,
    [args.tenantKey, args.datasetVersion, optimizationCaseId],
  );
  return Number(result.rows[0]?.count ?? 0);
}

async function countFinanceRealizations(
  client: Client,
  args: Args,
  optimizationCaseId: string,
): Promise<number> {
  const result = await client.query<{ readonly count: string }>(
    `SELECT count(*)::text AS count
       FROM source.finance_realization
      WHERE tenant_key = $1
        AND dataset_version = $2
        AND optimization_case_id = $3`,
    [args.tenantKey, args.datasetVersion, optimizationCaseId],
  );
  return Number(result.rows[0]?.count ?? 0);
}

async function applyFinanceHandoff(
  client: Client,
  args: Args,
  context: Context,
): Promise<void> {
  const rationale = args.rationale.trim();
  if (rationale.length < 12) {
    throw new Error("Finance/Tower handoff rationale must be at least 12 characters.");
  }
  const role = args.actorRole.trim() || "finance_handoff_owner";
  const payload = {
    contract_id: context.contractId,
    opportunity_id: context.opportunityId,
    negotiated_outcome_id: context.negotiatedOutcomeId,
    requested_by_user_id: null,
    rationale,
    guardrail:
      "This requests Finance/Tower confirmation only. It does not create finance_realization rows or realized value.",
    required_evidence: [
      "periodized finance actuals",
      "measurement owner attestation",
      "Tower claim references when applicable",
    ],
    operator_script:
      "scripts/source/request-contract-optimization-finance-handoff.ts",
  };

  await client.query(
    `INSERT INTO source.approval_request
       (tenant_key, dataset_version, approval_request_id, optimization_case_id,
        opportunity_id, approval_type, approval_state, requested_by_role, payload)
     VALUES ($1,$2,$3,$4,$5,'finance_value_confirmation','pending',$6,$7::jsonb)
     ON CONFLICT (tenant_key, dataset_version, approval_request_id)
     DO UPDATE SET
       approval_state = CASE
         WHEN source.approval_request.approval_state = 'cancelled' THEN 'pending'
         ELSE source.approval_request.approval_state
       END,
       requested_by_role = EXCLUDED.requested_by_role,
       payload = source.approval_request.payload || EXCLUDED.payload`,
    [
      context.tenantKey,
      context.datasetVersion,
      context.approvalRequestId,
      context.optimizationCaseId,
      context.opportunityId,
      role,
      JSON.stringify(payload),
    ],
  );

  await client.query(
    `UPDATE source.optimization_case
        SET case_state = 'finance_handoff',
            next_action = 'Finance/Tower must confirm periodized realized value before closure or external value claims.',
            updated_at = now()
      WHERE tenant_key = $1
        AND dataset_version = $2
        AND optimization_case_id = $3`,
    [context.tenantKey, context.datasetVersion, context.optimizationCaseId],
  );
}

async function readAfter(client: Client, args: Args, context: Context) {
  const [financeRequestCountAfter, financeRealizationCountAfter, caseResult] =
    await Promise.all([
      countFinanceRequests(client, args, context.optimizationCaseId),
      countFinanceRealizations(client, args, context.optimizationCaseId),
      client.query<{ readonly case_state: string }>(
        `SELECT case_state
           FROM source.optimization_case
          WHERE tenant_key = $1
            AND dataset_version = $2
            AND optimization_case_id = $3`,
        [context.tenantKey, context.datasetVersion, context.optimizationCaseId],
      ),
    ]);
  return {
    financeRequestCountAfter,
    financeRealizationCountAfter,
    caseStateAfter: caseResult.rows[0]?.case_state ?? null,
  };
}

async function main(): Promise<void> {
  const args = parseArgs();
  const client = new Client(
    postgresClientOptions(
      databaseUrl(),
      "source-contract-optimization-finance-handoff",
    ),
  );
  await client.connect();

  try {
    await client.query("SELECT set_config('app.tenant_key', $1, false)", [
      args.tenantKey,
    ]);
    const context = await loadContext(client, args);
    if (!args.apply) {
      const event = {
        event: "source_contract_optimization_finance_handoff_plan",
        ok: true,
        apply: false,
        tenant_key: args.tenantKey,
        dataset_version: args.datasetVersion,
        contract_id: args.contractId,
        optimization_case_id: context.optimizationCaseId,
        opportunity_id: context.opportunityId,
        negotiated_outcome_id: context.negotiatedOutcomeId,
        approval_request_id: context.approvalRequestId,
        previous_case_state: context.previousCaseState,
        finance_request_count_before: context.financeRequestCountBefore,
        finance_realization_count_before:
          context.financeRealizationCountBefore,
        guardrail:
          "Plan only. No approval request, case state, or finance realization row was changed.",
      };
      console.log(JSON.stringify(event, null, 2));
      return;
    }

    await client.query("BEGIN");
    await applyFinanceHandoff(client, args, context);
    const after = await readAfter(client, args, context);
    if (
      after.financeRealizationCountAfter !==
      context.financeRealizationCountBefore
    ) {
      throw new Error(
        "Finance realization row count changed; aborting Finance/Tower handoff.",
      );
    }
    await client.query("COMMIT");

    const event = {
      event: "source_contract_optimization_finance_handoff_applied",
      ok: true,
      apply: true,
      tenant_key: args.tenantKey,
      dataset_version: args.datasetVersion,
      contract_id: args.contractId,
      optimization_case_id: context.optimizationCaseId,
      opportunity_id: context.opportunityId,
      negotiated_outcome_id: context.negotiatedOutcomeId,
      approval_request_id: context.approvalRequestId,
      previous_case_state: context.previousCaseState,
      case_state_after: after.caseStateAfter,
      finance_request_count_before: context.financeRequestCountBefore,
      finance_request_count_after: after.financeRequestCountAfter,
      finance_realization_count_before: context.financeRealizationCountBefore,
      finance_realization_count_after: after.financeRealizationCountAfter,
      guardrail:
        "Recorded the Finance/Tower handoff request only. No finance_realization rows or realized value were created.",
    };
    console.log(JSON.stringify(event, null, 2));
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Ignore rollback failures after non-transactional plan errors.
    }
    console.error(
      JSON.stringify(
        {
          event: "source_contract_optimization_finance_handoff_error",
          ok: false,
          apply: args.apply,
          tenant_key: args.tenantKey,
          dataset_version: args.datasetVersion,
          contract_id: args.contractId,
          error: error instanceof Error ? error.message : String(error),
        },
        null,
        2,
      ),
    );
    process.exitCode = 1;
  } finally {
    await client.end();
  }
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

main().catch((error: unknown) => {
  console.error(
    JSON.stringify(
      {
        event: "source_contract_optimization_finance_handoff_error",
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      null,
      2,
    ),
  );
  process.exitCode = 1;
});
