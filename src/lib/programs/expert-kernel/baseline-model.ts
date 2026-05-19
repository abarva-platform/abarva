// Expert Kernel — baseline-model.
//
// Models the current-state of a Move: each metric carries its source,
// source-quality, as-of date, and confidence. Metrics that are NOT seeded are
// recorded honestly as `not_recorded` with an explicit seed-gap reason — they
// are never given a fabricated value.
//
// Pure module: deterministic, no I/O.

import type { Confidence, SourceQuality } from './types';

/** A single current-state metric. */
export interface BaselineMetricInput {
  /** Stable key, e.g. 'aht_minutes'. */
  key: string;
  /** Human label, e.g. 'Average Handle Time'. */
  label: string;
  /** Current measured value, or null when the metric is not recorded. */
  value: number | null;
  /** Unit of the value, e.g. 'minutes', 'percent', 'usd'. */
  unit: string;
  /** Where the value came from, e.g. 'KPI kpi:apex:019 (NICE CXone)'. */
  source: string;
  sourceQuality: SourceQuality;
  /** ISO date the value was last measured / asserted. */
  asOf: string;
  confidence: Confidence;
  /** Optional caveat the kernel must carry forward (e.g. sampling bias). */
  caveat?: string;
  /** When `value` is null, the reason the metric is missing. Required then. */
  seedGapReason?: string;
}

/** A resolved baseline metric — either recorded or an explicit gap. */
export interface BaselineMetric extends BaselineMetricInput {
  /** True when the metric has a usable value; false when it is a seed gap. */
  recorded: boolean;
}

export interface BaselineModelInput {
  moveName: string;
  /** Tenant the baseline belongs to, e.g. 'apex-retail'. */
  tenantKey: string;
  metrics: BaselineMetricInput[];
}

export interface BaselineModel {
  moveName: string;
  tenantKey: string;
  metrics: BaselineMetric[];
  /** Metrics with usable values. */
  recordedMetrics: BaselineMetric[];
  /** Metrics that are seed gaps. */
  seedGaps: BaselineMetric[];
  /** Fraction (0..1) of metrics that are recorded — a readiness signal. */
  coverage: number;
  /** Worst-case confidence across recorded metrics. */
  weakestConfidence: Confidence | null;
}

const CONFIDENCE_RANK: Record<Confidence, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

/**
 * Build a baseline model. Throws if a metric claims to be missing (null value)
 * without a seed-gap reason, or claims a value while flagged `absent`.
 */
export function buildBaselineModel(
  input: BaselineModelInput,
): BaselineModel {
  const metrics: BaselineMetric[] = input.metrics.map((m) => {
    const recorded = m.value !== null;
    if (!recorded && !m.seedGapReason) {
      throw new Error(
        `Baseline metric '${m.key}' has no value and no seedGapReason — ` +
          'missing data must be declared a seed gap, never left blank.',
      );
    }
    if (recorded && m.sourceQuality === 'absent') {
      throw new Error(
        `Baseline metric '${m.key}' has a value but sourceQuality 'absent' — ` +
          'a recorded metric cannot also be a seed gap.',
      );
    }
    return { ...m, recorded };
  });

  const recordedMetrics = metrics.filter((m) => m.recorded);
  const seedGaps = metrics.filter((m) => !m.recorded);
  const coverage =
    metrics.length === 0
      ? 0
      : Math.round((recordedMetrics.length / metrics.length) * 100) / 100;

  let weakestConfidence: Confidence | null = null;
  for (const m of recordedMetrics) {
    if (
      weakestConfidence === null ||
      CONFIDENCE_RANK[m.confidence] < CONFIDENCE_RANK[weakestConfidence]
    ) {
      weakestConfidence = m.confidence;
    }
  }

  return {
    moveName: input.moveName,
    tenantKey: input.tenantKey,
    metrics,
    recordedMetrics,
    seedGaps,
    coverage,
    weakestConfidence,
  };
}

/** Look up a recorded metric by key; returns null if absent or a seed gap. */
export function recordedMetric(
  model: BaselineModel,
  key: string,
): BaselineMetric | null {
  return model.recordedMetrics.find((m) => m.key === key) ?? null;
}
