// ─────────────────────────────────────────────────────────────────────────────
// Read adapter for the new cross-domain SkyHarbor schema (source.*, tower.*,
// doc.*). Azure Postgres only — these schemas have no Supabase/public-schema
// legacy equivalent, so unlike most `read-adapters/*ReadAdapter.ts` files this
// has no dual-plane switch.
//
// `postgresCompat.ts`'s fluent `.from()` cannot address a non-public schema
// (`schema()` is currently a no-op passthrough), so every query here goes
// through a session-scoped SQL runner with hand-written, schema-qualified,
// parameterized SQL. The session sets `app.tenant_key` before querying because
// the Source/Tower/doc tables are RLS-protected; without that setting, a valid
// tenant can appear to have no rows even after the live load succeeds.
// ─────────────────────────────────────────────────────────────────────────────

import { azureRead } from "@/lib/data-plane/azureRead";
import {
  appClientKeyForTenant,
  canonicalTenantKey,
  tenantAliasesFor,
} from "@/lib/tenant/aliases";
import {
  buildContractOptimizationEvidencePack,
  type ContractOptimizationEvidenceItem,
} from "./contract-optimization-evidence";
import { classifyOpportunityTrace } from "./contract-optimization-traceability";
import {
  buildContractOptimizationOpportunitySet,
  type ContractOptimizationOpportunity,
  type ContractOptimizationOpportunitySet,
  type FinanceRealizationLink,
  type OptimizationApprovalDecisionRead,
  type OptimizationApprovalRequestRead,
  type OptimizationBaselineRead,
  type OptimizationCaseRead,
  type OptimizationEvidenceGrade,
  type OptimizationNegotiatedOutcomeRead,
  type OptimizationOpportunityStage,
  type OptimizationOpportunityValueType,
  type OpportunityCalculationLine,
  type OpportunityCalculationRead,
  type OpportunitySourceReference,
} from "./contract-optimization-opportunity";
import type {
  DocExtractionRow,
  SourceApplicationVendorExposureRow,
  SourceContract360Row,
  SourceContractApplicationScopeRow,
  SourceContractEvidenceOverviewRow,
  SourceContractEvidencePerformanceSummary,
  SourceContractEvidencePricingRow,
  SourceContractEvidenceScopeRow,
  SourceContractFinancialExposureRow,
  SourceContractInitiativeDependencyRow,
  SourceContractOperationalPerformanceRow,
  SourceContractVendor360Row,
  SourceVendorContractPortfolioRow,
  TowerMetricObservationRow,
  TowerMetricProvenanceRow,
  TowerValueClaimRow,
} from "./types";

type NumericRow = Record<string, unknown>;

function isMeridianTenantKey(tenantKey: string): boolean {
  return (
    appClientKeyForTenant(tenantKey) === "meridian" ||
    tenantKey.trim().toLowerCase() === "meridian_health_global"
  );
}

const MERIDIAN_VENDOR360_TENANT_KEY = "meridian_health_global";
const MERIDIAN_VENDOR360_DATASET_ID =
  "meridian-source-5-contract-vendor360-20260811";

/**
 * Resolve tenant aliases through the shared tenant service. Source data-model
 * readers must not carry tenant-specific alias lists because the same contract
 * optimization capability has to run for every tenant over the same evidence
 * classes. Unknown tenants intentionally pass through as exact keys.
 */
function tenantKeyAliases(tenantKey: string): string[] {
  const aliases = tenantAliasesFor(tenantKey);
  if (isMeridianTenantKey(tenantKey)) aliases.push("meridian_health_global");
  return Array.from(new Set(aliases));
}

function canonicalSourceTenantKeys(tenantKey: string): string[] {
  const trimmed = tenantKey.trim();
  return Array.from(
    new Set(
      [trimmed.endsWith("_global") ? trimmed : null, canonicalTenantKey(tenantKey)]
        .filter((value): value is string => Boolean(value)),
    ),
  );
}

function tenantRlsKey(tenantKey: string): string {
  if (isMeridianTenantKey(tenantKey)) return "meridian_health_global";
  const trimmed = tenantKey.trim();
  if (trimmed.endsWith("_global")) return trimmed;
  return canonicalTenantKey(tenantKey);
}

function canonicalTenantRlsKey(tenantKey: string): string {
  const trimmed = tenantKey.trim();
  if (trimmed.endsWith("_global")) return trimmed;
  return canonicalTenantKey(tenantKey);
}

async function queryForTenant<R>(
  tenantKey: string,
  sql: string,
  params: readonly unknown[] = [],
): Promise<R[]> {
  const aliases = tenantKeyAliases(tenantKey);
  return azureRead.withSession(async (run) => {
    await run("SELECT set_config('app.tenant_key', $1, false)", [
      tenantRlsKey(tenantKey),
    ]);
    return run(sql, [aliases, ...params]);
  });
}

async function queryCanonicalSourceForTenant<R>(
  tenantKey: string,
  sql: string,
  params: readonly unknown[] = [],
): Promise<R[]> {
  const aliases = canonicalSourceTenantKeys(tenantKey);
  return azureRead.withSession(async (run) => {
    await run("SELECT set_config('app.tenant_key', $1, false)", [
      canonicalTenantRlsKey(tenantKey),
    ]);
    return run(sql, [aliases, ...params]);
  });
}

async function safeQueryForTenant<R>(
  tenantKey: string,
  sql: string,
  params: readonly unknown[] = [],
): Promise<R[]> {
  try {
    return await queryForTenant<R>(tenantKey, sql, params);
  } catch {
    return [];
  }
}

async function meridianCanaryRows<R>(
  sql: string,
  params: readonly unknown[] = [],
): Promise<R[]> {
  return azureRead.query<R>(sql, ["meridian_health_global", ...params], {
    missingTable: "empty",
  });
}

async function meridianVendor360CandidateRows<R>(
  sql: string,
  params: readonly unknown[] = [],
): Promise<R[]> {
  return azureRead.query<R>(
    sql,
    [MERIDIAN_VENDOR360_TENANT_KEY, MERIDIAN_VENDOR360_DATASET_ID, ...params],
    { missingTable: "empty" },
  );
}

async function withMeridianFallback<R>(
  tenantKey: string,
  legacyRead: () => Promise<R[]>,
  canaryRead: () => Promise<R[]>,
): Promise<R[]> {
  if (!isMeridianTenantKey(tenantKey)) return legacyRead();
  const canaryRows = await canaryRead();
  if (canaryRows.length > 0) return canaryRows;
  return legacyRead();
}

export async function listContractVendor360(
  tenantKey: string,
): Promise<SourceContractVendor360Row[]> {
  const governedRows =
    await queryCanonicalSourceForTenant<SourceContractVendor360Row>(
      tenantKey,
      "SELECT * FROM source.contract_vendor_360 WHERE tenant_key = ANY($1::text[]) ORDER BY annual_value DESC NULLS LAST",
    );
  if (governedRows.length > 0) return governedRows;
  if (isMeridianTenantKey(tenantKey)) {
    const candidate = await listMeridianVendor360CandidateContracts();
    if (candidate.length > 0) return candidate;
  }
  return queryForTenant<SourceContractVendor360Row>(
    tenantKey,
    "SELECT * FROM source.contract_vendor_360 WHERE tenant_key = ANY($1::text[]) ORDER BY annual_value DESC NULLS LAST",
  );
}

export async function listContract360(
  tenantKey: string,
): Promise<SourceContract360Row[]> {
  const governedRows =
    await queryCanonicalSourceForTenant<SourceContract360Row>(
      tenantKey,
      "SELECT * FROM source.contract_360 WHERE tenant_key = ANY($1::text[]) ORDER BY annual_value DESC NULLS LAST",
    );
  if (governedRows.length > 0) return governedRows;
  if (isMeridianTenantKey(tenantKey)) {
    const candidate = await listMeridianVendor360CandidateContracts();
    if (candidate.length > 0) return candidate;
  }
  return withMeridianFallback(
    tenantKey,
    () =>
      queryForTenant<SourceContract360Row>(
        tenantKey,
        "SELECT * FROM source.contract_360 WHERE tenant_key = ANY($1::text[]) ORDER BY annual_value DESC NULLS LAST",
      ),
    () =>
      meridianCanaryRows<SourceContract360Row>(
        `with spend as (
           select contract_family_id, sum(line_amount)::numeric as actual_annual_spend
             from foundation_v2_meridian_health_cube_canary.meridian_health_spend_invoice_history_v1
            where tenant_key = $1
            group by contract_family_id
         ),
         scope as (
           select
             cs.contract_family_id,
             count(*)::int as scoped_application_count,
             count(*) filter (where lower(coalesce(app.criticality, '')) in ('critical', 'high'))::int as critical_application_count,
             avg(cs.relationship_confidence)::numeric as source_confidence
            from foundation_v2_meridian_health_cube_canary.meridian_health_contract_scope_v1 cs
            left join foundation_v2_meridian_health_cube_canary.meridian_health_application_dependency_v1 app
              on app.tenant_key = cs.tenant_key
             and app.application_id = cs.application_ref
           where cs.tenant_key = $1
           group by cs.contract_family_id
         ),
         perf as (
           select
             contract_id,
             sum(p1_count + p2_count)::int as cloud_sev1_sev2_incidents
            from foundation_v2_meridian_health_cube_canary.meridian_health_sla_itsm_performance_v1
           where tenant_key = $1
           group by contract_id
         )
         select
           cf.tenant_key,
           cf.contract_family_id as contract_id,
           cf.vendor_id as vendor_ref,
           coalesce(v.legal_name, cf.vendor_id) as vendor_name,
           v.supplier_category as vendor_category,
           cf.contract_name,
           concat_ws(' · ',
             nullif(v.supplier_category, ''),
             nullif(v.risk_tier, ''),
             nullif(cf.evidence_tier, '')
           ) as scope_summary,
           coalesce(sp.actual_annual_spend, cf.synthetic_midpoint_total_contract_value / 5.0) as annual_value,
           cf.synthetic_midpoint_total_contract_value as total_committed_value,
           coalesce(sp.actual_annual_spend, cf.synthetic_midpoint_total_contract_value / 5.0) as committed_annual_spend,
           sp.actual_annual_spend,
           null::date as end_date,
           null::int as notice_period_days,
           false as auto_renew,
           cf.renewal_window as renewal_decision_state,
           null::text as renewal_owner_ref,
           case when cf.sla_term_count > 0 then 'SLA and credit terms present in governed contract-family projection.' else null end as benchmarking_clause,
           cf.renewal_window as exit_rights_summary,
           null::text as alternatives_available,
           v.risk_tier as concentration_note,
           scope.source_confidence,
           coalesce(sp.actual_annual_spend, cf.synthetic_midpoint_total_contract_value / 5.0) as resolved_annual_value,
           cf.synthetic_midpoint_total_contract_value as resolved_total_committed_value,
           false as annual_value_conflict_flag,
           false as total_committed_value_conflict_flag,
           coalesce(scope.scoped_application_count, 0) as scoped_application_count,
           coalesce(scope.critical_application_count, 0) as critical_application_count,
           null::numeric as linked_budget_amount,
           sp.actual_annual_spend as linked_actual_amount,
           null::int as linked_budget_lines,
           coalesce(perf.cloud_sev1_sev2_incidents, 0) as cloud_sev1_sev2_incidents,
           false as operational_evidence_gap,
           0 as initiative_dependency_count
          from foundation_v2_meridian_health_cube_canary.meridian_health_contract_family_v1 cf
          left join foundation_v2_meridian_health_cube_canary.meridian_health_vendor_portfolio_v1 v
            on v.tenant_key = cf.tenant_key
           and v.vendor_id = cf.vendor_id
          left join spend sp on sp.contract_family_id = cf.contract_family_id
          left join scope on scope.contract_family_id = cf.contract_family_id
          left join perf on perf.contract_id = cf.contract_family_id
         where cf.tenant_key = $1
         order by annual_value desc nulls last`,
      ),
  );
}

