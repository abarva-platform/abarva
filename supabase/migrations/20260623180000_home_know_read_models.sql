-- HOME KNOW READ MODELS
--
-- This migration creates the backend seam for Home KNOW mode. The first
-- version uses SQL views (not materialized views) so the contract can land
-- safely across environments; the view names intentionally keep the `mv_home_*`
-- prefix because the operational north star is to materialize these hot lookup
-- surfaces and refresh them after v4 tenant loads.
--
-- Materialization plan:
--   1. Run the live data gate against all five v4 tenants.
--   2. Convert the hot SQL views below into materialized views with tenant and
--      dimension indexes.
--   3. Make tenant load/reload jobs call refresh_home_know_views(tenant_key)
--      after records, facts, relationships, gaps, and conflicts are computed.

BEGIN;

CREATE TABLE IF NOT EXISTS public.home_expected_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dimension_id TEXT NOT NULL,
  object_type TEXT NOT NULL,
  expected_field TEXT NOT NULL,
  required_for_home BOOLEAN NOT NULL DEFAULT false,
  client_fill_required BOOLEAN NOT NULL DEFAULT false,
  severity TEXT NOT NULL DEFAULT 'medium'
    CHECK (severity IN ('low','medium','high','critical')),
  display_label TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (dimension_id, object_type, expected_field)
);

INSERT INTO public.home_expected_fields (
  dimension_id,
  object_type,
  expected_field,
  required_for_home,
  client_fill_required,
  severity,
  display_label
) VALUES
  (
    'it_org_ownership',
    'portfolio',
    'executive_owner_person_name',
    false,
    true,
    'medium',
    'Named portfolio lead'
  ),
  (
    'applications_core_systems',
    'application',
    'technical_owner_person_name',
    false,
    true,
    'medium',
    'Named technical owner'
  ),
  (
    'vendors_contracts',
    'vendor_contract',
    'contract_owner_person_name',
    false,
    true,
    'medium',
    'Named contract owner'
  )
ON CONFLICT (dimension_id, object_type, expected_field)
DO UPDATE SET
  required_for_home = EXCLUDED.required_for_home,
  client_fill_required = EXCLUDED.client_fill_required,
  severity = EXCLUDED.severity,
  display_label = EXCLUDED.display_label,
  updated_at = now();

CREATE OR REPLACE VIEW public.mv_home_it_org_view AS
SELECT
  NULL::text AS tenant_key,
  NULL::text AS team_id,
  NULL::text AS team_name,
  NULL::text AS executive_owner_role,
  NULL::text AS executive_owner_person_name,
  NULL::text AS domain,
  NULL::numeric AS head_count_fte,
  NULL::numeric AS annual_budget_usd,
  NULL::text AS source_file,
  NULL::integer AS source_row_number,
  NULL::numeric AS confidence,
  NULL::timestamptz AS last_loaded_at
WHERE false;

CREATE OR REPLACE VIEW public.mv_home_application_ownership_view AS
SELECT
  NULL::text AS tenant_key,
  NULL::text AS application_name,
  NULL::text AS domain,
  NULL::text AS primary_business_owner,
  NULL::text AS technical_owner_team,
  NULL::text AS technical_owner_role,
  NULL::text AS criticality,
  NULL::numeric AS annual_run_cost_usd,
  NULL::text AS source_file,
  NULL::integer AS source_row_number,
  NULL::numeric AS confidence,
  NULL::timestamptz AS last_loaded_at
WHERE false;

CREATE OR REPLACE VIEW public.mv_home_vendor_landscape_view AS
SELECT
  NULL::text AS tenant_key,
  NULL::text AS vendor_name,
  NULL::text AS category,
  NULL::numeric AS annual_spend_usd,
  NULL::text AS renewal_risk,
  NULL::text AS business_owner,
  NULL::text AS technology_owner,
  NULL::text AS source_file,
  NULL::integer AS source_row_number,
  NULL::numeric AS confidence,
  NULL::timestamptz AS last_loaded_at
