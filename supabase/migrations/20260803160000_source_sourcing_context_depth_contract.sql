-- Source sourcing context depth contract.
--
-- Non-destructive extension for vendor, contract, consumption, performance,
-- renewal, market, and sourcing-event context. The raw/client landing layer
-- remains source-faithful; these tables are the governed Source context that
-- product pages and deterministic analytics can project.

BEGIN;

CREATE SCHEMA IF NOT EXISTS source;
CREATE SCHEMA IF NOT EXISTS consumption;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION source.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION source.can_read_sourcing_tenant(candidate_tenant_key TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  runtime_role TEXT;
  allowed BOOLEAN;
BEGIN
  IF to_regprocedure('auth.role()') IS NOT NULL THEN
    EXECUTE 'SELECT auth.role()' INTO runtime_role;
  ELSE
    runtime_role := current_user;
  END IF;

  IF runtime_role = 'service_role' OR current_user = 'service_role' THEN
    RETURN TRUE;
  END IF;

  IF to_regprocedure('public.can_read_tenant_by_key(text)') IS NOT NULL THEN
    EXECUTE 'SELECT public.can_read_tenant_by_key($1)' INTO allowed USING candidate_tenant_key;
    RETURN COALESCE(allowed, FALSE);
  END IF;

  RETURN FALSE;
END;
$$;

-- ---------------------------------------------------------------------------
-- Core entities
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS source.vendor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  vendor_id TEXT NOT NULL,
  legal_name TEXT NOT NULL,
  parent_company TEXT NULL,
  supplier_category TEXT NULL,
  strategic_status TEXT NULL,
  country TEXT NULL,
  region TEXT NULL,
  diversity_status TEXT NULL,
  risk_tier TEXT NULL,
  financial_health_status TEXT NULL,
  security_risk_status TEXT NULL,
  relationship_owner_role TEXT NULL,
  active_state TEXT NOT NULL DEFAULT 'active',
  source_system TEXT NULL,
  source_record_id TEXT NULL,
  as_of_date DATE NULL,
  confidence NUMERIC(5,4) NULL CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
  quality_state TEXT NOT NULL DEFAULT 'unreviewed',
  evidence_reference TEXT NULL,
  load_run_id TEXT NULL,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, vendor_id)
);

CREATE TABLE IF NOT EXISTS source.contract (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  contract_id TEXT NOT NULL,
  vendor_id TEXT NULL,
  contract_name TEXT NOT NULL,
  agreement_type TEXT NULL,
  effective_date DATE NULL,
  expiration_date DATE NULL,
  notice_deadline DATE NULL,
  renewal_type TEXT NULL,
  auto_renew BOOLEAN NULL,
  term_length_months NUMERIC(10,2) NULL,
  annual_value NUMERIC(18,2) NULL,
  total_committed_value NUMERIC(18,2) NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  payment_terms TEXT NULL,
  benchmark_rights TEXT NULL,
  termination_rights TEXT NULL,
  price_uplift_terms TEXT NULL,
  minimum_commitment NUMERIC(18,2) NULL,
  service_credit_cap NUMERIC(18,2) NULL,
  exit_assistance_terms TEXT NULL,
  renewal_owner_role TEXT NULL,
  parent_contract_id TEXT NULL,
  document_file_id TEXT NULL,
  source_system TEXT NULL,
  source_record_id TEXT NULL,
  as_of_date DATE NULL,
  confidence NUMERIC(5,4) NULL CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
  quality_state TEXT NOT NULL DEFAULT 'unreviewed',
  evidence_reference TEXT NULL,
  load_run_id TEXT NULL,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, contract_id)
);

CREATE TABLE IF NOT EXISTS source.contract_term (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  term_id TEXT NOT NULL,
  contract_id TEXT NOT NULL,
  term_type TEXT NOT NULL,
  term_name TEXT NOT NULL,
  term_value TEXT NULL,
  value_num NUMERIC(18,4) NULL,
  unit TEXT NULL,
  currency TEXT NULL,
  effective_date DATE NULL,
  expiration_date DATE NULL,
  page_ref TEXT NULL,
  clause_ref TEXT NULL,
  source_system TEXT NULL,
  source_record_id TEXT NULL,
  as_of_date DATE NULL,
  confidence NUMERIC(5,4) NULL CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
  quality_state TEXT NOT NULL DEFAULT 'unreviewed',
  evidence_reference TEXT NULL,
  load_run_id TEXT NULL,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, term_id)
);

CREATE TABLE IF NOT EXISTS source.contract_price_component (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  price_component_id TEXT NOT NULL,
  contract_id TEXT NOT NULL,
  component_type TEXT NOT NULL,
  component_name TEXT NOT NULL,
  service_id TEXT NULL,
  rate NUMERIC(18,4) NULL,
  amount NUMERIC(18,2) NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  unit TEXT NULL,
  volume_band_min NUMERIC(18,4) NULL,
  volume_band_max NUMERIC(18,4) NULL,
  minimum_commitment NUMERIC(18,2) NULL,
  overage_rate NUMERIC(18,4) NULL,
  effective_date DATE NULL,
  expiration_date DATE NULL,
  source_system TEXT NULL,
  source_record_id TEXT NULL,
  as_of_date DATE NULL,
  confidence NUMERIC(5,4) NULL CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
  quality_state TEXT NOT NULL DEFAULT 'unreviewed',
  evidence_reference TEXT NULL,
  load_run_id TEXT NULL,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, price_component_id)
);

CREATE TABLE IF NOT EXISTS source.service (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  service_id TEXT NOT NULL,
  vendor_id TEXT NULL,
  service_name TEXT NOT NULL,
  service_category TEXT NULL,
  service_type TEXT NULL,
  business_owner_role TEXT NULL,
  technology_owner_role TEXT NULL,
  criticality TEXT NULL,
  active_state TEXT NOT NULL DEFAULT 'active',
  source_system TEXT NULL,
  source_record_id TEXT NULL,
  as_of_date DATE NULL,
  confidence NUMERIC(5,4) NULL CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
  quality_state TEXT NOT NULL DEFAULT 'unreviewed',
  evidence_reference TEXT NULL,
  load_run_id TEXT NULL,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, service_id)
);

CREATE TABLE IF NOT EXISTS source.sourcing_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  business_outcome TEXT NOT NULL,
  service_scope TEXT NULL,
  incumbent_contracts TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  baseline_volumes JSONB NOT NULL DEFAULT '{}'::jsonb,
  requirements_summary TEXT NULL,
  evaluation_model TEXT NULL,
  event_status TEXT NOT NULL DEFAULT 'draft',
  recommendation TEXT NULL,
  decision TEXT NULL,
  transition_plan TEXT NULL,
  accountable_role TEXT NULL,
  decision_due_date DATE NULL,
  source_system TEXT NULL,
  source_record_id TEXT NULL,
  as_of_date DATE NULL,
  confidence NUMERIC(5,4) NULL CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
  quality_state TEXT NOT NULL DEFAULT 'unreviewed',
  evidence_reference TEXT NULL,
  load_run_id TEXT NULL,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, event_id)
);

CREATE TABLE IF NOT EXISTS source.sourcing_event_supplier (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  event_supplier_id TEXT NOT NULL,
  event_id TEXT NOT NULL,
  vendor_id TEXT NULL,
  supplier_name TEXT NOT NULL,
  supplier_status TEXT NULL,
  invited_date DATE NULL,
  response_status TEXT NULL,
  commercial_normalization JSONB NOT NULL DEFAULT '{}'::jsonb,
  risk_score NUMERIC(10,4) NULL,
  weighted_score NUMERIC(10,4) NULL,
  recommendation TEXT NULL,
  decision TEXT NULL,
  source_system TEXT NULL,
  source_record_id TEXT NULL,
  as_of_date DATE NULL,
  confidence NUMERIC(5,4) NULL CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
  quality_state TEXT NOT NULL DEFAULT 'unreviewed',
  evidence_reference TEXT NULL,
  load_run_id TEXT NULL,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, event_supplier_id)
);

