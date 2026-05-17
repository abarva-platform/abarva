// Renewal Cockpit view-model (Practitioner-Fit §2 / spec §4).
//
// A per-renewal decision surface. The headline is the RECOMMENDED POSTURE
// (renew / renegotiate / rebid / consolidate / exit); every other section is
// the evidence behind it:
//   - current spend & term timing + auto-renewal risk
//   - usage / adoption / shelfware read
//   - should-cost benchmark — reuses the Slice 1.3 should-cost module
//   - incumbent leverage — a renewal-focused read (Slice 1.5 family)
//   - alternatives summary
//
// Pure module: no DB, no network, no clock — `asOf` is injected. The cockpit
// composes existing Source modules; it does not duplicate their logic.

import {
  buildShouldCostEstimate,
  type ShouldCostEstimate,
  type ShouldCostModelInput,
} from '@/lib/source/should-cost/should-cost-model';
import type { VendorContractInput } from '@/lib/source/decision-queue/detector-inputs';

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

/** A deal-ready alternative the buyer could switch to. */
export interface RenewalAlternative {
  vendorName: string;
  /** Indicative annual cost in USD, when known. */
  indicativeAnnualUsd: number | null;
  /** One-line read on switching cost / readiness. */
  switchingNote: string;
}

export interface RenewalCockpitInput {
  clientKey: string;
  contract: VendorContractInput;
  /**
   * The category benchmark (annual USD) from `it_financials`, when one is
   * available. Drives the should-cost framing and posture.
   */
  categoryBenchmarkUsd: number | null;
  /** Deal-ready alternatives, if any have been scouted. */
  alternatives: RenewalAlternative[];
  /** Evaluation clock — injected for determinism. */
  asOf: Date;
}

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------

/** The five postures a VP can take into a renewal. */
export type RenewalPosture =
  | 'renew'
  | 'renegotiate'
  | 'rebid'
  | 'consolidate'
  | 'exit';

/** Term & timing read, including auto-renewal exposure. */
export interface RenewalTiming {
  termEndDate: string | null;
  daysToTermEnd: number | null;
  autoRenew: boolean;
  noticePeriodDays: number | null;
  /** Days until the last date to serve notice; null when not applicable. */
  daysToNoticeDeadline: number | null;
  /** True when the notice window is closing inside 45 days (or has passed). */
  noticeWindowAtRisk: boolean;
  summary: string;
}

/** Usage / adoption / shelfware read. */
export interface RenewalUsage {
  utilizationRate: number | null;
  /** Annual USD funding unused capacity; null when unmeasured. */
  estimatedShelfwareUsd: number | null;
  isShelfware: boolean;
  summary: string;
}

/** Should-cost framing for the renewal. */
export interface RenewalShouldCost {
  /** Full should-cost estimate from the Slice 1.3 module. */
  estimate: ShouldCostEstimate;
  /** Category benchmark used, when available. */
  benchmarkUsd: number | null;
  /** USD the current spend exceeds the benchmark; null when no benchmark. */
  overspendVsBenchmarkUsd: number | null;
  summary: string;
}

/** Incumbent-leverage read, renewal-specific (Slice 1.5 family). */
export interface RenewalLeverage {
  leverageHolder: 'buyer' | 'vendor' | 'balanced';
  hasCredibleAlternative: boolean;
  assessment: string;
  recommendedPlay: string;
}

