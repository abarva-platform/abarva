-- Tower demo-readiness materialized plane
--
-- Additive only. This does not remove or mutate upstream source tables.
-- Runtime Tower surfaces should read these tower_* read models; upstream
-- context/AI-control projections are allowed only inside a materialization job.

BEGIN;

DO $$ BEGIN
  CREATE TYPE tower_amount_type AS ENUM (
    'annual_license',
    'annual_subscription',
    'annual_run_rate',
    'one_time_implementation',
    'multi_year_program_budget',
    'internal_labor',
    'managed_services',
    'cloud_consumption',
    'contract_value',
    'committed_value',
    'forecast_value',
    'realized_value',
    'value_at_stake',
    'renewal_exposure',
    'unknown'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE tower_accounting_treatment AS ENUM ('opex', 'capex', 'mixed', 'unknown');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE tower_spend_posture AS ENUM ('run', 'change', 'transformation', 'innovation', 'regulatory', 'unknown');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE tower_scope_type AS ENUM (
    'corporate_shared_service',
    'portfolio_company_specific',
    'enterprise_shared_platform',
    'allocated_corporate_cost',
    'unknown'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE tower_allocation_method AS ENUM (
    'direct',
    'revenue_based',
    'headcount_based',
    'usage_based',
    'equal_split',
    'manual_allocation',
    'unknown'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.tower_materialization_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  source_set JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'succeeded', 'failed')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tower_materialization_runs_client
  ON public.tower_materialization_runs(client_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_tower_materialization_runs_tenant
  ON public.tower_materialization_runs(tenant_key, started_at DESC);

CREATE TABLE IF NOT EXISTS public.tower_read_model_initiatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  materialization_run_id UUID REFERENCES public.tower_materialization_runs(id) ON DELETE SET NULL,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  period_label TEXT NOT NULL DEFAULT 'current',

  initiative_id TEXT NOT NULL,
  display_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category_id TEXT NOT NULL DEFAULT 'it_portfolio',
  category_name TEXT NOT NULL DEFAULT 'IT portfolio',
  goal_id TEXT NOT NULL DEFAULT 'tower_it_portfolio',
  goal_name TEXT NOT NULL DEFAULT 'IT portfolio value and control',
  stage TEXT NOT NULL DEFAULT 'pilot',
  stage_detail TEXT,
  owner_name TEXT NOT NULL DEFAULT 'Loaded owner role',
  owner_title TEXT NOT NULL DEFAULT 'Loaded owner role',
  owner_function TEXT,
  committed_annual_usd NUMERIC(14,2),
  committed_total_usd NUMERIC(14,2),
  measured_value_usd NUMERIC(14,2),
  status_flag TEXT NOT NULL DEFAULT 'healthy',
  status_summary TEXT NOT NULL DEFAULT '',
  confidence_level TEXT NOT NULL DEFAULT 'MED',
  aligned_callout BOOLEAN NOT NULL DEFAULT false,
  aligned_rationale TEXT,
  loaded_via_template TEXT NOT NULL DEFAULT 'tower_materialized_read_model',

  amount_type tower_amount_type NOT NULL DEFAULT 'unknown',
  accounting_treatment tower_accounting_treatment NOT NULL DEFAULT 'unknown',
  spend_posture tower_spend_posture NOT NULL DEFAULT 'unknown',
  scope_type tower_scope_type NOT NULL DEFAULT 'unknown',
  allocation_method tower_allocation_method NOT NULL DEFAULT 'unknown',
  portfolio_company TEXT,
  operating_company TEXT,
  legal_entity TEXT,
  business_unit TEXT,
  business_function TEXT,

  is_synthetic BOOLEAN NOT NULL DEFAULT false,
  is_outlier BOOLEAN NOT NULL DEFAULT false,
  evidence_ids TEXT[] NOT NULL DEFAULT '{}',
  citations JSONB NOT NULL DEFAULT '[]'::jsonb,
  lineage JSONB NOT NULL DEFAULT '{}'::jsonb,
  gaps JSONB NOT NULL DEFAULT '[]'::jsonb,
  freshness_status TEXT NOT NULL DEFAULT 'unknown',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT tower_rm_initiatives_amounts_nonneg CHECK (
    (committed_annual_usd IS NULL OR committed_annual_usd >= 0)
    AND (committed_total_usd IS NULL OR committed_total_usd >= 0)
    AND (measured_value_usd IS NULL OR measured_value_usd >= 0)
  ),
  CONSTRAINT tower_rm_initiatives_key UNIQUE (client_id, initiative_id, period_label)
);

CREATE INDEX IF NOT EXISTS idx_tower_rm_initiatives_client
  ON public.tower_read_model_initiatives(client_id, period_label);
CREATE INDEX IF NOT EXISTS idx_tower_rm_initiatives_tenant
  ON public.tower_read_model_initiatives(tenant_key, period_label);
CREATE INDEX IF NOT EXISTS idx_tower_rm_initiatives_status
  ON public.tower_read_model_initiatives(client_id, status_flag);

DROP TRIGGER IF EXISTS tower_read_model_initiatives_set_updated_at
  ON public.tower_read_model_initiatives;
CREATE TRIGGER tower_read_model_initiatives_set_updated_at
  BEFORE UPDATE ON public.tower_read_model_initiatives
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TABLE IF NOT EXISTS public.tower_read_model_vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  materialization_run_id UUID REFERENCES public.tower_materialization_runs(id) ON DELETE SET NULL,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  period_label TEXT NOT NULL DEFAULT 'current',

  vendor_id TEXT NOT NULL,
  vendor_name TEXT NOT NULL,
  logical_vendor_key TEXT NOT NULL,
  initiative_id TEXT,
  initiative_display_id TEXT,
  initiative_name TEXT,
  contract_value_usd NUMERIC(14,2),
  renewal_date DATE,
  financial_health TEXT,

  amount_type tower_amount_type NOT NULL DEFAULT 'unknown',
  accounting_treatment tower_accounting_treatment NOT NULL DEFAULT 'unknown',
  spend_posture tower_spend_posture NOT NULL DEFAULT 'unknown',
  scope_type tower_scope_type NOT NULL DEFAULT 'unknown',
  allocation_method tower_allocation_method NOT NULL DEFAULT 'unknown',
  is_duplicate_rollup BOOLEAN NOT NULL DEFAULT false,
  duplicate_group_key TEXT,
  duplicate_raw_row_count INTEGER NOT NULL DEFAULT 1 CHECK (duplicate_raw_row_count >= 1),
  is_synthetic BOOLEAN NOT NULL DEFAULT false,
  is_outlier BOOLEAN NOT NULL DEFAULT false,
  evidence_ids TEXT[] NOT NULL DEFAULT '{}',
  citations JSONB NOT NULL DEFAULT '[]'::jsonb,
  lineage JSONB NOT NULL DEFAULT '{}'::jsonb,
  gaps JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT tower_rm_vendors_amount_nonneg
    CHECK (contract_value_usd IS NULL OR contract_value_usd >= 0),
  CONSTRAINT tower_rm_vendors_key UNIQUE (client_id, logical_vendor_key, period_label)
);

CREATE INDEX IF NOT EXISTS idx_tower_rm_vendors_client
  ON public.tower_read_model_vendors(client_id, period_label);
CREATE INDEX IF NOT EXISTS idx_tower_rm_vendors_tenant
  ON public.tower_read_model_vendors(tenant_key, period_label);
CREATE INDEX IF NOT EXISTS idx_tower_rm_vendors_renewal
  ON public.tower_read_model_vendors(client_id, renewal_date)
  WHERE renewal_date IS NOT NULL;

DROP TRIGGER IF EXISTS tower_read_model_vendors_set_updated_at
  ON public.tower_read_model_vendors;
CREATE TRIGGER tower_read_model_vendors_set_updated_at
  BEFORE UPDATE ON public.tower_read_model_vendors
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TABLE IF NOT EXISTS public.tower_gap_register (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  gap_key TEXT NOT NULL,
  gap_type TEXT NOT NULL,
  label TEXT NOT NULL,
  impact TEXT NOT NULL,
  required_source TEXT,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  surface TEXT NOT NULL DEFAULT 'tower',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'accepted')),
  lineage JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT tower_gap_register_key UNIQUE (client_id, gap_key)
);

