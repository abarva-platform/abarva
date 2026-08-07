-- Meridian Health demo isolated Layer 1 source-volume substrate.
--
-- Scope:
--   Declares the additive, isolated schema contract required before the Meridian Health
--   source-volume loader may run in an approved ACA data-build job.
--
-- Non-goals:
--   This migration does not load data, execute adapters, publish canonical
--   records, activate a tenant, refresh Cube, update product read models, or
--   mutate any existing Foundation V2 healthcare golden-slice schema.

BEGIN;

CREATE SCHEMA IF NOT EXISTS foundation_v2_meridian_health_demo;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'foundation_v2_meridian_health_demo_writer') THEN
    CREATE ROLE foundation_v2_meridian_health_demo_writer
      NOLOGIN
      NOSUPERUSER
      NOCREATEDB
      NOCREATEROLE
      NOREPLICATION
      NOBYPASSRLS
      NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'foundation_v2_meridian_health_demo_reader') THEN
    CREATE ROLE foundation_v2_meridian_health_demo_reader
      NOLOGIN
      NOSUPERUSER
      NOCREATEDB
      NOCREATEROLE
      NOREPLICATION
      NOBYPASSRLS
      NOINHERIT;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS foundation_v2_meridian_health_demo.source_releases (
  source_release_id text PRIMARY KEY,
  tenant_key text NOT NULL,
  test_namespace text NOT NULL,
  release_version text NOT NULL,
  release_hash text NOT NULL CHECK (release_hash ~ '^[a-f0-9]{64}$'),
  source_release_state text NOT NULL DEFAULT 'isolated_golden_slice'
    CHECK (source_release_state IN ('isolated_golden_slice', 'candidate', 'superseded', 'rejected')),
  isolation_scope text NOT NULL DEFAULT 'ISOLATED_FOUNDATION_V2_GOLDEN_SLICE_ONLY'
    CHECK (isolation_scope = 'ISOLATED_FOUNDATION_V2_GOLDEN_SLICE_ONLY'),
  v1_component_classification text NOT NULL
    CHECK (v1_component_classification IN (
      'REUSE_AS_IS',
      'REPAIR_IN_PLACE',
      'EXTEND_COMPATIBLY',
      'SUPERSEDE_WITH_V2',
      'RETIRE_AFTER_CUTOVER',
      'PRESERVE_AS_IMMUTABLE_HISTORY'
    )),
  writer_job_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_release_id, tenant_key, test_namespace),
  UNIQUE (tenant_key, test_namespace, release_version),
  CHECK (tenant_key = 'meridian_health_global'),
  CHECK (test_namespace = 'meridian-health-source-volume-v1'),
  CHECK (source_release_id = 'meridian-health-source-v1-202608:source-volume-v1:05889e763f88')
);

CREATE TABLE IF NOT EXISTS foundation_v2_meridian_health_demo.source_files (
  source_file_id text PRIMARY KEY,
  source_release_id text NOT NULL,
  tenant_key text NOT NULL,
  test_namespace text NOT NULL,
  source_uri text NOT NULL,
  file_name text NOT NULL,
  content_sha256 text NOT NULL CHECK (content_sha256 ~ '^[a-f0-9]{64}$'),
  row_count integer NOT NULL CHECK (row_count >= 0),
  field_count integer NOT NULL CHECK (field_count >= 0),
  duplicate_state text NOT NULL DEFAULT 'unique'
    CHECK (duplicate_state IN ('unique', 'duplicate_quarantined', 'duplicate_suppressed')),
  writer_job_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (source_release_id, tenant_key, test_namespace)
    REFERENCES foundation_v2_meridian_health_demo.source_releases(source_release_id, tenant_key, test_namespace)
    ON DELETE RESTRICT,
  UNIQUE (source_file_id, tenant_key, test_namespace),
  UNIQUE (source_release_id, file_name),
  UNIQUE (source_release_id, content_sha256),
  CHECK (tenant_key = 'meridian_health_global'),
  CHECK (test_namespace = 'meridian-health-source-volume-v1'),
  CHECK (source_release_id = 'meridian-health-source-v1-202608:source-volume-v1:05889e763f88')
);

