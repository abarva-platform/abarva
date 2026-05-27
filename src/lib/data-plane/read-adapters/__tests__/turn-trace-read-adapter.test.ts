// Unit tests for the turn-trace read adapter (Slice 2).
//
//   - default plane stays Supabase;
//   - the Azure adapter is selectable explicitly / by env;
//   - a hit returns the trace with the tenancy join column stripped;
//   - a cross-tenant or missing turn yields `not_found` (indistinguishable);
//   - a query failure yields `error`, never an unhandled throw.

import type { PostgresCompatClient as SupabaseClient } from '@/lib/supabase-server';
import type { SessionRunner } from '../azureSession';
import {
  createAzureTurnTraceReadAdapter,
  createSupabaseTurnTraceReadAdapter,
  selectTurnTraceReadAdapter,
} from '../turnTraceReadAdapter';

function fakeSession(
  handler: (sql: string, params: unknown[]) => unknown[],
): SessionRunner {
  return async (fn) =>
    fn(async <R>(sql: string, params: unknown[]) => handler(sql, params) as R[]);
}

/** A Supabase mock whose `.maybeSingle()` resolves to `result`. */
function fakeSupabase(result: { data: unknown; error: unknown }): {
  client: SupabaseClient;
  calls: { method: string; args: unknown[] }[];
} {
  const calls: { method: string; args: unknown[] }[] = [];
  const builder: Record<string, unknown> = {};
  for (const m of ['select', 'eq']) {
    builder[m] = (...args: unknown[]) => {
      calls.push({ method: m, args });
      return builder;
    };
  }
  builder.maybeSingle = () => Promise.resolve(result);
  return { client: { from: () => builder } as unknown as SupabaseClient, calls };
}

describe('selectTurnTraceReadAdapter', () => {
  const original = process.env.ABARVA_DATA_PLANE;
  afterEach(() => {
    if (original === undefined) delete process.env.ABARVA_DATA_PLANE;
    else process.env.ABARVA_DATA_PLANE = original;
  });

  it('returns the Supabase adapter by default', () => {
    delete process.env.ABARVA_DATA_PLANE;
    expect(selectTurnTraceReadAdapter().name).toBe('supabase');
  });

  it('returns the Azure adapter when ABARVA_DATA_PLANE=azure-postgres', () => {
    process.env.ABARVA_DATA_PLANE = 'azure-postgres';
    expect(selectTurnTraceReadAdapter().name).toBe('azure-postgres');
  });
});

describe('supabaseTurnTraceReadAdapter', () => {
  it('returns the trace with the join column stripped on a hit', async () => {
    const { client, calls } = fakeSupabase({
      data: {
        turn_id: 't-1',
        engagement_id: 'e-1',
        model: 'claude',
        input_tokens: 10,
        output_tokens: 20,
        latency_ms: 5,
        steps: [],
        created_at: '2026-05-01T00:00:00Z',
        engagements: { client_id: 'c-1' },
      },
      error: null,
    });
    const adapter = createSupabaseTurnTraceReadAdapter(() => client);
    const result = await adapter.getTurnTrace('t-1', 'c-1');
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') {
      expect(result.trace.turn_id).toBe('t-1');
      expect('engagements' in result.trace).toBe(false);
    }
    // Tenancy predicate was applied.
    expect(
      calls.some((c) => c.method === 'eq' && c.args[0] === 'engagements.client_id'),
    ).toBe(true);
  });

  it('returns not_found for a missing or cross-tenant turn', async () => {
    const { client } = fakeSupabase({ data: null, error: null });
    const adapter = createSupabaseTurnTraceReadAdapter(() => client);
    expect((await adapter.getTurnTrace('t-x', 'c-1')).kind).toBe('not_found');
  });

  it('returns an error result when the query fails', async () => {
    const { client } = fakeSupabase({ data: null, error: { message: 'boom' } });
    const adapter = createSupabaseTurnTraceReadAdapter(() => client);
    const result = await adapter.getTurnTrace('t-1', 'c-1');
    expect(result).toEqual({ kind: 'error', message: 'boom' });
  });
});

describe('azureTurnTraceReadAdapter', () => {
  it('returns the trace when the tenancy-scoped join matches', async () => {
    let seenParams: unknown[] = [];
    const session = fakeSession((sql, params) => {
      seenParams = params;
      expect(sql).toContain('JOIN engagements e ON e.id = t.engagement_id');
      expect(sql).toContain('e.client_id = $2');
      return [{
        turn_id: 't-1',
        engagement_id: 'e-1',
        model: 'claude',
        input_tokens: 10,
        output_tokens: 20,
        latency_ms: 5,
        steps: [],
        created_at: '2026-05-01T00:00:00Z',
      }];
    });
    const adapter = createAzureTurnTraceReadAdapter(session);
    const result = await adapter.getTurnTrace('t-1', 'c-1');
    expect(result.kind).toBe('ok');
    if (result.kind === 'ok') expect(result.trace.turn_id).toBe('t-1');
    expect(seenParams).toEqual(['t-1', 'c-1']);
  });

  it('returns not_found when no row matches the tenant', async () => {
    const adapter = createAzureTurnTraceReadAdapter(fakeSession(() => []));
    expect((await adapter.getTurnTrace('t-x', 'c-1')).kind).toBe('not_found');
  });

  it('returns an error result (never throws) when the query fails', async () => {
    const session: SessionRunner = async () => {
      throw new Error('connection refused');
    };
    const adapter = createAzureTurnTraceReadAdapter(session);
    const result = await adapter.getTurnTrace('t-1', 'c-1');
    expect(result).toEqual({ kind: 'error', message: 'connection refused' });
  });
});