-- ---------------------------------------------------------------------------
-- Relationships
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS source.contract_scope (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  contract_scope_id TEXT NOT NULL,
  contract_id TEXT NOT NULL,
  scope_type TEXT NOT NULL,
  scope_ref TEXT NULL,
  scope_name TEXT NOT NULL,
  service_id TEXT NULL,
  relationship_method TEXT NOT NULL DEFAULT 'unresolved',
  relationship_confidence NUMERIC(5,4) NOT NULL DEFAULT 0 CHECK (relationship_confidence BETWEEN 0 AND 1),
  effective_from DATE NULL,
  effective_to DATE NULL,
  criticality TEXT NULL,
  source_system TEXT NULL,
  source_record_id TEXT NULL,
  as_of_date DATE NULL,
  quality_state TEXT NOT NULL DEFAULT 'unreviewed',
  evidence_reference TEXT NULL,
  load_run_id TEXT NULL,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, contract_scope_id)
);

CREATE TABLE IF NOT EXISTS source.vendor_application_relationship (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  relationship_id TEXT NOT NULL,
  vendor_id TEXT NOT NULL,
  application_ref TEXT NOT NULL,
  application_name TEXT NULL,
  relationship_type TEXT NOT NULL DEFAULT 'supports',
  relationship_method TEXT NOT NULL DEFAULT 'unresolved',
  relationship_confidence NUMERIC(5,4) NOT NULL DEFAULT 0 CHECK (relationship_confidence BETWEEN 0 AND 1),
  effective_from DATE NULL,
  effective_to DATE NULL,
  criticality TEXT NULL,
  source_system TEXT NULL,
  source_record_id TEXT NULL,
  as_of_date DATE NULL,
  quality_state TEXT NOT NULL DEFAULT 'unreviewed',
  evidence_reference TEXT NULL,
  load_run_id TEXT NULL,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, relationship_id)
);

CREATE TABLE IF NOT EXISTS source.vendor_platform_relationship (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  relationship_id TEXT NOT NULL,
  vendor_id TEXT NOT NULL,
  platform_ref TEXT NOT NULL,
  platform_name TEXT NULL,
  relationship_type TEXT NOT NULL DEFAULT 'supports',
  relationship_method TEXT NOT NULL DEFAULT 'unresolved',
  relationship_confidence NUMERIC(5,4) NOT NULL DEFAULT 0 CHECK (relationship_confidence BETWEEN 0 AND 1),
  effective_from DATE NULL,
  effective_to DATE NULL,
  criticality TEXT NULL,
  source_system TEXT NULL,
  source_record_id TEXT NULL,
  as_of_date DATE NULL,
  quality_state TEXT NOT NULL DEFAULT 'unreviewed',
  evidence_reference TEXT NULL,
  load_run_id TEXT NULL,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, relationship_id)
);

CREATE TABLE IF NOT EXISTS source.contract_initiative_dependency_detail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  dependency_id TEXT NOT NULL,
  contract_id TEXT NOT NULL,
  initiative_ref TEXT NOT NULL,
  initiative_name TEXT NULL,
  dependency_type TEXT NOT NULL,
  dependency_direction TEXT NULL,
  modernization_relevance TEXT NULL,
  transition_timing TEXT NULL,
  relationship_method TEXT NOT NULL DEFAULT 'unresolved',
  relationship_confidence NUMERIC(5,4) NOT NULL DEFAULT 0 CHECK (relationship_confidence BETWEEN 0 AND 1),
  source_system TEXT NULL,
  source_record_id TEXT NULL,
  as_of_date DATE NULL,
  quality_state TEXT NOT NULL DEFAULT 'unreviewed',
  evidence_reference TEXT NULL,
  load_run_id TEXT NULL,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, dependency_id)
);

-- ---------------------------------------------------------------------------
-- Facts and observations
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS source.vendor_spend_observation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  observation_id TEXT NOT NULL,
  vendor_id TEXT NOT NULL,
  contract_id TEXT NULL,
  business_unit TEXT NULL,
  cost_center TEXT NULL,
  service_category TEXT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  purchase_order_amount NUMERIC(18,2) NULL,
  invoice_amount NUMERIC(18,2) NULL,
  paid_amount NUMERIC(18,2) NULL,
  accrual_amount NUMERIC(18,2) NULL,
  committed_amount NUMERIC(18,2) NULL,
  actual_spend NUMERIC(18,2) NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  source_system TEXT NULL,
  source_record_id TEXT NULL,
  as_of_date DATE NULL,
  confidence NUMERIC(5,4) NULL CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
  quality_state TEXT NOT NULL DEFAULT 'unreviewed',
  evidence_reference TEXT NULL,
  load_run_id TEXT NULL,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, observation_id)
);

CREATE TABLE IF NOT EXISTS source.contract_consumption_observation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  observation_id TEXT NOT NULL,
  contract_id TEXT NOT NULL,
  service_id TEXT NULL,
  business_unit TEXT NULL,
  cost_center TEXT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  committed_amount NUMERIC(18,2) NULL,
  invoice_amount NUMERIC(18,2) NULL,
  paid_amount NUMERIC(18,2) NULL,
  actual_spend NUMERIC(18,2) NULL,
  consumed_quantity NUMERIC(18,4) NULL,
  consumed_unit TEXT NULL,
  overage_amount NUMERIC(18,2) NULL,
  service_credit_amount NUMERIC(18,2) NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  source_system TEXT NULL,
  source_record_id TEXT NULL,
  as_of_date DATE NULL,
  confidence NUMERIC(5,4) NULL CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
  quality_state TEXT NOT NULL DEFAULT 'unreviewed',
  evidence_reference TEXT NULL,
  load_run_id TEXT NULL,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, observation_id)
);

CREATE TABLE IF NOT EXISTS source.contract_performance_observation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  observation_id TEXT NOT NULL,
  contract_id TEXT NOT NULL,
  service_id TEXT NULL,
  metric_name TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  contracted_target TEXT NULL,
  actual_value TEXT NULL,
  value_num NUMERIC(18,4) NULL,
  unit TEXT NULL,
  breach_count NUMERIC(18,4) NULL,
  credit_eligible BOOLEAN NULL,
  credit_calculated NUMERIC(18,2) NULL,
  credit_claimed NUMERIC(18,2) NULL,
  credit_recovered NUMERIC(18,2) NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  source_system TEXT NULL,
  source_record_id TEXT NULL,
  as_of_date DATE NULL,
  confidence NUMERIC(5,4) NULL CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
  quality_state TEXT NOT NULL DEFAULT 'unreviewed',
  evidence_reference TEXT NULL,
  load_run_id TEXT NULL,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, observation_id)
);

CREATE TABLE IF NOT EXISTS source.contract_service_credit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  service_credit_id TEXT NOT NULL,
  contract_id TEXT NOT NULL,
  service_id TEXT NULL,
  period_start DATE NULL,
  period_end DATE NULL,
  trigger_metric TEXT NULL,
  credit_earned NUMERIC(18,2) NULL,
  credit_claimed NUMERIC(18,2) NULL,
  credit_recovered NUMERIC(18,2) NULL,
  credit_waived NUMERIC(18,2) NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'identified',
  owner_role TEXT NULL,
  source_system TEXT NULL,
  source_record_id TEXT NULL,
  as_of_date DATE NULL,
  confidence NUMERIC(5,4) NULL CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
  quality_state TEXT NOT NULL DEFAULT 'unreviewed',
  evidence_reference TEXT NULL,
  load_run_id TEXT NULL,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, service_credit_id)
);

