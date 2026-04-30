/**
 * CB-2 · Embed pending `enterprise_context_chunks` rows via OpenAI.
 *
 * Reads chunks where `embedding_status = 'pending'`, calls the OpenAI
 * embeddings API (`text-embedding-3-small`, 1536 dims), writes the resulting
 * vector to the `embedding` jsonb column, and flips status to `embedded`.
 *
 * Pinecone is OUT of scope for CB-2 — this only writes to Postgres. CB-3
 * adds Pinecone upsert.
 *
 * Usage:
 *   npm run embed:pending-chunks                       # all tenants, real run
 *   npm run embed:pending-chunks -- --dry-run          # show what would run
 *   npm run embed:pending-chunks -- --tenant apex-retail
 *
 * Env:
 *   OPENAI_API_KEY              required (unless --dry-run)
 *   NEXT_PUBLIC_SUPABASE_URL    required
 *   SUPABASE_SERVICE_ROLE_KEY   required
 *   EMBEDDING_BATCH_SIZE        default 100
 *   EMBEDDING_MAX_BATCHES       default 10  (hard ceiling per run)
 *
 * Idempotence: re-runs only pick up `pending` rows. Already-embedded chunks
 * are untouched. Failed chunks (status='failed') are not retried unless an
 * operator manually flips them back to 'pending'.
 *
 * Cost guardrails: per-run hard cap is BATCH_SIZE * MAX_BATCHES. At default
 * (1000 chunks) the worst case is ~$0.02. The script prints an estimated
 * cost ceiling before any API call and a real-cost summary at the end.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';
import path from 'node:path';

import {
  embedTexts,
  estimateCostUsd,
  estimateTokensFromChars,
  EMBEDDING_DIM,
  EMBEDDING_MODEL,
  type EmbeddingClientOptions,
  type OpenAIEmbeddingsLike,
} from '@/lib/knowledge/context-broker/embedding-client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PendingChunkRow {
  chunk_id: string;
  tenant_key: string;
  chunk_text: string;
}

export interface EmbedRunOptions {
  batchSize: number;
  maxBatches: number;
  tenantKey: string | null;
  dryRun: boolean;
  /** Quiet logs (used by tests). */
  silent?: boolean;
  /** Optional OpenAI client override (used by tests / dry-run). */
  openaiClient?: OpenAIEmbeddingsLike;
  /** Optional embedding-client tunables. */
  embeddingOptions?: EmbeddingClientOptions;
}

export interface EmbedRunResult {
  embedded: number;
  failed: number;
  skipped: number;
  batchesRun: number;
  totalTokens: number;
  estimatedCostUsd: number;
  hitMaxBatches: boolean;
  dryRun: boolean;
}

// Subset of supabase-js we depend on. Lets tests inject an in-memory fake
// without pulling the real client.
export interface SupabaseLike {
  from: (table: string) => SupabaseQueryBuilder;
}

interface SupabaseQueryBuilder {
  select: (cols: string) => SupabaseSelectBuilder;
  update: (values: Record<string, unknown>) => SupabaseUpdateBuilder;
}

interface SupabaseSelectBuilder {
  eq: (col: string, val: string) => SupabaseSelectBuilder;
  order: (col: string) => SupabaseSelectBuilder;
  limit: (n: number) => Promise<{ data: PendingChunkRow[] | null; error: { message: string } | null }>;
}

interface SupabaseUpdateBuilder {
  eq: (col: string, val: string) => SupabaseUpdateBuilder & Promise<{ error: { message: string } | null }>;
}

// ---------------------------------------------------------------------------
// Args + env
// ---------------------------------------------------------------------------

interface CliArgs {
  dryRun: boolean;
  tenantKey: string | null;
}

export function parseArgs(argv: string[]): CliArgs {
  let dryRun = false;
  let tenantKey: string | null = null;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg === '--tenant') {
      tenantKey = argv[i + 1] ?? null;
      i += 1;
    } else if (arg.startsWith('--tenant=')) {
      tenantKey = arg.slice('--tenant='.length);
    }
  }
  return { dryRun, tenantKey };
}

function readPositiveInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer; got "${raw}".`);
  }
  return parsed;
}

// ---------------------------------------------------------------------------
// Core runner — pure on (supabase, openai, options); no env reads.
// ---------------------------------------------------------------------------

export async function runEmbedJob(
  supabase: SupabaseLike,
  options: EmbedRunOptions,
): Promise<EmbedRunResult> {
  const log = options.silent ? () => {} : (msg: string) => console.log(msg);

  const result: EmbedRunResult = {
    embedded: 0,
    failed: 0,
    skipped: 0,
    batchesRun: 0,
    totalTokens: 0,
    estimatedCostUsd: 0,
    hitMaxBatches: false,
    dryRun: options.dryRun,
  };

  for (let batch = 0; batch < options.maxBatches; batch += 1) {
    const rows = await fetchPendingBatch(supabase, options);
    if (rows.length === 0) {
      log(`[batch ${batch + 1}] no more pending chunks; stopping.`);
      break;
    }

    log(
      `[batch ${batch + 1}/${options.maxBatches}] fetched ${rows.length} pending chunk(s)` +
        (options.tenantKey ? ` (tenant=${options.tenantKey})` : ''),
    );

    if (options.dryRun) {
      const estTokens = rows.reduce((acc, r) => acc + estimateTokensFromChars(r.chunk_text), 0);
      const estCost = estimateCostUsd(estTokens);
      result.skipped += rows.length;
      result.batchesRun += 1;
      result.totalTokens += estTokens;
      result.estimatedCostUsd += estCost;
      log(
        `[batch ${batch + 1}] DRY RUN — would embed ${rows.length} chunk(s); ` +
          `~${estTokens} tokens; ~$${estCost.toFixed(6)}`,
      );
      // In dry-run, each fetch returns the same set (no writes happen), so
      // we must stop after one batch to avoid an infinite loop.
      break;
    }

    let batchResults: Awaited<ReturnType<typeof embedTexts>>;
    try {
      batchResults = await embedTexts(
        rows.map((r) => r.chunk_text),
        options.embeddingOptions,
        options.openaiClient,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log(`[batch ${batch + 1}] embedding API error: ${message} — marking batch failed`);
      for (const row of rows) {
        await markFailed(supabase, row, message, log);
        result.failed += 1;
      }
      result.batchesRun += 1;
      continue;
    }

    result.totalTokens += batchResults.summary.totalTokens;
    result.estimatedCostUsd += batchResults.summary.estimatedCostUsd;

    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      const out = batchResults.results[i];
      if (!out || !Array.isArray(out.embedding) || out.embedding.length !== EMBEDDING_DIM) {
        await markFailed(supabase, row, `unexpected embedding shape (dim=${out?.embedding?.length ?? 0})`, log);
        result.failed += 1;
        continue;
      }
      const updateError = await writeEmbedded(supabase, row, out.embedding);
      if (updateError) {
        await markFailed(supabase, row, `db update failed: ${updateError}`, log);
        result.failed += 1;
        continue;
      }
      result.embedded += 1;
    }

    result.batchesRun += 1;
    log(
      `[batch ${batch + 1}] embedded=${result.embedded} failed=${result.failed} ` +
        `tokens=${batchResults.summary.totalTokens} cost=$${batchResults.summary.estimatedCostUsd.toFixed(6)}`,
    );

    if (rows.length < options.batchSize) {
      log(`[batch ${batch + 1}] short batch — assuming queue drained; stopping.`);
      break;
    }
  }

  if (result.batchesRun >= options.maxBatches) {
    result.hitMaxBatches = true;
  }

  return result;
}

async function fetchPendingBatch(
  supabase: SupabaseLike,
  options: EmbedRunOptions,
): Promise<PendingChunkRow[]> {
  let q = supabase
    .from('enterprise_context_chunks')
    .select('chunk_id, tenant_key, chunk_text')
    .eq('embedding_status', 'pending');
  if (options.tenantKey) {
    q = q.eq('tenant_key', options.tenantKey);
  }
  const { data, error } = await q.order('tenant_key').order('chunk_id').limit(options.batchSize);
  if (error) {
    throw new Error(`Supabase select failed: ${error.message}`);
  }
  return data ?? [];
}

async function writeEmbedded(
  supabase: SupabaseLike,
  row: PendingChunkRow,
  embedding: number[],
): Promise<string | null> {
  const update = supabase
    .from('enterprise_context_chunks')
    .update({
      embedding,
      embedding_dim: EMBEDDING_DIM,
      embedding_model: EMBEDDING_MODEL,
      embedding_status: 'embedded',
      embedded_at: new Date().toISOString(),
      embedding_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq('tenant_key', row.tenant_key)
    .eq('chunk_id', row.chunk_id);
  const { error } = await update;
  return error ? error.message : null;
}

async function markFailed(
  supabase: SupabaseLike,
  row: PendingChunkRow,
  message: string,
  log: (msg: string) => void,
): Promise<void> {
  const update = supabase
    .from('enterprise_context_chunks')
    .update({
      embedding_status: 'failed',
      embedding_error: message.slice(0, 1000),
      updated_at: new Date().toISOString(),
    })
    .eq('tenant_key', row.tenant_key)
    .eq('chunk_id', row.chunk_id);
  const { error } = await update;
  if (error) {
    log(`  failed to record error for ${row.chunk_id}: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// Default Supabase client wrapper (typed against `SupabaseLike`).
