/**
 * W4-PR-1 · Enterprise Comms Spine · Notification type contracts
 *
 * Canonical TypeScript shapes that mirror the four notification tables
 * introduced by `supabase/migrations/20260530220000_notifications.sql`.
 *
 * These types are the broker / preferences-page contracts. W4-PR-2 (the
 * NotificationsBroker) imports the row + write shapes from this file;
 * W4-PR-4 (the preferences page) imports the enum unions and the
 * Preference write input.
 *
 * Source: docs/build/ENTERPRISE_COMMS_SPINE_2026-05-30.md §5
 *
 * Boundary note: this file is intentionally type-only. No runtime
 * imports. The broker (W4-PR-2) is the only place that materializes
 * Supabase clients and writes rows.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Enum unions — keep these in lock-step with the CHECK constraints in the
// migration. Tests in `notifications-migration.test.ts` regex-verify that
// every value here appears in the corresponding SQL CHECK.
// ─────────────────────────────────────────────────────────────────────────────

export type NotificationSourceModule =
  | 'setup'
  | 'moves'
  | 'source'
  | 'intelligence'
  | 'tower'
  | 'system';

export type NotificationSeverity = 'info' | 'warn' | 'critical';

export type NotificationCategory =
  | 'operational'
  | 'governance'
  | 'security'
  | 'business'
  | 'digest';

export type NotificationAuditClass =
  | 'transactional'
  | 'security'
  | 'compliance'
  | 'marketing';

/**
 * Phase 1 channels in active use: `email`, `in_app`.
 * Wave 7 adds `slack`, `teams`. Phase 3 adds `pagerduty`.
 * `webhook` and `none` are reserved.
 *
 * The deliveries-channel union is the same minus `none` (you cannot
 * "deliver" a notification to channel none — that means the user
 * opted out and the broker never enqueues a delivery row).
 */
export type NotificationChannel =
  | 'email'
  | 'in_app'
  | 'slack'
  | 'teams'
  | 'pagerduty'
  | 'webhook'
  | 'none';

export type NotificationDeliveryChannel = Exclude<NotificationChannel, 'none'>;

export type NotificationFrequency =
  | 'immediate'
  | 'digest_daily'
  | 'digest_weekly'
  | 'none';

export type NotificationDeliveryStatus =
  | 'queued'
  | 'sent'
  | 'delivered'
  | 'bounced'
  | 'complained'
  | 'failed'
  | 'suppressed';

// ─────────────────────────────────────────────────────────────────────────────
// Row shapes — what the broker reads / writes via Supabase.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Row shape for `notification_events`. Append-only — the broker only
 * ever INSERTs; UPDATE and DELETE are blocked at the DB layer for app
 * roles (service-role retention may purge).
 */
export interface NotificationEventRow {
  id: string;
  tenant_id: string;
  event_type: string;
  source_module: NotificationSourceModule;
  severity: NotificationSeverity;
  category: NotificationCategory;
  audit_class: NotificationAuditClass;
  payload: Record<string, unknown>;
  /** Clerk user id of the actor (or null for system-emitted events). */
  actor_user_id: string | null;
  /** Stable id of the resource the event is about — feeds dedup window. */
  target_resource_id: string | null;
  created_at: string;
}

/**
 * Write shape for `notification_events`. `id` and `created_at` are
 * server-defaulted; the broker passes everything else.
 */
export type NotificationEventInsert = Omit<
  NotificationEventRow,
  'id' | 'created_at'
> & {
  id?: string;
  created_at?: string;
};

/**
 * Row shape for `notification_preferences`. UNIQUE on
 * (tenant_id, user_id, event_type). The broker upserts on that key.
 *
 * `mandatory=true` means the broker rejects writes that would toggle
 * the row to `channel='none'` or `frequency='none'` — admin-managed
 * subscriptions cannot be turned off by the end user.
 */
