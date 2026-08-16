import "server-only";

import { azureRead } from "@/lib/data-plane/azureRead";
import {
  appClientKeyForTenant,
  canonicalTenantKey,
  tenantAliasesFor,
} from "@/lib/tenant/aliases";
import { numberFromDb } from "./vendor-contract-portfolio";
import {
  SOURCE_V4_CUBE_AS_OF_DATE,
  SOURCE_V4_CUBE_DATASET_ID,
  type SourceV4UiLensId,
} from "./source-v4-cube-ui-catalog";

interface SourceV4DatasetMetadata {
  readonly datasetId: string;
  readonly datasetLabel: string;
}

type SnapshotState = "available" | "missing" | "error";

interface NumericRow {
  readonly [key: string]: unknown;
}

export interface SourceV4SliceAvailability {
  readonly lensId: SourceV4UiLensId | "context_coverage";
  readonly state: SnapshotState;
  readonly rowCount: number;
}

export interface SourceV4WorkspaceSnapshot {
  readonly datasetId: string;
  readonly datasetVersion: "v4";
  readonly datasetLabel: string;
  readonly analyticsProvider: "CubeSourceProvider";
  readonly activeLoadRunId: string | null;
  readonly asOfDateIso: string;
  readonly availability: readonly SourceV4SliceAvailability[];
  readonly contextCoverage: {
    readonly vendors: number;
    readonly contracts: number;
    readonly annualValue: number;
    readonly scopeRows: number;
    readonly invoiceLines: number;
    readonly saasUsageRows: number;
    readonly cloudRows: number;
    readonly performanceRows: number;
  };
  readonly scopeConfidence: {
    readonly rowCount: number;
    readonly explicitScopeCount: number;
    readonly inferredScopeCount: number;
  };
  readonly executivePortfolio: {
    readonly contractCount: number;
    readonly annualValue: number;
    readonly totalCommittedValue: number;
    readonly autoRenewCount: number;
    readonly notice90DayCount: number;
  };
  readonly spendConsumption: {
    readonly rowCount: number;
    readonly invoiceLines: number;
    readonly actualSpend: number;
    readonly committedAmount: number;
    readonly offContractSpend: number;
  };
  readonly performanceCredits: {
    readonly rowCount: number;
    readonly breachCount: number;
    readonly creditCalculated: number;
    readonly creditClaimed: number;
    readonly creditRecovered: number;
    readonly unclaimedCredit: number;
  };
  readonly aiUsageValueProof: {
    readonly rowCount: number;
    readonly assignedSeats: number;
    readonly activeUsers: number;
    readonly actualCost: number;
    readonly claimableRows: number;
    readonly topProducts: readonly SourceV4NamedAmount[];
  };
  readonly cloudOptimization: {
    readonly rowCount: number;
    readonly actualCost: number;
    readonly amortizedCost: number;
    readonly overageAmount: number;
    readonly topServices: readonly SourceV4NamedAmount[];
  };
  readonly workforceRateCards: {
    readonly rowCount: number;
    readonly hours: number;
    readonly averageBillRate: number | null;
    readonly unapprovedVarianceCount: number;
  };
  readonly sourcingEvents: {
    readonly rowCount: number;
    readonly normalizedCost: number;
    readonly lineItemCost: number;
    readonly averageWeightedScore: number | null;
  };
  readonly topVendors: readonly SourceV4VendorSnapshot[];
}

export interface SourceV4NamedAmount {
  readonly name: string;
  readonly count: number;
  readonly amount: number;
}

export interface SourceV4VendorSnapshot {
  readonly vendorId: string;
  readonly legalName: string;
  readonly supplierCategory: string | null;
  readonly strategicStatus: string | null;
  readonly riskTier: string | null;
  readonly annualValue: number;
  readonly contractCount: number;
}

const EMPTY_CONTEXT_COVERAGE: SourceV4WorkspaceSnapshot["contextCoverage"] = {
  vendors: 0,
  contracts: 0,
  annualValue: 0,
  scopeRows: 0,
  invoiceLines: 0,
  saasUsageRows: 0,
  cloudRows: 0,
  performanceRows: 0,
};

export function createEmptySourceV4WorkspaceSnapshot(
  asOfDateIso = `${SOURCE_V4_CUBE_AS_OF_DATE}T00:00:00Z`,
  metadata: SourceV4DatasetMetadata = datasetMetadataForTenant(null),
): SourceV4WorkspaceSnapshot {
  return {
    datasetId: metadata.datasetId,
    datasetVersion: "v4",
    datasetLabel: metadata.datasetLabel,
    analyticsProvider: "CubeSourceProvider",
    activeLoadRunId: null,
    asOfDateIso,
    availability: [
      availability("executive_portfolio", "missing", 0),
      availability("vendor_concentration", "missing", 0),
      availability("renewal_exposure", "missing", 0),
      availability("scope_confidence", "missing", 0),
      availability("spend_consumption", "missing", 0),
      availability("performance_credits", "missing", 0),
      availability("ai_usage_value_proof", "missing", 0),
      availability("cloud_optimization", "missing", 0),
      availability("workforce_rate_card", "missing", 0),
      availability("sourcing_event_bafo", "missing", 0),
      availability("context_coverage", "missing", 0),
    ],
    contextCoverage: EMPTY_CONTEXT_COVERAGE,
    scopeConfidence: {
      rowCount: 0,
      explicitScopeCount: 0,
      inferredScopeCount: 0,
    },
    executivePortfolio: {
      contractCount: 0,
      annualValue: 0,
      totalCommittedValue: 0,
      autoRenewCount: 0,
      notice90DayCount: 0,
    },
    spendConsumption: {
      rowCount: 0,
      invoiceLines: 0,
      actualSpend: 0,
      committedAmount: 0,
      offContractSpend: 0,
    },
    performanceCredits: {
      rowCount: 0,
      breachCount: 0,
      creditCalculated: 0,
      creditClaimed: 0,
      creditRecovered: 0,
      unclaimedCredit: 0,
    },
    aiUsageValueProof: {
      rowCount: 0,
      assignedSeats: 0,
      activeUsers: 0,
      actualCost: 0,
      claimableRows: 0,
      topProducts: [],
    },
    cloudOptimization: {
      rowCount: 0,
      actualCost: 0,
      amortizedCost: 0,
      overageAmount: 0,
      topServices: [],
    },
    workforceRateCards: {
      rowCount: 0,
      hours: 0,
      averageBillRate: null,
      unapprovedVarianceCount: 0,
    },
    sourcingEvents: {
      rowCount: 0,
      normalizedCost: 0,
      lineItemCost: 0,
      averageWeightedScore: null,
    },
    topVendors: [],
  };
}

