import type { PostgresCompatClient as SupabaseClient } from '@/lib/supabase-server';
import { createTxSession, type TxSessionRunner } from '@/lib/data-plane/read-adapters/azureSession';
import { resolveDataPlane } from '@/lib/data-plane/read-adapters/resolveDataPlane';
import type { DataPlane } from '@/lib/data-plane/write-adapters/types';
import { getServerSupabase } from '@/lib/supabase-server';
import { canonicalTenantKey } from '@/lib/tenant-keys';
import { routeNotification } from './policy';
import type {
  NotificationAudience,
  NotificationEvent,
  NotificationModule,
  NotificationSeverity,
  NotificationSubject,
} from './types';

export interface NotificationStoreOutcome<T> {
  readonly ok: boolean;
  readonly data?: T;
  readonly error?: string;
}

function ok<T>(data: T): NotificationStoreOutcome<T> {
  return { ok: true, data };
}

function fail<T>(error: string): NotificationStoreOutcome<T> {
  return { ok: false, error };
}

export interface PersistNotificationArgs {
  readonly tenantKey: string;
  readonly events: readonly NotificationEvent[];
}

export interface ListNotificationArgs {
  readonly tenantKey: string;
  readonly sinceMs?: number;
  readonly limit?: number;
}

export interface NotificationStoreAdapter {
  readonly name: DataPlane;
  persistEvents(
    args: PersistNotificationArgs,
  ): Promise<NotificationStoreOutcome<NotificationEvent[]>>;
  listEvents(
    args: ListNotificationArgs,
  ): Promise<NotificationStoreOutcome<NotificationEvent[]>>;
}

const MODULES = new Set<NotificationModule>([
  'home',
  'source',
  'moves',
  'tower',
  'intelligence',
  'context',
  'admin',
  'platform',
]);

const SEVERITIES = new Set<NotificationSeverity>([
  'info',
  'attention',
  'urgent',
  'critical',
]);

