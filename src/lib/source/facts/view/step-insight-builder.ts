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
  evaluateValueLever,
  evaluateValueLevers,
  type EventFactMap,
} from '@/lib/source/facts/evaluators/orchestrator';
import { buildValueWaterfall } from '@/lib/source/facts/evaluators/waterfall';
import { runFormula } from '@/lib/source/facts/evaluators/formulas';
import { isInsufficient } from '@/lib/source/facts/evaluators/types';
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
  BafoProgressInsightView,
  BafoProgressRowView,
  CommittedValueBarView,
  CommittedValueInsightView,
  ExecDecisionInsightView,
  ExecDecisionSliceView,
  ResponseCoverageInsightView,
  ResponseCoverageRowView,
  RfpClauseInsightView,
  RfpClauseRowView,
  ScopeCoverageInsightView,
  ScopeCoverageRowView,
  ShouldCostInsightView,
  ShouldCostVendorView,
  StepInsightView,
  TransitionRiskInsightView,
  ValueBridgeInsightView,
  ValuePoolBarView,
  ValuePoolInsightView,
  ValueRealizationInsightView,
  ValueRealizationPointView,
} from '@/components/source/canvas/analytics/view-model';
import {
  buildLiveWaterfallView,
  isCredibleBaseline,
} from './waterfall-view-adapter';
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
    case 'scope':
      return 'scope_coverage';
    case 'rfp':
      return 'rfp_clause_coverage';
    case 'pricing':
      return 'value_bridge';
    case 'evaluation':
      return 'should_cost_normalization';
    case 'transition':
      return 'transition_risk';
    case 'exec_decision':
    case 'executive_decision':
    case 'executive':
    case 'decision':
      return 'exec_decision';
    case 'value':
    case 'value_realization':
      return 'value_realization';
    case 'responses':
    case 'response':
      return 'response_coverage';
    case 'bafo':
      return 'bafo_progress';
    case 'selection':
    case 'award':
      return 'committed_value';
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
  /**
   * The set of canonical value-lever keys whose `rfp_clause_present` signal fact
   * is present and = 1 (from the RFP-clause facts read). Drives RFP clause
   * coverage: a lever is protected iff its key is in this set. When the set is
   * PROVIDED (even empty) it means an RFP-clause signal exists for the event and
   * the insight goes LIVE; when it is `undefined` no signal exists and the insight
   * stays a MODEL. Empty-set (a signal exists but no clause is present) is a valid
   * live "everything exposed" read — distinct from `undefined`.
   */
  rfpClausePresentLeverKeys?: ReadonlySet<string>;
  /**
   * Per-lever committed value (canonical lever key → committed USD over term) from
   * the award-facts read. Drives committed value: when PROVIDED (even empty) an
   * award signal exists and the insight goes LIVE (each lever's `committed` set
   * where a fact exists, awaiting-award otherwise); when `undefined` no award fact
   * exists and the insight stays a MODEL. Empty-map is a valid live "assessed, none
   * committed yet" read — distinct from `undefined`.
   */
  committedValueByLeverKey?: ReadonlyMap<string, number>;
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
    case 'scope_coverage':
      return buildScopeCoverageInsight(resolved, input.inputs);
    case 'rfp_clause_coverage':
      return buildRfpClauseInsight(
        resolved,
        input.inputs,
        input.rfpClausePresentLeverKeys,
      );
    case 'value_bridge':
      return buildValueBridgeInsight(resolved, input);
    case 'should_cost_normalization':
      return buildShouldCostModelInsight(resolved);
    case 'transition_risk':
      return buildTransitionRiskInsight(resolved, input.inputs);
    case 'exec_decision':
      return buildExecDecisionInsight(resolved, input);
    case 'value_realization':
      return buildValueRealizationInsight(resolved, input.inputs);
    case 'response_coverage':
      return buildResponseCoverageInsight(resolved, input.inputs);
    case 'bafo_progress':
      return buildBafoProgressInsight(resolved, input.inputs);
    case 'committed_value':
      return buildCommittedValueInsight(
        resolved,
        input.inputs,
        input.committedValueByLeverKey,
      );
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

// ── shared advisor helpers (Scope + RFP) ─────────────────────────────────────

/**
 * The illustrative per-value-type $ scale used to size a lever whose real facts
 * are absent (MODEL / stranded rows). Ranges only, never a point; plausible AMS
 * magnitudes, never a tenant-real claim. Kept in sync with `sampleBarsFromRules`.
 */
const ILLUSTRATIVE_SCALE: Record<ValueType, { low: number; high: number }> = {
  protected: { low: 1_800_000, high: 2_600_000 },
  incremental_negotiated: { low: 1_200_000, high: 1_900_000 },
  solution_tightening: { low: 700_000, high: 1_300_000 },
  risk_adjusted: { low: 400_000, high: 900_000 },
  expected_concession: { low: 300_000, high: 700_000 },
};

/**
 * Human-readable label for an evidence family key (the tokens a rule lists in
 * `requiredEvidence`). Falls back to a title-cased version of the key so a new
 * family is legible even before it is named here.
 */
function evidenceFamilyLabel(key: string): string {
  const LABELS: Record<string, string> = {
    ticket_volumes: 'ticket volumes',
    contract_baseline: 'contract baseline',
    service_tower_scope: 'service-tower scope',
    run_cost_baseline: 'run-cost baseline',
    tooling_landscape: 'tooling landscape',
    retained_org_model: 'retained-org model',
    staffing_baseline: 'staffing baseline',
    sla_baseline: 'SLA baseline',
    incident_problem_change: 'incident / problem / change data',
    transition_constraints: 'transition constraints',
  };
  return LABELS[key] ?? key.replace(/_/g, ' ');
}

/**
 * A lever is REACHABLE when every fact its computation REQUIRES (the
 * citationRequired inputs) is present in the event's facts. When facts are absent
 * the lever is stranded (its value cannot be captured downstream). Returns the
 * fact keys that are still missing so the UI can say WHY it is stranded.
 */
function leverReachability(
  rule: ValueLeverRule,
  facts: EventFactMap,
): { reachable: boolean; missingInputKeys: string[] } {
  const required = rule.computation.inputs.filter((i) => i.citationRequired);
  const missing = required
    .filter((i) => {
      const v = facts[i.key];
      return !(typeof v === 'number' && Number.isFinite(v));
    })
    .map((i) => i.key);
  return { reachable: missing.length === 0, missingInputKeys: missing };
}

/** The $ band for a lever — real when it computes, else the illustrative scale. */
function leverBand(
  rule: ValueLeverRule,
  results: readonly ValueLeverResult[],
): { low: number; high: number } {
  const computed = results.find((r) => r.key === rule.key);
  if (computed && !computed.insufficientEvidence) {
    return { low: computed.low, high: computed.high };
  }
  return ILLUSTRATIVE_SCALE[rule.valueType];
}

