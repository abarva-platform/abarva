// Unit tests for the data-plane read-adapter seam (Slice 1).
//
// Pins the contract that matters for the Azure parallel-run cutover:
//   - default adapter selection stays Supabase (production unchanged);
//   - the Azure Postgres adapter is selectable explicitly / by env;
//   - tenant keys are canonicalized on the way in (alias -> canonical);
//   - the route payload shape is stable;
//   - a missing optional table yields zeros, never a thrown 500.

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  buildInvariantPayload,
  resolveDataPlane,
  selectReadAdapter,
} from '../index';
import { createAzurePostgresReadAdapter, type SessionRunner } from '../azurePostgresReadAdapter';
import { createSupabaseReadAdapter } from '../supabaseReadAdapter';
import { emptyTenantInvariants, type TenantInvariants } from '../types';

describe('resolveDataPlane', () => {
  it('defaults to supabase when unset', () => {
    expect(resolveDataPlane(undefined)).toBe('supabase');
    expect(resolveDataPlane(null)).toBe('supabase');
    expect(resolveDataPlane('')).toBe('supabase');
  });

  it('falls back to supabase for an unrecognized value', () => {
    expect(resolveDataPlane('mysql')).toBe('supabase');
    expect(resolveDataPlane('azure')).toBe('supabase');
  });

  it('selects azure-postgres explicitly, case-insensitively', () => {
    expect(resolveDataPlane('azure-postgres')).toBe('azure-postgres');
    expect(resolveDataPlane('  AZURE-POSTGRES  ')).toBe('azure-postgres');
  });
});

describe('selectReadAdapter', () => {
  const original = process.env.ABARVA_DATA_PLANE;
  afterEach(() => {
    if (original === undefined) delete process.env.ABARVA_DATA_PLANE;
    else process.env.ABARVA_DATA_PLANE = original;
  });

  it('returns the Supabase adapter by default (no env set)', () => {
    delete process.env.ABARVA_DATA_PLANE;
    expect(selectReadAdapter().name).toBe('supabase');
  });

  it('returns the Azure adapter when ABARVA_DATA_PLANE=azure-postgres', () => {
    process.env.ABARVA_DATA_PLANE = 'azure-postgres';
    expect(selectReadAdapter().name).toBe('azure-postgres');
  });

  it('honors an explicit plane argument over the env var', () => {
    process.env.ABARVA_DATA_PLANE = 'azure-postgres';
    expect(selectReadAdapter('supabase').name).toBe('supabase');
  });
});

describe('buildInvariantPayload', () => {
  it('produces the stable route response shape with summed totals', () => {
    const tenants: TenantInvariants[] = [
      { ...emptyTenantInvariants('apex-retail'), nodes: 10, edges: 20, contextChunks: 5, programs: 2 },
      { ...emptyTenantInvariants('meridian-health'), nodes: 7, edges: 3, contextChunks: 1, programs: 4 },
    ];
    const payload = buildInvariantPayload(tenants, 'test-backend');
    expect(payload.schemaVersion).toBe(1);
    expect(payload.backendMarker).toBe('test-backend');
    expect(payload.tenants).toHaveLength(2);
    expect(payload.totals).toEqual({
      nodes: 17,
      edges: 23,
      contextChunks: 6,
      programs: 6,
    });
    expect(typeof payload.generatedAt).toBe('string');
  });
});

// --- Azure Postgres adapter -------------------------------------------------

/** Builds an injectable session whose runner is driven by `handler`. */
function fakeSession(
  handler: (sql: string, params: unknown[]) => unknown[],
): SessionRunner {
  return async (fn) =>
    fn(async <R>(sql: string, params: unknown[]) => handler(sql, params) as R[]);
}

