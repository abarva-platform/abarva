'use server';

/**
 * savePreferences server action · W4-PR-4
 *
 * Persists the user-edited matrix into `notification_preferences` via
 * the notifications-preferences broker. Enforces:
 *
 *   - Caller must be authenticated.
 *   - Active tenancy required.
 *   - Every `event_type` in the payload must be in the registry.
 *   - Mandatory subscriptions cannot be toggled to channel='none' or
 *     frequency='none' (broker-enforced).
 *
 * Writes one row to `admin_audit_log` per successful save with
 * `action='notification_preferences_updated'` so the Wave 4 audit
 * ribbon can render the change in the timeline.
 *
 * Safety:
 *   - No PII in the audit metadata. We log the count of rows updated
 *     and the event types changed (the registry keys, not the row
 *     payloads).
 *   - Per-actor rate-limit: 30 saves / 60 s. The page is editable but
 *     someone holding the button shouldn't generate a thrash.
 */

import { auth } from '@clerk/nextjs/server';
import { requireTenancy, TenancyError } from '@/lib/auth/tenancy';
import { getAzureWriteFluentClient } from '@/lib/data-plane/postgresCompat';
import { passRateLimit } from '@/lib/admin/save-preferences-rate-limit';
import {
  resolveTenantId,
  upsertPreference,
  loadUserMandatorySubscriptions,
} from '@/lib/admin/broker/notifications-preferences-broker';
import { isFixtureMode } from '@/lib/admin/data/admin-data-mode';
import type {
  NotificationChannel,
  NotificationFrequency,
} from '@/lib/admin/broker/notifications-types';

export interface SavePreferencesActionInput {
  rows: Array<{
    event_type: string;
    channel: NotificationChannel;
    frequency: NotificationFrequency;
    quiet_hours_start: string | null;
    quiet_hours_end: string | null;
    timezone: string;
    daily_cap: number;
  }>;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  timezone: string;
  dailyCap: number;
}

export type SavePreferencesActionResult =
  | { ok: true; savedAt: string; count: number }
  | {
      ok: false;
      code:
        | 'unauthenticated'
        | 'no_active_tenant'
        | 'unresolved_tenant'
        | 'mandatory_locked'
        | 'unknown_event_type'
        | 'invalid_channel'
        | 'invalid_frequency'
        | 'invalid_quiet_hours'
        | 'invalid_daily_cap'
        | 'db_error'
        | 'rate_limited';
      message: string;
    };

// ── Action ─────────────────────────────────────────────────────────────────

export async function savePreferences(
  input: SavePreferencesActionInput,
): Promise<SavePreferencesActionResult> {
  // 1) Auth.
  const { userId } = await auth();
  if (!userId) {
    return { ok: false, code: 'unauthenticated', message: 'Sign in to update preferences.' };
  }

  // 2) Rate-limit.
  if (!passRateLimit(userId)) {
    return {
      ok: false,
      code: 'rate_limited',
      message: 'You saved preferences a lot recently. Wait a moment and try again.',
    };
  }

  // 3) Tenancy.
  let tenancy;
  try {
    tenancy = await requireTenancy();
  } catch (err) {
    if (err instanceof TenancyError) {
      return {
        ok: false,
        code: 'no_active_tenant',
        message: 'No active workspace. Pick a workspace and try again.',
      };
    }
    throw err;
  }
  const tenantCanonicalKey = tenancy.clientKey ?? '';
  if (!tenantCanonicalKey) {
    return {
      ok: false,
      code: 'no_active_tenant',
      message: 'No tenant key on active workspace.',
    };
  }
  const tenantId = await resolveTenantId(tenantCanonicalKey);
  if (!tenantId) {
    return {
      ok: false,
      code: 'unresolved_tenant',
      message: 'Could not resolve your tenant. Sign out and back in.',
    };
  }

  // 4) Load mandatory subs so the broker can gate "cannot toggle off".
  const subs = await loadUserMandatorySubscriptions({ tenantId, userId });
  const mandatoryEventTypes = subs.map((s) => s.event_type);

  // 5) Upsert each row. Stop on first hard error so the page can
  // render the precise code.
  let count = 0;
  for (const row of input.rows) {
    const result = await upsertPreference({
      tenantId,
      userId,
      eventType: row.event_type,
      channel: row.channel,
      frequency: row.frequency,
      quietHoursStart: row.quiet_hours_start,
      quietHoursEnd: row.quiet_hours_end,
      timezone: row.timezone || input.timezone || 'UTC',
      dailyCap: row.daily_cap || input.dailyCap || 20,
      mandatoryEventTypes,
    });
    if (!result.ok) {
      return { ok: false, code: result.code, message: result.message };
    }
    count += 1;
  }

  // 6) Audit. Fire-and-forget — the user-visible save succeeded; an
  // audit-write failure is logged, not surfaced.
  void writeAudit({
    tenantId,
    actorUserId: userId,
    rowCount: count,
    eventTypes: input.rows.map((r) => r.event_type),
  }).catch((err) => {
    console.warn(
      JSON.stringify({
        event: 'notification_preferences_audit_failed',
        reason: err instanceof Error ? err.message : 'unknown',
      }),
    );
  });

  return { ok: true, savedAt: new Date().toISOString(), count };
}

// ── Audit writer (local, narrow) ───────────────────────────────────────────

async function writeAudit(args: {
  tenantId: string;
  actorUserId: string;
  rowCount: number;
  eventTypes: string[];
}): Promise<void> {
  if (isFixtureMode()) return;
  const sb = getAzureWriteFluentClient();
  const { error } = await sb.from('admin_audit_log').insert({
    client_id: args.tenantId,
    actor_person_id: null,
    category: 'governance',
    action: 'notification_preferences_updated',
    target_kind: 'notification_preferences',
    target_id: args.actorUserId,
    summary: `Updated ${args.rowCount} notification preference${args.rowCount === 1 ? '' : 's'}`,
    metadata: {
      actor_user_id: args.actorUserId,
      row_count: args.rowCount,
      event_types: args.eventTypes,
    },
  });
  if (error) {
    console.warn(
      JSON.stringify({
        event: 'notification_preferences_audit_failed',
        reason: error.message ?? 'unknown',
      }),
    );
  }
}
