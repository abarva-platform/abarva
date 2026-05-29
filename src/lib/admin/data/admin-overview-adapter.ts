/**
 * ADMIN-DATA2 — Admin overview adapter.
 * DATA11 — Live path wired to Azure read plane.
 *
 * Server-only async reader. Fixture mode is the default. Live mode queries
 * multiple admin tables in parallel to compose the overview snapshot.
 */

import type { AdminOverviewSnapshot } from './admin-overview-adapter-types';
import type { AdminAuditCategory, AdminAuditEvent } from './admin-audit-log-adapter-types';
import type { AdminSetupStepId, AdminSetupStepStatus } from './admin-setup-progress-adapter-types';
import {
  isFixtureMode,
} from './admin-data-mode';
import { adminOverviewSnapshotFixture } from './fixtures/admin-overview-fixture';
import { azureRead } from '@/lib/data-plane/azureRead';
import { requireClientId, SETUP_STEP_LABELS } from './admin-db-helpers';

export async function getAdminOverviewSnapshot(
  tenantSlug: string,
): Promise<AdminOverviewSnapshot> {
  if (isFixtureMode()) {
    return adminOverviewSnapshotFixture(tenantSlug);
  }

  const clientId = await requireClientId(tenantSlug);

  const [
    stepsData,
    activityData,
    openBlockers,
    pendingApprovals,
    notConfigured,
  ] = await Promise.all([
    azureRead.select<{
      step_id: string;
      status: string;
      description: string;
      computed_at: string;
    }>({
      table: 'admin_setup_progress',
      columns: ['step_id', 'status', 'description', 'computed_at'],
      where: { client_id: clientId },
    }),
    azureRead.select<{
      id: string;
      category: string;
      action: string;
      actor_person_id: string | null;
      target_kind: string | null;
      target_id: string | null;
      summary: string;
      created_at: string;
    }>({
      table: 'admin_audit_log',
      columns: [
        'id',
        'category',
        'action',
        'actor_person_id',
        'target_kind',
        'target_id',
        'summary',
        'created_at',
      ],
      where: { client_id: clientId },
      orderBy: { column: 'created_at', direction: 'desc' },
      limit: 10,
    }),
    azureRead.count({
      table: 'admin_blockers',
      where: { client_id: clientId, status: { op: 'in', value: ['open', 'in_progress'] } },
    }),
    azureRead.count({
      table: 'admin_dataset_approvals',
      where: { client_id: clientId, status: 'pending' },
    }),
    azureRead.count({
      table: 'admin_connectors',
      where: { client_id: clientId, status: 'not_configured' },
    }),
  ]);

  const tenantName = tenantSlug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  const setupSteps = stepsData.map((row) => ({
    id: row.step_id as AdminSetupStepId,
    label: SETUP_STEP_LABELS[row.step_id as AdminSetupStepId] ?? row.step_id,
    status: row.status as AdminSetupStepStatus,
    description: row.description,
    computedAt: row.computed_at,
  }));

  const recentActivity: ReadonlyArray<AdminAuditEvent> = activityData.map((row) => ({
    id: row.id,
    category: row.category as AdminAuditCategory,
    action: row.action,
    actorPersonId: row.actor_person_id ?? null,
    actorDisplayName: null,
    targetKind: row.target_kind ?? null,
    targetId: row.target_id ?? null,
    summary: row.summary,
    createdAt: row.created_at,
  }));

  return {
    tenant: { slug: tenantSlug, name: tenantName },
    setupSteps,
    recentActivity,
    crossPageCounts: {
      openBlockers: openBlockers ?? 0,
      datasetsPendingApproval: pendingApprovals ?? 0,
      connectorsNotConfigured: notConfigured ?? 0,
      invitesPending: 0,
      productionReadinessGatesFailing: 0,
    },
    generatedAt: new Date().toISOString(),
  };
}

export function getAdminOverviewFixture(
  tenantSlug: string = 'apex-retail',
): AdminOverviewSnapshot {
  return adminOverviewSnapshotFixture(tenantSlug);
}