CREATE TABLE IF NOT EXISTS foundation_v2_meridian_health_demo.source_file_context (
  source_file_id text PRIMARY KEY,
  source_release_id text NOT NULL,
  tenant_key text NOT NULL,
  test_namespace text NOT NULL,
  source_group text NOT NULL
    CHECK (source_group IN ('enterprise_context', 'optional_domain_context', 'bpo_sourcing_event', 'bpo_transformation_event')),
  context_treatment text NOT NULL,
  demo_priority text NOT NULL,
  event_id text NOT NULL DEFAULT '',
  effective_as_of date NOT NULL,
  content_sha256 text NOT NULL CHECK (content_sha256 ~ '^[a-f0-9]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (source_file_id, tenant_key, test_namespace)
    REFERENCES foundation_v2_meridian_health_demo.source_files(source_file_id, tenant_key, test_namespace)
    ON DELETE RESTRICT,
  FOREIGN KEY (source_release_id, tenant_key, test_namespace)
    REFERENCES foundation_v2_meridian_health_demo.source_releases(source_release_id, tenant_key, test_namespace)
    ON DELETE RESTRICT,
  UNIQUE (source_release_id, source_file_id),
  CHECK (tenant_key = 'meridian_health_global'),
  CHECK (test_namespace = 'meridian-health-source-volume-v1'),
  CHECK (source_release_id = 'meridian-health-source-v1-202608:source-volume-v1:05889e763f88')
);

CREATE TABLE IF NOT EXISTS foundation_v2_meridian_health_demo.source_records (
  source_record_id text PRIMARY KEY,
  source_file_id text NOT NULL,
  source_release_id text NOT NULL,
  tenant_key text NOT NULL,
  test_namespace text NOT NULL,
  source_row_number integer NOT NULL CHECK (source_row_number >= 1),
  source_row_hash text NOT NULL CHECK (source_row_hash ~ '^[a-f0-9]{64}$'),
  row_disposition text NOT NULL
    CHECK (row_disposition IN ('MATCHED', 'NO_EVIDENCE', 'STRUCTURAL', 'DUPLICATE', 'REJECTED', 'MALFORMED', 'RESTRICTED')),
  row_disposition_reason text NOT NULL,
  writer_job_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (source_file_id, tenant_key, test_namespace)
    REFERENCES foundation_v2_meridian_health_demo.source_files(source_file_id, tenant_key, test_namespace)
    ON DELETE RESTRICT,
  FOREIGN KEY (source_release_id, tenant_key, test_namespace)
    REFERENCES foundation_v2_meridian_health_demo.source_releases(source_release_id, tenant_key, test_namespace)
    ON DELETE RESTRICT,
  UNIQUE (source_record_id, tenant_key, test_namespace),
  UNIQUE (source_file_id, source_row_number),
  UNIQUE (source_release_id, source_row_hash),
  CHECK (tenant_key = 'meridian_health_global'),
  CHECK (test_namespace = 'meridian-health-source-volume-v1'),
  CHECK (source_release_id = 'meridian-health-source-v1-202608:source-volume-v1:05889e763f88')
);

CREATE TABLE IF NOT EXISTS foundation_v2_meridian_health_demo.source_field_values (
  source_field_value_id text PRIMARY KEY,
  source_record_id text NOT NULL,
  source_file_id text NOT NULL,
  source_release_id text NOT NULL,
  tenant_key text NOT NULL,
  test_namespace text NOT NULL,
  source_field_id text NOT NULL,
  source_field_name text NOT NULL,
  raw_value text,
  normalized_value text,
  field_disposition text NOT NULL
    CHECK (field_disposition IN (
      'USED_AS_BUSINESS_KEY',
      'NORMALIZED_TO_CANONICAL_FIELD',
      'USED_IN_DERIVATION',
      'USED_AS_RELATIONSHIP_KEY',
      'PRESERVED_AS_EVIDENCE',
      'TECHNICAL_OR_NON_SEMANTIC',
      'INTENTIONALLY_IGNORED_WITH_APPROVED_REASON',
      'REJECTED',
      'RESTRICTED'
    )),
  target_object_type text,
  target_field_name text,
  adapter_rule_id text NOT NULL,
  evidence_ref text,
  restricted boolean NOT NULL DEFAULT false,
  writer_job_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    field_disposition IN ('TECHNICAL_OR_NON_SEMANTIC', 'INTENTIONALLY_IGNORED_WITH_APPROVED_REASON', 'REJECTED')
    OR (target_object_type IS NOT NULL AND target_field_name IS NOT NULL)
  ),
  FOREIGN KEY (source_record_id, tenant_key, test_namespace)
    REFERENCES foundation_v2_meridian_health_demo.source_records(source_record_id, tenant_key, test_namespace)
    ON DELETE RESTRICT,
  FOREIGN KEY (source_file_id, tenant_key, test_namespace)
    REFERENCES foundation_v2_meridian_health_demo.source_files(source_file_id, tenant_key, test_namespace)
    ON DELETE RESTRICT,
  FOREIGN KEY (source_release_id, tenant_key, test_namespace)
    REFERENCES foundation_v2_meridian_health_demo.source_releases(source_release_id, tenant_key, test_namespace)
    ON DELETE RESTRICT,
  UNIQUE (source_field_value_id, tenant_key, test_namespace),
  UNIQUE (source_record_id, source_field_id),
  CHECK (tenant_key = 'meridian_health_global'),
  CHECK (test_namespace = 'meridian-health-source-volume-v1'),
  CHECK (source_release_id = 'meridian-health-source-v1-202608:source-volume-v1:05889e763f88')
);

