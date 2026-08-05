#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { Client } from "pg";

const RETIRED_KEYS = Object.freeze([
  "meridian-health",
  "meridian",
  "apex-retail",
  "apex",
  "apexretail",
  "lakeshore-holdings",
  "lakeshore-industries",
  "first-capital",
  "firstcapital",
  "first-capital-financial",
  "skyharbor-air",
]);

const KEEP_KEYS = Object.freeze(["skyharbor_global"]);

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

const TEXT_TYPES = new Set(["character varying", "character", "text", "citext", "uuid"]);

function usage() {
  return `Usage:
  node scripts/ops/purge-retired-tenant-rows.mjs [options]

Options:
  --apply                  Delete matching retired-tenant rows. Env: RETIRED_TENANT_ROW_PURGE_APPLY=1
  --database-url <url>     Postgres URL. Defaults to DATABASE_URL / ABARVA_AZURE_DATABASE_URL / AZURE_DATABASE_URL.
  --out-dir <path>         Output directory. Defaults to /tmp/retired-tenant-row-purge.
  --max-passes <n>         Delete retry passes for FK ordering. Default: 12.
  --validate-only          Parse config and exit without DB access.
  --help                   Show this help.
`;
}

function argValue(name, fallback = null) {
  const prefix = `${name}=`;
  const direct = process.argv.find((arg) => arg.startsWith(prefix));
  if (direct) return direct.slice(prefix.length);
  const index = process.argv.indexOf(name);
  if (index >= 0 && process.argv[index + 1]) return process.argv[index + 1];
  return fallback;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function quoteIdent(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function qualified(schema, table) {
  return `${quoteIdent(schema)}.${quoteIdent(table)}`;
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

function isTenantColumn(column) {
  const name = column.column_name.toLowerCase();
  if (TENANT_COLUMN_NAMES.has(name)) return true;
  return (name.endsWith("_tenant_key") || name.endsWith("_client_key")) && TEXT_TYPES.has(column.data_type);
}

function isIdColumn(column) {
  const name = column.column_name.toLowerCase();
  return ID_COLUMN_NAMES.has(name) || name.endsWith("_client_id") || name.endsWith("_tenant_id");
}

function buildWhere(columns, retiredClientIds) {
  const clauses = [];
  const params = [];

  for (const column of columns) {
    const identifier = quoteIdent(column.column_name);
    if (isTenantColumn(column) && TEXT_TYPES.has(column.data_type)) {
      params.push(RETIRED_KEYS.map((key) => key.toLowerCase()));
      clauses.push({
        column: column.column_name,
        kind: "retired_key",
        sql: `lower(${identifier}::text) = any($${params.length}::text[])`,
      });
      continue;
    }
    if (retiredClientIds.length > 0 && isIdColumn(column) && TEXT_TYPES.has(column.data_type)) {
      params.push(retiredClientIds);
      clauses.push({
        column: column.column_name,
        kind: "retired_client_id",
        sql: `${identifier}::text = any($${params.length}::text[])`,
      });
    }
  }

  if (clauses.length === 0) return null;
  return {
    sql: clauses.map((clause) => `(${clause.sql})`).join(" or "),
    params,
    matchedColumns: clauses.map(({ column, kind }) => ({ column, kind })),
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

async function getColumnsByTable(client) {
  const result = await client.query(`
    select table_schema, table_name, column_name, data_type
    from information_schema.columns
    where table_schema not in ('pg_catalog', 'information_schema')
      and table_schema not like 'pg_toast%'
    order by table_schema, table_name, ordinal_position
  `);
  const byTable = new Map();
  for (const row of result.rows) {
    const key = `${row.table_schema}.${row.table_name}`;
    const columns = byTable.get(key) ?? [];
    columns.push(row);
    byTable.set(key, columns);
  }
  return byTable;
}

async function resolveClientIds(client) {
  const exists = await client.query("select to_regclass('public.clients')::text as clients_table");
  if (!exists.rows[0]?.clients_table) return { retiredClientIds: [], keepClientIds: [], clientRows: [] };

  const columns = await client.query(`
    select column_name
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'clients'
  `);
  const names = new Set(columns.rows.map((row) => row.column_name));
  const matchColumns = ["tenant_key", "slug", "key", "client_key", "name", "legal_name"].filter((column) =>
    names.has(column),
  );
  if (!names.has("id") || matchColumns.length === 0) {
    return { retiredClientIds: [], keepClientIds: [], clientRows: [] };
  }

  const predicates = [];
  const params = [];
  for (const column of matchColumns) {
    params.push(RETIRED_KEYS.map((key) => key.toLowerCase()));
    predicates.push(`lower(${quoteIdent(column)}::text) = any($${params.length}::text[])`);
    params.push(KEEP_KEYS.map((key) => key.toLowerCase()));
    predicates.push(`lower(${quoteIdent(column)}::text) = any($${params.length}::text[])`);
  }

  const result = await client.query(
    `select * from public.clients where ${predicates.join(" or ")} order by id::text`,
    params,
  );
  const retiredClientIds = [];
  const keepClientIds = [];
  for (const row of result.rows) {
    const values = Object.values(row).map((value) => String(value ?? "").toLowerCase());
    if (values.some((value) => RETIRED_KEYS.includes(value))) retiredClientIds.push(String(row.id));
    if (values.some((value) => KEEP_KEYS.includes(value))) keepClientIds.push(String(row.id));
  }
  return {
    retiredClientIds: [...new Set(retiredClientIds)],
    keepClientIds: [...new Set(keepClientIds)],
    clientRows: result.rows,
  };
}

async function buildPlan(client) {
  const clientScope = await resolveClientIds(client);
  const overlap = clientScope.retiredClientIds.filter((id) => clientScope.keepClientIds.includes(id));
  if (overlap.length > 0) {
    throw new Error(`Refusing purge: retired/keep client id overlap detected: ${overlap.join(", ")}`);
  }

  const tables = await getTables(client);
  const columnsByTable = await getColumnsByTable(client);
  const operations = [];

  for (const table of tables) {
    const columns = columnsByTable.get(`${table.table_schema}.${table.table_name}`) ?? [];
    const where = buildWhere(columns, clientScope.retiredClientIds);
    if (!where) continue;
    const result = await client.query(
      `select count(*)::bigint as row_count from ${qualified(table.table_schema, table.table_name)} where ${where.sql}`,
      where.params,
    );
    const rowCount = Number(result.rows[0]?.row_count ?? 0);
    operations.push({
      schema: table.table_schema,
      table: table.table_name,
      qualifiedName: `${table.table_schema}.${table.table_name}`,
      rowCount,
      matchedColumns: where.matchedColumns,
      whereSql: where.sql,
      params: where.params,
    });
  }

  return { clientScope, operations };
}

async function deleteProgramAuditLogIfNeeded(client, operation) {
  if (operation.qualifiedName !== "public.program_audit_log" || operation.rowCount === 0) return null;
  await client.query("alter table public.program_audit_log disable trigger program_audit_log_no_delete");
  try {
    const result = await client.query(
      `delete from ${qualified(operation.schema, operation.table)} where ${operation.whereSql}`,
      operation.params,
    );
    return {
      qualifiedName: operation.qualifiedName,
      rowsDeleted: result.rowCount ?? 0,
      specialCase: "disabled_program_audit_log_no_delete",
    };
  } finally {
    await client.query("alter table public.program_audit_log enable trigger program_audit_log_no_delete");
  }
}

async function applyDeletes(client, operations, maxPasses) {
  const actions = [];
  const pending = operations
    .filter((operation) => operation.rowCount > 0)
    .sort((a, b) => {
      if (a.qualifiedName === "public.clients") return 1;
      if (b.qualifiedName === "public.clients") return -1;
      return b.rowCount - a.rowCount || a.qualifiedName.localeCompare(b.qualifiedName);
    });

  for (const operation of [...pending]) {
    const special = await deleteProgramAuditLogIfNeeded(client, operation);
    if (special) {
      actions.push({ ...special, pass: 0 });
      const index = pending.indexOf(operation);
      pending.splice(index, 1);
    }
  }

  for (let pass = 1; pending.length > 0 && pass <= maxPasses; pass += 1) {
    const next = [];
    let progress = false;
    let savepointIndex = 0;
    for (const operation of pending) {
      savepointIndex += 1;
      const savepoint = `retired_tenant_row_purge_${pass}_${savepointIndex}`;
      await client.query(`savepoint ${savepoint}`);
      try {
        const result = await client.query(
          `delete from ${qualified(operation.schema, operation.table)} where ${operation.whereSql}`,
          operation.params,
        );
        await client.query(`release savepoint ${savepoint}`);
        const rowsDeleted = result.rowCount ?? 0;
        actions.push({ qualifiedName: operation.qualifiedName, rowsDeleted, pass });
        if (rowsDeleted > 0) progress = true;
      } catch (error) {
        await client.query(`rollback to savepoint ${savepoint}`);
        await client.query(`release savepoint ${savepoint}`);
        next.push({
          ...operation,
          lastError: error instanceof Error ? error.message : String(error),
        });
      }
    }
    if (!progress && next.length === pending.length) break;
    pending.splice(0, pending.length, ...next);
  }

  return { actions, pending };
}

function summarizeBySchema(operations) {
  const bySchema = new Map();
  for (const operation of operations.filter((item) => item.rowCount > 0)) {
    bySchema.set(operation.schema, (bySchema.get(operation.schema) ?? 0) + operation.rowCount);
  }
  return Object.fromEntries([...bySchema.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

function stripParams(operation) {
  const copy = { ...operation };
  delete copy.params;
  return copy;
}

async function main() {
  if (hasFlag("--help") || hasFlag("-h")) {
    console.log(usage());
    return;
  }

  const apply = hasFlag("--apply") || process.env.RETIRED_TENANT_ROW_PURGE_APPLY === "1";
  const maxPasses = Number(argValue("--max-passes", process.env.RETIRED_TENANT_ROW_PURGE_MAX_PASSES ?? "12"));
  const outDir =
    argValue("--out-dir", process.env.RETIRED_TENANT_ROW_PURGE_OUT_DIR) ??
    path.join(os.tmpdir(), "retired-tenant-row-purge");
  const runId =
    argValue("--run-id") ??
    `retired-tenant-row-purge-${new Date().toISOString().replace(/[:.]/g, "")}`;

  if (hasFlag("--validate-only")) {
    console.log(
      JSON.stringify({
        ok: true,
        mode: "validate_only",
        retiredKeys: RETIRED_KEYS,
        keepKeys: KEEP_KEYS,
        maxPasses,
      }),
    );
    return;
  }

  const databaseUrl =
    argValue("--database-url") ??
    process.env.DATABASE_URL ??
    process.env.ABARVA_AZURE_DATABASE_URL ??
    process.env.AZURE_DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL, ABARVA_AZURE_DATABASE_URL, AZURE_DATABASE_URL, or --database-url is required.");
  }
  if (!Number.isInteger(maxPasses) || maxPasses < 1 || maxPasses > 30) {
    throw new Error("--max-passes must be an integer between 1 and 30");
  }

  fs.mkdirSync(outDir, { recursive: true });
  const client = new Client(postgresOptions(databaseUrl, `retired-tenant-row-purge-${apply ? "apply" : "dry-run"}`));
  await client.connect();
  try {
    await client.query("set statement_timeout = '180s'");
    await client.query("set lock_timeout = '5s'");
    const before = await buildPlan(client);
    const beforePositive = before.operations.filter((operation) => operation.rowCount > 0);
    const proof = {
      event: "retired_tenant_row_purge_proof",
      run_id: runId,
      generated_at: new Date().toISOString(),
      mode: apply ? "apply" : "dry_run",
      scope: { retiredKeys: RETIRED_KEYS, keepKeys: KEEP_KEYS },
      clientScope: before.clientScope,
      before: {
        tablesWithRetiredRows: beforePositive.length,
        retiredRows: beforePositive.reduce((sum, operation) => sum + operation.rowCount, 0),
        bySchema: summarizeBySchema(before.operations),
        operations: beforePositive.map(stripParams),
      },
      apply: null,
      after: null,
      gates: {
        retiredKeepClientIdOverlap: 0,
        applyAllowed: apply,
      },
    };

    if (apply) {
      await client.query("begin");
      const deletion = await applyDeletes(client, before.operations, maxPasses);
      if (deletion.pending.length > 0) {
        await client.query("rollback");
        proof.apply = {
          committed: false,
          actions: deletion.actions,
          pending: deletion.pending.map(stripParams),
        };
        proof.gates.applyAllowed = false;
        fs.writeFileSync(path.join(outDir, `${runId}.json`), `${JSON.stringify(proof, null, 2)}\n`);
        throw new Error(`Retired tenant purge blocked by ${deletion.pending.length} undeleted table(s).`);
      }
      await client.query("commit");
      proof.apply = {
        committed: true,
        actions: deletion.actions,
        deletedRows: deletion.actions.reduce((sum, action) => sum + Number(action.rowsDeleted ?? 0), 0),
        applied_at: new Date().toISOString(),
      };
      const after = await buildPlan(client);
      const afterPositive = after.operations.filter((operation) => operation.rowCount > 0);
      proof.after = {
        tablesWithRetiredRows: afterPositive.length,
        retiredRows: afterPositive.reduce((sum, operation) => sum + operation.rowCount, 0),
        bySchema: summarizeBySchema(after.operations),
        operations: afterPositive.map(stripParams),
      };
    }

    const proofPath = path.join(outDir, `${runId}.json`);
    fs.writeFileSync(proofPath, `${JSON.stringify(proof, null, 2)}\n`);
    console.log(JSON.stringify({ event: proof.event, ok: true, proof_path: proofPath, proof }, null, 2));
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exit(1);
});
