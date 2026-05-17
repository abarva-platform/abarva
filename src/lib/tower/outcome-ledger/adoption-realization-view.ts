// Outcome ledger · Wave 3, Slice 3.4 — Adoption & value-realization
// instrumentation view model.
//
// Tower must answer "is this program actually earning?" — not only
// "what phase is it in?". This module projects the Slice 3.1 outcome
// ledger view (`OutcomeLedgerView`) into an adoption + benefit-
// realization read model the Tower surface renders.
//
// Sourcing contract:
//
// - The realized / projected dollar figures, value tiers, evidence
//   flags and variance come from the Slice 3.1 outcome ledger view
//   (`buildOutcomeLedgerView`). No new DB read — this is a pure
//   re-projection of an already-fetched view.
// - Severity classification reuses the Slice 0.3 outcome taxonomy
//   (`classifyOutcomeReading`) and the value-confidence bridge so the
//   bands and implied executive actions are identical to the rest of
//   the Tower track.
//
// No-fabrication contract (inherited from the taxonomy):
//
// - This module never invents an adoption percentage. The outcome
//   ledger carries value claims, not `operating_telemetry`. When no
//   adoption telemetry has been bound, the adoption signal is reported
//   as `unknown` and surfaced as an instrumentation gap — never as a
//   fabricated number.
// - A realized figure is only counted as "earning" when its value tier
//   is `verified` AND the entry is evidence-backed. An unevidenced
//   verified-tier claim is excluded and surfaced as a challenge.
//
// Pure and deterministic — no clock, no randomness, no I/O.

import {
  classifyOutcomeReading,
  type OutcomeSeverity,
  type ExecutiveAction,
} from '@/lib/tower/taxonomy/outcome-taxonomy';
import type {
  OutcomeLedgerEntryView,
  OutcomeLedgerView,
} from './types';

// ---------------------------------------------------------------------
// Public view-model shapes
// ---------------------------------------------------------------------

/**
 * The adoption signal for a tenant. `state` is `unknown` whenever the
 * outcome ledger carries no adoption telemetry — the ledger holds value
 * claims, not active-user counts, so adoption can only be reported once
 * a future slice binds `operating_telemetry`.
 */
export type AdoptionSignalState = 'unknown' | 'on_track' | 'watch' | 'at_risk' | 'critical';

export interface TowerAdoptionSignal {
  /** Coarse adoption posture; `unknown` until adoption telemetry is bound. */
  readonly state: AdoptionSignalState;
  /** Plain-English line a CXO reads at a glance. */
  readonly headline: string;
  /**
   * Why adoption matters here — the executive stake. Sourced verbatim
   * from the Slice 0.3 `adoption` concept definition.
   */
  readonly whyItMatters: string;
  /**
   * The implied executive action, or `null` when adoption is `unknown`
   * (no reading to classify — the gap itself is the finding).
   */
  readonly impliedAction: ExecutiveAction | null;
  /** True when the signal is `unknown` because telemetry is not bound. */
  readonly instrumentationGap: boolean;
}

/**
 * The benefit-realization signal: how much of the portfolio's projected
 * value is actually being earned, expressed as a 0..1 realization ratio
 * plus its classified severity band.
 */
export interface TowerValueRealizationSignal {
  /** Severity band for the realization ratio (0.75+ on track, etc.). */
  readonly severity: OutcomeSeverity;
  /**
   * Realized verified-and-evidenced value as a share of total projected
   * value (0..1). `null` when there is no projected value to divide by.
   */
  readonly realizationRatio: number | null;
  /** Sum of `projectedAmount` over all current ledger entries. */
  readonly totalProjectedAmount: number;
  /**
   * Sum of `realizedAmount` over entries that are BOTH verified-tier and
   * evidence-backed — the only value Tower treats as defensibly earned.
   */
  readonly earnedVerifiedAmount: number;
  /**
   * Sum of `realizedAmount` over verified-tier entries that carry no
   * evidence — value claimed as earned but not defensible.
   */
  readonly unevidencedVerifiedAmount: number;
  /** Count of entries still at `projected` tier (no measurement yet). */
  readonly projectedTierCount: number;
  /** Count of entries at `tracked` tier (measurement in motion). */
  readonly trackedTierCount: number;
  /** Count of entries at `verified` tier (measured result exists). */
  readonly verifiedTierCount: number;
  /** Plain-English line a CXO reads at a glance. */
  readonly headline: string;
  /** The implied executive action for the realization band. */
  readonly impliedAction: ExecutiveAction;
}

/**
 * The Slice 3.4 adoption + value-realization read model for one tenant.
 * Derived purely from the Slice 3.1 outcome ledger view.
 */
export interface TowerAdoptionRealizationView {
  readonly tenantClientKey: string;
  readonly adoption: TowerAdoptionSignal;
  readonly valueRealization: TowerValueRealizationSignal;
  /**
   * The single line Tower can render on a card / in the executive brief
   * to answer "is this program actually earning?".
   */
  readonly earningSummary: string;
}

// ---------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------

const ADOPTION_WHY_IT_MATTERS =
  'Value cannot be realized without adoption; low adoption strands the entire investment.';

// ---------------------------------------------------------------------
// Pure builders
// ---------------------------------------------------------------------

