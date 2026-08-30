/**
 * Read-only dump of how the deployed serving views actually resolve a generation.
 *
 * `serving.tower_ai_portfolio` returns 415 rows for a tenant whose active generation holds 55.
 * 415 is 360 retired plus 55 current, so the view is returning every generation. The migration
 * that defines `serving.tower_ai_rows` joins `serving.tower_active_assessment_keys()`, which
 * should make that impossible — so either the deployed view is not the one in that migration, or
 * the join is not doing what it reads as doing.
 *
 * The app compensates by filtering in TypeScript (`rowsForActiveServingIdentity`), which is why
 * the page is correct while the view is not. Any other consumer of these views sees every
 * generation.
 *
 * Strictly read-only.
 */

import process from "node:process";

const VIEWS = [
  "tower_ai_portfolio",
  "tower_adoption_lens",
  "tower_command_center",
  "tower_value_proof",
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
        where n.nspname = 'serving' and p.proname in ('tower_ai_rows','tower_command_rows')`,
    );
    for (const r of fn.rows) {
      const body = String(r.body ?? "");
      console.log(
        `function\t${r.proname}\tjoins_active_keys=${body.includes("tower_active_assessment_keys")}\tlen=${body.length}`,
      );
    }

    console.log("=== 3. rows the view returns, per generation ===");
    const perGen = await client.query(
      `select tenant_key, assessment_id, projection_version, count(*)::int as rows
         from serving.tower_ai_portfolio
        group by tenant_key, assessment_id, projection_version
        order by tenant_key, projection_version desc`,
    );
    for (const r of perGen.rows) {
      console.log(
        `view_rows\ttower_ai_portfolio\t${r.tenant_key}\t${r.assessment_id}\tv${r.projection_version}\t${r.rows}`,
      );
    }

    console.log("=== 3b. both lenses, so a routed row is distinguishable from a dropped one ===");
    // Splitting by page key can fail in a way the generation join cannot: it can drop rows rather
    // than route them. A row whose page key matches neither lens disappears from the serving layer
    // entirely, and a check that only looked at tower_ai_portfolio would read that as success.
    for (const v of ["tower_ai_portfolio", "tower_adoption_lens"]) {
      const c = await client.query(
        `select tenant_key, count(*)::int as rows from serving.${v}
          group by tenant_key order by tenant_key`,
      );
      for (const r of c.rows) console.log(`lens\t${v}\t${r.tenant_key}\t${r.rows}`);
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
    // The repo's migration defines these functions with the join and that migration is applied,
    // yet the deployed bodies do not contain it. Something replaced them since. Re-creating from
    // the repo would therefore change more than the join, so the deployed text is the only safe
    // basis for a minimal fix.
    for (const name of ["tower_ai_rows", "tower_command_rows"]) {
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
