/**
 * The OUTCOME charts / intelligence read model (Increment 3 of the Moves
 * phase-workspace v2 redesign). It sits beside the findings read model
 * (`moves-phase-findings.ts`) and derives the chart SERIES the two intelligence
 * phases render on their OUTCOME step:
 *
 *   • P2 Discover & Diagnose — "Governed share by domain" (horizontal bars,
 *     one per required evidence family) and "Why the current state isn't
 *     trusted" (a root-cause Pareto of the OPEN evidence gaps with a cumulative
 *     line).
 *   • P4 Roadmap & Business case — "Delivery cost scenarios" (low–high range
 *     bars), a "Value bridge" (waterfall) and "Sensitivity" (tornado).
 *
 * HONESTY CONTRACT (AGENTS.md: charts CONSUME governed numbers, they NEVER
 * calculate spend / value / ROI / risk — Tower read models own values):
 *
 *   • The P2 charts are DERIVED from the real `ReadinessReport` — the governed
 *     per-family committed/missing states this Move already computed. They are
 *     NOT illustrative: each bar names the real readiness status behind it.
 *     Where no readiness report exists yet, the chart falls back to a clearly
 *     `illustrative: true` placeholder series so the surface still reads, rather
 *     than inventing a per-family measurement.
 *   • The P4 cost / value / sensitivity charts have NO governed baseline (the
 *     Finance baseline is the P4 input that is "Not supplied" until it lands),
 *     so every one of their figures is an `illustrative: true` placeholder —
 *     a labelled synthetic value, never a tenant number and never a computed
 *     saving. The surface stamps them "Illustrative" and shows the honesty note.
 *
 * Pure and derived, kept out of the component so the derivation is unit-testable
 * on its own and the component only draws the geometry from these numbers.
 */

import type {
  InstrumentReadiness,
  ReadinessReport,
  ReadinessStatus,
} from "@/lib/programs/current-state-readiness";
import type { EvidenceKind } from "@/lib/programs/archetypes/types";
import type { DeliverableContentSignal } from "@/lib/deliverables/deliverable-content-signals";
import { isFindingsPhase } from "@/lib/programs/moves-phase-findings";

// ── Chart series types (semantic numbers only; the component owns pixels) ────

export type ChartKind =
  | "governed_share"
  | "root_cause_pareto"
  | "cost_scenarios"
  | "value_bridge"
  | "sensitivity_tornado";

/** How a chart's numbers were sourced — drives the provenance chip. */
export type ChartProvenance =
  /** Derived from the real readiness report's per-family states. */
  | "readiness_derived"
  /** Derived from the real OPEN evidence gaps. */
  | "gap_derived"
  /** A labelled placeholder — no governed baseline exists yet. */
  | "illustrative";

interface ChartBase {
  id: string;
  title: string;
  caption: string;
  /** True when any value on the chart is a placeholder, not a governed number. */
  illustrative: boolean;
  provenance: ChartProvenance;
  /** Short chip label ("Illustrative" / "Readiness-derived" / "Gap-derived"). */
  provenanceLabel: string;
}

export interface GovernedShareDatum {
  key: string;
  label: string;
  /** 0..1 — the governed/committed readiness level for this family. */
  fraction: number;
  valueLabel: string;
  statusLabel: string;
}

export interface GovernedShareChart extends ChartBase {
  kind: "governed_share";
  data: GovernedShareDatum[];
}

export interface ParetoDatum {
  key: string;
  label: string;
  /** 0..1 — this category's share of all open gaps. */
  fraction: number;
  valueLabel: string;
  /** 0..1 — running cumulative share through this category. */
  cumulativeFraction: number;
  cumulativeLabel: string;
}

export interface RootCauseParetoChart extends ChartBase {
  kind: "root_cause_pareto";
  /** 0..1 reference line (the Pareto 80% mark). */
  thresholdFraction: number;
  data: ParetoDatum[];
}

export interface CostScenarioDatum {
  key: string;
  label: string;
  low: number;
  mid: number;
  high: number;
  rangeLabel: string;
}

export interface CostScenariosChart extends ChartBase {
  kind: "cost_scenarios";
  unit: string;
  axisMax: number;
  data: CostScenarioDatum[];
}

export interface ValueBridgeStep {
  key: string;
  label: string;
  /** Signed contribution. Positive = inflow, negative = outflow. */
  delta: number;
  stepKind: "inflow" | "outflow" | "net";
  valueLabel: string;
}

