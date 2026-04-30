import 'server-only';

/**
 * CB-3 · Pinecone client used by the embedding job (upsert) and the
 * Supabase tenant-data adapter (vector retrieval).
 *
 * Per `docs/build/CONTEXT_BROKER_DESIGN.md` Section 3:
 *
 * - One shared index (`abarva-tenant-context-prod` by default) holds
 *   every tenant's chunks. Tenant isolation is enforced by a
 *   `tenant_key` metadata filter on every query — the broker refuses
 *   to issue a query without the filter (see `query` below).
 * - Vectors are 1536-dim (matches `text-embedding-3-small`). Re-embeds
 *   to a different model would require a new index.
 * - `chunk_text` is NOT stored in metadata — Postgres remains the
 *   source of truth. Pinecone holds the smallest possible
 *   per-vector payload to keep the 40 KB cap comfortable.
 *
 * Environment:
 *   PINECONE_API_KEY      — required for `getPineconeClient()` to return non-null
 *   PINECONE_INDEX_NAME   — optional; defaults to `abarva-tenant-context-prod`
 *
 * Index creation is OUT of scope. The PR description in CB-3 has the
 * one-time manual setup steps (dim 1536, metric cosine, serverless).
 *
 * Singleton: `getPineconeClient()` caches the client + index handle for
 * the life of the process. Tests can pass an injected client into
 * `createPineconeClientForTests` without touching the singleton.
 */

import { Pinecone, type Index, type RecordMetadata } from '@pinecone-database/pinecone';

/** Single shared index name; overridable via env per environment. */
const DEFAULT_INDEX_NAME = 'abarva-tenant-context-prod';

/** Pinecone-recommended batch size for upsert. */
const UPSERT_BATCH_SIZE = 100;

/** Cap on `topK` per query — keeps query cost bounded. */
const MAX_TOP_K = 100;
const DEFAULT_TOP_K = 10;

// ── Public types ──────────────────────────────────────────────────────

export interface PineconeConfig {
  apiKey: string;
  indexName: string;
}

/**
 * Metadata stored alongside each vector. Pinecone stores metadata as
 * a flat map of strings / numbers / booleans / string-arrays. We
 * normalise to strings on upsert and parse back on query so the
 * client surface is uniform.
 */
export interface PineconeUpsertMetadata {
  /** Required. Used as the broker's tenant-isolation filter on every query. */
  tenant_key: string;
  /** e.g. `kpi_definition`, `program_record`, `systems_inventory`. */
  record_kind: string;
  /** segment_id (e.g. `kpi_dictionary`). */
  source_segment: string;
  /** Source record id (composite). */
  record_id: string;
  /** 0..1; optional. */
  confidence?: number;
  /** `public` | `internal` | `confidential` | `restricted`; optional. */
  data_classification?: string;
  /** 0-based; optional. */
  chunk_index?: number;
  /** Source document, if known. */
  source_doc?: string;
}

export interface PineconeUpsertItem {
  /** chunk_id — stable, idempotent across re-embeds. */
  id: string;
  /** 1536-dim vector. */
  vector: number[];
  metadata: PineconeUpsertMetadata;
}

export interface PineconeQueryResult {
  id: string;
  /** Cosine similarity 0..1. */
  score: number;
  metadata: PineconeUpsertMetadata;
}

export interface PineconeQueryArgs {
  vector: number[];
  tenantKey: string;
  topK?: number;
  /** Additional metadata predicates ANDed with the tenant_key filter. */
  metadataFilter?: Record<string, unknown>;
}

export interface PineconeClient {
  /** Upsert chunks to the index. Batches at 100 vectors per API call. */
  upsert(items: PineconeUpsertItem[]): Promise<{ upsertedCount: number }>;
  /** Query the index with tenant-isolated metadata filter. */
  query(args: PineconeQueryArgs): Promise<PineconeQueryResult[]>;
  /** Delete chunks by id (e.g. when an attachment is removed). */
  deleteByIds(ids: string[]): Promise<void>;
  /** Delete all chunks for a tenant (e.g. tenant offboarding). */
  deleteByTenant(tenantKey: string): Promise<void>;
}

