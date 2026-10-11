#!/usr/bin/env node

import fs from "node:fs";

const arg = (name) => {
  const index = process.argv.indexOf(name);
  return index < 0 ? null : process.argv[index + 1];
};

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for read-only schema probe");
  const out = arg("--out");
  const compare = arg("--compare");
  if (!out) throw new Error("--out is required");
  const { default: pg } = await import("pg");
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query("begin read only");
    const columns = await client.query(`
      select table_name, column_name, is_nullable, column_default
      from information_schema.columns
      where table_schema = 'ecl_projection'
        and (table_name, column_name) in (
          ('tower_value_chain', 'claimable_value_usd'),
          ('tower_value_chain', 'blocked_value_usd'),
          ('tower_evidence_queue', 'priority_score'))
      order by table_name, column_name`);
    const constraint = await client.query(`
      select conname, convalidated from pg_constraint
      where conrelid = 'ecl_projection.tower_value_chain'::regclass
        and conname = 'tower_value_chain_unknown_amounts_check'`);
    const valueState = await client.query(`
      select count(*)::int as rows,
        md5(coalesce(string_agg(id::text || ':' || coalesce(claimable_value_usd::text, '<null>') || ':' ||
          coalesce(blocked_value_usd::text, '<null>'), '|' order by id), '')) as numeric_hash
      from ecl_projection.tower_value_chain`);
    const evidenceState = await client.query(`
      select count(*)::int as rows,
        md5(coalesce(string_agg(id::text || ':' || coalesce(priority_score::text, '<null>'), '|' order by id), '')) as numeric_hash
      from ecl_projection.tower_evidence_queue`);
    await client.query("commit");
    const proof = {
      contract_version: "tower-unknown-amount-schema-probe/v1",
      captured_at: new Date().toISOString(), columns: columns.rows,
      unknown_amount_constraint: constraint.rows,
      unchanged_numeric_basis: { value_chain: valueState.rows[0], evidence_queue: evidenceState.rows[0] },
    };
    if (columns.rows.length !== 3) throw new Error("Expected Tower numeric columns are missing");
    if (compare) {
      const baseline = JSON.parse(fs.readFileSync(compare, "utf8"));
      if (JSON.stringify(proof.unchanged_numeric_basis) !== JSON.stringify(baseline.unchanged_numeric_basis)) {
        throw new Error("Existing Tower numeric rows changed during schema migration");
      }
      if (columns.rows.some((row) => row.is_nullable !== "YES" || row.column_default !== null)) {
        throw new Error("Unknown amounts or unassessed priority remain forced to a default");
      }
      if (constraint.rows.length !== 1) throw new Error("Unknown-amount check is absent");
      proof.comparison_status = "pass";
    } else proof.comparison_status = "baseline_only";
    fs.writeFileSync(out, `${JSON.stringify(proof, null, 2)}\n`);
    console.log(JSON.stringify({ comparison_status: proof.comparison_status,
      value_rows: proof.unchanged_numeric_basis.value_chain.rows,
      evidence_rows: proof.unchanged_numeric_basis.evidence_queue.rows }));
  } finally {
    await client.end();
  }
}

main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
