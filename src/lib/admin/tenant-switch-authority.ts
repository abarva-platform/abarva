/**
 * Tenant-switch authority resolver — Wave 2 PR-5.
 *
 * Mirrors the gate used by `/admin` layout: a caller is allowed to
 * change the active-tenant view-context only when:
 *   1. ABARVA_ENABLE_TENANT_SWITCHER === '1', AND
 *   2. publicMetadata.role === 'admin', OR
 *   3. unsafeMetadata.role === 'admin' / publicMetadata.legacyRole === 'admin', OR
 *   4. primary email ∈ ADMIN_EMAIL_ALLOWLIST.
 *
 * The allowlist is the same set the /admin route gates on. If/when
 * that set moves to a single shared module this helper should re-export
 * from there.
 *
 * The canonical tenant options come from the canonical alias table
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
//
// IMPORTANT (P1 silent-fail post-mortem · 2026-05-30): the comparison
// MUST be case-insensitive. Clerk does not normalize email case on the
// session object, but the allowlist is canonical-lowercase. We lowercase
// both the primary email AND every verified secondary email before
// comparing — a founder who set up Clerk with `Anand.Sundaram@...` or
// who only has the address as a verified secondary would otherwise see
// the chip on the layout (which uses the same gate) but fail the API
// call silently.
const TENANT_SWITCH_FOUNDER_ALLOWLIST: ReadonlySet<string> = new Set([
  'anand.sundaram@thesundaram.com',
]);

export interface TenantSwitchOption {
  canonicalKey: string;
  displayName: string;
  industryLabel: string;
}

export function isTenantSwitcherEnabled(): boolean {
  return process.env.ABARVA_ENABLE_TENANT_SWITCHER === '1';
}

/**
 * Returns the canonical tenant options the switcher renders.
 *
 * The order matches `ALL_CLIENTS` so the dropdown
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
  if (!isTenantSwitcherEnabled()) return false;
  try {
    const user = await currentUser();
    if (!user) return false;
    const role = (user.publicMetadata?.role as string | undefined) ?? '';
    const fallbackRole =
      (user.unsafeMetadata?.role as string | undefined) ??
      (user.publicMetadata?.legacyRole as string | undefined);
    // Collect every email we can prove belongs to the session — primary
    // plus any verified secondary — and lowercase before comparing. See
    // the post-mortem comment on TENANT_SWITCH_FOUNDER_ALLOWLIST above.
    const candidateEmails = new Set<string>();
    const primary = user.primaryEmailAddress?.emailAddress;
    if (primary) candidateEmails.add(primary.toLowerCase());
    type EmailAddrLite = {
      emailAddress?: string | null;
      verification?: { status?: string | null } | null;
    };
    const secondary = (user.emailAddresses as ReadonlyArray<EmailAddrLite> | undefined) ?? [];
    for (const entry of secondary) {
      const addr = entry.emailAddress?.toLowerCase();
      if (!addr) continue;
      // Only honor verified addresses. An unverified address is
      // attacker-controlled and must not gate authority.
      if (entry.verification?.status === 'verified') {
        candidateEmails.add(addr);
      }
    }
    const allowlistedByEmail = Array.from(candidateEmails).some((addr) =>
      TENANT_SWITCH_FOUNDER_ALLOWLIST.has(addr),
    );
    return (
      role === 'admin' ||
      fallbackRole === 'admin' ||
      allowlistedByEmail
    );
  } catch {
    return false;
  }
}

/**
 * Hard-validate a requested canonical tenant key against the locked
 * canonical tenant list. Free-form keys, legacy aliases, and unknown values
 * all return false.
 */
export function isCanonicalTenantKey(value: unknown): value is string {
  return (
    typeof value === 'string' && CANONICAL_TENANT_KEYS.includes(value)
  );
}
