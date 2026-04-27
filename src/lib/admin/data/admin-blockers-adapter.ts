/**
 * ADMIN-DATA2 — Admin blockers adapter.
 * DATA11 — Live path wired to Supabase.
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
import { getServerSupabase } from '@/lib/supabase-server';
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
  const supabase = getServerSupabase();
  let query = supabase
    .from('admin_blockers')
    .select('id, title, severity, affected_scope, status, owner_agent, blocker_reason, unblock_steps, opened_at, resolved_at')
    .eq('client_id', clientId)
    .order('opened_at', { ascending: false });
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => ({
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
  tenantSlug: string = 'apex-retail',
): ReadonlyArray<AdminBlockerRow> {
  return adminBlockersFixture(tenantSlug);
}
