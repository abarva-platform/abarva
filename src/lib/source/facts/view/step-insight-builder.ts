// ─────────────────────────────────────────────────────────────────────────────
// The per-step INSIGHT builder — the "✦ Intelligence" tab's killer chart.
//
// AbarVa Source turns each workflow step into an intelligence moment: SIZE value
// (Strategy) → EXPOSE traps (Scope) → SHOW leverage (RFP) → PROVE savings
// (Pricing) → ASSURE realization (Value). This pure builder produces the right
// `StepInsightView` for a given stage from the event's facts + resolved archetype:
//
//   • Strategy → VALUE POOL by lever (each lever's low–high $ at stake).
//   • Pricing  → the VALUE BRIDGE (the value-type waterfall, all honesty rules).
//   • Evaluation → SHOULD-COST NORMALIZATION (a MODEL — vendor bids are not in the
//                  fact model yet, so this ships clearly badged as illustrative).
//
// Live where facts exist, else a clearly-marked SAMPLE built from the archetype's
// illustrative values, else an honest empty "provide evidence to size this". A
// number is NEVER fabricated: an unsized lever is named, not guessed.
//
// Pure: no I/O, no LLM. The route runs the facts reader + evaluators and calls
// this alongside the existing stage/waterfall builders.
// ─────────────────────────────────────────────────────────────────────────────

import {
  evaluateValueLevers,
  type EventFactMap,
} from '@/lib/source/facts/evaluators/orchestrator';
import { buildValueWaterfall } from '@/lib/source/facts/evaluators/waterfall';
import type {
  SourceEventArchetype,
  ValueLeverRule,
  ValueType,
} from '@/lib/source/archetypes/types';
import { getSourceArchetype } from '@/lib/source/archetypes/registry';
import type { FactSourceCitation } from '@/lib/source/facts/fact-types';
import type {
  EvaluatorInputs,
  ValueLeverResult,
} from '@/lib/source/facts/evaluators/types';
import type {
  ShouldCostInsightView,
  ShouldCostVendorView,
  StepInsightView,
  ValueBridgeInsightView,
  ValuePoolBarView,
  ValuePoolInsightView,
} from '@/components/source/canvas/analytics/view-model';
import { buildLiveWaterfallView } from './waterfall-view-adapter';
import { resolveValueArchetype } from './stage-analytics-builder';

// ── formatting (compact USD, matching the ValueWaterfall renderer) ───────────

const USD_COMPACT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
  notation: 'compact',
});

function fmtUsd(value: number): string {
  return USD_COMPACT.format(value);
}

function fmtUsdRange(low: number, high: number): string {
  if (low === high) return fmtUsd(low);
  return `${fmtUsd(low)}–${fmtUsd(high)}`;
}

// ── which stage keys map to which insight kind ───────────────────────────────

