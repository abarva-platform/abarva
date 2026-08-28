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
import { isFoundationTenantKey } from "@/lib/tenant/foundation-tenants";
import { canonicalTenantKey } from "@/lib/tenant-keys";

function configuredPlane(raw?: string | null): string {
  return (raw ?? process.env.ABARVA_DATA_PLANE ?? "").trim().toLowerCase();
}

export function isGovernedAzureOnlyTenantKey(tenantKey?: string | null): boolean {
  return isFoundationTenantKey(tenantKey);
}

/**
 * Resolve the configured data plane. Defaults to `supabase` for any unset
 * or unrecognized value — production behavior is never changed implicitly.
 */
export function resolveDataPlane(raw?: string | null): DataPlane {
  const value = configuredPlane(raw);
  return value === 'azure-postgres' ? 'azure-postgres' : 'supabase';
}

/**
 * Resolve the configured data plane with tenant-aware governance.
 *
 * Legacy tenants keep the historical default. Foundation tenants are
 * Azure/Postgres-only: unset config resolves to Azure, while an explicit
 * non-Azure plane fails closed instead of silently writing to Supabase.
 */
export function resolveDataPlaneForTenant(
  tenantKey?: string | null,
  raw?: string | null,
): DataPlane {
  if (!isGovernedAzureOnlyTenantKey(tenantKey)) return resolveDataPlane(raw);

  const value = configuredPlane(raw);
  if (value && value !== "azure-postgres") {
    throw new Error(
      `[data-plane] ${canonicalTenantKey(
        tenantKey,
      )} is governed by Azure PostgreSQL and cannot use ${value}`,
    );
  }
  return "azure-postgres";
}
