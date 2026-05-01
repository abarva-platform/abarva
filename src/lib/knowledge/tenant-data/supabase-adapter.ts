import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  getPineconeClient,
  privateTenantPineconeIndexConfig,
  type PineconeClient,
} from '@/lib/knowledge/context-broker/pinecone-client';
import {
  getPrivateDataPlaneResource,
  isPrivateVectorAvailable,
} from '@/lib/knowledge/private-data-plane/registry';
import type { TenantDataAdapter } from './adapter';
import { GraphTraversal } from './graph-traversal';
import type {
  ChunkEmbeddingStatus,
  ContextChunk,
  EvidenceRecord,
  GraphEdge,
  GraphNeighborhood,
  GraphNode,
  GraphNodeKind,
  GraphPath,
  SegmentId,
  SegmentRollup,
  TenantRecord,
} from './types';

/**
 * Supabase-backed TenantDataAdapter (TD-2).
 *
 * Reads against the persisted tenant-data substrate created by migration
 * `supabase/migrations/20260430121500_apex_setup_data_layer.sql` and
 * loaded by `src/scripts/setup-data/load-meridian-setup-data.ts` (Meridian)
 * and the matching Apex loader. The schema is:
 *
 *   data_inventory_segments  (tenant_key, segment_id) — segment rollups
 *   data_inventory_records   (tenant_key, segment_id, record_id) — 1100+ rows
 *   enterprise_context_chunks(tenant_key, chunk_id) — pending embeddings today
 *
 * Graph traversal (`listGraphNodes`, `listGraphEdgesForNode`,
 * `getGraphNeighborhood`, `pathBetween`) delegates to {@link GraphTraversal}
 * (TD-3), which owns BFS over `enterprise_graph_nodes` + `_edges`. The
 * mapper from raw row → broker context-item shape is TD-4. Broker
 * integration is TD-5.
 *
 * Service-role reads bypass RLS. The migration ships a `service_role_all_*`
 * policy on every persisted table, so this is consistent with the migration.
 * Surface a follow-on note in TD-5 / TD-6 once we wire user-context reads
 * directly through RLS.
 */

// ── Row shapes — snake_case mirrors the DB exactly ─────────────────────

interface SegmentRollupRow {
  tenant_key: string;
  segment_id: string;
  segment_name: string;
  family_number: number;
  expected_baseline: Record<string, unknown> | null;
  coverage_score: number | string;
  health_state: string;
  record_count: number | string;
  stale_count: number | string;
  missing_count: number | string;
  last_reviewed_at: string | null;
  last_ingested_at: string | null;
  provenance_summary: Record<string, unknown> | null;
}

interface InventoryRecordRow {
  tenant_key: string;
  segment_id: string;
  record_id: string;
  title: string;
  record_kind: string;
  source_doc: string;
  source_path: string;
  source_basis: string;
  uploaded_by: string | null;
  data_classification: string | null;
  confidence: number | string | null;
  last_reviewed: string | null;
  freshness_state: string | null;
  ingestion_status: string | null;
  indexed_at: string | null;
  record_text: string | null;
  record_payload: Record<string, unknown> | null;
}

interface ContextChunkRow {
  tenant_key: string;
  chunk_id: string;
  source_segment_id: string;
  source_record_id: string;
  source_doc: string;
  source_path: string;
  chunk_index: number;
  chunk_text: string;
  token_count: number | null;
  embedding_status: string;
  embedding_model: string | null;
  embedded_at: string | null;
  provenance: Record<string, unknown> | null;
  chunk_metadata: Record<string, unknown> | null;
}

// ── Column lists ───────────────────────────────────────────────────────

const SEGMENT_COLUMNS =
  'tenant_key, segment_id, segment_name, family_number, expected_baseline, ' +
  'coverage_score, health_state, record_count, stale_count, missing_count, ' +
  'last_reviewed_at, last_ingested_at, provenance_summary';

const RECORD_COLUMNS =
  'tenant_key, segment_id, record_id, title, record_kind, source_doc, ' +
  'source_path, source_basis, uploaded_by, data_classification, confidence, ' +
  'last_reviewed, freshness_state, ingestion_status, indexed_at, ' +
  'record_text, record_payload';

