/**
 * ADMIN-DATA2 — Admin users adapter.
 * DATA11 — Graceful fallback to fixture (no admin_users/admin_invites table yet).
 */

import type {
  AdminInviteRow,
  AdminRoleSummary,
  AdminUserDetail,
  AdminUserRow,
} from './admin-users-adapter-types';
import { isFixtureMode } from './admin-data-mode';
import {
  adminInvitesFixture,
  adminRoleSummaryFixture,
  adminUserDetailFixture,
  adminUsersFixture,
} from './fixtures/admin-users-fixture';

export async function getAdminUsers(
  tenantSlug: string,
): Promise<ReadonlyArray<AdminUserRow>> {
  if (isFixtureMode()) return adminUsersFixture(tenantSlug);
  // No admin_users/admin_invites table in DATA10 migrations.
  // Real user data comes from Clerk via team_memberships — deferred to post-DATA11.
  // Graceful fallback: return fixture data.
  return adminUsersFixture(tenantSlug);
}

export async function getAdminUserDetail(
  tenantSlug: string,
  userId: string,
): Promise<AdminUserDetail | null> {
  if (isFixtureMode()) return adminUserDetailFixture(tenantSlug, userId);
  // No admin_users/admin_invites table in DATA10 migrations.
  // Graceful fallback: return fixture data.
  return adminUserDetailFixture(tenantSlug, userId);
}

export async function getAdminInvites(
  tenantSlug: string,
): Promise<ReadonlyArray<AdminInviteRow>> {
  if (isFixtureMode()) return adminInvitesFixture(tenantSlug);
  // No admin_invites table in DATA10 migrations.
  // Graceful fallback: return fixture data.
  return adminInvitesFixture(tenantSlug);
}

export async function getAdminRoleMatrix(
  tenantSlug: string,
): Promise<ReadonlyArray<AdminRoleSummary>> {
  if (isFixtureMode()) return adminRoleSummaryFixture(tenantSlug);
  // No admin_users/admin_invites table in DATA10 migrations.
  // Graceful fallback: return fixture data.
  return adminRoleSummaryFixture(tenantSlug);
}

export async function getAdminRoleSummary(
  tenantSlug: string,
): Promise<ReadonlyArray<AdminRoleSummary>> {
  return getAdminRoleMatrix(tenantSlug);
}

export function getAdminUsersFixture(
  tenantSlug: string = 'apex-retail',
): ReadonlyArray<AdminUserRow> {
  return adminUsersFixture(tenantSlug);
}
