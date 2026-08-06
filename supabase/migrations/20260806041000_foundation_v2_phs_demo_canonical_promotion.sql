-- PHS Healthcare demo isolated Layer 3 canonical promotion substrate.
--
-- Scope:
--   Adds PHS-only canonical promotion proof tables. These tables distinguish
--   master entities, observations, relationships, evidence records and event
--   native records from Layer 2 row-level candidates.
--
-- Non-goals:
--   This migration does not publish to shared canonical tables, activate a
--   tenant, refresh Cube, update product read models or deploy runtime code.

BEGIN;

CREATE TABLE IF NOT EXISTS foundation_v2_phs_demo.canonical_entities (
  canonical_entity_id text PRIMARY KEY,
  tenant_key text NOT NULL,
  test_namespace text NOT NULL,
  source_release_id text NOT NULL,
  canonical_entity_type text NOT NULL,
  business_key text NOT NULL,
  display_name text NOT NULL DEFAULT '',
  source_record_count integer NOT NULL CHECK (source_record_count >= 1),
  source_file_names text[] NOT NULL DEFAULT ARRAY[]::text[],
  entity_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  confidence numeric(5,4) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  writer_job_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, test_namespace, canonical_entity_type, business_key),
  CHECK (tenant_key = 'phs_health_demo_global'),
  CHECK (test_namespace = 'phs-healthcare-demo-source-volume-v1'),
  CHECK (source_release_id = 'phs-health-source-v1-202608:source-volume-v1:447910ac3c16')
);

CREATE TABLE IF NOT EXISTS foundation_v2_phs_demo.canonical_observations (
  canonical_observation_id text PRIMARY KEY,
  tenant_key text NOT NULL,
  test_namespace text NOT NULL,
  source_release_id text NOT NULL,
  source_record_id text NOT NULL,
  observation_type text NOT NULL,
  observation_grain text NOT NULL,
  business_key text NOT NULL,
  related_entity_refs jsonb NOT NULL DEFAULT '{}'::jsonb,
  observation_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  confidence numeric(5,4) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  writer_job_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (source_record_id, tenant_key, test_namespace)
    REFERENCES foundation_v2_phs_demo.source_records(source_record_id, tenant_key, test_namespace)
    ON DELETE RESTRICT,
  UNIQUE (tenant_key, test_namespace, observation_type, business_key),
  CHECK (tenant_key = 'phs_health_demo_global'),
  CHECK (test_namespace = 'phs-healthcare-demo-source-volume-v1'),
  CHECK (source_release_id = 'phs-health-source-v1-202608:source-volume-v1:447910ac3c16')
);

CREATE TABLE IF NOT EXISTS foundation_v2_phs_demo.canonical_relationships (
  canonical_relationship_id text PRIMARY KEY,
  tenant_key text NOT NULL,
  test_namespace text NOT NULL,
  source_release_id text NOT NULL,
  source_record_id text NOT NULL,
  relationship_type text NOT NULL,
  source_entity_ref text NOT NULL DEFAULT '',
  target_entity_ref text NOT NULL DEFAULT '',
  relationship_state text NOT NULL
    CHECK (relationship_state IN ('explicit_accepted', 'inferred_accepted', 'unresolved_endpoint')),
  relationship_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  confidence numeric(5,4) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  writer_job_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (source_record_id, tenant_key, test_namespace)
    REFERENCES foundation_v2_phs_demo.source_records(source_record_id, tenant_key, test_namespace)
    ON DELETE RESTRICT,
  UNIQUE (tenant_key, test_namespace, relationship_type, source_record_id),
  CHECK (tenant_key = 'phs_health_demo_global'),
  CHECK (test_namespace = 'phs-healthcare-demo-source-volume-v1'),
  CHECK (source_release_id = 'phs-health-source-v1-202608:source-volume-v1:447910ac3c16')
);

CREATE TABLE IF NOT EXISTS foundation_v2_phs_demo.canonical_evidence_records (
  canonical_evidence_id text PRIMARY KEY,
  tenant_key text NOT NULL,
  test_namespace text NOT NULL,
  source_release_id text NOT NULL,
  source_record_id text NOT NULL,
  evidence_ref text NOT NULL,
  document_ref text NOT NULL DEFAULT '',
  evidence_subject text NOT NULL DEFAULT '',
  evidence_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  confidence numeric(5,4) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  writer_job_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (source_record_id, tenant_key, test_namespace)
    REFERENCES foundation_v2_phs_demo.source_records(source_record_id, tenant_key, test_namespace)
    ON DELETE RESTRICT,
  UNIQUE (tenant_key, test_namespace, evidence_ref),
  CHECK (tenant_key = 'phs_health_demo_global'),
  CHECK (test_namespace = 'phs-healthcare-demo-source-volume-v1'),
  CHECK (source_release_id = 'phs-health-source-v1-202608:source-volume-v1:447910ac3c16')
);