// ── STRANDED-LEVER "POTENTIAL AT RISK" (benchmark-filled, not a tenant number) ─
//
// A stranded lever cannot COMPUTE (its citationRequired facts are missing), so the
// flat ILLUSTRATIVE_SCALE undersells it: a run-cost / volume-band lever operating on
// the event's REAL ~$46M run-cost pool is worth ~$16–23M over the term, but the flat
// scale shows ~$1–2M. To make the "this blocked lever is worth $X if you unblock it"
// moment land HONESTLY, we run the lever's OWN deterministic formula, filling ONLY
// the missing citationRequired inputs from a NAMED benchmark band and using the REAL
// facts that ARE present for the rest. Low uses the low end of every benchmark input,
// high the high end. It is ALWAYS a range, ALWAYS badged benchmark-based potential —
// never a computed tenant number, never a savings claim.
//
// Honesty rule: we NEVER invent a magnitude. Every filled input comes from
// `AMS_DRIVER_BENCHMARKS` below (a code constant with sourcing). We only benchmark
// the driver ratios/rates/small counts — the large $ POOLS (annual_run_cost,
// annual_change_order_spend, at_risk_fee_pool, automatable_effort_pool,
// transition_fee) are NEVER benchmark-filled; if the pool fact is absent the lever
// stays on the flat ILLUSTRATIVE_SCALE (we don't fabricate the magnitude).

/**
 * Illustrative AMS market bands for the DRIVER inputs a stranded lever is missing —
 * whole-number percents (18 = 18%), ratios, and small counts, NOT $ pools. These are
 * plausible AMS-market magnitudes used only to size the "if unblocked" potential of a
 * stranded lever whose real value pool IS present; they are never a tenant number.
 * Deterministic: same present facts → same {low, high} potential band.
 *
 * Sourcing: representative ranges seen across mid-to-large AMS deals (L2/L3 managed
 * services). Volume decline and variable-cost share track the shape of run-cost that
 * flexes as tickets fall; credit / miss / overrun rates track typical vendor and SLA
 * postures. Illustrative advisory bands, not audited tenant data.
 */
const AMS_DRIVER_BENCHMARKS: Record<string, { low: number; high: number }> = {
  // Share of annual run cost that flexes with ticket volume (whole-number pct).
  variable_cost_share_pct: { low: 50, high: 60 },
  // Projected ticket-volume decline over the term (whole-number pct).
  projected_volume_decline_pct: { low: 12, high: 20 },
  // Share of change-order / enhancement spend that is recurring/avoidable (pct).
  recurring_avoidable_pct: { low: 25, high: 40 },
  // Committed year-over-year productivity/automation credit (whole-number pct).
  committed_credit_pct: { low: 6, high: 12 },
  // Retained client / SME FTE the buyer keeps under a typical model (count).
  retained_fte_delta: { low: 3, high: 6 },
  // Loaded annual cost per retained FTE (USD/yr) — a rate, not a value pool.
  loaded_fte_cost: { low: 165_000, high: 210_000 },
  // SLA credit cap as a share of the at-risk fee pool (whole-number pct).
  credit_cap_pct: { low: 8, high: 15 },
  // Historical chronic-miss rate on critical towers (whole-number pct).
  chronic_miss_rate: { low: 4, high: 8 },
  // Probability of a transition overrun (whole-number pct).
  overrun_probability: { low: 20, high: 35 },
};

/**
 * The large $ POOL inputs that anchor a lever's magnitude. These are NEVER
 * benchmark-filled: if the pool fact is absent we cannot honestly size the lever, so
 * the caller falls back to the flat ILLUSTRATIVE_SCALE rather than inventing a pool.
 * Only the driver ratios/rates above may be benchmark-filled.
 */
const POOL_INPUT_KEYS = new Set<string>([
  'annual_run_cost',
  'annual_change_order_spend',
  'at_risk_fee_pool',
  'automatable_effort_pool',
  'transition_fee',
]);

/**
 * Compute a stranded lever's "potential at risk" band by running its OWN formula on
 * the REAL present facts + benchmark-filled MISSING citationRequired inputs. Low fills
 * every benchmarked input at its low end, high at its high end, so the result is a
 * genuine range scaled to the event's real pool. Returns null when the lever still
 * cannot be sized — because a required $ POOL fact is absent, or a missing driver has
 * no benchmark, or the evaluator still can't produce a band — so the caller keeps the
 * flat ILLUSTRATIVE_SCALE instead of fabricating a magnitude.
 */
function strandedPotentialBand(
  rule: ValueLeverRule,
  facts: EventFactMap,
): { low: number; high: number } | null {
  // The inputs the evaluator scopes over (real, present, finite ones).
  const present: EvaluatorInputs = {};
  for (const input of rule.computation.inputs) {
    const v = facts[input.key];
    if (typeof v === 'number' && Number.isFinite(v)) present[input.key] = v;
  }

  // Which citationRequired inputs are missing — these are what we must benchmark-fill.
  const required = rule.computation.inputs.filter((i) => i.citationRequired);
  const missing = required.filter((i) => !(i.key in present));

  // If any missing input is a $ POOL, we cannot honestly size it — bail to the flat
  // illustrative scale (never benchmark-fill a magnitude out of thin air).
  if (missing.some((i) => POOL_INPUT_KEYS.has(i.key))) return null;
  // Every missing driver must have a NAMED benchmark, else we cannot fill it honestly.
  if (missing.some((i) => !(i.key in AMS_DRIVER_BENCHMARKS))) return null;
  // Nothing to fill (all citationRequired present) means the lever is reachable and
  // should not be on this path at all; treat as no-potential.
  if (missing.length === 0) return null;
  // The lever's MAGNITUDE must be anchored on a REAL tenant fact — a present $ pool,
  // or a present required input that is not benchmark-fillable (a real anchor, not a
  // driver ratio we would have invented). `term_years` alone is not an anchor: it only
  // multiplies. Without a real anchor the whole magnitude would be benchmark-invented,
  // so we bail to the flat illustrative scale. (This is why RETAINED_COST — whose only
  // required inputs are both benchmarked drivers — never becomes a potential-at-risk
  // row off `term_years` alone.)
  const hasRealAnchor = Object.keys(present).some(
    (k) =>
      k !== 'term_years' &&
      (POOL_INPUT_KEYS.has(k) || !(k in AMS_DRIVER_BENCHMARKS)),
  );
  if (!hasRealAnchor) return null;

  const lowInputs: EvaluatorInputs = { ...present };
  const highInputs: EvaluatorInputs = { ...present };
  for (const i of missing) {
    const b = AMS_DRIVER_BENCHMARKS[i.key];
    lowInputs[i.key] = b.low;
    highInputs[i.key] = b.high;
  }

  const lowResult = runFormula(rule.computation.formulaId, lowInputs);
  const highResult = runFormula(rule.computation.formulaId, highInputs);
  if (isInsufficient(lowResult) || isInsufficient(highResult)) return null;

  // The evaluator itself returns a defensibility band per input set; take the low
  // bound of the low-filled run and the high bound of the high-filled run so the
  // potential band spans benchmark-low → benchmark-high end to end. Order defensively.
  const low = Math.min(lowResult.low, highResult.low);
  const high = Math.max(lowResult.high, highResult.high);
  if (!(Number.isFinite(low) && Number.isFinite(high)) || high <= 0) return null;
  return { low: Math.min(low, high), high: Math.max(low, high) };
}

