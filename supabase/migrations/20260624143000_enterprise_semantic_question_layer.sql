-- ENTERPRISE SEMANTIC QUESTION LAYER
-- Additive Azure/Postgres schema for universal plain-English Q&A.
-- Deterministic facts first; LLM narrative second.

BEGIN;

CREATE TABLE IF NOT EXISTS semantic_dimensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT,
  dimension_key TEXT NOT NULL,
  family_key TEXT NOT NULL,
  business_name TEXT NOT NULL,
  description TEXT NOT NULL,
  primary_grain TEXT NOT NULL,
  canonical_entity TEXT NOT NULL,
  default_source_table TEXT,
  default_search_index TEXT,
  owner_role TEXT,
  data_steward_role TEXT,
  freshness_field TEXT,
  confidence_rule TEXT NOT NULL,
  caveat_text TEXT NOT NULL DEFAULT '',
  is_global BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((is_global = true AND tenant_key IS NULL) OR (is_global = false AND tenant_key IS NOT NULL)),
  UNIQUE (tenant_key, dimension_key)
);

CREATE TABLE IF NOT EXISTS semantic_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT,
  dimension_id UUID NOT NULL REFERENCES semantic_dimensions(id) ON DELETE CASCADE,
  field_key TEXT NOT NULL,
  business_name TEXT NOT NULL,
  description TEXT NOT NULL,
  data_type TEXT NOT NULL,
  unit TEXT,
  source_table TEXT,
  source_column TEXT,
  allowed_filter BOOLEAN NOT NULL DEFAULT false,
  default_visible BOOLEAN NOT NULL DEFAULT true,
  sensitivity_classification TEXT NOT NULL DEFAULT 'internal',
  pii_phi_flag BOOLEAN NOT NULL DEFAULT false,
  citation_required BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, dimension_id, field_key)
);

CREATE TABLE IF NOT EXISTS semantic_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT,
  entity_key TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  business_name TEXT NOT NULL,
  description TEXT NOT NULL,
  source_table TEXT,
  primary_key_field TEXT,
  display_field TEXT,
  owner_field TEXT,
  freshness_field TEXT,
  is_global BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((is_global = true AND tenant_key IS NULL) OR (is_global = false AND tenant_key IS NOT NULL)),
  UNIQUE (tenant_key, entity_key)
);

CREATE TABLE IF NOT EXISTS semantic_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT,
  metric_key TEXT NOT NULL,
  business_name TEXT NOT NULL,
  description TEXT NOT NULL,
  formula_type TEXT NOT NULL CHECK (formula_type IN ('sql','expression','composite','external','manual')),
  formula_text TEXT NOT NULL,
  unit TEXT NOT NULL,
  default_grain TEXT NOT NULL,
  default_time_window TEXT,
  required_fields TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  confidence_rule TEXT NOT NULL,
  caveat_text TEXT NOT NULL DEFAULT '',
  finance_validated_flag BOOLEAN NOT NULL DEFAULT false,
  is_global BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((is_global = true AND tenant_key IS NULL) OR (is_global = false AND tenant_key IS NOT NULL)),
  UNIQUE (tenant_key, metric_key)
);

CREATE TABLE IF NOT EXISTS semantic_synonyms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT,
  synonym_text TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('dimension','field','metric','entity','filter','intent')),
  target_id UUID,
  target_key TEXT,
  confidence NUMERIC(4,3) NOT NULL DEFAULT 0.800 CHECK (confidence >= 0 AND confidence <= 1),
  source TEXT NOT NULL DEFAULT 'system_default' CHECK (source IN ('system_default','tenant_custom','user_feedback','imported')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, synonym_text, target_type, target_key)
);

CREATE TABLE IF NOT EXISTS semantic_metric_inputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_id UUID NOT NULL REFERENCES semantic_metrics(id) ON DELETE CASCADE,
  dimension_id UUID REFERENCES semantic_dimensions(id) ON DELETE CASCADE,
  field_id UUID REFERENCES semantic_fields(id) ON DELETE SET NULL,
  required BOOLEAN NOT NULL DEFAULT true,
  input_role TEXT NOT NULL CHECK (input_role IN ('numerator','denominator','filter','join_key','weight','adjustment','evidence')),
  default_value JSONB,
  missing_behavior TEXT NOT NULL DEFAULT 'block' CHECK (missing_behavior IN ('block','warn','fallback','estimate')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS semantic_metric_weights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_id UUID NOT NULL REFERENCES semantic_metrics(id) ON DELETE CASCADE,
  component_metric_id UUID REFERENCES semantic_metrics(id) ON DELETE SET NULL,
  component_name TEXT NOT NULL,
  weight NUMERIC(10,4) NOT NULL,
  normalization_method TEXT NOT NULL DEFAULT 'none',
  min_value NUMERIC,
  max_value NUMERIC,
  caveat_text TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (metric_id, component_name)
);

