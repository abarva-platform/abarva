/**
 * Read-only shape probe for the Tower serving path.
 *
 * Answers three questions that cannot be settled from the repository, because no migration in it
 * creates the `ecl_projection` tables Tower reads — the only DDL is a draft under
 * `docs/architecture/sql-drafts/`, so the deployed column constraints are unknown:
 *
 *   1. What are the real column types and nullability of the four projection tables?
 *   2. For a tool rollout, is `monthly_cost_usd` stored NULL or 0?
 *   3. Which keys does a rollout's `display_payload_json` actually carry?
 *
 * Question 3 is the live one: two attempts to render "Not loaded" instead of "$0" for a rollout's
 * spend have failed, and every artifact in the repo says they should have worked.
 *
 * Strictly read-only. Every statement is a SELECT against `information_schema` or a projection
 * table. It prints shape — column names, types, key names, null-ness, counts — and never a
 * payload value, so it stays safe to paste into a public artifact.
 */

import process from "node:process";

const TABLES = [
  "tower_ai_portfolio",
  "tower_command_center",
  "tower_value_chain",
  "tower_evidence_queue",
];

function line(label, value) {
  console.log(`${label}\t${typeof value === "string" ? value : JSON.stringify(value)}`);
}

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
    console.log("=== 1. projection table DDL ===");
    const ddl = await client.query(
      `select table_name, column_name, data_type, is_nullable, column_default
         from information_schema.columns
        where table_schema = 'ecl_projection' and table_name = any($1)
        order by table_name, ordinal_position`,
      [TABLES],
    );
    if (ddl.rows.length === 0) {
      line("ddl", "NO COLUMNS FOUND — the tables do not exist under ecl_projection");
    }
    for (const r of ddl.rows) {
      console.log(
        `ddl\t${r.table_name}.${r.column_name}\t${r.data_type}\tnullable=${r.is_nullable}\tdefault=${r.column_default ?? "-"}`,
      );
    }

    console.log("=== 2. rollout cost storage ===");
    const cost = await client.query(
      `select count(*)::int as rows,
              count(*) filter (where monthly_cost_usd is null)::int as cost_null,
              count(*) filter (where monthly_cost_usd = 0)::int as cost_zero,
              count(*) filter (where monthly_cost_usd > 0)::int as cost_positive
         from ecl_projection.tower_ai_portfolio
        where display_payload_json ->> 'page_key' = 'adoption_lens'`,
    );
    line("cost", cost.rows[0]);

    console.log("=== 3. display_payload_json keys on a rollout ===");
    // Ordered by projection_version, then created_at. An unordered `limit 1` here returned a row
    // from a retired assessment whose payload holds only `page_key`, which reads as a catastrophic
    // data loss and is simply an old row the active-assessment view already filters out.
    const keys = await client.query(
      `select jsonb_object_keys(display_payload_json) as k
         from (
           select display_payload_json
             from ecl_projection.tower_ai_portfolio
            where display_payload_json ->> 'page_key' = 'adoption_lens'
            order by projection_version desc, created_at desc
            limit 1
         ) newest`,
    );
    line("newest_rollout_display_keys", keys.rows.map((r) => r.k).sort());

    console.log("=== 3b. retired rows still sitting in the projection table ===");
    const stale = await client.query(
      `select p.projection_version,
              count(*)::int as rows,
              count(*) filter (where a.assessment_id is null)::int as not_in_active_view
         from ecl_projection.tower_ai_portfolio p
         left join serving.tower_active_assessment_keys() a
           on a.tenant_key = p.tenant_key
          and a.assessment_id = p.assessment_id
          and a.projection_version = p.projection_version
        group by p.projection_version
        order by p.projection_version desc`,
    );
    line("rows_by_projection_version", stale.rows);

    console.log("=== 4. does a rollout carry any funding key, anywhere in its row jsonb? ===");
    const funding = await client.query(
      `select
          count(*) filter (where to_jsonb(p) ? 'monthly_cost_usd')::int as body_has_monthly_cost,
          count(*) filter (where to_jsonb(p) -> 'monthly_cost_usd' = 'null'::jsonb)::int as body_monthly_cost_json_null,
          count(*) filter (where display_payload_json ? 'approved_funding_usd')::int as display_has_approved_funding,
          count(*) filter (where display_payload_json ? 'approved_investment_usd')::int as display_has_approved_investment,
          count(*) filter (where display_payload_json ? 'funded_amount_usd')::int as display_has_funded_amount,
          count(*) filter (where display_payload_json ? 'monthly_cost_usd')::int as display_has_monthly_cost
         from ecl_projection.tower_ai_portfolio p
        where display_payload_json ->> 'page_key' = 'adoption_lens'`,
    );
    line("funding_keys", funding.rows[0]);

    console.log("=== 5. what the serving view hands the reader ===");
    const serving = await client.query(
      `select
          count(*)::int as rows,
          count(*) filter (where payload_json ? 'display_payload_json')::int as has_nested_display,
          count(*) filter (where (payload_json -> 'display_payload_json') ? 'approved_funding_usd')::int as nested_has_approved_funding,
          count(*) filter (where (payload_json -> 'display_payload_json') ? 'monthly_cost_usd')::int as nested_has_monthly_cost,
          count(*) filter (where payload_json ? 'monthly_cost_usd')::int as top_has_monthly_cost
         from serving.tower_adoption_lens`,
    );
    line("serving", serving.rows[0]);

    console.log("=== 6. jsonb type of the top-level monthly_cost_usd on the serving row ===");
    const jtype = await client.query(
      `select jsonb_typeof(payload_json -> 'monthly_cost_usd') as t, count(*)::int as n
         from serving.tower_adoption_lens
        group by 1 order by 2 desc`,
    );
    line("monthly_cost_jsonb_type", jtype.rows);

    console.log("=== 7. constraints (a migration cannot be written without these) ===");
    const cons = await client.query(
      `select rel.relname as table_name,
              con.conname as constraint_name,
              case con.contype
                when 'p' then 'primary key'
                when 'u' then 'unique'
                when 'f' then 'foreign key'
                when 'c' then 'check'
                else con.contype::text
              end as kind,
              pg_get_constraintdef(con.oid) as definition
         from pg_constraint con
         join pg_class rel on rel.oid = con.conrelid
         join pg_namespace ns on ns.oid = rel.relnamespace
        where ns.nspname = 'ecl_projection' and rel.relname = any($1)
        order by rel.relname, con.contype, con.conname`,
      [TABLES],
    );
    if (cons.rows.length === 0) line("constraints", "NONE — not even a primary key");
    for (const r of cons.rows) {
      console.log(`constraint\t${r.table_name}\t${r.kind}\t${r.constraint_name}\t${r.definition}`);
    }

    console.log("=== 8. indexes ===");
    const idx = await client.query(
      `select tablename, indexname, indexdef
         from pg_indexes
        where schemaname = 'ecl_projection' and tablename = any($1)
        order by tablename, indexname`,
      [TABLES],
    );
    if (idx.rows.length === 0) line("indexes", "NONE");
    for (const r of idx.rows) {
      console.log(`index\t${r.tablename}\t${r.indexname}\t${r.indexdef}`);
    }

    console.log("=== 9. row-level security ===");
    const rls = await client.query(
      `select rel.relname as table_name, rel.relrowsecurity as rls_enabled,
              (select count(*)::int from pg_policies pol
                where pol.schemaname = 'ecl_projection' and pol.tablename = rel.relname) as policies
         from pg_class rel
         join pg_namespace ns on ns.oid = rel.relnamespace
        where ns.nspname = 'ecl_projection' and rel.relname = any($1)
        order by rel.relname`,
      [TABLES],
    );
    for (const r of rls.rows) {
      console.log(`rls\t${r.table_name}\trls_enabled=${r.rls_enabled}\tpolicies=${r.policies}`);
    }

    console.log("PROBE_OK");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.log(`PROBE_ERR\t${error.message}`);
  process.exit(1);
});
