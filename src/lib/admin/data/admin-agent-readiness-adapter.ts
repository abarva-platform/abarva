/**
 * ADMIN-DATA2 — Admin agent-readiness adapter.
 * DATA11 — Graceful fallback to fixture (no admin_agent_readiness table yet).
 */

import type { AdminAgentReadinessSnapshot } from './admin-agent-readiness-adapter-types';
import { isFixtureMode } from './admin-data-mode';
import { adminAgentReadinessFixture } from './fixtures/admin-agent-readiness-fixture';

export async function getAdminAgentReadiness(
  tenantSlug: string,
): Promise<AdminAgentReadinessSnapshot> {
  if (isFixtureMode()) return adminAgentReadinessFixture(tenantSlug);
  // No admin_agent_readiness table. Readiness is derived from posture compute — deferred.
  // Graceful fallback: return fixture data.
  return adminAgentReadinessFixture(tenantSlug);
}

export function getAdminAgentReadinessFixture(
  tenantSlug: string = 'apex-retail',
): AdminAgentReadinessSnapshot {
  return adminAgentReadinessFixture(tenantSlug);
}
