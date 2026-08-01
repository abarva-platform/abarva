-- Foundation V3 conservation scaffold.
-- Additive only: records design expectations, links checkpoints to those
-- expectations, adds natural-key handles, and captures pre/post quality
-- snapshots. Enforcement remains warn-first through per-expectation on_breach.

BEGIN;

CREATE SCHEMA IF NOT EXISTS operations;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'abarva_expectation_basis') THEN
    CREATE TYPE abarva_expectation_basis AS ENUM (
      'declared_intake',
      'upstream_count',
      'derivation_rule',
      'design_constant',
      'absence_declared'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'abarva_expectation_breach_action') THEN
    CREATE TYPE abarva_expectation_breach_action AS ENUM (
      'warn',
      'fail',
      'require_absence_assertion'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'abarva_expectation_basis_mode') THEN
    CREATE TYPE abarva_expectation_basis_mode AS ENUM (
      'executable_sql',
      'literal_snapshot'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'abarva_registered_query_kind') THEN
    CREATE TYPE abarva_registered_query_kind AS ENUM (
      'expectation_basis',
      'finding_rule',
      'derivation_rule',
      'parity_check'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'abarva_claim_allowed_state') THEN
    CREATE TYPE abarva_claim_allowed_state AS ENUM (
      'allowed',
      'partial',
      'blocked'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'abarva_quality_snapshot_phase') THEN
    CREATE TYPE abarva_quality_snapshot_phase AS ENUM (
      'pre',
      'post'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS operations.registered_query (
  query_ref TEXT NOT NULL,
  query_kind abarva_registered_query_kind NOT NULL,
  query_version TEXT NOT NULL,
  query_sql TEXT NOT NULL,
  referenced_relations TEXT[] NOT NULL,
  output_shape JSONB NOT NULL DEFAULT '{}'::jsonb,
  basis_mode abarva_expectation_basis_mode NOT NULL DEFAULT 'executable_sql',
  on_missing_input JSONB NOT NULL DEFAULT '{}'::jsonb,
  authored_by TEXT NOT NULL,
  reviewed_by TEXT,
  effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  retired_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (query_ref, query_version),
  CHECK (query_ref <> ''),
  CHECK (query_version <> ''),
  CHECK (query_sql <> ''),
  CHECK (array_length(referenced_relations, 1) IS NOT NULL),
  CHECK (basis_mode = 'literal_snapshot' OR reviewed_by IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS registered_query_kind_idx
  ON operations.registered_query (query_kind, basis_mode)
  WHERE retired_at IS NULL;

CREATE TABLE IF NOT EXISTS operations.design_expectation (
  tenant_key TEXT NOT NULL,
  expectation_ref TEXT NOT NULL,
  contract_version TEXT NOT NULL,
  stage_name TEXT NOT NULL,
  object_kind TEXT NOT NULL,
  object_scope JSONB NOT NULL DEFAULT '{}'::jsonb,
  expectation_basis abarva_expectation_basis NOT NULL,
  expected_count BIGINT,
  expected_min BIGINT,
  expected_max BIGINT,
  basis_mode abarva_expectation_basis_mode NOT NULL DEFAULT 'executable_sql',
  basis_query_ref TEXT NOT NULL,
  basis_query_version TEXT NOT NULL DEFAULT 'v1',
  basis_pending_relation TEXT,
  basis_referenced_relations TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  stage_write_relations TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  basis_source_layer TEXT NOT NULL,
  stage_write_layer TEXT NOT NULL,
  tolerance_pct NUMERIC(6,4) NOT NULL DEFAULT 0,
  tolerance_reason TEXT,
  on_breach abarva_expectation_breach_action NOT NULL DEFAULT 'warn',
  absence_ref TEXT,
  implementation_scope TEXT NOT NULL DEFAULT 'active',
  scope_reason TEXT,
  authored_by TEXT NOT NULL,
  reviewed_by TEXT,
  effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  retired_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (tenant_key, expectation_ref),
  FOREIGN KEY (basis_query_ref, basis_query_version)
    REFERENCES operations.registered_query (query_ref, query_version),
  CHECK (tenant_key <> ''),
  CHECK (tenant_key <> 'all'),
  CHECK (tenant_key NOT LIKE '%*%'),
  CHECK (stage_name <> ''),
  CHECK (object_kind <> ''),
  CHECK (num_nonnulls(expected_count, expected_min, expected_max) >= 1),
  CHECK (basis_mode = 'executable_sql' OR basis_pending_relation IS NOT NULL),
  CHECK (array_length(basis_referenced_relations, 1) IS NOT NULL),
  CHECK (array_length(stage_write_relations, 1) IS NOT NULL),
  CHECK (NOT (basis_referenced_relations && stage_write_relations)),
  CHECK (basis_source_layer <> ''),
  CHECK (stage_write_layer <> ''),
  CHECK (basis_source_layer <> stage_write_layer),
  CHECK (expected_count IS NULL OR expected_count >= 0),
  CHECK (expected_min IS NULL OR expected_min >= 0),
  CHECK (expected_max IS NULL OR expected_max >= 0),
  CHECK (expected_min IS NULL OR expected_max IS NULL OR expected_min <= expected_max),
  CHECK (tolerance_pct >= 0),
  CHECK (implementation_scope IN ('active', 'out_of_scope', 'deferred')),
  CHECK (on_breach = 'warn' OR reviewed_by IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS design_expectation_active_scope_uidx
  ON operations.design_expectation (tenant_key, stage_name, object_kind, object_scope)
  WHERE retired_at IS NULL;

CREATE INDEX IF NOT EXISTS design_expectation_stage_idx
  ON operations.design_expectation (tenant_key, stage_name, object_kind);

CREATE INDEX IF NOT EXISTS design_expectation_breach_idx
  ON operations.design_expectation (tenant_key, on_breach, implementation_scope)
  WHERE retired_at IS NULL;

CREATE TABLE IF NOT EXISTS governance.conflict_assertion (
  tenant_key TEXT NOT NULL,
  conflict_ref TEXT NOT NULL,
  subject_ref TEXT NOT NULL,
  conflict_kind TEXT NOT NULL,
  resolution_state TEXT NOT NULL DEFAULT 'open',
  severity TEXT NOT NULL DEFAULT 'medium',
  positions JSONB NOT NULL,
  evidence_refs TEXT[] NOT NULL,
  blocked_computations TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  created_run_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (tenant_key, conflict_ref),
  CHECK (tenant_key <> ''),
  CHECK (tenant_key <> 'all'),
  CHECK (tenant_key NOT LIKE '%*%'),
  CHECK (conflict_ref <> ''),
  CHECK (subject_ref <> ''),
  CHECK (conflict_kind <> ''),
  CHECK (resolution_state IN ('open', 'resolved', 'accepted_exception', 'superseded')),
  CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  CHECK (jsonb_typeof(positions) = 'array' AND jsonb_array_length(positions) >= 2),
  CHECK (array_length(evidence_refs, 1) IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS conflict_assertion_subject_idx
  ON governance.conflict_assertion (tenant_key, subject_ref, resolution_state);

CREATE TABLE IF NOT EXISTS operations.claim_allowed_mapping (
  source_field_name TEXT NOT NULL,
  source_value TEXT NOT NULL,
  claim_allowed abarva_claim_allowed_state NOT NULL,
  claim_caveat TEXT,
  applies_to_sources TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (source_field_name, source_value),
  CHECK (source_field_name <> ''),
  CHECK (source_value <> ''),
  CHECK (claim_allowed <> 'partial' OR nullif(trim(claim_caveat), '') IS NOT NULL)
);

INSERT INTO operations.claim_allowed_mapping (
  source_field_name,
  source_value,
  claim_allowed,
  claim_caveat,
  applies_to_sources
) VALUES
  ('tower_claim_allowed', 'yes', 'allowed', NULL, ARRAY['SA08_AI_Benefits_Realization_Usage_Ledger.csv', 'SA11_AI_KPI_Operational_Outcome_Feed.csv']),
  ('tower_claim_allowed', 'partial', 'partial', 'Value may be rendered only with its source caveat and validation state.', ARRAY['SA08_AI_Benefits_Realization_Usage_Ledger.csv', 'SA11_AI_KPI_Operational_Outcome_Feed.csv']),
  ('tower_claim_allowed', 'no', 'blocked', NULL, ARRAY['SA08_AI_Benefits_Realization_Usage_Ledger.csv', 'SA11_AI_KPI_Operational_Outcome_Feed.csv']),
  ('realized_value_allowed', 'true', 'allowed', NULL, ARRAY['SA08_AI_Benefits_Realization_Usage_Ledger.csv']),
  ('realized_value_allowed', 'false', 'blocked', NULL, ARRAY['SA08_AI_Benefits_Realization_Usage_Ledger.csv'])
ON CONFLICT (source_field_name, source_value) DO UPDATE
SET claim_allowed = EXCLUDED.claim_allowed,
    claim_caveat = EXCLUDED.claim_caveat,
    applies_to_sources = EXCLUDED.applies_to_sources;

ALTER TABLE operations.checkpoint
  ADD COLUMN IF NOT EXISTS expectation_ref TEXT,
  ADD COLUMN IF NOT EXISTS expectation_basis abarva_expectation_basis,
  ADD COLUMN IF NOT EXISTS absence_ref TEXT;

CREATE INDEX IF NOT EXISTS checkpoint_expectation_idx
  ON operations.checkpoint (tenant_key, expectation_ref)
  WHERE expectation_ref IS NOT NULL;

CREATE TABLE IF NOT EXISTS operations.quality_snapshot (
  tenant_key TEXT NOT NULL,
  snapshot_ref TEXT NOT NULL,
  run_ref TEXT NOT NULL,
  stage_name TEXT NOT NULL,
  phase abarva_quality_snapshot_phase NOT NULL,
  object_kind TEXT NOT NULL,
  row_count BIGINT NOT NULL,
  distinct_natural_keys BIGINT,
  null_rate_by_required_column JSONB NOT NULL DEFAULT '{}'::jsonb,
  orphan_reference_count BIGINT NOT NULL DEFAULT 0,
  content_hash TEXT,
  detail JSONB NOT NULL DEFAULT '{}'::jsonb,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_key, snapshot_ref),
  FOREIGN KEY (tenant_key, run_ref) REFERENCES operations.run (tenant_key, run_ref),
  CHECK (tenant_key <> ''),
  CHECK (tenant_key <> 'all'),
  CHECK (tenant_key NOT LIKE '%*%'),
  CHECK (stage_name <> ''),
  CHECK (object_kind <> ''),
  CHECK (row_count >= 0),
  CHECK (distinct_natural_keys IS NULL OR distinct_natural_keys >= 0),
  CHECK (orphan_reference_count >= 0)
);

CREATE INDEX IF NOT EXISTS quality_snapshot_run_stage_idx
  ON operations.quality_snapshot (tenant_key, run_ref, stage_name, phase);

CREATE INDEX IF NOT EXISTS quality_snapshot_object_idx
  ON operations.quality_snapshot (tenant_key, stage_name, object_kind);

ALTER TABLE evidence.evidence_item
  ADD COLUMN IF NOT EXISTS natural_key TEXT,
  ADD COLUMN IF NOT EXISTS natural_key_basis JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE working.entity_candidate
  ADD COLUMN IF NOT EXISTS natural_key TEXT,
  ADD COLUMN IF NOT EXISTS natural_key_basis JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE working.fact_candidate
  ADD COLUMN IF NOT EXISTS natural_key TEXT,
  ADD COLUMN IF NOT EXISTS natural_key_basis JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE working.relationship_candidate
  ADD COLUMN IF NOT EXISTS natural_key TEXT,
  ADD COLUMN IF NOT EXISTS natural_key_basis JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS evidence_item_natural_key_idx
  ON evidence.evidence_item (tenant_key, source_version_ref, natural_key)
  WHERE natural_key IS NOT NULL;

-- Non-unique by design: the same natural key can appear across source
-- generations until supersession and generation scope are modeled.
CREATE INDEX IF NOT EXISTS entity_candidate_natural_key_idx
  ON working.entity_candidate (tenant_key, entity_type, natural_key)
  WHERE natural_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS fact_candidate_natural_key_idx
  ON working.fact_candidate (tenant_key, fact_type, natural_key)
  WHERE natural_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS relationship_candidate_natural_key_idx
  ON working.relationship_candidate (tenant_key, relationship_type_ref, natural_key)
  WHERE natural_key IS NOT NULL;

COMMIT;
