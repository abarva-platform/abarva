/**
 * ADMIN-DATA2 — Admin production-readiness adapter.
 * DATA11 — Live path wired to Azure read plane (derived from admin_blockers).
 */

import type {
  AdminProductionReadinessSnapshot,
  AdminReadinessTile,
  AdminReadinessTileStatus,
  AdminReadinessScope,
} from './admin-production-readiness-adapter-types';
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
import { adminProductionReadinessFixture } from './fixtures/admin-production-readiness-fixture';
import { azureRead } from '@/lib/data-plane/azureRead';
import { requireClientId } from './admin-db-helpers';

export async function getAdminProductionReadiness(
  tenantSlug: string,
): Promise<AdminProductionReadinessSnapshot> {
  if (isFixtureMode()) return adminProductionReadinessFixture(tenantSlug);

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
      WHERE client_id = $1
      ORDER BY opened_at DESC`,
    [clientId],
  );

  const blockers: AdminBlockerRow[] = rows.map((row) => ({
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

  // Derive tiles from blockers grouped by scope
  const tiles: AdminReadinessTile[] = (['demo', 'pilot', 'production'] as AdminReadinessScope[]).map(
    (scope) => {
      const scopeBlockers = blockers.filter(
        (b) => b.affectedScope === scope && (b.status === 'open' || b.status === 'in_progress'),
      );
      const tileStatus: AdminReadinessTileStatus =
        scopeBlockers.length === 0
          ? 'ready'
          : scopeBlockers.some((b) => b.severity === 'critical')
            ? 'blocked'
            : 'partial';
      return {
        scope,
        status: tileStatus,
        failingCriteria: scopeBlockers.map((b) => b.title),
      };
    },
  );

  return {
    tenantSlug,
    tiles,
    blockers,
    history: [],
    generatedAt: new Date().toISOString(),
  };
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