CREATE TABLE IF NOT EXISTS source.contract_milestone (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  milestone_id TEXT NOT NULL,
  contract_id TEXT NOT NULL,
  milestone_type TEXT NOT NULL,
  milestone_name TEXT NOT NULL,
  due_date DATE NULL,
  completed_date DATE NULL,
  payment_amount NUMERIC(18,2) NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'planned',
  owner_role TEXT NULL,
  source_system TEXT NULL,
  source_record_id TEXT NULL,
  as_of_date DATE NULL,
  confidence NUMERIC(5,4) NULL CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
  quality_state TEXT NOT NULL DEFAULT 'unreviewed',
  evidence_reference TEXT NULL,
  load_run_id TEXT NULL,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, milestone_id)
);

CREATE TABLE IF NOT EXISTS source.vendor_risk_observation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  risk_observation_id TEXT NOT NULL,
  vendor_id TEXT NOT NULL,
  risk_type TEXT NOT NULL,
  risk_rating TEXT NULL,
  risk_score NUMERIC(10,4) NULL,
  risk_summary TEXT NULL,
  source_name TEXT NULL,
  source_system TEXT NULL,
  source_record_id TEXT NULL,
  as_of_date DATE NOT NULL,
  confidence NUMERIC(5,4) NULL CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
  quality_state TEXT NOT NULL DEFAULT 'unreviewed',
  evidence_reference TEXT NULL,
  load_run_id TEXT NULL,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, risk_observation_id)
);

CREATE TABLE IF NOT EXISTS source.market_benchmark (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  benchmark_id TEXT NOT NULL,
  benchmark_type TEXT NOT NULL,
  category TEXT NULL,
  service_category TEXT NULL,
  geography TEXT NULL,
  supplier_name TEXT NULL,
  metric_name TEXT NOT NULL,
  benchmark_value NUMERIC(18,4) NULL,
  benchmark_text TEXT NULL,
  unit TEXT NULL,
  currency TEXT NULL,
  low_value NUMERIC(18,4) NULL,
  high_value NUMERIC(18,4) NULL,
  source_name TEXT NULL,
  source_system TEXT NULL,
  source_record_id TEXT NULL,
  as_of_date DATE NOT NULL,
  confidence NUMERIC(5,4) NULL CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
  quality_state TEXT NOT NULL DEFAULT 'unreviewed',
  evidence_reference TEXT NULL,
  load_run_id TEXT NULL,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, benchmark_id)
);

-- ---------------------------------------------------------------------------
-- Deterministic conclusions
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS source.sourcing_opportunity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  opportunity_id TEXT NOT NULL,
  opportunity_type TEXT NOT NULL,
  vendor_id TEXT NULL,
  contract_id TEXT NULL,
  event_id TEXT NULL,
  title TEXT NOT NULL,
  finding_summary TEXT NOT NULL,
  deterministic_basis TEXT NOT NULL,
  value_low NUMERIC(18,2) NULL,
  value_high NUMERIC(18,2) NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  timing_window TEXT NULL,
  confidence NUMERIC(5,4) NULL CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
  quality_state TEXT NOT NULL DEFAULT 'unreviewed',
  recommended_action TEXT NULL,
  accountable_role TEXT NULL,
  evidence_reference TEXT NULL,
  missing_context TEXT NULL,
  as_of_date DATE NULL,
  load_run_id TEXT NULL,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, opportunity_id)
);

CREATE TABLE IF NOT EXISTS source.renewal_decision (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  renewal_decision_id TEXT NOT NULL,
  contract_id TEXT NOT NULL,
  decision_window TEXT NULL,
  notice_deadline DATE NULL,
  current_decision_status TEXT NULL,
  business_dependency TEXT NULL,
  transition_lead_time TEXT NULL,
  market_scan_status TEXT NULL,
  alternative_supplier_status TEXT NULL,
  benchmark_status TEXT NULL,
  recommended_action TEXT NULL,
  accountable_role TEXT NULL,
  decision_due_date DATE NULL,
  as_of_date DATE NULL,
  confidence NUMERIC(5,4) NULL CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
  quality_state TEXT NOT NULL DEFAULT 'unreviewed',
  evidence_reference TEXT NULL,
  load_run_id TEXT NULL,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, renewal_decision_id)
);

CREATE TABLE IF NOT EXISTS source.commercial_variance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  variance_id TEXT NOT NULL,
  contract_id TEXT NULL,
  vendor_id TEXT NULL,
  variance_type TEXT NOT NULL,
  baseline_value NUMERIC(18,2) NULL,
  comparison_value NUMERIC(18,2) NULL,
  variance_amount NUMERIC(18,2) NULL,
  variance_pct NUMERIC(10,4) NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  calculation_basis TEXT NOT NULL,
  period_start DATE NULL,
  period_end DATE NULL,
  confidence NUMERIC(5,4) NULL CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
  quality_state TEXT NOT NULL DEFAULT 'unreviewed',
  evidence_reference TEXT NULL,
  load_run_id TEXT NULL,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, variance_id)
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS source_vendor_tenant_name_idx
  ON source.vendor (tenant_key, legal_name);
CREATE INDEX IF NOT EXISTS source_contract_tenant_vendor_idx
  ON source.contract (tenant_key, vendor_id, expiration_date);
CREATE INDEX IF NOT EXISTS source_contract_term_tenant_contract_idx
  ON source.contract_term (tenant_key, contract_id, term_type);
CREATE INDEX IF NOT EXISTS source_contract_price_component_contract_idx
  ON source.contract_price_component (tenant_key, contract_id, component_type);
CREATE INDEX IF NOT EXISTS source_service_tenant_vendor_idx
  ON source.service (tenant_key, vendor_id, service_category);
CREATE INDEX IF NOT EXISTS source_sourcing_event_tenant_status_idx
  ON source.sourcing_event (tenant_key, event_status, decision_due_date);
CREATE INDEX IF NOT EXISTS source_sourcing_event_supplier_event_idx
  ON source.sourcing_event_supplier (tenant_key, event_id, supplier_status);
CREATE INDEX IF NOT EXISTS source_contract_scope_contract_idx
  ON source.contract_scope (tenant_key, contract_id, scope_type, relationship_method);
CREATE INDEX IF NOT EXISTS source_vendor_application_relationship_vendor_idx
  ON source.vendor_application_relationship (tenant_key, vendor_id, application_ref);
CREATE INDEX IF NOT EXISTS source_vendor_platform_relationship_vendor_idx
  ON source.vendor_platform_relationship (tenant_key, vendor_id, platform_ref);
CREATE INDEX IF NOT EXISTS source_contract_initiative_dependency_detail_contract_idx
  ON source.contract_initiative_dependency_detail (tenant_key, contract_id, initiative_ref);
