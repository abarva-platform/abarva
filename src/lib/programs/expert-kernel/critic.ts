// Expert Kernel — critic.
//
// Before a business case is finalised the critic runs three adversarial
// challenges and surfaces what it finds. Findings are NEVER hidden — a case
// that survives the critic carries its findings forward as caveats.
//
//   - CFO challenge      — is the return real, or optimism dressed up?
//   - Delivery challenge — can this actually be built for that effort?
//   - Data challenge     — does the case rest on data that exists?
//
// Pure module: deterministic, no I/O. It inspects already-built kernel
// artifacts; it does not re-estimate.

import type { BaselineModel } from './baseline-model';
import type { AssumptionLedger } from './assumption-ledger';
import type { EffortEstimate } from './effort-estimator';
import type { ValueForecast } from './value-forecast';

export type CriticLens = 'cfo' | 'delivery' | 'data';
export type CriticSeverity = 'blocker' | 'concern' | 'note';

export interface CriticFinding {
  lens: CriticLens;
  severity: CriticSeverity;
  /** Stable key for the finding. */
  code: string;
  /** What the critic found. */
  message: string;
}

export interface CriticInput {
  baseline: BaselineModel;
  assumptions: AssumptionLedger;
  effort: EffortEstimate;
  value: ValueForecast;
}

export interface CriticReport {
  findings: CriticFinding[];
  blockers: CriticFinding[];
  concerns: CriticFinding[];
  notes: CriticFinding[];
  /** True when at least one blocker was raised. */
  hasBlocker: boolean;
}

/** CFO challenge: is the return real? */
function cfoChallenge(input: CriticInput): CriticFinding[] {
  const out: CriticFinding[] = [];
  const { value, effort } = input;

  if (value.monetisationBlocked) {
    out.push({
      lens: 'cfo',
      severity: 'blocker',
      code: 'cfo_monetisation_blocked',
      message:
        'Value cannot be monetised to a hard dollar figure — the gross ' +
        'value range rests on a seed-gap proxy. The CFO will not approve a ' +
        'fabricated return; the case must close the baseline gap first.',
    });
  }

  // A net forecast that barely clears effort is a thin case.
  const netLow = value.totalNetValue.low;
  const effortHigh = effort.totalCost.high;
  if (netLow < effortHigh) {
    out.push({
      lens: 'cfo',
      severity: 'concern',
      code: 'cfo_downside_underwater',
      message:
        `Downside net value (${netLow}) is below conservative effort ` +
        `(${effortHigh}) — in the pessimistic case the Move does not pay ` +
        'back. The CFO will ask what protects the floor.',
    });
  }

  if (value.totalHaircut < 0.1) {
    out.push({
      lens: 'cfo',
      severity: 'concern',
      code: 'cfo_haircut_too_light',
      message:
        `The value haircut is only ${Math.round(value.totalHaircut * 100)}% ` +
        '— unusually light. Either the Move is exceptionally de-risked or ' +
        'the haircut scores are optimistic. Pressure-test the scores.',
    });
  }
  return out;
}

/** Delivery challenge: can it be built for that effort? */
function deliveryChallenge(input: CriticInput): CriticFinding[] {
  const out: CriticFinding[] = [];
  const { effort } = input;

  const hasChange = effort.workstreams.some(
    (w) => w.id === 'change_adoption' && w.baseCost > 0,
  );
  if (!hasChange) {
    out.push({
      lens: 'delivery',
      severity: 'concern',
      code: 'delivery_no_change_effort',
      message:
        'No change & adoption effort is budgeted. Value depends on users ' +
        'changing behaviour — a build with zero change budget routinely ' +
        'under-delivers on the adoption curve.',
    });
  }

  const hasRun = effort.workstreams.some(
    (w) => w.id === 'run' && w.baseCost > 0,
  );
  if (!hasRun) {
    out.push({
      lens: 'delivery',
      severity: 'concern',
      code: 'delivery_no_run_cost',
      message:
        'No run (year-1 operations) effort is budgeted. The case may be ' +
        'understating ongoing cost — investment is not just the build.',
    });
  }

  // An implausibly high agent split on human-heavy workstreams.
  for (const w of effort.workstreams) {
    if (
      (w.id === 'change_adoption' || w.id === 'process_redesign') &&
      w.agentSplit > 0.4
    ) {
      out.push({
        lens: 'delivery',
        severity: 'concern',
        code: 'delivery_optimistic_agent_split',
        message:
          `Workstream '${w.label}' assumes a ${Math.round(w.agentSplit * 100)}% ` +
          'AI-agent split — change and process work is human-led; this is ' +
          'an optimistic automation assumption.',
      });
    }
  }
  return out;
}

/** Data challenge: does the case rest on data that exists? */
function dataChallenge(input: CriticInput): CriticFinding[] {
  const out: CriticFinding[] = [];
  const { baseline, assumptions } = input;

  if (baseline.seedGaps.length > 0) {
    out.push({
      lens: 'data',
      severity: baseline.coverage < 0.6 ? 'blocker' : 'concern',
      code: 'data_baseline_seed_gaps',
      message:
        `${baseline.seedGaps.length} baseline metric(s) are seed gaps ` +
        `(coverage ${Math.round(baseline.coverage * 100)}%): ` +
        `${baseline.seedGaps.map((g) => g.label).join(', ')}. ` +
        'The case is grounded only on what is recorded.',
    });
  }

  if (baseline.weakestConfidence === 'low') {
    out.push({
      lens: 'data',
      severity: 'concern',
      code: 'data_low_confidence_baseline',
      message:
        'At least one recorded baseline metric is low-confidence — the ' +
        'starting point itself is uncertain.',
    });
  }

  const proxyMovers = assumptions.topMovers.filter((a) => a.isSeedGapProxy);
  if (proxyMovers.length > 0) {
    out.push({
      lens: 'data',
      severity: 'concern',
      code: 'data_top_mover_is_proxy',
      message:
        `${proxyMovers.length} of the top-3 case-moving assumptions stand in ` +
        `for absent tenant data (${proxyMovers
          .map((a) => a.key)
          .join(', ')}). Validating these is the highest-leverage next step.`,
    });
  }
  return out;
}

/** Run all three challenges and assemble the report. */
export function runCritic(input: CriticInput): CriticReport {
  const findings: CriticFinding[] = [
    ...cfoChallenge(input),
    ...deliveryChallenge(input),
    ...dataChallenge(input),
  ];
  const blockers = findings.filter((f) => f.severity === 'blocker');
  const concerns = findings.filter((f) => f.severity === 'concern');
  const notes = findings.filter((f) => f.severity === 'note');
  return {
    findings,
    blockers,
    concerns,
    notes,
    hasBlocker: blockers.length > 0,
  };
}
