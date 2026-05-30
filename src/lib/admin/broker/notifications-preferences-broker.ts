/**
 * Notifications Preferences broker · W4-PR-4
 *
 * Per-user notification preferences read/write surface for the
 * Enterprise Comms Spine preferences page
 * (`/admin/users-access/notifications`).
 *
 * Why this exists
 * ---------------
 * W4-PR-2 (the full `NotificationsBroker`) lands in parallel with
 * W4-PR-4. Until that broker is in main, W4-PR-4 needs its own thin
 * read/write seam so the preferences page can ship without a stub.
 * This file is intentionally narrow: it owns the four reads the page
 * needs (preferences, subscriptions, defaults, registry) and the two
 * writes the page action layer needs (upsert preference, seed defaults).
 *
 * When W4-PR-2 lands, the page can swap to that broker's wider surface;
 * this file then either re-exports through to it or gets retired in a
 * follow-up cleanup.
 *
 * Boundary doctrine
 * -----------------
 * This file lives under `src/lib/admin/broker/**`, the only directory
 * where direct data-plane access is permitted from the app tier
 * (`broker-boundary.test.ts`). The page (`page.tsx`) and the server
 * actions (`_actions/save-preferences.ts`) only ever import from here
 * — never from `@/lib/data-plane/postgresCompat` directly.
 *
 * RLS posture
 * -----------
 * The migration scopes `notification_preferences` and
 * `notification_subscriptions` by `tenant_id` via
 * `can_read_tenant_by_id` / `can_write_tenant_by_id`. The broker passes
 * the resolved `tenant_id` UUID on every call, so the underlying
 * RLS policies bite even when the page is rendered for a maestro
 * cross-tenant viewer.
 *
 * Honesty doctrine (memory · feedback_no_demo_thinking.md)
 * -------------------------------------------------------
 * - When no preferences are stored, `loadUserPreferences` returns []
 *   and the page renders the empty-state preview (defaults).
 * - When the schema is present but the helpers are absent (fresh DB
 *   without 20260507100000_rls_role_helpers.sql), reads still work via
 *   tenant_id equality; the broker does not fabricate rows.
 * - Mandatory-flag enforcement is at the broker layer. The page MAY
 *   send a write that would toggle a mandatory row to channel='none';
 *   `upsertPreference` rejects it (returns `{ ok: false, code:
 *   'mandatory_locked' }`).
 */

import 'server-only';

import { getAzureReadFluentClient } from '@/lib/data-plane/postgresCompat';
import { getAzureWriteFluentClient } from '@/lib/data-plane/postgresCompat';
import { tenantAliasesFor } from '@/lib/tenant/aliases';
import type {
  NotificationChannel,
  NotificationFrequency,
  NotificationPreferenceRow,
  NotificationSourceModule,
  NotificationSubscriptionRow,
} from '@/lib/admin/broker/notifications-types';
import {
  NOTIFICATION_REGISTRY,
  type NotificationRegistryEntry,
} from '@/lib/admin/broker/notifications-registry';

/**
 * Resolve a tenant key (canonical slug) to a `clients.id` UUID.
 *
 * Mirrors the lookup in `invite-collaborator-audit.ts` so the audit
 * row and the preferences row land against the same tenant.
 */
export async function resolveTenantId(canonicalKey: string): Promise<string | null> {
  const sb = getAzureReadFluentClient();
  const aliases = tenantAliasesFor(canonicalKey);
  try {
    for (const alias of aliases) {
      const { data } = await sb
        .from('clients')
        .select('id')
        .eq('tenant_key', alias)
        .maybeSingle();
      const id = (data as { id?: string } | null)?.id;
      if (id) return id;
    }
    for (const alias of aliases) {
      const { data } = await sb
        .from('clients')
        .select('id')
        .eq('slug', alias)
        .maybeSingle();
      const id = (data as { id?: string } | null)?.id;
      if (id) return id;
    }
  } catch {
    return null;
  }
  return null;
}

// ── Read surface ────────────────────────────────────────────────────────────

/**
 * Load every notification_preferences row for the given user in the
 * given tenant. Returns [] when the user has not configured any
 * preferences (the page then renders the defaults preview).
 */
