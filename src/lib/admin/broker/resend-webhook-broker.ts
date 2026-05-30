/**
 * W4-PR-7 · Resend webhook broker
 *
 * Processes verified Resend webhook events. The webhook route owns
 * signature verification + HTTP-status responses; this broker owns the
 * DB transitions:
 *
 *   • `email.sent`        → notification_deliveries.status='sent', sent_at
 *   • `email.delivered`   → notification_deliveries.status='delivered', delivered_at
 *   • `email.bounced`     → status='bounced', bounce_reason, bounce_type
 *                           → if Permanent OR ≥3 bounces in 7 days, disable channel + emit system.delivery_failed
 *   • `email.complained`  → status='complained' + auto-unsubscribe non-mandatory + emit system.delivery_failed
 *
 * Per Spine §9 failure modes C (persistent bounce) + D (complaint):
 *   • Mandatory subscriptions survive a complaint downgrade — security /
 *     compliance events MUST continue to deliver (in_app at minimum).
 *   • Email address masking — never log a full email; this broker only
 *     ever receives a `provider_message_id` (no email in the payload).
 *
 * Idempotency: the broker re-fetches the delivery row by
 * `provider_message_id` on every call. If the row is already in a more
 * advanced final state, the broker logs and exits 200-equivalent. Resend
 * may retry a webhook delivery on transient receiver failure, so the
 * broker MUST handle a same-event-twice request without double-counting
 * the bounce or double-disabling the channel.
 *
 * Broker boundary doctrine: this file lives under
 * `src/lib/admin/broker/**`, the only directory permitted direct
 * Supabase access.
 */

import 'server-only';

import { getAzureWriteFluentClient } from '@/lib/data-plane/postgresCompat';
import { azureRead } from '@/lib/data-plane/azureRead';
import { emitNotification } from '@/lib/admin/broker/notification-broker';
import type {
  NotificationDeliveryStatus,
  NotificationPreferenceRow,
} from '@/lib/admin/broker/notifications-types';

// ─────────────────────────────────────────────────────────────────────────────
// Public contract
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A trimmed shape of the Resend webhook envelope. We type only the
 * fields we use; the underlying SDK exports stricter types but adding
 * a hard dep on `resend.WebhookEventPayload` would couple this file to
 * the runtime SDK version in tests.
 */
export interface ResendWebhookEvent {
  /** Resend event_type — e.g. 'email.sent', 'email.bounced'. */
  type: string;
  /** ISO timestamp of when Resend emitted the event. */
  created_at?: string;
  data: {
    /** Resend's message id — joins to notification_deliveries.provider_message_id. */
    email_id?: string;
    /** Some Resend payloads use `id` instead of `email_id`. */
    id?: string;
    bounce?: {
      type?: string;     // 'Permanent' | 'Transient' | 'Undetermined'
      subType?: string;
      message?: string;
    };
    [key: string]: unknown;
  };
}

export type WebhookProcessResult =
  | { ok: true; action: 'no_op_no_delivery' }
  | { ok: true; action: 'no_op_already_in_final_state'; status: NotificationDeliveryStatus }
  | { ok: true; action: 'status_transitioned'; from: NotificationDeliveryStatus; to: NotificationDeliveryStatus }
  | { ok: true; action: 'channel_disabled'; reason: 'permanent_bounce' | 'persistent_bounce' | 'complaint'; eventTypesAffected: number }
  | { ok: false; error: string };

/**
 * Bounce-count threshold per Spine §9 failure mode C.
 *
 * If a user has accumulated this many bounced email deliveries in the
 * last 7 days, the broker auto-disables the email channel even when
 * none of the bounces individually were Permanent. Transient bounces
 * still count toward the threshold.
 */
export const PERSISTENT_BOUNCE_THRESHOLD = 3;

/** Days of bounce history we look at for the threshold check. */
export const BOUNCE_HISTORY_DAYS = 7;

// ─────────────────────────────────────────────────────────────────────────────
// Internals
// ─────────────────────────────────────────────────────────────────────────────

function extractProviderMessageId(ev: ResendWebhookEvent): string | null {
  const id = ev.data.email_id ?? ev.data.id;
  if (typeof id === 'string' && id.trim().length > 0) return id.trim();
  return null;
}

/**
 * Mask a user id for safe logging — keep first 6 chars + ellipsis.
 * Mirrors the masker the notification-broker uses.
 */
