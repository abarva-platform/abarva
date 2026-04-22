import { createClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';
import path from 'node:path';
loadEnv({ path: path.resolve(process.cwd(), '.env.local') });

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const tables = ['infra_assets','cloud_costs','applications','integrations','data_sources','data_pipelines','data_governance_policies','ai_models','cost_centers','spend_breakdown','eng_teams','engineering_metrics','revenue_cycle_metrics','claims_denials','clinical_units','provider_ops','clinical_workflows','workflow_steps','digital_channels','patient_experience','underwriting_workflows','claims_risk','fraud_metrics','aml_alerts','call_center_metrics','tickets','digital_metrics','journeys','supply_chain','inventory_metrics','stores','store_metrics','ecommerce_metrics','sessions_daily','pricing_models','promotions','returns_metrics','return_reasons'];

let ok=0, fail=0;
for (const t of tables) {
  const { error } = await sb.from(t).select('*', { count: 'exact', head: true });
  if (error) { console.log('  ✗ ' + t); fail++; } else { ok++; }
}
console.log('\nMigration 029-032 tables: ' + ok + '/' + tables.length + ' present · ' + fail + ' missing');

// Also verify 025 rename worked
const { data, error } = await sb.from('relationship_notes').select('subject_type').eq('subject_type', 'maestro').limit(1);
console.log('Migration 025 · residual subject_type="maestro" rows: ' + (data?.length ?? '?') + (error ? ' · ' + error.message : ''));
