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
    // Full-schema hunt: enumerate every text/varchar/jsonb column in public so
    // we find the unique "Composite Seed" marker wherever it lives (clients,
    // enterprise_context_*, data_inventory_records, corpus_*, graph_*, …).
    const cols = await client.query(
      `SELECT table_name, column_name, data_type FROM information_schema.columns
        WHERE table_schema='public' AND data_type IN ('text','character varying','jsonb')
        ORDER BY table_name`,
    );
    // Only tables that HAVE a tenant_key can be safely scrubbed — we must scope
    // to Lakeshore so we never touch another tenant's legitimate data (e.g.
    // Apex's own "Apex Retail Group Composite Seed" legal_name).
    const tablesWithTenantKey = new Set(
      cols.rows.filter((r) => r.column_name === 'tenant_key').map((r) => r.table_name),
    );
    const targets: Array<{ table: string; col: string }> = cols.rows
      .filter((r) => tablesWithTenantKey.has(r.table_name) && r.column_name !== 'tenant_key')
      .map((r) => ({ table: r.table_name, col: r.column_name }));
    const jsonbCols = new Set<string>();
    for (const r of cols.rows) if (r.data_type === 'jsonb') jsonbCols.add(`${r.table_name}.${r.column_name}`);
    const asText = (t: string, c: string) => (jsonbCols.has(`${t}.${c}`) ? `${c}::text` : c);
    // Tenant-scope: only Lakeshore rows, only those containing an Apex reference.
    const SCOPE = `tenant_key IN ('lakeshore','lakeshore-holdings')`;

    // 1. Locate the contamination (table, column, tenant_key, count).
    const hits: Array<{ table: string; col: string }> = [];
    for (const { table, col } of targets) {
      try {
        const { rows } = await client.query(
          `SELECT count(*)::int AS n, min(tenant_key) AS sample_tenant FROM ${table} WHERE ${SCOPE} AND ${asText(table, col)} ILIKE '%Apex Retail%'`,
        );
        const n = rows[0].n as number;
        if (n > 0) {
          console.log(JSON.stringify({ event: 'scrub_found', table, col, rows: n, sampleTenant: rows[0].sample_tenant }));
          hits.push({ table, col });
        }
      } catch {
        /* column not text-castable / not searchable — skip */
      }
    }

    if (!apply) { console.log(JSON.stringify({ event: 'scrub_dryrun' })); return; }

    // 2. Scrub the located rows (target the unique marker; tenant-safe).
    for (const { table, col } of hits) {
      const isJsonb = jsonbCols.has(`${table}.${col}`);
      const setExpr = isJsonb ? `${col} = ${replExpr(`${col}::text`)}::jsonb` : `${col} = ${replExpr(col)}`;
      const r = await client.query(
        `UPDATE ${table} SET ${setExpr}, updated_at = now() WHERE ${SCOPE} AND ${asText(table, col)} ILIKE '%Apex Retail%'`,
      ).catch(async (e) => {
        // some tables may lack updated_at
        if (String(e).includes('updated_at')) {
          return client.query(`UPDATE ${table} SET ${setExpr} WHERE ${SCOPE} AND ${asText(table, col)} ILIKE '%Apex Retail%'`);
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
