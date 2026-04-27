/**
 * ADMIN-DATA2 — Admin setup-progress adapter.
 */

import type { AdminSetupStep } from './admin-setup-progress-adapter-types';
import {
  AdminDataMigrationPendingError,
  isFixtureMode,
} from './admin-data-mode';
import { adminSetupProgressFixture } from './fixtures/admin-setup-progress-fixture';

export async function getAdminSetupProgress(
  tenantSlug: string,
): Promise<ReadonlyArray<AdminSetupStep>> {
  if (isFixtureMode()) return adminSetupProgressFixture(tenantSlug);
  throw new AdminDataMigrationPendingError('admin_setup_progress');
}

export function getAdminSetupProgressFixture(
  tenantSlug: string = 'apex-retail',
): ReadonlyArray<AdminSetupStep> {
  return adminSetupProgressFixture(tenantSlug);
}
