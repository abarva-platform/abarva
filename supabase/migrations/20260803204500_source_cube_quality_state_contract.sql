-- Source Cube quality-state contract repair.
--
-- The Cube parity verifier advanced past timing_window/service_scope and found
-- that sourcing_opportunity_v1 exposed quality_state only as authority_state.
-- Cube declares quality_state directly, so append it without changing the
-- existing consumption-view column order.

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
  timing_window,
  quality_state
FROM source.sourcing_opportunity
WHERE source.can_read_sourcing_tenant(tenant_key);

GRANT SELECT ON consumption.sourcing_opportunity_v1 TO authenticated, service_role;
