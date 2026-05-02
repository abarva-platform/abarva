-- Private Setup AI Initiatives registry
--
-- Stores enterprise AI initiative records in each client's private schema.
-- There is intentionally no shared public table for these rows; Tower and
-- Setup query through tenant-scoped private-plane helpers.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  plane record;
BEGIN
  FOR plane IN
    SELECT *
    FROM (VALUES
      ('client_apex_retail_private', 'apex-retail'),
      ('client_meridian_health_private', 'meridian-health'),
      ('client_first_capital_private', 'first-capital')
    ) AS planes(schema_name, tenant_key)
  LOOP
    EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', plane.schema_name);

    EXECUTE format($sql$
      CREATE TABLE IF NOT EXISTS %I.setup_ai_initiative_upload_batches (
        upload_batch_id TEXT PRIMARY KEY,
        tenant_key TEXT NOT NULL CHECK (tenant_key = %L),
        client_id TEXT NOT NULL,
        document_name TEXT NOT NULL,
        file_name TEXT NOT NULL,
        uploaded_by TEXT,
        uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        accepted_count INTEGER NOT NULL DEFAULT 0 CHECK (accepted_count >= 0),
        source_payload JSONB NOT NULL DEFAULT '{}'::jsonb
      )
    $sql$, plane.schema_name, plane.tenant_key);

    EXECUTE format($sql$
      CREATE TABLE IF NOT EXISTS %I.setup_ai_initiatives (
        initiative_id TEXT PRIMARY KEY,
        upload_batch_id TEXT NOT NULL REFERENCES %I.setup_ai_initiative_upload_batches(upload_batch_id) ON DELETE CASCADE,
        tenant_key TEXT NOT NULL CHECK (tenant_key = %L),
        client_id TEXT NOT NULL,
        name TEXT NOT NULL,
        archetype TEXT NOT NULL CHECK (archetype IN ('copilot_rollout', 'agent_rollout', 'vendor_ai_feature', 'internal_build', 'abarva_program')),
        sponsor_user_id TEXT,
        owner_user_id TEXT,
        sponsor_role TEXT NOT NULL,
        owner_role TEXT NOT NULL,
        vendor TEXT,
        parent_product TEXT,
        internal_team TEXT,
        status TEXT NOT NULL CHECK (status IN ('planning', 'active', 'at-risk', 'realizing', 'settled', 'paused', 'canceled')),
        linked_program_id TEXT,
        started_at DATE NOT NULL,
        target_outcomes JSONB NOT NULL DEFAULT '[]'::jsonb,
        realized_signals JSONB NOT NULL DEFAULT '[]'::jsonb,
        risk_signals JSONB NOT NULL DEFAULT '[]'::jsonb,
        budget_amount NUMERIC,
        spend_to_date NUMERIC,
        directional_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
        evidence_links JSONB NOT NULL DEFAULT '[]'::jsonb,
        tags JSONB NOT NULL DEFAULT '[]'::jsonb,
        visibility JSONB NOT NULL DEFAULT '{}'::jsonb,
        source TEXT NOT NULL CHECK (source IN ('demo_fixture', 'setup_upload', 'program_sync', 'manual_entry', 'private_data_plane')),
        last_updated_at TIMESTAMPTZ NOT NULL,
        last_updated_by TEXT NOT NULL,
        raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        ingested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CHECK (archetype <> 'abarva_program' OR linked_program_id IS NOT NULL),
        CHECK (archetype = 'internal_build' OR vendor IS NOT NULL OR archetype = 'abarva_program')
      )
    $sql$, plane.schema_name, plane.schema_name, plane.tenant_key);

    EXECUTE format($sql$
      CREATE TABLE IF NOT EXISTS %I.setup_ai_initiative_audit_events (
        audit_event_id TEXT PRIMARY KEY,
        tenant_key TEXT NOT NULL CHECK (tenant_key = %L),
        initiative_id TEXT NOT NULL REFERENCES %I.setup_ai_initiatives(initiative_id) ON DELETE CASCADE,
        event_type TEXT NOT NULL,
        actor TEXT NOT NULL,
        event_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    $sql$, plane.schema_name, plane.tenant_key, plane.schema_name);

    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I.setup_ai_initiatives(status, last_updated_at DESC)', 'idx_setup_ai_initiatives_status_updated', plane.schema_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I.setup_ai_initiatives(archetype, status)', 'idx_setup_ai_initiatives_archetype_status', plane.schema_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I.setup_ai_initiatives(linked_program_id) WHERE linked_program_id IS NOT NULL', 'idx_setup_ai_initiatives_linked_program', plane.schema_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I.setup_ai_initiatives USING gin(tags)', 'idx_setup_ai_initiatives_tags', plane.schema_name);

    EXECUTE format('ALTER TABLE %I.setup_ai_initiative_upload_batches ENABLE ROW LEVEL SECURITY', plane.schema_name);
    EXECUTE format('ALTER TABLE %I.setup_ai_initiatives ENABLE ROW LEVEL SECURITY', plane.schema_name);
    EXECUTE format('ALTER TABLE %I.setup_ai_initiative_audit_events ENABLE ROW LEVEL SECURITY', plane.schema_name);

    EXECUTE format('DROP POLICY IF EXISTS service_role_all_setup_ai_initiative_upload_batches ON %I.setup_ai_initiative_upload_batches', plane.schema_name);
    EXECUTE format('DROP POLICY IF EXISTS service_role_all_setup_ai_initiatives ON %I.setup_ai_initiatives', plane.schema_name);
    EXECUTE format('DROP POLICY IF EXISTS service_role_all_setup_ai_initiative_audit_events ON %I.setup_ai_initiative_audit_events', plane.schema_name);
    EXECUTE format('CREATE POLICY service_role_all_setup_ai_initiative_upload_batches ON %I.setup_ai_initiative_upload_batches FOR ALL USING (auth.role() = ''service_role'') WITH CHECK (auth.role() = ''service_role'')', plane.schema_name);
    EXECUTE format('CREATE POLICY service_role_all_setup_ai_initiatives ON %I.setup_ai_initiatives FOR ALL USING (auth.role() = ''service_role'') WITH CHECK (auth.role() = ''service_role'')', plane.schema_name);
    EXECUTE format('CREATE POLICY service_role_all_setup_ai_initiative_audit_events ON %I.setup_ai_initiative_audit_events FOR ALL USING (auth.role() = ''service_role'') WITH CHECK (auth.role() = ''service_role'')', plane.schema_name);

    EXECUTE format('COMMENT ON TABLE %I.setup_ai_initiatives IS %L', plane.schema_name, 'Private client AI initiative registry for Setup and Tower feed. No cross-client shared table is used.');
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
