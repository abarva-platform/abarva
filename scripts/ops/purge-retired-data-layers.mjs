#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { Client } from "pg";

const DEFAULT_SCHEMAS = ["intelligence_v6", "intelligence_v7", "cio_tower"];

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
  console.log(
    JSON.stringify({
      ok: true,
      mode: "self_test",
      dependency_scope: "retirement_set",
      compact_stdout_supported: true,
    }),
  );
}

async function main() {
  if (hasFlag("--self-test")) {
    selfTest();
    return;
  }

  const validateOnly = hasFlag("--validate-only");
  if (validateOnly) {
    console.log(
      JSON.stringify({
        ok: true,
        mode: "validate_only",
        default_schemas: DEFAULT_SCHEMAS,
        dependency_scope: "retirement_set",
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
  const compactStdout =
    hasFlag("--compact-stdout") || process.env.RETIRED_LAYER_PURGE_COMPACT_STDOUT === "1";
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
      schema_inventory: schemaInventory,
      gates: {
        schemas_discovered: schemaInventory.filter((row) => row.exists).length,
        outside_dependencies: dependencyInventory.length,
        apply_allowed: shouldApply && (allowDependencies || dependencyInventory.length === 0),
      },
    };
    const proofSummary = {
      run_id: proof.run_id,
      generated_at: proof.generated_at,
      mode: proof.mode,
      schemas,
      schema_count: schemaInventory.length,
      schemas_discovered: proof.gates.schemas_discovered,
      table_count: schemaInventory.reduce((sum, row) => sum + row.tables.length, 0),
      view_count: schemaInventory.reduce((sum, row) => sum + row.views.length, 0),
      routine_count: schemaInventory.reduce((sum, row) => sum + row.routines.length, 0),
      total_row_count: schemaInventory.reduce((sum, row) => sum + row.row_count, 0),
      dependencies_outside_retired_schemas_count: dependencyInventory.length,
      dependencies_outside_retired_schemas: dependencyInventory,
      gates: proof.gates,
    };

    const proofPath = path.join(outDir, `${runId}.json`);
    fs.writeFileSync(proofPath, `${JSON.stringify(proof, null, 2)}\n`);

    if (shouldApply && dependencyInventory.length > 0 && !allowDependencies) {
      throw new Error(
        `Refusing to apply: ${dependencyInventory.length} outside-schema dependencies found. Review ${proofPath}.`,
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
