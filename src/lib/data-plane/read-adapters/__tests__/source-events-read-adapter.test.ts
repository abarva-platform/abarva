// Unit tests for the Source events read adapter (Slice 8).
//
//   - default plane stays Supabase; Azure selectable explicitly / by env;
//   - the Supabase adapter runs the `source_events` reads filtered by
//     `client_key` with the pre-seam lifecycle predicates / ordering;
//   - a Supabase error logs and degrades to [] / null (pre-seam behavior);
//   - the Azure adapter runs the equivalent SQL with the same predicates.

import type { PostgresCompatClient as SupabaseClient } from '@/lib/supabase-server';
import type { SessionRunner } from '../azureSession';
import {
  createAzureSourceEventsReadAdapter,
  createSupabaseSourceEventsReadAdapter,
  selectSourceEventsReadAdapter,
  type SourceEventDbRow,
} from '../sourceEventsReadAdapter';

function fakeSession(
  handler: (sql: string, params: unknown[]) => unknown[],
): SessionRunner {
  return async (fn) =>
    fn(async <R>(sql: string, params: unknown[]) => handler(sql, params) as R[]);
}

/**
 * A Supabase mock whose `.from('source_events')` chain records every call
 * and resolves the terminal builder to the configured `{ data, error }`.
 * `.maybeSingle()` and `.limit()` and `.order()` (when terminal) all resolve.
 */
function fakeSupabase(result: { data: unknown; error: unknown }): {
  client: SupabaseClient;
  calls: { method: string; args: unknown[] }[];
} {
  const calls: { method: string; args: unknown[] }[] = [];
  // `builder` is both chainable AND awaitable (a thenable), so terminal
  // `.order(...)` (pending / active reads) and chained `.order(...).limit(1)`
  // (by-code read) both work off one object.
  const builder: Record<string, unknown> = {
    then: (resolve: (v: unknown) => unknown) => resolve(result),
  };
  const chain = (method: string) => (...args: unknown[]) => {
    calls.push({ method, args });
    return builder;
  };
  builder.select = chain('select');
  builder.eq = chain('eq');
  builder.ilike = chain('ilike');
  builder.neq = chain('neq');
  builder.order = chain('order');
  builder.limit = chain('limit');
  builder.maybeSingle = (...args: unknown[]) => {
    calls.push({ method: 'maybeSingle', args });
    return Promise.resolve(result);
  };
  return { client: { from: () => builder } as unknown as SupabaseClient, calls };
}

const ROW: SourceEventDbRow = {
  id: 'evt-1',
  client_key: 'apexretail',
  event_code: 'SRC-APX-101',
  event_name: 'Contact Center Sourcing',
  event_type: 'managed_service',
  current_stage_key: 'strategy',
  lifecycle_state: 'waiting_on_client',
  linked_program_id: null,
  estimated_value_usd: 500000,
  trigger_description: 'Renewal due',
  scope_description: null,
  decision_owner: 'CIO',
  created_by_user_id: null,
  created_at: '2026-05-01T00:00:00Z',
  updated_at: '2026-05-02T00:00:00Z',
};

describe('selectSourceEventsReadAdapter', () => {
  const original = process.env.ABARVA_DATA_PLANE;
  afterEach(() => {
    if (original === undefined) delete process.env.ABARVA_DATA_PLANE;
    else process.env.ABARVA_DATA_PLANE = original;
  });

  it('returns the Supabase adapter by default', () => {
    delete process.env.ABARVA_DATA_PLANE;
    expect(selectSourceEventsReadAdapter().name).toBe('supabase');
  });

  it('returns the Azure adapter when ABARVA_DATA_PLANE=azure-postgres', () => {
    process.env.ABARVA_DATA_PLANE = 'azure-postgres';
    expect(selectSourceEventsReadAdapter().name).toBe('azure-postgres');
  });

  it('honors an explicit plane argument over the env var', () => {
    process.env.ABARVA_DATA_PLANE = 'azure-postgres';
    expect(selectSourceEventsReadAdapter('supabase').name).toBe('supabase');
  });
});