const CHUNK_COLUMNS =
  'tenant_key, chunk_id, source_segment_id, source_record_id, source_doc, ' +
  'source_path, chunk_index, chunk_text, token_count, embedding_status, ' +
  'embedding_model, embedded_at, provenance, chunk_metadata';

// ── Mappers ────────────────────────────────────────────────────────────

const HEALTH_STATE_MAP: Record<string, SegmentRollup['health']> = {
  complete: 'complete',
  partial: 'partial',
  sparse: 'thin',
  not_started: 'shell_only',
  // Defensive: the migration's CHECK constraint also allows 'attention'
  // and 'critical'. Map them to the closest contract value so we do not
  // throw on unexpected health states. TD-5 may extend the union if the
  // broker needs to surface attention vs. partial separately.
  attention: 'partial',
  critical: 'thin',
};

const CLASSIFICATION_MAP: Record<string, TenantRecord['classification']> = {
  public: 'public',
  internal: 'internal',
  confidential: 'confidential',
  restricted: 'restricted',
};

function toNumber(value: number | string | null | undefined, fallback = 0): number {
  if (value == null) return fallback;
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toOptionalNumber(value: number | string | null | undefined): number | undefined {
  if (value == null) return undefined;
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function mapClassification(value: string | null | undefined): TenantRecord['classification'] {
  if (!value) return undefined;
  return CLASSIFICATION_MAP[value.toLowerCase()];
}

function mapEmbeddingStatus(value: string): ChunkEmbeddingStatus {
  switch (value) {
    case 'pending':
    case 'embedding':
    case 'embedded':
    case 'error':
      return value;
    case 'failed':
      return 'error';
    case 'skipped':
      // Treat skipped as a terminal pending state for the contract.
      return 'pending';
    default:
      return 'pending';
  }
}

function mapSegmentRow(row: SegmentRollupRow): SegmentRollup {
  const expected = row.expected_baseline ?? {};
  const expectedRecordCount =
    typeof (expected as Record<string, unknown>).expected_record_count === 'number'
      ? ((expected as Record<string, unknown>).expected_record_count as number)
      : undefined;
  return {
    tenantKey: row.tenant_key,
    segmentId: row.segment_id as SegmentId,
    recordCount: toNumber(row.record_count),
    coveragePct: toNumber(row.coverage_score),
    health: HEALTH_STATE_MAP[row.health_state] ?? 'shell_only',
    staleCount: toNumber(row.stale_count),
    missingCount: toNumber(row.missing_count),
    expectedRecordCount,
    lastIngestedAt: row.last_ingested_at ?? undefined,
  };
}

function mapRecordRow(row: InventoryRecordRow): TenantRecord {
  const payload = (row.record_payload ?? {}) as Record<string, unknown>;
  const caveat =
    typeof payload.caveat === 'string' && payload.caveat.trim().length > 0
      ? (payload.caveat as string)
      : undefined;
  return {
    tenantKey: row.tenant_key,
    segmentId: row.segment_id as SegmentId,
    recordId: row.record_id,
    recordKind: row.record_kind,
    title: row.title,
    payload,
    sourceBasis: row.source_basis ?? undefined,
    classification: mapClassification(row.data_classification),
    confidence: toOptionalNumber(row.confidence),
    caveat,
    createdAt: row.indexed_at ?? undefined,
    updatedAt: row.last_reviewed ?? undefined,
  };
}

function mapChunkRow(row: ContextChunkRow): ContextChunk {
  const provenance = (row.provenance ?? {}) as Record<string, unknown>;
  const sourceBasis =
    typeof provenance.source_basis === 'string' ? provenance.source_basis : undefined;
  const classification = mapClassification(
    typeof provenance.data_classification === 'string' ? provenance.data_classification : null,
  );
  return {
    tenantKey: row.tenant_key,
    chunkId: row.chunk_id,
    recordId: row.source_record_id ?? undefined,
    text: row.chunk_text,
    embeddingStatus: mapEmbeddingStatus(row.embedding_status),
    embedding: undefined, // Populated when TD-9 wires real vectors.
    sourceBasis,
    classification,
  };
}

function mapEvidenceRow(row: InventoryRecordRow): EvidenceRecord {
  const payload = (row.record_payload ?? {}) as Record<string, unknown>;
  const claim =
    typeof payload.claim === 'string' && payload.claim.trim().length > 0
      ? (payload.claim as string)
      : row.title;
  const sourceDoc =
    typeof payload.source_doc === 'string' && payload.source_doc.trim().length > 0
      ? (payload.source_doc as string)
      : row.source_doc;
  const classification = mapClassification(row.data_classification) ?? 'internal';
  const caveat =
    typeof payload.caveat === 'string' && payload.caveat.trim().length > 0
      ? (payload.caveat as string)
      : undefined;
  return {
    tenantKey: row.tenant_key,
    evidenceId: row.record_id,
    claim,
    sourceDoc,
    classification,
    confidence: toOptionalNumber(row.confidence) ?? 0,
    caveat,
  };
}

// ── Adapter ────────────────────────────────────────────────────────────

const PINECONE_NOT_CONFIGURED = 'Pinecone not configured. Set PINECONE_API_KEY.';

const DEFAULT_RECORD_LIMIT = 50;
const MAX_RECORD_LIMIT = 200;
const DEFAULT_CHUNK_LIMIT = 50;
const MAX_CHUNK_KEYWORD_LIMIT = 50;
const DEFAULT_VECTOR_LIMIT = 10;
const MAX_VECTOR_LIMIT = 50;

function defaultPineconeClientForTenant(tenantKey?: string): PineconeClient | null {
  const resource = getPrivateDataPlaneResource(tenantKey);
  if (!resource) {
    return getPineconeClient();
  }
  if (!isPrivateVectorAvailable(resource) || !resource.privatePineconeIndex) {
    return null;
  }
  return getPineconeClient(privateTenantPineconeIndexConfig(resource.privatePineconeIndex));
}

export class SupabaseTenantDataAdapter implements TenantDataAdapter {
  private readonly graphTraversal: GraphTraversal;
  private readonly pineconeClientFactory: (tenantKey?: string) => PineconeClient | null;

  constructor(
    private readonly client: SupabaseClient,
    /**
     * Optional Pinecone-client factory for tests. Production callers
     * pass nothing; the adapter lazy-resolves the singleton via
     * `getPineconeClient()` so a missing PINECONE_API_KEY surfaces
     * only when `chunksByVector` is actually invoked.
     */
    pineconeClientFactory: ((tenantKey?: string) => PineconeClient | null) = defaultPineconeClientForTenant,
  ) {
    // GraphTraversal expects a `() => SupabaseClient` getter so tests can
    // inject mocks per-call. We hand it the same service-role client used
    // for record reads — one client, one tenant boundary, no drift.
    this.graphTraversal = new GraphTraversal(
      () => this.client,
      (tenantKey, tableName) => this.table(tenantKey, tableName),
    );
    this.pineconeClientFactory = pineconeClientFactory;
  }

  private table(tenantKey: string, tableName: string) {
    const resource = getPrivateDataPlaneResource(tenantKey);
    const schemaClient =
      resource?.privateSchema && typeof (this.client as { schema?: unknown }).schema === 'function'
        ? (this.client as unknown as { schema(schemaName: string): SupabaseClient }).schema(
            resource.privateSchema,
          )
        : this.client;
    return schemaClient.from(tableName);
  }

  async listSegments(tenantKey: string): Promise<SegmentRollup[]> {
    const { data, error } = await this.table(tenantKey, 'data_inventory_segments')
      .select(SEGMENT_COLUMNS)
      .eq('tenant_key', tenantKey);
    if (error) {
      throw new Error(`listSegments failed for tenant '${tenantKey}': ${error.message}`);
    }
    const rows = (data ?? []) as unknown as SegmentRollupRow[];
    return rows.map(mapSegmentRow);
  }

  async listRecords(
    tenantKey: string,
    segmentId: SegmentId,
    opts?: { limit?: number; recordKind?: string },
  ): Promise<TenantRecord[]> {
    const limit = Math.min(MAX_RECORD_LIMIT, Math.max(1, opts?.limit ?? DEFAULT_RECORD_LIMIT));
    let query = this.table(tenantKey, 'data_inventory_records')
      .select(RECORD_COLUMNS)
      .eq('tenant_key', tenantKey)
      .eq('segment_id', segmentId);
    if (opts?.recordKind) {
      query = query.eq('record_kind', opts.recordKind);
    }
    const { data, error } = await query.limit(limit);
    if (error) {
      throw new Error(
        `listRecords failed for tenant '${tenantKey}', segment '${segmentId}': ${error.message}`,
      );
    }
    const rows = (data ?? []) as unknown as InventoryRecordRow[];
    return rows.map(mapRecordRow);
  }

  async getRecord(tenantKey: string, recordId: string): Promise<TenantRecord | null> {
    const { data, error } = await this.table(tenantKey, 'data_inventory_records')
      .select(RECORD_COLUMNS)
      .eq('tenant_key', tenantKey)
      .eq('record_id', recordId)
      .maybeSingle();
    if (error) {
      throw new Error(`getRecord failed for tenant '${tenantKey}', record '${recordId}': ${error.message}`);
    }
    if (!data) return null;
    return mapRecordRow(data as unknown as InventoryRecordRow);
  }

  listGraphNodes(tenantKey: string, kind?: GraphNodeKind): Promise<GraphNode[]> {
    return this.graphTraversal.listNodes(tenantKey, kind);
  }

  listGraphEdgesForNode(
    tenantKey: string,
    nodeId: string,
    direction?: 'outgoing' | 'incoming' | 'both',
  ): Promise<GraphEdge[]> {
    return this.graphTraversal.listEdgesForNode(tenantKey, nodeId, direction);
  }

  getGraphNeighborhood(
    tenantKey: string,
    rootId: string,
    opts?: { maxDepth?: number; edgeKinds?: string[] },
  ): Promise<GraphNeighborhood> {
    return this.graphTraversal.getNeighborhood(tenantKey, rootId, opts);
  }

  pathBetween(
    tenantKey: string,
    fromId: string,
    toId: string,
    maxDepth?: number,
  ): Promise<GraphPath | null> {
    return this.graphTraversal.findPath(tenantKey, fromId, toId, maxDepth);
  }

  async listContextChunks(
    tenantKey: string,
    opts?: {
      recordIds?: string[];
      embeddingStatus?: ChunkEmbeddingStatus;
      limit?: number;
    },
  ): Promise<ContextChunk[]> {
    const limit = Math.min(
      MAX_CHUNK_KEYWORD_LIMIT,
      Math.max(1, opts?.limit ?? DEFAULT_CHUNK_LIMIT),
    );
    let query = this.table(tenantKey, 'enterprise_context_chunks')
      .select(CHUNK_COLUMNS)
      .eq('tenant_key', tenantKey);
    if (opts?.recordIds && opts.recordIds.length > 0) {
      query = query.in('source_record_id', opts.recordIds);
    }
    if (opts?.embeddingStatus) {
      query = query.eq('embedding_status', opts.embeddingStatus);
    }
    const { data, error } = await query.limit(limit);
    if (error) {
      throw new Error(`listContextChunks failed for tenant '${tenantKey}': ${error.message}`);
    }
    const rows = (data ?? []) as unknown as ContextChunkRow[];
    return rows.map(mapChunkRow);
  }

  chunksByRecord(tenantKey: string, recordId: string): Promise<ContextChunk[]> {
    return this.listContextChunks(tenantKey, { recordIds: [recordId] });
  }

  async chunksByKeyword(
    tenantKey: string,
    keywords: string[],
    limit?: number,
  ): Promise<ContextChunk[]> {
    const cleaned = keywords
      .map((keyword) => keyword.trim())
      .filter((keyword) => keyword.length > 0);
    if (cleaned.length === 0) return [];
    const cap = Math.min(MAX_CHUNK_KEYWORD_LIMIT, Math.max(1, limit ?? DEFAULT_CHUNK_LIMIT));
    // Build an OR clause with ILIKE per keyword. Escape PostgREST special
    // characters (commas, parentheses) in keywords to keep the OR string
    // safe; the canonical PostgREST workaround is to wrap each ILIKE in
    // its own predicate joined by commas.
    const orClause = cleaned
      .map((keyword) => {
        const escaped = keyword.replace(/[%,()*]/g, ' ').trim();
        return `chunk_text.ilike.%${escaped}%`;
      })
      .filter((clause) => clause.endsWith('%%') === false)
      .join(',');
    if (orClause.length === 0) return [];
    const { data, error } = await this.table(tenantKey, 'enterprise_context_chunks')
      .select(CHUNK_COLUMNS)
      .eq('tenant_key', tenantKey)
      .or(orClause)
      .limit(cap);
    if (error) {
      throw new Error(`chunksByKeyword failed for tenant '${tenantKey}': ${error.message}`);
    }
    const rows = (data ?? []) as unknown as ContextChunkRow[];
    return rows.map(mapChunkRow);
  }

  async chunksByVector(
    tenantKey: string,
    queryVector: number[],
    limit?: number,
  ): Promise<ContextChunk[]> {
    const pinecone = this.pineconeClientFactory(tenantKey);
    if (!pinecone) {
      throw new Error(PINECONE_NOT_CONFIGURED);
    }
    if (!Array.isArray(queryVector) || queryVector.length === 0) {
      throw new Error('chunksByVector: queryVector must be a non-empty number[].');
    }
    const topK = Math.min(MAX_VECTOR_LIMIT, Math.max(1, limit ?? DEFAULT_VECTOR_LIMIT));

    const hits = await pinecone.query({
      vector: queryVector,
      tenantKey,
      topK,
    });
    if (hits.length === 0) return [];

    const ids = hits.map((h) => h.id);
    // Bulk-fetch the chunks Postgres-side so the caller gets the
    // canonical `chunk_text` and provenance — Pinecone metadata is the
    // smallest possible subset by design (see pinecone-client.ts).
    const { data, error } = await this.table(tenantKey, 'enterprise_context_chunks')
      .select(CHUNK_COLUMNS)
      .eq('tenant_key', tenantKey)
      .in('chunk_id', ids);
    if (error) {
      throw new Error(`chunksByVector failed for tenant '${tenantKey}': ${error.message}`);
    }
    const rows = (data ?? []) as unknown as ContextChunkRow[];

    // Map by chunk_id so we can attach the Pinecone score to each
    // hydrated chunk and preserve Pinecone's relevance ordering.
    const byId = new Map<string, ContextChunk>();
    for (const row of rows) {
      byId.set(row.chunk_id, mapChunkRow(row));
    }
    const out: ContextChunk[] = [];
    for (const hit of hits) {
      const chunk = byId.get(hit.id);
      if (!chunk) continue; // Pinecone vector with no Postgres backing — skip silently.
      out.push({ ...chunk, vectorScore: hit.score });
    }
    return out;
  }

  async getEvidence(tenantKey: string, evidenceId: string): Promise<EvidenceRecord | null> {
    const { data, error } = await this.table(tenantKey, 'data_inventory_records')
      .select(RECORD_COLUMNS)
      .eq('tenant_key', tenantKey)
      .eq('segment_id', 'evidence_ledger')
      .eq('record_id', evidenceId)
      .maybeSingle();
    if (error) {
      throw new Error(
        `getEvidence failed for tenant '${tenantKey}', evidence '${evidenceId}': ${error.message}`,
      );
    }
    if (!data) return null;
    return mapEvidenceRow(data as unknown as InventoryRecordRow);
  }

  async hasPersistedData(tenantKey: string): Promise<boolean> {
    const { data, error } = await this.table(tenantKey, 'data_inventory_segments')
      .select('segment_id')
      .eq('tenant_key', tenantKey)
      .limit(1);
    if (error) {
      throw new Error(`hasPersistedData failed for tenant '${tenantKey}': ${error.message}`);
    }
    return (data?.length ?? 0) > 0;
  }
}

// ── Singleton wiring ──────────────────────────────────────────────────

let cachedClient: SupabaseClient | null = null;
let cachedAdapter: SupabaseTenantDataAdapter | null = null;

export function getSupabaseTenantDataClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  cachedClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cachedClient;
}

export function getSupabaseTenantDataAdapter(): SupabaseTenantDataAdapter | null {
  if (cachedAdapter) return cachedAdapter;
  const client = getSupabaseTenantDataClient();
  if (!client) return null;
  cachedAdapter = new SupabaseTenantDataAdapter(client);
  return cachedAdapter;
}

/**
 * Test seam — clears the cached client + adapter so unit tests can swap
 * env vars between cases. Not part of the public surface; only the test
 * file should call this.
 */
export function __resetSupabaseTenantDataAdapterForTests(): void {
  cachedClient = null;
  cachedAdapter = null;
}
