// Scrub cross-tenant cover-name contamination from Lakeshore's loaded context.
//
// The WS-E live probe surfaced a Lakeshore company_scale answer reading
// "Lakeshore Holdings (legal entity: Apex Retail Group Composite Seed)" — a
// synthetic-seed artifact that embedded ANOTHER tenant's cover name (Apex
// Retail) into Lakeshore's enterprise-profile record. This violates the cover-
// name isolation rule. The contamination is in the live DB only (not the repo
// source), so this script scrubs the Apex tokens out of Lakeshore's chunks,
// facts, and records. Scoped to Lakeshore + the Apex tokens; idempotent; runs
// in-VNet on Azure Container Apps.
//
// Usage (ACA job): npx tsx src/scripts/governance/scrub-lakeshore-apex-contamination.ts [--apply]

import { Client } from 'pg';
import { config as loadEnv } from 'dotenv';
import { postgresClientOptions } from '../postgres-client-options';

loadEnv({ path: '.env.local' });
loadEnv();

const TENANTS = ['lakeshore', 'lakeshore-holdings'];
// Replacement: drop the cross-tenant legal-entity parenthetical and any bare
// Apex cover-name token, normalising to the Lakeshore identity.
const REPLACES: Array<[string, string]> = [
  ['Apex Retail Group Composite Seed', 'Lakeshore Holdings'],
  ['Apex Retail Group', 'Lakeshore Holdings'],
  ['Apex Retail', 'Lakeshore Holdings'],
];

function replExpr(col: string): string {
  // Nested replace() for each token, case-sensitive (cover names are proper nouns).
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
    const tlist = TENANTS.map((t) => `'${t}'`).join(',');

    // 1. Report what is contaminated (always).
    for (const [table, col] of [
      ['enterprise_context_chunks', 'chunk_text'],
      ['enterprise_context_facts', 'fact_text'],
      ['enterprise_context_facts', 'fact_value::text'],
      ['enterprise_context_records', 'payload::text'],
    ] as const) {
      const { rows } = await client.query(
        `SELECT count(*)::int AS n FROM ${table} WHERE tenant_key IN (${tlist}) AND ${col} ILIKE '%apex retail%'`,
      );
      console.log(JSON.stringify({ event: 'scrub_found', table, col, rows: rows[0].n }));
    }

    if (!apply) {
      console.log(JSON.stringify({ event: 'scrub_dryrun', note: 'pass --apply to scrub' }));
      return;
    }

    // 2. Scrub (idempotent — ILIKE filter targets only contaminated rows).
    const updates: Array<{ table: string; set: string; where: string }> = [
      { table: 'enterprise_context_chunks', set: `chunk_text = ${replExpr('chunk_text')}`, where: `chunk_text ILIKE '%apex retail%'` },
      { table: 'enterprise_context_facts', set: `fact_text = ${replExpr('fact_text')}, fact_value = ${replExpr('fact_value::text')}::jsonb`, where: `fact_text ILIKE '%apex retail%' OR fact_value::text ILIKE '%apex retail%'` },
      { table: 'enterprise_context_records', set: `payload = ${replExpr('payload::text')}::jsonb`, where: `payload::text ILIKE '%apex retail%'` },
    ];
    for (const u of updates) {
      const r = await client.query(
        `UPDATE ${u.table} SET ${u.set}, updated_at = now() WHERE tenant_key IN (${tlist}) AND (${u.where})`,
      );
      console.log(JSON.stringify({ event: 'scrub_applied', table: u.table, rowsUpdated: r.rowCount }));
    }
    console.log(JSON.stringify({ event: 'scrub_done' }));
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(JSON.stringify({ event: 'scrub_fatal', error: err instanceof Error ? err.message : String(err) }));
  process.exit(1);
});
