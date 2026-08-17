-- Enterprise Layer 4 product fanout summary
--
-- Additive projection only. Products can read this consumption view to see which
-- current Layer 3 canonical records are routed into each product surface without
-- reaching into Layer 1/2 intake files or duplicating route logic in pages.

CREATE SCHEMA IF NOT EXISTS consumption;

CREATE OR REPLACE VIEW consumption.enterprise_l4_product_fanout_summary_v1
WITH (security_invoker = true) AS
WITH latest_runs AS (
  SELECT DISTINCT ON (tenant_key)
    tenant_key,
    run_key,
    build_version,
    input_source_version,
    idempotency_key,
    finished_at
  FROM (
    SELECT
      unnest(tenant_scope) AS tenant_key,
      run_key,
      build_version,
      input_source_version,
      idempotency_key,
      finished_at
    FROM intelligence_v6.layer_refresh_runs
    WHERE status = 'succeeded'
      AND finished_at IS NOT NULL
  ) runs
  ORDER BY tenant_key, finished_at DESC
),
product_routes(product_key, object_type) AS (
  VALUES
    ('home', 'tenant_profile'),
    ('home', 'business_function'),
    ('home', 'org_owner'),
    ('home', 'workforce_role'),
    ('home', 'application_system'),
    ('home', 'data_asset_or_integration'),
    ('home', 'infrastructure_platform'),
    ('home', 'vendor_contract'),
    ('home', 'spend_value_fact'),
    ('home', 'program_initiative'),
    ('home', 'ai_automation_use_case'),
    ('home', 'risk_or_control'),
    ('home', 'metric_outcome'),
    ('home', 'platform_maturity_assessment'),
    ('home', 'service_performance_observation'),
    ('source', 'vendor_contract'),
    ('source', 'managed_service_scope'),
    ('source', 'application_system'),
    ('source', 'service_performance_observation'),
    ('source', 'operational_process_evidence'),
    ('tower', 'spend_value_fact'),
    ('tower', 'program_initiative'),
    ('tower', 'ai_automation_use_case'),
    ('tower', 'metric_outcome'),
    ('tower', 'ai_value_realization_signal'),
    ('tower', 'ai_tool_usage_observation'),
    ('tower', 'ai_kpi_outcome_observation'),
    ('tower', 'platform_maturity_assessment'),
    ('tower', 'service_performance_observation'),
    ('moves', 'program_initiative'),
    ('moves', 'operational_process_evidence'),
    ('moves', 'risk_or_control'),
    ('moves', 'relationship_source_row'),
    ('moves', 'metric_outcome'),
    ('moves', 'ai_automation_use_case'),
    ('intelligence', 'evidence_source'),
    ('intelligence', 'industry_context_pattern'),
    ('intelligence', 'expert_lens'),
    ('intelligence', 'semantic_crosswalk_evidence'),
    ('intelligence', 'ai_value_interview_evidence'),
    ('intelligence', 'relationship_source_row')
)
SELECT
  records.tenant_key,
  routes.product_key,
  records.object_type,
  latest_runs.build_version,
  latest_runs.input_source_version,
  latest_runs.idempotency_key,
  latest_runs.finished_at AS build_finished_at,
  count(*)::integer AS record_count,
  count(*) FILTER (WHERE records.fact_status = 'active')::integer AS active_fact_count,
  count(*) FILTER (WHERE records.fact_status = 'blocked_conflict')::integer AS blocked_fact_count,
  count(*) FILTER (WHERE records.quality_status = 'quarantined')::integer AS quarantined_count
FROM latest_runs
JOIN intelligence_v6.business_records records
  ON records.tenant_key = latest_runs.tenant_key
 AND records.build_version = latest_runs.build_version
 AND records.input_source_version = latest_runs.input_source_version
 AND records.idempotency_key = latest_runs.idempotency_key
JOIN product_routes routes
  ON routes.object_type = records.object_type
WHERE records.quality_status <> 'quarantined'
GROUP BY
  records.tenant_key,
  routes.product_key,
  records.object_type,
  latest_runs.build_version,
  latest_runs.input_source_version,
  latest_runs.idempotency_key,
  latest_runs.finished_at;

CREATE OR REPLACE VIEW consumption.enterprise_l4_product_fanout_totals_v1
WITH (security_invoker = true) AS
SELECT
  tenant_key,
  product_key,
  build_version,
  input_source_version,
  idempotency_key,
  build_finished_at,
  sum(record_count)::integer AS record_count,
  sum(active_fact_count)::integer AS active_fact_count,
  sum(blocked_fact_count)::integer AS blocked_fact_count,
  sum(quarantined_count)::integer AS quarantined_count,
  count(*)::integer AS object_type_count
FROM consumption.enterprise_l4_product_fanout_summary_v1
GROUP BY
  tenant_key,
  product_key,
  build_version,
  input_source_version,
  idempotency_key,
  build_finished_at;

GRANT SELECT ON consumption.enterprise_l4_product_fanout_summary_v1 TO authenticated, service_role;
GRANT SELECT ON consumption.enterprise_l4_product_fanout_totals_v1 TO authenticated, service_role;

COMMENT ON VIEW consumption.enterprise_l4_product_fanout_summary_v1 IS
  'Layer 4 product fanout counts from the latest succeeded Intelligence V6 runtime layer refresh build.';
COMMENT ON VIEW consumption.enterprise_l4_product_fanout_totals_v1 IS
  'Layer 4 product fanout totals by product from the latest succeeded Intelligence V6 runtime layer refresh build.';