export async function loadUserPreferences(args: {
  tenantId: string;
  userId: string;
}): Promise<NotificationPreferenceRow[]> {
  const sb = getAzureReadFluentClient();
  try {
    const { data, error } = await sb
      .from('notification_preferences')
      .select('*')
      .eq('tenant_id', args.tenantId)
      .eq('user_id', args.userId);
    if (error) {
      console.warn(
        JSON.stringify({
          event: 'notifications_preferences_load_failed',
          reason: error.message ?? 'unknown',
          tenant_id: args.tenantId,
        }),
      );
      return [];
    }
    return (data as NotificationPreferenceRow[] | null) ?? [];
  } catch (err) {
    console.warn(
      JSON.stringify({
        event: 'notifications_preferences_load_threw',
        reason: err instanceof Error ? err.message : 'unknown',
      }),
    );
    return [];
  }
}

/**
 * Load the mandatory subscriptions an admin has pinned on this user.
 * The page renders these as locked rows in the matrix (channel forced,
 * frequency still adjustable).
 */
export async function loadUserMandatorySubscriptions(args: {
  tenantId: string;
  userId: string;
}): Promise<NotificationSubscriptionRow[]> {
  const sb = getAzureReadFluentClient();
  try {
    const { data, error } = await sb
      .from('notification_subscriptions')
      .select('*')
      .eq('tenant_id', args.tenantId)
      .eq('user_id', args.userId);
    if (error) {
      console.warn(
        JSON.stringify({
          event: 'notifications_subscriptions_load_failed',
          reason: error.message ?? 'unknown',
        }),
      );
      return [];
    }
    return (data as NotificationSubscriptionRow[] | null) ?? [];
  } catch (err) {
    console.warn(
      JSON.stringify({
        event: 'notifications_subscriptions_load_threw',
        reason: err instanceof Error ? err.message : 'unknown',
      }),
    );
    return [];
  }
}

// ── Write surface ───────────────────────────────────────────────────────────

export type UpsertPreferenceResult =
  | { ok: true; row: NotificationPreferenceRow }
  | {
      ok: false;
      code:
        | 'mandatory_locked'
        | 'unknown_event_type'
        | 'invalid_channel'
        | 'invalid_frequency'
        | 'invalid_quiet_hours'
        | 'invalid_daily_cap'
        | 'db_error';
      message: string;
    };

/**
 * Upsert a single preferences row. Enforces:
 *   - event_type must exist in the NOTIFICATION_REGISTRY.
 *   - mandatory rows MUST NOT be toggled to channel='none' or
 *     frequency='none' (broker-side mandatory-flag enforcement).
 *   - quiet_hours_start XOR quiet_hours_end is invalid.
 *   - daily_cap must be 1..200.
 *
 * The DB-side CHECK constraints repeat these where possible, but
 * surfacing the typed code at the broker layer lets the page render
 * a precise validation error.
 */
