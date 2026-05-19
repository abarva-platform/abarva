// Expert Kernel — value-measurement model → Tower handoff.
//
// This module closes the loop the spec promises (§4, §8): Moves hands Tower a
// MEASUREMENT MODEL so realized value can later be compared against the
// forecast. forecast → realized comparison is the calibration flywheel
// (spec §7, post-outcome calibration).
//
// It does two things:
//   1. Builds a measurement spec — each committed value metric WIRED to a
//      Discover baseline value, with a target, a cadence, and a named owner.
//   2. Projects that spec into the Tower outcome ledger's row shape
//      (`OutcomeLedgerRow`) so the Tower outcome ledger can ingest it
//      directly. This module READS Tower's types; it does not restructure
//      Tower modules.
//
// Honesty: a metric whose baseline is a Discover seed gap is NOT silently
// dropped — it is carried with `wired: false` and an explicit readiness note,
// and it blocks the go-decision until the baseline is captured.
//
// Pure module: deterministic, no I/O.

import type { BaselineModel } from './baseline-model';
import { recordedMetric } from './baseline-model';
import type {
  ValueLedgerCategory,
  ValueMeasurementUnit,
} from '@/lib/tower/ai-value-outcome-ledger';
import type {
  OutcomeLedgerRow,
  OutcomeSubjectKind,
} from '@/lib/tower/outcome-ledger/types';

/** How often a measurement is taken once the Move is live. */
export type MeasurementCadence = 'weekly' | 'monthly' | 'quarterly';

/** One committed value metric the Move will be measured on. */
export interface MeasurementMetricInput {
  /**
   * The Discover baseline metric key this measurement is anchored to. The
   * baseline value is read from the baseline model — never restated here.
   */
  baselineMetricKey: string;
  /** Human label for the metric. */
  label: string;
  /** Target value the Move commits to. Null when not yet committable. */
  targetValue: number | null;
  /** Tower value category this measurement rolls up into. */
  valueCategory: ValueLedgerCategory;
  /** Tower measurement unit. */
  measurementUnit: ValueMeasurementUnit;
  cadence: MeasurementCadence;
  /** Named role accountable for taking the measurement post-go-live. */
  measurementOwnerRole: string;
  /**
   * Optional dated plan to capture an absent baseline, e.g.
   * 'cost-per-contact baseline due 2026-05-15 (Brendan Fox)'. Required to
   * keep an unrecorded-baseline metric in the spec rather than dropping it.
   */
  baselineCapturePlan?: string;
}

/** A resolved measurement metric — wired to a baseline or flagged. */
export interface MeasurementMetric {
  baselineMetricKey: string;
  label: string;
  /** The baseline value read from the Discover baseline model, or null. */
  baselineValue: number | null;
  baselineUnit: string;
  targetValue: number | null;
  valueCategory: ValueLedgerCategory;
  measurementUnit: ValueMeasurementUnit;
  cadence: MeasurementCadence;
  measurementOwnerRole: string;
  /** True when the metric is wired to a recorded baseline value. */
  wired: boolean;
  /** Plain readiness note — what Tower must know to measure this honestly. */
  readinessNote: string;
}

export interface MeasurementHandoffInput {
  moveName: string;
  /** Tenant client key, e.g. 'apex-retail'. */
  tenantClientKey: string;
  /** The Discover baseline model — measurements wire to its metrics. */
  baseline: BaselineModel;
  /** What kind of decision artifact the value attaches to. */
  subjectKind: OutcomeSubjectKind;
  /** Stable Move reference Tower keys the ledger entries on. */
  subjectRef: string;
  metrics: MeasurementMetricInput[];
}

/**
 * The measurement model plus its projection into Tower's row shape. The
 * `towerRows` are ready for the Tower outcome ledger to ingest.
 */
export interface MeasurementHandoff {
  moveName: string;
  tenantClientKey: string;
  metrics: MeasurementMetric[];
  /** Metrics wired to a recorded baseline. */
  wiredMetrics: MeasurementMetric[];
  /** Metrics whose baseline is a seed gap — block the go-decision. */
  unwiredMetrics: MeasurementMetric[];
  /** Fraction (0..1) of metrics wired to a real baseline. */
  wiringCoverage: number;
  /** True when every committed metric is wired — the loop fully closes. */
  loopCloses: boolean;
  /** The Tower outcome-ledger rows, ready to ingest. */
  towerRows: OutcomeLedgerRow[];
}