export interface NotificationPreferenceRow {
  id: string;
  tenant_id: string;
  user_id: string;
  event_type: string;
  channel: NotificationChannel;
  frequency: NotificationFrequency;
  /** IANA `HH:MM:SS` time-of-day; null = no quiet hours. */
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  timezone: string;
  mandatory: boolean;
  /** Per-user-per-event cap; 1..200 enforced at DB layer. */
  daily_cap: number;
  created_at: string;
  updated_at: string;
}

/**
 * Write shape for `notification_preferences`. The broker enforces the
 * mandatory-flag gate at application layer (DB allows UPDATE within
 * tenant; only the broker knows the policy).
 */
export type NotificationPreferenceInsert = Omit<
  NotificationPreferenceRow,
  'id' | 'created_at' | 'updated_at'
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

/**
 * Patch shape — the preferences page sends a sparse update. The broker
 * fetches the existing row, applies the mandatory check, and persists.
 */
export type NotificationPreferenceUpdate = Partial<
  Pick<
    NotificationPreferenceRow,
    | 'channel'
    | 'frequency'
    | 'quiet_hours_start'
    | 'quiet_hours_end'
    | 'timezone'
    | 'daily_cap'
  >
>;

/**
 * Row shape for `notification_deliveries`. Partially mutable: the
 * broker / worker transitions `status`, `sent_at`, `delivered_at`,
 * `bounce_reason`, and `retry_count` as the provider acks land.
 * Trigger-enforced immutables: event_id, tenant_id, user_id, channel,
 * created_at, and provider_message_id once set.
 */
export interface NotificationDeliveryRow {
  id: string;
  event_id: string;
  user_id: string;
  tenant_id: string;
  channel: NotificationDeliveryChannel;
  status: NotificationDeliveryStatus;
  /** Resend / Slack / PagerDuty message id; immutable once set. */
  provider_message_id: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  bounce_reason: string | null;
  retry_count: number;
  created_at: string;
}

export type NotificationDeliveryInsert = Omit<
  NotificationDeliveryRow,
  'id' | 'created_at' | 'sent_at' | 'delivered_at' | 'retry_count'
> & {
  id?: string;
  created_at?: string;
  sent_at?: string | null;
  delivered_at?: string | null;
  retry_count?: number;
};

/**
 * Allowed mutations on a delivery row. The trigger rejects any other
 * column change; the broker should only ever pass these fields when
 * transitioning status.
 */
export type NotificationDeliveryUpdate = Partial<
  Pick<
    NotificationDeliveryRow,
    | 'status'
    | 'provider_message_id'
    | 'sent_at'
    | 'delivered_at'
    | 'bounce_reason'
    | 'retry_count'
  >
>;

/**
 * Row shape for `notification_subscriptions`. Admin-managed mandatory
 * subscriptions. UNIQUE on (tenant_id, user_id, event_type). UPDATE
 * is blocked at the policy layer; rotate via delete-and-recreate so
 * the audit chain stays clean.
 */
export interface NotificationSubscriptionRow {
  id: string;
  tenant_id: string;
  user_id: string;
  event_type: string;
  added_by_admin_id: string;
  reason: string | null;
  created_at: string;
}

export type NotificationSubscriptionInsert = Omit<
  NotificationSubscriptionRow,
  'id' | 'created_at'
> & {
  id?: string;
  created_at?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Constants — the 5 default urgent events tenant admins auto-subscribe to
// at provisioning. The seed write itself lives in W4-PR-2 (broker); this
// constant is the source-of-truth list so the broker, the preferences
// page, and tests all agree.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Per founder doctrine: tenant admins are auto-subscribed to these 5
 * urgent event types at provisioning, with mandatory=true so the user
 * cannot toggle them off.
 *
 * Wave 4 events landing this list:
 *   - approval.requested      · governance, critical
 *   - approval.escalated      · governance, critical
 *   - connector.failed        · security, critical
 *   - rls.policy_change       · security, critical
 *   - billing.alert           · business, critical
 */
export const DEFAULT_ADMIN_MANDATORY_EVENT_TYPES: readonly string[] = [
  'approval.requested',
  'approval.escalated',
  'connector.failed',
  'rls.policy_change',
  'billing.alert',
] as const;
