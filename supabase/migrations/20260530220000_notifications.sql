-- W4-PR-1 · Enterprise Comms Spine · Notifications foundation
--
-- Foundational schema for the Phase 1 notification platform per the
-- Enterprise Comms Spine §5 doctrine (Audit, compliance, retention).
--
-- Ships four tables:
--   1. notification_events          · append-only event log (what happened)
--   2. notification_preferences     · per-user-per-event channel / cadence
--   3. notification_deliveries      · per-channel delivery ledger
--   4. notification_subscriptions   · admin-managed mandatory subscriptions
--
-- Founder-locked invariants enforced at the schema level:
--   • Phase 1 channel set includes 'email' and 'in_app'. Slack / Teams /
--     PagerDuty / webhook are valued in the CHECK constraint for
--     forward-compat (Wave 7 / Phase 3) but no rows ship for them yet.
--   • notification_events is APPEND-ONLY. UPDATE and DELETE are blocked
--     for app roles via triggers; only service-role retention purges
--     may remove rows.
--   • notification_deliveries is PARTIALLY mutable: status / sent_at /
--     delivered_at / bounce_reason / retry_count transition as the
--     provider acks land. Immutable fields (event_id, user_id, tenant_id,
--     channel, provider_message_id once set) are protected by a trigger.
--   • notification_preferences supports a `mandatory` flag — broker
--     enforces at write time that mandatory rows cannot be toggled off
--     by the end user (broker-side gate; schema only records the bit).
--   • notification_subscriptions is the source-of-truth for
--     "tenant admin auto-subscribed to N urgent events at provisioning".
--     Seed-row writes land in W4-PR-2 (broker); schema only defines
--     the unique key (tenant_id, user_id, event_type) so the broker
--     can upsert idempotently.
--
-- RLS posture: tenant_id-scoped via can_read_tenant_by_id / can_write_tenant_by_id
-- helpers from 20260507100000_rls_role_helpers.sql. service_role bypasses RLS
-- for ingest / retention.
--
-- Source: docs/build/ENTERPRISE_COMMS_SPINE_2026-05-30.md §5

BEGIN;

-- =============================================================================
-- 1. notification_events — append-only event log
-- =============================================================================
CREATE TABLE IF NOT EXISTS notification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  source_module TEXT NOT NULL
    CHECK (source_module IN ('setup', 'moves', 'source', 'intelligence', 'tower', 'system')),
  severity TEXT NOT NULL
    CHECK (severity IN ('info', 'warn', 'critical')),
  category TEXT NOT NULL
    CHECK (category IN ('operational', 'governance', 'security', 'business', 'digest')),
  audit_class TEXT NOT NULL
    CHECK (audit_class IN ('transactional', 'security', 'compliance', 'marketing')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  actor_user_id TEXT,
  target_resource_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_tenant_type
  ON notification_events (tenant_id, event_type, created_at DESC);

-- Dedup-window probe: same actor doing the same thing to the same target
-- within a short window collapses to one delivery (broker enforces N seconds).
CREATE INDEX IF NOT EXISTS idx_events_dedup
  ON notification_events (tenant_id, event_type, actor_user_id, target_resource_id, created_at DESC);

ALTER TABLE notification_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_all_notification_events ON notification_events;
CREATE POLICY service_role_all_notification_events
  ON notification_events
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DO $notification_events_rls$
BEGIN
  IF to_regprocedure('can_read_tenant_by_id(uuid)') IS NOT NULL
     AND to_regprocedure('can_write_tenant_by_id(uuid)') IS NOT NULL THEN
    DROP POLICY IF EXISTS authenticated_select_notification_events ON notification_events;
    CREATE POLICY authenticated_select_notification_events
      ON notification_events
      FOR SELECT TO authenticated
      USING (can_read_tenant_by_id(tenant_id));

    DROP POLICY IF EXISTS authenticated_insert_notification_events ON notification_events;
    CREATE POLICY authenticated_insert_notification_events
      ON notification_events
      FOR INSERT TO authenticated
      WITH CHECK (can_write_tenant_by_id(tenant_id));
  ELSE
    RAISE NOTICE 'notifications: tenant id RLS helpers absent; authenticated policies on notification_events skipped';
  END IF;
END
$notification_events_rls$;

-- Append-only enforcement: block UPDATE / DELETE for everyone except
-- service_role (which the trigger can detect by current_user).
CREATE OR REPLACE FUNCTION public.notification_events_immutable()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF current_user = 'service_role' OR current_user = 'postgres' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  RAISE EXCEPTION 'notification_events is append-only: UPDATE and DELETE are not permitted (current_user=%)', current_user;
END;
$$;

DROP TRIGGER IF EXISTS notification_events_no_update ON notification_events;
CREATE TRIGGER notification_events_no_update
  BEFORE UPDATE ON notification_events
  FOR EACH ROW EXECUTE FUNCTION public.notification_events_immutable();

DROP TRIGGER IF EXISTS notification_events_no_delete ON notification_events;
CREATE TRIGGER notification_events_no_delete
  BEFORE DELETE ON notification_events
  FOR EACH ROW EXECUTE FUNCTION public.notification_events_immutable();

GRANT SELECT, INSERT ON notification_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON notification_events TO service_role;
REVOKE UPDATE, DELETE ON notification_events FROM anon, authenticated;

COMMENT ON TABLE notification_events IS
  'Append-only event log for the Enterprise Comms Spine. Every notify-worthy thing that happens in any module lands here first, then fans out to deliveries.';

-- =============================================================================
-- 2. notification_preferences — per-user-per-event preferences
-- =============================================================================
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  channel TEXT NOT NULL
    CHECK (channel IN ('email', 'in_app', 'slack', 'teams', 'pagerduty', 'webhook', 'none')),
  frequency TEXT NOT NULL
    CHECK (frequency IN ('immediate', 'digest_daily', 'digest_weekly', 'none')),
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  mandatory BOOLEAN NOT NULL DEFAULT false,
  daily_cap INT NOT NULL DEFAULT 20
    CHECK (daily_cap > 0 AND daily_cap <= 200),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id, event_type)
);

