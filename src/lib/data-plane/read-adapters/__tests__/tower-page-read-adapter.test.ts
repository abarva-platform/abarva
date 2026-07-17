// Unit tests for the Tower-page read adapter (Slice 9).
//
//   - default plane stays Supabase; Azure is selectable explicitly / by env;
//   - `countClientInitiatives` / `countByInitiatives` fail soft to 0;
//   - `countByInitiatives` allowlists the table and short-circuits an empty
//     id set;
//   - the policy-derived `allowedIds` filter is spliced into the read when
//     present, omitted when `null` — the access-policy DECISION stays in the
//     page, the adapter only executes the read it is told to.

import type { PostgresCompatClient as SupabaseClient } from '@/lib/supabase-server';
import type { SessionRunner } from '../azureSession';
import {
  createAzureTowerPageReadAdapter,
  createSupabaseTowerPageReadAdapter,
  selectTowerPageReadAdapter,
} from '../towerPageReadAdapter';

function fakeSession(
  handler: (sql: string, params: unknown[]) => unknown[],
): SessionRunner {
  return async (fn) =>
    fn(async <R>(sql: string, params: unknown[]) => handler(sql, params) as R[]);
}

/**
 * Supabase mock recording the `.in('id', ...)` call so a test can assert the
 * policy-derived id filter was (or was not) applied. Each builder method
 * returns the builder; terminal `then` resolves the table result.
 */
function mockClient(
  handlers: Record<string, () => unknown>,
  spy?: { inIdCalls: unknown[][] },
): SupabaseClient {
  return {
    from(table: string) {
      const result = handlers[table]?.() ?? { data: [], error: null, count: 0 };
      const builder: Record<string, unknown> = {};
      for (const m of ['select', 'eq', 'is', 'order', 'limit']) builder[m] = () => builder;
      builder.in = (col: string, vals: unknown[]) => {
        if (spy && col === 'id') spy.inIdCalls.push(vals);
        return builder;
      };
      builder.then = (res: (v: unknown) => unknown) => Promise.resolve(result).then(res);
      return builder;
    },
  } as unknown as SupabaseClient;
}

describe('selectTowerPageReadAdapter', () => {
  const original = process.env.ABARVA_DATA_PLANE;
  afterEach(() => {
    if (original === undefined) delete process.env.ABARVA_DATA_PLANE;
    else process.env.ABARVA_DATA_PLANE = original;
  });

  it('returns the Supabase adapter by default', () => {
    delete process.env.ABARVA_DATA_PLANE;
    expect(selectTowerPageReadAdapter().name).toBe('supabase');
  });

  it('returns the Azure adapter when ABARVA_DATA_PLANE=azure-postgres', () => {
    process.env.ABARVA_DATA_PLANE = 'azure-postgres';
    expect(selectTowerPageReadAdapter().name).toBe('azure-postgres');
  });
});

describe('supabaseTowerPageReadAdapter', () => {
  it('counts client initiatives, failing soft to 0 on error', async () => {
    const ok = createSupabaseTowerPageReadAdapter(() =>
      mockClient({ ai_initiatives: () => ({ count: 3, error: null }) }),
    );
    expect(await ok.countClientInitiatives('c-1')).toBe(3);

    const bad = createSupabaseTowerPageReadAdapter(() =>
      mockClient({ ai_initiatives: () => ({ count: null, error: { message: 'x' } }) }),
    );
    expect(await bad.countClientInitiatives('c-1')).toBe(0);
  });

  it('short-circuits and allowlists countByInitiatives', async () => {
    const adapter = createSupabaseTowerPageReadAdapter(() =>
      mockClient({ ai_initiative_kpis: () => ({ count: 9, error: null }) }),
    );
    expect(await adapter.countByInitiatives('ai_initiative_kpis', [])).toBe(0);
    expect(await adapter.countByInitiatives('ai_initiative_kpis', ['i-1'])).toBe(9);
    // not in the allowlist -> 0, never queried
    expect(await adapter.countByInitiatives('engagements', ['i-1'])).toBe(0);
  });

  it('applies the allowedIds filter only when the policy supplies one', async () => {
    const withFilter = { inIdCalls: [] as unknown[][] };
    const a = createSupabaseTowerPageReadAdapter(() =>
      mockClient({ engagements: () => ({ data: [], error: null }) }, withFilter),
    );
    await a.listHandoffPrograms('c-1', ['p-1', 'p-2']);
    expect(withFilter.inIdCalls).toEqual([['p-1', 'p-2']]);

    const noFilter = { inIdCalls: [] as unknown[][] };
    const b = createSupabaseTowerPageReadAdapter(() =>
      mockClient({ engagements: () => ({ data: [], error: null }) }, noFilter),
    );
    await b.listHandoffPrograms('c-1', null);
    expect(noFilter.inIdCalls).toEqual([]);
  });

  it('throws on a handoff read error so the page can fail soft itself', async () => {
    const adapter = createSupabaseTowerPageReadAdapter(() =>
      mockClient({ source_events: () => ({ data: null, error: { message: 'rls' } }) }),
    );
    await expect(adapter.listHandoffSourceEvents('apexretail', null)).rejects.toThrow();
  });
});

describe('azureTowerPageReadAdapter', () => {
  it('counts client initiatives, failing soft to 0', async () => {
    const ok = createAzureTowerPageReadAdapter(fakeSession(() => [{ n: 5 }]));
    expect(await ok.countClientInitiatives('c-1')).toBe(5);

    const bad = createAzureTowerPageReadAdapter(
      fakeSession(() => {
        throw new Error('no relation');
      }),
    );
    expect(await bad.countClientInitiatives('c-1')).toBe(0);
  });

  it('splices the allowedIds predicate into the SQL when present', async () => {
    let lastSql = '';
    const adapter = createAzureTowerPageReadAdapter(
      fakeSession((sql) => {
        lastSql = sql;
        return [];
      }),
    );
    await adapter.listHandoffPrograms('c-1', ['p-1']);
    expect(lastSql).toContain('id = ANY');

    await adapter.listHandoffPrograms('c-1', null);
    expect(lastSql).not.toContain('id = ANY');
  });

  it('reads Tower handoff programs as completed P5 rows, not impossible P6 rows', async () => {
    let lastSql = '';
    const adapter = createAzureTowerPageReadAdapter(
      fakeSession((sql) => {
        lastSql = sql;
        return [];
      }),
    );
    await adapter.listHandoffPrograms('c-1', null);
    expect(lastSql).toContain('current_phase = 5');
    expect(lastSql).toContain("lifecycle_state = 'completed'");
    expect(lastSql).not.toContain('current_phase = 6');
  });

  it('reads transitioned source events for a client key', async () => {
    const adapter = createAzureTowerPageReadAdapter(
      fakeSession((sql) =>
        sql.includes('FROM source_events') ? [{ id: 'se-1', event_code: 'SRC-1' }] : [],
      ),
    );
    const rows = await adapter.listHandoffSourceEvents('apexretail', null);
    expect(rows).toHaveLength(1);
  });
});
