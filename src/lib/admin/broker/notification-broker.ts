/**
 * W4-PR-2 · Enterprise Comms Spine · Notification broker
 *
 * The sole app-tier authority that emits notifications. Every module
 * (Setup, Moves, Source, Intelligence, Tower, System) calls
 * `emitNotification()`; the broker validates against the REGISTRY,
 * resolves the subscriber set, applies throttle / dedup / quiet-hours,
 * and enqueues one delivery row per subscriber per channel.
 *
 * Pipeline (matches Spine §8):
 *   1. Validate event_type against the registry.
 *   2. Resolve tenant_id from tenant_key.
 *   3. Insert the immutable notification_events row.
 *   4. Resolve the subscriber set:
 *        a. explicit preferences (channel != 'none')
 *        b. mandatory subscriptions
 *        c. persona-default matches (Spine §3 matrix)
 *      then dedup by user_id.
 *   5. For each subscriber, run throttle + dedup-window + quiet-hours
 *      + daily-cap checks (Spine §6).
 *   6. Insert one notification_deliveries row per (user, channel)
 *      survivor of the gates, with status='queued'. A separate worker
 *      transitions queued → sent → delivered as Resend acks land
 *      (worker lives in a later PR; this one only enqueues).
 *
 * Founder-locked constraints (Spine §13):
 *   1. Phase 1 sender is `notifications@abarva.com` — enforced by the
 *      Resend wrapper, not by this file.
 *   2. Email + in_app are the only Phase 1 channels — the broker
 *      filters defaultChannels down to these two before enqueueing.
 *   3. Tenant admins auto-subscribe to 5 urgent events at provisioning
 *      — seed helpers in `notifications/seed-defaults.ts`.
 *   4. Mandatory subscriptions cannot be toggled off — enforced when
 *      the preferences page persists a write; the broker reads the
 *      `mandatory` flag here only to gate channel='none' downgrades.
 *   5. PagerDuty arrives in Phase 3 — the registry channel enum
 *      includes it but no fan-out wires it.
 *
 * Broker-boundary doctrine: this file lives under
 * `src/lib/admin/broker/**`, the only directory permitted direct
 * Supabase access from the app tier (broker-boundary.test.ts).
 *
 * Honesty doctrine (memory · feedback_no_demo_thinking.md):
 *   • If the event_type is not in the registry, the broker throws.
 *   • If tenant resolution fails, the broker throws.
 *   • If the notification_events insert fails, the broker throws.
 *   • If delivery insertion fails for a subscriber, the broker
 *     records a structured warn but continues for the remaining
 *     subscribers — one bad delivery row does not poison the fan-out.
 *
 * PII redaction (per Spine §5):
 *   • PII-bearing payload fields are NEVER printed in logs. The broker
 *     redacts via `redactForLog()` before any console.warn.
 *   • The event row itself stores the payload as-is — RLS protects
 *     read access; immutability triggers protect tamper.
 */

import 'server-only';

import { getAzureWriteFluentClient } from '@/lib/data-plane/postgresCompat';
import { azureRead } from '@/lib/data-plane/azureRead';
import { resolveClientId } from '@/lib/admin/data/admin-db-helpers';
import type {
  NotificationDeliveryChannel,
  NotificationEventInsert,
  NotificationPreferenceRow,
  NotificationSubscriptionRow,
  NotificationDeliveryInsert,
} from '@/lib/admin/broker/notifications-types';
import {
  lookupEventDefinition,
  type EventDefinition,
} from '@/lib/notifications/registry';
import {
  userMatchesPersonaDefault,
  type UserPersonaContext,
} from '@/lib/notifications/persona-defaults';

// ─────────────────────────────────────────────────────────────────────────────
// Public contract
// ─────────────────────────────────────────────────────────────────────────────

