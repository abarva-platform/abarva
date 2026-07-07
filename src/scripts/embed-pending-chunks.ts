/**
 * CB-2 / CB-3 / SCB W2.2 · Embed pending `enterprise_context_chunks`
 * rows via OpenAI, write native pgvector embeddings to Postgres, and
 * optionally mirror vectors to Pinecone for legacy replay.
 *
 * Index-name resolution: prefer `PINECONE_INDEX_NAME`, fall back to
 * `PINECONE_INDEX` (legacy alias used by the existing Vercel project
 * envs), then the default `abarva-tenant-context-prod`.
 *
 * Reads chunks where `embedding_status = 'pending'`, calls the OpenAI
 * embeddings API (`text-embedding-3-small`, 1536 dims), writes the
 * vector to the `embedding` jsonb column plus `embedding_vector`
 * pgvector column, flips status to `embedded`, and — when
 * `PINECONE_API_KEY` is set — optionally mirrors the same vector into
 * the shared `abarva-tenant-context-prod` index for replay.
 *
 * When `PINECONE_API_KEY` is missing, the script logs a one-time
 * warning and continues in Postgres-only mode. `--postgres-only`
 * skips Pinecone explicitly even if the key is set.
 *
 * Usage:
 *   npm run embed:pending-chunks                       # all tenants, real run
 *   npm run embed:pending-chunks -- --dry-run          # show what would run
 *   npm run embed:pending-chunks -- --tenant apex-retail
 *   npm run embed:pending-chunks -- --postgres-only    # Postgres pgvector only
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
 * operator manually flips them back to 'pending'. Postgres remains the
 * retrieval source of truth; Pinecone upsert keys on `chunk_id`, so
 * optional replays overwrite cleanly.
 *
 * Cost guardrails: per-run hard cap is BATCH_SIZE * MAX_BATCHES. At default
 * (1000 chunks) the worst case is ~$0.02. The script prints an estimated
 * cost ceiling before any API call and a real-cost summary at the end.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";
import path from "node:path";
import { Pool } from "pg";

import {
  embedTexts,
  estimateCostUsd,
  estimateTokensFromChars,
  EMBEDDING_DIM,
  EMBEDDING_MODEL,
  type EmbeddingClientOptions,
  type OpenAIEmbeddingsLike,
} from "@/lib/knowledge/context-broker/embedding-client";
import {
  getPineconeClient,
  privateTenantPineconeIndexConfig,
  type PineconeIndexConfig,
  type PineconeClient,
  type PineconeUpsertItem,
} from "@/lib/knowledge/context-broker/pinecone-client";
import {
  getPrivateDataPlaneResource,
  isPrivateVectorAvailable,
} from "@/lib/knowledge/private-data-plane/registry";
import { runtimePostgresPoolConfig } from "@/lib/data-plane/postgresCompat";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PendingChunkRow {
  chunk_id: string;
  tenant_key: string;
  client_id?: string | null;
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
  limit: (n: number) => Promise<{
    data: PendingChunkRow[] | null;
    error: { message: string } | null;
  }>;
}

interface SupabaseUpdateBuilder {
  eq: (
    col: string,
    val: string,
  ) => SupabaseUpdateBuilder & Promise<{ error: { message: string } | null }>;
}

interface CloseableSupabaseLike extends SupabaseLike {
  close?: () => Promise<void>;
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
    if (arg === "--dry-run") {
      dryRun = true;
    } else if (arg === "--postgres-only") {
      postgresOnly = true;
    } else if (arg === "--tenant") {
      tenantKey = argv[i + 1] ?? null;
      i += 1;
    } else if (arg.startsWith("--tenant=")) {
      tenantKey = arg.slice("--tenant=".length);
    }
  }
  return { dryRun, tenantKey, postgresOnly };
}

function resolveIndexName(): string {
  return (
    process.env.PINECONE_INDEX_NAME?.trim() ||
    process.env.PINECONE_INDEX?.trim() ||
    "abarva-tenant-context-prod"
  );
}

function resolvePineconeIndexConfig(
  tenantKey: string | null,
): PineconeIndexConfig {
  const resource = getPrivateDataPlaneResource(tenantKey);
  if (isPrivateVectorAvailable(resource) && resource?.privatePineconeIndex) {
    return privateTenantPineconeIndexConfig(resource.privatePineconeIndex);
  }
  return {
    name: resolveIndexName(),
    dimension: EMBEDDING_DIM,
    metric: "cosine",
    mode: "tenant",
  };
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
  const pineconeConfig = resolvePineconeIndexConfig(options.tenantKey);
  if (!options.dryRun && !options.postgresOnly) {
    pinecone =
      options.pineconeClient === undefined
        ? getPineconeClient(pineconeConfig)
        : options.pineconeClient;
    if (pinecone) {
      pineconeEnabled = true;
    } else {
      log("Pinecone API key not set — skipping vector index upsert");
    }
  } else if (options.postgresOnly && !options.dryRun) {
    log("--postgres-only set — skipping vector index upsert");
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

  let queueDrained = false;
  for (let batch = 0; batch < options.maxBatches; batch += 1) {
    const rows = await fetchPendingBatch(supabase, options);
    if (rows.length === 0) {
      log(`[batch ${batch + 1}] no more pending chunks; stopping.`);
      queueDrained = true;
      break;
    }

    log(
      `[batch ${batch + 1}/${options.maxBatches}] fetched ${rows.length} pending chunk(s)` +
        (options.tenantKey ? ` (tenant=${options.tenantKey})` : ""),
    );

    if (options.dryRun) {
      const estTokens = rows.reduce(
        (acc, r) => acc + estimateTokensFromChars(r.chunk_text),
        0,
      );
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
      const batchTenantKeys = Array.from(
        new Set(rows.map((row) => row.tenant_key).filter(Boolean)),
      );
      if (
        !options.openaiClient &&
        !options.embeddingOptions?.aiEgress &&
        batchTenantKeys.length !== 1
      ) {
        throw new Error(
          "embedding egress audit requires a single tenant per batch; rerun with --tenant <tenant_key>",
        );
      }
      const batchClientIds = Array.from(
        new Set(rows.map((row) => row.client_id).filter(Boolean)),
      );
      if (
        !options.openaiClient &&
        !options.embeddingOptions?.aiEgress &&
        batchClientIds.length !== 1
      ) {
        throw new Error(
          "embedding egress audit requires a single client_id per batch; verify loaded chunks before embedding",
        );
      }
      const egressTenantKey = options.tenantKey ?? batchTenantKeys[0] ?? null;
      const egressTenantId = batchClientIds[0] ?? egressTenantKey;
      batchResults = await embedTexts(
        rows.map((r) => r.chunk_text),
        {
          ...(options.embeddingOptions ?? {}),
          aiEgress: egressTenantId
            ? {
                tenantId: egressTenantId,
                workflow: "embed-pending-enterprise-context-chunks",
                dataClass: "confidential",
                metadata: {
                  tenantKey: egressTenantKey,
                  clientId: egressTenantId,
                  chunkCount: rows.length,
                },
              }
            : options.embeddingOptions?.aiEgress,
        },
        options.openaiClient,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log(
        `[batch ${batch + 1}] embedding API error: ${message} — marking batch failed`,
      );
      for (const row of rows) {
        await markFailed(supabase, row, message, log);
        result.failed += 1;
      }
      result.batchesRun += 1;
      continue;
    }

    result.totalTokens += batchResults.summary.totalTokens;
    result.estimatedCostUsd += batchResults.summary.estimatedCostUsd;

    // Pair successful (row, embedding) tuples for the optional Pinecone
    // mirror below. We only push to Pinecone after Postgres confirms the
    // JSONB + pgvector write, keeping Postgres the retrieval source of truth.
    const pineconeReady: Array<{ row: PendingChunkRow; embedding: number[] }> =
      [];

    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      const out = batchResults.results[i];
      if (
        !out ||
        !Array.isArray(out.embedding) ||
        out.embedding.length !== EMBEDDING_DIM
      ) {
        await markFailed(
          supabase,
          row,
          `unexpected embedding shape (dim=${out?.embedding?.length ?? 0})`,
          log,
        );
        result.failed += 1;
        continue;
      }
      const updateError = await writeEmbedded(supabase, row, out.embedding);
      if (updateError) {
        await markFailed(
          supabase,
          row,
          `db update failed: ${updateError}`,
          log,
        );
        result.failed += 1;
        continue;
      }
      result.embedded += 1;
      pineconeReady.push({ row, embedding: out.embedding });
    }

    if (pinecone && pineconeReady.length > 0) {
      try {
        const upsert = await pinecone.upsert(
          pineconeReady.map(({ row, embedding }) =>
            toPineconeItem(row, embedding),
          ),
        );
        result.pineconeUpserts += upsert.upsertedCount;
        log(
          `[batch ${batch + 1}] pinecone: upserted ${upsert.upsertedCount} vector(s) ` +
            `to ${pineconeConfig.name}`,
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
      log(
        `[batch ${batch + 1}] short batch — assuming queue drained; stopping.`,
      );
      queueDrained = true;
      break;
    }
  }

  if (!queueDrained && result.batchesRun >= options.maxBatches) {
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
    typeof provenance.data_classification === "string"
      ? provenance.data_classification
      : typeof meta.data_classification === "string"
        ? meta.data_classification
        : undefined;
  const recordKind =
    typeof meta.record_kind === "string"
      ? meta.record_kind
      : typeof provenance.record_kind === "string"
        ? provenance.record_kind
        : "unknown";
  const sourceDoc =
    typeof row.source_doc === "string" && row.source_doc.length > 0
      ? row.source_doc
      : typeof provenance.source_doc === "string"
        ? provenance.source_doc
        : undefined;
  const confidenceRaw =
    typeof provenance.confidence === "number"
      ? provenance.confidence
      : undefined;
  return {
    id: row.chunk_id,
    vector: embedding,
    metadata: {
      tenant_key: row.tenant_key,
      record_kind: recordKind,
      source_segment: row.source_segment_id ?? "",
      record_id: row.source_record_id ?? "",
      ...(typeof confidenceRaw === "number"
        ? { confidence: confidenceRaw }
        : {}),
      ...(dataClassification
        ? { data_classification: dataClassification }
        : {}),
      ...(typeof row.chunk_index === "number"
        ? { chunk_index: row.chunk_index }
        : {}),
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
    .from("enterprise_context_chunks")
    .select(
      "chunk_id, tenant_key, chunk_text, source_segment_id, source_record_id, " +
        "source_doc, chunk_index, chunk_metadata, provenance, client_id",
    )
    .eq("embedding_status", "pending");
  if (options.tenantKey) {
    q = q.eq("tenant_key", options.tenantKey);
  }
  const { data, error } = await q
    .order("tenant_key")
    .order("chunk_id")
    .limit(options.batchSize);
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
    .from("enterprise_context_chunks")
    .update({
      embedding,
      embedding_vector: toPgVectorLiteral(embedding),
      embedding_dim: EMBEDDING_DIM,
      embedding_model: EMBEDDING_MODEL,
      embedding_status: "embedded",
      embedded_at: new Date().toISOString(),
      embedding_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_key", row.tenant_key)
    .eq("chunk_id", row.chunk_id);
  const { error } = await update;
  return error ? error.message : null;
}

function toPgVectorLiteral(embedding: number[]): string {
  if (embedding.length !== EMBEDDING_DIM) {
    throw new Error(
      `embedding_vector dimension mismatch: expected ${EMBEDDING_DIM}, got ${embedding.length}`,
    );
  }
  return `[${embedding.map((value) => Number(value).toString()).join(",")}]`;
}

async function markFailed(
  supabase: SupabaseLike,
  row: PendingChunkRow,
  message: string,
  log: (msg: string) => void,
): Promise<void> {
  const update = supabase
    .from("enterprise_context_chunks")
    .update({
      embedding_status: "failed",
      embedding_error: message.slice(0, 1000),
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_key", row.tenant_key)
    .eq("chunk_id", row.chunk_id);
  const { error } = await update;
  if (error) {
    log(`  failed to record error for ${row.chunk_id}: ${error.message}`);
  }
}

const CHUNK_TABLE = "enterprise_context_chunks";
const SELECTABLE_CHUNK_COLUMNS = new Set([
  "chunk_id",
  "tenant_key",
  "client_id",
  "chunk_text",
  "source_segment_id",
  "source_record_id",
  "source_doc",
  "chunk_index",
  "chunk_metadata",
  "provenance",
]);
const FILTERABLE_CHUNK_COLUMNS = new Set([
  "tenant_key",
  "chunk_id",
  "embedding_status",
]);
const UPDATEABLE_CHUNK_COLUMNS = new Set([
  "embedding",
  "embedding_vector",
  "embedding_dim",
  "embedding_model",
  "embedding_status",
  "embedded_at",
  "embedding_error",
  "updated_at",
]);

function assertKnownColumn(column: string, allowed: Set<string>): void {
  if (!allowed.has(column)) {
    throw new Error(`unsupported enterprise_context_chunks column: ${column}`);
  }
}

function parseSelectColumns(cols: string): string[] {
  const columns = cols
    .split(",")
    .map((col) => col.trim())
    .filter(Boolean);
  for (const column of columns) {
    assertKnownColumn(column, SELECTABLE_CHUNK_COLUMNS);
  }
  return columns;
}

function quoteIdent(identifier: string): string {
  return `"${identifier.replace(/"/g, '""')}"`;
}

function normalizeUpdateValue(column: string, value: unknown): unknown {
  if (column === "embedding") {
    return JSON.stringify(value);
  }
  return value;
}

function updateCast(column: string): string {
  if (column === "embedding") return "::jsonb";
  if (column === "embedding_vector") return "::vector";
  return "";
}

function getPostgresClient(): CloseableSupabaseLike {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required for --postgres-only.");
  }
  const pool = new Pool(
    runtimePostgresPoolConfig(
      connectionString,
      "embed-pending-enterprise-context-chunks",
    ),
  );

  const from = (table: string): SupabaseQueryBuilder => {
    if (table !== CHUNK_TABLE) {
      throw new Error(`unsupported table for Postgres embedding adapter: ${table}`);
    }

    return {
      select(cols: string): SupabaseSelectBuilder {
        const selectedColumns = parseSelectColumns(cols);
        const filters: Array<{ column: string; value: string }> = [];
        const builder: SupabaseSelectBuilder = {
          eq(col: string, val: string) {
            assertKnownColumn(col, FILTERABLE_CHUNK_COLUMNS);
            filters.push({ column: col, value: val });
            return builder;
          },
          order(_col: string) {
            return builder;
          },
          async limit(n: number) {
            const values: unknown[] = [];
            const where = filters.map(({ column, value }) => {
              values.push(value);
              return `${quoteIdent(column)} = $${values.length}`;
            });
            values.push(n);
            const sql = `
              select ${selectedColumns.map(quoteIdent).join(", ")}
                from public.enterprise_context_chunks
               ${where.length > 0 ? `where ${where.join(" and ")}` : ""}
               order by tenant_key, chunk_id
               limit $${values.length}
            `;
            try {
              const result = await pool.query<PendingChunkRow>(sql, values);
              return { data: result.rows, error: null };
            } catch (error) {
              return {
                data: null,
                error: {
                  message: error instanceof Error ? error.message : String(error),
                },
              };
            }
          },
        };
        return builder;
      },
      update(values: Record<string, unknown>): SupabaseUpdateBuilder {
        const filters: Array<{ column: string; value: string }> = [];
        const builder = {
          eq(col: string, val: string) {
            assertKnownColumn(col, FILTERABLE_CHUNK_COLUMNS);
            filters.push({ column: col, value: val });
            return builder as SupabaseUpdateBuilder & Promise<{
              error: { message: string } | null;
            }>;
          },
          then(
            onFulfilled: (v: {
              error: { message: string } | null;
            }) => unknown,
          ) {
            return (async () => {
              const entries = Object.entries(values);
              for (const [column] of entries) {
                assertKnownColumn(column, UPDATEABLE_CHUNK_COLUMNS);
              }
              if (entries.length === 0) return { error: null };

              const params: unknown[] = [];
              const sets = entries.map(([column, value]) => {
                params.push(normalizeUpdateValue(column, value));
                return `${quoteIdent(column)} = $${params.length}${updateCast(column)}`;
              });
              const where = filters.map(({ column, value }) => {
                params.push(value);
                return `${quoteIdent(column)} = $${params.length}`;
              });
              const sql = `
                update public.enterprise_context_chunks
                   set ${sets.join(", ")}
                 ${where.length > 0 ? `where ${where.join(" and ")}` : ""}
              `;
              try {
                await pool.query(sql, params);
                return { error: null };
              } catch (error) {
                return {
                  error: {
                    message:
                      error instanceof Error ? error.message : String(error),
                  },
                };
              }
            })().then(onFulfilled);
          },
        };
        return builder as SupabaseUpdateBuilder;
      },
    };
  };

  return {
    from,
    close: () => pool.end(),
  };
}

// ---------------------------------------------------------------------------
// Default Supabase client wrapper (typed against `SupabaseLike`).
// ---------------------------------------------------------------------------

function getSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.",
    );
  }
  return createClient(url.trim(), key.trim(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

export async function main(
  argv: string[] = process.argv.slice(2),
): Promise<EmbedRunResult> {
  loadEnv({ path: path.resolve(process.cwd(), ".env.local") });
  loadEnv({ path: "/Users/anand/Projects/nexus/.env.local" });
  loadEnv();

  const args = parseArgs(argv);
  const batchSize = readPositiveInt("EMBEDDING_BATCH_SIZE", 100);
  const maxBatches = readPositiveInt("EMBEDDING_MAX_BATCHES", 10);
  const hardCap = batchSize * maxBatches;

  const pineconeKeyPresent = Boolean(process.env.PINECONE_API_KEY);
  const pineconeMode = args.dryRun
    ? "skipped (dry run)"
    : args.postgresOnly
      ? "skipped (--postgres-only)"
      : pineconeKeyPresent
        ? "enabled"
        : "skipped (no PINECONE_API_KEY)";

  console.log("────────────────────────────────────────────────────────────");
  console.log(" CB-2 / CB-3 · embed-pending-chunks");
  console.log("────────────────────────────────────────────────────────────");
  console.log(` model           : ${EMBEDDING_MODEL} (${EMBEDDING_DIM} dims)`);
  console.log(` batch size      : ${batchSize}`);
  console.log(` max batches     : ${maxBatches}`);
  console.log(` hard cap        : ${hardCap} chunk(s) per run`);
  console.log(` tenant filter   : ${args.tenantKey ?? "(all)"}`);
  console.log(` dry run         : ${args.dryRun ? "YES" : "no"}`);
  console.log(` postgres only   : ${args.postgresOnly ? "YES" : "no"}`);
  console.log(` pinecone        : ${pineconeMode}`);
  if (!args.dryRun && !args.postgresOnly && pineconeKeyPresent) {
    console.log(
      ` pinecone index  : ${resolvePineconeIndexConfig(args.tenantKey).name}`,
    );
  }
  console.log(
    ` ceiling cost*   : ~$${estimateCostUsd(hardCap * 500).toFixed(4)}  (assumes ~500 tok/chunk)`,
  );
  console.log("────────────────────────────────────────────────────────────");

  if (!args.dryRun && !process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required for non-dry-run executions.");
  }

  const supabase: CloseableSupabaseLike =
    args.postgresOnly && process.env.DATABASE_URL
      ? getPostgresClient()
      : (getSupabaseClient() as unknown as SupabaseLike);
  const result = await runEmbedJob(supabase, {
    batchSize,
    maxBatches,
    tenantKey: args.tenantKey,
    dryRun: args.dryRun,
    postgresOnly: args.postgresOnly,
  }).finally(async () => {
    await supabase.close?.();
  });

  console.log("────────────────────────────────────────────────────────────");
  console.log(" Summary");
  console.log("────────────────────────────────────────────────────────────");
  console.log(` embedded        : ${result.embedded}`);
  console.log(` failed          : ${result.failed}`);
  console.log(` skipped (dry)   : ${result.skipped}`);
  console.log(` batches run     : ${result.batchesRun}`);
  console.log(` tokens used     : ${result.totalTokens}`);
  console.log(` cost (actual)   : $${result.estimatedCostUsd.toFixed(6)}`);
  console.log(` pinecone upsert : ${result.pineconeUpserts}`);
  console.log(` pinecone fail   : ${result.pineconeFailures}`);
  if (result.hitMaxBatches) {
    console.log(
      " note            : hit EMBEDDING_MAX_BATCHES — re-run to continue.",
    );
  }
  console.log("────────────────────────────────────────────────────────────");

  return result;
}

// Only auto-execute when run as a CLI (not when imported by tests).
if (require.main === module) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
