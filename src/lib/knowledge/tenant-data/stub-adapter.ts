import 'server-only';
import type { TenantDataAdapter } from './adapter';
import type { GraphNeighborhood } from './types';
import { getSupabaseTenantDataAdapter } from './supabase-adapter';

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
 * Adapter selection. TD-2 prefers the Supabase-backed adapter when the
 * service-role env vars are set; otherwise it falls back silently to the
 * stub so that unit tests / CI runs without DB credentials still work.
 *
 * The fallback path logs once per process so the silent degradation does
 * not become invisible. The warning is suppressed when `JEST_WORKER_ID`
 * is set so the Jest output stays quiet by default.
 */
let warnedAboutMissingEnv = false;

export function getTenantDataAdapter(): TenantDataAdapter {
  const supabase = getSupabaseTenantDataAdapter();
  if (supabase) return supabase;
  if (!warnedAboutMissingEnv && !process.env.JEST_WORKER_ID) {
    warnedAboutMissingEnv = true;
    console.warn(
      '[tenant-data] NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set; ' +
        'falling back to TENANT_DATA_STUB. Set both to enable real reads.',
    );
  }
  return TENANT_DATA_STUB;
}

/**
 * Test seam — resets the warned-about-missing-env flag so successive
 * tests can re-exercise the warning path.
 */
export function __resetTenantDataWarningForTests(): void {
  warnedAboutMissingEnv = false;
}
