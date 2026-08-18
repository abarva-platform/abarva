#!/usr/bin/env node
// Read-only diagnostic. Prints the live definition of source.contract_vendor_360
// and source.contract_360, plus row counts for source.contract/source.vendor and
// the two views, all scoped to one tenant key. Never writes.
import { Client } from "pg";

function arg(name, fallback = null) {
  const index = process.argv.indexOf(name);
  if (index >= 0) return process.argv[index + 1] ?? fallback;
  return fallback;
}

function databaseUrl() {
  const url =
    process.env.ABARVA_AZURE_DATABASE_URL ||
    process.env.AZURE_DATABASE_URL ||
    process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "Missing ABARVA_AZURE_DATABASE_URL, AZURE_DATABASE_URL, or DATABASE_URL.",
    );
  }
  return url;
}

function postgresClientOptions(connectionString, applicationName) {
  return {
    connectionString,
    application_name: applicationName,
    connectionTimeoutMillis: Number(process.env.PG_CONNECT_TIMEOUT_MS || 15000),
    query_timeout: Number(process.env.PG_QUERY_TIMEOUT_MS || 120000),
    statement_timeout: Number(process.env.PG_STATEMENT_TIMEOUT_MS || 120000),
    ssl: connectionString.includes("sslmode=disable")
      ? false
      : { rejectUnauthorized: true },
  };
}

async function main() {
  const tenantKey = arg("--tenant-key", process.env.TENANT_KEY || "skyharbor-air");
  const client = new Client(
    postgresClientOptions(databaseUrl(), "inspect-source-contract-360-definition"),
  );
  await client.connect();
  try {
    // source.can_read_sourcing_tenant() reads this session var; without it every RLS-gated
    // view returns zero rows regardless of what the underlying tables hold.
    await client.query("SELECT set_config('app.tenant_key', $1, false)", [tenantKey]);

    const activeLoadRun = await client.query(
      `SELECT to_regclass('source.l4_cube_active_load_run') AS table_exists`,
    );
    let activeLoadRunRows = [];
    if (activeLoadRun.rows[0]?.table_exists) {
      const r = await client.query(
        `SELECT * FROM source.l4_cube_active_load_run WHERE tenant_key = $1`,
        [tenantKey],
      );
      activeLoadRunRows = r.rows;
    }

    const contractLoadRuns = await client.query(
      `SELECT load_run_id, count(*)::int AS row_count
         FROM source.contract
        WHERE tenant_key = $1
        GROUP BY load_run_id
        ORDER BY row_count DESC`,
      [tenantKey],
    );

    const relkind = await client.query(
      `SELECT c.relname, c.relkind
         FROM pg_class c
         JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'source' AND c.relname IN ('contract', 'vendor', 'contract_360', 'contract_vendor_360')
        ORDER BY c.relname`,
    );
    const viewdefs = await client.query(
      `SELECT
         (SELECT pg_get_viewdef('source.contract_vendor_360'::regclass, true)) AS contract_vendor_360_def,
         (SELECT pg_get_viewdef('source.contract_360'::regclass, true)) AS contract_360_def`,
    );
    const counts = await client.query(
      `SELECT
         (SELECT count(*)::int FROM source.contract WHERE tenant_key = $1) AS source_contract_rows,
         (SELECT count(*)::int FROM source.vendor WHERE tenant_key = $1) AS source_vendor_rows,
         (SELECT count(*)::int FROM source.contract_vendor_360 WHERE tenant_key = $1) AS contract_vendor_360_rows,
         (SELECT count(*)::int FROM source.contract_360 WHERE tenant_key = $1) AS contract_360_rows,
         (SELECT count(*)::int FROM source.contract WHERE tenant_key = $1 AND contract_id IN ('CTR-061','CTR-090')) AS source_contract_target_rows,
         (SELECT count(*)::int FROM source.contract_vendor_360 WHERE tenant_key = $1 AND contract_id IN ('CTR-061','CTR-090')) AS contract_vendor_360_target_rows`,
      [tenantKey],
    );
    const regclassExists = await client.query(
      `SELECT to_regclass('raw_enterprise_it.vendors_contracts') AS raw_table,
              to_regclass('sem.contract_wide') AS sem_wide`,
    );
    console.log(
      JSON.stringify(
        {
          tenantKey,
          relkinds: relkind.rows,
          regclassExists: regclassExists.rows[0],
          activeLoadRunTableExists: Boolean(activeLoadRun.rows[0]?.table_exists),
          activeLoadRunRows,
          contractLoadRuns: contractLoadRuns.rows,
          counts: counts.rows[0],
          contract_vendor_360_def: viewdefs.rows[0].contract_vendor_360_def,
          contract_360_def: viewdefs.rows[0].contract_360_def,
        },
        null,
        2,
      ),
    );
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
