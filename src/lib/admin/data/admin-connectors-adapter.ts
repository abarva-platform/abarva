/**
 * ADMIN-DATA2 — Admin connectors adapter.
 */

import type {
  AdminConnectorDetail,
  AdminConnectorRow,
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

export async function getAdminConnectors(
  tenantSlug: string,
): Promise<ReadonlyArray<AdminConnectorRow>> {
  if (isFixtureMode()) return adminConnectorsFixture(tenantSlug);
  throw new AdminDataMigrationPendingError('admin_connectors');
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
  throw new AdminDataMigrationPendingError('admin_connectors');
}

export async function getAdminConnectorPilotBlockers(
  tenantSlug: string,
): Promise<ReadonlyArray<AdminConnectorRow>> {
  if (isFixtureMode()) return adminConnectorPilotBlockersFixture(tenantSlug);
  throw new AdminDataMigrationPendingError('admin_connectors');
}

export function getAdminConnectorsFixture(
  tenantSlug: string = 'apex-retail',
): ReadonlyArray<AdminConnectorRow> {
  return adminConnectorsFixture(tenantSlug);
}