/**
 * Build the value-measurement model and project it into Tower's row shape.
 * Deterministic. Throws when a metric references a baseline key that does not
 * exist, or an unrecorded-baseline metric has no capture plan.
 */
export function buildMeasurementHandoff(
  input: MeasurementHandoffInput,
): MeasurementHandoff {
  if (input.metrics.length === 0) {
    throw new Error(
      'A measurement handoff needs at least one committed metric — the ' +
        'value loop cannot close with nothing to measure.',
    );
  }

  const metrics: MeasurementMetric[] = input.metrics.map((m) => {
    // The metric must reference a baseline metric that actually exists in
    // the Discover baseline model — recorded OR a declared seed gap.
    const declared = input.baseline.metrics.find(
      (b) => b.key === m.baselineMetricKey,
    );
    if (!declared) {
      throw new Error(
        `Measurement metric '${m.label}' references baseline key ` +
          `'${m.baselineMetricKey}' which is not in the Discover baseline ` +
          'model — a measurement cannot be wired to a metric that was ' +
          'never captured or declared.',
      );
    }
    const recorded = recordedMetric(input.baseline, m.baselineMetricKey);
    const wired = recorded !== null;

    if (!wired && !m.baselineCapturePlan) {
      throw new Error(
        `Measurement metric '${m.label}' has no recorded baseline and no ` +
          'baselineCapturePlan — an unwired metric must carry a dated ' +
          'plan to capture its baseline, never be handed off blind.',
      );
    }

    const readinessNote = wired
      ? `Wired to Discover baseline '${declared.label}' ` +
        `(${recorded?.value} ${declared.unit}, ${recorded?.sourceQuality}). ` +
        `Measure ${m.cadence}; owner ${m.measurementOwnerRole}.`
      : `SEED GAP — baseline '${declared.label}' is not recorded. ` +
        `Not measurable until captured: ${m.baselineCapturePlan}. Tower ` +
        'cannot verify realized value for this metric before then.';

    return {
      baselineMetricKey: m.baselineMetricKey,
      label: m.label,
      baselineValue: recorded?.value ?? null,
      baselineUnit: declared.unit,
      targetValue: m.targetValue,
      valueCategory: m.valueCategory,
      measurementUnit: m.measurementUnit,
      cadence: m.cadence,
      measurementOwnerRole: m.measurementOwnerRole,
      wired,
      readinessNote,
    };
  });

  const wiredMetrics = metrics.filter((m) => m.wired);
  const unwiredMetrics = metrics.filter((m) => !m.wired);
  const wiringCoverage =
    Math.round((wiredMetrics.length / metrics.length) * 100) / 100;
  const loopCloses = unwiredMetrics.length === 0;

  // Project into Tower's OutcomeLedgerRow shape. A row whose baseline is not
  // yet recorded enters the ledger at `baseline_pending` — Tower's own
  // readiness ladder — so Tower never treats it as a tracked figure.
  const towerRows: OutcomeLedgerRow[] = metrics.map((m, i) => ({
    id: `${input.subjectRef}:measure:${m.baselineMetricKey}`,
    supersedesEntryId: null,
    isCurrent: true,
    tenantClientKey: input.tenantClientKey,
    clientId: null,
    subjectKind: input.subjectKind,
    subjectRef: input.subjectRef,
    subjectLabel: input.moveName,
    // Wired → a baseline exists; unwired → baseline is still pending capture.
    valueRung: m.wired ? 'baseline_set' : 'baseline_pending',
    valueCategory: m.valueCategory,
    measurementUnit: m.measurementUnit,
    // Projected amount is the committed target; 0 when not yet committable.
    projectedAmount: m.targetValue ?? 0,
    realizedAmount: null,
    baselineAmount: m.baselineValue,
    // The counterfactual is only as strong as the baseline behind it.
    counterfactualConfidence: m.wired ? 'medium' : 'low',
    governanceReviewStatus: 'not_started',
    measurementOwnerRole: m.measurementOwnerRole,
    evidencePointer: `moves:${input.subjectRef}:measurement-spec`,
    evidenceClaimIds: [],
    note: m.readinessNote,
    recordedBy: 'moves-expert-kernel',
    // Deterministic, ordinal recordedAt — no clock. Tower sorts on this.
    recordedAt: `seed:${String(i).padStart(3, '0')}`,
  }));

  return {
    moveName: input.moveName,
    tenantClientKey: input.tenantClientKey,
    metrics,
    wiredMetrics,
    unwiredMetrics,
    wiringCoverage,
    loopCloses,
    towerRows,
  };
}
