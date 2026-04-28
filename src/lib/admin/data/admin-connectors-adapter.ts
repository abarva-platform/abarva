/**
 * ADMIN-DATA2 — Admin connectors adapter.
 * DATA11 — Live path wired to Supabase.
 */

import type {
  AdminConnectorDetail,
  AdminConnectorRow,
  AdminConnectorStatus,
} from './admin-connectors-adapter-types';
import {
  isFixtureMode,
} from './admin-data-mode';
import {
  adminConnectorDetailFixture,
  adminConnectorPilotBlockersFixture,
  adminConnectorsFixture,
} from './fixtures/admin-connectors-fixture';
import { getServerSupabase } from '@/lib/supabase-server';
import { mapDbConnectorKind, requireClientId } from './admin-db-helpers';

export async function getAdminConnectors(
  tenantSlug: string,
): Promise<ReadonlyArray<AdminConnectorRow>> {
  if (isFixtureMode()) return adminConnectorsFixture(tenantSlug);

  const clientId = await requireClientId(tenantSlug);
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('admin_connectors')
    .select('id, kind, vendor, label, status, required_for_pilot, required_for_production, blocker_reason, steward_guidance, last_sync_attempt, updated_at')
    .eq('client_id', clientId)
    .order('label');
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    tenantSlug,
    kind: mapDbConnectorKind(row.kind),
    vendor: row.vendor ?? null,
    label: row.label,
    status: row.status as AdminConnectorStatus,
    requiredForPilot: row.required_for_pilot,
    requiredForProduction: row.required_for_production,
    blockerReason: row.blocker_reason ?? null,
    stewardGuidance: row.steward_guidance ?? null,
    lastSyncAttempt: row.last_sync_attempt ?? null,
    updatedAt: row.updated_at,
  }));
}

export async function getAdminConnectorById(
  tenantSlug: string,
  connectorId: string,
): Promise<AdminConnectorRow | null> {
  const all = await getAdminConnectors(tenantSlug);
  return all.find((c) => c.id === connectorId) ?? null;
}

export async function getAdminConnectorDetail(
  tenantSlug: string,
  connectorId: string,
): Promise<AdminConnectorDetail | null> {
  if (isFixtureMode()) return adminConnectorDetailFixture(tenantSlug, connectorId);

  const clientId = await requireClientId(tenantSlug);
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('admin_connectors')
    .select('id, kind, vendor, label, status, required_for_pilot, required_for_production, blocker_reason, steward_guidance, last_sync_attempt, updated_at, config_schema')
    .eq('client_id', clientId)
    .eq('id', connectorId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    tenantSlug,
    kind: mapDbConnectorKind(data.kind),
    vendor: data.vendor ?? null,
    label: data.label,
    status: data.status as AdminConnectorStatus,
    requiredForPilot: data.required_for_pilot,
    requiredForProduction: data.required_for_production,
    blockerReason: data.blocker_reason ?? null,
    stewardGuidance: data.steward_guidance ?? null,
    lastSyncAttempt: data.last_sync_attempt ?? null,
    updatedAt: data.updated_at,
    configSchema: (data.config_schema as Record<string, unknown>) ?? null,
    recentSyncAttempts: [],
    healthTrend: [],
  };
}

export async function getAdminConnectorPilotBlockers(
  tenantSlug: string,
): Promise<ReadonlyArray<AdminConnectorRow>> {
  if (isFixtureMode()) return adminConnectorPilotBlockersFixture(tenantSlug);

  const clientId = await requireClientId(tenantSlug);
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('admin_connectors')
    .select('id, kind, vendor, label, status, required_for_pilot, required_for_production, blocker_reason, steward_guidance, last_sync_attempt, updated_at')
    .eq('client_id', clientId)
    .eq('required_for_pilot', true)
    .neq('status', 'active')
    .order('label');
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    tenantSlug,
    kind: mapDbConnectorKind(row.kind),
    vendor: row.vendor ?? null,
    label: row.label,
    status: row.status as AdminConnectorStatus,
    requiredForPilot: row.required_for_pilot,
    requiredForProduction: row.required_for_production,
    blockerReason: row.blocker_reason ?? null,
    stewardGuidance: row.steward_guidance ?? null,
    lastSyncAttempt: row.last_sync_attempt ?? null,
    updatedAt: row.updated_at,
  }));
}

export function getAdminConnectorsFixture(
  tenantSlug: string = 'apex-retail',
): ReadonlyArray<AdminConnectorRow> {
  return adminConnectorsFixture(tenantSlug);
}