CREATE TABLE IF NOT EXISTS foundation_v2_phs_demo.event_native_records (
  event_native_record_id text PRIMARY KEY,
  tenant_key text NOT NULL,
  test_namespace text NOT NULL,
  source_release_id text NOT NULL,
  event_id text NOT NULL,
  source_record_id text NOT NULL,
  event_record_type text NOT NULL,
  business_key text NOT NULL,
  event_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  confidence numeric(5,4) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  writer_job_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (source_record_id, tenant_key, test_namespace)
    REFERENCES foundation_v2_phs_demo.source_records(source_record_id, tenant_key, test_namespace)
    ON DELETE RESTRICT,
  UNIQUE (tenant_key, test_namespace, event_id, event_record_type, business_key),
  CHECK (tenant_key = 'phs_health_demo_global'),
  CHECK (test_namespace = 'phs-healthcare-demo-source-volume-v1'),
  CHECK (source_release_id = 'phs-health-source-v1-202608:source-volume-v1:447910ac3c16')
);

CREATE TABLE IF NOT EXISTS foundation_v2_phs_demo.canonical_promotion_decisions (
  promotion_decision_id text PRIMARY KEY,
  candidate_id text NOT NULL,
  tenant_key text NOT NULL,
  test_namespace text NOT NULL,
  source_release_id text NOT NULL,
  source_record_id text NOT NULL,
  source_file_name text NOT NULL,
  canonical_entity_type text NOT NULL,
  canonical_entity_id text NOT NULL,
  resolution_state text NOT NULL
    CHECK (resolution_state IN (
      'ACCEPTED_NEW',
      'MATCHED_EXISTING',
      'MERGED',
      'RELATIONSHIP_ACCEPTED',
      'OBSERVATION_ACCEPTED',
      'EVIDENCE_ACCEPTED',
      'SUPERSEDED',
      'REJECTED',
      'REQUIRES_REVIEW'
    )),
  resolution_rule text NOT NULL,
  confidence numeric(5,4) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  evidence_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  conflict_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  review_requirement text NOT NULL DEFAULT '',
  writer_job_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (candidate_id, tenant_key, test_namespace)
    REFERENCES foundation_v2_phs_demo.knowledge_candidates(candidate_id, tenant_key, test_namespace)
    ON DELETE RESTRICT,
  FOREIGN KEY (source_record_id, tenant_key, test_namespace)
    REFERENCES foundation_v2_phs_demo.source_records(source_record_id, tenant_key, test_namespace)
    ON DELETE RESTRICT,
  UNIQUE (candidate_id, tenant_key, test_namespace),
  CHECK (tenant_key = 'phs_health_demo_global'),
  CHECK (test_namespace = 'phs-healthcare-demo-source-volume-v1'),
  CHECK (source_release_id = 'phs-health-source-v1-202608:source-volume-v1:447910ac3c16')
);

GRANT SELECT, INSERT ON foundation_v2_phs_demo.canonical_entities TO foundation_v2_phs_demo_writer;
GRANT SELECT, INSERT ON foundation_v2_phs_demo.canonical_observations TO foundation_v2_phs_demo_writer;
GRANT SELECT, INSERT ON foundation_v2_phs_demo.canonical_relationships TO foundation_v2_phs_demo_writer;
GRANT SELECT, INSERT ON foundation_v2_phs_demo.canonical_evidence_records TO foundation_v2_phs_demo_writer;
GRANT SELECT, INSERT ON foundation_v2_phs_demo.event_native_records TO foundation_v2_phs_demo_writer;
GRANT SELECT, INSERT ON foundation_v2_phs_demo.canonical_promotion_decisions TO foundation_v2_phs_demo_writer;

GRANT SELECT ON foundation_v2_phs_demo.canonical_entities TO foundation_v2_phs_demo_reader;
GRANT SELECT ON foundation_v2_phs_demo.canonical_observations TO foundation_v2_phs_demo_reader;
GRANT SELECT ON foundation_v2_phs_demo.canonical_relationships TO foundation_v2_phs_demo_reader;
GRANT SELECT ON foundation_v2_phs_demo.canonical_evidence_records TO foundation_v2_phs_demo_reader;
GRANT SELECT ON foundation_v2_phs_demo.event_native_records TO foundation_v2_phs_demo_reader;
GRANT SELECT ON foundation_v2_phs_demo.canonical_promotion_decisions TO foundation_v2_phs_demo_reader;

