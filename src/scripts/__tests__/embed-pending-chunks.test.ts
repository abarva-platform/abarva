/**
 * CB-2 · embed-pending-chunks runner tests.
 *
 * Exercises `runEmbedJob` against a fake supabase client and a stub OpenAI
 * client. No network, no real DB.
 */

import {
  parseArgs,
  runEmbedJob,
  type EmbedRunOptions,
  type PendingChunkRow,
  type SupabaseLike,
} from '../embed-pending-chunks';
import {
  EMBEDDING_DIM,
  type OpenAIEmbeddingsLike,
} from '@/lib/knowledge/context-broker/embedding-client';

jest.mock('server-only', () => ({}));

// ---------------------------------------------------------------------------
// In-memory fake Supabase client mimicking the SupabaseLike subset we use.
// ---------------------------------------------------------------------------

type ChunkState = {
  chunk_id: string;
  tenant_key: string;
  chunk_text: string;
  embedding_status: 'pending' | 'embedded' | 'failed' | 'skipped';
  embedding: number[] | null;
  embedding_dim: number | null;
  embedding_model: string | null;
  embedded_at: string | null;
  embedding_error: string | null;
};

function makeFakeSupabase(initial: ChunkState[]): {
  client: SupabaseLike;
  rows: ChunkState[];
} {
  const rows: ChunkState[] = initial.map((r) => ({ ...r }));

  const builder = (table: string): unknown => {
    if (table !== 'enterprise_context_chunks') {
      throw new Error(`unexpected table ${table}`);
    }

    const select = () => {
      const filters: Array<(r: ChunkState) => boolean> = [];
      const api = {
        eq(col: string, val: string) {
          filters.push((r) => (r as unknown as Record<string, unknown>)[col] === val);
          return api;
        },
        order(_col: string) {
          return api;
        },
        async limit(n: number) {
          const filtered = rows.filter((r) => filters.every((f) => f(r))).slice(0, n);
          const data: PendingChunkRow[] = filtered.map((r) => ({
            chunk_id: r.chunk_id,
            tenant_key: r.tenant_key,
            chunk_text: r.chunk_text,
          }));
          return { data, error: null };
        },
      };
      return api;
    };

    const update = (values: Record<string, unknown>) => {
      const filters: Array<(r: ChunkState) => boolean> = [];
      const api: unknown = {
        eq(col: string, val: string) {
          filters.push((r) => (r as unknown as Record<string, unknown>)[col] === val);
          return api;
        },
        then(onFulfilled: (v: { error: null }) => unknown) {
          for (const r of rows) {
            if (filters.every((f) => f(r))) {
              for (const [k, v] of Object.entries(values)) {
                (r as unknown as Record<string, unknown>)[k] = v;
              }
            }
          }
          return Promise.resolve({ error: null }).then(onFulfilled);
        },
      };
      return api;
    };

    return {
      select: (_cols: string) => select(),
      update,
    };
  };

  return {
    client: { from: (table: string) => builder(table) as ReturnType<SupabaseLike['from']> },
    rows,
  };
}

// ---------------------------------------------------------------------------
// Stub OpenAI client.
// ---------------------------------------------------------------------------

function makeOk(): OpenAIEmbeddingsLike {
  return {
    embeddings: {
      create: jest.fn(async ({ input }: { model: string; input: string[] }) => ({
        data: input.map((_, idx) => ({
          embedding: new Array<number>(EMBEDDING_DIM).fill((idx + 1) / 1000),
          index: idx,
        })),
        usage: { prompt_tokens: input.length * 50, total_tokens: input.length * 50 },
      })),
    },
  };
}

function makeChunk(id: string, tenant = 'apex-retail', text = `text for ${id}`): ChunkState {
  return {
    chunk_id: id,
    tenant_key: tenant,
    chunk_text: text,
    embedding_status: 'pending',
    embedding: null,
    embedding_dim: null,
    embedding_model: null,
    embedded_at: null,
    embedding_error: null,
  };
}

