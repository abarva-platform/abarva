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

async function fetchTenantRows<T extends Record<string, unknown>>(
  client: SupabaseClient,
  table: string,
  columns: string,
): Promise<T[]> {
  const rows: T[] = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await client
      .from(table)
      .select(columns)
      .eq('tenant_key', TENANT_KEY)
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`${table} page fetch failed: ${error.message}`);
    const page = (data ?? []) as unknown as T[];
    rows.push(...page);
    if (page.length < pageSize) break;
  }
  return rows;
}

async function main() {
  const client = getClient();
  const counts: Record<string, number> = {};
  for (const table of TABLES) {
    counts[table] = await countRows(client, table);
  }

  const recordTypes = await fetchTenantRows<{ record_type: string }>(
    client,
    'enterprise_context_records',
    'record_type',
  );
  const byRecordType: Record<string, number> = {};
  for (const row of recordTypes) {
    const key = String(row.record_type);
    byRecordType[key] = (byRecordType[key] ?? 0) + 1;
  }

  const qualityRows = await fetchTenantRows<{ issue_type: string; severity: string; status: string }>(
    client,
    'enterprise_context_quality_issues',
    'issue_type,severity,status',
  );
  const qualitySummary: Record<string, number> = {};
  for (const row of qualityRows) {
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
