/**
 * ADMIN-DATA2 — Admin overview adapter.
 *
 * Server-only async reader. Fixture mode is the default. Live mode throws
 * `AdminDataMigrationPendingError` until DATA10 lands the migrations.
 */

import type { AdminOverviewSnapshot } from './admin-overview-adapter-types';
import {
  AdminDataMigrationPendingError,
  isFixtureMode,
} from './admin-data-mode';
import { adminOverviewSnapshotFixture } from './fixtures/admin-overview-fixture';

export async function getAdminOverviewSnapshot(
  tenantSlug: string,
): Promise<AdminOverviewSnapshot> {
  if (isFixtureMode()) {
    return adminOverviewSnapshotFixture(tenantSlug);
  }
  throw new AdminDataMigrationPendingError('admin_setup_progress');
}

export function getAdminOverviewFixture(
  tenantSlug: string = 'apex-retail',
): AdminOverviewSnapshot {
  return adminOverviewSnapshotFixture(tenantSlug);
}
