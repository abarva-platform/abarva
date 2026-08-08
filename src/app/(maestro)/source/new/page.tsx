import type { Metadata } from 'next';
import { getActiveClientRow } from '@/lib/active-client';
import { canonicalClientDisplayName, getClientOption } from '@/lib/client-config';
import {
  SourceOriginatePage,
  type ContractOptimizationCandidate,
} from '@/components/source/SourceOriginatePage';
import { listContract360 } from '@/lib/source/data-model/read-adapter';
import { computeSourcingOpportunities } from '@/lib/source/data-model/sourcing-opportunities';
import {
  computeContractLeverageSignals,
  numberFromDb,
} from '@/lib/source/data-model/vendor-contract-portfolio';
import type { SourceContract360Row } from '@/lib/source/data-model/types';

export const metadata: Metadata = { title: 'New IT Sourcing Intake · AbarVa' };

const SKYHARBOR_SYNTHETIC_AS_OF = '2027-06-30T00:00:00Z';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ intent?: string }>;
}) {
  const activeClient = await getActiveClientRow().catch(() => null);
  const params = await searchParams;
  const clientOption = getClientOption(activeClient?.key);
  const activeClientDisplayName =
    canonicalClientDisplayName({ key: activeClient?.key, name: activeClient?.name }) ??
    clientOption.name;
  const contractOptimizationCandidates =
    params.intent === 'contract-optimization' && activeClient?.key
      ? await loadContractOptimizationCandidates(activeClient.key)
      : [];

  return (
    <SourceOriginatePage
      clientName={activeClientDisplayName}
      clientShortName={clientOption.shortName}
      clientKey={clientOption.id}
      contractOptimizationCandidates={contractOptimizationCandidates}
    />
  );
}

async function loadContractOptimizationCandidates(
  tenantKey: string,
): Promise<ContractOptimizationCandidate[]> {
  const rows = await listContract360(tenantKey).catch(() => []);
  if (rows.length === 0) return [];

  const asOfDateIso = tenantKey.includes('skyharbor')
    ? SKYHARBOR_SYNTHETIC_AS_OF
    : new Date().toISOString();
  const opportunities = computeSourcingOpportunities(rows, asOfDateIso).opportunities;
  const leverageByContract = new Map(
    computeContractLeverageSignals(rows).map((entry) => [entry.contractId, entry]),
  );
  const byContract = new Map(rows.map((row) => [row.contract_id, row]));
  const fromOpportunities = opportunities
    .map((opportunity) => {
      const row = byContract.get(opportunity.contractId);
      if (!row) return null;
      return candidateFromRow(
        row,
        leverageByContract.get(row.contract_id)?.weakSignalCount ?? 0,
        opportunity.rationale[0] ?? 'Ranked by governed Source optimization signals.',
      );
    })
    .filter((candidate): candidate is ContractOptimizationCandidate => Boolean(candidate));

  if (fromOpportunities.length > 0) return fromOpportunities.slice(0, 12);

  return rows
    .map((row) =>
      candidateFromRow(
        row,
        leverageByContract.get(row.contract_id)?.weakSignalCount ?? 0,
        'Ranked by annual value while optimization evidence is still being collected.',
      ),
    )
    .sort(
      (a, b) =>
        b.weakSignalCount - a.weakSignalCount ||
        (b.annualValueUsd ?? 0) - (a.annualValueUsd ?? 0),
    )
    .slice(0, 12);
}

function candidateFromRow(
  row: SourceContract360Row,
  weakSignalCount: number,
  reason: string,
): ContractOptimizationCandidate {
  return {
    contractId: row.contract_id,
    contractName: row.contract_name,
    vendorName: row.vendor_name,
    annualValueUsd: numberFromDb(row.annual_value),
    actualAnnualSpendUsd: numberFromDb(row.actual_annual_spend),
    weakSignalCount,
    scopeSummary: row.scope_summary,
    decisionOwner: row.renewal_owner_ref,
    reason,
  };
}
