/**
 * ADMIN-DATA2 — Admin audit-log adapter.
 */

import type {
  AdminAuditEvent,
  AdminAuditLogQueryOptions,
} from './admin-audit-log-adapter-types';
import {
  AdminDataMigrationPendingError,
  isFixtureMode,
} from './admin-data-mode';
import {
  adminAuditEventFixture,
  adminAuditEventsFixture,
} from './fixtures/admin-audit-log-fixture';

export async function getAdminAuditEvents(
  tenantSlug: string,
  options?: AdminAuditLogQueryOptions,
): Promise<ReadonlyArray<AdminAuditEvent>> {
  if (isFixtureMode()) return adminAuditEventsFixture(tenantSlug, options);
  throw new AdminDataMigrationPendingError('audit_log');
}

export async function getAdminAuditLog(
  tenantSlug: string,
  options?: AdminAuditLogQueryOptions,
): Promise<ReadonlyArray<AdminAuditEvent>> {
  return getAdminAuditEvents(tenantSlug, options);
}

export async function getAdminAuditEvent(
  tenantSlug: string,
  eventId: string,
): Promise<AdminAuditEvent | null> {
  if (isFixtureMode()) return adminAuditEventFixture(tenantSlug, eventId);
  throw new AdminDataMigrationPendingError('audit_log');
}

export function getAdminAuditEventsFixture(
  tenantSlug: string = 'apex-retail',
): ReadonlyArray<AdminAuditEvent> {
  return adminAuditEventsFixture(tenantSlug);
}
