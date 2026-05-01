import 'server-only';

/**
 * CB-3 / WV-INGEST · Multi-index Pinecone client.
 *
 * Two indexes are supported in parallel because Pinecone indexes have
 * fixed dimension and we run two embedding models:
 *
 * - `abarva-tenant-context-prod`  — 1536 dims, `text-embedding-3-small`
 *     Per-tenant chunks. Tenant isolation is enforced by a `tenant_key`
 *     metadata filter on every query — the broker refuses to issue a
 *     query without the filter (see `query` below).
 *     `chunk_text` is NOT stored in metadata — Postgres remains the
 *     source of truth. Pinecone holds the smallest possible per-vector
 *     payload to keep the 40 KB cap comfortable.
 * - `abarva-worldview-prod`       — 3072 dims, `text-embedding-3-large`
 *     Shared worldview corpus (5 theses, ~82 chunks) authored in
 *     `worldview/pinecone-ready/W*_pinecone.json`. Read across tenants;
 *     namespace `worldview`. Tenant filter is not applied — callers may
 *     filter by `thesis_id`, `chunk_type`, etc.
 *
 * Environment:
 *   PINECONE_API_KEY                  required for either index
 *   PINECONE_TENANT_INDEX_NAME        optional; defaults to `abarva-tenant-context-prod`
 *   PINECONE_WORLDVIEW_INDEX_NAME     optional; defaults to `abarva-worldview-prod`
 *   PINECONE_INDEX_NAME / PINECONE_INDEX
 *                                     legacy aliases for the tenant index name
 *
 * Index creation is OUT of scope. The PR descriptions for CB-3 (tenant)
 * and WV-INGEST (worldview) hold the one-time manual setup steps.
 *
 * Registry semantics: one underlying Pinecone connection
 * (`new Pinecone({ apiKey })`) is cached per process; per-index
 * `PineconeClient` instances are memoized by index name.
 */

import { Pinecone, type Index, type RecordMetadata } from '@pinecone-database/pinecone';

// ── Constants ─────────────────────────────────────────────────────────

/** Pinecone-recommended batch size for upsert. */
const UPSERT_BATCH_SIZE = 100;

/** Cap on `topK` per query — keeps query cost bounded. */
const MAX_TOP_K = 100;
const DEFAULT_TOP_K = 10;

const DEFAULT_TENANT_INDEX_NAME = 'abarva-tenant-context-prod';
const DEFAULT_WORLDVIEW_INDEX_NAME = 'abarva-worldview-prod';

// ── Public types ──────────────────────────────────────────────────────

export interface PineconeConfig {
  apiKey: string;
  indexName: string;
}

export type PineconeMetric = 'cosine' | 'dotproduct' | 'euclidean';

/** Mode tag — controls tenant_key enforcement and metadata shape. */
export type PineconeIndexMode = 'tenant' | 'worldview';

export interface PineconeIndexConfig {
  /** e.g. `abarva-tenant-context-prod` or `abarva-worldview-prod`. */
  name: string;
  /** 1536 (tenant) or 3072 (worldview). */
  dimension: number;
  metric: PineconeMetric;
  /** Optional Pinecone namespace; tenant uses default, worldview uses `worldview`. */
  namespace?: string;
  mode: PineconeIndexMode;
}

function readTenantIndexName(): string {
  return (
    process.env.PINECONE_TENANT_INDEX_NAME?.trim() ||
    process.env.PINECONE_INDEX_NAME?.trim() ||
    process.env.PINECONE_INDEX?.trim() ||
    DEFAULT_TENANT_INDEX_NAME
  );
}

function readWorldviewIndexName(): string {
  return (
    process.env.PINECONE_WORLDVIEW_INDEX_NAME?.trim() ||
    process.env.WORLDVIEW_INDEX_NAME?.trim() ||
    DEFAULT_WORLDVIEW_INDEX_NAME
  );
}

/** Per-tenant chunk index. CB-3's default. */
export const PINECONE_INDEX_TENANT: PineconeIndexConfig = {
  name: readTenantIndexName(),
  dimension: 1536,
  metric: 'cosine',
  mode: 'tenant',
};

/** Build a tenant-mode config for a client-owned private Pinecone index. */
export function privateTenantPineconeIndexConfig(indexName: string): PineconeIndexConfig {
  const name = indexName.trim();
  if (!name) {
    throw new Error('privateTenantPineconeIndexConfig requires a non-empty indexName');
  }
  return {
    name,
    dimension: 1536,
    metric: 'cosine',
    mode: 'tenant',
  };
}

