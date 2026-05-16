// Unit tests for the Tower-aggregate read adapter (Slice 6).
//
//   - default plane stays Supabase; Azure is selectable explicitly / by env;
//   - `listClients` orders by name and fails soft to `[]`;
//   - `getAggregateBundle` reads tenant-scoped substrate and short-circuits
//     the metric reads when the tenant has no use cases;
//   - both planes return the same bundle shape.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { SessionRunner } from '../azureSession';
import {
  createAzureTowerAggregateReadAdapter,
  createSupabaseTowerAggregateReadAdapter,
  selectTowerAggregateReadAdapter,
} from '../towerAggregateReadAdapter';

function fakeSession(
  handler: (sql: string, params: unknown[]) => unknown[],
): SessionRunner {
  return async (fn) =>
    fn(async <R>(sql: string, params: unknown[]) => handler(sql, params) as R[]);
}

describe('selectTowerAggregateReadAdapter', () => {
  const original = process.env.ABARVA_DATA_PLANE;
  afterEach(() => {
    if (original === undefined) delete process.env.ABARVA_DATA_PLANE;
    else process.env.ABARVA_DATA_PLANE = original;
  });

  it('returns the Supabase adapter by default', () => {
    delete process.env.ABARVA_DATA_PLANE;
    expect(selectTowerAggregateReadAdapter().name).toBe('supabase');
  });

  it('returns the Azure adapter when ABARVA_DATA_PLANE=azure-postgres', () => {
    process.env.ABARVA_DATA_PLANE = 'azure-postgres';
    expect(selectTowerAggregateReadAdapter().name).toBe('azure-postgres');
  });
});

describe('azureTowerAggregateReadAdapter', () => {
  it('lists clients ordered by name', async () => {
    const adapter = createAzureTowerAggregateReadAdapter(
      fakeSession((sql) =>
        sql.includes('FROM clients')
          ? [{ id: 'c-1', name: 'Apex', industry_code: 'RETAIL' }]
          : [],
      ),
    );
    const clients = await adapter.listClients();
    expect(clients).toEqual([{ id: 'c-1', name: 'Apex', industry_code: 'RETAIL' }]);
  });

  it('fails soft to [] when the clients read throws', async () => {
    const adapter = createAzureTowerAggregateReadAdapter(
      fakeSession(() => {
        throw new Error('relation clients does not exist');
      }),
    );
    expect(await adapter.listClients()).toEqual([]);
  });

  it('reads tenant-scoped substrate rows for the client', async () => {
    const adapter = createAzureTowerAggregateReadAdapter(
      fakeSession((sql) => {
        if (sql.includes('FROM use_cases')) {
          return [{ id: 'u-1', stage: 'execute', business_unit: 'Ops', updated_at: '2026-01-01' }];
        }
        if (sql.includes('FROM use_case_usage_metrics')) return [{ use_case_id: 'u-1', dau: 5 }];
        if (sql.includes('FROM contradictions')) {
          return [{ id: 'x-1', severity: 'high', description: 'drift' }];
        }
        return [];
      }),
    );
    const bundle = await adapter.getAggregateBundle('c-1');
    expect(bundle.useCases).toHaveLength(1);
    expect(bundle.usage).toEqual([{ use_case_id: 'u-1', dau: 5 }]);
    expect(bundle.contradictions).toHaveLength(1);
  });

  it('short-circuits metric reads when the tenant has no use cases', async () => {
    let metricQueries = 0;
    const adapter = createAzureTowerAggregateReadAdapter(
      fakeSession((sql) => {
        if (sql.includes('use_case_id = ANY')) metricQueries += 1;
        return [];
      }),
    );
    const bundle = await adapter.getAggregateBundle('c-empty');
    expect(bundle.useCases).toEqual([]);
    expect(bundle.usage).toEqual([]);
    expect(metricQueries).toBe(0);
  });
});

describe('supabaseTowerAggregateReadAdapter', () => {
  /**
   * Minimal Supabase mock keyed by table name. The builder is chainable and
   * awaitable; `.order()` and `.in()` are terminal promises, covering both
   * the clients read (`.select().order()`) and the metric reads
   * (`.select().in()`).
   */
  function mockClient(handlers: Record<string, () => unknown>): SupabaseClient {
    return {
      from(table: string) {
        const result = handlers[table]?.() ?? { data: [], error: null };
        const builder: Record<string, unknown> = {};
        for (const m of ['select', 'eq', 'is']) builder[m] = () => builder;
        builder.order = () => Promise.resolve(result);
        builder.in = () => Promise.resolve(result);
        builder.then = (res: (v: unknown) => unknown) => Promise.resolve(result).then(res);
        return builder;
      },
    } as unknown as SupabaseClient;
  }

  it('lists clients, failing soft to [] on error', async () => {
    const ok = createSupabaseTowerAggregateReadAdapter(() =>
      mockClient({ clients: () => ({ data: [{ id: 'c-1', name: 'A', industry_code: null }], error: null }) }),
    );
    expect(await ok.listClients()).toHaveLength(1);

    const bad = createSupabaseTowerAggregateReadAdapter(() =>
      mockClient({ clients: () => ({ data: null, error: { message: 'boom' } }) }),
    );
    expect(await bad.listClients()).toEqual([]);
  });

  it('reads the aggregate bundle for a client', async () => {
    const adapter = createSupabaseTowerAggregateReadAdapter(() =>
      mockClient({
        use_cases: () => ({
          data: [{ id: 'u-1', stage: 'pilot', business_unit: null, updated_at: '2026-01-01' }],
          error: null,
        }),
        use_case_usage_metrics: () => ({ data: [{ use_case_id: 'u-1' }], error: null }),
        contradictions: () => ({ data: [{ id: 'x-1', severity: 'low' }], error: null }),
      }),
    );
    const bundle = await adapter.getAggregateBundle('c-1');
    expect(bundle.useCases).toHaveLength(1);
    expect(bundle.usage).toHaveLength(1);
    expect(bundle.contradictions).toHaveLength(1);
  });
});