// ── Scope · SCOPE-TO-VALUE COVERAGE (reachable vs stranded) ───────────────────

/**
 * Scope coverage: one row per value lever, judged reachable (all required evidence
 * present) vs stranded (missing / out of scope). $ at stake is real where the lever
 * computes, else the illustrative scale. When the event has NO facts at all the
 * whole determination is a MODEL — every lever is shown as what a complete scope
 * would unlock, clearly badged. Advisor layer surfaces the playbook best-practice,
 * a labeled market benchmark, and the downstream cost of scoping this wrong.
 */
export function buildScopeCoverageInsight(
  archetype: SourceEventArchetype,
  facts: EventFactMap,
): ScopeCoverageInsightView {
  const rules = archetype.valueLeverRules ?? [];
  const advisor = scopeAdvisor(rules);

  if (rules.length === 0) {
    return {
      kind: 'scope_coverage',
      provenance: 'sample',
      headline: 'No value levers are wired for this archetype yet.',
      rows: [],
      isModel: true,
      note: 'No value levers are wired for this archetype yet.',
      ...advisor,
    };
  }

  const results = evaluateValueLevers(archetype, facts);
  const hasAnyFacts = Object.values(facts).some(
    (v) => typeof v === 'number' && Number.isFinite(v),
  );

  const rows: ScopeCoverageRowView[] = rules.map((rule) => {
    const { reachable } = leverReachability(rule, facts);
    // In MODEL mode (no facts) we show every lever as reachable — "what a complete
    // scope unlocks" — and badge the whole thing MODEL. With real facts the
    // reachability is genuine.
    const rowReachable = hasAnyFacts ? reachable : true;

    // $ band: reachable → the real computed band (leverBand). Stranded (with real
    // facts) → PREFER a benchmark-based "potential at risk" computed from the lever's
    // OWN formula, filling only the missing citationRequired drivers from a named
    // benchmark and using the REAL present pool facts for the rest. This makes the
    // "$X if unblocked" moment land at event scale instead of the flat scale that
    // undersells a $46M-run-cost lever as ~$1–2M. Falls back to the flat
    // ILLUSTRATIVE_SCALE when the lever can't be honestly benchmark-sized.
    let band: { low: number; high: number };
    let potentialAtRisk = false;
    if (rowReachable) {
      band = leverBand(rule, results);
    } else {
      const potential = strandedPotentialBand(rule, facts);
      if (potential) {
        band = potential;
        potentialAtRisk = true;
      } else {
        band = ILLUSTRATIVE_SCALE[rule.valueType];
      }
    }

    // Map the still-missing computation inputs back to the human evidence families
    // this lever declares — that's the plain-English "what to scope for".
    const missingEvidence = rowReachable
      ? []
      : rule.requiredEvidence.map(evidenceFamilyLabel);
    return {
      leverKey: rule.key,
      label: rule.name,
      valueType: rule.valueType,
      low: band.low,
      high: band.high,
      reachable: rowReachable,
      requiredEvidence: rule.requiredEvidence.map(evidenceFamilyLabel),
      missingEvidence: hasAnyFacts ? missingEvidence : [],
      potentialAtRisk,
    };
  });

  // Order: reachable first, then stranded; biggest-$ within each group.
  const ordered = [...rows].sort((a, b) => {
    if (a.reachable !== b.reachable) return a.reachable ? -1 : 1;
    return b.high - a.high;
  });

  const isModel = !hasAnyFacts;
  const anyPotential = ordered.some((r) => !r.reachable && r.potentialAtRisk);
  return {
    kind: 'scope_coverage',
    provenance: isModel ? 'sample' : 'live',
    headline: scopeCoverageHeadline(ordered, isModel),
    rows: ordered,
    isModel,
    note: isModel
      ? 'Model — with no scope evidence landed, every lever is shown as what a complete scope would unlock. It resolves reachable-vs-stranded for real once your ticket, run-cost, SLA, and contract evidence lands. Not a tenant savings claim.'
      : anyPotential
        ? 'Reachable levers compute from your cited facts. A stranded lever whose value pool IS present but whose drivers are unscoped shows a benchmark-based POTENTIAL AT RISK — its own formula run over the real pool with the missing drivers filled from illustrative AMS market bands, low-to-high. It is a benchmark-scaled potential-if-unblocked, not a computed tenant number and not a savings claim; it resolves to a cited number once the missing evidence lands.'
        : undefined,
    ...advisor,
  };
}

function scopeCoverageHeadline(
  rows: readonly ScopeCoverageRowView[],
  isModel: boolean,
): string {
  if (rows.length === 0) return 'No value levers are wired for this archetype yet.';
  const reachable = rows.filter((r) => r.reachable);
  const stranded = rows.filter((r) => !r.reachable);
  const reachableLow = reachable.reduce((s, r) => s + r.low, 0);
  const reachableHigh = reachable.reduce((s, r) => s + r.high, 0);
  const totalLow = rows.reduce((s, r) => s + r.low, 0);
  const totalHigh = rows.reduce((s, r) => s + r.high, 0);

  if (isModel) {
    return (
      `A complete scope unlocks ${fmtUsdRange(totalLow, totalHigh)} across ${rows.length} ` +
      `levers — every lever left out of scope is a lever you can't recover in RFP or BAFO.`
    );
  }
  if (stranded.length === 0) {
    return `${fmtUsdRange(reachableLow, reachableHigh)} across all ${rows.length} levers is reachable under current scope — nothing stranded.`;
  }
  const strandedLow = stranded.reduce((s, r) => s + r.low, 0);
  const strandedHigh = stranded.reduce((s, r) => s + r.high, 0);
  const worst = [...stranded].sort((a, b) => b.high - a.high)[0];
  const why =
    worst.missingEvidence.length > 0 ? worst.missingEvidence[0] : 'missing evidence';
  // When at least one stranded lever's $ is a benchmark-scaled "potential at risk"
  // (its real pool is present but its drivers are unscoped), say so honestly: the
  // stranded number is a benchmark-scaled potential-if-unblocked, not a tenant claim.
  const anyPotential = stranded.some((r) => r.potentialAtRisk);
  const strandedFrag = anyPotential
    ? `${fmtUsdRange(strandedLow, strandedHigh)} at risk, benchmark-scaled, if unblocked`
    : `${fmtUsdRange(strandedLow, strandedHigh)} stranded`;
  return (
    `${fmtUsdRange(reachableLow, reachableHigh)} of ${fmtUsdRange(totalLow, totalHigh)} reachable under current scope; ` +
    `${strandedFrag} — biggest is ${worst.label}, blocked on ${why}.`
  );
}

/**
 * The Scope advisor layer, sourced from the levers' playbook. Best-practice from
 * each lever's `whatToWatch` (verbatim, deduped); benchmark = a clearly-labeled
 * market range; downstream = the "scope sets your ceiling" doctrine.
 */
