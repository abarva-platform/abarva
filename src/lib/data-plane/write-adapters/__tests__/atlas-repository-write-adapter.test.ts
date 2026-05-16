// Unit tests for the Atlas-repository write adapter (Slice 9).
//
//   - default plane stays Supabase (production write unchanged);
//   - the Azure adapter is selectable explicitly / by env;
//   - thread / trace / observation inserts produce byte-faithful rows;
//   - a write error is surfaced as `ok:false` with the message, never a throw;
//   - the Azure path runs each write inside one transaction.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { TxSessionRunner } from '../../read-adapters/azureSession';
import {
  createAzureAtlasRepositoryWriteAdapter,
  createSupabaseAtlasRepositoryWriteAdapter,
  selectAtlasRepositoryWriteAdapter,
} from '../atlasRepositoryWriteAdapter';

// --- Supabase mock ----------------------------------------------------------

interface Recorded {
  table: string;
  op: 'insert' | 'update';
  row: Record<string, unknown>;
}

function fakeSupabase(
  errorFor: (table: string) => { message: string } | null = () => null,
  idFor: () => string = () => 'row-1',
): { client: SupabaseClient; calls: Recorded[] } {
  const calls: Recorded[] = [];
  const client = {
    from(table: string) {
      return {
        insert(row: Record<string, unknown>) {
          calls.push({ table, op: 'insert', row });
          const err = errorFor(table);
          return {
            select() {
              return {
                single: () =>
                  Promise.resolve(err ? { data: null, error: err } : { data: { id: idFor() }, error: null }),
              };
            },
            then: (res: (v: unknown) => unknown) => Promise.resolve({ error: err }).then(res),
          };
        },
        update(row: Record<string, unknown>) {
          return {
            eq() {
              calls.push({ table, op: 'update', row });
              return Promise.resolve({ error: errorFor(table) });
            },
          };
        },
      };
    },
  } as unknown as SupabaseClient;
  return { client, calls };
}

// --- Azure tx-session mock --------------------------------------------------

function fakeTxSession(
  handler: (sql: string, params: unknown[]) => unknown[],
): { session: TxSessionRunner; transactions: number } {
  const state = { transactions: 0 };
  const session: TxSessionRunner = async (fn) => {
    state.transactions += 1;
    return fn(async <R>(sql: string, params: unknown[]) => handler(sql, params) as R[]);
  };
  return { session, get transactions() { return state.transactions; } };
}

describe('selectAtlasRepositoryWriteAdapter', () => {
  const original = process.env.ABARVA_DATA_PLANE;
  afterEach(() => {
    if (original === undefined) delete process.env.ABARVA_DATA_PLANE;
    else process.env.ABARVA_DATA_PLANE = original;
  });

  it('returns the Supabase adapter by default', () => {
    delete process.env.ABARVA_DATA_PLANE;
    expect(selectAtlasRepositoryWriteAdapter().name).toBe('supabase');
  });

  it('returns the Azure adapter when ABARVA_DATA_PLANE=azure-postgres', () => {
    process.env.ABARVA_DATA_PLANE = 'azure-postgres';
    expect(selectAtlasRepositoryWriteAdapter().name).toBe('azure-postgres');
  });
});

describe('supabaseAtlasRepositoryWriteAdapter', () => {
  it('inserts a thread and returns the new id', async () => {
    const { client, calls } = fakeSupabase();
    const adapter = createSupabaseAtlasRepositoryWriteAdapter(() => client);
    const out = await adapter.insertThread({
      clientId: 'c-1',
      personId: 'u-1',
      title: 'Signal review',
      signalFiringId: 's-1',
      contextScope: 'signal',
      lastMessageAtIso: '2026-05-16T00:00:00.000Z',
    });
    expect(out).toEqual({ ok: true, data: { id: 'row-1' } });
    expect(calls[0]).toMatchObject({ table: 'atlas_threads', op: 'insert' });
    expect(calls[0].row.context_scope).toBe('signal');
  });

  it('surfaces a trace insert error as ok:false', async () => {
    const { client } = fakeSupabase((t) =>
      t === 'atlas_message_traces' ? { message: 'boom' } : null,
    );
    const adapter = createSupabaseAtlasRepositoryWriteAdapter(() => client);
    const out = await adapter.insertMessageTrace({
      atlasThreadId: 't-1',
      atlasObservationId: null,
      turnIndex: 0,
      role: 'user',
      routeType: 'portfolio',
      contentJsonb: {},
      toolsUsed: [],
      modelName: null,
      promptVersion: null,
      latencyMs: null,
    });
    expect(out).toEqual({ ok: false, error: 'boom' });
  });

  it('touches a thread last_message_at', async () => {
    const { client, calls } = fakeSupabase();
    const adapter = createSupabaseAtlasRepositoryWriteAdapter(() => client);
    await adapter.touchThread('t-1', '2026-05-16T01:00:00.000Z');
    expect(calls[0]).toMatchObject({ table: 'atlas_threads', op: 'update' });
  });

  it('inserts an observation and returns the new id', async () => {
    const { client } = fakeSupabase();
    const adapter = createSupabaseAtlasRepositoryWriteAdapter(() => client);
    const out = await adapter.insertObservation({
      clientId: 'c-1',
      atlasThreadId: null,
      signalFiringId: null,
      pillar: 'cost',
      observationKind: 'pattern',
      severity: 'high',
      summary: 'Drift detected',
      detailsJsonb: {},
      routeType: 'rule',
    });
    expect(out).toEqual({ ok: true, data: { id: 'row-1' } });
  });
});

describe('azureAtlasRepositoryWriteAdapter', () => {
  it('inserts a thread inside a transaction and returns the id', async () => {
    const tx = fakeTxSession((sql) =>
      sql.includes('INSERT INTO atlas_threads') ? [{ id: 'az-thread-1' }] : [],
    );
    const adapter = createAzureAtlasRepositoryWriteAdapter(tx.session);
    const out = await adapter.insertThread({
      clientId: 'c-1',
      personId: null,
      title: null,
      signalFiringId: null,
      contextScope: 'portfolio',
      lastMessageAtIso: '2026-05-16T00:00:00.000Z',
    });
    expect(out).toEqual({ ok: true, data: { id: 'az-thread-1' } });
    expect(tx.transactions).toBe(1);
  });

  it('surfaces an insert failure as ok:false rather than throwing', async () => {
    const tx = fakeTxSession(() => {
      throw new Error('connection reset');
    });
    const adapter = createAzureAtlasRepositoryWriteAdapter(tx.session);
    const out = await adapter.insertReasoningTrace({
      traceId: 'rt-1',
      threadId: null,
      tenantId: 't-1',
      userId: null,
      trigger: 'tower_right_rail_render',
      inputSummary: {},
      patternsFired: [],
      patternsSkipped: [],
      observations: [],
      ifYouOnlyDoOne: null,
      citations: [],
      interpretationConfidence: 'high',
      fallbackUsed: false,
      fallbackReason: null,
      latencyMs: null,
      promptTokens: null,
      completionTokens: null,
      model: 'claude',
      promptVersion: 'v1',
      packageVersion: 'p1',
    });
    expect(out.ok).toBe(false);
    expect(out.error).toContain('connection reset');
  });

  it('stays best-effort on a touch failure', async () => {
    const tx = fakeTxSession(() => {
      throw new Error('timeout');
    });
    const adapter = createAzureAtlasRepositoryWriteAdapter(tx.session);
    await expect(adapter.touchThread('t-1', '2026-05-16T00:00:00.000Z')).resolves.toBeUndefined();
  });
});
