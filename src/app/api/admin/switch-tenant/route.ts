/**
 * POST /api/admin/switch-tenant — Wave 2 PR-5.
 *
 * Flips the active-tenant view-context for the calling user.
 *
 * Contract:
 *   request:  { tenantKey: <canonical-key> }
 *   response: { ok: true } on 200
 *             { error: 'invalid_tenant' | 'unauthenticated' | 'forbidden' }
 *
 * Posture:
 *   - Canonical tenants ONLY (apex-retail, meridian-health,
 *     first-capital, northstar-clinical, skyharbor-air,
 *     lakeshore-holdings). Free-form keys are rejected with 400.
 *     The list is validated against
 *     `isCanonicalTenantKey` from the authority module — the same
 *     source the component reads, so server and client cannot drift.
 *   - Authority: `canSwitchActiveTenant` — founder + Clerk
 *     `role === 'admin'`. Demo accounts and the canonical client-admin
 *     emails are explicitly NOT permitted (they are tenant-pinned by
 *     design). Non-admins get 403 and never see the chip.
 *   - Audit: every successful switch lands in `admin_audit_log`
 *     (category='auth', action='tenant_switched') so the Isolation
 *     lane can surface "User X switched tenant A → B at HH:MM".
 *     Failures (auth + validation) are also logged at warn level.
 *   - Cookie: rewrites `abarva_active_client` (same name used by the
 *     resolver in `src/lib/tenant/resolveTenant.ts`). httpOnly+
 *     sameSite=lax+secure-when-https. The cookie does NOT change the
 *     user's database role grants; RLS continues to enforce per-user
 *     limits inside the new tenant context.
 */

import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { ACTIVE_CLIENT_COOKIE } from '@/lib/tenant/resolveTenant';
import { resolveTenantAlias } from '@/lib/tenant/aliases';
import {
  canSwitchActiveTenant,
  isCanonicalTenantKey,
} from '@/lib/admin/tenant-switch-authority';
import { writeTenantSwitchAudit } from '@/lib/admin/tenant-switch-audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface SwitchTenantRequest {
  tenantKey?: unknown;
}

/**
 * Structured-log emitter for every reject path. Keyed fields let us
 * correlate Vercel logs with browser behavior when a tenant switch
 * silent-fails (the diagnostic gap that motivated this hardening pass
 * — see docs/build/MANUAL_BROWSER_WALKTHROUGH_2026-05-30.md §P1 #3).
 *
 * Note: we ONLY log fields the server already knows. We never echo
 * raw request bodies, schema names, or stack traces — those could
 * leak internal structure to a Vercel log consumer.
 */
function logRejection(reason: string, fields: Record<string, unknown>): void {
  console.warn(
    JSON.stringify({
      event: 'tenant_switch_rejected',
      reject_reason: reason,
      ts: new Date().toISOString(),
      ...fields,
    }),
  );
}

async function safePrimaryEmail(): Promise<string | null> {
  try {
    const user = await currentUser();
    return user?.primaryEmailAddress?.emailAddress?.toLowerCase() ?? null;
  } catch {
    return null;
  }
}

export async function POST(request: Request): Promise<Response> {
  // Auth — must have a Clerk session.
  const session = await auth();
  if (!session.userId) {
    logRejection('unauthenticated', {
      actor_user_id: null,
      actor_email: null,
      requested_tenant: null,
    });
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  // Authority — founder + Clerk `role === 'admin'` only. Demo accounts
  // and the canonical client-admin emails are explicitly NOT permitted.
  const canSwitch = await canSwitchActiveTenant();
  if (!canSwitch) {
    logRejection('forbidden_not_switch_admin', {
      actor_user_id: session.userId,
      actor_email: await safePrimaryEmail(),
      requested_tenant: null,
    });
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  // Parse + validate. Body must be JSON; tenantKey must be a canonical
  // key (one of the canonical keys from `aliases.ts`). Legacy app-client-keys and
  // arbitrary strings are rejected.
  let body: SwitchTenantRequest;
  try {
    body = (await request.json()) as SwitchTenantRequest;
  } catch {
    logRejection('invalid_json_body', {
      actor_user_id: session.userId,
      actor_email: await safePrimaryEmail(),
      requested_tenant: null,
    });
    return NextResponse.json({ error: 'invalid_tenant' }, { status: 400 });
  }
  const requestedKey = body.tenantKey;
  if (!isCanonicalTenantKey(requestedKey)) {
    logRejection('non_canonical_tenant_key', {
      actor_user_id: session.userId,
      actor_email: await safePrimaryEmail(),
      requested_tenant:
        typeof requestedKey === 'string' ? requestedKey : null,
    });
    return NextResponse.json({ error: 'invalid_tenant' }, { status: 400 });
  }

  // Resolve previous canonical key from the existing cookie (best-effort
  // — null when not previously set).
  let previousCanonicalKey: string | null = null;
  try {
    const cookieHeader = request.headers.get('cookie') ?? '';
    const match = cookieHeader
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${ACTIVE_CLIENT_COOKIE}=`));
    if (match) {
      const raw = decodeURIComponent(match.slice(ACTIVE_CLIENT_COOKIE.length + 1));
      const profile = resolveTenantAlias(raw);
      previousCanonicalKey = profile?.canonicalKey ?? null;
    }
  } catch {
    previousCanonicalKey = null;
  }

  // Resolve the requested canonical key back to the legacy app-client
  // key for the cookie value — the resolver in `resolveTenant.ts` reads
  // the cookie through `appClientKeyForTenant`, which accepts either
  // form, but writing the legacy app-client key keeps things stable
  // across the read paths that haven't yet migrated.
  const profile = resolveTenantAlias(requestedKey);
  if (!profile) {
    // Should never happen — isCanonicalTenantKey already screens this.
    return NextResponse.json({ error: 'invalid_tenant' }, { status: 400 });
  }

  // Audit the switch BEFORE we write the cookie so the audit row is
  // always present, even if the cookie write somehow throws. A failed
  // audit write MUST NOT block the switch — the structured log line
  // below is the always-on second audit channel.
  try {
    await writeTenantSwitchAudit({
      actorUserId: session.userId,
      fromCanonicalKey: previousCanonicalKey,
      toCanonicalKey: profile.canonicalKey,
    });
  } catch (auditErr) {
    logRejection('audit_write_failed_nonfatal', {
      actor_user_id: session.userId,
      actor_email: await safePrimaryEmail(),
      requested_tenant: profile.canonicalKey,
      audit_error:
        auditErr instanceof Error ? auditErr.message : String(auditErr),
    });
  }

  // Emit a structured log line as a second audit channel — this is the
  // signal the Isolation lane (W2-PR-2) consumes if the DB audit table
  // is not yet seeded for the active tenant.
  console.log(
    JSON.stringify({
      event: 'tenant_switched',
      actor: session.userId,
      from: previousCanonicalKey,
      to: profile.canonicalKey,
      ts: new Date().toISOString(),
    }),
  );

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: ACTIVE_CLIENT_COOKIE,
    value: profile.appClientKey,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    // 30 days — same window any reasonable Setup session would carry.
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