CREATE TABLE IF NOT EXISTS semantic_metric_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_id UUID NOT NULL REFERENCES semantic_metrics(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  formula_text TEXT NOT NULL,
  change_reason TEXT NOT NULL,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  effective_to TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (metric_id, version)
);

CREATE TABLE IF NOT EXISTS semantic_join_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT,
  join_key TEXT NOT NULL,
  from_dimension_id UUID NOT NULL REFERENCES semantic_dimensions(id) ON DELETE CASCADE,
  to_dimension_id UUID NOT NULL REFERENCES semantic_dimensions(id) ON DELETE CASCADE,
  from_table TEXT NOT NULL,
  to_table TEXT NOT NULL,
  from_column TEXT NOT NULL,
  to_column TEXT NOT NULL,
  join_type TEXT NOT NULL DEFAULT 'left' CHECK (join_type IN ('inner','left','right','full')),
  relationship_cardinality TEXT NOT NULL DEFAULT 'many_to_one',
  confidence_rule TEXT NOT NULL,
  caveat_text TEXT NOT NULL DEFAULT '',
  is_global BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((is_global = true AND tenant_key IS NULL) OR (is_global = false AND tenant_key IS NOT NULL)),
  UNIQUE (tenant_key, join_key)
);

CREATE TABLE IF NOT EXISTS semantic_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT,
  view_key TEXT NOT NULL,
  business_name TEXT NOT NULL,
  description TEXT NOT NULL,
  sql_definition TEXT NOT NULL,
  dimensions_supported TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  metrics_supported TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  refresh_mode TEXT NOT NULL DEFAULT 'live' CHECK (refresh_mode IN ('live','materialized','batch')),
  refresh_frequency TEXT,
  owner_role TEXT,
  is_global BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((is_global = true AND tenant_key IS NULL) OR (is_global = false AND tenant_key IS NOT NULL)),
  UNIQUE (tenant_key, view_key)
);

CREATE TABLE IF NOT EXISTS semantic_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  user_id TEXT,
  raw_question TEXT NOT NULL,
  normalized_question TEXT NOT NULL,
  intent_type TEXT NOT NULL,
  target_modules TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  target_dimensions TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  target_metrics TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  target_entities TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  filters_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  time_window TEXT,
  clarification_needed BOOLEAN NOT NULL DEFAULT false,
  clarification_question TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS semantic_query_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  question_id UUID REFERENCES semantic_questions(id) ON DELETE CASCADE,
  intent_type TEXT NOT NULL,
  selected_dimensions TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  selected_metrics TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  selected_filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  selected_join_paths TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  selected_view TEXT,
  generated_sql TEXT,
  planner_confidence NUMERIC(4,3) NOT NULL DEFAULT 0.000 CHECK (planner_confidence >= 0 AND planner_confidence <= 1),
  clarification_needed BOOLEAN NOT NULL DEFAULT false,
  unsupported_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS semantic_query_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  query_plan_id UUID REFERENCES semantic_query_plans(id) ON DELETE CASCADE,
  result_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  row_count INTEGER NOT NULL DEFAULT 0 CHECK (row_count >= 0),
  numeric_values_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  ranking_values_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  confidence_score NUMERIC(4,3) NOT NULL DEFAULT 0.000 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  caveats TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS semantic_evidence_refs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  query_result_id UUID REFERENCES semantic_query_results(id) ON DELETE SET NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('table','view','search_index','document','artifact','external_system','synthetic_demo')),
  source_table TEXT,
  source_record_id TEXT,
  source_file_id TEXT,
  source_url TEXT,
  source_section TEXT,
  source_sheet TEXT,
  source_row INTEGER CHECK (source_row IS NULL OR source_row > 0),
  excerpt_or_summary TEXT NOT NULL,
  freshness_at TIMESTAMPTZ,
  confidence_score NUMERIC(4,3) NOT NULL DEFAULT 0.000 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  synthetic_demo_flag BOOLEAN NOT NULL DEFAULT false,
  pii_phi_flag BOOLEAN NOT NULL DEFAULT false,
  citation_label TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS semantic_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  question_id UUID REFERENCES semantic_questions(id) ON DELETE CASCADE,
  query_plan_id UUID REFERENCES semantic_query_plans(id) ON DELETE SET NULL,
  answer_text TEXT NOT NULL,
  answer_summary TEXT NOT NULL,
  confidence_score NUMERIC(4,3) NOT NULL DEFAULT 0.000 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  caveat_text TEXT NOT NULL DEFAULT '',
  verification_status TEXT NOT NULL DEFAULT 'partial' CHECK (verification_status IN ('verified','warning','blocked','partial')),
  unsupported_reason TEXT,
  synthetic_demo_flag BOOLEAN NOT NULL DEFAULT false,
  generated_by TEXT NOT NULL DEFAULT 'enterprise_semantic_question_layer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS semantic_answer_citations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  answer_id UUID NOT NULL REFERENCES semantic_answers(id) ON DELETE CASCADE,
  claim_text TEXT NOT NULL,
  citation_id UUID NOT NULL REFERENCES semantic_evidence_refs(id) ON DELETE CASCADE,
  claim_type TEXT NOT NULL CHECK (claim_type IN ('numeric','ranking','summary','recommendation','caveat','definition')),
  verification_status TEXT NOT NULL CHECK (verification_status IN ('verified','warning','blocked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS semantic_evidence_quality (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  evidence_ref_id UUID NOT NULL REFERENCES semantic_evidence_refs(id) ON DELETE CASCADE,
  freshness_status TEXT NOT NULL CHECK (freshness_status IN ('current','stale','unknown','synthetic')),
  completeness_score NUMERIC(4,3) CHECK (completeness_score IS NULL OR (completeness_score >= 0 AND completeness_score <= 1)),
  confidence_score NUMERIC(4,3) CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1)),
  source_reliability TEXT NOT NULL DEFAULT 'unknown',
  caveat_text TEXT NOT NULL DEFAULT '',
  recommended_action TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (evidence_ref_id)
);

