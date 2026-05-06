-- Phase 5 · Step 4 · Tower + Intelligence tables — per-user read policies
--
-- Adds authenticated-role SELECT policies to Tower and Intelligence tables.
-- Tower and Intelligence are largely shared-read surfaces: everyone in the
-- tenant can read; maestros can read across all tenants.
--
-- Special cases:
--   use_case_* sub-tables: no direct client_id; policy joins through use_cases
--   intelligence_session_log: has both client_id UUID and tenant_key TEXT
--   intelligence_surface_content_registry: global content registry, no tenant
--
-- Pattern (UUID tables):
--   USING ( can_read_tenant_by_id(client_id) )
--
-- Pattern (subtables with FK to parent):
--   USING ( EXISTS (SELECT 1 FROM <parent> p WHERE p.id = <subtable>.parent_id
--                   AND can_read_tenant_by_id(p.client_id)) )
--
-- PREREQUISITE: 20260507100000_rls_role_helpers.sql (provides helpers).

BEGIN;

-- ── TOWER ──────────────────────────────────────────────────────────────────

-- atlas_threads
DROP POLICY IF EXISTS "authenticated_read_atlas_threads" ON atlas_threads;
CREATE POLICY "authenticated_read_atlas_threads" ON atlas_threads
  FOR SELECT TO authenticated
  USING ( can_read_tenant_by_id(client_id) );

GRANT SELECT ON atlas_threads TO authenticated;


-- atlas_observations
DROP POLICY IF EXISTS "authenticated_read_atlas_observations" ON atlas_observations;
CREATE POLICY "authenticated_read_atlas_observations" ON atlas_observations
  FOR SELECT TO authenticated
  USING ( can_read_tenant_by_id(client_id) );

GRANT SELECT ON atlas_observations TO authenticated;


-- signal_firings
DROP POLICY IF EXISTS "authenticated_read_signal_firings" ON signal_firings;
CREATE POLICY "authenticated_read_signal_firings" ON signal_firings
  FOR SELECT TO authenticated
  USING ( can_read_tenant_by_id(client_id) );

GRANT SELECT ON signal_firings TO authenticated;


-- use_cases
DROP POLICY IF EXISTS "authenticated_read_use_cases" ON use_cases;
CREATE POLICY "authenticated_read_use_cases" ON use_cases
  FOR SELECT TO authenticated
  USING ( can_read_tenant_by_id(client_id) );

GRANT SELECT ON use_cases TO authenticated;


-- use_case_usage_metrics · joins through use_cases
DROP POLICY IF EXISTS "authenticated_read_use_case_usage_metrics" ON use_case_usage_metrics;
CREATE POLICY "authenticated_read_use_case_usage_metrics" ON use_case_usage_metrics
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM use_cases uc
      WHERE uc.id = use_case_usage_metrics.use_case_id
        AND can_read_tenant_by_id(uc.client_id)
    )
  );

GRANT SELECT ON use_case_usage_metrics TO authenticated;


-- use_case_value_metrics · joins through use_cases
DROP POLICY IF EXISTS "authenticated_read_use_case_value_metrics" ON use_case_value_metrics;
CREATE POLICY "authenticated_read_use_case_value_metrics" ON use_case_value_metrics
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM use_cases uc
      WHERE uc.id = use_case_value_metrics.use_case_id
        AND can_read_tenant_by_id(uc.client_id)
    )
  );

GRANT SELECT ON use_case_value_metrics TO authenticated;


-- use_case_risk · joins through use_cases
DROP POLICY IF EXISTS "authenticated_read_use_case_risk" ON use_case_risk;
CREATE POLICY "authenticated_read_use_case_risk" ON use_case_risk
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM use_cases uc
      WHERE uc.id = use_case_risk.use_case_id
        AND can_read_tenant_by_id(uc.client_id)
    )
  );

GRANT SELECT ON use_case_risk TO authenticated;


-- use_case_cost_metrics · joins through use_cases
DROP POLICY IF EXISTS "authenticated_read_use_case_cost_metrics" ON use_case_cost_metrics;
CREATE POLICY "authenticated_read_use_case_cost_metrics" ON use_case_cost_metrics
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM use_cases uc
      WHERE uc.id = use_case_cost_metrics.use_case_id
        AND can_read_tenant_by_id(uc.client_id)
    )
  );

GRANT SELECT ON use_case_cost_metrics TO authenticated;


-- ── INTELLIGENCE ───────────────────────────────────────────────────────────

