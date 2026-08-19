#!/usr/bin/env node
// Clears a persisted contract-optimization baseline/opportunity/case for one contract so the
// next page load recomputes fresh from current evidence, instead of short-circuiting to a
// stale persisted result (getPersistedContractOptimizationOpportunitySet in read-adapter.ts).
//
// Scope: tenant_key + contract_id only, three tables (source.optimization_case,
// source.optimization_opportunity, source.optimization_baseline). Live page state confirmed
// nothing downstream of the baseline was ever created for this case (no approval request, no
// outcome, no finance confirmation), so those tables are out of scope here. Plan mode
// (default) only SELECTs and prints counts; nothing is deleted without --apply.
//
// Usage:
//   node scripts/source/reset-optimization-case.mjs --tenant-key skyharbor-air --contract-id CTR-061 [--apply]
import { Client } from "pg";

function arg(name, fallback = null) {
  const index = process.argv.indexOf(name);
  if (index >= 0) return process.argv[index + 1] ?? fallback;
  return fallback;
}

function hasFlag(name) {
  return process.argv.includes(name);
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

const TABLES = [
  "optimization_opportunity",
  "optimization_baseline",
  "optimization_case",
];

async function main() {
  const apply = hasFlag("--apply");
  const tenantKey = arg("--tenant-key", process.env.TENANT_KEY);
  const contractId = arg("--contract-id", process.env.CONTRACT_ID);
  const aliasesRaw = arg("--tenant-aliases", process.env.TENANT_ALIASES || "");
  if (!tenantKey || !contractId) {
    throw new Error("Both --tenant-key and --contract-id are required.");
  }
  const aliases = [
    ...new Set([tenantKey, ...aliasesRaw.split(",").map((a) => a.trim()).filter(Boolean)]),
  ];

  const client = new Client(
    postgresClientOptions(databaseUrl(), "reset-optimization-case"),
  );
  await client.connect();
  try {
    const before = {};
    for (const table of TABLES) {
      const result = await client.query(
        `SELECT count(*)::int AS n FROM source.${table} WHERE tenant_key = ANY($1::text[]) AND contract_id = $2`,
        [aliases, contractId],
      );
      before[table] = result.rows[0]?.n ?? 0;
    }

    if (!apply) {
      console.log(
        JSON.stringify(
          { event: "reset_optimization_case_plan", apply: false, tenantKey, aliases, contractId, wouldDelete: before },
          null,
          2,
        ),
      );
      return;
    }

    const deleted = {};
    await client.query("BEGIN");
    try {
      for (const table of TABLES) {
        const result = await client.query(
          `DELETE FROM source.${table} WHERE tenant_key = ANY($1::text[]) AND contract_id = $2`,
          [aliases, contractId],
        );
        deleted[table] = result.rowCount ?? 0;
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    }

    const after = {};
    for (const table of TABLES) {
      const result = await client.query(
        `SELECT count(*)::int AS n FROM source.${table} WHERE tenant_key = ANY($1::text[]) AND contract_id = $2`,
        [aliases, contractId],
      );
      after[table] = result.rows[0]?.n ?? 0;
    }

    console.log(
      JSON.stringify(
        { event: "reset_optimization_case_applied", apply: true, tenantKey, aliases, contractId, before, deleted, after },
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
