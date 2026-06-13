// Run the expert kernel for a REAL, originated Move — pack-derived inputs.
//
// AbarVa's expert kernel compiles a costed, CFO-readable business case through
// the pipeline `buildBaselineModel → buildAssumptionLedger → buildEffortEstimate
// → buildValueForecast → compileBusinessCase` (src/lib/programs/expert-kernel/).
// Until now that pipeline ran ONLY for the three hand-authored reference cases
// (`apex-contact-center-case.ts`, `meridian-ambient-clinical-case.ts`,
// `firstcapital-fraud-detection-case.ts`) where ~95% of the kernel inputs are
// literal fixtures. A Move originated through the app never touched the kernel.
//
// `buildMoveBusinessCase` closes that gap. Given a real Move (`engagements`
// row), it:
//
//   1. binds the Move to its curated Domain Function Pack
//      (`bindMoveFunctionPack`) — an unbound Move returns an honest result that
//      says no curated pack covers it and the kernel cannot run with curated
//      depth; it NEVER fabricates a pack;
//   2. derives a `BusinessCaseCompilerInput` HONESTLY from (the Move's own
//      recorded data) + (the bound Function Pack's curated layers):
//        - baseline — the Move's recorded `baseline_metrics` fill real values;
//          every expected pack metric the Move does not record becomes a
//          precise, named seed gap (the binding's `seedGaps`);
//        - value — the value forecast is built from the pack's
//          `valueModel.valueBenchmarks` (labelled planning ranges) and scored
//          against the pack's `dominantHaircutFactors`. Because the gross value
//          rests on curated benchmark proxies and not the tenant's OWN unit
//          economics, the forecast is honestly flagged a proxy whenever the
//          metrics that would ground it are seed-gapped — which forces
//          `monetisationBlocked` and an honest reshape/hold verdict;
//        - assumptions — derived from the pack's `dominantHaircutFactors`,
//          `evidenceAnchors`, and `painThemes`, plus explicit
//          "to be confirmed with the tenant" assumptions for anything not
//          grounded in the Move's own data;
//        - effort — a planning-range estimate derived from the pack's
//          `aiUseCaseArchetypes` (data dependencies, control posture) and
//          `referenceSolutionPatterns`, marked explicitly as a planning
//          estimate and NOT a quote;
//        - towerHandoff — the operating metrics to track post-go, from the
//          pack;
//   3. runs the kernel pipeline and returns the `compileBusinessCase` result,
//      plus the binding so a downstream renderer can reuse the inherited
//      outline and the precise seed gaps.
//
// HONESTY DISCIPLINE (mandatory): every benchmark is a labelled planning
// range, never an asserted fact. Unrecorded metrics become precise seed gaps,
// never fabricated values. The effort estimate is a planning range, never a
// quote. The kernel's existing discipline — it blocks a claimable payback when
// monetisation rests on a seed gap — is preserved: a real Move with thin data
// produces an honest `shape` / `kill` verdict, not a fake `fund`.
//
// Pure module: deterministic, no I/O. Its data source is the Move's own
// `engagements` columns (`industry_code`, `charter`, `baseline_metrics`) plus
// the curated Function Pack — no broker, vector, or graph access.

import {
  buildBaselineModel,
  type BaselineMetricInput,
  type BaselineModel,
} from "./expert-kernel/baseline-model";
import {
  buildAssumptionLedger,
  type AssumptionInput,
  type AssumptionLedger,
} from "./expert-kernel/assumption-ledger";
import {
  buildEffortEstimate,
  DEFAULT_PLANNING_RATE_CARD,
  type EffortEstimate,
  type WorkstreamInput,
} from "./expert-kernel/effort-estimator";
import type { AiOperatingCostInput } from "./expert-kernel/ai-ops-cost";
import {
  buildValueForecast,
  type HaircutScores,
  type ValueForecast,
} from "./expert-kernel/value-forecast";
import {
  compileBusinessCase,
  type BusinessCaseSkeleton,
  type TowerMeasurementHandoff,
} from "./expert-kernel/business-case-compiler";
import { rangeOf } from "./expert-kernel/types";
import type {
  FunctionPack,
  OperatingMetric,
} from "./expert-kernel/domain/function-pack-types";
import { resolveFunctionPack } from "./expert-kernel/domain/function-pack-registry";
import type { FunctionPackBinding } from "./expert-kernel/domain/function-pack-context-binding";
import { resolveMoveFunctionIdentity } from "./function-identity";
import { bindMoveFunctionPack } from "./move-function-binding";
import {
  normalizeMetricLabel,
  type BaselineMetricEntry,
} from "./tenant-metric-inventory";

