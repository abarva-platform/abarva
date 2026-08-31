/**
 * Read-only lab-vs-production diff for the ECL substrate.
 *
 * The inventory probe sizes one database. This compares two databases before a schema baseline is
 * adopted from either one, so environment drift is a finding rather than something a baseline can
 * accidentally canonize.
 *
 * Strictly read-only.
 */

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const DEFAULT_SCHEMAS = [
  "ecl_source",
  "ecl_context",
  "ecl_commercial",
  "ecl_review",
  "ecl_projection",
  "serving",
  "tower",
];

const TABLE_FIELDS = [
  "cols",
  "has_pk",
  "fks_out",
  "rls",
  "policies",
  "column_hash",
  "constraint_hash",
  "index_hash",
  "in_migrations",
];
const VIEW_FIELDS = ["kind", "definition_hash", "in_migrations"];
const FUNCTION_FIELDS = ["language", "volatility", "definition_hash", "in_migrations"];
const POLICY_FIELDS = ["cmd", "permissive", "policy_hash", "in_migrations"];
const FK_FIELDS = ["to_schema", "to_table", "constraint_hash"];

function readUrl(label, envNames) {
  for (const name of envNames) {
    const value = process.env[name];
    if (value) return value;
  }
  throw new Error(`${label} database URL is required. Set one of: ${envNames.join(", ")}`);
}

function readSchemas() {
  const raw = process.env.ECL_SUBSTRATE_SCHEMAS;
  if (!raw) return DEFAULT_SCHEMAS;
  const schemas = raw
    .split(",")
    .map((schema) => schema.trim())
    .filter(Boolean);
  if (schemas.length === 0) throw new Error("ECL_SUBSTRATE_SCHEMAS did not name any schemas");
  return schemas;
}

async function readMigrationCorpus() {
  const migrationDir = path.join(process.cwd(), "supabase", "migrations");
  const files = await readdir(migrationDir);
  const sqlFiles = files.filter((file) => file.endsWith(".sql")).sort();
  const contents = await Promise.all(
    sqlFiles.map(async (file) => readFile(path.join(migrationDir, file), "utf8")),
  );
  return contents.join("\n").toLowerCase();
}

function appearsInMigrations(corpus, schema, name) {
  const bare = `${schema}.${name}`.toLowerCase();
  const quoted = `"${schema.toLowerCase()}"."${name.toLowerCase()}"`;
  return corpus.includes(bare) || corpus.includes(quoted);
}

function mapRows(rows, keyForRow) {
  const map = new Map();
  for (const row of rows) map.set(keyForRow(row), row);
  return map;
}

function sameValue(a, b) {
  return String(a ?? "") === String(b ?? "");
}

function compareMaps(section, lab, production, fields) {
  const events = [];
  const keys = [...new Set([...lab.keys(), ...production.keys()])].sort();
  for (const key of keys) {
    const left = lab.get(key);
    const right = production.get(key);
    if (!left) {
      events.push({ section, status: "MISSING_IN_LAB", key });
      continue;
    }
    if (!right) {
      events.push({ section, status: "MISSING_IN_PRODUCTION", key });
      continue;
    }
    for (const field of fields) {
      if (!sameValue(left[field], right[field])) {
        events.push({
          section,
          status: "DRIFT",
          key,
          field,
          lab: left[field],
          production: right[field],
        });
      }
    }
  }
  return events;
}

async function connect(pg, label, connectionString) {
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  console.log(`connected\t${label}`);
  return client;
}