CREATE INDEX IF NOT EXISTS idx_tower_gap_register_client
  ON public.tower_gap_register(client_id, status, severity);

DROP TRIGGER IF EXISTS tower_gap_register_set_updated_at ON public.tower_gap_register;
CREATE TRIGGER tower_gap_register_set_updated_at
  BEFORE UPDATE ON public.tower_gap_register
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TABLE IF NOT EXISTS public.tower_spend_realism_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  object_type TEXT NOT NULL,
  object_key TEXT NOT NULL,
  source_value_usd NUMERIC(14,2),
  recomputed_value_usd NUMERIC(14,2),
  benchmark_unit_price_usd NUMERIC(14,2),
  seat_count NUMERIC(14,2),
  amount_type tower_amount_type NOT NULL DEFAULT 'unknown',
  verdict TEXT NOT NULL CHECK (verdict IN ('pass', 'outlier_withheld', 'gap_amount_type', 'directional_only')),
  rule_key TEXT NOT NULL,
  notes TEXT,
  lineage JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT tower_spend_realism_audit_key UNIQUE (client_id, object_type, object_key, rule_key)
);

CREATE INDEX IF NOT EXISTS idx_tower_spend_realism_audit_client
  ON public.tower_spend_realism_audit(client_id, verdict);

CREATE TABLE IF NOT EXISTS public.tower_forbidden_identifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  identifier TEXT NOT NULL,
  identifier_type TEXT NOT NULL DEFAULT 'client_identity',
  severity TEXT NOT NULL DEFAULT 'critical' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  active BOOLEAN NOT NULL DEFAULT true,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tower_forbidden_identifiers_tenant
  ON public.tower_forbidden_identifiers(tenant_key, active);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tower_forbidden_identifiers_key
  ON public.tower_forbidden_identifiers(tenant_key, lower(identifier));

