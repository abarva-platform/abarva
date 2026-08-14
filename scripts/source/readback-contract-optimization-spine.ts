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
    const [coverageRows, conflictRows] = await Promise.all([
      readCoverage(client, args),
      readConflicts(client, args),
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
