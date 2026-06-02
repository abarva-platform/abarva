-- T212 · Responsible AI first-login acknowledgment
--
-- Per-tenant, per-user click-wrap ledger for the Responsible AI use boundary.
-- The app records the exact text version, consent text, timestamp, Clerk user,
-- client, IP address, and user agent. Rows are immutable for authenticated app
-- roles; service_role/postgres retain maintenance authority.

BEGIN;

CREATE TABLE IF NOT EXISTS responsible_ai_acknowledgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  client_key TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_email TEXT,
  text_version TEXT NOT NULL,
  consent_text TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  source TEXT NOT NULL DEFAULT 'first_login_clickwrap'
    CHECK (source IN ('first_login_clickwrap')),
  metadata_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, user_id, text_version)
);

CREATE INDEX IF NOT EXISTS idx_responsible_ai_ack_client_user
  ON responsible_ai_acknowledgments (client_id, user_id, accepted_at DESC);

CREATE INDEX IF NOT EXISTS idx_responsible_ai_ack_version
  ON responsible_ai_acknowledgments (text_version, accepted_at DESC);

ALTER TABLE responsible_ai_acknowledgments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_all_responsible_ai_acknowledgments
  ON responsible_ai_acknowledgments;
CREATE POLICY service_role_all_responsible_ai_acknowledgments
  ON responsible_ai_acknowledgments
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DO $responsible_ai_acknowledgments_rls$
BEGIN
  IF to_regprocedure('can_read_tenant_by_id(uuid)') IS NOT NULL
     AND to_regprocedure('can_write_tenant_by_id(uuid)') IS NOT NULL THEN
    DROP POLICY IF EXISTS authenticated_select_responsible_ai_acknowledgments
      ON responsible_ai_acknowledgments;
    CREATE POLICY authenticated_select_responsible_ai_acknowledgments
      ON responsible_ai_acknowledgments
      FOR SELECT TO authenticated
      USING (can_read_tenant_by_id(client_id));

    DROP POLICY IF EXISTS authenticated_insert_responsible_ai_acknowledgments
      ON responsible_ai_acknowledgments;
    CREATE POLICY authenticated_insert_responsible_ai_acknowledgments
      ON responsible_ai_acknowledgments
      FOR INSERT TO authenticated
      WITH CHECK (can_write_tenant_by_id(client_id));
  ELSE
    RAISE NOTICE 'responsible_ai_acknowledgments: tenant id RLS helpers absent; authenticated policies skipped';
  END IF;
END
$responsible_ai_acknowledgments_rls$;

CREATE OR REPLACE FUNCTION public.responsible_ai_acknowledgments_immutable()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF current_user = 'service_role' OR current_user = 'postgres' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  RAISE EXCEPTION 'responsible_ai_acknowledgments is immutable for app roles (current_user=%)', current_user;
END;
$$;

DROP TRIGGER IF EXISTS responsible_ai_acknowledgments_no_update
  ON responsible_ai_acknowledgments;
CREATE TRIGGER responsible_ai_acknowledgments_no_update
  BEFORE UPDATE ON responsible_ai_acknowledgments
  FOR EACH ROW EXECUTE FUNCTION public.responsible_ai_acknowledgments_immutable();

DROP TRIGGER IF EXISTS responsible_ai_acknowledgments_no_delete
  ON responsible_ai_acknowledgments;
CREATE TRIGGER responsible_ai_acknowledgments_no_delete
  BEFORE DELETE ON responsible_ai_acknowledgments
  FOR EACH ROW EXECUTE FUNCTION public.responsible_ai_acknowledgments_immutable();

GRANT SELECT, INSERT ON responsible_ai_acknowledgments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON responsible_ai_acknowledgments TO service_role;
REVOKE UPDATE, DELETE ON responsible_ai_acknowledgments FROM anon, authenticated;

COMMENT ON TABLE responsible_ai_acknowledgments IS
  'Immutable per-tenant, per-user Responsible AI click-wrap acknowledgment ledger.';

COMMIT;
