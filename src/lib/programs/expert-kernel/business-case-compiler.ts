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
import type { BuildVsChangeSplit, EffortEstimate } from './effort-estimator';
import type { AiOpsCostEstimate } from './ai-ops-cost';
import type { ValueForecast } from './value-forecast';
import type { Roadmap } from './roadmap';
import type { RaciMatrix } from './raci';
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
  /** AI operating-cost estimate, when the Move supplied run-cost inputs. */
  aiOpsCost: AiOpsCostEstimate | null;
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
  const aiOpsPoint = effort.aiOpsCost?.threeYearTotal ?? 0;
  const valueRange: Range = {
    low: value.totalNetValue.low,
    point: value.totalNetValue.point,
    high: value.totalNetValue.high,
  };

  // Economics. Investment = conservative effort (CFO funds the high case).
  // Net return = net value minus base effort.
  const investment: Range = {
    low: round2(effortRange.low + aiOpsPoint),
    point: round2(effortRange.point + aiOpsPoint),
    high: round2(effortRange.high + aiOpsPoint),
  };
  const netReturn: Range = {
    low: round2(valueRange.low - investment.high),
    point: round2(valueRange.point - investment.point),
    high: round2(valueRange.high - investment.low),
  };
  const monetisable = !value.monetisationBlocked;
  // Payback: months until cumulative net value covers base effort.
  let paybackMonths: number | null = null;
  if (monetisable && value.totalNetValue.point > 0) {
    const annualNet = value.totalNetValue.point / value.curve.length;
    if (annualNet > 0) {
      paybackMonths = round2((investment.point / annualNet) * 12);
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
    aiOpsCost: effort.aiOpsCost,
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

// ===========================================================================
// FULL costed business case — the Design & Plan deliverable.
//
// The skeleton above is the Charter-phase output. The full case below is
// assembled from the costed ROADMAP + value-forecast + baseline + RACI, and
// adds: a per-phase investment/return profile, a three-scenario sensitivity
// (base / conservative / upside) with the explicit "what breaks the case" and
// the three 80%-mover assumptions, and the fund / shape / kill recommendation.
// ===========================================================================

/** The three CFO scenarios, fully costed. */
export interface ScenarioEconomics {
  /** Total investment for the scenario (effort range bound). */
  investment: number;
  /** Net value over the horizon for the scenario. */
  netValue: number;
  /** Net return = net value - investment. */
  netReturn: number;
  /** Return on investment (netReturn / investment), or null if not monetisable. */
  roi: number | null;
  /** Payback in months, or null when not monetisable / never pays back. */
  paybackMonths: number | null;
}

/** CFO-grade three-scenario sensitivity (spec §5.1). */
export interface FullSensitivity {
  base: ScenarioEconomics;
  /** Conservative: high effort, low value. */
  conservative: ScenarioEconomics;
  /** Upside: low effort, high value. */
  upside: ScenarioEconomics;
  /** What single thing breaks the case. */
  whatBreaksTheCase: string;
  /** The (up to) three assumptions that move ~80% of the outcome. */
  topThreeMovers: Assumption[];
  /** Plain read of the conservative case — is the floor survivable? */
  downsideRead: string;
}

/** A per-phase line in the costed business case. */
export interface PhaseInvestmentLine {
  phaseId: string;
  phaseLabel: string;
  /** Phase investment (base cost). */
  investment: number;
  /** Annual value the phase unlocks at steady state. */
  annualValueUnlocked: number;
  /** Cumulative investment through this phase. */
  cumulativeInvestment: number;
  isFoundational: boolean;
  valueMilestone: string;
}

export interface FullBusinessCase {
  moveName: string;
  tenantKey: string;
  /** The Charter-phase skeleton this full case builds on. */
  skeleton: BusinessCaseSkeleton;
  /** The costed roadmap the case is assembled from. */
  roadmap: Roadmap;
  /** The human+agent RACI. */
  raci: RaciMatrix;
  /** Per-phase investment and value profile. */
  phaseProfile: PhaseInvestmentLine[];
  /** Total investment as a base/conservative/upside range. */
  investment: Range;
  /** Net return as a base/conservative/upside range. */
  netReturn: Range;
  /** Payback in months at the base case, or null when not monetisable. */
  paybackMonths: number | null;
  /** AI-build vs. business-change effort split. */
  buildVsChange: BuildVsChangeSplit;
  /** CFO-grade three-scenario sensitivity. */
  sensitivity: FullSensitivity;
  /** fund / shape / kill. */
  recommendation: Recommendation;
  recommendationRationale: string;
  /** Every honesty / structural flag folded in — surfaced, never hidden. */
  flags: string[];
}

export interface FullBusinessCaseInput {
  /** The Charter-phase skeleton (from `compileBusinessCase`). */
  skeleton: BusinessCaseSkeleton;
  roadmap: Roadmap;
  raci: RaciMatrix;
}

/**
 * Compile the full costed business case for the Design & Plan phase.
 * Deterministic. Assembles the roadmap + RACI + skeleton into a CFO-readable
 * case with a three-scenario sensitivity and a fund/shape/kill recommendation.
 *
 * Honesty: a roadmap blocker, a RACI violation, or a blocked monetisation can
 * only ever downgrade the recommendation — never upgrade it.
 */
export function compileFullBusinessCase(
  input: FullBusinessCaseInput,
): FullBusinessCase {
  const { skeleton, roadmap, raci } = input;
  const value = { net: skeleton.valueRange, monetisable: skeleton.economics.monetisable };

  // Investment range — from the roadmap (the roadmap is the costed plan).
  const investment: Range = {
    low: roadmap.totalCost.low,
    point: roadmap.totalCost.point,
    high: roadmap.totalCost.high,
  };

  // Net return per bound: best value vs. best cost, worst vs. worst.
  const netReturn: Range = {
    low: round2(value.net.low - investment.high),
    point: round2(value.net.point - investment.point),
    high: round2(value.net.high - investment.low),
  };

  // Payback — months until cumulative net value covers base investment.
  const horizonYears = skeleton.baseline ? skeleton.effort.workstreams.length : 3;
  let paybackMonths: number | null = null;
  if (value.monetisable && value.net.point > 0) {
    const annualNet = value.net.point / Math.max(1, roadmapHorizon(roadmap));
    if (annualNet > 0) {
      paybackMonths = round2((investment.point / annualNet) * 12);
    }
  }
  void horizonYears;

  // Per-phase profile.
  let cumulative = 0;
  const phaseProfile: PhaseInvestmentLine[] = roadmap.phases.map((p) => {
    cumulative = round2(cumulative + p.baseCost);
    return {
      phaseId: p.id,
      phaseLabel: p.label,
      investment: p.baseCost,
      annualValueUnlocked: p.annualValueUnlocked,
      cumulativeInvestment: cumulative,
      isFoundational: p.isFoundational,
      valueMilestone: p.valueMilestone.statement,
    };
  });

  // Three-scenario sensitivity.
  const scenario = (inv: number, val: number): ScenarioEconomics => {
    const nr = round2(val - inv);
    const horizon = Math.max(1, roadmapHorizon(roadmap));
    const annualNet = val / horizon;
    return {
      investment: inv,
      netValue: val,
      netReturn: nr,
      roi: value.monetisable && inv > 0 ? round2(nr / inv) : null,
      paybackMonths:
        value.monetisable && annualNet > 0 && nr > 0
          ? round2((inv / annualNet) * 12)
          : null,
    };
  };
  const sensitivity: FullSensitivity = {
    base: scenario(investment.point, value.net.point),
    conservative: scenario(investment.high, value.net.low),
    upside: scenario(investment.low, value.net.high),
    whatBreaksTheCase: skeleton.sensitivity.whatBreaksTheCase,
    topThreeMovers: skeleton.assumptions.topMovers,
    downsideRead: buildDownsideRead(netReturn.low, value.monetisable),
  };

  // Collect every flag — roadmap, RACI, critic — into one surfaced list.
  const flags: string[] = [
    ...roadmap.flags.map((f) => `[roadmap/${f.severity}] ${f.message}`),
    ...raci.violations.map((v) => `[raci] ${v.message}`),
    ...skeleton.critic.blockers.map((b) => `[critic/blocker] ${b.message}`),
    ...skeleton.critic.concerns.map((c) => `[critic/concern] ${c.message}`),
  ];

  // Recommendation. Start from the skeleton's, then let roadmap/RACI pull down.
  const roadmapBlocker = roadmap.flags.some((f) => f.severity === 'blocker');
  const raciInvalid = !raci.valid;
  let recommendation: Recommendation = skeleton.recommendation;
  let rationale: string;
  if (sensitivity.base.netReturn <= 0) {
    recommendation = 'kill';
    rationale =
      'Base-case net return is not positive against the costed roadmap — ' +
      'the Move does not pay back. Do not fund.';
  } else if (roadmapBlocker) {
    recommendation = 'shape';
    rationale =
      'The roadmap has a structural blocker (a foundational dependency is ' +
      'unfunded or mis-sequenced, or no phase produces value). Re-shape the ' +
      'roadmap before funding.';
  } else if (raciInvalid) {
    recommendation = 'shape';
    rationale =
      `The RACI matrix has ${raci.violations.length} unresolved honesty ` +
      'violation(s) — the plan is not governable as drawn. Fix accountability ' +
      'before funding.';
  } else if (skeleton.critic.hasBlocker) {
    recommendation = 'shape';
    rationale =
      `The critic raised ${skeleton.critic.blockers.length} blocker(s) — ` +
      'fund only once they are resolved. Re-shape the Move to close them.';
  } else if (sensitivity.conservative.netReturn < 0) {
    recommendation = 'shape';
    rationale =
      'The base case pays back but the conservative case is underwater — ' +
      `net return ${sensitivity.conservative.netReturn} if the top assumptions ` +
      'break together. Shape the scope to protect the floor before funding.';
  } else {
    recommendation = 'fund';
    rationale =
      'Base-case net return is positive against the costed roadmap, the ' +
      'conservative case still pays back, the roadmap is structurally sound ' +
      'and the RACI is governable — fund, with the named assumptions tracked.';
  }

  return {
    moveName: skeleton.moveName,
    tenantKey: skeleton.tenantKey,
    skeleton,
    roadmap,
    raci,
    phaseProfile,
    investment,
    netReturn,
    paybackMonths,
    buildVsChange: skeleton.effort.buildVsChange,
    sensitivity,
    recommendation,
    recommendationRationale: rationale,
    flags,
  };
}

/** Horizon of the roadmap in years (sum of phase durations, min 1). */
function roadmapHorizon(roadmap: Roadmap): number {
  const months = roadmap.phases.reduce((s, p) => s + p.durationMonths, 0);
  return Math.max(1, Math.round(months / 12));
}

function buildDownsideRead(
  conservativeNetReturn: number,
  monetisable: boolean,
): string {
  if (!monetisable) {
    return (
      'The conservative case cannot be expressed in hard dollars — the value ' +
      'rests on a seed-gap proxy. Close the baseline gap before reading the ' +
      'downside as a number.'
    );
  }
  if (conservativeNetReturn < 0) {
    return (
      `Conservative net return is ${conservativeNetReturn} — the floor is ` +
      'underwater. A CFO funds the downside, not the point estimate; this ' +
      'case needs scope protection before it is fundable.'
    );
  }
  return (
    `Conservative net return is ${conservativeNetReturn} — positive even if ` +
    'the top-3 assumptions break together. The floor holds.'
  );
}
