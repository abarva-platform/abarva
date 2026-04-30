import 'server-only';
import type {
  SegmentId,
  SegmentRollup,
  TenantRecord,
  GraphNode,
  GraphNodeKind,
  GraphEdge,
  GraphNeighborhood,
  GraphPath,
  ContextChunk,
  ChunkEmbeddingStatus,
  EvidenceRecord,
} from './types';

/**
 * Read-only contract for the persisted tenant-data layer.
 *
 * Implementations live behind {@link getTenantDataAdapter}. App-tier code
 * MUST NOT import this module directly — it routes through
 * `AgentContextBroker` per the broker-boundary rule (see
 * `feedback_broker_boundary` and design doc §6).
 */
export interface TenantDataAdapter {
  /** Per-segment coverage rollups for the tenant. See design doc §2. */
  listSegments(tenantKey: string): Promise<SegmentRollup[]>;

  /** Records in a segment, optionally narrowed by `recordKind`. See design doc §2. */
  listRecords(
    tenantKey: string,
    segmentId: SegmentId,
    opts?: { limit?: number; recordKind?: string },
  ): Promise<TenantRecord[]>;

  /** Single record by composite id, or null. */
  getRecord(tenantKey: string, recordId: string): Promise<TenantRecord | null>;

  /** All graph nodes for the tenant, optionally filtered by kind. See design doc §4. */
  listGraphNodes(tenantKey: string, kind?: GraphNodeKind): Promise<GraphNode[]>;

  /** Edges incident on a node, in the requested direction. */
  listGraphEdgesForNode(
    tenantKey: string,
    nodeId: string,
    direction?: 'outgoing' | 'incoming' | 'both',
  ): Promise<GraphEdge[]>;

  /** Bounded BFS expansion around a root node. See design doc §4.2. */
  getGraphNeighborhood(
    tenantKey: string,
    rootId: string,
    opts?: { maxDepth?: number; edgeKinds?: string[] },
  ): Promise<GraphNeighborhood>;

  /** Shortest path between two nodes, or null if none within `maxDepth`. */
  pathBetween(
    tenantKey: string,
    fromId: string,
    toId: string,
    maxDepth?: number,
  ): Promise<GraphPath | null>;

  /** Context chunks for the tenant, optionally narrowed. See design doc §5. */
  listContextChunks(
    tenantKey: string,
    opts?: { recordIds?: string[]; embeddingStatus?: ChunkEmbeddingStatus; limit?: number },
  ): Promise<ContextChunk[]>;

  /** All chunks linked to a single source record. */
  chunksByRecord(tenantKey: string, recordId: string): Promise<ContextChunk[]>;

  /** Keyword retrieval over chunks (ILIKE / ts_rank). See design doc §5.2. */
  chunksByKeyword(tenantKey: string, keywords: string[], limit?: number): Promise<ContextChunk[]>;

  /**
   * Vector retrieval against the Pinecone index. CB-3 wires the live
   * implementation in `SupabaseTenantDataAdapter` — throws with
   * `'Pinecone not configured. Set PINECONE_API_KEY.'` when the key
   * is missing so callers can fall back. See design doc §5.3.
   *
   * Returned chunks may carry `vectorScore` (cosine similarity from
   * Pinecone). Records that are not in Pinecone metadata stay
   * undefined (e.g. keyword-fallback hits via `chunksByKeyword`).
   */
  chunksByVector(tenantKey: string, queryVector: number[], limit?: number): Promise<ContextChunk[]>;

  /** Provenance-aware fetch for evidence_ledger ids. */
  getEvidence(tenantKey: string, evidenceId: string): Promise<EvidenceRecord | null>;

  /** Tells callers whether this adapter has any persisted data for the tenant. */
  hasPersistedData(tenantKey: string): Promise<boolean>;
}
