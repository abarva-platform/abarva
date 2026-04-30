/**
 * CB-2 / CB-3 · Embed pending `enterprise_context_chunks` rows via
 * OpenAI and upsert the resulting vectors to Pinecone.
 *
 * Reads chunks where `embedding_status = 'pending'`, calls the OpenAI
 * embeddings API (`text-embedding-3-small`, 1536 dims), writes the
 * vector to the `embedding` jsonb column (audit trail in Postgres),
 * flips status to `embedded`, and — when `PINECONE_API_KEY` is set —
 * upserts the same vector into the shared
 * `abarva-tenant-context-prod` index for retrieval.
 *
 * When `PINECONE_API_KEY` is missing, the script logs a one-time
 * warning and continues in Postgres-only mode. `--postgres-only`
 * skips Pinecone explicitly even if the key is set.
 *
 * Usage:
 *   npm run embed:pending-chunks                       # all tenants, real run
 *   npm run embed:pending-chunks -- --dry-run          # show what would run
 *   npm run embed:pending-chunks -- --tenant apex-retail
 *   npm run embed:pending-chunks -- --postgres-only    # skip Pinecone
 *
 * Env:
 *   OPENAI_API_KEY              required (unless --dry-run)
 *   PINECONE_API_KEY            optional; required to write to vector index
 *   PINECONE_INDEX_NAME         optional; defaults to abarva-tenant-context-prod
 *   NEXT_PUBLIC_SUPABASE_URL    required
 *   SUPABASE_SERVICE_ROLE_KEY   required
 *   EMBEDDING_BATCH_SIZE        default 100
 *   EMBEDDING_MAX_BATCHES       default 10  (hard ceiling per run)
 *
 * Idempotence: re-runs only pick up `pending` rows. Already-embedded chunks
 * are untouched. Failed chunks (status='failed') are not retried unless an
 * operator manually flips them back to 'pending'. Pinecone upsert keys
 * on `chunk_id`, so re-runs overwrite cleanly.
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
import {
  getPineconeClient,
  type PineconeClient,
  type PineconeUpsertItem,
} from '@/lib/knowledge/context-broker/pinecone-client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PendingChunkRow {
  chunk_id: string;
  tenant_key: string;
  chunk_text: string;
  /** Optional metadata for Pinecone — selected alongside the text. */
  source_segment_id?: string | null;
  source_record_id?: string | null;
  source_doc?: string | null;
  chunk_index?: number | null;
  chunk_metadata?: Record<string, unknown> | null;
  provenance?: Record<string, unknown> | null;
}

export interface EmbedRunOptions {
  batchSize: number;
  maxBatches: number;
  tenantKey: string | null;
  dryRun: boolean;
  /**
   * Skip Pinecone upsert even when the API key is set. Postgres
   * still receives the embedding (audit trail). CB-3 default `false`.
   */
  postgresOnly?: boolean;
  /** Quiet logs (used by tests). */
  silent?: boolean;
  /** Optional OpenAI client override (used by tests / dry-run). */
  openaiClient?: OpenAIEmbeddingsLike;
  /** Optional Pinecone client override (used by tests). */
  pineconeClient?: PineconeClient | null;
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
  /** CB-3: number of vectors successfully upserted to Pinecone. */
  pineconeUpserts: number;
  /**
   * CB-3: number of chunks that landed in Postgres but failed to
   * upsert to Pinecone. Postgres holds the canonical embedding so a
   * follow-up re-run can replay these.
   */
  pineconeFailures: number;
  /** CB-3: true when Pinecone upsert ran (key present + not --postgres-only). */
  pineconeEnabled: boolean;
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
  postgresOnly: boolean;
}

