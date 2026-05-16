// Unit tests for the tower-substrate read adapter (Slice 2).
//
//   - default plane stays Supabase;
//   - the Azure adapter is selectable explicitly / by env;
//   - client resolution + count rollups produce the stable report shape;
//   - a missing client yields a null entry, never a throw;
//   - an initiatives-query failure surfaces as an `{ error }` counts object.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { SessionRunner } from '../azureSession';
import {
  createAzureTowerSubstrateReadAdapter,
  createSupabaseTowerSubstrateReadAdapter,
  selectTowerSubstrateReadAdapter,
  type SubstrateTenantSpec,
} from '../towerSubstrateReadAdapter';

const TENANTS: SubstrateTenantSpec[] = [
  { key: 'apexretail', slugAliases: ['apexretail', 'apex-retail'] },
];

function fakeSession(
  handler: (sql: string, params: unknown[]) => unknown[],
): SessionRunner {
  return async (fn) =>
    fn(async <R>(sql: string, params: unknown[]) => handler(sql, params) as R[]);
}

describe('selectTowerSubstrateReadAdapter', () => {
  const original = process.env.ABARVA_DATA_PLANE;
  afterEach(() => {
    if (original === undefined) delete process.env.ABARVA_DATA_PLANE;
    else process.env.ABARVA_DATA_PLANE = original;
  });

  it('returns the Supabase adapter by default', () => {
    delete process.env.ABARVA_DATA_PLANE;
    expect(selectTowerSubstrateReadAdapter().name).toBe('supabase');
  });

  it('returns the Azure adapter when ABARVA_DATA_PLANE=azure-postgres', () => {
    process.env.ABARVA_DATA_PLANE = 'azure-postgres';
    expect(selectTowerSubstrateReadAdapter().name).toBe('azure-postgres');
  });
});

describe('azureTowerSubstrateReadAdapter', () => {
  it('resolves a client and rolls up initiative counts by stage/status', async () => {
    const session = fakeSession((sql) => {
      if (sql.includes('FROM clients')) {
        return [{
          id: 'c-1',
          name: 'Apex Retail',
          tenant_key: 'apex-retail',
          slug: 'apex-retail',
          industry_code: 'RETAIL',
        }];
      }
      if (sql.includes('FROM ai_initiatives')) {
        return [
          { initiative_id: 'i-1', stage: 'scope', status_flag: 'green' },
          { initiative_id: 'i-2', stage: 'scope', status_flag: 'amber' },
        ];
      }
      if (sql.includes('count(*)')) return [{ n: 3 }];
      return [];
    });
    const adapter = createAzureTowerSubstrateReadAdapter(session);
    const [report] = await adapter.getSubstrateReport(TENANTS);
    expect(report.client?.id).toBe('c-1');
    expect(report.client?.industryCode).toBe('RETAIL');
    const counts = report.counts as Record<string, unknown>;
    expect(counts.initiatives).toBe(2);
    expect(counts.vendors).toBe(3);
    expect(counts.byStage).toEqual({ scope: 2 });
    expect(counts.byStatus).toEqual({ green: 1, amber: 1 });
  });

  it('yields a null client entry when no client resolves', async () => {
    const adapter = createAzureTowerSubstrateReadAdapter(fakeSession(() => []));
    const [report] = await adapter.getSubstrateReport(TENANTS);
    expect(report.client).toBeNull();
    expect(report.counts).toBeNull();
  });

  it('surfaces an { error } counts object when the initiatives query fails', async () => {
    const session = fakeSession((sql) => {
      if (sql.includes('FROM clients')) {
        return [{ id: 'c-1', name: 'Apex Retail', tenant_key: 'apex-retail', slug: 'apex-retail', industry_code: 'RETAIL' }];
      }
      throw new Error('relation ai_initiatives does not exist');
    });
    const adapter = createAzureTowerSubstrateReadAdapter(session);
    const [report] = await adapter.getSubstrateReport(TENANTS);
    expect(report.client?.id).toBe('c-1');
    expect(report.counts).toEqual({ error: 'relation ai_initiatives does not exist' });
  });

  it('returns 0 counts when a tenant has no initiatives', async () => {
    const session = fakeSession((sql) => {
      if (sql.includes('FROM clients')) {
        return [{ id: 'c-1', name: 'Apex Retail', tenant_key: 'apex-retail', slug: 'apex-retail', industry_code: 'RETAIL' }];
      }
      return [];
    });
    const adapter = createAzureTowerSubstrateReadAdapter(session);
    const [report] = await adapter.getSubstrateReport(TENANTS);
    const counts = report.counts as Record<string, unknown>;
    expect(counts.initiatives).toBe(0);
    expect(counts.vendors).toBe(0);
  });
});

describe('supabaseTowerSubstrateReadAdapter', () => {
  /**
   * Minimal Supabase mock keyed by table name. The builder is both
   * chainable and awaitable, and `.limit()` is a terminal promise — covering
   * the clients lookup (`.select().eq().limit()`) and the count queries
   * (`.select(..,{head}).in()` awaited directly).
   */
  function mockClient(handlers: Record<string, () => unknown>): SupabaseClient {
    return {
      from(table: string) {
        const result = handlers[table]?.() ?? { data: [], count: 0, error: null };
        const builder: Record<string, unknown> = {};
        for (const m of ['select', 'eq', 'in', 'ilike']) builder[m] = () => builder;
        builder.limit = () => Promise.resolve(result);
        builder.then = (res: (v: unknown) => unknown) => Promise.resolve(result).then(res);
        return builder;
      },
    } as unknown as SupabaseClient;
  }

  it('reports a null client when the clients lookup is empty', async () => {
    const adapter = createSupabaseTowerSubstrateReadAdapter(() =>
      mockClient({ clients: () => ({ data: [], count: 0, error: null }) }),
    );
    const [report] = await adapter.getSubstrateReport(TENANTS);
    expect(report.client).toBeNull();
    expect(report.counts).toBeNull();
  });

  it('rolls up counts when the client resolves', async () => {
    const adapter = createSupabaseTowerSubstrateReadAdapter(() =>
      mockClient({
        clients: () => ({
          data: [{ id: 'c-1', name: 'Apex Retail', tenant_key: 'apex-retail', slug: 'apex-retail', industry_code: 'RETAIL' }],
          count: 1,
          error: null,
        }),
        ai_initiatives: () => ({
          data: [{ initiative_id: 'i-1', stage: 'scope', status_flag: 'green' }],
          count: 1,
          error: null,
        }),
      }),
    );
    const [report] = await adapter.getSubstrateReport(TENANTS);
    expect(report.client?.id).toBe('c-1');
    const counts = report.counts as Record<string, unknown>;
    expect(counts.initiatives).toBe(1);
    expect(counts.byStage).toEqual({ scope: 1 });
  });
});
