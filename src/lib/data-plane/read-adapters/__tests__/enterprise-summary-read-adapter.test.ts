// Unit tests for the enterprise-summary read adapter (Slice 6).
//
//   - default plane stays Supabase; Azure is selectable explicitly / by env;
//   - both planes read the four non-demo tenant tables and return the same
//     bundle shape;
//   - the Azure adapter applies the snapshot-date ordering + 30-row cap.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { SessionRunner } from '../azureSession';
import {
  createAzureEnterpriseSummaryReadAdapter,
  createSupabaseEnterpriseSummaryReadAdapter,
  selectEnterpriseSummaryReadAdapter,
} from '../enterpriseSummaryReadAdapter';

function fakeSession(
  handler: (sql: string, params: unknown[]) => unknown[],
): SessionRunner {
  return async (fn) =>
    fn(async <R>(sql: string, params: unknown[]) => handler(sql, params) as R[]);
}

describe('selectEnterpriseSummaryReadAdapter', () => {
  const original = process.env.ABARVA_DATA_PLANE;
  afterEach(() => {
    if (original === undefined) delete process.env.ABARVA_DATA_PLANE;
    else process.env.ABARVA_DATA_PLANE = original;
  });

  it('returns the Supabase adapter by default', () => {
    delete process.env.ABARVA_DATA_PLANE;
    expect(selectEnterpriseSummaryReadAdapter().name).toBe('supabase');
  });

  it('returns the Azure adapter when ABARVA_DATA_PLANE=azure-postgres', () => {
    process.env.ABARVA_DATA_PLANE = 'azure-postgres';
    expect(selectEnterpriseSummaryReadAdapter().name).toBe('azure-postgres');
  });
});

describe('azureEnterpriseSummaryReadAdapter', () => {
  it('reads the four tenant tables into one bundle', async () => {
    const adapter = createAzureEnterpriseSummaryReadAdapter(
      fakeSession((sql) => {
        if (sql.includes('FROM tech_stack_items')) return [{ category: 'llm', annual_spend_usd: 100, touches_ai: true }];
        if (sql.includes('FROM tech_projects')) return [{ status: 'in_flight', touches_ai: true, total_budget_usd: 10, spent_to_date_usd: 5 }];
        if (sql.includes('FROM staff_augmentation')) return [{ headcount_fte: 2, annual_spend_usd: 50, touches_ai: false }];
        if (sql.includes('FROM volumetrics_snapshots')) return [{ snapshot_date: '2026-01-01', api_calls_millions: 9 }];
        return [];
      }),
    );
    const bundle = await adapter.getEnterpriseSummaryBundle('c-1');
    expect(bundle.tech).toHaveLength(1);
    expect(bundle.projects[0].status).toBe('in_flight');
    expect(bundle.staffAug[0].headcount_fte).toBe(2);
    expect(bundle.volumetrics[0].api_calls_millions).toBe(9);
  });

  it('applies the snapshot-date ordering and 30-row cap to volumetrics', async () => {
    let volSql = '';
    const adapter = createAzureEnterpriseSummaryReadAdapter(
      fakeSession((sql) => {
        if (sql.includes('FROM volumetrics_snapshots')) volSql = sql;
        return [];
      }),
    );
    await adapter.getEnterpriseSummaryBundle('c-1');
    expect(volSql).toMatch(/ORDER BY snapshot_date ASC/);
    expect(volSql).toMatch(/LIMIT 30/);
  });
});

describe('supabaseEnterpriseSummaryReadAdapter', () => {
  /**
   * Minimal Supabase mock keyed by table name. The builder is chainable;
   * `.eq()` and `.limit()` are both terminal promises, covering the three
   * plain reads (`.select().eq().eq()`) and the volumetrics read
   * (`.select().eq().eq().order().limit()`).
   */
  function mockClient(handlers: Record<string, () => unknown>): SupabaseClient {
    return {
      from(table: string) {
        const result = handlers[table]?.() ?? { data: [], error: null };
        const builder: Record<string, unknown> = {};
        for (const m of ['select', 'order']) builder[m] = () => builder;
        builder.eq = () => builder;
        builder.limit = () => Promise.resolve(result);
        builder.then = (res: (v: unknown) => unknown) => Promise.resolve(result).then(res);
        return builder;
      },
    } as unknown as SupabaseClient;
  }

  it('reads the four tenant tables into one bundle', async () => {
    const adapter = createSupabaseEnterpriseSummaryReadAdapter(() =>
      mockClient({
        tech_stack_items: () => ({ data: [{ category: 'llm', annual_spend_usd: 100, touches_ai: true }], error: null }),
        tech_projects: () => ({ data: [{ status: 'in_flight', touches_ai: false, total_budget_usd: 1, spent_to_date_usd: 0 }], error: null }),
        staff_augmentation: () => ({ data: [], error: null }),
        volumetrics_snapshots: () => ({ data: [{ snapshot_date: '2026-01-01', api_calls_millions: 7 }], error: null }),
      }),
    );
    const bundle = await adapter.getEnterpriseSummaryBundle('c-1');
    expect(bundle.tech).toHaveLength(1);
    expect(bundle.projects).toHaveLength(1);
    expect(bundle.staffAug).toEqual([]);
    expect(bundle.volumetrics[0].api_calls_millions).toBe(7);
  });

  it('returns empty arrays when a read errors', async () => {
    const adapter = createSupabaseEnterpriseSummaryReadAdapter(() =>
      mockClient({
        tech_stack_items: () => ({ data: null, error: { message: 'boom' } }),
      }),
    );
    const bundle = await adapter.getEnterpriseSummaryBundle('c-1');
    expect(bundle.tech).toEqual([]);
  });
});
