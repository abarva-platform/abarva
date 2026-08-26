#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { Client } from "pg";

const DEFAULT_SCHEMAS = ["intelligence_v6", "intelligence_v7", "cio_tower"];
const DEFAULT_STATUS_MAP = "reports/ecl-legacy-table-retirement-map-2026-08-22/legacy_table_retirement_map.csv";
const APPLY_SAFE_STATUSES = new Set(["REPLACE_WITH_ECL_PROJECTION", "ARCHIVE_ONLY"]);

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

function buildOutsideDependencyQuery() {
  return `with retired_namespace as (
            select oid, nspname
              from pg_namespace
             where nspname = any($1::text[])
          ),
          retired_objects as (
            select c.oid, n.nspname as schema_name, c.relname as object_name, c.relkind
              from pg_class c
              join pg_namespace n on n.oid = c.relnamespace
             where n.oid in (select oid from retired_namespace)
          )
          select distinct
                 source_ns.nspname as referencing_schema,
                 source_class.relname as referencing_object,
                 source_class.relkind as referencing_kind,
                 retired.schema_name as retired_schema,
                 retired.object_name as retired_object,
                 retired.relkind as retired_kind
            from pg_depend dep
            join retired_objects retired on retired.oid = dep.refobjid
            join pg_rewrite rewrite on rewrite.oid = dep.objid
            join pg_class source_class on source_class.oid = rewrite.ev_class
            join pg_namespace source_ns on source_ns.oid = source_class.relnamespace
           where not (source_ns.nspname = any($1::text[]))
           order by referencing_schema, referencing_object, retired.schema_name, retired.object_name`;
}

function quoteIdent(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function parseCsvLine(line) {
  const cells = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && quoted && line[index + 1] === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(value);
      value = "";
    } else {
      value += char;
    }
  }
  cells.push(value);
  return cells;
}

function readStatusMap(statusMapPath) {
  const resolvedPath = path.resolve(process.cwd(), statusMapPath);
  if (!fs.existsSync(resolvedPath)) {
    return {
      path: statusMapPath,
      resolved_path: resolvedPath,
      available: false,
      rows_by_schema: new Map(),
    };
  }

  const [headerLine, ...lines] = fs
    .readFileSync(resolvedPath, "utf8")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);
  const headers = parseCsvLine(headerLine);
  const schemaIndex = headers.indexOf("schema");
  const statusIndex = headers.indexOf("sunset_status");
  if (schemaIndex < 0 || statusIndex < 0) {
    throw new Error(`Retirement status map must include schema and sunset_status columns: ${statusMapPath}`);
  }

  const rowsBySchema = new Map();
  for (const line of lines) {
    const cells = parseCsvLine(line);
    const schema = String(cells[schemaIndex] ?? "").trim();
    const status = String(cells[statusIndex] ?? "").trim();
    if (!schema || !status) continue;
    const entry = rowsBySchema.get(schema) ?? { row_count: 0, statuses: new Map() };
    entry.row_count += 1;
    entry.statuses.set(status, (entry.statuses.get(status) ?? 0) + 1);
    rowsBySchema.set(schema, entry);
  }

  return {
    path: statusMapPath,
    resolved_path: resolvedPath,
    available: true,
    rows_by_schema: rowsBySchema,
  };
}

function statusGateForSchemas(schemas, statusMap) {
  const schemaSummaries = schemas.map((schema) => {
    const entry = statusMap.rows_by_schema.get(schema);
    const statuses = Object.fromEntries(entry?.statuses ?? []);
    const unsafeStatuses = Object.keys(statuses).filter((status) => !APPLY_SAFE_STATUSES.has(status));
    return {
      schema,
      status_map_rows: entry?.row_count ?? 0,
      statuses,
      status_map_known: Boolean(entry),
      apply_status_safe: Boolean(entry) && unsafeStatuses.length === 0,
      unsafe_statuses: unsafeStatuses,
    };
  });
  const unknownSchemas = schemaSummaries
    .filter((row) => !row.status_map_known)
    .map((row) => row.schema);
  const unsafeSchemas = schemaSummaries
    .filter((row) => row.status_map_known && !row.apply_status_safe)
    .map((row) => ({
      schema: row.schema,
      unsafe_statuses: row.unsafe_statuses,
      statuses: row.statuses,
    }));
  return {
    status_map: {
      path: statusMap.path,
      resolved_path: statusMap.resolved_path,
      available: statusMap.available,
      allowed_apply_statuses: Array.from(APPLY_SAFE_STATUSES).sort(),
    },
    schema_status_summaries: schemaSummaries,
    unknown_schemas: unknownSchemas,
    unsafe_schemas: unsafeSchemas,
    apply_allowed: statusMap.available && unknownSchemas.length === 0 && unsafeSchemas.length === 0,
  };
}

async function countRows(client, schemaName, tableName) {
  const sql = `select count(*)::bigint as row_count from ${quoteIdent(schemaName)}.${quoteIdent(tableName)}`;
  const result = await client.query(sql);
  return Number(result.rows[0]?.row_count ?? 0);
}

