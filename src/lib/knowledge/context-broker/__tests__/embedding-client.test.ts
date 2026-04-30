/**
 * CB-2 · embedding-client unit tests.
 *
 * No real network. We inject a mock that mimics the OpenAI SDK shape we
 * depend on (`embeddings.create`).
 */

import {
  embedTexts,
  estimateCostUsd,
  estimateTokensFromChars,
  EMBEDDING_DIM,
  EMBEDDING_MODEL,
  EMBEDDING_MODEL_TENANT,
  EMBEDDING_MODEL_WORLDVIEW,
  type EmbeddingModelConfig,
  type OpenAIEmbeddingsLike,
} from '../embedding-client';

jest.mock('server-only', () => ({}));

function makeVector(seed: number, dim: number = EMBEDDING_DIM): number[] {
  const v = new Array<number>(dim);
  for (let i = 0; i < dim; i += 1) {
    v[i] = ((seed + i) % 2000) / 2000;
  }
  return v;
}

function makeMockClient(dim: number = EMBEDDING_DIM): {
  client: OpenAIEmbeddingsLike;
  calls: Array<{ model: string; input: string[] }>;
} {
  const calls: Array<{ model: string; input: string[] }> = [];
  const client: OpenAIEmbeddingsLike = {
    embeddings: {
      create: jest.fn(async ({ model, input }) => {
        calls.push({ model, input });
        return {
          data: input.map((_, idx) => ({
            embedding: makeVector(idx + calls.length, dim),
            index: idx,
          })),
          usage: {
            prompt_tokens: input.length * 100,
            total_tokens: input.length * 100,
          },
        };
      }),
    },
  };
  return { client, calls };
}

