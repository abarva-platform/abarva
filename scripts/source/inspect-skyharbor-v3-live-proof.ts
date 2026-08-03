import { Client } from "pg";
import { postgresClientOptions } from "../../src/scripts/postgres-client-options";

const DATASET_ID = "skyharbor_global_synthetic_current_state_v3";
const EXPECTED = {
  rawTables: 28,
  rawRows: 9656,
  contractVendor360Rows: 119,
  contract360Rows: 119,
  contractAnnualValue: "1480500000",
  metricDefinitionsMinimum: 18,
  metricObservations: 7174,
  valueClaims: 162,
  fundedNoBaseline: 150,
  usageSupported: 12,
  financeValidated: 0,
  claimable: 0,
};

function databaseUrl(): string {
  const url =
    process.env.ABARVA_AZURE_DATABASE_URL ||
    process.env.AZURE_DATABASE_URL ||
    process.env.DATABASE_URL;
  if (!url) throw new Error("Missing DATABASE_URL");
  return url;
}

function tenantKey(): string {
  return process.env.TENANT_KEY || process.env.SKYHARBOR_TENANT_KEY || "skyharbor_global";
}

function asInt(value: unknown): number {
  return Number.parseInt(String(value ?? "0"), 10);
}

function asNumericString(value: unknown): string {
  return String(value ?? "0");
}

function failUnless(condition: boolean, failures: string[], message: string) {
  if (!condition) failures.push(message);
}