// ─────────────────────────────────────────────────────────────────────────────
// Inputs
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A recorded baseline metric as it appears in `engagements.baseline_metrics`.
 *
 * Extends the `BaselineMetricEntry` the tenant-metric inventory reconciles
 * against with the fields the kernel baseline needs: the recorded `value` and
 * its `unit` / `source`. All optional and defensively typed — the JSONB is
 * untyped, so a missing or wrong-typed field is handled, never trusted.
 */
export interface MoveBaselineMetricEntry extends BaselineMetricEntry {
  /** The recorded value. A number is used; anything else is treated as absent. */
  value?: unknown;
  /** The recorded unit, e.g. "percent", "USD per contact". */
  unit?: unknown;
  /** Where the tenant sourced the value. */
  source?: unknown;
  /** ISO date the value was measured / asserted, if recorded. */
  as_of?: unknown;
}

/**
 * The minimal slice of a Move (`engagements` row) `buildMoveBusinessCase`
 * needs. Deliberately NOT coupled to a heavy engagement type — it accepts only
 * the columns the kernel derivation reads, so any caller holding a Move in any
 * shape (DB row, view model, partial) can pass it.
 */
export interface MoveBusinessCaseInput {
  /** The `engagements.industry_code` column (snake_case DB row form). */
  industry_code?: string | null;
  /** The `industryCode` alias (camelCase view-model form). */
  industryCode?: string | null;
  /** The Move's name — surfaced on the skeleton. */
  name?: string | null;
  /**
   * The `engagements.function_pack_key` column — the preferred function-key
   * source. Both the snake_case DB-row form and the `functionPackKey`
   * camelCase alias are accepted. Omit for a row read before the column
   * existed; the `charter` fallback then resolves the key.
   */
  function_pack_key?: string | null;
  /** The `functionPackKey` alias (camelCase view-model form). */
  functionPackKey?: string | null;
  /**
   * The `engagements.charter` JSONB — the fallback function-key source
   * (`charter.functionPackKey`), still dual-written by origination.
   */
  charter?: unknown;
  /** The `engagements.baseline_metrics` JSONB array — the recorded-metric source. */
  baseline_metrics?: readonly MoveBaselineMetricEntry[] | null;
  /**
   * The tenant's canonical ClientKey (snake_case DB-row form) — e.g.
   * `'apexretail'`. Threaded from `loadMoveBusinessCaseInput` so the
   * board-grade renderers can label the deck with the canonical tenant
   * display name (P1-3: 'Apex Retail') instead of the industry slug
   * ('retail'). Optional; the renderer falls back to an honest "Tenant"
   * placeholder when neither key nor name resolves.
   */
  tenant_key?: string | null;
  /** The `tenantKey` alias (camelCase view-model form). */
  tenantKey?: string | null;
  /**
   * The tenant's display name from `clients.name`. Used by the
   * board-grade renderers as the secondary fallback after the canonical
   * client lookup. Optional.
   */
  tenant_name?: string | null;
  /** The `tenantName` alias (camelCase view-model form). */
  tenantName?: string | null;
  /**
   * Governed evidence rows already committed to the Move. These are the only
   * UUID-backed inputs that may populate Workspace Explorer lineage
   * (`generated_artifacts.cited_input_ids`). Charter JSON and baseline JSON are
   * real recorded facts, but they are not row ids, so they remain provenance
   * notes rather than UUID lineage edges.
   */
  governed_evidence_items?: readonly MoveGovernedEvidenceItem[] | null;
  /** CamelCase alias for callers holding view-model shaped data. */
  governedEvidenceItems?: readonly MoveGovernedEvidenceItem[] | null;
  /**
   * The Move's id — the `engagements.id` column or the `StrategicMove.id`.
   * Used by renderers that emit cross-deck `?moveId=` links (e.g. the
   * Master Move Dossier assembled-book). Both snake_case `id` and the
   * `move_id`/`moveId` aliases are accepted. Optional; renderers fall back
   * to a deterministic placeholder when neither is provided.
   */
  id?: string | null;
  move_id?: string | null;
  moveId?: string | null;
  /** Optional AI run-cost model from the Move charter or originating UI. */
  ai_operating_cost?: AiOperatingCostInput | null;
  /** Camel-case alias for view-model callers. */
  aiOperatingCost?: AiOperatingCostInput | null;
}