function listMeridianVendor360CandidateContracts(): Promise<
  SourceContract360Row[]
> {
  return meridianVendor360CandidateRows<SourceContract360Row>(
    `SELECT
       tenant_key,
       contract_id,
       vendor_ref,
       vendor_name,
       vendor_category,
       contract_name,
       scope_summary,
       annual_value,
       total_committed_value,
       committed_annual_spend,
       actual_annual_spend,
       end_date,
       notice_period_days,
       auto_renew,
       renewal_decision_state,
       renewal_owner_ref,
       benchmarking_clause,
       exit_rights_summary,
       alternatives_available,
       concentration_note,
       source_confidence,
       resolved_annual_value,
       annual_value_conflict_flag,
       resolved_total_committed_value,
       total_committed_value_conflict_flag,
       scoped_application_count,
       critical_application_count,
       linked_budget_amount,
       linked_actual_amount,
       linked_budget_lines,
       cloud_sev1_sev2_incidents,
       operational_evidence_gap,
       initiative_dependency_count
      FROM source.meridian_vendor360_contract
     WHERE tenant_key = $1 AND dataset_id = $2
     ORDER BY annual_value DESC NULLS LAST`,
  );
}

export async function getContract360(
  tenantKey: string,
  contractId: string,
): Promise<SourceContract360Row | null> {
  const governedRows =
    await queryCanonicalSourceForTenant<SourceContract360Row>(
      tenantKey,
      "SELECT * FROM source.contract_360 WHERE tenant_key = ANY($1::text[]) AND contract_id = $2 LIMIT 1",
      [contractId],
    );
  if (governedRows[0]) return governedRows[0];
  if (isMeridianTenantKey(tenantKey)) {
    const rows = await listContract360(tenantKey);
    return rows.find((row) => row.contract_id === contractId) ?? null;
  }

  const rows = await queryForTenant<SourceContract360Row>(
    tenantKey,
    "SELECT * FROM source.contract_360 WHERE tenant_key = ANY($1::text[]) AND contract_id = $2 LIMIT 1",
    [contractId],
  );
  return rows[0] ?? null;
}

export async function listVendorContractPortfolio(
  tenantKey: string,
): Promise<SourceVendorContractPortfolioRow[]> {
  const governedRows =
    await queryCanonicalSourceForTenant<SourceVendorContractPortfolioRow>(
      tenantKey,
      "SELECT * FROM source.vendor_contract_portfolio WHERE tenant_key = ANY($1::text[]) ORDER BY annual_value DESC NULLS LAST",
    );
  if (governedRows.length > 0) return governedRows;
  if (isMeridianTenantKey(tenantKey)) {
    const candidate =
      await meridianVendor360CandidateRows<SourceVendorContractPortfolioRow>(
        `SELECT
           tenant_key,
           vendor_ref,
           vendor_name,
           vendor_category,
           count(*)::int AS contract_count,
           sum(annual_value)::numeric AS annual_value,
           sum(total_committed_value)::numeric AS total_committed_value,
           count(*) FILTER (WHERE auto_renew)::int AS auto_renew_contracts,
           min(end_date) AS next_end_date,
           array_agg(contract_id ORDER BY annual_value DESC NULLS LAST) AS contract_refs
          FROM source.meridian_vendor360_contract
         WHERE tenant_key = $1 AND dataset_id = $2
         GROUP BY tenant_key, vendor_ref, vendor_name, vendor_category
         ORDER BY annual_value DESC NULLS LAST`,
      );
    if (candidate.length > 0) return candidate;
  }
  return withMeridianFallback(
    tenantKey,
    () =>
      queryForTenant<SourceVendorContractPortfolioRow>(
        tenantKey,
        "SELECT * FROM source.vendor_contract_portfolio WHERE tenant_key = ANY($1::text[]) ORDER BY annual_value DESC NULLS LAST",
      ),
    () =>
      meridianCanaryRows<SourceVendorContractPortfolioRow>(
        `select
           v.tenant_key,
           v.vendor_id as vendor_ref,
           v.legal_name as vendor_name,
           v.supplier_category as vendor_category,
           v.contract_family_count as contract_count,
           v.invoice_line_amount as annual_value,
           coalesce(sum(cf.synthetic_midpoint_total_contract_value), v.invoice_line_amount) as total_committed_value,
           0 as auto_renew_contracts,
           null::date as next_end_date,
           coalesce(array_agg(cf.contract_family_id order by cf.contract_family_id) filter (where cf.contract_family_id is not null), '{}'::text[]) as contract_refs
          from foundation_v2_meridian_health_cube_canary.meridian_health_vendor_portfolio_v1 v
          left join foundation_v2_meridian_health_cube_canary.meridian_health_contract_family_v1 cf
            on cf.tenant_key = v.tenant_key
           and cf.vendor_id = v.vendor_id
         where v.tenant_key = $1
         group by v.tenant_key, v.vendor_id, v.legal_name, v.supplier_category, v.contract_family_count, v.invoice_line_amount
         order by annual_value desc nulls last`,
      ),
  );
}

export async function listContractApplicationScope(
  tenantKey: string,
  contractId?: string,
): Promise<SourceContractApplicationScopeRow[]> {
  const governedRows = contractId
    ? await queryCanonicalSourceForTenant<SourceContractApplicationScopeRow>(
        tenantKey,
        "SELECT * FROM source.contract_application_scope WHERE tenant_key = ANY($1::text[]) AND contract_id = $2",
        [contractId],
      )
    : await queryCanonicalSourceForTenant<SourceContractApplicationScopeRow>(
        tenantKey,
        "SELECT * FROM source.contract_application_scope WHERE tenant_key = ANY($1::text[])",
      );
  if (governedRows.length > 0) return governedRows;
  if (isMeridianTenantKey(tenantKey)) {
    const filter = contractId ? "AND contract_id = $3" : "";
    const candidate =
      await meridianVendor360CandidateRows<SourceContractApplicationScopeRow>(
        `SELECT
           tenant_key,
           contract_id,
           vendor_ref,
           vendor_name,
           application_ref,
           application_name,
           business_function,
           function_ref,
           criticality,
           lifecycle_state,
           hosting_model,
           annual_run_cost,
           modernization_plan,
           sla_tier,
           known_pain_risk,
           it_portfolio_ref
          FROM source.meridian_vendor360_application_scope
         WHERE tenant_key = $1 AND dataset_id = $2
           ${filter}
         ORDER BY relationship_confidence DESC NULLS LAST, application_name`,
        contractId ? [contractId] : [],
      );
    if (candidate.length > 0) return candidate;
  }
  if (contractId) {
    return withMeridianFallback(
      tenantKey,
      () =>
        queryForTenant<SourceContractApplicationScopeRow>(
          tenantKey,
          "SELECT * FROM source.contract_application_scope WHERE tenant_key = ANY($1::text[]) AND contract_id = $2",
          [contractId],
        ),
      () => listMeridianCanaryContractApplicationScope(contractId),
    );
  }
  return withMeridianFallback(
    tenantKey,
    () =>
      queryForTenant<SourceContractApplicationScopeRow>(
        tenantKey,
        "SELECT * FROM source.contract_application_scope WHERE tenant_key = ANY($1::text[])",
      ),
    () => listMeridianCanaryContractApplicationScope(),
  );
}

function listMeridianCanaryContractApplicationScope(
  contractId?: string,
): Promise<SourceContractApplicationScopeRow[]> {
  const filter = contractId ? "and cs.contract_family_id = $2" : "";
  return meridianCanaryRows<SourceContractApplicationScopeRow>(
    `select
       cs.tenant_key,
       cs.contract_family_id as contract_id,
       cs.vendor_id as vendor_ref,
       coalesce(v.legal_name, cs.vendor_id) as vendor_name,
       coalesce(cs.application_ref, cs.business_service_ref, cs.contracted_service_id) as application_ref,
       coalesce(app.application_name, cs.application_ref, cs.business_service_ref, cs.contracted_service_id) as application_name,
       app.owner_function as business_function,
       app.owner_function as function_ref,
       app.criticality,
       app.lifecycle as lifecycle_state,
       null::text as hosting_model,
       null::numeric as annual_run_cost,
       app.lifecycle as modernization_plan,
       null::text as sla_tier,
       cs.business_service_ref as known_pain_risk,
       cs.ci_ref as it_portfolio_ref
      from foundation_v2_meridian_health_cube_canary.meridian_health_contract_scope_v1 cs
      left join foundation_v2_meridian_health_cube_canary.meridian_health_vendor_portfolio_v1 v
        on v.tenant_key = cs.tenant_key
       and v.vendor_id = cs.vendor_id
      left join foundation_v2_meridian_health_cube_canary.meridian_health_application_dependency_v1 app
        on app.tenant_key = cs.tenant_key
       and app.application_id = cs.application_ref
     where cs.tenant_key = $1
       ${filter}
     order by cs.relationship_confidence desc nulls last, application_name`,
    contractId ? [contractId] : [],
  );
}

export async function listContractFinancialExposure(
  tenantKey: string,
): Promise<SourceContractFinancialExposureRow[]> {
  if (isMeridianTenantKey(tenantKey)) {
    const candidate =
      await meridianVendor360CandidateRows<SourceContractFinancialExposureRow>(
        `SELECT
           tenant_key,
           contract_id,
           vendor_ref,
           vendor_name,
           contracted_annual_value,
           total_committed_value,
           committed_annual_spend,
           actual_annual_spend,
           linked_budget_amount,
           linked_forecast_amount,
           linked_actual_amount,
           linked_committed_amount,
           linked_budget_lines
          FROM source.meridian_vendor360_financial_exposure
         WHERE tenant_key = $1 AND dataset_id = $2`,
      );
    if (candidate.length > 0) return candidate;
  }
  return queryForTenant<SourceContractFinancialExposureRow>(
    tenantKey,
    "SELECT * FROM source.contract_financial_exposure WHERE tenant_key = ANY($1::text[])",
  );
}

export async function listContractOperationalPerformance(
  tenantKey: string,
): Promise<SourceContractOperationalPerformanceRow[]> {
  if (isMeridianTenantKey(tenantKey)) {
    const candidate =
      await meridianVendor360CandidateRows<SourceContractOperationalPerformanceRow>(
        `SELECT
           tenant_key,
           contract_id,
           vendor_ref,
           vendor_name,
           sla_summary,
           scoped_application_count,
           critical_application_count,
           cloud_sev1_sev2_incidents,
           avg_cloud_change_failure_rate,
           service_credits_earned,
           service_credits_claimed,
           evidence_gap
          FROM source.meridian_vendor360_operational_performance
         WHERE tenant_key = $1 AND dataset_id = $2`,
      );
    if (candidate.length > 0) return candidate;
  }
  return queryForTenant<SourceContractOperationalPerformanceRow>(
    tenantKey,
    "SELECT * FROM source.contract_operational_performance WHERE tenant_key = ANY($1::text[])",
  );
}

