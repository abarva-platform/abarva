-- Tower · ServiceNow CMDB ingest (S5)
--
-- Adds two tables Tower writes into when a customer uploads the
-- ServiceNow CMDB workbook (or an equivalent CI / dependency extract from
-- another CMDB). Schema mirrors the parsed workbook one-for-one so the
-- ingest CLI is a thin upsert layer, not a join-and-reshape step.
--
-- Idempotency contract:
--   * tower_cmdb_cis is keyed by (client_id, ci_sys_id) — a re-upload of
--     the same workbook upserts rows in place.
--   * tower_cmdb_dependencies is keyed by
--     (client_id, source_ci_sys_id, target_ci_sys_id, dependency_type) —
--     duplicate edges fold into a single row.
--
-- Both tables are tenant-scoped on client_id with a strict CHECK so a
-- mis-routed ingest fails fast instead of cross-contaminating tenants.

BEGIN;

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
  CONSTRAINT tower_cmdb_dependencies_unique UNIQUE
    (client_id, source_ci_sys_id, target_ci_sys_id, dependency_type)
);

CREATE INDEX IF NOT EXISTS tower_cmdb_dependencies_client_idx
  ON public.tower_cmdb_dependencies (client_id);

CREATE INDEX IF NOT EXISTS tower_cmdb_dependencies_source_idx
  ON public.tower_cmdb_dependencies (client_id, source_ci_sys_id);

CREATE INDEX IF NOT EXISTS tower_cmdb_dependencies_target_idx
  ON public.tower_cmdb_dependencies (client_id, target_ci_sys_id);

-- updated_at maintenance: keep in sync with the platform-wide trigger
-- helper installed earlier (set_updated_at). If not present yet (fresh
-- environment) the function is created as a no-op fallback.
CREATE OR REPLACE FUNCTION public.tower_cmdb_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tower_cmdb_cis_set_updated_at ON public.tower_cmdb_cis;
CREATE TRIGGER tower_cmdb_cis_set_updated_at
  BEFORE UPDATE ON public.tower_cmdb_cis
  FOR EACH ROW EXECUTE FUNCTION public.tower_cmdb_set_updated_at();

DROP TRIGGER IF EXISTS tower_cmdb_dependencies_set_updated_at ON public.tower_cmdb_dependencies;
CREATE TRIGGER tower_cmdb_dependencies_set_updated_at
  BEFORE UPDATE ON public.tower_cmdb_dependencies
  FOR EACH ROW EXECUTE FUNCTION public.tower_cmdb_set_updated_at();

COMMIT;
