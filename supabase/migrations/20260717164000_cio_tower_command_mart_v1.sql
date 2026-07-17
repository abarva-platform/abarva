-- CIO Tower command-center mart v1
-- Purpose: persist CXO-ready Tower projections derived from governed v3 inputs
-- and cio_tower facts/measure_results. These tables are read models, not source
-- truth. Every visible value must carry source lineage back to refreshed v3
-- source/template rows.

CREATE SCHEMA IF NOT EXISTS cio_tower;

CREATE TABLE IF NOT EXISTS cio_tower.mart_command_center (
  command_center_key text PRIMARY KEY,
  tenant_key text NOT NULL,
  tenant_name text NOT NULL,
  mart_version text NOT NULL,
  source_standard text NOT NULL,
  formula_version text NOT NULL,
  source_run_id text,
  total_it_budget_fy26 numeric NOT NULL DEFAULT 0,
  run_budget_fy26 numeric NOT NULL DEFAULT 0,
  change_budget_fy26 numeric NOT NULL DEFAULT 0,
  approved_program_budget_fy26 numeric NOT NULL DEFAULT 0,
  ai_tagged_spend_fy26_non_additive numeric NOT NULL DEFAULT 0,
  promised_value_fy26 numeric NOT NULL DEFAULT 0,
  partial_finance_validated_value_ytd numeric NOT NULL DEFAULT 0,
  realized_value_ytd_allowed numeric NOT NULL DEFAULT 0,
  candidate_ai_opportunities integer NOT NULL DEFAULT 0,
  watch_pressure_signals integer NOT NULL DEFAULT 0,
  run_ratio numeric,
  change_ratio numeric,
  finance_validation_ratio numeric,
  decision_question text NOT NULL,
  executive_summary text NOT NULL,
  source_fact_keys text[] NOT NULL DEFAULT '{}',
  source_files text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, mart_version)
);