export async function getContractEvidenceOverview(
  tenantKey: string,
  contractId: string,
): Promise<SourceContractEvidenceOverviewRow | null> {
  const rows = await safeQueryForTenant<SourceContractEvidenceOverviewRow>(
    tenantKey,
    `SELECT *
       FROM source.golden_contract_overview
      WHERE _tenant_key = ANY($1::text[]) AND contract_id = $2
      ORDER BY _loaded_at DESC NULLS LAST
      LIMIT 1`,
    [contractId],
  );
  return rows[0] ?? null;
}

export async function listContractEvidenceScope(
  tenantKey: string,
  contractId: string,
): Promise<SourceContractEvidenceScopeRow[]> {
  return safeQueryForTenant<SourceContractEvidenceScopeRow>(
    tenantKey,
    `SELECT *
       FROM source.golden_contract_application_scope
      WHERE _tenant_key = ANY($1::text[]) AND contract_id = $2
      ORDER BY annual_run_cost_usd DESC NULLS LAST, application_name`,
    [contractId],
  );
}

export async function listContractEvidencePricing(
  tenantKey: string,
  contractId: string,
): Promise<SourceContractEvidencePricingRow[]> {
  return safeQueryForTenant<SourceContractEvidencePricingRow>(
    tenantKey,
    `SELECT *
       FROM source.golden_contract_pricing_schedule
      WHERE _tenant_key = ANY($1::text[]) AND contract_id = $2
      ORDER BY annual_value_usd DESC NULLS LAST, line_item_id`,
    [contractId],
  );
}

export async function getContractEvidencePerformanceSummary(
  tenantKey: string,
  contractId: string,
): Promise<SourceContractEvidencePerformanceSummary | null> {
  const rows =
    await safeQueryForTenant<SourceContractEvidencePerformanceSummary>(
      tenantKey,
      `WITH sla AS (
       SELECT
         contract_id,
         MAX(dataset_version) AS dataset_version,
         MIN(period_month) AS period_start,
         MAX(period_month) AS period_end,
         COUNT(*) AS sla_months,
         COALESCE(SUM(NULLIF(sev1_incident_count::text, '')::numeric), 0) AS sev1_incidents,
         COALESCE(SUM(NULLIF(sev2_incident_count::text, '')::numeric), 0) AS sev2_incidents,
         COALESCE(SUM(NULLIF(service_credits_earned_usd::text, '')::numeric), 0) AS service_credits_earned_usd,
         COALESCE(SUM(NULLIF(service_credits_claimed_usd::text, '')::numeric), 0) AS service_credits_claimed_usd,
         COALESCE(SUM(NULLIF(service_credits_received_usd::text, '')::numeric), 0) AS service_credits_received_usd,
         ARRAY_AGG(DISTINCT source_system) FILTER (WHERE source_system IS NOT NULL) AS sla_source_systems,
         MAX(refresh_frequency) AS sla_refresh_frequency,
         MAX(review_status) AS sla_review_status
        FROM source.golden_contract_sla_incident_service_credit_monthly
       WHERE _tenant_key = ANY($1::text[]) AND contract_id = $2
       GROUP BY contract_id
     ), invoice AS (
       SELECT
         contract_id,
         COUNT(*) AS invoice_line_count,
         COALESCE(SUM(CASE WHEN COALESCE(NULLIF(exception_amount_usd::text, '')::numeric, 0) > 0 THEN 1 ELSE 0 END), 0) AS invoice_exception_count,
         COALESCE(SUM(NULLIF(exception_amount_usd::text, '')::numeric), 0) AS invoice_exception_amount_usd,
         ARRAY_AGG(DISTINCT source_system) FILTER (WHERE source_system IS NOT NULL) AS invoice_source_systems,
         MAX(refresh_frequency) AS invoice_refresh_frequency,
         MAX(review_status) AS invoice_review_status
        FROM source.golden_contract_invoice_lines
       WHERE _tenant_key = ANY($1::text[]) AND contract_id = $2
       GROUP BY contract_id
     ), rate AS (
       SELECT
         contract_id,
         COALESCE(SUM(NULLIF(rate_variance_usd::text, '')::numeric), 0) AS rate_card_variance_usd,
         ARRAY_AGG(DISTINCT source_system) FILTER (WHERE source_system IS NOT NULL) AS rate_source_systems
        FROM source.golden_contract_rate_card_variance
       WHERE _tenant_key = ANY($1::text[]) AND contract_id = $2
       GROUP BY contract_id
     ), finance AS (
       SELECT DISTINCT ON (contract_id)
         contract_id,
         NULLIF(recoverable_leakage_usd::text, '')::numeric AS recoverable_leakage_usd,
         NULLIF(avoided_cost_usd::text, '')::numeric AS avoided_cost_usd,
         NULLIF(negotiated_improvement_usd::text, '')::numeric AS negotiated_improvement_usd,
         NULLIF(realized_value_usd::text, '')::numeric AS realized_value_usd,
         source_system AS finance_source_system,
         refresh_frequency AS finance_refresh_frequency,
         review_status AS finance_review_status
        FROM source.golden_contract_finance_value_confirmation
       WHERE _tenant_key = ANY($1::text[]) AND contract_id = $2
       ORDER BY contract_id, confirmation_date DESC NULLS LAST, _loaded_at DESC NULLS LAST
     )
     SELECT
       COALESCE(sla.contract_id, invoice.contract_id, rate.contract_id, finance.contract_id) AS contract_id,
       sla.dataset_version,
       sla.period_start,
       sla.period_end,
       COALESCE(sla.sla_months, 0)::int AS sla_months,
       COALESCE(sla.sev1_incidents, 0)::int AS sev1_incidents,
       COALESCE(sla.sev2_incidents, 0)::int AS sev2_incidents,
       COALESCE(sla.service_credits_earned_usd, 0)::numeric AS service_credits_earned_usd,
       COALESCE(sla.service_credits_claimed_usd, 0)::numeric AS service_credits_claimed_usd,
       COALESCE(sla.service_credits_received_usd, 0)::numeric AS service_credits_received_usd,
       COALESCE(invoice.invoice_line_count, 0)::int AS invoice_line_count,
       COALESCE(invoice.invoice_exception_count, 0)::int AS invoice_exception_count,
       COALESCE(invoice.invoice_exception_amount_usd, 0)::numeric AS invoice_exception_amount_usd,
       COALESCE(rate.rate_card_variance_usd, 0)::numeric AS rate_card_variance_usd,
       COALESCE(finance.recoverable_leakage_usd, 0)::numeric AS recoverable_leakage_usd,
       COALESCE(finance.avoided_cost_usd, 0)::numeric AS avoided_cost_usd,
       COALESCE(finance.negotiated_improvement_usd, 0)::numeric AS negotiated_improvement_usd,
       COALESCE(finance.realized_value_usd, 0)::numeric AS realized_value_usd,
       ARRAY_REMOVE(ARRAY_CAT(ARRAY_CAT(COALESCE(sla.sla_source_systems, ARRAY[]::text[]), COALESCE(invoice.invoice_source_systems, ARRAY[]::text[])), ARRAY_CAT(COALESCE(rate.rate_source_systems, ARRAY[]::text[]), ARRAY[finance.finance_source_system])), NULL) AS source_systems,
       COALESCE(finance.finance_refresh_frequency, sla.sla_refresh_frequency, invoice.invoice_refresh_frequency) AS refresh_frequency,
       COALESCE(finance.finance_review_status, sla.sla_review_status, invoice.invoice_review_status) AS review_status
      FROM sla
      FULL OUTER JOIN invoice USING (contract_id)
      FULL OUTER JOIN rate USING (contract_id)
      FULL OUTER JOIN finance USING (contract_id)`,
      [contractId],
    );
  return rows[0] ? normalizeEvidencePerformanceSummary(rows[0]) : null;
}

function normalizeEvidencePerformanceSummary(
  row: SourceContractEvidencePerformanceSummary,
): SourceContractEvidencePerformanceSummary {
  return {
    ...row,
    sla_months: numberValue(row.sla_months) ?? 0,
    sev1_incidents: numberValue(row.sev1_incidents) ?? 0,
    sev2_incidents: numberValue(row.sev2_incidents) ?? 0,
    service_credits_earned_usd:
      numberValue(row.service_credits_earned_usd) ?? 0,
    service_credits_claimed_usd:
      numberValue(row.service_credits_claimed_usd) ?? 0,
    service_credits_received_usd:
      numberValue(row.service_credits_received_usd) ?? 0,
    invoice_line_count: numberValue(row.invoice_line_count) ?? 0,
    invoice_exception_count: numberValue(row.invoice_exception_count) ?? 0,
    invoice_exception_amount_usd:
      numberValue(row.invoice_exception_amount_usd) ?? 0,
    rate_card_variance_usd: numberValue(row.rate_card_variance_usd) ?? 0,
    recoverable_leakage_usd: numberValue(row.recoverable_leakage_usd) ?? 0,
    avoided_cost_usd: numberValue(row.avoided_cost_usd) ?? 0,
    negotiated_improvement_usd:
      numberValue(row.negotiated_improvement_usd) ?? 0,
    realized_value_usd: numberValue(row.realized_value_usd) ?? 0,
    source_systems: jsonArray(row.source_systems),
  };
}