export interface ValueBridgeChart extends ChartBase {
  kind: "value_bridge";
  unit: string;
  axisMax: number;
  /** The net total the bridge lands on. */
  net: number;
  steps: ValueBridgeStep[];
}

export interface SensitivityDatum {
  key: string;
  label: string;
  low: number;
  high: number;
  lowLabel: string;
  highLabel: string;
}

export interface SensitivityTornadoChart extends ChartBase {
  kind: "sensitivity_tornado";
  unit: string;
  /** The central (base-case) value the band swings around. */
  center: number;
  centerLabel: string;
  axisMin: number;
  axisMax: number;
  data: SensitivityDatum[];
}

export type PhaseChart =
  | GovernedShareChart
  | RootCauseParetoChart
  | CostScenariosChart
  | ValueBridgeChart
  | SensitivityTornadoChart;

export interface PhaseChartsModel {
  phase: number;
  surface: "diagnosis" | "business_case";
  charts: PhaseChart[];
  /** True when any chart carries a placeholder (illustrative) series. */
  anyIllustrative: boolean;
  /** The honesty note shown whenever any series is illustrative, else null. */
  honestyNote: string | null;
  /** True when there is nothing to chart. */
  pending: boolean;
}

// ── P2: governed share, derived from readiness per-family states ─────────────

/**
 * The governed/committed readiness LEVEL a family's status maps to. This is a
 * representation of the discrete governed state the readiness report already
 * computed — not a measured "% of data". Each bar also carries its real status
 * word so the level is never read as a standalone measurement.
 */
const STATUS_LEVEL: Record<ReadinessStatus, number> = {
  committed: 1,
  review_required: 0.5,
  parsing: 0.35,
  staged: 0.2,
  missing: 0,
};

const STATUS_WORD: Record<ReadinessStatus, string> = {
  committed: "Committed",
  review_required: "In review",
  parsing: "Parsing",
  staged: "Staged",
  missing: "Not provided",
};

const pct = (fraction: number): string => `${Math.round(fraction * 100)}%`;

function governedShareFromReadiness(
  report: ReadinessReport,
): GovernedShareChart {
  const data: GovernedShareDatum[] = report.instruments.map((instrument) => {
    const fraction = STATUS_LEVEL[instrument.status];
    return {
      key: instrument.key,
      label: instrument.label,
      fraction,
      valueLabel: pct(fraction),
      statusLabel: STATUS_WORD[instrument.status],
    };
  });
  return {
    kind: "governed_share",
    id: "governed_share",
    title: "Governed share by domain",
    caption:
      "Committed, governed share of each required evidence family — derived from this Move's readiness status, not a measured sample.",
    illustrative: false,
    provenance: "readiness_derived",
    provenanceLabel: "Readiness-derived",
    data,
  };
}

const ILLUSTRATIVE_GOVERNED_SHARE: GovernedShareChart = {
  kind: "governed_share",
  id: "governed_share",
  title: "Governed share by domain",
  caption:
    "% of each domain's data under governed, certified control. Placeholder shape until the current-state readiness report lands.",
  illustrative: true,
  provenance: "illustrative",
  provenanceLabel: "Illustrative",
  data: [
    { key: "clinical", label: "Clinical", fraction: 0.24, valueLabel: "24%", statusLabel: "Illustrative" },
    { key: "claims", label: "Claims", fraction: 0.4, valueLabel: "40%", statusLabel: "Illustrative" },
    { key: "enrollment", label: "Enrollment", fraction: 0.55, valueLabel: "55%", statusLabel: "Illustrative" },
    { key: "provider", label: "Provider", fraction: 0.31, valueLabel: "31%", statusLabel: "Illustrative" },
    { key: "reference", label: "Reference", fraction: 0.14, valueLabel: "14%", statusLabel: "Illustrative" },
  ],
};

// ── P2: root-cause Pareto, derived from the OPEN evidence gaps ───────────────

/** Human root-cause bucket for an evidence family's kind. */
const ROOT_CAUSE_BY_KIND: Record<EvidenceKind, string> = {
  org: "Ownership & identity",
  qualitative: "Definitions & process",
  document: "Governance evidence",
  inventory: "System & data inventory",
  metric_baseline: "Measurement baseline",
  financial: "Financial baseline",
  commercial: "Commercial baseline",
};

