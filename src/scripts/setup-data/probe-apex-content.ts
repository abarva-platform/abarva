/**
 * Probe Apex content for SETUP-1.2 Sentinel-opener authoring.
 * Read-only. Service-role.
 */
import { createClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';
import path from 'node:path';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv({ path: '/Users/anand/Projects/nexus/.env.local' });
loadEnv();

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('missing supabase env');
  const c = createClient(url.trim(), key.trim(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const tk = 'apex-retail';

  const profile = await c
    .from('data_inventory_records')
    .select('title, record_payload, source_doc')
    .eq('tenant_key', tk)
    .eq('segment_id', 'enterprise_profile')
    .limit(3);
  console.log('=== enterprise_profile ===');
  console.log(JSON.stringify(profile.data, null, 2));

  const programs = await c
    .from('data_inventory_records')
    .select('title, record_payload')
    .eq('tenant_key', tk)
    .eq('segment_id', 'program_inventory')
    .limit(10);
  console.log('=== program_inventory ===');
  console.log(JSON.stringify(programs.data, null, 2));

  const orgTop = await c
    .from('data_inventory_records')
    .select('title, record_payload')
    .eq('tenant_key', tk)
    .eq('segment_id', 'org_structure')
    .limit(10);
  console.log('=== org_structure (sample) ===');
  console.log(JSON.stringify(orgTop.data, null, 2));

  const kpis = await c
    .from('data_inventory_records')
    .select('title, record_payload')
    .eq('tenant_key', tk)
    .eq('segment_id', 'kpi_dictionary')
    .limit(8);
  console.log('=== kpi_dictionary (sample) ===');
  console.log(JSON.stringify(kpis.data, null, 2));

  const xprog = await c
    .from('data_inventory_records')
    .select('title, record_payload')
    .eq('tenant_key', tk)
    .eq('segment_id', 'cross_program_signals')
    .limit(12);
  console.log('=== cross_program_signals (all 12) ===');
  console.log(JSON.stringify(xprog.data, null, 2));

  const evidence = await c
    .from('data_inventory_records')
    .select('title, record_payload, last_reviewed, freshness_state')
    .eq('tenant_key', tk)
    .eq('segment_id', 'evidence_ledger')
    .limit(6);
  console.log('=== evidence_ledger (sample) ===');
  console.log(JSON.stringify(evidence.data, null, 2));

  const audit = await c
    .from('data_inventory_audit_log')
    .select('action, segment_id, source_doc, actor_role, created_at')
    .eq('tenant_key', tk)
    .order('created_at', { ascending: false })
    .limit(10);
  console.log('=== audit (most recent) ===');
  console.log(JSON.stringify(audit.data, null, 2));

  const ingest = await c
    .from('data_ingestion_runs')
    .select('source_label, status, records_loaded, chunks_loaded, nodes_loaded, edges_loaded, started_at, completed_at')
    .eq('tenant_key', tk)
    .order('started_at', { ascending: false })
    .limit(3);
  console.log('=== ingestion runs ===');
  console.log(JSON.stringify(ingest.data, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