export async function getContractOptimizationOpportunitySet(
  tenantKey: string,
  contractId: string,
  contract: SourceContract360Row | null = null,
): Promise<ContractOptimizationOpportunitySet | null> {
  const persisted = await getPersistedContractOptimizationOpportunitySet(
    tenantKey,
    contractId,
    contract,
  );
  if (persisted) return persisted;

  const [
    overviewRows,
    pricingRows,
    invoiceRows,
    poRows,
    rateRows,
    slaRows,
    usageRows,
    renewalRows,
    financeRows,
    pdfClauseRows,
  ] = await Promise.all([
    safeQueryForTenant<NumericRow>(
      tenantKey,
      `SELECT *
         FROM source.golden_contract_overview
        WHERE _tenant_key = ANY($1::text[]) AND contract_id = $2
        ORDER BY _loaded_at DESC NULLS LAST
        LIMIT 1`,
      [contractId],
    ),
    safeQueryForTenant<NumericRow>(
      tenantKey,
      `SELECT *
         FROM source.golden_contract_pricing_schedule
        WHERE _tenant_key = ANY($1::text[]) AND contract_id = $2
        ORDER BY annual_value_usd DESC NULLS LAST, line_item_id`,
      [contractId],
    ),
    safeQueryForTenant<NumericRow>(
      tenantKey,
      `SELECT *
         FROM source.golden_contract_invoice_lines
        WHERE _tenant_key = ANY($1::text[]) AND contract_id = $2
        ORDER BY invoice_date, invoice_id, invoice_line_id`,
      [contractId],
    ),
    safeQueryForTenant<NumericRow>(
      tenantKey,
      `SELECT *
         FROM source.golden_contract_po_contract_match
        WHERE _tenant_key = ANY($1::text[]) AND contract_id = $2
        ORDER BY po_number, po_line_id`,
      [contractId],
    ),
    safeQueryForTenant<NumericRow>(
      tenantKey,
      `SELECT *
         FROM source.golden_contract_rate_card_variance
        WHERE _tenant_key = ANY($1::text[]) AND contract_id = $2
        ORDER BY rate_card_line_id`,
      [contractId],
    ),
    safeQueryForTenant<NumericRow>(
      tenantKey,
      `SELECT *
         FROM source.golden_contract_sla_incident_service_credit_monthly
        WHERE _tenant_key = ANY($1::text[]) AND contract_id = $2
        ORDER BY period_month`,
      [contractId],
    ),
    safeQueryForTenant<NumericRow>(
      tenantKey,
      `SELECT *
         FROM source.golden_contract_usage_entitlement_monthly
        WHERE _tenant_key = ANY($1::text[]) AND contract_id = $2
        ORDER BY period_month, sku_or_service`,
      [contractId],
    ),
    safeQueryForTenant<NumericRow>(
      tenantKey,
      `SELECT *
         FROM source.golden_contract_renewal_negotiation_history
        WHERE _tenant_key = ANY($1::text[]) AND contract_id = $2
        ORDER BY event_date, renewal_event_id`,
      [contractId],
    ),
    safeQueryForTenant<NumericRow>(
      tenantKey,
      `SELECT *
         FROM source.golden_contract_finance_value_confirmation
        WHERE _tenant_key = ANY($1::text[]) AND contract_id = $2
        ORDER BY confirmation_date DESC NULLS LAST, _loaded_at DESC NULLS LAST
        LIMIT 1`,
      [contractId],
    ),
    safeQueryForTenant<NumericRow>(
      tenantKey,
      `SELECT *
         FROM source.contract_pdf_clause_extractions
        WHERE _tenant_key = ANY($1::text[]) AND contract_id = $2
        ORDER BY source_page, concept_ref`,
      [contractId],
    ),
  ]);

  return buildContractOptimizationOpportunitySet({
    tenantKey,
    datasetVersion: textValue(overviewRows[0]?.dataset_version) ?? undefined,
    contract,
    overview: overviewRows[0] ?? null,
    pricingRows,
    invoiceRows,
    poRows,
    rateRows,
    slaRows,
    usageRows,
    renewalRows,
    financeRow: financeRows[0] ?? null,
    pdfClauseRows,
  });
}

async function getPersistedContractOptimizationOpportunitySet(
  tenantKey: string,
  contractId: string,
  contract: SourceContract360Row | null,
): Promise<ContractOptimizationOpportunitySet | null> {
  const versionRows = await safeQueryForTenant<{ dataset_version: string }>(
    tenantKey,
    `SELECT dataset_version
       FROM source.optimization_opportunity
      WHERE tenant_key = ANY($1::text[])
        AND contract_id = $2
      GROUP BY dataset_version
      ORDER BY max(updated_at) DESC NULLS LAST
      LIMIT 1`,
    [contractId],
  );
  const datasetVersion = versionRows[0]?.dataset_version;
  if (!datasetVersion) return null;

  const [
    opportunityRows,
    baselineRows,
    evidenceRows,
    calculationRunRows,
    calculationInputRows,
    calculationOutputRows,
    valuationRows,
    requirementRows,
    caseRows,
    approvalRows,
    approvalDecisionRows,
    outcomeRows,
    financeRows,
    financeEvidenceRows,
  ] = await Promise.all([
    safeQueryForTenant<NumericRow>(
      tenantKey,
      `SELECT *
         FROM source.optimization_opportunity
        WHERE tenant_key = ANY($1::text[])
          AND dataset_version = $2
          AND contract_id = $3
        ORDER BY amount_usd DESC NULLS LAST, opportunity_id`,
      [datasetVersion, contractId],
    ),
    safeQueryForTenant<NumericRow>(
      tenantKey,
      `SELECT *
         FROM source.optimization_baseline
       WHERE tenant_key = ANY($1::text[])
         AND dataset_version = $2
         AND contract_id = $3
      ORDER BY baseline_id
      LIMIT 1`,
      [datasetVersion, contractId],
    ),
    safeQueryForTenant<NumericRow>(
      tenantKey,
      `SELECT evidence.*
         FROM source.opportunity_evidence evidence
         JOIN source.optimization_opportunity opportunity
           ON opportunity.tenant_key = evidence.tenant_key
          AND opportunity.dataset_version = evidence.dataset_version
          AND opportunity.opportunity_id = evidence.opportunity_id
        WHERE evidence.tenant_key = ANY($1::text[])
          AND evidence.dataset_version = $2
          AND opportunity.contract_id = $3
        ORDER BY evidence.opportunity_id, evidence.source_table, evidence.source_record_id`,
      [datasetVersion, contractId],
    ),
    safeQueryForTenant<NumericRow>(
      tenantKey,
      `SELECT run.*
         FROM source.calculation_run run
         JOIN source.optimization_opportunity opportunity
           ON opportunity.tenant_key = run.tenant_key
          AND opportunity.dataset_version = run.dataset_version
          AND opportunity.opportunity_id = run.opportunity_id
        WHERE run.tenant_key = ANY($1::text[])
          AND run.dataset_version = $2
          AND opportunity.contract_id = $3
        ORDER BY run.opportunity_id, run.calculation_run_id`,
      [datasetVersion, contractId],
    ),
    safeQueryForTenant<NumericRow>(
      tenantKey,
      `SELECT input.*
         FROM source.calculation_input input
         JOIN source.calculation_run run
           ON run.tenant_key = input.tenant_key
          AND run.dataset_version = input.dataset_version
          AND run.calculation_run_id = input.calculation_run_id
         JOIN source.optimization_opportunity opportunity
           ON opportunity.tenant_key = run.tenant_key
          AND opportunity.dataset_version = run.dataset_version
          AND opportunity.opportunity_id = run.opportunity_id
        WHERE input.tenant_key = ANY($1::text[])
          AND input.dataset_version = $2
          AND opportunity.contract_id = $3
        ORDER BY input.calculation_run_id, input.input_key`,
      [datasetVersion, contractId],
    ),
    safeQueryForTenant<NumericRow>(
      tenantKey,
      `SELECT output.*
         FROM source.calculation_output output
         JOIN source.calculation_run run
           ON run.tenant_key = output.tenant_key
          AND run.dataset_version = output.dataset_version
          AND run.calculation_run_id = output.calculation_run_id
         JOIN source.optimization_opportunity opportunity
           ON opportunity.tenant_key = run.tenant_key
          AND opportunity.dataset_version = run.dataset_version
          AND opportunity.opportunity_id = run.opportunity_id
        WHERE output.tenant_key = ANY($1::text[])
          AND output.dataset_version = $2
          AND opportunity.contract_id = $3
        ORDER BY output.calculation_run_id, output.output_key`,
      [datasetVersion, contractId],
    ),
    safeQueryForTenant<NumericRow>(
      tenantKey,
      `SELECT valuation.*
         FROM source.opportunity_valuation valuation
         JOIN source.optimization_opportunity opportunity
           ON opportunity.tenant_key = valuation.tenant_key
          AND opportunity.dataset_version = valuation.dataset_version
          AND opportunity.opportunity_id = valuation.opportunity_id
        WHERE valuation.tenant_key = ANY($1::text[])
          AND valuation.dataset_version = $2
          AND opportunity.contract_id = $3
        ORDER BY valuation.opportunity_id, valuation.created_at DESC NULLS LAST`,
      [datasetVersion, contractId],
    ),
    safeQueryForTenant<NumericRow>(
      tenantKey,
      `SELECT requirement.*
         FROM source.opportunity_requirement_status requirement
         JOIN source.optimization_opportunity opportunity
           ON opportunity.tenant_key = requirement.tenant_key
          AND opportunity.dataset_version = requirement.dataset_version
          AND opportunity.opportunity_id = requirement.opportunity_id
        WHERE requirement.tenant_key = ANY($1::text[])
          AND requirement.dataset_version = $2
          AND opportunity.contract_id = $3
        ORDER BY requirement.opportunity_id, requirement.requirement_id`,
      [datasetVersion, contractId],
    ),
    safeQueryForTenant<NumericRow>(
      tenantKey,
      `SELECT *
         FROM source.optimization_case
        WHERE tenant_key = ANY($1::text[])
          AND dataset_version = $2
          AND contract_id = $3
        ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, optimization_case_id
        LIMIT 1`,
      [datasetVersion, contractId],
    ),
    safeQueryForTenant<NumericRow>(
      tenantKey,
      `SELECT request.*
         FROM source.approval_request request
         JOIN source.optimization_case opt_case
           ON opt_case.tenant_key = request.tenant_key
          AND opt_case.dataset_version = request.dataset_version
          AND opt_case.optimization_case_id = request.optimization_case_id
        WHERE request.tenant_key = ANY($1::text[])
          AND request.dataset_version = $2
          AND opt_case.contract_id = $3
        ORDER BY request.requested_at DESC NULLS LAST, request.approval_request_id`,
      [datasetVersion, contractId],
    ),
    safeQueryForTenant<NumericRow>(
      tenantKey,
      `SELECT decision.*
         FROM source.approval_decision decision
         JOIN source.approval_request request
           ON request.tenant_key = decision.tenant_key
          AND request.dataset_version = decision.dataset_version
          AND request.approval_request_id = decision.approval_request_id
         JOIN source.optimization_case opt_case
           ON opt_case.tenant_key = request.tenant_key
          AND opt_case.dataset_version = request.dataset_version
          AND opt_case.optimization_case_id = request.optimization_case_id
        WHERE decision.tenant_key = ANY($1::text[])
          AND decision.dataset_version = $2
          AND opt_case.contract_id = $3
        ORDER BY decision.decided_at DESC NULLS LAST, decision.approval_request_id`,
      [datasetVersion, contractId],
    ),
    safeQueryForTenant<NumericRow>(
      tenantKey,
      `SELECT outcome.*
         FROM source.negotiated_outcome outcome
         JOIN source.optimization_case opt_case
           ON opt_case.tenant_key = outcome.tenant_key
          AND opt_case.dataset_version = outcome.dataset_version
          AND opt_case.optimization_case_id = outcome.optimization_case_id
        WHERE outcome.tenant_key = ANY($1::text[])
          AND outcome.dataset_version = $2
          AND opt_case.contract_id = $3
        ORDER BY outcome.effective_date DESC NULLS LAST, outcome.outcome_id`,
      [datasetVersion, contractId],
    ),
    safeQueryForTenant<NumericRow>(
      tenantKey,
      `SELECT realization.*
         FROM source.finance_realization realization
         JOIN source.optimization_opportunity opportunity
           ON opportunity.tenant_key = realization.tenant_key
          AND opportunity.dataset_version = realization.dataset_version
          AND opportunity.opportunity_id = realization.opportunity_id
        WHERE realization.tenant_key = ANY($1::text[])
          AND realization.dataset_version = $2
          AND opportunity.contract_id = $3
        ORDER BY realization.confirmation_date DESC NULLS LAST, realization.realization_id`,
      [datasetVersion, contractId],
    ),
    safeQueryForTenant<NumericRow>(
      tenantKey,
      `SELECT evidence.*
         FROM source.finance_realization_evidence evidence
         JOIN source.finance_realization realization
           ON realization.tenant_key = evidence.tenant_key
          AND realization.dataset_version = evidence.dataset_version
          AND realization.realization_id = evidence.realization_id
         JOIN source.optimization_opportunity opportunity
           ON opportunity.tenant_key = realization.tenant_key
          AND opportunity.dataset_version = realization.dataset_version
          AND opportunity.opportunity_id = realization.opportunity_id
        WHERE evidence.tenant_key = ANY($1::text[])
          AND evidence.dataset_version = $2
          AND opportunity.contract_id = $3
        ORDER BY evidence.realization_id, evidence.source_table, evidence.source_record_id`,
      [datasetVersion, contractId],
    ),
  ]);

  if (opportunityRows.length === 0) return null;

  const baselineRow = baselineRows[0] ?? {};
  const evidenceByOpportunity = groupByString(evidenceRows, "opportunity_id");
  const valuationByOpportunity = groupByString(valuationRows, "opportunity_id");
  const requirementByOpportunity = groupByString(
    requirementRows,
    "opportunity_id",
  );
  const calculationRunByOpportunity = new Map(
    calculationRunRows.map((row) => [textValue(row.opportunity_id) ?? "", row]),
  );
  const calculationInputsByRun = groupByString(
    calculationInputRows,
    "calculation_run_id",
  );
  const calculationOutputsByRun = groupByString(
    calculationOutputRows,
    "calculation_run_id",
  );

  const opportunities = opportunityRows.map((row) =>
    persistedOpportunityFromRow({
      row,
      evidenceRows:
        evidenceByOpportunity.get(textValue(row.opportunity_id) ?? "") ?? [],
      valuationRows:
        valuationByOpportunity.get(textValue(row.opportunity_id) ?? "") ?? [],
      requirementRows:
        requirementByOpportunity.get(textValue(row.opportunity_id) ?? "") ?? [],
      calculationRun:
        calculationRunByOpportunity.get(textValue(row.opportunity_id) ?? "") ??
        null,
      calculationInputsByRun,
      calculationOutputsByRun,
    }),
  );

  const financeEvidenceByRealization = groupByString(
    financeEvidenceRows,
    "realization_id",
  );
  const opportunityIds = new Set(
    opportunities.map((opportunity) => opportunity.opportunityId),
  );
  const financeRealizations: FinanceRealizationLink[] = financeRows
    .filter((row) => opportunityIds.has(textValue(row.opportunity_id) ?? ""))
    .map((row) => ({
      realizationId: textValue(row.realization_id) ?? "",
      amountUsd: numberValue(row.amount_usd) ?? 0,
      basis: textValue(row.basis) ?? "Finance-confirmed realized value.",
      confirmationDate: textValue(row.confirmation_date),
      owner: textValue(row.finance_owner_role),
      towerClaimRefs: jsonArray(row.tower_claim_refs),
      linkedOpportunityIds: [
        textValue(row.opportunity_id),
        ...jsonArray(jsonObject(row.payload).linked_opportunity_ids),
      ].filter((value): value is string => Boolean(value)),
      sourceRefs: (
        financeEvidenceByRealization.get(textValue(row.realization_id) ?? "") ??
        []
      ).map(sourceRefFromEvidence),
    }));
  const optimizationCase = caseRows[0]
    ? optimizationCaseFromRow(caseRows[0])
    : null;
  const approvalDecisionsByRequest = groupByString(
    approvalDecisionRows,
    "approval_request_id",
  );
  const approvalRequests = approvalRows.map((row) =>
    approvalRequestFromRow(
      row,
      approvalDecisionsByRequest.get(
        textValue(row.approval_request_id) ?? "",
      ) ?? [],
    ),
  );
  const negotiatedOutcomes = outcomeRows
    .filter((row) => opportunityIds.has(textValue(row.opportunity_id) ?? ""))
    .map(negotiatedOutcomeFromRow);

  const potentialRecoverableUsd = sumNumbers(
    opportunities
      .filter((opportunity) => opportunity.valueType === "recoverable_leakage")
      .map((opportunity) => opportunity.amountUsd),
  );
  const potentialAvoidableUsd = sumNumbers(
    opportunities
      .filter((opportunity) => opportunity.valueType === "avoided_cost")
      .map((opportunity) => opportunity.amountUsd),
  );
  const potentialNegotiableUsd = sumNumbers(
    opportunities
      .filter(
        (opportunity) => opportunity.valueType === "negotiable_improvement",
      )
      .map((opportunity) => opportunity.amountUsd),
  );
  const financeConfirmedUsd = sumNumbers(
    financeRealizations.map((item) => item.amountUsd),
  );
  const selectedOpportunityId = selectDefaultOptimizationOpportunityId({
    opportunities,
    approvalRequests,
    negotiatedOutcomes,
  });
  const blockingRequirements = requirementRows
    .filter((row) => opportunityIds.has(textValue(row.opportunity_id) ?? ""))
    .filter((row) => textValue(row.status) !== "met")
    .map((row) => textValue(row.status_detail))
    .filter((value): value is string => Boolean(value));

  return {
    tenantKey,
    datasetVersion,
    contractId,
    vendorId:
      textValue(opportunityRows[0]?.vendor_id) ?? contract?.vendor_ref ?? null,
    vendorName: contract?.vendor_name ?? null,
    contractName: contract?.contract_name ?? null,
    recommendation: opportunities.some(
      (opportunity) => opportunity.stage === "baseline_conflict",
    )
      ? "Build evidence before optimizing."
      : "Act now on governed evidence.",
    recommendationDetail:
      opportunities[0]?.narrative ??
      "Optimization opportunities are loaded from the governed opportunity spine.",
    actionState: opportunities.some(
      (opportunity) => opportunity.stage === "baseline_conflict",
    )
      ? "request_evidence"
      : selectedOpportunityId
        ? "review_calculation"
        : "request_evidence",
    baseline: persistedBaselineRead(baselineRow, contract),
    selectedOpportunityId,
    opportunities,
    optimizationCase,
    approvalRequests,
    negotiatedOutcomes,
    financeRealizations,
    evidenceRequirements: blockingRequirements,
    potentialRecoverableUsd,
    potentialAvoidableUsd,
    potentialNegotiableUsd,
    financeConfirmedUsd,
  };
}