function scopeAdvisor(rules: readonly ValueLeverRule[]): {
  bestPractice: string[];
  benchmark: string;
  downstreamImpact: string;
} {
  const bestPractice = rules.slice(0, 4).map((r) => {
    const ev = r.requiredEvidence.map(evidenceFamilyLabel).join(' + ');
    return `${r.name}: watch for ${lowerFirst(r.whatToWatch)} Needs ${ev} in scope.`;
  });
  return {
    bestPractice,
    benchmark:
      'Market range — comparable AMS events scope ~6–9 service towers and ~3,500–4,800 L2/L3 tickets/month; scoping without ticket volumetrics lets vendors pad an Outline-tier RFP against ambiguity.',
    downstreamImpact:
      'Scope sets your ceiling. A lever left out of scope here cannot be recovered in RFP, Evaluation, or BAFO — the stranded $ is gone for the term.',
  };
}

// ── RFP · LEVER-TO-CLAUSE COVERAGE (protected vs exposed) ─────────────────────

/**
 * RFP clause coverage: one row per value lever, protected (the RFP requires its
 * clause) vs exposed.
 *
 * LIVE when an RFP-clause signal exists for the event (`presentLeverKeys` is
 * provided): a lever is `protected` iff its key is in that set (its
 * `rfp_clause_present` fact = 1), else `exposed`. The headline reports live
 * coverage (N of M lever clauses present).
 *
 * MODEL when no signal exists (`presentLeverKeys` is undefined): every lever is
 * EXPOSED ("to require") — the honest default preserved from before the fact
 * existed. $ at stake is real where the lever computes, else the illustrative
 * scale. Each row carries the exact rfpClause + bafoAsk text (the clause
 * library). Advisor layer surfaces best-practice, a labeled market benchmark, and
 * the downstream cost of leaving a lever unprotected — in BOTH modes.
 */
export function buildRfpClauseInsight(
  archetype: SourceEventArchetype,
  facts: EventFactMap,
  presentLeverKeys?: ReadonlySet<string>,
): RfpClauseInsightView {
  const rules = archetype.valueLeverRules ?? [];
  const advisor = rfpAdvisor();

  if (rules.length === 0) {
    return {
      kind: 'rfp_clause_coverage',
      provenance: 'sample',
      headline: 'No value levers are wired for this archetype yet.',
      rows: [],
      isModel: true,
      note: 'No value levers are wired for this archetype yet.',
      ...advisor,
    };
  }

  // A signal exists when the set was provided (even if empty — that means an RFP
  // draft was assessed and no clause was found present). Undefined → no signal.
  const isLive = presentLeverKeys !== undefined;

  const results = evaluateValueLevers(archetype, facts);
  const rows: RfpClauseRowView[] = rules.map((rule) => {
    const band = leverBand(rule, results);
    // LIVE: protected iff this lever's rfp_clause_present fact = 1. MODEL: every
    // lever exposed until an RFP-draft signal exists.
    const isProtected = isLive
      ? presentLeverKeys!.has(rule.key)
      : false;
    return {
      leverKey: rule.key,
      label: rule.name,
      valueType: rule.valueType,
      low: band.low,
      high: band.high,
      protected: isProtected,
      rfpClause: rule.rfpClause,
      bafoAsk: rule.bafoAsk,
    };
  });

  // Order: exposed first (the ask), biggest-$ within.
  const ordered = [...rows].sort((a, b) => {
    if (a.protected !== b.protected) return a.protected ? 1 : -1;
    return b.high - a.high;
  });

  if (isLive) {
    return {
      kind: 'rfp_clause_coverage',
      provenance: 'live',
      headline: rfpClauseHeadline(ordered, true),
      rows: ordered,
      isModel: false,
      note: 'Live — protected vs exposed is read from the RFP clause checklist you provided (one rfp_clause_present fact per lever). A protected lever has its clause required in the RFP draft; an exposed lever does not — recover it in the RFP or lose it. The $ at stake and clause text are the same cited/advisor values as the model.',
      ...advisor,
    };
  }

  return {
    kind: 'rfp_clause_coverage',
    provenance: 'sample',
    headline: rfpClauseHeadline(ordered, false),
    rows: ordered,
    isModel: true,
    note: 'Model — no structured RFP draft is in the fact model yet, so every lever is shown as a clause to require. It resolves protected-vs-exposed for real once an RFP-clause signal exists (upload the RFP clause checklist so each lever gets an rfp_clause_present fact). The clause text below is real advisor guidance from the archetype playbook. Not a tenant savings claim.',
    ...advisor,
  };
}

function rfpClauseHeadline(
  rows: readonly RfpClauseRowView[],
  isLive: boolean,
): string {
  if (rows.length === 0) return 'No value levers are wired for this archetype yet.';
  const exposed = rows.filter((r) => !r.protected);
  const protectedRows = rows.filter((r) => r.protected);
  const totalLow = rows.reduce((s, r) => s + r.low, 0);
  const totalHigh = rows.reduce((s, r) => s + r.high, 0);
  const exposedLow = exposed.reduce((s, r) => s + r.low, 0);
  const exposedHigh = exposed.reduce((s, r) => s + r.high, 0);

  if (isLive) {
    // Live coverage read: N of M lever clauses present, exposed pool sized.
    if (exposed.length === 0) {
      return (
        `All ${rows.length} lever clauses are present in the RFP — your ` +
        `${fmtUsdRange(totalLow, totalHigh)} pool is protected, nothing exposed.`
      );
    }
    return (
      `${protectedRows.length} of ${rows.length} lever clauses present in the RFP; ` +
      `${exposed.length} still exposed (${fmtUsdRange(exposedLow, exposedHigh)}) — ` +
      `recover each in the RFP or lose it downstream.`
    );
  }

  return (
    `Your ${fmtUsdRange(totalLow, totalHigh)} pool depends on ${rows.length} levers; ` +
    `best-in-class AMS RFPs protect each with a clause — ${exposed.length} still exposed (${fmtUsdRange(exposedLow, exposedHigh)}).`
  );
}

/**
 * The RFP advisor layer. Best-practice = the doctrine of clause protection;
 * benchmark = a clearly-labeled market range on the omission that costs most;
 * downstream = "the RFP is the last lock point".
 */
function rfpAdvisor(): {
  bestPractice: string[];
  benchmark: string;
  downstreamImpact: string;
} {
  return {
    bestPractice: [
      'Every priced lever needs a matching RFP clause — the clause is what makes the value a requirement vendors must answer, not a hope.',
      'Pair each clause with its BAFO fallback so an exposed lever still has a negotiation ask if it slips the RFP.',
      'Require classification and unit-rate catalogs up front — vague enhancement / change-order language is where post-award leakage starts.',
    ],
    benchmark:
      'Market range — an estimated ~70% of AMS RFPs omit the volume-band step-down clause, so the buyer keeps paying peak-volume rates as tickets fall; ~60% under-specify SLA chronic-miss remedies.',
    downstreamImpact:
      'The RFP is the last point to lock a lever into a requirement. An unprotected lever cannot be recovered in Evaluation or BAFO — vendors answer only what the RFP required.',
  };
}