CREATE TABLE IF NOT EXISTS tenant_data_volumetrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  source_id UUID,
  source_type TEXT NOT NULL,
  dimension_key TEXT NOT NULL,
  family_key TEXT NOT NULL,
  evidence_type TEXT NOT NULL,
  record_count BIGINT NOT NULL DEFAULT 0 CHECK (record_count >= 0),
  entity_count BIGINT NOT NULL DEFAULT 0 CHECK (entity_count >= 0),
  distinct_application_count BIGINT NOT NULL DEFAULT 0 CHECK (distinct_application_count >= 0),
  distinct_process_count BIGINT NOT NULL DEFAULT 0 CHECK (distinct_process_count >= 0),
  distinct_vendor_count BIGINT NOT NULL DEFAULT 0 CHECK (distinct_vendor_count >= 0),
  distinct_owner_count BIGINT NOT NULL DEFAULT 0 CHECK (distinct_owner_count >= 0),
  distinct_user_group_count BIGINT NOT NULL DEFAULT 0 CHECK (distinct_user_group_count >= 0),
  date_min TIMESTAMPTZ,
  date_max TIMESTAMPTZ,
  last_loaded_at TIMESTAMPTZ,
  last_refreshed_at TIMESTAMPTZ,
  freshness_status TEXT NOT NULL DEFAULT 'unknown' CHECK (freshness_status IN ('current','stale','unknown','synthetic')),
  coverage_status TEXT NOT NULL DEFAULT 'none' CHECK (coverage_status IN ('none','partial','sufficient','strong')),
  data_quality_score NUMERIC(4,3) CHECK (data_quality_score IS NULL OR (data_quality_score >= 0 AND data_quality_score <= 1)),
  completeness_score NUMERIC(4,3) CHECK (completeness_score IS NULL OR (completeness_score >= 0 AND completeness_score <= 1)),
  confidence_score NUMERIC(4,3) CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1)),
  synthetic_demo_flag BOOLEAN NOT NULL DEFAULT false,
  finance_validated_flag BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, source_type, dimension_key, evidence_type)
);

CREATE TABLE IF NOT EXISTS tenant_dimension_coverage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  dimension_key TEXT NOT NULL,
  family_key TEXT NOT NULL,
  available BOOLEAN NOT NULL DEFAULT false,
  queryable_structured BOOLEAN NOT NULL DEFAULT false,
  searchable_unstructured BOOLEAN NOT NULL DEFAULT false,
  metric_ready BOOLEAN NOT NULL DEFAULT false,
  citation_ready BOOLEAN NOT NULL DEFAULT false,
  answer_verification_ready BOOLEAN NOT NULL DEFAULT false,
  primary_source_type TEXT,
  primary_table_or_view TEXT,
  primary_search_index TEXT,
  record_count BIGINT NOT NULL DEFAULT 0,
  date_min TIMESTAMPTZ,
  date_max TIMESTAMPTZ,
  freshness_status TEXT NOT NULL DEFAULT 'unknown',
  confidence_score NUMERIC(4,3) CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1)),
  missing_required_fields TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  caveats TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  recommended_client_action TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, dimension_key)
);

