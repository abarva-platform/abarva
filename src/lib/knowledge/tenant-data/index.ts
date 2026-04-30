import 'server-only';

/**
 * Public surface for the tenant-data adapter.
 *
 * Only `src/lib/knowledge/**` may import from this module — the broker
 * is the single seam between app-tier and tenant-data. See
 * `feedback_broker_boundary` and design doc §6 for the rule, and the
 * matching `no-restricted-imports` entry in `eslint.config.mjs`.
 */

export type {
  SegmentId,
  SegmentRollup,
  TenantRecord,
  GraphNodeKind,
  GraphNode,
  GraphEdgeKind,
  GraphEdge,
  GraphNeighborhood,
  GraphPath,
  ChunkEmbeddingStatus,
  ContextChunk,
  EvidenceRecord,
} from './types';

export type { TenantDataAdapter } from './adapter';

export { getTenantDataAdapter, TENANT_DATA_STUB } from './stub-adapter';