CREATE TABLE IF NOT EXISTS foundation_v2_meridian_health_demo.parser_executions (
  parser_execution_id text PRIMARY KEY,
  source_release_id text NOT NULL,
  tenant_key text NOT NULL,
  test_namespace text NOT NULL,
  parser_contract_version text NOT NULL,
  input_file_count integer NOT NULL CHECK (input_file_count >= 0),
  output_record_count integer NOT NULL CHECK (output_record_count >= 0),
  output_field_count integer NOT NULL CHECK (output_field_count >= 0),
  rejected_record_count integer NOT NULL DEFAULT 0 CHECK (rejected_record_count >= 0),
  parser_status text NOT NULL CHECK (parser_status IN ('passed', 'failed', 'blocked')),
  writer_job_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (source_release_id, tenant_key, test_namespace)
    REFERENCES foundation_v2_meridian_health_demo.source_releases(source_release_id, tenant_key, test_namespace)
    ON DELETE RESTRICT,
  UNIQUE (parser_execution_id, tenant_key, test_namespace),
  CHECK (tenant_key = 'meridian_health_global'),
  CHECK (test_namespace = 'meridian-health-source-volume-v1'),
  CHECK (source_release_id = 'meridian-health-source-v1-202608:source-volume-v1:05889e763f88')
);

CREATE TABLE IF NOT EXISTS foundation_v2_meridian_health_demo.gate_results (
  gate_result_id text PRIMARY KEY,
  tenant_key text NOT NULL,
  test_namespace text NOT NULL,
  gate_id text NOT NULL,
  transition text NOT NULL,
  input_count integer NOT NULL CHECK (input_count >= 0),
  output_count integer NOT NULL CHECK (output_count >= 0),
  unexplained_variance integer NOT NULL CHECK (unexplained_variance >= 0),
  gate_status text NOT NULL CHECK (gate_status IN ('passed', 'failed', 'blocked')),
  failure_classification text,
  repair_owner text NOT NULL,
  rerun_scope text NOT NULL,
  proof_uri text NOT NULL,
  writer_job_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (gate_result_id, tenant_key, test_namespace),
  UNIQUE (tenant_key, test_namespace, gate_id, writer_job_id),
  CHECK (tenant_key = 'meridian_health_global'),
  CHECK (test_namespace = 'meridian-health-source-volume-v1')
);

DO $$
DECLARE
  rel regclass;
  rel_name text;
BEGIN
  FOREACH rel IN ARRAY ARRAY[
    'foundation_v2_meridian_health_demo.source_releases'::regclass,
    'foundation_v2_meridian_health_demo.source_files'::regclass,
    'foundation_v2_meridian_health_demo.source_file_context'::regclass,
    'foundation_v2_meridian_health_demo.source_records'::regclass,
    'foundation_v2_meridian_health_demo.source_field_values'::regclass,
    'foundation_v2_meridian_health_demo.parser_executions'::regclass
  ]
  LOOP
    rel_name := split_part(rel::text, '.', 2);
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT IF EXISTS %I', rel, rel_name || '_source_release_id_check');
    EXECUTE format(
      'ALTER TABLE %s ADD CONSTRAINT %I CHECK (source_release_id = %L)',
      rel,
      rel_name || '_source_release_id_check',
      'meridian-health-source-v1-202608:source-volume-v1:05889e763f88'
    );
  END LOOP;