CREATE TABLE IF NOT EXISTS tenant_metric_coverage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  metric_key TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  computable BOOLEAN NOT NULL DEFAULT false,
  required_fields_available BOOLEAN NOT NULL DEFAULT false,
  source_data_available BOOLEAN NOT NULL DEFAULT false,
  required_join_paths_available BOOLEAN NOT NULL DEFAULT false,
  citation_ready BOOLEAN NOT NULL DEFAULT false,
  finance_validated_flag BOOLEAN NOT NULL DEFAULT false,
  fallback_used BOOLEAN NOT NULL DEFAULT false,
  fallback_reason TEXT,
  confidence_score NUMERIC(4,3) CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1)),
  caveats TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  last_computed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, metric_key)
);

CREATE TABLE IF NOT EXISTS tenant_question_readiness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  question_pattern TEXT NOT NULL,
  intent_type TEXT NOT NULL,
  required_dimensions TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  required_metrics TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  required_sources TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  readiness_status TEXT NOT NULL DEFAULT 'not_answerable' CHECK (readiness_status IN ('answerable','partially_answerable','not_answerable','needs_clarification')),
  confidence_score NUMERIC(4,3) CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1)),
  missing_data TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  caveat_text TEXT NOT NULL DEFAULT '',
  suggested_next_action TEXT,
  example_answer_available BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, question_pattern)
);

