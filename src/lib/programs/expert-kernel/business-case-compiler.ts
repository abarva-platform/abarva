// Expert Kernel — business-case-compiler.
//
// Assembles the kernel modules — baseline + effort + run cost + change effort
// + value forecast + risk — into a CFO-readable business-case skeleton with
// all eight required elements (§11.2):
//
//   1. Baseline facts (or explicit seed gaps)
//   2. Value range
//   3. Cost / effort range
//   4. Named assumptions
//   5. Sensitivity (base/conservative/upside + what-breaks-the-case + the 3
//      assumptions that move 80%)
//   6. Kill criteria
//   7. Recommendation (fund / shape / kill)
//   8. Tower measurement handoff
//
// It runs the critic before finalising and folds the findings into the
// recommendation — a blocker downgrades "fund" to "shape".
//
// Pure module: deterministic, no I/O.

import type { BaselineModel } from './baseline-model';
import type { AssumptionLedger, Assumption } from './assumption-ledger';
import type { EffortEstimate } from './effort-estimator';
import type { ValueForecast } from './value-forecast';
import { runCritic, type CriticReport } from './critic';
import { round2, type Range } from './types';

export type Recommendation = 'fund' | 'shape' | 'kill';

/** A measurement the Tower will track once the Move is funded. */
export interface TowerMeasurementHandoff {
  /** The baseline metric key the outcome is measured against. */
  metricKey: string;
  metricLabel: string;
  /** Current baseline value, or null when it is a seed gap to close first. */
  baselineValue: number | null;
  /** Target value the Move commits to. */
  targetValue: number | null;
  unit: string;
  /** What must be true for this to be measurable (e.g. close a seed gap). */
  readinessNote: string;
}

export interface KillCriterion {
  code: string;
  /** The condition that, if true, kills or re-shapes the Move. */
  condition: string;
}

export interface SensitivityView {
  base: Range;
  conservative: Range;
  upside: Range;
  /** Plain statement of what would break the case. */
  whatBreaksTheCase: string;
  /** The (up to) three assumptions that move ~80% of the case. */
  topMovers: Assumption[];
}

export interface BusinessCaseSkeleton {
  moveName: string;
  tenantKey: string;
  /** 1 — baseline facts and explicit seed gaps. */
  baseline: BaselineModel;
  /** 2 — value range (net, post-haircut). */
  valueRange: Range;
  /** 3 — cost / effort range. */
  effortRange: Range;
  /** The full effort estimate (per-workstream detail for the in-app view). */
  effort: EffortEstimate;
  /** 4 — named assumptions. */
  assumptions: AssumptionLedger;
  /** 5 — sensitivity. */
  sensitivity: SensitivityView;
  /** 6 — kill criteria. */
  killCriteria: KillCriterion[];
  /** 7 — recommendation. */
  recommendation: Recommendation;
  recommendationRationale: string;
  /** 8 — Tower measurement handoff. */
  towerHandoff: TowerMeasurementHandoff[];
  /** Investment / return economics. */
  economics: {
    investment: Range;
    netReturn: Range;
    /** Payback in months at the base case, or null when not monetisable. */
    paybackMonths: number | null;
    monetisable: boolean;
  };
  /** The critic report — surfaced, never hidden. */
  critic: CriticReport;
}

export interface BusinessCaseCompilerInput {
  baseline: BaselineModel;
  assumptions: AssumptionLedger;
  effort: EffortEstimate;
  value: ValueForecast;
  /** Tower handoff metric definitions. */
  towerHandoff: TowerMeasurementHandoff[];
  /** Additional kill criteria specific to this Move. */
  extraKillCriteria?: KillCriterion[];
}

/**
 * Compile the business-case skeleton. Deterministic — runs the critic and
 * folds its findings into the recommendation.
 */