describe('supabaseSourceEventsReadAdapter', () => {
  it('reads pending events filtered by client_key + waiting_on_client', async () => {
    const { client, calls } = fakeSupabase({ data: [ROW], error: null });
    const adapter = createSupabaseSourceEventsReadAdapter(() => client);
    const rows = await adapter.getPendingEventsForClient('apexretail');

    expect(rows).toEqual([ROW]);
    expect(
      calls.some((c) => c.method === 'eq' && c.args[0] === 'client_key'
        && c.args[1] === 'apexretail'),
    ).toBe(true);
    expect(
      calls.some((c) => c.method === 'eq' && c.args[0] === 'lifecycle_state'
        && c.args[1] === 'waiting_on_client'),
    ).toBe(true);
  });

  it('reads active events excluding archived', async () => {
    const { client, calls } = fakeSupabase({ data: [ROW], error: null });
    const adapter = createSupabaseSourceEventsReadAdapter(() => client);
    const rows = await adapter.getActiveEventsForClient('apexretail');

    expect(rows).toEqual([ROW]);
    expect(
      calls.some((c) => c.method === 'neq' && c.args[0] === 'lifecycle_state'
        && c.args[1] === 'archived'),
    ).toBe(true);
  });

  it('resolves a single event by id, returning null when absent', async () => {
    const hit = createSupabaseSourceEventsReadAdapter(
      () => fakeSupabase({ data: ROW, error: null }).client,
    );
    expect(await hit.getEventByIdForClient('evt-1', 'apexretail')).toEqual(ROW);

    const miss = createSupabaseSourceEventsReadAdapter(
      () => fakeSupabase({ data: null, error: null }).client,
    );
    expect(await miss.getEventByIdForClient('evt-x', 'apexretail')).toBeNull();
  });

  it('resolves a single event by code, taking the first row', async () => {
    const { client, calls } = fakeSupabase({ data: [ROW], error: null });
    const adapter = createSupabaseSourceEventsReadAdapter(() => client);
    expect(await adapter.getEventByCodeForClient('SRC-APX-101', 'apexretail')).toEqual(ROW);
    expect(
      calls.some((c) => c.method === 'ilike' && c.args[0] === 'event_code'
        && c.args[1] === 'SRC-APX-101'),
    ).toBe(true);
  });

  it('logs and degrades to [] / null on a query error', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const adapter = createSupabaseSourceEventsReadAdapter(
      () => fakeSupabase({ data: null, error: { message: 'boom' } }).client,
    );
    expect(await adapter.getPendingEventsForClient('apexretail')).toEqual([]);
    expect(await adapter.getActiveEventsForClient('apexretail')).toEqual([]);
    expect(await adapter.getEventByIdForClient('evt-1', 'apexretail')).toBeNull();
    expect(await adapter.getEventByCodeForClient('SRC-APX-101', 'apexretail')).toBeNull();
    spy.mockRestore();
  });
});

describe('azureSourceEventsReadAdapter', () => {
  it('runs client-scoped SQL for pending events', async () => {
    const seen: { sql: string; params: unknown[] }[] = [];
    const adapter = createAzureSourceEventsReadAdapter(
      fakeSession((sql, params) => {
        seen.push({ sql, params });
        return [ROW];
      }),
    );
    const rows = await adapter.getPendingEventsForClient('apexretail');

    expect(rows).toEqual([ROW]);
    expect(seen[0].sql).toContain('FROM source_events');
    expect(seen[0].sql).toContain("lifecycle_state = 'waiting_on_client'");
    expect(seen[0].params).toEqual(['apexretail']);
  });

  it('runs <> archived SQL for active events', async () => {
    const seen: { sql: string; params: unknown[] }[] = [];
    const adapter = createAzureSourceEventsReadAdapter(
      fakeSession((sql, params) => {
        seen.push({ sql, params });
        return [];
      }),
    );
    expect(await adapter.getActiveEventsForClient('apexretail')).toEqual([]);
    expect(seen[0].sql).toContain("lifecycle_state <> 'archived'");
  });

  it('resolves by id and by code, returning null when absent', async () => {
    const idAdapter = createAzureSourceEventsReadAdapter(fakeSession(() => [ROW]));
    expect(await idAdapter.getEventByIdForClient('evt-1', 'apexretail')).toEqual(ROW);

    const codeMiss = createAzureSourceEventsReadAdapter(fakeSession(() => []));
    expect(await codeMiss.getEventByCodeForClient('SRC-X', 'apexretail')).toBeNull();
  });

  it('uses case-insensitive event_code lookup for shared event links', async () => {
    const seen: { sql: string; params: unknown[] }[] = [];
    const adapter = createAzureSourceEventsReadAdapter(
      fakeSession((sql, params) => {
        seen.push({ sql, params });
        return [ROW];
      }),
    );

    expect(await adapter.getEventByCodeForClient('src-apx-101', 'apexretail')).toEqual(ROW);
    expect(seen[0].sql).toContain('lower(event_code) = lower($1)');
    expect(seen[0].params).toEqual(['src-apx-101', 'apexretail']);
  });

  it('logs and degrades when the session throws', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const throwing: SessionRunner = async () => {
      throw new Error('connection refused');
    };
    const adapter = createAzureSourceEventsReadAdapter(throwing);
    expect(await adapter.getPendingEventsForClient('apexretail')).toEqual([]);
    expect(await adapter.getEventByIdForClient('evt-1', 'apexretail')).toBeNull();
    spy.mockRestore();
  });
});