export interface NotificationEmitInput {
  tenantKey: string;
  eventType: string;
  payload: Record<string, unknown>;
  /** Clerk user id of the actor — null for system-emitted events. */
  actorUserId?: string;
  /**
   * Stable id of the resource the event is about (program id, sourcing
   * event id, etc). Feeds the 5-minute dedup window.
   */
  targetResourceId?: string;
  /**
   * Optional explicit subscriber set. When provided, the broker uses
   * exactly this list and SKIPS persona-default fan-out. Useful for
   * cases where the emitter already knows the audience (e.g. a gate
   * approval addressed to a specific user). Mandatory subscriptions
   * still apply.
   */
  recipientUserIds?: readonly string[];
}

export interface NotificationEmitResult {
  eventId: string;
  enqueuedDeliveries: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 1 channels — only these can land a delivery row today.
// ─────────────────────────────────────────────────────────────────────────────

const PHASE1_CHANNELS: ReadonlySet<NotificationDeliveryChannel> = new Set([
  'email',
  'in_app',
]);

/**
 * Dedup window: same (user_id, event_type, target_resource_id) within
 * this many seconds coalesces into a single delivery. Spine §6.
 */
const DEDUP_WINDOW_SECONDS = 5 * 60;

/**
 * Default per-user-per-event daily cap when the user has no explicit
 * preference. Mirrors the schema default (notification_preferences.daily_cap).
 */
const DEFAULT_DAILY_CAP = 20;

// ─────────────────────────────────────────────────────────────────────────────
// Hook seams — the broker calls these to resolve role + personas for
// the persona-default matcher. Tests inject; runtime uses defaults.
//
// The default implementations are stubs that read no data — we keep
// them inert in Phase 1 because the Clerk-side personas overlay does
// not exist yet. Tenant admin and platform admin are resolved via the
// existing `getUserTenantRole()` helper when callers provide a
// `personaResolver` (or via the runtime overlay below).
// ─────────────────────────────────────────────────────────────────────────────

export type PersonaResolver = (
  userId: string,
  tenantKey: string,
) => Promise<UserPersonaContext>;

let injectedPersonaResolver: PersonaResolver | null = null;

/** Test seam — inject a deterministic persona resolver. */
export function __setPersonaResolverForTest(resolver: PersonaResolver | null): void {
  injectedPersonaResolver = resolver;
}

/**
 * Default persona resolver. Phase 1 keeps this inert: it returns
 * `tenantRole: null, personas: []` for everyone. The result is that
 * persona-default fan-out is a no-op until a future PR wires
 * `getUserTenantRole()` + a `user_personas` lookup into this seam.
 *
 * Callers that already know a recipient set (the typical Wave 4
 * emitter case) pass `recipientUserIds` directly — that path does
 * NOT depend on the persona resolver.
 */
async function defaultPersonaResolver(
  userId: string,
  tenantKey: string,
): Promise<UserPersonaContext> {
  void tenantKey; // Phase 1: ignored; Phase 2 will look up by (tenantKey, userId).
  return { userId, tenantRole: null, personas: [] };
}

function getPersonaResolver(): PersonaResolver {
  return injectedPersonaResolver ?? defaultPersonaResolver;
}

// ─────────────────────────────────────────────────────────────────────────────
// PII redaction
// ─────────────────────────────────────────────────────────────────────────────

function redactEmail(email: string): string {
  const trimmed = email.trim();
  const at = trimmed.indexOf('@');
  if (at < 1) return '[redacted]';
  return `${trimmed.charAt(0)}***@${trimmed.slice(at + 1)}`;
}

/**
 * Strip / shorten PII-bearing fields from a payload for log purposes.
 * Used before any console.warn that includes the payload.
 */
function redactForLog(
  payload: Record<string, unknown>,
  piiClass: EventDefinition['piiClass'],
): Record<string, unknown> {
  if (piiClass === 'none') return payload;
  const out: Record<string, unknown> = { ...payload };
  // Common PII keys we know about. New ones can be added without
  // changing the broker's external contract.
  const piiKeys = ['email', 'inviteeEmail', 'recipientEmail', 'userEmail'];
  for (const key of piiKeys) {
    const value = out[key];
    if (typeof value === 'string') out[key] = redactEmail(value);
  }
  // Hash-style anonymisation for user ids — keep first 6 chars.
  if (typeof out.userId === 'string' && out.userId.length > 6) {
    out.userId = `${out.userId.slice(0, 6)}…`;
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Quiet-hours math
// ─────────────────────────────────────────────────────────────────────────────

interface QuietWindow {
  /** "HH:MM:SS" 24h. Null = no quiet hours. */
  start: string | null;
  end: string | null;
  timezone: string;
}

/**
 * Returns true when the supplied `now` falls inside the user's quiet
 * window. Wraps midnight when end < start. Falls back to false when
 * the window is unset or the timezone is invalid.
 *
 * We do NOT convert to the user's timezone in Phase 1 — the broker
 * compares the TIME-OF-DAY components only, treating the start/end
 * as "wall clock in that timezone" against `now` in UTC. Phase 2
 * lands a real tz conversion via Intl.DateTimeFormat. Callers can
 * override `now` for tests.
 */
export function isInQuietHours(window: QuietWindow, now: Date = new Date()): boolean {
  if (!window.start || !window.end) return false;
  const startMin = hhmmssToMinutes(window.start);
  const endMin = hhmmssToMinutes(window.end);
  if (startMin === null || endMin === null) return false;
  const nowMin = now.getUTCHours() * 60 + now.getUTCMinutes();
  if (startMin === endMin) return false;
  if (startMin < endMin) {
    return nowMin >= startMin && nowMin < endMin;
  }
  // Wraps midnight.
  return nowMin >= startMin || nowMin < endMin;
}

function hhmmssToMinutes(hhmmss: string): number | null {
  const match = /^(\d{1,2}):(\d{1,2})(?::\d{1,2})?$/.exec(hhmmss);
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  if (h > 23 || m > 59) return null;
  return h * 60 + m;
}

// ─────────────────────────────────────────────────────────────────────────────
// Subscriber resolution
// ─────────────────────────────────────────────────────────────────────────────

interface ResolvedSubscriber {
  userId: string;
  /** Explicit preference row, if any. */
  preference: NotificationPreferenceRow | null;
  /** True if this user has a mandatory subscription for this event. */
  mandatory: boolean;
  /** True if this user matches a persona default (Spine §3). */
  personaDefault: boolean;
}

async function loadExplicitPreferences(
  tenantId: string,
  eventType: string,
): Promise<NotificationPreferenceRow[]> {
  const rows = await azureRead.select<NotificationPreferenceRow>({
    table: 'notification_preferences',
    columns: '*',
    where: { tenant_id: tenantId, event_type: eventType },
    missingTable: 'empty',
  });
  return rows;
}

async function loadMandatorySubscriptions(
  tenantId: string,
  eventType: string,
): Promise<NotificationSubscriptionRow[]> {
  const rows = await azureRead.select<NotificationSubscriptionRow>({
    table: 'notification_subscriptions',
    columns: '*',
    where: { tenant_id: tenantId, event_type: eventType },
    missingTable: 'empty',
  });
  return rows;
}

/**
 * Compose the deduped subscriber set per Spine §3.
 */
async function resolveSubscribers(args: {
  tenantId: string;
  tenantKey: string;
  eventType: string;
  recipientUserIds?: readonly string[];
}): Promise<ResolvedSubscriber[]> {
  const { tenantId, tenantKey, eventType } = args;

  const [prefs, subs] = await Promise.all([
    loadExplicitPreferences(tenantId, eventType),
    loadMandatorySubscriptions(tenantId, eventType),
  ]);

  const prefByUser = new Map<string, NotificationPreferenceRow>();
  for (const p of prefs) prefByUser.set(p.user_id, p);

  const mandatoryUsers = new Set<string>(subs.map((s) => s.user_id));

  // Candidate set: explicit prefs ∪ mandatory subscriptions ∪ persona defaults.
  const userIds = new Set<string>();

  if (args.recipientUserIds && args.recipientUserIds.length > 0) {
    // Caller-supplied set is authoritative. We still include mandatory
    // subscribers — those cannot be skipped — but we do NOT run persona
    // defaults in this branch.
    for (const uid of args.recipientUserIds) userIds.add(uid);
    for (const uid of mandatoryUsers) userIds.add(uid);
  } else {
    for (const p of prefs) {
      if (p.channel !== 'none' && p.frequency !== 'none') userIds.add(p.user_id);
    }
    for (const uid of mandatoryUsers) userIds.add(uid);
    // Persona defaults — resolved per user via the injected resolver.
    // The resolver is a Phase 1 stub (returns inert context); when wired
    // it iterates the tenant's users. Today the broker scopes persona
    // fan-out to the union of (pref-known users + mandatory-known users)
    // to avoid asking the resolver "give me every user" before the
    // user-personas table exists. New Phase 2 fan-out: enumerate tenant
    // users from clerk → resolver → matcher.
    const personaCandidates = new Set<string>([
      ...prefs.map((p) => p.user_id),
      ...mandatoryUsers,
    ]);
    const resolver = getPersonaResolver();
    for (const uid of personaCandidates) {
      const ctx = await resolver(uid, tenantKey);
      if (userMatchesPersonaDefault(ctx, eventType)) userIds.add(uid);
    }
  }

  // Compose ResolvedSubscriber per user.
  const resolved: ResolvedSubscriber[] = [];
  for (const uid of userIds) {
    const preference = prefByUser.get(uid) ?? null;
    const mandatory = mandatoryUsers.has(uid);
    let personaDefault = false;
    if (!args.recipientUserIds) {
      const ctx = await getPersonaResolver()(uid, tenantKey);
      personaDefault = userMatchesPersonaDefault(ctx, eventType);
    }
    resolved.push({ userId: uid, preference, mandatory, personaDefault });
  }
  return resolved;
}

// ─────────────────────────────────────────────────────────────────────────────
// Delivery gating
// ─────────────────────────────────────────────────────────────────────────────

interface DeliveryDecision {
  channels: readonly NotificationDeliveryChannel[];
  reason?: 'throttled' | 'dedup' | 'cap_exceeded' | 'quiet_hours' | 'opt_out';
}

async function checkDedupWindow(args: {
  tenantId: string;
  userId: string;
  eventType: string;
  targetResourceId: string | null;
  now: Date;
}): Promise<boolean> {
  if (!args.targetResourceId) return false;
  const sinceIso = new Date(args.now.getTime() - DEDUP_WINDOW_SECONDS * 1000).toISOString();
  // Look for a recent delivery row for this user/event/target. If one
  // exists within the window, coalesce (skip this fan-out).
  const recent = await azureRead.query<{ id: string }>(
    `SELECT d.id
       FROM notification_deliveries d
       JOIN notification_events e ON e.id = d.event_id
      WHERE d.tenant_id = $1
        AND d.user_id = $2
        AND e.event_type = $3
        AND e.target_resource_id = $4
        AND d.created_at >= $5
      LIMIT 1`,
    [args.tenantId, args.userId, args.eventType, args.targetResourceId, sinceIso],
    { missingTable: 'empty' },
  );
  return recent.length > 0;
}

async function countDailyDeliveries(args: {
  tenantId: string;
  userId: string;
  eventType: string;
  now: Date;
}): Promise<number> {
  const sinceIso = new Date(args.now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const rows = await azureRead.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
       FROM notification_deliveries d
       JOIN notification_events e ON e.id = d.event_id
      WHERE d.tenant_id = $1
        AND d.user_id = $2
        AND e.event_type = $3
        AND d.created_at >= $4`,
    [args.tenantId, args.userId, args.eventType, sinceIso],
    { missingTable: 'empty' },
  );
  if (rows.length === 0) return 0;
  return Number(rows[0]?.count ?? '0');
}

/**
 * Decide which channels (if any) to deliver to for a single subscriber.
 * Per Spine §6.
 */
async function decideChannelsForSubscriber(args: {
  tenantId: string;
  subscriber: ResolvedSubscriber;
  event: EventDefinition;
  targetResourceId: string | null;
  now: Date;
}): Promise<DeliveryDecision> {
  const { subscriber, event } = args;
  const pref = subscriber.preference;

  // Start from explicit preference if any, else event defaults.
  let channels: NotificationDeliveryChannel[];
  if (pref) {
    if (pref.channel === 'none') {
      // Mandatory subscribers cannot opt out — they receive at least in_app.
      if (subscriber.mandatory) {
        channels = ['in_app'];
      } else {
        return { channels: [], reason: 'opt_out' };
      }
    } else {
      channels = [pref.channel as NotificationDeliveryChannel];
    }
  } else {
    channels = [...event.defaultChannels];
  }

  // Phase 1 channel filter — drop anything we can't deliver yet.
  channels = channels.filter((c) => PHASE1_CHANNELS.has(c));
  if (channels.length === 0) return { channels: [], reason: 'opt_out' };

  // Dedup window (Spine §6).
  if (
    await checkDedupWindow({
      tenantId: args.tenantId,
      userId: subscriber.userId,
      eventType: event.eventType,
      targetResourceId: args.targetResourceId,
      now: args.now,
    })
  ) {
    return { channels: [], reason: 'dedup' };
  }

  // Daily cap.
  const cap = pref?.daily_cap ?? DEFAULT_DAILY_CAP;
  const sentToday = await countDailyDeliveries({
    tenantId: args.tenantId,
    userId: subscriber.userId,
    eventType: event.eventType,
    now: args.now,
  });
  if (sentToday >= cap) {
    // Per Spine §6: cap exceeded → in_app only.
    channels = channels.includes('in_app') ? ['in_app'] : [];
    if (channels.length === 0) return { channels: [], reason: 'cap_exceeded' };
  }

  // Quiet hours.
  const inQuiet = isInQuietHours(
    {
      start: pref?.quiet_hours_start ?? null,
      end: pref?.quiet_hours_end ?? null,
      timezone: pref?.timezone ?? 'UTC',
    },
    args.now,
  );
  if (inQuiet) {
    if (event.severity === 'critical' && event.auditClass === 'security') {
      // Critical security overrides quiet hours (Spine §6).
    } else if (event.severity === 'warn') {
      // Warn → in_app only during quiet hours.
      channels = channels.includes('in_app') ? ['in_app'] : [];
      if (channels.length === 0) return { channels: [], reason: 'quiet_hours' };
    } else {
      // Info → drop entirely during quiet hours (would be deferred to
      // the next non-quiet digest; Phase 2 lands the deferral queue).
      return { channels: [], reason: 'quiet_hours' };
    }
  }

  return { channels };
}

// ─────────────────────────────────────────────────────────────────────────────
// Delivery enqueue
// ─────────────────────────────────────────────────────────────────────────────

async function insertEventRow(input: NotificationEventInsert): Promise<string> {
  const supabase = getAzureWriteFluentClient();
  const { data, error } = await supabase
    .from('notification_events')
    .insert({
      tenant_id: input.tenant_id,
      event_type: input.event_type,
      source_module: input.source_module,
      severity: input.severity,
      category: input.category,
      audit_class: input.audit_class,
      payload: input.payload,
      actor_user_id: input.actor_user_id ?? null,
      target_resource_id: input.target_resource_id ?? null,
    })
    .select('id')
    .single();
  if (error || !data) {
    throw new Error(`notification_events insert failed: ${error?.message ?? 'no row returned'}`);
  }
  return String((data as { id: string }).id);
}

async function insertDeliveryRows(
  rows: readonly NotificationDeliveryInsert[],
): Promise<number> {
  if (rows.length === 0) return 0;
  const supabase = getAzureWriteFluentClient();
  let enqueued = 0;
  for (const row of rows) {
    const { error } = await supabase
      .from('notification_deliveries')
      .insert({
        event_id: row.event_id,
        tenant_id: row.tenant_id,
        user_id: row.user_id,
        channel: row.channel,
        status: row.status,
        provider_message_id: null,
        bounce_reason: null,
        retry_count: 0,
      });
    if (error) {
      // Per honesty doctrine — one bad row should not poison the
      // entire fan-out. Log a structured warn (PII-redacted) and continue.
      console.warn(
        JSON.stringify({
          event: 'notification_broker.delivery_insert_failed',
          tenant_id: row.tenant_id,
          user_id_prefix: row.user_id.slice(0, 6),
          channel: row.channel,
          error: error.message,
        }),
      );
      continue;
    }
    enqueued += 1;
  }
  return enqueued;
}

// ─────────────────────────────────────────────────────────────────────────────
// Entry point
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Emit a notification. Validates the event_type against the REGISTRY,
 * writes the event row, fans out to subscribers, and enqueues deliveries.
 *
 * Throws on:
 *   • Unregistered event_type.
 *   • Tenant resolution failure.
 *   • notification_events insert failure.
 *
 * Per-subscriber failures are logged and skipped — the broker returns
 * the event_id and the count of successfully enqueued deliveries.
 */
export async function emitNotification(
  input: NotificationEmitInput,
  options: { now?: Date } = {},
): Promise<NotificationEmitResult> {
  // 1. Validate event_type.
  const def = lookupEventDefinition(input.eventType);
  if (!def) {
    throw new Error(
      `emitNotification: unregistered event_type '${input.eventType}'. `
        + 'Add the event to src/lib/notifications/registry.ts before emitting.',
    );
  }

  // 2. Resolve tenant_id.
  const tenantId = await resolveClientId(input.tenantKey);
  if (!tenantId) {
    throw new Error(`emitNotification: could not resolve tenant_id for '${input.tenantKey}'`);
  }

  // 3. Insert the event row.
  const eventId = await insertEventRow({
    tenant_id: tenantId,
    event_type: def.eventType,
    source_module: def.sourceModule,
    severity: def.severity,
    category: def.category,
    audit_class: def.auditClass,
    payload: input.payload,
    actor_user_id: input.actorUserId ?? null,
    target_resource_id: input.targetResourceId ?? null,
  });

  // 4. Resolve subscribers.
  let subscribers: ResolvedSubscriber[];
  try {
    subscribers = await resolveSubscribers({
      tenantId,
      tenantKey: input.tenantKey,
      eventType: def.eventType,
      recipientUserIds: input.recipientUserIds,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(
      JSON.stringify({
        event: 'notification_broker.subscriber_resolution_failed',
        tenant_id: tenantId,
        event_type: def.eventType,
        error: message,
        payload: redactForLog(input.payload, def.piiClass),
      }),
    );
    return { eventId, enqueuedDeliveries: 0 };
  }

  // 5. Decide channels per subscriber + assemble the delivery rows.
  const now = options.now ?? new Date();
  const deliveryRows: NotificationDeliveryInsert[] = [];
  for (const sub of subscribers) {
    const decision = await decideChannelsForSubscriber({
      tenantId,
      subscriber: sub,
      event: def,
      targetResourceId: input.targetResourceId ?? null,
      now,
    });
    for (const channel of decision.channels) {
      deliveryRows.push({
        event_id: eventId,
        user_id: sub.userId,
        tenant_id: tenantId,
        channel,
        status: 'queued',
        provider_message_id: null,
        bounce_reason: null,
      });
    }
  }

  // 6. Enqueue.
  const enqueuedDeliveries = await insertDeliveryRows(deliveryRows);
  return { eventId, enqueuedDeliveries };
}
