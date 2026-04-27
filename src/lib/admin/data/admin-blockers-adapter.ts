/**
 * ADMIN-DATA2 — Admin blockers adapter.
 */

import type {
  AdminBlockerRow,
  AdminBlockerStatus,
} from './admin-blockers-adapter-types';
import {
  AdminDataMigrationPendingError,
  isFixtureMode,
} from './admin-data-mode';
import {
  adminBlockerDetailFixture,
  adminBlockersFixture,
  adminCriticalBlockersFixture,
} from './fixtures/admin-blockers-fixture';

export async function getAdminBlockers(
  tenantSlug: string,
  status?: AdminBlockerStatus,
): Promise<ReadonlyArray<AdminBlockerRow>> {
  if (isFixtureMode()) {
    const all = adminBlockersFixture(tenantSlug);
    return status ? all.filter((b) => b.status === status) : all;
  }
  throw new AdminDataMigrationPendingError('admin_blockers');
}

export async function getAdminBlockerById(
  tenantSlug: string,
  blockerId: string,
): Promise<AdminBlockerRow | null> {
  if (isFixtureMode()) return adminBlockerDetailFixture(tenantSlug, blockerId);
  throw new AdminDataMigrationPendingError('admin_blockers');
}

export async function getAdminBlockerDetail(
  tenantSlug: string,
  blockerId: string,
): Promise<AdminBlockerRow | null> {
  return getAdminBlockerById(tenantSlug, blockerId);
}

export async function getAdminCriticalBlockers(
  tenantSlug: string,
): Promise<ReadonlyArray<AdminBlockerRow>> {
  if (isFixtureMode()) return adminCriticalBlockersFixture(tenantSlug);
  throw new AdminDataMigrationPendingError('admin_blockers');
}

export function getAdminBlockersFixture(
  tenantSlug: string = 'apex-retail',
): ReadonlyArray<AdminBlockerRow> {
  return adminBlockersFixture(tenantSlug);
}
