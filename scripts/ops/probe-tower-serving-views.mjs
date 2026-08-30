/**
 * Read-only dump of how the deployed Tower serving views resolve active generations and page keys.
 */

import process from "node:process";

const VIEWS = [
  "tower_ai_portfolio",
  "tower_adoption_lens",
  "tower_command_center",
  "tower_value_proof",
  "tower_evidence",
  "tower_cost_lens",
  "tower_risk_lens",
];

const FUNCTIONS = [
  "tower_ai_rows",
  "tower_command_rows",
  "tower_value_rows",
  "tower_evidence_rows",
];

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
    console.log("=== 1. is each object a view, and does its body join the active keys? ===");
    for (const v of VIEWS) {
      const def = await client.query(
        `select pg_get_viewdef(('serving.' || $1)::regclass, true) as body`,
        [v],
      ).catch((e) => ({ rows: [{ body: `ERROR: ${e.message}` }] }));
      const body = String(def.rows[0]?.body ?? "");
      console.log(
        `view\t${v}\tjoins_active_keys=${body.includes("tower_active_assessment_keys")}\tlen=${body.length}`,
      );
    }

    console.log("=== 2. the function body, if it is a function the views call ===");
    const fn = await client.query(
      `select p.proname, pg_get_functiondef(p.oid) as body
         from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'serving' and p.proname = any($1::text[])
        order by p.proname`,
      [FUNCTIONS],
    );
    for (const r of fn.rows) {
      const body = String(r.body ?? "");
      console.log(
        [
          "function",
          r.proname,
          `joins_active_keys=${body.includes("tower_active_assessment_keys")}`,
          `uses_page_key_arg=${body.includes("page_key_arg")}`,
          `len=${body.length}`,
        ].join("\t"),
      );
    }

    console.log("=== 3. rows the view returns, per generation ===");
    for (const v of VIEWS) {
      const perGen = await client.query(
        `select tenant_key, assessment_id, projection_version, count(*)::int as rows
           from serving.${v}
          group by tenant_key, assessment_id, projection_version
          order by tenant_key, projection_version desc`,
      );
      for (const r of perGen.rows) {
        console.log(
          `view_rows\t${v}\t${r.tenant_key}\t${r.assessment_id}\tv${r.projection_version}\t${r.rows}`,
        );
      }
    }

    console.log("=== 4. what the active-keys function says right now ===");
    const keys = await client.query(
      `select tenant_key, assessment_id, projection_version
         from serving.tower_active_assessment_keys()
        order by tenant_key`,
    );
    for (const r of keys.rows) {
      console.log(`active\t${r.tenant_key}\t${r.assessment_id}\tv${r.projection_version}`);
    }

    console.log("=== 5. the deployed bodies, verbatim ===");
    for (const name of FUNCTIONS) {
      const r = await client.query(
        `select pg_get_functiondef(p.oid) as body
           from pg_proc p join pg_namespace n on n.oid = p.pronamespace
          where n.nspname = 'serving' and p.proname = $1
          limit 1`,
        [name],
      );
      const body = String(r.rows[0]?.body ?? "MISSING");
      console.log(`BODY_BEGIN\t${name}`);
      for (const l of body.split("\n")) console.log(`BODY\t${l}`);
      console.log(`BODY_END\t${name}`);
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
