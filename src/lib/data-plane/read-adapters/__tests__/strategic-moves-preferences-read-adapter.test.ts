// Unit tests for the Strategic Moves preferences read adapter (Slice 7).
//
//   - default plane stays Supabase; Azure selectable explicitly / by env;
//   - the Supabase adapter reads `default_filters` from `tower_user_preferences`
//     scoped by `(person_id, client_id)` via `.maybeSingle()`;
//   - a missing row yields `null` (not a throw) on both planes;
//   - the Azure adapter runs the equivalent `LIMIT 1` SQL read.

import type { PostgresCompatClient as SupabaseClient } from '@/lib/supabase-server';
import type { SessionRunner } from '../azureSession';
import {
  createAzureStrategicMovesPreferencesReadAdapter,
  createSupabaseStrategicMovesPreferencesReadAdapter,
  selectStrategicMovesPreferencesReadAdapter,
} from '../strategicMovesPreferencesReadAdapter';

function fakeSession(
  handler: (sql: string, params: unknown[]) => unknown[],
): SessionRunner {
  return async (fn) =>
    fn(async <R>(sql: string, params: unknown[]) => handler(sql, params) as R[]);
}

/** A Supabase mock whose `tower_user_preferences` chain ends in `.maybeSingle()`. */
function fakeSupabase(result: { data: unknown }): {
  client: SupabaseClient;
  calls: { method: string; args: unknown[] }[];
} {
  const calls: { method: string; args: unknown[] }[] = [];
  const builder: Record<string, unknown> = {};
  for (const method of ['select', 'eq']) {
    builder[method] = (...args: unknown[]) => {
      calls.push({ method, args });
      return builder;
    };
  }
  builder.maybeSingle = (...args: unknown[]) => {
    calls.push({ method: 'maybeSingle', args });
    return Promise.resolve(result);
  };
  const client = { from: () => builder } as unknown as SupabaseClient;
  return { client, calls };
}

describe('selectStrategicMovesPreferencesReadAdapter', () => {
  const original = process.env.ABARVA_DATA_PLANE;
  afterEach(() => {
    if (original === undefined) delete process.env.ABARVA_DATA_PLANE;
    else process.env.ABARVA_DATA_PLANE = original;
  });

  it('returns the Supabase adapter by default (no env set)', () => {
    delete process.env.ABARVA_DATA_PLANE;
    expect(selectStrategicMovesPreferencesReadAdapter().name).toBe('supabase');
  });

  it('returns the Azure adapter when ABARVA_DATA_PLANE=azure-postgres', () => {
    process.env.ABARVA_DATA_PLANE = 'azure-postgres';
    expect(selectStrategicMovesPreferencesReadAdapter().name).toBe('azure-postgres');
  });

  it('honors an explicit plane argument over the env var', () => {
    process.env.ABARVA_DATA_PLANE = 'azure-postgres';
    expect(selectStrategicMovesPreferencesReadAdapter('supabase').name).toBe('supabase');
  });

  it('routes governed foundation tenants to Azure when the env is unset', () => {
    delete process.env.ABARVA_DATA_PLANE;
    expect(
      selectStrategicMovesPreferencesReadAdapter(undefined, 'airline-demo-new')
        .name,
    ).toBe('azure-postgres');
    expect(
      selectStrategicMovesPreferencesReadAdapter(undefined, 'meridian').name,
    ).toBe('azure-postgres');
    expect(
      selectStrategicMovesPreferencesReadAdapter(undefined, 'meridian-health')
        .name,
    ).toBe('azure-postgres');
  });

  it('fails closed when a governed foundation tenant is forced to Supabase', () => {
    expect(() =>
      selectStrategicMovesPreferencesReadAdapter('supabase', 'airline-demo-new'),
    ).toThrow(/airline-demo-new.*Azure PostgreSQL/i);
    expect(() =>
      selectStrategicMovesPreferencesReadAdapter('supabase', 'meridian'),
    ).toThrow(/meridian-health.*Azure PostgreSQL/i);
  });
});

describe('supabaseStrategicMovesPreferencesReadAdapter', () => {
  it('reads default_filters scoped by person_id + client_id', async () => {
    const filters = { strategic_moves: { listView: 'kanban', sort: 'phase' } };
    const { client, calls } = fakeSupabase({ data: { default_filters: filters } });
    const adapter = createSupabaseStrategicMovesPreferencesReadAdapter(() => client);
    const result = await adapter.getDefaultFilters('person-1', 'client-1');
    expect(result).toEqual(filters);
    expect(calls.some((c) => c.method === 'eq' && c.args[0] === 'person_id')).toBe(true);
    expect(calls.some((c) => c.method === 'eq' && c.args[0] === 'client_id')).toBe(true);
    expect(calls.some((c) => c.method === 'maybeSingle')).toBe(true);
  });

  it('returns null when no preference row exists', async () => {
    const { client } = fakeSupabase({ data: null });
    const adapter = createSupabaseStrategicMovesPreferencesReadAdapter(() => client);
    expect(await adapter.getDefaultFilters('person-1', 'client-1')).toBeNull();
  });

  it('returns null when the row has no default_filters value', async () => {
    const { client } = fakeSupabase({ data: { default_filters: null } });
    const adapter = createSupabaseStrategicMovesPreferencesReadAdapter(() => client);
    expect(await adapter.getDefaultFilters('person-1', 'client-1')).toBeNull();
  });
});

describe('azureStrategicMovesPreferencesReadAdapter', () => {
  it('reads default_filters with person_id + client_id predicates', async () => {
    const filters = { strategic_moves: { listView: 'scatter', sort: 'name' } };
    let seenSql = '';
    let seenParams: unknown[] = [];
    const session = fakeSession((sql, params) => {
      seenSql = sql;
      seenParams = params;
      return [{ default_filters: filters }];
    });
    const adapter = createAzureStrategicMovesPreferencesReadAdapter(session);
    const result = await adapter.getDefaultFilters('person-1', 'client-1');
    expect(result).toEqual(filters);
    expect(seenSql).toContain('person_id = $1');
    expect(seenSql).toContain('client_id = $2');
    expect(seenSql).toContain('LIMIT 1');
    expect(seenParams).toEqual(['person-1', 'client-1']);
  });

  it('returns null when the query yields no rows', async () => {
    const adapter = createAzureStrategicMovesPreferencesReadAdapter(fakeSession(() => []));
    expect(await adapter.getDefaultFilters('person-1', 'client-1')).toBeNull();
  });
});