describe('azurePostgresReadAdapter', () => {
  it('canonicalizes historical tenant aliases before querying', async () => {
    const seenTenantKeys: string[] = [];
    const session = fakeSession((sql, params) => {
      if (sql.includes('FROM clients')) {
        seenTenantKeys.push(String(params[0]));
        return [{ id: 'client-1', name: 'Alias Co' }];
      }
      return [{ n: 0 }];
    });
    const adapter = createAzurePostgresReadAdapter(session);
    const result = await adapter.getTenantInvariants([
      'apexretail',
      'meridian',
      'arcturus',
    ]);
    // Returned tenantKey is canonical.
    expect(result.map((r) => r.tenantKey)).toEqual([
      'apex-retail',
      'meridian-health',
      'first-capital',
    ]);
    // The clients lookup was issued with canonical keys, not the aliases.
    expect(seenTenantKeys).toEqual(['apex-retail', 'meridian-health', 'first-capital']);
  });

  it('maps counts, programs, KPIs and patterns from query rows', async () => {
    const session = fakeSession((sql) => {
      if (sql.includes('FROM clients')) return [{ id: 'c-1', name: 'Apex Retail' }];
      if (sql.includes('FROM enterprise_graph_nodes')) return [{ n: 1313 }];
      if (sql.includes('FROM enterprise_graph_edges')) return [{ n: 1568 }];
      if (sql.includes('FROM enterprise_context_chunks')) return [{ n: 2075 }];
      if (sql.includes('FROM data_inventory_segments')) return [{ n: 14 }];
      if (sql.includes('FROM source_events')) return [{ n: 20 }];
      if (sql.includes('FROM engagements')) return [{ n: 4 }];
      if (sql.includes('FROM kpis')) return [{ name: 'Revenue' }, { name: 'Margin' }];
      if (sql.includes('FROM pattern_packs')) return [{ id: 'P-001' }, { id: 'P-002' }];
      return [];
    });
    const adapter = createAzurePostgresReadAdapter(session);
    const [apex] = await adapter.getTenantInvariants(['apex-retail']);
    expect(apex).toMatchObject({
      tenantKey: 'apex-retail',
      clientId: 'c-1',
      clientName: 'Apex Retail',
      nodes: 1313,
      edges: 1568,
      contextChunks: 2075,
      segments: 14,
      sourceEvents: 20,
      programs: 4,
      topKpiNames: ['Revenue', 'Margin'],
      topPatternIds: ['P-001', 'P-002'],
    });
  });

  it('returns zeros (never throws) when a table query fails', async () => {
    const session = fakeSession((sql) => {
      if (sql.includes('FROM clients')) return [{ id: 'c-1', name: 'Apex Retail' }];
      // Every count/list query throws — simulates a missing table.
      throw new Error('relation does not exist');
    });
    const adapter = createAzurePostgresReadAdapter(session);
    const [apex] = await adapter.getTenantInvariants(['apex-retail']);
    expect(apex.nodes).toBe(0);
    expect(apex.edges).toBe(0);
    expect(apex.contextChunks).toBe(0);
    expect(apex.segments).toBe(0);
    expect(apex.sourceEvents).toBe(0);
    expect(apex.programs).toBe(0);
    expect(apex.topKpiNames).toEqual([]);
    expect(apex.topPatternIds).toEqual([]);
    // Client identity still resolved — only the data queries failed.
    expect(apex.clientId).toBe('c-1');
  });

  it('yields an all-zero record when the tenant has no client row', async () => {
    const session = fakeSession((sql) => {
      if (sql.includes('FROM clients')) return [];
      return [{ n: 99 }];
    });
    const adapter = createAzurePostgresReadAdapter(session);
    const [unknownTenant] = await adapter.getTenantInvariants(['ghost-tenant']);
    expect(unknownTenant.clientId).toBeNull();
    expect(unknownTenant.programs).toBe(0);
    expect(unknownTenant.topKpiNames).toEqual([]);
  });
});

// --- Supabase adapter -------------------------------------------------------

/** A Supabase client mock where every query resolves to an error. */
function erroringSupabase(): SupabaseClient {
  const result = { count: null, data: null, error: { message: 'boom' } };
  const builder: Record<string, unknown> = {};
  for (const method of ['select', 'eq', 'is', 'order']) {
    builder[method] = () => builder;
  }
  builder.limit = () => Promise.resolve(result);
  builder.maybeSingle = () => Promise.resolve(result);
  // The builder itself is awaitable (used by the count queries).
  builder.then = (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) =>
    Promise.resolve(result).then(res, rej);
  return { from: () => builder } as unknown as SupabaseClient;
}

describe('supabaseReadAdapter', () => {
  it('returns zeros (never throws) when every Supabase query errors', async () => {
    const adapter = createSupabaseReadAdapter(() => erroringSupabase());
    const result = await adapter.getTenantInvariants(['apex-retail']);
    expect(result).toHaveLength(1);
    const [apex] = result;
    expect(apex.tenantKey).toBe('apex-retail');
    expect(apex.clientId).toBeNull();
    expect(apex.nodes).toBe(0);
    expect(apex.edges).toBe(0);
    expect(apex.contextChunks).toBe(0);
    expect(apex.segments).toBe(0);
    expect(apex.sourceEvents).toBe(0);
    expect(apex.programs).toBe(0);
    expect(apex.topKpiNames).toEqual([]);
    expect(apex.topPatternIds).toEqual([]);
  });

  it('canonicalizes the returned tenantKey even on the error path', async () => {
    const adapter = createSupabaseReadAdapter(() => erroringSupabase());
    const [aliased] = await adapter.getTenantInvariants(['arcturus']);
    expect(aliased.tenantKey).toBe('first-capital');
  });

  it('exposes the data-plane name as "supabase"', () => {
    expect(createSupabaseReadAdapter(() => erroringSupabase()).name).toBe('supabase');
  });
});
