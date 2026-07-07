-- Source P1 · Existing-contract optimization MVE substrate.
--
-- Non-destructive extension: keeps raw/source files in source_artifacts and stores
-- the minimum sourcing-critical extraction profile, findings, and negotiation
-- levers in typed tenant-scoped tables. This is not a document-Q&A store.

BEGIN;

CREATE TABLE IF NOT EXISTS public.source_contract_optimization_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  source_event_id TEXT NOT NULL,
  incumbent_vendor_id TEXT NULL,
  incumbent_vendor_name TEXT NOT NULL,
  contract_name TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'client_uploaded',
  synthetic_demo BOOLEAN NOT NULL DEFAULT false,
  decision_use TEXT NOT NULL,
  current_annual_run_rate_usd NUMERIC(18,2) NULL,
  term_start DATE NULL,
  term_end DATE NULL,
  renewal_notice_date DATE NULL,
  ready_for_optimization TEXT NOT NULL,
  ready_reason TEXT NOT NULL,
  extraction_boundary TEXT NOT NULL,
  profile_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  evidence_artifact_ids UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
  evidence_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_source_contract_optimization_profiles_event
  ON public.source_contract_optimization_profiles (tenant_key, source_event_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.source_contract_optimization_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.source_contract_optimization_profiles(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  source_event_id TEXT NOT NULL,
  finding_key TEXT NOT NULL,
  category TEXT NOT NULL,
  severity TEXT NOT NULL,
  title TEXT NOT NULL,
  current_state TEXT NOT NULL,
  sourcing_implication TEXT NOT NULL,
  recommended_action TEXT NOT NULL,
  estimated_annual_impact_usd NUMERIC(18,2) NULL,
  confidence TEXT NOT NULL,
  evidence_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_source_contract_optimization_findings_event
  ON public.source_contract_optimization_findings (tenant_key, source_event_id, category, severity);

CREATE TABLE IF NOT EXISTS public.source_contract_optimization_levers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.source_contract_optimization_profiles(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  source_event_id TEXT NOT NULL,
  lever_key TEXT NOT NULL,
  lever_type TEXT NOT NULL,
  finding_key TEXT NOT NULL,
  priority TEXT NOT NULL,
  buyer_ask TEXT NOT NULL,
  negotiation_language TEXT NOT NULL,
  value_basis TEXT NOT NULL,
  annual_impact_low_usd NUMERIC(18,2) NULL,
  annual_impact_high_usd NUMERIC(18,2) NULL,
  owner_role TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_source_contract_optimization_levers_event
  ON public.source_contract_optimization_levers (tenant_key, source_event_id, priority, lever_type);

ALTER TABLE public.source_contract_optimization_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_contract_optimization_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_contract_optimization_levers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_all_source_contract_optimization_profiles
  ON public.source_contract_optimization_profiles;
CREATE POLICY service_role_all_source_contract_optimization_profiles
  ON public.source_contract_optimization_profiles
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS service_role_all_source_contract_optimization_findings
  ON public.source_contract_optimization_findings;
CREATE POLICY service_role_all_source_contract_optimization_findings
  ON public.source_contract_optimization_findings
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS service_role_all_source_contract_optimization_levers
  ON public.source_contract_optimization_levers;
CREATE POLICY service_role_all_source_contract_optimization_levers
  ON public.source_contract_optimization_levers
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DO $source_contract_optimization_rls$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'can_read_tenant_by_key') THEN
    DROP POLICY IF EXISTS authenticated_read_source_contract_optimization_profiles
      ON public.source_contract_optimization_profiles;
    CREATE POLICY authenticated_read_source_contract_optimization_profiles
      ON public.source_contract_optimization_profiles
      FOR SELECT USING (can_read_tenant_by_key(tenant_key));

    DROP POLICY IF EXISTS authenticated_read_source_contract_optimization_findings
      ON public.source_contract_optimization_findings;
    CREATE POLICY authenticated_read_source_contract_optimization_findings
      ON public.source_contract_optimization_findings
      FOR SELECT USING (can_read_tenant_by_key(tenant_key));

    DROP POLICY IF EXISTS authenticated_read_source_contract_optimization_levers
      ON public.source_contract_optimization_levers;
    CREATE POLICY authenticated_read_source_contract_optimization_levers
      ON public.source_contract_optimization_levers
      FOR SELECT USING (can_read_tenant_by_key(tenant_key));
  END IF;
END
$source_contract_optimization_rls$;

GRANT SELECT ON public.source_contract_optimization_profiles TO authenticated;
GRANT SELECT ON public.source_contract_optimization_findings TO authenticated;
GRANT SELECT ON public.source_contract_optimization_levers TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.source_contract_optimization_profiles TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.source_contract_optimization_findings TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.source_contract_optimization_levers TO service_role;

COMMENT ON TABLE public.source_contract_optimization_profiles IS
  'Source existing-contract optimization MVE profile. Raw files remain in source_artifacts; this table stores structured sourcing-critical contract optimization output.';
COMMENT ON TABLE public.source_contract_optimization_findings IS
  'Evidence-backed contract optimization findings: invoice leakage, SLA economics, staffing coverage, operational demand, renewal leverage.';
COMMENT ON TABLE public.source_contract_optimization_levers IS
  'Negotiation and optimization levers derived from contract optimization findings.';

COMMIT;