const SUBJECT_TYPES = new Set<NotificationSubject['type']>([
  'contract',
  'source_event',
  'program',
  'tower_move',
  'context_segment',
  'agent_answer',
  'security_event',
  'platform_resource',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isAudience(value: unknown): value is NotificationAudience {
  if (!isRecord(value)) return false;
  return (
    typeof value.kind === 'string'
    && typeof value.ref === 'string'
    && (value.label === undefined || typeof value.label === 'string')
  );
}

function isSubject(value: unknown): value is NotificationSubject {
  if (!isRecord(value)) return false;
  return (
    typeof value.type === 'string'
    && SUBJECT_TYPES.has(value.type as NotificationSubject['type'])
    && typeof value.id === 'string'
    && typeof value.label === 'string'
  );
}

function isNotificationEvent(value: unknown): value is NotificationEvent {
  if (!isRecord(value)) return false;
  if (typeof value.id !== 'string') return false;
  if (typeof value.tenantKey !== 'string') return false;
  if (typeof value.module !== 'string' || !MODULES.has(value.module as NotificationModule)) return false;
  if (typeof value.severity !== 'string' || !SEVERITIES.has(value.severity as NotificationSeverity)) return false;
  if (typeof value.title !== 'string' || typeof value.body !== 'string') return false;
  if (typeof value.href !== 'string' || !value.href.startsWith('/')) return false;
  if (!isSubject(value.subject)) return false;
  if (!Array.isArray(value.audience) || !value.audience.every(isAudience)) return false;
  if (typeof value.producedAt !== 'string' || Number.isNaN(Date.parse(value.producedAt))) return false;
  if (value.dueAt !== null && (typeof value.dueAt !== 'string' || Number.isNaN(Date.parse(value.dueAt)))) return false;
  if (typeof value.dedupeKey !== 'string' || typeof value.sourceEventType !== 'string') return false;
  if (!Array.isArray(value.evidenceRefs) || !value.evidenceRefs.every((ref) => typeof ref === 'string')) return false;
  return value.metadata === undefined || isRecord(value.metadata);
}

export function parseNotificationEventsPayload(
  body: unknown,
): NotificationStoreOutcome<NotificationEvent[]> {
  const raw = isRecord(body) && Array.isArray(body.events)
    ? body.events
    : isRecord(body) && body.event !== undefined
      ? [body.event]
      : [];

  if (raw.length === 0) return fail('event or events[] required');
  if (raw.length > 50) return fail('too many notification events; max 50');
  if (!raw.every(isNotificationEvent)) {
    return fail('invalid notification event payload');
  }
  return ok(raw);
}

function sameTenant(a: string, b: string): boolean {
  return canonicalTenantKey(a) === canonicalTenantKey(b);
}

export function assertNotificationTenant(
  events: readonly NotificationEvent[],
  tenantKey: string,
): NotificationStoreOutcome<NotificationEvent[]> {
  const canonical = canonicalTenantKey(tenantKey);
  for (const event of events) {
    if (!sameTenant(event.tenantKey, canonical)) {
      return fail(`notification tenant mismatch for ${event.id}`);
    }
  }
  return ok(events.map((event) => ({ ...event, tenantKey: canonical })));
}

export function toPlatformNotificationColumns(
  event: NotificationEvent,
): Record<string, unknown> {
  const policy = routeNotification(event);
  return {
    tenant_key: canonicalTenantKey(event.tenantKey),
    module: event.module,
    severity: event.severity,
    source_event_type: event.sourceEventType,
    subject_type: event.subject.type,
    subject_id: event.subject.id,
    subject_label: event.subject.label,
    title: event.title,
    body_text: event.body,
    href: event.href,
    audience_jsonb: event.audience,
    channels_jsonb: policy.channels,
    evidence_refs_jsonb: event.evidenceRefs,
    dedupe_key: event.dedupeKey,
    due_at: event.dueAt,
    produced_at: event.producedAt,
    metadata_jsonb: event.metadata ?? {},
  };
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

function audienceArray(value: unknown): NotificationAudience[] {
  return Array.isArray(value) ? value.filter(isAudience) : [];
}

function metadataRecord(value: unknown): NotificationEvent['metadata'] {
  if (!isRecord(value)) return {};
  const out: Record<string, string | number | boolean | null> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (
      typeof entry === 'string'
      || typeof entry === 'number'
      || typeof entry === 'boolean'
      || entry === null
    ) {
      out[key] = entry;
    }
  }
  return out;
}

export function fromPlatformNotificationRow(row: Record<string, unknown>): NotificationEvent {
  const subject: NotificationSubject = {
    type: row.subject_type as NotificationSubject['type'],
    id: String(row.subject_id),
    label: String(row.subject_label),
  };
  return {
    id: String(row.id ?? row.dedupe_key),
    tenantKey: canonicalTenantKey(String(row.tenant_key)),
    module: row.module as NotificationModule,
    severity: row.severity as NotificationSeverity,
    title: String(row.title),
    body: String(row.body_text),
    href: String(row.href),
    subject,
    audience: audienceArray(row.audience_jsonb),
    producedAt: String(row.produced_at),
    dueAt: row.due_at ? String(row.due_at) : null,
    dedupeKey: String(row.dedupe_key),
    sourceEventType: String(row.source_event_type),
    evidenceRefs: stringArray(row.evidence_refs_jsonb),
    metadata: metadataRecord(row.metadata_jsonb),
  };
}

export type SupabaseFactory = () => SupabaseClient;

export function createSupabaseNotificationStoreAdapter(
  getClient: SupabaseFactory = getServerSupabase,
): NotificationStoreAdapter {
  return {
    name: 'supabase',
    async persistEvents(args) {
      const tenantCheck = assertNotificationTenant(args.events, args.tenantKey);
      if (!tenantCheck.ok || !tenantCheck.data) return fail(tenantCheck.error ?? 'tenant mismatch');
      const rows = tenantCheck.data.map(toPlatformNotificationColumns);
      const { data, error } = await getClient()
        .from('platform_notification_events')
        .upsert(rows, { onConflict: 'tenant_key,dedupe_key' })
        .select('*');
      if (error) return fail(error.message);
      return ok((data ?? []).map((row) => fromPlatformNotificationRow(row as Record<string, unknown>)));
    },
    async listEvents(args) {
      let query = getClient()
        .from('platform_notification_events')
        .select('*')
        .eq('tenant_key', canonicalTenantKey(args.tenantKey))
        .order('produced_at', { ascending: false })
        .limit(args.limit ?? 50);
      if (args.sinceMs && args.sinceMs > 0) {
        query = query.gt('produced_at', new Date(args.sinceMs).toISOString());
      }
      const { data, error } = await query;
      if (error) return fail(error.message);
      return ok((data ?? []).map((row) => fromPlatformNotificationRow(row as Record<string, unknown>)));
    },
  };
}

function errMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err ?? 'unknown');
}