CREATE INDEX IF NOT EXISTS idx_prefs_user_event
  ON notification_preferences (tenant_id, user_id, event_type);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_all_notification_preferences ON notification_preferences;
CREATE POLICY service_role_all_notification_preferences
  ON notification_preferences
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DO $notification_preferences_rls$
BEGIN
  IF to_regprocedure('can_read_tenant_by_id(uuid)') IS NOT NULL
     AND to_regprocedure('can_write_tenant_by_id(uuid)') IS NOT NULL THEN
    DROP POLICY IF EXISTS authenticated_select_notification_preferences ON notification_preferences;
    CREATE POLICY authenticated_select_notification_preferences
      ON notification_preferences
      FOR SELECT TO authenticated
      USING (can_read_tenant_by_id(tenant_id));

    DROP POLICY IF EXISTS authenticated_insert_notification_preferences ON notification_preferences;
    CREATE POLICY authenticated_insert_notification_preferences
      ON notification_preferences
      FOR INSERT TO authenticated
      WITH CHECK (can_write_tenant_by_id(tenant_id));

    -- UPDATE is permitted within-tenant; the broker enforces the
    -- mandatory-flag gate at application layer (cannot toggle a
    -- mandatory subscription off).
    DROP POLICY IF EXISTS authenticated_update_notification_preferences ON notification_preferences;
    CREATE POLICY authenticated_update_notification_preferences
      ON notification_preferences
      FOR UPDATE TO authenticated
      USING (can_write_tenant_by_id(tenant_id))
      WITH CHECK (can_write_tenant_by_id(tenant_id));
  ELSE
    RAISE NOTICE 'notifications: tenant id RLS helpers absent; authenticated policies on notification_preferences skipped';
  END IF;
END
$notification_preferences_rls$;

-- Block DELETE for app roles — preferences are downgraded to channel='none'
-- rather than removed so the audit trail of cadence history stays intact.
DROP POLICY IF EXISTS block_delete_notification_preferences ON notification_preferences;
CREATE POLICY block_delete_notification_preferences
  ON notification_preferences
  FOR DELETE TO authenticated
  USING (false);

-- updated_at trigger
DROP TRIGGER IF EXISTS notification_preferences_set_updated_at ON notification_preferences;
CREATE TRIGGER notification_preferences_set_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

GRANT SELECT, INSERT, UPDATE ON notification_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON notification_preferences TO service_role;
REVOKE DELETE ON notification_preferences FROM anon, authenticated;

COMMENT ON TABLE notification_preferences IS
  'Per-user-per-event notification preferences. UNIQUE (tenant_id, user_id, event_type). Mandatory flag is broker-enforced at write time.';

