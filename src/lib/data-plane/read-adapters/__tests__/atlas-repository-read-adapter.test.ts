// Unit tests for the Atlas-repository read adapter (Slice 9).
//
//   - default plane stays Supabase; Azure is selectable explicitly / by env;
//   - every read returns the byte-identical raw row projection the pre-seam
//     `atlas/repository.ts` consumed;
//   - the Azure `signal_catalog` LEFT JOIN is re-nested into the same embed
//     shape the Supabase PostgREST query returns;
//   - `getMaxTurnIndex` returns `null` when a thread has no traces.

import type { PostgresCompatClient as SupabaseClient } from '@/lib/supabase-server';
import type { SessionRunner } from '../azureSession';
import {
  createAzureAtlasRepositoryReadAdapter,
  createSupabaseAtlasRepositoryReadAdapter,
  selectAtlasRepositoryReadAdapter,
} from '../atlasRepositoryReadAdapter';

function fakeSession(
  handler: (sql: string, params: unknown[]) => unknown[],
): SessionRunner {
  return async (fn) =>
    fn(async <R>(sql: string, params: unknown[]) => handler(sql, params) as R[]);
}

/**
 * Minimal Supabase mock keyed by table name. The builder is chainable; the
 * terminal calls (`maybeSingle`, `order`, `limit`, `in`, `then`) all resolve
 * to the table's scripted result.
 */
function mockClient(handlers: Record<string, () => unknown>): SupabaseClient {
  return {
    from(table: string) {
      const result = handlers[table]?.() ?? { data: null, error: null };
      const builder: Record<string, unknown> = {};
      for (const m of ['select', 'eq', 'in', 'is', 'order']) builder[m] = () => builder;
      builder.limit = () => builder;
      builder.maybeSingle = () => Promise.resolve(result);
      builder.single = () => Promise.resolve(result);
      builder.then = (res: (v: unknown) => unknown) => Promise.resolve(result).then(res);
      return builder;
    },
  } as unknown as SupabaseClient;
}

describe('selectAtlasRepositoryReadAdapter', () => {
  const original = process.env.ABARVA_DATA_PLANE;
  afterEach(() => {
    if (original === undefined) delete process.env.ABARVA_DATA_PLANE;
    else process.env.ABARVA_DATA_PLANE = original;
  });

  it('returns the Supabase adapter by default', () => {
    delete process.env.ABARVA_DATA_PLANE;
    expect(selectAtlasRepositoryReadAdapter().name).toBe('supabase');
  });

  it('returns the Azure adapter when ABARVA_DATA_PLANE=azure-postgres', () => {
    process.env.ABARVA_DATA_PLANE = 'azure-postgres';
    expect(selectAtlasRepositoryReadAdapter().name).toBe('azure-postgres');
  });
});

describe('supabaseAtlasRepositoryReadAdapter', () => {
  it('resolves a client name and falls back to null when absent', async () => {
    const present = createSupabaseAtlasRepositoryReadAdapter(() =>
      mockClient({ clients: () => ({ data: { name: 'Apex Retail' }, error: null }) }),
    );
    expect(await present.getClientName('c-1')).toEqual({ name: 'Apex Retail' });

    const absent = createSupabaseAtlasRepositoryReadAdapter(() =>
      mockClient({ clients: () => ({ data: null, error: null }) }),
    );
    expect(await absent.getClientName('c-x')).toBeNull();
  });

  it('lists signal firings and observations', async () => {
    const adapter = createSupabaseAtlasRepositoryReadAdapter(() =>
      mockClient({
        signal_firings: () => ({ data: [{ id: 's-1', headline: 'Shadow AI' }], error: null }),
        atlas_observations: () => ({ data: [{ id: 'o-1', summary: 'drift' }], error: null }),
      }),
    );
    expect(await adapter.listSignalFirings('c-1', 5)).toHaveLength(1);
    expect(await adapter.listObservations('c-1', 6)).toHaveLength(1);
  });

  it('reads the max turn index, returning null for an empty thread', async () => {
    const withTraces = createSupabaseAtlasRepositoryReadAdapter(() =>
      mockClient({ atlas_message_traces: () => ({ data: { turn_index: 4 }, error: null }) }),
    );
    expect(await withTraces.getMaxTurnIndex('t-1')).toBe(4);

    const empty = createSupabaseAtlasRepositoryReadAdapter(() =>
      mockClient({ atlas_message_traces: () => ({ data: null, error: null }) }),
    );
    expect(await empty.getMaxTurnIndex('t-empty')).toBeNull();
  });

  it('finds an existing thread id scoped to the client', async () => {
    const adapter = createSupabaseAtlasRepositoryReadAdapter(() =>
      mockClient({ atlas_threads: () => ({ data: { id: 't-1' }, error: null }) }),
    );
    expect(await adapter.findThreadId('t-1', 'c-1')).toEqual({ id: 't-1' });
  });
});

describe('azureAtlasRepositoryReadAdapter', () => {
  it('re-nests the signal_catalog join into the embed shape', async () => {
    const adapter = createAzureAtlasRepositoryReadAdapter(
      fakeSession((sql) => {
        if (sql.includes('FROM signal_firings')) {
          return [
            {
              id: 's-1',
              headline: 'Shadow AI',
              severity: 'critical',
              state: 'new',
              impact_usd: 1000,
              fired_at: null,
              evidence_summary_jsonb: {},
              cohort_context_jsonb: {},
              sc_key: 'shadow_ai_detected',
              sc_title: 'Shadow AI detected',
              sc_pillar: 'cost',
            },
          ];
        }
        return [];
      }),
    );
    const rows = await adapter.listSignalFirings('c-1', 5);
    expect(rows[0].signal_catalog).toEqual({
      key: 'shadow_ai_detected',
      title: 'Shadow AI detected',
      pillar: 'cost',
    });
  });

  it('returns a null signal_catalog when the join misses', async () => {
    const adapter = createAzureAtlasRepositoryReadAdapter(
      fakeSession(() => [
        {
          id: 's-2',
          headline: 'x',
          severity: 'info',
          state: 'new',
          impact_usd: null,
          fired_at: null,
          evidence_summary_jsonb: {},
          cohort_context_jsonb: {},
          sc_key: null,
          sc_title: null,
          sc_pillar: null,
        },
      ]),
    );
    const rows = await adapter.listSignalFirings('c-1', 5);
    expect(rows[0].signal_catalog).toBeNull();
  });

  it('reads the max turn index, returning null when empty', async () => {
    const withTraces = createAzureAtlasRepositoryReadAdapter(
      fakeSession(() => [{ turn_index: 7 }]),
    );
    expect(await withTraces.getMaxTurnIndex('t-1')).toBe(7);

    const empty = createAzureAtlasRepositoryReadAdapter(fakeSession(() => []));
    expect(await empty.getMaxTurnIndex('t-empty')).toBeNull();
  });

  it('reads engagements and use cases for a client', async () => {
    const adapter = createAzureAtlasRepositoryReadAdapter(
      fakeSession((sql) => {
        if (sql.includes('FROM engagements')) return [{ id: 'e-1', name: 'CDP' }];
        if (sql.includes('FROM use_cases')) return [{ id: 'u-1', name: 'Forecast' }];
        return [];
      }),
    );
    expect(await adapter.listEngagements('c-1', 6)).toHaveLength(1);
    expect(await adapter.listUseCases('c-1', 8)).toHaveLength(1);
  });
});