function isEarned(entry: OutcomeLedgerEntryView): boolean {
  return (
    entry.valueTier === 'verified' &&
    entry.evidenceBacked &&
    entry.realizedAmount !== null
  );
}

function formatRatioPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

/**
 * Build the adoption signal. Until a future slice binds
 * `operating_telemetry`, the outcome ledger has no active-user data, so
 * adoption is honestly reported as `unknown` rather than fabricated.
 */
export function buildTowerAdoptionSignal(
  ledger: OutcomeLedgerView,
): TowerAdoptionSignal {
  const hasEntries = ledger.entries.length > 0;
  return {
    state: 'unknown',
    headline: hasEntries
      ? 'Adoption telemetry is not yet bound to the outcome ledger — active-user signal is unavailable.'
      : 'No outcome ledger entries; adoption cannot be assessed.',
    whyItMatters: ADOPTION_WHY_IT_MATTERS,
    impliedAction: null,
    instrumentationGap: true,
  };
}

/**
 * Build the benefit-realization signal from the outcome ledger view.
 *
 * The realization ratio is earned verified-and-evidenced value over
 * total projected value. The ratio is fed into the Slice 0.3
 * `classifyOutcomeReading` builder as a `verified_value` reading so the
 * severity band and implied action are derived by the canonical
 * taxonomy rather than re-implemented here.
 */
export function buildTowerValueRealizationSignal(
  ledger: OutcomeLedgerView,
): TowerValueRealizationSignal {
  let totalProjectedAmount = 0;
  let earnedVerifiedAmount = 0;
  let unevidencedVerifiedAmount = 0;

  for (const entry of ledger.entries) {
    totalProjectedAmount += entry.projectedAmount;
    if (isEarned(entry)) {
      earnedVerifiedAmount += entry.realizedAmount ?? 0;
    } else if (
      entry.valueTier === 'verified' &&
      !entry.evidenceBacked &&
      entry.realizedAmount !== null
    ) {
      unevidencedVerifiedAmount += entry.realizedAmount;
    }
  }

  const { projected: projectedTierCount, tracked: trackedTierCount, verified: verifiedTierCount } =
    ledger.summary.byValueTier;

  const realizationRatio =
    totalProjectedAmount > 0
      ? Math.max(0, Math.min(1, earnedVerifiedAmount / totalProjectedAmount))
      : null;

  // Feed the ratio through the canonical taxonomy. A null ratio (no
  // projected value to divide by) classifies at score 0 — there is
  // nothing earning, which is correctly the weakest band. Evidence
  // strength is `verified` because the earned figure is, by
  // construction, only verified-and-evidenced value.
  const classification = classifyOutcomeReading({
    concept: 'verified_value',
    subjectId: ledger.tenantClientKey,
    normalizedScore: realizationRatio ?? 0,
    evidenceStrength: 'verified',
  });

  const headline =
    realizationRatio === null
      ? 'No projected value is recorded in the outcome ledger — realization cannot be computed.'
      : `${formatRatioPercent(realizationRatio)} of projected portfolio value is verified and evidence-backed (${classification.severity.replace('_', ' ')}).`;

  return {
    severity: classification.severity,
    realizationRatio,
    totalProjectedAmount,
    earnedVerifiedAmount,
    unevidencedVerifiedAmount,
    projectedTierCount,
    trackedTierCount,
    verifiedTierCount,
    headline,
    impliedAction: classification.impliedAction,
  };
}

/**
 * Compose the single "is this program actually earning?" line Tower can
 * render on a card or in the executive brief. Deterministic.
 */
export function composeEarningSummary(
  adoption: TowerAdoptionSignal,
  realization: TowerValueRealizationSignal,
): string {
  if (realization.realizationRatio === null) {
    return 'Tower has no projected value to reconcile — the portfolio is not yet instrumented for realized outcomes.';
  }
  const earningClause =
    realization.severity === 'on_track'
      ? 'the portfolio is broadly earning its projection'
      : realization.severity === 'critical'
        ? 'the portfolio is materially under-earning its projection'
        : 'the portfolio is only partially earning its projection';
  const unevidencedClause =
    realization.unevidencedVerifiedAmount > 0
      ? ` ${realization.unevidencedVerifiedAmount.toLocaleString('en-US')} of claimed value is verified-tier but unevidenced and should be challenged.`
      : '';
  const adoptionClause = adoption.instrumentationGap
    ? ' Adoption telemetry is not yet bound, so earned value cannot be tied to active usage.'
    : '';
  return `At ${formatRatioPercent(realization.realizationRatio)} realization, ${earningClause}.${unevidencedClause}${adoptionClause}`;
}

/**
 * Build the full Slice 3.4 adoption + value-realization view model from
 * a Slice 3.1 outcome ledger view. Pure re-projection — no new I/O.
 */
export function buildTowerAdoptionRealizationView(
  ledger: OutcomeLedgerView,
): TowerAdoptionRealizationView {
  const adoption = buildTowerAdoptionSignal(ledger);
  const valueRealization = buildTowerValueRealizationSignal(ledger);
  return {
    tenantClientKey: ledger.tenantClientKey,
    adoption,
    valueRealization,
    earningSummary: composeEarningSummary(adoption, valueRealization),
  };
}