export async function upsertPreference(args: {
  tenantId: string;
  userId: string;
  eventType: string;
  channel: NotificationChannel;
  frequency: NotificationFrequency;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  timezone: string;
  dailyCap: number;
  /**
   * Pass mandatory subscription rows for this user so the broker can
   * gate "cannot toggle off" without re-reading.
   */
  mandatoryEventTypes: readonly string[];
}): Promise<UpsertPreferenceResult> {
  const registry = NOTIFICATION_REGISTRY.find((e) => e.eventType === args.eventType);
  if (!registry) {
    return {
      ok: false,
      code: 'unknown_event_type',
      message: `Event type "${args.eventType}" is not in the notification registry.`,
    };
  }

  const isMandatory = args.mandatoryEventTypes.includes(args.eventType);

  if (isMandatory && (args.channel === 'none' || args.frequency === 'none')) {
    return {
      ok: false,
      code: 'mandatory_locked',
      message: `Event "${args.eventType}" is a mandatory subscription and cannot be turned off.`,
    };
  }

  // Validation — mirror the DB CHECKs so the page sees the typed code.
  const VALID_CHANNELS: NotificationChannel[] = [
    'email',
    'in_app',
    'slack',
    'teams',
    'pagerduty',
    'webhook',
    'none',
  ];
  if (!VALID_CHANNELS.includes(args.channel)) {
    return { ok: false, code: 'invalid_channel', message: `Channel "${args.channel}" is not allowed.` };
  }
  const VALID_FREQS: NotificationFrequency[] = [
    'immediate',
    'digest_daily',
    'digest_weekly',
    'none',
  ];
  if (!VALID_FREQS.includes(args.frequency)) {
    return {
      ok: false,
      code: 'invalid_frequency',
      message: `Frequency "${args.frequency}" is not allowed.`,
    };
  }
  // Quiet hours: both null OR both set.
  const startSet = args.quietHoursStart !== null && args.quietHoursStart !== '';
  const endSet = args.quietHoursEnd !== null && args.quietHoursEnd !== '';
  if (startSet !== endSet) {
    return {
      ok: false,
      code: 'invalid_quiet_hours',
      message: 'Quiet hours start and end must be set together.',
    };
  }
  if (!Number.isInteger(args.dailyCap) || args.dailyCap < 1 || args.dailyCap > 200) {
    return {
      ok: false,
      code: 'invalid_daily_cap',
      message: 'Daily cap must be an integer between 1 and 200.',
    };
  }

  const sb = getAzureWriteFluentClient();
  try {
    const { data, error } = await sb
      .from('notification_preferences')
      .upsert(
        {
          tenant_id: args.tenantId,
          user_id: args.userId,
          event_type: args.eventType,
          channel: args.channel,
          frequency: args.frequency,
          quiet_hours_start: startSet ? args.quietHoursStart : null,
          quiet_hours_end: endSet ? args.quietHoursEnd : null,
          timezone: args.timezone || 'UTC',
          mandatory: isMandatory,
          daily_cap: args.dailyCap,
        },
        { onConflict: 'tenant_id,user_id,event_type' },
      )
      .select('*')
      .single();
    if (error) {
      return { ok: false, code: 'db_error', message: error.message ?? 'Upsert failed.' };
    }
    return { ok: true, row: data as NotificationPreferenceRow };
  } catch (err) {
    return {
      ok: false,
      code: 'db_error',
      message: err instanceof Error ? err.message : 'Upsert threw.',
    };
  }
}

/**
 * Seed default preferences for a user from the NOTIFICATION_REGISTRY.
 * Idempotent — uses UPSERT on the natural key. Mandatory event types
 * inherit `mandatory=true` automatically.
 *
 * Returns the count of rows that landed (insert + update).
 */
export async function seedDefaultPreferences(args: {
  tenantId: string;
  userId: string;
  mandatoryEventTypes: readonly string[];
}): Promise<{ ok: boolean; count: number; message?: string }> {
  const sb = getAzureWriteFluentClient();
  const rows = NOTIFICATION_REGISTRY.map((entry) => ({
    tenant_id: args.tenantId,
    user_id: args.userId,
    event_type: entry.eventType,
    channel: entry.defaultChannel,
    frequency: entry.defaultFrequency,
    quiet_hours_start: null as string | null,
    quiet_hours_end: null as string | null,
    timezone: 'UTC',
    mandatory: args.mandatoryEventTypes.includes(entry.eventType),
    daily_cap: 20,
  }));
  try {
    const { data, error } = await sb
      .from('notification_preferences')
      .upsert(rows, { onConflict: 'tenant_id,user_id,event_type' })
      .select('id');
    if (error) {
      return { ok: false, count: 0, message: error.message };
    }
    return { ok: true, count: (data as Array<unknown> | null)?.length ?? 0 };
  } catch (err) {
    return {
      ok: false,
      count: 0,
      message: err instanceof Error ? err.message : 'Seed threw.',
    };
  }
}

// ── Registry accessors ──────────────────────────────────────────────────────

/**
 * Group the static registry by source module. The matrix renders one
 * fieldset per module in the order returned here.
 */
export function groupRegistryBySourceModule(): Array<{
  module: NotificationSourceModule;
  entries: readonly NotificationRegistryEntry[];
}> {
  const MODULES: NotificationSourceModule[] = [
    'setup',
    'moves',
    'source',
    'intelligence',
    'tower',
    'system',
  ];
  return MODULES.map((mod) => ({
    module: mod,
    entries: NOTIFICATION_REGISTRY.filter((e) => e.sourceModule === mod),
  }));
}
