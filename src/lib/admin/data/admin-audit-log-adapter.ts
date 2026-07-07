/**
 * ADMIN-DATA2 — Admin audit-log adapter.
 * DATA11 — Live path wired to Azure read plane.
 */

import type {
  AdminAuditCategory,
  AdminAuditEvent,
  AdminAuditLogQueryOptions,
} from './admin-audit-log-adapter-types';
import {
  isFixtureMode,
} from './admin-data-mode';
import {
  adminAuditEventFixture,
  adminAuditEventsFixture,
} from './fixtures/admin-audit-log-fixture';
import { azureRead } from '@/lib/data-plane/azureRead';
import { requireClientId } from './admin-db-helpers';

function toIsoString(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  return String(value ?? '');
}

export async function getAdminAuditEvents(
  tenantSlug: string,
  options?: AdminAuditLogQueryOptions,
): Promise<ReadonlyArray<AdminAuditEvent>> {
  if (isFixtureMode()) return adminAuditEventsFixture(tenantSlug, options);

  const clientId = await requireClientId(tenantSlug);
  const params: unknown[] = [clientId];
  let where = 'WHERE client_id = $1';
  if (options?.category) {
    params.push(options.category);
    where += ` AND category = $${params.length}`;
  }
  if (options?.since) {
    params.push(options.since);
    where += ` AND created_at >= $${params.length}`;
  }
  let limit = '';
  if (options?.limit) {
    params.push(options.limit);
    limit = ` LIMIT $${params.length}`;
  }
  const rows = await azureRead.query<{
    id: string;
    category: string;
    action: string;
    actor_person_id: string | null;
    target_kind: string | null;
    target_id: string | null;
    summary: string;
    created_at: string | Date;
  }>(
    `SELECT id, category, action, actor_person_id, target_kind, target_id, summary, created_at
       FROM admin_audit_log
      ${where}
      ORDER BY created_at DESC${limit}`,
    params,
  );
  return rows.map((row) => ({
    id: row.id,
    category: row.category as AdminAuditCategory,
    action: row.action,
    actorPersonId: row.actor_person_id ?? null,
    actorDisplayName: null,
    targetKind: row.target_kind ?? null,
    targetId: row.target_id ?? null,
    summary: row.summary,
    createdAt: toIsoString(row.created_at),
  }));
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

  const all = await getAdminAuditEvents(tenantSlug);
  return all.find((e) => e.id === eventId) ?? null;
}

export function getAdminAuditEventsFixture(
  tenantSlug: string,
): ReadonlyArray<AdminAuditEvent> {
  return adminAuditEventsFixture(tenantSlug);
}
