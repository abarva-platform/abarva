-- Meridian Health demo isolated Layer 2 adapter/candidate substrate.
--
-- Scope:
--   Adds Meridian Health-only normalized adapter outputs and candidate staging tables.
--   This does not publish canonical objects, activate baselines, refresh Cube,
--   bind product runtime surfaces, or promote tenant data.

BEGIN;

CREATE TABLE IF NOT EXISTS foundation_v2_meridian_health_demo.normalized_objects (
  normalized_object_id text PRIMARY KEY,
  source_record_id text NOT NULL,
  source_file_id text NOT NULL,
  source_release_id text NOT NULL,
  tenant_key text NOT NULL,
  test_namespace text NOT NULL,
  source_file_name text NOT NULL,
  object_type text NOT NULL,
  business_key text NOT NULL,
  identity_resolution_state text NOT NULL
    CHECK (identity_resolution_state IN ('new_candidate', 'duplicate_candidate', 'restricted_candidate', 'rejected')),
  normalized_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  field_disposition_count integer NOT NULL CHECK (field_disposition_count >= 0),
  content_hash text NOT NULL CHECK (content_hash ~ '^[a-f0-9]{64}$'),
  writer_job_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (source_record_id, tenant_key, test_namespace)
    REFERENCES foundation_v2_meridian_health_demo.source_records(source_record_id, tenant_key, test_namespace)
    ON DELETE RESTRICT,
  FOREIGN KEY (source_file_id, tenant_key, test_namespace)
    REFERENCES foundation_v2_meridian_health_demo.source_files(source_file_id, tenant_key, test_namespace)
    ON DELETE RESTRICT,
  FOREIGN KEY (source_release_id, tenant_key, test_namespace)
    REFERENCES foundation_v2_meridian_health_demo.source_releases(source_release_id, tenant_key, test_namespace)
    ON DELETE RESTRICT,
  UNIQUE (normalized_object_id, tenant_key, test_namespace),
  UNIQUE (tenant_key, test_namespace, object_type, business_key, content_hash),
  CHECK (tenant_key = 'meridian_health_global'),
  CHECK (test_namespace = 'meridian-health-source-volume-v1'),
  CHECK (source_release_id = 'meridian-health-source-v1-202608:source-volume-v1:447910ac3c16')
);

CREATE TABLE IF NOT EXISTS foundation_v2_meridian_health_demo.knowledge_candidates (
  candidate_id text PRIMARY KEY,
  normalized_object_id text NOT NULL,
  source_record_id text NOT NULL,
  source_release_id text NOT NULL,
  tenant_key text NOT NULL,
  test_namespace text NOT NULL,
  candidate_type text NOT NULL,
  candidate_business_key text NOT NULL,
  review_policy_class text NOT NULL,
  evidence_count integer NOT NULL CHECK (evidence_count >= 0),
  candidate_state text NOT NULL DEFAULT 'pending_review'
    CHECK (candidate_state IN ('pending_review', 'accepted', 'deferred', 'rejected', 'quarantined')),
  content_hash text NOT NULL CHECK (content_hash ~ '^[a-f0-9]{64}$'),
  writer_job_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (normalized_object_id, tenant_key, test_namespace)
    REFERENCES foundation_v2_meridian_health_demo.normalized_objects(normalized_object_id, tenant_key, test_namespace)
    ON DELETE RESTRICT,
  FOREIGN KEY (source_record_id, tenant_key, test_namespace)
    REFERENCES foundation_v2_meridian_health_demo.source_records(source_record_id, tenant_key, test_namespace)
    ON DELETE RESTRICT,
  FOREIGN KEY (source_release_id, tenant_key, test_namespace)
    REFERENCES foundation_v2_meridian_health_demo.source_releases(source_release_id, tenant_key, test_namespace)
    ON DELETE RESTRICT,
  UNIQUE (candidate_id, tenant_key, test_namespace),
  UNIQUE (tenant_key, test_namespace, candidate_type, candidate_business_key, content_hash),
  CHECK (tenant_key = 'meridian_health_global'),
  CHECK (test_namespace = 'meridian-health-source-volume-v1'),
  CHECK (source_release_id = 'meridian-health-source-v1-202608:source-volume-v1:447910ac3c16')
);

GRANT SELECT, INSERT ON foundation_v2_meridian_health_demo.normalized_objects TO foundation_v2_meridian_health_demo_writer;
GRANT SELECT, INSERT ON foundation_v2_meridian_health_demo.knowledge_candidates TO foundation_v2_meridian_health_demo_writer;
GRANT SELECT ON foundation_v2_meridian_health_demo.normalized_objects TO foundation_v2_meridian_health_demo_reader;
GRANT SELECT ON foundation_v2_meridian_health_demo.knowledge_candidates TO foundation_v2_meridian_health_demo_reader;

