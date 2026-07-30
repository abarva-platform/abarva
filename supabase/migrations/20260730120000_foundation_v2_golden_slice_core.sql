-- Foundation V2 isolated golden-slice substrate.
--
-- Scope:
--   Add V2-only typed tables used to prove the approved golden vertical slice.
--   This migration does not rewrite V1 source releases, review ledgers,
--   canonical records, publications, active baselines, projections, Cube
--   objects, providers, or product runtime bindings.
--
-- Replacement policy:
--   Mutable implementation defects may be repaired in code. Governed history is
--   preserved and superseded through new records, publications and baselines
--   only after the required approvals.

BEGIN;

CREATE SCHEMA IF NOT EXISTS foundation_v2;

CREATE TABLE IF NOT EXISTS foundation_v2.source_releases (
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
  UNIQUE (tenant_key, test_namespace, release_version)
);

CREATE TABLE IF NOT EXISTS foundation_v2.source_files (
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
    REFERENCES foundation_v2.source_releases(source_release_id, tenant_key, test_namespace)
    ON DELETE RESTRICT,
  UNIQUE (source_file_id, tenant_key, test_namespace),
  UNIQUE (source_release_id, file_name),
  UNIQUE (source_release_id, content_sha256)
);

CREATE TABLE IF NOT EXISTS foundation_v2.source_records (
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
    REFERENCES foundation_v2.source_files(source_file_id, tenant_key, test_namespace)
    ON DELETE RESTRICT,
  FOREIGN KEY (source_release_id, tenant_key, test_namespace)
    REFERENCES foundation_v2.source_releases(source_release_id, tenant_key, test_namespace)
    ON DELETE RESTRICT,
  UNIQUE (source_record_id, tenant_key, test_namespace),
  UNIQUE (source_file_id, source_row_number),
  UNIQUE (source_release_id, source_row_hash)
);

CREATE TABLE IF NOT EXISTS foundation_v2.source_field_values (
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
    REFERENCES foundation_v2.source_records(source_record_id, tenant_key, test_namespace)
    ON DELETE RESTRICT,
  FOREIGN KEY (source_file_id, tenant_key, test_namespace)
    REFERENCES foundation_v2.source_files(source_file_id, tenant_key, test_namespace)
    ON DELETE RESTRICT,
  FOREIGN KEY (source_release_id, tenant_key, test_namespace)
    REFERENCES foundation_v2.source_releases(source_release_id, tenant_key, test_namespace)
    ON DELETE RESTRICT,
  UNIQUE (source_field_value_id, tenant_key, test_namespace),
  UNIQUE (source_record_id, source_field_id)
);

CREATE TABLE IF NOT EXISTS foundation_v2.parser_executions (
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
    REFERENCES foundation_v2.source_releases(source_release_id, tenant_key, test_namespace)
    ON DELETE RESTRICT,
  UNIQUE (parser_execution_id, tenant_key, test_namespace)
);

CREATE TABLE IF NOT EXISTS foundation_v2.normalized_objects (
  normalized_object_id text PRIMARY KEY,
  source_record_id text NOT NULL,
  tenant_key text NOT NULL,
  test_namespace text NOT NULL,
  object_type text NOT NULL,
  business_key text NOT NULL,
  identity_resolution_state text NOT NULL
    CHECK (identity_resolution_state IN ('resolved', 'new_candidate', 'duplicate_candidate', 'orphan_endpoint', 'rejected')),
  normalized_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  content_hash text NOT NULL CHECK (content_hash ~ '^[a-f0-9]{64}$'),
  writer_job_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (source_record_id, tenant_key, test_namespace)
    REFERENCES foundation_v2.source_records(source_record_id, tenant_key, test_namespace)
    ON DELETE RESTRICT,
  UNIQUE (normalized_object_id, tenant_key, test_namespace),
  UNIQUE (tenant_key, test_namespace, object_type, business_key, content_hash)
);

