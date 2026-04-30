import 'server-only';

/**
 * INT-WV-2 · Worldview retrieval module.
 *
 * Queries the `abarva-worldview-prod` Pinecone index (3072-dim,
 * text-embedding-3-large) populated by INT-WV-1 from
 * `worldview/pinecone-ready/W*_pinecone.json`.
 *
 * Tenant-isolation note: worldview content is corpus-wide (not
 * tenant-scoped). The index has no `tenant_key` filter; queries
 * may optionally filter by audience tags or thesis_id.
 *
 * Boundary: server-only. Used by the broker; not imported by
 * app-tier code.
 */

import { Pinecone, type Index, type RecordMetadata } from '@pinecone-database/pinecone';

import type { WorldviewChunkHit } from './types';

const DEFAULT_INDEX_NAME = 'abarva-worldview-prod';
const DEFAULT_NAMESPACE = 'worldview';
const DEFAULT_TOP_K = 6;
const MAX_TOP_K = 50;
const EMBEDDING_DIM = 3072;

function readIndexName(): string {
  return (
    process.env.WORLDVIEW_INDEX_NAME?.trim() ||
    DEFAULT_INDEX_NAME
  );
}

// ── Client cache ─────────────────────────────────────────────────────────────

let cachedPinecone: Pinecone | null = null;
let cachedIndex: Index<RecordMetadata> | null = null;
let cachedConfigKey: string | null = null;

function buildConfigKey(): string {
  // Cache key invalidates when the index name or API key changes
  // between calls (rare, but matters in tests).
  return `${process.env.PINECONE_API_KEY?.slice(0, 6) ?? ''}:${readIndexName()}`;
}

function getIndex(): Index<RecordMetadata> | null {
  const apiKey = process.env.PINECONE_API_KEY?.trim();
  if (!apiKey) return null;
  const key = buildConfigKey();
  if (cachedIndex && cachedConfigKey === key) return cachedIndex;
  cachedPinecone = new Pinecone({ apiKey });
  cachedIndex = cachedPinecone.index(readIndexName()) as Index<RecordMetadata>;
  cachedConfigKey = key;
  return cachedIndex;
}

// ── Query ────────────────────────────────────────────────────────────────────

export interface WorldviewQueryArgs {
  /** Pre-computed query embedding (3072-dim). The broker embeds the
   *  user query once and reuses the same vector for both indexes
   *  when dimensions match — which is NOT the case here (worldview is
   *  3072-dim; tenant context is 1536-dim), so the broker re-embeds
   *  the query through text-embedding-3-large for this call. */
  queryVector: number[];
  /** Top-K (default 6, hard ceiling 50). */
  topK?: number;
  /** Optional audience filter (`cio`, `investor`, `consulting-partner`, etc.). */
  audienceFilter?: string;
  /** Optional thesis filter (`W1`..`W5`). */
  thesisFilter?: string;
  /** Optional minimum confidence (0..1). */
  minConfidence?: number;
}

export interface WorldviewRetrievalResult {
  hits: WorldviewChunkHit[];
  /** Index reached and returned hits. */
  reached: boolean;
}

/**
 * Query the worldview index. Returns `{ hits: [], reached: false }`
 * when Pinecone is not configured (no API key) so callers can
 * surface a "worldview retrieval pending" warning without throwing.
 *
 * Throws on dimension mismatch (the queryVector must be 3072-dim) —
 * that's a programmer error, not a config gap.
 */
export async function queryWorldviewChunks(
  args: WorldviewQueryArgs,
): Promise<WorldviewRetrievalResult> {
  if (args.queryVector.length !== EMBEDDING_DIM) {
    throw new Error(
      `queryWorldviewChunks: expected ${EMBEDDING_DIM}-dim vector, got ${args.queryVector.length}`,
    );
  }

  const index = getIndex();
  if (!index) {
    return { hits: [], reached: false };
  }

  const topK = clamp(args.topK ?? DEFAULT_TOP_K, 1, MAX_TOP_K);
  const filter = buildFilter(args);

  let result;
  try {
    result = await index.namespace(DEFAULT_NAMESPACE).query({
      vector: args.queryVector,
      topK,
      includeMetadata: true,
      ...(filter ? { filter } : {}),
    });
  } catch {
    // Network / index-not-found / auth errors all collapse to
    // "not reached"; the broker surfaces this as a warning.
    return { hits: [], reached: false };
  }

  const matches = result.matches ?? [];
  const hits: WorldviewChunkHit[] = matches.map((m) => parseHit(m));
  return { hits, reached: true };
}

function buildFilter(args: WorldviewQueryArgs): Record<string, unknown> | null {
  const filters: Record<string, unknown> = {};
  if (args.audienceFilter) {
    // Pinecone metadata filter: audience_tags is a string-array; use $in
    filters.audience_tags = { $in: [args.audienceFilter] };
  }
  if (args.thesisFilter) {
    filters.thesis_id = { $eq: args.thesisFilter };
  }
  if (typeof args.minConfidence === 'number') {
    filters.confidence = { $gte: args.minConfidence };
  }
  return Object.keys(filters).length > 0 ? filters : null;
}

interface PineconeMatch {
  id: string;
  score?: number;
  metadata?: RecordMetadata;
}

function parseHit(match: PineconeMatch): WorldviewChunkHit {
  const m = (match.metadata ?? {}) as Record<string, unknown>;
  const hit: WorldviewChunkHit = {
    chunkId: typeof m.chunk_id === 'string' ? m.chunk_id : match.id,
    thesisId: typeof m.thesis_id === 'string' ? m.thesis_id : 'W?',
    score: typeof match.score === 'number' ? match.score : 0,
  };
  if (typeof m.thesis_title === 'string') hit.thesisTitle = m.thesis_title;
  if (typeof m.chunk_position === 'number') hit.chunkPosition = m.chunk_position;
  if (typeof m.chunk_title === 'string') hit.chunkTitle = m.chunk_title;
  if (typeof m.chunk_type === 'string') hit.chunkType = m.chunk_type;
  if (typeof m.primary_audience === 'string') hit.primaryAudience = m.primary_audience;
  if (Array.isArray(m.audience_tags)) {
    hit.audienceTags = m.audience_tags.filter((s): s is string => typeof s === 'string');
  }
  if (typeof m.confidence === 'number') hit.confidence = m.confidence;
  if (typeof m.is_forecast === 'boolean') hit.isForecast = m.is_forecast;
  return hit;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ── Test seam ────────────────────────────────────────────────────────────────
//
// Tests can swap in a fake retrieval that bypasses Pinecone.

export type WorldviewRetriever = (
  args: WorldviewQueryArgs,
) => Promise<WorldviewRetrievalResult>;

let injectedRetriever: WorldviewRetriever | null = null;

export function setWorldviewRetrieverForTests(
  retriever: WorldviewRetriever | null,
): void {
  injectedRetriever = retriever;
}

export async function callWorldviewRetriever(
  args: WorldviewQueryArgs,
): Promise<WorldviewRetrievalResult> {
  if (injectedRetriever) return injectedRetriever(args);
  return queryWorldviewChunks(args);
}