export async function loadSourceV4WorkspaceSnapshot(
  tenantKey: string,
  asOfDateIso = `${SOURCE_V4_CUBE_AS_OF_DATE}T00:00:00Z`,
): Promise<SourceV4WorkspaceSnapshot> {
  const datasetMetadata = datasetMetadataForTenant(tenantKey);
  if (!tenantKey.trim())
    return createEmptySourceV4WorkspaceSnapshot(asOfDateIso, datasetMetadata);
  const governedSnapshot = await loadGovernedSourceWorkspaceSnapshot(
    tenantKey,
    asOfDateIso,
    datasetMetadata,
  );
  if (governedSnapshot) return governedSnapshot;
  if (isMeridianTenantKey(tenantKey)) {
    return loadMeridianCanarySourceV4WorkspaceSnapshot(tenantKey, asOfDateIso);
  }

  const asOfDate = asOfDateIso.slice(0, 10);
  const [
    context,
    executive,
    topVendors,
    spend,
    performance,
    aiUsage,
    topAiProducts,
    cloud,
    topCloudServices,
    rateCards,
    sourcingEvents,
    scope,
    metadata,
  ] = await Promise.all([
    safeQuery<NumericRow>(
      tenantKey,
      `SELECT
          COALESCE(SUM(vendors), 0) AS vendors,
          COALESCE(SUM(contracts), 0) AS contracts,
          COALESCE(SUM(annual_value), 0) AS annual_value,
          COALESCE(SUM(scope_rows), 0) AS scope_rows,
          COALESCE(SUM(invoice_lines), 0) AS invoice_lines,
          COALESCE(SUM(saas_usage_rows), 0) AS saas_usage_rows,
          COALESCE(SUM(cloud_rows), 0) AS cloud_rows,
          COALESCE(SUM(performance_rows), 0) AS performance_rows
         FROM consumption_v4_canary.sourcing_context_coverage_v1
        WHERE tenant_key = ANY($1::text[])`,
    ),
    safeQuery<NumericRow>(
      tenantKey,
      `SELECT
          COUNT(*) AS contract_count,
          COALESCE(SUM(annual_value), 0) AS annual_value,
          COALESCE(SUM(total_committed_value), 0) AS total_committed_value,
          COALESCE(SUM(CASE WHEN auto_renew THEN 1 ELSE 0 END), 0) AS auto_renew_count,
          COALESCE(SUM(CASE WHEN notice_deadline <= $2::date + INTERVAL '90 days' THEN 1 ELSE 0 END), 0) AS notice_90_day_count
         FROM consumption_v4_canary.sourcing_contract_v1
        WHERE tenant_key = ANY($1::text[])`,
      [asOfDate],
    ),
    safeQuery<NumericRow>(
      tenantKey,
      `SELECT
          vendor_id,
          legal_name,
          supplier_category,
          strategic_status,
          risk_tier,
          annual_value,
          contract_count
         FROM consumption_v4_canary.sourcing_vendor_v1
        WHERE tenant_key = ANY($1::text[])
        ORDER BY annual_value DESC NULLS LAST
        LIMIT 8`,
    ),
    safeQuery<NumericRow>(
      tenantKey,
      `SELECT
          COUNT(*) AS row_count,
          COALESCE(SUM(invoice_lines), 0) AS invoice_lines,
          COALESCE(SUM(actual_spend), 0) AS actual_spend,
          COALESCE(SUM(committed_amount), 0) AS committed_amount,
          COALESCE(SUM(CASE WHEN matching_state = 'off_contract' THEN actual_spend ELSE 0 END), 0) AS off_contract_spend
         FROM consumption_v4_canary.sourcing_spend_monthly_v1
        WHERE tenant_key = ANY($1::text[])`,
    ),
    safeQuery<NumericRow>(
      tenantKey,
      `SELECT
          COUNT(*) AS row_count,
          COALESCE(SUM(breach_count), 0) AS breach_count,
          COALESCE(SUM(credit_calculated), 0) AS credit_calculated,
          COALESCE(SUM(credit_claimed), 0) AS credit_claimed,
          COALESCE(SUM(credit_recovered), 0) AS credit_recovered,
          COALESCE(SUM(COALESCE(credit_calculated, 0) - COALESCE(credit_claimed, 0)), 0) AS unclaimed_credit
         FROM consumption_v4_canary.sourcing_performance_v1
        WHERE tenant_key = ANY($1::text[])`,
    ),
    safeQuery<NumericRow>(
      tenantKey,
      `SELECT
          COUNT(*) AS row_count,
          COALESCE(SUM(assigned_seats::numeric), 0) AS assigned_seats,
          COALESCE(SUM(active_users::numeric), 0) AS active_users,
          COALESCE(SUM(actual_cost::numeric), 0) AS actual_cost,
          COALESCE(SUM(CASE WHEN claimable_value_state = 'claimable' THEN 1 ELSE 0 END), 0) AS claimable_rows
         FROM raw_source_v4.entra_saas_usage_monthly
        WHERE _tenant_key = ANY($1::text[])`,
    ),
    safeQuery<NumericRow>(
      tenantKey,
      `SELECT
          product_name AS name,
          COUNT(*) AS count,
          COALESCE(SUM(actual_cost::numeric), 0) AS amount
         FROM raw_source_v4.entra_saas_usage_monthly
        WHERE _tenant_key = ANY($1::text[])
        GROUP BY product_name
        ORDER BY amount DESC NULLS LAST
        LIMIT 8`,
    ),
    safeQuery<NumericRow>(
      tenantKey,
      `SELECT
          COUNT(*) AS row_count,
          COALESCE(SUM(actual_cost::numeric), 0) AS actual_cost,
          COALESCE(SUM(amortized_cost::numeric), 0) AS amortized_cost,
          COALESCE(SUM(overage_amount::numeric), 0) AS overage_amount
         FROM raw_source_v4.azure_cost_monthly
        WHERE _tenant_key = ANY($1::text[])`,
    ),
    safeQuery<NumericRow>(
      tenantKey,
      `SELECT
          service_name AS name,
          COUNT(*) AS count,
          COALESCE(SUM(actual_cost::numeric), 0) AS amount
         FROM raw_source_v4.azure_cost_monthly
        WHERE _tenant_key = ANY($1::text[])
        GROUP BY service_name
        ORDER BY amount DESC NULLS LAST
        LIMIT 8`,
    ),
    safeQuery<NumericRow>(
      tenantKey,
      `SELECT
          COUNT(*) AS row_count,
          COALESCE(SUM(hours::numeric), 0) AS hours,
          AVG(bill_rate::numeric) AS average_bill_rate,
          COALESCE(SUM(CASE WHEN approval_state = 'variance_unapproved' THEN 1 ELSE 0 END), 0) AS unapproved_variance_count
         FROM raw_source_v4.fieldglass_rate_card
        WHERE _tenant_key = ANY($1::text[])`,
    ),
    safeQuery<NumericRow>(
      tenantKey,
      `SELECT
          COUNT(*) AS row_count,
          COALESCE(SUM(normalized_cost::numeric), 0) AS normalized_cost,
          COALESCE(SUM(line_item_cost::numeric), 0) AS line_item_cost,
          AVG(score::numeric) AS average_weighted_score
         FROM raw_source_v4.ariba_sourcing_events
        WHERE _tenant_key = ANY($1::text[])`,
    ),
    safeQuery<NumericRow>(
      tenantKey,
      `SELECT
          COUNT(*) AS row_count,
          COALESCE(SUM(CASE WHEN relationship_method = 'explicit_contract_scope' THEN 1 ELSE 0 END), 0) AS explicit_scope_count,
          COALESCE(SUM(CASE WHEN relationship_method <> 'explicit_contract_scope' THEN 1 ELSE 0 END), 0) AS inferred_scope_count
         FROM consumption_v4_canary.sourcing_contract_scope_v1
        WHERE tenant_key = ANY($1::text[])`,
    ),
    safeQuery<NumericRow>(
      tenantKey,
      `SELECT
          MAX(load_run_id) AS active_load_run_id
         FROM consumption_v4_canary.sourcing_contract_v1
        WHERE tenant_key = ANY($1::text[])`,
    ),
  ]);

  const contextRow = firstRow(context);
  const executiveRow = firstRow(executive);
  const spendRow = firstRow(spend);
  const performanceRow = firstRow(performance);
  const aiUsageRow = firstRow(aiUsage);
  const cloudRow = firstRow(cloud);
  const rateCardRow = firstRow(rateCards);
  const sourcingEventRow = firstRow(sourcingEvents);
  const scopeRow = firstRow(scope);
  const metadataRow = firstRow(metadata);

  return {
    datasetId: datasetMetadata.datasetId,
    datasetVersion: "v4",
    datasetLabel: datasetMetadata.datasetLabel,
    analyticsProvider: "CubeSourceProvider",
    activeLoadRunId: nullableString(metadataRow?.active_load_run_id),
    asOfDateIso,
    availability: [
      availability(
        "executive_portfolio",
        stateFromAggregate(executive),
        num(executiveRow, "contract_count"),
      ),
      availability(
        "vendor_concentration",
        stateFromRows(topVendors),
        topVendors.rows.length,
      ),
      availability(
        "renewal_exposure",
        stateFromAggregate(executive),
        num(executiveRow, "notice_90_day_count"),
      ),
      availability(
        "scope_confidence",
        stateFromAggregate(scope),
        num(scopeRow, "row_count"),
      ),
      availability(
        "spend_consumption",
        stateFromAggregate(spend),
        num(spendRow, "row_count"),
      ),
      availability(
        "performance_credits",
        stateFromAggregate(performance),
        num(performanceRow, "row_count"),
      ),
      availability(
        "ai_usage_value_proof",
        stateFromAggregate(aiUsage),
        num(aiUsageRow, "row_count"),
      ),
      availability(
        "cloud_optimization",
        stateFromAggregate(cloud),
        num(cloudRow, "row_count"),
      ),
      availability(
        "workforce_rate_card",
        stateFromAggregate(rateCards),
        num(rateCardRow, "row_count"),
      ),
      availability(
        "sourcing_event_bafo",
        stateFromAggregate(sourcingEvents),
        num(sourcingEventRow, "row_count"),
      ),
      availability(
        "context_coverage",
        stateFromAggregate(context),
        num(contextRow, "contracts"),
      ),
    ],
    contextCoverage: {
      vendors: num(contextRow, "vendors"),
      contracts: num(contextRow, "contracts"),
      annualValue: num(contextRow, "annual_value"),
      scopeRows: num(contextRow, "scope_rows"),
      invoiceLines: num(contextRow, "invoice_lines"),
      saasUsageRows: num(contextRow, "saas_usage_rows"),
      cloudRows: num(contextRow, "cloud_rows"),
      performanceRows: num(contextRow, "performance_rows"),
    },
    scopeConfidence: {
      rowCount: num(scopeRow, "row_count"),
      explicitScopeCount: num(scopeRow, "explicit_scope_count"),
      inferredScopeCount: num(scopeRow, "inferred_scope_count"),
    },
    executivePortfolio: {
      contractCount: num(executiveRow, "contract_count"),
      annualValue: num(executiveRow, "annual_value"),
      totalCommittedValue: num(executiveRow, "total_committed_value"),
      autoRenewCount: num(executiveRow, "auto_renew_count"),
      notice90DayCount: num(executiveRow, "notice_90_day_count"),
    },
    spendConsumption: {
      rowCount: num(spendRow, "row_count"),
      invoiceLines: num(spendRow, "invoice_lines"),
      actualSpend: num(spendRow, "actual_spend"),
      committedAmount: num(spendRow, "committed_amount"),
      offContractSpend: num(spendRow, "off_contract_spend"),
    },
    performanceCredits: {
      rowCount: num(performanceRow, "row_count"),
      breachCount: num(performanceRow, "breach_count"),
      creditCalculated: num(performanceRow, "credit_calculated"),
      creditClaimed: num(performanceRow, "credit_claimed"),
      creditRecovered: num(performanceRow, "credit_recovered"),
      unclaimedCredit: num(performanceRow, "unclaimed_credit"),
    },
    aiUsageValueProof: {
      rowCount: num(aiUsageRow, "row_count"),
      assignedSeats: num(aiUsageRow, "assigned_seats"),
      activeUsers: num(aiUsageRow, "active_users"),
      actualCost: num(aiUsageRow, "actual_cost"),
      claimableRows: num(aiUsageRow, "claimable_rows"),
      topProducts: topAiProducts.rows.map(namedAmount),
    },
    cloudOptimization: {
      rowCount: num(cloudRow, "row_count"),
      actualCost: num(cloudRow, "actual_cost"),
      amortizedCost: num(cloudRow, "amortized_cost"),
      overageAmount: num(cloudRow, "overage_amount"),
      topServices: topCloudServices.rows.map(namedAmount),
    },
    workforceRateCards: {
      rowCount: num(rateCardRow, "row_count"),
      hours: num(rateCardRow, "hours"),
      averageBillRate: nullableNum(rateCardRow, "average_bill_rate"),
      unapprovedVarianceCount: num(rateCardRow, "unapproved_variance_count"),
    },
    sourcingEvents: {
      rowCount: num(sourcingEventRow, "row_count"),
      normalizedCost: num(sourcingEventRow, "normalized_cost"),
      lineItemCost: num(sourcingEventRow, "line_item_cost"),
      averageWeightedScore: nullableNum(
        sourcingEventRow,
        "average_weighted_score",
      ),
    },
    topVendors: topVendors.rows.map(vendorSnapshot),
  };
}

