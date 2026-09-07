-- Source cloud-consumption Layer 4 cube projections.
--
-- These views keep Source/Tower/aVa on the product projection boundary:
-- contract and spend projections continue to read the canonical Source model,
-- while cloud telemetry and governed optimization actions are exposed through
-- consumption.* views instead of raw loader tables.

BEGIN;

DROP VIEW IF EXISTS consumption.sourcing_context_coverage_v1;
DROP VIEW IF EXISTS consumption.sourcing_opportunity_v1;

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
WHERE source.can_read_sourcing_tenant(tenant_key)

UNION ALL

SELECT
  o.tenant_key,
  o.opportunity_id AS opportunity_ref,
  o.opportunity_id,
  o.vendor_id AS vendor_ref,
  o.vendor_id,
  o.contract_id AS contract_ref,
  o.contract_id,
  NULL::text AS event_ref,
  NULL::text AS event_id,
  o.value_type AS action_type,
  o.value_type AS opportunity_type,
  COALESCE(o.payload ->> 'title', o.narrative) AS title,
  COALESCE(o.payload ->> 'finding_summary', o.narrative) AS finding_summary,
  COALESCE(o.payload ->> 'deterministic_basis', o.payload ->> 'native_vs_nexus_note', o.blocking_gap, o.narrative) AS deterministic_basis,
  o.amount_usd AS value_low,
  o.amount_usd AS value_high,
  o.amount_usd AS annual_value_exposed,
  o.amount_usd AS addressable_spend,
  CASE
    WHEN o.value_type = 'control_action' THEN 'control'
    WHEN COALESCE(o.amount_usd, 0) >= 10000000 THEN 'high'
    WHEN COALESCE(o.amount_usd, 0) >= 1000000 THEN 'medium'
    ELSE 'low'
  END AS priority,
  o.confidence,
  CASE
    WHEN o.value_type = 'control_action' THEN 'control_required'
    WHEN o.stage = 'finance_confirmed' THEN 'ready_to_act'
    WHEN o.approval_state = 'requires_review' THEN 'finance_confirmation_required'
    WHEN o.stage IN ('evidence_required', 'baseline_conflict') THEN 'evidence_blocked'
    ELSE 'review_required'
  END AS readiness_state,
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM source.opportunity_evidence e
      WHERE e.tenant_key = o.tenant_key
        AND e.dataset_version = o.dataset_version
        AND e.opportunity_id = o.opportunity_id
        AND e.evidence_status = 'EVIDENCE_AVAILABLE'
    ) THEN 'present'
    ELSE 'missing'
  END AS evidence_state,
  o.next_action AS recommended_action,
  o.owner AS accountable_role,
  o.deadline AS decision_due_date,
  o.value_type AS finding_rule_ref,
  o.created_at::date AS as_of_date,
  o.dataset_version AS knowledge_baseline_ref,
  'source-optimization-opportunity-v1'::text AS projection_contract_version,
  o.approval_state AS authority_state,
  'current'::text AS freshness_state,
  'available'::text AS availability_state,
  c.load_run_id,
  COALESCE(o.payload ->> 'timing_window', o.deadline::text) AS timing_window,
  o.evidence_grade AS quality_state
FROM source.optimization_opportunity o
JOIN source.contract c
  ON c.tenant_key = o.tenant_key
 AND c.contract_id = o.contract_id
WHERE source.can_read_sourcing_tenant(o.tenant_key);

CREATE OR REPLACE VIEW consumption.sourcing_cloud_usage_monthly_v1 AS
SELECT
  tenant_key,
  dataset_version,
  usage_id,
  contract_id AS contract_ref,
  contract_id,
  vendor_id AS vendor_ref,
  vendor_id,
  vendor_name,
  cloud_provider,
  cloud_account_id,
  business_unit,
  application_ref,
  service_name,
  usage_type,
  region,
  period_start AS month,
  period_start,
  period_end,
  usage_quantity,
  usage_unit,
  on_demand_spend_usd,
  covered_spend_usd,
  total_spend_usd,
  owner_tag,
  environment_tag,
  evidence_reference,
  source_file_id,
  confidence,
  quality_state,
  load_run_id
FROM source.cloud_service_usage_observation
WHERE source.can_read_sourcing_tenant(tenant_key);

CREATE OR REPLACE VIEW consumption.sourcing_cloud_commitment_coverage_v1 AS
SELECT
  tenant_key,
  dataset_version,
  coverage_id,
  contract_id AS contract_ref,
  contract_id,
  vendor_id AS vendor_ref,
  vendor_id,
  vendor_name,
  cloud_provider,
  period_start AS month,
  period_start,
  period_end,
  eligible_stable_workload_spend_usd,
  commitment_covered_spend_usd,
  on_demand_eligible_spend_usd,
  commitment_coverage_pct,
  commitment_utilization_pct,
  recommended_step_up_usd,
  expected_discount_pct,
  candidate_monthly_savings_usd,
  evidence_reference,
  source_file_id,
  confidence,
  quality_state,
  load_run_id
