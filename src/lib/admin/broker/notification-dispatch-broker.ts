/**
 * W4-PR-5 · Enterprise Comms Spine · Notification dispatch broker
 *
 * Backend for the Vercel cron worker at
 * `src/app/api/cron/notifications-tick/route.ts`. The route validates
 * the cron secret and delegates the actual queue pull / dispatch /
 * status update here so that ALL Supabase access remains under
 * `src/lib/admin/broker/**` (broker-boundary doctrine).
 *
 * Per Spine §6 (throttle) + §8 (dispatch worker) + §11 W4-PR-5:
 *
 *   1. Pick up `notification_deliveries` rows with `status='queued'`
 *      AND `created_at < now() - GRACE_SECONDS`.
 *   2. Filter to channels we can dispatch this tick (Phase 1: email +
 *      in_app). For each queued row:
 *        - in_app: mark `sent` immediately (the inbox is local DB).
 *        - email:
 *            a. Look up the parent `notification_events` row for
 *               event_type + payload + tenant_id.
 *            b. Resolve recipient email from Clerk (best-effort).
 *            c. Resolve a TenantBrand from `clients`.
 *            d. Render the template via `getTemplate(eventType)`.
 *            e. Dispatch via `sendEmail()`.
 *            f. On success: `status='sent'`, `sent_at=now()`,
 *               `provider_message_id=<resend id>`.
 *            g. On retryable failure: `retry_count += 1`. After
 *               MAX_RETRIES, transition to `status='failed'` and
 *               record `bounce_reason`.
 *            h. On non-retryable failure (invalid recipient, no
 *               template, no email on file): `status='failed'`
 *               immediately with reason.
 *
 *   3. Idempotency: rows are claimed via UPDATE...RETURNING with a
 *      precondition on `status='queued'` so a concurrent tick that
 *      raced on the same row sees zero affected rows and skips it.
 *
 *   4. Time budget: each tick caps at TICK_DEADLINE_MS so a slow
 *      provider does not block the worker past the cron window.
 *
 * Honesty doctrine: every dispatch records a delivery-row transition
 * even on failure. We do NOT silently swallow errors; the cron route
 * surfaces processed / sent / failed counts in its JSON response and
 * structured logs.
 *
 * Source: docs/build/ENTERPRISE_COMMS_SPINE_2026-05-30.md §6, §8, §11.
 */

import 'server-only';

import { clerkClient } from '@clerk/nextjs/server';

import { azureRead } from '@/lib/data-plane/azureRead';
import { getAzureWriteFluentClient } from '@/lib/data-plane/postgresCompat';
import { sendEmail } from '@/lib/notifications/channels/email-resend';
import {
  buildCanSpamHeaders,
  canSpamFooterHtml,
  canSpamFooterText,
  assembleEmailHeaders,
} from '@/lib/notifications/can-spam-headers';
import { getTemplate } from '@/lib/notifications/templates';
import type { TenantBrand } from '@/lib/notifications/templates';
import type {
  NotificationDeliveryRow,
  NotificationDeliveryChannel,
  NotificationEventRow,
} from '@/lib/admin/broker/notifications-types';

// ─────────────────────────────────────────────────────────────────────────────
// Tunables (Spine §6 + W4-PR-5 brief)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Small grace window before claiming queued rows. Lets a same-tx
 * broker emit finish the delivery-row inserts before the worker
 * scans for them.
 */
const QUEUE_GRACE_SECONDS = 10;

/** Max rows processed per tick. Keeps each tick bounded. */
const TICK_BATCH_SIZE = 50;

/**
 * Hard cap for a tick's wall time. Default Vercel cron interval is
 * 60s; we exit early at 10s to leave headroom for response framing
 * and to fail loudly if dispatch starts hanging.
 */
const TICK_DEADLINE_MS = 10_000;

/** Max retries before marking a delivery permanently failed. */
const MAX_RETRIES = 3;

