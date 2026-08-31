/**
 * Read-only inventory of the ECL substrate, so a schema baseline can be scoped before it is
 * written.
 *
 * Four Tower projection tables have no migration in this repository, and neither do the eight
 * tables their foreign keys point at, across four schemas. A baseline covering only the four fails
 * on a fresh database. The real unit of work is the substrate, and its size is unknown.
 *
 * This reports, per schema: every table, its column count, whether it has a primary key, how many
 * foreign keys leave it and where they go, its RLS state, and — the part that decides the order a
 * baseline must be written in — which schemas depend on which.
 *
 * It also flags every object whose name appears in no migration file, since that is the set a
 * baseline has to cover.
 *
 * Strictly read-only.
 */

import process from "node:process";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const SCHEMAS = ["ecl_projection", "ecl_context", "ecl_review", "ecl_source", "serving"];

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

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");
  const migrationCorpus = await readMigrationCorpus();
  const { default: pg } = await import("pg");
  const client = new pg.Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    console.log("=== 1. size of each schema ===");
    const sizes = await client.query(
      `select n.nspname as schema,
              count(*) filter (where c.relkind = 'r')::int as tables,
              count(*) filter (where c.relkind = 'v')::int as views,
              count(*) filter (where c.relkind = 'm')::int as matviews
         from pg_class c join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = any($1)
        group by n.nspname order by n.nspname`,
      [SCHEMAS],
    );
    for (const r of sizes.rows) {
      console.log(`schema\t${r.schema}\ttables=${r.tables}\tviews=${r.views}\tmatviews=${r.matviews}`);
    }

    const fns = await client.query(
      `select n.nspname as schema, count(*)::int as functions
         from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = any($1) group by n.nspname order by n.nspname`,
      [SCHEMAS],
    );
    for (const r of fns.rows) console.log(`functions\t${r.schema}\t${r.functions}`);

    console.log("=== 2. every table, with shape ===");
    const tables = await client.query(
      `select n.nspname as schema, c.relname as name,
              (select count(*)::int from pg_attribute a
                where a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped) as cols,
              exists (select 1 from pg_constraint k where k.conrelid = c.oid and k.contype = 'p') as has_pk,
              (select count(*)::int from pg_constraint k where k.conrelid = c.oid and k.contype = 'f') as fks_out,
              c.relrowsecurity as rls,
              (select count(*)::int from pg_policies pol
                where pol.schemaname = n.nspname and pol.tablename = c.relname) as policies
         from pg_class c join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = any($1) and c.relkind = 'r'
        order by n.nspname, c.relname`,
      [SCHEMAS],
    );
    for (const r of tables.rows) {
      console.log(
        [
          "table",
          `${r.schema}.${r.name}`,
          `cols=${r.cols}`,
          `pk=${r.has_pk}`,
          `fks_out=${r.fks_out}`,
          `rls=${r.rls}`,
          `policies=${r.policies}`,
          `in_migrations=${appearsInMigrations(migrationCorpus, r.schema, r.name)}`,
        ].join("\t"),
      );
    }

    console.log("=== 3. views and materialized views, with definition hashes ===");
    const views = await client.query(
      `select n.nspname as schema,
              c.relname as name,
              case c.relkind when 'm' then 'matview' else 'view' end as kind,
              md5(pg_get_viewdef(c.oid, true)) as definition_hash
         from pg_class c join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = any($1) and c.relkind in ('v', 'm')
        order by n.nspname, c.relkind, c.relname`,
      [SCHEMAS],
    );
    for (const r of views.rows) {
      console.log(
        [
          r.kind,
          `${r.schema}.${r.name}`,
          `definition_hash=${r.definition_hash}`,
          `in_migrations=${appearsInMigrations(migrationCorpus, r.schema, r.name)}`,
        ].join("\t"),
      );
    }

    console.log("=== 4. functions, with signatures and definition hashes ===");
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
      [SCHEMAS],
    );
    for (const r of functions.rows) {
      console.log(
        [
          "function",
          `${r.schema}.${r.name}(${r.args})`,
          `language=${r.language}`,
          `volatility=${r.volatility}`,
          `definition_hash=${r.definition_hash}`,
          `in_migrations=${appearsInMigrations(migrationCorpus, r.schema, r.name)}`,
        ].join("\t"),
      );
    }

    console.log("=== 5. RLS policies, with expression hashes ===");
    const policies = await client.query(
      `select schemaname as schema,
              tablename,
              policyname,
              permissive,
              roles,
              cmd,
              md5(
                coalesce(qual, '') || chr(10) ||
                coalesce(with_check, '') || chr(10) ||
                coalesce(array_to_string(roles, ','), '')
              ) as policy_hash
         from pg_policies
        where schemaname = any($1)
        order by schemaname, tablename, policyname`,
      [SCHEMAS],
    );
    for (const r of policies.rows) {
      console.log(
        [
          "policy",
          `${r.schema}.${r.tablename}.${r.policyname}`,
          `cmd=${r.cmd}`,
          `permissive=${r.permissive}`,
          `policy_hash=${r.policy_hash}`,
          `in_migrations=${appearsInMigrations(migrationCorpus, r.schema, r.policyname)}`,
        ].join("\t"),
      );
    }

    console.log("=== 6. foreign-key edges, table to table ===");
    const fkEdges = await client.query(
      `select sn.nspname as from_schema,
              sc.relname as from_table,
              k.conname as constraint_name,
              tn.nspname as to_schema,
              tc.relname as to_table
         from pg_constraint k
         join pg_class sc on sc.oid = k.conrelid
         join pg_namespace sn on sn.oid = sc.relnamespace
         join pg_class tc on tc.oid = k.confrelid
         join pg_namespace tn on tn.oid = tc.relnamespace
        where k.contype = 'f' and sn.nspname = any($1)
        order by sn.nspname, sc.relname, k.conname`,
      [SCHEMAS],
    );
    for (const r of fkEdges.rows) {
      console.log(
        `fk\t${r.from_schema}.${r.from_table}\t->\t${r.to_schema}.${r.to_table}\tconstraint=${r.constraint_name}`,
      );
    }

    console.log("=== 7. dependency order: which schema's FKs point where ===");
    const deps = await client.query(
      `select sn.nspname as from_schema, tn.nspname as to_schema, count(*)::int as fks
         from pg_constraint k
         join pg_class sc on sc.oid = k.conrelid
         join pg_namespace sn on sn.oid = sc.relnamespace
         join pg_class tc on tc.oid = k.confrelid
         join pg_namespace tn on tn.oid = tc.relnamespace
        where k.contype = 'f' and sn.nspname = any($1)
        group by sn.nspname, tn.nspname
        order by sn.nspname, tn.nspname`,
      [SCHEMAS],
    );
    for (const r of deps.rows) {
      console.log(`depends\t${r.from_schema}\t->\t${r.to_schema}\tfks=${r.fks}`);
    }

    console.log("=== 8. total surface a baseline must cover ===");
    const totals = await client.query(
      `select count(*)::int as tables,
              (select count(*)::int from pg_attribute a
                 join pg_class c2 on c2.oid = a.attrelid
                 join pg_namespace n2 on n2.oid = c2.relnamespace
                where n2.nspname = any($1) and c2.relkind='r' and a.attnum > 0 and not a.attisdropped) as columns,
              (select count(*)::int from pg_constraint k
                 join pg_class c3 on c3.oid = k.conrelid
                 join pg_namespace n3 on n3.oid = c3.relnamespace
                where n3.nspname = any($1)) as constraints,
              (select count(*)::int from pg_indexes where schemaname = any($1)) as indexes
         from pg_class c join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = any($1) and c.relkind = 'r'`,
      [SCHEMAS],
    );
    const t = totals.rows[0];
    console.log(
      `total\ttables=${t.tables}\tcolumns=${t.columns}\tconstraints=${t.constraints}\tindexes=${t.indexes}\tviews=${views.rowCount}\tfunctions=${functions.rowCount}\tpolicies=${policies.rowCount}`,
    );

    console.log("INVENTORY_OK");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.log(`INVENTORY_ERR\t${error.message}`);
  process.exit(1);
});
