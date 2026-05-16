// Data-plane write-adapter selection.
//
// `selectWriteAdapter()` is the one entry point app/API write paths should
// use. The physical data plane is chosen by the same `ABARVA_DATA_PLANE` env
// var the read seam uses — `resolveDataPlane()` is imported from the read
// module, NOT duplicated, so the two seams can never disagree:
//
//   ABARVA_DATA_PLANE=supabase        -> current production path (DEFAULT)
//   ABARVA_DATA_PLANE=azure-postgres  -> Azure lab path (rehearsal / post-flip)
//
// Anything unset / unrecognized falls back to `supabase`, so existing
// deployments keep their exact write behavior with no env change.
//
// Per the design doc's cutover-flip decision, the Azure write adapter is
// selectable but is NEVER an implicit default and is NEVER dual-written —
// production stays the sole writer through the parallel-run window.

import { resolveDataPlane } from '../read-adapters/resolveDataPlane';
import { azurePostgresWriteAdapter } from './azurePostgresWriteAdapter';
import { supabaseWriteAdapter } from './supabaseWriteAdapter';
import type { DataPlane, DataPlaneWriteAdapter } from './types';

export type {
  DataPlane,
  AuditEntry,
  DataPlaneWriteAdapter,
  WriteReason,
  WriteResult,
  WriteStatementRunner,
  WriteUnit,
} from './types';
export { writeOk, writeRejected } from './types';
export {
  createSupabaseWriteAdapter,
  supabaseWriteAdapter,
} from './supabaseWriteAdapter';
export {
  createAzurePostgresWriteAdapter,
  azurePostgresWriteAdapter,
} from './azurePostgresWriteAdapter';
// Re-export the shared selection primitive so write callers have a single
// import surface — the implementation still lives in the read module.
export { resolveDataPlane } from '../read-adapters/resolveDataPlane';

/**
 * Select the write adapter for the configured (or explicitly passed) plane.
 * Defaults to the Supabase adapter — production write behavior is unchanged.
 */
export function selectWriteAdapter(plane?: DataPlane): DataPlaneWriteAdapter {
  const target = plane ?? resolveDataPlane();
  return target === 'azure-postgres' ? azurePostgresWriteAdapter : supabaseWriteAdapter;
}
