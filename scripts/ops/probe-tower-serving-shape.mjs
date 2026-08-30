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
    const keys = await client.query(
      `select jsonb_object_keys(display_payload_json) as k
         from ecl_projection.tower_ai_portfolio
        where display_payload_json ->> 'page_key' = 'adoption_lens'
        limit 1`,
    );
    line("rollout_display_keys", keys.rows.map((r) => r.k).sort());

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

    console.log("PROBE_OK");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.log(`PROBE_ERR\t${error.message}`);
  process.exit(1);
});
