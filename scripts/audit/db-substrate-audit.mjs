#!/usr/bin/env node
/**
 * Database substrate audit.
 *
 * Reports what's actually in Supabase for each tenant, by table. Compares
 * against the disk-side spec (Packet 18 Apex / Packet 19 Meridian / Packet
 * 20 First Capital / Packet 21 Northstar). Surfaces the gap.
 *
 * Authored 2026-05-26 after the architectural review: "audit the actual
 * datasets in the database" — discovered that 3 of 4 composite tenants
 * have ZERO substrate loaded, the Northstar provenance UI is reading
 * hardcoded mock values, and even Apex only has 9 of the spec'd 120 apps.
 *
 * Usage: node scripts/audit/db-substrate-audit.mjs
 */

import dotenv from 'dotenv';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
dotenv.config({ path: path.join(REPO_ROOT, '.env.local') });

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const TENANTS = {
  apex:       { id: 'bb8ed961-a049-4d0c-a38f-f8912138fceb', name: 'Apex Retail',          spec: { applications: 120, ai_initiatives: 30, vendor_contracts: 45, enterprise_context_source_files: 42, enterprise_context_chunks: 280, teams: 14 } },
  meridian:   { id: 'a20ecef5-f0ea-4890-b9d5-7375fab223ff', name: 'Meridian Health',      spec: { applications: 140, ai_initiatives: 28, vendor_contracts: 50, enterprise_context_source_files: 48, enterprise_context_chunks: 320, teams: 16 } },
  arcturus:   { id: 'a75687bf-71b9-4524-ab4e-68ae3f28d200', name: 'Brindlemark / First Capital', spec: { applications: 180, ai_initiatives: 32, vendor_contracts: 70, enterprise_context_source_files: 60, enterprise_context_chunks: 400, teams: 22 } },
  northstar:  { id: '2702b525-4c6a-4fbe-973d-99a8480d8318', name: 'Northstar MedTech',    spec: { applications: 240, ai_initiatives: 80, vendor_contracts: 90, enterprise_context_source_files: 96, enterprise_context_chunks: 720, teams: 22 } },
};

const TABLES = [
  'enterprise_context_chunks',
  'enterprise_context_source_files',
  'applications',
  'ai_initiatives',
  'vendor_contracts',
  'teams',
  'person_client_memberships',
];

async function countByClient(table, clientId) {
  const { count, error } = await sb.from(table).select('*', { count: 'exact', head: true }).eq('client_id', clientId);
  if (error) return { count: null, error: error.message };
  return { count, error: null };
}

async function main() {
  console.log('────────────────────────────────────────────────────────────────────────────');
  console.log('Database substrate audit · 2026-05-26');
  console.log('────────────────────────────────────────────────────────────────────────────');

  // header
  process.stdout.write('table'.padEnd(34));
  for (const key of Object.keys(TENANTS)) process.stdout.write(key.padStart(14));
  console.log();

  const gaps = [];
  for (const table of TABLES) {
    process.stdout.write(table.padEnd(34));
    for (const [key, t] of Object.entries(TENANTS)) {
      const { count, error } = await countByClient(table, t.id);
      const spec = t.spec[table];
      let cell;
      if (error) cell = 'ERR';
      else if (spec != null) {
        cell = `${count}/${spec}`;
        if (count < spec) {
          gaps.push({ tenant: key, table, actual: count, spec, gap: spec - count });
        }
      } else cell = `${count}`;
      process.stdout.write(cell.padStart(14));
    }
    console.log();
  }

  console.log();
  console.log('────────────────────────────────────────────────────────────────────────────');
  console.log(`Substrate gaps (actual < spec): ${gaps.length}`);
  console.log('────────────────────────────────────────────────────────────────────────────');
  const byTenant = {};
  for (const g of gaps) {
    if (!byTenant[g.tenant]) byTenant[g.tenant] = [];
    byTenant[g.tenant].push(g);
  }
  for (const [tenant, list] of Object.entries(byTenant)) {
    console.log(`\n  ${TENANTS[tenant].name} (${tenant})`);
    for (const g of list) console.log(`    ${g.table.padEnd(34)} ${String(g.actual).padStart(5)} / ${String(g.spec).padStart(5)}  (gap ${g.gap})`);
  }

  console.log();
  console.log('────────────────────────────────────────────────────────────────────────────');
  console.log('Conclusion');
  console.log('────────────────────────────────────────────────────────────────────────────');
  const totalSpec = gaps.reduce((s, g) => s + g.spec, 0);
  const totalActual = gaps.reduce((s, g) => s + g.actual, 0);
  console.log(`  Total expected rows across gapped tables: ${totalSpec}`);
  console.log(`  Total actual rows: ${totalActual}`);
  console.log(`  Missing rows: ${totalSpec - totalActual}`);
  console.log();
  console.log('  If any tenant\'s enterprise_context_chunks is zero, the agent cannot');
  console.log('  ground in tenant-specific facts. Sentinel will pattern-match generic');
  console.log('  vertical knowledge instead of citing the tenant\'s own portfolio.');
  console.log();
}

main().catch((err) => { console.error(err); process.exit(1); });