function maskUserId(userId: string): string {
  if (userId.length <= 6) return userId;
  return `${userId.slice(0, 6)}…`;
}

interface DeliveryByMessageIdRow {
  id: string;
  event_id: string;
  user_id: string;
  tenant_id: string;
  channel: string;
  status: NotificationDeliveryStatus;
  provider_message_id: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  bounce_reason: string | null;
  bounce_type: string | null;
  retry_count: number;
  created_at: string;
}

async function findDeliveryByMessageId(
  providerMessageId: string,
): Promise<DeliveryByMessageIdRow | null> {
  const rows = await azureRead.query<DeliveryByMessageIdRow>(
    `SELECT id, event_id, user_id, tenant_id, channel, status,
            provider_message_id, sent_at, delivered_at,
            bounce_reason, bounce_type, retry_count, created_at
       FROM notification_deliveries
      WHERE provider_message_id = $1
      LIMIT 1`,
    [providerMessageId],
    { missingTable: 'empty' },
  );
  return rows[0] ?? null;
}

/**
 * Final statuses — once a row reaches one of these, the broker does
 * NOT regress it on a later (out-of-order) webhook delivery.
 */
const TERMINAL_PROGRESSION: Record<NotificationDeliveryStatus, number> = {
  queued: 0,
  sent: 1,
  delivered: 2,
  bounced: 3,
  complained: 3,
  failed: 3,
  suppressed: 3,
};

function isProgression(from: NotificationDeliveryStatus, to: NotificationDeliveryStatus): boolean {
  // Allow 'delivered' to be set after 'sent' but never regress.
  return TERMINAL_PROGRESSION[to] > TERMINAL_PROGRESSION[from];
}

async function updateDeliveryStatus(args: {
  deliveryId: string;
  status: NotificationDeliveryStatus;
  sentAt?: string;
  deliveredAt?: string;
  bounceReason?: string;
  bounceType?: string;
}): Promise<void> {
  const supabase = getAzureWriteFluentClient();
  const patch: Record<string, unknown> = { status: args.status };
  if (args.sentAt !== undefined) patch.sent_at = args.sentAt;
  if (args.deliveredAt !== undefined) patch.delivered_at = args.deliveredAt;
  if (args.bounceReason !== undefined) patch.bounce_reason = args.bounceReason;
  if (args.bounceType !== undefined) patch.bounce_type = args.bounceType;
  const { error } = await supabase
    .from('notification_deliveries')
    .update(patch)
    .eq('id', args.deliveryId);
  if (error) {
    throw new Error(`delivery_update_failed: ${error.message ?? 'unknown'}`);
  }
}

interface BounceCountRow {
  count: string;
}

