import { NextResponse } from "next/server";
import { getActiveClientRow } from "@/lib/active-client";
import { checkTenantAccessByKey } from "@/lib/auth/tenant-access";
import { requireTenancy, TenancyError } from "@/lib/auth/tenancy";
import {
  buildContract360View,
  collectContractSubjectRefs,
} from "@/lib/source/data-model/contract-360-view";
import {
  getContract360,
  getSourceContractActionCandidate,
  getSourceContractEvidenceCoverage,
  getContractEvidenceOverview,
  getContractIntelligence,
  getContractEvidencePerformanceSummary,
  getContractOptimizationEvidencePack,
  getContractOptimizationOpportunitySet,
  listCloudCommitmentCoverageRows,
  listCloudTagQualityRows,
  listContractApplicationScope,
  listContractEvidencePricing,
  listContractEvidenceScope,
  listContractFinancialExposure,
  listContractInitiativeDependency,
  listContractOperationalPerformance,
  listContractPerformancePeriods,
  listContractSpendMonthly,
  listContractTabIntelligence,
  listDocExtractionsForSubject,
  listDocFilesForContract,
  listLatestTowerObservationsForSubjects,
  listTowerValueClaimsForSubjects,
} from "@/lib/source/data-model/read-adapter";
import type {
  DocExtractionRow,
  SourceContract360Row,
  SourceContractApplicationScopeRow,
  SourceContractInitiativeDependencyRow,
  SourceContractEvidencePerformanceSummary,
  SourceContractOperationalPerformanceRow,
} from "@/lib/source/data-model/types";
import { appClientKeyForTenant, canonicalTenantKey } from "@/lib/tenant/aliases";
import { createLoadTrace } from "@/lib/source/contract-detail-load-trace";
import {
  loadSourceWorkspacePortfolio,
  loadSourceWorkspaceContractDetailFallback,
  loadSourceWorkspaceDirectImpactContract,
  sourceWorkspaceProvider,
  type SourceWorkspaceProviderMode,
} from "@/app/(maestro)/source/preview/workspace/live/portfolioAdapter";
import {
  focusableContractRows,
  supplementalActionContractRow,
  supplementalCoverageContractRow,
} from "@/app/(maestro)/source/preview/workspace/contractDiscovery";

