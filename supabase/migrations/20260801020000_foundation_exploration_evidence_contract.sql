-- Foundation V2 exploration evidence contract.
-- Additive migration only: creates lower-layer evidence records and derived
-- exploration projections. It does not insert tenant facts.

BEGIN;

CREATE SCHEMA IF NOT EXISTS evidence;
CREATE SCHEMA IF NOT EXISTS consumption;
CREATE SCHEMA IF NOT EXISTS governance;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'abarva_source_disposition') THEN
    CREATE TYPE abarva_source_disposition AS ENUM (
      'persisted_raw',
      'parsed_to_evidence',
      'mapped_to_candidate',
      'promoted_to_canonical',
      'projected_to_consumption',
      'deferred_by_review',
      'quarantined_invalid',
      'not_applicable_by_contract',
      'blocked_missing_mapping'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'abarva_exploration_grounding_state') THEN
    CREATE TYPE abarva_exploration_grounding_state AS ENUM (
      'source_grounded',
      'partially_grounded',
      'ungrounded_blocked',
      'not_generated'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS evidence.source_row_v1 (
  tenant_key TEXT NOT NULL,
  source_row_ref TEXT NOT NULL,
  source_ref TEXT NOT NULL,
  source_version_ref TEXT NOT NULL,
  source_family TEXT NOT NULL,
  source_name TEXT NOT NULL,
  parser_contract_ref TEXT,
  sheet_name TEXT,
  row_number INTEGER,
  source_native_id TEXT,
  row_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  row_text TEXT,
  row_hash TEXT NOT NULL,
  non_empty_field_count INTEGER NOT NULL DEFAULT 0,
  review_state abarva_review_state NOT NULL DEFAULT 'not_reviewed',
  disposition abarva_source_disposition NOT NULL DEFAULT 'parsed_to_evidence',
  disposition_reason TEXT,
  visibility TEXT NOT NULL DEFAULT 'client_visible',
  allowed_use TEXT NOT NULL DEFAULT 'exploration',
  evidence_refs TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  candidate_refs TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  canonical_refs TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  consumption_refs TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  created_run_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_key, source_version_ref, source_row_ref),
  FOREIGN KEY (tenant_key, source_version_ref)
    REFERENCES source_registry.source_version (tenant_key, source_version_ref),
  CHECK (tenant_key <> ''),
  CHECK (tenant_key <> 'all'),
  CHECK (tenant_key NOT LIKE '%*%'),
  CHECK (non_empty_field_count >= 0),
  CHECK (visibility IN ('client_visible', 'restricted', 'internal_ops')),
  CHECK (allowed_use IN ('exploration', 'canonical_candidate', 'restricted_exploration', 'blocked'))
);

CREATE TABLE IF NOT EXISTS evidence.source_field_v1 (
  tenant_key TEXT NOT NULL,
  source_field_ref TEXT NOT NULL,
  source_row_ref TEXT NOT NULL,
  source_ref TEXT NOT NULL,
  source_version_ref TEXT NOT NULL,
  source_family TEXT NOT NULL,
  source_name TEXT NOT NULL,
  parser_contract_ref TEXT,
  sheet_name TEXT,
  row_number INTEGER,
  field_name TEXT NOT NULL,
  field_ordinal INTEGER,
  raw_value_text TEXT,
  normalized_value_text TEXT,
  raw_value_hash TEXT NOT NULL,
  normalized_value_hash TEXT,
  is_empty BOOLEAN NOT NULL DEFAULT false,
  review_state abarva_review_state NOT NULL DEFAULT 'not_reviewed',
  disposition abarva_source_disposition NOT NULL DEFAULT 'parsed_to_evidence',
  disposition_reason TEXT,
  mapped_object_kind TEXT,
  mapped_target_ref TEXT,
  mapping_rule_ref TEXT,
  evidence_refs TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  candidate_refs TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  canonical_refs TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  consumption_refs TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  created_run_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_key, source_version_ref, source_field_ref),
  FOREIGN KEY (tenant_key, source_version_ref, source_row_ref)
    REFERENCES evidence.source_row_v1 (tenant_key, source_version_ref, source_row_ref)
    ON DELETE CASCADE,
  CHECK (tenant_key <> ''),
  CHECK (tenant_key <> 'all'),
  CHECK (tenant_key NOT LIKE '%*%'),
  CHECK (field_name <> '')
);

