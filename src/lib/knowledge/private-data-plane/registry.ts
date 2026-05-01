import 'server-only';

/**
 * Private data-plane registry.
 *
 * This is the server-only control-plane map that binds a broker tenant key to
 * its private retrieval resources. App routes must not reach private schemas or
 * Pinecone indexes directly; they call ContextBroker, which consults this
 * registry through the tenant-data adapter.
 *
 * Source handoff: codex-pipeline/private-data-plane/PRIVATE_PLANE_MIGRATION_STATUS.md
 * plus the Northstar app-rewire map and validation query pack.
 */

export type PrivateDataPlaneStatus = 'app_wired' | 'db_only' | 'blocked';
export type PrivateVectorStatus = 'ready' | 'pending' | 'blocked';

export interface PrivateDataPlaneResource {
  tenantKey: string;
  dataPlaneId: string;
  privateSchema: string;
  privatePineconeIndex: string | null;
  vectorStatus: PrivateVectorStatus;
  status: PrivateDataPlaneStatus;
  notes: string;
  vectorCount?: number;
  recordCount?: number;
  chunkCount?: number;
  graphNodeCount?: number;
  graphEdgeCount?: number;
}

const PRIVATE_DATA_PLANES: Record<string, PrivateDataPlaneResource> = {
  'apex-retail': {
    tenantKey: 'apex-retail',
    dataPlaneId: 'pdp:apex-retail:prod',
    privateSchema: 'client_apex_retail_private',
    privatePineconeIndex: 'abarva-client-apex-retail-prod',
    vectorStatus: 'ready',
    status: 'app_wired',
    vectorCount: 415,
    notes: 'Private schema and private Pinecone index are available for app retrieval.',
  },
  'meridian-health': {
    tenantKey: 'meridian-health',
    dataPlaneId: 'pdp:meridian-health:prod',
    privateSchema: 'client_meridian_health_private',
    privatePineconeIndex: 'abarva-client-meridian-health-prod',
    vectorStatus: 'ready',
    status: 'app_wired',
    vectorCount: 715,
    notes: 'Private schema and private Pinecone index are available for app retrieval.',
  },
  'northstar-health': {
    tenantKey: 'northstar-health',
    dataPlaneId: 'pdp:northstar-health:prod',
    privateSchema: 'client_northstar_health_private',
    privatePineconeIndex: null,
    vectorStatus: 'blocked',
    status: 'db_only',
    recordCount: 61,
    chunkCount: 62,
    graphNodeCount: 26,
    graphEdgeCount: 31,
    notes: 'Pinecone index blocked by 5-index cap; use private schema keyword/graph retrieval only until capacity is resolved.',
  },
};

export function normalizePrivateTenantKey(tenantKey: string | null | undefined): string | null {
  const key = tenantKey?.trim();
  if (!key) return null;
  switch (key) {
    case 'apexretail':
      return 'apex-retail';
    case 'meridian':
      return 'meridian-health';
    case 'northstar':
      return 'northstar-health';
    default:
      return key;
  }
}

export function getPrivateDataPlaneResource(
  tenantKey: string | null | undefined,
): PrivateDataPlaneResource | null {
  const normalized = normalizePrivateTenantKey(tenantKey);
  if (!normalized) return null;
  return PRIVATE_DATA_PLANES[normalized] ?? null;
}

export function listPrivateDataPlaneResources(): PrivateDataPlaneResource[] {
  return Object.values(PRIVATE_DATA_PLANES);
}

export function isPrivateVectorAvailable(resource: PrivateDataPlaneResource | null): boolean {
  return Boolean(resource?.privatePineconeIndex && resource.vectorStatus === 'ready');
}
