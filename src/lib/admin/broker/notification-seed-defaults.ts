/**
 * W4-PR-2 · Notification seed helpers
 *
 * Two thin upserts the tenant-provisioning flow and the W4-PR-4
 * preferences page can call to put a freshly-onboarded admin into a
 * known-good notification state.
 *
 *   1. seedDefaultPreferencesForAdmin(tenantKey, userId)
 *        — inserts notification_preferences rows for the 5 urgent
 *          events with channel='email', frequency='immediate',
 *          mandatory=false. Founder doctrine #3.
 *
 *   2. seedMandatorySecuritySubscriptionsForAdmin(tenantKey, userId, addedByAdminId)
 *        — inserts notification_subscriptions rows for the security
 *          events that admins MUST receive (cannot be turned off via
 *          preferences UI). Founder doctrine #4.
 *
 * Both helpers are idempotent — UNIQUE(tenant_id, user_id, event_type)
 * means a duplicate call is a no-op (ON CONFLICT DO NOTHING).
 *
 * Neither helper is auto-invoked from this PR. The W4-PR-4 preferences
 * page (admin first-visit lazy seed) and the tenant-provisioning flow
 * (PRE-W4-PR-1 invite handler, later wave) call them.
 *
 * Broker-boundary doctrine: this file lives inside
 * `src/lib/admin/broker/**`, the only directory permitted direct
 * Supabase access from the app tier. App-tier callers (preferences
 * page, tenant-provisioning flow) import these helpers.
 *
 * Honesty: this file does NOT emit notifications about seeding —
 * seeding is an internal operation and would otherwise loop.
 */

import 'server-only';

import { getAzureWriteFluentClient } from '@/lib/data-plane/postgresCompat';
import { resolveClientId } from '@/lib/admin/data/admin-db-helpers';
import { DEFAULT_ADMIN_MANDATORY_EVENT_TYPES } from '@/lib/admin/broker/notifications-types';

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

export interface SeedResult {
  /** Tenant UUID the rows landed under. */
  tenantId: string;
  /** Number of rows inserted (including 0 for fully-idempotent calls). */
  inserted: number;
  /** Number of rows that already existed (skipped via ON CONFLICT). */
  skipped: number;
}

/**
 * Default opt-in seeding (founder decision #3).
 *
 * Inserts a `notification_preferences` row for each of the 5 urgent
 * event types with channel='email', frequency='immediate', mandatory=false.
 * The user can later downgrade frequency / channel via the preferences
 * page. The `mandatory=false` posture means these are recommendations,
 * not enforcements — to lock them in, the caller also calls
 * `seedMandatorySecuritySubscriptionsForAdmin()`.
 */
export async function seedDefaultPreferencesForAdmin(
  tenantKey: string,
  userId: string,
): Promise<SeedResult> {
  const tenantId = await resolveClientId(tenantKey);
  if (!tenantId) {
    throw new Error(
      `seedDefaultPreferencesForAdmin: could not resolve tenant '${tenantKey}'`,
    );
  }
  if (!userId || userId.trim().length === 0) {
    throw new Error('seedDefaultPreferencesForAdmin: userId is required');
  }

  const supabase = getAzureWriteFluentClient();
  let inserted = 0;
  let skipped = 0;
  for (const eventType of DEFAULT_ADMIN_MANDATORY_EVENT_TYPES) {
    // Idempotent — UNIQUE(tenant_id, user_id, event_type). We use
    // upsert with ignoreDuplicates so a re-run is a clean no-op.
    const { data, error } = await supabase
      .from('notification_preferences')
      .upsert(
        {
          tenant_id: tenantId,
          user_id: userId,
          event_type: eventType,
          channel: 'email',
          frequency: 'immediate',
          mandatory: false,
        },
        { onConflict: 'tenant_id,user_id,event_type', ignoreDuplicates: true },
      )
      .select('id');
    if (error) {
      // Honesty: surface this — but as a structured warn rather than
      // aborting the whole seed pass. The caller can re-run.
      console.warn(
        JSON.stringify({
          event: 'notifications.seed_preferences_failed',
          tenant_id: tenantId,
          event_type: eventType,
          error: error.message,
        }),
      );
      continue;
    }
    const rows = Array.isArray(data) ? data : [];
    if (rows.length > 0) inserted += rows.length;
    else skipped += 1;
  }
  return { tenantId, inserted, skipped };
}

/**
 * Mandatory security subscriptions (founder decision #4).
 *
 * Inserts `notification_subscriptions` rows for the security events
 * tenant admins MUST receive. UPDATE is blocked at the policy layer —
 * rotation is delete-and-recreate so the audit chain stays clean.
 *
 * `addedByAdminId` is the Clerk user id of the admin invoking the
 * provisioning flow; it lands in notification_subscriptions.added_by_admin_id
 * for audit attribution.
 */
const MANDATORY_SECURITY_EVENT_TYPES: readonly string[] = [
  'isolation.anomaly',
  'isolation.policy_breach',
  'policy.updated',
  'policy.deleted',
  'auth.role_changed',
] as const;

export async function seedMandatorySecuritySubscriptionsForAdmin(
  tenantKey: string,
  userId: string,
  addedByAdminId: string,
  reason?: string,
): Promise<SeedResult> {
  const tenantId = await resolveClientId(tenantKey);
  if (!tenantId) {
    throw new Error(
      `seedMandatorySecuritySubscriptionsForAdmin: could not resolve tenant '${tenantKey}'`,
    );
  }
  if (!userId || userId.trim().length === 0) {
    throw new Error('seedMandatorySecuritySubscriptionsForAdmin: userId is required');
  }
  if (!addedByAdminId || addedByAdminId.trim().length === 0) {
    throw new Error(
      'seedMandatorySecuritySubscriptionsForAdmin: addedByAdminId is required for audit attribution',
    );
  }

  const supabase = getAzureWriteFluentClient();
  let inserted = 0;
  let skipped = 0;
  for (const eventType of MANDATORY_SECURITY_EVENT_TYPES) {
    const { data, error } = await supabase
      .from('notification_subscriptions')
      .upsert(
        {
          tenant_id: tenantId,
          user_id: userId,
          event_type: eventType,
          added_by_admin_id: addedByAdminId,
          reason: reason ?? 'Default mandatory security subscription per founder doctrine #4',
        },
        { onConflict: 'tenant_id,user_id,event_type', ignoreDuplicates: true },
      )
      .select('id');
    if (error) {
      console.warn(
        JSON.stringify({
          event: 'notifications.seed_subscription_failed',
          tenant_id: tenantId,
          event_type: eventType,
          error: error.message,
        }),
      );
      continue;
    }
    const rows = Array.isArray(data) ? data : [];
    if (rows.length > 0) inserted += rows.length;
    else skipped += 1;
  }
  return { tenantId, inserted, skipped };
}

/**
 * The set of event_types `seedMandatorySecuritySubscriptionsForAdmin`
 * seeds. Exposed for tests and the preferences page (the UI greys
 * these out since they cannot be toggled).
 */
export const MANDATORY_SECURITY_SUBSCRIPTIONS: ReadonlySet<string> = new Set(
  MANDATORY_SECURITY_EVENT_TYPES,
);
