// Unit tests for the Intelligence stages read adapter (Slice 5).
//
//   - default plane stays Supabase; Azure selectable explicitly / by env;
//   - the Supabase adapter runs `.in('initiative_id', ids)` reads and the
//     KPI read adds `.not('peer_median', 'is', null)`;
//   - an empty id list short-circuits to `[]` with no query;
//   - both planes are fail-soft: a query error yields `[]`, never a throw;
//   - the Azure adapter runs the equivalent `= ANY($1::text[])` SQL.

import type { PostgresCompatClient as SupabaseClient } from '@/lib/supabase-server';
import type { SessionRunner } from '../azureSession';
import {
  createAzureIntelligenceStagesReadAdapter,
  createSupabaseIntelligenceStagesReadAdapter,
  selectIntelligenceStagesReadAdapter,
} from '../intelligenceStagesReadAdapter';

function fakeSession(
  handler: (sql: string, params: unknown[]) => unknown[],
): SessionRunner {
  return async (fn) =>
    fn(async <R>(sql: string, params: unknown[]) => handler(sql, params) as R[]);
}

/** A throwing session — exercises the adapter's fail-soft `[]` fallback. */
function throwingSession(): SessionRunner {
  return async () => {
    throw new Error('azure boom');
  };
}

/**
 * A Supabase mock. The terminal call in each chain (`.in(...)` for decisions/
 * vendors, `.not(...)` for KPIs) resolves to the configured `{ data, error }`.
 */
function fakeSupabase(result: { data: unknown; error: unknown }): {
  client: SupabaseClient;
  calls: { method: string; args: unknown[] }[];
} {
  const calls: { method: string; args: unknown[] }[] = [];
  const builder: Record<string, unknown> = {};
  builder.select = (...args: unknown[]) => {
    calls.push({ method: 'select', args });
    return builder;
  };
  builder.in = (...args: unknown[]) => {
    calls.push({ method: 'in', args });
    return builder;
  };
  builder.not = (...args: unknown[]) => {
    calls.push({ method: 'not', args });
    return Promise.resolve(result);
  };
  // For decisions/vendors the chain ends at `.in(...)`. Make `.in` also
  // thenable so an `await` on it resolves to `result`.
  builder.then = (resolve: (v: unknown) => unknown) => resolve(result);
  return {
    client: { from: () => builder } as unknown as SupabaseClient,
    calls,
  };
}

describe('selectIntelligenceStagesReadAdapter', () => {
  const original = process.env.ABARVA_DATA_PLANE;
  afterEach(() => {
    if (original === undefined) delete process.env.ABARVA_DATA_PLANE;
    else process.env.ABARVA_DATA_PLANE = original;
  });

  it('returns the Supabase adapter by default', () => {
    delete process.env.ABARVA_DATA_PLANE;
    expect(selectIntelligenceStagesReadAdapter().name).toBe('supabase');
  });

  it('returns the Azure adapter when ABARVA_DATA_PLANE=azure-postgres', () => {
    process.env.ABARVA_DATA_PLANE = 'azure-postgres';
    expect(selectIntelligenceStagesReadAdapter().name).toBe('azure-postgres');
  });

  it('honors an explicit plane argument over the env var', () => {
    process.env.ABARVA_DATA_PLANE = 'azure-postgres';
    expect(selectIntelligenceStagesReadAdapter('supabase').name).toBe('supabase');
  });
});

describe('supabaseIntelligenceStagesReadAdapter', () => {
  it('reads decisions filtered by initiative_id', async () => {
    const { client, calls } = fakeSupabase({
      data: [{ initiative_id: 'i-1', decision_status: 'pending' }],
      error: null,
    });
    const adapter = createSupabaseIntelligenceStagesReadAdapter(() => client);
    const rows = await adapter.getDecisionRowsForInitiatives(['i-1']);

    expect(rows).toEqual([{ initiative_id: 'i-1', decision_status: 'pending' }]);
    expect(calls.some((c) => c.method === 'in' && c.args[0] === 'initiative_id')).toBe(true);
  });

  it('reads the KPI projection with the peer_median NOT NULL filter', async () => {
    const { client, calls } = fakeSupabase({
      data: [{ initiative_id: 'i-1', kpi_name: 'NPS', peer_median: 30 }],
      error: null,
    });
    const adapter = createSupabaseIntelligenceStagesReadAdapter(() => client);
    const rows = await adapter.getKpiRowsForInitiatives(['i-1']);

    expect(rows).toHaveLength(1);
    expect(
      calls.some((c) => c.method === 'not' && c.args[0] === 'peer_median' && c.args[1] === 'is'),
    ).toBe(true);
  });

  it('short-circuits to [] for an empty id list without querying', async () => {
    const { client, calls } = fakeSupabase({ data: null, error: null });
    const adapter = createSupabaseIntelligenceStagesReadAdapter(() => client);
    expect(await adapter.getVendorRowsForInitiatives([])).toEqual([]);
    expect(calls).toHaveLength(0);
  });

  it('returns [] when the query yields null data', async () => {
    const { client } = fakeSupabase({ data: null, error: null });
    const adapter = createSupabaseIntelligenceStagesReadAdapter(() => client);
    expect(await adapter.getDecisionRowsForInitiatives(['i-1'])).toEqual([]);
  });
});

describe('azureIntelligenceStagesReadAdapter', () => {
  it('runs `= ANY` SQL for decisions / vendors / kpis', async () => {
    const seen: { sql: string; params: unknown[] }[] = [];
    const session = fakeSession((sql, params) => {
      seen.push({ sql, params });
      return [];
    });
    const adapter = createAzureIntelligenceStagesReadAdapter(session);
    await adapter.getDecisionRowsForInitiatives(['i-1']);
    await adapter.getVendorRowsForInitiatives(['i-1']);
    await adapter.getKpiRowsForInitiatives(['i-1']);

    expect(seen[0].sql).toContain('FROM ai_initiative_decisions');
    expect(seen[0].sql).toContain('= ANY($1::text[])');
    expect(seen[1].sql).toContain('FROM ai_initiative_vendors');
    expect(seen[2].sql).toContain('FROM ai_initiative_kpis');
    expect(seen[2].sql).toContain('peer_median IS NOT NULL');
    expect(seen[2].params).toEqual([['i-1']]);
  });

  it('short-circuits to [] for an empty id list', async () => {
    const adapter = createAzureIntelligenceStagesReadAdapter(throwingSession());
    expect(await adapter.getKpiRowsForInitiatives([])).toEqual([]);
  });

  it('is fail-soft: a query error yields [] rather than throwing', async () => {
    const adapter = createAzureIntelligenceStagesReadAdapter(throwingSession());
    expect(await adapter.getDecisionRowsForInitiatives(['i-1'])).toEqual([]);
    expect(await adapter.getVendorRowsForInitiatives(['i-1'])).toEqual([]);
    expect(await adapter.getKpiRowsForInitiatives(['i-1'])).toEqual([]);
  });
});