CREATE TABLE IF NOT EXISTS cio_tower.mart_value_funnel (
  funnel_key text PRIMARY KEY,
  tenant_key text NOT NULL,
  sequence integer NOT NULL,
  stage_key text NOT NULL,
  stage_label text NOT NULL,
  value_numeric numeric NOT NULL DEFAULT 0,
  denominator_stage_key text,
  conversion_ratio numeric,
  claim_status text NOT NULL,
  caveat text NOT NULL,
  source_fact_keys text[] NOT NULL DEFAULT '{}',
  source_file text,
  source_row text,
  formula_version text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cio_tower.mart_program_decision_lanes (
  lane_key text PRIMARY KEY,
  tenant_key text NOT NULL,
  program_code text,
  program_name text NOT NULL,
  owner_role text,
  finance_owner_role text,
  decision_lane text NOT NULL CHECK (decision_lane IN ('fund', 'fix', 'freeze', 'stop')),
  decision_rationale text NOT NULL,
  approved_funding_usd numeric NOT NULL DEFAULT 0,
  ai_tagged_spend_usd numeric NOT NULL DEFAULT 0,
  promised_value_usd numeric NOT NULL DEFAULT 0,
  finance_validated_value_usd numeric NOT NULL DEFAULT 0,
  usage_metric text,
  usage_actual numeric,
  adoption_rate_pct numeric,
  value_claim_status text NOT NULL DEFAULT 'not_loaded',
  tower_claim_allowed text NOT NULL DEFAULT 'no',
  required_gates jsonb NOT NULL DEFAULT '[]'::jsonb,
  caveat text NOT NULL DEFAULT '',
  evidence_ids text[] NOT NULL DEFAULT '{}',
  source_fact_keys text[] NOT NULL DEFAULT '{}',
  source_file text,
  source_row text,
  formula_version text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cio_tower.mart_ai_portfolio (
  ai_portfolio_key text PRIMARY KEY,
  tenant_key text NOT NULL,
  item_name text NOT NULL,
  item_kind text NOT NULL CHECK (item_kind IN ('funded_program', 'embedded_platform', 'candidate_opportunity', 'usage_benefit')),
  vendor_name text,
  system_name text,
  ai_spend_type text,
  ai_spend_category text,
  funding_status text,
  decision_lane text NOT NULL CHECK (decision_lane IN ('fund', 'fix', 'freeze', 'stop')),
  approved_funding_usd numeric NOT NULL DEFAULT 0,
  ai_tagged_spend_usd numeric NOT NULL DEFAULT 0,
  promised_value_usd numeric NOT NULL DEFAULT 0,
  finance_validated_value_usd numeric NOT NULL DEFAULT 0,
  usage_metric text,
  usage_actual numeric,
  adoption_rate_pct numeric,
  value_score integer NOT NULL DEFAULT 0,
  readiness_score integer NOT NULL DEFAULT 0,
  risk_score integer NOT NULL DEFAULT 0,
  platform_embedded_ai_flag boolean NOT NULL DEFAULT false,
  duplicate_risk text,
  value_claim_status text NOT NULL DEFAULT 'not_loaded',
  tower_claim_allowed text NOT NULL DEFAULT 'no',
  caveat text NOT NULL DEFAULT '',
  evidence_ids text[] NOT NULL DEFAULT '{}',
  source_fact_keys text[] NOT NULL DEFAULT '{}',
  source_file text,
  source_row text,
  formula_version text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cio_tower.mart_cxo_actions (
  action_key text PRIMARY KEY,
  tenant_key text NOT NULL,
  sequence integer NOT NULL,
  action_lane text NOT NULL CHECK (action_lane IN ('fund', 'fix', 'freeze', 'stop', 'govern')),
  title text NOT NULL,
  action_body text NOT NULL,
  owner_hint text,
  module_handoff text,
  evidence_ids text[] NOT NULL DEFAULT '{}',
  source_fact_keys text[] NOT NULL DEFAULT '{}',
  formula_version text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cio_tower.mart_evidence_lineage (
  lineage_key text PRIMARY KEY,
  tenant_key text NOT NULL,
  surface_section text NOT NULL,
  displayed_fact text NOT NULL,
  displayed_value_text text,
  displayed_value_numeric numeric,
  source_file text,
  source_row text,
  source_system text,
  source_fact_keys text[] NOT NULL DEFAULT '{}',
  formula_version text NOT NULL,
  caveat text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cio_tower.mart_required_field_gaps (
  gap_key text PRIMARY KEY,
  tenant_key text NOT NULL,
  mart_table text NOT NULL,
  mart_record_key text NOT NULL,
  required_field text NOT NULL,
  source_template text NOT NULL,
  source_record_id text,
  severity text NOT NULL CHECK (severity IN ('blocking', 'warning', 'info')),
  owner_hint text,
  remediation_action text NOT NULL,
  blocking boolean NOT NULL DEFAULT false,
  formula_version text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cio_tower_mart_command_tenant ON cio_tower.mart_command_center (tenant_key, mart_version);
CREATE INDEX IF NOT EXISTS idx_cio_tower_mart_funnel_tenant ON cio_tower.mart_value_funnel (tenant_key, sequence);
CREATE INDEX IF NOT EXISTS idx_cio_tower_mart_lanes_tenant_lane ON cio_tower.mart_program_decision_lanes (tenant_key, decision_lane);
CREATE INDEX IF NOT EXISTS idx_cio_tower_mart_ai_tenant_lane ON cio_tower.mart_ai_portfolio (tenant_key, decision_lane, item_kind);
CREATE INDEX IF NOT EXISTS idx_cio_tower_mart_actions_tenant ON cio_tower.mart_cxo_actions (tenant_key, sequence);
CREATE INDEX IF NOT EXISTS idx_cio_tower_mart_lineage_tenant_section ON cio_tower.mart_evidence_lineage (tenant_key, surface_section);
CREATE INDEX IF NOT EXISTS idx_cio_tower_mart_gaps_tenant_blocking ON cio_tower.mart_required_field_gaps (tenant_key, blocking, severity);

ALTER TABLE cio_tower.mart_command_center ENABLE ROW LEVEL SECURITY;
ALTER TABLE cio_tower.mart_value_funnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE cio_tower.mart_program_decision_lanes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cio_tower.mart_ai_portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE cio_tower.mart_cxo_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cio_tower.mart_evidence_lineage ENABLE ROW LEVEL SECURITY;
ALTER TABLE cio_tower.mart_required_field_gaps ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'mart_command_center',
    'mart_value_funnel',
    'mart_program_decision_lanes',
    'mart_ai_portfolio',
    'mart_cxo_actions',
    'mart_evidence_lineage',
    'mart_required_field_gaps'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS svc_all ON cio_tower.%I', table_name);
    EXECUTE format('CREATE POLICY svc_all ON cio_tower.%I FOR ALL TO service_role USING (true) WITH CHECK (true)', table_name);
    EXECUTE format('DROP POLICY IF EXISTS auth_read ON cio_tower.%I', table_name);
    EXECUTE format('CREATE POLICY auth_read ON cio_tower.%I FOR SELECT TO authenticated USING (true)', table_name);
  END LOOP;
END $$;

COMMENT ON TABLE cio_tower.mart_command_center IS 'Persistent CXO-ready Tower command-center headline projection. Derived from v3 source rows and cio_tower lineage, not hand-authored UI data.';
COMMENT ON TABLE cio_tower.mart_program_decision_lanes IS 'Fund/fix/freeze/stop program lane mart. Required fields must be fixed upstream in v3 source/templates; renderer must not fabricate them.';
COMMENT ON TABLE cio_tower.mart_ai_portfolio IS 'AI spend, usage, benefit, and candidate-opportunity mart for Tower. AI spend is a non-additive lens unless explicitly modeled otherwise.';
COMMENT ON TABLE cio_tower.mart_evidence_lineage IS 'Surface-level lineage for every displayed Tower command-center value back to source files, rows, and fact keys.';
