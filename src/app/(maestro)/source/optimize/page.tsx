import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { SourceOptimizeContractPage } from "@/components/source/SourceOptimizeContractPage";
import { getActiveClientRow } from "@/lib/active-client";
import { requireTenancy, TenancyError } from "@/lib/auth/tenancy";
import { canonicalClientDisplayName } from "@/lib/client-config";
import { trimContractOptimizationOpportunitySetForClient } from "@/lib/source/data-model/contract-optimization-client-payload";
import { buildContractOptimizationLedger } from "@/lib/source/data-model/contract-optimization-ledger";
import { buildContractOptimizationSpine } from "@/lib/source/data-model/contract-optimization-spine";
import {
  getContract360,
  getContractOptimizationEvidencePack,
  getContractOptimizationOpportunitySet,
  listContract360,
} from "@/lib/source/data-model/read-adapter";
import { SOURCE_V4_CUBE_AS_OF_DATE } from "@/lib/source/data-model/source-v4-cube-ui-catalog";
import { computeContractLeverageSignals } from "@/lib/source/data-model/vendor-contract-portfolio";

export const metadata: Metadata = {
  title: "Optimize Contract · Source · AbarVa",
};
export const dynamic = "force-dynamic";

export default async function SourceOptimizeContractRoute({
  searchParams,
}: {
  searchParams: Promise<{ asOf?: string; contractId?: string }>;
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

  const [activeClient, params] = await Promise.all([
    getActiveClientRow().catch(() => null),
    searchParams,
  ]);
  const tenantKey = activeClient?.key ?? tenancy.clientKey ?? "";
  if (!tenantKey) notFound();

  const asOfDateIso = normalizeAsOfDate(params.asOf);
  const contractId = params.contractId?.trim() || null;
  const contracts = await listContract360(tenantKey).catch(() => []);
  const selectedContract = contractId
    ? (contracts.find((contract) => contract.contract_id === contractId) ??
      (await getContract360(tenantKey, contractId).catch(() => null)))
    : null;

  const leverageEntries = computeContractLeverageSignals(contracts);
  const selectedLeverage = selectedContract
    ? (leverageEntries.find(
        (entry) => entry.contractId === selectedContract.contract_id,
      ) ?? null)
    : null;

  const [opportunitySet, evidencePack] = selectedContract
    ? await Promise.all([
        getContractOptimizationOpportunitySet(
          tenantKey,
          selectedContract.contract_id,
          selectedContract,
        ).catch(() => null),
        getContractOptimizationEvidencePack(
          tenantKey,
          selectedContract.contract_id,
        ).catch(() => null),
      ])
    : [null, null];

  const ledger = selectedContract
    ? buildContractOptimizationLedger({
        view: null,
        contract: selectedContract,
        leverage: selectedLeverage,
        optimizationEvidence: evidencePack,
        datasetVersion:
          opportunitySet?.datasetVersion ?? evidencePack?.dataset_version,
      })
    : null;

  const spine = buildContractOptimizationSpine({
    contract: selectedContract,
    contracts,
    leverageEntries,
    ledger,
    asOfDateIso,
  });

  const tenantName =
    canonicalClientDisplayName({
      key: activeClient?.key,
      name: activeClient?.name,
    }) ?? "AbarVa Client";

  return (
    <SourceOptimizeContractPage
      tenantName={tenantName}
      asOfDateIso={asOfDateIso}
      spine={spine}
      opportunitySet={trimContractOptimizationOpportunitySetForClient(
        opportunitySet,
      )}
      evidencePack={evidencePack}
    />
  );
}

function normalizeAsOfDate(value: string | undefined): string {
  if (value?.trim()) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  return `${SOURCE_V4_CUBE_AS_OF_DATE}T00:00:00.000Z`;
}