CREATE TABLE IF NOT EXISTS foundation_v2.knowledge_candidates (
  candidate_id text PRIMARY KEY,
  normalized_object_id text NOT NULL,
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
    REFERENCES foundation_v2.normalized_objects(normalized_object_id, tenant_key, test_namespace)
    ON DELETE RESTRICT,
  UNIQUE (candidate_id, tenant_key, test_namespace),
  UNIQUE (tenant_key, test_namespace, candidate_type, candidate_business_key, content_hash)
);

CREATE TABLE IF NOT EXISTS foundation_v2.review_batches (
  review_batch_id text PRIMARY KEY,
  tenant_key text NOT NULL,
  test_namespace text NOT NULL,
  source_release_id text NOT NULL,
  batch_state text NOT NULL CHECK (batch_state IN ('isolated_test', 'approved_for_golden_slice', 'rejected')),
  reviewer_ref text NOT NULL,
  writer_job_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (source_release_id, tenant_key, test_namespace)
    REFERENCES foundation_v2.source_releases(source_release_id, tenant_key, test_namespace)
    ON DELETE RESTRICT,
  UNIQUE (review_batch_id, tenant_key, test_namespace)
);

CREATE TABLE IF NOT EXISTS foundation_v2.review_decisions (
  review_decision_id text PRIMARY KEY,
  review_batch_id text NOT NULL,
  candidate_id text NOT NULL,
  tenant_key text NOT NULL,
  test_namespace text NOT NULL,
  review_decision text NOT NULL CHECK (review_decision IN ('accepted', 'deferred', 'rejected', 'quarantined')),
  decision_reason text NOT NULL,
  reviewer_ref text NOT NULL,
  decided_at timestamptz NOT NULL DEFAULT now(),
  writer_job_id text NOT NULL,
  FOREIGN KEY (review_batch_id, tenant_key, test_namespace)
    REFERENCES foundation_v2.review_batches(review_batch_id, tenant_key, test_namespace)
    ON DELETE RESTRICT,
  FOREIGN KEY (candidate_id, tenant_key, test_namespace)
    REFERENCES foundation_v2.knowledge_candidates(candidate_id, tenant_key, test_namespace)
    ON DELETE RESTRICT,
  UNIQUE (review_decision_id, tenant_key, test_namespace),
  UNIQUE (review_batch_id, candidate_id)
);

CREATE TABLE IF NOT EXISTS foundation_v2.canonical_objects (
  canonical_object_id text PRIMARY KEY,
  review_decision_id text NOT NULL,
  tenant_key text NOT NULL,
  test_namespace text NOT NULL,
  object_type text NOT NULL,
  business_key text NOT NULL,
  authority_state text NOT NULL CHECK (authority_state IN ('accepted', 'authoritative', 'withheld', 'superseded')),
  review_state text NOT NULL CHECK (review_state IN ('accepted', 'deferred', 'rejected', 'quarantined')),
  content_hash text NOT NULL CHECK (content_hash ~ '^[a-f0-9]{64}$'),
  supersedes_canonical_object_id text,
  writer_job_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((review_state = 'accepted' AND authority_state IN ('accepted', 'authoritative')) OR authority_state IN ('withheld', 'superseded')),
  FOREIGN KEY (review_decision_id, tenant_key, test_namespace)
    REFERENCES foundation_v2.review_decisions(review_decision_id, tenant_key, test_namespace)
    ON DELETE RESTRICT,
  FOREIGN KEY (supersedes_canonical_object_id, tenant_key, test_namespace)
    REFERENCES foundation_v2.canonical_objects(canonical_object_id, tenant_key, test_namespace)
    ON DELETE RESTRICT,
  UNIQUE (canonical_object_id, tenant_key, test_namespace),
  UNIQUE (tenant_key, test_namespace, object_type, business_key, content_hash)
);

