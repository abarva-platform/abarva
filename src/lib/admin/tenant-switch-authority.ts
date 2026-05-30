/**
 * Tenant-switch authority resolver — Wave 2 PR-5.
 *
 * Mirrors the gate used by `/admin` layout: a caller is allowed to
 * change the active-tenant view-context only when:
 *   1. publicMetadata.role === 'admin', OR
 *   2. unsafeMetadata.role === 'admin' / publicMetadata.legacyRole === 'admin', OR
 *   3. primary email ∈ ADMIN_EMAIL_ALLOWLIST.
 *
 * The allowlist is the same set the /admin route gates on. If/when
 * that set moves to a single shared module this helper should re-export
 * from there.
 *
 * The 5 canonical tenant options come from the canonical alias table
 * (`src/lib/tenant/aliases.ts`) — the switcher hard-validates against
 * this exact list and never accepts free-form keys.
 *
 * IMPORTANT (audit posture): switching does NOT modify the caller's
 * database role grants. The cookie steers tenant resolution; RLS
 * continues to enforce per-user limits inside the new tenant context.
 */

import 'server-only';

import { currentUser } from '@clerk/nextjs/server';
import { ALL_CLIENTS } from '@/lib/client-config';
import {
  CANONICAL_TENANT_KEYS,
  canonicalTenantDisplayName,
  resolveTenantAlias,
} from '@/lib/tenant/aliases';

// Tenant-switch is strictly stricter than /admin access. The /admin
// layout admits the three locked demo accounts and every CANONICAL
// client-admin email so they can run demo walks — but those accounts
// are *tenant-pinned by design* and must never flip view context.
// The platform-admin (founder + Clerk `role === 'admin'`) gate is the
// only path that should surface the switcher chip.
const TENANT_SWITCH_FOUNDER_ALLOWLIST: ReadonlySet<string> = new Set([
  'anand.sundaram@thesundaram.com',
]);

export interface TenantSwitchOption {
  canonicalKey: string;
  displayName: string;
  industryLabel: string;
}

/**
 * Returns the 5 canonical tenant options the switcher renders.
 *
 * The order matches `ALL_CLIENTS` (apex-retail, meridian-health,
 * first-capital, northstar-clinical, skyharbor-air) so the dropdown
 * stays stable across renders. Each option carries the canonical key
 * (NOT the legacy app-client-key) — POST payloads echo this exact
 * value back, and the server re-validates membership in
 * `CANONICAL_TENANT_KEYS` before honoring the switch.
 */
export function getCanonicalTenantSwitchOptions(): ReadonlyArray<TenantSwitchOption> {
  return ALL_CLIENTS.map((client) => {
    const profile = resolveTenantAlias(client.id);
    if (!profile) {
      // Should never happen — every ALL_CLIENTS entry has a profile.
      return null;
    }
    return {
      canonicalKey: profile.canonicalKey,
      displayName:
        canonicalTenantDisplayName(profile.appClientKey, profile.displayName) ??
        profile.displayName,
      industryLabel: client.vertical,
    } satisfies TenantSwitchOption;
  }).filter((option): option is TenantSwitchOption => option !== null);
}

/**
 * Server-side authority check. Returns true iff the caller is allowed
 * to flip the active-tenant view-context. Mirrors the /admin route gate.
 */
export async function canSwitchActiveTenant(): Promise<boolean> {
  try {
    const user = await currentUser();
    if (!user) return false;
    const role = (user.publicMetadata?.role as string | undefined) ?? '';
    const fallbackRole =
      (user.unsafeMetadata?.role as string | undefined) ??
      (user.publicMetadata?.legacyRole as string | undefined);
    const primaryEmail = user.primaryEmailAddress?.emailAddress?.toLowerCase();
    return (
      role === 'admin' ||
      fallbackRole === 'admin' ||
      (!!primaryEmail && TENANT_SWITCH_FOUNDER_ALLOWLIST.has(primaryEmail))
    );
  } catch {
    return false;
  }
}

/**
 * Hard-validate a requested canonical tenant key against the locked
 * 5-tenant list. Free-form keys, legacy aliases, and unknown values
 * all return false.
 */
export function isCanonicalTenantKey(value: unknown): value is string {
  return (
    typeof value === 'string' && CANONICAL_TENANT_KEYS.includes(value)
  );
}
