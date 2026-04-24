// Tenant membership guard · P0-critical security helper
//
// Confirmed cross-tenant read defect (crawler reports 2026-04-24): a
// Meridian-authenticated user loading /tenant/apex-retail/programs/
// morrison-.../deliverables/d01-... would get the full Apex charter body
// including an active APPROVE DECISION affordance. The URL path controlled
// data access; backend never checked tenant membership. This module
// centralizes the check so every /tenant/{slug}/* surface calls the same
// guard with consistent behavior.
//
// Failure semantics:
//   - No authenticated user → redirect to /sign-in (preserves Clerk flow)
//   - Authenticated but tenant slug does not resolve → notFound() (the
//     tenant literally doesn't exist; 404 is the right answer)
//   - Authenticated and tenant resolves but user has no membership →
//     forbidden() → renders /forbidden.tsx with a 403 response
//
// Why forbidden() not notFound(): per the crawler report the user asked
// for "returns 403, not renders content." 404 would also fix the data
// leak but conceals whether the resource exists. 403 tells the user
// honestly: "this tenant exists; you just don't have access." More
// defensible from a product integrity standpoint.

import { forbidden, notFound, redirect } from 'next/navigation';
import { getCurrentUser, userCanAccessClient } from './current-user';
import type { CurrentUser } from './current-user';
import { findTenantByRouteSlug, getSeedPlan } from '@/lib/deliverables/seed-route-resolver';
import type { TenantSeedPlan } from '@/lib/programs/enhancement-seed-planner';
import { isClientKey, type ClientKey } from '@/lib/client-config';

export interface TenantAccessContext {
  user: CurrentUser;
  tenant: TenantSeedPlan;
  clientKey: ClientKey;
}

/**
 * Server-only guard. Call from every tenant-scoped page/route handler
 * before reading tenant data. Returns the resolved context on success;
 * calls Next.js navigation interrupts on failure so the caller never
 * handles the error path explicitly.
 *
 * Usage in a page:
 *   const { tenant, user } = await assertTenantAccess(tenantSlug);
 */
export async function assertTenantAccess(tenantSlug: string): Promise<TenantAccessContext> {
  const user = await getCurrentUser();
  if (!user) {
    // Preserve requested destination so the user lands back here after sign-in.
    redirect(`/sign-in?redirect=/tenant/${encodeURIComponent(tenantSlug)}`);
  }

  const tenant = findTenantByRouteSlug(tenantSlug);
  if (!tenant) {
    // The tenant URL is malformed or the slug doesn't map to any tenant.
    // 404 is correct — the resource does not exist, not "you can't see it."
    notFound();
  }

  const clientKey = tenant.tenantKey;
  if (!isClientKey(clientKey)) {
    // Internal invariant: every TenantSeedPlan.tenantKey should be a
    // ClientKey. If not, the seed plan is corrupt — 404 rather than
    // leak an inconsistent surface.
    notFound();
  }

  // Maestros (admins with cross-tenant role) bypass — they're allowed
  // to see every tenant. Everyone else needs an explicit membership or
  // a matching Clerk publicMetadata.clientId.
  if (user.primaryRole === 'maestro') {
    return { user, tenant, clientKey };
  }

  if (userCanAccessClient(user, clientKey)) {
    return { user, tenant, clientKey };
  }

  // Fallback: Clerk publicMetadata.clientId can pin a client even when
  // the person_client_memberships row hasn't been seeded yet (common
  // for demo accounts). If metadata matches, we allow — this preserves
  // the existing auth contract for fresh Clerk accounts.
  if (user.metadataClientKey && user.metadataClientKey === clientKey) {
    return { user, tenant, clientKey };
  }

  forbidden();
}

/**
 * Looser variant: returns the access verdict without calling navigation
 * interrupts. Use for API route handlers that need to respond with a
 * custom JSON error body rather than an HTML error page.
 */
export async function checkTenantAccess(
  tenantSlug: string,
): Promise<
  | { ok: true; user: CurrentUser; tenant: TenantSeedPlan; clientKey: ClientKey }
  | { ok: false; reason: 'unauthenticated' | 'tenant_not_found' | 'forbidden' }
> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, reason: 'unauthenticated' };

  const tenant = findTenantByRouteSlug(tenantSlug);
  if (!tenant) return { ok: false, reason: 'tenant_not_found' };

  const clientKey = tenant.tenantKey;
  if (!isClientKey(clientKey)) return { ok: false, reason: 'tenant_not_found' };

  if (user.primaryRole === 'maestro') {
    return { ok: true, user, tenant, clientKey };
  }

  if (userCanAccessClient(user, clientKey)) {
    return { ok: true, user, tenant, clientKey };
  }

  if (user.metadataClientKey && user.metadataClientKey === clientKey) {
    return { ok: true, user, tenant, clientKey };
  }

  return { ok: false, reason: 'forbidden' };
}

/**
 * Resolve the tenant key that owns a given program code (e.g. "APX-01" →
 * "apexretail"). Returns null when the code is unknown. Used by API
 * routes that take programCode as input and need to gate by tenant.
 */
export function tenantKeyForProgramCode(programCode: string): ClientKey | null {
  const plan = getSeedPlan();
  const program = plan.programs.find((p) => p.code === programCode);
  if (!program) return null;
  return isClientKey(program.tenantKey) ? program.tenantKey : null;
}

/**
 * Check tenant access by internal ClientKey instead of URL slug. Used
 * by APIs that receive a program id (which resolves to a tenant key via
 * the seed plan) rather than a route slug.
 */
export async function checkTenantAccessByKey(
  clientKey: string,
): Promise<
  | { ok: true; user: CurrentUser }
  | { ok: false; reason: 'unauthenticated' | 'tenant_not_found' | 'forbidden' }
> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, reason: 'unauthenticated' };

  if (!isClientKey(clientKey)) return { ok: false, reason: 'tenant_not_found' };

  if (user.primaryRole === 'maestro') return { ok: true, user };
  if (userCanAccessClient(user, clientKey)) return { ok: true, user };
  if (user.metadataClientKey && user.metadataClientKey === clientKey) return { ok: true, user };

  return { ok: false, reason: 'forbidden' };
}