export function compileBusinessCase(
  input: BusinessCaseCompilerInput,
): BusinessCaseSkeleton {
  const { baseline, assumptions, effort, value, towerHandoff } = input;

  const critic = runCritic({ baseline, assumptions, effort, value });

  const effortRange: Range = {
    low: effort.totalCost.low,
    point: effort.totalCost.point,
    high: effort.totalCost.high,
  };
  const valueRange: Range = {
    low: value.totalNetValue.low,
    point: value.totalNetValue.point,
    high: value.totalNetValue.high,
  };

  // Economics. Investment = conservative effort (CFO funds the high case).
  // Net return = net value minus base effort.
  const investment: Range = {
    low: effortRange.low,
    point: effortRange.point,
    high: effortRange.high,
  };
  const netReturn: Range = {
    low: round2(valueRange.low - effortRange.high),
    point: round2(valueRange.point - effortRange.point),
    high: round2(valueRange.high - effortRange.low),
  };
  const monetisable = !value.monetisationBlocked;
  // Payback: months until cumulative net value covers base effort.
  let paybackMonths: number | null = null;
  if (monetisable && value.totalNetValue.point > 0) {
    const annualNet = value.totalNetValue.point / value.curve.length;
    if (annualNet > 0) {
      paybackMonths = round2((effortRange.point / annualNet) * 12);
    }
  }

  // Sensitivity.
  const sensitivity: SensitivityView = {
    base: { low: netReturn.point, point: netReturn.point, high: netReturn.point },
    conservative: {
      low: netReturn.low,
      point: netReturn.low,
      high: netReturn.low,
    },
    upside: { low: netReturn.high, point: netReturn.high, high: netReturn.high },
    whatBreaksTheCase: buildWhatBreaks(value, critic),
    topMovers: assumptions.topMovers,
  };

  // Kill criteria — derived plus Move-specific.
  const killCriteria: KillCriterion[] = [
    {
      code: 'kill_downside_negative',
      condition:
        `Net return is negative in the conservative case ` +
        `(${netReturn.low}). Kill or re-shape if the downside cannot be ` +
        'lifted above zero.',
    },
    ...(value.monetisationBlocked
      ? [
          {
            code: 'kill_monetisation_unresolved',
            condition:
              'The baseline seed gap that blocks monetisation is not closed ' +
              'before the gate — without it the return is unverifiable.',
          },
        ]
      : []),
    ...(baseline.seedGaps.length > 0
      ? [
          {
            code: 'kill_baseline_unclosed',
            condition:
              `Baseline coverage stays below acceptable level — ` +
              `${baseline.seedGaps.length} seed gap(s) remain unresolved at ` +
              'the gate.',
          },
        ]
      : []),
    ...(input.extraKillCriteria ?? []),
  ];

  // Recommendation. Start optimistic, then let the critic and economics
  // pull it down.
  let recommendation: Recommendation = 'fund';
  let rationale: string;
  if (netReturn.point <= 0) {
    recommendation = 'kill';
    rationale =
      'Base-case net return is not positive — the Move does not pay back ' +
      'on current assumptions.';
  } else if (critic.hasBlocker) {
    recommendation = 'shape';
    rationale =
      `The critic raised ${critic.blockers.length} blocker(s) — fund only ` +
      'after they are resolved (see critic findings). Re-shape the Move to ' +
      'close them, do not fund as-is.';
  } else if (netReturn.low < 0 || critic.concerns.length >= 3) {
    recommendation = 'shape';
    rationale =
      'The base case is positive but the downside is exposed or the critic ' +
      `raised ${critic.concerns.length} concerns — shape the Move to ` +
      'protect the floor before funding.';
  } else {
    recommendation = 'fund';
    rationale =
      'Base-case net return is positive, the downside holds, and the critic ' +
      'raised no blockers — fund, with the named assumptions tracked.';
  }

  return {
    moveName: baseline.moveName,
    tenantKey: baseline.tenantKey,
    baseline,
    valueRange,
    effortRange,
    effort,
    assumptions,
    sensitivity,
    killCriteria,
    recommendation,
    recommendationRationale: rationale,
    towerHandoff,
    economics: { investment, netReturn, paybackMonths, monetisable },
    critic,
  };
}

function buildWhatBreaks(
  value: ValueForecast,
  critic: CriticReport,
): string {
  if (value.monetisationBlocked) {
    return (
      'The case breaks if the baseline seed gap is not closed — without the ' +
      'missing unit economics the value range is a proxy, not a forecast.'
    );
  }
  if (critic.hasBlocker) {
    return (
      'The case breaks on the critic blocker(s): ' +
      critic.blockers.map((b) => b.message).join(' ')
    );
  }
  const worstFactor = [...value.factors].sort(
    (a, b) => b.discountContribution - a.discountContribution,
  )[0];
  return (
    'The case breaks if adoption falls short of the modelled curve, or if ' +
    `the largest haircut driver (${worstFactor.dimension}) worsens — it ` +
    `already discounts ${Math.round(worstFactor.discountContribution * 100)}% ` +
    'of gross value.'
  );
}