const isOpen = (instrument: InstrumentReadiness): boolean =>
  instrument.status !== "committed";

function rootCauseParetoFromReadiness(
  report: ReadinessReport,
): RootCauseParetoChart | null {
  const gaps = report.instruments.filter(isOpen);
  if (gaps.length === 0) return null;

  // Count open gaps per root-cause bucket, preserving first-seen order so the
  // chart is deterministic for a given readiness report.
  const order: string[] = [];
  const counts = new Map<string, number>();
  for (const gap of gaps) {
    const bucket = ROOT_CAUSE_BY_KIND[gap.kind] ?? "Other gaps";
    if (!counts.has(bucket)) order.push(bucket);
    counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
  }

  const total = gaps.length;
  const sorted = order
    .map((bucket) => ({ bucket, count: counts.get(bucket) ?? 0 }))
    // Descending by count; ties keep first-seen order (stable sort).
    .sort((a, b) => b.count - a.count);

  let running = 0;
  const data: ParetoDatum[] = sorted.map(({ bucket, count }, index) => {
    const fraction = count / total;
    running += count;
    const cumulativeFraction = running / total;
    return {
      key: `gap_${index}`,
      label: bucket,
      fraction,
      valueLabel: pct(fraction),
      cumulativeFraction,
      cumulativeLabel: pct(cumulativeFraction),
    };
  });

  return {
    kind: "root_cause_pareto",
    id: "root_cause_pareto",
    title: "Why the current state isn't trusted",
    caption:
      "Open evidence gaps by root-cause category, with the cumulative share (Pareto). Counts are this Move's real open gaps.",
    illustrative: false,
    provenance: "gap_derived",
    provenanceLabel: "Gap-derived",
    thresholdFraction: 0.8,
    data,
  };
}

const ILLUSTRATIVE_PARETO: RootCauseParetoChart = {
  kind: "root_cause_pareto",
  id: "root_cause_pareto",
  title: "Why the current state isn't trusted",
  caption:
    "Root causes by share of flagged issues, with cumulative (Pareto). Placeholder shape until the readiness report lands.",
  illustrative: true,
  provenance: "illustrative",
  provenanceLabel: "Illustrative",
  thresholdFraction: 0.8,
  data: [
    { key: "gap_0", label: "Identity", fraction: 0.42, valueLabel: "42%", cumulativeFraction: 0.42, cumulativeLabel: "42%" },
    { key: "gap_1", label: "No definitions", fraction: 0.28, valueLabel: "28%", cumulativeFraction: 0.7, cumulativeLabel: "70%" },
    { key: "gap_2", label: "Access", fraction: 0.18, valueLabel: "18%", cumulativeFraction: 0.88, cumulativeLabel: "88%" },
    { key: "gap_3", label: "Lineage", fraction: 0.12, valueLabel: "12%", cumulativeFraction: 1, cumulativeLabel: "100%" },
  ],
};

// ── P4: cost / value / sensitivity — illustrative placeholders only ──────────
//
// There is no governed Finance baseline at P4 until it is supplied, so every
// figure here is a labelled placeholder. These are DELIBERATELY static
// constants: the charts consume no tenant number and compute no saving, value
// or ROI (AGENTS.md — Tower read models own values, not these charts).

const ILLUSTRATIVE_COST_SCENARIOS: CostScenariosChart = {
  kind: "cost_scenarios",
  id: "cost_scenarios",
  title: "Delivery cost scenarios",
  caption: "One-time implementation, low–high. Illustrative until Finance supplies a baseline.",
  illustrative: true,
  provenance: "illustrative",
  provenanceLabel: "Illustrative",
  unit: "$M",
  axisMax: 3,
  data: [
    { key: "big4", label: "Big 4", low: 1.8, mid: 2.3, high: 2.8, rangeLabel: "1.8–2.8" },
    { key: "boutique", label: "Boutique", low: 0.95, mid: 1.2, high: 1.45, rangeLabel: "0.95–1.45" },
    { key: "offshore", label: "Offshore", low: 0.62, mid: 0.8, high: 0.98, rangeLabel: "0.62–0.98" },
  ],
};

