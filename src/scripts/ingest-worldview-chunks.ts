/**
 * INT-WV-1 · Worldview corpus ingestion.
 *
 * Reads `worldview/pinecone-ready/W*_pinecone.json` (Codex's output
 * from PR #1252) and:
 *   1. Calls OpenAI's text-embedding-3-large to embed each chunk
 *      (3072 dims).
 *   2. Upserts the embeddings to Pinecone's `abarva-worldview-prod`
 *      index (3072-dim, cosine, serverless).
 *
 * Per founder direction 2026-04-30: worldview content uses a separate
 * 3072-dim index from the tenant-context (1536-dim) index. The broker
 * queries both indexes separately and merges results into the 4-mode
 * bundle (INT-WV-2).
 *
 * Usage:
 *   npm run ingest:worldview                        # all 82 chunks, real run
 *   npm run ingest:worldview -- --dry-run           # show what would run
 *   npm run ingest:worldview -- --thesis W1         # single thesis
 *
 * Env:
 *   OPENAI_API_KEY            required
 *   PINECONE_API_KEY          required
 *   WORLDVIEW_INDEX_NAME      optional; defaults to abarva-worldview-prod
 *   WORLDVIEW_BATCH_SIZE      default 50 (chunks per OpenAI call)
 *
 * Idempotent: chunk_id is the upsert key, so re-running overwrites.
 */

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
// Worktrees don't have their own .env.local; fall back to the parent
// repo's so the script works from either location.
loadEnv({ path: '/Users/anand/Projects/nexus/.env.local' });
loadEnv();

// ── Types ─────────────────────────────────────────────────────────────────────

interface WorldviewChunk {
  chunk_id: string;
  chunk_text: string;
  metadata: {
    thesis_id: string;
    thesis_title?: string;
    chunk_position?: number;
    chunk_total_in_thesis?: number;
    chunk_title?: string;
    chunk_type?: string;
    primary_audience?: string;
    audience_tags?: string[];
    keywords?: string[];
    confidence?: number;
    is_forecast?: boolean;
    last_validated?: string;
    [key: string]: unknown;
  };
}

interface WorldviewBundleFile {
  thesis_id: string;
  thesis_title: string;
  embedding_model_target: string;
  embedding_dimension_target: number;
  pinecone_namespace: string;
  total_chunks: number;
  chunks: WorldviewChunk[];
}

// ── Config ────────────────────────────────────────────────────────────────────

const EMBEDDING_MODEL = 'text-embedding-3-large';
const EMBEDDING_DIM = 3072;
const DEFAULT_INDEX_NAME = 'abarva-worldview-prod';
const DEFAULT_PINECONE_NAMESPACE = 'worldview';
const DEFAULT_BATCH_SIZE = 50;
const PINECONE_UPSERT_BATCH = 100;
const WORLDVIEW_DIR = 'worldview/pinecone-ready';

// ── CLI args ──────────────────────────────────────────────────────────────────

interface CliOptions {
  dryRun: boolean;
  thesisFilter: string | null;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const thesisIdx = args.indexOf('--thesis');
  const thesisFilter = thesisIdx >= 0 ? args[thesisIdx + 1] ?? null : null;
  return { dryRun, thesisFilter };
}

function resolveIndexName(): string {
  return (
    process.env.WORLDVIEW_INDEX_NAME?.trim() ||
    DEFAULT_INDEX_NAME
  );
}

function resolveBatchSize(): number {
  const v = parseInt(process.env.WORLDVIEW_BATCH_SIZE ?? '', 10);
  return Number.isFinite(v) && v > 0 && v <= 200 ? v : DEFAULT_BATCH_SIZE;
}

// ── Loaders ───────────────────────────────────────────────────────────────────

async function listBundleFiles(): Promise<string[]> {
  const root = path.resolve(process.cwd(), WORLDVIEW_DIR);
  const entries = await readdir(root);
  return entries
    .filter((e) => /^W\d+_pinecone\.json$/.test(e))
    .sort()
    .map((e) => path.join(root, e));
}

