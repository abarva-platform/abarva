/**
 * ADMIN-DATA2 — Admin production-readiness adapter.
 * DATA11 — Live path wired to Supabase (derived from admin_blockers).
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
import { getServerSupabase } from '@/lib/supabase-server';
import { requireClientId } from './admin-db-helpers';

export async function getAdminProductionReadiness(
  tenantSlug: string,
): Promise<AdminProductionReadinessSnapshot> {
  if (isFixtureMode()) return adminProductionReadinessFixture(tenantSlug);

  const clientId = await requireClientId(tenantSlug);
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('admin_blockers')
    .select('id, title, severity, affected_scope, status, owner_agent, blocker_reason, unblock_steps, opened_at, resolved_at')
    .eq('client_id', clientId)
    .order('opened_at', { ascending: false });
  if (error) throw error;

  const blockers: AdminBlockerRow[] = (data ?? []).map((row) => ({
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
