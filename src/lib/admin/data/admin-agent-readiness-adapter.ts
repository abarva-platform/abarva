/**
 * ADMIN-DATA2 — Admin agent-readiness adapter.
 */

import type { AdminAgentReadinessSnapshot } from './admin-agent-readiness-adapter-types';
import {
  AdminDataMigrationPendingError,
  isFixtureMode,
} from './admin-data-mode';
import { adminAgentReadinessFixture } from './fixtures/admin-agent-readiness-fixture';

export async function getAdminAgentReadiness(
  tenantSlug: string,
): Promise<AdminAgentReadinessSnapshot> {
  if (isFixtureMode()) return adminAgentReadinessFixture(tenantSlug);
  throw new AdminDataMigrationPendingError('admin_agent_readiness');
}

export function getAdminAgentReadinessFixture(
  tenantSlug: string = 'apex-retail',
): AdminAgentReadinessSnapshot {
  return adminAgentReadinessFixture(tenantSlug);
}
