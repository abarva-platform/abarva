import 'server-only';
import type { TenantDataAdapter } from './adapter';
import type { GraphNeighborhood } from './types';

/**
 * Stub `TenantDataAdapter` for TD-1.
 *
 * All methods return empty arrays / null / false. `hasPersistedData`
 * always returns false; `chunksByVector` throws (mirrors the eventual
 * real-impl behavior when embeddings aren't live).
 *
 * TD-2 swaps this for a Supabase-backed implementation. Until then,
 * the broker keeps reading the existing code-fixture `EnterpriseDataRoom`
 * and nothing in the codebase calls this stub.
 */
export const TENANT_DATA_STUB: TenantDataAdapter = {
  listSegments: (_tenantKey) => Promise.resolve([]),

  listRecords: (_tenantKey, _segmentId, _opts) => Promise.resolve([]),

  getRecord: (_tenantKey, _recordId) => Promise.resolve(null),

  listGraphNodes: (_tenantKey, _kind) => Promise.resolve([]),

  listGraphEdgesForNode: (_tenantKey, _nodeId, _direction) => Promise.resolve([]),

  getGraphNeighborhood: (_tenantKey, rootId, opts) => {
    const neighborhood: GraphNeighborhood = {
      rootId,
      nodes: [],
      edges: [],
      depth: opts?.maxDepth ?? 0,
    };
    return Promise.resolve(neighborhood);
  },

  pathBetween: (_tenantKey, _fromId, _toId, _maxDepth) => Promise.resolve(null),

  listContextChunks: (_tenantKey, _opts) => Promise.resolve([]),

  chunksByRecord: (_tenantKey, _recordId) => Promise.resolve([]),

  chunksByKeyword: (_tenantKey, _keywords, _limit) => Promise.resolve([]),

  chunksByVector: (_tenantKey, _queryVector, _limit) => {
    return Promise.reject(new Error('Vector retrieval not yet enabled (TD-9 follow-on).'));
  },

  getEvidence: (_tenantKey, _evidenceId) => Promise.resolve(null),

  hasPersistedData: (_tenantKey) => Promise.resolve(false),
};

/**
 * Adapter selection. TD-1 always returns the stub; TD-2 swaps for the
 * Supabase-backed implementation. Callers should always route through
 * this function rather than importing the stub directly.
 */
export function getTenantDataAdapter(): TenantDataAdapter {
  return TENANT_DATA_STUB;
}
