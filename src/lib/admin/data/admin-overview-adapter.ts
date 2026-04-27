/**
 * ADMIN-DATA2 — Admin overview adapter.
 * DATA11 — Live path wired to Supabase.
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
import { getServerSupabase } from '@/lib/supabase-server';
import { requireClientId, SETUP_STEP_LABELS } from './admin-db-helpers';

export async function getAdminOverviewSnapshot(
  tenantSlug: string,
): Promise<AdminOverviewSnapshot> {
  if (isFixtureMode()) {
    return adminOverviewSnapshotFixture(tenantSlug);
  }

  const clientId = await requireClientId(tenantSlug);
  const supabase = getServerSupabase();

  const [
    { data: stepsData },
    { data: activityData },
    { count: openBlockers },
    { count: pendingApprovals },
    { count: notConfigured },
  ] = await Promise.all([
    supabase
      .from('admin_setup_progress')
      .select('step_id, status, description, computed_at')
      .eq('client_id', clientId),
    supabase
      .from('admin_audit_log')
      .select('id, category, action, actor_person_id, target_kind, target_id, summary, created_at')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('admin_blockers')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .in('status', ['open', 'in_progress']),
    supabase
      .from('admin_dataset_approvals')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .eq('status', 'pending'),
    supabase
      .from('admin_connectors')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .eq('status', 'not_configured'),
  ]);

  const tenantName = tenantSlug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  const setupSteps = (stepsData ?? []).map((row) => ({
    id: row.step_id as AdminSetupStepId,
    label: SETUP_STEP_LABELS[row.step_id as AdminSetupStepId] ?? row.step_id,
    status: row.status as AdminSetupStepStatus,
    description: row.description,
    computedAt: row.computed_at,
  }));

  const recentActivity: ReadonlyArray<AdminAuditEvent> = (activityData ?? []).map((row) => ({
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