// Lazy, per-contract detail read for the Source Workspace — mirrors exactly
// what the retired /source/vendor-portfolio/[contractId] route used to do,
// exposed as JSON so the workspace's client-side Explorer/canvas can fetch it
// on selection instead of pre-loading all 119 contracts' financial/operational/
// evidence rows on initial page load.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ contractId: string }> },
) {
  const { contractId: rawContractId } = await params;
  const contractId = decodeURIComponent(rawContractId);
  const requestUrl = new URL(request.url);
  const requestedClient = requestUrl.searchParams.get("client")?.trim() || null;
  const requestedSourceProvider = sourceProviderFromRequest(requestUrl);
  const requestedClientKey = appClientKeyForTenant(requestedClient);
  if (requestedClient && !requestedClientKey) {
    return NextResponse.json({ error: "unknown_client" }, { status: 404 });
  }
  if (requestedClientKey) {
    const access = await checkTenantAccessByKey(requestedClientKey);
    if (!access.ok) {
      const status =
        access.reason === "unauthenticated"
          ? 401
          : access.reason === "forbidden"
            ? 403
            : 404;
      return NextResponse.json({ error: access.reason }, { status });
    }
  }
  let tenancy = null;
  if (!requestedClientKey) {
    try {
      tenancy = await requireTenancy();
    } catch (err) {
      if (err instanceof TenancyError && err.code === "unauthenticated") {
        return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
      }
      return NextResponse.json(
        { error: "tenancy_unavailable" },
        { status: 503 },
      );
    }
  }
  const activeClient = requestedClientKey
    ? null
    : await getActiveClientRow().catch(() => null);
  const tenantKey =
    requestedClientKey ?? activeClient?.key ?? tenancy?.clientKey ?? "";
  if (!tenantKey) {
    return NextResponse.json({ error: "no_tenant" }, { status: 404 });
  }

  const eclProvider = sourceWorkspaceProvider(requestedSourceProvider);
  // Contract detail has no load instrument and has been observed at 50-90s
  // signed in (A9). The ladder below has two very different cost profiles
  // depending on which rung answers, so the rung is recorded with the timings.
  const trace = createLoadTrace();
  let projectionDetail: ProjectionContractDetail | null = null;
  let readFailed = false;
  let contract = await trace.step("contract360", () =>
    getContract360(tenantKey, contractId).catch(() => {
      readFailed = true;
      return null;
    }),
  );
  if (contract) trace.resolved("contract360");
  if (!contract && eclProvider !== "legacy") {
    projectionDetail = await trace.step("detail-fallback", () =>
      loadSourceWorkspaceContractDetailFallback(
      tenantKey,
      contractId,
      eclProvider,
    ).catch(() => {
        readFailed = true;
        return null;
      }),
    );
    contract = projectionDetail?.contract ?? null;
    if (contract) trace.resolved("detail-fallback");
  }
  if (!contract && eclProvider !== "legacy") {
    projectionDetail = await trace.step("projection-detail", () =>
      getProjectionContractDetail(
      tenantKey,
      contractId,
      eclProvider,
    ).catch(() => {
        readFailed = true;
        return null;
      }),
    );
    contract = projectionDetail?.contract ?? null;
    if (contract) trace.resolved("projection-detail");
  }
  if (!contract && eclProvider !== "legacy") {
    const action = await trace.step("action-candidate", () =>
      getSourceContractActionCandidate(
      tenantKey,
      contractId,
    ).catch(() => {
        readFailed = true;
        return null;
      }),
    );
    if (
      action &&
      canonicalTenantKey(action.tenant_key) === canonicalTenantKey(tenantKey) &&
      action.contract_id === contractId
    ) {
      contract = supplementalActionContractRow(action);
      trace.resolved("action-candidate");
    }
  }
  if (!contract && eclProvider !== "legacy") {
    const coverage = await trace.step("evidence-coverage", () =>
      getSourceContractEvidenceCoverage(
      tenantKey,
      contractId,
    ).catch(() => {
        readFailed = true;
        return null;
      }),
    );
    if (
      coverage &&
      canonicalTenantKey(coverage.tenant_key) === canonicalTenantKey(tenantKey) &&
      coverage.contract_id === contractId
    ) {
      contract = supplementalCoverageContractRow(coverage);
      trace.resolved("evidence-coverage");
    }
  }
  if (!contract && eclProvider !== "legacy") {
    const direct = await trace.step("direct-impact", () =>
      loadSourceWorkspaceDirectImpactContract(
      tenantKey,
      contractId,
    ).catch(() => {
        readFailed = true;
        return null;
      }),
    );
    if (
      direct?.action &&
      direct.action.contract_id === contractId &&
      canonicalTenantKey(direct.action.tenant_key) === canonicalTenantKey(tenantKey)
    ) {
      contract = supplementalActionContractRow(direct.action);
    } else if (
      direct?.coverage &&
      direct.coverage.contract_id === contractId &&
      canonicalTenantKey(direct.coverage.tenant_key) === canonicalTenantKey(tenantKey)
    ) {
      contract = supplementalCoverageContractRow(direct.coverage);
      trace.resolved("direct-impact");
    }
  }
  if (!contract) {
    if (readFailed) {
      return NextResponse.json(
        { error: "contract_detail_unavailable" },
        { status: 503, headers: { "cache-control": "no-store" } },
      );
    }
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const [
    storedApplicationScope,
    financialExposure,
    operationalPerformance,
    storedInitiativeDependencies,
    evidenceOverview,
    evidenceScope,
    evidencePricing,
    evidencePerformance,
    performancePeriods,
    spendMonths,
    cloudCommitmentPeerCoverage,
    cloudTagQuality,
    contractTabIntelligence,
    contractIntelligence,
  ] = await trace.step("detail-batch", () => Promise.all([
    listContractApplicationScope(tenantKey, contractId).catch(() => []),
    listContractFinancialExposure(tenantKey).catch(() => []),
    listContractOperationalPerformance(tenantKey).catch(() => []),
    listContractInitiativeDependency(tenantKey, contractId).catch(() => []),
    getContractEvidenceOverview(tenantKey, contractId).catch(() => null),
    listContractEvidenceScope(tenantKey, contractId).catch(() => []),
    listContractEvidencePricing(tenantKey, contractId).catch(() => []),
    getContractEvidencePerformanceSummary(tenantKey, contractId).catch(
      () => null,
    ),
    listContractPerformancePeriods(tenantKey, contractId).catch(() => []),
    listContractSpendMonthly(tenantKey, contractId).catch(() => []),
    listCloudCommitmentCoverageRows(tenantKey).catch(() => []),
    listCloudTagQualityRows(tenantKey, contractId).catch(() => []),
    listContractTabIntelligence(tenantKey, contractId).catch(() => []),
    getContractIntelligence(tenantKey, contractId).catch(() => null),
  ]));
  const applicationScope =
    storedApplicationScope.length > 0
      ? storedApplicationScope
      : (projectionDetail?.applicationScope ?? []);
  const initiativeDependencies =
    storedInitiativeDependencies.length > 0
      ? storedInitiativeDependencies
      : (projectionDetail?.initiativeDependencies ?? []);

  const subjectRefs = collectContractSubjectRefs(contract, applicationScope);
  const [
    towerObservations,
    towerValueClaims,
    extractionsByContract,
    extractionsByVendor,
    documentFiles,
    optimizationEvidence,
    optimizationOpportunitySet,
  ] = await trace.step("subject-batch", () => Promise.all([
    listLatestTowerObservationsForSubjects(tenantKey, subjectRefs).catch(
      () => [],
    ),
    listTowerValueClaimsForSubjects(tenantKey, subjectRefs).catch(() => []),
    listDocExtractionsForSubject(tenantKey, contract.contract_id).catch(
      () => [],
    ),
    listDocExtractionsForSubject(tenantKey, contract.vendor_ref).catch(
      () => [],
    ),
    listDocFilesForContract(tenantKey, contract.contract_id).catch(() => []),
    getContractOptimizationEvidencePack(tenantKey, contract.contract_id).catch(
      () => null,
    ),
    getContractOptimizationOpportunitySet(
      tenantKey,
      contract.contract_id,
      contract,
    ).catch(() => null),
  ]));
  const docExtractions = dedupeExtractions([
    ...extractionsByContract,
    ...extractionsByVendor,
  ]);

  const view = buildContract360View({
    contract,
    applicationScope,
    financialExposure,
    operationalPerformance: normalizeOperationalPerformanceRows(
      operationalPerformance,
      contract,
      evidencePerformance,
    ),
    initiativeDependencies,
    towerObservations,
    towerValueClaims,
    docExtractions,
    documentFiles,
    optimizationEvidence,
    optimizationOpportunitySet,
    evidenceOverview,
    evidenceScope,
    evidencePricing,
    evidencePerformance,
    performancePeriods,
    spendMonths,
    cloudCommitmentPeerCoverage,
    cloudTagQuality,
    contractTabIntelligence,
    contractIntelligence,
  });

  // The profile travels on the response, so a signed-in walk reads it from
  // the request it already makes. A9 asks for p50/p95 before a budget is
  // agreed; this is what produces the samples.
  return NextResponse.json(view, {
    headers: { "Server-Timing": trace.serverTiming() },
  });
}

type ProjectionContractDetail = {
  readonly contract: SourceContract360Row;
  readonly applicationScope: readonly SourceContractApplicationScopeRow[];
  readonly initiativeDependencies: readonly SourceContractInitiativeDependencyRow[];
};

async function getProjectionContractDetail(
  tenantKey: string,
  contractId: string,
  provider: SourceWorkspaceProviderMode,
): Promise<ProjectionContractDetail | null> {
  const portfolio = await loadSourceWorkspacePortfolio(
    tenantKey,
    new Date().toISOString(),
    provider,
    // This fallback only resolves the requested contract header and its
    // declared scope. Loading the full impact layer here made a direct URL
    // wait on the portfolio action fan-out before Contract 360 could start.
    { impactMode: "deferred" },
  );
  const contract =
    (portfolio ? focusableContractRows(portfolio) : []).find(
      (row) => row.contract_id === contractId,
    ) ?? null;
  if (!contract || !portfolio) return null;
  return {
    contract,
    applicationScope: portfolio.applicationScope.filter(
      (row) => row.contract_id === contract.contract_id,
    ),
    initiativeDependencies: portfolio.initiativeDependencies.filter(
      (row) => row.contract_id === contract.contract_id,
    ),
  };
}

function sourceProviderFromRequest(
  requestUrl: URL,
): SourceWorkspaceProviderMode | null {
  const normalized = (
    requestUrl.searchParams.get("sourceProvider") ??
    requestUrl.searchParams.get("provider") ??
    ""
  ).trim();
  if (normalized === "ecl_projection_db") {
    return normalized;
  }
  if (process.env.SOURCE_WORKSPACE_ALLOW_PROVIDER_QUERY_OVERRIDE !== "true") {
    return null;
  }
  if (
    normalized === "legacy" ||
    normalized === "ecl_projection" ||
    normalized === "ecl_projection_db"
  ) {
    return normalized;
  }
  return null;
}

function dedupeExtractions(
  rows: readonly DocExtractionRow[],
): DocExtractionRow[] {
  const byId = new Map<string, DocExtractionRow>();
  for (const row of rows) byId.set(row.extraction_id, row);
  return [...byId.values()];
}

function normalizeOperationalPerformanceRows(
  rows: readonly SourceContractOperationalPerformanceRow[],
  contract: {
    readonly tenant_key: SourceContractOperationalPerformanceRow["tenant_key"];
    readonly contract_id: string;
    readonly vendor_ref: string;
    readonly vendor_name: string;
    readonly scoped_application_count: number | null;
    readonly critical_application_count: number | null;
    readonly cloud_sev1_sev2_incidents: number | null;
    readonly operational_evidence_gap: boolean | string | null;
  },
  evidencePerformance: SourceContractEvidencePerformanceSummary | null,
): SourceContractOperationalPerformanceRow[] {
  if (!evidencePerformance) return [...rows];
  const index = rows.findIndex(
    (row) => row.contract_id === contract.contract_id,
  );
  const base =
    index >= 0
      ? rows[index]
      : {
          tenant_key: contract.tenant_key,
          contract_id: contract.contract_id,
          vendor_ref: contract.vendor_ref,
          vendor_name: contract.vendor_name,
          sla_summary: null,
          scoped_application_count: contract.scoped_application_count,
          critical_application_count: contract.critical_application_count,
          cloud_sev1_sev2_incidents: contract.cloud_sev1_sev2_incidents,
          avg_cloud_change_failure_rate: null,
          service_credits_earned: null,
          service_credits_claimed: null,
          evidence_gap: contract.operational_evidence_gap,
        };
  const normalized: SourceContractOperationalPerformanceRow = {
    ...base,
    cloud_sev1_sev2_incidents:
      base.cloud_sev1_sev2_incidents ??
      evidencePerformance.sev1_incidents + evidencePerformance.sev2_incidents,
    service_credits_earned:
      base.service_credits_earned ??
      evidencePerformance.service_credits_earned_usd,
    service_credits_claimed:
      base.service_credits_claimed ??
      evidencePerformance.service_credits_claimed_usd,
    evidence_gap:
      base.evidence_gap ??
      (typeof contract.operational_evidence_gap === "string"
        ? contract.operational_evidence_gap
        : null) ??
      (evidencePerformance.review_status
        ? `governed evidence performance summary: ${evidencePerformance.review_status}`
        : null),
  };
  if (index < 0) return [...rows, normalized];
  return rows.map((row, rowIndex) => (rowIndex === index ? normalized : row));
}