const ILLUSTRATIVE_VALUE_BRIDGE: ValueBridgeChart = {
  kind: "value_bridge",
  id: "value_bridge",
  title: "Value bridge",
  caption: "What the foundation unlocks → net first-year value. Illustrative until Finance baselines it.",
  illustrative: true,
  provenance: "illustrative",
  provenanceLabel: "Illustrative",
  unit: "$M",
  axisMax: 2.5,
  net: 1.4,
  steps: [
    { key: "uc1", label: "Use-case 1", delta: 1.1, stepKind: "inflow", valueLabel: "+1.1" },
    { key: "uc2", label: "Use-case 2", delta: 0.6, stepKind: "inflow", valueLabel: "+0.6" },
    { key: "reuse", label: "Reuse", delta: 0.4, stepKind: "inflow", valueLabel: "+0.4" },
    { key: "run", label: "Run cost", delta: -0.7, stepKind: "outflow", valueLabel: "−0.7" },
    { key: "net", label: "Net Y1", delta: 1.4, stepKind: "net", valueLabel: "1.4" },
  ],
};

const ILLUSTRATIVE_SENSITIVITY: SensitivityTornadoChart = {
  kind: "sensitivity_tornado",
  id: "sensitivity_tornado",
  title: "Sensitivity",
  caption: "Net first-year value under each driver's low–high. Illustrative until Finance baselines it.",
  illustrative: true,
  provenance: "illustrative",
  provenanceLabel: "Illustrative",
  unit: "$M",
  center: 1.4,
  centerLabel: "net 1.4",
  axisMin: 0.8,
  axisMax: 2.0,
  data: [
    { key: "adoption", label: "Adoption", low: 0.9, high: 2.0, lowLabel: "0.9", highLabel: "2.0" },
    { key: "run_cost", label: "Run cost", low: 1.1, high: 1.6, lowLabel: "1.1", highLabel: "1.6" },
    { key: "reuse", label: "Reuse", low: 1.2, high: 1.7, lowLabel: "1.2", highLabel: "1.7" },
  ],
};

// ── Assembly ─────────────────────────────────────────────────────────────────

export interface BuildPhaseChartsInput {
  phase: number;
  readiness: ReadinessReport | null;
  /** Reserved for future generated-signal-derived series; unused in v1 of the
   *  charts layer (P4 figures have no governed baseline yet). */
  contentSignals?: readonly DeliverableContentSignal[];
}

const DIAGNOSIS_HONESTY =
  "Charts marked Illustrative show a placeholder shape pending the current-state baseline; the readiness-derived charts reflect this Move's real governed states, and finding statements are evidence-cited. No figure is presented as a confirmed client measurement.";

const BUSINESS_CASE_HONESTY =
  "Every figure here is illustrative. No cost, saving or value is claimed as fact: the ranges stay labelled placeholders until Finance supplies the baseline requested in the inputs step.";

/**
 * Build the OUTCOME charts model for an intelligence phase, or null when the
 * phase is not a findings/intelligence phase (its OUTCOME carries no charts).
 */
export function buildPhaseCharts({
  phase,
  readiness,
}: BuildPhaseChartsInput): PhaseChartsModel | null {
  if (!isFindingsPhase(phase)) return null;

  const charts: PhaseChart[] = [];
  const surface: PhaseChartsModel["surface"] =
    phase === 4 ? "business_case" : "diagnosis";

  if (phase === 2) {
    if (readiness && readiness.instruments.length > 0) {
      charts.push(governedShareFromReadiness(readiness));
      const pareto = rootCauseParetoFromReadiness(readiness);
      if (pareto) charts.push(pareto);
    } else {
      // No governed readiness yet — show the labelled placeholder shape.
      charts.push(ILLUSTRATIVE_GOVERNED_SHARE, ILLUSTRATIVE_PARETO);
    }
  } else {
    // P4: cost / value / sensitivity have no governed baseline — all illustrative.
    charts.push(
      ILLUSTRATIVE_COST_SCENARIOS,
      ILLUSTRATIVE_VALUE_BRIDGE,
      ILLUSTRATIVE_SENSITIVITY,
    );
  }

  const anyIllustrative = charts.some((c) => c.illustrative);
  const honestyNote = anyIllustrative
    ? surface === "business_case"
      ? BUSINESS_CASE_HONESTY
      : DIAGNOSIS_HONESTY
    : null;

  return {
    phase,
    surface,
    charts,
    anyIllustrative,
    honestyNote,
    pending: charts.length === 0,
  };
}