END $$;

GRANT USAGE ON SCHEMA foundation_v2_meridian_health_demo TO foundation_v2_meridian_health_demo_writer;
GRANT USAGE ON SCHEMA foundation_v2_meridian_health_demo TO foundation_v2_meridian_health_demo_reader;
GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA foundation_v2_meridian_health_demo TO foundation_v2_meridian_health_demo_writer;
GRANT SELECT ON ALL TABLES IN SCHEMA foundation_v2_meridian_health_demo TO foundation_v2_meridian_health_demo_reader;

DO $$
DECLARE
  rel regclass;
  rel_name text;
  release_check text;
BEGIN
  FOREACH rel IN ARRAY ARRAY[
    'foundation_v2_meridian_health_demo.source_releases'::regclass,
    'foundation_v2_meridian_health_demo.source_files'::regclass,
    'foundation_v2_meridian_health_demo.source_file_context'::regclass,
    'foundation_v2_meridian_health_demo.source_records'::regclass,
    'foundation_v2_meridian_health_demo.source_field_values'::regclass,
    'foundation_v2_meridian_health_demo.parser_executions'::regclass,
    'foundation_v2_meridian_health_demo.gate_results'::regclass
  ]
  LOOP
    rel_name := split_part(rel::text, '.', 2);
    release_check := '';
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'foundation_v2_meridian_health_demo'
        AND table_name = rel_name
        AND column_name = 'source_release_id'
    ) THEN
      release_check := ' AND source_release_id = ''meridian-health-source-v1-202608:source-volume-v1:05889e763f88''
                         AND source_release_id = current_setting(''app.foundation_v2_source_release_id'', true)';
    END IF;

    EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', rel);
    EXECUTE format('ALTER TABLE %s FORCE ROW LEVEL SECURITY', rel);
    EXECUTE format('DROP POLICY IF EXISTS meridian_health_demo_select ON %s', rel);
    EXECUTE format(
      'CREATE POLICY meridian_health_demo_select ON %s
         FOR SELECT
         TO foundation_v2_meridian_health_demo_writer, foundation_v2_meridian_health_demo_reader
         USING (
           tenant_key = ''meridian_health_global''
           AND tenant_key = current_setting(''app.tenant_key'', true)
           AND test_namespace = ''meridian-health-source-volume-v1''
           AND test_namespace = current_setting(''app.foundation_v2_test_namespace'', true)
           AND current_setting(''app.foundation_v2_source_release_id'', true) = ''meridian-health-source-v1-202608:source-volume-v1:05889e763f88''
           AND current_setting(''app.foundation_v2_release_alias'', true) = ''meridian-health-demo-phase-a-source-volume-v1''
           %s
         )',
      rel,
      release_check
    );
    EXECUTE format('DROP POLICY IF EXISTS meridian_health_demo_insert ON %s', rel);
    EXECUTE format(
      'CREATE POLICY meridian_health_demo_insert ON %s
         FOR INSERT
         TO foundation_v2_meridian_health_demo_writer
         WITH CHECK (
           tenant_key = ''meridian_health_global''
           AND tenant_key = current_setting(''app.tenant_key'', true)
           AND test_namespace = ''meridian-health-source-volume-v1''
           AND test_namespace = current_setting(''app.foundation_v2_test_namespace'', true)
           AND current_setting(''app.foundation_v2_source_release_id'', true) = ''meridian-health-source-v1-202608:source-volume-v1:05889e763f88''
           AND current_setting(''app.foundation_v2_release_alias'', true) = ''meridian-health-demo-phase-a-source-volume-v1''
           %s
         )',
      rel,
      release_check
    );
  END LOOP;
END $$;

COMMENT ON SCHEMA foundation_v2_meridian_health_demo IS
  'Isolated Meridian Health demo source-volume schema; Layer 1 only, no product activation.';

COMMENT ON TABLE foundation_v2_meridian_health_demo.source_file_context IS
  'Meridian Health source-file routing metadata required by later source adapters; inserted atomically with source files.';

COMMENT ON ROLE foundation_v2_meridian_health_demo_writer IS
  'No-login NOINHERIT writer role for approved Meridian Health demo Layer 1 ACA data-build jobs only.';

COMMENT ON ROLE foundation_v2_meridian_health_demo_reader IS
  'No-login NOINHERIT reader role for independent Meridian Health demo Layer 1 readback verification only.';

COMMIT;