CREATE INDEX IF NOT EXISTS source_vendor_spend_observation_period_idx
  ON source.vendor_spend_observation (tenant_key, vendor_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS source_contract_consumption_observation_period_idx
  ON source.contract_consumption_observation (tenant_key, contract_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS source_contract_performance_observation_metric_idx
  ON source.contract_performance_observation (tenant_key, contract_id, metric_name, period_start);
CREATE INDEX IF NOT EXISTS source_contract_service_credit_contract_idx
  ON source.contract_service_credit (tenant_key, contract_id, status);
CREATE INDEX IF NOT EXISTS source_contract_milestone_contract_idx
  ON source.contract_milestone (tenant_key, contract_id, due_date);
CREATE INDEX IF NOT EXISTS source_vendor_risk_observation_vendor_idx
  ON source.vendor_risk_observation (tenant_key, vendor_id, risk_type, as_of_date DESC);
CREATE INDEX IF NOT EXISTS source_market_benchmark_category_idx
  ON source.market_benchmark (tenant_key, benchmark_type, category, as_of_date DESC);
CREATE INDEX IF NOT EXISTS source_sourcing_opportunity_tenant_type_idx
  ON source.sourcing_opportunity (tenant_key, opportunity_type, quality_state);
CREATE INDEX IF NOT EXISTS source_renewal_decision_contract_idx
  ON source.renewal_decision (tenant_key, contract_id, decision_due_date);
CREATE INDEX IF NOT EXISTS source_commercial_variance_contract_idx
  ON source.commercial_variance (tenant_key, contract_id, variance_type);

-- ---------------------------------------------------------------------------
-- Updated-at triggers
-- ---------------------------------------------------------------------------

DROP TRIGGER IF EXISTS source_vendor_touch_updated_at ON source.vendor;
CREATE TRIGGER source_vendor_touch_updated_at
BEFORE UPDATE ON source.vendor
FOR EACH ROW EXECUTE FUNCTION source.touch_updated_at();

DROP TRIGGER IF EXISTS source_contract_touch_updated_at ON source.contract;
CREATE TRIGGER source_contract_touch_updated_at
BEFORE UPDATE ON source.contract
FOR EACH ROW EXECUTE FUNCTION source.touch_updated_at();

DROP TRIGGER IF EXISTS source_contract_term_touch_updated_at ON source.contract_term;
CREATE TRIGGER source_contract_term_touch_updated_at
BEFORE UPDATE ON source.contract_term
FOR EACH ROW EXECUTE FUNCTION source.touch_updated_at();

DROP TRIGGER IF EXISTS source_contract_price_component_touch_updated_at ON source.contract_price_component;
CREATE TRIGGER source_contract_price_component_touch_updated_at
BEFORE UPDATE ON source.contract_price_component
FOR EACH ROW EXECUTE FUNCTION source.touch_updated_at();

DROP TRIGGER IF EXISTS source_service_touch_updated_at ON source.service;
CREATE TRIGGER source_service_touch_updated_at
BEFORE UPDATE ON source.service
FOR EACH ROW EXECUTE FUNCTION source.touch_updated_at();

DROP TRIGGER IF EXISTS source_sourcing_event_touch_updated_at ON source.sourcing_event;
CREATE TRIGGER source_sourcing_event_touch_updated_at
BEFORE UPDATE ON source.sourcing_event
FOR EACH ROW EXECUTE FUNCTION source.touch_updated_at();

DROP TRIGGER IF EXISTS source_sourcing_event_supplier_touch_updated_at ON source.sourcing_event_supplier;
CREATE TRIGGER source_sourcing_event_supplier_touch_updated_at
BEFORE UPDATE ON source.sourcing_event_supplier
FOR EACH ROW EXECUTE FUNCTION source.touch_updated_at();

DROP TRIGGER IF EXISTS source_contract_scope_touch_updated_at ON source.contract_scope;
CREATE TRIGGER source_contract_scope_touch_updated_at
BEFORE UPDATE ON source.contract_scope
FOR EACH ROW EXECUTE FUNCTION source.touch_updated_at();

DROP TRIGGER IF EXISTS source_vendor_application_relationship_touch_updated_at ON source.vendor_application_relationship;
CREATE TRIGGER source_vendor_application_relationship_touch_updated_at
BEFORE UPDATE ON source.vendor_application_relationship
FOR EACH ROW EXECUTE FUNCTION source.touch_updated_at();

DROP TRIGGER IF EXISTS source_vendor_platform_relationship_touch_updated_at ON source.vendor_platform_relationship;
CREATE TRIGGER source_vendor_platform_relationship_touch_updated_at
BEFORE UPDATE ON source.vendor_platform_relationship
FOR EACH ROW EXECUTE FUNCTION source.touch_updated_at();

DROP TRIGGER IF EXISTS source_contract_initiative_dependency_detail_touch_updated_at ON source.contract_initiative_dependency_detail;
CREATE TRIGGER source_contract_initiative_dependency_detail_touch_updated_at
BEFORE UPDATE ON source.contract_initiative_dependency_detail
FOR EACH ROW EXECUTE FUNCTION source.touch_updated_at();

DROP TRIGGER IF EXISTS source_vendor_spend_observation_touch_updated_at ON source.vendor_spend_observation;
CREATE TRIGGER source_vendor_spend_observation_touch_updated_at
BEFORE UPDATE ON source.vendor_spend_observation
FOR EACH ROW EXECUTE FUNCTION source.touch_updated_at();

DROP TRIGGER IF EXISTS source_contract_consumption_observation_touch_updated_at ON source.contract_consumption_observation;
CREATE TRIGGER source_contract_consumption_observation_touch_updated_at
BEFORE UPDATE ON source.contract_consumption_observation
FOR EACH ROW EXECUTE FUNCTION source.touch_updated_at();

DROP TRIGGER IF EXISTS source_contract_performance_observation_touch_updated_at ON source.contract_performance_observation;
CREATE TRIGGER source_contract_performance_observation_touch_updated_at
BEFORE UPDATE ON source.contract_performance_observation
FOR EACH ROW EXECUTE FUNCTION source.touch_updated_at();

DROP TRIGGER IF EXISTS source_contract_service_credit_touch_updated_at ON source.contract_service_credit;
CREATE TRIGGER source_contract_service_credit_touch_updated_at
BEFORE UPDATE ON source.contract_service_credit
FOR EACH ROW EXECUTE FUNCTION source.touch_updated_at();

DROP TRIGGER IF EXISTS source_contract_milestone_touch_updated_at ON source.contract_milestone;
CREATE TRIGGER source_contract_milestone_touch_updated_at
BEFORE UPDATE ON source.contract_milestone
FOR EACH ROW EXECUTE FUNCTION source.touch_updated_at();

DROP TRIGGER IF EXISTS source_vendor_risk_observation_touch_updated_at ON source.vendor_risk_observation;
CREATE TRIGGER source_vendor_risk_observation_touch_updated_at
BEFORE UPDATE ON source.vendor_risk_observation
FOR EACH ROW EXECUTE FUNCTION source.touch_updated_at();

DROP TRIGGER IF EXISTS source_market_benchmark_touch_updated_at ON source.market_benchmark;
CREATE TRIGGER source_market_benchmark_touch_updated_at
BEFORE UPDATE ON source.market_benchmark
FOR EACH ROW EXECUTE FUNCTION source.touch_updated_at();

DROP TRIGGER IF EXISTS source_sourcing_opportunity_touch_updated_at ON source.sourcing_opportunity;
CREATE TRIGGER source_sourcing_opportunity_touch_updated_at
BEFORE UPDATE ON source.sourcing_opportunity
FOR EACH ROW EXECUTE FUNCTION source.touch_updated_at();

DROP TRIGGER IF EXISTS source_renewal_decision_touch_updated_at ON source.renewal_decision;
CREATE TRIGGER source_renewal_decision_touch_updated_at
BEFORE UPDATE ON source.renewal_decision
FOR EACH ROW EXECUTE FUNCTION source.touch_updated_at();

DROP TRIGGER IF EXISTS source_commercial_variance_touch_updated_at ON source.commercial_variance;
CREATE TRIGGER source_commercial_variance_touch_updated_at
BEFORE UPDATE ON source.commercial_variance
FOR EACH ROW EXECUTE FUNCTION source.touch_updated_at();

-- ---------------------------------------------------------------------------
-- RLS and grants
-- ---------------------------------------------------------------------------

DO $source_sourcing_context_rls$
DECLARE
  table_name TEXT;
  tables TEXT[] := ARRAY[
    'vendor',
    'contract',
    'contract_term',
    'contract_price_component',
    'service',
    'sourcing_event',
    'sourcing_event_supplier',
    'contract_scope',
    'vendor_application_relationship',
    'vendor_platform_relationship',
    'contract_initiative_dependency_detail',
    'vendor_spend_observation',
    'contract_consumption_observation',
    'contract_performance_observation',
    'contract_service_credit',
    'contract_milestone',
    'vendor_risk_observation',
    'market_benchmark',
    'sourcing_opportunity',
    'renewal_decision',
    'commercial_variance'
  ];
BEGIN
  FOREACH table_name IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE source.%I ENABLE ROW LEVEL SECURITY', table_name);

    EXECUTE format('DROP POLICY IF EXISTS service_role_all_source_%I ON source.%I', table_name, table_name);
    EXECUTE format(
      'CREATE POLICY service_role_all_source_%I ON source.%I FOR ALL USING (auth.role() = ''service_role'') WITH CHECK (auth.role() = ''service_role'')',
      table_name,
      table_name
    );

    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'can_read_tenant_by_key') THEN
      EXECUTE format('DROP POLICY IF EXISTS authenticated_read_source_%I ON source.%I', table_name, table_name);
      EXECUTE format(
        'CREATE POLICY authenticated_read_source_%I ON source.%I FOR SELECT USING (can_read_tenant_by_key(tenant_key))',
        table_name,
        table_name
      );
    END IF;
  END LOOP;
END
$source_sourcing_context_rls$;

GRANT USAGE ON SCHEMA source TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION source.can_read_sourcing_tenant(TEXT) TO authenticated, service_role;
GRANT SELECT ON
  source.vendor,
  source.contract,
  source.contract_term,
  source.contract_price_component,
  source.service,
  source.sourcing_event,
  source.sourcing_event_supplier,
  source.contract_scope,
  source.vendor_application_relationship,
  source.vendor_platform_relationship,
  source.contract_initiative_dependency_detail,
  source.vendor_spend_observation,
  source.contract_consumption_observation,
  source.contract_performance_observation,
  source.contract_service_credit,
  source.contract_milestone,
  source.vendor_risk_observation,
  source.market_benchmark,
  source.sourcing_opportunity,
  source.renewal_decision,
  source.commercial_variance
TO authenticated;
GRANT SELECT, INSERT, UPDATE ON
  source.vendor,
  source.contract,
  source.contract_term,
  source.contract_price_component,
  source.service,
  source.sourcing_event,
  source.sourcing_event_supplier,
  source.contract_scope,
  source.vendor_application_relationship,
  source.vendor_platform_relationship,
  source.contract_initiative_dependency_detail,
  source.vendor_spend_observation,
  source.contract_consumption_observation,
  source.contract_performance_observation,
  source.contract_service_credit,
  source.contract_milestone,
  source.vendor_risk_observation,
  source.market_benchmark,
  source.sourcing_opportunity,
  source.renewal_decision,
  source.commercial_variance
TO service_role;

COMMENT ON TABLE source.vendor IS 'Governed supplier master for Source sourcing decisions. One row per legal supplier per tenant.';
COMMENT ON TABLE source.contract IS 'Governed agreement register for Source. One row per agreement, order form, SOW, amendment or renewal object.';
COMMENT ON TABLE source.contract_term IS 'Commercial, legal, renewal, benchmark, termination and AI-specific terms extracted from contract records or documents.';
COMMENT ON TABLE source.contract_price_component IS 'Contract pricing, rate card, volume band, minimum commitment, overage and credit-cap components.';
COMMENT ON TABLE source.contract_scope IS 'Contract-to-enterprise scope relationships with explicit relationship method and confidence.';
COMMENT ON TABLE source.contract_consumption_observation IS 'Monthly or periodic spend and consumption observations by contract, service and cost center.';
COMMENT ON TABLE source.contract_performance_observation IS 'Contract service performance and SLA observations. Credits are separated into earned, claimed and recovered values.';
COMMENT ON TABLE source.sourcing_opportunity IS 'Deterministic Source opportunities with calculation basis, evidence, confidence and missing context.';

-- Fresh migration replay starts from an empty database, while lab/prod already
-- have these SkyHarbor v3 Source read models from the governed data-load job.
-- Create empty compatibility views only when those upstream read models are
-- absent so this schema extension remains replayable without changing real
-- loaded environments.
DO $source_sourcing_context_upstream_compat$
BEGIN
  IF to_regclass('source.vendor_contract_portfolio') IS NULL THEN
    EXECUTE $compat$
      CREATE VIEW source.vendor_contract_portfolio AS
      SELECT
        NULL::text AS tenant_key,
        NULL::text AS vendor_ref,
        NULL::text AS vendor_name,
        NULL::text AS vendor_category,
        NULL::int AS contract_count,
        NULL::numeric AS annual_value,
        NULL::numeric AS total_committed_value,
        NULL::int AS auto_renew_contracts,
        NULL::date AS next_end_date,
        ARRAY[]::text[] AS contract_refs
      WHERE false
    $compat$;
  END IF;

  IF to_regclass('source.contract_360') IS NULL THEN
    EXECUTE $compat$
      CREATE VIEW source.contract_360 AS
      SELECT
        NULL::text AS tenant_key,
        NULL::text AS contract_id,
        NULL::text AS contract_name,
        NULL::text AS vendor_ref,
        NULL::text AS vendor_name,
        NULL::text AS vendor_category,
        NULL::text AS renewal_decision_state,
        NULL::boolean AS auto_renew,
        NULL::numeric AS annual_value,
        NULL::numeric AS actual_annual_spend,
        NULL::numeric AS committed_annual_spend,
        NULL::numeric AS total_committed_value,
        NULL::date AS end_date,
        NULL::numeric AS notice_period_days,
        NULL::text AS benchmarking_clause,
        NULL::text AS alternatives_available,
        NULL::int AS scoped_application_count,
        NULL::int AS critical_application_count,
        NULL::int AS initiative_dependency_count,
        NULL::boolean AS annual_value_conflict_flag,
        NULL::text AS exit_rights_summary
      WHERE false
    $compat$;
  END IF;

  IF to_regclass('source.contract_application_scope') IS NULL THEN
    EXECUTE $compat$
      CREATE VIEW source.contract_application_scope AS
      SELECT
        NULL::text AS tenant_key,
        NULL::text AS contract_id,
        NULL::text AS vendor_ref,
        NULL::text AS vendor_name,
        NULL::text AS application_ref,
        NULL::text AS application_name,
        NULL::text AS business_function,
        NULL::text AS function_ref,
        NULL::text AS criticality,
        NULL::text AS lifecycle_state,
        NULL::text AS modernization_plan
      WHERE false
    $compat$;
  END IF;
END
$source_sourcing_context_upstream_compat$;

-- ---------------------------------------------------------------------------
-- Consumption projections for Cube / Superset / governed analytics.
-- These views intentionally sit above source.* and existing Source read models;
-- Cube must consume this boundary, not raw tables and not loose joins.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW consumption.sourcing_vendor_v1 AS
WITH vendor_rollup AS (
  SELECT
    tenant_key,
    vendor_ref,
    vendor_name,
    vendor_category,
    contract_count,
    annual_value,
    total_committed_value,
    auto_renew_contracts,
    next_end_date,
    contract_refs,
    row_number() OVER (PARTITION BY tenant_key ORDER BY annual_value DESC NULLS LAST, vendor_name) AS vendor_rank,
    CASE
      WHEN sum(annual_value) OVER (PARTITION BY tenant_key) > 0
        THEN annual_value / sum(annual_value) OVER (PARTITION BY tenant_key)
      ELSE NULL
    END AS portfolio_share_pct,
    CASE
      WHEN sum(annual_value) OVER (PARTITION BY tenant_key) > 0
        THEN sum(annual_value) OVER (
          PARTITION BY tenant_key
          ORDER BY annual_value DESC NULLS LAST, vendor_name
          ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) / sum(annual_value) OVER (PARTITION BY tenant_key)
      ELSE NULL
    END AS cumulative_portfolio_share_pct
  FROM source.vendor_contract_portfolio
)
SELECT
  r.tenant_key,
  r.vendor_ref,
  r.vendor_ref AS vendor_id,
  r.vendor_name,
  r.vendor_name AS legal_name,
  COALESCE(v.parent_company, r.vendor_name) AS parent_vendor,
  r.vendor_category AS category,
  r.vendor_category AS supplier_category,
  v.strategic_status,
  v.country,
  v.region,
  v.diversity_status,
  v.risk_tier,
  v.financial_health_status,
  v.security_risk_status,
  v.relationship_owner_role,
  r.contract_count,
  r.annual_value AS annual_contract_value,
  r.annual_value,
  r.total_committed_value,
  r.auto_renew_contracts,
  r.next_end_date,
  r.contract_refs,
  r.vendor_rank,
  r.portfolio_share_pct,
  r.cumulative_portfolio_share_pct,
  r.vendor_rank <= 5 AS top_5_flag,
  r.vendor_rank <= 10 AS top_10_flag,
  COALESCE(scope.critical_application_count, 0) AS critical_application_count,
  COALESCE(lockin.lock_in_signal_count, 0) AS lock_in_signal_count,
  DATE '2027-06-30' AS as_of_date,
  'skyharbor-v3-live-load-20260803'::text AS knowledge_baseline_ref,
  'sourcing-consumption-v1'::text AS projection_contract_version,
  'accepted'::text AS authority_state,
  COALESCE(v.quality_state, 'accepted') AS quality_state,
  'current'::text AS freshness_state,
  'available'::text AS availability_state,
  v.load_run_id
FROM vendor_rollup r
LEFT JOIN source.vendor v
  ON v.tenant_key = r.tenant_key
 AND v.vendor_id = r.vendor_ref
LEFT JOIN (
  SELECT tenant_key, vendor_ref,
    count(DISTINCT application_ref) FILTER (
      WHERE criticality IN ('Tier 0', 'Tier 1', 'Mission critical', 'Critical')
    ) AS critical_application_count
  FROM source.contract_application_scope
  GROUP BY tenant_key, vendor_ref
) scope
  ON scope.tenant_key = r.tenant_key
 AND scope.vendor_ref = r.vendor_ref
LEFT JOIN (
  SELECT tenant_key, vendor_id AS vendor_ref, count(*) AS lock_in_signal_count
  FROM source.vendor_application_relationship
  WHERE relationship_method IN ('explicit_contract_scope', 'reviewed_mapping')
     OR criticality IN ('Tier 0', 'Tier 1', 'Mission critical', 'Critical')
  GROUP BY tenant_key, vendor_id
) lockin
  ON lockin.tenant_key = r.tenant_key
 AND lockin.vendor_ref = r.vendor_ref
WHERE source.can_read_sourcing_tenant(r.tenant_key);

CREATE OR REPLACE VIEW consumption.sourcing_contract_v1 AS
SELECT
  c.tenant_key,
  c.contract_id AS contract_ref,
  c.contract_id,
  c.contract_name,
  c.vendor_ref,
  c.vendor_ref AS vendor_id,
  c.vendor_name,
  c.vendor_category AS contract_category,
  NULL::text AS agreement_type,
  c.renewal_decision_state AS renewal_type,
  CASE
    WHEN c.end_date IS NOT NULL AND c.end_date < DATE '2027-06-30' THEN 'expired'
    ELSE 'active'
  END AS contract_state,
  c.renewal_decision_state AS renewal_state,
  c.auto_renew,
  c.annual_value AS annual_contract_value,
  c.annual_value,
  c.actual_annual_spend,
  c.committed_annual_spend,
  c.total_committed_value,
  NULL::date AS effective_date,
  c.end_date AS expiration_date,
  (c.end_date - COALESCE(c.notice_period_days, 0)::int) AS notice_deadline,
  ((c.end_date - COALESCE(c.notice_period_days, 0)::int) - DATE '2027-06-30') AS days_to_notice_deadline,
  (c.end_date - DATE '2027-06-30') AS days_to_contract_expiry,
  CASE
    WHEN c.end_date IS NULL OR c.notice_period_days IS NULL THEN 'unknown'
    WHEN (c.end_date - c.notice_period_days::int) < DATE '2027-06-30' AND COALESCE(c.renewal_decision_state, '') NOT IN ('complete', 'decided')
      THEN 'passed_active'
    WHEN (c.end_date - c.notice_period_days::int) <= DATE '2027-06-30' + 90 THEN 'within_90_days'
    WHEN (c.end_date - c.notice_period_days::int) <= DATE '2027-06-30' + 180 THEN 'within_180_days'
    ELSE 'future'
  END AS notice_deadline_state,
  CASE
    WHEN c.end_date IS NULL THEN 'unknown'
    WHEN c.end_date <= DATE '2027-06-30' + 90 THEN 'within_90_days'
    WHEN c.end_date <= DATE '2027-06-30' + 180 THEN 'within_180_days'
    ELSE 'beyond_180_days'
  END AS renewal_urgency_state,
  COALESCE(c.benchmarking_clause, '') <> '' AS benchmark_rights_present,
  CASE
    WHEN COALESCE(c.benchmarking_clause, '') = '' THEN 'not_loaded'
    WHEN c.benchmarking_clause ILIKE '%weak%' OR c.benchmarking_clause ILIKE '%limited%' THEN 'weak'
    ELSE 'present'
  END AS benchmark_status,
  CASE
    WHEN COALESCE(c.alternatives_available, '') ILIKE '%limited%'
      OR COALESCE(c.alternatives_available, '') ILIKE '%none%'
      OR COALESCE(c.alternatives_available, '') = ''
      THEN 'limited'
    ELSE 'available'
  END AS alternatives_status,
  COALESCE(c.benchmarking_clause, '') = ''
    OR c.benchmarking_clause ILIKE '%weak%'
    OR c.benchmarking_clause ILIKE '%limited%' AS weak_benchmark_flag,
  COALESCE(c.alternatives_available, '') ILIKE '%limited%'
    OR COALESCE(c.alternatives_available, '') ILIKE '%none%'
    OR COALESCE(c.alternatives_available, '') = '' AS limited_alternatives_flag,
  COALESCE(c.scoped_application_count, 0) AS scoped_application_count,
  COALESCE(c.critical_application_count, 0) AS critical_application_count,
  COALESCE(c.initiative_dependency_count, 0) AS modernization_dependency_count,
  (COALESCE(c.critical_application_count, 0)
    + CASE WHEN COALESCE(c.alternatives_available, '') ILIKE '%limited%' THEN 1 ELSE 0 END
    + CASE WHEN COALESCE(c.exit_rights_summary, '') ILIKE '%limited%' THEN 1 ELSE 0 END) AS lock_in_signal_count,
  NOT COALESCE(c.annual_value_conflict_flag, false) AS portfolio_rollup_eligible,
  CASE
    WHEN COALESCE(c.annual_value_conflict_flag, false) THEN 0.50::numeric
    WHEN c.annual_value IS NULL THEN 0.60::numeric
    ELSE 0.90::numeric
  END AS confidence,
  'USD'::text AS currency,
  DATE '2027-06-30' AS as_of_date,
  'skyharbor-v3-live-load-20260803'::text AS knowledge_baseline_ref,
  'sourcing-consumption-v1'::text AS projection_contract_version,
  CASE WHEN COALESCE(c.annual_value_conflict_flag, false) THEN 'conflict' ELSE 'accepted' END AS authority_state,
  CASE WHEN COALESCE(c.annual_value_conflict_flag, false) THEN 'conflict' ELSE 'accepted' END AS quality_state,
  'current'::text AS freshness_state,
  CASE WHEN c.annual_value IS NULL THEN 'partial' ELSE 'available' END AS availability_state,
  NULL::text AS load_run_id
FROM source.contract_360 c
WHERE source.can_read_sourcing_tenant(c.tenant_key);

CREATE OR REPLACE VIEW consumption.sourcing_contract_scope_v1 AS
SELECT
  s.tenant_key,
  md5(s.tenant_key || ':' || s.contract_id || ':' || s.application_ref) AS scope_relationship_ref,
  md5(s.tenant_key || ':' || s.contract_id || ':' || s.application_ref) AS contract_scope_id,
  s.contract_id AS contract_ref,
  s.contract_id,
  s.vendor_ref,
  s.vendor_ref AS vendor_id,
  s.vendor_name,
  'application'::text AS scope_type,
  s.application_ref AS scope_ref,
  s.application_name AS scope_name,
  s.business_function,
  s.function_ref,
  s.criticality,
  s.lifecycle_state,
  s.modernization_plan,
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM source.contract_scope cs
      WHERE cs.tenant_key = s.tenant_key
        AND cs.contract_id = s.contract_id
        AND cs.scope_ref = s.application_ref
    ) THEN (
      SELECT cs.relationship_method
      FROM source.contract_scope cs
      WHERE cs.tenant_key = s.tenant_key
        AND cs.contract_id = s.contract_id
        AND cs.scope_ref = s.application_ref
      ORDER BY cs.relationship_confidence DESC
      LIMIT 1
    )
    ELSE 'vendor_based_inference'
  END AS relationship_method,
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM source.contract_scope cs
      WHERE cs.tenant_key = s.tenant_key
        AND cs.contract_id = s.contract_id
        AND cs.scope_ref = s.application_ref
    ) THEN (
      SELECT cs.relationship_confidence
      FROM source.contract_scope cs
      WHERE cs.tenant_key = s.tenant_key
        AND cs.contract_id = s.contract_id
        AND cs.scope_ref = s.application_ref
      ORDER BY cs.relationship_confidence DESC
      LIMIT 1
    )
    ELSE 0.45
  END AS relationship_confidence,
  s.criticality IN ('Tier 0', 'Tier 1', 'Mission critical', 'Critical') AS critical_application_flag,
  s.lifecycle_state ILIKE '%retire%' AS retire_application_flag,
  s.modernization_plan ILIKE '%replace%' AS replace_application_flag,
  DATE '2027-06-30' AS as_of_date,
  'skyharbor-v3-live-load-20260803'::text AS knowledge_baseline_ref,
  'sourcing-consumption-v1'::text AS projection_contract_version,
  'accepted'::text AS authority_state,
  'accepted'::text AS quality_state,
  'current'::text AS freshness_state,
  'available'::text AS availability_state,
  NULL::text AS load_run_id
