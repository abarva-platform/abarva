-- T215 · Tenant admin system role acknowledgment
--
-- Immutable per-tenant, per-admin attestation that the signer owns the
-- tenant-admin/system-owner responsibilities for access, connectors, templates,
-- data-load approvals, and human review of AI-assisted outputs.

BEGIN;

CREATE TABLE IF NOT EXISTS responsible_ai_system_role_acknowledgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  client_key TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_email TEXT,
  text_version TEXT NOT NULL,
  acknowledgment_text TEXT NOT NULL,
  role_scope TEXT NOT NULL DEFAULT 'tenant_admin_system_owner'
    CHECK (role_scope IN ('tenant_admin_system_owner')),
  ip_address TEXT,
  user_agent TEXT,
  source TEXT NOT NULL DEFAULT 'tenant_admin_onboarding'
    CHECK (source IN ('tenant_admin_onboarding')),
  metadata_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, user_id, text_version)
);

CREATE INDEX IF NOT EXISTS idx_system_role_ack_client_user
  ON responsible_ai_system_role_acknowledgments (client_id, user_id, signed_at DESC);

CREATE INDEX IF NOT EXISTS idx_system_role_ack_version
  ON responsible_ai_system_role_acknowledgments (text_version, signed_at DESC);

ALTER TABLE responsible_ai_system_role_acknowledgments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_all_system_role_acknowledgments
  ON responsible_ai_system_role_acknowledgments;
CREATE POLICY service_role_all_system_role_acknowledgments
  ON responsible_ai_system_role_acknowledgments
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DO $system_role_acknowledgments_rls$
BEGIN
  IF to_regprocedure('can_read_tenant_by_id(uuid)') IS NOT NULL
     AND to_regprocedure('can_write_tenant_by_id(uuid)') IS NOT NULL THEN
    DROP POLICY IF EXISTS authenticated_select_system_role_acknowledgments
      ON responsible_ai_system_role_acknowledgments;
    CREATE POLICY authenticated_select_system_role_acknowledgments
      ON responsible_ai_system_role_acknowledgments
      FOR SELECT TO authenticated
      USING (can_read_tenant_by_id(client_id));

    DROP POLICY IF EXISTS authenticated_insert_system_role_acknowledgments
      ON responsible_ai_system_role_acknowledgments;
    CREATE POLICY authenticated_insert_system_role_acknowledgments
      ON responsible_ai_system_role_acknowledgments
      FOR INSERT TO authenticated
      WITH CHECK (can_write_tenant_by_id(client_id));
  ELSE
    RAISE NOTICE 'responsible_ai_system_role_acknowledgments: tenant id RLS helpers absent; authenticated policies skipped';
  END IF;
END
$system_role_acknowledgments_rls$;

CREATE OR REPLACE FUNCTION public.system_role_acknowledgments_immutable()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF current_user = 'service_role' OR current_user = 'postgres' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  RAISE EXCEPTION 'responsible_ai_system_role_acknowledgments is immutable for app roles (current_user=%)', current_user;
END;
$$;

DROP TRIGGER IF EXISTS system_role_acknowledgments_no_update
  ON responsible_ai_system_role_acknowledgments;
CREATE TRIGGER system_role_acknowledgments_no_update
  BEFORE UPDATE ON responsible_ai_system_role_acknowledgments
  FOR EACH ROW EXECUTE FUNCTION public.system_role_acknowledgments_immutable();

DROP TRIGGER IF EXISTS system_role_acknowledgments_no_delete
  ON responsible_ai_system_role_acknowledgments;
CREATE TRIGGER system_role_acknowledgments_no_delete
  BEFORE DELETE ON responsible_ai_system_role_acknowledgments
  FOR EACH ROW EXECUTE FUNCTION public.system_role_acknowledgments_immutable();

GRANT SELECT, INSERT ON responsible_ai_system_role_acknowledgments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON responsible_ai_system_role_acknowledgments TO service_role;
REVOKE UPDATE, DELETE ON responsible_ai_system_role_acknowledgments FROM anon, authenticated;

COMMENT ON TABLE responsible_ai_system_role_acknowledgments IS
  'Immutable per-tenant, per-admin system role acknowledgment ledger.';

COMMIT;
