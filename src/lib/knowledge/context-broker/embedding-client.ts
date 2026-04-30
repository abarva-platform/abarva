import 'server-only';

/**
 * CB-2 · Thin OpenAI embeddings wrapper used by the embedding job.
 *
 * - Model is baked in (`text-embedding-3-small`, 1536 dims). Re-embeds to a
 *   different model are intentional re-runs of the job (chunk_id is stable).
 * - Caller passes an arbitrary `string[]`; the client batches up to OpenAI's
 *   per-request input cap so the caller doesn't have to think about it.
 * - 429 (rate limit) errors trigger exponential backoff (max 3 retries per
 *   batch). All other 4xx / 5xx bubble up.
 *
 * Pinecone is not in scope for CB-2 — this module only produces vectors.
 */

import OpenAI from 'openai';

/** Hard model + dim contract for the broker's embedding store. */
export const EMBEDDING_MODEL = 'text-embedding-3-small' as const;
export const EMBEDDING_DIM = 1536 as const;

/**
 * OpenAI's `embeddings.create` accepts up to 2048 inputs per request and
 * 300,000 tokens summed across them. We cap at 256 to stay comfortably under
 * both ceilings for typical chunk sizes (~500 tokens) and to keep batch
 * latency predictable. Configurable via the third `embedTexts` arg.
 */
export const DEFAULT_BATCH_INPUT_CAP = 256;

/** OpenAI per-request hard limit on number of array inputs. */
export const OPENAI_INPUT_LIMIT = 2048;

/** Pricing for `text-embedding-3-small` is $0.02 per 1M tokens. */
export const COST_PER_MILLION_TOKENS_USD = 0.02;

export interface EmbeddingResult {
  text: string;
  embedding: number[];
  /** Tokens charged for this single input, distributed proportionally. */
  tokensCharged: number;
}

export interface EmbeddingBatchSummary {
  totalTokens: number;
  totalRequests: number;
  estimatedCostUsd: number;
}

export interface EmbedTextsResult {
  results: EmbeddingResult[];
  summary: EmbeddingBatchSummary;
}

export interface EmbeddingClientOptions {
  /** Cap on array size sent to OpenAI in a single request. */
  batchInputCap?: number;
  /** Max retries for a single batch on 429 rate-limit errors. */
  maxRetries?: number;
  /** Initial backoff delay (ms) for 429 retries; doubles each retry. */
  initialRetryDelayMs?: number;
}

/** Subset of the OpenAI client we depend on; lets tests inject a mock. */
export interface OpenAIEmbeddingsLike {
  embeddings: {
    create: (params: {
      model: string;
      input: string[];
    }) => Promise<{
      data: Array<{ embedding: number[]; index: number }>;
      usage: { prompt_tokens: number; total_tokens: number };
    }>;
  };
}

let _openai: OpenAI | null = null;

function defaultOpenAI(): OpenAI {
  if (_openai) return _openai;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required to call OpenAI embeddings.');
  }
  _openai = new OpenAI({ apiKey });
  return _openai;
}

function isRateLimitError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const status = (error as { status?: unknown }).status;
  if (typeof status === 'number' && status === 429) return true;
  const code = (error as { code?: unknown }).code;
  if (code === 'rate_limit_exceeded') return true;
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function chunkArray<T>(input: T[], size: number): T[][] {
  if (size <= 0) throw new Error(`batch size must be > 0; got ${size}`);
  const out: T[][] = [];
  for (let i = 0; i < input.length; i += size) {
    out.push(input.slice(i, i + size));
  }
  return out;
}

/**
 * Embed an array of texts using `text-embedding-3-small`. Internally batches
 * the array to stay under the OpenAI per-request cap. Returns one
 * `EmbeddingResult` per input in the original order.
 *
 * On 429 rate-limit: exponential backoff up to `maxRetries` (default 3).
 * On any other error: throws (the caller decides whether to mark the chunk
 * as failed and continue, or abort the run).
 */
export async function embedTexts(
  texts: string[],
  options: EmbeddingClientOptions = {},
  client: OpenAIEmbeddingsLike = defaultOpenAI(),
): Promise<EmbedTextsResult> {
  const batchInputCap = Math.min(
    options.batchInputCap ?? DEFAULT_BATCH_INPUT_CAP,
    OPENAI_INPUT_LIMIT,
  );
  const maxRetries = options.maxRetries ?? 3;
  const initialRetryDelayMs = options.initialRetryDelayMs ?? 500;

  if (texts.length === 0) {
    return {
      results: [],
      summary: { totalTokens: 0, totalRequests: 0, estimatedCostUsd: 0 },
    };
  }

  // Pre-validate inputs: OpenAI rejects empty strings; surface eagerly.
  for (let i = 0; i < texts.length; i += 1) {
    if (typeof texts[i] !== 'string' || texts[i].length === 0) {
      throw new Error(`embedTexts: input[${i}] must be a non-empty string`);
    }
  }

  const batches = chunkArray(texts, batchInputCap);
  const results: EmbeddingResult[] = new Array(texts.length);
  let totalTokens = 0;
  let totalRequests = 0;

  let cursor = 0;
  for (const batch of batches) {
    let attempt = 0;
    let response: Awaited<ReturnType<OpenAIEmbeddingsLike['embeddings']['create']>> | null = null;

    // Retry loop scoped to a single batch. Bounded by `maxRetries`.
    for (;;) {
      try {
        response = await client.embeddings.create({
          model: EMBEDDING_MODEL,
          input: batch,
        });
        totalRequests += 1;
        break;
      } catch (error) {
        if (isRateLimitError(error) && attempt < maxRetries) {
          const delay = initialRetryDelayMs * 2 ** attempt;
          await sleep(delay);
          attempt += 1;
          continue;
        }
        throw error;
      }
    }

    if (!response) {
      throw new Error('embedTexts: unreachable — missing OpenAI response');
    }

    const batchTokens = response.usage?.total_tokens ?? 0;
    totalTokens += batchTokens;

    if (response.data.length !== batch.length) {
      throw new Error(
        `embedTexts: OpenAI returned ${response.data.length} embeddings for ${batch.length} inputs`,
      );
    }

    // Distribute the batch's token usage proportionally to character count
    // so per-item `tokensCharged` is informative for cost reporting. The
    // total is exact; the per-item split is an approximation by design.
    const charTotal = batch.reduce((acc, t) => acc + t.length, 0) || 1;
    for (const item of response.data) {
      const text = batch[item.index];
      const proportional = Math.max(
        1,
        Math.round((text.length / charTotal) * batchTokens),
      );
      results[cursor + item.index] = {
        text,
        embedding: item.embedding,
        tokensCharged: proportional,
      };
    }
    cursor += batch.length;
  }

  // Sanity: every slot filled.
  for (let i = 0; i < results.length; i += 1) {
    if (!results[i]) {
      throw new Error(`embedTexts: missing embedding for input ${i}`);
    }
  }

  return {
    results,
    summary: {
      totalTokens,
      totalRequests,
      estimatedCostUsd: estimateCostUsd(totalTokens),
    },
  };
}

/** USD cost for `tokens` tokens on `text-embedding-3-small`. */
export function estimateCostUsd(tokens: number): number {
  return (tokens / 1_000_000) * COST_PER_MILLION_TOKENS_USD;
}

/**
 * Heuristic token estimate used by the script before hitting the API, so the
 * user sees an upfront cost ceiling. ~4 chars/token is a known approximation
 * for English; embedding inputs are not chat completions, but the same rule
 * of thumb holds for cost reporting at this precision.
 */
export function estimateTokensFromChars(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}