CREATE TABLE IF NOT EXISTS evidence.source_chunk_v1 (
  tenant_key TEXT NOT NULL,
  source_chunk_ref TEXT NOT NULL,
  source_row_ref TEXT,
  source_ref TEXT NOT NULL,
  source_version_ref TEXT NOT NULL,
  source_family TEXT NOT NULL,
  source_name TEXT NOT NULL,
  parser_contract_ref TEXT,
  chunk_kind TEXT NOT NULL DEFAULT 'row',
  chunk_ordinal INTEGER NOT NULL DEFAULT 1,
  chunk_text TEXT NOT NULL,
  chunk_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  chunk_hash TEXT NOT NULL,
  evidence_refs TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  allowed_use TEXT NOT NULL DEFAULT 'retrieval',
  grounding_state abarva_exploration_grounding_state NOT NULL DEFAULT 'source_grounded',
  created_run_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_key, source_version_ref, source_chunk_ref),
  FOREIGN KEY (tenant_key, source_version_ref)
    REFERENCES source_registry.source_version (tenant_key, source_version_ref),
  CHECK (tenant_key <> ''),
  CHECK (tenant_key <> 'all'),
  CHECK (tenant_key NOT LIKE '%*%'),
  CHECK (chunk_kind IN ('row', 'field_group', 'worksheet', 'document_section', 'generated_context')),
  CHECK (allowed_use IN ('retrieval', 'restricted_retrieval', 'blocked'))
);

CREATE TABLE IF NOT EXISTS evidence.source_disposition_ledger_v1 (
  tenant_key TEXT NOT NULL,
  disposition_ref TEXT NOT NULL,
  source_version_ref TEXT NOT NULL,
  source_row_ref TEXT,
  source_field_ref TEXT,
  source_chunk_ref TEXT,
  source_family TEXT NOT NULL,
  source_name TEXT NOT NULL,
  object_grain TEXT NOT NULL,
  disposition abarva_source_disposition NOT NULL,
  disposition_reason TEXT,
  from_state TEXT,
  to_state TEXT,
  mapped_object_kind TEXT,
  mapped_target_schema TEXT,
  mapped_target_ref TEXT,
  review_state abarva_review_state NOT NULL DEFAULT 'not_reviewed',
  evidence_refs TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  candidate_refs TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  canonical_refs TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  consumption_refs TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  run_ref TEXT,
  content_hash TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_key, disposition_ref),
  FOREIGN KEY (tenant_key, source_version_ref)
    REFERENCES source_registry.source_version (tenant_key, source_version_ref),
  CHECK (tenant_key <> ''),
  CHECK (tenant_key <> 'all'),
  CHECK (tenant_key NOT LIKE '%*%'),
  CHECK (object_grain IN ('file', 'row', 'field', 'chunk', 'candidate', 'canonical', 'consumption'))
);

CREATE TABLE IF NOT EXISTS consumption.source_evidence_exploration_v1 (
  tenant_key TEXT NOT NULL,
  exploration_ref TEXT NOT NULL,
  source_version_ref TEXT NOT NULL,
  source_row_ref TEXT NOT NULL,
  source_family TEXT NOT NULL,
  source_name TEXT NOT NULL,
  object_kind TEXT NOT NULL DEFAULT 'source_row',
  display_name TEXT NOT NULL,
  review_state abarva_review_state NOT NULL DEFAULT 'not_reviewed',
  disposition abarva_source_disposition NOT NULL,
  authority_state abarva_authority_state NOT NULL DEFAULT 'candidate',
  availability_state abarva_availability_state NOT NULL DEFAULT 'candidate',
  grounding_state abarva_exploration_grounding_state NOT NULL DEFAULT 'source_grounded',
  evidence_refs TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  candidate_refs TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  canonical_refs TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  source_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  projection_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  content_hash TEXT NOT NULL,
  created_run_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_key, exploration_ref),
  FOREIGN KEY (tenant_key, source_version_ref, source_row_ref)
    REFERENCES evidence.source_row_v1 (tenant_key, source_version_ref, source_row_ref)
);

CREATE TABLE IF NOT EXISTS consumption.application_exploration_v1 (
  tenant_key TEXT NOT NULL,
  application_exploration_ref TEXT NOT NULL,
  source_version_ref TEXT NOT NULL,
  source_row_ref TEXT NOT NULL,
  application_source_id TEXT,
  application_name TEXT NOT NULL,
  owner_ref TEXT,
  vendor_ref TEXT,
  lifecycle_state TEXT,
  criticality TEXT,
  review_state abarva_review_state NOT NULL DEFAULT 'not_reviewed',
  disposition abarva_source_disposition NOT NULL,
  canonical_entity_ref TEXT,
  evidence_refs TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  source_field_refs TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  generated_synthesis_refs TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  source_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  projection_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  content_hash TEXT NOT NULL,
  created_run_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_key, application_exploration_ref),
  FOREIGN KEY (tenant_key, source_version_ref, source_row_ref)
    REFERENCES evidence.source_row_v1 (tenant_key, source_version_ref, source_row_ref)
);

CREATE TABLE IF NOT EXISTS consumption.interview_exploration_v1 (
  tenant_key TEXT NOT NULL,
  interview_exploration_ref TEXT NOT NULL,
  source_version_ref TEXT NOT NULL,
  source_row_ref TEXT NOT NULL,
  interview_source_id TEXT,
  stakeholder_role TEXT,
  interview_track TEXT,
  question TEXT,
  answer_summary TEXT,
  priority_theme TEXT,
  pain_point TEXT,
  evidence_request TEXT,
  review_state abarva_review_state NOT NULL DEFAULT 'not_reviewed',
  disposition abarva_source_disposition NOT NULL,
  canonical_entity_ref TEXT,
  evidence_refs TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  source_field_refs TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  generated_synthesis_refs TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  source_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  projection_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  content_hash TEXT NOT NULL,
  created_run_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_key, interview_exploration_ref),
  FOREIGN KEY (tenant_key, source_version_ref, source_row_ref)
    REFERENCES evidence.source_row_v1 (tenant_key, source_version_ref, source_row_ref)
);