function optimizationCaseFromRow(row: NumericRow): OptimizationCaseRead {
  return {
    caseId: textValue(row.optimization_case_id) ?? "",
    door1EventId: textValue(row.door1_event_id),
    caseState:
      readLiteral(row.case_state, [
        "intake",
        "baseline_confirmed",
        "evidence_review",
        "calculation_validated",
        "outreach_approval",
        "outcome_recorded",
        "finance_handoff",
        "closed",
      ]) ?? "intake",
    owner: textValue(row.owner),
    nextAction:
      textValue(row.next_action) ??
      "Review the optimization case before taking vendor action.",
  };
}

function approvalRequestFromRow(
  row: NumericRow,
  decisionRows: readonly NumericRow[],
): OptimizationApprovalRequestRead {
  return {
    approvalRequestId: textValue(row.approval_request_id) ?? "",
    caseId: textValue(row.optimization_case_id) ?? "",
    opportunityId: textValue(row.opportunity_id),
    approvalType: normalizeOptimizationApprovalType(row.approval_type),
    approvalState:
      readLiteral(row.approval_state, [
        "pending",
        "approved",
        "sent_back",
        "cancelled",
      ]) ?? "pending",
    requestedByRole: textValue(row.requested_by_role),
    requestedAt: textValue(row.requested_at),
    decisions: decisionRows.map(approvalDecisionFromRow),
  };
}

function normalizeOptimizationApprovalType(value: unknown): string {
  const approvalType = textValue(value) ?? "optimization_approval";
  if (approvalType === "vendor_outreach") {
    return "vendor_outreach_strategy";
  }
  return approvalType;
}

function approvalDecisionFromRow(
  row: NumericRow,
): OptimizationApprovalDecisionRead {
  return {
    decision:
      readLiteral(row.decision, ["approved", "sent_back", "held"]) ?? "held",
    rationale: textValue(row.rationale) ?? "No approval rationale recorded.",
    decidedByRole: textValue(row.decided_by_role),
    decidedAt: textValue(row.decided_at),
  };
}

function negotiatedOutcomeFromRow(
  row: NumericRow,
): OptimizationNegotiatedOutcomeRead {
  return {
    outcomeId: textValue(row.outcome_id) ?? "",
    caseId: textValue(row.optimization_case_id) ?? "",
    opportunityId: textValue(row.opportunity_id) ?? "",
    outcomeState:
      readLiteral(row.outcome_state, [
        "proposed",
        "agreed",
        "rejected",
        "withdrawn",
      ]) ?? "proposed",
    agreedAmountUsd: numberValue(row.agreed_amount_usd),
    effectiveDate: textValue(row.effective_date),
    sourceDocumentId: textValue(row.source_document_id),
  };
}

function persistedBaselineRead(
  baselineRow: NumericRow,
  contract: SourceContract360Row | null,
): OptimizationBaselineRead {
  const hasPersistedBaseline = Object.keys(baselineRow).length > 0;
  const annualValueUsd =
    numberValue(baselineRow.annual_value_usd) ??
    numberValue(contract?.resolved_annual_value) ??
    numberValue(contract?.annual_value);
  const actualAnnualSpendUsd =
    numberValue(baselineRow.actual_annual_spend_usd) ??
    numberValue(contract?.actual_annual_spend);
  const totalCommittedValueUsd =
    numberValue(baselineRow.total_committed_value_usd) ??
    numberValue(contract?.resolved_total_committed_value) ??
    numberValue(contract?.total_committed_value);
  const status =
    readLiteral(baselineRow.baseline_state, ["ready", "conflict", "missing"]) ??
    "missing";
  const headline =
    textValue(jsonObject(baselineRow.payload).headline) ??
    (hasPersistedBaseline
      ? "Commercial baseline is incomplete."
      : "Commercial baseline needs pricing schedule tie-out.");
  const detail =
    textValue(baselineRow.detail) ??
    (hasPersistedBaseline
      ? "Contract register values are available, but baseline detail still needs review before approving a value case."
      : "Contract register values are loaded from Contract 360; pricing schedule rows are still pending, so value approval remains blocked.");

  return {
    status,
    headline,
    detail,
    annualValueUsd,
    pricingScheduleAnnualValueUsd: numberValue(
      baselineRow.pricing_schedule_annual_value_usd,
    ),
    actualAnnualSpendUsd,
    totalCommittedValueUsd,
    conflictAmountUsd: numberValue(baselineRow.conflict_amount_usd),
    sourceRefs:
      jsonArray(baselineRow.source_refs).length > 0
        ? jsonArray(baselineRow.source_refs)
        : [
            "source.contract_360.annual_value",
            "source.contract_360.actual_annual_spend",
            "source.contract_360.total_committed_value",
          ],
  };
}

