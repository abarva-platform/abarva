// OV2-2d-RBAC · Tenant-admin role helper
//
// Distinct posture from the platform-admin gate (Clerk
// `publicMetadata.role === 'admin'` OR primary email on the platform-
// admin allowlist). A `tenant_admin` has authority over THEIR tenant
// only — not the whole platform. The platform-admin posture remains
// the implicit super-set: a platform admin satisfies `tenant_admin`
// for every tenant.
//
// Storage shape (Clerk `publicMetadata`):
//
//   publicMetadata.tenantRoles = {
//     "<tenantKey>": "tenant_admin" | "sponsor" | "sme" | "viewer"
//   }
//
// where `<tenantKey>` is the same ClientKey used elsewhere in the app
// (e.g. `apex-retail`, `meridian`). The tenant-admin role is set via
// the Clerk dashboard today; a UI to manage these assignments will
// follow in a later slice.
//
// Fallback posture (platform admin):
//   When `publicMetadata.tenantRoles` is absent, callers who satisfy
//   the platform-admin gate (role === 'admin' OR allowlist email) are
//   treated as `tenant_admin` for any requested tenantKey. Callers
//   who satisfy NEITHER tenantRoles[tenantKey] === 'tenant_admin' NOR
//   the platform-admin gate get null.
//
// This module is server-only — it reads Clerk user metadata via
// `currentUser()` and must never be imported from a Client Component.

import 'server-only';

import { currentUser } from '@clerk/nextjs/server';

export type TenantRole = 'tenant_admin' | 'sponsor' | 'sme' | 'viewer';

export interface TenantRoleAssignment {
  userId: string;
  tenantKey: string;
  role: TenantRole;
  assignedBy?: string;
  assignedAt?: string;
}

// Mirrors src/app/(maestro)/admin/layout.tsx + the OV2-2c approval-queue
// _auth.ts. The platform-admin posture is the super-set: a user who
// satisfies this gate is treated as `tenant_admin` for every tenant.
// When a UI moves admin assignment off the Clerk dashboard, this list
// stops being load-bearing.
const PLATFORM_ADMIN_EMAIL_ALLOWLIST: ReadonlySet<string> = new Set([
  'anand+clerk_test@abarva.com',
  'anand.sundaram@thesundaram.com',
]);

const VALID_TENANT_ROLES: ReadonlySet<TenantRole> = new Set<TenantRole>([
  'tenant_admin',
  'sponsor',
  'sme',
  'viewer',
]);

function isTenantRole(value: unknown): value is TenantRole {
  return typeof value === 'string' && VALID_TENANT_ROLES.has(value as TenantRole);
}

interface PlatformAdminCheck {
  userId: string | null;
  isPlatformAdmin: boolean;
  tenantRoles: Record<string, unknown> | null;
}

/**
 * Resolves the calling user's Clerk identity and surfaces three pieces
 * of state the tenant-role helpers need:
 *   - userId · the Clerk user id (or null when unauthenticated)
 *   - isPlatformAdmin · platform-admin gate result (publicMetadata.role
 *       OR unsafeMetadata.role OR publicMetadata.legacyRole === 'admin'
 *       OR primary email on the allowlist)
 *   - tenantRoles · the publicMetadata.tenantRoles object verbatim
 *       (or null when absent)
 */
async function resolvePlatformAdminCheck(): Promise<PlatformAdminCheck> {
  const user = await currentUser();
  if (!user) {
    return { userId: null, isPlatformAdmin: false, tenantRoles: null };
  }

  const role = (user.publicMetadata?.role as string | undefined) ?? '';
  const fallbackRole =
    (user.unsafeMetadata?.role as string | undefined) ??
    (user.publicMetadata?.legacyRole as string | undefined);
  const primaryEmail = user.primaryEmailAddress?.emailAddress?.toLowerCase();
  const isPlatformAdmin =
    role === 'admin' ||
    fallbackRole === 'admin' ||
    (!!primaryEmail && PLATFORM_ADMIN_EMAIL_ALLOWLIST.has(primaryEmail));

  const tenantRolesRaw = user.publicMetadata?.tenantRoles;
  const tenantRoles =
    tenantRolesRaw && typeof tenantRolesRaw === 'object' && !Array.isArray(tenantRolesRaw)
      ? (tenantRolesRaw as Record<string, unknown>)
      : null;

  return { userId: user.id, isPlatformAdmin, tenantRoles };
}

/**
 * Returns the role the given user has within the given tenant. Returns
 * null when the user has no assigned role for that tenant.
 *
 * Resolution order:
 *   1. publicMetadata.tenantRoles[tenantKey] — explicit assignment.
 *   2. Platform admin (role === 'admin' OR allowlist email) — implicit
 *      `tenant_admin` for every tenant.
 *   3. null.
 *
 * Note: this helper does NOT default unassigned authenticated users to
 * 'viewer'. Callers that want the implicit-viewer posture for an
 * authenticated active-client member should compose this with their
 * existing membership check (e.g. requireAdminAuth in the approvals
 * queue today). The role here is strictly the assignment, plus the
 * platform-admin override.
 *
 * The helper accepts an explicit `userId` for symmetry with
 * `requireTenantAdmin` and to match the slice spec, but it reads the
 * user from the current Clerk session (Clerk's `currentUser()` always
 * resolves to the calling user). If the resolved Clerk user does not
 * match `args.userId`, we still return null — guarding against
 * mismatched-id calls.
 */
export async function getUserTenantRole(args: {
  userId: string;
  tenantKey: string;
}): Promise<TenantRole | null> {
  const { userId, isPlatformAdmin, tenantRoles } = await resolvePlatformAdminCheck();

  // Mismatched id · the caller asked about a user other than the
  // currently-signed-in one. We don't (yet) support cross-user role
  // lookups; return null rather than risk leaking a different user's
  // posture.
  if (!userId || userId !== args.userId) {
    return null;
  }

  const explicit = tenantRoles?.[args.tenantKey];
  if (isTenantRole(explicit)) {
    return explicit;
  }

  if (isPlatformAdmin) {
    return 'tenant_admin';
  }

  return null;
}

export class TenantRoleError extends Error {
  constructor(
    public readonly status: 401 | 403,
    public readonly code: 'unauthenticated' | 'forbidden_tenant_admin_required',
    message?: string,
  ) {
    super(message ?? code);
    this.name = 'TenantRoleError';
  }
}

/**
 * Throws when the calling user does not have `tenant_admin` rights
 * (explicit or via the platform-admin fallback) for the given tenant.
 *
 *   - 401 unauthenticated · no Clerk session.
 *   - 403 forbidden_tenant_admin_required · authenticated but not
 *     `tenant_admin` for `args.tenantKey`.
 */
export async function requireTenantAdmin(args: {
  userId: string;
  tenantKey: string;
}): Promise<void> {
  const { userId, isPlatformAdmin, tenantRoles } = await resolvePlatformAdminCheck();

  if (!userId) {
    throw new TenantRoleError(401, 'unauthenticated');
  }

  if (userId !== args.userId) {
    // Caller is asserting about a different user. Treat as forbidden
    // — never silently approve.
    throw new TenantRoleError(403, 'forbidden_tenant_admin_required');
  }

  const explicit = tenantRoles?.[args.tenantKey];
  if (isTenantRole(explicit) && explicit === 'tenant_admin') {
    return;
  }

  if (isPlatformAdmin) {
    return;
  }

  throw new TenantRoleError(403, 'forbidden_tenant_admin_required');
}
