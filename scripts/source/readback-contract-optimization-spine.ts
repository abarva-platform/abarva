import { Client } from "pg";

import { postgresClientOptions } from "../../src/scripts/postgres-client-options";

const DEFAULT_TENANT_KEY = "skyharbor_global";
const DEFAULT_DATASET_VERSION = "v4-golden-evidence";
const DEFAULT_CONTRACT_IDS = ["CTR-090", "CTR-061"];

interface Args {
  readonly tenantKey: string;
  readonly datasetVersion: string;
  readonly contractIds: readonly string[];
}

interface CoverageRow {
  readonly contract_id: string;
  readonly baseline_state: string | null;
  readonly opportunity_count: string;
  readonly amount_bearing_opportunity_count: string;
  readonly calculation_run_count: string;
  readonly calculation_input_count: string;
  readonly calculation_output_count: string;
  readonly missing_calculation_opportunity_ids: string[] | null;
  readonly mismatched_calculation_opportunity_ids: string[] | null;
}

interface ConflictRow {
  readonly contract_id: string;
  readonly conflict_id: string;
  readonly severity: string;
  readonly summary: string;
}

interface LifecycleRow {
  readonly contract_id: string;
  readonly optimization_case_count: string;
  readonly latest_case_state: string | null;
  readonly approval_request_count: string;
  readonly approval_request_counts_by_type: Record<string, number> | null;
  readonly approval_request_counts_by_type_and_state:
    | Record<string, Record<string, number>>
    | null;
  readonly finance_value_confirmation_request_count: string;
  readonly finance_value_confirmation_request_counts_by_state:
    | Record<string, number>
    | null;
  readonly approval_decision_count: string;
  readonly negotiated_outcome_count: string;
  readonly finance_realization_count: string;
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

