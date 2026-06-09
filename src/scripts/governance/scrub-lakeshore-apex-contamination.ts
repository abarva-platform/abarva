// Scrub cross-tenant cover-name contamination from Lakeshore's loaded context.
//
// The WS-E live probe surfaced a Lakeshore company_scale answer reading
// "Lakeshore Holdings (legal entity: Apex Retail Group Composite Seed)" — a
// synthetic-seed artifact that embedded ANOTHER tenant's cover name into
// Lakeshore's profile. The phrase "Composite Seed" is UNIQUE to this
// contamination (Apex Retail's own legitimate data never contains it), so we
// target that phrase — scrubbing only the contaminated rows, never Apex's real
// data, without needing the (uncertain) Lakeshore tenant_key. Idempotent.
// Searches enterprise_context_* AND data_inventory_records (dynamic columns).
//
// Usage (ACA job): npx tsx src/scripts/governance/scrub-lakeshore-apex-contamination.ts [--apply]

import { Client } from 'pg';
import { config as loadEnv } from 'dotenv';
import { postgresClientOptions } from '../postgres-client-options';

loadEnv({ path: '.env.local' });
loadEnv();

// Contamination-unique marker (never in Apex's legitimate data).
const MARKER = 'Composite Seed';
const REPLACES: Array<[string, string]> = [
  ['Apex Retail Group Composite Seed', 'Lakeshore Holdings'],
  ['Apex Retail Group', 'Lakeshore Holdings'],
  ['Apex Retail', 'Lakeshore Holdings'],
];

function replExpr(col: string): string {
  let e = col;
  for (const [from, to] of REPLACES) e = `replace(${e}, '${from}', '${to}')`;
  return e;
}

async function main(): Promise<void> {
  const apply = process.argv.includes('--apply');
  const url = process.env.ABARVA_AZURE_DATABASE_URL ?? process.env.AZURE_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) { console.error(JSON.stringify({ event: 'scrub_error', error: 'no DATABASE_URL' })); process.exit(1); }
  const client = new Client(postgresClientOptions(url, 'scrub-lakeshore-apex'));
  await client.connect();
  try {
    // Build the candidate (table, column) list: static + dynamic text/jsonb
    // columns of data_inventory_records.
    const targets: Array<{ table: string; col: string }> = [
      { table: 'enterprise_context_chunks', col: 'chunk_text' },
      { table: 'enterprise_context_facts', col: 'fact_text' },
      { table: 'enterprise_context_facts', col: 'fact_value' },
      { table: 'enterprise_context_records', col: 'payload' },
    ];
    const dyn = await client.query(
      `SELECT column_name, data_type FROM information_schema.columns
        WHERE table_schema='public' AND table_name='data_inventory_records'
          AND data_type IN ('text','character varying','jsonb')`,
    );
    for (const r of dyn.rows) targets.push({ table: 'data_inventory_records', col: r.column_name });

    const jsonbCols = new Set<string>();
    {
      const j = await client.query(
        `SELECT table_name, column_name FROM information_schema.columns
          WHERE table_schema='public' AND data_type='jsonb'
            AND table_name IN ('enterprise_context_facts','enterprise_context_records','data_inventory_records')`,
      );
      for (const r of j.rows) jsonbCols.add(`${r.table_name}.${r.column_name}`);
    }
    const asText = (t: string, c: string) => (jsonbCols.has(`${t}.${c}`) ? `${c}::text` : c);

    // 1. Locate the contamination (table, column, tenant_key, count).
    const hits: Array<{ table: string; col: string }> = [];
    for (const { table, col } of targets) {
      try {
        const { rows } = await client.query(
          `SELECT count(*)::int AS n, min(tenant_key) AS sample_tenant FROM ${table} WHERE ${asText(table, col)} ILIKE '%${MARKER}%'`,
        );
        const n = rows[0].n as number;
        console.log(JSON.stringify({ event: 'scrub_found', table, col, rows: n, sampleTenant: rows[0].sample_tenant }));
        if (n > 0) hits.push({ table, col });
      } catch (e) {
        console.log(JSON.stringify({ event: 'scrub_skip', table, col, error: e instanceof Error ? e.message : String(e) }));
      }
    }

    if (!apply) { console.log(JSON.stringify({ event: 'scrub_dryrun' })); return; }

    // 2. Scrub the located rows (target the unique marker; tenant-safe).
    for (const { table, col } of hits) {
      const isJsonb = jsonbCols.has(`${table}.${col}`);
      const setExpr = isJsonb ? `${col} = ${replExpr(`${col}::text`)}::jsonb` : `${col} = ${replExpr(col)}`;
      const r = await client.query(
        `UPDATE ${table} SET ${setExpr}, updated_at = now() WHERE ${asText(table, col)} ILIKE '%${MARKER}%'`,
      ).catch(async (e) => {
        // some tables may lack updated_at
        if (String(e).includes('updated_at')) {
          return client.query(`UPDATE ${table} SET ${setExpr} WHERE ${asText(table, col)} ILIKE '%${MARKER}%'`);
        }
        throw e;
      });
      console.log(JSON.stringify({ event: 'scrub_applied', table, col, rowsUpdated: r.rowCount }));
    }
    console.log(JSON.stringify({ event: 'scrub_done', hits: hits.length }));
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(JSON.stringify({ event: 'scrub_fatal', error: err instanceof Error ? err.message : String(err) }));
  process.exit(1);
});
