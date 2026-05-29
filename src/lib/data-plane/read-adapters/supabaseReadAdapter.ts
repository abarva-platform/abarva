// Supabase-backed parallel-run read adapter.
//
// This is the DEFAULT adapter — it preserves the exact behavior that
// `/api/admin/parallel-run-invariants` had before the data-plane seam was
// introduced. The query logic was lifted verbatim from that route so the
// response shape and edge-case handling (errors -> zeros, never throw) are
// unchanged.

import {
  getAzureReadFluentClient,
  type PostgresCompatClient as SupabaseClient,
} from '@/lib/data-plane/postgresCompat';
import { canonicalTenantKey } from '@/lib/tenant-keys';
import {
  TENANT_COUNT_TABLES,
  emptyTenantInvariants,
  type ParallelRunReadAdapter,
  type TenantCountKey,
  type TenantInvariants,
} from './types';

/**
 * Factory for the Supabase client. Injectable so tests can pass a mock
 * (cast to `SupabaseClient`) without a live database.
 */
export type SupabaseFactory = () => SupabaseClient;

async function countWhereTenant(
  sb: SupabaseClient,
  table: string,
  tenantKey: string,
): Promise<number> {
  try {
    const { count, error } = await sb
      .from(table)
      .select('*', { count: 'exact', head: true })
      .eq('tenant_key', tenantKey);
    if (error) return 0;
    return typeof count === 'number' ? count : 0;
  } catch {
    return 0;
  }
}

async function countEngagementsForClient(
  sb: SupabaseClient,
  clientId: string,
): Promise<number> {
  try {
    const { count, error } = await sb
      .from('engagements')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .is('archived_at', null)
      .is('deleted_at', null);
    if (error) return 0;
    return typeof count === 'number' ? count : 0;
  } catch {
    return 0;
  }
}

async function topColumn(
  sb: SupabaseClient,
  table: string,
  clientId: string,
  column: string,
  limit = 3,
): Promise<string[]> {
  try {
    const { data, error } = await sb
      .from(table)
      .select(`id, ${column}`)
      .eq('client_id', clientId)
      .order('id', { ascending: true })
      .limit(limit);
    if (error || !data) return [];
    return (data as unknown as Array<Record<string, unknown>>)
      .map((row) => {
        const v = row[column];
        return typeof v === 'string' ? v : '';
      })
      .filter((v) => v.length > 0);
  } catch {
    return [];
  }
}

async function clientLookup(
  sb: SupabaseClient,
  tenantKey: string,
): Promise<{ id: string; name: string } | null> {
  try {
    const { data, error } = await sb
      .from('clients')
      .select('id, name, tenant_key')
      .eq('tenant_key', tenantKey)
      .maybeSingle();
    if (error || !data) return null;
    const row = data as { id: string; name: string | null };
    return { id: row.id, name: row.name ?? tenantKey };
  } catch {
    return null;
  }
}

async function gatherTenant(
  sb: SupabaseClient,
  rawKey: string,
): Promise<TenantInvariants> {
  const tenantKey = canonicalTenantKey(rawKey) ?? rawKey;
  const base = emptyTenantInvariants(tenantKey);
  const client = await clientLookup(sb, tenantKey);

  const countKeys = Object.keys(TENANT_COUNT_TABLES) as TenantCountKey[];
  const counts = await Promise.all(
    countKeys.map((k) => countWhereTenant(sb, TENANT_COUNT_TABLES[k], tenantKey)),
  );
  const countByKey = Object.fromEntries(
    countKeys.map((k, i) => [k, counts[i]]),
  ) as Record<TenantCountKey, number>;

  const [programs, topKpiNames, topPatternIds] = await Promise.all([
    client ? countEngagementsForClient(sb, client.id) : Promise.resolve(0),
    client ? topColumn(sb, 'kpis', client.id, 'name') : Promise.resolve([]),
    client ? topColumn(sb, 'pattern_packs', client.id, 'id') : Promise.resolve([]),
  ]);

  return {
    ...base,
    clientId: client?.id ?? null,
    clientName: client?.name ?? null,
    nodes: countByKey.nodes,
    edges: countByKey.edges,
    contextChunks: countByKey.contextChunks,
    segments: countByKey.segments,
    sourceEvents: countByKey.sourceEvents,
    programs,
    topKpiNames,
    topPatternIds,
  };
}

/**
 * Build a Supabase read adapter. The Supabase client factory is injectable
 * so tests can supply a mock without a live database.
 */
export function createSupabaseReadAdapter(
  getClient: SupabaseFactory = getAzureReadFluentClient,
): ParallelRunReadAdapter {
  return {
    name: 'supabase',
    async getTenantInvariants(tenantKeys) {
      const sb = getClient();
      return Promise.all(tenantKeys.map((key) => gatherTenant(sb, key)));
    },
  };
}

/** Default singleton — wired to the real server Supabase client. */
export const supabaseReadAdapter: ParallelRunReadAdapter = createSupabaseReadAdapter();
