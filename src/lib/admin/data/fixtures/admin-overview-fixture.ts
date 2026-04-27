/**
 * ADMIN-DATA2 — Admin overview fixture.
 *
 * Composes setup steps + recent activity + cross-page counts from the
 * other admin fixtures.
 */

import type { AdminOverviewSnapshot } from '../admin-overview-adapter-types';
import { adminAuditEventsFixture } from './admin-audit-log-fixture';
import { adminBlockersFixture } from './admin-blockers-fixture';
import { adminConnectorsFixture } from './admin-connectors-fixture';
import { adminDatasetApprovalsFixture } from './admin-datasets-fixture';
import { adminInvitesFixture } from './admin-users-fixture';
import { adminProductionReadinessFixture } from './admin-production-readiness-fixture';
import { adminSetupProgressFixture } from './admin-setup-progress-fixture';

const GENERATED_AT = '2026-04-26T00:00:00.000Z';

const TENANT_NAMES: Record<string, string> = {
  'apex-retail': 'Apex Retail',
  meridian: 'Meridian',
};

export function adminOverviewSnapshotFixture(
  tenantSlug: string,
): AdminOverviewSnapshot {
  const tenantName = TENANT_NAMES[tenantSlug] ?? tenantSlug;
  const setupSteps = adminSetupProgressFixture(tenantSlug);
  const recentActivity = adminAuditEventsFixture(tenantSlug, { limit: 10 });
  const blockers = adminBlockersFixture(tenantSlug);
  const datasetApprovals = adminDatasetApprovalsFixture(tenantSlug, 'pending');
  const connectors = adminConnectorsFixture(tenantSlug);
  const invites = adminInvitesFixture(tenantSlug);
  const readiness = adminProductionReadinessFixture(tenantSlug);

  const openBlockers = blockers.filter((b) => b.status === 'open' || b.status === 'in_progress').length;
  const datasetsPendingApproval = datasetApprovals.length;
  const connectorsNotConfigured = connectors.filter((c) => c.status === 'not_configured').length;
  const invitesPending = invites.filter((i) => i.status === 'pending').length;
  const productionReadinessGatesFailing = readiness.tiles
    .filter((t) => t.status === 'partial' || t.status === 'blocked')
    .reduce((sum, t) => sum + t.failingCriteria.length, 0);

  return {
    tenant: { slug: tenantSlug, name: tenantName },
    setupSteps,
    recentActivity,
    crossPageCounts: {
      openBlockers,
      datasetsPendingApproval,
      connectorsNotConfigured,
      invitesPending,
      productionReadinessGatesFailing,
    },
    generatedAt: GENERATED_AT,
  };
}
