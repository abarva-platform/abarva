-- CIO Tower schema v1
-- Purpose:
--   Replacement data contract for the Tower module after sunsetting the old
--   public.tower_*, public.ai_control_*, and public.semantic2_tower_* layers.
--
-- Naming convention:
--   All new Tower-owned Azure/Postgres objects live in the dedicated
--   cio_tower schema. Do not recreate public.tower_* or public.ai_control_*.

CREATE SCHEMA IF NOT EXISTS cio_tower;

CREATE TABLE IF NOT EXISTS cio_tower.source_registry (
  source_key text PRIMARY KEY,
  tenant_key text NOT NULL,
  source_system text NOT NULL,
  source_file text NOT NULL,
  source_kind text NOT NULL DEFAULT 'file',
  source_version text,
  upload_run_id text,
  loaded_at timestamptz NOT NULL DEFAULT now(),
  freshness_date date,
  trust_tier text NOT NULL DEFAULT 'synthetic_demo'
    CHECK (trust_tier IN ('client_attested', 'system_export', 'synthetic_demo', 'derived', 'unknown')),
  row_count integer,
  checksum text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS cio_tower.entities (
  entity_key text PRIMARY KEY,
  tenant_key text NOT NULL,
  entity_type text NOT NULL
    CHECK (entity_type IN (
      'holding_company',
      'portfolio_company',
      'initiative',
      'vendor',
      'contract',
      'system',
      'application',
      'platform',
      'org_unit',
      'business_function',
      'capability',
      'kpi',
      'risk',
      'value_lever'
    )),
  display_name text NOT NULL,
  parent_entity_key text REFERENCES cio_tower.entities(entity_key) ON DELETE SET NULL,
  source_key text REFERENCES cio_tower.source_registry(source_key) ON DELETE SET NULL,
  source_row text,
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, entity_type, display_name)
);

CREATE TABLE IF NOT EXISTS cio_tower.facts (
  fact_key text PRIMARY KEY,
  tenant_key text NOT NULL,
  entity_key text REFERENCES cio_tower.entities(entity_key) ON DELETE SET NULL,
  entity_type text,
  measure text NOT NULL,
  scope text NOT NULL
    CHECK (scope IN (
      'enterprise_envelope',
      'portfolio_company',
      'shared_services',
      'contract',
      'initiative',
      'system',
      'vendor',
      'kpi',
      'other'
    )),
  view text NOT NULL
    CHECK (view IN (
      'it_budget',
      'vendor_contract',
      'app_run_cost',
      'org_budget',
      'initiative_budget',
      'value',
      'operational_kpi',
      'adoption',
      'risk'
    )),
  amount_type text NOT NULL DEFAULT 'none'
    CHECK (amount_type IN ('opex', 'capex', 'run', 'change', 'none')),
  basis text NOT NULL DEFAULT 'committed'
    CHECK (basis IN ('committed', 'actual', 'forecast', 'baseline', 'target')),
  period text NOT NULL,
  value_numeric numeric,
  value_text text,
  value_date date,
  value_bool boolean,
  unit text NOT NULL DEFAULT 'none'
    CHECK (unit IN ('usd', 'pct', 'count', 'date', 'text', 'bool', 'ratio', 'none')),
  value_source text NOT NULL
    CHECK (value_source IN ('tenant_file', 'synthetic', 'derived', 'not_loaded')),
  confidence text NOT NULL DEFAULT 'medium'
    CHECK (confidence IN ('high', 'medium', 'low', 'not_loaded')),
  source_key text REFERENCES cio_tower.source_registry(source_key) ON DELETE SET NULL,
  source_row text,
  formula_key text,
  formula_version text,
  is_rollup_of text,
  component_of text,
  superseded_by text,
  valid_from date,
  valid_to date,
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    value_numeric IS NOT NULL
    OR value_text IS NOT NULL
    OR value_date IS NOT NULL
    OR value_bool IS NOT NULL
    OR value_source = 'not_loaded'
  )
);

CREATE TABLE IF NOT EXISTS cio_tower.relationships (
  relationship_key text PRIMARY KEY,
  tenant_key text NOT NULL,
  from_entity_key text NOT NULL REFERENCES cio_tower.entities(entity_key) ON DELETE CASCADE,
  to_entity_key text NOT NULL REFERENCES cio_tower.entities(entity_key) ON DELETE CASCADE,
  relationship_type text NOT NULL
    CHECK (relationship_type IN (
      'owns',
      'funds',
      'supports',
      'depends_on',
      'supplies',
      'renews',
      'measures',
      'blocks',
      'impacts',
      'rolls_up_to',
      'allocates_to',
      'uses',
      'governed_by'
    )),
  confidence text NOT NULL DEFAULT 'medium'
    CHECK (confidence IN ('high', 'medium', 'low')),
  source_key text REFERENCES cio_tower.source_registry(source_key) ON DELETE SET NULL,
  source_row text,
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, from_entity_key, to_entity_key, relationship_type)
);