async function loadGovernedSourceWorkspaceSnapshot(
  tenantKey: string,
  asOfDateIso: string,
  datasetMetadata: SourceV4DatasetMetadata,
): Promise<SourceV4WorkspaceSnapshot | null> {
  const asOfDate = asOfDateIso.slice(0, 10);
  const [
    coverage,
    executive,
    vendorSummary,
    topVendors,
    spend,
    performance,
    opportunity,
    scope,
    metadata,
  ] = await Promise.all([
    safeQuery<NumericRow>(
      tenantKey,
      `SELECT
          context_area,
          COALESCE(SUM(row_count), 0) AS row_count,
          COALESCE(SUM(populated_count), 0) AS populated_count
         FROM consumption.sourcing_context_coverage_v1
        WHERE tenant_key = ANY($1::text[])
        GROUP BY context_area`,
    ),
    safeQuery<NumericRow>(
      tenantKey,
      `SELECT
          COUNT(*) AS contract_count,
          COALESCE(SUM(annual_value), 0) AS annual_value,
          COALESCE(SUM(total_committed_value), 0) AS total_committed_value,
          COALESCE(SUM(CASE WHEN auto_renew THEN 1 ELSE 0 END), 0) AS auto_renew_count,
          COALESCE(SUM(CASE WHEN notice_deadline <= $2::date + INTERVAL '90 days' THEN 1 ELSE 0 END), 0) AS notice_90_day_count
         FROM consumption.sourcing_contract_v1
        WHERE tenant_key = ANY($1::text[])`,
      [asOfDate],
    ),
    safeQuery<NumericRow>(
      tenantKey,
      `SELECT COUNT(*) AS vendor_count
         FROM consumption.sourcing_vendor_v1
        WHERE tenant_key = ANY($1::text[])`,
    ),
    safeQuery<NumericRow>(
      tenantKey,
      `SELECT
          vendor_id,
          legal_name,
          supplier_category,
          strategic_status,
          risk_tier,
          annual_value,
          contract_count
         FROM consumption.sourcing_vendor_v1
        WHERE tenant_key = ANY($1::text[])
        ORDER BY annual_value DESC NULLS LAST
        LIMIT 8`,
    ),
    safeQuery<NumericRow>(
      tenantKey,
      `SELECT
          COUNT(*) AS row_count,
          COALESCE(SUM(invoice_lines), 0) AS invoice_lines,
          COALESCE(SUM(actual_spend), 0) AS actual_spend,
          COALESCE(SUM(committed_amount), 0) AS committed_amount,
          COALESCE(SUM(CASE WHEN matching_state = 'off_contract' THEN actual_spend ELSE 0 END), 0) AS off_contract_spend
         FROM consumption.sourcing_spend_monthly_v1
        WHERE tenant_key = ANY($1::text[])`,
    ),
    safeQuery<NumericRow>(
      tenantKey,
      `SELECT
          COUNT(*) AS row_count,
          COALESCE(SUM(breach_count), 0) AS breach_count,
          COALESCE(SUM(credit_calculated), 0) AS credit_calculated,
          COALESCE(SUM(credit_claimed), 0) AS credit_claimed,
          COALESCE(SUM(credit_recovered), 0) AS credit_recovered,
          COALESCE(SUM(COALESCE(credit_calculated, 0) - COALESCE(credit_claimed, 0)), 0) AS unclaimed_credit
         FROM consumption.sourcing_performance_v1
        WHERE tenant_key = ANY($1::text[])`,
    ),
    safeQuery<NumericRow>(
      tenantKey,
      `SELECT
          COUNT(*) AS row_count,
          COALESCE(SUM(addressable_spend), 0) AS normalized_cost,
          COALESCE(SUM(annual_value_exposed), 0) AS line_item_cost,
          AVG(confidence) AS average_weighted_score
         FROM consumption.sourcing_opportunity_v1
        WHERE tenant_key = ANY($1::text[])`,
    ),
    safeQuery<NumericRow>(
      tenantKey,
      `SELECT
          COUNT(*) AS row_count,
          COALESCE(SUM(CASE WHEN relationship_method = 'explicit_contract_scope' THEN 1 ELSE 0 END), 0) AS explicit_scope_count,
          COALESCE(SUM(CASE WHEN relationship_method <> 'explicit_contract_scope' THEN 1 ELSE 0 END), 0) AS inferred_scope_count
         FROM consumption.sourcing_contract_scope_v1
        WHERE tenant_key = ANY($1::text[])`,
    ),
    safeQuery<NumericRow>(
      tenantKey,
      `SELECT MAX(load_run_id) AS active_load_run_id
         FROM source.contract
        WHERE tenant_key = ANY($1::text[])`,
    ),
  ]);

  const executiveRow = firstRow(executive);
  const contractCount = num(executiveRow, "contract_count");
  if (executive.state === "error" || contractCount <= 0) return null;

  const coverageByArea = new Map(
    coverage.rows.map((row) => [String(row.context_area ?? ""), row]),
  );
  const coverageCount = (area: string): number =>
    num(coverageByArea.get(area), "row_count");
  const spendRow = firstRow(spend);
  const vendorSummaryRow = firstRow(vendorSummary);
  const performanceRow = firstRow(performance);
  const opportunityRow = firstRow(opportunity);
  const scopeRow = firstRow(scope);
  const metadataRow = firstRow(metadata);

  return {
    datasetId: datasetMetadata.datasetId,
    datasetVersion: "v4",
    datasetLabel: datasetMetadata.datasetLabel,
    analyticsProvider: "CubeSourceProvider",
    activeLoadRunId: nullableString(metadataRow?.active_load_run_id),
    asOfDateIso,
    availability: [
      availability("executive_portfolio", "available", contractCount),
      availability(
        "vendor_concentration",
        stateFromRows(topVendors),
        num(vendorSummaryRow, "vendor_count"),
      ),
      availability(
        "renewal_exposure",
        "available",
        num(executiveRow, "notice_90_day_count"),
      ),
      availability(
        "scope_confidence",
        stateFromAggregate(scope),
        num(scopeRow, "row_count"),
      ),
      availability(
        "spend_consumption",
        stateFromAggregate(spend),
        num(spendRow, "row_count"),
      ),
      availability(
        "performance_credits",
        stateFromAggregate(performance),
        num(performanceRow, "row_count"),
      ),
      availability("ai_usage_value_proof", "missing", 0),
      availability("cloud_optimization", "missing", 0),
      availability("workforce_rate_card", "missing", 0),
      availability(
        "sourcing_event_bafo",
        stateFromAggregate(opportunity),
        num(opportunityRow, "row_count"),
      ),
      availability(
        "context_coverage",
        stateFromRows(coverage),
        coverage.rows.length,
      ),
    ],
    contextCoverage: {
      vendors: num(vendorSummaryRow, "vendor_count"),
      contracts: contractCount,
      annualValue: num(executiveRow, "annual_value"),
      scopeRows: coverageCount("contract_scope"),
      invoiceLines: num(spendRow, "invoice_lines"),
      saasUsageRows: 0,
      cloudRows: 0,
      performanceRows: coverageCount("performance_sla"),
    },
    scopeConfidence: {
      rowCount: num(scopeRow, "row_count"),
      explicitScopeCount: num(scopeRow, "explicit_scope_count"),
      inferredScopeCount: num(scopeRow, "inferred_scope_count"),
    },
    executivePortfolio: {
      contractCount,
      annualValue: num(executiveRow, "annual_value"),
      totalCommittedValue: num(executiveRow, "total_committed_value"),
      autoRenewCount: num(executiveRow, "auto_renew_count"),
      notice90DayCount: num(executiveRow, "notice_90_day_count"),
    },
    spendConsumption: {
      rowCount: num(spendRow, "row_count"),
      invoiceLines: num(spendRow, "invoice_lines"),
      actualSpend: num(spendRow, "actual_spend"),
      committedAmount: num(spendRow, "committed_amount"),
      offContractSpend: num(spendRow, "off_contract_spend"),
    },
    performanceCredits: {
      rowCount: num(performanceRow, "row_count"),
      breachCount: num(performanceRow, "breach_count"),
      creditCalculated: num(performanceRow, "credit_calculated"),
      creditClaimed: num(performanceRow, "credit_claimed"),
      creditRecovered: num(performanceRow, "credit_recovered"),
      unclaimedCredit: num(performanceRow, "unclaimed_credit"),
    },
    aiUsageValueProof: {
      rowCount: 0,
      assignedSeats: 0,
      activeUsers: 0,
      actualCost: 0,
      claimableRows: 0,
      topProducts: [],
    },
    cloudOptimization: {
      rowCount: 0,
      actualCost: 0,
      amortizedCost: 0,
      overageAmount: 0,
      topServices: [],
    },
    workforceRateCards: {
      rowCount: 0,
      hours: 0,
      averageBillRate: null,
      unapprovedVarianceCount: 0,
    },
    sourcingEvents: {
      rowCount: num(opportunityRow, "row_count"),
      normalizedCost: num(opportunityRow, "normalized_cost"),
      lineItemCost: num(opportunityRow, "line_item_cost"),
      averageWeightedScore: nullableNum(
        opportunityRow,
        "average_weighted_score",
      ),
    },
    topVendors: topVendors.rows.map(vendorSnapshot),
  };
}