function lowerFirst(s: string): string {
  return s.length > 0 ? s.charAt(0).toLowerCase() + s.slice(1) : s;
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
    // Only print the "% of baseline" fragment when the baseline is a CREDIBLE
    // denominator for the classified value — positive AND not orders of magnitude
    // smaller than the value (a garbage `15` against ~$65M would be millions of
    // percent). Otherwise suppress the fragment; the classified total stands alone.
    const baselineCredible = isCredibleBaseline(baselineAmount, totalHigh);
    const pctLow = baselineCredible
      ? Math.round((totalLow / baselineAmount) * 100)
      : 0;
    const pctHigh = baselineCredible
      ? Math.round((totalHigh / baselineAmount) * 100)
      : 0;
    const pctFrag = baselineCredible
      ? ` — ${pctLow}–${pctHigh}% of baseline`
      : '';
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

// ── Transition · TRANSITION-RISK EXPOSURE (LIVE) ─────────────────────────────

/** The AMS transition-risk lever key — the lever that sizes overrun exposure. */
const TRANSITION_LEVER_KEY = 'AMS.TRANSITION_RISK';

/**
 * Transition risk: the probability-weighted $ at risk if the transition overruns,
 * LIVE from the seeded transition facts (the AMS.TRANSITION_RISK lever computes
 * `transition_fee × overrun_cost_multiple × overrun_probability`). The chart bands
 * the exposure (conservative→expected) against the fee-at-risk a milestone plan can
 * cap it with. When the fee/probability facts are absent the exposure cannot be
 * sized — an honest empty, never a $0.
 */
export function buildTransitionRiskInsight(
  archetype: SourceEventArchetype,
  facts: EventFactMap,
): TransitionRiskInsightView {
  const rule = (archetype.valueLeverRules ?? []).find(
    (r) => r.key === TRANSITION_LEVER_KEY,
  );
  const advisor = transitionAdvisor(rule?.rfpClause, rule?.whatToWatch);

  // No transition lever on this archetype → honest empty, advisor still shown.
  if (!rule) {
    return {
      kind: 'transition_risk',
      provenance: 'sample',
      headline: 'No transition-risk lever is wired for this archetype yet.',
      quantified: false,
      transitionFee: 0,
      exposureLow: 0,
      exposureHigh: 0,
      overrunProbabilityPct: 0,
      overrunCostMultiple: 0,
      confidence: 'low',
      note: 'No transition-risk lever is wired for this archetype yet.',
      ...advisor,
    };
  }

  const result = evaluateValueLever(rule, facts);
  const fee = facts.transition_fee;
  const prob = facts.overrun_probability;
  const multiple = facts.overrun_cost_multiple;

  // LIVE: the lever computed from real facts.
  if (!result.insufficientEvidence) {
    const feeVal = typeof fee === 'number' && Number.isFinite(fee) ? fee : 0;
    const probVal = typeof prob === 'number' && Number.isFinite(prob) ? prob : 0;
    const multVal =
      typeof multiple === 'number' && Number.isFinite(multiple) ? multiple : 1;
    return {
      kind: 'transition_risk',
      provenance: 'live',
      headline:
        `${fmtUsdRange(result.low, result.high)} at risk if the transition overruns ` +
        `(${Math.round(probVal)}% probability × ${multVal}× cost); a milestone-based plan ` +
        `with fee-at-risk caps the exposure to the ${fmtUsd(feeVal)} transition fee.`,
      quantified: true,
      transitionFee: feeVal,
      exposureLow: result.low,
      exposureHigh: result.high,
      overrunProbabilityPct: probVal,
      overrunCostMultiple: multVal,
      confidence: result.confidence,
      ...advisor,
    };
  }

  // Facts absent → honest empty (named missing evidence), never a guessed number.
  const missing = result.missingEvidence.join(', ');
  return {
    kind: 'transition_risk',
    provenance: 'sample',
    headline:
      'Provide the transition fee and overrun-probability benchmark to size the transition-risk exposure.',
    quantified: false,
    transitionFee: 0,
    exposureLow: 0,
    exposureHigh: 0,
    overrunProbabilityPct: 0,
    overrunCostMultiple: 0,
    confidence: rule.defaultConfidence,
    note:
      `Needs evidence — missing ${missing || 'transition_fee, overrun_probability'}. ` +
      'The exposure sizes for real from a quoted transition fee and a benchmarked overrun probability. Not a tenant claim.',
    ...advisor,
  };
}

/**
 * The Transition advisor layer, sourced from the transition lever's playbook —
 * best-practice from its `rfpClause` (milestone-based plan, fee-at-risk) +
 * `whatToWatch`; a labeled market benchmark on overrun rates; the downstream
 * "transition ambiguity becomes retained-cost exposure + delayed value."
 */
function transitionAdvisor(
  rfpClause?: string,
  whatToWatch?: string,
): { bestPractice: string[]; benchmark: string; downstreamImpact: string } {
  const bestPractice: string[] = [];
  if (rfpClause) bestPractice.push(rfpClause);
  if (whatToWatch) bestPractice.push(`Watch for ${lowerFirst(whatToWatch)}`);
  bestPractice.push(
    'Tie transition fees to KT milestones and cutover acceptance, with remedies for slippage — a lump-sum transition fee is exposure, a milestone-gated fee is a cap.',
  );
  return {
    bestPractice,
    benchmark:
      'Market range — comparable AMS transitions overrun on ~25–35% of deals; a generic transition narrative with no milestone gating is where slippage and retained-cost exposure start.',
    downstreamImpact:
      'Transition ambiguity becomes retained-cost exposure and delayed value realization — an un-gated transition fee is the buyer’s risk, not the vendor’s.',
  };
}

// ── Executive Decision · VALUE + RISK, BOARD-READY (LIVE) ────────────────────

/**
 * Executive decision: the board-ready value + risk read, LIVE from the value bridge
 * (`buildValueWaterfall`). Classifies the computed value into NEGOTIABLE (earned:
 * incremental + solution), PROTECTED (a risk hedge), and RISK-ADJUSTED (a
 * normalization) — each stated APART, never summed into one savings headline — plus
 * a residual-risk read (the levers still needing evidence). Sample-marked when no
 * lever computes.
 */
export function buildExecDecisionInsight(
  archetype: SourceEventArchetype,
  input: BuildStepInsightInput,
): ExecDecisionInsightView {
  const results = evaluateValueLevers(archetype, input.inputs);
  const rollup = buildValueWaterfall(results);
  const advisor = execDecisionAdvisor(archetype);

  const bandFor = (types: readonly ValueType[]) => {
    const bands = rollup.bands.filter((b) => types.includes(b.valueType));
    return {
      low: bands.reduce((s, b) => s + b.low, 0),
      high: bands.reduce((s, b) => s + b.high, 0),
      confidence: weakestConfidence(bands.map((b) => b.confidence)),
    };
  };

  const negotiable = bandFor(['incremental_negotiated', 'solution_tightening']);
  const protectedBand = bandFor(['protected']);
  const riskBand = bandFor(['risk_adjusted']);

  // Annotate the literal on its own binding so the contextual `ExecDecisionSliceView[]`
  // type narrows each `valueTypes` to `ValueType[]` (chaining `.filter` directly on the
  // literal would strip that context and infer `string[]`).
  const allSlices: ExecDecisionSliceView[] = [
    {
      bucket: 'negotiable',
      label: 'Net negotiable value',
      low: negotiable.low,
      high: negotiable.high,
      valueTypes: ['incremental_negotiated', 'solution_tightening'],
    },
    {
      bucket: 'protected',
      label: 'Protected value (risk hedge)',
      low: protectedBand.low,
      high: protectedBand.high,
      valueTypes: ['protected'],
    },
    {
      bucket: 'risk_adjusted',
      label: 'Risk-adjusted (TCO normalization)',
      low: riskBand.low,
      high: riskBand.high,
      valueTypes: ['risk_adjusted'],
    },
  ];
  const slices = allSlices.filter((s) => s.high > 0);

  const residualRiskLevers = results
    .filter((r) => r.insufficientEvidence)
    .map((r) => r.name);

  // LIVE when ≥1 lever computed; else a sample from the archetype rules.
  if (rollup.computedLeverCount > 0) {
    const confFrag = negotiable.high > 0 ? ` — ${negotiable.confidence} confidence` : '';
    const protFrag =
      protectedBand.high > 0 ? `protected ${fmtUsdRange(protectedBand.low, protectedBand.high)}` : '';
    const riskFrag =
      riskBand.high > 0 ? `risk-adjusted ${fmtUsdRange(riskBand.low, riskBand.high)}` : '';
    const aside = [protFrag, riskFrag].filter(Boolean).join(', ');
    const asideFrag = aside ? `; ${aside} stated apart` : '';
    return {
      kind: 'exec_decision',
      provenance: 'live',
      headline:
        `Net negotiable value ${fmtUsdRange(negotiable.low, negotiable.high)}${asideFrag}${confFrag}. ` +
        `${rollup.computedLeverCount} ${rollup.computedLeverCount === 1 ? 'lever' : 'levers'} computed; ` +
        `${residualRiskLevers.length} still ${residualRiskLevers.length === 1 ? 'needs' : 'need'} evidence.`,
      slices,
      confidence: negotiable.confidence,
      computedLeverCount: rollup.computedLeverCount,
      residualRiskLeverCount: residualRiskLevers.length,
      residualRiskLevers,
      ...advisor,
    };
  }

  // Sample: reshape the archetype rules into the classified buckets so the board
  // read reads, clearly marked sample. Amounts from the illustrative scale.
  const sampleBars = sampleBarsFromRules(archetype.valueLeverRules ?? []);
  const sampleBucket = (types: readonly ValueType[]) => {
    const b = sampleBars.filter((x) => types.includes(x.valueType));
    return {
      low: b.reduce((s, x) => s + x.low, 0),
      high: b.reduce((s, x) => s + x.high, 0),
    };
  };
  const sNeg = sampleBucket(['incremental_negotiated', 'solution_tightening']);
  const sProt = sampleBucket(['protected']);
  const sRisk = sampleBucket(['risk_adjusted']);
  const allSampleSlices: ExecDecisionSliceView[] = [
    { bucket: 'negotiable', label: 'Net negotiable value', low: sNeg.low, high: sNeg.high, valueTypes: ['incremental_negotiated', 'solution_tightening'] },
    { bucket: 'protected', label: 'Protected value (risk hedge)', low: sProt.low, high: sProt.high, valueTypes: ['protected'] },
    { bucket: 'risk_adjusted', label: 'Risk-adjusted (TCO normalization)', low: sRisk.low, high: sRisk.high, valueTypes: ['risk_adjusted'] },
  ];
  const sampleSlices = allSampleSlices.filter((s) => s.high > 0);
  return {
    kind: 'exec_decision',
    provenance: 'sample',
    headline:
      `Illustratively, net negotiable value ${fmtUsdRange(sNeg.low, sNeg.high)}; protected and ` +
      `risk-adjusted value stated apart — the board read this event proves from your facts.`,
    slices: sampleSlices,
    confidence: 'low',
    computedLeverCount: 0,
    residualRiskLeverCount: (archetype.valueLeverRules ?? []).length,
    residualRiskLevers: (archetype.valueLeverRules ?? []).map((r) => r.name),
    note: 'Illustrative board read. It computes for real once your run-cost, ticket, contract, and transition evidence lands — negotiable value is stated with a confidence band; protected and risk-adjusted value are stated apart, never summed into a savings headline. Not a tenant savings claim.',
    ...advisor,
  };
}

function execDecisionAdvisor(archetype: SourceEventArchetype): {
  bestPractice: string[];
  benchmark: string;
  downstreamImpact: string;
} {
  // Best-practice from the levers' executiveImplication (verbatim, deduped).
  const implications = (archetype.valueLeverRules ?? [])
    .map((r) => r.executiveImplication)
    .filter((s): s is string => Boolean(s));
  const bestPractice = dedupe(implications).slice(0, 3);
  bestPractice.push(
    'State negotiable value with a confidence band; state protected value (risk hedge) and risk-adjusted normalization APART — folding them into one savings number is the number the vendor refutes.',
  );
  return {
    bestPractice,
    benchmark:
      'Market range — board-grade sourcing decisions separate earned negotiable value from protected/risk-adjusted value; a single blended "savings" headline is the fastest way to lose the number in negotiation.',
    downstreamImpact:
      'The executive decision sets the mandate for BAFO and award — an over-stated headline the vendor refutes collapses the negotiable ask; a banded, classified read holds.',
  };
}

// ── Value · COMMITTED vs REALIZED over time (MODEL) ──────────────────────────

/**
 * Value realization: committed value (from the awarded levers) vs realized (0 /
 * placeholder) over the term. MODEL — realized-value actuals are not in the fact
 * model yet. Goes live when periodic realized-value actuals per lever are ingested.
 * Committed uses real lever bands where they compute, else the illustrative scale.
 */
export function buildValueRealizationInsight(
  archetype: SourceEventArchetype,
  facts: EventFactMap,
): ValueRealizationInsightView {
  const results = evaluateValueLevers(archetype, facts);
  const computed = results.filter((r) => !r.insufficientEvidence);
  // Committed total = midpoint of the computed bands where present, else sample.
  const committedTotal =
    computed.length > 0
      ? computed.reduce((s, r) => s + (r.low + r.high) / 2, 0)
      : sampleBarsFromRules(archetype.valueLeverRules ?? []).reduce(
          (s, b) => s + (b.low + b.high) / 2,
          0,
        );

  const termYears = 3;
  // Committed ramps linearly to full by end of term; realized is null (not ingested).
  const points: ValueRealizationPointView[] = Array.from(
    { length: termYears },
    (_, i) => ({
      period: `Y${i + 1}`,
      committed: Math.round((committedTotal * (i + 1)) / termYears),
      realized: null,
    }),
  );

  const advisor = valueRealizationAdvisor(archetype);
  return {
    kind: 'value_realization',
    provenance: 'sample',
    headline:
      `${fmtUsd(committedTotal)} of value committed across the term; realization is tracked here ` +
      `once run-cost and SLA-credit actuals are ingested — realized shows as pending, never as a claimed number.`,
    points,
    flipFact:
      'Periodic realized-value actuals per lever (run-cost actuals, SLA-credit actuals, productivity-credit actuals booked per period).',
    note: 'Model — realized-value actuals are not in the fact model yet, so the realized track is shown pending against committed value. It goes live once periodic realized-value actuals per lever are ingested. Committed value is the awarded-lever roll-up; realization is never fabricated. Not a tenant savings claim.',
    ...advisor,
  };
}

function valueRealizationAdvisor(archetype: SourceEventArchetype): {
  bestPractice: string[];
  benchmark: string;
  downstreamImpact: string;
} {
  const implications = dedupe(
    (archetype.valueLeverRules ?? [])
      .map((r) => r.executiveImplication)
      .filter((s): s is string => Boolean(s)),
  ).slice(0, 2);
  return {
    bestPractice: [
      ...implications,
      'Book realized value per period against the committed lever it maps to — value not measured against a committed lever is value that quietly leaks back.',
    ],
    benchmark:
      'Market range — an estimated 40–60% of negotiated sourcing value is never measured post-award; without a realization track the committed value is a promise, not a result.',
    downstreamImpact:
      'Realization is where the whole event pays off or leaks — an un-tracked committed value reverts to incumbent run-rate within a year or two.',
  };
}

// ── Responses · VENDOR DODGE-MAP (MODEL) ─────────────────────────────────────

/**
 * Response coverage: per value dimension, whether vendors answered or dodged. MODEL
 * — vendor-response facts are not in the fact model yet, so every dimension is shown
 * as "dodged" (the exposure) until proven answered. Goes live when vendor responses
 * are ingested per lever/clause. $ at stake is real where the lever computes, else
 * the illustrative scale. Each row carries its evaluationImpact from the playbook.
 */
export function buildResponseCoverageInsight(
  archetype: SourceEventArchetype,
  facts: EventFactMap,
): ResponseCoverageInsightView {
  const rules = archetype.valueLeverRules ?? [];
  const advisor = responseAdvisor();

  if (rules.length === 0) {
    return {
      kind: 'response_coverage',
      provenance: 'sample',
      headline: 'No value levers are wired for this archetype yet.',
      rows: [],
      flipFact: 'Vendor responses ingested per lever/clause.',
      note: 'No value levers are wired for this archetype yet.',
      ...advisor,
    };
  }

  const results = evaluateValueLevers(archetype, facts);
  const rows: ResponseCoverageRowView[] = rules.map((rule) => {
    const band = leverBand(rule, results);
    return {
      leverKey: rule.key,
      label: rule.name,
      valueType: rule.valueType,
      low: band.low,
      high: band.high,
      status: 'dodged' as const, // no vendor-response signal yet → dodged until proven
      evaluationImpact: rule.evaluationImpact,
    };
  });
  const ordered = [...rows].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'dodged' ? -1 : 1;
    return b.high - a.high;
  });

  const totalLow = ordered.reduce((s, r) => s + r.low, 0);
  const totalHigh = ordered.reduce((s, r) => s + r.high, 0);
  return {
    kind: 'response_coverage',
    provenance: 'sample',
    headline:
      `${fmtUsdRange(totalLow, totalHigh)} across ${ordered.length} value dimensions depends on a vendor ` +
      `answer; until responses are ingested every dimension is shown as unanswered — the exposure to press in evaluation.`,
    rows: ordered,
    flipFact:
      'Vendor responses ingested per lever/clause (a parsed vendor proposal whose commitments are extracted and matched to each value dimension).',
    note: 'Model — vendor-response facts are not in the fact model yet, so every dimension is shown as unanswered (the exposure) against its $ at stake. It goes live once vendor responses are ingested per lever/clause. The evaluation-impact text is real advisor guidance from the archetype playbook. Not a tenant savings claim.',
    ...advisor,
  };
}

