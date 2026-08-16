#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

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

const ID_COLUMN_NAMES = new Set(["tenant_id", "client_id"]);

const TEXT_TYPES = new Set([
  "character varying",
  "character",
  "text",
  "citext",
  "uuid",
]);

function stamp() {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function usage() {
  return `Usage:
  node scripts/governance/retired-tenant-inventory.mjs [options]

Options:
  --database-url <url>     Postgres URL. Defaults to DATABASE_URL / ABARVA_AZURE_DATABASE_URL / AZURE_DATABASE_URL.
  --out-dir <path>         Output directory. Defaults to /tmp/retired-tenant-inventory-<timestamp>.
  --sample-limit <n>       Row samples per table. Default: 3.
  --include-json-scan      Also scan json/jsonb/text payload columns for retired-key text references. Slower.
  --help                   Show this help.

The script is read-only. It emits:
  - inventory.json
  - row-counts.csv
  - delete-plan.sql
  - export-plan.sql
  - summary.md
`;
}

function parseArgs(argv) {
  const parsed = {
    databaseUrl:
      process.env.DATABASE_URL ||
      process.env.ABARVA_AZURE_DATABASE_URL ||
      process.env.AZURE_DATABASE_URL ||
      "",
    outDir: path.join(os.tmpdir(), `retired-tenant-inventory-${stamp()}`),
    sampleLimit: 3,
    includeJsonScan: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = () => {
      i += 1;
      if (i >= argv.length) throw new Error(`${arg} requires a value`);
      return argv[i];
    };
    if (arg === "--help" || arg === "-h") parsed.help = true;
    else if (arg === "--database-url") parsed.databaseUrl = next();
    else if (arg === "--out-dir") parsed.outDir = next();
    else if (arg === "--sample-limit") parsed.sampleLimit = Number(next());
    else if (arg === "--include-json-scan") parsed.includeJsonScan = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  if (!Number.isInteger(parsed.sampleLimit) || parsed.sampleLimit < 0 || parsed.sampleLimit > 25) {
    throw new Error("--sample-limit must be an integer between 0 and 25");
  }

  return parsed;
}

function quoteIdent(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function qualified(schema, table) {
  return `${quoteIdent(schema)}.${quoteIdent(table)}`;
}

function csvEscape(value) {
  const text = value == null ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(rows, columns) {
  return [
    columns.join(","),
    ...rows.map((row) => columns.map((column) => csvEscape(row[column])).join(",")),
  ].join("\n");
}

function postgresOptions(connectionString) {
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
    application_name: "retired-tenant-inventory",
    ssl: disableSsl ? false : { rejectUnauthorized: false },
  };
}

async function getTables(client) {
  const result = await client.query(`
    select table_schema, table_name
    from information_schema.tables
    where table_type = 'BASE TABLE'
      and table_schema not in ('pg_catalog', 'information_schema')
      and table_schema not like 'pg_toast%'
    order by table_schema, table_name
  `);
  return result.rows;
}

async function getColumns(client) {
  const result = await client.query(`
    select table_schema, table_name, column_name, data_type, udt_name
    from information_schema.columns
    where table_schema not in ('pg_catalog', 'information_schema')
      and table_schema not like 'pg_toast%'
    order by table_schema, table_name, ordinal_position
  `);
  const byTable = new Map();
  for (const row of result.rows) {
    const key = `${row.table_schema}.${row.table_name}`;
    const list = byTable.get(key) || [];
    list.push(row);
    byTable.set(key, list);
  }
  return byTable;
}

async function resolveClientIds(client) {
  const exists = await client.query(
    `select to_regclass('public.clients')::text as clients_table`,
  );
  if (!exists.rows[0]?.clients_table) return { retiredClientIds: [], keepClientIds: [], clientRows: [] };

  const columns = await client.query(`
    select column_name
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'clients'
  `);
  const names = new Set(columns.rows.map((row) => row.column_name));
  const predicates = [];
  const values = [];
  let index = 1;
  for (const column of ["tenant_key", "slug", "key", "client_key", "name", "legal_name"]) {
    if (!names.has(column)) continue;
    predicates.push(`lower(${quoteIdent(column)}::text) = any($${index}::text[])`);
    values.push(RETIRED_KEYS.map((key) => key.toLowerCase()));
    index += 1;
  }
  for (const column of ["tenant_key", "slug", "key", "client_key"]) {
    if (!names.has(column)) continue;
    predicates.push(`lower(${quoteIdent(column)}::text) = any($${index}::text[])`);
    values.push(KEEP_KEYS.map((key) => key.toLowerCase()));
    index += 1;
  }
  if (predicates.length === 0 || !names.has("id")) {
    return { retiredClientIds: [], keepClientIds: [], clientRows: [] };
  }

  const result = await client.query(
    `select * from public.clients where ${predicates.join(" or ")} order by id::text`,
    values,
  );
  const retiredClientIds = [];
  const keepClientIds = [];
  for (const row of result.rows) {
    const valuesToMatch = Object.values(row).map((value) => String(value ?? "").toLowerCase());
    if (valuesToMatch.some((value) => RETIRED_KEYS.includes(value))) retiredClientIds.push(String(row.id));
    if (valuesToMatch.some((value) => KEEP_KEYS.includes(value))) keepClientIds.push(String(row.id));
  }
  return {
    retiredClientIds: [...new Set(retiredClientIds)],
    keepClientIds: [...new Set(keepClientIds)],
    clientRows: result.rows,
  };
}

function isTenantColumn(column) {
  const name = column.column_name.toLowerCase();
  if (TENANT_COLUMN_NAMES.has(name)) return true;
  return (name.endsWith("_tenant_key") || name.endsWith("_client_key")) && TEXT_TYPES.has(column.data_type);
}

function isIdColumn(column) {
  const name = column.column_name.toLowerCase();
  return ID_COLUMN_NAMES.has(name) || name.endsWith("_client_id") || name.endsWith("_tenant_id");
}

function isJsonPayloadColumn(column) {
  const name = column.column_name.toLowerCase();
  return (
    ["json", "jsonb"].includes(column.data_type) ||
    (column.data_type === "text" && /(payload|context|dossier|packet|manifest|metadata|render|json|body)/.test(name))
  );
}

function buildWhere(columns, retiredClientIds, includeJsonScan = false) {
  const clauses = [];
  const params = [];

  const retiredKeyParam = () => {
    params.push(RETIRED_KEYS.map((key) => key.toLowerCase()));
    return `$${params.length}::text[]`;
  };
  const retiredIdParam = () => {
    params.push(retiredClientIds);
    return `$${params.length}::text[]`;
  };

  for (const column of columns) {
    const identifier = quoteIdent(column.column_name);
    const name = column.column_name.toLowerCase();
    if (isTenantColumn(column) && TEXT_TYPES.has(column.data_type)) {
      clauses.push({
        kind: "tenant_key_column",
        column: column.column_name,
        sql: `lower(${identifier}::text) = any(${retiredKeyParam()})`,
      });
      continue;
    }
    if (retiredClientIds.length > 0 && isIdColumn(column) && TEXT_TYPES.has(column.data_type)) {
      clauses.push({
        kind: "client_id_column",
        column: column.column_name,
        sql: `${identifier}::text = any(${retiredIdParam()})`,
      });
      continue;
    }
    if (includeJsonScan && isJsonPayloadColumn(column)) {
      clauses.push({
        kind: "payload_text_reference",
        column: column.column_name,
        sql: `exists (select 1 from unnest(${retiredKeyParam()}) as retired_key where lower(${identifier}::text) like '%' || retired_key || '%')`,
      });
    }
    if (includeJsonScan && name === "source_file" && TEXT_TYPES.has(column.data_type)) {
      clauses.push({
        kind: "source_file_text_reference",
        column: column.column_name,
        sql: `exists (select 1 from unnest(${retiredKeyParam()}) as retired_key where lower(${identifier}::text) like '%' || retired_key || '%')`,
      });
    }
  }

  if (clauses.length === 0) return null;
  return {
    sql: clauses.map((clause) => `(${clause.sql})`).join(" or "),
    params,
    matchedColumns: clauses.map(({ kind, column }) => ({ kind, column })),
  };
}

async function countTable(client, table, columns, retiredClientIds, sampleLimit, includeJsonScan) {
  const where = buildWhere(columns, retiredClientIds, includeJsonScan);
  if (!where) return null;
  const q = qualified(table.table_schema, table.table_name);
  const countResult = await client.query(`select count(*)::bigint as row_count from ${q} where ${where.sql}`, where.params);
  const rowCount = Number(countResult.rows[0]?.row_count || 0);
  let samples = [];
  if (rowCount > 0 && sampleLimit > 0) {
    const sampleResult = await client.query(
      `select row_to_json(t) as sample from (select * from ${q} where ${where.sql} limit ${sampleLimit}) t`,
      where.params,
    );
    samples = sampleResult.rows.map((row) => row.sample);
  }
  return {
    schema: table.table_schema,
    table: table.table_name,
    qualifiedName: `${table.table_schema}.${table.table_name}`,
    rowCount,
    matchedColumns: where.matchedColumns,
    whereSql: where.sql,
    samples,
  };
}

function renderDeletePlan(rows) {
  const lines = [
    "-- Retired tenant cleanup delete plan.",
    "-- Review inventory.json and export rows before execution.",
    "-- This file is not executed by the inventory script.",
    "begin;",
    "",
  ];
  for (const row of rows.filter((item) => item.rowCount > 0)) {
    lines.push(`-- ${row.qualifiedName}: ${row.rowCount} rows`);
    lines.push(`delete from ${qualified(row.schema, row.table)} where ${row.whereSql};`);
    lines.push("");
  }
  lines.push("-- commit; -- uncomment only after archive/export proof is complete");
  lines.push("rollback;");
  return lines.join("\n");
}

function renderExportPlan(rows) {
  const lines = [
    "-- Retired tenant cleanup export plan.",
    "-- Run with psql from a secure operator environment before any delete.",
    "",
  ];
  for (const row of rows.filter((item) => item.rowCount > 0)) {
    const fileName = `${row.schema}.${row.table}.retired-tenants.ndjson`.replace(/[^a-zA-Z0-9._-]/g, "_");
    lines.push(`-- ${row.qualifiedName}: ${row.rowCount} rows`);
    lines.push(`\\copy (select row_to_json(t) from (select * from ${qualified(row.schema, row.table)} where ${row.whereSql}) t) to '${fileName}';`);
    lines.push("");
  }
  return lines.join("\n");
}

function renderSummary({ generatedAt, database, clientScope, rows, includeJsonScan }) {
  const positive = rows.filter((row) => row.rowCount > 0);
  const totalRows = positive.reduce((sum, row) => sum + row.rowCount, 0);
  const bySchema = new Map();
  for (const row of positive) {
    bySchema.set(row.schema, (bySchema.get(row.schema) || 0) + row.rowCount);
  }
  return [
    "# Retired Tenant Inventory",
    "",
    `Generated: ${generatedAt}`,
    `Database: ${database.current_database} as ${database.current_user}`,
    "",
    "## Scope",
    "",
    `Retired keys: ${RETIRED_KEYS.map((key) => `\`${key}\``).join(", ")}`,
    `Keep keys: ${KEEP_KEYS.map((key) => `\`${key}\``).join(", ")}`,
    `Retired client IDs resolved: ${clientScope.retiredClientIds.length}`,
    `Keep client IDs resolved: ${clientScope.keepClientIds.length}`,
    `Payload/text scan included: ${includeJsonScan ? "yes" : "no"}`,
    "",
    "## Counts",
    "",
    `Tables with retired rows: ${positive.length}`,
    `Retired rows found: ${totalRows}`,
    "",
    "## Rows By Schema",
    "",
    ...[...bySchema.entries()].sort().map(([schema, count]) => `- ${schema}: ${count}`),
    "",
    "## Tables",
    "",
    "| Table | Rows | Matched columns |",
    "| --- | ---: | --- |",
    ...positive
      .sort((a, b) => b.rowCount - a.rowCount || a.qualifiedName.localeCompare(b.qualifiedName))
      .map((row) => `| ${row.qualifiedName} | ${row.rowCount} | ${row.matchedColumns.map((col) => `${col.column} (${col.kind})`).join("; ")} |`),
    "",
  ].join("\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage());
    return;
  }
  if (!args.databaseUrl) {
    throw new Error("DATABASE_URL, ABARVA_AZURE_DATABASE_URL, AZURE_DATABASE_URL, or --database-url is required.");
  }

  const { Client } = await import("pg");
  fs.mkdirSync(args.outDir, { recursive: true });
  const client = new Client(postgresOptions(args.databaseUrl));
  await client.connect();
  try {
    await client.query("set statement_timeout = '90s'");
    await client.query("set lock_timeout = '2s'");
    const database = (await client.query("select current_database(), current_user")).rows[0];
    const clientScope = await resolveClientIds(client);
    const tables = await getTables(client);
    const columnsByTable = await getColumns(client);
    const rows = [];
    for (const table of tables) {
      const columns = columnsByTable.get(`${table.table_schema}.${table.table_name}`) || [];
      const counted = await countTable(
        client,
        table,
        columns,
        clientScope.retiredClientIds,
        args.sampleLimit,
        args.includeJsonScan,
      );
      if (counted) rows.push(counted);
    }

    const generatedAt = new Date().toISOString();
    const inventory = {
      generatedAt,
      scope: { retiredKeys: RETIRED_KEYS, keepKeys: KEEP_KEYS },
      database,
      clientScope,
      includeJsonScan: args.includeJsonScan,
      tablesScanned: tables.length,
      tablesWithTenantPredicates: rows.length,
      tablesWithRetiredRows: rows.filter((row) => row.rowCount > 0).length,
      retiredRows: rows.reduce((sum, row) => sum + row.rowCount, 0),
      rows,
    };

    fs.writeFileSync(path.join(args.outDir, "inventory.json"), JSON.stringify(inventory, null, 2));
    fs.writeFileSync(
      path.join(args.outDir, "row-counts.csv"),
      toCsv(
        rows.map((row) => ({
          schema: row.schema,
          table: row.table,
          rowCount: row.rowCount,
          matchedColumns: row.matchedColumns.map((col) => `${col.column}:${col.kind}`).join(";"),
        })),
        ["schema", "table", "rowCount", "matchedColumns"],
      ),
    );
    fs.writeFileSync(path.join(args.outDir, "delete-plan.sql"), renderDeletePlan(rows));
    fs.writeFileSync(path.join(args.outDir, "export-plan.sql"), renderExportPlan(rows));
    fs.writeFileSync(path.join(args.outDir, "summary.md"), renderSummary({
      generatedAt,
      database,
      clientScope,
      rows,
      includeJsonScan: args.includeJsonScan,
    }));
    console.log(JSON.stringify({
      ok: true,
      outDir: args.outDir,
      tablesScanned: inventory.tablesScanned,
      tablesWithTenantPredicates: inventory.tablesWithTenantPredicates,
      tablesWithRetiredRows: inventory.tablesWithRetiredRows,
      retiredRows: inventory.retiredRows,
    }, null, 2));
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
