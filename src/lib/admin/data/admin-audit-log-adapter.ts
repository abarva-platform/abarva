/**
 * ADMIN-DATA2 — Admin audit-log adapter.
 * DATA11 — Live path wired to Supabase.
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
import { getServerSupabase } from '@/lib/supabase-server';
import { requireClientId } from './admin-db-helpers';

export async function getAdminAuditEvents(
  tenantSlug: string,
  options?: AdminAuditLogQueryOptions,
): Promise<ReadonlyArray<AdminAuditEvent>> {
  if (isFixtureMode()) return adminAuditEventsFixture(tenantSlug, options);

  const clientId = await requireClientId(tenantSlug);
  const supabase = getServerSupabase();
  let query = supabase
    .from('admin_audit_log')
    .select('id, category, action, actor_person_id, target_kind, target_id, summary, created_at')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });
  if (options?.limit) query = query.limit(options.limit);
  if (options?.category) query = query.eq('category', options.category);
  if (options?.since) query = query.gte('created_at', options.since);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => ({
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
  tenantSlug: string = 'apex-retail',
): ReadonlyArray<AdminAuditEvent> {
  return adminAuditEventsFixture(tenantSlug);
}