FROM source.contract_application_scope s
WHERE source.can_read_sourcing_tenant(s.tenant_key);

CREATE OR REPLACE VIEW consumption.sourcing_spend_monthly_v1 AS
SELECT
  tenant_key,
  observation_id,
  contract_id AS contract_ref,
  contract_id,
  service_id AS service_ref,
  service_id,
  business_unit,
  cost_center,
  NULL::text AS service_category,
  period_start AS month,
  committed_amount,
  invoice_amount,
  paid_amount,
  actual_spend,
  consumed_quantity AS consumed_amount,
  overage_amount,
  service_credit_amount AS credit_eligible_amount,
  service_credit_amount AS credit_recovered_amount,
  service_credit_amount,
  CASE
    WHEN committed_amount IS NOT NULL AND actual_spend IS NOT NULL
      THEN committed_amount - actual_spend
    ELSE NULL
  END AS unused_commitment_amount,
  CASE
    WHEN committed_amount IS NOT NULL AND committed_amount <> 0 AND actual_spend IS NOT NULL
      THEN actual_spend / committed_amount
    ELSE NULL
  END AS consumption_rate,
  CASE
    WHEN service_credit_amount IS NOT NULL AND service_credit_amount <> 0
      THEN 1
    ELSE NULL
  END AS credit_recovery_rate,
  currency,
  as_of_date,
  'skyharbor-v3-live-load-20260803'::text AS knowledge_baseline_ref,
  'sourcing-consumption-v1'::text AS projection_contract_version,
  'accepted'::text AS authority_state,
  'current'::text AS freshness_state,
  CASE WHEN actual_spend IS NULL AND invoice_amount IS NULL THEN 'partial' ELSE 'available' END AS availability_state,
  load_run_id
