// Unit tests for the Home attention read adapter (Slice 5).
//
//   - default plane stays Supabase; Azure selectable explicitly / by env;
//   - the Supabase adapter reads contradictions / engagements / turns and
//     applies the optional `clientId` scope;
//   - both planes are fail-soft: a query error yields `[]`, never a throw;
//   - the Azure adapter runs the equivalent SQL and rebuilds the `client`
//     embed from the `LEFT JOIN` projection.

import type { PostgresCompatClient as SupabaseClient } from '@/lib/supabase-server';
import type { SessionRunner } from '../azureSession';
import {
  createAzureHomeAttentionReadAdapter,
  createSupabaseHomeAttentionReadAdapter,
  selectHomeAttentionReadAdapter,
} from '../homeAttentionReadAdapter';

function fakeSession(
  handler: (sql: string, params: unknown[]) => unknown[],
): SessionRunner {
  return async (fn) =>
    fn(async <R>(sql: string, params: unknown[]) => handler(sql, params) as R[]);
}

function throwingSession(): SessionRunner {
  return async () => {
    throw new Error('azure boom');
  };
}

/**
 * A Supabase mock. Every chained method returns the builder; the builder is
 * thenable so an `await` resolves to the configured `{ data, error }`. `eq`
 * calls are recorded so the `clientId` scope can be asserted.
 */
function fakeSupabase(result: { data: unknown; error: unknown }): {
  client: SupabaseClient;
  calls: { method: string; args: unknown[] }[];
} {
  const calls: { method: string; args: unknown[] }[] = [];
  const builder: Record<string, unknown> = {};
  for (const m of ['select', 'is', 'order', 'limit', 'in']) {
    builder[m] = (...args: unknown[]) => {
      calls.push({ method: m, args });
      return builder;
    };
  }
  builder.eq = (...args: unknown[]) => {
    calls.push({ method: 'eq', args });
    return builder;
  };
  builder.then = (resolve: (v: unknown) => unknown) => resolve(result);
  return {
    client: { from: () => builder } as unknown as SupabaseClient,
    calls,
  };
}

describe('selectHomeAttentionReadAdapter', () => {
  const original = process.env.ABARVA_DATA_PLANE;
  afterEach(() => {
    if (original === undefined) delete process.env.ABARVA_DATA_PLANE;
    else process.env.ABARVA_DATA_PLANE = original;
  });

  it('returns the Supabase adapter by default', () => {
    delete process.env.ABARVA_DATA_PLANE;
    expect(selectHomeAttentionReadAdapter().name).toBe('supabase');
  });

  it('returns the Azure adapter when ABARVA_DATA_PLANE=azure-postgres', () => {
    process.env.ABARVA_DATA_PLANE = 'azure-postgres';
    expect(selectHomeAttentionReadAdapter().name).toBe('azure-postgres');
  });

  it('honors an explicit plane argument over the env var', () => {
    process.env.ABARVA_DATA_PLANE = 'azure-postgres';
    expect(selectHomeAttentionReadAdapter('supabase').name).toBe('supabase');
  });
});

describe('supabaseHomeAttentionReadAdapter', () => {
  it('reads open contradictions and applies the clientId scope', async () => {
    const { client, calls } = fakeSupabase({
      data: [{ id: 'x-1', severity: 'high' }],
      error: null,
    });
    const adapter = createSupabaseHomeAttentionReadAdapter(() => client);
    const rows = await adapter.getOpenContradictions(6, 'c-1');

    expect(rows).toHaveLength(1);
    expect(calls.some((c) => c.method === 'eq' && c.args[0] === 'client_id' && c.args[1] === 'c-1')).toBe(true);
  });

  it('omits the clientId filter when no clientId is given', async () => {
    const { client, calls } = fakeSupabase({ data: [], error: null });
    const adapter = createSupabaseHomeAttentionReadAdapter(() => client);
    await adapter.getActiveEngagements(null);
    expect(calls.some((c) => c.method === 'eq' && c.args[0] === 'client_id')).toBe(false);
  });

  it('short-circuits getRecentTurns to [] for an empty id list', async () => {
    const { client, calls } = fakeSupabase({ data: null, error: null });
    const adapter = createSupabaseHomeAttentionReadAdapter(() => client);
    expect(await adapter.getRecentTurns([])).toEqual([]);
    expect(calls).toHaveLength(0);
  });

  it('is fail-soft: a thrown client factory yields []', async () => {
    const adapter = createSupabaseHomeAttentionReadAdapter(() => {
      throw new Error('no supabase');
    });
    expect(await adapter.getOpenContradictions(6)).toEqual([]);
    expect(await adapter.getActiveEngagements()).toEqual([]);
    expect(await adapter.getRecentTurns(['e-1'])).toEqual([]);
  });
});

describe('azureHomeAttentionReadAdapter', () => {
  it('LEFT JOINs clients and rebuilds the client embed', async () => {
    const seen: { sql: string; params: unknown[] }[] = [];
    const session = fakeSession((sql, params) => {
      seen.push({ sql, params });
      return [
        {
          id: 'x-1',
          client_id: 'c-1',
          contradiction_type: 'goal_conflict',
          severity: 'high',
          description: 'd',
          detected_at: '2026-05-01',
          triggered_engagement_id: null,
          c_id: 'c-1',
          c_name: 'Apex Retail',
        },
      ];
    });
    const adapter = createAzureHomeAttentionReadAdapter(session);
    const rows = await adapter.getOpenContradictions(6, 'c-1');

    expect(rows[0].client).toEqual({ id: 'c-1', name: 'Apex Retail' });
    expect(seen[0].sql).toContain('LEFT JOIN clients');
    expect(seen[0].sql).toContain('resolved_at IS NULL');
    expect(seen[0].params).toEqual([6, 'c-1']);
  });

  it('runs `= ANY` SQL for recent turns', async () => {
    const seen: { sql: string; params: unknown[] }[] = [];
    const session = fakeSession((sql, params) => {
      seen.push({ sql, params });
      return [];
    });
    const adapter = createAzureHomeAttentionReadAdapter(session);
    await adapter.getRecentTurns(['e-1', 'e-2']);

    expect(seen[0].sql).toContain('FROM turns');
    expect(seen[0].sql).toContain('= ANY($1::text[])');
    expect(seen[0].params).toEqual([['e-1', 'e-2'], 60]);
  });

  it('is fail-soft: a query error yields [] rather than throwing', async () => {
    const adapter = createAzureHomeAttentionReadAdapter(throwingSession());
    expect(await adapter.getOpenContradictions(6)).toEqual([]);
    expect(await adapter.getActiveEngagements()).toEqual([]);
    expect(await adapter.getRecentTurns(['e-1'])).toEqual([]);
  });
});