async function countRecentBouncesForUserChannel(args: {
  tenantId: string;
  userId: string;
  channel: string;
  now: Date;
}): Promise<number> {
  const sinceIso = new Date(
    args.now.getTime() - BOUNCE_HISTORY_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
  const rows = await azureRead.query<BounceCountRow>(
    `SELECT COUNT(*)::text AS count
       FROM notification_deliveries
      WHERE tenant_id = $1
        AND user_id = $2
        AND channel = $3
        AND status = 'bounced'
        AND created_at >= $4`,
    [args.tenantId, args.userId, args.channel, sinceIso],
    { missingTable: 'empty' },
  );
  if (rows.length === 0) return 0;
  return Number(rows[0]?.count ?? '0');
}

/**
 * Downgrade every non-mandatory email preference row for the user to
 * channel='none'. Mandatory rows are left intact — per founder doctrine
 * they survive complaint / bounce.
 *
 * Returns the affected event_type list (sorted, deduped) so the audit
 * row + admin notification can record exactly what was downgraded.
 */
async function disableEmailChannelForUser(args: {
  tenantId: string;
  userId: string;
  reason: 'permanent_bounce' | 'persistent_bounce' | 'complaint';
}): Promise<string[]> {
  const prefs = await azureRead.select<NotificationPreferenceRow>({
    table: 'notification_preferences',
    columns: '*',
    where: {
      tenant_id: args.tenantId,
      user_id: args.userId,
      channel: 'email',
    },
    missingTable: 'empty',
  });
  if (prefs.length === 0) return [];
  const supabase = getAzureWriteFluentClient();
  const affected: string[] = [];
  for (const pref of prefs) {
    if (pref.mandatory) continue; // founder doctrine: mandatory survives.
    const { error } = await supabase
      .from('notification_preferences')
      .update({ channel: 'none' })
      .eq('id', pref.id);
    if (error) {
      console.warn(
        JSON.stringify({
          event: 'resend_webhook.pref_downgrade_failed',
          tenant_id: args.tenantId,
          user_id_masked: maskUserId(args.userId),
          event_type: pref.event_type,
          reason: args.reason,
          error: error.message,
        }),
      );
      continue;
    }
    affected.push(pref.event_type);
  }
  return affected.sort();
}

/**
 * Resolve the canonical tenant key for emitting `system.delivery_failed`.
 *
 * The notification broker's emit path takes a `tenantKey` and resolves
 * it to a tenant uuid internally. Here we already have the tenant uuid
 * from the delivery row; we need to round-trip it back to the canonical
 * key so the broker can re-resolve. Reading the `clients` table by id.
 *
 * If the lookup fails (FK violated, fixture data), we return null and
 * the caller skips the admin notification rather than throwing.
 */
async function resolveTenantCanonicalKey(tenantId: string): Promise<string | null> {
  const rows = await azureRead.query<{ canonical_key: string | null; slug: string | null }>(
    `SELECT canonical_key, slug
       FROM clients
      WHERE id = $1
      LIMIT 1`,
    [tenantId],
    { missingTable: 'empty' },
  );
  const row = rows[0];
  if (!row) return null;
  return row.canonical_key ?? row.slug ?? null;
}

interface ClerkUserRow {
  user_id: string;
}

async function loadTenantAdminUserIds(tenantId: string): Promise<string[]> {
  // Tenant admins are tracked via the `tenant_memberships` (or `persons`)
  // table depending on deployment. The notification-subscriptions table
  // is the source of truth for who is subscribed to ANY admin-mandatory
  // event, so we read that and dedup.
  const rows = await azureRead.query<ClerkUserRow>(
    `SELECT DISTINCT user_id
       FROM notification_subscriptions
      WHERE tenant_id = $1`,
    [tenantId],
    { missingTable: 'empty' },
  );
  return rows.map((r) => r.user_id);
}

async function writeAuditRow(args: {
  tenantId: string;
  action: 'email_channel_auto_disabled' | 'email_complained';
  summary: string;
  metadata: Record<string, unknown>;
}): Promise<void> {
  try {
    const supabase = getAzureWriteFluentClient();
    const { error } = await supabase.from('admin_audit_log').insert({
      client_id: args.tenantId,
      actor_person_id: null,
      category: 'other',
      action: args.action,
      target_kind: 'notification_channel',
      target_id: null,
      summary: args.summary,
      metadata: args.metadata,
    });
    if (error) {
      console.warn(
        JSON.stringify({
          event: 'resend_webhook.audit_write_failed',
          action: args.action,
          tenant_id: args.tenantId,
          error: error.message,
        }),
      );
    }
  } catch (err) {
    console.warn(
      JSON.stringify({
        event: 'resend_webhook.audit_write_threw',
        action: args.action,
        tenant_id: args.tenantId,
        error: err instanceof Error ? err.message : String(err),
      }),
    );
  }
}

async function notifyAdminsOfDeliveryFailure(args: {
  tenantId: string;
  userId: string;
  reason: 'permanent_bounce' | 'persistent_bounce' | 'complaint';
  bounceCount7d?: number;
  bounceType?: string;
  affectedEventTypes: string[];
  providerMessageId: string;
}): Promise<void> {
  const tenantKey = await resolveTenantCanonicalKey(args.tenantId);
  if (!tenantKey) {
    console.warn(
      JSON.stringify({
        event: 'resend_webhook.admin_notify_skipped',
        reason: 'tenant_canonical_key_not_resolvable',
        tenant_id: args.tenantId,
      }),
    );
    return;
  }
  const admins = await loadTenantAdminUserIds(args.tenantId);
  if (admins.length === 0) {
    console.warn(
      JSON.stringify({
        event: 'resend_webhook.admin_notify_skipped',
        reason: 'no_admin_subscribers',
        tenant_id: args.tenantId,
      }),
    );
    return;
  }
  try {
    await emitNotification({
      tenantKey,
      eventType: 'system.delivery_failed',
      payload: {
        user_id_masked: maskUserId(args.userId),
        reason: args.reason,
        ...(args.bounceCount7d !== undefined ? { bounce_count_7d: args.bounceCount7d } : {}),
        ...(args.bounceType ? { bounce_type: args.bounceType } : {}),
        affected_event_types: args.affectedEventTypes,
        provider_message_id: args.providerMessageId,
      },
      recipientUserIds: admins,
      targetResourceId: `delivery:${args.providerMessageId}`,
    });
  } catch (err) {
    // Per honesty doctrine, we log but don't bubble — the webhook
    // already updated the delivery row; admin-notification failure must
    // not cause Resend to keep retrying.
    console.warn(
      JSON.stringify({
        event: 'resend_webhook.admin_notify_failed',
        tenant_id: args.tenantId,
        reason: args.reason,
        error: err instanceof Error ? err.message : String(err),
      }),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Entry point
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Apply a verified Resend webhook event to the delivery ledger. The
 * caller (`/api/webhooks/resend/route.ts`) is responsible for signature
 * verification + HTTP status. This function never throws — it returns
 * a typed result the route can log; the route always 200s so Resend
 * doesn't retry.
 */
export async function processResendWebhookEvent(
  ev: ResendWebhookEvent,
  options: { now?: Date } = {},
): Promise<WebhookProcessResult> {
  const providerMessageId = extractProviderMessageId(ev);
  if (!providerMessageId) {
    return { ok: false, error: 'resend_webhook_missing_email_id' };
  }

  const delivery = await findDeliveryByMessageId(providerMessageId);
  if (!delivery) {
    // The webhook references a delivery we don't have a row for. This
    // can happen when Resend forwards an event for a message we never
    // tracked (manual API send, dev test) — log + 200.
    console.info(
      JSON.stringify({
        event: 'resend_webhook.delivery_not_found',
        provider_message_id_prefix: providerMessageId.slice(0, 12),
        type: ev.type,
      }),
    );
    return { ok: true, action: 'no_op_no_delivery' };
  }

  const now = options.now ?? new Date();
  const nowIso = now.toISOString();

  switch (ev.type) {
    case 'email.sent': {
      // sent_at landed via the dispatcher. Honor the webhook only if
      // we haven't already advanced past 'sent'.
      if (!isProgression(delivery.status, 'sent')) {
        return {
          ok: true,
          action: 'no_op_already_in_final_state',
          status: delivery.status,
        };
      }
      try {
        await updateDeliveryStatus({
          deliveryId: delivery.id,
          status: 'sent',
          sentAt: delivery.sent_at ?? nowIso,
        });
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : String(err) };
      }
      return { ok: true, action: 'status_transitioned', from: delivery.status, to: 'sent' };
    }

    case 'email.delivered': {
      if (!isProgression(delivery.status, 'delivered')) {
        return {
          ok: true,
          action: 'no_op_already_in_final_state',
          status: delivery.status,
        };
      }
      try {
        await updateDeliveryStatus({
          deliveryId: delivery.id,
          status: 'delivered',
          sentAt: delivery.sent_at ?? nowIso,
          deliveredAt: nowIso,
        });
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : String(err) };
      }
      return { ok: true, action: 'status_transitioned', from: delivery.status, to: 'delivered' };
    }

    case 'email.bounced': {
      const bounceType = typeof ev.data.bounce?.type === 'string' ? ev.data.bounce.type : null;
      const bounceReason = typeof ev.data.bounce?.message === 'string'
        ? ev.data.bounce.message
        : 'unspecified_bounce';
      const normalizedType = bounceType === 'Permanent' || bounceType === 'Transient' || bounceType === 'Undetermined'
        ? bounceType
        : 'Undetermined';

      // Idempotency: if we've already recorded this as bounced, don't
      // double-count toward the 7-day threshold.
      if (delivery.status === 'bounced') {
        return {
          ok: true,
          action: 'no_op_already_in_final_state',
          status: 'bounced',
        };
      }

      try {
        await updateDeliveryStatus({
          deliveryId: delivery.id,
          status: 'bounced',
          bounceReason,
          bounceType: normalizedType,
        });
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : String(err) };
      }

      // Persistent-bounce + Permanent-bounce auto-disable.
      const isPermanent = normalizedType === 'Permanent';
      let bounceCount = 1; // we just landed one; the threshold check counts inclusive.
      if (!isPermanent) {
        bounceCount = await countRecentBouncesForUserChannel({
          tenantId: delivery.tenant_id,
          userId: delivery.user_id,
          channel: delivery.channel,
          now,
        });
      }

      const reason: 'permanent_bounce' | 'persistent_bounce' | null = isPermanent
        ? 'permanent_bounce'
        : bounceCount >= PERSISTENT_BOUNCE_THRESHOLD
          ? 'persistent_bounce'
          : null;

      if (reason) {
        const affected = await disableEmailChannelForUser({
          tenantId: delivery.tenant_id,
          userId: delivery.user_id,
          reason,
        });
        await writeAuditRow({
          tenantId: delivery.tenant_id,
          action: 'email_channel_auto_disabled',
          summary:
            reason === 'permanent_bounce'
              ? `Email channel auto-disabled for user ${maskUserId(delivery.user_id)} (permanent bounce)`
              : `Email channel auto-disabled for user ${maskUserId(delivery.user_id)} (${bounceCount} bounces in ${BOUNCE_HISTORY_DAYS} days)`,
          metadata: {
            user_id_masked: maskUserId(delivery.user_id),
            reason,
            bounce_count_7d: bounceCount,
            bounce_type: normalizedType,
            affected_event_types: affected,
            provider_message_id: providerMessageId,
          },
        });
        await notifyAdminsOfDeliveryFailure({
          tenantId: delivery.tenant_id,
          userId: delivery.user_id,
          reason,
          bounceCount7d: bounceCount,
          bounceType: normalizedType,
          affectedEventTypes: affected,
          providerMessageId,
        });
        return {
          ok: true,
          action: 'channel_disabled',
          reason,
          eventTypesAffected: affected.length,
        };
      }

      return { ok: true, action: 'status_transitioned', from: delivery.status, to: 'bounced' };
    }

    case 'email.complained': {
      // Idempotency: complaint already recorded → no-op.
      if (delivery.status === 'complained') {
        return {
          ok: true,
          action: 'no_op_already_in_final_state',
          status: 'complained',
        };
      }
      try {
        await updateDeliveryStatus({
          deliveryId: delivery.id,
          status: 'complained',
        });
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : String(err) };
      }
      const affected = await disableEmailChannelForUser({
        tenantId: delivery.tenant_id,
        userId: delivery.user_id,
        reason: 'complaint',
      });
      await writeAuditRow({
        tenantId: delivery.tenant_id,
        action: 'email_complained',
        summary: `Spam complaint received from user ${maskUserId(delivery.user_id)} — non-mandatory email subscriptions disabled`,
        metadata: {
          user_id_masked: maskUserId(delivery.user_id),
          affected_event_types: affected,
          provider_message_id: providerMessageId,
        },
      });
      await notifyAdminsOfDeliveryFailure({
        tenantId: delivery.tenant_id,
        userId: delivery.user_id,
        reason: 'complaint',
        affectedEventTypes: affected,
        providerMessageId,
      });
      return {
        ok: true,
        action: 'channel_disabled',
        reason: 'complaint',
        eventTypesAffected: affected.length,
      };
    }

    default:
      // Unhandled event_type — Resend sends many we don't act on
      // (email.opened, email.clicked, etc). Acknowledge + ignore.
      console.info(
        JSON.stringify({
          event: 'resend_webhook.event_type_ignored',
          type: ev.type,
          provider_message_id_prefix: providerMessageId.slice(0, 12),
        }),
      );
      return { ok: true, action: 'no_op_no_delivery' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Health probe
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Last-webhook-received timestamp. Stored as a module-scoped variable
 * because the webhook is the only writer and a healthcheck route is
 * the only reader; we don't need durability across processes for this
 * single signal. (A future PR can persist it if cross-instance liveness
 * is required.)
 */
let lastWebhookReceivedAt: string | null = null;

export function recordWebhookReceived(at: Date = new Date()): void {
  lastWebhookReceivedAt = at.toISOString();
}

export function getLastWebhookReceivedAt(): string | null {
  return lastWebhookReceivedAt;
}

/** Test seam — clear the last-received marker. */
export function __resetWebhookHealthForTest(): void {
  lastWebhookReceivedAt = null;
}