/** Shared worldview corpus index. WV-INGEST. */
export const PINECONE_INDEX_WORLDVIEW: PineconeIndexConfig = {
  name: readWorldviewIndexName(),
  dimension: 3072,
  metric: 'cosine',
  namespace: 'worldview',
  mode: 'worldview',
};

/**
 * Tenant-index metadata. Pinecone stores metadata as a flat map of
 * strings / numbers / booleans / string-arrays. We normalise to strings
 * on upsert and parse back on query so the client surface is uniform.
 */
export interface PineconeTenantMetadata {
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

/**
 * Worldview-index metadata. Shared across tenants; the strict
 * tenant_key filter does not apply. Callers may filter by `thesis_id`,
 * `chunk_type`, or other fields below.
 */
export interface PineconeWorldviewMetadata {
  /** e.g. `worldview:W1:001`. Mirrors the vector id for round-trips. */
  chunk_id: string;
  /** `W1`..`W5`. */
  thesis_id: string;
  thesis_title: string;
  /** 1-based position within the thesis. */
  chunk_position?: number;
  chunk_total_in_thesis?: number;
  chunk_title?: string;
  chunk_type?: string;
  /** Comma-joined keywords (Pinecone supports string-arrays too; see `keywords`). */
  tags?: string;
  /** Filterable keyword list for `$in` queries. */
  keywords?: string[];
  /** Filterable audience list. */
  audience_tags?: string[];
  /** `worldview_corpus` — fixed for this index; lets future indexes coexist. */
  source_basis: string;
  primary_audience?: string;
  confidence?: number;
  is_forecast?: boolean;
  validation_status?: string;
  last_validated?: string;
}

/** Back-compat alias for CB-3 callers that import the tenant metadata shape. */
export type PineconeUpsertMetadata = PineconeTenantMetadata;

export type PineconeMetadata = PineconeTenantMetadata | PineconeWorldviewMetadata;

export interface PineconeUpsertItem<M extends PineconeMetadata = PineconeTenantMetadata> {
  /** chunk_id — stable, idempotent across re-embeds. */
  id: string;
  /** 1536-dim (tenant) or 3072-dim (worldview) vector. */
  vector: number[];
  metadata: M;
}

export interface PineconeQueryResult<M extends PineconeMetadata = PineconeTenantMetadata> {
  id: string;
  /** Cosine similarity 0..1. */
  score: number;
  metadata: M;
}

export interface PineconeQueryArgs {
  vector: number[];
  /**
   * Tenant filter. **Required** for tenant-mode indexes (throws if
   * missing). Ignored for worldview-mode indexes (the corpus is
   * shared across tenants).
   */
  tenantKey?: string;
  topK?: number;
  /** Additional metadata predicates ANDed with the tenant_key filter (where applicable). */
  metadataFilter?: Record<string, unknown>;
}

export interface PineconeClient<M extends PineconeMetadata = PineconeTenantMetadata> {
  /** Upsert chunks to the index. Batches at 100 vectors per API call. */
  upsert(items: PineconeUpsertItem<M>[]): Promise<{ upsertedCount: number }>;
  /** Query the index. Tenant-mode requires `tenantKey`; worldview-mode ignores it. */
  query(args: PineconeQueryArgs): Promise<PineconeQueryResult<M>[]>;
  /** Delete chunks by id (e.g. when an attachment is removed). */
  deleteByIds(ids: string[]): Promise<void>;
  /** Delete all chunks for a tenant. Tenant-mode only — throws on worldview. */
  deleteByTenant(tenantKey: string): Promise<void>;
  /**
   * The config this client is bound to. Optional on the interface
   * (existing test fakes don't implement it); always present on real
   * instances created by `getPineconeClient` / `createPineconeClientForTests`.
   */
  getConfig?(): PineconeIndexConfig;
}

// ── Internal helpers ──────────────────────────────────────────────────

/**
 * Subset of the Pinecone Index surface we depend on. Lets tests inject
 * a hand-rolled fake without instantiating the real SDK or relying on
 * Jest module mocking. Namespace-scoped indexes expose the same shape.
 */
export interface PineconeIndexLike {
  // Pinecone SDK v7 takes upsert({ records: [...] }), not upsert([...]).
  upsert(args: {
    records: Array<{ id: string; values: number[]; metadata?: RecordMetadata }>;
  }): Promise<void>;
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

// ── Tenant metadata round-trip ────────────────────────────────────────

/**
 * Pinecone's metadata is `Record<string, string | number | boolean | string[]>`.
 * We pass through numbers/booleans natively (they round-trip cleanly)
 * and drop undefined fields so the per-vector payload stays minimal.
 */
function tenantMetaToRecord(meta: PineconeTenantMetadata): RecordMetadata {
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

function tenantMetaFromRecord(meta: RecordMetadata | undefined): PineconeTenantMetadata {
  const m = (meta ?? {}) as Record<string, unknown>;
  const tenantKey = typeof m.tenant_key === 'string' ? m.tenant_key : '';
  const recordKind = typeof m.record_kind === 'string' ? m.record_kind : '';
  const sourceSegment = typeof m.source_segment === 'string' ? m.source_segment : '';
  const recordId = typeof m.record_id === 'string' ? m.record_id : '';
  const out: PineconeTenantMetadata = {
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

// ── Worldview metadata round-trip ────────────────────────────────────

function worldviewMetaToRecord(meta: PineconeWorldviewMetadata): RecordMetadata {
  const out: RecordMetadata = {
    chunk_id: meta.chunk_id,
    thesis_id: meta.thesis_id,
    thesis_title: meta.thesis_title,
    source_basis: meta.source_basis,
  };
  if (typeof meta.chunk_position === 'number' && Number.isFinite(meta.chunk_position)) {
    out.chunk_position = meta.chunk_position;
  }
  if (
    typeof meta.chunk_total_in_thesis === 'number' &&
    Number.isFinite(meta.chunk_total_in_thesis)
  ) {
    out.chunk_total_in_thesis = meta.chunk_total_in_thesis;
  }
  if (meta.chunk_title) out.chunk_title = meta.chunk_title;
  if (meta.chunk_type) out.chunk_type = meta.chunk_type;
  if (meta.tags) out.tags = meta.tags;
  if (Array.isArray(meta.keywords) && meta.keywords.length > 0) {
    out.keywords = meta.keywords;
  }
  if (Array.isArray(meta.audience_tags) && meta.audience_tags.length > 0) {
    out.audience_tags = meta.audience_tags;
  }
  if (meta.primary_audience) out.primary_audience = meta.primary_audience;
  if (typeof meta.confidence === 'number' && Number.isFinite(meta.confidence)) {
    out.confidence = meta.confidence;
  }
  if (typeof meta.is_forecast === 'boolean') out.is_forecast = meta.is_forecast;
  if (meta.validation_status) out.validation_status = meta.validation_status;
  if (meta.last_validated) out.last_validated = meta.last_validated;
  return out;
}

function worldviewMetaFromRecord(
  meta: RecordMetadata | undefined,
): PineconeWorldviewMetadata {
  const m = (meta ?? {}) as Record<string, unknown>;
  const out: PineconeWorldviewMetadata = {
    chunk_id: typeof m.chunk_id === 'string' ? m.chunk_id : '',
    thesis_id: typeof m.thesis_id === 'string' ? m.thesis_id : '',
    thesis_title: typeof m.thesis_title === 'string' ? m.thesis_title : '',
    source_basis:
      typeof m.source_basis === 'string' ? m.source_basis : 'worldview_corpus',
  };
  if (typeof m.chunk_position === 'number') out.chunk_position = m.chunk_position;
  if (typeof m.chunk_total_in_thesis === 'number') {
    out.chunk_total_in_thesis = m.chunk_total_in_thesis;
  }
  if (typeof m.chunk_title === 'string') out.chunk_title = m.chunk_title;
  if (typeof m.chunk_type === 'string') out.chunk_type = m.chunk_type;
  if (typeof m.tags === 'string') out.tags = m.tags;
  if (Array.isArray(m.keywords)) {
    out.keywords = m.keywords.filter((k): k is string => typeof k === 'string');
  }
  if (Array.isArray(m.audience_tags)) {
    out.audience_tags = m.audience_tags.filter(
      (k): k is string => typeof k === 'string',
    );
  }
  if (typeof m.primary_audience === 'string') out.primary_audience = m.primary_audience;
  if (typeof m.confidence === 'number') out.confidence = m.confidence;
  if (typeof m.is_forecast === 'boolean') out.is_forecast = m.is_forecast;
  if (typeof m.validation_status === 'string') out.validation_status = m.validation_status;
  if (typeof m.last_validated === 'string') out.last_validated = m.last_validated;
  return out;
}

// ── Implementation ────────────────────────────────────────────────────

class PineconeClientImpl<M extends PineconeMetadata>
  implements PineconeClient<M>
{
  constructor(
    private readonly index: PineconeIndexLike,
    private readonly config: PineconeIndexConfig,
  ) {}

  getConfig(): PineconeIndexConfig {
    return this.config;
  }

  async upsert(items: PineconeUpsertItem<M>[]): Promise<{ upsertedCount: number }> {
    if (items.length === 0) return { upsertedCount: 0 };

    // Validate dim once — the index is created with a fixed dimension,
    // so a wrong dim would throw on the first call anyway. Surfacing
    // eagerly gives a clearer error than the SDK's generic mismatch.
    for (const item of items) {
      if (!item.id || typeof item.id !== 'string') {
        throw new Error('PineconeClient.upsert: item id must be a non-empty string');
      }
      if (!Array.isArray(item.vector) || item.vector.length === 0) {
        throw new Error(`PineconeClient.upsert: item ${item.id} has no vector`);
      }
      if (item.vector.length !== this.config.dimension) {
        throw new Error(
          `PineconeClient.upsert: item ${item.id} has ${item.vector.length}-dim ` +
            `vector; index ${this.config.name} expects ${this.config.dimension}`,
        );
      }
      if (this.config.mode === 'tenant') {
        const tenantKey = (item.metadata as PineconeTenantMetadata).tenant_key;
        if (!tenantKey) {
          throw new Error(
            `PineconeClient.upsert: item ${item.id} missing required metadata.tenant_key`,
          );
        }
      }
    }

    let upsertedCount = 0;
    for (const batch of chunkArray(items, UPSERT_BATCH_SIZE)) {
      const records = batch.map((item) => ({
        id: item.id,
        values: item.vector,
        metadata: this.serializeMetadata(item.metadata),
      }));
      // Pinecone SDK v7 expects upsert({ records: [...] }), not
      // upsert([...]). The older positional-array shape silently
      // fails as "Must pass in at least 1 record to upsert" because
      // the SDK reads `{ records }` from the first argument.
      await this.index.upsert({ records });
      upsertedCount += batch.length;
    }
    return { upsertedCount };
  }

  async query(args: PineconeQueryArgs): Promise<PineconeQueryResult<M>[]> {
    if (!Array.isArray(args.vector) || args.vector.length === 0) {
      throw new Error('PineconeClient.query: vector is required.');
    }
    // Tenant-key check happens before the dim check so tenant-mode
    // contract violations (a missing tenantKey) surface with the
    // most actionable error first.
    let filter: Record<string, unknown> | undefined;
    if (this.config.mode === 'tenant') {
      if (!args.tenantKey) {
        throw new Error('PineconeClient.query: tenantKey is required for tenant isolation.');
      }
      // Tenant-isolation filter is non-negotiable. Caller-supplied
      // additional predicates are ANDed in.
      filter = {
        tenant_key: { $eq: args.tenantKey },
        ...(args.metadataFilter ?? {}),
      };
    } else {
      // Worldview mode: ignore tenantKey; pass through any caller filter.
      filter = args.metadataFilter ? { ...args.metadataFilter } : undefined;
    }
    if (args.vector.length !== this.config.dimension) {
      throw new Error(
        `PineconeClient.query: vector is ${args.vector.length}-dim; ` +
          `index ${this.config.name} expects ${this.config.dimension}`,
      );
    }
    const topK = Math.min(MAX_TOP_K, Math.max(1, args.topK ?? DEFAULT_TOP_K));

    const result = await this.index.query({
      vector: args.vector,
      topK,
      includeMetadata: true,
      ...(filter ? { filter } : {}),
    });

    const matches = result.matches ?? [];
    return matches.map((match) => ({
      id: match.id,
      score: typeof match.score === 'number' ? match.score : 0,
      metadata: this.deserializeMetadata(match.metadata) as M,
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
    if (this.config.mode !== 'tenant') {
      throw new Error(
        `PineconeClient.deleteByTenant: not supported on ${this.config.mode}-mode index ${this.config.name}`,
      );
    }
    if (!tenantKey) {
      throw new Error('PineconeClient.deleteByTenant: tenantKey is required.');
    }
    await this.index.deleteMany({
      filter: { tenant_key: { $eq: tenantKey } },
    });
  }

  /** For tests / debug logs. */
  getIndexName(): string {
    return this.config.name;
  }

  private serializeMetadata(meta: M): RecordMetadata {
    if (this.config.mode === 'tenant') {
      return tenantMetaToRecord(meta as PineconeTenantMetadata);
    }
    return worldviewMetaToRecord(meta as PineconeWorldviewMetadata);
  }

  private deserializeMetadata(meta: RecordMetadata | undefined): PineconeMetadata {
    if (this.config.mode === 'tenant') {
      return tenantMetaFromRecord(meta);
    }
    return worldviewMetaFromRecord(meta);
  }
}

// ── Factory + registry ────────────────────────────────────────────────

let cachedPineconeConn: Pinecone | null = null;
const cachedClients = new Map<string, PineconeClient<PineconeMetadata>>();

function getOrCreatePinecone(): Pinecone | null {
  if (cachedPineconeConn) return cachedPineconeConn;
  const apiKey = process.env.PINECONE_API_KEY?.trim();
  if (!apiKey) return null;
  cachedPineconeConn = new Pinecone({ apiKey });
  return cachedPineconeConn;
}

function indexHandle(pinecone: Pinecone, config: PineconeIndexConfig): PineconeIndexLike {
  const index: Index<RecordMetadata> = pinecone.index(config.name);
  // The Pinecone SDK exposes `.namespace(ns)` returning a namespace-scoped
  // proxy with the same upsert/query/deleteMany surface; cast through the
  // shared `PineconeIndexLike` so call sites stay uniform.
  if (config.namespace) {
    return index.namespace(config.namespace) as unknown as PineconeIndexLike;
  }
  return index as unknown as PineconeIndexLike;
}

/**
 * Returns a process-wide cached `PineconeClient` for the given index
 * config, or `null` if `PINECONE_API_KEY` is not set.
 *
 * Back-compat: when `config` is omitted, returns the tenant client.
 * Callers that depend on Pinecone (chunksByVector, embedding job's
 * vector upsert) check for null and either throw or skip gracefully.
 */
export function getPineconeClient(
  config: PineconeIndexConfig = PINECONE_INDEX_TENANT,
): PineconeClient | null {
  const cached = cachedClients.get(config.name);
  if (cached) return cached as unknown as PineconeClient;
  const pinecone = getOrCreatePinecone();
  if (!pinecone) return null;
  const index = indexHandle(pinecone, config);
  const client =
    config.mode === 'tenant'
      ? new PineconeClientImpl<PineconeTenantMetadata>(index, config)
      : new PineconeClientImpl<PineconeWorldviewMetadata>(index, config);
  cachedClients.set(config.name, client as unknown as PineconeClient<PineconeMetadata>);
  return client as unknown as PineconeClient;
}

/** Convenience: typed worldview client. */
export function getWorldviewPineconeClient(): PineconeClient<PineconeWorldviewMetadata> | null {
  return getPineconeClient(PINECONE_INDEX_WORLDVIEW) as
    | PineconeClient<PineconeWorldviewMetadata>
    | null;
}

/**
 * Test seam — builds a client around a hand-rolled `PineconeIndexLike`
 * fake. Not exported through the package barrel; only the test file
 * should call this. Defaults to tenant mode for CB-3 back-compat.
 *
 * Accepts either a full `PineconeIndexConfig` or just an index name
 * (string), in which case the rest of the tenant config is filled in.
 */
export function createPineconeClientForTests<
  M extends PineconeMetadata = PineconeTenantMetadata,
>(
  index: PineconeIndexLike,
  configOrName: PineconeIndexConfig | string = PINECONE_INDEX_TENANT,
): PineconeClient<M> {
  const config: PineconeIndexConfig =
    typeof configOrName === 'string'
      ? { ...PINECONE_INDEX_TENANT, name: configOrName }
      : configOrName;
  return new PineconeClientImpl<M>(index, config);
}

/** Test seam — clear the cached singletons between cases. */
export function __resetPineconeClientForTests(): void {
  cachedPineconeConn = null;
  cachedClients.clear();
}

/** Exposed for tests + the embedding script's logging. */
export const PINECONE_DEFAULT_INDEX_NAME = DEFAULT_TENANT_INDEX_NAME;
export const PINECONE_DEFAULT_TENANT_INDEX_NAME = DEFAULT_TENANT_INDEX_NAME;
export const PINECONE_DEFAULT_WORLDVIEW_INDEX_NAME = DEFAULT_WORLDVIEW_INDEX_NAME;
export const PINECONE_UPSERT_BATCH_SIZE = UPSERT_BATCH_SIZE;
export const PINECONE_MAX_TOP_K = MAX_TOP_K;
export const PINECONE_DEFAULT_TOP_K = DEFAULT_TOP_K;
