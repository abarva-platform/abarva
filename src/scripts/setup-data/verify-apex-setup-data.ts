import { createClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';
import path from 'node:path';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv({ path: '/Users/anand/Projects/nexus/.env.local' });
loadEnv();

const tables = [
  'data_inventory_segments',
  'data_inventory_records',
  'enterprise_graph_nodes',
  'enterprise_graph_edges',
  'enterprise_context_chunks',
  'tenant_expected_baselines',
  'data_inventory_audit_log',
  'data_ingestion_runs',
] as const;

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
  const client = createClient(url.trim(), key.trim(), { auth: { persistSession: false, autoRefreshToken: false } });
  const report: Record<string, number> = {};
  for (const table of tables) {
    const { count, error } = await client.from(table).select('*', { count: 'exact', head: true }).eq('tenant_key', 'apex-retail');
    if (error) throw new Error(`${table} count failed: ${error.message}`);
    report[table] = count ?? 0;
  }
  const { data: segments, error: segmentError } = await client
    .from('data_inventory_segments')
    .select('family_number, segment_id, segment_name, record_count, coverage_score, health_state, stale_count, missing_count')
    .eq('tenant_key', 'apex-retail')
    .order('family_number');
  if (segmentError) throw new Error(`segments query failed: ${segmentError.message}`);
  console.log(JSON.stringify({ counts: report, segments }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
