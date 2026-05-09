-- Knowledge Corpus Remediation · A1
-- Persisted canonical Industry AI pattern source of record.
--
-- Additive only:
-- - creates a new canonical table
-- - creates indexes and read policies
-- - does not mutate existing corpus rows
-- - does not backfill content

BEGIN;

CREATE TABLE IF NOT EXISTS canonical_industry_ai_patterns (
  canonical_id TEXT PRIMARY KEY,

  -- Identity
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  source_crosswalk JSONB NOT NULL DEFAULT '[]'::jsonb,
  source_systems TEXT[] NOT NULL DEFAULT '{}',
  source_ids TEXT[] NOT NULL DEFAULT '{}',
  version TEXT NOT NULL DEFAULT '1.0.0',
  schema_version TEXT NOT NULL DEFAULT '2026-05-09',
  content_hash TEXT,
  lifecycle_status TEXT NOT NULL DEFAULT 'draft'
    CHECK (lifecycle_status IN ('draft', 'reviewed', 'validated', 'deprecated')),
  owner TEXT NOT NULL DEFAULT 'abarva-corpus',
  last_reviewed_at TIMESTAMPTZ,

  -- Scope. Global patterns are platform corpus; tenant/private rows are overlays.
  visibility_scope TEXT NOT NULL DEFAULT 'global'
    CHECK (visibility_scope IN ('global', 'tenant', 'private')),
  tenant_key TEXT,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  CHECK (
    visibility_scope = 'global'
    OR tenant_key IS NOT NULL
    OR client_id IS NOT NULL
  ),

  -- Classification
  industry TEXT[] NOT NULL DEFAULT '{}'
    CHECK (industry <@ ARRAY[
      'retail',
      'healthcare',
      'financial_services',
      'cross_industry',
      'energy',
      'public_sector',
      'other'
    ]::TEXT[]),
  enterprise_area TEXT NOT NULL DEFAULT 'enterprise_platform'
    CHECK (enterprise_area IN ('front_office', 'middle_office', 'back_office', 'enterprise_platform')),
  function TEXT NOT NULL DEFAULT '',
  process_area TEXT NOT NULL DEFAULT '',
  use_case_category TEXT NOT NULL DEFAULT '',
  strategic_move_phases TEXT[] NOT NULL DEFAULT '{}'
    CHECK (strategic_move_phases <@ ARRAY[
      'originate',
      'charter',
      'diagnose_discover',
      'design',
      'roadmap_business_case_change_value_plan',
      'mobilize_handoff'
    ]::TEXT[]),
  maturity_level TEXT NOT NULL DEFAULT 'emerging'
    CHECK (maturity_level IN ('emerging', 'proven', 'scaled', 'experimental')),
  confidence_level TEXT NOT NULL DEFAULT 'low'
    CHECK (confidence_level IN ('low', 'medium', 'high', 'validated')),

  -- Business context
  executive_question_answered TEXT NOT NULL DEFAULT '',
  target_personas TEXT[] NOT NULL DEFAULT '{}',
  business_problem TEXT NOT NULL DEFAULT '',
  why_now TEXT NOT NULL DEFAULT '',
  value_hypothesis TEXT NOT NULL DEFAULT '',
  primary_kpis TEXT[] NOT NULL DEFAULT '{}',
  secondary_kpis TEXT[] NOT NULL DEFAULT '{}',
  baseline_needed TEXT[] NOT NULL DEFAULT '{}',
  measurement_method TEXT NOT NULL DEFAULT '',
  value_levers TEXT[] NOT NULL DEFAULT '{}'
    CHECK (value_levers <@ ARRAY[
      'revenue_growth',
      'cost_takeout',
      'productivity',
      'risk_reduction',
      'experience',
      'speed_to_market',
      'working_capital',
      'quality',
      'compliance'
    ]::TEXT[]),
  time_to_value_band TEXT NOT NULL DEFAULT '',
  implementation_complexity TEXT NOT NULL DEFAULT 'unknown'
    CHECK (implementation_complexity IN ('low', 'medium', 'high', 'unknown')),

  -- Data and architecture
  required_data_domains TEXT[] NOT NULL DEFAULT '{}',
  data_quality_dependencies TEXT[] NOT NULL DEFAULT '{}',
  source_system_dependencies TEXT[] NOT NULL DEFAULT '{}',
  integration_dependencies TEXT[] NOT NULL DEFAULT '{}',
  vector_graph_semantic_dependencies TEXT[] NOT NULL DEFAULT '{}',
  agentic_architecture_pattern TEXT NOT NULL DEFAULT '',
  human_agent_workflow_design TEXT NOT NULL DEFAULT '',
  autonomous_agent_action_boundaries TEXT[] NOT NULL DEFAULT '{}',
  escalation_points TEXT[] NOT NULL DEFAULT '{}',
  responsible_ai_guardrails TEXT[] NOT NULL DEFAULT '{}',

  -- Operating model
  operating_model_changes TEXT[] NOT NULL DEFAULT '{}',
  change_management_needs TEXT[] NOT NULL DEFAULT '{}',
  recommended_workshops TEXT[] NOT NULL DEFAULT '{}',
  recommended_artifacts TEXT[] NOT NULL DEFAULT '{}',
  entry_criteria TEXT[] NOT NULL DEFAULT '{}',
  exit_criteria TEXT[] NOT NULL DEFAULT '{}',
  gate_evidence_required TEXT[] NOT NULL DEFAULT '{}',

  -- Risk and failure
  common_failure_modes TEXT[] NOT NULL DEFAULT '{}',
  anti_patterns TEXT[] NOT NULL DEFAULT '{}',
  intervention_options TEXT[] NOT NULL DEFAULT '{}',
  failure_mode_mitigations TEXT[] NOT NULL DEFAULT '{}',

  -- Provenance
  source_basis TEXT NOT NULL DEFAULT 'unknown'
    CHECK (source_basis IN (
      'internal_pattern',
      'public_research',
      'inferred_from_patterns',
      'user_seeded',
      'tenant_evidence',
      'synthetic_seed',
      'unknown'
    )),
  source_references JSONB NOT NULL DEFAULT '[]'::jsonb,
  confidence_rationale TEXT NOT NULL DEFAULT '',
  quantitative_claims JSONB NOT NULL DEFAULT '[]'::jsonb,
  unsupported_claim_flags JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Full canonical payload and draft-state diagnostics. These keep the table
  -- forward-compatible while the canonical field set evolves.
  full_pattern JSONB NOT NULL DEFAULT '{}'::jsonb,
  missing_required_fields TEXT[] NOT NULL DEFAULT '{}',
  missing_provenance BOOLEAN NOT NULL DEFAULT true,
  duplicate_risk TEXT
    CHECK (duplicate_risk IS NULL OR duplicate_risk IN ('low', 'medium', 'high')),
  source_snapshot_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT,
  updated_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_canonical_ai_patterns_industry
  ON canonical_industry_ai_patterns USING gin(industry);

CREATE INDEX IF NOT EXISTS idx_canonical_ai_patterns_phases
  ON canonical_industry_ai_patterns USING gin(strategic_move_phases);

CREATE INDEX IF NOT EXISTS idx_canonical_ai_patterns_value_levers
  ON canonical_industry_ai_patterns USING gin(value_levers);

CREATE INDEX IF NOT EXISTS idx_canonical_ai_patterns_source_systems
  ON canonical_industry_ai_patterns USING gin(source_systems);

CREATE INDEX IF NOT EXISTS idx_canonical_ai_patterns_source_ids
  ON canonical_industry_ai_patterns USING gin(source_ids);

CREATE INDEX IF NOT EXISTS idx_canonical_ai_patterns_source_crosswalk
  ON canonical_industry_ai_patterns USING gin(source_crosswalk);

CREATE INDEX IF NOT EXISTS idx_canonical_ai_patterns_content_hash
  ON canonical_industry_ai_patterns(content_hash)
  WHERE content_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_canonical_ai_patterns_full_pattern
  ON canonical_industry_ai_patterns USING gin(full_pattern);

CREATE INDEX IF NOT EXISTS idx_canonical_ai_patterns_scope_tenant
  ON canonical_industry_ai_patterns(visibility_scope, tenant_key);

CREATE INDEX IF NOT EXISTS idx_canonical_ai_patterns_client
  ON canonical_industry_ai_patterns(client_id)
  WHERE client_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_canonical_ai_patterns_classification
  ON canonical_industry_ai_patterns(
    enterprise_area,
    function,
    process_area,
    use_case_category,
    confidence_level,
    lifecycle_status
  );

CREATE INDEX IF NOT EXISTS idx_canonical_ai_patterns_fts
  ON canonical_industry_ai_patterns
  USING gin(to_tsvector(
    'english',
    coalesce(title, '') || ' ' ||
    coalesce(summary, '') || ' ' ||
    coalesce(function, '') || ' ' ||
    coalesce(process_area, '') || ' ' ||
    coalesce(use_case_category, '') || ' ' ||
    coalesce(business_problem, '') || ' ' ||
    coalesce(value_hypothesis, '')
  ));

DROP TRIGGER IF EXISTS canonical_industry_ai_patterns_set_updated_at
  ON canonical_industry_ai_patterns;
CREATE TRIGGER canonical_industry_ai_patterns_set_updated_at
  BEFORE UPDATE ON canonical_industry_ai_patterns
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE canonical_industry_ai_patterns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_canonical_industry_ai_patterns"
  ON canonical_industry_ai_patterns;
CREATE POLICY "service_role_all_canonical_industry_ai_patterns"
  ON canonical_industry_ai_patterns
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_read_canonical_industry_ai_patterns"
  ON canonical_industry_ai_patterns;
CREATE POLICY "authenticated_read_canonical_industry_ai_patterns"
  ON canonical_industry_ai_patterns
  FOR SELECT TO authenticated
  USING (
    visibility_scope = 'global'
    OR (tenant_key IS NOT NULL AND can_read_tenant_by_key(tenant_key))
    OR (client_id IS NOT NULL AND can_read_tenant_by_id(client_id))
  );

GRANT SELECT ON canonical_industry_ai_patterns TO authenticated;

COMMENT ON TABLE canonical_industry_ai_patterns IS
  'Persisted canonical source of record for Industry AI patterns. Backfills are separate reviewed operations.';
COMMENT ON COLUMN canonical_industry_ai_patterns.full_pattern IS
  'Full canonical IndustryAIPattern payload used for forward-compatible reads and migration validation.';
COMMENT ON COLUMN canonical_industry_ai_patterns.missing_required_fields IS
  'Draft diagnostics from canonical builders; empty for complete reviewed records.';
COMMENT ON COLUMN canonical_industry_ai_patterns.missing_provenance IS
  'True when source_basis or confidence_rationale is missing or insufficient.';

NOTIFY pgrst, 'reload schema';

COMMIT;
