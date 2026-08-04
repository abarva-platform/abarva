import { NextResponse } from 'next/server';
import { getActiveClientRow } from '@/lib/active-client';
import { requireTenancy, TenancyError } from '@/lib/auth/tenancy';
import { buildContract360View, collectContractSubjectRefs } from '@/lib/source/data-model/contract-360-view';
import {
  getContract360,
  listContractApplicationScope,
  listContractFinancialExposure,
  listContractInitiativeDependency,
  listContractOperationalPerformance,
  listDocExtractionsForSubject,
  listLatestTowerObservationsForSubjects,
  listTowerValueClaimsForSubjects,
} from '@/lib/source/data-model/read-adapter';
import type { DocExtractionRow } from '@/lib/source/data-model/types';

// Lazy, per-contract detail read for the Source Workspace — mirrors exactly
// what /source/vendor-portfolio/[contractId]/page.tsx already does server-side,
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

  const [applicationScope, financialExposure, operationalPerformance, initiativeDependencies] =
    await Promise.all([
      listContractApplicationScope(tenantKey, contractId).catch(() => []),
      listContractFinancialExposure(tenantKey).catch(() => []),
      listContractOperationalPerformance(tenantKey).catch(() => []),
      listContractInitiativeDependency(tenantKey, contractId).catch(() => []),
    ]);

  const subjectRefs = collectContractSubjectRefs(contract, applicationScope);
  const [towerObservations, towerValueClaims, extractionsByContract, extractionsByVendor] = await Promise.all([
    listLatestTowerObservationsForSubjects(tenantKey, subjectRefs).catch(() => []),
    listTowerValueClaimsForSubjects(tenantKey, subjectRefs).catch(() => []),
    listDocExtractionsForSubject(tenantKey, contract.contract_id).catch(() => []),
    listDocExtractionsForSubject(tenantKey, contract.vendor_ref).catch(() => []),
  ]);
  const docExtractions = dedupeExtractions([...extractionsByContract, ...extractionsByVendor]);

  const view = buildContract360View({
    contract,
    applicationScope,
    financialExposure,
    operationalPerformance,
    initiativeDependencies,
    towerObservations,
    towerValueClaims,
    docExtractions,
  });

  return NextResponse.json(view);
}

function dedupeExtractions(rows: readonly DocExtractionRow[]): DocExtractionRow[] {
  const byId = new Map<string, DocExtractionRow>();
  for (const row of rows) byId.set(row.extraction_id, row);
  return [...byId.values()];
}