ALTER TABLE foundation_v2_meridian_health_demo.normalized_objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE foundation_v2_meridian_health_demo.normalized_objects FORCE ROW LEVEL SECURITY;
ALTER TABLE foundation_v2_meridian_health_demo.knowledge_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE foundation_v2_meridian_health_demo.knowledge_candidates FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS meridian_health_demo_select ON foundation_v2_meridian_health_demo.normalized_objects;
CREATE POLICY meridian_health_demo_select ON foundation_v2_meridian_health_demo.normalized_objects
  FOR SELECT
  TO foundation_v2_meridian_health_demo_writer, foundation_v2_meridian_health_demo_reader
  USING (
    tenant_key = 'meridian_health_global'
    AND current_setting('app.tenant_key', true) = 'meridian_health_global'
    AND test_namespace = 'meridian-health-source-volume-v1'
    AND current_setting('app.foundation_v2_test_namespace', true) = 'meridian-health-source-volume-v1'
    AND source_release_id = 'meridian-health-source-v1-202608:source-volume-v1:447910ac3c16'
    AND current_setting('app.foundation_v2_source_release_id', true) = 'meridian-health-source-v1-202608:source-volume-v1:447910ac3c16'
    AND current_setting('app.foundation_v2_release_alias', true) = 'meridian-health-demo-phase-a-source-volume-v1'
  );

DROP POLICY IF EXISTS meridian_health_demo_insert ON foundation_v2_meridian_health_demo.normalized_objects;
CREATE POLICY meridian_health_demo_insert ON foundation_v2_meridian_health_demo.normalized_objects
  FOR INSERT
  TO foundation_v2_meridian_health_demo_writer
  WITH CHECK (
    tenant_key = 'meridian_health_global'
    AND current_setting('app.tenant_key', true) = 'meridian_health_global'
    AND test_namespace = 'meridian-health-source-volume-v1'
    AND current_setting('app.foundation_v2_test_namespace', true) = 'meridian-health-source-volume-v1'
    AND source_release_id = 'meridian-health-source-v1-202608:source-volume-v1:447910ac3c16'
    AND current_setting('app.foundation_v2_source_release_id', true) = 'meridian-health-source-v1-202608:source-volume-v1:447910ac3c16'
    AND current_setting('app.foundation_v2_release_alias', true) = 'meridian-health-demo-phase-a-source-volume-v1'
  );

DROP POLICY IF EXISTS meridian_health_demo_select ON foundation_v2_meridian_health_demo.knowledge_candidates;
CREATE POLICY meridian_health_demo_select ON foundation_v2_meridian_health_demo.knowledge_candidates
  FOR SELECT
  TO foundation_v2_meridian_health_demo_writer, foundation_v2_meridian_health_demo_reader
  USING (
    tenant_key = 'meridian_health_global'
    AND current_setting('app.tenant_key', true) = 'meridian_health_global'
    AND test_namespace = 'meridian-health-source-volume-v1'
    AND current_setting('app.foundation_v2_test_namespace', true) = 'meridian-health-source-volume-v1'
    AND source_release_id = 'meridian-health-source-v1-202608:source-volume-v1:447910ac3c16'
    AND current_setting('app.foundation_v2_source_release_id', true) = 'meridian-health-source-v1-202608:source-volume-v1:447910ac3c16'
    AND current_setting('app.foundation_v2_release_alias', true) = 'meridian-health-demo-phase-a-source-volume-v1'
  );

DROP POLICY IF EXISTS meridian_health_demo_insert ON foundation_v2_meridian_health_demo.knowledge_candidates;
CREATE POLICY meridian_health_demo_insert ON foundation_v2_meridian_health_demo.knowledge_candidates
  FOR INSERT
  TO foundation_v2_meridian_health_demo_writer
  WITH CHECK (
    tenant_key = 'meridian_health_global'
    AND current_setting('app.tenant_key', true) = 'meridian_health_global'
    AND test_namespace = 'meridian-health-source-volume-v1'
    AND current_setting('app.foundation_v2_test_namespace', true) = 'meridian-health-source-volume-v1'
    AND source_release_id = 'meridian-health-source-v1-202608:source-volume-v1:447910ac3c16'
    AND current_setting('app.foundation_v2_source_release_id', true) = 'meridian-health-source-v1-202608:source-volume-v1:447910ac3c16'
    AND current_setting('app.foundation_v2_release_alias', true) = 'meridian-health-demo-phase-a-source-volume-v1'
  );

COMMENT ON TABLE foundation_v2_meridian_health_demo.normalized_objects IS
  'Meridian Health demo Layer 2 normalized adapter outputs; isolated candidates only.';

COMMENT ON TABLE foundation_v2_meridian_health_demo.knowledge_candidates IS
  'Meridian Health demo candidate staging rows; not canonical promotion or product activation.';

COMMIT;
