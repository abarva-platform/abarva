import 'server-only';

/**
 * Typed contracts for the persisted tenant-data layer.
 *
 * See `docs/build/TENANT_DATA_INTEGRATION_DESIGN.md` (PR #1235) for the
 * design that motivates these shapes. TD-1 ships the contract + a stub;
 * TD-2 wires the Supabase-backed implementation.
 */

/**
 * The 14 segment families per the design doc Section 2.
 *
 * The first 8 names are confirmed in the founder's drop notes. The
 * remaining 6 are provisional — TD-2 confirms or extends this union
 * once the founder shares the schema.
 */
export type SegmentId =
  | 'enterprise_profile'
  | 'org_structure'
  | 'it_landscape'
  | 'kpi_dictionary'
  | 'program_inventory'
  | 'evidence_ledger'
  | 'vendor_contracts'
  | 'cross_program_signals'
  // The remaining 6 segments are unknown to this codebase as of TD-1.
  // Document the gap; TD-2 confirms or extends this union.
  | 'risk_register'        // provisional
  | 'compliance_posture'   // provisional
  | 'data_estate'          // provisional
  | 'workflow_inventory'   // provisional
  | 'capability_map'       // provisional
  | 'org_change_signals';  // provisional

/** Coverage / health status per segment, from segment rollups. See design doc §2. */
export interface SegmentRollup {
  tenantKey: string;
  segmentId: SegmentId;
  recordCount: number;
  /** 0..100. */
  coveragePct: number;
  health: 'complete' | 'partial' | 'thin' | 'shell_only';
  staleCount: number;
  missingCount: number;
  expectedRecordCount?: number;
  /** ISO timestamp. */
  lastIngestedAt?: string;
}

/**
 * A single tenant-data record. The shape is segment-driven; segment-specific
 * fields are surfaced via the typed accessors below. This base type is the
 * common envelope; consumers narrow via the discriminator.
 */
export interface TenantRecord {
  tenantKey: string;
  segmentId: SegmentId;
  /** Composite — `segment:kind:tenant:slug`. */
  recordId: string;
  /** Segment-specific kind tag. */
  recordKind: string;
  title: string;
  /** Segment-specific structured payload. Typed via narrow types below. */
  payload: Record<string, unknown>;
  sourceBasis?: string;
  classification?: 'public' | 'internal' | 'confidential' | 'restricted';
  /** 0..1 where applicable. */
  confidence?: number;
  caveat?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** Graph node ids follow stable patterns (see design doc §4). */
export type GraphNodeKind =
  | 'enterprise'
  | 'person'
  | 'system'
  | 'vendor'
  | 'kpi'
  | 'program'
  | 'evidence'
  | 'capability'             // provisional
  | 'workflow';              // provisional

/** A graph node. Node ids look like `enterprise:apex-retail`, `person:apex:diana-lopez`, etc. */
export interface GraphNode {
  tenantKey: string;
  /** e.g. `enterprise:apex-retail`, `person:apex:diana-lopez`, `system:apex:sap-s4`. */
  nodeId: string;
  kind: GraphNodeKind;
  title: string;
  payload: Record<string, unknown>;
}

/** Typed graph edge kinds. The last three are provisional pending TD-2 schema confirmation. */
export type GraphEdgeKind =
  | 'HAS_EXECUTIVE'
  | 'OWNED_BY'
  | 'LICENSED_FROM'
  | 'SPONSORED_BY'
  | 'MEASURED_FROM'
  | 'LED_BY'
  | 'DEPENDS_ON'             // provisional
  | 'CONTRADICTS'            // provisional
  | 'REPORTS_TO';            // provisional

/** A graph edge. */
export interface GraphEdge {
  tenantKey: string;
  edgeId: string;
  fromNodeId: string;
  toNodeId: string;
  kind: GraphEdgeKind;
  payload?: Record<string, unknown>;
}

/** A bounded neighborhood expansion around a root node. See design doc §4.1. */
export interface GraphNeighborhood {
  rootId: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  depth: number;
}

/** A path between two nodes in the graph. See design doc §4.1. */
export interface GraphPath {
  fromId: string;
  toId: string;
  edges: GraphEdge[];
}

/** Embedding status mirrors the founder's data drop flag. */
export type ChunkEmbeddingStatus = 'pending' | 'embedding' | 'embedded' | 'error';

/** A retrieval-friendly text chunk linked back to its source record. See design doc §5. */
export interface ContextChunk {
  tenantKey: string;
  chunkId: string;
  /** Optional source record provenance. */
  recordId?: string;
  text: string;
  embeddingStatus: ChunkEmbeddingStatus;
  /** Populated only when status === 'embedded'. */
  embedding?: number[];
  sourceBasis?: string;
  classification?: 'public' | 'internal' | 'confidential' | 'restricted';
  /**
   * Cosine similarity 0..1 from the vector index. Populated only when
   * the chunk arrives via `chunksByVector` (CB-3); undefined for
   * keyword / record-scoped retrieval. The broker maps this into
   * `SemanticChunkHit.score`.
   */
  vectorScore?: number;
}

/** A provenance-tagged claim from the evidence_ledger segment. */
export interface EvidenceRecord {
  tenantKey: string;
  /** e.g. `evidence_ledger:ev:apex:001`. */
  evidenceId: string;
  claim: string;
  sourceDoc: string;
  classification: 'public' | 'internal' | 'confidential' | 'restricted';
  /** 0..1. */
  confidence: number;
  caveat?: string;
}
