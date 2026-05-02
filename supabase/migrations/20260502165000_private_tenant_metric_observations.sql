-- Private tenant metric observations
--
-- Stores current-state KPI/reference metric observations in each client's
-- private schema. There is intentionally no shared public table for these
-- rows; every client receives its own schema-local upload batch table and
-- observation table.

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
      CREATE TABLE IF NOT EXISTS %I.tenant_metric_upload_batches (
        upload_batch_id TEXT PRIMARY KEY,
        tenant_key TEXT NOT NULL CHECK (tenant_key = %L),
        client_id TEXT NOT NULL,
        document_name TEXT NOT NULL,
        file_name TEXT NOT NULL,
        uploaded_by TEXT,
        uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        storage_url TEXT,
        accepted_count INTEGER NOT NULL DEFAULT 0 CHECK (accepted_count >= 0),
        rejected_count INTEGER NOT NULL DEFAULT 0 CHECK (rejected_count >= 0),
        rejected_rows JSONB NOT NULL DEFAULT '[]'::jsonb,
        source_payload JSONB NOT NULL DEFAULT '{}'::jsonb
      )
    $sql$, plane.schema_name, plane.tenant_key);

    EXECUTE format($sql$
      CREATE TABLE IF NOT EXISTS %I.tenant_metric_observations (
        observation_id TEXT PRIMARY KEY,
        upload_batch_id TEXT NOT NULL REFERENCES %I.tenant_metric_upload_batches(upload_batch_id) ON DELETE CASCADE,
        tenant_key TEXT NOT NULL CHECK (tenant_key = %L),
        client_id TEXT NOT NULL,
        metric_id TEXT NOT NULL CHECK (metric_id ~ '^PAT-MET-[0-9]{3}$'),
        metric_name TEXT NOT NULL,
        industry TEXT NOT NULL CHECK (industry IN ('specialty_retail', 'healthcare_idn', 'financial_services')),
        current_value NUMERIC,
        unit TEXT NOT NULL,
        as_of DATE NOT NULL,
        source TEXT NOT NULL CHECK (source IN ('demo_fixture', 'setup_upload', 'private_data_plane')),
        source_detail TEXT NOT NULL,
        measurement_status TEXT NOT NULL CHECK (measurement_status IN ('measured', 'measurement_gap', 'stale')),
        direction TEXT NOT NULL CHECK (direction IN ('higher_is_better', 'lower_is_better')),
        confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
        owner_role TEXT NOT NULL,
        notes TEXT NOT NULL,
        program_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
        source_event_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
        raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        ingested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CHECK (measurement_status <> 'measured' OR current_value IS NOT NULL)
      )
    $sql$, plane.schema_name, plane.schema_name, plane.tenant_key);

    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS %I ON %I.tenant_metric_observations(metric_id, as_of DESC)',
      'idx_tenant_metric_observations_metric_asof',
      plane.schema_name
    );
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS %I ON %I.tenant_metric_observations(measurement_status)',
      'idx_tenant_metric_observations_status',
      plane.schema_name
    );
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS %I ON %I.tenant_metric_observations USING gin(program_ids)',
      'idx_tenant_metric_observations_program_ids',
      plane.schema_name
    );

    EXECUTE format('ALTER TABLE %I.tenant_metric_upload_batches ENABLE ROW LEVEL SECURITY', plane.schema_name);
    EXECUTE format('ALTER TABLE %I.tenant_metric_observations ENABLE ROW LEVEL SECURITY', plane.schema_name);

    EXECUTE format(
      'DROP POLICY IF EXISTS service_role_all_tenant_metric_upload_batches ON %I.tenant_metric_upload_batches',
      plane.schema_name
    );
    EXECUTE format(
      'DROP POLICY IF EXISTS service_role_all_tenant_metric_observations ON %I.tenant_metric_observations',
      plane.schema_name
    );
    EXECUTE format(
      'CREATE POLICY service_role_all_tenant_metric_upload_batches ON %I.tenant_metric_upload_batches FOR ALL USING (auth.role() = ''service_role'') WITH CHECK (auth.role() = ''service_role'')',
      plane.schema_name
    );
    EXECUTE format(
      'CREATE POLICY service_role_all_tenant_metric_observations ON %I.tenant_metric_observations FOR ALL USING (auth.role() = ''service_role'') WITH CHECK (auth.role() = ''service_role'')',
      plane.schema_name
    );

    EXECUTE format(
      'COMMENT ON TABLE %I.tenant_metric_observations IS %L',
      plane.schema_name,
      'Private client current-state KPI observations mapped to PAT-MET corpus records. No cross-client shared table is used.'
    );
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