async function collectSnapshot(client, schemas, migrationCorpus) {
  const sizes = await client.query(
    `select n.nspname as schema,
            count(*) filter (where c.relkind = 'r')::int as tables,
            count(*) filter (where c.relkind = 'v')::int as views,
            count(*) filter (where c.relkind = 'm')::int as matviews
       from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = any($1)
      group by n.nspname order by n.nspname`,
    [schemas],
  );

  const tables = await client.query(
    `with column_defs as (
        select c.oid as relid,
               count(*)::int as cols,
               md5(string_agg(
                 a.attname || ':' ||
                 format_type(a.atttypid, a.atttypmod) || ':' ||
                 a.attnotnull::text || ':' ||
                 coalesce(pg_get_expr(d.adbin, d.adrelid), ''),
                 chr(10) order by a.attnum
               )) as column_hash
          from pg_class c
          join pg_namespace n on n.oid = c.relnamespace
          join pg_attribute a on a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
          left join pg_attrdef d on d.adrelid = c.oid and d.adnum = a.attnum
         where n.nspname = any($1) and c.relkind = 'r'
         group by c.oid
      ),
      constraint_defs as (
        select k.conrelid as relid,
               count(*)::int as constraints,
               md5(string_agg(k.contype || ':' || k.conname || ':' || pg_get_constraintdef(k.oid, true),
                              chr(10) order by k.conname)) as constraint_hash
          from pg_constraint k
          join pg_class c on c.oid = k.conrelid
          join pg_namespace n on n.oid = c.relnamespace
         where n.nspname = any($1)
         group by k.conrelid
      ),
      index_defs as (
        select schemaname as schema,
               tablename as name,
               count(*)::int as indexes,
               md5(string_agg(indexname || ':' || indexdef, chr(10) order by indexname)) as index_hash
          from pg_indexes
         where schemaname = any($1)
         group by schemaname, tablename
      )
      select n.nspname as schema,
             c.relname as name,
             coalesce(cd.cols, 0)::int as cols,
             exists (select 1 from pg_constraint k where k.conrelid = c.oid and k.contype = 'p') as has_pk,
             (select count(*)::int from pg_constraint k where k.conrelid = c.oid and k.contype = 'f') as fks_out,
             c.relrowsecurity as rls,
             (select count(*)::int from pg_policies pol
               where pol.schemaname = n.nspname and pol.tablename = c.relname) as policies,
             coalesce(cd.column_hash, '') as column_hash,
             coalesce(kd.constraint_hash, '') as constraint_hash,
             coalesce(id.index_hash, '') as index_hash
        from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
        left join column_defs cd on cd.relid = c.oid
        left join constraint_defs kd on kd.relid = c.oid
        left join index_defs id on id.schema = n.nspname and id.name = c.relname
       where n.nspname = any($1) and c.relkind = 'r'
       order by n.nspname, c.relname`,
    [schemas],
  );
  const tableRows = tables.rows.map((row) => ({
    ...row,
    in_migrations: appearsInMigrations(migrationCorpus, row.schema, row.name),
  }));

  const views = await client.query(
    `select n.nspname as schema,
            c.relname as name,
            case c.relkind when 'm' then 'matview' else 'view' end as kind,
            md5(pg_get_viewdef(c.oid, true)) as definition_hash
       from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = any($1) and c.relkind in ('v', 'm')
      order by n.nspname, c.relkind, c.relname`,
    [schemas],
  );
  const viewRows = views.rows.map((row) => ({
    ...row,
    in_migrations: appearsInMigrations(migrationCorpus, row.schema, row.name),
  }));

  const functions = await client.query(
    `select n.nspname as schema,
            p.proname as name,
            pg_get_function_identity_arguments(p.oid) as args,
            l.lanname as language,
            p.provolatile as volatility,
            md5(pg_get_functiondef(p.oid)) as definition_hash
       from pg_proc p
       join pg_namespace n on n.oid = p.pronamespace
       join pg_language l on l.oid = p.prolang
      where n.nspname = any($1)
      order by n.nspname, p.proname, pg_get_function_identity_arguments(p.oid)`,
    [schemas],
  );
  const functionRows = functions.rows.map((row) => ({
    ...row,
    in_migrations: appearsInMigrations(migrationCorpus, row.schema, row.name),
  }));

  const policies = await client.query(
    `select schemaname as schema,
            tablename,
            policyname,
            permissive,
            cmd,
            md5(
              coalesce(qual, '') || chr(10) ||
              coalesce(with_check, '') || chr(10) ||
              coalesce(array_to_string(roles, ','), '')
            ) as policy_hash
       from pg_policies
      where schemaname = any($1)
      order by schemaname, tablename, policyname`,
    [schemas],
  );
  const policyRows = policies.rows.map((row) => ({
    ...row,
    in_migrations: appearsInMigrations(migrationCorpus, row.schema, row.policyname),
  }));

  const fkEdges = await client.query(
    `select sn.nspname as from_schema,
            sc.relname as from_table,
            k.conname as constraint_name,
            tn.nspname as to_schema,
            tc.relname as to_table,
            md5(pg_get_constraintdef(k.oid, true)) as constraint_hash
       from pg_constraint k
       join pg_class sc on sc.oid = k.conrelid
       join pg_namespace sn on sn.oid = sc.relnamespace
       join pg_class tc on tc.oid = k.confrelid
       join pg_namespace tn on tn.oid = tc.relnamespace
      where k.contype = 'f' and sn.nspname = any($1)
      order by sn.nspname, sc.relname, k.conname`,
    [schemas],
  );

  return {
    sizes: sizes.rows,
    tables: tableRows,
    views: viewRows,
    functions: functionRows,
    policies: policyRows,
    fkEdges: fkEdges.rows,
  };
}