async function main() {
  const tenant = tenantKey();
  const client = new Client(postgresClientOptions(databaseUrl(), "skyharbor-v3-live-proof"));
  await client.connect();
  try {
    await client.query("select set_config('app.tenant_key', $1, false)", [tenant]);

    const schemas = ["raw_enterprise_it", "raw_data_analytics", "raw_cloud_hybrid"];
    const rawTables = await client.query<{ table_schema: string; table_name: string; row_count: string }>(
      `
      select
        table_schema,
        table_name,
        (
          xpath('/row/cnt/text()', query_to_xml(
            format('select count(*) as cnt from %I.%I where _tenant_key = %L and _dataset_id = %L', table_schema, table_name, $1, $2),
            false,
            true,
            ''
          ))
        )[1]::text as row_count
      from information_schema.tables
      where table_schema = any($3::text[])
        and table_type = 'BASE TABLE'
        and table_name <> '_column_map'
      order by table_schema, table_name
      `,
      [tenant, DATASET_ID, schemas],
    );

    const source = await client.query<{
      contract_vendor_360_rows: string;
      contract_360_rows: string;
      contract_annual_value: string;
      distinct_vendors: string;
    }>(
      `
      select
        (select count(*) from source.contract_vendor_360 where tenant_key = $1)::int as contract_vendor_360_rows,
        (select count(*) from source.contract_360 where tenant_key = $1)::int as contract_360_rows,
        (select coalesce(sum(annual_value), 0) from source.contract_vendor_360 where tenant_key = $1)::numeric as contract_annual_value,
        (select count(distinct vendor_ref) from source.contract_vendor_360 where tenant_key = $1)::int as distinct_vendors
      `,
      [tenant],
    );

    const tower = await client.query<{
      metric_definitions: string;
      tracked_subjects: string;
      metric_provenance: string;
      metric_observations: string;
      value_claims: string;
      known_value_claims: string;
      unknown_value_claims: string;
      known_zero_value_claims: string;
      finance_validated_claims: string;
      claimable_claims: string;
    }>(
      `
      select
        (select count(*) from tower.metric_definition where active)::int as metric_definitions,
        (select count(*) from tower.tracked_subject where tenant_key = $1)::int as tracked_subjects,
        (select count(*) from tower.metric_provenance where tenant_key = $1)::int as metric_provenance,
        (select count(*) from tower.metric_observation where tenant_key = $1)::int as metric_observations,
        (select count(*) from tower.value_claim where tenant_key = $1)::int as value_claims,
        (select count(*) from tower.value_claim where tenant_key = $1 and calculated_value is not null)::int as known_value_claims,
        (select count(*) from tower.value_claim where tenant_key = $1 and calculated_value is null)::int as unknown_value_claims,
        (select count(*) from tower.value_claim where tenant_key = $1 and calculated_value = 0)::int as known_zero_value_claims,
        (select count(*) from tower.value_claim where tenant_key = $1 and lower(claim_state) = 'finance_validated')::int as finance_validated_claims,
        (select count(*) from tower.value_claim where tenant_key = $1 and lower(claim_state) = 'claimable')::int as claimable_claims
      `,
      [tenant],
    );

    const claimStateRows = await client.query<{ claim_state: string; count: string }>(
      `
      select lower(claim_state) as claim_state, count(*)::int as count
      from tower.value_claim
      where tenant_key = $1
      group by lower(claim_state)
      order by lower(claim_state)
      `,
      [tenant],
    );

    const rawTableRows = rawTables.rows.map((row) => ({
      schema: row.table_schema,
      table: row.table_name,
      row_count: asInt(row.row_count),
    }));
    const rawRowTotal = rawTableRows.reduce((sum, row) => sum + row.row_count, 0);
    const claimStateDistribution = Object.fromEntries(
      claimStateRows.rows.map((row) => [row.claim_state, asInt(row.count)]),
    );
    const sourceRow = source.rows[0];
    const towerRow = tower.rows[0];

    const failures: string[] = [];
    failUnless(rawTableRows.length === EXPECTED.rawTables, failures, `raw table count ${rawTableRows.length} != ${EXPECTED.rawTables}`);
    failUnless(rawRowTotal === EXPECTED.rawRows, failures, `raw row count ${rawRowTotal} != ${EXPECTED.rawRows}`);
    failUnless(asInt(sourceRow.contract_vendor_360_rows) === EXPECTED.contractVendor360Rows, failures, "source.contract_vendor_360 count mismatch");
    failUnless(asInt(sourceRow.contract_360_rows) === EXPECTED.contract360Rows, failures, "source.contract_360 count mismatch");
    failUnless(asNumericString(sourceRow.contract_annual_value) === EXPECTED.contractAnnualValue, failures, "contract annual value mismatch");
    failUnless(asInt(towerRow.metric_definitions) >= EXPECTED.metricDefinitionsMinimum, failures, "tower.metric_definition count below expected minimum");
    failUnless(asInt(towerRow.metric_observations) === EXPECTED.metricObservations, failures, "tower.metric_observation count mismatch");
    failUnless(asInt(towerRow.value_claims) === EXPECTED.valueClaims, failures, "tower.value_claim count mismatch");
    failUnless((claimStateDistribution.funded_no_baseline ?? 0) === EXPECTED.fundedNoBaseline, failures, "funded_no_baseline count mismatch");
    failUnless((claimStateDistribution.usage_supported ?? 0) === EXPECTED.usageSupported, failures, "usage_supported count mismatch");
    failUnless((claimStateDistribution.finance_validated ?? 0) === EXPECTED.financeValidated, failures, "finance_validated count mismatch");
    failUnless((claimStateDistribution.claimable ?? 0) === EXPECTED.claimable, failures, "claimable count mismatch");

    const result = {
      event: "skyharbor_v3_live_readback_verified",
      tenantKey: tenant,
      datasetId: DATASET_ID,
      source: {
        raw_table_count: rawTableRows.length,
        raw_row_count: rawRowTotal,
        contract_vendor_360_rows: asInt(sourceRow.contract_vendor_360_rows),
        contract_360_rows: asInt(sourceRow.contract_360_rows),
        contract_annual_value: asNumericString(sourceRow.contract_annual_value),
        distinct_vendors: asInt(sourceRow.distinct_vendors),
      },
      tower: {
        metric_definitions: asInt(towerRow.metric_definitions),
        tracked_subjects: asInt(towerRow.tracked_subjects),
        metric_provenance: asInt(towerRow.metric_provenance),
        metric_observations: asInt(towerRow.metric_observations),
        value_claims: asInt(towerRow.value_claims),
        known_value_claims: asInt(towerRow.known_value_claims),
        unknown_value_claims: asInt(towerRow.unknown_value_claims),
        known_zero_value_claims: asInt(towerRow.known_zero_value_claims),
        finance_validated_claims: asInt(towerRow.finance_validated_claims),
        claimable_claims: asInt(towerRow.claimable_claims),
        claim_state_distribution: claimStateDistribution,
      },
      passed: failures.length === 0,
      failures,
    };

    console.log(JSON.stringify(result, null, 2));
    if (failures.length) process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
