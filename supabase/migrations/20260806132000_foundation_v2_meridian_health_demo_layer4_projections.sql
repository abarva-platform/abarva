BEGIN;

CREATE TABLE IF NOT EXISTS foundation_v2_meridian_health_demo.event_context_snapshots (
  event_context_snapshot_id text PRIMARY KEY,
  tenant_key text NOT NULL,
  test_namespace text NOT NULL,
  source_release_id text NOT NULL,
  event_id text NOT NULL,
  snapshot_version text NOT NULL,
  snapshot_hash text NOT NULL CHECK (snapshot_hash ~ '^[a-f0-9]{64}$'),
  immutable_state text NOT NULL CHECK (immutable_state = 'pinned'),
  selected_canonical_entity_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  selected_canonical_relationship_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  selected_source_record_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  snapshot_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  writer_job_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, snapshot_version, tenant_key, test_namespace),
  UNIQUE (event_context_snapshot_id, tenant_key, test_namespace),
  CHECK (tenant_key = 'meridian_health_global'),
  CHECK (test_namespace = 'meridian-health-source-volume-v1'),
  CHECK (source_release_id = 'meridian-health-source-v1-202608:source-volume-v1:447910ac3c16')
);

CREATE TABLE IF NOT EXISTS foundation_v2_meridian_health_demo.projection_authority (
  projection_authority_id text PRIMARY KEY,
  tenant_key text NOT NULL,
  test_namespace text NOT NULL,
  source_release_id text NOT NULL,
  projection_namespace text NOT NULL,
  projection_name text NOT NULL,
  projection_version text NOT NULL,
  business_grain text NOT NULL,
  projection_hash text NOT NULL CHECK (projection_hash ~ '^[a-f0-9]{64}$'),
  projection_row_count integer NOT NULL CHECK (projection_row_count >= 0),
  freshness_state text NOT NULL CHECK (freshness_state IN ('fresh', 'current', 'stale', 'blocked')),
  source_file_names text[] NOT NULL DEFAULT ARRAY[]::text[],
  upstream_layer3_counts jsonb NOT NULL DEFAULT '{}'::jsonb,
  writer_job_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (projection_authority_id, tenant_key, test_namespace),
  UNIQUE (tenant_key, test_namespace, source_release_id, projection_namespace, projection_name, projection_version),
  CHECK (tenant_key = 'meridian_health_global'),
  CHECK (test_namespace = 'meridian-health-source-volume-v1'),
  CHECK (source_release_id = 'meridian-health-source-v1-202608:source-volume-v1:447910ac3c16')
);

CREATE TABLE IF NOT EXISTS foundation_v2_meridian_health_demo.projection_rows (
  projection_row_id text PRIMARY KEY,
  projection_authority_id text NOT NULL,
  tenant_key text NOT NULL,
  test_namespace text NOT NULL,
  source_release_id text NOT NULL,
  projection_namespace text NOT NULL,
  projection_name text NOT NULL,
  business_grain text NOT NULL,
  business_key text NOT NULL,
  event_context_snapshot_id text,
  canonical_entity_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  canonical_relationship_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  source_record_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  evidence_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  row_hash text NOT NULL CHECK (row_hash ~ '^[a-f0-9]{64}$'),
  availability_state text NOT NULL CHECK (availability_state IN ('available', 'withheld', 'unsupported', 'stale', 'conflicting')),
  projection_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  writer_job_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (projection_authority_id, tenant_key, test_namespace)
    REFERENCES foundation_v2_meridian_health_demo.projection_authority(projection_authority_id, tenant_key, test_namespace)
    ON DELETE RESTRICT,
  FOREIGN KEY (event_context_snapshot_id, tenant_key, test_namespace)
    REFERENCES foundation_v2_meridian_health_demo.event_context_snapshots(event_context_snapshot_id, tenant_key, test_namespace)
    ON DELETE RESTRICT,
  UNIQUE (projection_row_id, tenant_key, test_namespace),
  UNIQUE (projection_authority_id, row_hash),
  CHECK (tenant_key = 'meridian_health_global'),
  CHECK (test_namespace = 'meridian-health-source-volume-v1'),
  CHECK (source_release_id = 'meridian-health-source-v1-202608:source-volume-v1:447910ac3c16')
);

CREATE TABLE IF NOT EXISTS foundation_v2_meridian_health_demo.projection_field_lineage (
  projection_field_lineage_id text PRIMARY KEY,
  projection_row_id text NOT NULL,
  tenant_key text NOT NULL,
  test_namespace text NOT NULL,
  source_release_id text NOT NULL,
  projection_field_name text NOT NULL,
  source_record_id text,
  source_field_value_id text,
  canonical_entity_id text,
  canonical_relationship_id text,
  evidence_ref text NOT NULL DEFAULT '',
  contribution_type text NOT NULL CHECK (contribution_type IN ('direct', 'derived', 'filter', 'withheld', 'excluded')),
  writer_job_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (projection_row_id, tenant_key, test_namespace)
    REFERENCES foundation_v2_meridian_health_demo.projection_rows(projection_row_id, tenant_key, test_namespace)
    ON DELETE RESTRICT,
  FOREIGN KEY (source_record_id, tenant_key, test_namespace)
    REFERENCES foundation_v2_meridian_health_demo.source_records(source_record_id, tenant_key, test_namespace)
    ON DELETE RESTRICT,
  FOREIGN KEY (source_field_value_id, tenant_key, test_namespace)
    REFERENCES foundation_v2_meridian_health_demo.source_field_values(source_field_value_id, tenant_key, test_namespace)
    ON DELETE RESTRICT,
  UNIQUE (projection_field_lineage_id, tenant_key, test_namespace),
  CHECK (tenant_key = 'meridian_health_global'),
  CHECK (test_namespace = 'meridian-health-source-volume-v1'),
  CHECK (source_release_id = 'meridian-health-source-v1-202608:source-volume-v1:447910ac3c16')
);

