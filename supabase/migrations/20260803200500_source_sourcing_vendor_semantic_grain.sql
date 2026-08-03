-- Source sourcing Cube vendor grain repair.
--
-- consumption.sourcing_vendor_v1 preserves source/context rows and can contain
-- more than one row per enterprise vendor. Cube needs one row per vendor_id for
-- primary-key and join correctness, so expose a semantic-grain view separately.

CREATE OR REPLACE VIEW consumption.sourcing_vendor_semantic_v1 AS
WITH ranked AS (
  SELECT
    v.*,
    row_number() OVER (
      PARTITION BY v.tenant_key, v.vendor_id
      ORDER BY
        CASE v.quality_state
          WHEN 'accepted' THEN 1
          WHEN 'reviewed' THEN 2
          WHEN 'partial' THEN 3
          ELSE 4
        END,
        v.load_run_id DESC NULLS LAST,
        v.legal_name
    ) AS semantic_row_rank
  FROM consumption.sourcing_vendor_v1 v
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
  vendor_rank,
  portfolio_share_pct,
  cumulative_portfolio_share_pct,
  top_5_flag,
  top_10_flag,
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
FROM ranked
WHERE semantic_row_rank = 1;

GRANT SELECT ON consumption.sourcing_vendor_semantic_v1 TO authenticated, service_role;

DO $$
BEGIN
  PERFORM set_config('app.tenant_key', 'skyharbor_global', true);

  IF EXISTS (
    SELECT 1
    FROM consumption.sourcing_vendor_semantic_v1
    WHERE tenant_key = 'skyharbor_global'
    GROUP BY tenant_key, vendor_id
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'sourcing_vendor_semantic_v1 must be unique by tenant_key, vendor_id';
  END IF;
END $$;