function persistedOpportunityFromRow(input: {
  readonly row: NumericRow;
  readonly evidenceRows: readonly NumericRow[];
  readonly valuationRows: readonly NumericRow[];
  readonly requirementRows: readonly NumericRow[];
  readonly calculationRun: NumericRow | null;
  readonly calculationInputsByRun: Map<string, NumericRow[]>;
  readonly calculationOutputsByRun: Map<string, NumericRow[]>;
}): ContractOptimizationOpportunity {
  const payload = jsonObject(input.row.payload);
  const opportunityId = textValue(input.row.opportunity_id) ?? "";
  const calculation = input.calculationRun
    ? persistedCalculationFromRows({
        run: input.calculationRun,
        inputs:
          input.calculationInputsByRun.get(
            textValue(input.calculationRun.calculation_run_id) ?? "",
          ) ?? [],
        outputs:
          input.calculationOutputsByRun.get(
            textValue(input.calculationRun.calculation_run_id) ?? "",
          ) ?? [],
      })
    : null;
  const sourceRefs = input.evidenceRows.map(sourceRefFromEvidence);
  const blockingRequirement = input.requirementRows.find(
    (row) => textValue(row.status) !== "met",
  );
  const valuationAmount =
    input.valuationRows.find(
      (row) => textValue(row.valuation_type) === "potential",
    )?.amount_usd ?? input.row.amount_usd;

  return {
    opportunityId,
    contractId: textValue(input.row.contract_id) ?? "",
    label: textValue(payload.label) ?? opportunityId,
    shortLabel:
      textValue(payload.short_label) ??
      textValue(payload.label) ??
      opportunityId,
    valueType: readValueType(input.row.value_type),
    amountUsd:
      numberValue(input.row.amount_usd) ?? numberValue(valuationAmount),
    amountState:
      readLiteral(input.row.amount_state, ["exact", "range", "not_sized"]) ??
      "not_sized",
    stage: readStage(input.row.stage),
    evidenceGrade: readEvidenceGrade(input.row.evidence_grade),
    confidence: numberValue(input.row.confidence),
    deadline: textValue(input.row.deadline),
    owner: textValue(input.row.owner),
    blockingGap:
      textValue(input.row.blocking_gap) ??
      textValue(blockingRequirement?.status_detail),
    nextAction:
      textValue(input.row.next_action) ?? "Review the opportunity evidence.",
    sourceSystems:
      jsonArray(payload.source_systems).length > 0
        ? jsonArray(payload.source_systems)
        : Array.from(
            new Set(sourceRefs.map((ref) => ref.sourceSystem).filter(Boolean)),
          ),
    evidenceRefs: sourceRefs,
    calculation,
    overlapTreatment:
      textValue(input.row.overlap_treatment) ??
      "No overlap treatment has been recorded.",
    approvalState:
      textValue(input.row.approval_state) ?? "approval_state_not_recorded",
    narrative:
      textValue(input.row.narrative) ??
      "Opportunity narrative is not recorded in the persisted spine.",
  };
}

function persistedCalculationFromRows(input: {
  readonly run: NumericRow;
  readonly inputs: readonly NumericRow[];
  readonly outputs: readonly NumericRow[];
}): OpportunityCalculationRead {
  const payload = jsonObject(input.run.payload);
  const outputsByKey = new Map(
    input.outputs.map((row) => [textValue(row.output_key) ?? "", row]),
  );
  const lineGroups = new Map<string, NumericRow[]>();
  for (const row of input.inputs) {
    const lineId =
      textValue(jsonObject(row.payload).line_id) ??
      textValue(row.input_key)?.split(".")[0] ??
      "line";
    const current = lineGroups.get(lineId) ?? [];
    current.push(row);
    lineGroups.set(lineId, current);
  }
  const lines = Array.from(lineGroups.entries()).map(([lineId, rows]) =>
    persistedCalculationLineFromRows(lineId, rows),
  );
  const calculated = outputsByKey.get("calculated_amount_usd");
  const quantity = outputsByKey.get("eligible_quantity");
  return {
    ruleId:
      textValue(input.run.rule_id) ?? "source.contract_optimization.unknown",
    ruleVersion: textValue(input.run.rule_version) ?? "unknown",
    formula:
      textValue(jsonObject(input.run.payload).formula) ??
      "Calculation formula is recorded in source.calculation_rule.",
    eligibleQuantity:
      numberValue(quantity?.quantity) ??
      sumNumbers(lines.map((line) => line.quantity ?? 0)),
    billedRateUsd: firstNumberForInput(input.inputs, "billed_rate_usd"),
    contractRateUsd: firstNumberForInput(input.inputs, "contract_rate_usd"),
    approvedExceptionsUsd: 0,
    calculatedAmountUsd: numberValue(calculated?.amount_usd) ?? 0,
    includedLineCount:
      numberValue(payload.included_line_count) ??
      lines.filter((line) => line.inclusion === "included").length,
    excludedLineCount:
      numberValue(payload.excluded_line_count) ??
      lines.filter((line) => line.inclusion === "excluded").length,
    pendingLineCount:
      numberValue(payload.pending_line_count) ??
      lines.filter((line) => line.inclusion === "pending_review").length,
    lines,
  };
}

function persistedCalculationLineFromRows(
  lineId: string,
  rows: readonly NumericRow[],
): OpportunityCalculationLine {
  const bySuffix = new Map<string, NumericRow>();
  for (const row of rows) {
    const key = textValue(row.input_key) ?? "";
    bySuffix.set(key.slice(key.indexOf(".") + 1), row);
  }
  const payload = jsonObject(rows[0]?.payload);
  const exception = bySuffix.get("exception_amount_usd");
  const quantity = bySuffix.get("quantity");
  const unit = bySuffix.get("unit_of_measure");
  const billed = bySuffix.get("billed_rate_usd");
  const contract = bySuffix.get("contract_rate_usd");
  const periodRow = bySuffix.get("service_period");
  const sourceRefs = uniqueSourceRefs(rows.map(sourceRefFromCalculationInput));

  return {
    lineId,
    invoiceId: textValue(payload.invoice_id),
    invoiceLineId: textValue(payload.invoice_line_id),
    servicePeriod: textValue(periodRow?.value_text),
    skuOrService: textValue(payload.sku_or_service),
    quantity: numberValue(quantity?.value_numeric),
    quantityBasis:
      textValue(quantity?.inclusion_reason) ??
      "Quantity basis was not recorded on the persisted calculation input.",
    unitOfMeasure: textValue(unit?.value_text) ?? textValue(quantity?.unit),
    billedRateUsd: numberValue(billed?.value_numeric),
    contractRateUsd: numberValue(contract?.value_numeric),
    amountUsd: numberValue(exception?.value_numeric) ?? 0,
    inclusion:
      readLiteral(rows[0]?.inclusion_state, [
        "included",
        "excluded",
        "pending_review",
      ]) ?? "pending_review",
    inclusionReason:
      textValue(exception?.inclusion_reason) ??
      textValue(rows[0]?.inclusion_reason) ??
      "Calculation inclusion reason was not recorded.",
    pricingScheduleRef: textValue(payload.pricing_schedule_ref),
    contractTermRef: textValue(payload.contract_term_ref),
    amendmentRef: textValue(payload.amendment_ref),
    sourceRefs,
  };
}

function sourceRefFromEvidence(row: NumericRow): OpportunitySourceReference {
  return {
    sourceSystem:
      textValue(row.source_system) ??
      textValue(row.evidence_class) ??
      "Source evidence",
    sourceRecordId: textValue(row.source_record_id),
    sourceFileReport:
      textValue(row.source_file_report) ?? textValue(row.source_document_id),
    tableName: textValue(row.source_table) ?? "source.evidence",
    pageSpan: textValue(row.source_span) ?? textValue(row.source_page),
    reviewState: textValue(row.review_state),
  };
}

function sourceRefFromCalculationInput(
  row: NumericRow,
): OpportunitySourceReference {
  return {
    sourceSystem: "Calculation input",
    sourceRecordId: textValue(row.source_record_id),
    sourceFileReport: null,
    tableName: textValue(row.source_table) ?? "source.calculation_input",
    pageSpan: null,
    reviewState: textValue(row.inclusion_state),
  };
}

function groupByString(
  rows: readonly NumericRow[],
  key: string,
): Map<string, NumericRow[]> {
  const groups = new Map<string, NumericRow[]>();
  for (const row of rows) {
    const value = textValue(row[key]);
    if (!value) continue;
    const current = groups.get(value) ?? [];
    current.push(row);
    groups.set(value, current);
  }
  return groups;
}

function selectDefaultOptimizationOpportunityId({
  opportunities,
  approvalRequests,
  negotiatedOutcomes,
}: {
  readonly opportunities: readonly ContractOptimizationOpportunity[];
  readonly approvalRequests: readonly OptimizationApprovalRequestRead[];
  readonly negotiatedOutcomes: readonly OptimizationNegotiatedOutcomeRead[];
}): string | null {
  const opportunityIds = new Set(
    opportunities.map((opportunity) => opportunity.opportunityId),
  );
  const activeApprovalOpportunityId = approvalRequests
    .filter((request) =>
      ["pending", "approved", "sent_back"].includes(request.approvalState),
    )
    .map((request) => request.opportunityId)
    .find(
      (opportunityId) => opportunityId && opportunityIds.has(opportunityId),
    );
  if (activeApprovalOpportunityId) return activeApprovalOpportunityId;

  const activeOutcomeOpportunityId = negotiatedOutcomes
    .filter((outcome) => ["proposed", "agreed"].includes(outcome.outcomeState))
    .map((outcome) => outcome.opportunityId)
    .find((opportunityId) => opportunityIds.has(opportunityId));
  if (activeOutcomeOpportunityId) return activeOutcomeOpportunityId;

  const tracedOpportunities = opportunities.filter(
    (opportunity) => classifyOpportunityTrace(opportunity).state === "traced",
  );
  const selectFrom = (candidates: readonly ContractOptimizationOpportunity[]) =>
    candidates.find((opportunity) => opportunity.stage === "target_position")
      ?.opportunityId ??
    candidates.find((opportunity) => opportunity.stage === "approval_required")
      ?.opportunityId ??
    candidates.find((opportunity) =>
      opportunity.opportunityId.endsWith(":rate-variance"),
    )?.opportunityId ??
    candidates.find((opportunity) => opportunity.amountUsd != null)
      ?.opportunityId ??
    candidates[0]?.opportunityId ??
    null;

  const tracedOpportunityId = selectFrom(tracedOpportunities);
  if (tracedOpportunityId) return tracedOpportunityId;

  return selectFrom(opportunities);
}

function uniqueSourceRefs(
  refs: readonly OpportunitySourceReference[],
): OpportunitySourceReference[] {
  const seen = new Set<string>();
  const unique: OpportunitySourceReference[] = [];
  for (const ref of refs) {
    const key = [
      ref.sourceSystem,
      ref.tableName,
      ref.sourceRecordId,
      ref.sourceFileReport,
      ref.pageSpan,
    ].join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(ref);
  }
  return unique;
}

function readValueType(value: unknown): OptimizationOpportunityValueType {
  const text = textValue(value);
  if (text === "negotiated_improvement") return "negotiable_improvement";
  if (
    text === "recoverable_leakage" ||
    text === "avoided_cost" ||
    text === "negotiable_improvement"
  ) {
    return text;
  }
  return "recoverable_leakage";
}