function printSnapshotSummary(label, snapshot) {
  const totals = {
    tables: snapshot.tables.length,
    views: snapshot.views.length,
    functions: snapshot.functions.length,
    policies: snapshot.policies.length,
    fk_edges: snapshot.fkEdges.length,
  };
  console.log(
    [
      "snapshot",
      label,
      `tables=${totals.tables}`,
      `views=${totals.views}`,
      `functions=${totals.functions}`,
      `policies=${totals.policies}`,
      `fk_edges=${totals.fk_edges}`,
    ].join("\t"),
  );
}

function printEvent(event) {
  const parts = [event.section, event.status, event.key];
  if (event.field) parts.push(`field=${event.field}`);
  if (event.lab !== undefined) parts.push(`lab=${event.lab}`);
  if (event.production !== undefined) parts.push(`production=${event.production}`);
  console.log(parts.join("\t"));
}

async function main() {
  const schemas = readSchemas();
  const labUrl = readUrl("Lab", ["LAB_DATABASE_URL", "AZURE_LAB_DATABASE_URL"]);
  const productionUrl = readUrl("Production", ["PRODUCTION_DATABASE_URL", "PROD_DATABASE_URL"]);
  const allowDrift = process.env.ECL_SUBSTRATE_DIFF_ALLOW_DRIFT === "1";
  const migrationCorpus = await readMigrationCorpus();
  const { default: pg } = await import("pg");

  const lab = await connect(pg, "lab", labUrl);
  const production = await connect(pg, "production", productionUrl);

  try {
    console.log(`schemas\t${schemas.join(",")}`);
    const [labSnapshot, productionSnapshot] = await Promise.all([
      collectSnapshot(lab, schemas, migrationCorpus),
      collectSnapshot(production, schemas, migrationCorpus),
    ]);

    printSnapshotSummary("lab", labSnapshot);
    printSnapshotSummary("production", productionSnapshot);

    const events = [
      ...compareMaps(
        "schema",
        mapRows(labSnapshot.sizes, (row) => row.schema),
        mapRows(productionSnapshot.sizes, (row) => row.schema),
        ["tables", "views", "matviews"],
      ),
      ...compareMaps(
        "table",
        mapRows(labSnapshot.tables, (row) => `${row.schema}.${row.name}`),
        mapRows(productionSnapshot.tables, (row) => `${row.schema}.${row.name}`),
        TABLE_FIELDS,
      ),
      ...compareMaps(
        "view",
        mapRows(labSnapshot.views, (row) => `${row.schema}.${row.name}`),
        mapRows(productionSnapshot.views, (row) => `${row.schema}.${row.name}`),
        VIEW_FIELDS,
      ),
      ...compareMaps(
        "function",
        mapRows(labSnapshot.functions, (row) => `${row.schema}.${row.name}(${row.args})`),
        mapRows(productionSnapshot.functions, (row) => `${row.schema}.${row.name}(${row.args})`),
        FUNCTION_FIELDS,
      ),
      ...compareMaps(
        "policy",
        mapRows(labSnapshot.policies, (row) => `${row.schema}.${row.tablename}.${row.policyname}`),
        mapRows(
          productionSnapshot.policies,
          (row) => `${row.schema}.${row.tablename}.${row.policyname}`,
        ),
        POLICY_FIELDS,
      ),
      ...compareMaps(
        "fk",
        mapRows(
          labSnapshot.fkEdges,
          (row) => `${row.from_schema}.${row.from_table}.${row.constraint_name}`,
        ),
        mapRows(
          productionSnapshot.fkEdges,
          (row) => `${row.from_schema}.${row.from_table}.${row.constraint_name}`,
        ),
        FK_FIELDS,
      ),
    ];

    console.log("=== diff events ===");
    for (const event of events) printEvent(event);
    console.log(`diff_summary\tevents=${events.length}\tallow_drift=${allowDrift}`);

    if (events.length > 0) {
      console.log("SUBSTRATE_DIFF_FOUND");
      if (!allowDrift) process.exitCode = 2;
      return;
    }

    console.log("SUBSTRATE_DIFF_OK");
  } finally {
    await Promise.all([lab.end(), production.end()]);
  }
}

main().catch((error) => {
  console.log(`SUBSTRATE_DIFF_ERR\t${error.message}`);
  process.exit(1);
});