// ---------------------------------------------------------------------------

function getSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
  }
  return createClient(url.trim(), key.trim(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

export async function main(argv: string[] = process.argv.slice(2)): Promise<EmbedRunResult> {
  loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
  loadEnv({ path: '/Users/anand/Projects/nexus/.env.local' });
  loadEnv();

  const args = parseArgs(argv);
  const batchSize = readPositiveInt('EMBEDDING_BATCH_SIZE', 100);
  const maxBatches = readPositiveInt('EMBEDDING_MAX_BATCHES', 10);
  const hardCap = batchSize * maxBatches;

  console.log('────────────────────────────────────────────────────────────');
  console.log(' CB-2 · embed-pending-chunks');
  console.log('────────────────────────────────────────────────────────────');
  console.log(` model           : ${EMBEDDING_MODEL} (${EMBEDDING_DIM} dims)`);
  console.log(` batch size      : ${batchSize}`);
  console.log(` max batches     : ${maxBatches}`);
  console.log(` hard cap        : ${hardCap} chunk(s) per run`);
  console.log(` tenant filter   : ${args.tenantKey ?? '(all)'}`);
  console.log(` dry run         : ${args.dryRun ? 'YES' : 'no'}`);
  console.log(` ceiling cost*   : ~$${estimateCostUsd(hardCap * 500).toFixed(4)}  (assumes ~500 tok/chunk)`);
  console.log('────────────────────────────────────────────────────────────');

  if (!args.dryRun && !process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required for non-dry-run executions.');
  }

  const supabase = getSupabaseClient() as unknown as SupabaseLike;
  const result = await runEmbedJob(supabase, {
    batchSize,
    maxBatches,
    tenantKey: args.tenantKey,
    dryRun: args.dryRun,
  });

  console.log('────────────────────────────────────────────────────────────');
  console.log(' Summary');
  console.log('────────────────────────────────────────────────────────────');
  console.log(` embedded        : ${result.embedded}`);
  console.log(` failed          : ${result.failed}`);
  console.log(` skipped (dry)   : ${result.skipped}`);
  console.log(` batches run     : ${result.batchesRun}`);
  console.log(` tokens used     : ${result.totalTokens}`);
  console.log(` cost (actual)   : $${result.estimatedCostUsd.toFixed(6)}`);
  if (result.hitMaxBatches) {
    console.log(' note            : hit EMBEDDING_MAX_BATCHES — re-run to continue.');
  }
  console.log('────────────────────────────────────────────────────────────');

  return result;
}

// Only auto-execute when run as a CLI (not when imported by tests).
if (require.main === module) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