/** The full cockpit view-model. */
export interface RenewalCockpit {
  clientKey: string;
  contractId: string;
  vendorName: string;
  product: string;
  generatedAt: string;
  /** Free-text owner reference from the vendor-contract substrate, if loaded. */
  ownerRef?: string;
  /** Current annual spend in USD; null when unpriced. */
  currentAnnualSpendUsd: number | null;
  timing: RenewalTiming;
  usage: RenewalUsage;
  shouldCost: RenewalShouldCost;
  leverage: RenewalLeverage;
  alternatives: RenewalAlternative[];
  /** THE HEADLINE — the recommended posture. */
  recommendedPosture: RenewalPosture;
  /** One-line posture label for display. */
  postureLabel: string;
  /** The grounded rationale for the posture. */
  postureRationale: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const SHELFWARE_CEILING = 0.55;
const SAVINGS_THRESHOLD_RATIO = 0.15;

function daysUntil(isoDate: string | null, asOf: Date): number | null {
  if (!isoDate) return null;
  const target = new Date(`${isoDate}T00:00:00Z`).getTime();
  if (!Number.isFinite(target)) return null;
  return Math.floor((target - asOf.getTime()) / MS_PER_DAY);
}

function formatUsd(value: number): string {
  return `$${Math.round(value).toLocaleString('en-US')}`;
}

const POSTURE_LABELS: Record<RenewalPosture, string> = {
  renew: 'Renew',
  renegotiate: 'Renegotiate',
  rebid: 'Rebid',
  consolidate: 'Consolidate',
  exit: 'Exit',
};

// ---------------------------------------------------------------------------
// Should-cost framing — reuses the Slice 1.3 module
// ---------------------------------------------------------------------------

/**
 * Build a should-cost estimate for a renewal. A renewal is a steady-state
 * subscription, so the role-mix is a lean run-the-service team and the quote
 * is the current annual spend. This is a deliberately conservative framing of
 * the existing should-cost estimator inputs — not new analysis.
 */
function buildRenewalShouldCost(
  input: RenewalCockpitInput,
): RenewalShouldCost {
  const spend = input.contract.annualSpendUsd ?? input.categoryBenchmarkUsd ?? 0;
  // A renewal carries a modest run-the-service team — kept minimal so the
  // iceberg reflects a steady-state SaaS contract, not an implementation.
  const modelInput: ShouldCostModelInput = {
    estimateLabel: `${input.contract.vendorName} — ${input.contract.product} renewal`,
    vendorQuotedCost: spend,
    vendorMarginRatio: 0.3,
    roleMix: [
      { role: 'engagement_lead', headcount: 0.2 },
      { role: 'engineer', headcount: 0.5 },
    ],
    rateCard: [
      {
        role: 'engagement_lead',
        onshoreAnnualRate: 240_000,
        offshoreAnnualRate: 90_000,
      },
      {
        role: 'engineer',
        onshoreAnnualRate: 170_000,
        offshoreAnnualRate: 60_000,
      },
    ],
    durationMonths: 12,
    offshoreRatio: 0.4,
    transitionCost: 0,
    consumption: { monthlyCloudCost: 0, monthlyModelCost: 0 },
  };
  const estimate = buildShouldCostEstimate(modelInput);

  const benchmark = input.categoryBenchmarkUsd;
  const overspend =
    benchmark !== null && input.contract.annualSpendUsd !== null
      ? input.contract.annualSpendUsd - benchmark
      : null;

  let summary: string;
  if (benchmark !== null && overspend !== null && overspend > 0) {
    summary = `Current spend ${formatUsd(
      input.contract.annualSpendUsd ?? 0,
    )} runs ${formatUsd(overspend)}/yr above the ${formatUsd(
      benchmark,
    )} category benchmark — the renegotiation anchor.`;
  } else if (benchmark !== null) {
    summary = `Current spend is at or below the ${formatUsd(
      benchmark,
    )} category benchmark — limited headline-price room.`;
  } else {
    summary = `No category benchmark loaded; should-cost iceberg framing applies — the quote is ~${Math.round(
      estimate.visibleShareOfTotal * 100,
    )}% of modelled true cost.`;
  }

  return { estimate, benchmarkUsd: benchmark, overspendVsBenchmarkUsd: overspend, summary };
}

// ---------------------------------------------------------------------------
// Timing
// ---------------------------------------------------------------------------

function buildTiming(input: RenewalCockpitInput): RenewalTiming {
  const { contract, asOf } = input;
  const daysToTermEnd = daysUntil(contract.termEndDate, asOf);
  let daysToNoticeDeadline: number | null = null;
  if (
    contract.autoRenew &&
    contract.noticePeriodDays !== null &&
    daysToTermEnd !== null
  ) {
    daysToNoticeDeadline = daysToTermEnd - contract.noticePeriodDays;
  }
  const noticeWindowAtRisk =
    daysToNoticeDeadline !== null && daysToNoticeDeadline <= 45;

  let summary: string;
  if (contract.termEndDate === null) {
    summary = 'No term-end date is recorded — confirm the contract calendar.';
  } else if (contract.autoRenew && daysToNoticeDeadline !== null) {
    summary =
      daysToNoticeDeadline < 0
        ? `Auto-renew contract; the notice deadline passed ${Math.abs(
            daysToNoticeDeadline,
          )} days ago — the renewal may already be locked.`
        : `Auto-renew contract; notice must be served within ${daysToNoticeDeadline} days to keep the renewal optional.`;
  } else if (daysToTermEnd !== null) {
    summary =
      daysToTermEnd < 0
        ? `Term ended ${Math.abs(daysToTermEnd)} days ago — operating month-to-month or already renewed.`
        : `Term ends in ${daysToTermEnd} days; ${
            contract.autoRenew ? 'auto-renews' : 'does not auto-renew'
          }.`;
  } else {
    summary = 'Term timing could not be computed.';
  }

  return {
    termEndDate: contract.termEndDate,
    daysToTermEnd,
    autoRenew: contract.autoRenew,
    noticePeriodDays: contract.noticePeriodDays,
    daysToNoticeDeadline,
    noticeWindowAtRisk,
    summary,
  };
}

// ---------------------------------------------------------------------------
// Usage
// ---------------------------------------------------------------------------

function buildUsage(input: RenewalCockpitInput): RenewalUsage {
  const { contract } = input;
  const rate = contract.utilizationRate;
  if (rate === null) {
    return {
      utilizationRate: null,
      estimatedShelfwareUsd: null,
      isShelfware: false,
      summary: 'Utilization is not measured — request adoption telemetry before re-commit.',
    };
  }
  const isShelfware = rate < SHELFWARE_CEILING;
  const shelfware =
    contract.annualSpendUsd !== null
      ? contract.annualSpendUsd * (1 - rate)
      : null;
  const pct = Math.round(rate * 100);
  const summary = isShelfware
    ? `Only ${pct}% of entitlement is used` +
      (shelfware !== null
        ? ` — roughly ${formatUsd(shelfware)}/yr funds unused capacity.`
        : ' — a clear right-size candidate.')
    : `${pct}% of entitlement is used — adoption supports the current scope.`;
  return {
    utilizationRate: rate,
    estimatedShelfwareUsd: shelfware,
    isShelfware,
    summary,
  };
}

// ---------------------------------------------------------------------------
// Leverage
// ---------------------------------------------------------------------------

function buildLeverage(input: RenewalCockpitInput): RenewalLeverage {
  const hasAlt = input.alternatives.length > 0;
  const timing = buildTiming(input);
  // Competitive tension is the strongest lever; a closing notice window
  // hands leverage to the vendor.
  let leverageHolder: RenewalLeverage['leverageHolder'];
  if (hasAlt && !timing.noticeWindowAtRisk) {
    leverageHolder = 'buyer';
  } else if (!hasAlt && timing.noticeWindowAtRisk) {
    leverageHolder = 'vendor';
  } else {
    leverageHolder = 'balanced';
  }

  const assessment = hasAlt
    ? `${input.alternatives.length} deal-ready alternative(s) scouted — credible competitive tension.`
    : 'No deal-ready alternative is on the table — the incumbent knows switching is costly.';
  const recommendedPlay =
    leverageHolder === 'buyer'
      ? 'Open by anchoring on the should-cost range and naming the alternative — the incumbent must defend its premium.'
      : leverageHolder === 'vendor'
        ? 'Buy time first: serve notice or extend the term short-term so the renewal does not lock before a real alternative exists.'
        : 'Press the should-cost and utilization gaps rather than headline discount; scout one alternative to shift the balance.';

  return { leverageHolder, hasCredibleAlternative: hasAlt, assessment, recommendedPlay };
}

// ---------------------------------------------------------------------------
// Posture derivation — THE HEADLINE
// ---------------------------------------------------------------------------

/**
 * Derive the recommended posture from the assembled evidence. Deterministic
 * priority order — the first matching rule wins:
 *   1. consolidate — utilization is shelfware-low AND an alternative exists
 *   2. exit        — utilization is shelfware-low and spend is material
 *   3. rebid       — spend runs materially above benchmark AND an alternative exists
 *   4. renegotiate — spend runs materially above benchmark (no alternative)
 *   5. renegotiate — auto-renew notice window is closing (preserve optionality)
 *   6. renew       — none of the above; the contract is performing
 */
function derivePosture(args: {
  contract: VendorContractInput;
  usage: RenewalUsage;
  shouldCost: RenewalShouldCost;
  timing: RenewalTiming;
  hasAlternative: boolean;
}): { posture: RenewalPosture; rationale: string } {
  const { contract, usage, shouldCost, timing, hasAlternative } = args;
  const overspend = shouldCost.overspendVsBenchmarkUsd;
  const benchmark = shouldCost.benchmarkUsd;
  const materiallyOverBenchmark =
    overspend !== null &&
    benchmark !== null &&
    overspend > benchmark * SAVINGS_THRESHOLD_RATIO;

  if (usage.isShelfware && hasAlternative) {
    return {
      posture: 'consolidate',
      rationale: `Utilization is low (${Math.round(
        (usage.utilizationRate ?? 0) * 100,
      )}%) and a credible alternative exists — fold this capability into another contract rather than re-committing.`,
    };
  }
  if (
    usage.isShelfware &&
    contract.annualSpendUsd !== null &&
    contract.annualSpendUsd > 0
  ) {
    return {
      posture: 'exit',
      rationale: `Only ${Math.round(
        (usage.utilizationRate ?? 0) * 100,
      )}% of entitlement is used against ${formatUsd(
        contract.annualSpendUsd,
      )}/yr — the contract does not earn its renewal; plan an exit or a deep downsize.`,
    };
  }
  if (materiallyOverBenchmark && hasAlternative) {
    return {
      posture: 'rebid',
      rationale: `Spend runs ${formatUsd(
        overspend ?? 0,
      )}/yr above benchmark and a deal-ready alternative exists — a competitive rebid is the strongest path to the should-cost range.`,
    };
  }
  if (materiallyOverBenchmark) {
    return {
      posture: 'renegotiate',
      rationale: `Spend runs ${formatUsd(
        overspend ?? 0,
      )}/yr above the category benchmark — renegotiate against the should-cost anchor before re-committing.`,
    };
  }
  if (timing.noticeWindowAtRisk && contract.autoRenew) {
    return {
      posture: 'renegotiate',
      rationale:
        'The auto-renewal notice window is closing — open a renegotiation now so the renewal does not lock on the vendor’s terms by default.',
    };
  }
  return {
    posture: 'renew',
    rationale:
      'Adoption is healthy, spend is in line with benchmark and no closing notice trap applies — renew, ideally with a modest multi-year concession traded for price certainty.',
  };
}

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

/**
 * Build the full Renewal Cockpit view-model. Deterministic — identical input
 * yields an identical cockpit. No fabrication: every section is grounded in
 * the supplied contract / financial substrate.
 */
export function buildRenewalCockpit(
  input: RenewalCockpitInput,
): RenewalCockpit {
  const timing = buildTiming(input);
  const usage = buildUsage(input);
  const shouldCost = buildRenewalShouldCost(input);
  const leverage = buildLeverage(input);

  const { posture, rationale } = derivePosture({
    contract: input.contract,
    usage,
    shouldCost,
    timing,
    hasAlternative: leverage.hasCredibleAlternative,
  });

  return {
    clientKey: input.clientKey,
    contractId: input.contract.contractId,
    vendorName: input.contract.vendorName,
    product: input.contract.product,
    generatedAt: input.asOf.toISOString(),
    ownerRef: input.contract.ownerRef,
    currentAnnualSpendUsd: input.contract.annualSpendUsd,
    timing,
    usage,
    shouldCost,
    leverage,
    alternatives: input.alternatives,
    recommendedPosture: posture,
    postureLabel: POSTURE_LABELS[posture],
    postureRationale: rationale,
  };
}
