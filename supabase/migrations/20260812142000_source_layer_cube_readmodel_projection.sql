-- Project canonical Source layer/cube contract rows into the existing Source
-- Contract 360 read models. This preserves legacy raw SkyHarbor V3 projections
-- while allowing governed source.contract/source.vendor rows to appear in the
-- product-facing Source portfolio and Cube vendor/contract slices.

DO $source_layer_cube_readmodel_projection$
BEGIN
  IF to_regclass('raw_enterprise_it.vendors_contracts') IS NOT NULL
     AND to_regclass('sem.contract_wide') IS NOT NULL THEN
    EXECUTE $view$
      CREATE OR REPLACE VIEW source.contract_vendor_360 AS
      WITH legacy_contracts AS (
        SELECT
          v._tenant_key AS tenant_key,
          v.contract_id,
          v.vendor_id AS vendor_ref,
          v.vendor_name,
          v.category AS vendor_category,
          v.contract_name,
          v.scope_summary,
          v.annual_value::numeric AS annual_value,
          v.total_committed_value::numeric AS total_committed_value,
          v.committed_annual_spend::numeric AS committed_annual_spend,
          v.actual_annual_spend::numeric AS actual_annual_spend,
          v.end_date::date AS end_date,
          v.notice_period_days::numeric AS notice_period_days,
          lower(v.auto_renew) IN ('true', 'yes', 'y', '1') AS auto_renew,
          v.renewal_decision_state,
          v.renewal_owner_ref,
          v.benchmarking_clause,
          v.exit_rights_summary,
          v.alternatives_available,
          v.concentration_note,
          v.source_confidence,
          cw.annual_value AS resolved_annual_value,
          cw.annual_value_conflict_flag,
          cw.total_committed_value AS resolved_total_committed_value,
          cw.total_committed_value_conflict_flag
        FROM raw_enterprise_it.vendors_contracts v
        LEFT JOIN sem.contract_wide cw
          ON cw.tenant_key = v._tenant_key
         AND cw.contract_ref = v.contract_id
      ),
      canonical_contracts AS (
        SELECT
          c.tenant_key,
          c.contract_id,
          c.vendor_id AS vendor_ref,
          COALESCE(v.legal_name, c.vendor_id, 'Unknown vendor') AS vendor_name,
          v.supplier_category AS vendor_category,
          c.contract_name,
          concat_ws(
            ' - ',
            NULLIF(c.agreement_type, ''),
            NULLIF(c.payment_terms, ''),
            NULLIF(c.benchmark_rights, ''),
            NULLIF(c.termination_rights, '')
          ) AS scope_summary,
          c.annual_value,
          c.total_committed_value,
          COALESCE(consumption.committed_annual_spend, c.annual_value) AS committed_annual_spend,
          COALESCE(consumption.actual_annual_spend, c.annual_value) AS actual_annual_spend,
          c.expiration_date AS end_date,
          CASE
            WHEN c.expiration_date IS NOT NULL AND c.notice_deadline IS NOT NULL
              THEN (c.expiration_date - c.notice_deadline)::numeric
            ELSE NULL::numeric
          END AS notice_period_days,
          c.auto_renew,
          c.renewal_type AS renewal_decision_state,
          c.renewal_owner_role AS renewal_owner_ref,
          c.benchmark_rights AS benchmarking_clause,
          concat_ws(
            ' - ',
            NULLIF(c.termination_rights, ''),
            NULLIF(c.exit_assistance_terms, '')
          ) AS exit_rights_summary,
          COALESCE(c.raw_payload ->> 'alternatives_available', NULL) AS alternatives_available,
          COALESCE(v.risk_tier, v.strategic_status) AS concentration_note,
          c.confidence AS source_confidence,
          c.annual_value AS resolved_annual_value,
          false AS annual_value_conflict_flag,
          c.total_committed_value AS resolved_total_committed_value,
          false AS total_committed_value_conflict_flag
        FROM source.contract c
        LEFT JOIN source.vendor v
          ON v.tenant_key = c.tenant_key
         AND v.vendor_id = c.vendor_id
        LEFT JOIN (
          SELECT
            tenant_key,
            contract_id,
            sum(committed_amount)::numeric AS committed_annual_spend,
            sum(actual_spend)::numeric AS actual_annual_spend
          FROM source.contract_consumption_observation
          GROUP BY tenant_key, contract_id
        ) consumption
          ON consumption.tenant_key = c.tenant_key
         AND consumption.contract_id = c.contract_id
        WHERE NOT EXISTS (
          SELECT 1
          FROM raw_enterprise_it.vendors_contracts legacy
          WHERE legacy._tenant_key = c.tenant_key
            AND legacy.contract_id = c.contract_id
        )
      )
      SELECT * FROM legacy_contracts
      UNION ALL
      SELECT * FROM canonical_contracts
    $view$;
  ELSE
    EXECUTE $view$
      CREATE OR REPLACE VIEW source.contract_vendor_360 AS
      SELECT
        c.tenant_key,
        c.contract_id,
        c.vendor_id AS vendor_ref,
        COALESCE(v.legal_name, c.vendor_id, 'Unknown vendor') AS vendor_name,
        v.supplier_category AS vendor_category,
        c.contract_name,
        concat_ws(
          ' - ',
          NULLIF(c.agreement_type, ''),
          NULLIF(c.payment_terms, ''),
          NULLIF(c.benchmark_rights, ''),
          NULLIF(c.termination_rights, '')
        ) AS scope_summary,
        c.annual_value,
        c.total_committed_value,
        COALESCE(consumption.committed_annual_spend, c.annual_value) AS committed_annual_spend,
        COALESCE(consumption.actual_annual_spend, c.annual_value) AS actual_annual_spend,
        c.expiration_date AS end_date,
        CASE
          WHEN c.expiration_date IS NOT NULL AND c.notice_deadline IS NOT NULL
            THEN (c.expiration_date - c.notice_deadline)::numeric
          ELSE NULL::numeric
        END AS notice_period_days,
        c.auto_renew,
        c.renewal_type AS renewal_decision_state,
        c.renewal_owner_role AS renewal_owner_ref,
        c.benchmark_rights AS benchmarking_clause,
        concat_ws(
          ' - ',
          NULLIF(c.termination_rights, ''),
          NULLIF(c.exit_assistance_terms, '')
        ) AS exit_rights_summary,
        COALESCE(c.raw_payload ->> 'alternatives_available', NULL) AS alternatives_available,
        COALESCE(v.risk_tier, v.strategic_status) AS concentration_note,
        c.confidence AS source_confidence,
        c.annual_value AS resolved_annual_value,
        false AS annual_value_conflict_flag,
        c.total_committed_value AS resolved_total_committed_value,
        false AS total_committed_value_conflict_flag
      FROM source.contract c
      LEFT JOIN source.vendor v
        ON v.tenant_key = c.tenant_key
       AND v.vendor_id = c.vendor_id
      LEFT JOIN (
        SELECT
          tenant_key,
          contract_id,
          sum(committed_amount)::numeric AS committed_annual_spend,
          sum(actual_spend)::numeric AS actual_annual_spend
        FROM source.contract_consumption_observation
        GROUP BY tenant_key, contract_id
      ) consumption
        ON consumption.tenant_key = c.tenant_key
       AND consumption.contract_id = c.contract_id
    $view$;
  END IF;
