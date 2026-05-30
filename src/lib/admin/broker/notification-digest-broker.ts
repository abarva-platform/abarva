/**
 * W5-PR-3 · Daily notification digest assembler.
 *
 * Produces deterministic `system.daily_digest` payloads from the
 * append-only notification_events ledger. The cron dispatcher can call
 * this at 08:00 in the tenant timezone and emit the resulting payload
 * through the Wave 4 broker.
 */

import 'server-only';

import { azureRead } from '@/lib/data-plane/azureRead';
import type {
  NotificationSeverity,
  NotificationSourceModule,
} from '@/lib/admin/broker/notifications-types';

const DAY_MS = 24 * 60 * 60 * 1000;

export interface DailyDigestEventSummary {
  eventType: string;
  sourceModule: NotificationSourceModule;
  severity: NotificationSeverity;
  title: string;
  createdAt: string;
}

export interface DailyDigestPayload {
  eventId: string;
  tenantId: string;
  tenantTimezone: string;
  periodStartIso: string;
  periodEndIso: string;
  producedAtIso: string;
  totalEvents: number;
  criticalCount: number;
  warningCount: number;
  moduleCounts: Record<string, number>;
  topEvents: DailyDigestEventSummary[];
  ctaHref: string;
}

interface DigestEventRow {
  event_type: string;
  source_module: NotificationSourceModule;
  severity: NotificationSeverity;
  payload: Record<string, unknown> | null;
  created_at: string;
}

function payloadTitle(row: DigestEventRow): string {
  const payload = row.payload ?? {};
  for (const key of ['title', 'subject', 'programName', 'connectorName', 'summary']) {
    const value = payload[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return row.event_type;
}

function safeTimezone(timezone: string | null | undefined): string {
  const value = timezone?.trim() || 'UTC';
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format(new Date());
    return value;
  } catch {
    return 'UTC';
  }
}

export function isDailyDigestSendWindow(args: {
  now: Date;
  tenantTimezone: string;
  hour?: number;
  minute?: number;
}): boolean {
  const timezone = safeTimezone(args.tenantTimezone);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hourCycle: 'h23',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(args.now);
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0');
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? '0');
  return hour === (args.hour ?? 8) && minute === (args.minute ?? 0);
}

export async function buildDailyDigestPayload(args: {
  tenantId: string;
  tenantTimezone?: string;
  now?: Date;
  eventId?: string;
  limit?: number;
}): Promise<DailyDigestPayload> {
  const now = args.now ?? new Date();
  const periodEnd = now;
  const periodStart = new Date(periodEnd.getTime() - DAY_MS);
  const limit = Math.min(Math.max(args.limit ?? 50, 1), 200);

  const rows = await azureRead.query<DigestEventRow>(
    `SELECT event_type, source_module, severity, payload, created_at
       FROM notification_events
      WHERE tenant_id = $1
        AND created_at >= $2
        AND created_at < $3
        AND event_type <> 'system.daily_digest'
      ORDER BY created_at DESC
      LIMIT $4`,
    [args.tenantId, periodStart.toISOString(), periodEnd.toISOString(), limit],
    { missingTable: 'empty' },
  );

  const moduleCounts: Record<string, number> = {};
  let criticalCount = 0;
  let warningCount = 0;
  for (const row of rows) {
    moduleCounts[row.source_module] = (moduleCounts[row.source_module] ?? 0) + 1;
    if (row.severity === 'critical') criticalCount += 1;
    if (row.severity === 'warn') warningCount += 1;
  }

  return {
    eventId: args.eventId ?? `daily-digest-${args.tenantId}-${periodEnd.toISOString().slice(0, 10)}`,
    tenantId: args.tenantId,
    tenantTimezone: safeTimezone(args.tenantTimezone),
    periodStartIso: periodStart.toISOString(),
    periodEndIso: periodEnd.toISOString(),
    producedAtIso: now.toISOString(),
    totalEvents: rows.length,
    criticalCount,
    warningCount,
    moduleCounts,
    topEvents: rows.slice(0, 8).map((row) => ({
      eventType: row.event_type,
      sourceModule: row.source_module,
      severity: row.severity,
      title: payloadTitle(row),
      createdAt: row.created_at,
    })),
    ctaHref: '/admin/inbox',
  };
}
