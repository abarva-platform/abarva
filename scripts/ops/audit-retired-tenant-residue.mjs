#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { Client } from "pg";

const RETIRED_KEYS = Object.freeze([
  "apex-retail",
  "apex",
  "apexretail",
  "lakeshore-holdings",
  "lakeshore-industries",
  "first-capital",
  "firstcapital",
  "first-capital-financial",
  "northstar-clinical",
  "northstar",
  "northstar-clinical-tech",
  "northstar-medtech",
]);

const KEEP_KEYS = Object.freeze([
  "meridian-health",
  "meridian",
  "skyharbor-air",
  "skyharbor",
  "skyharbor_global",
]);

const TABLES = Object.freeze([
  "public.enterprise_context_facts",
  "public.semantic2_entities",
  "public.semantic2_facts",
  "public.semantic2_row_reconciliation",
  "public.semantic2_source_rows",
]);

const TENANT_COLUMN_NAMES = new Set([
  "tenant_key",
  "client_key",
  "tenant_slug",
  "client_slug",
  "tenant",
  "client",
  "client_name",
  "tenant_name",
]);

const TEXT_TYPES = new Set(["character varying", "character", "text", "citext", "uuid"]);

function argValue(name, fallback = null) {
  const prefix = `${name}=`;
  const direct = process.argv.find((arg) => arg.startsWith(prefix));
  if (direct) return direct.slice(prefix.length);
  const index = process.argv.indexOf(name);
  if (index >= 0 && process.argv[index + 1]) return process.argv[index + 1];
  return fallback;
}

function quoteIdent(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function qualified(schema, table) {
  return `${quoteIdent(schema)}.${quoteIdent(table)}`;
}

function parseQualifiedName(value) {
  const [schema, table] = String(value).split(".");
  if (!schema || !table) throw new Error(`Expected schema.table, got ${value}`);
  return { schema, table, qualifiedName: `${schema}.${table}` };
}

function isTenantColumn(column) {
  const name = column.column_name.toLowerCase();
  if (TENANT_COLUMN_NAMES.has(name)) return true;
  return (name.endsWith("_tenant_key") || name.endsWith("_client_key")) && TEXT_TYPES.has(column.data_type);
}

function postgresOptions(connectionString, applicationName) {
  const disableSsl = (() => {
    try {
      const url = new URL(connectionString);
      return url.searchParams.get("sslmode") === "disable" || ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
    } catch {
      return false;
    }
  })();
  return {
    connectionString,
    application_name: applicationName,
    ssl: disableSsl ? false : { rejectUnauthorized: false },
  };
}

async function getColumns(client, schema, table) {
  const result = await client.query(
    `
      select column_name, data_type
      from information_schema.columns
      where table_schema = $1
        and table_name = $2
      order by ordinal_position
    `,
    [schema, table],
  );
  return result.rows;
}

async function auditTable(client, tableRef) {
  const columns = await getColumns(client, tableRef.schema, tableRef.table);
  const tenantColumns = columns.filter((column) => isTenantColumn(column) && TEXT_TYPES.has(column.data_type));
  const total = await client.query(`select count(*)::bigint as count from ${qualified(tableRef.schema, tableRef.table)}`);
  const distributions = [];
  for (const column of tenantColumns) {
    const result = await client.query(
      `
        select
          coalesce(nullif(lower(${quoteIdent(column.column_name)}::text), ''), '<blank>') as value,
          count(*)::bigint as row_count
        from ${qualified(tableRef.schema, tableRef.table)}
        group by 1
        order by count(*) desc, 1
        limit 50
      `,
    );
    distributions.push({
      column: column.column_name,
      values: result.rows.map((row) => ({
        value: row.value,
        rowCount: Number(row.row_count),
        retired: RETIRED_KEYS.includes(row.value),
        keep: KEEP_KEYS.includes(row.value),
      })),
    });
  }
  return {
    qualifiedName: tableRef.qualifiedName,
    totalRows: Number(total.rows[0]?.count ?? 0),
    tenantColumns: tenantColumns.map((column) => column.column_name),
    distributions,
  };
}

function summarize(tableAudits) {
  return tableAudits.map((table) => {
    const retiredRows = new Set();
    const keepRows = new Set();
    return {
      qualifiedName: table.qualifiedName,
      totalRows: table.totalRows,
      tenantColumns: table.tenantColumns,
      retiredValueRows: table.distributions.flatMap((distribution) =>
        distribution.values
          .filter((value) => value.retired)
          .map((value) => {
            retiredRows.add(`${distribution.column}:${value.value}`);
            return { column: distribution.column, value: value.value, rowCount: value.rowCount };
          }),
      ),
      keepValueRows: table.distributions.flatMap((distribution) =>
        distribution.values
          .filter((value) => value.keep)
          .map((value) => {
            keepRows.add(`${distribution.column}:${value.value}`);
            return { column: distribution.column, value: value.value, rowCount: value.rowCount };
          }),
      ),
      hasRetiredValues: retiredRows.size > 0,
      hasKeepValues: keepRows.size > 0,
    };
  });
}

async function main() {
  const databaseUrl =
    argValue("--database-url") ??
    process.env.DATABASE_URL ??
    process.env.ABARVA_AZURE_DATABASE_URL ??
    process.env.AZURE_DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL, ABARVA_AZURE_DATABASE_URL, AZURE_DATABASE_URL, or --database-url is required.");
  }
  const outDir =
    argValue("--out-dir", process.env.RETIRED_TENANT_RESIDUE_AUDIT_OUT_DIR) ??
    path.join(os.tmpdir(), "retired-tenant-residue-audit");
  const runId =
    argValue("--run-id") ??
    `retired-tenant-residue-audit-${new Date().toISOString().replace(/[:.]/g, "")}`;
  fs.mkdirSync(outDir, { recursive: true });

  const client = new Client(postgresOptions(databaseUrl, "retired-tenant-residue-audit"));
  await client.connect();
  try {
    await client.query("set statement_timeout = '10min'");
    const tables = [];
    for (const table of TABLES.map(parseQualifiedName)) {
      tables.push(await auditTable(client, table));
    }
    const proof = {
      event: "retired_tenant_residue_audit",
      run_id: runId,
      generated_at: new Date().toISOString(),
      scope: { retiredKeys: RETIRED_KEYS, keepKeys: KEEP_KEYS },
      tables,
      summary: summarize(tables),
    };
    const proofPath = path.join(outDir, `${runId}.json`);
    fs.writeFileSync(proofPath, `${JSON.stringify(proof, null, 2)}\n`);
    console.log(
      JSON.stringify(
        {
          event: proof.event,
          run_id: proof.run_id,
          generated_at: proof.generated_at,
          summary: proof.summary,
          ok: true,
          proof_path: proofPath,
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
  console.error(error instanceof Error ? error.stack : error);
  process.exit(1);
});
