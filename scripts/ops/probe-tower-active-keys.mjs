/**
 * Read-only capture of what `serving.tower_active_assessment_keys()` resolves, per tenant.
 *
 * Run this immediately before and immediately after applying
 * `20260830050000_tower_assessment_lifecycle.sql`, and diff the two outputs. The migration is
 * meant to be inert: it adds a declaration table nothing writes to yet, and replaces the function
 * with one whose declared branch returns nothing while that table is empty and whose fallback is
 * the prior ranking verbatim. If any tenant's resolved generation moves, the migration is wrong
 * and the answer is in the diff.
 *
 * Output is deliberately one sorted line per tenant so a plain `diff` is the whole verification.
 *
 * Strictly read-only.
 */

import process from "node:process";

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
    const keys = await client.query(
      `select tenant_key, assessment_id, projection_version
         from serving.tower_active_assessment_keys()
        order by tenant_key, assessment_id, projection_version`,
    );
    console.log(`ACTIVE_KEYS_COUNT\t${keys.rows.length}`);
    for (const r of keys.rows) {
      console.log(
        `ACTIVE_KEY\t${r.tenant_key}\t${r.assessment_id}\t${r.projection_version}`,
      );
    }

    // Whether the declaration table exists yet, and whether anything has been declared. Before the
    // migration this reports absent; after it, present and empty. A non-empty table here means
    // something wrote declarations, which changes what the function resolves.
    const lifecycle = await client.query(
      `select to_regclass('ecl_projection.tower_assessment_lifecycle') is not null as present`,
    );
    const present = lifecycle.rows[0]?.present === true;
    console.log(`LIFECYCLE_TABLE\t${present ? "present" : "absent"}`);
    if (present) {
      const declared = await client.query(
        `select state, count(*)::int as rows
           from ecl_projection.tower_assessment_lifecycle
          group by state order by state`,
      );
      console.log(
        `LIFECYCLE_ROWS\t${JSON.stringify(declared.rows)}`,
      );
    }
    console.log("ACTIVE_KEYS_OK");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.log(`ACTIVE_KEYS_ERR\t${error.message}`);
  process.exit(1);
});