CREATE TABLE IF NOT EXISTS cio_tower.measures (
  measure_key text PRIMARY KEY,
  label text NOT NULL,
  description text NOT NULL,
  default_scope text NOT NULL,
  grain_filter jsonb NOT NULL,
  group_by jsonb NOT NULL DEFAULT '[]'::jsonb,
  aggregation text NOT NULL CHECK (aggregation IN ('sum', 'count', 'ratio', 'top_n', 'min', 'max', 'avg')),
  numerator_filter jsonb,
  denominator_filter jsonb,
  reconciles_to_measure_key text,
  honesty_rule text NOT NULL DEFAULT 'return_not_loaded_when_no_matching_facts',
  artifact_default text NOT NULL DEFAULT 'text'
    CHECK (artifact_default IN ('text', 'table', 'chart', 'graph', 'metric_card')),
  formula text,
  formula_version text NOT NULL DEFAULT 'cio_tower_v1',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cio_tower.question_contracts (
  contract_key text PRIMARY KEY,
  surface text NOT NULL DEFAULT 'tower' CHECK (surface IN ('tower', 'home', 'intelligence')),
  intent text NOT NULL CHECK (intent IN ('lookup', 'table', 'chart', 'graph', 'compare', 'diagnose', 'decision_handoff', 'outside_scope')),
  question_family text NOT NULL,
  measure_key text REFERENCES cio_tower.measures(measure_key) ON DELETE SET NULL,
  default_scope text,
  dimensions jsonb NOT NULL DEFAULT '[]'::jsonb,
  filters_schema jsonb NOT NULL DEFAULT '{}'::jsonb,
  required_fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  artifact_type text NOT NULL DEFAULT 'text'
    CHECK (artifact_type IN ('text', 'table', 'chart', 'graph', 'metric_card', 'handoff')),
  outside_scope_rule text NOT NULL DEFAULT 'refuse_and_offer_tower_scope',
  prompt_policy_key text NOT NULL DEFAULT 'cio_tower_visible_answer_v1',
  visible_answer_contract text NOT NULL DEFAULT
    'Claude owns prose. AbarVa owns context, routing, artifacts, rendering, and validation. Renderer must display Claude prose unchanged.',
  examples jsonb NOT NULL DEFAULT '[]'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cio_tower.measure_results (
  result_key text PRIMARY KEY,
  tenant_key text NOT NULL,
  measure_key text NOT NULL REFERENCES cio_tower.measures(measure_key) ON DELETE CASCADE,
  scope text NOT NULL,
  period text NOT NULL,
  basis text NOT NULL,
  dimensions jsonb NOT NULL DEFAULT '{}'::jsonb,
  value_numeric numeric,
  value_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_fact_keys text[] NOT NULL DEFAULT '{}'::text[],
  formula_version text NOT NULL,
  computed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, measure_key, scope, period, basis, dimensions)
);

CREATE TABLE IF NOT EXISTS cio_tower.prompt_packages (
  prompt_package_key text PRIMARY KEY,
  tenant_key text NOT NULL,
  surface text NOT NULL,
  user_question text NOT NULL,
  contract_key text REFERENCES cio_tower.question_contracts(contract_key) ON DELETE SET NULL,
  measure_key text REFERENCES cio_tower.measures(measure_key) ON DELETE SET NULL,
  deterministic_packet jsonb NOT NULL,
  prompt_text text NOT NULL,
  prompt_hash text NOT NULL,
  model_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cio_tower.answer_traces (
  trace_key text PRIMARY KEY,
  tenant_key text NOT NULL,
  surface text NOT NULL,
  user_question text NOT NULL,
  contract_key text REFERENCES cio_tower.question_contracts(contract_key) ON DELETE SET NULL,
  measure_key text REFERENCES cio_tower.measures(measure_key) ON DELETE SET NULL,
  prompt_package_key text REFERENCES cio_tower.prompt_packages(prompt_package_key) ON DELETE SET NULL,
  raw_model_response text,
  rendered_response text,
  artifacts jsonb NOT NULL DEFAULT '{}'::jsonb,
  validation_status text NOT NULL
    CHECK (validation_status IN ('passed', 'repaired_by_model', 'blocked', 'failed', 'not_run')),
  validation_errors jsonb NOT NULL DEFAULT '[]'::jsonb,
  latency_ms integer,
  model_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (raw_model_response IS NULL OR rendered_response IS NULL OR raw_model_response = rendered_response)
);

CREATE TABLE IF NOT EXISTS cio_tower.validation_runs (
  validation_run_key text PRIMARY KEY,
  run_type text NOT NULL CHECK (run_type IN ('source_reconciliation', 'dashboard_chat_parity', 'question_bank', 'browser_crawl', 'prompt_render_trace')),
  tenant_key text,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'passed', 'failed', 'partial')),
  summary jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS cio_tower.validation_results (
  validation_result_key text PRIMARY KEY,
  validation_run_key text NOT NULL REFERENCES cio_tower.validation_runs(validation_run_key) ON DELETE CASCADE,
  tenant_key text NOT NULL,
  check_key text NOT NULL,
  question text,
  expected jsonb NOT NULL DEFAULT '{}'::jsonb,
  actual jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL CHECK (status IN ('passed', 'failed', 'warning')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cio_tower_sources_tenant ON cio_tower.source_registry (tenant_key, source_system, source_file);
CREATE INDEX IF NOT EXISTS idx_cio_tower_entities_tenant_type ON cio_tower.entities (tenant_key, entity_type);
CREATE INDEX IF NOT EXISTS idx_cio_tower_entities_parent ON cio_tower.entities (parent_entity_key);
CREATE INDEX IF NOT EXISTS idx_cio_tower_facts_lookup ON cio_tower.facts (tenant_key, measure, scope, view, period, basis);
CREATE INDEX IF NOT EXISTS idx_cio_tower_facts_entity ON cio_tower.facts (tenant_key, entity_key);
CREATE INDEX IF NOT EXISTS idx_cio_tower_facts_source ON cio_tower.facts (source_key, source_row);
CREATE INDEX IF NOT EXISTS idx_cio_tower_relationships_lookup ON cio_tower.relationships (tenant_key, relationship_type, from_entity_key, to_entity_key);
CREATE INDEX IF NOT EXISTS idx_cio_tower_measure_results_lookup ON cio_tower.measure_results (tenant_key, measure_key, scope, period, basis);
CREATE INDEX IF NOT EXISTS idx_cio_tower_answer_traces_tenant_created ON cio_tower.answer_traces (tenant_key, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cio_tower_prompt_packages_tenant_created ON cio_tower.prompt_packages (tenant_key, created_at DESC);

DO $$
DECLARE
  tbl regclass;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'cio_tower.source_registry'::regclass,
    'cio_tower.entities'::regclass,
    'cio_tower.facts'::regclass,
    'cio_tower.relationships'::regclass,
    'cio_tower.measure_results'::regclass,
    'cio_tower.prompt_packages'::regclass,
    'cio_tower.answer_traces'::regclass,
    'cio_tower.validation_runs'::regclass,
    'cio_tower.validation_results'::regclass
  ]
  LOOP
    EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', tbl);

    IF to_regrole('service_role') IS NOT NULL THEN
      EXECUTE format('DROP POLICY IF EXISTS svc_all ON %s', tbl);
      EXECUTE format('CREATE POLICY svc_all ON %s FOR ALL TO service_role USING (true) WITH CHECK (true)', tbl);
    END IF;

    IF to_regrole('authenticated') IS NOT NULL
       AND to_regprocedure('can_read_tenant_by_key(text)') IS NOT NULL THEN
      EXECUTE format('DROP POLICY IF EXISTS auth_read ON %s', tbl);
      EXECUTE format('CREATE POLICY auth_read ON %s FOR SELECT TO authenticated USING (can_read_tenant_by_key(tenant_key))', tbl);
    END IF;
  END LOOP;
END $$;

ALTER TABLE cio_tower.measures ENABLE ROW LEVEL SECURITY;
ALTER TABLE cio_tower.question_contracts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF to_regrole('service_role') IS NOT NULL THEN
    DROP POLICY IF EXISTS svc_all ON cio_tower.measures;
    CREATE POLICY svc_all ON cio_tower.measures FOR ALL TO service_role USING (true) WITH CHECK (true);
    DROP POLICY IF EXISTS svc_all ON cio_tower.question_contracts;
    CREATE POLICY svc_all ON cio_tower.question_contracts FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;

  IF to_regrole('authenticated') IS NOT NULL THEN
    DROP POLICY IF EXISTS auth_read ON cio_tower.measures;
    CREATE POLICY auth_read ON cio_tower.measures FOR SELECT TO authenticated USING (active = true);
    DROP POLICY IF EXISTS auth_read ON cio_tower.question_contracts;
    CREATE POLICY auth_read ON cio_tower.question_contracts FOR SELECT TO authenticated USING (active = true);
  END IF;
END $$;

COMMENT ON SCHEMA cio_tower IS 'CIO Tower v1 governed metric, prompt, and answer-trace schema. Replacement for old public.tower_* and public.ai_control_* layers.';
COMMENT ON TABLE cio_tower.facts IS 'Atomic Tower facts. Stores budget, spend, value, KPI, risk, adoption, and descriptive values with scope, view, basis, period, source, and formula lineage.';
COMMENT ON TABLE cio_tower.measures IS 'Governed Tower metric registry used by both dashboard and chat.';
COMMENT ON TABLE cio_tower.question_contracts IS 'Natural-language Tower question contracts. Maps question families to measures, scopes, artifacts, prompt policy, and refusal rules.';
COMMENT ON TABLE cio_tower.prompt_packages IS 'Exact prompt package sent to Claude/model for answer generation. Stored for prompt/response/render proof.';
COMMENT ON TABLE cio_tower.answer_traces IS 'Question-to-render trace. raw_model_response must equal rendered_response when prose is displayed.';
