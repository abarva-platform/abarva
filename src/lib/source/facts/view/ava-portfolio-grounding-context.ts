// ─────────────────────────────────────────────────────────────────────────────
// aVa DETERMINISTIC GROUNDING for the Source portfolio — the missing wire for
// portfolio-level questions ("what's our total annual contract value?", "how
// many contracts carry weak leverage?").
//
// Live-found bug: aVa on any /source* surface had NO governed portfolio data
// path at all. `ava-grounding-context.ts` grounds single-EVENT questions
// (value at stake, stage status) once a `sourceEventId` is present in
// surfaceContext, but portfolio-level questions carry no event id and fell
// straight through to the generic tenant-context vector-corpus retrieval —
// a completely different dataset (uploaded intake CSVs like
// `family-4-financial-commercial/F11_vendors-contracts-licenses.csv`, tenant
// key format `"<Client> Demo-air"`) with no relationship to
// `source.contract_360` / `source.vendor_contract_portfolio`. Confirmed live:
// asked "total annual contract value and vendor/contract count" on the real
// SkyHarbor Source Workspace (119 contracts, 28 vendors, $1.4805B, real
// vendors like Salesforce/CloudPeak), aVa answered with a fabricated-looking
// vendor "Sabre" and contract ids like CON-00207 that do not exist in the
// governed portfolio, then asserted an unrelated "$2.28B annual technology
// budget" figure without flagging it as uncertain.
//
// This module is the same wire pattern as ava-grounding-context.ts, aimed at
// the PORTFOLIO instead of a single event: it calls the exact same
// read-adapter functions and pure functions the Source Workspace page itself
// uses (listContract360/listVendorContractPortfolio,
// summarizePortfolio/computeVendorConcentration/computeContractLeverageSignals/
// computeRenewalExposure/computeSourcingOpportunities), so the numbers aVa
// quotes can never diverge from the numbers on screen. It does not
// re-implement any calculation.
//
// Governing rule (CLAUDE.md / AGENTS.md, Tower doctrine applied to Source):
// read models own values; the agent owns NARRATIVE. This block gives aVa the
// numbers to quote; AVA_SOURCE_QUOTE_NOT_COMPUTE_GUARD (imported from the
// sibling event-grounding module — the same guard string, not a duplicate)
// forbids computing new ones.
//
// Additive: the caller only invokes this on isSourceSurface(surface) with an
// active tenant. When the tenant has zero governed contracts (read returns no
// rows, or the tenant has nothing loaded into source.contract_360 yet), the
// block is empty and the chat falls through to existing behavior — this
// module never asserts a number it cannot trace to a real row.
// ─────────────────────────────────────────────────────────────────────────────

import {
  listContract360,
  listVendorContractPortfolio,
} from '@/lib/source/data-model/read-adapter';
import {
  computeContractLeverageSignals,
  computeRenewalExposure,
  computeVendorConcentration,
  excludeSupplementalContracts,
  summarizePortfolio,
} from '@/lib/source/data-model/vendor-contract-portfolio';
import { computeSourcingOpportunities } from '@/lib/source/data-model/sourcing-opportunities';

const USD_COMPACT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 1,
  notation: 'compact',
});

function fmtUsd(value: number): string {
  return USD_COMPACT.format(value);
}

function fmtPct(share: number): string {
  return `${(share * 100).toFixed(1)}%`;
}

// Mirrors the exact as-of resolution the Workspace page itself uses
// (src/app/(maestro)/source/preview/workspace/page.tsx) so the grounding
// block's renewal-window numbers can never diverge from the canvas the user
// is looking at.
const SKYHARBOR_SYNTHETIC_AS_OF = '2027-06-30T00:00:00Z';
function resolveAsOfIso(tenantKey: string): string {
  return tenantKey.toLowerCase().includes('skyharbor')
    ? SKYHARBOR_SYNTHETIC_AS_OF
    : new Date().toISOString();
}

export interface AvaSourcePortfolioGrounding {
  /** The authoritative grounding block to inject into the agent system
   * prompt. Empty string when the tenant has no governed contract rows. */
  block: string;
  /** True when the block carries at least one live (read-derived) number. */
  hasLiveNumbers: boolean;
}

/**
 * Build the portfolio-level grounding block for a Source-surface chat turn.
 * Best-effort: any read failure returns an empty block rather than throwing,
 * matching buildAvaSourceGrounding's contract (the caller wraps in try/catch
 * regardless, but this keeps the function's own contract honest).
 */
