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
import type { EvidenceResolutionContext } from '@/lib/source/evidence-trace/evidence-trace';
import { accountabilityForContracts } from '@/lib/source/work-items/service';
import type { WorkItemAccountability } from '@/lib/source/work-items/types';

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
  return (await loadSourceDecisionQueueWithEvidence(clientKey, asOf)).queue;
}

/**
 * Load the Decision Queue together with the evidence-resolution context the
 * evidence-trace drawer needs. The context carries the same projected
 * substrate the queue was built from, so a `evidenceRef` on any bundle
 * resolves against exactly the data that produced the card.
 */
export async function loadSourceDecisionQueueWithEvidence(
  clientKey: string,
  asOf: Date = new Date(),
): Promise<{ queue: SourceDecisionQueue; evidenceContext: EvidenceResolutionContext }> {
  const raw = await readSourceDecisionQueueData(clientKey);
  const contracts = projectVendorContracts(raw.vendorContractRecords);
  const financials = projectFinancialLines(raw.financialRecords);
  const input: DecisionQueueInput = {
    clientKey,
    contracts,
    financials,
    segmentFreshness: raw.segmentFreshness,
    asOf,
  };
  const queue = buildSourceDecisionQueue(input);

  // Enrich each contract-anchored bundle with owner + SLA accountability,
  // projected from the persisted `sourcing_work_items` for the tenant. The
  // pure assembler leaves `accountability` null — it has no data plane.
  // Fail-soft: a missing work-items table degrades to no accountability,
  // leaving the queue exactly as the pure assembler produced it.
  const enrichedQueue: SourceDecisionQueue = {
    ...queue,
    bundles: await enrichBundlesWithAccountability(clientKey, queue.bundles),
  };

  return {
    queue: enrichedQueue,
    evidenceContext: {
      contracts,
      financials,
      segmentFreshness: raw.segmentFreshness,
      asOf,
    },
  };
}

/**
 * Project owner + SLA accountability onto each contract-anchored bundle from
 * the tenant's persisted sourcing work items. Non-contract (gap) bundles and
 * bundles with no work items keep `accountability: null`.
 */
async function enrichBundlesWithAccountability(
  clientKey: string,
  bundles: SourceDecisionQueue['bundles'],
): Promise<SourceDecisionQueue['bundles']> {
  const contractIds = bundles
    .map((b) => b.contractId)
    .filter((id): id is string => id !== null);
  if (contractIds.length === 0) return bundles;

  let byContract: Map<string, WorkItemAccountability>;
  try {
    byContract = await accountabilityForContracts(clientKey, contractIds);
  } catch {
    // Fail-soft — the work-items migration may not be applied yet.
    return bundles;
  }

  return bundles.map((bundle) => {
    if (!bundle.contractId) return bundle;
    const a = byContract.get(bundle.contractId);
    // Only attach when there is at least one work item — an empty summary
    // is indistinguishable from "no work item", so we keep null.
    if (!a || (a.openCount === 0 && !a.hasTowerWatch)) return bundle;
    return {
      ...bundle,
      accountability: {
        owner: a.owner,
        dueDate: a.dueDate,
        openCount: a.openCount,
        hasOpenNotice: a.hasOpenNotice,
        hasTowerWatch: a.hasTowerWatch,
      },
    };
  });
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
  return (await loadRenewalCockpitWithEvidence(clientKey, contractId, asOf)).cockpit;
}

/**
 * Load the Renewal Cockpit together with the evidence-resolution context the
 * evidence-trace drawer needs. `cockpit` is `null` when the contract id is
 * not found; `evidenceContext` is still returned so the not-found surface
 * stays consistent.
 */
export async function loadRenewalCockpitWithEvidence(
  clientKey: string,
  contractId: string,
  asOf: Date = new Date(),
): Promise<{
  cockpit: RenewalCockpit | null;
  evidenceContext: EvidenceResolutionContext;
}> {
  const raw = await readSourceDecisionQueueData(clientKey);
  const contracts = projectVendorContracts(raw.vendorContractRecords);
  const financialsAll = projectFinancialLines(raw.financialRecords);
  const evidenceContext: EvidenceResolutionContext = {
    contracts,
    financials: financialsAll,
    segmentFreshness: raw.segmentFreshness,
    asOf,
  };
  const contract = contracts.find((c) => c.contractId === contractId);
  if (!contract) return { cockpit: null, evidenceContext };

  // Lowest benchmark for the contract's category — the most demanding target.
  const categoryKey = contract.category.trim().toLowerCase();
  let categoryBenchmarkUsd: number | null = null;
  for (const f of financialsAll) {
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

  const cockpit = buildRenewalCockpit({
    clientKey,
    contract,
    categoryBenchmarkUsd,
    alternatives,
    asOf,
  });
  return { cockpit, evidenceContext };
}
