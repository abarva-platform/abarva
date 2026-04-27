/**
 * ADMIN-DATA2 — Admin users adapter.
 */

import type {
  AdminInviteRow,
  AdminRoleSummary,
  AdminUserDetail,
  AdminUserRow,
} from './admin-users-adapter-types';
import {
  AdminDataMigrationPendingError,
  isFixtureMode,
} from './admin-data-mode';
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
  throw new AdminDataMigrationPendingError('persons + team_memberships');
}

export async function getAdminUserDetail(
  tenantSlug: string,
  userId: string,
): Promise<AdminUserDetail | null> {
  if (isFixtureMode()) return adminUserDetailFixture(tenantSlug, userId);
  throw new AdminDataMigrationPendingError('persons + audit_log');
}

export async function getAdminInvites(
  tenantSlug: string,
): Promise<ReadonlyArray<AdminInviteRow>> {
  if (isFixtureMode()) return adminInvitesFixture(tenantSlug);
  throw new AdminDataMigrationPendingError('admin_invites');
}

export async function getAdminRoleMatrix(
  tenantSlug: string,
): Promise<ReadonlyArray<AdminRoleSummary>> {
  if (isFixtureMode()) return adminRoleSummaryFixture(tenantSlug);
  throw new AdminDataMigrationPendingError('persons + team_memberships');
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