function responseAdvisor(): {
  bestPractice: string[];
  benchmark: string;
  downstreamImpact: string;
} {
  return {
    bestPractice: [
      'Score each value dimension on whether the vendor COMMITTED, not whether they mentioned it — a narrative answer that dodges the clause is a dodge.',
      'Press every dodged dimension in clarifications before shortlisting — a dimension left unanswered at evaluation is a dimension conceded.',
    ],
    benchmark:
      'Market range — vendors materially under-answer volume-band step-down and SLA chronic-miss remedies on a majority of AMS responses; silence reads as compliance unless you force the answer.',
    downstreamImpact:
      'A dodged dimension that is not pressed at evaluation becomes an exposed lever at award — the response step is where you convert a clause into a committed answer.',
  };
}

// ── BAFO · CAPTURED vs TARGET (MODEL) ────────────────────────────────────────

/**
 * BAFO progress: value captured vs target by lever, with the remaining BAFO ask.
 * MODEL — negotiation / concession actuals are not in the fact model yet, so
 * captured is a placeholder (0) against the target (from the awarded levers). Goes
 * live when BAFO concession actuals per lever are ingested. Target uses real lever
 * bands where they compute, else the illustrative scale.
 */
export function buildBafoProgressInsight(
  archetype: SourceEventArchetype,
  facts: EventFactMap,
): BafoProgressInsightView {
  const rules = archetype.valueLeverRules ?? [];
  const advisor = bafoAdvisor();

  if (rules.length === 0) {
    return {
      kind: 'bafo_progress',
      provenance: 'sample',
      headline: 'No value levers are wired for this archetype yet.',
      rows: [],
      flipFact: 'BAFO concession actuals per lever.',
      note: 'No value levers are wired for this archetype yet.',
      ...advisor,
    };
  }

  const results = evaluateValueLevers(archetype, facts);
  const rows: BafoProgressRowView[] = rules
    .map((rule) => {
      const band = leverBand(rule, results);
      return {
        leverKey: rule.key,
        label: rule.name,
        valueType: rule.valueType,
        targetLow: band.low,
        targetHigh: band.high,
        captured: 0, // no BAFO concession actuals yet → 0 captured, never fabricated
        bafoAsk: rule.bafoAsk,
      };
    })
    .sort((a, b) => b.targetHigh - a.targetHigh);

  const totalLow = rows.reduce((s, r) => s + r.targetLow, 0);
  const totalHigh = rows.reduce((s, r) => s + r.targetHigh, 0);
  return {
    kind: 'bafo_progress',
    provenance: 'sample',
    headline:
      `${fmtUsdRange(totalLow, totalHigh)} of value targeted across ${rows.length} levers to pull in BAFO; ` +
      `captured tracks here once concession actuals land — nothing is shown as captured until it is booked.`,
    rows,
    flipFact:
      'BAFO concession actuals per lever (each negotiated concession booked against the lever it moves — a captured $ per lever per BAFO round).',
    note: 'Model — negotiation / concession actuals are not in the fact model yet, so captured is shown as pending (0) against each lever’s target. It goes live once BAFO concession actuals per lever are ingested. The BAFO-ask text is real advisor guidance from the archetype playbook. Not a tenant savings claim.',
    ...advisor,
  };
}

