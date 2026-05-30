/**
 * W4-PR-1 · notifications foundation migration smoke
 *
 * Static SQL inspection — we don't spin up Postgres, we just assert
 * that the migration declares the four tables, the right column
 * types / constraints, RLS posture, append-only triggers, and the
 * indexes the broker and worker need.
 *
 * The TypeScript types in `notifications-types.ts` mirror the enum
 * unions, so we cross-check that every value in the TS unions appears
 * in the SQL CHECK constraints to keep the two in lock-step.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';

import {
  DEFAULT_ADMIN_MANDATORY_EVENT_TYPES,
  type NotificationAuditClass,
  type NotificationCategory,
  type NotificationChannel,
  type NotificationDeliveryStatus,
  type NotificationFrequency,
  type NotificationSeverity,
  type NotificationSourceModule,
} from '@/lib/admin/broker/notifications-types';

const sql = readFileSync(
  path.resolve(
    process.cwd(),
    'supabase/migrations/20260530220000_notifications.sql',
  ),
  'utf-8',
);

describe('migration · W4-PR-1 notifications foundation', () => {
  // ───────────────────────────────────────────────────────────────
  // 1. Migration shape
  // ───────────────────────────────────────────────────────────────
  describe('transaction wrapping', () => {
    it('runs inside a BEGIN/COMMIT block', () => {
      expect(sql).toMatch(/^BEGIN;/m);
      expect(sql).toMatch(/^COMMIT;/m);
    });

    it('notifies PostgREST to reload schema cache', () => {
      expect(sql).toMatch(/NOTIFY pgrst, 'reload schema'/);
    });

    it('includes a down-migration block for rollback guidance', () => {
      expect(sql).toMatch(/Down migration/i);
      expect(sql).toMatch(/DROP TABLE IF EXISTS notification_subscriptions/);
      expect(sql).toMatch(/DROP TABLE IF EXISTS notification_deliveries/);
      expect(sql).toMatch(/DROP TABLE IF EXISTS notification_preferences/);
      expect(sql).toMatch(/DROP TABLE IF EXISTS notification_events/);
    });
  });

  // ───────────────────────────────────────────────────────────────
  // 2. notification_events
  // ───────────────────────────────────────────────────────────────
  describe('notification_events', () => {
    it('creates the table with tenant_id FK to clients(id) CASCADE', () => {
      expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS notification_events/);
      expect(sql).toMatch(
        /tenant_id UUID NOT NULL REFERENCES clients\(id\) ON DELETE CASCADE/,
      );
    });

    it('declares every NotificationSourceModule value in the CHECK', () => {
      const values: NotificationSourceModule[] = [
        'setup',
        'moves',
        'source',
        'intelligence',
        'tower',
        'system',
      ];
      for (const v of values) {
        expect(sql).toMatch(new RegExp(`'${v}'`));
      }
      expect(sql).toMatch(
        /source_module TEXT NOT NULL\s+CHECK \(source_module IN/,
      );
    });

    it('declares every NotificationSeverity value in the CHECK', () => {
      const values: NotificationSeverity[] = ['info', 'warn', 'critical'];
      for (const v of values) {
        expect(sql).toMatch(new RegExp(`'${v}'`));
      }
      expect(sql).toMatch(/severity TEXT NOT NULL\s+CHECK \(severity IN/);
    });

    it('declares every NotificationCategory value in the CHECK', () => {
      const values: NotificationCategory[] = [
        'operational',
        'governance',
        'security',
        'business',
        'digest',
      ];
      for (const v of values) {
        expect(sql).toMatch(new RegExp(`'${v}'`));
      }
    });

    it('declares every NotificationAuditClass value in the CHECK', () => {
      const values: NotificationAuditClass[] = [
        'transactional',
        'security',
        'compliance',
        'marketing',
      ];
      for (const v of values) {
        expect(sql).toMatch(new RegExp(`'${v}'`));
      }
    });

    it('adds the tenant+type chronological index', () => {
      expect(sql).toMatch(/CREATE INDEX IF NOT EXISTS idx_events_tenant_type/);
      expect(sql).toMatch(
        /idx_events_tenant_type\s+ON notification_events \(tenant_id, event_type, created_at DESC\)/,
      );
    });

    it('adds the dedup-window index', () => {
      expect(sql).toMatch(/CREATE INDEX IF NOT EXISTS idx_events_dedup/);
      expect(sql).toMatch(
        /idx_events_dedup\s+ON notification_events \(tenant_id, event_type, actor_user_id, target_resource_id, created_at DESC\)/,
      );
    });

    it('enables RLS and defines service_role + authenticated SELECT/INSERT policies', () => {
      expect(sql).toMatch(
        /ALTER TABLE notification_events ENABLE ROW LEVEL SECURITY/,
      );
      expect(sql).toMatch(/service_role_all_notification_events/);
      expect(sql).toMatch(/authenticated_select_notification_events/);
      expect(sql).toMatch(/authenticated_insert_notification_events/);
    });

    it('blocks UPDATE and DELETE via the append-only trigger', () => {
      expect(sql).toMatch(/notification_events_immutable/);
      expect(sql).toMatch(/notification_events_no_update/);
      expect(sql).toMatch(/notification_events_no_delete/);
      expect(sql).toMatch(/append-only/);
      expect(sql).toMatch(
        /REVOKE UPDATE, DELETE ON notification_events FROM anon, authenticated/,
      );
    });
  });

  // ───────────────────────────────────────────────────────────────
  // 3. notification_preferences
  // ───────────────────────────────────────────────────────────────
  describe('notification_preferences', () => {
    it('creates the table with the right FK and uniqueness key', () => {
      expect(sql).toMatch(
        /CREATE TABLE IF NOT EXISTS notification_preferences/,
      );
      expect(sql).toMatch(
        /tenant_id UUID NOT NULL REFERENCES clients\(id\) ON DELETE CASCADE/,
      );
      expect(sql).toMatch(/UNIQUE \(tenant_id, user_id, event_type\)/);
    });

    it('declares every NotificationChannel value in the CHECK', () => {
      const values: NotificationChannel[] = [
        'email',
        'in_app',
        'slack',
        'teams',
        'pagerduty',
        'webhook',
        'none',
      ];
      for (const v of values) {
        expect(sql).toMatch(new RegExp(`'${v}'`));
      }
    });

    it('declares every NotificationFrequency value in the CHECK', () => {
      const values: NotificationFrequency[] = [
        'immediate',
        'digest_daily',
        'digest_weekly',
        'none',
      ];
      for (const v of values) {
        expect(sql).toMatch(new RegExp(`'${v}'`));
      }
    });

    it('caps daily_cap to 1..200', () => {
      expect(sql).toMatch(
        /daily_cap INT NOT NULL DEFAULT 20\s+CHECK \(daily_cap > 0 AND daily_cap <= 200\)/,
      );
    });

    it('declares the mandatory flag defaulting to false', () => {
      expect(sql).toMatch(/mandatory BOOLEAN NOT NULL DEFAULT false/);
    });

    it('defaults timezone to UTC', () => {
      expect(sql).toMatch(/timezone TEXT NOT NULL DEFAULT 'UTC'/);
    });

    it('blocks DELETE for app role via policy', () => {
      expect(sql).toMatch(/block_delete_notification_preferences/);
      expect(sql).toMatch(
        /REVOKE DELETE ON notification_preferences FROM anon, authenticated/,
      );
    });

    it('wires the updated_at trigger', () => {
      expect(sql).toMatch(/notification_preferences_set_updated_at/);
      expect(sql).toMatch(/trigger_set_updated_at/);
    });
  });

  // ───────────────────────────────────────────────────────────────
  // 4. notification_deliveries
  // ───────────────────────────────────────────────────────────────
  describe('notification_deliveries', () => {
    it('creates the table with cascading FK to notification_events and clients', () => {
      expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS notification_deliveries/);
      expect(sql).toMatch(
        /event_id UUID NOT NULL REFERENCES notification_events\(id\) ON DELETE CASCADE/,
      );
      expect(sql).toMatch(
        /tenant_id UUID NOT NULL REFERENCES clients\(id\) ON DELETE CASCADE/,
      );
    });

    it('declares every NotificationDeliveryStatus value in the CHECK', () => {
      const values: NotificationDeliveryStatus[] = [
        'queued',
        'sent',
        'delivered',
        'bounced',
        'complained',
        'failed',
        'suppressed',
      ];
      for (const v of values) {
        expect(sql).toMatch(new RegExp(`'${v}'`));
      }
    });

    it('omits "none" from the deliveries channel CHECK (you cannot deliver to none)', () => {
      const deliveriesBlock = sql.match(
        /CREATE TABLE IF NOT EXISTS notification_deliveries[\s\S]*?\);/,
      );
      expect(deliveriesBlock).not.toBeNull();
      expect(deliveriesBlock![0]).toMatch(
        /channel TEXT NOT NULL\s+CHECK \(channel IN \('email', 'in_app', 'slack', 'teams', 'pagerduty', 'webhook'\)\)/,
      );
      expect(deliveriesBlock![0]).not.toMatch(/'none'/);
    });

    it('adds the worker FIFO partial index on queued rows', () => {
      expect(sql).toMatch(/idx_deliveries_queued/);
      expect(sql).toMatch(/WHERE status = 'queued'/);
    });

    it('adds the per-tenant per-user chronological index', () => {
      expect(sql).toMatch(/idx_deliveries_tenant_user/);
      expect(sql).toMatch(
        /idx_deliveries_tenant_user\s+ON notification_deliveries \(tenant_id, user_id, created_at DESC\)/,
      );
    });

    it('blocks app-role UPDATE and DELETE via policy', () => {
      expect(sql).toMatch(/block_update_notification_deliveries/);
      expect(sql).toMatch(/block_delete_notification_deliveries/);
    });

    it('protects immutable columns via trigger even for service-role', () => {
      expect(sql).toMatch(/notification_deliveries_protect_immutable/);
      expect(sql).toMatch(/event_id is immutable/);
      expect(sql).toMatch(/tenant_id is immutable/);
      expect(sql).toMatch(/channel is immutable/);
      expect(sql).toMatch(/provider_message_id cannot be rewritten once set/);
    });

    it('enforces retry_count >= 0', () => {
      expect(sql).toMatch(
        /retry_count INT NOT NULL DEFAULT 0 CHECK \(retry_count >= 0\)/,
      );
    });
  });

  // ───────────────────────────────────────────────────────────────
  // 5. notification_subscriptions
  // ───────────────────────────────────────────────────────────────
  describe('notification_subscriptions', () => {
    it('creates the table with admin attribution and reason', () => {
      expect(sql).toMatch(
        /CREATE TABLE IF NOT EXISTS notification_subscriptions/,
      );
      expect(sql).toMatch(/added_by_admin_id TEXT NOT NULL/);
      expect(sql).toMatch(/reason TEXT/);
    });

    it('enforces uniqueness on (tenant_id, user_id, event_type)', () => {
      const subsBlock = sql.match(
        /CREATE TABLE IF NOT EXISTS notification_subscriptions[\s\S]*?\);/,
      );
      expect(subsBlock).not.toBeNull();
      expect(subsBlock![0]).toMatch(/UNIQUE \(tenant_id, user_id, event_type\)/);
    });

    it('adds the per-user index for fast unsubscribe lookups', () => {
      expect(sql).toMatch(/idx_subs_user/);
      expect(sql).toMatch(
        /idx_subs_user\s+ON notification_subscriptions \(tenant_id, user_id\)/,
      );
    });

    it('blocks UPDATE entirely (rotate via delete-and-recreate)', () => {
      expect(sql).toMatch(/block_update_notification_subscriptions/);
      expect(sql).toMatch(
        /REVOKE UPDATE ON notification_subscriptions FROM anon, authenticated/,
      );
    });

    it('allows tenant-admin DELETE so admins can revoke subscriptions', () => {
      expect(sql).toMatch(/authenticated_delete_notification_subscriptions/);
      expect(sql).toMatch(
        /authenticated_delete_notification_subscriptions[\s\S]{0,400}?FOR DELETE TO authenticated/,
      );
    });
  });

  // ───────────────────────────────────────────────────────────────
  // 6. Cross-table guarantees
  // ───────────────────────────────────────────────────────────────
  describe('cross-table guarantees', () => {
    it('uses timestamptz for every timestamp column', () => {
      // No untyped `TIMESTAMP` without TZ allowed for created_at / updated_at.
      const offenders = sql.match(/\b(created_at|updated_at|sent_at|delivered_at)\s+TIMESTAMP\b(?!TZ)/g);
      expect(offenders).toBeNull();
    });

    it('all four tables are tenant-scoped via clients(id) CASCADE', () => {
      const cascadeRefs = sql.match(
        /tenant_id UUID NOT NULL REFERENCES clients\(id\) ON DELETE CASCADE/g,
      );
      expect(cascadeRefs).not.toBeNull();
      // events + preferences + deliveries + subscriptions = 4
      expect(cascadeRefs!.length).toBe(4);
    });

    it('every CHECK enum is sized via CHECK ... IN (...) — no untyped status columns', () => {
      // Defensive: status columns must always come with a CHECK constraint.
      // We grep for "status TEXT NOT NULL" and require a CHECK on the same line region.
      const statusDecls = sql.match(/status TEXT NOT NULL[\s\S]{0,200}?CHECK \(status IN/g);
      expect(statusDecls).not.toBeNull();
      // notification_deliveries has the only `status` column; ensure it's caught.
      expect(statusDecls!.length).toBeGreaterThanOrEqual(1);
    });

    it('grants service_role full access on all four tables', () => {
      expect(sql).toMatch(/service_role_all_notification_events/);
      expect(sql).toMatch(/service_role_all_notification_preferences/);
      expect(sql).toMatch(/service_role_all_notification_deliveries/);
      expect(sql).toMatch(/service_role_all_notification_subscriptions/);
    });
  });

  // ───────────────────────────────────────────────────────────────
  // 7. Types-vs-schema lock-step
  // ───────────────────────────────────────────────────────────────
  describe('TypeScript types ↔ SQL schema lock-step', () => {
    it('exports exactly 5 default admin mandatory event types', () => {
      // Founder doctrine: 5 urgent events tenant admins auto-subscribe to.
      expect(DEFAULT_ADMIN_MANDATORY_EVENT_TYPES.length).toBe(5);
    });

    it('the default mandatory event list is non-empty strings', () => {
      for (const eventType of DEFAULT_ADMIN_MANDATORY_EVENT_TYPES) {
        expect(typeof eventType).toBe('string');
        expect(eventType.length).toBeGreaterThan(0);
      }
    });
  });
});