CREATE TABLE IF NOT EXISTS semantic_answer_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  answer_id UUID NOT NULL REFERENCES semantic_answers(id) ON DELETE CASCADE,
  verification_type TEXT NOT NULL CHECK (verification_type IN ('numeric','citation','metric_definition','ranking','freshness','permission','synthetic_label')),
  status TEXT NOT NULL CHECK (status IN ('passed','warning','failed')),
  issue TEXT,
  recommended_fix TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS semantic_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  answer_id UUID REFERENCES semantic_answers(id) ON DELETE SET NULL,
  question_id UUID REFERENCES semantic_questions(id) ON DELETE SET NULL,
  user_id TEXT,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('incorrect_answer','wrong_metric','bad_synonym','missing_data','useful','not_useful','correction')),
  feedback_text TEXT NOT NULL,
  proposed_synonym TEXT,
  proposed_definition TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewed','applied','rejected')),
  reviewed_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS semantic_catalog_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('synonym','metric','dimension','field','join','caveat','owner','freshness_rule')),
  target_id UUID,
  proposed_change JSONB NOT NULL DEFAULT '{}'::jsonb,
  reason TEXT NOT NULL,
  requested_by TEXT,
  approval_status TEXT NOT NULL DEFAULT 'open' CHECK (approval_status IN ('open','approved','rejected','applied')),
  approved_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS semantic_module_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  module TEXT NOT NULL CHECK (module IN ('home','moves','source','control_tower','tower','ava','intelligence','context_layer_admin')),
  object_type TEXT,
  object_id TEXT,
  question_id UUID REFERENCES semantic_questions(id) ON DELETE SET NULL,
  answer_id UUID REFERENCES semantic_answers(id) ON DELETE SET NULL,
  used_for TEXT NOT NULL CHECK (used_for IN ('display','artifact_context','decision_support','readiness','export','recommendation')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_semantic_dimensions_key ON semantic_dimensions(tenant_key, dimension_key);
CREATE UNIQUE INDEX IF NOT EXISTS idx_semantic_dimensions_global_key ON semantic_dimensions(dimension_key) WHERE is_global = true;
CREATE INDEX IF NOT EXISTS idx_semantic_fields_dimension ON semantic_fields(dimension_id);
CREATE INDEX IF NOT EXISTS idx_semantic_synonyms_text ON semantic_synonyms(tenant_key, lower(synonym_text));
CREATE INDEX IF NOT EXISTS idx_semantic_metrics_key ON semantic_metrics(tenant_key, metric_key);
CREATE UNIQUE INDEX IF NOT EXISTS idx_semantic_metrics_global_key ON semantic_metrics(metric_key) WHERE is_global = true;
CREATE UNIQUE INDEX IF NOT EXISTS idx_semantic_entities_global_key ON semantic_entities(entity_key) WHERE is_global = true;
CREATE INDEX IF NOT EXISTS idx_semantic_join_paths_key ON semantic_join_paths(tenant_key, join_key);
CREATE UNIQUE INDEX IF NOT EXISTS idx_semantic_join_paths_global_key ON semantic_join_paths(join_key) WHERE is_global = true;
CREATE UNIQUE INDEX IF NOT EXISTS idx_semantic_views_global_key ON semantic_views(view_key) WHERE is_global = true;
CREATE INDEX IF NOT EXISTS idx_semantic_questions_tenant_created ON semantic_questions(tenant_key, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_semantic_answers_tenant_created ON semantic_answers(tenant_key, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_semantic_evidence_refs_source ON semantic_evidence_refs(tenant_key, source_type, source_table, source_record_id);
CREATE INDEX IF NOT EXISTS idx_tenant_data_volumetrics_lookup ON tenant_data_volumetrics(tenant_key, source_type, dimension_key, evidence_type);
CREATE INDEX IF NOT EXISTS idx_tenant_dimension_coverage_lookup ON tenant_dimension_coverage(tenant_key, dimension_key);
CREATE INDEX IF NOT EXISTS idx_tenant_metric_coverage_lookup ON tenant_metric_coverage(tenant_key, metric_key);
CREATE INDEX IF NOT EXISTS idx_tenant_question_readiness_lookup ON tenant_question_readiness(tenant_key, readiness_status);
CREATE INDEX IF NOT EXISTS idx_semantic_module_usage_lookup ON semantic_module_usage(tenant_key, module, used_for, created_at DESC);

CREATE OR REPLACE VIEW tenant_context_inventory_vw AS
SELECT
  tenant_key,
  source_type,
  dimension_key,
  family_key,
  evidence_type,
  record_count,
  date_min,
  date_max,
  freshness_status,
  coverage_status,
  confidence_score,
  synthetic_demo_flag,
  finance_validated_flag
FROM tenant_data_volumetrics;

CREATE OR REPLACE VIEW tenant_dimension_readiness_vw AS
SELECT
  tenant_key,
  dimension_key,
  available,
  queryable_structured,
  metric_ready,
  citation_ready,
  answer_verification_ready,
  record_count,
  freshness_status,
  confidence_score,
  caveats,
  recommended_client_action
FROM tenant_dimension_coverage;

CREATE OR REPLACE VIEW tenant_metric_readiness_vw AS
SELECT
  tenant_key,
  metric_key,
  computable,
  confidence_score,
  fallback_used,
  finance_validated_flag,
  caveats,
  last_computed_at
FROM tenant_metric_coverage;

CREATE OR REPLACE VIEW tenant_question_readiness_vw AS
SELECT
  tenant_key,
  question_pattern,
  readiness_status,
  missing_data,
  confidence_score,
  suggested_next_action
FROM tenant_question_readiness;

DO $$
DECLARE
  tenant_table TEXT;
BEGIN
  FOREACH tenant_table IN ARRAY ARRAY[
    'semantic_dimensions',
    'semantic_fields',
    'semantic_entities',
    'semantic_metrics',
    'semantic_synonyms',
    'semantic_join_paths',
    'semantic_views',
    'semantic_questions',
    'semantic_query_plans',
    'semantic_query_results',
    'semantic_evidence_refs',
    'semantic_answers',
    'semantic_answer_citations',
    'semantic_evidence_quality',
    'tenant_data_volumetrics',
    'tenant_dimension_coverage',
    'tenant_metric_coverage',
    'tenant_question_readiness',
    'semantic_answer_verification',
    'semantic_feedback',
    'semantic_catalog_change_requests',
    'semantic_module_usage'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tenant_table);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', tenant_table || '_service_role_all', tenant_table);
    EXECUTE format('CREATE POLICY %I ON %I FOR ALL TO service_role USING (true) WITH CHECK (true)', tenant_table || '_service_role_all', tenant_table);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', tenant_table || '_authenticated_read', tenant_table);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR SELECT TO authenticated USING (tenant_key IS NULL OR can_read_tenant_by_key(tenant_key))',
      tenant_table || '_authenticated_read',
      tenant_table
    );
    EXECUTE format('GRANT SELECT ON %I TO authenticated', tenant_table);
  END LOOP;
END $$;

GRANT SELECT ON tenant_context_inventory_vw TO authenticated;
GRANT SELECT ON tenant_dimension_readiness_vw TO authenticated;
GRANT SELECT ON tenant_metric_readiness_vw TO authenticated;
GRANT SELECT ON tenant_question_readiness_vw TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