async function loadBundle(file: string): Promise<WorldviewBundleFile> {
  const raw = await readFile(file, 'utf8');
  const json = JSON.parse(raw) as WorldviewBundleFile;
  if (json.embedding_dimension_target !== EMBEDDING_DIM) {
    throw new Error(
      `${file}: embedding_dimension_target=${json.embedding_dimension_target}, expected ${EMBEDDING_DIM}`,
    );
  }
  if (json.embedding_model_target !== EMBEDDING_MODEL) {
    throw new Error(
      `${file}: embedding_model_target=${json.embedding_model_target}, expected ${EMBEDDING_MODEL}`,
    );
  }
  return json;
}

// ── Embedding ─────────────────────────────────────────────────────────────────

async function embedBatch(
  openai: OpenAI,
  texts: string[],
): Promise<number[][]> {
  const res = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts,
    encoding_format: 'float',
  });
  // Sort by index to preserve input order (OpenAI guarantees it but
  // belt-and-braces).
  return [...res.data]
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding as number[]);
}

// ── Metadata flattening for Pinecone ─────────────────────────────────────────
//
// Pinecone metadata must be string | number | boolean | string[]. The
// chunk metadata is rich (citations, entities_referenced, related_chunks);
// we keep what's filterable and skip the rest. Full chunk content stays
// in the bundle JSON (committed to repo) so retrieval can join back.

function buildPineconeMetadata(
  chunk: WorldviewChunk,
): Record<string, string | number | boolean | string[]> {
  const m = chunk.metadata;
  const out: Record<string, string | number | boolean | string[]> = {
    chunk_id: chunk.chunk_id,
    thesis_id: m.thesis_id,
  };
  if (m.thesis_title) out.thesis_title = m.thesis_title;
  if (typeof m.chunk_position === 'number') out.chunk_position = m.chunk_position;
  if (m.chunk_title) out.chunk_title = m.chunk_title;
  if (m.chunk_type) out.chunk_type = m.chunk_type;
  if (m.primary_audience) out.primary_audience = m.primary_audience;
  if (Array.isArray(m.audience_tags) && m.audience_tags.length > 0) {
    out.audience_tags = m.audience_tags.filter((s) => typeof s === 'string');
  }
  if (Array.isArray(m.keywords) && m.keywords.length > 0) {
    out.keywords = m.keywords.filter((s) => typeof s === 'string');
  }
  if (typeof m.confidence === 'number') out.confidence = m.confidence;
  if (typeof m.is_forecast === 'boolean') out.is_forecast = m.is_forecast;
  if (m.last_validated) out.last_validated = String(m.last_validated);
  return out;
}

// ── Main ──────────────────────────────────────────────────────────────────────

interface RunResult {
  files: number;
  chunks: number;
  embedded: number;
  upserted: number;
  failed: number;
  skipped: number;
}

