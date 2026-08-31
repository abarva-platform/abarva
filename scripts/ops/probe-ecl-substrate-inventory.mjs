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

const SCHEMAS = ["ecl_projection", "ecl_context", "ecl_review", "ecl_source", "serving"];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");
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
        `table\t${r.schema}.${r.name}\tcols=${r.cols}\tpk=${r.has_pk}\tfks_out=${r.fks_out}\trls=${r.rls}\tpolicies=${r.policies}`,
      );
    }

    console.log("=== 3. dependency order: which schema's FKs point where ===");
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

    console.log("=== 4. total surface a baseline must cover ===");
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
    console.log(`total\ttables=${t.tables}\tcolumns=${t.columns}\tconstraints=${t.constraints}\tindexes=${t.indexes}`);

    console.log("INVENTORY_OK");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.log(`INVENTORY_ERR\t${error.message}`);
  process.exit(1);
});