FROM source.contract_consumption_observation
WHERE source.can_read_sourcing_tenant(tenant_key);

CREATE OR REPLACE VIEW consumption.sourcing_performance_v1 AS
SELECT
  tenant_key,
  observation_id,
  contract_id AS contract_ref,
  contract_id,
  service_id AS service_ref,
  service_id,
  metric_name AS metric_ref,
  metric_name,
  period_start AS period,
  period_start,
  period_end,
  unit,
  CASE
    WHEN COALESCE(breach_count, 0) > 0 THEN 'breached'
    WHEN actual_value IS NULL AND value_num IS NULL THEN 'not_loaded'
    ELSE 'met_or_unclassified'
  END AS performance_state,
  CASE
    WHEN COALESCE(credit_recovered, 0) > 0 THEN 'recovered'
    WHEN COALESCE(credit_claimed, 0) > 0 THEN 'claimed'
    WHEN COALESCE(credit_calculated, 0) > 0 THEN 'earned_unclaimed'
    ELSE 'none'
  END AS credit_state,
  CASE WHEN evidence_reference IS NULL OR evidence_reference = '' THEN 'missing' ELSE 'present' END AS evidence_state,
  breach_count,
  credit_eligible,
  credit_calculated AS credit_eligible_amount,
  credit_calculated AS credit_calculated_amount,
  credit_calculated,
  credit_claimed AS credit_claimed_amount,
  credit_claimed,
  credit_recovered AS credit_recovered_amount,
  credit_recovered,
  currency,
  as_of_date,
  'skyharbor-v3-live-load-20260803'::text AS knowledge_baseline_ref,
  'sourcing-consumption-v1'::text AS projection_contract_version,
  'accepted'::text AS authority_state,
  'current'::text AS freshness_state,
  CASE WHEN actual_value IS NULL AND value_num IS NULL THEN 'partial' ELSE 'available' END AS availability_state,
  load_run_id