function selfTest() {
  const query = buildOutsideDependencyQuery();
  if (!query.includes("nspname = any($1::text[])")) {
    throw new Error("Dependency query must select the full retired schema set.");
  }
  if (!query.includes("not (source_ns.nspname = any($1::text[]))")) {
    throw new Error("Dependency query must exclude dependencies inside the retired schema set.");
  }
  if (query.includes("source_ns.nspname <> $1")) {
    throw new Error("Dependency query must not use one-schema dependency filtering.");
  }
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "retired-layer-status-map-"));
  const statusMapPath = path.join(tempDir, "map.csv");
  fs.writeFileSync(
    statusMapPath,
    [
      "schema,table,sunset_status",
      "safe_schema,a,REPLACE_WITH_ECL_PROJECTION",
      "safe_schema,b,ARCHIVE_ONLY",
      "mixed_schema,c,HOLD_UNTIL_LIVE_READBACK",
    ].join("\n"),
  );
  const statusGate = statusGateForSchemas(
    ["safe_schema", "mixed_schema", "unknown_schema"],
    readStatusMap(statusMapPath),
  );
  if (statusGate.apply_allowed) {
    throw new Error("Status gate must refuse mixed and unknown schemas.");
  }
  if (!statusGate.unsafe_schemas.some((row) => row.schema === "mixed_schema")) {
    throw new Error("Status gate must identify mixed-status schemas.");
  }
  if (!statusGate.unknown_schemas.includes("unknown_schema")) {
    throw new Error("Status gate must identify schemas absent from the status map.");
  }
  console.log(
    JSON.stringify({
      ok: true,
      mode: "self_test",
      dependency_scope: "retirement_set",
      compact_stdout_supported: true,
      status_map_apply_gate: "mixed_or_unknown_schemas_refused",
    }),
  );
}

function validateStatusMap(statusMapPath = DEFAULT_STATUS_MAP) {
  const statusMap = readStatusMap(statusMapPath);
  if (!statusMap.available) {
    throw new Error(
      `Retirement status map is not available at ${statusMap.resolved_path}. ` +
        "The ACA job image must package the committed retirement inventory.",
    );
  }
  if (statusMap.rows_by_schema.size === 0) {
    throw new Error(`Retirement status map has no schema rows: ${statusMap.resolved_path}`);
  }
  return statusMap;
}

