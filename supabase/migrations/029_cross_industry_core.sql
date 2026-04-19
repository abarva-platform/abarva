-- Migration 029 · Cross-industry core — Pack I Phase 1
-- Idempotent. Extends Pack H (not yet shipped — sidecar only, no FKs).
-- Six domains: infra, applications, data platform, AI models, cost model,
-- engineering productivity.

BEGIN;

-- ── 1 · IT Infrastructure & Cloud ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS infra_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  cloud_provider TEXT,
  region TEXT,
  asset_type TEXT CHECK (asset_type IN ('compute','storage','network','database','ai_accelerator')),
  service_name TEXT,
  monthly_cost_usd NUMERIC(12, 2),
  utilization_pct NUMERIC(5, 2),
  tags JSONB DEFAULT '{}'::jsonb,
  touches_ai BOOLEAN DEFAULT false,
  is_demo_data BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_infra_client ON infra_assets(client_id);
CREATE INDEX IF NOT EXISTS idx_infra_ai ON infra_assets(touches_ai) WHERE touches_ai = true;

CREATE TABLE IF NOT EXISTS cloud_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  month DATE NOT NULL,
  compute_usd NUMERIC(12, 2),
  storage_usd NUMERIC(12, 2),
  network_usd NUMERIC(12, 2),
  ai_services_usd NUMERIC(12, 2),
  other_usd NUMERIC(12, 2),
  is_demo_data BOOLEAN DEFAULT false,
  UNIQUE (client_id, provider, month)
);

-- ── 2 · Application Landscape ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  vendor TEXT,
  deployment_model TEXT CHECK (deployment_model IN ('on_prem','saas','hybrid','custom_built')),
  business_function TEXT,
  user_count INT,
  annual_cost_usd NUMERIC(12, 2),
  criticality TEXT CHECK (criticality IN ('tier1','tier2','tier3')),
  status TEXT CHECK (status IN ('active','sunsetting','in_procurement')),
  ai_enabled BOOLEAN DEFAULT false,
  is_demo_data BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_applications_client ON applications(client_id);

CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  source_app_id UUID REFERENCES applications(id) ON DELETE SET NULL,
  target_app_id UUID REFERENCES applications(id) ON DELETE SET NULL,
  integration_type TEXT CHECK (integration_type IN ('api','file_transfer','event_stream','rpa','manual')),
  data_volume_daily TEXT,
  is_demo_data BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_integrations_source ON integrations(source_app_id);
CREATE INDEX IF NOT EXISTS idx_integrations_target ON integrations(target_app_id);

-- ── 3 · Data Platform & Governance ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS data_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  source_type TEXT CHECK (source_type IN ('transactional_db','data_warehouse','data_lake','external_feed','saas_export')),
  storage_platform TEXT,
  size_tb NUMERIC(10, 2),
  record_count_millions NUMERIC(12, 2),
  refresh_frequency TEXT,
  quality_score NUMERIC(3, 2),
  governance_level TEXT CHECK (governance_level IN ('ungoverned','partial','governed','certified')),
  data_classes TEXT[] DEFAULT '{}',
  ai_ready BOOLEAN DEFAULT false,
  is_demo_data BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_data_sources_client ON data_sources(client_id);

CREATE TABLE IF NOT EXISTS data_pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  source_id UUID REFERENCES data_sources(id) ON DELETE SET NULL,
  tool TEXT,
  avg_latency_minutes INT,
  failure_rate_pct NUMERIC(5, 2),
  is_demo_data BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS data_governance_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  policy_name TEXT NOT NULL,
  scope TEXT,
  enforcement_level TEXT CHECK (enforcement_level IN ('documented','automated','audited')),
  related_regulation_codes TEXT[] DEFAULT '{}',
  last_reviewed DATE,
  is_demo_data BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 4 · AI Models (extends existing use_cases) ─────────────────────────
CREATE TABLE IF NOT EXISTS ai_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  use_case_id UUID REFERENCES use_cases(id) ON DELETE SET NULL,
  model_family TEXT,
  model_version TEXT,
  deployment_type TEXT CHECK (deployment_type IN ('vendor_api','hosted','on_prem','edge')),
  status TEXT CHECK (status IN ('development','pilot','production','deprecated')),
  monthly_cost_usd NUMERIC(12, 2),
  token_volume_monthly_millions NUMERIC(10, 2),
  is_demo_data BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_models_usecase ON ai_models(use_case_id);

-- ── 5 · IT Cost Model ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cost_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  annual_budget_usd NUMERIC(14, 2),
  spent_ytd_usd NUMERIC(14, 2),
  run_vs_change_pct NUMERIC(5, 2),
  leader_name TEXT,
  is_demo_data BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS spend_breakdown (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  cost_center_id UUID REFERENCES cost_centers(id) ON DELETE SET NULL,
  category TEXT CHECK (category IN ('labor_internal','labor_contract','software_license','cloud_infra','services','hardware')),
  month DATE NOT NULL,
  amount_usd NUMERIC(12, 2),
  is_demo_data BOOLEAN DEFAULT false
);
CREATE INDEX IF NOT EXISTS idx_spend_cost_center ON spend_breakdown(cost_center_id);

-- ── 6 · Engineering Productivity ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS eng_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  function_area TEXT,
  fte_count INT,
  tooling JSONB DEFAULT '{}'::jsonb,
  is_demo_data BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS engineering_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  team_id UUID REFERENCES eng_teams(id) ON DELETE SET NULL,
  month DATE NOT NULL,
  deploy_frequency_per_week NUMERIC(8, 2),
  lead_time_hours NUMERIC(8, 2),
  change_fail_rate_pct NUMERIC(5, 2),
  mttr_hours NUMERIC(8, 2),
  ai_tool_adoption_pct NUMERIC(5, 2),
  is_demo_data BOOLEAN DEFAULT false
);
CREATE INDEX IF NOT EXISTS idx_eng_metrics_team ON engineering_metrics(team_id);

-- ── RLS (service-role only, consistent with tower tables) ──────────────
ALTER TABLE infra_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE cloud_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_governance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE spend_breakdown ENABLE ROW LEVEL SECURITY;
ALTER TABLE eng_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE engineering_metrics ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'infra_assets','cloud_costs','applications','integrations',
    'data_sources','data_pipelines','data_governance_policies','ai_models',
    'cost_centers','spend_breakdown','eng_teams','engineering_metrics'
  ]) LOOP
    EXECUTE format('DROP POLICY IF EXISTS "service_role_all" ON %I', t);
    EXECUTE format('CREATE POLICY "service_role_all" ON %I FOR ALL TO service_role USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