FROM source.contract_performance_observation
WHERE source.can_read_sourcing_tenant(tenant_key);

CREATE OR REPLACE VIEW consumption.sourcing_opportunity_v1 AS
SELECT
  tenant_key,
  opportunity_id AS opportunity_ref,
  opportunity_id,
  vendor_id AS vendor_ref,
  vendor_id,
  contract_id AS contract_ref,
  contract_id,
  event_id AS event_ref,
  event_id,
  opportunity_type AS action_type,
  opportunity_type,
  title,
  finding_summary,
  deterministic_basis,
  value_low,
  value_high,
  COALESCE(value_high, value_low) AS annual_value_exposed,
  COALESCE(value_low, 0) AS addressable_spend,
  CASE
    WHEN COALESCE(value_high, value_low, 0) >= 10000000 THEN 'high'
    WHEN COALESCE(value_high, value_low, 0) >= 1000000 THEN 'medium'
    ELSE 'low'
  END AS priority,
  confidence,
  CASE
    WHEN quality_state = 'accepted' AND confidence >= 0.75 THEN 'ready_to_act'
    WHEN quality_state IN ('missing_evidence', 'blocked') THEN 'evidence_blocked'
    ELSE 'review_required'
  END AS readiness_state,
  CASE WHEN evidence_reference IS NULL OR evidence_reference = '' THEN 'missing' ELSE 'present' END AS evidence_state,
  recommended_action,
  accountable_role,
  NULL::date AS decision_due_date,
  opportunity_type AS finding_rule_ref,
  as_of_date,
  'skyharbor-v3-live-load-20260803'::text AS knowledge_baseline_ref,
  'sourcing-consumption-v1'::text AS projection_contract_version,
  quality_state AS authority_state,
  'current'::text AS freshness_state,
  'available'::text AS availability_state,
  load_run_id