CREATE TABLE IF NOT EXISTS foundation_v2.domain_publications (
  publication_id text PRIMARY KEY,
  tenant_key text NOT NULL,
  test_namespace text NOT NULL,
  publication_domain text NOT NULL,
  publication_version text NOT NULL,
  publication_hash text NOT NULL CHECK (publication_hash ~ '^[a-f0-9]{64}$'),
  publication_state text NOT NULL DEFAULT 'isolated_test'
    CHECK (publication_state IN ('isolated_test', 'candidate', 'superseded', 'rejected')),
  immutability_scope text NOT NULL DEFAULT 'append_only',
  writer_job_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (publication_id, tenant_key, test_namespace),
  UNIQUE (tenant_key, test_namespace, publication_domain, publication_version)
);

CREATE TABLE IF NOT EXISTS foundation_v2.publication_members (
  publication_member_id text PRIMARY KEY,
  publication_id text NOT NULL,
  canonical_object_id text NOT NULL,
  tenant_key text NOT NULL,
  test_namespace text NOT NULL,
  member_hash text NOT NULL CHECK (member_hash ~ '^[a-f0-9]{64}$'),
  inclusion_reason text NOT NULL,
  writer_job_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (publication_id, tenant_key, test_namespace)
    REFERENCES foundation_v2.domain_publications(publication_id, tenant_key, test_namespace)
    ON DELETE RESTRICT,
  FOREIGN KEY (canonical_object_id, tenant_key, test_namespace)
    REFERENCES foundation_v2.canonical_objects(canonical_object_id, tenant_key, test_namespace)
    ON DELETE RESTRICT,
  UNIQUE (publication_member_id, tenant_key, test_namespace),
  UNIQUE (publication_id, canonical_object_id)
);

CREATE TABLE IF NOT EXISTS foundation_v2.baselines (
  baseline_id text PRIMARY KEY,
  tenant_key text NOT NULL,
  test_namespace text NOT NULL,
  baseline_version text NOT NULL,
  baseline_hash text NOT NULL CHECK (baseline_hash ~ '^[a-f0-9]{64}$'),
  baseline_state text NOT NULL DEFAULT 'isolated_test'
    CHECK (baseline_state IN ('isolated_test', 'candidate', 'isolated_certified', 'superseded', 'rejected')),
  rollback_baseline_id text,
  writer_job_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (baseline_id, tenant_key, test_namespace),
  UNIQUE (tenant_key, test_namespace, baseline_version)
);

CREATE TABLE IF NOT EXISTS foundation_v2.baseline_object_memberships (
  baseline_object_membership_id text PRIMARY KEY,
  baseline_id text NOT NULL,
  publication_member_id text NOT NULL,
  tenant_key text NOT NULL,
  test_namespace text NOT NULL,
  membership_hash text NOT NULL CHECK (membership_hash ~ '^[a-f0-9]{64}$'),
  inclusion_reason text NOT NULL,
  exclusion_reason text,
  writer_job_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (baseline_id, tenant_key, test_namespace)
    REFERENCES foundation_v2.baselines(baseline_id, tenant_key, test_namespace)
    ON DELETE RESTRICT,
  FOREIGN KEY (publication_member_id, tenant_key, test_namespace)
    REFERENCES foundation_v2.publication_members(publication_member_id, tenant_key, test_namespace)
    ON DELETE RESTRICT,
  UNIQUE (baseline_object_membership_id, tenant_key, test_namespace),
  UNIQUE (baseline_id, publication_member_id)
);

CREATE TABLE IF NOT EXISTS foundation_v2.projection_authority (
  projection_authority_id text PRIMARY KEY,
  baseline_id text NOT NULL,
  tenant_key text NOT NULL,
  test_namespace text NOT NULL,
  projection_name text NOT NULL,
  projection_version text NOT NULL,
  projection_hash text NOT NULL CHECK (projection_hash ~ '^[a-f0-9]{64}$'),
  projection_row_count integer NOT NULL CHECK (projection_row_count >= 0),
  freshness_state text NOT NULL CHECK (freshness_state IN ('fresh', 'current', 'stale', 'blocked')),
  writer_job_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (baseline_id, tenant_key, test_namespace)
    REFERENCES foundation_v2.baselines(baseline_id, tenant_key, test_namespace)
    ON DELETE RESTRICT,
  UNIQUE (projection_authority_id, tenant_key, test_namespace),
  UNIQUE (tenant_key, test_namespace, baseline_id, projection_name, projection_version)
);

