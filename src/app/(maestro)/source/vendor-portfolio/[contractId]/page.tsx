import { notFound, redirect } from "next/navigation";
import { SourceContract360Page } from "@/components/source/SourceContract360Page";
import { getActiveClientRow } from "@/lib/active-client";
import { requireTenancy, TenancyError } from "@/lib/auth/tenancy";
import { canonicalClientDisplayName } from "@/lib/client-config";
import {
  collectContractSubjectRefs,
  buildContract360View,
} from "@/lib/source/data-model/contract-360-view";
import {
  getContract360,
  listContractApplicationScope,
  listContractFinancialExposure,
  listContractInitiativeDependency,
  listContractOperationalPerformance,
  listDocExtractionsForSubject,
  listLatestTowerObservationsForSubjects,
  listTowerValueClaimsForSubjects,
} from "@/lib/source/data-model/read-adapter";
import type { DocExtractionRow } from "@/lib/source/data-model/types";

export const metadata = { title: "Contract 360 · Source · AbarVa" };
export const dynamic = "force-dynamic";

/**
 * Contract 360 — drill-down from Vendor & Contract Portfolio into a single
 * source.contract_360 row plus its financial exposure, operational
 * performance, initiative dependencies, confidence-tiered application scope,
 * and a Tower performance/value overlay. Reads only; never writes.
 */
export default async function SourceContract360Route({
  params,
}: {
  params: Promise<{ contractId: string }>;
}) {
  let tenancy;
  try {
    tenancy = await requireTenancy();
  } catch (err) {
    if (err instanceof TenancyError && err.code === "unauthenticated") {
      redirect("/sign-in");
    }
    throw err;
  }

  const [{ contractId: rawContractId }, activeClient] = await Promise.all([
    params,
    getActiveClientRow().catch(() => null),
  ]);
  const contractId = decodeURIComponent(rawContractId);
  const tenantKey = activeClient?.key ?? tenancy.clientKey ?? "";

  if (!tenantKey) {
    notFound();
  }

  const contract = await getContract360(tenantKey, contractId).catch(
    () => null,
  );
  if (!contract) {
    notFound();
  }

  const [
    applicationScope,
    financialExposure,
    operationalPerformance,
    initiativeDependencies,
  ] = await Promise.all([
    listContractApplicationScope(tenantKey, contractId).catch(() => []),
    listContractFinancialExposure(tenantKey).catch(() => []),
    listContractOperationalPerformance(tenantKey).catch(() => []),
    listContractInitiativeDependency(tenantKey, contractId).catch(() => []),
  ]);

  const subjectRefs = collectContractSubjectRefs(contract, applicationScope);
  const [
    towerObservations,
    towerValueClaims,
    extractionsByContract,
    extractionsByVendor,
  ] = await Promise.all([
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
  ]);
  const docExtractions = dedupeExtractions([
    ...extractionsByContract,
    ...extractionsByVendor,
  ]);

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

  const tenantName =
    canonicalClientDisplayName({
      key: activeClient?.key,
      name: activeClient?.name,
    }) ?? "AbarVa Client";

  return <SourceContract360Page view={view} tenantName={tenantName} />;
}

function dedupeExtractions(
  rows: readonly DocExtractionRow[],
): DocExtractionRow[] {
  const byId = new Map<string, DocExtractionRow>();
  for (const row of rows) byId.set(row.extraction_id, row);
  return [...byId.values()];
}
