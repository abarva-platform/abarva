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
import { canonicalTenantKey, tenantAliasesFor } from "@/lib/tenant/aliases";
import {
  buildContractOptimizationEvidencePack,
  type ContractOptimizationEvidenceItem,
} from "./contract-optimization-evidence";
import type {
  DocExtractionRow,
  SourceApplicationVendorExposureRow,
  SourceContract360Row,
  SourceContractApplicationScopeRow,
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

/**
 * Resolve tenant aliases through the shared tenant service. Source data-model
 * readers must not carry tenant-specific alias lists because the same contract
 * optimization capability has to run for every tenant over the same evidence
 * classes. Unknown tenants intentionally pass through as exact keys.
 */
function tenantKeyAliases(tenantKey: string): string[] {
  return tenantAliasesFor(tenantKey);
}

function tenantRlsKey(tenantKey: string): string {
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

export async function listContractVendor360(
  tenantKey: string,
): Promise<SourceContractVendor360Row[]> {
  return queryForTenant<SourceContractVendor360Row>(
    tenantKey,
    "SELECT * FROM source.contract_vendor_360 WHERE tenant_key = ANY($1::text[]) ORDER BY annual_value DESC NULLS LAST",
  );
}

export async function listContract360(
  tenantKey: string,
): Promise<SourceContract360Row[]> {
  return queryForTenant<SourceContract360Row>(
    tenantKey,
    "SELECT * FROM source.contract_360 WHERE tenant_key = ANY($1::text[]) ORDER BY annual_value DESC NULLS LAST",
  );
}

export async function getContract360(
  tenantKey: string,
  contractId: string,
): Promise<SourceContract360Row | null> {
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
  return queryForTenant<SourceVendorContractPortfolioRow>(
    tenantKey,
    "SELECT * FROM source.vendor_contract_portfolio WHERE tenant_key = ANY($1::text[]) ORDER BY annual_value DESC NULLS LAST",
  );
}

export async function listContractApplicationScope(
  tenantKey: string,
  contractId?: string,
): Promise<SourceContractApplicationScopeRow[]> {
  if (contractId) {
    return queryForTenant<SourceContractApplicationScopeRow>(
      tenantKey,
      "SELECT * FROM source.contract_application_scope WHERE tenant_key = ANY($1::text[]) AND contract_id = $2",
      [contractId],
    );
  }
  return queryForTenant<SourceContractApplicationScopeRow>(
    tenantKey,
    "SELECT * FROM source.contract_application_scope WHERE tenant_key = ANY($1::text[])",
  );
}

export async function listContractFinancialExposure(
  tenantKey: string,
): Promise<SourceContractFinancialExposureRow[]> {
  return queryForTenant<SourceContractFinancialExposureRow>(
    tenantKey,
    "SELECT * FROM source.contract_financial_exposure WHERE tenant_key = ANY($1::text[])",
  );
}

export async function listContractOperationalPerformance(
  tenantKey: string,
): Promise<SourceContractOperationalPerformanceRow[]> {
  return queryForTenant<SourceContractOperationalPerformanceRow>(
    tenantKey,
    "SELECT * FROM source.contract_operational_performance WHERE tenant_key = ANY($1::text[])",
  );
}

export async function listContractInitiativeDependency(
  tenantKey: string,
  contractId?: string,
): Promise<SourceContractInitiativeDependencyRow[]> {
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
  const [performanceRows, spendRows, rateRows, saasRows, sourcingRows] =
    await Promise.all([
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
    (numberFromDb(spend?.duplicate_spend) ?? 0);
  const unapprovedRateVarianceCount = numberFromDb(rate?.unapproved_variance_count) ?? 0;
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
      source_record_ids: [`contract:${contractId}:invoice-matching`, `contract:${contractId}:rate-card`],
      document_refs: [],
      page_spans: [],
      calculation_rule:
        "SUM(off-contract spend + duplicate spend) by contract; rate-card variance count is separately evidenced.",
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

  const negotiatedDelta =
    Math.max(
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