/** Normalize a stage key to the canonical spine token the insight map keys on. */
function normalizeStage(stageKey: string): string {
  return stageKey.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

/**
 * The insight kind this step foregrounds. The first three are built live/model;
 * the rest of the spine returns null (the tab falls back to the IntelPanel read)
 * until their fact is wired — the model is declared, the build is staged.
 */
export function stepInsightKindForStage(
  stageKey: string,
): StepInsightView['kind'] | null {
  switch (normalizeStage(stageKey)) {
    case 'strategy':
      return 'value_pool';
    case 'pricing':
      return 'value_bridge';
    case 'evaluation':
      return 'should_cost_normalization';
    default:
      return null;
  }
}

// ── the builder input ────────────────────────────────────────────────────────

export interface BuildStepInsightInput {
  /** The stage the user is viewing — decides which insight to build. */
  stageKey: string;
  /** factKey → numeric value (from event-facts-reader). Empty → sample/empty. */
  inputs: EvaluatorInputs;
  /** factKey → citation (from event-facts-reader). */
  citations: Record<string, FactSourceCitation | null>;
  /** The event's raw event_type — used to resolve the archetype. */
  eventType?: string | null;
  /** Explicit archetype id override (tests). */
  archetypeId?: string;
  /** Baseline label/amount for the value bridge. */
  baselineLabel?: string;
  baselineAmount?: number;
}

/**
 * Build the per-step insight for the viewing stage, or null when the step has no
 * insight in this slice (the tab then shows the IntelPanel read only). Live when
 * facts exist, else a clearly-marked sample/model; never a fabricated number.
 */
export function buildStepInsight(
  input: BuildStepInsightInput,
): StepInsightView | null {
  const kind = stepInsightKindForStage(input.stageKey);
  if (!kind) return null;

  // Explicit archetype id (tests) short-circuits event_type resolution.
  const resolved = input.archetypeId
    ? resolveArchetypeById(input.archetypeId)
    : resolveValueArchetype(input.eventType);
  if (!resolved) return null;

  switch (kind) {
    case 'value_pool':
      return buildValuePoolInsight(resolved, input.inputs);
    case 'value_bridge':
      return buildValueBridgeInsight(resolved, input);
    case 'should_cost_normalization':
      return buildShouldCostModelInsight(resolved);
    default:
      return null;
  }
}

// resolveValueArchetype only resolves by eventType; for the explicit-id path
// (tests) we mirror its "must have rules" contract here.
function resolveArchetypeById(id: string): SourceEventArchetype | null {
  const a = getSourceArchetype(id);
  if (!a) return null;
  return (a.valueLeverRules?.length ?? 0) > 0 ? a : null;
}

// ── Strategy · VALUE POOL by lever ───────────────────────────────────────────

/**
 * Value pool: one bar per QUANTIFIED lever (low–high $ at stake), biggest-first,
 * colored by value type. When facts quantify at least one lever → live. When they
 * don't but the archetype declares levers → a clearly-marked SAMPLE built from the
 * archetype's illustrative values. When neither → honest empty.
 */
export function buildValuePoolInsight(
  archetype: SourceEventArchetype,
  facts: EventFactMap,
): ValuePoolInsightView {
  const rules = archetype.valueLeverRules ?? [];
  const results = evaluateValueLevers(archetype, facts);
  const quantified = results.filter((r) => !r.insufficientEvidence);

  if (quantified.length > 0) {
    // LIVE: real levers from real facts.
    const bars = toValuePoolBars(quantified);
    const needsEvidence = results
      .filter((r) => r.insufficientEvidence)
      .map((r) => r.name);
    return {
      kind: 'value_pool',
      provenance: 'live',
      headline: valuePoolHeadline(bars, needsEvidence.length, false),
      bars,
      needsEvidenceLevers: needsEvidence,
    };
  }

  // No live levers. If the archetype declares rules, show a SAMPLE value pool
  // built from each rule's illustrative band so the buyer learns the shape.
  if (rules.length > 0) {
    const bars = sampleBarsFromRules(rules);
    return {
      kind: 'value_pool',
      provenance: 'sample',
      headline: valuePoolHeadline(bars, 0, true),
      bars,
      needsEvidenceLevers: [],
      note: 'Illustrative value pool — the shape of the prize this archetype chases. It sizes for real once your run-cost, ticket, and contract evidence lands. Not a tenant savings claim.',
    };
  }

  // Nothing to show — honest empty.
  return {
    kind: 'value_pool',
    provenance: 'sample',
    headline: 'Provide evidence to size the value pool for this event.',
    bars: [],
    needsEvidenceLevers: [],
    note: 'No value levers are wired for this archetype yet.',
  };
}

function toValuePoolBars(
  levers: readonly ValueLeverResult[],
): ValuePoolBarView[] {
  return levers
    .map((l) => ({
      leverKey: l.key,
      label: l.name,
      valueType: l.valueType,
      low: l.low,
      high: l.high,
      confidence: l.confidence,
    }))
    .sort((a, b) => b.high - a.high);
}

/**
 * Illustrative bars from the archetype's rules — deterministic, ranged, and
 * clearly SAMPLE. Amounts derive from a stable per-rule pseudo-scale so the chart
 * reads (biggest-first) without inventing tenant numbers; the note makes the
 * illustrative status explicit. Never presented as live.
 */
function sampleBarsFromRules(
  rules: readonly ValueLeverRule[],
): ValuePoolBarView[] {
  // A fixed illustrative scale per value type (USD over term) — plausible AMS
  // magnitudes, not tenant-real. Ranges only, never a point.
  const SCALE: Record<ValueType, { low: number; high: number }> = {
    protected: { low: 1_800_000, high: 2_600_000 },
    incremental_negotiated: { low: 1_200_000, high: 1_900_000 },
    solution_tightening: { low: 700_000, high: 1_300_000 },
    risk_adjusted: { low: 400_000, high: 900_000 },
    expected_concession: { low: 300_000, high: 700_000 },
  };
  return rules
    .map((r) => {
      const band = SCALE[r.valueType];
      return {
        leverKey: r.key,
        label: r.name,
        valueType: r.valueType,
        low: band.low,
        high: band.high,
        confidence: r.defaultConfidence,
      };
    })
    .sort((a, b) => b.high - a.high);
}

function valuePoolHeadline(
  bars: readonly ValuePoolBarView[],
  needsEvidenceCount: number,
  isSample: boolean,
): string {
  if (bars.length === 0) {
    return 'Provide evidence to size the value pool for this event.';
  }
  const totalLow = bars.reduce((s, b) => s + b.low, 0);
  const totalHigh = bars.reduce((s, b) => s + b.high, 0);
  const biggest = bars[0]; // already sorted biggest-first
  const prefix = isSample ? 'Illustratively, ' : '';
  const n = bars.length;
  const leverWord = n === 1 ? 'lever' : 'levers';
  let line =
    `${prefix}${fmtUsdRange(totalLow, totalHigh)} at stake across ${n} ${leverWord}; ` +
    `biggest is ${biggest.label} (${fmtUsdRange(biggest.low, biggest.high)}).`;
  if (needsEvidenceCount > 0) {
    line +=
      ` ${needsEvidenceCount} more ${needsEvidenceCount === 1 ? 'lever needs' : 'levers need'} evidence to size.`;
  }
  return line.charAt(0).toUpperCase() + line.slice(1);
}

// ── Pricing · the VALUE BRIDGE (the value-type waterfall as an insight) ───────

/**
 * Value bridge: the value-type waterfall wrapped as the Pricing-step insight. When
 * facts quantify ≥1 lever it is LIVE (real bands, cited); otherwise a clearly
 * marked sample bridge from the archetype rules so the classified-value shape is
 * legible. The renderer preserves every ValueWaterfall honesty rule.
 */
export function buildValueBridgeInsight(
  archetype: SourceEventArchetype,
  input: BuildStepInsightInput,
): ValueBridgeInsightView {
  const results = evaluateValueLevers(archetype, input.inputs);
  const rollup = buildValueWaterfall(results);
  const baselineLabel = input.baselineLabel ?? 'Value at stake (event estimate)';
  const baselineAmount = input.baselineAmount ?? 0;

  if (rollup.computedLeverCount > 0) {
    const waterfall = buildLiveWaterfallView({
      leverResults: results,
      archetypeId: archetype.id,
      citations: input.citations,
      baselineLabel,
      baselineAmount,
    });
    const quantified = waterfall.bands.filter((b) => b.state === 'quantified');
    const totalLow = quantified.reduce((s, b) => s + b.amountLow, 0);
    const totalHigh = quantified.reduce((s, b) => s + b.amountHigh, 0);
    const pctLow =
      baselineAmount > 0 ? Math.round((totalLow / baselineAmount) * 100) : 0;
    const pctHigh =
      baselineAmount > 0 ? Math.round((totalHigh / baselineAmount) * 100) : 0;
    const pctFrag =
      baselineAmount > 0 ? ` — ${pctLow}–${pctHigh}% of baseline` : '';
    return {
      kind: 'value_bridge',
      provenance: 'live',
      headline:
        `${fmtUsdRange(totalLow, totalHigh)} of classified value${pctFrag}, ` +
        `every band math over a cited fact — not a headline discount.`,
      waterfall,
    };
  }

  // Sample bridge: reshape the archetype rules into a plausible classified
  // waterfall so the shape reads, clearly marked sample.
  const waterfall = sampleWaterfallFromRules(archetype, baselineLabel, baselineAmount);
  const quantified = waterfall.bands.filter((b) => b.state === 'quantified');
  const totalLow = quantified.reduce((s, b) => s + b.amountLow, 0);
  const totalHigh = quantified.reduce((s, b) => s + b.amountHigh, 0);
  return {
    kind: 'value_bridge',
    provenance: 'sample',
    headline:
      `Illustratively, ${fmtUsdRange(totalLow, totalHigh)} of classified value across ` +
      `${quantified.length} bands — the value-bridge shape this event will prove from your facts.`,
    waterfall,
    note: 'Illustrative value bridge. It computes for real once your run-cost, ticket, and contract evidence lands — every band then traces to a cited fact. Not a tenant savings claim.',
  };
}

/** A deterministic, clearly-sample waterfall from the archetype rules. */
function sampleWaterfallFromRules(
  archetype: SourceEventArchetype,
  baselineLabel: string,
  baselineAmount: number,
): ValueBridgeInsightView['waterfall'] {
  const rules = archetype.valueLeverRules ?? [];
  const bars = sampleBarsFromRules(rules);
  return {
    provenance: 'sample',
    baselineLabel,
    baselineAmount,
    unit: 'usd',
    bands: bars.map((b) => ({
      id: `wf.sample.${b.leverKey}`,
      valueType: b.valueType,
      label: b.label,
      amountLow: b.low,
      amountHigh: b.high,
      unit: 'usd' as const,
      confidence: b.confidence,
      state: 'quantified' as const,
      citation: null,
    })),
  };
}

// ── Evaluation · SHOULD-COST NORMALIZATION (a MODEL) ─────────────────────────

/**
 * Should-cost normalization: the cheapest bid is a trap. Vendor-bid data is NOT
 * in the fact model yet, so this ships as a clearly-badged MODEL (illustrative AMS
 * vendors) that DEMONSTRATES the normalization logic — headline price vs normalized
 * TCO, with the winner flipping after normalization. Always `provenance: 'sample'`
 * with a note that it goes live when vendor responses are ingested.
 *
 * The illustrative numbers are anchored to the AMS retained-cost + SLA levers so
 * the model matches the archetype's real normalization methods (feedsMethods:
 * should_cost / tco_normalization).
 */
export function buildShouldCostModelInsight(
  archetype: SourceEventArchetype,
): ShouldCostInsightView {
  // Illustrative AMS vendors. Vendor B is cheapest on HEADLINE but adds the most
  // retained FTE + weak-SLA risk, so it LOSES on normalized TCO — the trap.
  const vendors: ShouldCostVendorView[] = [
    {
      vendorKey: 'vendor_a',
      label: 'Vendor A',
      headlinePrice: 24_800_000,
      adjustments: [
        { label: 'Retained FTE (4 @ $195k)', amount: 2_340_000 },
        { label: 'SLA-credit risk (thin remedies)', amount: 600_000 },
      ],
      normalizedTco: 24_800_000 + 2_340_000 + 600_000,
    },
    {
      vendorKey: 'vendor_b',
      label: 'Vendor B',
      headlinePrice: 21_900_000,
      adjustments: [
        { label: 'Retained FTE (14 @ $195k)', amount: 8_190_000 },
        { label: 'Transition overrun exposure', amount: 900_000 },
      ],
      normalizedTco: 21_900_000 + 8_190_000 + 900_000,
    },
    {
      vendorKey: 'vendor_c',
      label: 'Vendor C',
      headlinePrice: 26_200_000,
      adjustments: [
        { label: 'Retained FTE (6 @ $195k)', amount: 3_510_000 },
        { label: 'Productivity credits missing', amount: 700_000 },
      ],
      normalizedTco: 26_200_000 + 3_510_000 + 700_000,
    },
  ];

  const byHeadline = [...vendors].sort(
    (a, b) => a.headlinePrice - b.headlinePrice,
  );
  const byNormalized = [...vendors].sort(
    (a, b) => a.normalizedTco - b.normalizedTco,
  );
  const headlineWinner = byHeadline[0];
  const normalizedWinner = byNormalized[0];
  const flips = headlineWinner.vendorKey !== normalizedWinner.vendorKey;

  const gap = Math.abs(
    byNormalized[1].normalizedTco - normalizedWinner.normalizedTco,
  );

  const headline = flips
    ? `${headlineWinner.label} is cheapest on paper (${fmtUsd(headlineWinner.headlinePrice)}); ` +
      `normalized for retained cost and risk, ${normalizedWinner.label} wins by ${fmtUsd(gap)}.`
    : `${normalizedWinner.label} wins on both headline and normalized TCO — no flip on this bid set.`;

  return {
    kind: 'should_cost_normalization',
    provenance: 'sample',
    headline,
    vendors,
    headlineWinnerKey: headlineWinner.vendorKey,
    normalizedWinnerKey: normalizedWinner.vendorKey,
    note:
      `Model — illustrative ${archetype.name} vendors, not real bids. It demonstrates the ` +
      `should-cost / TCO-normalization logic (retained FTE + SLA + transition risk added to headline). ` +
      `It goes live per-vendor the moment vendor responses are ingested into the fact model.`,
  };
}