export function createAzureNotificationStoreAdapter(
  session: TxSessionRunner = createTxSession('abarva-notification-store'),
): NotificationStoreAdapter {
  return {
    name: 'azure-postgres',
    async persistEvents(args) {
      const tenantCheck = assertNotificationTenant(args.events, args.tenantKey);
      if (!tenantCheck.ok || !tenantCheck.data) return fail(tenantCheck.error ?? 'tenant mismatch');
      try {
        const rows = await session(async (sql) => {
          const out: Record<string, unknown>[] = [];
          for (const event of tenantCheck.data ?? []) {
            const columns = toPlatformNotificationColumns(event);
            const keys = Object.keys(columns);
            const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
            const updateSet = keys
              .filter((key) => key !== 'tenant_key' && key !== 'dedupe_key')
              .map((key) => `${key} = EXCLUDED.${key}`)
              .join(', ');
            const values = keys.map((key) => {
              const value = columns[key];
              if (key.endsWith('_jsonb')) return JSON.stringify(value);
              return value;
            });
            const inserted = await sql<Record<string, unknown>>(
              `INSERT INTO platform_notification_events (${keys.join(', ')})
               VALUES (${placeholders})
               ON CONFLICT (tenant_key, dedupe_key)
               DO UPDATE SET ${updateSet}
               RETURNING *`,
              values,
            );
            if (inserted[0]) out.push(inserted[0]);
          }
          return out;
        });
        return ok(rows.map(fromPlatformNotificationRow));
      } catch (err) {
        return fail(errMessage(err));
      }
    },
    async listEvents(args) {
      try {
        const params: unknown[] = [canonicalTenantKey(args.tenantKey), args.limit ?? 50];
        const sinceMs = args.sinceMs;
        const hasSince = sinceMs !== undefined && sinceMs > 0;
        const sinceClause = hasSince ? 'AND produced_at > $3' : '';
        if (hasSince) params.push(new Date(sinceMs).toISOString());
        const rows = await session((sql) =>
          sql<Record<string, unknown>>(
            `SELECT *
               FROM platform_notification_events
              WHERE tenant_key = $1
              ${sinceClause}
              ORDER BY produced_at DESC
              LIMIT $2`,
            params,
          ),
        );
        return ok(rows.map(fromPlatformNotificationRow));
      } catch (err) {
        return fail(errMessage(err));
      }
    },
  };
}

export const supabaseNotificationStoreAdapter =
  createSupabaseNotificationStoreAdapter();
export const azureNotificationStoreAdapter =
  createAzureNotificationStoreAdapter();

export function selectNotificationStoreAdapter(
  plane?: DataPlane,
): NotificationStoreAdapter {
  const target = plane ?? resolveDataPlane();
  return target === 'azure-postgres'
    ? azureNotificationStoreAdapter
    : supabaseNotificationStoreAdapter;
}