export interface MoveGovernedEvidenceItem {
  id: string;
  title?: string | null;
  summary?: string | null;
  evidence_type?: string | null;
  confidence?: number | string | null;
  phase?: number | null;
  created_at?: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Result
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The result of running the expert kernel for a real Move.
 *
 * `bound` distinguishes the two honest outcomes:
 *  - `bound: true`  — a curated pack covered the Move, the kernel ran, and
 *    `skeleton` is the real `compileBusinessCase` result;
 *  - `bound: false` — no curated pack (or no business-case outline) covers
 *    the Move's function; `skeleton` is `null` and `unboundReason` carries the
 *    honest fallback note. The kernel did NOT run with fabricated depth.
 */
export interface MoveBusinessCaseResult {
  /** True when a curated pack bound and the kernel produced a real skeleton. */
  bound: boolean;
  /** The compiled business-case skeleton — `null` when unbound. */
  skeleton: BusinessCaseSkeleton | null;
  /**
   * The Function Pack binding — the inherited deliverable outline, expected
   * metrics, and precise seed gaps. Returned for both outcomes so a downstream
   * renderer can surface the binding (or the honest unbound note) directly.
   */
  binding: FunctionPackBinding;
  /**
   * When `bound` is false: the honest reason the kernel could not run with
   * curated depth. Empty when bound. This is the agent's surfaced fallback,
   * never fabricated depth.
   */
  unboundReason: string;
  /**
   * Honesty flags raised while DERIVING the kernel inputs — distinct from the
   * critic findings the kernel itself raises. They record where curated
   * planning ranges stood in for the Move's own data, so a reader sees exactly
   * how much of the case rests on the tenant vs. the pack. Empty when every
   * input was grounded in the Move's own recorded data (rare for a thin Move).
   */
  derivationNotes: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Public entry point
// ─────────────────────────────────────────────────────────────────────────────

/** The phase artifact this module derives — the costed business case. */
const BUSINESS_CASE_ARTIFACT = "business_case" as const;

/**
 * Run the expert kernel for a real, originated Move.
 *
 * Binds the Move to its curated Domain Function Pack, derives a
 * `BusinessCaseCompilerInput` honestly from the Move's own recorded data plus
 * the pack's curated layers, runs the kernel pipeline, and returns the
 * `compileBusinessCase` result alongside the binding.
 *
 * When no curated pack covers the Move's function — or the pack carries no
 * business-case outline — it returns the honest unbound result (`bound:false`,
 * `skeleton:null`, `unboundReason` set). It NEVER fabricates a pack, a metric,
 * a number, or a verdict.
 *
 * Pure and deterministic: same Move → same result.
 */
export function buildMoveBusinessCase(
  move: MoveBusinessCaseInput,
): MoveBusinessCaseResult {
  // (1) Bind the Move to its curated pack for the business-case artifact.
  const binding = bindMoveFunctionPack(
    {
      industry_code: move.industry_code,
      industryCode: move.industryCode,
      function_pack_key: move.function_pack_key,
      functionPackKey: move.functionPackKey,
      charter: move.charter,
      baseline_metrics: move.baseline_metrics ?? undefined,
    },
    BUSINESS_CASE_ARTIFACT,
  );

  // An unbound binding is an honest dead end — no curated depth, no kernel run.
  if (!binding.bound) {
    return {
      bound: false,
      skeleton: null,
      binding,
      unboundReason:
        binding.fallbackNote ||
        "No curated Domain Function Pack covers this Move. The expert kernel " +
          "cannot run with curated depth — surfaced honestly, not fabricated.",
      derivationNotes: [],
    };
  }

  // (2) Resolve the underlying pack. The binding bound, so the identity and
  // pack both resolved — but resolve again defensively rather than asserting.
  const identity = resolveMoveFunctionIdentity({
    industryCode: move.industry_code ?? move.industryCode,
    functionPackKey: move.function_pack_key ?? move.functionPackKey,
    charter: move.charter,
  });
  const pack =
    identity && resolveFunctionPack(identity.industryKey, identity.functionKey);
  if (!pack) {
    return {
      bound: false,
      skeleton: null,
      binding,
      unboundReason:
        "The Move bound a deliverable outline but its curated Function Pack " +
        "could not be resolved — the kernel cannot run with curated depth.",
      derivationNotes: [],
    };
  }

  const moveName = readMoveName(move, pack);
  const tenantKey = identity?.industryKey ?? "unknown-tenant";
  const derivationNotes: string[] = [];

  // (3) Derive each kernel input bundle honestly.
  const baseline = deriveBaseline(
    moveName,
    tenantKey,
    move,
    pack,
    binding,
    derivationNotes,
  );
  const assumptions = deriveAssumptions(pack, baseline, derivationNotes);
  const effort = deriveEffort(moveName, pack, readAiOperatingCost(move));
  const value = deriveValue(moveName, pack, baseline, derivationNotes);
  const towerHandoff = deriveTowerHandoff(pack, baseline);

  // (4) Run the kernel pipeline. The compiler runs the critic and folds its
  // findings into the recommendation — its discipline is preserved untouched.
  const skeleton = compileBusinessCase({
    baseline,
    assumptions,
    effort,
    value,
    towerHandoff,
  });

  return {
    bound: true,
    skeleton,
    binding,
    unboundReason: "",
    derivationNotes,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Move-name resolution
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolve the Move's name. Prefers the Move's own `name`; falls back to the
 * pack's function label so the skeleton is never anonymous. Never fabricates a
 * specific Move title.
 */
function readMoveName(move: MoveBusinessCaseInput, pack: FunctionPack): string {
  const name = typeof move.name === "string" ? move.name.trim() : "";
  if (name) return name;
  return `${pack.functionLabel} Move`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Baseline derivation
// ─────────────────────────────────────────────────────────────────────────────

/** A recorded metric value extracted from the Move's `baseline_metrics`. */
interface RecordedMetricValue {
  value: number;
  unit: string;
  source: string;
  asOf: string;
}

/**
 * Index the Move's recorded `baseline_metrics` by their normalised label so a
 * pack operating metric can be looked up by either its `key` or its `name`.
 * Conservative: only entries with a usable numeric value are indexed.
 */
function indexRecordedMetrics(
  baselineMetrics: readonly MoveBaselineMetricEntry[] | null | undefined,
): Map<string, RecordedMetricValue> {
  const index = new Map<string, RecordedMetricValue>();
  if (!Array.isArray(baselineMetrics)) return index;
  for (const entry of baselineMetrics) {
    const name = entry?.metric_name;
    if (typeof name !== "string" || !name.trim()) continue;
    const value = entry?.value;
    if (typeof value !== "number" || !Number.isFinite(value)) continue;
    const form = normalizeMetricLabel(name);
    if (!form || index.has(form)) continue;
    index.set(form, {
      value,
      unit: typeof entry?.unit === "string" ? entry.unit : "unit",
      source:
        typeof entry?.source === "string" && entry.source.trim()
          ? entry.source
          : "Tenant-recorded baseline metric",
      asOf:
        typeof entry?.as_of === "string" && entry.as_of.trim()
          ? entry.as_of
          : "as-recorded",
    });
  }
  return index;
}

/**
 * Derive the baseline model — every metric the pack expects, with the Move's
 * recorded value filled where the tenant records it and a PRECISE, named seed
 * gap where it does not.
 *
 * The set of expected metrics is the pack's `operatingMetrics` (the binding's
 * `expectedMetrics`); each one the Move records becomes a recorded baseline
 * metric, each one it does not records becomes a seed gap carrying the
 * binding's `gapStatement`. No metric is ever fabricated, and a missing metric
 * is never left blank.
 */
function deriveBaseline(
  moveName: string,
  tenantKey: string,
  move: MoveBusinessCaseInput,
  pack: FunctionPack,
  binding: FunctionPackBinding,
  notes: string[],
): BaselineModel {
  const recorded = indexRecordedMetrics(move.baseline_metrics);
  // The binding already computed the precise seed gaps — index them by key so
  // a not-recorded metric carries the binding's ready-to-render gap statement.
  const seedGapByKey = new Map(binding.seedGaps.map((g) => [g.metricKey, g]));

  const metrics: BaselineMetricInput[] = binding.expectedMetrics.map(
    (metric) => {
      const hit =
        recorded.get(normalizeMetricLabel(metric.key)) ??
        recorded.get(normalizeMetricLabel(metric.name));
      if (hit) {
        // Recorded by the tenant — a real, grounded baseline value.
        return {
          key: metric.key,
          label: metric.name,
          value: hit.value,
          unit: hit.unit,
          source: hit.source,
          sourceQuality: "measured",
          asOf: hit.asOf,
          // Tenant data is grounded, but a self-recorded metric without an
          // audited source is not high confidence — medium is the honest rung.
          confidence: "medium",
        };
      }
      // Not recorded — a precise seed gap. The binding's gap statement names
      // what the metric is, where it is sourced, and what its absence blocks.
      const gap = seedGapByKey.get(metric.key);
      return {
        key: metric.key,
        label: metric.name,
        value: null,
        unit: metric.unit,
        source: "seed gap",
        sourceQuality: "absent",
        asOf: "not-recorded",
        confidence: "low",
        seedGapReason:
          gap?.gapStatement ??
          `"${metric.name}" is not recorded by the tenant — this function ` +
            `expects it (sourced from ${metric.dataSource}); its absence ` +
            "blocks the baseline and the value forecast.",
      };
    },
  );

  const model = buildBaselineModel({ moveName, tenantKey, metrics });

  if (model.seedGaps.length > 0) {
    notes.push(
      `Baseline: ${model.recordedMetrics.length} of ${model.metrics.length} ` +
        `Function-Pack operating metrics are recorded by this Move ` +
        `(coverage ${Math.round(model.coverage * 100)}%). The remaining ` +
        `${model.seedGaps.length} are precise, named seed gaps — not ` +
        "fabricated values.",
    );
  }
  return model;
}

// ─────────────────────────────────────────────────────────────────────────────
// Value-forecast derivation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The gross-annual-value range the value forecast discounts. It is built from
 * the pack's curated `valueBenchmarks` — labelled PLANNING ranges, never the
 * tenant's own measured unit economics — so it is treated as an illustrative
 * ceiling, not a claimed return (see `deriveValue`).
 *
 * Each value benchmark's range is a fraction or percentage scale, not dollars;
 * the pack does not carry the tenant's spend base. Rather than fabricate a
 * dollar denominator, the forecast is expressed on a NORMALISED 0–100 planning
 * index per lever and the gross figure rests on a proxy — which the kernel
 * honestly flags as monetisation-blocked. The point of the kernel run for a
 * real Move is the structured, haircut-disciplined verdict, NOT a fake dollar
 * payback the Move's data cannot support.
 */
function buildGrossValueIndex(pack: FunctionPack): {
  low: number;
  high: number;
} {
  // Each value benchmark contributes its planning range to a combined index.
  // The benchmarks are the pack's own labelled planning ranges.
  let low = 0;
  let high = 0;
  for (const benchmark of pack.valueModel.valueBenchmarks) {
    low += benchmark.range.low;
    high += benchmark.range.high;
  }
  // A pack with no value benchmarks would yield a zero range — guard so the
  // forecast still runs (the kernel handles a zero forecast honestly).
  if (high <= 0) {
    return { low: 0, high: 0 };
  }
  return { low, high };
}

/**
 * Score the six kernel haircut dimensions from the pack's dominant haircut
 * factors. The pack carries function-specific haircut factors as labelled
 * planning discount ranges; the kernel's value forecast wants a 0–1 confidence
 * score per dimension. The mapping is deterministic and conservative.
 *
 * The factor's `typicalHaircut` planning range gives the discount the factor
 * removes; the dimension score is `1 - midpointDiscount`, so a hard-biting
 * factor produces a low confidence score. A dimension with no matching pack
 * factor defaults to a deliberately CONSERVATIVE 0.5 — neither optimism nor
 * fabricated confidence; it is the honest "not specifically de-risked" rung.
 */
function deriveHaircutScores(pack: FunctionPack): HaircutScores {
  // Average discount across all the pack's dominant factors — the pack's own
  // read of how hard value is to realise in this function.
  const factors = pack.valueModel.dominantHaircutFactors;
  let discountSum = 0;
  for (const factor of factors) {
    discountSum += (factor.typicalHaircut.low + factor.typicalHaircut.high) / 2;
  }
  const avgDiscount = factors.length > 0 ? discountSum / factors.length : 0.3;
  // A single dominant factor rarely exceeds ~0.45 discount; the average across
  // the function's factors is the honest, conservative read for every kernel
  // dimension the pack does not name individually. Clamp to a sane 0..1 score.
  const baseScore = clamp01(1 - avgDiscount);

  // The pack does not split its factors onto the kernel's exact six
  // dimensions, so every dimension takes the same conservative base score
  // derived from the pack. This is honest: it does not claim a dimension is
  // de-risked when the pack gives no evidence it is.
  return {
    adoptionRisk: baseScore,
    dataReadiness: baseScore,
    processDependency: baseScore,
    integrationComplexity: baseScore,
    controlBurden: baseScore,
    sponsorStrength: baseScore,
  };
}

/** Clamp a number into the 0..1 range. */
function clamp01(n: number): number {
  if (n < 0) return 0;
  if (n > 1) return 1;
  return Math.round(n * 10_000) / 10_000;
}

/**
 * Derive the value forecast from the pack's curated value model.
 *
 * The gross value is built from the pack's `valueBenchmarks` (labelled
 * planning ranges) and the haircut scores from its `dominantHaircutFactors`.
 *
 * Honesty: the gross value rests on the pack's planning benchmarks, NOT on the
 * Move's own measured unit economics. So `grossValueIsProxy` is set whenever
 * the Move does not record enough of the pack's metrics to ground the value —
 * which forces `monetisationBlocked` and an honest non-`fund` verdict. A Move
 * that records the full operating-metric set still keeps the proxy flag,
 * because the value BENCHMARKS themselves remain planning ranges until the
 * tenant's spend base is supplied — the kernel run gives a disciplined,
 * haircut verdict, never a fabricated dollar payback.
 */
function deriveValue(
  moveName: string,
  pack: FunctionPack,
  baseline: BaselineModel,
  notes: string[],
): ValueForecast {
  const grossIndex = buildGrossValueIndex(pack);
  const haircutScores = deriveHaircutScores(pack);

  // The value benchmarks are planning ranges; the gross figure they sum to is
  // ALWAYS a proxy for a real tenant value until the tenant's own spend base
  // and recorded metrics ground it. Flag it as a proxy so the kernel surfaces
  // monetisation as blocked rather than presenting a fabricated dollar return.
  const grossValueIsProxy = true;

  notes.push(
    "Value: the gross value range is built from the Function Pack's " +
      "curated value benchmarks — labelled planning ranges, NOT this " +
      "tenant's own measured unit economics. It is carried as a proxy, so " +
      "the kernel honestly blocks a claimable dollar payback until the " +
      "tenant's spend base and the seed-gapped metrics are supplied.",
  );
  if (baseline.seedGaps.length > 0) {
    notes.push(
      `Value: ${baseline.seedGaps.length} operating metric(s) needed to ` +
        "ground the forecast are seed-gapped — the value range is a " +
        "planning proxy, not a forecast, until they are closed.",
    );
  }

  return buildValueForecast({
    moveName,
    grossAnnualValue: rangeOf(grossIndex.low, grossIndex.high),
    horizonYears: 3,
    // A deliberately conservative adoption ramp — value lands as people change
    // how they work, never on day one. A planning curve, not a commitment.
    adoptionCurve: [0.3, 0.65, 0.85],
    haircutScores,
    grossValueIsProxy,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Assumption-ledger derivation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Derive the assumption ledger from the pack's curated layers.
 *
 * Each dominant haircut factor becomes a first-class, owned assumption — the
 * pack's own read of why value must be discounted is exactly the named
 * assumption a CFO must track. Evidence anchors and pain themes add the
 * grounding/risk assumptions. Every assumption that stands in for absent
 * tenant data is flagged `isSeedGapProxy` and owned by a
 * "to be confirmed with the tenant" placeholder — never a fabricated name.
 */
function deriveAssumptions(
  pack: FunctionPack,
  baseline: BaselineModel,
  notes: string[],
): AssumptionLedger {
  const inputs: AssumptionInput[] = [];
  const seen = new Set<string>();
  const add = (input: AssumptionInput): void => {
    if (seen.has(input.key)) return;
    seen.add(input.key);
    inputs.push(input);
  };

  // The honest owner placeholder — origination has not yet assigned named
  // human owners for a freshly-derived Move, so the ledger says so plainly
  // rather than inventing accountable people.
  const tenantOwner = "To be confirmed with the tenant (Move sponsor)";

  // (a) Dominant haircut factors → high-impact value assumptions.
  pack.valueModel.dominantHaircutFactors.forEach((factor, i) => {
    add({
      key: `haircut_${i}_${slug(factor.factor)}`,
      statement:
        `${factor.factor}: ${factor.rationale} Planning haircut range ` +
        `${formatPct(factor.typicalHaircut.low)}–` +
        `${formatPct(factor.typicalHaircut.high)} of unhaircut value ` +
        `(${factor.typicalHaircut.label}).`,
      owner: tenantOwner,
      confidence: "low",
      source: `Function Pack value model — dominant haircut factor (${factor.typicalHaircut.basis})`,
      // The first two haircut factors bite hardest (the pack orders them
      // hardest-first), so they are the high movers of the case.
      sensitivityImpact: i < 2 ? "high" : "medium",
      isSeedGapProxy: true,
    });
  });

  // (b) The value-realisation narrative → the central economic assumption.
  add({
    key: "value_realization_engine",
    statement:
      "Value realisation follows the Function Pack model: " +
      truncate(pack.valueModel.valueRealizationNarrative, 320),
    owner: tenantOwner,
    confidence: "low",
    source: "Function Pack value model — value realisation narrative",
    sensitivityImpact: "high",
    isSeedGapProxy: true,
  });

  // (c) Time-to-value band → a scheduling assumption.
  add({
    key: "time_to_value_band",
    statement:
      "Time to value is assumed to track the Function Pack band: " +
      truncate(pack.valueModel.timeToValueBand, 240),
    owner: tenantOwner,
    confidence: "low",
    source: "Function Pack value model — time-to-value band",
    sensitivityImpact: "medium",
    isSeedGapProxy: true,
  });

  // (d) Evidence anchors → grounding assumptions: the case assumes the
  // authoritative source exists and carries good evidence.
  pack.evidenceAnchors.slice(0, 3).forEach((anchor, i) => {
    add({
      key: `evidence_${i}_${slug(anchor.claim)}`,
      statement:
        `It is assumed the tenant can substantiate "${anchor.claim}" from ` +
        `${anchor.authoritativeSource} — good evidence is: ` +
        `${truncate(anchor.whatGoodEvidenceLooksLike, 200)} ` +
        `Weak evidence to reject: ${truncate(anchor.weakEvidenceToReject, 160)}`,
      owner: tenantOwner,
      confidence: "low",
      source: "Function Pack — evidence anchor",
      sensitivityImpact: "medium",
      isSeedGapProxy: true,
    });
  });

  // (e) Pain themes → risk assumptions: the case assumes the named failure
  // mode is being actively managed.
  pack.painThemes.slice(0, 2).forEach((theme, i) => {
    add({
      key: `pain_${i}_${slug(theme.key)}`,
      statement:
        `It is assumed the Move design addresses the "${theme.name}" failure ` +
        `mode — ${truncate(theme.description, 200)} Detection signal: ` +
        `${truncate(theme.detectionSignal, 140)}`,
      owner: tenantOwner,
      confidence: "low",
      source: "Function Pack — pain theme / failure mode",
      sensitivityImpact: "medium",
      isSeedGapProxy: true,
    });
  });

  // (f) An explicit baseline-coverage assumption when the Move's data is thin —
  // the honest "the case rests on planning proxies" statement.
  if (baseline.seedGaps.length > 0) {
    add({
      key: "baseline_coverage_gap",
      statement:
        `The case rests on ${baseline.seedGaps.length} seed-gapped operating ` +
        `metric(s); their values are assumed to be obtainable from the ` +
        "named data sources before the funding gate. Until then the " +
        "baseline is incomplete and the forecast is a planning proxy.",
      owner: tenantOwner,
      confidence: "low",
      source: "Derived from the Move baseline — seed-gap coverage",
      sensitivityImpact: "high",
      isSeedGapProxy: true,
    });
  }

  // (g) The effort estimate is a planning range, not a quote — an explicit,
  // owned assumption rather than silent fine print.
  add({
    key: "effort_is_planning_estimate",
    statement:
      "The effort and cost figures are a planning range derived from the " +
      "Function Pack archetypes and the researched benchmark rate card — " +
      "NOT a quote. They must be replaced with a client-specific estimate " +
      "before any funding commitment.",
    owner: tenantOwner,
    confidence: "medium",
    source: "Researched benchmark rate card — planning range",
    sensitivityImpact: "medium",
    isSeedGapProxy: false,
  });

  const ledger = buildAssumptionLedger(inputs);
  notes.push(
    `Assumptions: ${ledger.assumptions.length} named assumptions derived from ` +
      `the Function Pack (haircut factors, value narrative, evidence anchors, ` +
      `pain themes); ${ledger.seedGapProxies.length} are seed-gap proxies ` +
      'owned by a "to be confirmed with the tenant" placeholder — no human ' +
      "owner is fabricated.",
  );
  return ledger;
}

// ─────────────────────────────────────────────────────────────────────────────
// Effort-estimate derivation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Derive a planning-range effort estimate from the pack's AI use-case
 * archetypes and reference solution patterns.
 *
 * The kernel decomposes a Move into eight standard workstreams. The pack does
 * not carry an effort estimate (it is a curated depth layer, not a costed
 * plan), so the workstream shape is a conservative PLANNING template scaled by
 * two pack-derived signals:
 *
 *  - data-dependency weight — the count of distinct data dependencies across
 *    the archetypes drives the data and integration workstreams;
 *  - control-posture weight — a heavier control posture (human-in-the-loop,
 *    approval-required) across archetypes drives the data-governance and
 *    process-redesign workstreams.
 *
 * The estimate is built on the kernel's default RESEARCHED benchmark rate card
 * — a market planning range, explicitly NOT a quote. The whole estimate is
 * surfaced as a planning estimate via the `effort_is_planning_estimate`
 * assumption above.
 */
function readAiOperatingCost(
  move: MoveBusinessCaseInput,
): AiOperatingCostInput | null {
  return move.aiOperatingCost ?? move.ai_operating_cost ?? null;
}

function deriveEffort(
  moveName: string,
  pack: FunctionPack,
  aiOps: AiOperatingCostInput | null,
): EffortEstimate {
  // Pack-derived signals — both clamped to a conservative band so a pack with
  // an unusually long archetype list cannot inflate the estimate without
  // bound.
  const dataDeps = new Set<string>();
  let approvalHeavyArchetypes = 0;
  for (const archetype of pack.aiUseCaseArchetypes) {
    for (const dep of archetype.dataDependencies) {
      dataDeps.add(dep.toLowerCase().trim());
    }
    if (
      archetype.controlPosture === "human-in-the-loop" ||
      archetype.controlPosture === "human-approval-required"
    ) {
      approvalHeavyArchetypes += 1;
    }
  }
  // A weight in roughly 1.0..1.6 — every Move gets a credible base, a
  // data-heavy or control-heavy function gets proportionally more.
  const dataWeight = clampBand(1 + dataDeps.size / 20, 1, 1.6);
  const controlWeight = clampBand(
    1 + approvalHeavyArchetypes / Math.max(1, pack.aiUseCaseArchetypes.length),
    1,
    1.6,
  );
  // Reference solution patterns drive build complexity.
  const patternWeight = clampBand(
    1 + pack.referenceSolutionPatterns.length / 12,
    1,
    1.5,
  );

  // Headcounts are rounded so the should-cost engine receives clean role
  // mixes; every count is a conservative planning template, not a quote.
  const hc = (base: number, weight: number): number =>
    Math.max(0.5, Math.round(base * weight * 2) / 2);

  const workstreams: WorkstreamInput[] = [
    {
      id: "ai_build",
      durationMonths: 9,
      agentSplit: 0.35,
      roleMix: [
        { role: "solution_architect", headcount: 1 },
        { role: "senior_engineer", headcount: hc(2, patternWeight) },
        { role: "engineer", headcount: hc(2, patternWeight) },
      ],
    },
    {
      id: "integration",
      durationMonths: 6,
      agentSplit: 0.2,
      roleMix: [
        { role: "senior_engineer", headcount: 1 },
        { role: "engineer", headcount: hc(2, dataWeight) },
      ],
    },
    {
      id: "data",
      durationMonths: 5,
      agentSplit: 0.3,
      roleMix: [
        { role: "engineer", headcount: hc(1, dataWeight) },
        { role: "analyst", headcount: hc(2, dataWeight) },
      ],
    },
    {
      id: "foundational",
      durationMonths: 4,
      agentSplit: 0.15,
      roleMix: [{ role: "solution_architect", headcount: 1 }],
    },
    {
      id: "data_governance",
      durationMonths: 6,
      agentSplit: 0.1,
      roleMix: [
        { role: "analyst", headcount: hc(1, controlWeight) },
        { role: "project_manager", headcount: 0.5 },
      ],
    },
    {
      id: "process_redesign",
      durationMonths: 5,
      agentSplit: 0.1,
      roleMix: [
        { role: "analyst", headcount: hc(1.5, controlWeight) },
        { role: "project_manager", headcount: 0.5 },
      ],
    },
    {
      id: "change_adoption",
      durationMonths: 9,
      agentSplit: 0.05,
      roleMix: [
        { role: "project_manager", headcount: 1 },
        { role: "analyst", headcount: 1 },
      ],
    },
    {
      id: "run",
      durationMonths: 12,
      agentSplit: 0.4,
      roleMix: [
        { role: "engineer", headcount: 1 },
        { role: "analyst", headcount: 1 },
      ],
    },
  ];

  // The estimate is built on the kernel's RESEARCHED benchmark rate card — a
  // labelled market planning range, explicitly NOT a quote. It is always
  // overridable by a client-specific card before any funding commitment.
  return buildEffortEstimate({
    moveName,
    rateCard: DEFAULT_PLANNING_RATE_CARD,
    offshoreRatio: 0.4,
    workstreams,
    aiOps,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Tower-handoff derivation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Derive the Tower measurement handoff — the operating metrics Tower tracks
 * once the Move goes live.
 *
 * Every pack operating metric is a candidate; the handoff carries each with
 * its recorded baseline value where the Move has one, and an explicit
 * readiness note flagging a seed-gapped metric as not measurable until its gap
 * is closed. No target value is fabricated — a curated planning benchmark is
 * NOT a tenant commitment, so the target is left `null` and the readiness note
 * says the target is set with the tenant.
 */
function deriveTowerHandoff(
  pack: FunctionPack,
  baseline: BaselineModel,
): TowerMeasurementHandoff[] {
  const recordedByKey = new Map(
    baseline.recordedMetrics.map((m) => [m.key, m]),
  );
  return pack.operatingMetrics.map((metric: OperatingMetric) => {
    const recorded = recordedByKey.get(metric.key);
    if (recorded) {
      return {
        metricKey: metric.key,
        metricLabel: metric.name,
        baselineValue: recorded.value,
        // No fabricated target — a planning benchmark is not a commitment.
        targetValue: null,
        unit: recorded.unit,
        readinessNote:
          `Measurable now from the tenant baseline (${recorded.source}). ` +
          `The improvement target is set with the tenant — the Function ` +
          `Pack benchmark (${metric.benchmarkRange.low}–` +
          `${metric.benchmarkRange.high} ${metric.unit}, planning-range) ` +
          "frames the range, it is not a committed target.",
      };
    }
    return {
      metricKey: metric.key,
      metricLabel: metric.name,
      baselineValue: null,
      targetValue: null,
      unit: metric.unit,
      readinessNote:
        `SEED GAP — not measurable until the baseline for "${metric.name}" ` +
        `is captured (expected source: ${metric.dataSource}). Tower cannot ` +
        "verify movement on this metric before the gap is closed.",
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Small pure helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Lower-cased, underscore-joined slug of a label — for stable assumption keys. */
function slug(label: string): string {
  return (
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .split("_")
      .slice(0, 4)
      .join("_") || "item"
  );
}

/** Format a 0–1 fraction as a percent string, e.g. 0.25 → "25%". */
function formatPct(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}

/** Truncate text to `max` characters, appending an ellipsis when cut. */
function truncate(text: string, max: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

/** Clamp a number into an arbitrary [min, max] band, rounded to 4 dp. */
function clampBand(n: number, min: number, max: number): number {
  const clamped = Math.min(max, Math.max(min, n));
  return Math.round(clamped * 10_000) / 10_000;
}