async function loadMeridianCanarySourceV4WorkspaceSnapshot(
  tenantKey: string,
  asOfDateIso: string,
): Promise<SourceV4WorkspaceSnapshot> {
  const datasetMetadata = datasetMetadataForTenant(tenantKey);
  const [
    context,
    executive,
    topVendors,
    spend,
    performance,
    credits,
    rateCards,
    sourcingEvents,
    scope,
    automation,
  ] = await Promise.all([
    safeQuery<NumericRow>(
      tenantKey,
      `SELECT
          (SELECT COUNT(*) FROM foundation_v2_meridian_health_cube_canary.meridian_health_vendor_portfolio_v1 WHERE tenant_key = ANY($1::text[])) AS vendors,
          (SELECT COUNT(*) FROM foundation_v2_meridian_health_cube_canary.meridian_health_contract_family_v1 WHERE tenant_key = ANY($1::text[])) AS contracts,
          (SELECT COALESCE(SUM(invoice_line_amount), 0) FROM foundation_v2_meridian_health_cube_canary.meridian_health_vendor_portfolio_v1 WHERE tenant_key = ANY($1::text[])) AS annual_value,
          (SELECT COUNT(*) FROM foundation_v2_meridian_health_cube_canary.meridian_health_contract_scope_v1 WHERE tenant_key = ANY($1::text[])) AS scope_rows,
          (SELECT COALESCE(SUM(invoice_line_count), 0) FROM foundation_v2_meridian_health_cube_canary.meridian_health_spend_invoice_history_v1 WHERE tenant_key = ANY($1::text[])) AS invoice_lines,
          0 AS saas_usage_rows,
          0 AS cloud_rows,
          (SELECT COUNT(*) FROM foundation_v2_meridian_health_cube_canary.meridian_health_sla_itsm_performance_v1 WHERE tenant_key = ANY($1::text[])) AS performance_rows`,
    ),
    safeQuery<NumericRow>(
      tenantKey,
      `SELECT
          COUNT(*) AS contract_count,
          COALESCE(SUM(v.invoice_line_amount), 0) AS annual_value,
          COALESCE(SUM(cf.synthetic_midpoint_total_contract_value), 0) AS total_committed_value,
          0 AS auto_renew_count,
          0 AS notice_90_day_count
         FROM foundation_v2_meridian_health_cube_canary.meridian_health_contract_family_v1 cf
         LEFT JOIN foundation_v2_meridian_health_cube_canary.meridian_health_vendor_portfolio_v1 v
           ON v.tenant_key = cf.tenant_key
          AND v.vendor_id = cf.vendor_id
        WHERE cf.tenant_key = ANY($1::text[])`,
    ),
    safeQuery<NumericRow>(
      tenantKey,
      `SELECT
          vendor_id,
          legal_name,
          supplier_category,
          status AS strategic_status,
          risk_tier,
          invoice_line_amount AS annual_value,
          contract_family_count AS contract_count
         FROM foundation_v2_meridian_health_cube_canary.meridian_health_vendor_portfolio_v1
        WHERE tenant_key = ANY($1::text[])
        ORDER BY invoice_line_amount DESC NULLS LAST
        LIMIT 8`,
    ),
    safeQuery<NumericRow>(
      tenantKey,
      `SELECT
          COUNT(*) AS row_count,
          COALESCE(SUM(invoice_line_count), 0) AS invoice_lines,
          COALESCE(SUM(line_amount), 0) AS actual_spend,
          COALESCE(SUM(line_amount), 0) AS committed_amount,
          0 AS off_contract_spend
         FROM foundation_v2_meridian_health_cube_canary.meridian_health_spend_invoice_history_v1
        WHERE tenant_key = ANY($1::text[])`,
    ),
    safeQuery<NumericRow>(
      tenantKey,
      `SELECT
          COUNT(*) AS row_count,
          COALESCE(SUM(sla_breach_count), 0) AS breach_count,
          COALESCE(SUM(service_credit_eligible_amount), 0) AS credit_calculated,
          COALESCE(SUM(service_credit_claimed_amount), 0) AS credit_claimed,
          0 AS credit_recovered,
          COALESCE(SUM(COALESCE(service_credit_eligible_amount, 0) - COALESCE(service_credit_claimed_amount, 0)), 0) AS unclaimed_credit
         FROM foundation_v2_meridian_health_cube_canary.meridian_health_sla_itsm_performance_v1
        WHERE tenant_key = ANY($1::text[])`,
    ),
    safeQuery<NumericRow>(
      tenantKey,
      `SELECT
          COUNT(*) AS row_count,
          COALESCE(SUM(eligible_amount), 0) AS credit_calculated,
          COALESCE(SUM(claimed_amount), 0) AS credit_claimed
         FROM foundation_v2_meridian_health_cube_canary.meridian_health_service_credit_v1
        WHERE tenant_key = ANY($1::text[])`,
    ),
    safeQuery<NumericRow>(
      tenantKey,
      `SELECT
          COUNT(*) AS row_count,
          COALESCE(SUM(workforce_month_count), 0) AS hours,
          NULL::numeric AS average_bill_rate,
          0 AS unapproved_variance_count
         FROM foundation_v2_meridian_health_cube_canary.meridian_health_workforce_rate_card_economics_v1
        WHERE tenant_key = ANY($1::text[])`,
    ),
    safeQuery<NumericRow>(
      tenantKey,
      `SELECT
          COUNT(*) AS row_count,
          COALESCE(SUM(normalized_five_year_tco), 0) AS normalized_cost,
          COALESCE(SUM(headline_price), 0) AS line_item_cost,
          NULL::numeric AS average_weighted_score
         FROM foundation_v2_meridian_health_cube_canary.meridian_health_normalized_tco_recommendation_input_v1
        WHERE tenant_key = ANY($1::text[])`,
    ),
    safeQuery<NumericRow>(
      tenantKey,
      `SELECT
          COUNT(*) AS row_count,
          COALESCE(SUM(CASE WHEN relationship_confidence >= 0.95 THEN 1 ELSE 0 END), 0) AS explicit_scope_count,
          COALESCE(SUM(CASE WHEN relationship_confidence < 0.95 OR relationship_confidence IS NULL THEN 1 ELSE 0 END), 0) AS inferred_scope_count
         FROM foundation_v2_meridian_health_cube_canary.meridian_health_contract_scope_v1
        WHERE tenant_key = ANY($1::text[])`,
    ),
    safeQuery<NumericRow>(
      tenantKey,
      `SELECT
          COUNT(*) AS row_count,
          COALESCE(SUM(current_manual_volume), 0) AS assigned_seats,
          COALESCE(SUM(current_manual_volume * target_automation_percentage / 100.0), 0) AS active_users,
          0 AS actual_cost,
          COALESCE(SUM(CASE WHEN lower(coalesce(commitment_state, '')) LIKE '%contract%' THEN 1 ELSE 0 END), 0) AS claimable_rows
         FROM foundation_v2_meridian_health_cube_canary.meridian_health_ai_automation_commitment_v1
        WHERE tenant_key = ANY($1::text[])`,
    ),
  ]);

  const contextRow = firstRow(context);
  const executiveRow = firstRow(executive);
  const spendRow = firstRow(spend);
  const performanceRow = firstRow(performance);
  const creditRow = firstRow(credits);
  const rateCardRow = firstRow(rateCards);
  const sourcingEventRow = firstRow(sourcingEvents);
  const scopeRow = firstRow(scope);
  const automationRow = firstRow(automation);

  const performanceCreditCalculated =
    num(performanceRow, "credit_calculated") ||
    num(creditRow, "credit_calculated");
  const performanceCreditClaimed =
    num(performanceRow, "credit_claimed") || num(creditRow, "credit_claimed");
  const unclaimedCredit = Math.max(
    0,
    performanceCreditCalculated - performanceCreditClaimed,
  );

  return {
    datasetId: datasetMetadata.datasetId,
    datasetVersion: "v4",
    datasetLabel: datasetMetadata.datasetLabel,
    analyticsProvider: "CubeSourceProvider",
    activeLoadRunId: "meridian-health-layer5-cube-canary-v1",
    asOfDateIso,
    availability: [
      availability(
        "executive_portfolio",
        stateFromAggregate(executive),
        num(executiveRow, "contract_count"),
      ),
      availability(
        "vendor_concentration",
        stateFromRows(topVendors),
        topVendors.rows.length,
      ),
      availability(
        "renewal_exposure",
        stateFromAggregate(executive),
        num(executiveRow, "notice_90_day_count"),
      ),
      availability(
        "scope_confidence",
        stateFromAggregate(scope),
        num(scopeRow, "row_count"),
      ),
      availability(
        "spend_consumption",
        stateFromAggregate(spend),
        num(spendRow, "row_count"),
      ),
      availability(
        "performance_credits",
        stateFromAggregate(performance),
        num(performanceRow, "row_count"),
      ),
      availability(
        "ai_usage_value_proof",
        stateFromAggregate(automation),
        num(automationRow, "row_count"),
      ),
      availability("cloud_optimization", "missing", 0),
      availability(
        "workforce_rate_card",
        stateFromAggregate(rateCards),
        num(rateCardRow, "row_count"),
      ),
      availability(
        "sourcing_event_bafo",
        stateFromAggregate(sourcingEvents),
        num(sourcingEventRow, "row_count"),
      ),
      availability(
        "context_coverage",
        stateFromAggregate(context),
        num(contextRow, "contracts"),
      ),
    ],
    contextCoverage: {
      vendors: num(contextRow, "vendors"),
      contracts: num(contextRow, "contracts"),
      annualValue: num(contextRow, "annual_value"),
      scopeRows: num(contextRow, "scope_rows"),
      invoiceLines: num(contextRow, "invoice_lines"),
      saasUsageRows: 0,
      cloudRows: 0,
      performanceRows: num(contextRow, "performance_rows"),
    },
    scopeConfidence: {
      rowCount: num(scopeRow, "row_count"),
      explicitScopeCount: num(scopeRow, "explicit_scope_count"),
      inferredScopeCount: num(scopeRow, "inferred_scope_count"),
    },
    executivePortfolio: {
      contractCount: num(executiveRow, "contract_count"),
      annualValue: num(executiveRow, "annual_value"),
      totalCommittedValue: num(executiveRow, "total_committed_value"),
      autoRenewCount: 0,
      notice90DayCount: 0,
    },
    spendConsumption: {
      rowCount: num(spendRow, "row_count"),
      invoiceLines: num(spendRow, "invoice_lines"),
      actualSpend: num(spendRow, "actual_spend"),
      committedAmount: num(spendRow, "committed_amount"),
      offContractSpend: 0,
    },
    performanceCredits: {
      rowCount: num(performanceRow, "row_count"),
      breachCount: num(performanceRow, "breach_count"),
      creditCalculated: performanceCreditCalculated,
      creditClaimed: performanceCreditClaimed,
      creditRecovered: 0,
      unclaimedCredit,
    },
    aiUsageValueProof: {
      rowCount: num(automationRow, "row_count"),
      assignedSeats: num(automationRow, "assigned_seats"),
      activeUsers: num(automationRow, "active_users"),
      actualCost: 0,
      claimableRows: num(automationRow, "claimable_rows"),
      topProducts: [],
    },
    cloudOptimization: {
      rowCount: 0,
      actualCost: 0,
      amortizedCost: 0,
      overageAmount: 0,
      topServices: [],
    },
    workforceRateCards: {
      rowCount: num(rateCardRow, "row_count"),
      hours: num(rateCardRow, "hours"),
      averageBillRate: null,
      unapprovedVarianceCount: 0,
    },
    sourcingEvents: {
      rowCount: num(sourcingEventRow, "row_count"),
      normalizedCost: num(sourcingEventRow, "normalized_cost"),
      lineItemCost: num(sourcingEventRow, "line_item_cost"),
      averageWeightedScore: null,
    },
    topVendors: topVendors.rows.map(vendorSnapshot),
  };
}