-- =============================================================================
-- 3. notification_deliveries — per-channel delivery ledger
-- =============================================================================
CREATE TABLE IF NOT EXISTS notification_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES notification_events(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  tenant_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  channel TEXT NOT NULL
    CHECK (channel IN ('email', 'in_app', 'slack', 'teams', 'pagerduty', 'webhook')),
  status TEXT NOT NULL
    CHECK (status IN ('queued', 'sent', 'delivered', 'bounced', 'complained', 'failed', 'suppressed')),
  provider_message_id TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  bounce_reason TEXT,
  retry_count INT NOT NULL DEFAULT 0 CHECK (retry_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deliveries_tenant_user
  ON notification_deliveries (tenant_id, user_id, created_at DESC);

-- Worker fetch path: only queued rows, ordered FIFO.
CREATE INDEX IF NOT EXISTS idx_deliveries_queued
  ON notification_deliveries (status, created_at)
  WHERE status = 'queued';

ALTER TABLE notification_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_all_notification_deliveries ON notification_deliveries;
CREATE POLICY service_role_all_notification_deliveries
  ON notification_deliveries
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DO $notification_deliveries_rls$
BEGIN
  IF to_regprocedure('can_read_tenant_by_id(uuid)') IS NOT NULL
     AND to_regprocedure('can_write_tenant_by_id(uuid)') IS NOT NULL THEN
    -- Authenticated tenant users can read their own tenant's delivery rows
    -- (for the in-app inbox + admin delivery audit).
    DROP POLICY IF EXISTS authenticated_select_notification_deliveries ON notification_deliveries;
    CREATE POLICY authenticated_select_notification_deliveries
      ON notification_deliveries
      FOR SELECT TO authenticated
      USING (can_read_tenant_by_id(tenant_id));

    -- INSERT is service-role only in practice (the broker writes via
    -- service-role). We grant authenticated INSERT under tenant match
    -- as a safety net for future in-app composer flows, but the table
    -- is primarily a system-of-record.
    DROP POLICY IF EXISTS authenticated_insert_notification_deliveries ON notification_deliveries;
    CREATE POLICY authenticated_insert_notification_deliveries
      ON notification_deliveries
      FOR INSERT TO authenticated
      WITH CHECK (can_write_tenant_by_id(tenant_id));
  ELSE
    RAISE NOTICE 'notifications: tenant id RLS helpers absent; authenticated policies on notification_deliveries skipped';
  END IF;
END
$notification_deliveries_rls$;

-- App-role UPDATE is blocked entirely. Only service-role transitions
-- delivery status (the broker / worker writes via service-role).
DROP POLICY IF EXISTS block_update_notification_deliveries ON notification_deliveries;
CREATE POLICY block_update_notification_deliveries
  ON notification_deliveries
  FOR UPDATE TO authenticated
  USING (false);

-- App-role DELETE blocked; retention purges run as service-role.
DROP POLICY IF EXISTS block_delete_notification_deliveries ON notification_deliveries;
CREATE POLICY block_delete_notification_deliveries
  ON notification_deliveries
  FOR DELETE TO authenticated
  USING (false);

-- Trigger-level enforcement: even service-role mutations must not
-- rewrite the immutable fields (event_id, tenant_id, user_id, channel,
-- created_at, or a previously-set provider_message_id). These are the
-- forensic anchors a delivery row attests to.
CREATE OR REPLACE FUNCTION public.notification_deliveries_protect_immutable()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.event_id IS DISTINCT FROM OLD.event_id THEN
    RAISE EXCEPTION 'notification_deliveries.event_id is immutable';
  END IF;
  IF NEW.tenant_id IS DISTINCT FROM OLD.tenant_id THEN
    RAISE EXCEPTION 'notification_deliveries.tenant_id is immutable';
  END IF;
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'notification_deliveries.user_id is immutable';
  END IF;
  IF NEW.channel IS DISTINCT FROM OLD.channel THEN
    RAISE EXCEPTION 'notification_deliveries.channel is immutable';
  END IF;
  IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'notification_deliveries.created_at is immutable';
  END IF;
  IF OLD.provider_message_id IS NOT NULL
     AND NEW.provider_message_id IS DISTINCT FROM OLD.provider_message_id THEN
    RAISE EXCEPTION 'notification_deliveries.provider_message_id cannot be rewritten once set';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notification_deliveries_immutable ON notification_deliveries;
CREATE TRIGGER notification_deliveries_immutable
  BEFORE UPDATE ON notification_deliveries
  FOR EACH ROW EXECUTE FUNCTION public.notification_deliveries_protect_immutable();

GRANT SELECT ON notification_deliveries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON notification_deliveries TO service_role;
REVOKE INSERT, UPDATE, DELETE ON notification_deliveries FROM anon;

COMMENT ON TABLE notification_deliveries IS
  'Per-channel delivery ledger. Partially mutable: status / sent_at / delivered_at / bounce_reason / retry_count transition as provider acks land. Immutable fields enforced by trigger.';

-- =============================================================================
-- 4. notification_subscriptions — admin-managed mandatory subscriptions
-- =============================================================================
CREATE TABLE IF NOT EXISTS notification_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  added_by_admin_id TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id, event_type)
);