const baseOptions: EmbedRunOptions = {
  batchSize: 50,
  maxBatches: 10,
  tenantKey: null,
  dryRun: false,
  silent: true,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('parseArgs', () => {
  it('parses --dry-run', () => {
    expect(parseArgs(['--dry-run'])).toEqual({ dryRun: true, tenantKey: null });
  });

  it('parses --tenant <key>', () => {
    expect(parseArgs(['--tenant', 'apex-retail'])).toEqual({
      dryRun: false,
      tenantKey: 'apex-retail',
    });
  });

  it('parses --tenant=<key>', () => {
    expect(parseArgs(['--tenant=meridian-health'])).toEqual({
      dryRun: false,
      tenantKey: 'meridian-health',
    });
  });

  it('combines flags', () => {
    expect(parseArgs(['--dry-run', '--tenant', 'apex-retail'])).toEqual({
      dryRun: true,
      tenantKey: 'apex-retail',
    });
  });
});

describe('runEmbedJob — happy path', () => {
  it('embeds all pending rows and flips status to embedded', async () => {
    const { client, rows } = makeFakeSupabase([
      makeChunk('c1'),
      makeChunk('c2'),
      makeChunk('c3'),
    ]);
    const openai = makeOk();
    const result = await runEmbedJob(client, { ...baseOptions, openaiClient: openai });

    expect(result.embedded).toBe(3);
    expect(result.failed).toBe(0);
    expect(result.totalTokens).toBe(150);
    for (const r of rows) {
      expect(r.embedding_status).toBe('embedded');
      expect(r.embedding).not.toBeNull();
      expect(r.embedding?.length).toBe(EMBEDDING_DIM);
      expect(r.embedding_dim).toBe(EMBEDDING_DIM);
      expect(r.embedding_model).toBe('text-embedding-3-small');
      expect(r.embedded_at).not.toBeNull();
    }
  });

  it('respects --tenant filter', async () => {
    const { client, rows } = makeFakeSupabase([
      makeChunk('a1', 'apex-retail'),
      makeChunk('m1', 'meridian-health'),
      makeChunk('a2', 'apex-retail'),
    ]);
    const result = await runEmbedJob(client, {
      ...baseOptions,
      tenantKey: 'apex-retail',
      openaiClient: makeOk(),
    });
    expect(result.embedded).toBe(2);
    const meridian = rows.find((r) => r.chunk_id === 'm1');
    expect(meridian?.embedding_status).toBe('pending');
  });
});

describe('runEmbedJob — dry run', () => {
  it('does not call OpenAI and does not mutate Postgres', async () => {
    const { client, rows } = makeFakeSupabase([makeChunk('c1'), makeChunk('c2')]);
    const openai = makeOk();
    const result = await runEmbedJob(client, {
      ...baseOptions,
      dryRun: true,
      openaiClient: openai,
    });
    expect(result.skipped).toBe(2);
    expect(result.embedded).toBe(0);
    expect(result.failed).toBe(0);
    expect(result.totalTokens).toBeGreaterThan(0);
    expect(result.estimatedCostUsd).toBeGreaterThan(0);
    expect(openai.embeddings.create).not.toHaveBeenCalled();
    for (const r of rows) {
      expect(r.embedding_status).toBe('pending');
      expect(r.embedding).toBeNull();
    }
  });
});

describe('runEmbedJob — idempotence', () => {
  it('a second run is a no-op when everything is already embedded', async () => {
    const { client, rows } = makeFakeSupabase([makeChunk('c1'), makeChunk('c2')]);
    const openai = makeOk();
    await runEmbedJob(client, { ...baseOptions, openaiClient: openai });
    const callsAfterFirst = (openai.embeddings.create as jest.Mock).mock.calls.length;

    const second = await runEmbedJob(client, { ...baseOptions, openaiClient: openai });
    expect(second.embedded).toBe(0);
    expect(second.failed).toBe(0);
    expect((openai.embeddings.create as jest.Mock).mock.calls.length).toBe(callsAfterFirst);
    for (const r of rows) {
      expect(r.embedding_status).toBe('embedded');
    }
  });
});

describe('runEmbedJob — error path', () => {
  it('marks the batch failed when OpenAI throws', async () => {
    const { client, rows } = makeFakeSupabase([makeChunk('c1'), makeChunk('c2')]);
    const openai: OpenAIEmbeddingsLike = {
      embeddings: {
        create: jest.fn(async () => {
          throw new Error('boom');
        }),
      },
    };
    const result = await runEmbedJob(client, {
      ...baseOptions,
      openaiClient: openai,
      embeddingOptions: { initialRetryDelayMs: 1, maxRetries: 0 },
    });
    expect(result.embedded).toBe(0);
    expect(result.failed).toBe(2);
    for (const r of rows) {
      expect(r.embedding_status).toBe('failed');
      expect(r.embedding_error).toBe('boom');
    }
  });
});

describe('runEmbedJob — batch ceiling', () => {
  it('stops after EMBEDDING_MAX_BATCHES even if pending remains', async () => {
    const { client, rows } = makeFakeSupabase(
      Array.from({ length: 10 }, (_, i) => makeChunk(`c${i}`)),
    );
    const result = await runEmbedJob(client, {
      ...baseOptions,
      batchSize: 2,
      maxBatches: 2,
      openaiClient: makeOk(),
    });
    expect(result.batchesRun).toBe(2);
    expect(result.embedded).toBe(4);
    expect(result.hitMaxBatches).toBe(true);
    const remainingPending = rows.filter((r) => r.embedding_status === 'pending').length;
    expect(remainingPending).toBe(6);
  });
});
