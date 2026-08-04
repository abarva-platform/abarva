-- Source Cube vendor semantic rollup repair.
--
-- The first semantic-grain vendor view picked one representative row per vendor.
-- Lab Cube parity proved that this preserved primary-key uniqueness but lost
-- annual value and contract counts when a vendor had multiple source/context
-- rows. Keep one row per vendor for Cube, but aggregate the measures.
--
-- Drop/recreate this derived view because prior environments can disagree on
-- the count column type depending on the exact replay path that created the
-- earlier semantic view. No source data is modified.

DROP VIEW IF EXISTS consumption.sourcing_vendor_semantic_v1;

CREATE VIEW consumption.sourcing_vendor_semantic_v1 AS
WITH base AS (
  SELECT *
  FROM consumption.sourcing_vendor_v1
),
preferred AS (
  SELECT DISTINCT ON (tenant_key, vendor_id)
    tenant_key,
    vendor_ref,
    vendor_id,
    vendor_name,
    legal_name,
    parent_vendor,
    category,
    supplier_category,
    strategic_status,
    country,
    region,
    diversity_status,
    risk_tier,
    financial_health_status,
    security_risk_status,
    relationship_owner_role,
    as_of_date,
    knowledge_baseline_ref,
    projection_contract_version,
    authority_state,
    quality_state,
    freshness_state,
    availability_state,
    load_run_id
  FROM base
  ORDER BY
    tenant_key,
    vendor_id,
    CASE quality_state
      WHEN 'accepted' THEN 1
      WHEN 'reviewed' THEN 2
      WHEN 'partial' THEN 3
      ELSE 4
    END,
    load_run_id DESC NULLS LAST,
    legal_name
),
rolled AS (
  SELECT
    tenant_key,
    vendor_id,
    SUM(COALESCE(contract_count, 0))::bigint AS contract_count,
    SUM(COALESCE(annual_value, 0)) AS annual_value,
    SUM(COALESCE(total_committed_value, 0)) AS total_committed_value,
    SUM(COALESCE(auto_renew_contracts, 0))::bigint AS auto_renew_contracts,
    MIN(next_end_date) AS next_end_date,
    MAX(COALESCE(critical_application_count, 0)) AS critical_application_count,
    MAX(COALESCE(lock_in_signal_count, 0)) AS lock_in_signal_count
  FROM base
  GROUP BY tenant_key, vendor_id
),
contract_refs AS (
  SELECT
    b.tenant_key,
    b.vendor_id,
    ARRAY_AGG(DISTINCT ref ORDER BY ref) AS contract_refs
  FROM base b
  CROSS JOIN LATERAL UNNEST(COALESCE(b.contract_refs, ARRAY[]::text[])) AS ref
  GROUP BY b.tenant_key, b.vendor_id
),
projected AS (
  SELECT
    p.tenant_key,
    p.vendor_ref,
    p.vendor_id,
    p.vendor_name,
    p.legal_name,
    p.parent_vendor,
    p.category,
    p.supplier_category,
    p.strategic_status,
    p.country,
    p.region,
    p.diversity_status,
    p.risk_tier,
    p.financial_health_status,
    p.security_risk_status,
    p.relationship_owner_role,
    r.contract_count,
    r.annual_value AS annual_contract_value,
    r.annual_value,
    r.total_committed_value,
    r.auto_renew_contracts,
    r.next_end_date,
    COALESCE(c.contract_refs, ARRAY[]::text[]) AS contract_refs,
    r.critical_application_count,
    r.lock_in_signal_count,
    p.as_of_date,
    p.knowledge_baseline_ref,
    p.projection_contract_version,
    p.authority_state,
    p.quality_state,
    p.freshness_state,
    p.availability_state,
    p.load_run_id
  FROM rolled r
  JOIN preferred p
    ON p.tenant_key = r.tenant_key
   AND p.vendor_id = r.vendor_id
  LEFT JOIN contract_refs c
    ON c.tenant_key = r.tenant_key
   AND c.vendor_id = r.vendor_id
)
SELECT
  tenant_key,
  vendor_ref,
  vendor_id,
  vendor_name,
  legal_name,
  parent_vendor,
  category,
  supplier_category,
  strategic_status,
  country,
  region,
  diversity_status,
  risk_tier,
  financial_health_status,
  security_risk_status,
  relationship_owner_role,
  contract_count,
  annual_contract_value,
  annual_value,
  total_committed_value,
  auto_renew_contracts,
  next_end_date,
  contract_refs,
  row_number() OVER (PARTITION BY tenant_key ORDER BY annual_value DESC NULLS LAST, legal_name) AS vendor_rank,
  CASE
    WHEN SUM(annual_value) OVER (PARTITION BY tenant_key) > 0
      THEN annual_value / SUM(annual_value) OVER (PARTITION BY tenant_key)
    ELSE NULL
  END AS portfolio_share_pct,
  CASE
    WHEN SUM(annual_value) OVER (PARTITION BY tenant_key) > 0
      THEN SUM(annual_value) OVER (
        PARTITION BY tenant_key
        ORDER BY annual_value DESC NULLS LAST, legal_name
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
      ) / SUM(annual_value) OVER (PARTITION BY tenant_key)
    ELSE NULL
  END AS cumulative_portfolio_share_pct,
  row_number() OVER (PARTITION BY tenant_key ORDER BY annual_value DESC NULLS LAST, legal_name) <= 5 AS top_5_flag,
  row_number() OVER (PARTITION BY tenant_key ORDER BY annual_value DESC NULLS LAST, legal_name) <= 10 AS top_10_flag,
  critical_application_count,
  lock_in_signal_count,
  as_of_date,
  knowledge_baseline_ref,
  projection_contract_version,
  authority_state,
  quality_state,
  freshness_state,
  availability_state,
  load_run_id
FROM projected;

GRANT SELECT ON consumption.sourcing_vendor_semantic_v1 TO authenticated, service_role;

DO $$
DECLARE
  duplicate_key_count integer;
BEGIN
  SELECT count(*)
  INTO duplicate_key_count
  FROM (
    SELECT tenant_key, vendor_id
    FROM consumption.sourcing_vendor_semantic_v1
    GROUP BY tenant_key, vendor_id
    HAVING count(*) > 1
  ) d;

  IF duplicate_key_count > 0 THEN
    RAISE EXCEPTION 'sourcing_vendor_semantic_v1 must be unique by tenant_key, vendor_id';
  END IF;
END $$;