function isMeridianTenantKey(tenantKey: string): boolean {
  return (
    appClientKeyForTenant(tenantKey) === "meridian" ||
    tenantKey.trim().toLowerCase() === "meridian_health_global"
  );
}

function tenantKeyAliases(tenantKey: string): string[] {
  const aliases = tenantAliasesFor(tenantKey);
  if (isMeridianTenantKey(tenantKey)) aliases.push("meridian_health_global");
  return Array.from(new Set(aliases));
}

function tenantRlsKey(tenantKey: string): string {
  if (isMeridianTenantKey(tenantKey)) return "meridian_health_global";
  if (appClientKeyForTenant(tenantKey) === "skyharbor")
    return "skyharbor_global";
  return canonicalTenantKey(tenantKey);
}

function datasetMetadataForTenant(
  tenantKey: string | null,
): SourceV4DatasetMetadata {
  if (tenantKey && isMeridianTenantKey(tenantKey)) {
    return {
      datasetId: "meridian-health-source-v1-202608",
      datasetLabel: "Meridian Health Source v1",
    };
  }
  if (appClientKeyForTenant(tenantKey) === "skyharbor") {
    return {
      datasetId: SOURCE_V4_CUBE_DATASET_ID,
      datasetLabel: "SkyHarbor Source v4",
    };
  }
  return {
    datasetId: SOURCE_V4_CUBE_DATASET_ID,
    datasetLabel: "Source v4",
  };
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

async function safeQuery<R>(
  tenantKey: string,
  sql: string,
  params: readonly unknown[] = [],
): Promise<{ readonly state: "ok" | "error"; readonly rows: readonly R[] }> {
  try {
    return {
      state: "ok",
      rows: await queryForTenant<R>(tenantKey, sql, params),
    };
  } catch {
    return { state: "error", rows: [] };
  }
}

function availability(
  lensId: SourceV4SliceAvailability["lensId"],
  state: SnapshotState,
  rowCount: number,
): SourceV4SliceAvailability {
  return { lensId, state, rowCount };
}

function stateFromRows(result: {
  readonly state: "ok" | "error";
  readonly rows: readonly unknown[];
}): SnapshotState {
  if (result.state === "error") return "error";
  return result.rows.length > 0 ? "available" : "missing";
}

function stateFromAggregate(result: {
  readonly state: "ok" | "error";
  readonly rows: readonly NumericRow[];
}): SnapshotState {
  if (result.state === "error") return "error";
  const row = firstRow(result);
  return row &&
    Object.values(row).some((value) => (numberFromDb(value) ?? 0) > 0)
    ? "available"
    : "missing";
}

function firstRow(result: {
  readonly rows: readonly NumericRow[];
}): NumericRow | undefined {
  return result.rows[0];
}

function num(row: NumericRow | undefined, key: string): number {
  return numberFromDb(row?.[key]) ?? 0;
}

function nullableNum(row: NumericRow | undefined, key: string): number | null {
  const value = row?.[key];
  if (value == null || value === "") return null;
  return numberFromDb(value);
}

function namedAmount(row: NumericRow): SourceV4NamedAmount {
  return {
    name: String(row.name ?? "Unknown"),
    count: num(row, "count"),
    amount: num(row, "amount"),
  };
}

function vendorSnapshot(row: NumericRow): SourceV4VendorSnapshot {
  return {
    vendorId: String(row.vendor_id ?? ""),
    legalName: String(row.legal_name ?? "Unknown vendor"),
    supplierCategory: nullableString(row.supplier_category),
    strategicStatus: nullableString(row.strategic_status),
    riskTier: nullableString(row.risk_tier),
    annualValue: num(row, "annual_value"),
    contractCount: num(row, "contract_count"),
  };
}

function nullableString(value: unknown): string | null {
  if (value == null) return null;
  const text = String(value).trim();
  return text.length > 0 ? text : null;
}
