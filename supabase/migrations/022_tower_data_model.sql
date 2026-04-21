-- Migration 022 · Control Tower data model (Pack 10 — originally "020" in spec, renumbered)
-- 7 tables for the 5 Tower dimensions + contradictions + upload audit trail.
-- Service-role-only RLS (matches Pack 6 posture until per-user RLS lands).

BEGIN;

DO $$ BEGIN
  CREATE TYPE tower_data_source AS ENUM (
    'abarva_engagement', 'manual_upload', 'api_integration', 'seed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Dimension 1 · Inventory ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS use_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  business_unit TEXT,
  domain TEXT,
  sponsor_person_id UUID REFERENCES persons(id),
  owner_person_id UUID REFERENCES persons(id),
  stage TEXT NOT NULL CHECK (stage IN (
    'idea','qualify','design','evidence','review','execute','realize','stalled'
  )),
  systems JSONB DEFAULT '[]'::jsonb,
  ai_type TEXT,
  scope TEXT,
  vendor TEXT,
  source tower_data_source NOT NULL DEFAULT 'manual_upload',
  source_engagement_id UUID REFERENCES engagements(id),
  source_file_id UUID,
  external_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_use_cases_client ON use_cases(client_id);
CREATE INDEX IF NOT EXISTS idx_use_cases_stage ON use_cases(client_id, stage);
CREATE INDEX IF NOT EXISTS idx_use_cases_business_unit ON use_cases(client_id, business_unit);

DROP TRIGGER IF EXISTS use_cases_set_updated_at ON use_cases;
CREATE TRIGGER use_cases_set_updated_at BEFORE UPDATE ON use_cases
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ── Dimension 2 · Adoption / Usage ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS use_case_usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  use_case_id UUID NOT NULL REFERENCES use_cases(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  dau INT,
  wau INT,
  mau INT,
  target_user_count INT,
  penetration_pct NUMERIC(5,2),
  interactions_total INT,
  avg_interactions_per_active_user NUMERIC(6,2),
  drop_off_rate_pct NUMERIC(5,2),
  quality_score NUMERIC(3,2),
  embedded_in_workflow BOOLEAN,
  source tower_data_source NOT NULL DEFAULT 'manual_upload',
  source_file_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_usage_metrics_use_case ON use_case_usage_metrics(use_case_id, period_end DESC);

-- ── Dimension 3 · Business Value ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS use_case_value_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  use_case_id UUID NOT NULL REFERENCES use_cases(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  value_driver TEXT NOT NULL CHECK (value_driver IN (
    'cost_takeout','capacity_creation','revenue_uplift',
    'risk_reduction','experience_improvement','quality_improvement'
  )),
  metric_name TEXT NOT NULL,
  baseline NUMERIC,
  target NUMERIC,
  observed NUMERIC,
  unit TEXT,
  measurement_method TEXT,
  confidence TEXT NOT NULL CHECK (confidence IN ('high','medium','proxy','estimate')),
  assumptions TEXT,
  attribution_notes TEXT,
  source tower_data_source NOT NULL DEFAULT 'manual_upload',
  source_file_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_value_metrics_use_case ON use_case_value_metrics(use_case_id, period_end DESC);

-- ── Dimension 4 · Risk ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS use_case_risk (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  use_case_id UUID NOT NULL REFERENCES use_cases(id) ON DELETE CASCADE,
  data_classification TEXT[],
  model_risk_level TEXT CHECK (model_risk_level IN ('high','medium','low')),
  bias_fairness_review_status TEXT,
  auditability_level TEXT,
  governance_approval_status TEXT,
  governance_approval_date DATE,
  human_in_the_loop BOOLEAN NOT NULL DEFAULT false,
  human_override_rate_pct NUMERIC(5,2),
  bias_incidents_count INT NOT NULL DEFAULT 0,
  vendor TEXT,
  vendor_data_posture TEXT,
  vendor_data_residency TEXT,
  last_reviewed_at TIMESTAMPTZ,
  source tower_data_source NOT NULL DEFAULT 'manual_upload',
  source_file_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (use_case_id)
);

DROP TRIGGER IF EXISTS use_case_risk_set_updated_at ON use_case_risk;
CREATE TRIGGER use_case_risk_set_updated_at BEFORE UPDATE ON use_case_risk
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ── Dimension 5 · Cost ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS use_case_cost_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  use_case_id UUID NOT NULL REFERENCES use_cases(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  llm_spend_usd NUMERIC(12,2) NOT NULL DEFAULT 0,
  compute_spend_usd NUMERIC(12,2) NOT NULL DEFAULT 0,
  storage_spend_usd NUMERIC(12,2) NOT NULL DEFAULT 0,
  vendor_license_spend_usd NUMERIC(12,2) NOT NULL DEFAULT 0,
  integration_spend_usd NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_spend_usd NUMERIC(12,2) GENERATED ALWAYS AS (
    llm_spend_usd + compute_spend_usd + storage_spend_usd + vendor_license_spend_usd + integration_spend_usd
  ) STORED,
  cost_per_interaction NUMERIC(10,4),
  interactions_count INT,
  projected_6mo_spend_usd NUMERIC(12,2),
  projected_12mo_spend_usd NUMERIC(12,2),
  trajectory_confidence TEXT CHECK (trajectory_confidence IN ('high','medium','low')),
  source tower_data_source NOT NULL DEFAULT 'manual_upload',
  source_file_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cost_metrics_use_case ON use_case_cost_metrics(use_case_id, period_end DESC);

-- ── Contradiction engine ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contradictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  use_case_id UUID REFERENCES use_cases(id) ON DELETE CASCADE,
  contradiction_type TEXT NOT NULL CHECK (contradiction_type IN (
    'cost_vs_adoption','value_vs_adoption','value_vs_baseline',
    'risk_vs_value','risk_vs_data','shadow_ai','stalled','cost_trajectory'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('high','medium','low')),
  description TEXT NOT NULL,
  suggested_action TEXT,
  evidence JSONB DEFAULT '{}'::jsonb,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  triggered_engagement_id UUID REFERENCES engagements(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_contradictions_client_active ON contradictions(client_id, severity) WHERE resolved_at IS NULL;

-- ── Uploaded files audit ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS uploaded_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  uploaded_by_person_id UUID NOT NULL REFERENCES persons(id),
  file_name TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  data_type TEXT CHECK (data_type IN (
    'portfolio','usage','value','risk','cost','engagement_doc','mixed','unknown'
  )),
  classification_confidence NUMERIC(3,2),
  ingestion_status TEXT NOT NULL CHECK (ingestion_status IN (
    'pending','classifying','needs_mapping','parsing','parsed','failed'
  )) DEFAULT 'pending',
  rows_total INT,
  rows_ingested INT,
  rows_failed INT,
  parser_notes JSONB DEFAULT '[]'::jsonb,
  period_start DATE,
  period_end DATE,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  parsed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_client ON uploaded_files(client_id, uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_status ON uploaded_files(ingestion_status)
  WHERE ingestion_status IN ('pending','classifying','needs_mapping','parsing');

-- Backfill FKs from metric tables → uploaded_files now that target exists
DO $$ BEGIN
  ALTER TABLE use_cases ADD CONSTRAINT fk_use_cases_source_file
    FOREIGN KEY (source_file_id) REFERENCES uploaded_files(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE use_case_usage_metrics ADD CONSTRAINT fk_usage_source_file
    FOREIGN KEY (source_file_id) REFERENCES uploaded_files(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE use_case_value_metrics ADD CONSTRAINT fk_value_source_file
    FOREIGN KEY (source_file_id) REFERENCES uploaded_files(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE use_case_risk ADD CONSTRAINT fk_risk_source_file
    FOREIGN KEY (source_file_id) REFERENCES uploaded_files(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE use_case_cost_metrics ADD CONSTRAINT fk_cost_source_file
    FOREIGN KEY (source_file_id) REFERENCES uploaded_files(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
END $$;

-- RLS (service-role-only posture)
ALTER TABLE use_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE use_case_usage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE use_case_value_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE use_case_risk ENABLE ROW LEVEL SECURITY;
ALTER TABLE use_case_cost_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE contradictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'use_cases','use_case_usage_metrics','use_case_value_metrics',
    'use_case_risk','use_case_cost_metrics','contradictions','uploaded_files'
  ])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "service_role_all_%s" ON %I', t, t);
    EXECUTE format('CREATE POLICY "service_role_all_%s" ON %I FOR ALL TO service_role USING (true) WITH CHECK (true)', t, t);
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