WHERE false;

CREATE OR REPLACE VIEW public.mv_home_budget_by_portfolio_view AS
SELECT
  NULL::text AS tenant_key,
  NULL::text AS function_or_platform,
  NULL::numeric AS run_budget_usd,
  NULL::numeric AS change_budget_usd,
  NULL::numeric AS ai_budget_usd,
  NULL::text AS owner_role,
  NULL::text AS source_file,
  NULL::integer AS source_row_number,
  NULL::numeric AS confidence,
  NULL::timestamptz AS last_loaded_at
WHERE false;

CREATE OR REPLACE VIEW public.mv_home_gap_register_view AS
SELECT
  NULL::text AS tenant_key,
  NULL::text AS dimension_id,
  NULL::text AS object_type,
  NULL::text AS expected_field,
  NULL::text AS display_label,
  NULL::text AS severity,
  NULL::integer AS missing_count,
  NULL::text AS source_file
WHERE false;

CREATE OR REPLACE VIEW public.mv_home_conflict_register_view AS
SELECT
  NULL::text AS tenant_key,
  NULL::text AS dimension_id,
  NULL::text AS label,
  'low'::text AS severity,
  NULL::text AS description,
  NULL::text AS source_file
WHERE false;

CREATE OR REPLACE VIEW public.mv_home_dimension_coverage_view AS
SELECT
  NULL::text AS tenant_key,
  NULL::text AS dimension_id,
  NULL::text AS dimension_label,
  NULL::integer AS record_count,
  NULL::integer AS fact_count,
  NULL::integer AS relationship_count,
  NULL::integer AS source_count,
  NULL::integer AS gap_count,
  NULL::integer AS conflict_count,
  NULL::timestamptz AS last_loaded_at,
  NULL::integer AS trust_score
WHERE false;