CREATE TABLE IF NOT EXISTS foundation_v2.projection_rows (
  projection_row_id text PRIMARY KEY,
  projection_authority_id text NOT NULL,
  baseline_object_membership_id text,
  tenant_key text NOT NULL,
  test_namespace text NOT NULL,
  projection_name text NOT NULL,
  row_hash text NOT NULL CHECK (row_hash ~ '^[a-f0-9]{64}$'),
  availability_state text NOT NULL CHECK (availability_state IN ('available', 'withheld', 'unsupported', 'stale', 'conflicting')),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  writer_job_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (projection_authority_id, tenant_key, test_namespace)
    REFERENCES foundation_v2.projection_authority(projection_authority_id, tenant_key, test_namespace)
    ON DELETE RESTRICT,
  FOREIGN KEY (baseline_object_membership_id, tenant_key, test_namespace)
    REFERENCES foundation_v2.baseline_object_memberships(baseline_object_membership_id, tenant_key, test_namespace)
    ON DELETE RESTRICT,
  UNIQUE (projection_row_id, tenant_key, test_namespace),
  UNIQUE (projection_authority_id, row_hash)
);

CREATE TABLE IF NOT EXISTS foundation_v2.projection_field_lineage (
  projection_field_lineage_id text PRIMARY KEY,
  projection_row_id text NOT NULL,
  source_field_value_id text,
  canonical_object_id text,
  tenant_key text NOT NULL,
  test_namespace text NOT NULL,
  projection_field_name text NOT NULL,
  contribution_type text NOT NULL CHECK (contribution_type IN ('direct', 'derived', 'filter', 'withheld', 'excluded')),
  writer_job_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (projection_row_id, tenant_key, test_namespace)
    REFERENCES foundation_v2.projection_rows(projection_row_id, tenant_key, test_namespace)
    ON DELETE RESTRICT,
  FOREIGN KEY (source_field_value_id, tenant_key, test_namespace)
    REFERENCES foundation_v2.source_field_values(source_field_value_id, tenant_key, test_namespace)
    ON DELETE RESTRICT,
  FOREIGN KEY (canonical_object_id, tenant_key, test_namespace)
    REFERENCES foundation_v2.canonical_objects(canonical_object_id, tenant_key, test_namespace)
    ON DELETE RESTRICT,
  UNIQUE (projection_field_lineage_id, tenant_key, test_namespace)
);

CREATE TABLE IF NOT EXISTS foundation_v2.cube_parity_results (
  cube_parity_result_id text PRIMARY KEY,
  projection_authority_id text NOT NULL,
  tenant_key text NOT NULL,
  test_namespace text NOT NULL,
  cube_object_name text NOT NULL,
  direct_sql_hash text NOT NULL CHECK (direct_sql_hash ~ '^[a-f0-9]{64}$'),
  cube_query_hash text NOT NULL CHECK (cube_query_hash ~ '^[a-f0-9]{64}$'),
  parity_status text NOT NULL CHECK (parity_status IN ('passed', 'failed', 'not_applicable')),
  writer_job_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (projection_authority_id, tenant_key, test_namespace)
    REFERENCES foundation_v2.projection_authority(projection_authority_id, tenant_key, test_namespace)
    ON DELETE RESTRICT,
  UNIQUE (cube_parity_result_id, tenant_key, test_namespace),
  UNIQUE (tenant_key, test_namespace, cube_object_name, projection_authority_id)
);

