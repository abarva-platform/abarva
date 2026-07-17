-- Tower foundation table ledger repair
--
-- Production Azure/Postgres reported the historical Tower CMDB/workforce
-- migrations as applied, while the physical tables were absent. This additive
-- repair creates the missing tables idempotently without replaying historical
-- migration ledger rows.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.tower_cmdb_cis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL,
  ci_sys_id TEXT NOT NULL,
  ci_name TEXT NOT NULL,
  ci_type TEXT NOT NULL,
  ci_class TEXT NOT NULL,
  lifecycle_state TEXT NOT NULL
    CHECK (lifecycle_state IN ('production', 'pre_production', 'dev', 'test', 'retired', 'planned')),
  owner_team TEXT NOT NULL,
  business_service TEXT NOT NULL,
  criticality TEXT NOT NULL
    CHECK (criticality IN ('tier_1', 'tier_2', 'tier_3', 'tier_4')),
  environment TEXT NOT NULL,
  source_system TEXT NOT NULL DEFAULT 'servicenow_cmdb',
  ingest_run_id UUID,
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT tower_cmdb_cis_tenant_ci_unique UNIQUE (client_id, ci_sys_id)
);

CREATE INDEX IF NOT EXISTS tower_cmdb_cis_client_idx
  ON public.tower_cmdb_cis (client_id);

CREATE INDEX IF NOT EXISTS tower_cmdb_cis_business_service_idx
  ON public.tower_cmdb_cis (client_id, business_service);

CREATE INDEX IF NOT EXISTS tower_cmdb_cis_criticality_idx
  ON public.tower_cmdb_cis (client_id, criticality);

CREATE INDEX IF NOT EXISTS tower_cmdb_cis_lifecycle_idx
  ON public.tower_cmdb_cis (client_id, lifecycle_state);

CREATE TABLE IF NOT EXISTS public.tower_cmdb_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL,
  source_ci_sys_id TEXT NOT NULL,
  target_ci_sys_id TEXT NOT NULL,
  dependency_type TEXT NOT NULL
    CHECK (dependency_type IN ('depends_on', 'runs_on', 'connects_to')),
  source_system TEXT NOT NULL DEFAULT 'servicenow_cmdb',
  ingest_run_id UUID,
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT tower_cmdb_dependencies_self_ref_check
    CHECK (source_ci_sys_id <> target_ci_sys_id),
  CONSTRAINT tower_cmdb_dependencies_unique
    UNIQUE (client_id, source_ci_sys_id, target_ci_sys_id, dependency_type)
);

CREATE INDEX IF NOT EXISTS tower_cmdb_dependencies_client_idx
  ON public.tower_cmdb_dependencies (client_id);

CREATE INDEX IF NOT EXISTS tower_cmdb_dependencies_source_idx
  ON public.tower_cmdb_dependencies (client_id, source_ci_sys_id);

CREATE INDEX IF NOT EXISTS tower_cmdb_dependencies_target_idx
  ON public.tower_cmdb_dependencies (client_id, target_ci_sys_id);

CREATE TABLE IF NOT EXISTS public.tower_workforce (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL,
  function TEXT NOT NULL,
  sub_function TEXT,
  location TEXT,
  level TEXT,
  contractor_flag BOOLEAN NOT NULL DEFAULT FALSE,
  start_date DATE NOT NULL,
  attrition_date DATE,
  attrition_reason TEXT,
  source_file_id UUID,
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  as_of_date DATE NOT NULL,
  data_class TEXT NOT NULL DEFAULT 'restricted'
    CHECK (data_class IN ('public', 'internal', 'confidential', 'restricted')),
  CONSTRAINT tower_workforce_attrition_ordering
    CHECK (attrition_date IS NULL OR attrition_date >= start_date),
  CONSTRAINT tower_workforce_unique_per_snapshot
    UNIQUE (client_id, employee_id, as_of_date)
);

CREATE INDEX IF NOT EXISTS idx_tower_workforce_client_function
  ON public.tower_workforce (client_id, function);

CREATE INDEX IF NOT EXISTS idx_tower_workforce_client_as_of
  ON public.tower_workforce (client_id, as_of_date DESC);

CREATE INDEX IF NOT EXISTS idx_tower_workforce_attrition
  ON public.tower_workforce (client_id, attrition_date)
  WHERE attrition_date IS NOT NULL;

CREATE OR REPLACE FUNCTION public.tower_foundation_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tower_cmdb_cis_set_updated_at ON public.tower_cmdb_cis;
CREATE TRIGGER tower_cmdb_cis_set_updated_at
  BEFORE UPDATE ON public.tower_cmdb_cis
  FOR EACH ROW EXECUTE FUNCTION public.tower_foundation_set_updated_at();

DROP TRIGGER IF EXISTS tower_cmdb_dependencies_set_updated_at ON public.tower_cmdb_dependencies;
CREATE TRIGGER tower_cmdb_dependencies_set_updated_at
  BEFORE UPDATE ON public.tower_cmdb_dependencies
  FOR EACH ROW EXECUTE FUNCTION public.tower_foundation_set_updated_at();

COMMENT ON TABLE public.tower_cmdb_cis IS
  'Application and systems inventory rows used by Moves current-state readiness and Tower context.';
COMMENT ON TABLE public.tower_workforce IS
  'Redacted workforce/org-structure snapshot rows used by Moves current-state readiness and Tower context.';
COMMENT ON COLUMN public.tower_workforce.employee_id IS
  'Synthetic or redacted worker identifier. Never a raw HRIS worker ID for real-customer ingests.';

COMMIT;
