import { isLockedTenantRole } from '@/lib/auth/access-routing';
import type { ClientKey } from '@/lib/client-config';
import {
  ACTIVE_CLIENT_COOKIE,
  resolveTenant,
} from '@/lib/tenant/resolveTenant';

// Server-side resolution of the active client for the signed-in user.
// Kept as the legacy public API while Packet 30 consolidates all tenant
// resolution behind src/lib/tenant/resolveTenant.ts.
//
// Isolation: locked account users ignore requested client ids and resolve
// from server-trusted session/cookie fallbacks. Admin + investor can switch
// via the top-nav dropdown.
//
// Preference precedence (Wave 2 PR-5 · TenantSwitcher integration):
//   1. Explicit email-domain tenant alias (e.g. cio@apex-retail.example.com)
//      — always wins for tenant-locked sessions; ignored for unlocked roles.
//   2. `requestedClient` argument (URL ?client= / body / surface override)
//      — honored only for non-locked roles.
//   3. `abarva_active_client` cookie — written by `POST /api/admin/switch-tenant`
//      so the Wave 2 PR-5 TenantSwitcher chip flips the entire /admin
//      surface for the next request. The cookie value is the legacy
//      app-client key; the resolver normalizes through
//      `appClientKeyForTenant` so canonical and legacy aliases both work.
//   4. Clerk session `publicMetadata.clientId` / `defaultClientId`.
//   5. Email-domain inference (best-effort).
//   6. DEFAULT_CLIENT_KEY fallback when `allowFallback !== false`.

export { ACTIVE_CLIENT_COOKIE };

export async function getActiveClientKey(requestedClientId?: string | null): Promise<ClientKey> {
  const tenant = await resolveTenant({ requestedClient: requestedClientId });
  return tenant.appClientKey;
}

/**
 * True only when the request carries an authenticated session that is
 * pinned to exactly one tenant (a "locked" client / maestro persona).
 *
 * SEC-P0 (audit 2026-05-22): the public `/intelligence` route must never
 * resolve tenant-scoped data from a `?client=` URL param supplied by an
 * unauthenticated (or non-tenant-locked) visitor. Public callers gate on
 * this before passing any requested client key into `getActiveClientRow`.
 */
export async function hasLockedTenantSession(): Promise<boolean> {
  try {
    const { currentUser } = await import('@clerk/nextjs/server');
    const user = await currentUser();
    const role = user?.publicMetadata?.role as string | undefined;
    const email = user?.primaryEmailAddress?.emailAddress
      ?? user?.emailAddresses?.[0]?.emailAddress
      ?? undefined;
    if (!role && !email) return false;
    return isLockedTenantRole(role, email);
  } catch {
    return false;
  }
}

/**
 * Resolve the active client's UUID from the `clients` table. Returns null
 * when no matching row exists (e.g. Pack H/J seeds not yet applied on prod).
 * Callers should treat null as "no active client" and render an empty-state
 * rather than silently showing cross-client data.
 */
export async function getActiveClientRow(
  requestedClientId?: string | null,
): Promise<{ id: string; name: string; industry_code: string | null; key: ClientKey } | null> {
  const tenant = await resolveTenant({ requestedClient: requestedClientId });
  if (!tenant.clientId) return null;
  return {
    id: tenant.clientId,
    name: tenant.displayName,
    industry_code: tenant.industryCode,
    key: tenant.appClientKey,
  };
}