DO $$
DECLARE
  rel regclass;
BEGIN
  FOREACH rel IN ARRAY ARRAY[
    'foundation_v2_phs_demo.canonical_entities'::regclass,
    'foundation_v2_phs_demo.canonical_observations'::regclass,
    'foundation_v2_phs_demo.canonical_relationships'::regclass,
    'foundation_v2_phs_demo.canonical_evidence_records'::regclass,
    'foundation_v2_phs_demo.event_native_records'::regclass,
    'foundation_v2_phs_demo.canonical_promotion_decisions'::regclass
  ]
  LOOP
    EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', rel);
    EXECUTE format('ALTER TABLE %s FORCE ROW LEVEL SECURITY', rel);
  END LOOP;
END $$;

DROP POLICY IF EXISTS phs_demo_select ON foundation_v2_phs_demo.canonical_entities;
CREATE POLICY phs_demo_select ON foundation_v2_phs_demo.canonical_entities
  FOR SELECT TO foundation_v2_phs_demo_writer, foundation_v2_phs_demo_reader
  USING (tenant_key='phs_health_demo_global'
    AND current_setting('app.tenant_key', true)='phs_health_demo_global'
    AND test_namespace='phs-healthcare-demo-source-volume-v1'
    AND current_setting('app.foundation_v2_test_namespace', true)='phs-healthcare-demo-source-volume-v1'
    AND source_release_id='phs-health-source-v1-202608:source-volume-v1:447910ac3c16'
    AND current_setting('app.foundation_v2_source_release_id', true)='phs-health-source-v1-202608:source-volume-v1:447910ac3c16'
    AND current_setting('app.foundation_v2_release_alias', true)='phs-healthcare-demo-phase-a-source-volume-v1');

DROP POLICY IF EXISTS phs_demo_insert ON foundation_v2_phs_demo.canonical_entities;
CREATE POLICY phs_demo_insert ON foundation_v2_phs_demo.canonical_entities
  FOR INSERT TO foundation_v2_phs_demo_writer
  WITH CHECK (tenant_key='phs_health_demo_global'
    AND current_setting('app.tenant_key', true)='phs_health_demo_global'
    AND test_namespace='phs-healthcare-demo-source-volume-v1'
    AND current_setting('app.foundation_v2_test_namespace', true)='phs-healthcare-demo-source-volume-v1'
    AND source_release_id='phs-health-source-v1-202608:source-volume-v1:447910ac3c16'
    AND current_setting('app.foundation_v2_source_release_id', true)='phs-health-source-v1-202608:source-volume-v1:447910ac3c16'
    AND current_setting('app.foundation_v2_release_alias', true)='phs-healthcare-demo-phase-a-source-volume-v1');

DROP POLICY IF EXISTS phs_demo_select ON foundation_v2_phs_demo.canonical_observations;
CREATE POLICY phs_demo_select ON foundation_v2_phs_demo.canonical_observations
  FOR SELECT TO foundation_v2_phs_demo_writer, foundation_v2_phs_demo_reader
  USING (tenant_key='phs_health_demo_global'
    AND current_setting('app.tenant_key', true)='phs_health_demo_global'
    AND test_namespace='phs-healthcare-demo-source-volume-v1'
    AND current_setting('app.foundation_v2_test_namespace', true)='phs-healthcare-demo-source-volume-v1'
    AND source_release_id='phs-health-source-v1-202608:source-volume-v1:447910ac3c16'
    AND current_setting('app.foundation_v2_source_release_id', true)='phs-health-source-v1-202608:source-volume-v1:447910ac3c16'
    AND current_setting('app.foundation_v2_release_alias', true)='phs-healthcare-demo-phase-a-source-volume-v1');

DROP POLICY IF EXISTS phs_demo_insert ON foundation_v2_phs_demo.canonical_observations;
CREATE POLICY phs_demo_insert ON foundation_v2_phs_demo.canonical_observations
  FOR INSERT TO foundation_v2_phs_demo_writer
  WITH CHECK (tenant_key='phs_health_demo_global'
    AND current_setting('app.tenant_key', true)='phs_health_demo_global'
    AND test_namespace='phs-healthcare-demo-source-volume-v1'
    AND current_setting('app.foundation_v2_test_namespace', true)='phs-healthcare-demo-source-volume-v1'
    AND source_release_id='phs-health-source-v1-202608:source-volume-v1:447910ac3c16'
    AND current_setting('app.foundation_v2_source_release_id', true)='phs-health-source-v1-202608:source-volume-v1:447910ac3c16'
    AND current_setting('app.foundation_v2_release_alias', true)='phs-healthcare-demo-phase-a-source-volume-v1');