  return {
    tenantKey:
      value("--tenant-key") ??
      process.env.SOURCE_CONTRACT_OPTIMIZATION_TENANT_KEY ??
      DEFAULT_TENANT_KEY,
    datasetVersion:
      value("--dataset-version") ??
      process.env.SOURCE_CONTRACT_OPTIMIZATION_DATASET_VERSION ??
      DEFAULT_DATASET_VERSION,
    contractIds: [
      ...new Set(
        (
          value("--contract-id") ??
          process.env.SOURCE_CONTRACT_OPTIMIZATION_CONTRACT_ID ??
          DEFAULT_CONTRACT_IDS.join(",")
        )
          .split(",")
          .map((contractId) => contractId.trim())
          .filter(Boolean),
      ),
    ],
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

async function readCoverage(
  client: Client,
  args: Args,
): Promise<readonly CoverageRow[]> {
  const result = await client.query<CoverageRow>(
    `WITH opportunity AS (
       SELECT opportunity_id, contract_id, amount_usd
         FROM source.optimization_opportunity
        WHERE tenant_key = $1
          AND dataset_version = $2
          AND contract_id = ANY($3::text[])
     ),
     run AS (
       SELECT calculation_run_id, opportunity_id
         FROM source.calculation_run
        WHERE tenant_key = $1
          AND dataset_version = $2
     ),
     calculated AS (
       SELECT run.opportunity_id,
              run.calculation_run_id,
              max(output.amount_usd)
                FILTER (WHERE output.output_key = 'calculated_amount_usd') AS calculated_amount_usd
         FROM run
         LEFT JOIN source.calculation_output output
           ON output.tenant_key = $1
          AND output.dataset_version = $2
          AND output.calculation_run_id = run.calculation_run_id
        GROUP BY run.opportunity_id, run.calculation_run_id
     ),
     input_counts AS (
       SELECT run.opportunity_id, count(input.*)::text AS input_count
         FROM run
         LEFT JOIN source.calculation_input input
           ON input.tenant_key = $1
          AND input.dataset_version = $2
          AND input.calculation_run_id = run.calculation_run_id
        GROUP BY run.opportunity_id
     ),
     output_counts AS (
       SELECT run.opportunity_id, count(output.*)::text AS output_count
         FROM run
         LEFT JOIN source.calculation_output output
           ON output.tenant_key = $1
          AND output.dataset_version = $2
          AND output.calculation_run_id = run.calculation_run_id
        GROUP BY run.opportunity_id
     )
     SELECT opportunity.contract_id,
            baseline.baseline_state,
            count(*)::text AS opportunity_count,
            count(*) FILTER (WHERE opportunity.amount_usd IS NOT NULL)::text AS amount_bearing_opportunity_count,
            count(calculated.calculation_run_id)::text AS calculation_run_count,
            coalesce(sum(input_counts.input_count::integer), 0)::text AS calculation_input_count,
            coalesce(sum(output_counts.output_count::integer), 0)::text AS calculation_output_count,
            coalesce(
              array_agg(opportunity.opportunity_id ORDER BY opportunity.opportunity_id)
                FILTER (
                  WHERE opportunity.amount_usd IS NOT NULL
                    AND calculated.calculation_run_id IS NULL
                ),
              ARRAY[]::text[]
            ) AS missing_calculation_opportunity_ids,
            coalesce(
              array_agg(opportunity.opportunity_id ORDER BY opportunity.opportunity_id)
                FILTER (
                  WHERE opportunity.amount_usd IS NOT NULL
                    AND calculated.calculation_run_id IS NOT NULL
                    AND (
                      calculated.calculated_amount_usd IS NULL
                      OR abs(calculated.calculated_amount_usd - opportunity.amount_usd) > 0.01
                    )
                ),
              ARRAY[]::text[]
            ) AS mismatched_calculation_opportunity_ids
       FROM opportunity
       LEFT JOIN calculated
         ON calculated.opportunity_id = opportunity.opportunity_id
       LEFT JOIN input_counts
         ON input_counts.opportunity_id = opportunity.opportunity_id
       LEFT JOIN output_counts
         ON output_counts.opportunity_id = opportunity.opportunity_id
       LEFT JOIN source.optimization_baseline baseline
         ON baseline.tenant_key = $1
        AND baseline.dataset_version = $2
        AND baseline.contract_id = opportunity.contract_id
      GROUP BY opportunity.contract_id, baseline.baseline_state
      ORDER BY opportunity.contract_id`,
    [args.tenantKey, args.datasetVersion, args.contractIds],
  );
  return result.rows;
}

async function readConflicts(
  client: Client,
  args: Args,
): Promise<readonly ConflictRow[]> {
  const result = await client.query<ConflictRow>(
    `SELECT contract_id, conflict_id, severity, summary
       FROM source.fact_conflict
      WHERE tenant_key = $1
        AND dataset_version = $2
        AND contract_id = ANY($3::text[])
      ORDER BY contract_id, conflict_id`,
    [args.tenantKey, args.datasetVersion, args.contractIds],
  );
  return result.rows;
}

async function readLifecycle(
  client: Client,
  args: Args,
): Promise<readonly LifecycleRow[]> {
  const result = await client.query<LifecycleRow>(
    `WITH cases AS (
       SELECT *
         FROM source.optimization_case
        WHERE tenant_key = $1
          AND dataset_version = $2
          AND contract_id = ANY($3::text[])
     ),
     latest_case AS (
       SELECT DISTINCT ON (contract_id)
              contract_id,
              case_state
         FROM cases
        ORDER BY contract_id, updated_at DESC NULLS LAST, created_at DESC NULLS LAST, optimization_case_id
     ),
     approval_requests AS (
       SELECT cases.contract_id,
              request.approval_request_id,
              request.approval_type,
              request.approval_state
         FROM cases
         JOIN source.approval_request request
           ON request.tenant_key = cases.tenant_key
          AND request.dataset_version = cases.dataset_version
          AND request.optimization_case_id = cases.optimization_case_id
     ),
     approval_request_type_counts AS (
       SELECT contract_id,
              coalesce(
                jsonb_object_agg(approval_type, request_count ORDER BY approval_type),
                '{}'::jsonb
              ) AS counts_by_type,
              coalesce(
                sum(request_count) FILTER (WHERE approval_type = 'finance_value_confirmation'),
                0
              )::text AS finance_value_confirmation_request_count
         FROM (
           SELECT contract_id,
                  approval_type,
                  count(DISTINCT approval_request_id)::int AS request_count
             FROM approval_requests
            GROUP BY contract_id, approval_type
         ) grouped
        GROUP BY contract_id
     ),
     approval_request_state_counts AS (
       SELECT contract_id,
              coalesce(
                jsonb_object_agg(approval_type, counts_by_state ORDER BY approval_type),
                '{}'::jsonb
              ) AS counts_by_type_and_state
         FROM (
           SELECT contract_id,
                  approval_type,
                  jsonb_object_agg(approval_state, request_count ORDER BY approval_state) AS counts_by_state
             FROM (
               SELECT contract_id,
                      approval_type,
                      approval_state,
                      count(DISTINCT approval_request_id)::int AS request_count
                 FROM approval_requests
                GROUP BY contract_id, approval_type, approval_state
             ) grouped_by_state
            GROUP BY contract_id, approval_type
         ) grouped_by_type
        GROUP BY contract_id
     ),
     finance_request_state_counts AS (
       SELECT contract_id,
              coalesce(
                jsonb_object_agg(approval_state, request_count ORDER BY approval_state),
                '{}'::jsonb
              ) AS finance_counts_by_state
         FROM (
           SELECT contract_id,
                  approval_state,
                  count(DISTINCT approval_request_id)::int AS request_count
             FROM approval_requests
            WHERE approval_type = 'finance_value_confirmation'
            GROUP BY contract_id, approval_state
         ) grouped
        GROUP BY contract_id
     ),
     approval_decisions AS (
       SELECT approval_requests.contract_id, decision.id
         FROM approval_requests
         JOIN source.approval_decision decision
           ON decision.tenant_key = $1
          AND decision.dataset_version = $2
          AND decision.approval_request_id = approval_requests.approval_request_id
     ),
     outcomes AS (
       SELECT cases.contract_id, outcome.outcome_id
         FROM cases
         JOIN source.negotiated_outcome outcome
           ON outcome.tenant_key = cases.tenant_key
          AND outcome.dataset_version = cases.dataset_version
          AND outcome.optimization_case_id = cases.optimization_case_id
     ),
     realizations AS (
       SELECT cases.contract_id, realization.realization_id
         FROM cases
         JOIN source.finance_realization realization
           ON realization.tenant_key = cases.tenant_key
          AND realization.dataset_version = cases.dataset_version
          AND realization.optimization_case_id = cases.optimization_case_id
     )
     SELECT requested.contract_id,
            count(DISTINCT cases.optimization_case_id)::text AS optimization_case_count,
            latest_case.case_state AS latest_case_state,
            count(DISTINCT approval_requests.approval_request_id)::text AS approval_request_count,
            coalesce(approval_request_type_counts.counts_by_type, '{}'::jsonb) AS approval_request_counts_by_type,
            coalesce(approval_request_state_counts.counts_by_type_and_state, '{}'::jsonb) AS approval_request_counts_by_type_and_state,
            coalesce(approval_request_type_counts.finance_value_confirmation_request_count, '0') AS finance_value_confirmation_request_count,
            coalesce(finance_request_state_counts.finance_counts_by_state, '{}'::jsonb) AS finance_value_confirmation_request_counts_by_state,
            count(DISTINCT approval_decisions.id)::text AS approval_decision_count,
            count(DISTINCT outcomes.outcome_id)::text AS negotiated_outcome_count,
            count(DISTINCT realizations.realization_id)::text AS finance_realization_count
       FROM unnest($3::text[]) requested(contract_id)
       LEFT JOIN cases
         ON cases.contract_id = requested.contract_id
       LEFT JOIN latest_case
         ON latest_case.contract_id = requested.contract_id
       LEFT JOIN approval_requests
         ON approval_requests.contract_id = requested.contract_id
       LEFT JOIN approval_request_type_counts
         ON approval_request_type_counts.contract_id = requested.contract_id
       LEFT JOIN approval_request_state_counts
         ON approval_request_state_counts.contract_id = requested.contract_id
       LEFT JOIN finance_request_state_counts
         ON finance_request_state_counts.contract_id = requested.contract_id
       LEFT JOIN approval_decisions
         ON approval_decisions.contract_id = requested.contract_id
       LEFT JOIN outcomes
         ON outcomes.contract_id = requested.contract_id
       LEFT JOIN realizations
         ON realizations.contract_id = requested.contract_id
      GROUP BY requested.contract_id,
               latest_case.case_state,
               approval_request_type_counts.counts_by_type,
               approval_request_state_counts.counts_by_type_and_state,
               approval_request_type_counts.finance_value_confirmation_request_count,
               finance_request_state_counts.finance_counts_by_state
      ORDER BY requested.contract_id`,
    [args.tenantKey, args.datasetVersion, args.contractIds],
  );
  return result.rows;
}

function rowsByContract<T extends { readonly contract_id: string }>(
  rows: readonly T[],
): Record<string, readonly T[]> {
  return rows.reduce<Record<string, T[]>>((acc, row) => {
    acc[row.contract_id] ??= [];
    acc[row.contract_id].push(row);
    return acc;
  }, {});
}

function defects(args: Args, rows: readonly CoverageRow[]): readonly string[] {
  const byContract = new Map(rows.map((row) => [row.contract_id, row]));
  const issues: string[] = [];
  for (const contractId of args.contractIds) {
    const row = byContract.get(contractId);
    if (!row) {
      issues.push(`${contractId}: no persisted optimization opportunities`);
      continue;
    }
    const missing = row.missing_calculation_opportunity_ids ?? [];
    const mismatched = row.mismatched_calculation_opportunity_ids ?? [];
    if (missing.length > 0) {
      issues.push(
        `${contractId}: amount-bearing opportunities missing calculation runs: ${missing.join(", ")}`,
      );
    }
    if (mismatched.length > 0) {
      issues.push(
        `${contractId}: calculation outputs do not match opportunity amounts: ${mismatched.join(", ")}`,
      );
    }
  }
  return issues;
}

async function main(): Promise<void> {
  const args = parseArgs();
  const client = new Client(
    postgresClientOptions(
      databaseUrl(),
      "source-contract-optimization-spine-readback",
    ),
  );
  await client.connect();

  try {
    await client.query("SELECT set_config('app.tenant_key', $1, false)", [
      args.tenantKey,
    ]);
    const [coverageRows, conflictRows, lifecycleRows] = await Promise.all([
      readCoverage(client, args),
      readConflicts(client, args),
      readLifecycle(client, args),
    ]);
    const failures = defects(args, coverageRows);
    const event = {
      event: "source_contract_optimization_spine_readback",
      ok: failures.length === 0,
      tenant_key: args.tenantKey,
      dataset_version: args.datasetVersion,
      contract_ids: args.contractIds,
      coverage: coverageRows.map((row) => ({
        contract_id: row.contract_id,
        baseline_state: row.baseline_state,
        opportunity_count: Number(row.opportunity_count),
        amount_bearing_opportunity_count: Number(
          row.amount_bearing_opportunity_count,
        ),
        calculation_run_count: Number(row.calculation_run_count),
        calculation_input_count: Number(row.calculation_input_count),
        calculation_output_count: Number(row.calculation_output_count),
        missing_calculation_opportunity_ids:
          row.missing_calculation_opportunity_ids ?? [],
        mismatched_calculation_opportunity_ids:
          row.mismatched_calculation_opportunity_ids ?? [],
      })),
      lifecycle: lifecycleRows.map((row) => ({
        contract_id: row.contract_id,
        optimization_case_count: Number(row.optimization_case_count),
        latest_case_state: row.latest_case_state,
        approval_request_count: Number(row.approval_request_count),
        approval_request_counts_by_type: row.approval_request_counts_by_type ?? {},
        approval_request_counts_by_type_and_state:
          row.approval_request_counts_by_type_and_state ?? {},
        finance_value_confirmation_request_count: Number(
          row.finance_value_confirmation_request_count,
        ),
        finance_value_confirmation_request_counts_by_state:
          row.finance_value_confirmation_request_counts_by_state ?? {},
        approval_decision_count: Number(row.approval_decision_count),
        negotiated_outcome_count: Number(row.negotiated_outcome_count),
        finance_realization_count: Number(row.finance_realization_count),
      })),
      conflicts_by_contract: rowsByContract(conflictRows),
      failures,
    };
    console.log(JSON.stringify(event, null, 2));
    if (failures.length > 0) process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(
    JSON.stringify(
      {
        event: "source_contract_optimization_spine_readback",
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      null,
      2,
    ),
  );
  process.exitCode = 1;
});
