// Data-plane selection primitive.
//
// Extracted from `index.ts` so per-domain adapters (Slice 2+) can import the
// `ABARVA_DATA_PLANE` switch without pulling in the Slice 1 parallel-run
// adapters — keeps the import graph acyclic.
//
//   ABARVA_DATA_PLANE=supabase        -> current production path (DEFAULT)
//   ABARVA_DATA_PLANE=azure-postgres  -> Azure lab path
//
// Anything unset / unrecognized falls back to `supabase`, so existing
// deployments keep their exact behavior with no env change.

import type { DataPlane } from './types';

/**
 * Resolve the configured data plane. Defaults to `supabase` for any unset
 * or unrecognized value — production behavior is never changed implicitly.
 */
export function resolveDataPlane(raw?: string | null): DataPlane {
  const value = (raw ?? process.env.ABARVA_DATA_PLANE ?? '').trim().toLowerCase();
  return value === 'azure-postgres' ? 'azure-postgres' : 'supabase';
}