DROP POLICY IF EXISTS phs_demo_select ON foundation_v2_phs_demo.canonical_relationships;
CREATE POLICY phs_demo_select ON foundation_v2_phs_demo.canonical_relationships
  FOR SELECT TO foundation_v2_phs_demo_writer, foundation_v2_phs_demo_reader
  USING (tenant_key='phs_health_demo_global'
    AND current_setting('app.tenant_key', true)='phs_health_demo_global'
    AND test_namespace='phs-healthcare-demo-source-volume-v1'
    AND current_setting('app.foundation_v2_test_namespace', true)='phs-healthcare-demo-source-volume-v1'
    AND source_release_id='phs-health-source-v1-202608:source-volume-v1:447910ac3c16'
    AND current_setting('app.foundation_v2_source_release_id', true)='phs-health-source-v1-202608:source-volume-v1:447910ac3c16'
    AND current_setting('app.foundation_v2_release_alias', true)='phs-healthcare-demo-phase-a-source-volume-v1');

DROP POLICY IF EXISTS phs_demo_insert ON foundation_v2_phs_demo.canonical_relationships;
CREATE POLICY phs_demo_insert ON foundation_v2_phs_demo.canonical_relationships
  FOR INSERT TO foundation_v2_phs_demo_writer
  WITH CHECK (tenant_key='phs_health_demo_global'
    AND current_setting('app.tenant_key', true)='phs_health_demo_global'
    AND test_namespace='phs-healthcare-demo-source-volume-v1'
    AND current_setting('app.foundation_v2_test_namespace', true)='phs-healthcare-demo-source-volume-v1'
    AND source_release_id='phs-health-source-v1-202608:source-volume-v1:447910ac3c16'
    AND current_setting('app.foundation_v2_source_release_id', true)='phs-health-source-v1-202608:source-volume-v1:447910ac3c16'
    AND current_setting('app.foundation_v2_release_alias', true)='phs-healthcare-demo-phase-a-source-volume-v1');

DROP POLICY IF EXISTS phs_demo_select ON foundation_v2_phs_demo.canonical_evidence_records;
CREATE POLICY phs_demo_select ON foundation_v2_phs_demo.canonical_evidence_records
  FOR SELECT TO foundation_v2_phs_demo_writer, foundation_v2_phs_demo_reader
  USING (tenant_key='phs_health_demo_global'
    AND current_setting('app.tenant_key', true)='phs_health_demo_global'
    AND test_namespace='phs-healthcare-demo-source-volume-v1'
    AND current_setting('app.foundation_v2_test_namespace', true)='phs-healthcare-demo-source-volume-v1'
    AND source_release_id='phs-health-source-v1-202608:source-volume-v1:447910ac3c16'
    AND current_setting('app.foundation_v2_source_release_id', true)='phs-health-source-v1-202608:source-volume-v1:447910ac3c16'
    AND current_setting('app.foundation_v2_release_alias', true)='phs-healthcare-demo-phase-a-source-volume-v1');

DROP POLICY IF EXISTS phs_demo_insert ON foundation_v2_phs_demo.canonical_evidence_records;
CREATE POLICY phs_demo_insert ON foundation_v2_phs_demo.canonical_evidence_records
  FOR INSERT TO foundation_v2_phs_demo_writer
  WITH CHECK (tenant_key='phs_health_demo_global'
    AND current_setting('app.tenant_key', true)='phs_health_demo_global'
    AND test_namespace='phs-healthcare-demo-source-volume-v1'
    AND current_setting('app.foundation_v2_test_namespace', true)='phs-healthcare-demo-source-volume-v1'
    AND source_release_id='phs-health-source-v1-202608:source-volume-v1:447910ac3c16'
    AND current_setting('app.foundation_v2_source_release_id', true)='phs-health-source-v1-202608:source-volume-v1:447910ac3c16'
    AND current_setting('app.foundation_v2_release_alias', true)='phs-healthcare-demo-phase-a-source-volume-v1');