END
$source_layer_cube_readmodel_projection$;

CREATE OR REPLACE VIEW source.vendor_contract_portfolio AS
SELECT
  tenant_key,
  vendor_ref,
  vendor_name,
  vendor_category,
  count(*) AS contract_count,
  sum(annual_value) AS annual_value,
  sum(total_committed_value) AS total_committed_value,
  count(*) FILTER (WHERE auto_renew) AS auto_renew_contracts,
  min(end_date) AS next_end_date,
  array_agg(contract_id ORDER BY annual_value DESC NULLS LAST, contract_id) AS contract_refs
FROM source.contract_vendor_360
GROUP BY tenant_key, vendor_ref, vendor_name, vendor_category;

CREATE OR REPLACE VIEW source.contract_360 AS
SELECT
  c.*,
  COALESCE(app.scoped_application_count, 0) AS scoped_application_count,
  COALESCE(app.critical_application_count, 0) AS critical_application_count,
  COALESCE(fin.linked_budget_amount, 0) AS linked_budget_amount,
  COALESCE(fin.linked_actual_amount, 0) AS linked_actual_amount,
  COALESCE(fin.linked_budget_lines, 0) AS linked_budget_lines,
  COALESCE(op.cloud_sev1_sev2_incidents, perf.cloud_sev1_sev2_incidents, 0) AS cloud_sev1_sev2_incidents,
  COALESCE(op.evidence_gap, perf.evidence_gap) AS operational_evidence_gap,
  COALESCE(dep.dependency_count, 0) AS initiative_dependency_count
FROM source.contract_vendor_360 c
LEFT JOIN (
  SELECT
    tenant_key,
    contract_id,
    count(DISTINCT application_ref) AS scoped_application_count,
    count(DISTINCT application_ref) FILTER (
      WHERE criticality IN ('Tier 0', 'Tier 1', 'Mission critical', 'Critical')
    ) AS critical_application_count
  FROM source.contract_application_scope
  GROUP BY tenant_key, contract_id
) app
  ON app.tenant_key = c.tenant_key
 AND app.contract_id = c.contract_id
LEFT JOIN source.contract_financial_exposure fin
  ON fin.tenant_key = c.tenant_key
 AND fin.contract_id = c.contract_id
LEFT JOIN source.contract_operational_performance op
  ON op.tenant_key = c.tenant_key
 AND op.contract_id = c.contract_id
LEFT JOIN (
  SELECT
    tenant_key,
    contract_id,
    sum(breach_count)::int AS cloud_sev1_sev2_incidents,
    NULL::text AS evidence_gap
  FROM source.contract_performance_observation
  GROUP BY tenant_key, contract_id
) perf
  ON perf.tenant_key = c.tenant_key
 AND perf.contract_id = c.contract_id
LEFT JOIN (
  SELECT tenant_key, contract_id, count(*) AS dependency_count
  FROM source.contract_initiative_dependency
  GROUP BY tenant_key, contract_id
) dep
  ON dep.tenant_key = c.tenant_key
 AND dep.contract_id = c.contract_id;