CREATE INDEX IF NOT EXISTS idx_meridian_health_l4_projection_authority_name
  ON foundation_v2_meridian_health_demo.projection_authority (tenant_key, test_namespace, projection_namespace, projection_name);
CREATE INDEX IF NOT EXISTS idx_meridian_health_l4_projection_rows_authority
  ON foundation_v2_meridian_health_demo.projection_rows (tenant_key, test_namespace, projection_authority_id);
CREATE INDEX IF NOT EXISTS idx_meridian_health_l4_projection_rows_business
  ON foundation_v2_meridian_health_demo.projection_rows (tenant_key, test_namespace, projection_namespace, projection_name, business_grain, business_key);
CREATE INDEX IF NOT EXISTS idx_meridian_health_l4_projection_lineage_row
  ON foundation_v2_meridian_health_demo.projection_field_lineage (tenant_key, test_namespace, projection_row_id);

GRANT SELECT, INSERT, DELETE ON foundation_v2_meridian_health_demo.event_context_snapshots TO foundation_v2_meridian_health_demo_writer;
GRANT SELECT, INSERT, DELETE ON foundation_v2_meridian_health_demo.projection_authority TO foundation_v2_meridian_health_demo_writer;
GRANT SELECT, INSERT, DELETE ON foundation_v2_meridian_health_demo.projection_rows TO foundation_v2_meridian_health_demo_writer;
GRANT SELECT, INSERT, DELETE ON foundation_v2_meridian_health_demo.projection_field_lineage TO foundation_v2_meridian_health_demo_writer;

GRANT SELECT ON foundation_v2_meridian_health_demo.event_context_snapshots TO foundation_v2_meridian_health_demo_reader;
GRANT SELECT ON foundation_v2_meridian_health_demo.projection_authority TO foundation_v2_meridian_health_demo_reader;
GRANT SELECT ON foundation_v2_meridian_health_demo.projection_rows TO foundation_v2_meridian_health_demo_reader;
GRANT SELECT ON foundation_v2_meridian_health_demo.projection_field_lineage TO foundation_v2_meridian_health_demo_reader;

DO $$
DECLARE
  rel regclass;
BEGIN
  FOREACH rel IN ARRAY ARRAY[
    'foundation_v2_meridian_health_demo.event_context_snapshots'::regclass,
    'foundation_v2_meridian_health_demo.projection_authority'::regclass,
    'foundation_v2_meridian_health_demo.projection_rows'::regclass,
    'foundation_v2_meridian_health_demo.projection_field_lineage'::regclass
  ]
  LOOP
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
           AND source_release_id = ''meridian-health-source-v1-202608:source-volume-v1:447910ac3c16''
           AND source_release_id = current_setting(''app.foundation_v2_source_release_id'', true)
           AND current_setting(''app.foundation_v2_release_alias'', true) = ''meridian-health-demo-phase-a-source-volume-v1''
         )',
      rel
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
           AND source_release_id = ''meridian-health-source-v1-202608:source-volume-v1:447910ac3c16''
           AND source_release_id = current_setting(''app.foundation_v2_source_release_id'', true)
           AND current_setting(''app.foundation_v2_release_alias'', true) = ''meridian-health-demo-phase-a-source-volume-v1''
         )',
      rel
    );
    EXECUTE format('DROP POLICY IF EXISTS meridian_health_demo_delete ON %s', rel);
    EXECUTE format(
      'CREATE POLICY meridian_health_demo_delete ON %s
         FOR DELETE
         TO foundation_v2_meridian_health_demo_writer
         USING (
           tenant_key = ''meridian_health_global''
           AND tenant_key = current_setting(''app.tenant_key'', true)
           AND test_namespace = ''meridian-health-source-volume-v1''
           AND test_namespace = current_setting(''app.foundation_v2_test_namespace'', true)
           AND source_release_id = ''meridian-health-source-v1-202608:source-volume-v1:447910ac3c16''
           AND source_release_id = current_setting(''app.foundation_v2_source_release_id'', true)
           AND current_setting(''app.foundation_v2_release_alias'', true) = ''meridian-health-demo-phase-a-source-volume-v1''
         )',
      rel
    );
  END LOOP;
END $$;

COMMENT ON TABLE foundation_v2_meridian_health_demo.event_context_snapshots IS
  'Meridian Health demo Layer 4 immutable event-context snapshots for sourcing events.';
COMMENT ON TABLE foundation_v2_meridian_health_demo.projection_authority IS
  'Meridian Health demo Layer 4 typed projection authorities for governed consumption surfaces.';
COMMENT ON TABLE foundation_v2_meridian_health_demo.projection_rows IS
  'Meridian Health demo Layer 4 typed business-grain projection rows; products must not read generic observations directly.';
COMMENT ON TABLE foundation_v2_meridian_health_demo.projection_field_lineage IS
  'Meridian Health demo Layer 4 projection field lineage to source records, fields, canonical entities, relationships and evidence refs.';

COMMIT;