CREATE INDEX IF NOT EXISTS idx_subs_user
  ON notification_subscriptions (tenant_id, user_id);

ALTER TABLE notification_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_all_notification_subscriptions ON notification_subscriptions;
CREATE POLICY service_role_all_notification_subscriptions
  ON notification_subscriptions
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DO $notification_subscriptions_rls$
BEGIN
  IF to_regprocedure('can_read_tenant_by_id(uuid)') IS NOT NULL
     AND to_regprocedure('can_write_tenant_by_id(uuid)') IS NOT NULL THEN
    DROP POLICY IF EXISTS authenticated_select_notification_subscriptions ON notification_subscriptions;
    CREATE POLICY authenticated_select_notification_subscriptions
      ON notification_subscriptions
      FOR SELECT TO authenticated
      USING (can_read_tenant_by_id(tenant_id));

    -- Only tenant admins (tenant_admin / client_admin / maestro) can
    -- create or remove mandatory subscriptions. can_write_tenant_by_id
    -- already requires is_tenant_admin().
    DROP POLICY IF EXISTS authenticated_insert_notification_subscriptions ON notification_subscriptions;
    CREATE POLICY authenticated_insert_notification_subscriptions
      ON notification_subscriptions
      FOR INSERT TO authenticated
      WITH CHECK (can_write_tenant_by_id(tenant_id));

    DROP POLICY IF EXISTS authenticated_delete_notification_subscriptions ON notification_subscriptions;
    CREATE POLICY authenticated_delete_notification_subscriptions
      ON notification_subscriptions
      FOR DELETE TO authenticated
      USING (can_write_tenant_by_id(tenant_id));
  ELSE
    RAISE NOTICE 'notifications: tenant id RLS helpers absent; authenticated policies on notification_subscriptions skipped';
  END IF;
END
$notification_subscriptions_rls$;

-- Block UPDATE entirely — mandatory subscriptions are immutable records
-- of "admin X added user Y to event Z at time T with reason R".
-- To rotate, delete-and-recreate so the audit chain stays clean.
DROP POLICY IF EXISTS block_update_notification_subscriptions ON notification_subscriptions;
CREATE POLICY block_update_notification_subscriptions
  ON notification_subscriptions
  FOR UPDATE TO authenticated
  USING (false);

GRANT SELECT, INSERT, DELETE ON notification_subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON notification_subscriptions TO service_role;
REVOKE UPDATE ON notification_subscriptions FROM anon, authenticated;

COMMENT ON TABLE notification_subscriptions IS
  'Admin-managed mandatory subscriptions. Tenant admins are auto-subscribed to 5 urgent events at provisioning (seeded by broker, not this migration).';

NOTIFY pgrst, 'reload schema';

COMMIT;

-- =============================================================================
-- Down migration (commented; apply manually to roll back).
--
-- Drop in reverse FK order so cascades don't fire on populated tables.
--
-- BEGIN;
--   DROP TRIGGER IF EXISTS notification_deliveries_immutable ON notification_deliveries;
--   DROP TRIGGER IF EXISTS notification_events_no_update ON notification_events;
--   DROP TRIGGER IF EXISTS notification_events_no_delete ON notification_events;
--   DROP TRIGGER IF EXISTS notification_preferences_set_updated_at ON notification_preferences;
--   DROP FUNCTION IF EXISTS public.notification_deliveries_protect_immutable();
--   DROP FUNCTION IF EXISTS public.notification_events_immutable();
--   DROP TABLE IF EXISTS notification_subscriptions;
--   DROP TABLE IF EXISTS notification_deliveries;
--   DROP TABLE IF EXISTS notification_preferences;
--   DROP TABLE IF EXISTS notification_events;
-- COMMIT;
-- =============================================================================