// ── Internal helpers ──────────────────────────────────────────────────

/**
 * Subset of the Pinecone Index surface we depend on. Lets tests inject
 * a hand-rolled fake without instantiating the real SDK or relying on
 * Jest module mocking.
 */
export interface PineconeIndexLike {
  upsert(records: Array<{ id: string; values: number[]; metadata?: RecordMetadata }>): Promise<void>;
  query(options: {
    vector: number[];
    topK: number;
    includeMetadata?: boolean;
    filter?: object;
  }): Promise<{
    matches?: Array<{
      id: string;
      score?: number;
      metadata?: RecordMetadata;
    }>;
  }>;
  deleteMany(options: { ids?: string[]; filter?: object }): Promise<void>;
}

function chunkArray<T>(input: T[], size: number): T[][] {
  if (size <= 0) {
    throw new Error(`chunkArray: size must be > 0; got ${size}`);
  }
  const out: T[][] = [];
  for (let i = 0; i < input.length; i += size) {
    out.push(input.slice(i, i + size));
  }
  return out;
}

/**
 * Pinecone's metadata is `Record<string, string | number | boolean | string[]>`.
 * We pass through numbers/booleans natively (they round-trip cleanly)
 * and drop undefined fields so the per-vector payload stays minimal.
 */
function toRecordMetadata(meta: PineconeUpsertMetadata): RecordMetadata {
  const out: RecordMetadata = {
    tenant_key: meta.tenant_key,
    record_kind: meta.record_kind,
    source_segment: meta.source_segment,
    record_id: meta.record_id,
  };
  if (typeof meta.confidence === 'number' && Number.isFinite(meta.confidence)) {
    out.confidence = meta.confidence;
  }
  if (meta.data_classification) {
    out.data_classification = meta.data_classification;
  }
  if (typeof meta.chunk_index === 'number' && Number.isFinite(meta.chunk_index)) {
    out.chunk_index = meta.chunk_index;
  }
  if (meta.source_doc) {
    out.source_doc = meta.source_doc;
  }
  return out;
}

function fromRecordMetadata(meta: RecordMetadata | undefined): PineconeUpsertMetadata {
  const m = (meta ?? {}) as Record<string, unknown>;
  const tenantKey = typeof m.tenant_key === 'string' ? m.tenant_key : '';
  const recordKind = typeof m.record_kind === 'string' ? m.record_kind : '';
  const sourceSegment = typeof m.source_segment === 'string' ? m.source_segment : '';
  const recordId = typeof m.record_id === 'string' ? m.record_id : '';
  const out: PineconeUpsertMetadata = {
    tenant_key: tenantKey,
    record_kind: recordKind,
    source_segment: sourceSegment,
    record_id: recordId,
  };
  if (typeof m.confidence === 'number') out.confidence = m.confidence;
  if (typeof m.data_classification === 'string') out.data_classification = m.data_classification;
  if (typeof m.chunk_index === 'number') out.chunk_index = m.chunk_index;
  if (typeof m.source_doc === 'string') out.source_doc = m.source_doc;
  return out;
}

// ── Implementation ────────────────────────────────────────────────────

class PineconeClientImpl implements PineconeClient {
  constructor(
    private readonly index: PineconeIndexLike,
    private readonly indexName: string,
  ) {}

  async upsert(items: PineconeUpsertItem[]): Promise<{ upsertedCount: number }> {
    if (items.length === 0) return { upsertedCount: 0 };

    // Validate dim once — the index is created at 1536, so a wrong dim
    // would throw on the first call anyway. Surfacing eagerly gives a
    // clearer error than the SDK's generic shape-mismatch.
    for (const item of items) {
      if (!Array.isArray(item.vector) || item.vector.length === 0) {
        throw new Error(`PineconeClient.upsert: item ${item.id} has no vector`);
      }
      if (!item.id || typeof item.id !== 'string') {
        throw new Error('PineconeClient.upsert: item id must be a non-empty string');
      }
      if (!item.metadata.tenant_key) {
        throw new Error(
          `PineconeClient.upsert: item ${item.id} missing required metadata.tenant_key`,
        );
      }
    }

    let upsertedCount = 0;
    for (const batch of chunkArray(items, UPSERT_BATCH_SIZE)) {
      const records = batch.map((item) => ({
        id: item.id,
        values: item.vector,
        metadata: toRecordMetadata(item.metadata),
      }));
      await this.index.upsert(records);
      upsertedCount += batch.length;
    }
    return { upsertedCount };
  }

