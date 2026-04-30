/**
 * Probe Apex org structure + cross-program signals + IT systems
 * for SETUP-1.2 fixture authoring.
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

  const orgC = await c
    .from('data_inventory_records')
    .select('title, record_payload')
    .eq('tenant_key', tk)
    .eq('segment_id', 'org_structure')
    .limit(50);
  const cExecs = (orgC.data ?? []).filter((r: any) =>
    String(r.record_payload?.role || r.record_payload?.title || '')
      .toLowerCase()
      .startsWith('c'),
  );
  console.log('=== org_structure C-suite ===');
  console.log(
    JSON.stringify(
      cExecs.map((r: any) => ({
        title: r.title,
        role: r.record_payload?.role,
        name: r.record_payload?.full_name ?? r.record_payload?.name,
        person_id: r.record_payload?.person_id ?? r.record_payload?.id,
      })),
      null,
      2,
    ),
  );

  const xprog = await c
    .from('data_inventory_records')
    .select('title, record_payload')
    .eq('tenant_key', tk)
    .eq('segment_id', 'cross_program_signals');
  console.log('=== cross_program_signals (12) ===');
  console.log(
    JSON.stringify(
      (xprog.data ?? []).map((r: any) => ({
        title: r.title,
        severity: r.record_payload?.severity,
        recommendation: r.record_payload?.recommendation,
      })),
      null,
      2,
    ),
  );

  const compl = await c
    .from('data_inventory_records')
    .select('title, record_payload')
    .eq('tenant_key', tk)
    .eq('segment_id', 'compliance');
  console.log('=== compliance ===');
  console.log(
    JSON.stringify(
      (compl.data ?? []).map((r: any) => ({
        title: r.title,
      })),
      null,
      2,
    ),
  );

  const sys5 = await c
    .from('data_inventory_records')
    .select('title, record_payload')
    .eq('tenant_key', tk)
    .eq('segment_id', 'it_landscape')
    .eq('freshness_state', 'stale')
    .limit(8);
  console.log('=== it_landscape (stale) ===');
  console.log(
    JSON.stringify(
      (sys5.data ?? []).map((r: any) => ({
        title: r.title,
        vendor: r.record_payload?.vendor,
        criticality: r.record_payload?.business_criticality,
      })),
      null,
      2,
    ),
  );

  const baselines = await c
    .from('tenant_expected_baselines')
    .select('segment_id, expected_record_count, expected_freshness_days, required_for_reasoning_modes')
    .eq('tenant_key', tk)
    .order('segment_id');
  console.log('=== expected_baselines ===');
  console.log(JSON.stringify(baselines.data, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