function bafoAdvisor(): {
  bestPractice: string[];
  benchmark: string;
  downstreamImpact: string;
} {
  return {
    bestPractice: [
      'Enter BAFO with a per-lever concession ask, not a lump-sum discount request — a lever-level ask is defensible; "sharpen your pencil" is not.',
      'Book each concession against the lever it moves so captured value is auditable — a discount with no lever is a number that evaporates at award.',
    ],
    benchmark:
      'Market range — structured, lever-level BAFO asks recover materially more than a single "best price" round; the concession left un-booked is the concession that never lands in the contract.',
    downstreamImpact:
      'BAFO is the last negotiation round — a lever not captured here is captured never; the award locks whatever BAFO booked.',
  };
}

// ── Selection · COMMITTED VALUE by lever (MODEL → LIVE, compact) ──────────────

/**
 * Committed value: the value locked by the awarded contract, by lever.
 *
 * LIVE when award facts exist for the event (`committedByLeverKey` is provided): a
 * bar carries the COMMITTED value the executed award locked for the lever (its
 * `committed_value_usd` fact) alongside the lever's TARGET band (its computed
 * economic band where it computes, else the illustrative scale). The headline
 * reports committed total vs target and how many levers the award actually locked.
 * A lever with no committed fact is shown HONESTLY as awaiting-award (`committed`
 * left undefined) — never fabricated as 0.
 *
 * MODEL when no award fact exists (`committedByLeverKey` is undefined): the bar is
 * the awarded-lever TARGET roll-up (the honest default preserved from before the
 * fact existed). Compact by design — a bar set, not an over-built surface.
 *
 * The advisor layer (best-practice / benchmark / downstream impact) survives BOTH
 * modes. No value-lever economic math changes — target bands are read, not altered.
 */