-- kpis
DROP POLICY IF EXISTS "authenticated_read_kpis" ON kpis;
CREATE POLICY "authenticated_read_kpis" ON kpis
  FOR SELECT TO authenticated
  USING ( can_read_tenant_by_id(client_id) );

GRANT SELECT ON kpis TO authenticated;


-- pattern_packs
DROP POLICY IF EXISTS "authenticated_read_pattern_packs" ON pattern_packs;
CREATE POLICY "authenticated_read_pattern_packs" ON pattern_packs
  FOR SELECT TO authenticated
  USING ( can_read_tenant_by_id(client_id) );

GRANT SELECT ON pattern_packs TO authenticated;


-- benchmark_cohorts
DROP POLICY IF EXISTS "authenticated_read_benchmark_cohorts" ON benchmark_cohorts;
CREATE POLICY "authenticated_read_benchmark_cohorts" ON benchmark_cohorts
  FOR SELECT TO authenticated
  USING ( can_read_tenant_by_id(client_id) );

GRANT SELECT ON benchmark_cohorts TO authenticated;


-- external_sources · client_id is nullable (cross-tenant benchmarks may have NULL)
-- Null client_id = platform-wide source; all authenticated users can read.
DROP POLICY IF EXISTS "authenticated_read_external_sources" ON external_sources;
CREATE POLICY "authenticated_read_external_sources" ON external_sources
  FOR SELECT TO authenticated
  USING (
    client_id IS NULL                  -- platform-wide sources
    OR can_read_tenant_by_id(client_id) -- tenant-specific sources
  );

GRANT SELECT ON external_sources TO authenticated;


-- external_events
DROP POLICY IF EXISTS "authenticated_read_external_events" ON external_events;
CREATE POLICY "authenticated_read_external_events" ON external_events
  FOR SELECT TO authenticated
  USING ( can_read_tenant_by_id(client_id) );

GRANT SELECT ON external_events TO authenticated;


-- evidence
DROP POLICY IF EXISTS "authenticated_read_evidence" ON evidence;
CREATE POLICY "authenticated_read_evidence" ON evidence
  FOR SELECT TO authenticated
  USING ( can_read_tenant_by_id(client_id) );

GRANT SELECT ON evidence TO authenticated;


-- telemetry_sources
DROP POLICY IF EXISTS "authenticated_read_telemetry_sources" ON telemetry_sources;
CREATE POLICY "authenticated_read_telemetry_sources" ON telemetry_sources
  FOR SELECT TO authenticated
  USING ( can_read_tenant_by_id(client_id) );

GRANT SELECT ON telemetry_sources TO authenticated;


-- intelligence_session_log · has both tenant_key TEXT and client_id UUID
-- Use tenant_key (text) path for simplicity + consistency with source tables.
-- Both columns may be NULL for anonymous sessions; allow those through.
DROP POLICY IF EXISTS "authenticated_read_intelligence_session_log" ON intelligence_session_log;
CREATE POLICY "authenticated_read_intelligence_session_log" ON intelligence_session_log
  FOR SELECT TO authenticated
  USING (
    -- Own sessions always readable
    user_id = current_user_id()
    -- Tenant sessions readable by tenant members (when tenant_key is set)
    OR (tenant_key IS NOT NULL AND can_read_tenant_by_key(tenant_key))
    -- Tenant sessions readable via client_id when tenant_key is missing
    OR (tenant_key IS NULL AND client_id IS NOT NULL AND can_read_tenant_by_id(client_id))
  );

GRANT SELECT ON intelligence_session_log TO authenticated;


-- intelligence_mode_toggle_events · has client_id UUID
-- Users can read their own mode toggle events; admins see all in tenant.
DROP POLICY IF EXISTS "authenticated_read_intelligence_mode_toggle_events" ON intelligence_mode_toggle_events;
CREATE POLICY "authenticated_read_intelligence_mode_toggle_events" ON intelligence_mode_toggle_events
  FOR SELECT TO authenticated
  USING (
    client_id IS NULL                  -- global toggle events
    OR can_read_tenant_by_id(client_id)
  );

GRANT SELECT ON intelligence_mode_toggle_events TO authenticated;


-- intelligence_surface_content_registry · no tenant; global registry
-- All authenticated users can read surface content (failure mode cards, topics).
DROP POLICY IF EXISTS "authenticated_read_intelligence_surface_content_registry" ON intelligence_surface_content_registry;
CREATE POLICY "authenticated_read_intelligence_surface_content_registry" ON intelligence_surface_content_registry
  FOR SELECT TO authenticated
  USING (true);

GRANT SELECT ON intelligence_surface_content_registry TO authenticated;


NOTIFY pgrst, 'reload schema';

COMMIT;