DO $home_know_views$
BEGIN
  IF to_regclass('public.enterprise_context_records') IS NULL
     OR to_regclass('public.enterprise_context_facts') IS NULL
     OR to_regclass('public.enterprise_context_relationships') IS NULL THEN
    RAISE NOTICE 'enterprise_context read tables absent - keeping empty Home KNOW view contracts.';
    RETURN;
  END IF;

  EXECUTE $sql$
    CREATE OR REPLACE VIEW public.mv_home_it_org_view AS
    SELECT
      r.tenant_key,
      r.payload ->> 'team_id' AS team_id,
      COALESCE(r.payload ->> 'team_name', r.title) AS team_name,
      r.payload ->> 'executive_owner_role' AS executive_owner_role,
      r.payload ->> 'executive_owner_person_name' AS executive_owner_person_name,
      r.payload ->> 'domain' AS domain,
      NULLIF(r.payload ->> 'head_count_fte', '')::numeric AS head_count_fte,
      NULLIF(r.payload ->> 'annual_budget_usd', '')::numeric AS annual_budget_usd,
      r.source_file,
      r.source_row_number,
      r.confidence,
      r.updated_at AS last_loaded_at
    FROM public.enterprise_context_records r
    WHERE r.lifecycle_state = 'active'
      AND (
        r.source_file ILIKE '%F03%'
        OR r.payload ? 'team_id'
        OR r.payload ? 'executive_owner_role'
      )
  $sql$;

  EXECUTE $sql$
    CREATE OR REPLACE VIEW public.mv_home_application_ownership_view AS
    WITH org AS (
      SELECT * FROM public.mv_home_it_org_view
    )
    SELECT
      r.tenant_key,
      COALESCE(r.payload ->> 'application_name', r.payload ->> 'system_name', r.title) AS application_name,
      r.payload ->> 'domain' AS domain,
      r.payload ->> 'primary_business_owner' AS primary_business_owner,
      r.payload ->> 'technical_owner_team' AS technical_owner_team,
      COALESCE(org.executive_owner_role, r.payload ->> 'technical_owner_role') AS technical_owner_role,
      r.payload ->> 'criticality' AS criticality,
      NULLIF(COALESCE(r.payload ->> 'annual_run_cost_usd', r.payload ->> 'annual_cost_usd'), '')::numeric AS annual_run_cost_usd,
      r.source_file,
      r.source_row_number,
      r.confidence,
      r.updated_at AS last_loaded_at
    FROM public.enterprise_context_records r
    LEFT JOIN org
      ON org.tenant_key = r.tenant_key
     AND (
       org.team_id = r.payload ->> 'technical_owner_team'
       OR lower(org.team_name) = lower(r.payload ->> 'technical_owner_team')
     )
    WHERE r.lifecycle_state = 'active'
      AND (
        r.source_file ILIKE '%F05%'
        OR r.payload ? 'application_name'
        OR r.payload ? 'system_name'
      )
  $sql$;

  EXECUTE $sql$
    CREATE OR REPLACE VIEW public.mv_home_vendor_landscape_view AS
    SELECT
      r.tenant_key,
      COALESCE(r.payload ->> 'vendor_name', r.payload ->> 'supplier_name', r.title) AS vendor_name,
      r.payload ->> 'category' AS category,
      NULLIF(COALESCE(r.payload ->> 'annual_spend_usd', r.payload ->> 'annualized_spend_usd', r.payload ->> 'contract_value_usd'), '')::numeric AS annual_spend_usd,
      r.payload ->> 'renewal_risk' AS renewal_risk,
      r.payload ->> 'business_owner' AS business_owner,
      r.payload ->> 'technology_owner' AS technology_owner,
      r.source_file,
      r.source_row_number,
      r.confidence,
      r.updated_at AS last_loaded_at
    FROM public.enterprise_context_records r
    WHERE r.lifecycle_state = 'active'
      AND (
        r.source_file ILIKE '%F11%'
        OR r.payload ? 'vendor_name'
        OR r.payload ? 'supplier_name'
      )
  $sql$;

  EXECUTE $sql$
    CREATE OR REPLACE VIEW public.mv_home_budget_by_portfolio_view AS
    SELECT
      r.tenant_key,
      COALESCE(r.payload ->> 'function_or_platform', r.payload ->> 'platform', r.title) AS function_or_platform,
      NULLIF(r.payload ->> 'run_budget_usd', '')::numeric AS run_budget_usd,
      NULLIF(r.payload ->> 'change_budget_usd', '')::numeric AS change_budget_usd,
      NULLIF(r.payload ->> 'ai_budget_usd', '')::numeric AS ai_budget_usd,
      r.payload ->> 'owner_role' AS owner_role,
      r.source_file,
      r.source_row_number,
      r.confidence,
      r.updated_at AS last_loaded_at
    FROM public.enterprise_context_records r
    WHERE r.lifecycle_state = 'active'
      AND (
        r.source_file ILIKE '%F12%'
        OR r.payload ? 'run_budget_usd'
        OR r.payload ? 'change_budget_usd'
        OR r.payload ? 'ai_budget_usd'
      )
  $sql$;

  EXECUTE $sql$
    CREATE OR REPLACE VIEW public.mv_home_gap_register_view AS
    WITH scoped_records AS (
      SELECT
        r.tenant_key,
        CASE
          WHEN r.source_file ILIKE '%F03%' OR r.payload ? 'team_id' THEN 'it_org_ownership'
          WHEN r.source_file ILIKE '%F05%' OR r.payload ? 'application_name' THEN 'applications_core_systems'
          WHEN r.source_file ILIKE '%F11%' OR r.payload ? 'vendor_name' THEN 'vendors_contracts'
          ELSE NULL
        END AS dimension_id,
        CASE
          WHEN r.source_file ILIKE '%F03%' OR r.payload ? 'team_id' THEN 'portfolio'
          WHEN r.source_file ILIKE '%F05%' OR r.payload ? 'application_name' THEN 'application'
          WHEN r.source_file ILIKE '%F11%' OR r.payload ? 'vendor_name' THEN 'vendor_contract'
          ELSE NULL
        END AS object_type,
        r.payload,
        r.source_file
      FROM public.enterprise_context_records r
      WHERE r.lifecycle_state = 'active'
    )
    SELECT
      sr.tenant_key,
      hef.dimension_id,
      hef.object_type,
      hef.expected_field,
      hef.display_label,
      hef.severity::text AS severity,
      COUNT(*)::integer AS missing_count,
      MIN(sr.source_file) AS source_file
    FROM scoped_records sr
    JOIN public.home_expected_fields hef
      ON hef.dimension_id = sr.dimension_id
     AND hef.object_type = sr.object_type
    WHERE sr.dimension_id IS NOT NULL
      AND (
        NOT (sr.payload ? hef.expected_field)
        OR NULLIF(sr.payload ->> hef.expected_field, '') IS NULL
      )
    GROUP BY
      sr.tenant_key,
      hef.dimension_id,
      hef.object_type,
      hef.expected_field,
      hef.display_label,
      hef.severity
  $sql$;

  EXECUTE $sql$
    CREATE OR REPLACE VIEW public.mv_home_conflict_register_view AS
    SELECT
      NULL::text AS tenant_key,
      NULL::text AS dimension_id,
      NULL::text AS label,
      'low'::text AS severity,
      NULL::text AS description,
      NULL::text AS source_file
    WHERE false
  $sql$;

  EXECUTE $sql$
    CREATE OR REPLACE VIEW public.mv_home_dimension_coverage_view AS
    WITH record_dims AS (
      SELECT
        r.id,
        r.tenant_key,
        CASE
          WHEN r.source_file ILIKE '%F03%' OR r.payload ? 'team_id' THEN 'it_org_ownership'
          WHEN r.source_file ILIKE '%F05%' OR r.payload ? 'application_name' THEN 'applications_core_systems'
          WHEN r.source_file ILIKE '%F09%' OR r.payload ? 'data_product_name' THEN 'data_analytics_estate'
          WHEN r.source_file ILIKE '%F11%' OR r.payload ? 'vendor_name' THEN 'vendors_contracts'
          WHEN r.source_file ILIKE '%F12%' OR r.payload ? 'run_budget_usd' THEN 'it_budget_financials'
          ELSE COALESCE(NULLIF(r.dimension_family::text, ''), r.record_type)
        END AS dimension_id,
        CASE
          WHEN r.source_file ILIKE '%F03%' OR r.payload ? 'team_id' THEN 'IT org ownership'
          WHEN r.source_file ILIKE '%F05%' OR r.payload ? 'application_name' THEN 'Applications and core systems'
          WHEN r.source_file ILIKE '%F09%' OR r.payload ? 'data_product_name' THEN 'Data and analytics estate'
          WHEN r.source_file ILIKE '%F11%' OR r.payload ? 'vendor_name' THEN 'Vendors and contracts'
          WHEN r.source_file ILIKE '%F12%' OR r.payload ? 'run_budget_usd' THEN 'IT budget and financials'
          ELSE initcap(replace(COALESCE(NULLIF(r.dimension_family::text, ''), r.record_type), '_', ' '))
        END AS dimension_label,
        r.source_file,
        r.source_system,
        r.updated_at
      FROM public.enterprise_context_records r
      WHERE r.lifecycle_state = 'active'
    ),
    fact_counts AS (
      SELECT rd.tenant_key, rd.dimension_id, COUNT(f.id)::integer AS fact_count
      FROM record_dims rd
      JOIN public.enterprise_context_facts f
        ON f.record_id = rd.id
       AND f.lifecycle_state = 'active'
      GROUP BY rd.tenant_key, rd.dimension_id
    ),
    relationship_counts AS (
      SELECT rd.tenant_key, rd.dimension_id, COUNT(DISTINCT rel.id)::integer AS relationship_count
      FROM record_dims rd
      JOIN public.enterprise_context_relationships rel
        ON rel.lifecycle_state = 'active'
       AND rel.tenant_key = rd.tenant_key
       AND (rel.from_record_id = rd.id OR rel.to_record_id = rd.id)
      GROUP BY rd.tenant_key, rd.dimension_id
    ),
    gap_counts AS (
      SELECT tenant_key, dimension_id, SUM(missing_count)::integer AS gap_count
      FROM public.mv_home_gap_register_view
      GROUP BY tenant_key, dimension_id
    ),
    conflict_counts AS (
      SELECT tenant_key, dimension_id, COUNT(*)::integer AS conflict_count
      FROM public.mv_home_conflict_register_view
      GROUP BY tenant_key, dimension_id
    )
    SELECT
      rd.tenant_key,
      rd.dimension_id,
      MIN(rd.dimension_label) AS dimension_label,
      COUNT(*)::integer AS record_count,
      COALESCE(MAX(fc.fact_count), 0)::integer AS fact_count,
      COALESCE(MAX(rc.relationship_count), 0)::integer AS relationship_count,
      COUNT(DISTINCT COALESCE(rd.source_file, rd.source_system))::integer AS source_count,
      COALESCE(MAX(gc.gap_count), 0)::integer AS gap_count,
      COALESCE(MAX(cc.conflict_count), 0)::integer AS conflict_count,
      MAX(rd.updated_at) AS last_loaded_at,
      GREATEST(
        0,
        100
          - LEAST(COALESCE(MAX(gc.gap_count), 0), 50)
          - LEAST(COALESCE(MAX(cc.conflict_count), 0) * 5, 30)
      )::integer AS trust_score
    FROM record_dims rd
    LEFT JOIN fact_counts fc
      ON fc.tenant_key = rd.tenant_key
     AND fc.dimension_id = rd.dimension_id
    LEFT JOIN relationship_counts rc
      ON rc.tenant_key = rd.tenant_key
     AND rc.dimension_id = rd.dimension_id
    LEFT JOIN gap_counts gc
      ON gc.tenant_key = rd.tenant_key
     AND gc.dimension_id = rd.dimension_id
    LEFT JOIN conflict_counts cc
      ON cc.tenant_key = rd.tenant_key
     AND cc.dimension_id = rd.dimension_id
    GROUP BY rd.tenant_key, rd.dimension_id
  $sql$;
