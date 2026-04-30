// OV2-2c · Tenant-admin approval queue · shared auth helpers
//
// Centralises the auth + role-check posture used by GET /api/admin/programs/approvals
// and POST /api/admin/programs/approvals/[requestId]. Two postures:
//
//   • requireAdminAuth() — read posture. Authenticated user with an
//     active tenant. We do NOT block read on role today — see the
//     RBAC posture note below.
//
//   • requireAdminDecide() — decide posture. Authenticated user with
//     an active tenant AND a Clerk publicMetadata.role of 'admin' or
//     a primary email on the platform-admin allowlist (mirrors the
//     /admin layout gate). Decisions land in the audit trail (see
//     decideApprovalRequest), so we err on the side of stricter
//     gating here.
//
// RBAC posture note (OV2-2c → OV2-2d-RBAC):
//   The codebase today does not have a "tenant_admin" role distinct
//   from "platform_admin". Until OV2-2d-RBAC introduces the dedicated
//   role helper, we reuse the platform-admin gate from
//   src/app/(maestro)/admin/layout.tsx for decide actions. Read access
//   to the queue is restricted to authenticated users with an active
//   tenant — anyone who can already see the /admin tree.

import { auth, currentUser } from '@clerk/nextjs/server';
import { getActiveClientRow } from '@/lib/active-client';

// Mirrors src/app/(maestro)/admin/layout.tsx. When OV2-2d-RBAC ships
// the proper tenant_admin role helper this list goes away.
const ADMIN_EMAIL_ALLOWLIST: ReadonlySet<string> = new Set([
  'anand+clerk_test@abarva.com',
  'anand.sundaram@thesundaram.com',
]);

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

/**
 * Read posture · authenticated user with an active tenant.
 * Returns the user's tenantKey and whether they qualify as admin
 * (callers can decide whether to gate further actions on this).
 */
export async function requireAdminAuth(): Promise<AdminAuthCtx> {
  const session = await auth();
  if (!session.userId) {
    throw new AdminAuthError(401, 'unauthenticated');
  }
  const client = await getActiveClientRow();
  if (!client) {
    throw new AdminAuthError(403, 'no_tenant');
  }

  const user = await currentUser();
  const role = (user?.publicMetadata?.role as string | undefined) ?? '';
  const fallbackRole =
    (user?.unsafeMetadata?.role as string | undefined) ??
    (user?.publicMetadata?.legacyRole as string | undefined);
  const primaryEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
  const isAdmin =
    role === 'admin' ||
    fallbackRole === 'admin' ||
    (!!primaryEmail && ADMIN_EMAIL_ALLOWLIST.has(primaryEmail));

  return {
    userId: session.userId,
    tenantKey: client.key,
    isAdmin,
  };
}

/**
 * Decide posture · same as requireAdminAuth() but throws 403 unless
 * the user qualifies as admin (publicMetadata.role === 'admin' OR
 * platform-admin email allowlist).
 */
export async function requireAdminDecide(): Promise<AdminAuthCtx> {
  const ctx = await requireAdminAuth();
  if (!ctx.isAdmin) {
    throw new AdminAuthError(403, 'forbidden_admin_required');
  }
  return ctx;
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