CREATE TABLE IF NOT EXISTS consumption.generated_synthesis_v1 (
  tenant_key TEXT NOT NULL,
  synthesis_ref TEXT NOT NULL,
  synthesis_kind TEXT NOT NULL,
  subject_ref TEXT NOT NULL,
  subject_kind TEXT NOT NULL,
  source_version_refs TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  source_row_refs TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  source_field_refs TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  evidence_refs TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  prompt_version TEXT NOT NULL,
  model_name TEXT NOT NULL,
  model_provider TEXT NOT NULL DEFAULT 'anthropic',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  generated_text TEXT NOT NULL,
  generated_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  grounding_state abarva_exploration_grounding_state NOT NULL,
  review_state abarva_review_state NOT NULL DEFAULT 'not_reviewed',
  allowed_use TEXT NOT NULL DEFAULT 'exploration',
  confidence NUMERIC(5,4),
  content_hash TEXT NOT NULL,
  created_run_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_key, synthesis_ref),
  CHECK (tenant_key <> ''),
  CHECK (tenant_key <> 'all'),
  CHECK (tenant_key NOT LIKE '%*%'),
  CHECK (synthesis_kind IN ('application_summary', 'interview_theme', 'domain_theme', 'evidence_gap_summary', 'search_summary')),
  CHECK (allowed_use IN ('exploration', 'restricted_exploration', 'blocked')),
  CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1))
);

CREATE INDEX IF NOT EXISTS source_row_v1_source_idx
  ON evidence.source_row_v1 (tenant_key, source_ref, source_version_ref, row_number);
CREATE INDEX IF NOT EXISTS source_row_v1_family_idx
  ON evidence.source_row_v1 (tenant_key, source_family, disposition, review_state);
CREATE INDEX IF NOT EXISTS source_field_v1_row_idx
  ON evidence.source_field_v1 (tenant_key, source_version_ref, source_row_ref);
CREATE INDEX IF NOT EXISTS source_field_v1_name_idx
  ON evidence.source_field_v1 (tenant_key, source_family, field_name, disposition);
CREATE INDEX IF NOT EXISTS source_chunk_v1_source_idx
  ON evidence.source_chunk_v1 (tenant_key, source_version_ref, chunk_kind);
CREATE INDEX IF NOT EXISTS source_disposition_ledger_v1_source_idx
  ON evidence.source_disposition_ledger_v1 (tenant_key, source_version_ref, object_grain, disposition);
CREATE INDEX IF NOT EXISTS source_evidence_exploration_v1_source_idx
  ON consumption.source_evidence_exploration_v1 (tenant_key, source_family, disposition, review_state);
CREATE INDEX IF NOT EXISTS application_exploration_v1_name_idx
  ON consumption.application_exploration_v1 (tenant_key, application_name, disposition, review_state);
CREATE INDEX IF NOT EXISTS interview_exploration_v1_role_idx
  ON consumption.interview_exploration_v1 (tenant_key, stakeholder_role, disposition, review_state);
CREATE INDEX IF NOT EXISTS generated_synthesis_v1_subject_idx
  ON consumption.generated_synthesis_v1 (tenant_key, subject_kind, subject_ref, synthesis_kind);

DO $$
DECLARE
  table_row RECORD;
  policy_name TEXT;
BEGIN
  FOR table_row IN
    SELECT table_schema, table_name
    FROM information_schema.columns
    WHERE column_name = 'tenant_key'
      AND table_schema IN ('evidence', 'consumption')
      AND table_name IN (
        'source_row_v1',
        'source_field_v1',
        'source_chunk_v1',
        'source_disposition_ledger_v1',
        'source_evidence_exploration_v1',
        'application_exploration_v1',
        'interview_exploration_v1',
        'generated_synthesis_v1'
      )
    GROUP BY table_schema, table_name
  LOOP
    policy_name :=
      left(table_row.table_schema || '_' || table_row.table_name || '_tenant_rls', 54)
      || '_'
      || substr(md5(table_row.table_schema || '.' || table_row.table_name), 1, 8);

    EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', table_row.table_schema, table_row.table_name);
    EXECUTE format('ALTER TABLE %I.%I FORCE ROW LEVEL SECURITY', table_row.table_schema, table_row.table_name);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', policy_name, table_row.table_schema, table_row.table_name);
    EXECUTE format(
      'CREATE POLICY %I ON %I.%I FOR ALL USING (governance.can_access_tenant(tenant_key)) WITH CHECK (governance.can_access_tenant(tenant_key))',
      policy_name,
      table_row.table_schema,
      table_row.table_name
    );
  END LOOP;
END $$;

COMMIT;
