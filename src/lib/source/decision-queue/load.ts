// Decision Queue + Renewal Cockpit server loaders.
//
// Thin orchestration: read the substrate through the data-plane seam, project
// it into detector inputs, and run the pure assembler / cockpit builder. All
// the reasoning stays in the pure modules; this file only wires reads to
// pure functions. Fail-soft throughout — the adapter degrades to empty data
// and the queue's own `emptyState` covers the no-data case.

import 'server-only';
import { readSourceDecisionQueueData } from '@/lib/data-plane/read-adapters/sourceDecisionQueueReadAdapter';
import {
  projectFinancialLines,
  projectVendorContracts,
} from './projection';
import { buildSourceDecisionQueue } from './queue';
import type { DecisionQueueInput } from './detector-inputs';
import type { SourceDecisionQueue } from './types';
import {
  buildRenewalCockpit,
  type RenewalCockpit,
} from '@/lib/source/renewal-cockpit/cockpit';

/**
 * Load and assemble the Source Decision Queue for a tenant.
 *
 * `asOf` is injectable for tests / fixed-clock rendering; it defaults to the
 * current time. The queue is deterministic for a fixed `asOf` + substrate.
 */
export async function loadSourceDecisionQueue(
  clientKey: string,
  asOf: Date = new Date(),
): Promise<SourceDecisionQueue> {
  const raw = await readSourceDecisionQueueData(clientKey);
  const input: DecisionQueueInput = {
    clientKey,
    contracts: projectVendorContracts(raw.vendorContractRecords),
    financials: projectFinancialLines(raw.financialRecords),
    segmentFreshness: raw.segmentFreshness,
    asOf,
  };
  return buildSourceDecisionQueue(input);
}

/**
 * Load the Renewal Cockpit for one contract. Returns `null` when the contract
 * id is not found in the tenant's `vendor_contracts` substrate — the route
 * renders a not-found state rather than a fabricated cockpit.
 */
export async function loadRenewalCockpit(
  clientKey: string,
  contractId: string,
  asOf: Date = new Date(),
): Promise<RenewalCockpit | null> {
  const raw = await readSourceDecisionQueueData(clientKey);
  const contracts = projectVendorContracts(raw.vendorContractRecords);
  const contract = contracts.find((c) => c.contractId === contractId);
  if (!contract) return null;

  const financials = projectFinancialLines(raw.financialRecords);
  // Lowest benchmark for the contract's category — the most demanding target.
  const categoryKey = contract.category.trim().toLowerCase();
  let categoryBenchmarkUsd: number | null = null;
  for (const f of financials) {
    if (f.category.trim().toLowerCase() !== categoryKey) continue;
    if (f.benchmarkUsd === null) continue;
    if (categoryBenchmarkUsd === null || f.benchmarkUsd < categoryBenchmarkUsd) {
      categoryBenchmarkUsd = f.benchmarkUsd;
    }
  }

  // Alternatives: other contracts in the same category are deal-ready
  // switch / consolidation candidates already inside the tenant estate.
  const alternatives = contracts
    .filter(
      (c) =>
        c.contractId !== contract.contractId &&
        c.category.trim().toLowerCase() === categoryKey,
    )
    .sort((a, b) => a.contractId.localeCompare(b.contractId))
    .map((c) => ({
      vendorName: c.vendorName,
      indicativeAnnualUsd: c.annualSpendUsd,
      switchingNote: `Already under contract for ${c.category} capability — a consolidation rather than a net-new onboarding.`,
    }));

  return buildRenewalCockpit({
    clientKey,
    contract,
    categoryBenchmarkUsd,
    alternatives,
    asOf,
  });
}