describe('embedTexts', () => {
  it('returns one EmbeddingResult per input with the right shape', async () => {
    const { client, calls } = makeMockClient();
    const out = await embedTexts(['hello', 'world'], {}, client);

    expect(out.results).toHaveLength(2);
    expect(out.results[0]).toMatchObject({ text: 'hello' });
    expect(out.results[1]).toMatchObject({ text: 'world' });
    expect(out.results[0].embedding).toHaveLength(EMBEDDING_DIM);
    expect(out.results[1].embedding).toHaveLength(EMBEDDING_DIM);
    expect(typeof out.results[0].tokensCharged).toBe('number');
    expect(out.summary.totalRequests).toBe(1);
    expect(out.summary.totalTokens).toBe(200);
    expect(calls[0].model).toBe(EMBEDDING_MODEL);
  });

  it('returns an empty result without calling OpenAI when given an empty array', async () => {
    const { client, calls } = makeMockClient();
    const out = await embedTexts([], {}, client);
    expect(out.results).toEqual([]);
    expect(out.summary.totalRequests).toBe(0);
    expect(calls).toHaveLength(0);
  });

  it('batches inputs that exceed the per-request cap', async () => {
    const { client, calls } = makeMockClient();
    const texts = Array.from({ length: 200 }, (_, i) => `chunk-${i}`);
    const out = await embedTexts(texts, { batchInputCap: 50 }, client);

    expect(out.results).toHaveLength(200);
    expect(calls).toHaveLength(4);
    for (const c of calls) {
      expect(c.input.length).toBeLessThanOrEqual(50);
    }
    // Order is preserved.
    expect(out.results.map((r) => r.text)).toEqual(texts);
  });

  it('rejects empty-string inputs eagerly', async () => {
    const { client } = makeMockClient();
    await expect(embedTexts(['ok', ''], {}, client)).rejects.toThrow(/non-empty/);
  });

  it('retries on 429 and succeeds within the retry budget', async () => {
    const calls: Array<{ model: string; input: string[] }> = [];
    let attempt = 0;
    const client: OpenAIEmbeddingsLike = {
      embeddings: {
        create: jest.fn(async ({ model, input }) => {
          calls.push({ model, input });
          attempt += 1;
          if (attempt === 1) {
            const err = new Error('rate limit') as Error & { status?: number };
            err.status = 429;
            throw err;
          }
          return {
            data: input.map((_, idx) => ({ embedding: makeVector(idx), index: idx })),
            usage: { prompt_tokens: 50, total_tokens: 50 },
          };
        }),
      },
    };

    const out = await embedTexts(
      ['retry me'],
      { initialRetryDelayMs: 1, maxRetries: 3 },
      client,
    );
    expect(out.results).toHaveLength(1);
    expect(calls).toHaveLength(2);
  });

  it('bubbles up non-rate-limit errors', async () => {
    const client: OpenAIEmbeddingsLike = {
      embeddings: {
        create: jest.fn(async () => {
          const err = new Error('bad request') as Error & { status?: number };
          err.status = 400;
          throw err;
        }),
      },
    };
    await expect(embedTexts(['x'], { initialRetryDelayMs: 1 }, client)).rejects.toThrow(/bad request/);
  });

  it('gives up after exhausting retries and throws the rate-limit error', async () => {
    const client: OpenAIEmbeddingsLike = {
      embeddings: {
        create: jest.fn(async () => {
          const err = new Error('still 429') as Error & { status?: number };
          err.status = 429;
          throw err;
        }),
      },
    };
    await expect(
      embedTexts(['x'], { initialRetryDelayMs: 1, maxRetries: 2 }, client),
    ).rejects.toThrow(/still 429/);
  });

  it('caps the batchInputCap at the OpenAI 2048 hard limit', async () => {
    const { client, calls } = makeMockClient();
    const texts = Array.from({ length: 2050 }, (_, i) => `t-${i}`);
    const out = await embedTexts(texts, { batchInputCap: 5000 }, client);
    expect(out.results).toHaveLength(2050);
    expect(calls).toHaveLength(2);
    expect(calls[0].input.length).toBe(2048);
    expect(calls[1].input.length).toBe(2);
  });

  describe('multi-model (WV-INGEST)', () => {
    it('defaults to the tenant small model when no modelConfig is passed', async () => {
      const { client, calls } = makeMockClient();
      const out = await embedTexts(['hi'], {}, client);
      expect(calls[0].model).toBe('text-embedding-3-small');
      expect(out.results[0].embedding).toHaveLength(EMBEDDING_MODEL_TENANT.dimension);
    });

    it('produces 3072-dim vectors when EMBEDDING_MODEL_WORLDVIEW is passed', async () => {
      const { client, calls } = makeMockClient(EMBEDDING_MODEL_WORLDVIEW.dimension);
      const out = await embedTexts(
        ['worldview chunk text'],
        { modelConfig: EMBEDDING_MODEL_WORLDVIEW },
        client,
      );
      expect(calls[0].model).toBe('text-embedding-3-large');
      expect(out.results).toHaveLength(1);
      expect(out.results[0].embedding).toHaveLength(EMBEDDING_MODEL_WORLDVIEW.dimension);
      expect(out.results[0].embedding).toHaveLength(3072);
    });

    it('throws when OpenAI returns a vector with the wrong dimension for the requested model', async () => {
      // Force a dim mismatch: ask for worldview (3072) but mock returns 1536.
      const mismatchClient: OpenAIEmbeddingsLike = {
        embeddings: {
          create: jest.fn(async ({ input }) => ({
            data: input.map((_, idx) => ({
              embedding: makeVector(idx, EMBEDDING_MODEL_TENANT.dimension),
              index: idx,
            })),
            usage: { prompt_tokens: 50, total_tokens: 50 },
          })),
        },
      };
      await expect(
        embedTexts(['x'], { modelConfig: EMBEDDING_MODEL_WORLDVIEW }, mismatchClient),
      ).rejects.toThrow(/expected 3072 for text-embedding-3-large/);
    });

    it('estimates cost using the per-model rate from the result summary', async () => {
      const { client } = makeMockClient(EMBEDDING_MODEL_WORLDVIEW.dimension);
      const out = await embedTexts(
        ['hello'],
        { modelConfig: EMBEDDING_MODEL_WORLDVIEW },
        client,
      );
      // Mock charges 100 tokens; large rate is $0.13/1M.
      const expected = (100 / 1_000_000) * EMBEDDING_MODEL_WORLDVIEW.costPerMillionTokensUsd;
      expect(out.summary.estimatedCostUsd).toBeCloseTo(expected, 9);
    });
  });
});

describe('estimateCostUsd', () => {
  it('returns $0 for 0 tokens', () => {
    expect(estimateCostUsd(0)).toBe(0);
  });

  it('returns ~$0.02 for 1M tokens (default tenant model)', () => {
    expect(estimateCostUsd(1_000_000)).toBeCloseTo(0.02, 6);
  });

  it('returns ~$0.0001 for 5000 tokens (default tenant model)', () => {
    expect(estimateCostUsd(5_000)).toBeCloseTo(0.0001, 6);
  });

  it('uses the worldview rate ($0.13/M) when EMBEDDING_MODEL_WORLDVIEW is passed', () => {
    expect(estimateCostUsd(1_000_000, EMBEDDING_MODEL_WORLDVIEW)).toBeCloseTo(0.13, 6);
    expect(estimateCostUsd(50_000, EMBEDDING_MODEL_WORLDVIEW)).toBeCloseTo(0.0065, 6);
  });

  it('honours an arbitrary cost-per-million config', () => {
    const custom: EmbeddingModelConfig = {
      model: 'text-embedding-3-small',
      dimension: 1536,
      costPerMillionTokensUsd: 1.0,
    };
    expect(estimateCostUsd(2_500_000, custom)).toBe(2.5);
  });
});

describe('estimateTokensFromChars', () => {
  it('returns at least 1 for a non-empty string', () => {
    expect(estimateTokensFromChars('a')).toBeGreaterThanOrEqual(1);
  });

  it('returns ~length/4 for typical text', () => {
    expect(estimateTokensFromChars('a'.repeat(400))).toBe(100);
  });
});