DROP POLICY IF EXISTS phs_demo_select ON foundation_v2_phs_demo.event_native_records;
CREATE POLICY phs_demo_select ON foundation_v2_phs_demo.event_native_records
  FOR SELECT TO foundation_v2_phs_demo_writer, foundation_v2_phs_demo_reader
  USING (tenant_key='phs_health_demo_global'
    AND current_setting('app.tenant_key', true)='phs_health_demo_global'
    AND test_namespace='phs-healthcare-demo-source-volume-v1'
    AND current_setting('app.foundation_v2_test_namespace', true)='phs-healthcare-demo-source-volume-v1'
    AND source_release_id='phs-health-source-v1-202608:source-volume-v1:447910ac3c16'
    AND current_setting('app.foundation_v2_source_release_id', true)='phs-health-source-v1-202608:source-volume-v1:447910ac3c16'
    AND current_setting('app.foundation_v2_release_alias', true)='phs-healthcare-demo-phase-a-source-volume-v1');

DROP POLICY IF EXISTS phs_demo_insert ON foundation_v2_phs_demo.event_native_records;
CREATE POLICY phs_demo_insert ON foundation_v2_phs_demo.event_native_records
  FOR INSERT TO foundation_v2_phs_demo_writer
  WITH CHECK (tenant_key='phs_health_demo_global'
    AND current_setting('app.tenant_key', true)='phs_health_demo_global'
    AND test_namespace='phs-healthcare-demo-source-volume-v1'
    AND current_setting('app.foundation_v2_test_namespace', true)='phs-healthcare-demo-source-volume-v1'
    AND source_release_id='phs-health-source-v1-202608:source-volume-v1:447910ac3c16'
    AND current_setting('app.foundation_v2_source_release_id', true)='phs-health-source-v1-202608:source-volume-v1:447910ac3c16'
    AND current_setting('app.foundation_v2_release_alias', true)='phs-healthcare-demo-phase-a-source-volume-v1');

DROP POLICY IF EXISTS phs_demo_select ON foundation_v2_phs_demo.canonical_promotion_decisions;
CREATE POLICY phs_demo_select ON foundation_v2_phs_demo.canonical_promotion_decisions
  FOR SELECT TO foundation_v2_phs_demo_writer, foundation_v2_phs_demo_reader
  USING (tenant_key='phs_health_demo_global'
    AND current_setting('app.tenant_key', true)='phs_health_demo_global'
    AND test_namespace='phs-healthcare-demo-source-volume-v1'
    AND current_setting('app.foundation_v2_test_namespace', true)='phs-healthcare-demo-source-volume-v1'
    AND source_release_id='phs-health-source-v1-202608:source-volume-v1:447910ac3c16'
    AND current_setting('app.foundation_v2_source_release_id', true)='phs-health-source-v1-202608:source-volume-v1:447910ac3c16'
    AND current_setting('app.foundation_v2_release_alias', true)='phs-healthcare-demo-phase-a-source-volume-v1');

DROP POLICY IF EXISTS phs_demo_insert ON foundation_v2_phs_demo.canonical_promotion_decisions;
CREATE POLICY phs_demo_insert ON foundation_v2_phs_demo.canonical_promotion_decisions
  FOR INSERT TO foundation_v2_phs_demo_writer
  WITH CHECK (tenant_key='phs_health_demo_global'
    AND current_setting('app.tenant_key', true)='phs_health_demo_global'
    AND test_namespace='phs-healthcare-demo-source-volume-v1'
    AND current_setting('app.foundation_v2_test_namespace', true)='phs-healthcare-demo-source-volume-v1'
    AND source_release_id='phs-health-source-v1-202608:source-volume-v1:447910ac3c16'
    AND current_setting('app.foundation_v2_source_release_id', true)='phs-health-source-v1-202608:source-volume-v1:447910ac3c16'
    AND current_setting('app.foundation_v2_release_alias', true)='phs-healthcare-demo-phase-a-source-volume-v1');

COMMENT ON TABLE foundation_v2_phs_demo.canonical_entities IS
  'PHS Healthcare demo Layer 3 isolated canonical master entities.';
COMMENT ON TABLE foundation_v2_phs_demo.canonical_observations IS
  'PHS Healthcare demo Layer 3 transactional and metric observations.';
COMMENT ON TABLE foundation_v2_phs_demo.canonical_relationships IS
  'PHS Healthcare demo Layer 3 evidence-backed relationships.';
COMMENT ON TABLE foundation_v2_phs_demo.canonical_evidence_records IS
  'PHS Healthcare demo Layer 3 accepted evidence span records.';
COMMENT ON TABLE foundation_v2_phs_demo.event_native_records IS
  'PHS Healthcare demo Layer 3 sourcing-event-native records.';
COMMENT ON TABLE foundation_v2_phs_demo.canonical_promotion_decisions IS
  'PHS Healthcare demo Layer 3 one-row-per-candidate deterministic promotion decisions.';

COMMIT;