  async query(args: PineconeQueryArgs): Promise<PineconeQueryResult[]> {
    if (!args.tenantKey) {
      throw new Error('PineconeClient.query: tenantKey is required for tenant isolation.');
    }
    if (!Array.isArray(args.vector) || args.vector.length === 0) {
      throw new Error('PineconeClient.query: vector is required.');
    }
    const topK = Math.min(MAX_TOP_K, Math.max(1, args.topK ?? DEFAULT_TOP_K));

    // Tenant-isolation filter is non-negotiable. Caller-supplied
    // additional predicates are ANDed in.
    const filter: Record<string, unknown> = {
      tenant_key: { $eq: args.tenantKey },
      ...(args.metadataFilter ?? {}),
    };

    const result = await this.index.query({
      vector: args.vector,
      topK,
      includeMetadata: true,
      filter,
    });

    const matches = result.matches ?? [];
    return matches.map((match) => ({
      id: match.id,
      score: typeof match.score === 'number' ? match.score : 0,
      metadata: fromRecordMetadata(match.metadata),
    }));
  }

  async deleteByIds(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    // Pinecone accepts large id lists in a single deleteMany call;
    // batch defensively to keep payloads predictable.
    for (const batch of chunkArray(ids, UPSERT_BATCH_SIZE)) {
      await this.index.deleteMany({ ids: batch });
    }
  }

  async deleteByTenant(tenantKey: string): Promise<void> {
    if (!tenantKey) {
      throw new Error('PineconeClient.deleteByTenant: tenantKey is required.');
    }
    await this.index.deleteMany({
      filter: { tenant_key: { $eq: tenantKey } },
    });
  }

  /** For tests / debug logs. */
  getIndexName(): string {
    return this.indexName;
  }
}

// ── Factory + singleton ───────────────────────────────────────────────

let cachedClient: PineconeClient | null = null;

function readIndexName(): string {
  return process.env.PINECONE_INDEX_NAME?.trim() || DEFAULT_INDEX_NAME;
}

/**
 * Returns a process-wide cached `PineconeClient`, or `null` if
 * `PINECONE_API_KEY` is not set. Callers that depend on Pinecone
 * (chunksByVector, embedding job's vector upsert) check for null and
 * either throw or skip gracefully.
 */
export function getPineconeClient(): PineconeClient | null {
  if (cachedClient) return cachedClient;
  const apiKey = process.env.PINECONE_API_KEY?.trim();
  if (!apiKey) return null;
  const indexName = readIndexName();
  const pinecone = new Pinecone({ apiKey });
  const index: Index<RecordMetadata> = pinecone.index(indexName);
  cachedClient = new PineconeClientImpl(index as unknown as PineconeIndexLike, indexName);
  return cachedClient;
}

/**
 * Test seam — builds a client around a hand-rolled `PineconeIndexLike`
 * fake. Not exported through the package barrel; only the test file
 * should call this.
 */
export function createPineconeClientForTests(
  index: PineconeIndexLike,
  indexName: string = DEFAULT_INDEX_NAME,
): PineconeClient {
  return new PineconeClientImpl(index, indexName);
}

/** Test seam — clear the cached singleton between cases. */
export function __resetPineconeClientForTests(): void {
  cachedClient = null;
}

/** Exposed for tests + the embedding script's logging. */
export const PINECONE_DEFAULT_INDEX_NAME = DEFAULT_INDEX_NAME;
export const PINECONE_UPSERT_BATCH_SIZE = UPSERT_BATCH_SIZE;
export const PINECONE_MAX_TOP_K = MAX_TOP_K;
export const PINECONE_DEFAULT_TOP_K = DEFAULT_TOP_K;