function readStage(value: unknown): OptimizationOpportunityStage {
  return (
    readLiteral(value, [
      "signal",
      "quantified",
      "validated",
      "approval_required",
      "target_position",
      "agreed",
      "finance_confirmed",
      "baseline_conflict",
      "evidence_required",
      "workflow_required",
    ]) ?? "evidence_required"
  );
}

function readEvidenceGrade(value: unknown): OptimizationEvidenceGrade {
  return (
    readLiteral(value, [
      "system_evidenced",
      "document_evidenced",
      "human_validated",
      "finance_confirmed",
      "missing",
      "conflicted",
    ]) ?? "missing"
  );
}

function readLiteral<const T extends readonly string[]>(
  value: unknown,
  allowed: T,
): T[number] | null {
  const text = textValue(value);
  return text && allowed.includes(text) ? text : null;
}

function firstNumberForInput(
  rows: readonly NumericRow[],
  keySuffix: string,
): number | null {
  const row = rows.find((item) =>
    (textValue(item.input_key) ?? "").endsWith(`.${keySuffix}`),
  );
  return numberValue(row?.value_numeric);
}

function jsonObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return {};
    }
  }
  return {};
}

function jsonArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item ?? "").trim()).filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item ?? "").trim()).filter(Boolean);
      }
    } catch {
      return value
        .replace(/^\{/u, "")
        .replace(/\}$/u, "")
        .split(/[;,|]/u)
        .map((item) => item.trim().replace(/^"|"$/gu, ""))
        .filter(Boolean);
    }
  }
  return [];
}

function textValue(value: unknown): string | null {
  if (value == null) return null;
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
}

function numberValue(value: unknown): number | null {
  return numberFromDb(value);
}

function sumNumbers(values: Iterable<number | null | undefined>): number {
  let total = 0;
  for (const value of values) {
    if (value != null && Number.isFinite(value)) total += value;
  }
  return Math.round((total + Number.EPSILON) * 100) / 100;
}

export async function listContractInitiativeDependency(
  tenantKey: string,
  contractId?: string,
): Promise<SourceContractInitiativeDependencyRow[]> {
  const governedRows = contractId
    ? await queryCanonicalSourceForTenant<SourceContractInitiativeDependencyRow>(
        tenantKey,
        "SELECT * FROM source.contract_initiative_dependency WHERE tenant_key = ANY($1::text[]) AND contract_id = $2",
        [contractId],
      )
    : await queryCanonicalSourceForTenant<SourceContractInitiativeDependencyRow>(
        tenantKey,
        "SELECT * FROM source.contract_initiative_dependency WHERE tenant_key = ANY($1::text[])",
      );
  if (governedRows.length > 0) return governedRows;
  if (isMeridianTenantKey(tenantKey)) {
    const filter = contractId ? "AND contract_id = $3" : "";
    const candidate =
      await meridianVendor360CandidateRows<SourceContractInitiativeDependencyRow>(
        `SELECT
           tenant_key,
           contract_id,
           vendor_ref,
           vendor_name,
           initiative_ref,
           initiative_project_name,
           status,
           target_end_date,
           approved_budget,
           expected_business_technology_value,
           major_risk_constraint,
           decision_needed
          FROM source.meridian_vendor360_initiative_dependency
         WHERE tenant_key = $1 AND dataset_id = $2
           ${filter}
         ORDER BY target_end_date NULLS LAST, initiative_ref`,
        contractId ? [contractId] : [],
      );
    if (candidate.length > 0) return candidate;
  }
  if (contractId) {
    return queryForTenant<SourceContractInitiativeDependencyRow>(
      tenantKey,
      "SELECT * FROM source.contract_initiative_dependency WHERE tenant_key = ANY($1::text[]) AND contract_id = $2",
      [contractId],
    );
  }
  return queryForTenant<SourceContractInitiativeDependencyRow>(
    tenantKey,
    "SELECT * FROM source.contract_initiative_dependency WHERE tenant_key = ANY($1::text[])",
  );
}

export async function listApplicationVendorExposure(
  tenantKey: string,
): Promise<SourceApplicationVendorExposureRow[]> {
  return queryForTenant<SourceApplicationVendorExposureRow>(
    tenantKey,
    "SELECT * FROM source.application_vendor_exposure WHERE tenant_key = ANY($1::text[])",
  );
}

/**
 * Tower metric observations for a set of subject_refs (contract_id and/or
 * vendor_ref — Tower's subject_ref is a free-text key, so callers pass
 * whatever refs they need overlaid). Returns the newest observation per
 * (subject_ref, metric_ref) by period_end — callers needing full history
 * should query tower.metric_observation directly.
 */
export async function listLatestTowerObservationsForSubjects(
  tenantKey: string,
  subjectRefs: readonly string[],
): Promise<TowerMetricObservationRow[]> {
  if (subjectRefs.length === 0) return [];
  return queryForTenant<TowerMetricObservationRow>(
    tenantKey,
    `SELECT DISTINCT ON (subject_ref, metric_ref) *
       FROM tower.metric_observation
      WHERE tenant_key = ANY($1::text[]) AND subject_ref = ANY($2)
      ORDER BY subject_ref, metric_ref, period_end DESC`,
    [subjectRefs],
  );
}

export async function listTowerValueClaimsForSubjects(
  tenantKey: string,
  subjectRefs: readonly string[],
): Promise<TowerValueClaimRow[]> {
  if (subjectRefs.length === 0) return [];
  return queryForTenant<TowerValueClaimRow>(
    tenantKey,
    "SELECT * FROM tower.value_claim WHERE tenant_key = ANY($1::text[]) AND subject_ref = ANY($2) ORDER BY evaluated_at DESC NULLS LAST",
    [subjectRefs],
  );
}

export async function listTowerMetricProvenance(
  tenantKey: string,
  provenanceIds: readonly string[],
): Promise<TowerMetricProvenanceRow[]> {
  if (provenanceIds.length === 0) return [];
  return queryForTenant<TowerMetricProvenanceRow>(
    tenantKey,
    "SELECT * FROM tower.metric_provenance WHERE tenant_key = ANY($1::text[]) AND provenance_id = ANY($2)",
    [provenanceIds],
  );
}

/** doc.extraction rows backing a concept_ref — for exact clause/row citation. */
export async function listDocExtractionsForSubject(
  tenantKey: string,
  subjectRef: string,
): Promise<DocExtractionRow[]> {
  return queryForTenant<DocExtractionRow>(
    tenantKey,
    "SELECT * FROM doc.extraction WHERE tenant_key = ANY($1::text[]) AND subject_ref = $2 ORDER BY extracted_at DESC",
    [subjectRef],
  );
}