async function main() {
  if (hasFlag("--self-test")) {
    selfTest();
    return;
  }

  const validateOnly = hasFlag("--validate-only");
  if (validateOnly) {
    const statusMap = validateStatusMap(
      String(argValue("--status-map", process.env.RETIRED_LAYER_PURGE_STATUS_MAP ?? DEFAULT_STATUS_MAP)),
    );
    console.log(
      JSON.stringify({
        ok: true,
        mode: "validate_only",
        default_schemas: DEFAULT_SCHEMAS,
        dependency_scope: "retirement_set",
        status_map: {
          path: statusMap.path,
          resolved_path: statusMap.resolved_path,
          available: statusMap.available,
          schema_count: statusMap.rows_by_schema.size,
        },
      }),
    );
    return;
  }

  const databaseUrl =
    process.env.DATABASE_URL ??
    process.env.ABARVA_AZURE_DATABASE_URL ??
    process.env.AZURE_DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL, ABARVA_AZURE_DATABASE_URL, or AZURE_DATABASE_URL is required",
    );
  }

  const apply = hasFlag("--apply");
  const envApply = process.env.RETIRED_LAYER_PURGE_APPLY === "1";
  const allowDependencies =
    hasFlag("--allow-dependencies") || process.env.RETIRED_LAYER_PURGE_ALLOW_DEPENDENCIES === "1";
  const allowStatusMix =
    hasFlag("--allow-status-mix") || process.env.RETIRED_LAYER_PURGE_ALLOW_STATUS_MIX === "1";
  const compactStdout =
    hasFlag("--compact-stdout") || process.env.RETIRED_LAYER_PURGE_COMPACT_STDOUT === "1";
  const statusMapPath = String(
    argValue("--status-map", process.env.RETIRED_LAYER_PURGE_STATUS_MAP ?? DEFAULT_STATUS_MAP),
  );
  const outDir =
    argValue("--out-dir", process.env.RETIRED_LAYER_PURGE_OUT_DIR) ??
    path.join(os.tmpdir(), "retired-layer-purge");
  const runId =
    argValue("--run-id") ??
    `retired-layer-purge-${new Date().toISOString().replace(/[:.]/g, "")}`;
  const schemas = String(
    argValue("--schemas", process.env.RETIRED_LAYER_PURGE_SCHEMAS ?? DEFAULT_SCHEMAS.join(",")),
  )
    .split(",")
    .map((schema) => schema.trim())
    .filter(Boolean);
  const shouldApply = apply || envApply;

  fs.mkdirSync(outDir, { recursive: true });

  const client = new Client({
    connectionString: databaseUrl,
    application_name: `abarva-retired-layer-purge-${shouldApply ? "apply" : "dry-run"}`,
  });
  await client.connect();

  try {
    await client.query("begin");
    const schemaInventory = [];
    const statusGate = statusGateForSchemas(schemas, readStatusMap(statusMapPath));

    for (const schemaName of schemas) {
      const exists = await client.query(
        "select exists(select 1 from information_schema.schemata where schema_name = $1) as exists",
        [schemaName],
      );
      if (!exists.rows[0]?.exists) {
        schemaInventory.push({
          schema: schemaName,
          exists: false,
          tables: [],
          views: [],
          routines: [],
          row_count: 0,
        });
        continue;
      }

      const tableRows = await client.query(
        `select table_name, table_type
           from information_schema.tables
          where table_schema = $1
          order by table_name`,
        [schemaName],
      );
      const routineRows = await client.query(
        `select routine_name, routine_type
           from information_schema.routines
          where specific_schema = $1
          order by routine_name`,
        [schemaName],
      );
      const tables = [];
      const views = [];
      let schemaRowCount = 0;
      for (const row of tableRows.rows) {
        if (row.table_type === "BASE TABLE") {
          const rowCount = await countRows(client, schemaName, row.table_name);
          schemaRowCount += rowCount;
          tables.push({ table: row.table_name, row_count: rowCount });
        } else {
          views.push({ view: row.table_name, table_type: row.table_type });
        }
      }
      schemaInventory.push({
        schema: schemaName,
        exists: true,
        tables,
        views,
        routines: routineRows.rows.map((row) => ({
          routine: row.routine_name,
          routine_type: row.routine_type,
        })),
        row_count: schemaRowCount,
      });

    }

    const dependencies = await client.query(buildOutsideDependencyQuery(), [schemas]);
    const dependencyInventory = dependencies.rows;
    const proof = {
      run_id: runId,
      generated_at: new Date().toISOString(),
      mode: shouldApply ? "apply" : "dry_run",
      schemas,
      dependencies_outside_retired_schemas: dependencyInventory,
      retirement_status_gate: statusGate,
      schema_inventory: schemaInventory,
      gates: {
        schemas_discovered: schemaInventory.filter((row) => row.exists).length,
        outside_dependencies: dependencyInventory.length,
        status_unsafe_or_unknown_schemas:
          statusGate.unsafe_schemas.length + statusGate.unknown_schemas.length,
        status_gate_bypassed: allowStatusMix,
        apply_allowed:
          shouldApply &&
          (allowDependencies || dependencyInventory.length === 0) &&
          (allowStatusMix || statusGate.apply_allowed),
      },
    };
    const proofSummary = {
      run_id: proof.run_id,
      generated_at: proof.generated_at,
      mode: proof.mode,
      schemas,
      schema_count: schemaInventory.length,
      schemas_discovered: proof.gates.schemas_discovered,
      schema_summaries: schemaInventory.map((row) => ({
        schema: row.schema,
        exists: row.exists,
        table_count: row.tables.length,
        view_count: row.views.length,
        routine_count: row.routines.length,
        row_count: row.row_count,
      })),
      table_count: schemaInventory.reduce((sum, row) => sum + row.tables.length, 0),
      view_count: schemaInventory.reduce((sum, row) => sum + row.views.length, 0),
      routine_count: schemaInventory.reduce((sum, row) => sum + row.routines.length, 0),
      total_row_count: schemaInventory.reduce((sum, row) => sum + row.row_count, 0),
      dependencies_outside_retired_schemas_count: dependencyInventory.length,
      dependencies_outside_retired_schemas: dependencyInventory,
      retirement_status_gate: {
        status_map: statusGate.status_map,
        unknown_schemas: statusGate.unknown_schemas,
        unsafe_schemas: statusGate.unsafe_schemas,
        apply_allowed: statusGate.apply_allowed,
      },
      gates: proof.gates,
    };

    const proofPath = path.join(outDir, `${runId}.json`);
    fs.writeFileSync(proofPath, `${JSON.stringify(proof, null, 2)}\n`);

    if (shouldApply && dependencyInventory.length > 0 && !allowDependencies) {
      throw new Error(
        `Refusing to apply: ${dependencyInventory.length} outside-schema dependencies found. Review ${proofPath}.`,
      );
    }
    if (shouldApply && !statusGate.apply_allowed && !allowStatusMix) {
      throw new Error(
        `Refusing to apply: ${statusGate.unsafe_schemas.length} mixed-status schemas and ${statusGate.unknown_schemas.length} unknown schemas found. Review ${proofPath}.`,
      );
    }

    if (shouldApply) {
      for (const schemaName of schemas) {
        await client.query(`drop schema if exists ${quoteIdent(schemaName)} cascade`);
      }
      await client.query("commit");
      proof.applied_at = new Date().toISOString();
      fs.writeFileSync(proofPath, `${JSON.stringify(proof, null, 2)}\n`);
    } else {
      await client.query("rollback");
    }

    console.log(
      JSON.stringify(
        {
          event: "retired_data_layer_purge_proof",
          structured_event: "retired_data_layer_purge_proof",
          ok: true,
          proof_path: proofPath,
          proof: compactStdout ? proofSummary : proof,
        },
        null,
        2,
      ),
    );
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
