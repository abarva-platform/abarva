// Data-plane read-adapter selection.
//
// `selectReadAdapter()` is the one entry point app/API code should use.
// The physical data plane is chosen by the `ABARVA_DATA_PLANE` env var:
//
//   ABARVA_DATA_PLANE=supabase        -> current production path (DEFAULT)
//   ABARVA_DATA_PLANE=azure-postgres  -> Azure lab path
//
// Anything unset / unrecognized falls back to `supabase`, so existing
// deployments keep their exact behavior with no env change.

import { azurePostgresReadAdapter } from './azurePostgresReadAdapter';
import { supabaseReadAdapter } from './supabaseReadAdapter';
import type {
  DataPlane,
  ParallelRunInvariantPayload,
  ParallelRunReadAdapter,
  TenantInvariants,
} from './types';

export type {
  DataPlane,
  ParallelRunInvariantPayload,
  ParallelRunReadAdapter,
  TenantInvariants,
} from './types';
export { createSupabaseReadAdapter, supabaseReadAdapter } from './supabaseReadAdapter';
export {
  createAzurePostgresReadAdapter,
  azurePostgresReadAdapter,
} from './azurePostgresReadAdapter';

/**
 * Resolve the configured data plane. Defaults to `supabase` for any unset
 * or unrecognized value — production behavior is never changed implicitly.
 */
export function resolveDataPlane(raw?: string | null): DataPlane {
  const value = (raw ?? process.env.ABARVA_DATA_PLANE ?? '').trim().toLowerCase();
  return value === 'azure-postgres' ? 'azure-postgres' : 'supabase';
}

/**
 * Select the read adapter for the configured (or explicitly passed) plane.
 */
export function selectReadAdapter(plane?: DataPlane): ParallelRunReadAdapter {
  const target = plane ?? resolveDataPlane();
  return target === 'azure-postgres' ? azurePostgresReadAdapter : supabaseReadAdapter;
}

/**
 * Assemble the full `/api/admin/parallel-run-invariants` response payload
 * from a set of per-tenant invariants. Kept pure so it is unit-testable
 * without a backend.
 */
export function buildInvariantPayload(
  tenants: TenantInvariants[],
  backendMarker: string,
): ParallelRunInvariantPayload {
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    backendMarker,
    tenants,
    totals: {
      nodes: tenants.reduce((sum, t) => sum + t.nodes, 0),
      edges: tenants.reduce((sum, t) => sum + t.edges, 0),
      contextChunks: tenants.reduce((sum, t) => sum + t.contextChunks, 0),
      programs: tenants.reduce((sum, t) => sum + t.programs, 0),
    },
  };
}