async function main(): Promise<RunResult> {
  const opts = parseArgs();
  const indexName = resolveIndexName();
  const batchSize = resolveBatchSize();

  const result: RunResult = { files: 0, chunks: 0, embedded: 0, upserted: 0, failed: 0, skipped: 0 };

  console.log('────────────────────────────────────────────────────────────');
  console.log(' Worldview corpus ingestion · INT-WV-1');
  console.log(`  embedding model   : ${EMBEDDING_MODEL} (${EMBEDDING_DIM}d)`);
  console.log(`  pinecone index    : ${indexName}`);
  console.log(`  batch size        : ${batchSize}`);
  console.log(`  thesis filter     : ${opts.thesisFilter ?? '(all)'}`);
  console.log(`  dry run           : ${opts.dryRun ? 'YES' : 'no'}`);
  console.log('────────────────────────────────────────────────────────────');

  const files = await listBundleFiles();
  if (files.length === 0) {
    throw new Error(`No worldview bundle files in ${WORLDVIEW_DIR}/`);
  }

  // Load all bundles up front.
  const bundles: WorldviewBundleFile[] = [];
  for (const file of files) {
    const b = await loadBundle(file);
    if (opts.thesisFilter && b.thesis_id !== opts.thesisFilter) {
      console.log(`[${b.thesis_id}] skipped by --thesis filter`);
      result.skipped += b.chunks.length;
      continue;
    }
    bundles.push(b);
    result.files += 1;
    result.chunks += b.chunks.length;
    console.log(`[${b.thesis_id}] ${b.chunks.length} chunks loaded from ${path.basename(file)}`);
  }

  if (opts.dryRun) {
    console.log(`\nDRY RUN — would embed ${result.chunks} chunks; exiting.`);
    return result;
  }

  // Init clients.
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY?.trim() });
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is required.');
  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY?.trim() ?? '',
  });
  if (!process.env.PINECONE_API_KEY) throw new Error('PINECONE_API_KEY is required.');
  const index = pinecone.index(indexName);

  // Flatten all chunks across thesis bundles into one ordered list.
  // Embedding order is preserved by chunk_id.
  const allChunks: WorldviewChunk[] = bundles.flatMap((b) => b.chunks);

  // Embed in batches.
  const embeddings = new Map<string, number[]>();
  for (let i = 0; i < allChunks.length; i += batchSize) {
    const batch = allChunks.slice(i, i + batchSize);
    const texts = batch.map((c) => c.chunk_text);
    try {
      const vectors = await embedBatch(openai, texts);
      if (vectors.length !== batch.length) {
        throw new Error(`OpenAI returned ${vectors.length} vectors for ${batch.length} chunks`);
      }
      for (let j = 0; j < batch.length; j += 1) {
        const v = vectors[j];
        if (!Array.isArray(v) || v.length !== EMBEDDING_DIM) {
          console.error(`  bad vector for ${batch[j]!.chunk_id}: dim=${v?.length}`);
          result.failed += 1;
          continue;
        }
        embeddings.set(batch[j]!.chunk_id, v);
        result.embedded += 1;
      }
      console.log(
        `[embed] batch ${Math.floor(i / batchSize) + 1}: embedded ${batch.length} (total=${result.embedded})`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  embedding batch ${Math.floor(i / batchSize) + 1} failed: ${msg}`);
      result.failed += batch.length;
    }
  }

  // Upsert to Pinecone in batches of 100.
  const records = allChunks
    .filter((c) => embeddings.has(c.chunk_id))
    .map((c) => ({
      id: c.chunk_id,
      values: embeddings.get(c.chunk_id)!,
      metadata: buildPineconeMetadata(c),
    }));

  for (let i = 0; i < records.length; i += PINECONE_UPSERT_BATCH) {
    const batch = records.slice(i, i + PINECONE_UPSERT_BATCH);
    try {
      // Pinecone SDK v7 requires { records: [...] }, not positional [].
      await index.namespace(DEFAULT_PINECONE_NAMESPACE).upsert({ records: batch });
      result.upserted += batch.length;
      console.log(
        `[upsert] batch ${Math.floor(i / PINECONE_UPSERT_BATCH) + 1}: upserted ${batch.length} (total=${result.upserted})`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(
        `  upsert batch ${Math.floor(i / PINECONE_UPSERT_BATCH) + 1} failed: ${msg}`,
      );
      result.failed += batch.length;
    }
  }

  console.log('────────────────────────────────────────────────────────────');
  console.log(' Summary');
  console.log('────────────────────────────────────────────────────────────');
  console.log(` files            : ${result.files}`);
  console.log(` chunks loaded    : ${result.chunks}`);
  console.log(` embedded         : ${result.embedded}`);
  console.log(` pinecone upserts : ${result.upserted}`);
  console.log(` failed           : ${result.failed}`);
  console.log(` skipped          : ${result.skipped}`);
  console.log('────────────────────────────────────────────────────────────');

  return result;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