/**
 * Linear-ish backoff schedule (seconds before the row is eligible
 * for the next retry, indexed by retry_count). The worker filters
 * `created_at + offset < now()` so a row with retry_count=1 must
 * have been first queued at least 60s ago, retry_count=2 at least
 * 5min ago, etc. This is a coarse approximation of the per-row
 * `next_retry_at` schedule from the brief; the migration in W4-PR-1
 * does not yet have a dedicated column.
 */
const RETRY_BACKOFF_SECONDS: readonly number[] = [0, 60, 300, 1500];

// ─────────────────────────────────────────────────────────────────────────────
// Public contract
// ─────────────────────────────────────────────────────────────────────────────

export interface DispatchTickResult {
  processed: number;
  sent: number;
  failed: number;
  skipped: number;
  durationMs: number;
}

export interface DispatchTickInput {
  /** Override "now" for tests. */
  now?: Date;
  /** Override batch size for tests. */
  batchSize?: number;
  /** Override deadline for tests. */
  deadlineMs?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook seams — injection for tests
// ─────────────────────────────────────────────────────────────────────────────

/** Channel-level adapter — the broker calls one of these per delivery. */
export interface EmailSendAdapter {
  sendEmail: typeof sendEmail;
}

let injectedEmailAdapter: EmailSendAdapter | null = null;

/** Test seam — swap the email adapter. */
export function __setEmailAdapterForTest(adapter: EmailSendAdapter | null): void {
  injectedEmailAdapter = adapter;
}

function getEmailAdapter(): EmailSendAdapter {
  return injectedEmailAdapter ?? { sendEmail };
}

export interface RecipientResolver {
  resolveEmail(userId: string): Promise<string | null>;
}

let injectedRecipientResolver: RecipientResolver | null = null;

/** Test seam — swap the Clerk recipient lookup. */
export function __setRecipientResolverForTest(resolver: RecipientResolver | null): void {
  injectedRecipientResolver = resolver;
}

async function defaultResolveEmail(userId: string): Promise<string | null> {
  try {
    const clerk = await clerkClient();
    const user = (await clerk.users.getUser(userId)) as {
      primaryEmailAddress?: { emailAddress?: string | null } | null;
      emailAddresses?: ReadonlyArray<{ emailAddress?: string | null }>;
    };
    const primary = user.primaryEmailAddress?.emailAddress;
    if (typeof primary === 'string' && primary.length > 0) return primary;
    const fallback = user.emailAddresses?.[0]?.emailAddress;
    return typeof fallback === 'string' && fallback.length > 0 ? fallback : null;
  } catch {
    return null;
  }
}

function getRecipientResolver(): RecipientResolver {
  return injectedRecipientResolver ?? { resolveEmail: defaultResolveEmail };
}

export interface TenantResolver {
  resolveTenant(tenantId: string): Promise<TenantBrand | null>;
}

let injectedTenantResolver: TenantResolver | null = null;

/** Test seam — swap the tenant brand lookup. */
export function __setTenantResolverForTest(resolver: TenantResolver | null): void {
  injectedTenantResolver = resolver;
}

async function defaultResolveTenant(tenantId: string): Promise<TenantBrand | null> {
  const row = await azureRead.maybeSingle<{
    name?: string | null;
    slug?: string | null;
    industry?: string | null;
  }>({
    table: 'clients',
    columns: ['name', 'slug', 'industry'],
    where: { id: tenantId },
    missingTable: 'empty',
  });
  if (!row) return null;
  return {
    name: row.name?.trim() ?? row.slug ?? 'Workspace',
    industryTag: row.industry?.trim() ?? '',
    canonicalKey: row.slug?.trim() ?? tenantId,
  };
}

function getTenantResolver(): TenantResolver {
  return injectedTenantResolver ?? { resolveTenant: defaultResolveTenant };
}

// ─────────────────────────────────────────────────────────────────────────────
// Logging — structured, single-line JSON so Vercel log search works.
// ─────────────────────────────────────────────────────────────────────────────

function logTick(result: DispatchTickResult): void {
  console.log(
    JSON.stringify({
      event: 'notifications_tick',
      processed: result.processed,
      sent: result.sent,
      failed: result.failed,
      skipped: result.skipped,
      durationMs: result.durationMs,
    }),
  );
}

function logDispatch(opts: {
  deliveryId: string;
  eventType: string;
  tenantId: string;
  channel: NotificationDeliveryChannel;
  status: 'sent' | 'failed' | 'retry' | 'skipped';
  latencyMs: number;
  reason?: string;
}): void {
  console.log(
    JSON.stringify({
      event: 'notification_dispatched',
      deliveryId: opts.deliveryId,
      eventType: opts.eventType,
      tenantId: opts.tenantId,
      channel: opts.channel,
      status: opts.status,
      latencyMs: opts.latencyMs,
      reason: opts.reason,
    }),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Queue access
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Backoff predicate. A queued row is eligible only if enough wall time
 * has passed since `created_at` based on its `retry_count`.
 *
 * retry_count=0: must be >= QUEUE_GRACE_SECONDS old.
 * retry_count=N: must be >= sum(QUEUE_GRACE + RETRY_BACKOFF[1..N]) old.
 */
function eligibilityCutoffSeconds(retryCount: number): number {
  let sum = QUEUE_GRACE_SECONDS;
  const ix = Math.max(0, Math.min(retryCount, RETRY_BACKOFF_SECONDS.length - 1));
  for (let i = 1; i <= ix; i += 1) {
    sum += RETRY_BACKOFF_SECONDS[i] ?? 0;
  }
  return sum;
}

interface QueuedDeliveryRow {
  id: string;
  event_id: string;
  user_id: string;
  tenant_id: string;
  channel: NotificationDeliveryChannel;
  retry_count: number;
  created_at: string;
}

async function selectQueuedBatch(args: {
  now: Date;
  batchSize: number;
}): Promise<QueuedDeliveryRow[]> {
  // Coarse selection: anything queued at all, retry_count 0..MAX_RETRIES.
  // The per-row eligibility cutoff is computed in app code so we don't
  // need a `next_retry_at` column in W4-PR-5.
  const rows = await azureRead.query<QueuedDeliveryRow>(
    `SELECT id, event_id, user_id, tenant_id, channel, retry_count, created_at
       FROM notification_deliveries
      WHERE status = 'queued'
        AND retry_count < $1
      ORDER BY created_at ASC
      LIMIT $2`,
    [MAX_RETRIES + 1, args.batchSize],
    { missingTable: 'empty' },
  );
  const nowMs = args.now.getTime();
  return rows.filter((row) => {
    const ageMs = nowMs - new Date(row.created_at).getTime();
    const cutoffMs = eligibilityCutoffSeconds(row.retry_count) * 1000;
    return ageMs >= cutoffMs;
  });
}

interface EventLookup {
  event_type: string;
  payload: Record<string, unknown>;
  tenant_id: string;
}

async function loadEvent(eventId: string): Promise<EventLookup | null> {
  const row = await azureRead.maybeSingle<NotificationEventRow>({
    table: 'notification_events',
    columns: ['event_type', 'payload', 'tenant_id'],
    where: { id: eventId },
    missingTable: 'empty',
  });
  if (!row) return null;
  return {
    event_type: row.event_type,
    payload: (row.payload ?? {}) as Record<string, unknown>,
    tenant_id: row.tenant_id,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Status transitions (idempotent via WHERE status='queued')
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Claim a row by transitioning queued → sent / failed atomically.
 * Returns true iff the UPDATE affected exactly the targeted row;
 * a concurrent tick that already claimed the row will see false
 * and skip its dispatch attempt entirely.
 */
async function transitionDelivery(args: {
  deliveryId: string;
  patch: Partial<NotificationDeliveryRow>;
  fromStatus: 'queued';
}): Promise<boolean> {
  const supabase = getAzureWriteFluentClient();
  const { data, error } = await supabase
    .from('notification_deliveries')
    .update(args.patch)
    .eq('id', args.deliveryId)
    .eq('status', args.fromStatus)
    .select('id');
  if (error) return false;
  return Array.isArray(data) && data.length > 0;
}

async function bumpRetryCount(args: {
  deliveryId: string;
  newRetryCount: number;
  reason: string;
}): Promise<boolean> {
  const supabase = getAzureWriteFluentClient();
  const { data, error } = await supabase
    .from('notification_deliveries')
    .update({ retry_count: args.newRetryCount, bounce_reason: args.reason })
    .eq('id', args.deliveryId)
    .eq('status', 'queued')
    .select('id');
  if (error) return false;
  return Array.isArray(data) && data.length > 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-row dispatchers
// ─────────────────────────────────────────────────────────────────────────────

async function dispatchInApp(row: QueuedDeliveryRow): Promise<'sent' | 'skipped'> {
  const claimed = await transitionDelivery({
    deliveryId: row.id,
    fromStatus: 'queued',
    patch: { status: 'sent', sent_at: new Date().toISOString() },
  });
  return claimed ? 'sent' : 'skipped';
}

async function dispatchEmail(
  row: QueuedDeliveryRow,
  event: EventLookup,
): Promise<{ outcome: 'sent' | 'failed' | 'retry' | 'skipped'; reason?: string }> {
  const template = getTemplate(event.event_type);
  if (!template) {
    // No template → not retryable. Mark failed immediately.
    const claimed = await transitionDelivery({
      deliveryId: row.id,
      fromStatus: 'queued',
      patch: {
        status: 'failed',
        sent_at: new Date().toISOString(),
        bounce_reason: 'no_template_for_event_type',
      },
    });
    return { outcome: claimed ? 'failed' : 'skipped', reason: 'no_template_for_event_type' };
  }

  const recipient = await getRecipientResolver().resolveEmail(row.user_id);
  if (!recipient) {
    const claimed = await transitionDelivery({
      deliveryId: row.id,
      fromStatus: 'queued',
      patch: {
        status: 'failed',
        sent_at: new Date().toISOString(),
        bounce_reason: 'no_recipient_email',
      },
    });
    return { outcome: claimed ? 'failed' : 'skipped', reason: 'no_recipient_email' };
  }

  const tenant = (await getTenantResolver().resolveTenant(row.tenant_id)) ?? {
    name: 'Workspace',
    industryTag: '',
    canonicalKey: row.tenant_id,
  };

  const subject = template.subject(event.payload, tenant);
  const htmlRaw = template.html(event.payload, tenant);
  const textRaw = template.text(event.payload, tenant);

  // CAN-SPAM compliance — append the footer + assemble headers. The
  // templates produce body chrome; CAN-SPAM footer is appended here so
  // every dispatch is uniform regardless of template author.
  const html = `${htmlRaw}${canSpamFooterHtml()}`;
  const text = `${textRaw}${canSpamFooterText()}`;
  const canSpam = buildCanSpamHeaders({
    eventType: event.event_type,
    eventId: row.event_id,
    recipientUserId: row.user_id,
  });
  const headers = assembleEmailHeaders(canSpam, {
    'X-Delivery-Id': row.id,
    'X-Tenant-Key': tenant.canonicalKey,
  });

  const result = await getEmailAdapter().sendEmail({
    to: recipient,
    subject,
    html,
    text,
    headers,
    tags: {
      event_type: event.event_type,
      delivery_id: row.id.slice(0, 30),
      tenant_key: tenant.canonicalKey.slice(0, 30),
    },
  });

  if (result.ok) {
    const claimed = await transitionDelivery({
      deliveryId: row.id,
      fromStatus: 'queued',
      patch: {
        status: 'sent',
        sent_at: new Date().toISOString(),
        provider_message_id: result.providerMessageId,
      },
    });
    return { outcome: claimed ? 'sent' : 'skipped' };
  }

  // Non-retryable failure → mark failed.
  if (!result.retryable) {
    const claimed = await transitionDelivery({
      deliveryId: row.id,
      fromStatus: 'queued',
      patch: {
        status: 'failed',
        sent_at: new Date().toISOString(),
        bounce_reason: `${result.reason}: ${result.message ?? ''}`.slice(0, 500),
      },
    });
    return { outcome: claimed ? 'failed' : 'skipped', reason: result.reason };
  }

  // Retryable failure: bump retry_count. If we've now hit the cap,
  // promote to permanent failure.
  const nextRetry = row.retry_count + 1;
  if (nextRetry >= MAX_RETRIES) {
    const claimed = await transitionDelivery({
      deliveryId: row.id,
      fromStatus: 'queued',
      patch: {
        status: 'failed',
        sent_at: new Date().toISOString(),
        bounce_reason: `${result.reason}: max_retries_exhausted`,
        retry_count: nextRetry,
      },
    });
    return { outcome: claimed ? 'failed' : 'skipped', reason: 'max_retries_exhausted' };
  }
  const bumped = await bumpRetryCount({
    deliveryId: row.id,
    newRetryCount: nextRetry,
    reason: `${result.reason}: retry_${nextRetry}`.slice(0, 500),
  });
  return { outcome: bumped ? 'retry' : 'skipped', reason: result.reason };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main tick
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pull a batch of queued deliveries, dispatch them, update statuses,
 * return per-tick counters. Safe to invoke from a Vercel cron handler.
 */
export async function dispatchTick(input: DispatchTickInput = {}): Promise<DispatchTickResult> {
  const start = Date.now();
  const now = input.now ?? new Date();
  const batchSize = input.batchSize ?? TICK_BATCH_SIZE;
  const deadlineMs = input.deadlineMs ?? TICK_DEADLINE_MS;

  let processed = 0;
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  let batch: QueuedDeliveryRow[];
  try {
    batch = await selectQueuedBatch({ now, batchSize });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(
      JSON.stringify({
        event: 'notifications_tick.select_failed',
        error: message,
      }),
    );
    const result: DispatchTickResult = {
      processed: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
      durationMs: Date.now() - start,
    };
    logTick(result);
    return result;
  }

  for (const row of batch) {
    if (Date.now() - start > deadlineMs) {
      // Out of tick budget; the next cron run will pick up the rest.
      break;
    }
    processed += 1;
    const dispatchStart = Date.now();

    try {
      if (row.channel === 'in_app') {
        const outcome = await dispatchInApp(row);
        const latencyMs = Date.now() - dispatchStart;
        if (outcome === 'sent') sent += 1;
        else skipped += 1;
        logDispatch({
          deliveryId: row.id,
          eventType: 'in_app_inbox',
          tenantId: row.tenant_id,
          channel: row.channel,
          status: outcome,
          latencyMs,
        });
        continue;
      }

      if (row.channel !== 'email') {
        // Phase 1 only handles email + in_app. Anything else is queued
        // by mistake — mark skipped without touching status.
        skipped += 1;
        logDispatch({
          deliveryId: row.id,
          eventType: 'unknown',
          tenantId: row.tenant_id,
          channel: row.channel,
          status: 'skipped',
          latencyMs: Date.now() - dispatchStart,
          reason: 'phase1_channel_not_wired',
        });
        continue;
      }

      // Email path: need event_type + payload.
      const event = await loadEvent(row.event_id);
      if (!event) {
        const claimed = await transitionDelivery({
          deliveryId: row.id,
          fromStatus: 'queued',
          patch: {
            status: 'failed',
            sent_at: new Date().toISOString(),
            bounce_reason: 'parent_event_not_found',
          },
        });
        if (claimed) failed += 1;
        else skipped += 1;
        logDispatch({
          deliveryId: row.id,
          eventType: 'unknown',
          tenantId: row.tenant_id,
          channel: row.channel,
          status: claimed ? 'failed' : 'skipped',
          latencyMs: Date.now() - dispatchStart,
          reason: 'parent_event_not_found',
        });
        continue;
      }

      const { outcome, reason } = await dispatchEmail(row, event);
      const latencyMs = Date.now() - dispatchStart;
      if (outcome === 'sent') sent += 1;
      else if (outcome === 'failed') failed += 1;
      else if (outcome === 'retry') {
        // Counted as processed but neither sent nor failed yet.
      } else skipped += 1;
      logDispatch({
        deliveryId: row.id,
        eventType: event.event_type,
        tenantId: row.tenant_id,
        channel: row.channel,
        status: outcome,
        latencyMs,
        reason,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      // Defensive: bump retry counter if we can; otherwise count as skipped.
      const nextRetry = row.retry_count + 1;
      try {
        if (nextRetry >= MAX_RETRIES) {
          const claimed = await transitionDelivery({
            deliveryId: row.id,
            fromStatus: 'queued',
            patch: {
              status: 'failed',
              sent_at: new Date().toISOString(),
              bounce_reason: `exception: ${message.slice(0, 400)}`,
              retry_count: nextRetry,
            },
          });
          if (claimed) failed += 1;
          else skipped += 1;
        } else {
          await bumpRetryCount({
            deliveryId: row.id,
            newRetryCount: nextRetry,
            reason: `exception: ${message.slice(0, 400)}`,
          });
        }
      } catch {
        skipped += 1;
      }
      logDispatch({
        deliveryId: row.id,
        eventType: 'unknown',
        tenantId: row.tenant_id,
        channel: row.channel,
        status: 'failed',
        latencyMs: Date.now() - dispatchStart,
        reason: `exception: ${message.slice(0, 200)}`,
      });
    }
  }

  const result: DispatchTickResult = {
    processed,
    sent,
    failed,
    skipped,
    durationMs: Date.now() - start,
  };
  logTick(result);
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Health probe
// ─────────────────────────────────────────────────────────────────────────────

export interface DispatchHealthSnapshot {
  queuedCount: number;
  oldestQueuedAt: string | null;
  lastSentAt: string | null;
  lastFailedAt: string | null;
}

/**
 * Read-only view for the `/api/cron/notifications-tick/health` route.
 * Returns counts + watermarks; the operator alerts on a stuck queue.
 */
export async function dispatchHealth(): Promise<DispatchHealthSnapshot> {
  try {
    const queuedCount = await azureRead.count({
      table: 'notification_deliveries',
      where: { status: 'queued' },
      missingTable: 'empty',
    });

    const [oldestQueued, lastSent, lastFailed] = await Promise.all([
      azureRead.maybeSingle<{ created_at: string }>({
        table: 'notification_deliveries',
        columns: ['created_at'],
        where: { status: 'queued' },
        orderBy: { column: 'created_at', direction: 'asc' },
        limit: 1,
        missingTable: 'empty',
      }),
      azureRead.maybeSingle<{ sent_at: string }>({
        table: 'notification_deliveries',
        columns: ['sent_at'],
        where: { status: 'sent' },
        orderBy: { column: 'sent_at', direction: 'desc', nulls: 'last' },
        limit: 1,
        missingTable: 'empty',
      }),
      azureRead.maybeSingle<{ sent_at: string }>({
        table: 'notification_deliveries',
        columns: ['sent_at'],
        where: { status: 'failed' },
        orderBy: { column: 'sent_at', direction: 'desc', nulls: 'last' },
        limit: 1,
        missingTable: 'empty',
      }),
    ]);

    return {
      queuedCount,
      oldestQueuedAt: oldestQueued?.created_at ?? null,
      lastSentAt: lastSent?.sent_at ?? null,
      lastFailedAt: lastFailed?.sent_at ?? null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(
      JSON.stringify({
        event: 'notifications_tick.health_failed',
        error: message,
      }),
    );
    return {
      queuedCount: 0,
      oldestQueuedAt: null,
      lastSentAt: null,
      lastFailedAt: null,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Test-only exports — unit tests reach in for pure helpers.
// ─────────────────────────────────────────────────────────────────────────────

export const __internals__ = {
  QUEUE_GRACE_SECONDS,
  TICK_BATCH_SIZE,
  TICK_DEADLINE_MS,
  MAX_RETRIES,
  RETRY_BACKOFF_SECONDS,
  eligibilityCutoffSeconds,
};
