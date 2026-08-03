-- Source Cube view-contract repair.
--
-- The first Source Cube parity run exposed two model/view drift defects:
-- sourcing_opportunity_v1 did not project timing_window, and
-- sourcing_event_v1 did not project service_scope. Both columns exist in the
-- source tables and are part of the Cube semantic model, so append them to the
-- consumption views without changing existing column order.

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
  load_run_id,
  timing_window
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
  load_run_id,
  service_scope
FROM source.sourcing_event
WHERE source.can_read_sourcing_tenant(tenant_key);

GRANT SELECT ON
  consumption.sourcing_opportunity_v1,
  consumption.sourcing_event_v1
TO authenticated, service_role;
