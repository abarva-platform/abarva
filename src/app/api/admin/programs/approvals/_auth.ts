// OV2-2c · Tenant-admin approval queue · shared auth helpers
// OV2-2d-RBAC · Migrated decide gate to the dedicated `tenant_admin` role helper.
// 2026-05-01 E2E fix: approval decisions now honor the DB-backed tenant
// program-access policy used by the /admin shell. The canonical user model is
// person_client_memberships, not Clerk-only tenantRoles.
//
// Centralises the auth + role-check posture used by GET /api/admin/programs/approvals
// and POST /api/admin/programs/approvals/[requestId]. Two postures:
//
//   • requireAdminAuth() — read posture. Authenticated user with an
//     active tenant. We do NOT block read on role today — anyone who
//     can see the /admin tree can VIEW the queue. The decide gate is
//     stricter (see below).
//
//   • requireAdminDecide() — decide posture. Authenticated user with
//     an active tenant AND `tenant_admin` rights for that tenant
//     (resolved by `requireTenantAdmin` in src/lib/auth/tenant-roles.ts).
//     The platform-admin gate (Clerk `publicMetadata.role === 'admin'`
//     OR primary email on the allowlist) implicitly satisfies
//     `tenant_admin` for every tenant — see the role helper docs.
//     Decisions land in the audit trail (see decideApprovalRequest),
//     so we err on the side of stricter gating here.
//
// RBAC posture (post OV2-2d-RBAC):
//   `tenant_admin` is now distinct from `platform_admin`. Per-tenant
//   role assignment lives on Clerk `publicMetadata.tenantRoles[tenantKey]`.
//   Until per-tenant assignments are populated, the platform-admin
//   posture continues to satisfy decide actions on every tenant.
//   See src/lib/auth/tenant-roles.ts for the metadata shape and the
//   fallback rules.

import { auth } from '@clerk/nextjs/server';
import { getActiveClientRow } from '@/lib/active-client';
import { requireTenancy, TenancyError } from '@/lib/auth/tenancy';
import { loadUserProgramAccessPolicy } from '@/lib/auth/program-access-policy';
import type { TenancyCtx } from '@/lib/programs/types.db';

export interface AdminAuthCtx {
  userId: string;
  tenantKey: string;
  isAdmin: boolean;
}

export class AdminAuthError extends Error {
  constructor(
    public readonly status: 401 | 403,
    public readonly code:
      | 'unauthenticated'
      | 'no_tenant'
      | 'forbidden_admin_required',
    message?: string,
  ) {
    super(message ?? code);
    this.name = 'AdminAuthError';
  }
}

async function resolveAdminAuthCtx(): Promise<AdminAuthCtx & { tenancy: TenancyCtx }> {
  const session = await auth();
  if (!session.userId) {
    throw new AdminAuthError(401, 'unauthenticated');
  }
  const client = await getActiveClientRow();
  if (!client) {
    throw new AdminAuthError(403, 'no_tenant');
  }

  try {
    const tenancy = await requireTenancy();
    return {
      userId: tenancy.userId,
      tenantKey: client.key,
      isAdmin: false,
      tenancy,
    };
  } catch (err) {
    if (err instanceof TenancyError) {
      throw new AdminAuthError(
        err.code === 'unauthenticated' ? 401 : 403,
        err.code === 'unauthenticated' ? 'unauthenticated' : 'no_tenant',
      );
    }
    throw err;
  }
}

/**
 * Read posture · authenticated user with an active tenant.
 *
 * Returns the user's tenantKey. The `isAdmin` flag is preserved on the
 * return shape for backward compatibility, but the read endpoint no
 * longer branches on it — any authenticated active-client member can
 * VIEW the queue. To check decide-rights from a caller other than the
 * route handler, use `requireTenantAdmin` directly.
 */
export async function requireAdminAuth(): Promise<AdminAuthCtx> {
  const ctx = await resolveAdminAuthCtx();

  // Probe the DB-backed admin posture without throwing — `isAdmin` here
  // is informational for callers that surface admin-only affordances.
  let isAdmin = false;
  try {
    const policy = await loadUserProgramAccessPolicy({
      ...ctx.tenancy,
      userId: ctx.userId,
    });
    isAdmin = policy.canAdminUsers === true || policy.canApproveGates === true;
  } catch {
    isAdmin = false;
  }

  return {
    userId: ctx.userId,
    tenantKey: ctx.tenantKey,
    isAdmin,
  };
}

/**
 * Decide posture · authenticated active-client member who is
 * `tenant_admin` for their active tenant. Throws AdminAuthError(403,
 * 'forbidden_admin_required') otherwise.
 */
export async function requireAdminDecide(): Promise<AdminAuthCtx> {
  const ctx = await resolveAdminAuthCtx();
  const policy = await loadUserProgramAccessPolicy(ctx.tenancy);
  if (policy.canAdminUsers !== true && policy.canApproveGates !== true) {
    throw new AdminAuthError(403, 'forbidden_admin_required');
  }

  return {
    userId: ctx.userId,
    tenantKey: ctx.tenantKey,
    isAdmin: true,
  };
}

export function adminAuthErrorResponse(err: unknown): Response {
  if (err instanceof AdminAuthError) {
    return Response.json(
      { error: err.code },
      { status: err.status },
    );
  }
  throw err;
}
