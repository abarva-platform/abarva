/**
 * ADMIN-DATA2 — Admin connectors adapter.
 * DATA11 — Live path wired to Azure read plane.
 */

import type {
  AdminConnectorDetail,
  AdminConnectorRow,
  AdminConnectorStatus,
} from './admin-connectors-adapter-types';
import {
  AdminDataMigrationPendingError,
  isFixtureMode,
} from './admin-data-mode';
import {
  adminConnectorDetailFixture,
  adminConnectorPilotBlockersFixture,
  adminConnectorsFixture,
} from './fixtures/admin-connectors-fixture';
import { azureRead } from '@/lib/data-plane/azureRead';
import { mapDbConnectorKind, requireClientId } from './admin-db-helpers';

export async function getAdminConnectors(
  tenantSlug: string,
): Promise<ReadonlyArray<AdminConnectorRow>> {
  if (isFixtureMode()) return adminConnectorsFixture(tenantSlug);
  // Live DB tables not yet migrated — throw until ADMIN-DATA10 lands.
  throw new AdminDataMigrationPendingError('admin_connectors');

  const clientId = await requireClientId(tenantSlug); // unreachable until DATA10
  const rows = await azureRead.select<AdminConnectorDbRow>({
    table: 'admin_connectors',
    columns: ADMIN_CONNECTOR_COLUMNS,
    where: { client_id: clientId },
    orderBy: { column: 'label' },
  });
  return rows.map((row) => ({
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
  const data = await azureRead.maybeSingle<AdminConnectorDbRow & {
    config_schema: Record<string, unknown> | null;
  }>({
    table: 'admin_connectors',
    columns: [...ADMIN_CONNECTOR_COLUMNS, 'config_schema'],
    where: { client_id: clientId, id: connectorId },
  });
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
  const rows = await azureRead.select<AdminConnectorDbRow>({
    table: 'admin_connectors',
    columns: ADMIN_CONNECTOR_COLUMNS,
    where: {
      client_id: clientId,
      required_for_pilot: true,
      status: { op: 'neq', value: 'active' },
    },
    orderBy: { column: 'label' },
  });
  return rows.map((row) => ({
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

const ADMIN_CONNECTOR_COLUMNS = [
  'id',
  'kind',
  'vendor',
  'label',
  'status',
  'required_for_pilot',
  'required_for_production',
  'blocker_reason',
  'steward_guidance',
  'last_sync_attempt',
  'updated_at',
] as const;

interface AdminConnectorDbRow {
  id: string;
  kind: string;
  vendor: string | null;
  label: string;
  status: string;
  required_for_pilot: boolean;
  required_for_production: boolean;
  blocker_reason: string | null;
  steward_guidance: string | null;
  last_sync_attempt: string | null;
  updated_at: string;
}
