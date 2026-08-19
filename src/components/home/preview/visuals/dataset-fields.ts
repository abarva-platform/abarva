import { formatCompactNumber, formatCompactUsd, formatPercent } from "./home-chart-kit";

/**
 * Which row fields to plot for each known dataset_ref, and how to format the value axis. This is
 * a small, explicit lookup rather than a heuristic ("guess the first string field is the label")
 * because the whole point of the governed visual contract is that nothing about what gets plotted
 * is inferred -- the generator names a dataset_ref, the deterministic compiler built its rows, and
 * this is the one further step (which named field is the label, which is the value) that's still
 * safe to hardcode because it's keyed to a specific, known dataset shape, not guessed per-row.
 *
 * A dataset_ref that isn't in this table yet isn't a bug -- it's a new deterministic dataset the
 * generator started proposing that this table hasn't been extended for. The visual dispatcher
 * falls back to a labeled data table rather than silently dropping it (see GovernedVisual).
 */
export interface DatasetFieldConfig {
  labelKey: string;
  valueKey: string;
  valueLabel: string;
  format: (value: number) => string;
  /** A second numeric/text field worth surfacing in the tooltip, if present (e.g. a share
   * percentage alongside a raw spend figure). */
  secondaryKey?: string;
}

export const DATASET_FIELD_CONFIG: Record<string, DatasetFieldConfig> = {
  vendor_spend_concentration: {
    labelKey: "vendor",
    valueKey: "spend",
    valueLabel: "Annual spend",
    format: formatCompactUsd,
    secondaryKey: "sharePct",
  },
  leadership_evidence_alignment: {
    labelKey: "category",
    valueKey: "count",
    valueLabel: "Interview responses",
    format: formatCompactNumber,
  },
  stalled_programs: {
    labelKey: "program",
    valueKey: "pctComplete",
    valueLabel: "Percent complete",
    format: formatPercent,
  },
  risk_system_concentration: {
    labelKey: "system",
    valueKey: "riskCount",
    valueLabel: "Linked risk entries",
    format: formatCompactNumber,
  },
};

/** Best-effort inference for a dataset_ref not yet in DATASET_FIELD_CONFIG: first string-valued
 * field as the label, first number-valued field as the value. Used only to decide whether the
 * fallback table (see GovernedVisual) can still show a labeled chart-like list, or must fall back
 * further to raw rows -- never used to silently plot an unconfigured dataset as if it were fully
 * governed. */
export function inferFieldConfig(rows: Array<Record<string, unknown>>): DatasetFieldConfig | null {
  const sample = rows[0];
  if (!sample) return null;
  const labelKey = Object.keys(sample).find((k) => typeof sample[k] === "string");
  const valueKey = Object.keys(sample).find((k) => typeof sample[k] === "number");
  if (!labelKey || !valueKey) return null;
  return { labelKey, valueKey, valueLabel: valueKey, format: formatCompactNumber };
}