CREATE TABLE IF NOT EXISTS foundation_v2.product_binding_proofs (
  product_binding_proof_id text PRIMARY KEY,
  projection_authority_id text NOT NULL,
  tenant_key text NOT NULL,
  test_namespace text NOT NULL,
  product_surface text NOT NULL CHECK (product_surface IN ('knowledge_preview', 'source_preview', 'moves_preview', 'tower_preview')),
  component_id text NOT NULL,
  render_gate_status text NOT NULL CHECK (render_gate_status IN ('passed', 'withheld', 'blocked')),
  unsupported_claim_count integer NOT NULL DEFAULT 0 CHECK (unsupported_claim_count >= 0),
  proof_uri text NOT NULL,
  writer_job_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (render_gate_status <> 'passed' OR unsupported_claim_count = 0),
  FOREIGN KEY (projection_authority_id, tenant_key, test_namespace)
    REFERENCES foundation_v2.projection_authority(projection_authority_id, tenant_key, test_namespace)
    ON DELETE RESTRICT,
  UNIQUE (product_binding_proof_id, tenant_key, test_namespace)
);

CREATE TABLE IF NOT EXISTS foundation_v2.ava_packet_proofs (
  ava_packet_proof_id text PRIMARY KEY,
  baseline_id text NOT NULL,
  tenant_key text NOT NULL,
  test_namespace text NOT NULL,
  packet_hash text NOT NULL CHECK (packet_hash ~ '^[a-f0-9]{64}$'),
  grounding_status text NOT NULL CHECK (grounding_status IN ('grounded', 'refused_missing_evidence', 'blocked')),
  unsupported_claim_count integer NOT NULL DEFAULT 0 CHECK (unsupported_claim_count = 0),
  proof_uri text NOT NULL,
  writer_job_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (baseline_id, tenant_key, test_namespace)
    REFERENCES foundation_v2.baselines(baseline_id, tenant_key, test_namespace)
    ON DELETE RESTRICT,
  UNIQUE (ava_packet_proof_id, tenant_key, test_namespace)
);

CREATE TABLE IF NOT EXISTS foundation_v2.gate_results (
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
  UNIQUE (tenant_key, test_namespace, gate_id, writer_job_id)
);

DO $$
DECLARE
  target_table_name text;
  target_column_name text;
  constraint_name text;
