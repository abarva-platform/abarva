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

const DEFAULT_DELETE_CHUNK_SIZE = 1000;
const DEFAULT_MAX_CHUNKS_PER_OPERATION = 5;
const DEFAULT_APPLY_BUDGET_SECONDS = 5400;
const DEFAULT_STATEMENT_TIMEOUT = "2min";
const INDEX_THRESHOLD_ROWS = 1000;

const DELETE_PRIORITY = new Map([
  ["public.semantic2_evidence_refs", 10],
  ["public.semantic2_facts", 20],
  ["public.semantic2_relationships", 30],
  ["public.semantic2_entities", 40],
  ["public.semantic2_source_rows", 50],
  ["public.move_artifacts", 60],
  ["public.engagements", 70],
  ["public.clients", 1000],
]);

const CLIENTS_QUALIFIED_NAME = "public.clients";

const TRIGGER_OVERRIDES = Object.freeze([
  { qualifiedName: "public.agent_context_traces", trigger: "user" },
  { qualifiedName: "public.evidence_ledger", trigger: "user" },
  { qualifiedName: "public.notification_events", trigger: "user" },
  { qualifiedName: "public.engagements", trigger: "user" },
  { qualifiedName: "public.program_audit_log", trigger: "user" },
  { qualifiedName: "public.responsible_ai_acknowledgments", trigger: "user" },
  { qualifiedName: "public.responsible_ai_training_completions", trigger: "user" },
]);

