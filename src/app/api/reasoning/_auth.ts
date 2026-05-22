// Shared auth + tenancy + instance-scoping for /api/reasoning/** routes.
//
// SECURITY (audit 2026-05-22, finding P0-1): every route under
// /api/reasoning previously validated only body shape — no auth(), no
// tenancy, no role check — and stored gate approvals in a process-level
// Map readable cross-tenant by `instanceId`. Any unauthenticated caller
// could read or mutate any tenant's reasoning state.
//
// This module is the single enforcement point. Every reasoning route
// MUST call `requireReasoningTenancy()` first; any route that accepts an
// `instanceId` MUST additionally call `assertInstanceInTenant()` so a
// caller can never read or write an instance owned by another tenant.
// Routes that approve / reject / waive a gate MUST call
// `requireGateApprovalRole()` before the write.

import { requireTenancy, tenancyErrorResponse, TenancyError } from '@/lib/auth/tenancy';
import { clientKeyToInventorySubstrateKey } from '@/lib/agent/tools/intelligence/_shared';
import { resolveAnyInstance } from '@/lib/reasoning/instance-resolver';
import { isGateApprovalStrictMode } from '@/lib/auth/gate-approval-strict-mode';
import type { TenancyCtx } from '@/lib/programs/types.db';

export { TenancyError, tenancyErrorResponse };
export { isGateApprovalStrictMode };

/**
 * Resolve the signed-in user + active client for a reasoning route.
 * Throws TenancyError (handled by `tenancyErrorResponse`) when the
 * session is missing or no client is active.
 */
export async function requireReasoningTenancy(): Promise<TenancyCtx> {
  return requireTenancy();
}

/**
 * Convenience guard for reasoning route handlers. Resolves tenancy and
 * returns `{ ctx }` on success or `{ response }` carrying the 401/403/500
 * the handler should return immediately. Keeps every route's auth
 * preamble to a single line.
 */
export async function guardReasoning(): Promise<
  { ctx: TenancyCtx; response?: undefined } | { ctx?: undefined; response: Response }
> {
  try {
    const ctx = await requireReasoningTenancy();
    return { ctx };
  } catch (err) {
    try {
      return { response: tenancyErrorResponse(err) };
    } catch {
      return {
        response: Response.json({ error: 'internal_error' }, { status: 500 }),
      };
    }
  }
}

/**
 * The reasoning fixtures key instances by the data-room/substrate tenant
 * slug (e.g. `apex-retail`), while `TenancyCtx.clientKey` is the
 * app-facing key (e.g. `apexretail`). Normalize before comparing.
 */
export function reasoningTenantId(ctx: TenancyCtx): string {
  return clientKeyToInventorySubstrateKey(ctx.clientKey ?? '');
}

/**
 * True when the given instance id resolves to an instance owned by the
 * session's tenant. `instanceId` values that do not resolve to any known
 * instance (tower aggregates, demo ids, ad-hoc evidence keys) are treated
 * as in-scope — they carry no cross-tenant data on their own and the
 * underlying stores are still tenant-gated by the auth check. Only a
 * resolvable instance owned by a *different* tenant is rejected.
 */
export function isInstanceInTenant(ctx: TenancyCtx, instanceId: string): boolean {
  if (!instanceId) return false;
  const resolvedGlobal = resolveAnyInstance(instanceId);
  if (!resolvedGlobal) {
    // Not a known program/source instance — nothing cross-tenant to leak.
    return true;
  }
  const scoped = resolveAnyInstance(instanceId, { tenantId: reasoningTenantId(ctx) });
  return scoped !== null;
}

/**
 * Returns a 404 Response when `instanceId` belongs to another tenant,
 * otherwise null. 404 (not 403) so the route does not confirm the
 * existence of cross-tenant instances.
 */
export function assertInstanceInTenant(
  ctx: TenancyCtx,
  instanceId: string,
): Response | null {
  if (isInstanceInTenant(ctx, instanceId)) return null;
  return Response.json(
    { error: 'not_found', detail: `instance ${instanceId} not found` },
    { status: 404 },
  );
}

const GATE_APPROVAL_ROLES = new Set([
  'maestro',
  'admin',
  'client_admin',
  'abarva_super_admin',
  'founder',
  'sponsor',
  'approver',
]);

const STRICT_GATE_APPROVAL_ROLES = new Set([
  'maestro',
  'admin',
  'client_admin',
  'abarva_super_admin',
  'founder',
]);

/**
 * Enforce that the caller may approve / reject a gate criterion.
 *
 * - Default (pilot): any client member with an approval-bearing role
 *   (sponsor / approver / admin / maestro) may approve.
 * - GATE_APPROVAL_STRICT_MODE on: only admin / maestro may approve.
 *
 * Returns a 403 Response when the role check fails, otherwise null.
 */
export function requireGateApprovalRole(ctx: TenancyCtx): Response | null {
  const role = (ctx.role ?? '').trim().toLowerCase();
  const allowed = isGateApprovalStrictMode()
    ? STRICT_GATE_APPROVAL_ROLES
    : GATE_APPROVAL_ROLES;
  if (role && allowed.has(role)) return null;
  return Response.json(
    {
      error: 'forbidden',
      detail: isGateApprovalStrictMode()
        ? 'Gate approval requires an admin or maestro role (GATE_APPROVAL_STRICT_MODE).'
        : 'Gate approval requires an approval-bearing role (sponsor, approver, admin, or maestro).',
    },
    { status: 403 },
  );
}
