-- T214 · Responsible AI training completion ledger
--
-- Per-tenant, per-user completion record for the required Responsible AI Use
-- training module. The table is immutable for authenticated app roles so the
-- completion evidence can be audited later.

BEGIN;

CREATE TABLE IF NOT EXISTS responsible_ai_training_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  client_key TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_email TEXT,
  training_version TEXT NOT NULL,
  completion_statement TEXT NOT NULL,
  estimated_minutes INTEGER NOT NULL DEFAULT 10
    CHECK (estimated_minutes > 0),
  module_count INTEGER NOT NULL DEFAULT 4
    CHECK (module_count > 0),
  ip_address TEXT,
  user_agent TEXT,
  source TEXT NOT NULL DEFAULT 'responsible_ai_training_module'
    CHECK (source IN ('responsible_ai_training_module')),
  metadata_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, user_id, training_version)
);

CREATE INDEX IF NOT EXISTS idx_responsible_ai_training_client_user
  ON responsible_ai_training_completions (client_id, user_id, completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_responsible_ai_training_version
  ON responsible_ai_training_completions (training_version, completed_at DESC);

ALTER TABLE responsible_ai_training_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_all_responsible_ai_training_completions
  ON responsible_ai_training_completions;
CREATE POLICY service_role_all_responsible_ai_training_completions
  ON responsible_ai_training_completions
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DO $responsible_ai_training_completions_rls$
BEGIN
  IF to_regprocedure('can_read_tenant_by_id(uuid)') IS NOT NULL
     AND to_regprocedure('can_write_tenant_by_id(uuid)') IS NOT NULL THEN
    DROP POLICY IF EXISTS authenticated_select_responsible_ai_training_completions
      ON responsible_ai_training_completions;
    CREATE POLICY authenticated_select_responsible_ai_training_completions
      ON responsible_ai_training_completions
      FOR SELECT TO authenticated
      USING (can_read_tenant_by_id(client_id));

    DROP POLICY IF EXISTS authenticated_insert_responsible_ai_training_completions
      ON responsible_ai_training_completions;
    CREATE POLICY authenticated_insert_responsible_ai_training_completions
      ON responsible_ai_training_completions
      FOR INSERT TO authenticated
      WITH CHECK (can_write_tenant_by_id(client_id));
  ELSE
    RAISE NOTICE 'responsible_ai_training_completions: tenant id RLS helpers absent; authenticated policies skipped';
  END IF;
END
$responsible_ai_training_completions_rls$;

CREATE OR REPLACE FUNCTION public.responsible_ai_training_completions_immutable()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF current_user = 'service_role' OR current_user = 'postgres' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  RAISE EXCEPTION 'responsible_ai_training_completions is immutable for app roles (current_user=%)', current_user;
END;
$$;

DROP TRIGGER IF EXISTS responsible_ai_training_completions_no_update
  ON responsible_ai_training_completions;
CREATE TRIGGER responsible_ai_training_completions_no_update
  BEFORE UPDATE ON responsible_ai_training_completions
  FOR EACH ROW EXECUTE FUNCTION public.responsible_ai_training_completions_immutable();

DROP TRIGGER IF EXISTS responsible_ai_training_completions_no_delete
  ON responsible_ai_training_completions;
CREATE TRIGGER responsible_ai_training_completions_no_delete
  BEFORE DELETE ON responsible_ai_training_completions
  FOR EACH ROW EXECUTE FUNCTION public.responsible_ai_training_completions_immutable();

GRANT SELECT, INSERT ON responsible_ai_training_completions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON responsible_ai_training_completions TO service_role;
REVOKE UPDATE, DELETE ON responsible_ai_training_completions FROM anon, authenticated;

COMMENT ON TABLE responsible_ai_training_completions IS
  'Immutable per-tenant, per-user Responsible AI Use training completion ledger.';

COMMIT;