BEGIN
  FOREACH target_table_name IN ARRAY ARRAY[
    'source_releases',
    'source_files',
    'source_records',
    'source_field_values',
    'parser_executions',
    'normalized_objects',
    'knowledge_candidates',
    'review_batches',
    'review_decisions',
    'canonical_objects',
    'domain_publications',
    'publication_members',
    'baselines',
    'baseline_object_memberships',
    'projection_authority',
    'projection_rows',
    'projection_field_lineage',
    'cube_parity_results',
    'product_binding_proofs',
    'ava_packet_proofs',
    'gate_results'
  ]
  LOOP
    FOR target_column_name IN
      SELECT c.column_name
      FROM information_schema.columns c
      WHERE c.table_schema = 'foundation_v2'
        AND c.table_name = target_table_name
        AND c.data_type = 'text'
        AND c.is_nullable = 'NO'
    LOOP
      constraint_name := format(
        'f2_%s_%s_nonempty',
        left(target_table_name, 18),
        substr(md5(target_table_name || ':' || target_column_name), 1, 10)
      );
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = constraint_name
          AND conrelid = format('foundation_v2.%I', target_table_name)::regclass
      ) THEN
        EXECUTE format(
          'ALTER TABLE foundation_v2.%I ADD CONSTRAINT %I CHECK (btrim(%I) <> '''')',
          target_table_name,
          constraint_name,
          target_column_name
        );
      END IF;
    END LOOP;
  END LOOP;
END $$;

CREATE INDEX IF NOT EXISTS idx_foundation_v2_source_files_release
  ON foundation_v2.source_files (tenant_key, test_namespace, source_release_id);
CREATE INDEX IF NOT EXISTS idx_foundation_v2_source_records_file
  ON foundation_v2.source_records (tenant_key, test_namespace, source_file_id, source_row_number);
CREATE INDEX IF NOT EXISTS idx_foundation_v2_source_fields_record
  ON foundation_v2.source_field_values (tenant_key, test_namespace, source_record_id, source_field_name);
CREATE INDEX IF NOT EXISTS idx_foundation_v2_candidates_state
  ON foundation_v2.knowledge_candidates (tenant_key, test_namespace, candidate_state);
CREATE INDEX IF NOT EXISTS idx_foundation_v2_review_decisions_batch
  ON foundation_v2.review_decisions (tenant_key, test_namespace, review_batch_id, review_decision);
CREATE INDEX IF NOT EXISTS idx_foundation_v2_canonical_object_type
  ON foundation_v2.canonical_objects (tenant_key, test_namespace, object_type, business_key);
CREATE INDEX IF NOT EXISTS idx_foundation_v2_publication_members_publication
  ON foundation_v2.publication_members (tenant_key, test_namespace, publication_id);
CREATE INDEX IF NOT EXISTS idx_foundation_v2_baseline_memberships_baseline
  ON foundation_v2.baseline_object_memberships (tenant_key, test_namespace, baseline_id);
CREATE INDEX IF NOT EXISTS idx_foundation_v2_projection_rows_authority
  ON foundation_v2.projection_rows (tenant_key, test_namespace, projection_authority_id);
CREATE INDEX IF NOT EXISTS idx_foundation_v2_projection_field_lineage_row
  ON foundation_v2.projection_field_lineage (tenant_key, test_namespace, projection_row_id);
CREATE INDEX IF NOT EXISTS idx_foundation_v2_gate_results_transition
  ON foundation_v2.gate_results (tenant_key, test_namespace, transition, gate_status);

DO $$
DECLARE
  rel regclass;
BEGIN
  FOREACH rel IN ARRAY ARRAY[
    'foundation_v2.source_releases'::regclass,
    'foundation_v2.source_files'::regclass,
    'foundation_v2.source_records'::regclass,
    'foundation_v2.source_field_values'::regclass,
    'foundation_v2.parser_executions'::regclass,
    'foundation_v2.normalized_objects'::regclass,
    'foundation_v2.knowledge_candidates'::regclass,
    'foundation_v2.review_batches'::regclass,
    'foundation_v2.review_decisions'::regclass,
    'foundation_v2.canonical_objects'::regclass,
    'foundation_v2.domain_publications'::regclass,
    'foundation_v2.publication_members'::regclass,
    'foundation_v2.baselines'::regclass,
    'foundation_v2.baseline_object_memberships'::regclass,
    'foundation_v2.projection_authority'::regclass,
    'foundation_v2.projection_rows'::regclass,
    'foundation_v2.projection_field_lineage'::regclass,
    'foundation_v2.cube_parity_results'::regclass,
    'foundation_v2.product_binding_proofs'::regclass,
    'foundation_v2.ava_packet_proofs'::regclass,
    'foundation_v2.gate_results'::regclass
  ]
  LOOP
    EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', rel);
    EXECUTE format('DROP POLICY IF EXISTS foundation_v2_tenant_select ON %s', rel);
    EXECUTE format(
      'CREATE POLICY foundation_v2_tenant_select ON %s FOR SELECT USING (
        (
          (
            nullif(current_setting(''app.tenant_key'', true), '''') IS NOT NULL
            AND tenant_key = current_setting(''app.tenant_key'', true)
          )
          OR (
            nullif(current_setting(''app.client_key'', true), '''') IS NOT NULL
            AND tenant_key = current_setting(''app.client_key'', true)
          )
        )
        AND nullif(current_setting(''app.foundation_v2_test_namespace'', true), '''') IS NOT NULL
        AND test_namespace = current_setting(''app.foundation_v2_test_namespace'', true)
      )',
      rel
    );
  END LOOP;
END $$;

COMMENT ON SCHEMA foundation_v2 IS
  'Foundation V2 isolated golden-slice substrate. Not a full reload or live provider cutover.';
COMMENT ON TABLE foundation_v2.source_releases IS
  'V2-only source release identities for isolated golden-slice proof; V1 source releases remain immutable history.';
COMMENT ON TABLE foundation_v2.baselines IS
  'V2-only isolated test baselines; not selectable by production providers.';
COMMENT ON TABLE foundation_v2.ava_packet_proofs IS
  'Isolated aVa packet/refusal proof; unsupported_claim_count must remain zero.';

COMMIT;