export async function buildAvaSourcePortfolioGrounding(
  tenantKey: string,
): Promise<AvaSourcePortfolioGrounding> {
  const [contractsRaw, vendors] = await Promise.all([
    listContract360(tenantKey).catch(() => []),
    listVendorContractPortfolio(tenantKey).catch(() => []),
  ]);
  const contracts = excludeSupplementalContracts(contractsRaw);
  if (contracts.length === 0) {
    return { block: '', hasLiveNumbers: false };
  }

  const asOfIso = resolveAsOfIso(tenantKey);
  const summary = summarizePortfolio(contracts);
  const concentration = computeVendorConcentration(contracts);
  const leverage = computeContractLeverageSignals(contracts);
  const weakLeverage = leverage.filter((entry) => entry.weakSignalCount >= 2);
  const weakLeverageValue = weakLeverage.reduce((total, entry) => total + entry.annualValue, 0);
  const renewal180 = computeRenewalExposure(contracts, asOfIso, 180);
  const opportunitiesResult = computeSourcingOpportunities(contracts, asOfIso);
  const opportunityValue = opportunitiesResult.opportunities.reduce(
    (total, o) => total + o.annualValue,
    0,
  );
  const topVendors = concentration.byVendor
    .slice(0, 5)
    .map((v) => `${v.vendorName} ${fmtUsd(v.annualValue)} (${fmtPct(v.shareOfTotal)})`)
    .join('; ');

  const lines: string[] = [
    `AUTHORITATIVE SOURCE PORTFOLIO GROUNDING (LIVE — source.contract_360 / source.vendor_contract_portfolio, tenant "${tenantKey}", as of ${asOfIso.slice(0, 10)}):`,
    // State the basis, not just the number. The Source Workspace header counts
    // contract FAMILIES from the active V4 snapshot; this counts contract ROWS in
    // source.contract_360 after supplemental rows are excluded. Both are right
    // for what they measure and they legitimately differ — the workspace itself
    // carries a mismatchWarning for exactly this. Quoting a bare count made aVa
    // look like it contradicted the page sitting beside it.
    `Contracts: ${summary.contractCount} contract rows in source.contract_360 (supplemental rows excluded). Vendors: ${summary.vendorCount} distinct vendor references (${vendors.length} vendor rows read).`,
    "Counting basis matters here: the Source Workspace header counts contract FAMILIES from the active Source V4 snapshot, a different unit that can legitimately differ from the row count above. If the user quotes a different contract or vendor count from another Source surface, do not treat either as wrong and do not silently pick one — say which unit each counts, and that one contract family can span several contract rows.",
    `Annual contract value: ${fmtUsd(summary.totalAnnualValue)}. Actual annual spend: ${fmtUsd(summary.totalActualAnnualSpend)}. Total committed value: ${fmtUsd(summary.totalCommittedValue)}.`,
    `Auto-renewing contracts: ${summary.autoRenewCount} of ${summary.contractCount}.`,
    topVendors ? `Top vendors by annual value: ${topVendors}.` : '',
    `Contracts with two or more weak leverage signals (the four checked signals are: no benchmark clause, no alternatives on record, skill dependency, regional dependency): ${weakLeverage.length}, combined annual value ${fmtUsd(weakLeverageValue)}.`,
    `Renewal exposure within 180 days: ${renewal180.expiringWithinWindow.length} contracts, ${fmtUsd(renewal180.expiringWithinWindowAnnualValue)}. Notice deadline already passed while the contract remains active: ${renewal180.noticeDeadlinePassed.length} contracts, ${fmtUsd(renewal180.noticeDeadlinePassedAnnualValue)}.`,
    `Deterministic sourcing opportunities (computeSourcingOpportunities — weak leverage, missed notice deadlines, top-concentration vendor status, never a fabricated priority score): ${opportunitiesResult.opportunities.length}, combined annual value ${fmtUsd(opportunityValue)}.`,
    'These are the ONLY governed Source portfolio numbers for this tenant. For a portfolio-wide contract/vendor/spend/leverage/renewal question, use ONLY these numbers — never a figure from generic tenant-context retrieval, a different corpus, or your own estimate. If the user asks about a single contract or vendor by name that is not listed above, say the portfolio-level grounding above does not include that contract\'s detail and it should be looked up on its Contract 360 page instead of guessed.',
  ].filter(Boolean);

  return { block: lines.join('\n'), hasLiveNumbers: true };
}