END;
$home_know_views$;

CREATE OR REPLACE FUNCTION public.refresh_home_know_views(tenant_key text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Current implementation uses SQL views, so there is nothing to refresh.
  -- The argument is intentionally kept in the contract for the follow-up
  -- materialized-view implementation after the live data gate proves the shape.
  PERFORM tenant_key;
END;
$$;

COMMENT ON VIEW public.mv_home_dimension_coverage_view IS
  'Home KNOW SQL view v1. Real tenant dimension coverage; convert to materialized view after live gate.';
COMMENT ON VIEW public.mv_home_it_org_view IS
  'Home KNOW SQL view v1 for IT org/portfolio ownership from v4 F03 rows.';
COMMENT ON VIEW public.mv_home_application_ownership_view IS
  'Home KNOW SQL view v1 for application ownership from v4 F05 rows joined to F03 owner roles.';
COMMENT ON VIEW public.mv_home_vendor_landscape_view IS
  'Home KNOW SQL view v1 for vendor/contract lookup from v4 F11 rows.';
COMMENT ON VIEW public.mv_home_budget_by_portfolio_view IS
  'Home KNOW SQL view v1 for budget lookup from v4 F12 rows.';
COMMENT ON VIEW public.mv_home_gap_register_view IS
  'Home KNOW SQL view v1 for expected-field gaps backed by home_expected_fields.';
COMMENT ON VIEW public.mv_home_conflict_register_view IS
  'Home KNOW SQL view v1 placeholder for deterministic conflict detection; intentionally empty until conflict rules land.';

NOTIFY pgrst, 'reload schema';

COMMIT;
