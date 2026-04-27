/**
 * ADMIN-DATA2 — Admin production-readiness adapter.
 */

import type { AdminProductionReadinessSnapshot } from './admin-production-readiness-adapter-types';
import {
  AdminDataMigrationPendingError,
  isFixtureMode,
} from './admin-data-mode';
import { adminProductionReadinessFixture } from './fixtures/admin-production-readiness-fixture';

export async function getAdminProductionReadiness(
  tenantSlug: string,
): Promise<AdminProductionReadinessSnapshot> {
  if (isFixtureMode()) return adminProductionReadinessFixture(tenantSlug);
  throw new AdminDataMigrationPendingError('admin_blockers + admin_readiness_history');
}

export async function getAdminProductionReadinessSnapshot(
  tenantSlug: string,
): Promise<AdminProductionReadinessSnapshot> {
  return getAdminProductionReadiness(tenantSlug);
}

export function getAdminProductionReadinessFixture(
  tenantSlug: string = 'apex-retail',
): AdminProductionReadinessSnapshot {
  return adminProductionReadinessFixture(tenantSlug);
}
