/**
 * W5-PR-1 · Notification inbox broker
 *
 * Read/write surface for the in-app admin inbox. All data-plane access
 * stays under src/lib/admin/broker/** per the broker-boundary gate.
 */

import 'server-only';

import { azureRead } from '@/lib/data-plane/azureRead';
import { getAzureWriteFluentClient } from '@/lib/data-plane/postgresCompat';
import type {
  NotificationDeliveryChannel,
  NotificationEventRow,
  NotificationSeverity,
} from '@/lib/admin/broker/notifications-types';

export interface InboxNotificationItem {
  id: string;
  eventId: string;
  eventType: string;
  sourceModule: NotificationEventRow['source_module'];
  severity: NotificationSeverity;
  category: NotificationEventRow['category'];
  title: string;
  body: string;
  href: string;
  userId: string;
  tenantId: string;
  channel: NotificationDeliveryChannel;
  status: string;
  createdAt: string;
  sentAt: string | null;
  readAt: string | null;
  archivedAt: string | null;
  payload: Record<string, unknown>;
}

interface InboxRow {
  delivery_id: string;
  event_id: string;
  event_type: string;
  source_module: NotificationEventRow['source_module'];
  severity: NotificationSeverity;
  category: NotificationEventRow['category'];
  payload: Record<string, unknown> | null;
  user_id: string;
  tenant_id: string;
  channel: NotificationDeliveryChannel;
  status: string;
  created_at: string;
  sent_at: string | null;
  read_at: string | null;
  archived_at: string | null;
}

function stringPayloadValue(
  payload: Record<string, unknown>,
  keys: readonly string[],
): string | null {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

function itemFromRow(row: InboxRow): InboxNotificationItem {
  const payload = row.payload ?? {};
  const title =
    stringPayloadValue(payload, ['title', 'subject', 'programName', 'connectorName'])
    ?? row.event_type;
  const body =
    stringPayloadValue(payload, ['body', 'summary', 'message', 'reason', 'decision'])
    ?? `${row.source_module} ${row.category} notification`;
  const href =
    stringPayloadValue(payload, ['href', 'url'])
    ?? (row.source_module === 'source'
      ? '/source'
      : row.source_module === 'moves'
        ? '/moves'
        : row.source_module === 'intelligence'
          ? '/intelligence'
          : '/admin');

  return {
    id: row.delivery_id,
    eventId: row.event_id,
    eventType: row.event_type,
    sourceModule: row.source_module,
    severity: row.severity,
    category: row.category,
    title,
    body,
    href,
    userId: row.user_id,
    tenantId: row.tenant_id,
    channel: row.channel,
    status: row.status,
    createdAt: row.created_at,
    sentAt: row.sent_at,
    readAt: row.read_at,
    archivedAt: row.archived_at,
    payload,
  };
}

export async function listInboxNotifications(args: {
  tenantId: string;
  userId: string;
  limit?: number;
  includeArchived?: boolean;
}): Promise<{ items: InboxNotificationItem[]; unreadCount: number }> {
  const limit = Math.min(Math.max(args.limit ?? 50, 1), 100);
  const archivedClause = args.includeArchived ? '' : 'AND d.archived_at IS NULL';
  const rows = await azureRead.query<InboxRow>(
    `SELECT
        d.id AS delivery_id,
        d.event_id,
        e.event_type,
        e.source_module,
        e.severity,
        e.category,
        e.payload,
        d.user_id,
        d.tenant_id,
        d.channel,
        d.status,
        d.created_at,
        d.sent_at,
        d.read_at,
        d.archived_at
       FROM notification_deliveries d
       JOIN notification_events e ON e.id = d.event_id
      WHERE d.tenant_id = $1
        AND d.user_id = $2
        AND d.channel = 'in_app'
        ${archivedClause}
      ORDER BY d.created_at DESC
      LIMIT $3`,
    [args.tenantId, args.userId, limit],
    { missingTable: 'empty' },
  );

  const unreadCount = await countUnreadInboxNotifications({
    tenantId: args.tenantId,
    userId: args.userId,
  });

  return {
    items: rows.map(itemFromRow),
    unreadCount,
  };
}

export async function countUnreadInboxNotifications(args: {
  tenantId: string;
  userId: string;
}): Promise<number> {
  const rows = await azureRead.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
       FROM notification_deliveries
      WHERE tenant_id = $1
        AND user_id = $2
        AND channel = 'in_app'
        AND read_at IS NULL
        AND archived_at IS NULL`,
    [args.tenantId, args.userId],
    { missingTable: 'empty' },
  );
  return Number(rows[0]?.count ?? '0');
}

export async function markInboxNotificationsRead(args: {
  tenantId: string;
  userId: string;
  deliveryIds?: readonly string[];
  readAt?: Date;
}): Promise<{ updated: number }> {
  const supabase = getAzureWriteFluentClient();
  const readAt = (args.readAt ?? new Date()).toISOString();
  let query = supabase
    .from('notification_deliveries')
    .update({ read_at: readAt })
    .eq('tenant_id', args.tenantId)
    .eq('user_id', args.userId)
    .eq('channel', 'in_app')
    .is('read_at', null)
    .is('archived_at', null);

  if (args.deliveryIds && args.deliveryIds.length > 0) {
    query = query.in('id', [...args.deliveryIds]);
  }

  const { data, error } = await query.select('id');
  if (error) throw new Error(`notification inbox mark-read failed: ${error.message}`);
  return { updated: Array.isArray(data) ? data.length : 0 };
}