CREATE TABLE IF NOT EXISTS public.tower_answer_trace (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  tenant_key TEXT NOT NULL,
  surface TEXT NOT NULL DEFAULT 'tower',
  question TEXT NOT NULL,
  generated_system_prompt TEXT,
  generated_user_prompt TEXT,
  claude_raw_response TEXT,
  parser_result JSONB NOT NULL DEFAULT '{}'::jsonb,
  final_answer JSONB NOT NULL DEFAULT '{}'::jsonb,
  rendered_artifacts JSONB NOT NULL DEFAULT '{}'::jsonb,
  validation_result JSONB NOT NULL DEFAULT '{}'::jsonb,
  translation_warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
  model TEXT,
  fallback_used BOOLEAN NOT NULL DEFAULT false,
  fallback_reason TEXT,
  latency_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tower_answer_trace_tenant
  ON public.tower_answer_trace(tenant_key, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tower_answer_trace_client
  ON public.tower_answer_trace(client_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.tower_l3_answer_dossiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  scope_key TEXT NOT NULL,
  scope_type TEXT NOT NULL CHECK (scope_type IN ('l1_consolidated', 'l2_company_comparison', 'l3_operating_company', 'tenant')),
  scope_label TEXT NOT NULL,
  view_key TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  dossier_version TEXT NOT NULL,
  stage1_status TEXT NOT NULL CHECK (stage1_status IN ('built', 'empty', 'failed')),
  stage2_status TEXT NOT NULL CHECK (stage2_status IN ('enriched', 'unavailable', 'failed')),
  coverage_score NUMERIC(5,4) NOT NULL DEFAULT 0 CHECK (coverage_score >= 0 AND coverage_score <= 1),
  verdict TEXT NOT NULL CHECK (verdict IN ('SKELETON_COMPLETE', 'SKELETON_PARTIAL', 'SKELETON_THIN', 'DEEP', 'PARTIAL', 'THIN', 'EMPTY', 'FAILED')),
  dossier JSONB NOT NULL,
  validation_result JSONB NOT NULL DEFAULT '{}'::jsonb,
  lineage JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT tower_l3_answer_dossiers_key
    UNIQUE (client_id, tenant_key, scope_key, view_key, prompt_version, dossier_version)
);

CREATE INDEX IF NOT EXISTS idx_tower_l3_answer_dossiers_tenant
  ON public.tower_l3_answer_dossiers(tenant_key, scope_key, view_key, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tower_l3_answer_dossiers_client
  ON public.tower_l3_answer_dossiers(client_id, view_key, created_at DESC);

ALTER TABLE public.tower_materialization_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tower_read_model_initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tower_read_model_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tower_gap_register ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tower_spend_realism_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tower_forbidden_identifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tower_answer_trace ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tower_l3_answer_dossiers ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'tower_materialization_runs',
    'tower_read_model_initiatives',
    'tower_read_model_vendors',
    'tower_gap_register',
    'tower_spend_realism_audit',
    'tower_answer_trace',
    'tower_l3_answer_dossiers'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', table_name || '_service_role', table_name);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I AS PERMISSIVE FOR ALL TO PUBLIC USING (auth.role() = ''service_role'') WITH CHECK (auth.role() = ''service_role'')',
      table_name || '_service_role',
      table_name
    );

    IF to_regprocedure('can_read_tenant_by_id(uuid)') IS NOT NULL THEN
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', table_name || '_tenant_read', table_name);
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (can_read_tenant_by_id(client_id))',
        table_name || '_tenant_read',
        table_name
      );
    END IF;
  END LOOP;

  DROP POLICY IF EXISTS tower_forbidden_identifiers_service_role ON public.tower_forbidden_identifiers;
  CREATE POLICY tower_forbidden_identifiers_service_role ON public.tower_forbidden_identifiers
    AS PERMISSIVE FOR ALL TO PUBLIC
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

  IF to_regprocedure('can_read_tenant_by_key(text)') IS NOT NULL THEN
    DROP POLICY IF EXISTS tower_forbidden_identifiers_tenant_read ON public.tower_forbidden_identifiers;
    CREATE POLICY tower_forbidden_identifiers_tenant_read ON public.tower_forbidden_identifiers
      FOR SELECT TO authenticated
      USING (can_read_tenant_by_key(tenant_key));
  END IF;
END $$;

COMMIT;
