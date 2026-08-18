#!/usr/bin/env node
// Read-only diagnostic. Prints every row in source.golden_contract_pricing_schedule for a
// contract, across all tenant_key values that currently exist for it (not just one alias),
// to check whether a stale tenant-key-tagged copy coexists with a corrected one. Never writes.
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
  const contractId = arg("--contract-id", process.env.CONTRACT_ID || "CTR-061");
  const client = new Client(
    postgresClientOptions(databaseUrl(), "inspect-golden-pricing-schedule-rows"),
  );
  await client.connect();
  try {
    const rows = await client.query(
      `SELECT _tenant_key, _dataset_id, _loaded_at, line_item_id, sku_or_service_code,
              annual_value_usd
         FROM source.golden_contract_pricing_schedule
        WHERE contract_id = $1
        ORDER BY _tenant_key, line_item_id`,
      [contractId],
    );
    const byTenant = {};
    for (const r of rows.rows) {
      byTenant[r._tenant_key] ??= { count: 0, sum: 0, datasetIds: new Set() };
      byTenant[r._tenant_key].count += 1;
      byTenant[r._tenant_key].sum += Number(r.annual_value_usd) || 0;
      byTenant[r._tenant_key].datasetIds.add(r._dataset_id);
    }
    const summary = Object.fromEntries(
      Object.entries(byTenant).map(([k, v]) => [
        k,
        { count: v.count, sum: v.sum, datasetIds: [...v.datasetIds] },
      ]),
    );
    console.log(
      JSON.stringify({ contractId, summary, rows: rows.rows }, null, 2),
    );
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