export async function getContractOptimizationEvidencePack(
  tenantKey: string,
  contractId: string,
) {
  const [
    goldenRows,
    performanceRows,
    spendRows,
    rateRows,
    saasRows,
    sourcingRows,
  ] = await Promise.all([
    safeQueryForTenant<NumericRow>(
      tenantKey,
      `SELECT
            r.*,
            (SELECT ARRAY_AGG(DISTINCT source_file_id)
               FROM source.contract_pdf_clause_extractions x
              WHERE x._tenant_key = ANY($1::text[]) AND x._dataset_id = r._dataset_id AND x.contract_id = r.contract_id) AS document_refs,
            (SELECT ARRAY_AGG(DISTINCT source_file_id || ':p' || source_page || ':' || concept_ref)
               FROM source.contract_pdf_clause_extractions x
              WHERE x._tenant_key = ANY($1::text[]) AND x._dataset_id = r._dataset_id AND x.contract_id = r.contract_id) AS page_spans
           FROM source.golden_contract_reconciliation r
          WHERE r._tenant_key = ANY($1::text[]) AND r.contract_id = $2
          ORDER BY r._loaded_at DESC NULLS LAST
          LIMIT 1`,
      [contractId],
    ),
    safeQueryForTenant<NumericRow>(
      tenantKey,
      `SELECT
            count(*) AS row_count,
            COALESCE(SUM(credit_calculated), 0) AS credit_calculated,
            COALESCE(SUM(credit_claimed), 0) AS credit_claimed,
            COALESCE(SUM(credit_recovered), 0) AS credit_recovered,
            COALESCE(SUM(COALESCE(credit_calculated, 0) - COALESCE(credit_claimed, 0)), 0) AS unclaimed_credit
           FROM consumption_v4_canary.sourcing_performance_v1
          WHERE tenant_key = ANY($1::text[]) AND contract_id = $2`,
      [contractId],
    ),
    safeQueryForTenant<NumericRow>(
      tenantKey,
      `SELECT
            count(*) AS row_count,
            COALESCE(SUM(invoice_lines), 0) AS invoice_lines,
            COALESCE(SUM(CASE WHEN matching_state = 'off_contract' THEN actual_spend ELSE 0 END), 0) AS off_contract_spend,
            COALESCE(SUM(CASE WHEN matching_state ILIKE '%duplicate%' THEN actual_spend ELSE 0 END), 0) AS duplicate_spend
           FROM consumption_v4_canary.sourcing_spend_monthly_v1
          WHERE tenant_key = ANY($1::text[]) AND contract_id = $2`,
      [contractId],
    ),
    safeQueryForTenant<NumericRow>(
      tenantKey,
      `SELECT
            count(*) AS row_count,
            COALESCE(SUM(CASE WHEN approval_state = 'variance_unapproved' THEN 1 ELSE 0 END), 0) AS unapproved_variance_count,
            COALESCE(SUM(CASE WHEN approval_state = 'variance_unapproved' THEN variance::numeric ELSE 0 END), 0) AS rate_variance_amount,
            COALESCE(SUM(hours::numeric), 0) AS hours
           FROM raw_source_v4.fieldglass_rate_card
          WHERE _tenant_key = ANY($1::text[]) AND contract_id = $2`,
      [contractId],
    ),
    safeQueryForTenant<NumericRow>(
      tenantKey,
      `SELECT
            count(*) AS row_count,
            COALESCE(SUM(assigned_seats::numeric), 0) AS assigned_seats,
            COALESCE(SUM(active_users::numeric), 0) AS active_users,
            COALESCE(SUM(actual_cost::numeric), 0) AS actual_cost,
            COALESCE(SUM(CASE WHEN claimable_value_state = 'claimable' THEN actual_cost::numeric ELSE 0 END), 0) AS claimable_cost
           FROM raw_source_v4.entra_saas_usage_monthly
          WHERE _tenant_key = ANY($1::text[]) AND contract_id = $2`,
      [contractId],
    ),
    safeQueryForTenant<NumericRow>(
      tenantKey,
      `SELECT
            count(DISTINCT event_id) AS event_count,
            COALESCE(SUM(normalized_cost::numeric), 0) AS normalized_cost,
            COALESCE(SUM(line_item_cost::numeric), 0) AS line_item_cost
           FROM raw_source_v4.ariba_sourcing_events
          WHERE _tenant_key = ANY($1::text[]) AND contract_id = $2`,
      [contractId],
    ),
  ]);

  const golden = goldenRows.find(
    (row) => String(row.contract_id ?? "") === contractId,
  );
  if (golden) {
    const documentRefs = arrayFromDb(golden.document_refs);
    const pageSpans = arrayFromDb(golden.page_spans);
    const realizedValue = positiveNumber(golden.realized_value_usd);
    const ledgerItems: ContractOptimizationEvidenceItem[] = [
      {
        ledger_item_id: "recoverable:sla-credit-gap",
        contract_id: contractId,
        ledger_type: "recoverable_leakage",
        amount: positiveNumber(golden.service_credit_gap_usd),
        amount_state: "quantified",
        evidence_class: "system_evidenced",
        evidence_refs: [
          "source.golden_contract_sla_incident_service_credit_monthly",
          "doc.extraction:contract.sla_credit_terms",
        ],
        source_systems: ["ServiceNow", "CLM / contract repository"],
        source_record_ids: [
          `contract:${contractId}:monthly-sla-credit-history`,
        ],
        document_refs: documentRefs,
        page_spans: pageSpans.filter(
          (span) => span.includes("sla") || span.includes("credit"),
        ),
        calculation_rule:
          "SUM(service_credits_earned_usd - service_credits_claimed_usd) across monthly SLA evidence rows.",
        confidence: 0.91,
        review_state: "procurement_reviewed",
        decision_state: "candidate",
        workflow_event_id: null,
        tower_claim_id: null,
      },
      {
        ledger_item_id: "recoverable:invoice-rate-card",
        contract_id: contractId,
        ledger_type: "recoverable_leakage",
        amount:
          (numberFromDb(golden.invoice_line_exceptions_usd) ?? 0) +
          (numberFromDb(golden.rate_card_variance_usd) ?? 0),
        amount_state: "quantified",
        evidence_class: "system_evidenced",
        evidence_refs: [
          "source.golden_contract_invoice_lines",
          "source.golden_contract_po_contract_match",
          "source.golden_contract_rate_card_variance",
          "doc.extraction:contract.pricing_schedule",
        ],
        source_systems: [
          "ERP / AP",
          "Procurement / PO",
          "Fieldglass",
          "CLM / contract repository",
        ],
        source_record_ids: [
          `contract:${contractId}:invoice-po-rate-reconciliation`,
        ],
        document_refs: documentRefs,
        page_spans: pageSpans.filter(
          (span) => span.includes("pricing") || span.includes("rate"),
        ),
        calculation_rule:
          "SUM(exception_amount_usd) plus SUM(rate_variance_usd) for invoice, PO, and rate-card rows tied to the contract.",
        confidence: 0.89,
        review_state: "procurement_reviewed",
        decision_state: "candidate",
        workflow_event_id: null,
        tower_claim_id: null,
      },
      {
        ledger_item_id: "avoided:renewal-uplift",
        contract_id: contractId,
        ledger_type: "avoided_cost",
        amount: positiveNumber(golden.avoided_cost_usd),
        amount_state: "addressable_exposure",
        evidence_class: "inferred",
        evidence_refs: [
          "source.golden_contract_usage_entitlement_monthly",
          "source.golden_contract_renewal_negotiation_history",
          "source.golden_contract_application_scope",
          "doc.extraction:contract.scope_summary",
        ],
        source_systems: [
          "SaaS / cloud admin",
          "CLM / contract repository",
          "APM / CMDB",
        ],
        source_record_ids: [
          `contract:${contractId}:usage-entitlement-renewal-scope`,
        ],
        document_refs: documentRefs,
        page_spans: pageSpans.filter(
          (span) => span.includes("scope") || span.includes("renewal"),
        ),
        calculation_rule:
          "Reviewed addressable exposure from usage, entitlement, scope-rationalization, and renewal-event evidence; not realized value.",
        confidence: 0.76,
        review_state: "needs_review",
        decision_state: "workflow_required",
        workflow_event_id: null,
        tower_claim_id: null,
      },
      {
        ledger_item_id: "negotiated:commercial-levers",
        contract_id: contractId,
        ledger_type: "negotiated_improvement",
        amount: positiveNumber(golden.negotiated_improvement_usd),
        amount_state: "quantified",
        evidence_class: "document_evidenced",
        evidence_refs: [
          "source.golden_contract_renewal_negotiation_history",
          "doc.extraction:contract.benchmarking_clause",
          "doc.extraction:contract.exit_rights_summary",
          "doc.extraction:contract.indexation_terms",
        ],
        source_systems: ["Sourcing platform", "CLM / contract repository"],
        source_record_ids: [`contract:${contractId}:negotiation-history`],
        document_refs: documentRefs,
        page_spans: pageSpans.filter(
          (span) =>
            span.includes("benchmark") ||
            span.includes("exit") ||
            span.includes("index"),
        ),
        calculation_rule:
          "Commercial-improvement amount from reviewed negotiation-history rows and document-evidenced levers.",
        confidence: 0.82,
        review_state: "procurement_reviewed",
        decision_state: "candidate",
        workflow_event_id: null,
        tower_claim_id: null,
      },
      {
        ledger_item_id: "realized:tower-finance-proof",
        contract_id: contractId,
        ledger_type: "realized_value",
        amount: realizedValue,
        amount_state:
          realizedValue != null ? "finance_validated" : "not_established",
        evidence_class: realizedValue != null ? "human_validated" : "missing",
        evidence_refs: [
          "source.golden_contract_finance_value_confirmation",
          "tower.value_claim",
        ],
        source_systems: ["Finance", "Tower"],
        source_record_ids: [
          `contract:${contractId}:finance-value-confirmation`,
        ],
        document_refs: [],
        page_spans: [],
        calculation_rule:
          "Finance-confirmed realized value only; addressable exposure and negotiated improvement are not treated as realized.",
        confidence: realizedValue != null ? 0.93 : null,
        review_state: realizedValue != null ? "finance_validated" : "missing",
        decision_state: realizedValue != null ? "finance_accepted" : "missing",
        workflow_event_id: null,
        tower_claim_id: `claim-source-contract-golden-${contractId.toLowerCase()}`,
      },
    ];
    return buildContractOptimizationEvidencePack({
      tenantKey,
      datasetVersion: String(golden.dataset_version || "source-v4-golden"),
      contractId,
      ledgerItems,
    });
  }

  const performance = performanceRows[0];
  const spend = spendRows[0];
  const rate = rateRows[0];
  const saas = saasRows[0];
  const sourcing = sourcingRows[0];
  const items: ContractOptimizationEvidenceItem[] = [];

  const unclaimedCredit = positiveNumber(performance?.unclaimed_credit);
  if (unclaimedCredit != null) {
    items.push({
      ledger_item_id: "recoverable:sla-credit-gap",
      contract_id: contractId,
      ledger_type: "recoverable_leakage",
      amount: unclaimedCredit,
      amount_state: "quantified",
      evidence_class: "system_evidenced",
      evidence_refs: ["consumption_v4_canary.sourcing_performance_v1"],
      source_systems: ["ServiceNow"],
      source_record_ids: [`contract:${contractId}:sla-performance`],
      document_refs: [],
      page_spans: [],
      calculation_rule: "SUM(credit_calculated - credit_claimed) by contract.",
      confidence: 0.82,
      review_state: "system_extracted",
      decision_state: "candidate",
      workflow_event_id: null,
      tower_claim_id: null,
    });
  }

  const invoiceVariance =
    (numberFromDb(spend?.off_contract_spend) ?? 0) +
    (numberFromDb(spend?.duplicate_spend) ?? 0) +
    (numberFromDb(rate?.rate_variance_amount) ?? 0);
  const unapprovedRateVarianceCount =
    numberFromDb(rate?.unapproved_variance_count) ?? 0;
  if (invoiceVariance > 0 || unapprovedRateVarianceCount > 0) {
    items.push({
      ledger_item_id: "recoverable:invoice-rate-card",
      contract_id: contractId,
      ledger_type: "recoverable_leakage",
      amount: invoiceVariance > 0 ? invoiceVariance : null,
      amount_state: invoiceVariance > 0 ? "quantified" : "not_quantified",
      evidence_class: invoiceVariance > 0 ? "system_evidenced" : "missing",
      evidence_refs: [
        "consumption_v4_canary.sourcing_spend_monthly_v1",
        "raw_source_v4.fieldglass_rate_card",
      ],
      source_systems: ["ERP / AP", "Fieldglass"],
      source_record_ids: [
        `contract:${contractId}:invoice-matching`,
        `contract:${contractId}:rate-card`,
      ],
      document_refs: [],
      page_spans: [],
      calculation_rule:
        "SUM(off-contract spend + duplicate spend + unapproved rate-card variance) by contract.",
      confidence: invoiceVariance > 0 ? 0.78 : 0.45,
      review_state: invoiceVariance > 0 ? "system_extracted" : "needs_review",
      decision_state: invoiceVariance > 0 ? "candidate" : "workflow_required",
      workflow_event_id: null,
      tower_claim_id: null,
    });
  }

  const claimableSaasCost = positiveNumber(saas?.claimable_cost);
  if (claimableSaasCost != null) {
    items.push({
      ledger_item_id: "avoided:renewal-uplift",
      contract_id: contractId,
      ledger_type: "avoided_cost",
      amount: claimableSaasCost,
      amount_state: "addressable_exposure",
      evidence_class: "inferred",
      evidence_refs: ["raw_source_v4.entra_saas_usage_monthly"],
      source_systems: ["SaaS admin"],
      source_record_ids: [`contract:${contractId}:saas-usage`],
      document_refs: [],
      page_spans: [],
      calculation_rule:
        "SUM(actual_cost) for usage rows already flagged claimable by the source-system export.",
      confidence: 0.68,
      review_state: "needs_review",
      decision_state: "workflow_required",
      workflow_event_id: null,
      tower_claim_id: null,
    });
  }

  const negotiatedDelta = Math.max(
    0,
    (numberFromDb(sourcing?.normalized_cost) ?? 0) -
      (numberFromDb(sourcing?.line_item_cost) ?? 0),
  );
  if (negotiatedDelta > 0) {
    items.push({
      ledger_item_id: "negotiated:commercial-levers",
      contract_id: contractId,
      ledger_type: "negotiated_improvement",
      amount: negotiatedDelta,
      amount_state: "quantified",
      evidence_class: "document_evidenced",
      evidence_refs: ["raw_source_v4.ariba_sourcing_events"],
      source_systems: ["Sourcing platform"],
      source_record_ids: [`contract:${contractId}:sourcing-events`],
      document_refs: [],
      page_spans: [],
      calculation_rule: "SUM(normalized_cost - line_item_cost) by contract.",
      confidence: 0.74,
      review_state: "document_extracted",
      decision_state: "candidate",
      workflow_event_id: null,
      tower_claim_id: null,
    });
  }

  return buildContractOptimizationEvidencePack({
    tenantKey,
    datasetVersion: "source-v4",
    contractId,
    ledgerItems: items,
  });
}

function positiveNumber(value: unknown): number | null {
  const n = numberFromDb(value);
  return n != null && n > 0 ? n : null;
}

function numberFromDb(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function arrayFromDb(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry ?? "").trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .replace(/^\{/u, "")
      .replace(/\}$/u, "")
      .split(",")
      .map((entry) => entry.trim().replace(/^"|"$/gu, ""))
      .filter(Boolean);
  }
  return [];
}
