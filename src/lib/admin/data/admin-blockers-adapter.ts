/**
 * ADMIN-DATA2 — Admin blockers adapter.
 * DATA11 — Live path wired to Azure read plane.
 */

import type {
  AdminBlockerOwnerAgent,
  AdminBlockerRow,
  AdminBlockerScope,
  AdminBlockerSeverity,
  AdminBlockerStatus,
} from './admin-blockers-adapter-types';
import {
  isFixtureMode,
} from './admin-data-mode';
import {
  adminBlockerDetailFixture,
  adminBlockersFixture,
  adminCriticalBlockersFixture,
} from './fixtures/admin-blockers-fixture';
import { azureRead } from '@/lib/data-plane/azureRead';
import { requireClientId } from './admin-db-helpers';

export async function getAdminBlockers(
  tenantSlug: string,
  status?: AdminBlockerStatus,
): Promise<ReadonlyArray<AdminBlockerRow>> {
  if (isFixtureMode()) {
    const all = adminBlockersFixture(tenantSlug);
    return status ? all.filter((b) => b.status === status) : all;
  }

  const clientId = await requireClientId(tenantSlug);
  const rows = await azureRead.query<{
    id: string;
    title: string;
    severity: string;
    affected_scope: string;
    status: string;
    owner_agent: string;
    blocker_reason: string;
    unblock_steps: unknown;
    opened_at: string;
    resolved_at: string | null;
  }>(
    `SELECT id, title, severity, affected_scope, status, owner_agent,
            blocker_reason, unblock_steps, opened_at, resolved_at
       FROM admin_blockers
      WHERE client_id = $1${status ? ' AND status = $2' : ''}
      ORDER BY opened_at DESC`,
    status ? [clientId, status] : [clientId],
  );
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.blocker_reason,
    severity: row.severity as AdminBlockerSeverity,
    affectedScope: row.affected_scope as AdminBlockerScope,
    status: row.status as AdminBlockerStatus,
    ownerAgent: row.owner_agent as AdminBlockerOwnerAgent,
    impactedComponent: '',
    evidenceBasis: '',
    blockerReason: row.blocker_reason,
    unblockSteps: Array.isArray(row.unblock_steps) ? (row.unblock_steps as string[]) : [],
    pilotImpact: row.affected_scope === 'pilot' || row.affected_scope === 'demo',
    productionImpact: row.affected_scope === 'production',
    openedAt: row.opened_at,
    resolvedAt: row.resolved_at ?? null,
  }));
}

export async function getAdminBlockerById(
  tenantSlug: string,
  blockerId: string,
): Promise<AdminBlockerRow | null> {
  if (isFixtureMode()) return adminBlockerDetailFixture(tenantSlug, blockerId);

  const all = await getAdminBlockers(tenantSlug);
  return all.find((b) => b.id === blockerId) ?? null;
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

  const all = await getAdminBlockers(tenantSlug);
  return all.filter((b) => b.severity === 'critical');
}

export function getAdminBlockersFixture(
  tenantSlug: string,
): ReadonlyArray<AdminBlockerRow> {
  return adminBlockersFixture(tenantSlug);
}
