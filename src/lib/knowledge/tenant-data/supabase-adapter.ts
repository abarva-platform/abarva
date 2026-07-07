import {
  getAzureReadFluentClient,
  runtimePostgresPoolConfig,
  type PostgresCompatClient,
} from "@/lib/data-plane/postgresCompat";
import "server-only";
import { Pool, type QueryResultRow } from "pg";
import { getPrivateDataPlaneResource } from "@/lib/knowledge/private-data-plane/registry";
import type { TenantDataAdapter } from "./adapter";
import { GraphTraversal } from "./graph-traversal";
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
} from "./types";

type SupabaseClient = PostgresCompatClient & {
  schema?: (schemaName: string) => SupabaseClient;
};

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
  vector_score?: number | string | null;
}

// ── Column lists ───────────────────────────────────────────────────────

const SEGMENT_COLUMNS =
  "tenant_key, segment_id, segment_name, family_number, expected_baseline, " +
  "coverage_score, health_state, record_count, stale_count, missing_count, " +
  "last_reviewed_at, last_ingested_at, provenance_summary";

const RECORD_COLUMNS =
  "tenant_key, segment_id, record_id, title, record_kind, source_doc, " +
  "source_path, source_basis, uploaded_by, data_classification, confidence, " +
  "last_reviewed, freshness_state, ingestion_status, indexed_at, " +
  "record_text, record_payload";

const CHUNK_COLUMNS =
  "tenant_key, chunk_id, source_segment_id, source_record_id, source_doc, " +
  "source_path, chunk_index, chunk_text, token_count, embedding_status, " +
  "embedding_model, embedded_at, provenance, chunk_metadata";

// ── Mappers ────────────────────────────────────────────────────────────

const HEALTH_STATE_MAP: Record<string, SegmentRollup["health"]> = {
  complete: "complete",
  partial: "partial",
  sparse: "thin",
  not_started: "shell_only",
  // Defensive: the migration's CHECK constraint also allows 'attention'
  // and 'critical'. Map them to the closest contract value so we do not
  // throw on unexpected health states. TD-5 may extend the union if the
  // broker needs to surface attention vs. partial separately.
  attention: "partial",
  critical: "thin",
};

const CLASSIFICATION_MAP: Record<string, TenantRecord["classification"]> = {
  public: "public",
  internal: "internal",
  confidential: "confidential",
  restricted: "restricted",
};