function usage() {
  return `Usage:
  node scripts/ops/purge-retired-tenant-rows.mjs [options]

Options:
  --apply                  Delete matching retired-tenant rows. Env: RETIRED_TENANT_ROW_PURGE_APPLY=1
  --database-url <url>     Postgres URL. Defaults to DATABASE_URL / ABARVA_AZURE_DATABASE_URL / AZURE_DATABASE_URL.
  --out-dir <path>         Output directory. Defaults to /tmp/retired-tenant-row-purge.
  --max-passes <n>         Delete retry passes for FK ordering. Default: 12.
  --atomic                 Use the legacy all-or-nothing transaction. Default is staged commits.
  --max-chunks <n>         Max delete chunks per table operation before committing. Default: ${DEFAULT_MAX_CHUNKS_PER_OPERATION}.
  --chunk-size <n>         Rows per delete chunk. Env: RETIRED_TENANT_ROW_PURGE_CHUNK_SIZE. Default: ${DEFAULT_DELETE_CHUNK_SIZE}.
  --statement-timeout <v>  Per-operation statement timeout. Env: RETIRED_TENANT_ROW_PURGE_STATEMENT_TIMEOUT. Default: ${DEFAULT_STATEMENT_TIMEOUT}.
  --budget-seconds <n>     Graceful staged-apply budget before exiting partial. Default: ${DEFAULT_APPLY_BUDGET_SECONDS}.
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
  for (const column of columns) {
    if (isTenantColumn(column) && TEXT_TYPES.has(column.data_type)) {
      clauses.push({
        type: "retired_key",
        column: column.column_name,
        kind: "retired_key",
      });
      continue;
    }
    if (retiredClientIds.length > 0 && isIdColumn(column) && TEXT_TYPES.has(column.data_type)) {
      clauses.push({
        type: "retired_client_id",
        column: column.column_name,
        kind: "retired_client_id",
      });
    }
  }

  if (clauses.length === 0) return null;
  return clauses;
}

function aliasIdent(alias, column) {
  return `${quoteIdent(alias)}.${quoteIdent(column)}`;
}

function renderWhere(operation, alias, params) {
  const clauses = operation.conditions.map((condition) => {
    if (condition.type === "retired_key") {
      params.push(RETIRED_KEYS.map((key) => key.toLowerCase()));
      return `(lower(${aliasIdent(alias, condition.column)}::text) = any($${params.length}::text[]))`;
    }
    if (condition.type === "retired_client_id") {
      params.push(operation.retiredClientIds);
      return `(${aliasIdent(alias, condition.column)}::text = any($${params.length}::text[]))`;
    }
    if (condition.type === "fk_parent") {
      const parentAlias = `${alias}_parent_${params.length + 1}`;
      const join = condition.childColumns
        .map((childColumn, index) => `${aliasIdent(alias, childColumn)} = ${aliasIdent(parentAlias, condition.parentColumns[index])}`)
        .join(" and ");
      if (!join) return "false";
      return `exists (select 1 from ${qualified(condition.parentSchema, condition.parentTable)} as ${quoteIdent(parentAlias)} where ${join} and (${renderWhere(condition.parentOperation, parentAlias, params)}))`;
    }
    throw new Error(`Unknown purge condition type: ${condition.type}`);
  });
  return clauses.map((clause) => `(${clause})`).join(" or ");
}

function rendered(operation, alias = "target") {
  const params = [];
  return {
    sql: renderWhere(operation, alias, params),
    params,
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

async function getForeignKeys(client) {
  const result = await client.query(`
    select
      child_ns.nspname as child_schema,
      child.relname as child_table,
      parent_ns.nspname as parent_schema,
      parent.relname as parent_table,
      con.conname as constraint_name,
      array_agg(child_att.attname order by key_position.ordinality) as child_columns,
      array_agg(parent_att.attname order by key_position.ordinality) as parent_columns
    from pg_constraint con
    join pg_class child on child.oid = con.conrelid
    join pg_namespace child_ns on child_ns.oid = child.relnamespace
    join pg_class parent on parent.oid = con.confrelid
    join pg_namespace parent_ns on parent_ns.oid = parent.relnamespace
    join unnest(con.conkey, con.confkey) with ordinality as key_position(child_attnum, parent_attnum, ordinality) on true
    join pg_attribute child_att on child_att.attrelid = child.oid and child_att.attnum = key_position.child_attnum
    join pg_attribute parent_att on parent_att.attrelid = parent.oid and parent_att.attnum = key_position.parent_attnum
    where con.contype = 'f'
      and child_ns.nspname not in ('pg_catalog', 'information_schema')
      and parent_ns.nspname not in ('pg_catalog', 'information_schema')
      and child_ns.nspname not like 'pg_toast%'
      and parent_ns.nspname not like 'pg_toast%'
    group by child_ns.nspname, child.relname, parent_ns.nspname, parent.relname, con.conname
    order by parent_ns.nspname, parent.relname, child_ns.nspname, child.relname, con.conname
  `);
  return result.rows.map((row) => ({
    ...row,
    child_columns: Array.isArray(row.child_columns) ? row.child_columns : [],
    parent_columns: Array.isArray(row.parent_columns) ? row.parent_columns : [],
  })).filter((row) => row.child_columns.length > 0 && row.child_columns.length === row.parent_columns.length);
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

function uniqueStrings(values) {
  return [...new Set(values.filter((value) => value != null && String(value).trim()).map((value) => String(value)))];
}

function parseCsv(value) {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function mergeClientScope(resolved, preserved = null) {
  return {
    retiredClientIds: uniqueStrings([
      ...resolved.retiredClientIds,
      ...(preserved?.retiredClientIds ?? []),
      ...parseCsv(process.env.RETIRED_TENANT_ROW_PURGE_RETIRED_CLIENT_IDS),
    ]),
    keepClientIds: uniqueStrings([
      ...resolved.keepClientIds,
      ...(preserved?.keepClientIds ?? []),
      ...parseCsv(process.env.RETIRED_TENANT_ROW_PURGE_KEEP_CLIENT_IDS),
    ]),
    clientRows: resolved.clientRows,
  };
}

async function buildPlan(client, preservedClientScope = null) {
  const clientScope = mergeClientScope(await resolveClientIds(client), preservedClientScope);
  const overlap = clientScope.retiredClientIds.filter((id) => clientScope.keepClientIds.includes(id));
  if (overlap.length > 0) {
    throw new Error(`Refusing purge: retired/keep client id overlap detected: ${overlap.join(", ")}`);
  }

  const tables = await getTables(client);
  const columnsByTable = await getColumnsByTable(client);
  const foreignKeys = await getForeignKeys(client);
  const foreignKeysByParent = new Map();
  for (const foreignKey of foreignKeys) {
    const parentKey = `${foreignKey.parent_schema}.${foreignKey.parent_table}`;
    const list = foreignKeysByParent.get(parentKey) ?? [];
    list.push(foreignKey);
    foreignKeysByParent.set(parentKey, list);
  }
  const operations = [];
  const directOperationByTable = new Map();

  for (const table of tables) {
    const columns = columnsByTable.get(`${table.table_schema}.${table.table_name}`) ?? [];
    const conditions = buildWhere(columns, clientScope.retiredClientIds);
    if (!conditions) continue;
    const operation = {
      schema: table.table_schema,
      table: table.table_name,
      qualifiedName: `${table.table_schema}.${table.table_name}`,
      rowCount: 0,
      source: "direct",
      depth: 0,
      matchedColumns: conditions.map(({ column, kind }) => ({ column, kind })),
      conditions,
      retiredClientIds: clientScope.retiredClientIds,
    };
    const where = rendered(operation);
    const result = await client.query(
      `select count(*)::bigint as row_count from ${qualified(table.table_schema, table.table_name)} as ${quoteIdent("target")} where ${where.sql}`,
      where.params,
    );
    const rowCount = Number(result.rows[0]?.row_count ?? 0);
    operation.rowCount = rowCount;
    operations.push(operation);
    directOperationByTable.set(operation.qualifiedName, operation);
  }

  const queuedParents = operations.filter((operation) => operation.rowCount > 0);
  const dependentKeys = new Set();
  for (let index = 0; index < queuedParents.length; index += 1) {
    const parentOperation = queuedParents[index];
    if (parentOperation.depth >= 6) continue;
    const childForeignKeys = foreignKeysByParent.get(parentOperation.qualifiedName) ?? [];
    for (const foreignKey of childForeignKeys) {
      const childQualifiedName = `${foreignKey.child_schema}.${foreignKey.child_table}`;
      const directChildOperation = directOperationByTable.get(childQualifiedName);
      if (directChildOperation?.rowCount > 0) continue;
      const dependentKey = `${childQualifiedName}:${foreignKey.constraint_name}:${parentOperation.qualifiedName}`;
      if (dependentKeys.has(dependentKey)) continue;
      dependentKeys.add(dependentKey);
      const operation = {
        schema: foreignKey.child_schema,
        table: foreignKey.child_table,
        qualifiedName: childQualifiedName,
        rowCount: 0,
        source: "dependent_fk",
        depth: parentOperation.depth + 1,
        parentQualifiedName: parentOperation.qualifiedName,
        constraintName: foreignKey.constraint_name,
        matchedColumns: foreignKey.child_columns.map((column) => ({ column, kind: "dependent_fk" })),
        conditions: [
          {
            type: "fk_parent",
            childColumns: foreignKey.child_columns,
            parentColumns: foreignKey.parent_columns,
            parentSchema: foreignKey.parent_schema,
            parentTable: foreignKey.parent_table,
            parentOperation,
          },
        ],
        retiredClientIds: clientScope.retiredClientIds,
      };
      const where = rendered(operation);
      const result = await client.query(
        `select count(*)::bigint as row_count from ${qualified(operation.schema, operation.table)} as ${quoteIdent("target")} where ${where.sql}`,
        where.params,
      );
      operation.rowCount = Number(result.rows[0]?.row_count ?? 0);
      if (operation.rowCount > 0) {
        operations.push(operation);
        queuedParents.push(operation);
      }
    }
  }

  return { clientScope, operations };
}

function shouldDeferClientDelete(operation, pending) {
  return operation.qualifiedName === CLIENTS_QUALIFIED_NAME && pending.some((item) => item.qualifiedName !== CLIENTS_QUALIFIED_NAME);
}

async function deleteProgramAuditLogIfNeeded(client, operation) {
  if (operation.qualifiedName !== "public.program_audit_log" || operation.rowCount === 0) return null;
  const deletion = await deleteRows(client, operation);
  return {
    qualifiedName: operation.qualifiedName,
    rowsDeleted: deletion.rowsDeleted,
    chunkLimited: deletion.chunkLimited,
    specialCase: "disabled_program_audit_log_no_delete",
  };
}

async function setTriggerOverrides(client, enabled) {
  const action = enabled ? "enable" : "disable";
  for (const override of TRIGGER_OVERRIDES) {
    const [schema, table] = override.qualifiedName.split(".");
    await client.query(`alter table ${qualified(schema, table)} ${action} trigger ${override.trigger === "user" ? "user" : quoteIdent(override.trigger)}`);
  }
}

async function deleteRows(client, operation, maxChunks = Number.POSITIVE_INFINITY, chunkSize = DEFAULT_DELETE_CHUNK_SIZE) {
  if (operation.rowCount <= chunkSize) {
    const where = rendered(operation);
    const result = await client.query(
      `delete from ${qualified(operation.schema, operation.table)} as ${quoteIdent("target")} where ${where.sql}`,
      where.params,
    );
    return { rowsDeleted: result.rowCount ?? 0, chunkLimited: false };
  }

  let totalDeleted = 0;
  let chunks = 0;
  for (;;) {
    const where = rendered(operation, "candidate");
    const result = await client.query(
      `delete from ${qualified(operation.schema, operation.table)} as ${quoteIdent("target")} where ${quoteIdent("target")}.ctid in (select ${quoteIdent("candidate")}.ctid from ${qualified(operation.schema, operation.table)} as ${quoteIdent("candidate")} where ${where.sql} limit ${chunkSize})`,
      where.params,
    );
    const rowsDeleted = result.rowCount ?? 0;
    totalDeleted += rowsDeleted;
    chunks += 1;
    if (chunks >= maxChunks && rowsDeleted === chunkSize) {
      return { rowsDeleted: totalDeleted, chunkLimited: true };
    }
    if (rowsDeleted < chunkSize) break;
  }
  return { rowsDeleted: totalDeleted, chunkLimited: false };
}

function purgeIndexName(operation, condition) {
  const basis = `${operation.qualifiedName}.${condition.column}.${condition.type}`;
  let hash = 0;
  for (let index = 0; index < basis.length; index += 1) {
    hash = (hash * 31 + basis.charCodeAt(index)) >>> 0;
  }
  return `retired_purge_${hash.toString(16)}_idx`;
}

function purgeIndexExpression(condition) {
  if (condition.type === "retired_key") {
    return `(lower(${quoteIdent(condition.column)}::text))`;
  }
  if (condition.type === "retired_client_id") {
    return `((${quoteIdent(condition.column)}::text))`;
  }
  return null;
}

async function preparePurgeIndexes(client, operations) {
  const indexed = [];
  const candidates = operations.filter(
    (operation) =>
      operation.source === "direct" &&
      operation.rowCount >= INDEX_THRESHOLD_ROWS &&
      operation.conditions.some((condition) => condition.type === "retired_key" || condition.type === "retired_client_id"),
  );
  for (const operation of candidates) {
    for (const condition of operation.conditions) {
      const expression = purgeIndexExpression(condition);
      if (!expression) continue;
      const indexName = purgeIndexName(operation, condition);
      await client.query(
        `create index if not exists ${quoteIdent(indexName)} on ${qualified(operation.schema, operation.table)} ${expression}`,
      );
      indexed.push({ qualifiedName: operation.qualifiedName, column: condition.column, indexName });
    }
  }
  return indexed;
}

async function clearKnownReferences(client, operation) {
  if (operation.qualifiedName !== "public.move_artifacts") return null;
  const exists = await client.query(`
    select
      to_regclass('public.deliverables_v2')::text as deliverables_table,
      to_regclass('public.move_artifacts')::text as move_artifacts_table,
      exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'deliverables_v2'
          and column_name = 'approved_artifact_id'
      ) as has_approved_artifact_id,
      exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'move_artifacts'
          and column_name = 'id'
      ) as has_move_artifact_id
  `);
  const row = exists.rows[0];
  if (!row?.deliverables_table || !row?.move_artifacts_table || !row.has_approved_artifact_id || !row.has_move_artifact_id) {
    return null;
  }
  const where = rendered(operation, "parent");
  const result = await client.query(
    `update public.deliverables_v2 as ${quoteIdent("target")}
     set approved_artifact_id = null
     where ${quoteIdent("target")}.approved_artifact_id is not null
       and exists (
         select 1
         from public.move_artifacts as ${quoteIdent("parent")}
         where ${quoteIdent("target")}.approved_artifact_id = ${quoteIdent("parent")}.id
           and (${where.sql})
       )`,
    where.params,
  );
  return {
    qualifiedName: "public.deliverables_v2",
    rowsUpdated: result.rowCount ?? 0,
    specialCase: "cleared_approved_artifact_id_for_retired_move_artifacts",
  };
}

function deletePriority(operation) {
  if (operation.depth > 0) return -operation.depth * 100;
  return DELETE_PRIORITY.get(operation.qualifiedName) ?? 500;
}

function sortedOperations(operations) {
  return operations
    .filter((operation) => operation.rowCount > 0)
    .sort((a, b) => {
      const aPriority = deletePriority(a);
      const bPriority = deletePriority(b);
      if (aPriority !== bPriority) return aPriority - bPriority;
      if (a.depth !== b.depth) return b.depth - a.depth;
      const aOverride = TRIGGER_OVERRIDES.some((override) => override.qualifiedName === a.qualifiedName) ? -1 : 0;
      const bOverride = TRIGGER_OVERRIDES.some((override) => override.qualifiedName === b.qualifiedName) ? -1 : 0;
      if (aOverride !== bOverride) return aOverride - bOverride;
      return b.rowCount - a.rowCount || a.qualifiedName.localeCompare(b.qualifiedName);
    });
}

async function applyDeletesAtomic(client, operations, maxPasses) {
  const actions = [];
  const pending = sortedOperations(operations);

  await setTriggerOverrides(client, false);
  try {
    for (const operation of pending) {
      const cleared = await clearKnownReferences(client, operation);
      if (cleared) {
        actions.push({ ...cleared, pass: 0 });
      }
    }

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
          const deletion = await deleteRows(client, operation);
          const rowsDeleted = deletion.rowsDeleted;
          await client.query(`release savepoint ${savepoint}`);
          actions.push({ qualifiedName: operation.qualifiedName, rowsDeleted, pass, chunkLimited: deletion.chunkLimited });
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
  } finally {
    await setTriggerOverrides(client, true);
  }

  return { actions, pending };
}

async function deleteProgramAuditLogIfNeededStaged(client, operation, maxChunks, chunkSize) {
  if (operation.qualifiedName !== "public.program_audit_log" || operation.rowCount === 0) return null;
  const deletion = await deleteRows(client, operation, maxChunks, chunkSize);
  return {
    qualifiedName: operation.qualifiedName,
    rowsDeleted: deletion.rowsDeleted,
    chunkLimited: deletion.chunkLimited,
    specialCase: "disabled_program_audit_log_no_delete",
  };
}

async function applyOneOperationStaged(client, operation, pass, maxChunks, chunkSize, statementTimeout) {
  await client.query("begin");
  try {
    await client.query("select set_config('statement_timeout', $1, true)", [statementTimeout]);
    await setTriggerOverrides(client, false);
    const actions = [];
    const cleared = await clearKnownReferences(client, operation);
    if (cleared) {
      actions.push({ ...cleared, pass });
    }
    const special = await deleteProgramAuditLogIfNeededStaged(client, operation, maxChunks, chunkSize);
    if (special) {
      actions.push({ ...special, pass });
    } else {
      const deletion = await deleteRows(client, operation, maxChunks, chunkSize);
      actions.push({
        qualifiedName: operation.qualifiedName,
        rowsDeleted: deletion.rowsDeleted,
        pass,
        chunkLimited: deletion.chunkLimited,
      });
    }
    await setTriggerOverrides(client, true);
    await client.query("commit");
    return actions;
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  }
}

function elapsedSeconds(startedAt) {
  return (Date.now() - startedAt) / 1000;
}

async function applyDeletesStaged(client, maxPasses, maxChunks, budgetSeconds, preservedClientScope, chunkSize, statementTimeout) {
  const actions = [];
  const errors = [];
  let budgetExhausted = false;
  const startedAt = Date.now();

  for (let pass = 1; pass <= maxPasses; pass += 1) {
    if (elapsedSeconds(startedAt) >= budgetSeconds) {
      budgetExhausted = true;
      break;
    }

    const plan = await buildPlan(client, preservedClientScope);
    const pending = sortedOperations(plan.operations);
    if (pending.length === 0) break;

    let progress = false;
    for (const operation of pending) {
      if (shouldDeferClientDelete(operation, pending)) {
        continue;
      }
      if (elapsedSeconds(startedAt) >= budgetSeconds) {
        budgetExhausted = true;
        break;
      }
      try {
        const operationActions = await applyOneOperationStaged(client, operation, pass, maxChunks, chunkSize, statementTimeout);
        actions.push(...operationActions);
        console.error(
          JSON.stringify({
            event: "retired_tenant_row_purge_progress",
            pass,
            qualifiedName: operation.qualifiedName,
            rowsChanged: operationActions.reduce(
              (sum, action) => sum + Number(action.rowsDeleted ?? action.rowsUpdated ?? 0),
              0,
            ),
            chunkLimited: operationActions.some((action) => action.chunkLimited),
          }),
        );
        if (operationActions.some((action) => Number(action.rowsDeleted ?? action.rowsUpdated ?? 0) > 0)) {
          progress = true;
        }
      } catch (error) {
        errors.push({
          ...stripParams(operation),
          pass,
          lastError: error instanceof Error ? error.message : String(error),
        });
      }
    }

    if (budgetExhausted) break;
    if (!progress) {
      const after = await buildPlan(client, preservedClientScope);
      return {
        actions,
        pending: sortedOperations(after.operations).map((operation) => {
          const error = errors.find((item) => item.qualifiedName === operation.qualifiedName);
          return stripParams({ ...operation, lastError: error?.lastError });
        }),
        budgetExhausted,
      };
    }
  }

  const after = await buildPlan(client, preservedClientScope);
  return {
    actions,
    pending: sortedOperations(after.operations).map(stripParams),
    budgetExhausted,
  };
}

function summarizeBySchema(operations) {
  const bySchema = new Map();
  for (const operation of operations.filter((item) => item.rowCount > 0)) {
    bySchema.set(operation.schema, (bySchema.get(operation.schema) ?? 0) + operation.rowCount);
  }
  return Object.fromEntries([...bySchema.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

function stripParams(operation) {
  return {
    schema: operation.schema,
    table: operation.table,
    qualifiedName: operation.qualifiedName,
    rowCount: operation.rowCount,
    source: operation.source,
    depth: operation.depth,
    parentQualifiedName: operation.parentQualifiedName,
    constraintName: operation.constraintName,
    matchedColumns: operation.matchedColumns,
    lastError: operation.lastError,
  };
}

function compactProof(proof) {
  const pending = proof.apply?.pending ?? [];
  const dryRunPending = proof.apply ? [] : (proof.before?.operations ?? []);
  return {
    event: proof.event,
    run_id: proof.run_id,
    generated_at: proof.generated_at,
    mode: proof.mode,
    config: proof.config ?? null,
    before: {
      tablesWithRetiredRows: proof.before.tablesWithRetiredRows,
      retiredRows: proof.before.retiredRows,
      bySchema: proof.before.bySchema,
      pendingCount: dryRunPending.length,
      pendingOmitted: Math.max(0, dryRunPending.length - 20),
      pending: dryRunPending.slice(0, 20).map((operation) => ({
        qualifiedName: operation.qualifiedName,
        rowCount: operation.rowCount,
        source: operation.source,
        parentQualifiedName: operation.parentQualifiedName,
        constraintName: operation.constraintName,
      })),
    },
    clientScope: proof.clientScope
      ? {
          retiredClientIdCount: proof.clientScope.retiredClientIds?.length ?? 0,
          keepClientIdCount: proof.clientScope.keepClientIds?.length ?? 0,
        }
      : null,
    apply: proof.apply
      ? {
          committed: proof.apply.committed,
          strategy: proof.apply.strategy,
          completed: proof.apply.completed,
          budgetExhausted: proof.apply.budgetExhausted,
          preparedIndexCount: proof.apply.preparedIndexes?.length ?? 0,
          deletedRows: proof.apply.deletedRows,
          actionCount: proof.apply.actions?.length ?? 0,
          pendingCount: pending.length,
          pendingOmitted: Math.max(0, pending.length - 20),
          pending: pending.slice(0, 20).map((operation) => ({
            qualifiedName: operation.qualifiedName,
            rowCount: operation.rowCount,
            source: operation.source,
            parentQualifiedName: operation.parentQualifiedName,
            constraintName: operation.constraintName,
            lastError: operation.lastError,
          })),
          applied_at: proof.apply.applied_at,
        }
      : null,
    after: proof.after
      ? {
          tablesWithRetiredRows: proof.after.tablesWithRetiredRows,
          retiredRows: proof.after.retiredRows,
          bySchema: proof.after.bySchema,
        }
      : null,
    gates: proof.gates,
  };
}

async function main() {
  if (hasFlag("--help") || hasFlag("-h")) {
    console.log(usage());
    return;
  }

  const apply = hasFlag("--apply") || process.env.RETIRED_TENANT_ROW_PURGE_APPLY === "1";
  const atomic = hasFlag("--atomic") || process.env.RETIRED_TENANT_ROW_PURGE_ATOMIC === "1";
  const maxPasses = Number(argValue("--max-passes", process.env.RETIRED_TENANT_ROW_PURGE_MAX_PASSES ?? "12"));
  const maxChunks = Number(
    argValue("--max-chunks", process.env.RETIRED_TENANT_ROW_PURGE_MAX_CHUNKS ?? String(DEFAULT_MAX_CHUNKS_PER_OPERATION)),
  );
  const chunkSize = Number(
    argValue("--chunk-size", process.env.RETIRED_TENANT_ROW_PURGE_CHUNK_SIZE ?? String(DEFAULT_DELETE_CHUNK_SIZE)),
  );
  const statementTimeout = String(
    argValue("--statement-timeout", process.env.RETIRED_TENANT_ROW_PURGE_STATEMENT_TIMEOUT ?? DEFAULT_STATEMENT_TIMEOUT),
  );
  const budgetSeconds = Number(
    argValue("--budget-seconds", process.env.RETIRED_TENANT_ROW_PURGE_BUDGET_SECONDS ?? String(DEFAULT_APPLY_BUDGET_SECONDS)),
  );
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
        maxChunks,
        chunkSize,
        statementTimeout,
        budgetSeconds,
        defaultStrategy: "staged",
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
  if (!Number.isInteger(maxChunks) || maxChunks < 1 || maxChunks > 1000) {
    throw new Error("--max-chunks must be an integer between 1 and 1000");
  }
  if (!Number.isInteger(chunkSize) || chunkSize < 100 || chunkSize > 50000) {
    throw new Error("--chunk-size must be an integer between 100 and 50000");
  }
  if (!/^\d+(ms|s|min)$/.test(statementTimeout)) {
    throw new Error("--statement-timeout must use a PostgreSQL duration such as 120s, 2min, or 60000ms");
  }
  if (!Number.isInteger(budgetSeconds) || budgetSeconds < 60 || budgetSeconds > 7000) {
    throw new Error("--budget-seconds must be an integer between 60 and 7000");
  }

  fs.mkdirSync(outDir, { recursive: true });
  const client = new Client(postgresOptions(databaseUrl, `retired-tenant-row-purge-${apply ? "apply" : "dry-run"}`));
  await client.connect();
  try {
    await client.query("set statement_timeout = '15min'");
    await client.query("set lock_timeout = '5s'");
    const before = await buildPlan(client);
    const beforePositive = before.operations.filter((operation) => operation.rowCount > 0);
    const proof = {
      event: "retired_tenant_row_purge_proof",
      run_id: runId,
      generated_at: new Date().toISOString(),
      mode: apply ? "apply" : "dry_run",
      scope: { retiredKeys: RETIRED_KEYS, keepKeys: KEEP_KEYS },
      config: { maxPasses, maxChunks, chunkSize, statementTimeout, budgetSeconds },
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
      if (atomic) {
        await client.query("begin");
        const deletion = await applyDeletesAtomic(client, before.operations, maxPasses);
        if (deletion.pending.length > 0) {
          await client.query("rollback");
          proof.apply = {
            strategy: "atomic",
            committed: false,
            completed: false,
            actions: deletion.actions,
            pending: deletion.pending.map(stripParams),
          };
          proof.gates.applyAllowed = false;
          fs.writeFileSync(path.join(outDir, `${runId}.json`), `${JSON.stringify(proof, null, 2)}\n`);
          console.log(JSON.stringify(compactProof(proof), null, 2));
          throw new Error(`Retired tenant purge blocked by ${deletion.pending.length} undeleted table(s).`);
        }
        await client.query("commit");
        proof.apply = {
          strategy: "atomic",
          committed: true,
          completed: true,
          actions: deletion.actions,
          deletedRows: deletion.actions.reduce((sum, action) => sum + Number(action.rowsDeleted ?? 0), 0),
          applied_at: new Date().toISOString(),
        };
      } else {
        await client.query("set statement_timeout = '10min'");
        const preparedIndexes = await preparePurgeIndexes(client, before.operations);
        await client.query("set statement_timeout = '5min'");
        const deletion = await applyDeletesStaged(
          client,
          maxPasses,
          maxChunks,
          budgetSeconds,
          before.clientScope,
          chunkSize,
          statementTimeout,
        );
        proof.apply = {
          strategy: "staged",
          committed: true,
          completed: deletion.pending.length === 0,
          budgetExhausted: deletion.budgetExhausted,
          preparedIndexes,
          actions: deletion.actions,
          deletedRows: deletion.actions.reduce((sum, action) => sum + Number(action.rowsDeleted ?? 0), 0),
          pending: deletion.pending,
          applied_at: new Date().toISOString(),
        };
      }
      const after = await buildPlan(client, before.clientScope);
      const afterPositive = after.operations.filter((operation) => operation.rowCount > 0);
      proof.after = {
        tablesWithRetiredRows: afterPositive.length,
        retiredRows: afterPositive.reduce((sum, operation) => sum + operation.rowCount, 0),
        bySchema: summarizeBySchema(after.operations),
        operations: afterPositive.map(stripParams),
      };
      proof.gates.applyComplete = afterPositive.length === 0;
    }

    const proofPath = path.join(outDir, `${runId}.json`);
    fs.writeFileSync(proofPath, `${JSON.stringify(proof, null, 2)}\n`);
    console.log(JSON.stringify({ ...compactProof(proof), ok: true, proof_path: proofPath }, null, 2));
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