FROM source.sourcing_opportunity
WHERE source.can_read_sourcing_tenant(tenant_key);

CREATE OR REPLACE VIEW consumption.sourcing_event_v1 AS
SELECT
  tenant_key,
  event_id AS event_ref,
  event_id,
  event_id AS event_name,
  event_type,
  NULL::text AS category,
  business_outcome,
  event_status AS stage,
  event_status AS status,
  event_status,
  incumbent_contracts[1] AS incumbent_contract_ref,
  NULL::text AS incumbent_vendor_ref,
  decision_due_date AS target_decision_date,
  accountable_role AS event_owner_role,
  accountable_role,
  decision_due_date,
  COALESCE(NULLIF(baseline_volumes->>'estimated_annual_value', '')::numeric, 0) AS estimated_annual_value,
  COALESCE(NULLIF(raw_payload->>'requirement_count', '')::numeric, 0) AS requirement_count,
  COALESCE(NULLIF(raw_payload->>'invited_supplier_count', '')::numeric, 0) AS invited_supplier_count,
  COALESCE(NULLIF(raw_payload->>'response_count', '')::numeric, 0) AS response_count,
  COALESCE(NULLIF(raw_payload->>'qualified_supplier_count', '')::numeric, 0) AS qualified_supplier_count,
  COALESCE(NULLIF(raw_payload->>'evaluation_completion_pct', '')::numeric, 0) AS evaluation_completion_pct,
  COALESCE(NULLIF(raw_payload->>'commercial_normalization_completion_pct', '')::numeric, 0) AS commercial_normalization_completion_pct,
  CASE WHEN as_of_date IS NOT NULL THEN DATE '2027-06-30' - as_of_date ELSE NULL END AS days_in_current_stage,
  as_of_date,
  'skyharbor-v3-live-load-20260803'::text AS knowledge_baseline_ref,
  'sourcing-consumption-v1'::text AS projection_contract_version,
  quality_state AS authority_state,
  'current'::text AS freshness_state,
  'available'::text AS availability_state,
  load_run_id
FROM source.sourcing_event
WHERE source.can_read_sourcing_tenant(tenant_key);

CREATE OR REPLACE VIEW consumption.sourcing_event_supplier_v1 AS
SELECT
  tenant_key,
  event_supplier_id,
  event_id AS event_ref,
  event_id,
  vendor_id AS supplier_ref,
  vendor_id,
  supplier_name,
  response_status AS response_state,
  response_status,
  supplier_status AS qualification_state,
  supplier_status,
  recommendation AS recommendation_state,
  recommendation,
  COALESCE(raw_payload->>'bafo_state', 'not_started') AS bafo_state,
  COALESCE(NULLIF(commercial_normalization->>'normalized_annual_value', '')::numeric, 0) AS normalized_annual_value,
  COALESCE(NULLIF(commercial_normalization->>'normalized_total_contract_value', '')::numeric, 0) AS normalized_total_contract_value,
  weighted_score,
  COALESCE(NULLIF(raw_payload->>'commercial_score', '')::numeric, NULL) AS commercial_score,
  COALESCE(NULLIF(raw_payload->>'technical_score', '')::numeric, NULL) AS technical_score,
  risk_score,
  COALESCE(NULLIF(raw_payload->>'exception_count', '')::numeric, 0) AS exception_count,
  as_of_date,
  'skyharbor-v3-live-load-20260803'::text AS knowledge_baseline_ref,
  'sourcing-consumption-v1'::text AS projection_contract_version,
  quality_state AS authority_state,
  'current'::text AS freshness_state,
  'available'::text AS availability_state,
  load_run_id
FROM source.sourcing_event_supplier
WHERE source.can_read_sourcing_tenant(tenant_key);

CREATE OR REPLACE VIEW consumption.sourcing_context_coverage_v1 AS
SELECT tenant_key, 'contracts' AS context_area, count(*) AS row_count, count(*) FILTER (WHERE annual_contract_value IS NOT NULL) AS populated_count
FROM consumption.sourcing_contract_v1
GROUP BY tenant_key
UNION ALL
SELECT tenant_key, 'contract_scope', count(*), count(*) FILTER (WHERE relationship_method <> 'unresolved')
FROM consumption.sourcing_contract_scope_v1
GROUP BY tenant_key
UNION ALL
SELECT tenant_key, 'monthly_spend_consumption', count(*), count(*) FILTER (WHERE actual_spend IS NOT NULL OR invoice_amount IS NOT NULL)
FROM consumption.sourcing_spend_monthly_v1
GROUP BY tenant_key
UNION ALL
SELECT tenant_key, 'performance_sla', count(*), count(*) FILTER (WHERE performance_state <> 'not_loaded')
FROM consumption.sourcing_performance_v1
GROUP BY tenant_key
UNION ALL
SELECT tenant_key, 'opportunities', count(*), count(*) FILTER (WHERE evidence_state = 'present')
FROM consumption.sourcing_opportunity_v1
GROUP BY tenant_key
UNION ALL
SELECT tenant_key, 'sourcing_events', count(*), count(*) FILTER (WHERE status IS NOT NULL)
FROM consumption.sourcing_event_v1
GROUP BY tenant_key;

GRANT USAGE ON SCHEMA consumption TO authenticated, service_role;
GRANT SELECT ON
  consumption.sourcing_vendor_v1,
  consumption.sourcing_contract_v1,
  consumption.sourcing_contract_scope_v1,
  consumption.sourcing_spend_monthly_v1,
  consumption.sourcing_performance_v1,
  consumption.sourcing_opportunity_v1,
  consumption.sourcing_event_v1,
  consumption.sourcing_event_supplier_v1,
  consumption.sourcing_context_coverage_v1
TO authenticated, service_role;

COMMIT;