function toNumber(
  value: number | string | null | undefined,
  fallback = 0,
): number {
  if (value == null) return fallback;
  if (typeof value === "number")
    return Number.isFinite(value) ? value : fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toOptionalNumber(
  value: number | string | null | undefined,
): number | undefined {
  if (value == null) return undefined;
  if (typeof value === "number")
    return Number.isFinite(value) ? value : undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function mapClassification(
  value: string | null | undefined,
): TenantRecord["classification"] {
  if (!value) return undefined;
  return CLASSIFICATION_MAP[value.toLowerCase()];
}

function mapEmbeddingStatus(value: string): ChunkEmbeddingStatus {
  switch (value) {
    case "pending":
    case "skipped":
    case "embedded":
    case "failed":
      return value;
    case "embedding":
      return "pending";
    case "error":
      return "failed";
    default:
      return "pending";
  }
}

function mapSegmentRow(row: SegmentRollupRow): SegmentRollup {
  const expected = row.expected_baseline ?? {};
  const expectedRecordCount =
    typeof (expected as Record<string, unknown>).expected_record_count ===
    "number"
      ? ((expected as Record<string, unknown>).expected_record_count as number)
      : undefined;
  return {
    tenantKey: row.tenant_key,
    segmentId: row.segment_id as SegmentId,
    recordCount: toNumber(row.record_count),
    coveragePct: toNumber(row.coverage_score),
    health: HEALTH_STATE_MAP[row.health_state] ?? "shell_only",
    staleCount: toNumber(row.stale_count),
    missingCount: toNumber(row.missing_count),
    expectedRecordCount,
    lastIngestedAt: row.last_ingested_at ?? undefined,
  };
}

function mapRecordRow(row: InventoryRecordRow): TenantRecord {
  const payload = (row.record_payload ?? {}) as Record<string, unknown>;
  const caveat =
    typeof payload.caveat === "string" && payload.caveat.trim().length > 0
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
    typeof provenance.source_basis === "string"
      ? provenance.source_basis
      : undefined;
  const classification = mapClassification(
    typeof provenance.data_classification === "string"
      ? provenance.data_classification
      : null,
  );
  return {
    tenantKey: row.tenant_key,
    chunkId: row.chunk_id,
    sourceSegmentId: row.source_segment_id,
    sourceDoc: row.source_doc,
    recordId: row.source_record_id ?? undefined,
    text: row.chunk_text,
    embeddingStatus: mapEmbeddingStatus(row.embedding_status),
    embedding: undefined,
    sourceBasis,
    classification,
    vectorScore: toOptionalNumber(row.vector_score),
  };
}

function mapEvidenceRow(row: InventoryRecordRow): EvidenceRecord {
  const payload = (row.record_payload ?? {}) as Record<string, unknown>;
  const claim =
    typeof payload.claim === "string" && payload.claim.trim().length > 0
      ? (payload.claim as string)
      : row.title;
  const sourceDoc =
    typeof payload.source_doc === "string" &&
    payload.source_doc.trim().length > 0
      ? (payload.source_doc as string)
      : row.source_doc;
  const classification =
    mapClassification(row.data_classification) ?? "internal";
  const caveat =
    typeof payload.caveat === "string" && payload.caveat.trim().length > 0
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

const DEFAULT_RECORD_LIMIT = 50;
const MAX_RECORD_LIMIT = 200;
const DEFAULT_CHUNK_LIMIT = 50;
const MAX_CHUNK_LIST_LIMIT = 300;
const MAX_CHUNK_KEYWORD_LIMIT = 50;
const DEFAULT_VECTOR_LIMIT = 10;
const MAX_VECTOR_LIMIT = 50;
const PUBLIC_PACKET18_SEGMENTS = new Set([
  "application_portfolio",
  "initiative_financials",
  "regulatory_and_dependency_context",
  "vendor_contract",
  "sponsor_signal",
]);
const PRIVATE_SCHEMA_INVALID_RE =
  /invalid schema|schema .* does not exist|could not find .* schema|relation .* does not exist/i;
const IDENTIFIER_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;

let cachedPrivatePgPool: Pool | null | undefined;

function getPrivatePgPool(): Pool | null {
  if (cachedPrivatePgPool !== undefined) return cachedPrivatePgPool;
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    cachedPrivatePgPool = null;
    return cachedPrivatePgPool;
  }
  cachedPrivatePgPool = new Pool(
    runtimePostgresPoolConfig(connectionString, "nexus-tenant-data-private"),
  );
  return cachedPrivatePgPool;
}

function quoteIdent(identifier: string): string {
  if (!IDENTIFIER_RE.test(identifier)) {
    throw new Error(`Unsafe SQL identifier: ${identifier}`);
  }
  return `"${identifier}"`;
}

function privateSchemaForTenant(tenantKey: string): string | null {
  return getPrivateDataPlaneResource(tenantKey)?.privateSchema ?? null;
}

function shouldUsePrivatePgFallback(
  tenantKey: string,
  message: string,
): boolean {
  return Boolean(
    privateSchemaForTenant(tenantKey) &&
    PRIVATE_SCHEMA_INVALID_RE.test(message),
  );
}

async function queryPrivateRows<T extends QueryResultRow>(
  tenantKey: string,
  tableName: string,
  columns: string,
  whereSql: string[],
  values: unknown[],
  limit?: number,
): Promise<T[]> {
  const schema = privateSchemaForTenant(tenantKey);
  const pool = getPrivatePgPool();
  if (!schema || !pool) return [];
  const tableRef = `${quoteIdent(schema)}.${quoteIdent(tableName)}`;
  const boundedLimit =
    typeof limit === "number" ? ` limit ${Math.trunc(limit)}` : "";
  const sql = `select ${columns} from ${tableRef} where ${whereSql.join(" and ")}${boundedLimit}`;
  const result = await pool.query<T>(sql, values);
  return result.rows;
}

function pgVectorLiteral(vector: number[]): string {
  if (!Array.isArray(vector) || vector.length === 0) {
    throw new Error(
      "chunksByVector: queryVector must be a non-empty number[].",
    );
  }
  return `[${vector.map((value) => Number(value).toString()).join(",")}]`;
}

async function queryPgvectorRows(
  tenantKey: string,
  queryVector: number[],
  limit: number,
): Promise<ContextChunkRow[]> {
  const pool = getPrivatePgPool();
  if (!pool) {
    throw new Error(
      "chunksByVector requires DATABASE_URL for Postgres pgvector retrieval.",
    );
  }
  const runQuery = async (schema: string): Promise<ContextChunkRow[]> => {
    const tableRef = `${quoteIdent(schema)}.${quoteIdent("enterprise_context_chunks")}`;
    const sql = `
    select ${CHUNK_COLUMNS},
           greatest(0, 1 - (embedding_vector <=> $2::vector))::float8 as vector_score
      from ${tableRef}
     where tenant_key = $1
       and embedding_status = 'embedded'
       and embedding_vector is not null
     order by embedding_vector <=> $2::vector
     limit $3
  `;
    const result = await pool.query<ContextChunkRow>(sql, [
      tenantKey,
      pgVectorLiteral(queryVector),
      limit,
    ]);
    return result.rows;
  };

  const privateSchema = privateSchemaForTenant(tenantKey);
  if (!privateSchema) return runQuery("public");

  try {
    return await runQuery(privateSchema);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (shouldUsePrivatePgFallback(tenantKey, message)) {
      return runQuery("public");
    }
    throw error;
  }
}

function ilikePattern(raw: string): string {
  return `%${raw.replace(/[\\%_]/g, (ch) => `\\${ch}`)}%`;
}

export class SupabaseTenantDataAdapter implements TenantDataAdapter {
  private readonly graphTraversal: GraphTraversal;
  private publicFallbackClient: SupabaseClient | null | undefined;

  constructor(private readonly client: SupabaseClient) {
    // GraphTraversal expects a `() => SupabaseClient` getter so tests can
    // inject mocks per-call. We hand it the same service-role client used
    // for record reads — one client, one tenant boundary, no drift.
    this.graphTraversal = new GraphTraversal(
      () => this.client,
      (tenantKey, tableName) => this.table(tenantKey, tableName),
    );
  }

  private table(tenantKey: string, tableName: string) {
    const resource = getPrivateDataPlaneResource(tenantKey);
    const schemaClient =
      resource?.privateSchema &&
      typeof (this.client as { schema?: unknown }).schema === "function"
        ? (
            this.client as unknown as {
              schema(schemaName: string): SupabaseClient;
            }
          ).schema(resource.privateSchema)
        : this.client;
    return schemaClient.from(tableName);
  }

  private publicTable(tableName: string) {
    if (this.publicFallbackClient === undefined) {
      this.publicFallbackClient = getAzureReadFluentClient() as SupabaseClient;
    }
    return (this.publicFallbackClient ?? this.client).from(tableName);
  }

  async listSegments(tenantKey: string): Promise<SegmentRollup[]> {
    const { data, error } = await this.table(
      tenantKey,
      "data_inventory_segments",
    )
      .select(SEGMENT_COLUMNS)
      .eq("tenant_key", tenantKey);
    if (error) {
      if (shouldUsePrivatePgFallback(tenantKey, error.message)) {
        const rows = await queryPrivateRows<SegmentRollupRow>(
          tenantKey,
          "data_inventory_segments",
          SEGMENT_COLUMNS,
          ["tenant_key = $1"],
          [tenantKey],
        );
        return rows.map(mapSegmentRow);
      }
      throw new Error(
        `listSegments failed for tenant '${tenantKey}': ${error.message}`,
      );
    }
    const rows = (data ?? []) as unknown as SegmentRollupRow[];
    return rows.map(mapSegmentRow);
  }

  async listRecords(
    tenantKey: string,
    segmentId: SegmentId,
    opts?: { limit?: number; recordKind?: string },
  ): Promise<TenantRecord[]> {
    const limit = Math.min(
      MAX_RECORD_LIMIT,
      Math.max(1, opts?.limit ?? DEFAULT_RECORD_LIMIT),
    );
    const queryPublicRows = async (): Promise<InventoryRecordRow[] | null> => {
      let fallback = this.client
        .from("data_inventory_records")
        .select(RECORD_COLUMNS)
        .eq("tenant_key", tenantKey)
        .eq("segment_id", segmentId);
      if (opts?.recordKind) {
        fallback = fallback.eq("record_kind", opts.recordKind);
      }
      const result = await fallback.limit(limit);
      if (result.error) return null;
      return (result.data ?? []) as unknown as InventoryRecordRow[];
    };
    let query = this.table(tenantKey, "data_inventory_records")
      .select(RECORD_COLUMNS)
      .eq("tenant_key", tenantKey)
      .eq("segment_id", segmentId);
    if (opts?.recordKind) {
      query = query.eq("record_kind", opts.recordKind);
    }
    const { data, error } = await query.limit(limit);
    if (error) {
      if (shouldUsePrivatePgFallback(tenantKey, error.message)) {
        const whereSql = ["tenant_key = $1", "segment_id = $2"];
        const values: unknown[] = [tenantKey, segmentId];
        if (opts?.recordKind) {
          whereSql.push(`record_kind = $${values.length + 1}`);
          values.push(opts.recordKind);
        }
        try {
          const rows = await queryPrivateRows<InventoryRecordRow>(
            tenantKey,
            "data_inventory_records",
            RECORD_COLUMNS,
            whereSql,
            values,
            limit,
          );
          return rows.map(mapRecordRow);
        } catch {
          const publicRows = await queryPublicRows();
          if (publicRows) return publicRows.map(mapRecordRow);
        }
      }
      throw new Error(
        `listRecords failed for tenant '${tenantKey}', segment '${segmentId}': ${error.message}`,
      );
    }
    const rows = (data ?? []) as unknown as InventoryRecordRow[];
    return rows.map(mapRecordRow);
  }

  async getRecord(
    tenantKey: string,
    recordId: string,
  ): Promise<TenantRecord | null> {
    const queryPublicRow = async (): Promise<InventoryRecordRow | null> => {
      const fallback = await this.client
        .from("data_inventory_records")
        .select(RECORD_COLUMNS)
        .eq("tenant_key", tenantKey)
        .eq("record_id", recordId)
        .maybeSingle();
      if (fallback.error) return null;
      return (fallback.data as unknown as InventoryRecordRow | null) ?? null;
    };
    const { data, error } = await this.table(
      tenantKey,
      "data_inventory_records",
    )
      .select(RECORD_COLUMNS)
      .eq("tenant_key", tenantKey)
      .eq("record_id", recordId)
      .maybeSingle();
    if (error) {
      if (shouldUsePrivatePgFallback(tenantKey, error.message)) {
        try {
          const rows = await queryPrivateRows<InventoryRecordRow>(
            tenantKey,
            "data_inventory_records",
            RECORD_COLUMNS,
            ["tenant_key = $1", "record_id = $2"],
            [tenantKey, recordId],
            1,
          );
          return rows[0] ? mapRecordRow(rows[0]) : null;
        } catch {
          const publicRow = await queryPublicRow();
          return publicRow ? mapRecordRow(publicRow) : null;
        }
      }
      throw new Error(
        `getRecord failed for tenant '${tenantKey}', record '${recordId}': ${error.message}`,
      );
    }
    if (!data) return null;
    return mapRecordRow(data as unknown as InventoryRecordRow);
  }

  listGraphNodes(
    tenantKey: string,
    kind?: GraphNodeKind,
  ): Promise<GraphNode[]> {
    return this.graphTraversal.listNodes(tenantKey, kind);
  }

  listGraphEdgesForNode(
    tenantKey: string,
    nodeId: string,
    direction?: "outgoing" | "incoming" | "both",
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
      segmentIds?: SegmentId[];
      embeddingStatus?: ChunkEmbeddingStatus;
      limit?: number;
    },
  ): Promise<ContextChunk[]> {
    const limit = Math.min(
      MAX_CHUNK_LIST_LIMIT,
      Math.max(1, opts?.limit ?? DEFAULT_CHUNK_LIMIT),
    );
    const queryPublicRows = async (): Promise<ContextChunkRow[] | null> => {
      let fallbackQuery = this.publicTable("enterprise_context_chunks")
        .select(CHUNK_COLUMNS)
        .eq("tenant_key", tenantKey);
      if (opts?.recordIds && opts.recordIds.length > 0) {
        fallbackQuery = fallbackQuery.in("source_record_id", opts.recordIds);
      }
      if (opts?.segmentIds && opts.segmentIds.length > 0) {
        fallbackQuery = fallbackQuery.in("source_segment_id", opts.segmentIds);
      }
      if (opts?.embeddingStatus) {
        fallbackQuery = fallbackQuery.eq(
          "embedding_status",
          opts.embeddingStatus,
        );
      }
      const fallback = await fallbackQuery.limit(limit);
      if (fallback.error) return null;
      return (fallback.data ?? []) as unknown as ContextChunkRow[];
    };
    if (
      opts?.segmentIds?.some((segmentId) =>
        PUBLIC_PACKET18_SEGMENTS.has(segmentId),
      )
    ) {
      const publicRows = await queryPublicRows();
      if (publicRows) return publicRows.map(mapChunkRow);
    }
    let query = this.table(tenantKey, "enterprise_context_chunks")
      .select(CHUNK_COLUMNS)
      .eq("tenant_key", tenantKey);
    if (opts?.recordIds && opts.recordIds.length > 0) {
      query = query.in("source_record_id", opts.recordIds);
    }
    if (opts?.segmentIds && opts.segmentIds.length > 0) {
      query = query.in("source_segment_id", opts.segmentIds);
    }
    if (opts?.embeddingStatus) {
      query = query.eq("embedding_status", opts.embeddingStatus);
    }
    const { data, error } = await query.limit(limit);
    if (error) {
      if (shouldUsePrivatePgFallback(tenantKey, error.message)) {
        const whereSql = ["tenant_key = $1"];
        const values: unknown[] = [tenantKey];
        if (opts?.recordIds && opts.recordIds.length > 0) {
          whereSql.push(
            `source_record_id = any($${values.length + 1}::text[])`,
          );
          values.push(opts.recordIds);
        }
        if (opts?.segmentIds && opts.segmentIds.length > 0) {
          whereSql.push(
            `source_segment_id = any($${values.length + 1}::text[])`,
          );
          values.push(opts.segmentIds);
        }
        if (opts?.embeddingStatus) {
          whereSql.push(`embedding_status = $${values.length + 1}`);
          values.push(opts.embeddingStatus);
        }
        try {
          const rows = await queryPrivateRows<ContextChunkRow>(
            tenantKey,
            "enterprise_context_chunks",
            CHUNK_COLUMNS,
            whereSql,
            values,
            limit,
          );
          return rows.map(mapChunkRow);
        } catch {
          const publicRows = await queryPublicRows();
          if (publicRows) return publicRows.map(mapChunkRow);
        }
      }
      throw new Error(
        `listContextChunks failed for tenant '${tenantKey}': ${error.message}`,
      );
    }
    let rows = (data ?? []) as unknown as ContextChunkRow[];
    if (rows.length === 0) {
      rows = (await queryPublicRows()) ?? rows;
    }
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
    const cap = Math.min(
      MAX_CHUNK_KEYWORD_LIMIT,
      Math.max(1, limit ?? DEFAULT_CHUNK_LIMIT),
    );
    // Build an OR clause with ILIKE per keyword. Escape PostgREST special
    // characters (commas, parentheses) in keywords to keep the OR string
    // safe; the canonical PostgREST workaround is to wrap each ILIKE in
    // its own predicate joined by commas.
    const orClause = cleaned
      .map((keyword) => {
        const escaped = keyword.replace(/[%,()*]/g, " ").trim();
        return `chunk_text.ilike.%${escaped}%`;
      })
      .filter((clause) => clause.endsWith("%%") === false)
      .join(",");
    if (orClause.length === 0) return [];
    const queryPublicRows = async (): Promise<ContextChunkRow[] | null> => {
      const fallback = await this.client
        .from("enterprise_context_chunks")
        .select(CHUNK_COLUMNS)
        .eq("tenant_key", tenantKey)
        .or(orClause)
        .limit(cap);
      if (fallback.error) return null;
      return (fallback.data ?? []) as unknown as ContextChunkRow[];
    };
    const { data, error } = await this.table(
      tenantKey,
      "enterprise_context_chunks",
    )
      .select(CHUNK_COLUMNS)
      .eq("tenant_key", tenantKey)
      .or(orClause)
      .limit(cap);
    if (error) {
      if (shouldUsePrivatePgFallback(tenantKey, error.message)) {
        const values: unknown[] = [tenantKey];
        const clauses = cleaned.map((keyword) => {
          values.push(ilikePattern(keyword));
          return `chunk_text ilike $${values.length} escape '\\'`;
        });
        try {
          const rows = await queryPrivateRows<ContextChunkRow>(
            tenantKey,
            "enterprise_context_chunks",
            CHUNK_COLUMNS,
            ["tenant_key = $1", `(${clauses.join(" or ")})`],
            values,
            cap,
          );
          return rows.map(mapChunkRow);
        } catch {
          const publicRows = await queryPublicRows();
          if (publicRows) return publicRows.map(mapChunkRow);
        }
      }
      throw new Error(
        `chunksByKeyword failed for tenant '${tenantKey}': ${error.message}`,
      );
    }
    const rows = (data ?? []) as unknown as ContextChunkRow[];
    return rows.map(mapChunkRow);
  }

  async chunksByVector(
    tenantKey: string,
    queryVector: number[],
    limit?: number,
  ): Promise<ContextChunk[]> {
    if (!Array.isArray(queryVector) || queryVector.length === 0) {
      throw new Error(
        "chunksByVector: queryVector must be a non-empty number[].",
      );
    }
    const topK = Math.min(
      MAX_VECTOR_LIMIT,
      Math.max(1, limit ?? DEFAULT_VECTOR_LIMIT),
    );
    const rows = await queryPgvectorRows(tenantKey, queryVector, topK);
    return rows.map(mapChunkRow);
  }

  async getEvidence(
    tenantKey: string,
    evidenceId: string,
  ): Promise<EvidenceRecord | null> {
    const { data, error } = await this.table(
      tenantKey,
      "data_inventory_records",
    )
      .select(RECORD_COLUMNS)
      .eq("tenant_key", tenantKey)
      .eq("segment_id", "evidence_ledger")
      .eq("record_id", evidenceId)
      .maybeSingle();
    if (error) {
      if (shouldUsePrivatePgFallback(tenantKey, error.message)) {
        const rows = await queryPrivateRows<InventoryRecordRow>(
          tenantKey,
          "data_inventory_records",
          RECORD_COLUMNS,
          ["tenant_key = $1", "segment_id = $2", "record_id = $3"],
          [tenantKey, "evidence_ledger", evidenceId],
          1,
        );
        return rows[0] ? mapEvidenceRow(rows[0]) : null;
      }
      throw new Error(
        `getEvidence failed for tenant '${tenantKey}', evidence '${evidenceId}': ${error.message}`,
      );
    }
    if (!data) return null;
    return mapEvidenceRow(data as unknown as InventoryRecordRow);
  }

  async hasPersistedData(tenantKey: string): Promise<boolean> {
    const { data, error } = await this.table(
      tenantKey,
      "data_inventory_segments",
    )
      .select("segment_id")
      .eq("tenant_key", tenantKey)
      .limit(1);
    if (error) {
      if (shouldUsePrivatePgFallback(tenantKey, error.message)) {
        const rows = await queryPrivateRows<{ segment_id: string }>(
          tenantKey,
          "data_inventory_segments",
          "segment_id",
          ["tenant_key = $1"],
          [tenantKey],
          1,
        );
        return rows.length > 0;
      }
      throw new Error(
        `hasPersistedData failed for tenant '${tenantKey}': ${error.message}`,
      );
    }
    if ((data?.length ?? 0) > 0) return true;

    const chunks = await this.table(tenantKey, "enterprise_context_chunks")
      .select("chunk_id")
      .eq("tenant_key", tenantKey)
      .limit(1);
    if (chunks.error) {
      if (shouldUsePrivatePgFallback(tenantKey, chunks.error.message)) {
        const rows = await queryPrivateRows<{ chunk_id: string }>(
          tenantKey,
          "enterprise_context_chunks",
          "chunk_id",
          ["tenant_key = $1"],
          [tenantKey],
          1,
        );
        return rows.length > 0;
      }
      throw new Error(
        `hasPersistedData chunk check failed for tenant '${tenantKey}': ${chunks.error.message}`,
      );
    }
    return (chunks.data?.length ?? 0) > 0;
  }
}

// ── Singleton wiring ──────────────────────────────────────────────────

let cachedClient: SupabaseClient | null = null;
let cachedAdapter: SupabaseTenantDataAdapter | null = null;

export function getSupabaseTenantDataClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;
  cachedClient = getAzureReadFluentClient() as SupabaseClient;
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
  cachedPrivatePgPool = undefined;
}
