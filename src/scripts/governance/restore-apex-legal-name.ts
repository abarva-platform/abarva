// Corrective: restore apex-retail.clients.legal_name.
//
// The contamination scrub matched the shared synthetic marker "Composite Seed",
// which is ALSO part of Apex Retail's own legitimate legal_name ("Apex Retail
// Group Composite Seed"). The scrub therefore overwrote BOTH the contaminated
// Lakeshore row AND Apex's legitimate row to "Lakeshore Holdings". This restores
// Apex's correct legal_name and leaves Lakeshore's row clean (no Apex reference).
// Tenant-scoped + idempotent. Runs in-VNet on Azure Container Apps.
//
// Usage (ACA job): npx tsx src/scripts/governance/restore-apex-legal-name.ts [--apply]

import { Client } from 'pg';
import { config as loadEnv } from 'dotenv';
import { postgresClientOptions } from '../postgres-client-options';

loadEnv({ path: '.env.local' });
loadEnv();

const APEX_LEGAL = 'Apex Retail Group Composite Seed';
const LAKE_LEGAL = 'Lakeshore Holdings Composite Seed';

async function main(): Promise<void> {
  const apply = process.argv.includes('--apply');
  const url = process.env.ABARVA_AZURE_DATABASE_URL ?? process.env.AZURE_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) { console.error(JSON.stringify({ event: 'restore_error', error: 'no DATABASE_URL' })); process.exit(1); }
  const client = new Client(postgresClientOptions(url, 'restore-apex-legal-name'));
  await client.connect();
  try {
    // Show the current state of the two affected rows.
    const before = await client.query(
      `SELECT tenant_key, legal_name FROM clients WHERE tenant_key IN ('apex-retail','lakeshore','lakeshore-holdings') ORDER BY tenant_key`,
    );
    for (const r of before.rows) console.log(JSON.stringify({ event: 'restore_before', tenant: r.tenant_key, legal_name: r.legal_name }));

    if (!apply) { console.log(JSON.stringify({ event: 'restore_dryrun' })); return; }

    // Restore Apex's legitimate legal_name (it had been overwritten to Lakeshore).
    const a = await client.query(
      `UPDATE clients SET legal_name = $1 WHERE tenant_key = 'apex-retail' AND legal_name <> $1`,
      [APEX_LEGAL],
    );
    console.log(JSON.stringify({ event: 'restore_apex', rowsUpdated: a.rowCount }));

    // Give Lakeshore its own composite-seed legal_name (was the Apex contamination,
    // then scrubbed to a bare "Lakeshore Holdings" — normalise to the pattern).
    const l = await client.query(
      `UPDATE clients SET legal_name = $1 WHERE tenant_key IN ('lakeshore','lakeshore-holdings') AND legal_name NOT ILIKE '%lakeshore%composite seed%'`,
      [LAKE_LEGAL],
    );
    console.log(JSON.stringify({ event: 'restore_lakeshore', rowsUpdated: l.rowCount }));

    const after = await client.query(
      `SELECT tenant_key, legal_name FROM clients WHERE tenant_key IN ('apex-retail','lakeshore','lakeshore-holdings') ORDER BY tenant_key`,
    );
    for (const r of after.rows) console.log(JSON.stringify({ event: 'restore_after', tenant: r.tenant_key, legal_name: r.legal_name }));
    console.log(JSON.stringify({ event: 'restore_done' }));
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(JSON.stringify({ event: 'restore_fatal', error: err instanceof Error ? err.message : String(err) }));
  process.exit(1);
});
