import { NextResponse } from 'next/server';
import { getActiveClientRow } from '@/lib/active-client';
import { requireTenancy, TenancyError } from '@/lib/auth/tenancy';
import { buildContract360View, collectContractSubjectRefs } from '@/lib/source/data-model/contract-360-view';
import {
  getContract360,
  getContractEvidenceOverview,
  getContractEvidencePerformanceSummary,
  getContractOptimizationEvidencePack,
  getContractOptimizationOpportunitySet,
  listContractApplicationScope,
  listContractEvidencePricing,
  listContractEvidenceScope,
  listContractFinancialExposure,
  listContractInitiativeDependency,
  listContractOperationalPerformance,
  listDocExtractionsForSubject,
  listLatestTowerObservationsForSubjects,
  listTowerValueClaimsForSubjects,
} from '@/lib/source/data-model/read-adapter';
import type {
  DocExtractionRow,
  SourceContractEvidencePerformanceSummary,
  SourceContractOperationalPerformanceRow,
} from '@/lib/source/data-model/types';

// Lazy, per-contract detail read for the Source Workspace — mirrors exactly
// what the retired /source/vendor-portfolio/[contractId] route used to do,
// exposed as JSON so the workspace's client-side Explorer/canvas can fetch it
// on selection instead of pre-loading all 119 contracts' financial/operational/
// evidence rows on initial page load.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ contractId: string }> },
) {
  let tenancy;
  try {
    tenancy = await requireTenancy();
  } catch (err) {
    if (err instanceof TenancyError && err.code === 'unauthenticated') {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    }
    return NextResponse.json({ error: 'tenancy_unavailable' }, { status: 503 });
  }

  const { contractId: rawContractId } = await params;
  const contractId = decodeURIComponent(rawContractId);
  const activeClient = await getActiveClientRow().catch(() => null);
  const tenantKey = activeClient?.key ?? tenancy.clientKey ?? '';
  if (!tenantKey) {
    return NextResponse.json({ error: 'no_tenant' }, { status: 404 });
  }

  const contract = await getContract360(tenantKey, contractId).catch(() => null);
  if (!contract) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const [applicationScope, financialExposure, operationalPerformance, initiativeDependencies, evidenceOverview, evidenceScope, evidencePricing, evidencePerformance] =
    await Promise.all([
      listContractApplicationScope(tenantKey, contractId).catch(() => []),
      listContractFinancialExposure(tenantKey).catch(() => []),
      listContractOperationalPerformance(tenantKey).catch(() => []),
      listContractInitiativeDependency(tenantKey, contractId).catch(() => []),
      getContractEvidenceOverview(tenantKey, contractId).catch(() => null),
      listContractEvidenceScope(tenantKey, contractId).catch(() => []),
      listContractEvidencePricing(tenantKey, contractId).catch(() => []),
      getContractEvidencePerformanceSummary(tenantKey, contractId).catch(() => null),
    ]);

  const subjectRefs = collectContractSubjectRefs(contract, applicationScope);
  const [towerObservations, towerValueClaims, extractionsByContract, extractionsByVendor, optimizationEvidence, optimizationOpportunitySet] = await Promise.all([
    listLatestTowerObservationsForSubjects(tenantKey, subjectRefs).catch(() => []),
    listTowerValueClaimsForSubjects(tenantKey, subjectRefs).catch(() => []),
    listDocExtractionsForSubject(tenantKey, contract.contract_id).catch(() => []),
    listDocExtractionsForSubject(tenantKey, contract.vendor_ref).catch(() => []),
    getContractOptimizationEvidencePack(tenantKey, contract.contract_id).catch(() => null),
    getContractOptimizationOpportunitySet(tenantKey, contract.contract_id, contract).catch(() => null),
  ]);
  const docExtractions = dedupeExtractions([...extractionsByContract, ...extractionsByVendor]);

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
    optimizationEvidence,
    optimizationOpportunitySet,
    evidenceOverview,
    evidenceScope,
    evidencePricing,
    evidencePerformance,
  });

  return NextResponse.json(view);
}

function dedupeExtractions(rows: readonly DocExtractionRow[]): DocExtractionRow[] {
  const byId = new Map<string, DocExtractionRow>();
  for (const row of rows) byId.set(row.extraction_id, row);
  return [...byId.values()];
}

function normalizeOperationalPerformanceRows(
  rows: readonly SourceContractOperationalPerformanceRow[],
  contract: {
    readonly tenant_key: SourceContractOperationalPerformanceRow['tenant_key'];
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
  const index = rows.findIndex((row) => row.contract_id === contract.contract_id);
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
      (typeof contract.operational_evidence_gap === 'string'
        ? contract.operational_evidence_gap
        : null) ??
      (evidencePerformance.review_status
        ? `governed evidence performance summary: ${evidencePerformance.review_status}`
        : null),
  };
  if (index < 0) return [...rows, normalized];
  return rows.map((row, rowIndex) => (rowIndex === index ? normalized : row));
}