export function buildCommittedValueInsight(
  archetype: SourceEventArchetype,
  facts: EventFactMap,
  committedByLeverKey?: ReadonlyMap<string, number>,
): CommittedValueInsightView {
  const rules = archetype.valueLeverRules ?? [];
  const advisor = committedValueAdvisor();

  if (rules.length === 0) {
    return {
      kind: 'committed_value',
      provenance: 'sample',
      headline: 'No value levers are wired for this archetype yet.',
      bars: [],
      flipFact: 'Award facts (the executed contract confirming committed levers).',
      isModel: true,
      note: 'No value levers are wired for this archetype yet.',
      ...advisor,
    };
  }

  // A signal exists when the map was provided (even empty — an award was assessed
  // and no lever committed). Undefined → no award fact → honest MODEL.
  const isLive = committedByLeverKey !== undefined;

  const results = evaluateValueLevers(archetype, facts);
  const bars: CommittedValueBarView[] = rules
    .map((rule) => {
      const band = leverBand(rule, results);
      // LIVE: attach the committed $ where this lever has an award fact; leave it
      // undefined (awaiting award) otherwise — never fabricate a committed number.
      const committed = isLive
        ? committedByLeverKey!.get(rule.key)
        : undefined;
      return {
        leverKey: rule.key,
        label: rule.name,
        valueType: rule.valueType,
        low: band.low,
        high: band.high,
        confidence: rule.defaultConfidence,
        ...(committed !== undefined ? { committed } : {}),
      };
    })
    // LIVE sorts by committed $ (biggest award first, awaiting-award levers last);
    // MODEL sorts by target high.
    .sort((a, b) => {
      if (isLive) {
        return (b.committed ?? -1) - (a.committed ?? -1) || b.high - a.high;
      }
      return b.high - a.high;
    });

  const totalLow = bars.reduce((s, b) => s + b.low, 0);
  const totalHigh = bars.reduce((s, b) => s + b.high, 0);

  if (isLive) {
    const committedBars = bars.filter((b) => b.committed !== undefined);
    const committedTotal = committedBars.reduce(
      (s, b) => s + (b.committed ?? 0),
      0,
    );
    return {
      kind: 'committed_value',
      provenance: 'live',
      headline: committedValueHeadline(
        bars.length,
        committedBars.length,
        committedTotal,
        totalLow,
        totalHigh,
      ),
      bars,
      flipFact:
        'Award facts (the executed contract / award record confirming which levers and $ the winning vendor committed).',
      isModel: false,
      note: 'Live — committed value is read from the award commitments you provided (one committed_value_usd fact per lever). Each bar shows what the executed award LOCKED for the lever against its target band; a lever with no award fact is shown as awaiting award, never as $0. The target band and advisor guidance are the same cited/advisor values as the model.',
      ...advisor,
    };
  }

  return {
    kind: 'committed_value',
    provenance: 'sample',
    headline:
      `The award locks ${fmtUsdRange(totalLow, totalHigh)} across ${bars.length} levers — ` +
      `confirmed against the executed contract once award facts land.`,
    bars,
    flipFact:
      'Award facts (the executed contract / award record confirming which levers and $ the winning vendor committed).',
    isModel: true,
    note: 'Model — award facts are not in the fact model yet, so the committed value is the awarded-lever roll-up shown against each lever. It goes live once the executed-contract award commitments are ingested (upload the award commitments so each lever gets a committed_value_usd fact). Not a tenant savings claim.',
    ...advisor,
  };
}

/**
 * The live committed-value headline: committed total vs the target pool + how many
 * of the levers the award actually locked. Honest when NOTHING is committed yet.
 */
function committedValueHeadline(
  leverCount: number,
  committedCount: number,
  committedTotal: number,
  targetLow: number,
  targetHigh: number,
): string {
  if (committedCount === 0) {
    return (
      `The award record shows no committed value locked yet across ${leverCount} ` +
      `levers — the ${fmtUsdRange(targetLow, targetHigh)} target pool is all ` +
      `still awaiting award confirmation.`
    );
  }
  if (committedCount === leverCount) {
    return (
      `The executed award locks ${fmtUsd(committedTotal)} across all ${leverCount} ` +
      `levers against a ${fmtUsdRange(targetLow, targetHigh)} target — confirm each ` +
      `committed line carried into the contract of record.`
    );
  }
  return (
    `The executed award locks ${fmtUsd(committedTotal)} across ${committedCount} of ` +
    `${leverCount} levers (target pool ${fmtUsdRange(targetLow, targetHigh)}); the ` +
    `rest are still awaiting award confirmation.`
  );
}

function committedValueAdvisor(): {
  bestPractice: string[];
  benchmark: string;
  downstreamImpact: string;
} {
  return {
    bestPractice: [
      'Confirm every priced lever survived into the executed contract — value that was negotiated but not written into the award is value forfeited.',
    ],
    benchmark:
      'Market range — a meaningful share of negotiated sourcing value is lost between BAFO and signature when concessions are not carried into contract language.',
    downstreamImpact:
      'The award is the contract of record — it becomes the committed baseline the Value step measures realization against.',
  };
}

/** Weakest-link confidence across a set (low < med < high). Empty → 'low'. */
function weakestConfidence(
  confidences: readonly ('low' | 'med' | 'high')[],
): 'low' | 'med' | 'high' {
  const RANK = { low: 0, med: 1, high: 2 } as const;
  if (confidences.length === 0) return 'low';
  return confidences.reduce((acc, c) => (RANK[c] < RANK[acc] ? c : acc), 'high');
}

/** Order-preserving de-duplication of strings. */
function dedupe(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    if (!seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  }
  return out;
}
