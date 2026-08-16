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
  "public.semantic2_facts",
  "public.semantic2_row_reconciliation",
  "public.semantic2_entities",
  "public.semantic2_source_rows",
]);

const TRUNCATE_DEPENDENCY_TABLE_PATTERN = /^(public\.)?(semantic2_|enterprise_context_)/;

const DEFAULT_CHUNK_SIZE = 5000;
const DEFAULT_BUDGET_SECONDS = 7000;
const DEFAULT_STATEMENT_TIMEOUT = "2min";

function usage() {
  return `Usage:
  node scripts/ops/purge-retired-tenant-residue.mjs [options]

Options:
  --apply                  Delete matching rows. Env: RETIRED_TENANT_RESIDUE_PURGE_APPLY=1
  --truncate-empty-keep    In apply mode, truncate scoped tables only if all have zero keep-key rows.
                           Env: RETIRED_TENANT_RESIDUE_PURGE_TRUNCATE_EMPTY_KEEP=1
  --database-url <url>     Postgres URL. Defaults to DATABASE_URL / ABARVA_AZURE_DATABASE_URL / AZURE_DATABASE_URL.
  --out-dir <path>         Output directory. Defaults to /tmp/retired-tenant-residue-purge.
  --chunk-size <n>         Rows per delete chunk. Env: RETIRED_TENANT_RESIDUE_PURGE_CHUNK_SIZE. Default: ${DEFAULT_CHUNK_SIZE}.
  --budget-seconds <n>     Graceful budget before exiting partial. Default: ${DEFAULT_BUDGET_SECONDS}.
  --statement-timeout <v>  Per-statement timeout. Env: RETIRED_TENANT_RESIDUE_PURGE_STATEMENT_TIMEOUT. Default: ${DEFAULT_STATEMENT_TIMEOUT}.
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

function parseQualifiedName(value) {
  const [schema, table] = String(value).split(".");
  if (!schema || !table) throw new Error(`Expected schema.table, got ${value}`);
  return { schema, table, qualifiedName: `${schema}.${table}` };
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

function elapsedSeconds(startedAt) {
  return Math.floor((Date.now() - startedAt) / 1000);
}

function indexName(tableRef) {
  return `retired_residue_${tableRef.schema}_${tableRef.table}_tenant_key_idx`.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 62);
}

function fkIndexName(foreignKey) {
  const basis = `${foreignKey.childSchema}_${foreignKey.childTable}_${foreignKey.constraintName}_idx`;
  return `retired_residue_fk_${basis}`.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 62);
}

async function tableExists(client, tableRef) {
  const result = await client.query("select to_regclass($1)::text as regclass", [tableRef.qualifiedName]);
  return Boolean(result.rows[0]?.regclass);
}

async function requireTenantKey(client, tableRef) {
  if (!(await hasTenantKey(client, tableRef))) {
    throw new Error(`${tableRef.qualifiedName} does not have required tenant_key column.`);
  }
}

async function hasTenantKey(client, tableRef) {
  const result = await client.query(
    `
      select data_type
      from information_schema.columns
      where table_schema = $1
        and table_name = $2
        and column_name = 'tenant_key'
    `,
    [tableRef.schema, tableRef.table],
  );
  return result.rowCount === 1;
}

async function countRows(client, tableRef, keys) {
  const result = await client.query(
    `select count(*)::bigint as row_count from ${qualified(tableRef.schema, tableRef.table)} where lower(${quoteIdent("tenant_key")}::text) = any($1::text[])`,
    [keys],
  );
  return Number(result.rows[0]?.row_count ?? 0);
}

async function countAllRows(client, tableRef) {
  const result = await client.query(`select count(*)::bigint as row_count from ${qualified(tableRef.schema, tableRef.table)}`);
  return Number(result.rows[0]?.row_count ?? 0);
}

async function prepareIndex(client, tableRef) {
  await client.query(
    `create index if not exists ${quoteIdent(indexName(tableRef))} on ${qualified(tableRef.schema, tableRef.table)} ((lower(${quoteIdent("tenant_key")}::text)))`,
  );
}

async function getReferencingForeignKeys(client, tableRef) {
  const result = await client.query(
    `
      select
        child_ns.nspname as child_schema,
        child.relname as child_table,
        con.conname as constraint_name,
        array_agg(child_att.attname order by key_position.ordinality) as child_columns
      from pg_constraint con
      join pg_class parent on parent.oid = con.confrelid
      join pg_namespace parent_ns on parent_ns.oid = parent.relnamespace
      join pg_class child on child.oid = con.conrelid
      join pg_namespace child_ns on child_ns.oid = child.relnamespace
      join unnest(con.conkey) with ordinality as key_position(child_attnum, ordinality) on true
      join pg_attribute child_att on child_att.attrelid = child.oid and child_att.attnum = key_position.child_attnum
      where con.contype = 'f'
        and parent_ns.nspname = $1
        and parent.relname = $2
        and child_ns.nspname not in ('pg_catalog', 'information_schema')
        and child_ns.nspname not like 'pg_toast%'
      group by child_ns.nspname, child.relname, con.conname
      order by child_ns.nspname, child.relname, con.conname
    `,
    [tableRef.schema, tableRef.table],
  );
  return result.rows.map((row) => ({
    parentQualifiedName: tableRef.qualifiedName,
    childSchema: row.child_schema,
    childTable: row.child_table,
    childQualifiedName: `${row.child_schema}.${row.child_table}`,
    constraintName: row.constraint_name,
    childColumns: Array.isArray(row.child_columns) ? row.child_columns : [],
  })).filter((row) => row.childColumns.length > 0);
}

async function prepareReferencingIndexes(client, tableRef) {
  const foreignKeys = await getReferencingForeignKeys(client, tableRef);
  const indexes = [];
  for (const foreignKey of foreignKeys) {
    const columns = foreignKey.childColumns.map((column) => quoteIdent(column)).join(", ");
    if (!columns) continue;
    await client.query(
      `create index if not exists ${quoteIdent(fkIndexName(foreignKey))} on ${qualified(foreignKey.childSchema, foreignKey.childTable)} (${columns})`,
    );
    indexes.push({
      parentQualifiedName: foreignKey.parentQualifiedName,
      childQualifiedName: foreignKey.childQualifiedName,
      constraintName: foreignKey.constraintName,
      childColumns: foreignKey.childColumns,
      indexName: fkIndexName(foreignKey),
    });
  }
  return indexes;
}

function isAllowedTruncateDependency(tableRef) {
  return tableRef.schema === "public" && TRUNCATE_DEPENDENCY_TABLE_PATTERN.test(tableRef.qualifiedName);
}

async function resolveTruncateTableRefs(client, tableRefs) {
  const result = await client.query(
    `
      select table_schema, table_name
      from information_schema.tables
      where table_schema = 'public'
        and table_type = 'BASE TABLE'
        and (
          table_name like 'semantic2\\_%' escape '\\'
          or table_name like 'enterprise_context\\_%' escape '\\'
        )
      order by table_schema, table_name
    `,
  );
  const byName = new Map(
    result.rows.map((row) => {
      const tableRef = parseQualifiedName(`${row.table_schema}.${row.table_name}`);
      return [tableRef.qualifiedName, tableRef];
    }),
  );

  for (const tableRef of tableRefs) {
    if (!(await tableExists(client, tableRef))) continue;
    byName.set(tableRef.qualifiedName, tableRef);
  }

  for (const tableRef of byName.values()) {
    if (!isAllowedTruncateDependency(tableRef)) {
      throw new Error(`${tableRef.qualifiedName} is not an allowed residue truncate table.`);
    }
  }

  return Array.from(byName.values()).sort((a, b) => a.qualifiedName.localeCompare(b.qualifiedName));
}

async function deleteChunk(client, tableRef, chunkSize) {
  const result = await client.query(
    `
      delete from ${qualified(tableRef.schema, tableRef.table)} as ${quoteIdent("target")}
      where ${quoteIdent("target")}.ctid in (
        select ${quoteIdent("candidate")}.ctid
        from ${qualified(tableRef.schema, tableRef.table)} as ${quoteIdent("candidate")}
        where lower(${quoteIdent("candidate")}.${quoteIdent("tenant_key")}::text) = any($1::text[])
        limit ${chunkSize}
      )
    `,
    [RETIRED_KEYS],
  );
  return result.rowCount ?? 0;
}

async function audit(client, tableRefs) {
  const tables = [];
  for (const tableRef of tableRefs) {
    if (!(await tableExists(client, tableRef))) {
      tables.push({ qualifiedName: tableRef.qualifiedName, exists: false, retiredRows: 0, keepRows: 0 });
      continue;
    }
    await requireTenantKey(client, tableRef);
    tables.push({
      qualifiedName: tableRef.qualifiedName,
      exists: true,
      totalRows: await countAllRows(client, tableRef),
      retiredRows: await countRows(client, tableRef, RETIRED_KEYS),
      keepRows: await countRows(client, tableRef, KEEP_KEYS),
    });
  }
  return tables;
}

async function truncateEmptyKeepTables(client, tableRefs) {
  const actions = [];
  const existingTableRefs = await resolveTruncateTableRefs(client, tableRefs);
  const existingTableNames = new Set(existingTableRefs.map((tableRef) => tableRef.qualifiedName));
  for (const tableRef of tableRefs) {
    if (!existingTableNames.has(tableRef.qualifiedName)) {
      actions.push({ qualifiedName: tableRef.qualifiedName, skipped: true, reason: "missing_table" });
    }
  }
  for (const tableRef of existingTableRefs) {
    const tenantScoped = await hasTenantKey(client, tableRef);
    const beforeTotalRows = await countAllRows(client, tableRef);
    const beforeRetiredRows = tenantScoped ? await countRows(client, tableRef, RETIRED_KEYS) : null;
    const beforeKeepRows = tenantScoped ? await countRows(client, tableRef, KEEP_KEYS) : null;
    if (beforeKeepRows !== null && beforeKeepRows !== 0) {
      throw new Error(`${tableRef.qualifiedName} has ${beforeKeepRows} keep-key rows; refusing truncate.`);
    }
    actions.push({
      qualifiedName: tableRef.qualifiedName,
      tenantScoped,
      beforeTotalRows,
      beforeRetiredRows,
      beforeKeepRows,
      rowsDeleted: beforeTotalRows,
      retiredRowsDeleted: beforeRetiredRows ?? 0,
      strategy: "truncate_empty_keep",
    });
  }

  if (existingTableRefs.length > 0) {
    const tableList = existingTableRefs.map((tableRef) => qualified(tableRef.schema, tableRef.table)).join(", ");
    console.log(
      JSON.stringify({
        event: "retired_tenant_residue_truncate_start",
        tableCount: existingTableRefs.length,
        tableList: existingTableRefs.map((tableRef) => tableRef.qualifiedName),
      }),
    );
    await client.query(`truncate table ${tableList}`);
    console.log(JSON.stringify({ event: "retired_tenant_residue_truncate_done", tableCount: existingTableRefs.length }));
  }

  for (const action of actions) {
    if (action.skipped) continue;
    const tableRef = parseQualifiedName(action.qualifiedName);
    action.afterTotalRows = await countAllRows(client, tableRef);
    action.afterRetiredRows = action.tenantScoped ? await countRows(client, tableRef, RETIRED_KEYS) : null;
    action.afterKeepRows = action.tenantScoped ? await countRows(client, tableRef, KEEP_KEYS) : null;
    action.complete =
      action.afterTotalRows === 0 &&
      (action.afterRetiredRows === null || action.afterRetiredRows === 0) &&
      (action.afterKeepRows === null || action.afterKeepRows === 0);
  }
  return {
    actions,
    budgetExhausted: false,
    elapsedSeconds: 0,
    strategy: "truncate_empty_keep",
    resolvedTableCount: existingTableRefs.length,
    resolvedTables: existingTableRefs.map((tableRef) => tableRef.qualifiedName),
  };
}

async function applyDeletes(client, tableRefs, { chunkSize, budgetSeconds, statementTimeout }) {
  const startedAt = Date.now();
  const actions = [];
  let budgetExhausted = false;
  for (const tableRef of tableRefs) {
    await client.query("select set_config('statement_timeout', $1, false)", [statementTimeout]);
    if (!(await tableExists(client, tableRef))) {
      actions.push({ qualifiedName: tableRef.qualifiedName, skipped: true, reason: "missing_table" });
      continue;
    }
    await requireTenantKey(client, tableRef);
    await prepareIndex(client, tableRef);
    const referencingIndexes = await prepareReferencingIndexes(client, tableRef);

    const beforeRetiredRows = await countRows(client, tableRef, RETIRED_KEYS);
    const beforeKeepRows = await countRows(client, tableRef, KEEP_KEYS);
    let rowsDeleted = 0;
    let chunks = 0;
    console.log(JSON.stringify({ event: "retired_tenant_residue_table_start", qualifiedName: tableRef.qualifiedName, beforeRetiredRows, beforeKeepRows }));

    while (beforeRetiredRows - rowsDeleted > 0) {
      if (elapsedSeconds(startedAt) >= budgetSeconds) {
        budgetExhausted = true;
        break;
      }
      const deleted = await deleteChunk(client, tableRef, chunkSize);
      chunks += 1;
      rowsDeleted += deleted;
      console.log(JSON.stringify({ event: "retired_tenant_residue_chunk", qualifiedName: tableRef.qualifiedName, chunk: chunks, rowsDeleted, lastChunkRows: deleted }));
      if (deleted === 0 || deleted < chunkSize) break;
    }

    const afterRetiredRows = await countRows(client, tableRef, RETIRED_KEYS);
    const afterKeepRows = await countRows(client, tableRef, KEEP_KEYS);
    actions.push({
      qualifiedName: tableRef.qualifiedName,
      beforeRetiredRows,
      afterRetiredRows,
      beforeKeepRows,
      afterKeepRows,
      referencingIndexes,
      rowsDeleted,
      chunks,
      complete: afterRetiredRows === 0,
    });
    console.log(JSON.stringify({ event: "retired_tenant_residue_table_done", ...actions[actions.length - 1] }));
    if (budgetExhausted) break;
  }
  return { actions, budgetExhausted, elapsedSeconds: elapsedSeconds(startedAt) };
}

async function main() {
  if (hasFlag("--help")) {
    console.log(usage());
    return;
  }

  const apply = hasFlag("--apply") || process.env.RETIRED_TENANT_RESIDUE_PURGE_APPLY === "1";
  const truncateEmptyKeep =
    hasFlag("--truncate-empty-keep") || process.env.RETIRED_TENANT_RESIDUE_PURGE_TRUNCATE_EMPTY_KEEP === "1";
  const chunkSize = Number(argValue("--chunk-size", process.env.RETIRED_TENANT_RESIDUE_PURGE_CHUNK_SIZE ?? String(DEFAULT_CHUNK_SIZE)));
  const budgetSeconds = Number(argValue("--budget-seconds", process.env.RETIRED_TENANT_RESIDUE_PURGE_BUDGET_SECONDS ?? String(DEFAULT_BUDGET_SECONDS)));
  const statementTimeout = argValue("--statement-timeout", process.env.RETIRED_TENANT_RESIDUE_PURGE_STATEMENT_TIMEOUT ?? DEFAULT_STATEMENT_TIMEOUT);
  const outDir =
    argValue("--out-dir", process.env.RETIRED_TENANT_RESIDUE_PURGE_OUT_DIR) ??
    path.join(os.tmpdir(), "retired-tenant-residue-purge");
  const runId =
    argValue("--run-id") ??
    `retired-tenant-residue-purge-${new Date().toISOString().replace(/[:.]/g, "")}`;

  if (!Number.isInteger(chunkSize) || chunkSize < 100 || chunkSize > 50000) {
    throw new Error("--chunk-size must be an integer between 100 and 50000");
  }
  if (!Number.isInteger(budgetSeconds) || budgetSeconds < 60 || budgetSeconds > 7000) {
    throw new Error("--budget-seconds must be an integer between 60 and 7000");
  }
  if (hasFlag("--validate-only")) {
    console.log(JSON.stringify({ ok: true, apply, truncateEmptyKeep, chunkSize, budgetSeconds, statementTimeout }));
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
  fs.mkdirSync(outDir, { recursive: true });

  const tableRefs = TABLES.map(parseQualifiedName);
  const client = new Client(postgresOptions(databaseUrl, "retired-tenant-residue-purge"));
  await client.connect();
  try {
    await client.query("set lock_timeout = '30s'");
    await client.query("select set_config('statement_timeout', $1, false)", [statementTimeout]);
    const before = await audit(client, tableRefs);
    const deletion = apply
      ? truncateEmptyKeep
        ? await truncateEmptyKeepTables(client, tableRefs)
        : await applyDeletes(client, tableRefs, { chunkSize, budgetSeconds, statementTimeout })
      : null;
    const after = await audit(client, tableRefs);
    const proof = {
      event: "retired_tenant_residue_purge",
      run_id: runId,
      generated_at: new Date().toISOString(),
      mode: apply ? "apply" : "dry_run",
      config: { chunkSize, budgetSeconds, statementTimeout, truncateEmptyKeep },
      scope: { retiredKeys: RETIRED_KEYS, keepKeys: KEEP_KEYS, tables: TABLES },
      before,
      deletion,
      after,
      summary: {
        retiredRowsBefore: before.reduce((sum, table) => sum + table.retiredRows, 0),
        retiredRowsAfter: after.reduce((sum, table) => sum + table.retiredRows, 0),
        keepRowsBefore: before.reduce((sum, table) => sum + table.keepRows, 0),
        keepRowsAfter: after.reduce((sum, table) => sum + table.keepRows, 0),
        totalRowsBefore: before.reduce((sum, table) => sum + (table.totalRows ?? 0), 0),
        totalRowsAfter: after.reduce((sum, table) => sum + (table.totalRows ?? 0), 0),
        rowsDeleted: deletion?.actions?.reduce((sum, action) => sum + (action.rowsDeleted ?? 0), 0) ?? 0,
        completed: after.every((table) => table.retiredRows === 0),
        budgetExhausted: deletion?.budgetExhausted ?? false,
      },
    };
    const proofPath = path.join(outDir, `${runId}.json`);
    fs.writeFileSync(proofPath, `${JSON.stringify(proof, null, 2)}\n`);
    console.log(
      JSON.stringify(
        {
          event: proof.event,
          run_id: proof.run_id,
          generated_at: proof.generated_at,
          mode: proof.mode,
          summary: proof.summary,
          proof_path: proofPath,
          ok: true,
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