FROM source.cloud_commitment_coverage_observation
WHERE source.can_read_sourcing_tenant(tenant_key);

CREATE OR REPLACE VIEW consumption.sourcing_cloud_resource_inventory_v1 AS
SELECT
  tenant_key,
  dataset_version,
  resource_id,
  contract_id AS contract_ref,
  contract_id,
  vendor_id AS vendor_ref,
  vendor_id,
  vendor_name,
  cloud_provider,
  raw_payload ->> 'cloud_account_id' AS cloud_account_id,
  business_unit,
  application_ref,
  service_name AS resource_type,
  service_name,
  sku,
  region,
  NULL::numeric AS provisioned_capacity,
  GREATEST(
    COALESCE(avg_cpu_utilization_pct, 0),
    COALESCE(avg_memory_utilization_pct, 0)
  ) AS observed_utilization_pct,
  avg_cpu_utilization_pct,
  avg_memory_utilization_pct,
  monthly_spend_usd AS monthly_cost_usd,
  monthly_spend_usd,
  rightsize_signal,
  evidence_reference,
  source_file_id,
  confidence,
  quality_state,
  load_run_id
FROM source.cloud_resource_inventory
WHERE source.can_read_sourcing_tenant(tenant_key);

CREATE OR REPLACE VIEW consumption.sourcing_cloud_tag_quality_v1 AS
SELECT
  tenant_key,
  dataset_version,
  tag_quality_id,
  contract_id AS contract_ref,
  contract_id,
  vendor_id AS vendor_ref,
  vendor_id,
  vendor_name,
  cloud_provider,
  account_subscription_id,
  period_start AS month,
  period_start,
  period_end,
  NULL::int AS resource_count,
  total_spend_usd,
  owner_tagged_spend_usd,
  application_tagged_spend_usd,
  untagged_spend_usd AS unallocated_spend_usd,
  untagged_spend_usd,
  owner_tag_coverage_pct,
  application_tag_coverage_pct,
  NULL::numeric AS environment_tag_coverage_pct,
  data_quality_state,
  evidence_reference,
  source_file_id,
  confidence,
  quality_state,
  load_run_id
FROM source.cloud_tag_quality_observation
WHERE source.can_read_sourcing_tenant(tenant_key);

CREATE OR REPLACE VIEW consumption.sourcing_cloud_ap_invoice_reconciliation_v1 AS
SELECT
  tenant_key,
  dataset_version,
  reconciliation_id,
  contract_id AS contract_ref,
  contract_id,
  vendor_id AS vendor_ref,
  vendor_id,
  vendor_name,
  raw_payload ->> 'cloud_provider' AS cloud_provider,
  period_start AS month,
  period_start,
  period_end,
  cloud_billing_export_amount_usd AS billing_export_amount_usd,
  cloud_billing_export_amount_usd,
  ap_invoice_amount_usd,
  paid_amount_usd,
  variance_usd,
  reconciliation_state,
  evidence_reference,
  source_file_id,
  confidence,
  quality_state,
  load_run_id
FROM source.cloud_ap_invoice_reconciliation
WHERE source.can_read_sourcing_tenant(tenant_key);

CREATE OR REPLACE VIEW consumption.sourcing_context_coverage_v1 AS
SELECT tenant_key, 'contracts' AS context_area, count(*) AS row_count, count(*) FILTER (WHERE annual_contract_value IS NOT NULL) AS populated_count
FROM consumption.sourcing_contract_v1
GROUP BY tenant_key
UNION ALL
SELECT tenant_key, 'contract_scope', count(*), count(*) FILTER (WHERE relationship_method <> 'unresolved')
FROM consumption.sourcing_contract_scope_v1
GROUP BY tenant_key
UNION ALL
SELECT tenant_key, 'monthly_spend_consumption', count(*), count(*) FILTER (WHERE actual_spend IS NOT NULL OR invoice_amount IS NOT NULL)
FROM consumption.sourcing_spend_monthly_v1
GROUP BY tenant_key
UNION ALL
SELECT tenant_key, 'performance_sla', count(*), count(*) FILTER (WHERE performance_state <> 'not_loaded')
FROM consumption.sourcing_performance_v1
GROUP BY tenant_key
UNION ALL
SELECT tenant_key, 'opportunities', count(*), count(*) FILTER (WHERE evidence_state = 'present')
FROM consumption.sourcing_opportunity_v1
GROUP BY tenant_key
UNION ALL
SELECT tenant_key, 'sourcing_events', count(*), count(*) FILTER (WHERE status IS NOT NULL)
FROM consumption.sourcing_event_v1
GROUP BY tenant_key;

GRANT SELECT ON
  consumption.sourcing_opportunity_v1,
  consumption.sourcing_context_coverage_v1,
  consumption.sourcing_cloud_usage_monthly_v1,
  consumption.sourcing_cloud_commitment_coverage_v1,
  consumption.sourcing_cloud_resource_inventory_v1,
  consumption.sourcing_cloud_tag_quality_v1,
  consumption.sourcing_cloud_ap_invoice_reconciliation_v1
TO authenticated, service_role;

COMMIT;