export function parseArgs(argv: string[]): CliArgs {
  let dryRun = false;
  let tenantKey: string | null = null;
  let postgresOnly = false;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg === '--postgres-only') {
      postgresOnly = true;
    } else if (arg === '--tenant') {
      tenantKey = argv[i + 1] ?? null;
      i += 1;
    } else if (arg.startsWith('--tenant=')) {
      tenantKey = arg.slice('--tenant='.length);
    }
  }
  return { dryRun, tenantKey, postgresOnly };
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

  // ── Resolve Pinecone client up-front. Honour --postgres-only.
  // We resolve once per run (not per batch) so we log the
  // skip-warning at most once per execution.
  let pinecone: PineconeClient | null = null;
  let pineconeEnabled = false;
  if (!options.dryRun && !options.postgresOnly) {
    pinecone = options.pineconeClient ?? getPineconeClient();
    if (pinecone) {
      pineconeEnabled = true;
    } else {
      log('Pinecone API key not set — skipping vector index upsert');
    }
  } else if (options.postgresOnly && !options.dryRun) {
    log('--postgres-only set — skipping vector index upsert');
  }

  const result: EmbedRunResult = {
    embedded: 0,
    failed: 0,
    skipped: 0,
    batchesRun: 0,
    totalTokens: 0,
    estimatedCostUsd: 0,
    pineconeUpserts: 0,
    pineconeFailures: 0,
    pineconeEnabled,
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

    // Pair successful (row, embedding) tuples for the Pinecone upsert
    // step below. We only push to Pinecone after Postgres confirms the
    // write — keeps Postgres the source of truth.
    const pineconeReady: Array<{ row: PendingChunkRow; embedding: number[] }> = [];

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
      pineconeReady.push({ row, embedding: out.embedding });
    }

    if (pinecone && pineconeReady.length > 0) {
      try {
        const upsert = await pinecone.upsert(
          pineconeReady.map(({ row, embedding }) => toPineconeItem(row, embedding)),
        );
        result.pineconeUpserts += upsert.upsertedCount;
        log(
          `[batch ${batch + 1}] pinecone: upserted ${upsert.upsertedCount} vector(s) ` +
            `to ${process.env.PINECONE_INDEX_NAME?.trim() || 'abarva-tenant-context-prod'}`,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        log(
          `[batch ${batch + 1}] pinecone upsert failed (Postgres unaffected): ${message}`,
        );
        result.pineconeFailures += pineconeReady.length;
      }
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

/**
 * Map a Postgres chunk row + its OpenAI embedding into the Pinecone
 * upsert envelope. The metadata footprint is intentionally minimal —
 * `chunk_text` lives in Postgres (see `pinecone-client.ts` for the
 * full rationale).
 */
function toPineconeItem(
  row: PendingChunkRow,
  embedding: number[],
): PineconeUpsertItem {
  // Lift any classification / source_doc hints from the chunk's
  // provenance map (the loader stamps these), with chunk_metadata
  // as a secondary fallback.
  const provenance = (row.provenance ?? {}) as Record<string, unknown>;
  const meta = (row.chunk_metadata ?? {}) as Record<string, unknown>;
  const dataClassification =
    typeof provenance.data_classification === 'string'
      ? provenance.data_classification
      : typeof meta.data_classification === 'string'
        ? meta.data_classification
        : undefined;
  const recordKind =
    typeof meta.record_kind === 'string'
      ? meta.record_kind
      : typeof provenance.record_kind === 'string'
        ? provenance.record_kind
        : 'unknown';
  const sourceDoc =
    typeof row.source_doc === 'string' && row.source_doc.length > 0
      ? row.source_doc
      : typeof provenance.source_doc === 'string'
        ? provenance.source_doc
        : undefined;
  const confidenceRaw =
    typeof provenance.confidence === 'number' ? provenance.confidence : undefined;
  return {
    id: row.chunk_id,
    vector: embedding,
    metadata: {
      tenant_key: row.tenant_key,
      record_kind: recordKind,
      source_segment: row.source_segment_id ?? '',
      record_id: row.source_record_id ?? '',
      ...(typeof confidenceRaw === 'number' ? { confidence: confidenceRaw } : {}),
      ...(dataClassification ? { data_classification: dataClassification } : {}),
      ...(typeof row.chunk_index === 'number' ? { chunk_index: row.chunk_index } : {}),
      ...(sourceDoc ? { source_doc: sourceDoc } : {}),
    },
  };
}

async function fetchPendingBatch(
  supabase: SupabaseLike,
  options: EmbedRunOptions,
): Promise<PendingChunkRow[]> {
  // We pull the small set of columns the Pinecone upsert metadata
  // needs alongside the text; Postgres remains source of truth, so
  // we never write these back.
  let q = supabase
    .from('enterprise_context_chunks')
    .select(
      'chunk_id, tenant_key, chunk_text, source_segment_id, source_record_id, ' +
        'source_doc, chunk_index, chunk_metadata, provenance',
    )
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

  const pineconeKeyPresent = Boolean(process.env.PINECONE_API_KEY);
  const pineconeMode = args.dryRun
    ? 'skipped (dry run)'
    : args.postgresOnly
      ? 'skipped (--postgres-only)'
      : pineconeKeyPresent
        ? 'enabled'
        : 'skipped (no PINECONE_API_KEY)';

  console.log('────────────────────────────────────────────────────────────');
  console.log(' CB-2 / CB-3 · embed-pending-chunks');
  console.log('────────────────────────────────────────────────────────────');
  console.log(` model           : ${EMBEDDING_MODEL} (${EMBEDDING_DIM} dims)`);
  console.log(` batch size      : ${batchSize}`);
  console.log(` max batches     : ${maxBatches}`);
  console.log(` hard cap        : ${hardCap} chunk(s) per run`);
  console.log(` tenant filter   : ${args.tenantKey ?? '(all)'}`);
  console.log(` dry run         : ${args.dryRun ? 'YES' : 'no'}`);
  console.log(` postgres only   : ${args.postgresOnly ? 'YES' : 'no'}`);
  console.log(` pinecone        : ${pineconeMode}`);
  if (!args.dryRun && !args.postgresOnly && pineconeKeyPresent) {
    console.log(` pinecone index  : ${process.env.PINECONE_INDEX_NAME?.trim() || 'abarva-tenant-context-prod'}`);
  }
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
    postgresOnly: args.postgresOnly,
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
  console.log(` pinecone upsert : ${result.pineconeUpserts}`);
  console.log(` pinecone fail   : ${result.pineconeFailures}`);
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
