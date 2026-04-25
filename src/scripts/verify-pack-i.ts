import { config as loadEnv } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'node:path';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv();

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('env missing');
  const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const tables = [
    // 029
    'infra_assets', 'cloud_costs', 'applications', 'integrations',
    'data_sources', 'data_pipelines', 'data_governance_policies',
    'ai_models', 'cost_centers', 'spend_breakdown', 'eng_teams',
    'engineering_metrics',
    // 030
    'revenue_cycle_metrics', 'claims_denials', 'clinical_units',
    'provider_ops', 'clinical_workflows', 'workflow_steps',
    'digital_channels', 'patient_experience',
    // 031
    'underwriting_workflows', 'claims_risk', 'fraud_metrics', 'aml_alerts',
    'call_center_metrics', 'tickets', 'digital_metrics', 'journeys',
    // 032
    'supply_chain', 'inventory_metrics', 'stores', 'store_metrics',
    'ecommerce_metrics', 'sessions_daily', 'pricing_models', 'promotions',
    'returns_metrics', 'return_reasons',
    // 033
    'turn_traces',
  ];

  let ok = 0, fail = 0;
  for (const t of tables) {
    const { error } = await sb.from(t).select('*', { count: 'exact', head: true }).limit(1);
    if (error) {
      console.log(`  ✗ ${t.padEnd(32)} ${error.message}`);
      fail += 1;
    } else {
      console.log(`  ✓ ${t}`);
      ok += 1;
    }
  }
  console.log(`\n${ok}/${tables.length} tables present · ${fail} missing`);
}

main().catch((err) => {
  console.error('FAILED:', err);
  process.exit(1);
});
