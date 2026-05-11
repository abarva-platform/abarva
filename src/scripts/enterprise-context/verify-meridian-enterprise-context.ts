import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';
import path from 'node:path';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv({ path: '/Users/anand/Projects/nexus/.env.local' });
loadEnv();

const TENANT_KEY = 'meridian';

const TABLES = [
  'enterprise_context_sources',
  'enterprise_context_source_files',
  'enterprise_context_records',
  'enterprise_context_facts',
  'enterprise_context_relationships',
  'enterprise_context_evidence',
  'enterprise_context_quality_issues',
  'enterprise_context_stewardship_tasks',
  'enterprise_context_template_runs',
  'enterprise_context_chunk_queue',
] as const;

function getClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required to verify enterprise context.');
  }
  return createClient(url.trim(), key.trim(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function countRows(client: SupabaseClient, table: string): Promise<number> {
  const { count, error } = await client
    .from(table)
    .select('id', { count: 'exact', head: true })
    .eq('tenant_key', TENANT_KEY);
  if (error) throw new Error(`${table} count failed: ${error.message}`);
  return count ?? 0;
}

async function main() {
  const client = getClient();
  const counts: Record<string, number> = {};
  for (const table of TABLES) {
    counts[table] = await countRows(client, table);
  }

  const { data: recordTypes, error: recordTypeError } = await client
    .from('enterprise_context_records')
    .select('record_type')
    .eq('tenant_key', TENANT_KEY);
  if (recordTypeError) throw new Error(`record type verification failed: ${recordTypeError.message}`);

  const byRecordType: Record<string, number> = {};
  for (const row of recordTypes ?? []) {
    const key = String(row.record_type);
    byRecordType[key] = (byRecordType[key] ?? 0) + 1;
  }

  const { data: qualityRows, error: qualityError } = await client
    .from('enterprise_context_quality_issues')
    .select('issue_type,severity,status')
    .eq('tenant_key', TENANT_KEY);
  if (qualityError) throw new Error(`quality verification failed: ${qualityError.message}`);

  const qualitySummary: Record<string, number> = {};
  for (const row of qualityRows ?? []) {
    const key = `${row.severity}:${row.status}:${row.issue_type}`;
    qualitySummary[key] = (qualitySummary[key] ?? 0) + 1;
  }

  console.log(JSON.stringify({
    tenantKey: TENANT_KEY,
    counts,
    byRecordType,
    qualitySummary,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
