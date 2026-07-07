// Meridian × Population-Health / Value-Based-Care — the decision-home binding.
//
// This module is the data layer for the function-aware decision home (the
// reference surface defined in docs/strategy/ABARVA-EXPERIENCE-DESIGN-SPEC.md
// §4). It binds the Population-Health / VBC Domain Function Pack — the FRAME:
// operating metrics, the value model, archetypes, vocabulary, the cadence —
// and fills that frame with Meridian Health's real, audited substrate.
//
// The substrate is the same audited Meridian evidence base the kernel anchor
// already trusts (`meridian-ambient-clinical-case.ts` → the program evidence
// base). NOTHING here is invented. Where the Function Pack expects a VBC
// operating metric Meridian has no audited value for, the metric is returned
// as an explicit, named SEED GAP — never a fabricated confident number. That
// honesty is the spec's §3 "honest by construction" bar.
//
// Pure, deterministic, typed module — no I/O. The route renders it as a pure
// server read; no kernel logic changes.

import {
  resolveFunctionPack,
} from './function-pack-registry';
import type {
  FunctionPack,
  FunctionPackIndustryKey,
  OperatingMetric,
} from './function-pack-types';
import type {
  TenantMetricObservation,
  TenantSubstrate,
} from './tenant-substrate';
import {
  type DecisionHomeBinding,
  type DecisionHomeGroundedBlocks,
  registerDecisionHomeBinding,
  resolveDecisionHomeBinding,
} from './tenant-binding-registry';

// ─────────────────────────────────────────────────────────────────────────────
// Keys — the Meridian reference binding the decision home ships as its example
// ─────────────────────────────────────────────────────────────────────────────

/** The industry of the Meridian tenant — a healthcare provider / IDN. */
export const MERIDIAN_INDUSTRY_KEY = 'healthcare-provider' as const;

/** The function the decision home binds for a population-health user. */
export const MERIDIAN_FUNCTION_KEY = 'population_health_value_based_care' as const;

/** The Meridian tenant key — matches `client-config.ts` and `active-client.ts`. */
export const MERIDIAN_TENANT_KEY = 'meridian' as const;

// ─────────────────────────────────────────────────────────────────────────────
// Meridian substrate — the audited values that fill the Function-Pack frame
// ─────────────────────────────────────────────────────────────────────────────

/**
 * One audited Meridian value for a Function-Pack operating metric, OR a
 * declared seed gap. A `value` of `null` with a `seedGap` reason is the
 * honest "the function expects this, Meridian has not measured it" state —
 * the spec's no-fabrication discipline made visible (§3).
 */
type MeridianMetricObservation = TenantMetricObservation;

/**
 * Meridian's audited substrate, expressed against the VBC Function Pack's
 * operating-metric vocabulary.
 *
 * GROUNDING DISCIPLINE — every non-null value below traces to the same audited
 * Meridian evidence base the kernel anchor (`meridian-ambient-clinical-case.ts`)
 * already relies on. Meridian's audited program is the Ambient Clinical Value
 * Chain — a clinical-operations / documentation program — so the substrate it
 * has measured genuinely touches only a SUBSET of the VBC function's twelve
 * operating metrics: RAF capture, quality-measure capture, and the wellness-
 * visit cadence. The economics of the risk contract itself — MLR, the
 * shared-savings settlement, PMPM trend, attribution stability, leakage — are
 * NOT in Meridian's audited substrate. They are returned as precise seed gaps.
 *
 * This is the §3 honesty bar in data form: the decision home shows what
 * Meridian truly knows and is plainly honest about the rest.
 */
const MERIDIAN_VBC_OBSERVATIONS: readonly MeridianMetricObservation[] = [
  {
    // RAF capture — Meridian's audited HCC capture on the MA panel. The
    // Function Pack expresses RAF as "captured RAF as % of expected RAF";
    // Meridian's evidence base reports HCC capture at 58% with a cohort
    // median of 62% and a top quartile of 71% (E28). It is a directly
    // comparable, audited measure of the same thing.
    metricKey: 'raf_score_accuracy',
    value: 58,
    source:
      'Meridian evidence base E28 (D10 Benchmark Comparison · cohort ' +
      'scorecard) — HCC capture on the MA panel, as-of 2026-02-26.',
    read:
      'At 58%, Meridian sits below the Function Pack’s 85–100% planning ' +
      'band and below its own cohort median of 62% — fourth-quartile on ' +
      'ambient-value-chain integration maturity. Under-capture quietly ' +
      'understates the population and caps every downstream economic result.',
  },
  {
    // Quality-measure capture — Meridian's audited HEDIS + Stars
    // documentation capture. Maps onto the Function Pack's quality composite:
    // the blended performance on the measures that gate revenue.
    metricKey: 'quality_composite_score',
    value: 34,
    source:
      'Meridian evidence base E47 (D15 Intervention Portfolio · lever ' +
      'outcome envelope) — HEDIS + Stars documentation capture, 2026-03-18.',
    read:
      'Quality-measure documentation capture sits at 34%, far below the ' +
      'Function Pack’s 70–90 planning band. Quality gates collectibility — ' +
      'a strong cost result is forfeited if the quality composite misses ' +
      'the program threshold. Lever 2 targets 55–65% from this baseline.',
  },
  {
    // Annual wellness visit — Meridian has NOT measured an AWV completion
    // rate as such, but the audited substrate carries the closely-adjacent
    // ambulatory-visit cadence. We DO NOT treat that as an AWV rate (that
    // would be a fabricated mapping); the AWV metric is a declared seed gap.
    metricKey: 'annual_wellness_visit_rate',
    value: null,
    source: 'seed gap — not in Meridian’s audited substrate.',
    seedGapReason:
      'Meridian’s audited evidence base measures ambulatory visit volume ' +
      '(84 visits / clinician / week, E19) but does NOT record an annual ' +
      'wellness-visit completion rate for the attributed population. The ' +
      'Function Pack expects it — it is the primary structured opportunity ' +
      'to close care gaps and capture coding. Sourced from EHR scheduling ' +
      'and encounter data reconciled against claims; until it is seeded the ' +
      'care-gap and RAF cadence cannot be planned against a baseline.',
  },
] as const;

/**
 * The Function-Pack operating-metric keys Meridian has an AUDITED value for.
 * Everything else is a seed gap. Kept explicit so the binding is honest by
 * construction — a metric is "grounded" only if it appears here with a value.
 */
const MERIDIAN_GROUNDED_METRIC_KEYS: ReadonlySet<string> = new Set(
  MERIDIAN_VBC_OBSERVATIONS.filter((o) => o.value !== null).map(
    (o) => o.metricKey,
  ),
);

// The shared `TenantSubstrate` type — Meridian, Apex, and First Capital all
// describe their audited observations in the same vocabulary so the generic
// builder never has to know which tenant it is binding.

// ─────────────────────────────────────────────────────────────────────────────
// Block 1 — the one thing
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The single confident headline (§4.1). It is honest by construction: it
 * asserts only what Meridian's audited substrate supports, and it names the
 * one structural seed gap plainly rather than dressing a missing number as a
 * confident claim.
 */
export interface DecisionHomeHeadline {
  /** The eyebrow — the function, in its own language. */
  eyebrow: string;
  /** The headline — the most decision-relevant truth right now. */
  statement: string;
  /**
   * The honesty clause — the load-bearing caveat. The headline leads with
   * what is true; this names, in the same breath, the gap that bounds it.
   */
  honestyClause: string;
  /** The cadence anchor the headline is timed against. */
  cadenceAnchor: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Block 2 — decisions that need you
// ─────────────────────────────────────────────────────────────────────────────

/** The urgency band a decision sits in — drives ordering and the read. */
export type DecisionUrgency = 'decide_now' | 'this_cycle' | 'before_settlement';

/**
 * One answer-first decision card (§4.2): the recommended action, the stake,
 * one piece of evidence, and one gesture into the full decision.
 */
export interface DecisionCard {
  /** Stable key. */
  key: string;
  /** The urgency band — sorted by what the VBC cadence makes matter now. */
  urgency: DecisionUrgency;
  /** The recommended action — the answer, stated first. */
  recommendedAction: string;
  /** The financial / clinical stake if the decision is not taken. */
  stake: string;
  /** Exactly one piece of evidence behind the recommendation. */
  evidence: string;
  /**
   * Whether the evidence rests on a Meridian seed gap. When true the card
   * renders the honesty marker — the recommendation stands, but its
   * quantification is explicitly unverified.
   */
  evidenceRestsOnSeedGap: boolean;
  /** The label of the one gesture deeper — into the full, costed decision. */
  gestureLabel: string;
  /** Where the gesture leads. */
  gestureHref: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Block 3 — the function's vitals
// ─────────────────────────────────────────────────────────────────────────────

/** The state of one vital relative to its Function-Pack benchmark. */
export type VitalState = 'off' | 'in_range' | 'seed_gap';

/**
 * One VBC operating metric as a vital (§4.3). Carries the Function-Pack frame
 * (definition, benchmark, why it matters) and Meridian's audited value — or
 * an explicit seed gap. The 1–3 that are `off` are surfaced; the rest collapse.
 */
export interface FunctionVital {
  /** The Function-Pack operating-metric key. */
  key: string;
  /** Human label, from the Function Pack. */
  name: string;
  /** The metric definition, from the Function Pack. */
  definition: string;
  /** The unit, from the Function Pack. */
  unit: string;
  /** The Function-Pack planning benchmark range, low–high. */
  benchmarkLow: number;
  benchmarkHigh: number;
  /** The benchmark basis — why the range is the range. */
  benchmarkBasis: string;
  /** Why the metric matters, from the Function Pack. */
  whyItMatters: string;
  /** Meridian's audited value — `null` when this vital is a seed gap. */
  meridianValue: number | null;
  /** The state of the vital against its benchmark. */
  state: VitalState;
  /** The read — what the value or the gap means right now. */
  read: string;
  /** The substrate citation or the seed-gap reason. */
  source: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Block 4 — where you are in the cadence
// ─────────────────────────────────────────────────────────────────────────────

/** One stage of the VBC performance-year rhythm. */
export interface CadenceStage {
  /** Stable key. */
  key: string;
  /** The stage label. */
  label: string;
  /** What this stage of the performance year demands of the function. */
  demands: string;
  /** Whether this is the stage the tenant is currently in. */
  isCurrent: boolean;
}

/** The cadence block (§4.4) — the VBC performance-year rhythm and the now. */
export interface CadenceBlock {
  /** The cadence's name, from the Function Pack's regulatory frame. */
  frameName: string;
  /** A one-line framing of why the cadence governs the function. */
  framing: string;
  /** The performance-year stages, in order. */
  stages: CadenceStage[];
  /** What the current stage demands — surfaced above the timeline. */
  currentDemand: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// The assembled decision home
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The complete data for the function-aware decision home. The route renders
 * exactly these four blocks, in this order — the §4 structure.
 */
export interface VbcDecisionHome {
  /** The bound Function Pack — the frame. */
  functionLabel: string;
  /** The pack version + last-reviewed date — provenance for the frame. */
  packProvenance: string;
  /** The tenant display name. */
  tenantName: string;
  /**
   * True when the home is showing the Meridian reference binding rather than
   * the active tenant's own analysis — surfaced so a non-Meridian tenant never
   * reads Meridian's metrics as their own.
   */
  isReferenceExample: boolean;
  /** Block 1 — the one thing. */
  headline: DecisionHomeHeadline;
  /** Block 2 — decisions that need you, urgency-ordered. */
  decisions: DecisionCard[];
  /** Block 3 — the function's vitals. */
  vitals: {
    /** The 1–3 vitals that are off — surfaced. */
    off: FunctionVital[];
    /** The vitals that are in range or seed gaps — collapsed one gesture away. */
    rest: FunctionVital[];
    /** How many of the function's expected metrics Meridian has grounded. */
    groundedCount: number;
    /** The total expected metrics — the denominator for honest coverage. */
    expectedCount: number;
  };
  /** Block 4 — where you are in the cadence. */
  cadence: CadenceBlock;
}

/**
 * Back-compat type alias — the original name for the assembled decision home.
 * Existing consumers (the `DecisionHomeView`, its tests) import this name.
 */
export type MeridianVbcDecisionHome = VbcDecisionHome;

// ─────────────────────────────────────────────────────────────────────────────
// The binding — the FRAME (Function Pack) filled with the SUBSTRATE (tenant)
// ─────────────────────────────────────────────────────────────────────────────

const URGENCY_RANK: Record<DecisionUrgency, number> = {
  decide_now: 0,
  this_cycle: 1,
  before_settlement: 2,
};

/** Look up a substrate's observation for a Function-Pack metric, if any. */
function observationFor(
  substrate: TenantSubstrate,
  metricKey: string,
): MeridianMetricObservation | undefined {
  return substrate.find((o) => o.metricKey === metricKey);
}

/**
 * Decide a vital's state. A grounded value is `off` when it sits outside the
 * Function-Pack planning band in the wrong direction, `in_range` otherwise.
 * A metric the tenant has not measured is a `seed_gap` — never silently "ok".
 */
function vitalFor(
  substrate: TenantSubstrate,
  metric: OperatingMetric,
  functionLabel: string,
  tenantName: string,
): FunctionVital {
  const obs = observationFor(substrate, metric.key);
  const { low, high, basis } = metric.benchmarkRange;

  if (!obs || obs.value === null) {
    return {
      key: metric.key,
      name: metric.name,
      definition: metric.definition,
      unit: metric.unit,
      benchmarkLow: low,
      benchmarkHigh: high,
      benchmarkBasis: basis,
      whyItMatters: metric.whyItMatters,
      meridianValue: null,
      state: 'seed_gap',
      read:
        obs?.seedGapReason ??
        `The ${functionLabel} function expects "${metric.name}", ` +
          `sourced from ${metric.dataSource}. ${tenantName} has no audited ` +
          `value for it — a seed gap, not a number. Its absence blocks the ` +
          `baseline and the value forecast for this metric.`,
      source:
        obs?.source ??
        `seed gap — not in ${tenantName}’s audited substrate.`,
    };
  }

  // Direction-aware: a metric is "off" only when it moves the wrong way past
  // its planning band. `in-range` metrics are off when outside the band on
  // either side.
  let isOff: boolean;
  switch (metric.directionOfGood) {
    case 'higher':
      isOff = obs.value < low;
      break;
    case 'lower':
      isOff = obs.value > high;
      break;
    case 'in-range':
    default:
      isOff = obs.value < low || obs.value > high;
      break;
  }

  return {
    key: metric.key,
    name: metric.name,
    definition: metric.definition,
    unit: metric.unit,
    benchmarkLow: low,
    benchmarkHigh: high,
    benchmarkBasis: basis,
    whyItMatters: metric.whyItMatters,
    meridianValue: obs.value,
    state: isOff ? 'off' : 'in_range',
    read: obs.read ?? metric.whyItMatters,
    source: obs.source,
  };
}

/**
 * Build the honest blocks for a binding with NO audited tenant substrate. Every
 * Function-Pack metric is a seed gap, so the decision home says so plainly
 * rather than fabricating a measured headline or a costed decision.
 */
function ungroundedBlocks(
  pack: FunctionPack,
  tenantName: string,
): {
  headline: DecisionHomeHeadline;
  decisions: DecisionCard[];
  cadence: CadenceBlock;
} {
  const sampleMetrics = pack.operatingMetrics
    .slice(0, 3)
    .map((m) => m.name.toLowerCase())
    .join(', ');
  const frame = pack.vocabulary.regulatoryFrames[0];

  const headline: DecisionHomeHeadline = {
    eyebrow: pack.functionLabel,
    statement:
      `${tenantName}’s ${pack.functionLabel.toLowerCase()} decision home is ` +
      `bound to a curated Function Pack — the frame is real — but ` +
      `${tenantName} has not yet seeded an audited operating-metric ` +
      `substrate for this function. The home can show what the function ` +
      `expects; it cannot yet show ${tenantName}’s own numbers.`,
    honestyClause:
      `This is honest by construction. All ${pack.operatingMetrics.length} ` +
      `of the function’s operating metrics render below as seed gaps, not as ` +
      `fabricated values. Seeding them from ${tenantName}’s systems of ` +
      `record is the work that turns this frame into ${tenantName}’s own ` +
      `decision home.`,
    cadenceAnchor:
      `The ${frame?.name ?? pack.functionLabel} cadence sets when this ` +
      `function’s work must land.`,
  };

  const decisions: DecisionCard[] = [
    {
      key: 'seed_operating_metric_substrate',
      urgency: 'decide_now',
      recommendedAction:
        `Commission the ${pack.functionLabel.toLowerCase()} operating-metric ` +
        `baseline — ${sampleMetrics}, and the rest — from ${tenantName}’s ` +
        `systems of record before any value forecast for this function is ` +
        `underwritten.`,
      stake:
        `Without an audited substrate the decision home can show the frame ` +
        `of the ${pack.functionLabel.toLowerCase()} function but not ` +
        `${tenantName}’s standing in it. A forecast built on the frame alone ` +
        `would be fabricated, not measured.`,
      evidence:
        `The ${pack.functionLabel} Function Pack expects ` +
        `${pack.operatingMetrics.length} operating metrics, each sourced ` +
        `from a named system of record; ${tenantName}’s audited substrate ` +
        `carries none of them yet — a precise, named seed gap.`,
      evidenceRestsOnSeedGap: true,
      gestureLabel: 'Review the operating-metric seed gaps',
      gestureHref: '/admin/data-trust',
    },
    {
      key: 'review_function_frame',
      urgency: 'this_cycle',
      recommendedAction:
        `Review the ${pack.functionLabel.toLowerCase()} Function Pack’s ` +
        `value model and AI use-case archetypes to scope which bets are ` +
        `worth seeding substrate for first.`,
      stake:
        `The function offers ${pack.aiUseCaseArchetypes.length} curated AI ` +
        `use-case archetypes. Choosing which to ground first is the ` +
        `highest-leverage decision available before substrate exists.`,
      evidence:
        `The Function Pack’s value model and archetypes are curated and ` +
        `audited; they are a real frame to plan against even before ` +
        `${tenantName}’s own metrics are seeded.`,
      evidenceRestsOnSeedGap: true,
      gestureLabel: 'Open the bet-selection surface',
      gestureHref: '/intelligence/decision',
    },
  ];

  const cadence: CadenceBlock = {
    frameName: frame?.name ?? `${pack.functionLabel} operating cadence`,
    framing:
      frame?.relevance ??
      `The ${pack.functionLabel.toLowerCase()} function runs on a recurring ` +
        `operating cadence — its rhythm sets when the work must land.`,
    stages: [
      {
        key: 'frame_bound',
        label: 'Function Pack bound — the frame is real',
        demands:
          `The curated ${pack.functionLabel} Function Pack is bound: the ` +
          `operating metrics, value model, and archetypes are in place.`,
        isCurrent: false,
      },
      {
        key: 'substrate_seeding',
        label: 'Substrate seeding — the audited baseline',
        demands:
          `This is where ${tenantName} sits: the function’s operating ` +
          `metrics must be seeded from the systems of record before the ` +
          `home can show ${tenantName}’s own numbers.`,
        isCurrent: true,
      },
      {
        key: 'decision_ready',
        label: 'Decision-ready — the home is grounded',
        demands:
          `Once the substrate is audited, the decision home surfaces the ` +
          `off-benchmark metrics and the costed decisions they drive.`,
        isCurrent: false,
      },
    ],
    currentDemand:
      `${tenantName} is in substrate seeding — the operating-metric baseline ` +
      `for this function must be audited before the decision home can show ` +
      `measured standing rather than the function frame alone.`,
  };

  return { headline, decisions, cadence };
}

/**
 * Build the four §4 blocks of the function-aware decision home for any
 * `(industryKey, functionKey)` binding.
 *
 * The builder is GENERIC over the Function Pack: the pack's operating metrics
 * are the vitals frame, scored against `substrateFor(...)`. The Meridian × VBC
 * binding carries audited tenant data; every other binding gets the empty
 * substrate, so its vitals render as honest seed gaps and its blocks say so
 * plainly rather than fabricating measured copy.
 *
 * Returns `null` only if no Function Pack is catalogued for the binding — the
 * same honest "no curated pack" signal the registry uses.
 *
 * @param industryKey The Function Pack industry — e.g. `'retail'`.
 * @param functionKey The Function Pack function — e.g. `'pricing_promotions'`.
 * @param tenantName  The resolved tenant display name (e.g. "Apex Retail").
 */
export function buildVbcDecisionHome(
  industryKey: FunctionPackIndustryKey,
  functionKey: string,
  tenantName: string,
): VbcDecisionHome | null {
  const pack: FunctionPack | null = resolveFunctionPack(
    industryKey,
    functionKey,
  );
  if (!pack) return null;

  // Consult the tenant-binding registry — Meridian × VBC, Apex × customer
  // care, First Capital × fraud each register an audited substrate plus a
  // grounded-blocks builder. An unknown `(industry, function)` resolves to
  // `null` and the surface renders honestly as unseeded.
  const binding = resolveDecisionHomeBinding(industryKey, functionKey);
  const substrate: TenantSubstrate = binding?.substrate ?? [];
  const isGroundedBinding = substrate.length > 0;

  // ── Block 3 — vitals (built first; the headline reads off them) ──────────
  const allVitals = pack.operatingMetrics.map((m) =>
    vitalFor(substrate, m, pack.functionLabel, tenantName),
  );
  const off = allVitals.filter((v) => v.state === 'off');
  const rest = allVitals.filter((v) => v.state !== 'off');
  const groundedCount = allVitals.filter(
    (v) => v.meridianValue !== null,
  ).length;

  // For a binding with no audited substrate (or one registered but explicitly
  // empty), every block is the honest unseeded form — the frame is real, the
  // tenant's numbers are not yet.
  if (!isGroundedBinding || !binding) {
    const blocks = ungroundedBlocks(pack, tenantName);
    return {
      functionLabel: pack.functionLabel,
      packProvenance: `Function Pack v${pack.version} · reviewed ${pack.lastReviewed}`,
      tenantName,
      isReferenceExample: false,
      headline: blocks.headline,
      decisions: blocks.decisions,
      vitals: {
        off,
        rest,
        groundedCount,
        expectedCount: pack.operatingMetrics.length,
      },
      cadence: blocks.cadence,
    };
  }

  // Hand the grounded copy build to the registered binding. The binding owns
  // its own tenant-named operator language — Meridian speaks the VBC clinical
  // economics, Apex speaks the retail care-operations economics, First
  // Capital speaks the banking fraud / financial-crime economics — and the
  // generic builder never has to know which.
  const grounded = binding.buildBlocks({ pack, tenantName, substrate });
  const decisions: DecisionCard[] = [...grounded.decisions].sort(
    (a, b) => URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency],
  );

  return {
    functionLabel: pack.functionLabel,
    packProvenance: `Function Pack v${pack.version} · reviewed ${pack.lastReviewed}`,
    tenantName,
    isReferenceExample: false,
    headline: grounded.headline,
    decisions,
    vitals: {
      off,
      rest,
      groundedCount,
      expectedCount: pack.operatingMetrics.length,
    },
    cadence: grounded.cadence,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// The Meridian × VBC tenant binding — the original reference binding.
//
// The grounded headline / decisions / cadence Meridian has shipped from day
// one, now expressed as a registered `DecisionHomeBinding` so the generic
// builder treats Meridian as one tenant among several — Apex, First Capital,
// and any future grounded binding follow the same shape.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The Meridian × VBC decision-home binding. Carries the audited substrate
 * (`MERIDIAN_VBC_OBSERVATIONS`) and the tenant-named operator copy for
 * Meridian's VBC decision home. Exported for test inspection and so a future
 * tenant binding has a canonical example to mirror.
 */
export const MERIDIAN_DECISION_HOME_BINDING: DecisionHomeBinding = {
  industryKey: MERIDIAN_INDUSTRY_KEY,
  functionKey: MERIDIAN_FUNCTION_KEY,
  tenantBindingKey: 'meridian-vbc',
  expectedClientKey: 'meridian',
  substrate: MERIDIAN_VBC_OBSERVATIONS,
  buildBlocks(): DecisionHomeGroundedBlocks {
    // Block 1 — the one thing. The headline asserts only audited truth: RAF
    // under-capture is the one metric Meridian has measured that decides
    // shared savings vs. loss. The honesty clause names, in the same breath,
    // the structural gap — Meridian has not seeded the contract-settlement
    // economics — so the headline is confident without being fabricated.
    const headline: DecisionHomeHeadline = {
      eyebrow: 'Population health & value-based care',
      statement:
        'Meridian’s value-based-care result turns on one number — RAF capture ' +
        'at 58%, well below the 85–100% the function expects. The population ' +
        'is being measured as healthier than it is, and that caps the ' +
        'benchmark and every downstream dollar.',
      honestyClause:
        'This is the one truth Meridian’s audited substrate can assert today. ' +
        'The contract-settlement economics that decide shared savings vs. loss ' +
        'outright — medical loss ratio, the shared-savings rate, PMPM trend, ' +
        'attribution stability — are not yet seeded for Meridian; they render ' +
        'below as explicit gaps, not as numbers.',
      cadenceAnchor:
        'Performance-year close and the risk-adjustment submission are the ' +
        'deadlines this depends on.',
    };

    // Block 2 — decisions that need you. Each card is answer-first and
    // grounded: action, stake, one evidence line, one gesture deeper.
    const decisions: DecisionCard[] = [
      {
        key: 'close_raf_capture_gap',
        urgency: 'decide_now',
        recommendedAction:
          'Fund the HCC / RAF coding-gap intelligence Move — surface ' +
          'clinically-evident, uncoded conditions to clinicians at the point ' +
          'of care before the risk-adjustment submission closes.',
        stake:
          'RAF capture at 58% vs. a 62% cohort median understates population ' +
          'acuity. The function values accurate RAF capture at a 2–8% ' +
          'risk-adjusted revenue uplift — a labelled planning range — and ' +
          'every percent of benchmark depends on it.',
        evidence:
          'Meridian evidence base E28: HCC capture 58% on the MA panel, ' +
          'fourth-quartile against the cohort. The gap to documented clinical ' +
          'truth is real and measured.',
        evidenceRestsOnSeedGap: false,
        gestureLabel: 'Open the costed RAF-capture case',
        gestureHref: '/moves',
      },
      {
        key: 'protect_quality_gate',
        urgency: 'this_cycle',
        recommendedAction:
          'Stand up the quality-revenue protection loop — project performance ' +
          'on every revenue-gating measure and route the closeable gaps to ' +
          'care management ranked by revenue impact.',
        stake:
          'Quality-measure capture is at 34%, far below the 70–90 the function ' +
          'expects. Quality is a gate, not a dial: a genuine cost result is ' +
          'forfeited if the composite misses the program threshold.',
        evidence:
          'Meridian evidence base E47: HEDIS + Stars documentation capture ' +
          '34%, with Lever 2 targeting a 55–65% band.',
        evidenceRestsOnSeedGap: false,
        gestureLabel: 'Open the quality-gate decision',
        gestureHref: '/moves',
      },
      {
        key: 'seed_settlement_economics',
        urgency: 'before_settlement',
        recommendedAction:
          'Commission the contract-settlement baseline — medical loss ratio, ' +
          'the shared-savings rate, risk-adjusted PMPM trend, attribution ' +
          'stability — from the payer settlement and benchmark feed before any ' +
          'VBC value forecast is underwritten.',
        stake:
          'Without these, the decision home can show the clinical inputs to ' +
          'the VBC result but not the result itself. A value forecast built ' +
          'on them now would be fabricated, not measured.',
        evidence:
          'The VBC Function Pack expects all four metrics from the CMS / payer ' +
          'benchmark-and-settlement report; Meridian’s audited substrate does ' +
          'not yet carry them — a precise, named seed gap.',
        evidenceRestsOnSeedGap: true,
        gestureLabel: 'Review the settlement-data seed gaps',
        gestureHref: '/admin/data-trust',
      },
    ];

    // Block 4 — where you are in the cadence. The MSSP performance-year
    // rhythm, anchored on the Function Pack's regulatory frame. Meridian sits
    // in the capture window — coding and quality capture still open,
    // settlement ahead.
    const cadence: CadenceBlock = {
      frameName: 'Medicare Shared Savings Program (MSSP)',
      framing:
        'The dominant Medicare ACO program — its performance-year rhythm sets ' +
        'when coding, quality, and settlement work must land.',
      stages: [
        {
          key: 'py_open',
          label: 'Performance year — open',
          demands:
            'Care-gap closure and HCC coding run continuously; the population ' +
            'baseline and risk model are validated against realised cost.',
          isCurrent: false,
        },
        {
          key: 'py_capture_window',
          label: 'Capture window — coding & quality still open',
          demands:
            'The last window to lift RAF capture and close revenue-gating ' +
            'quality measures before the year locks. This is where Meridian ' +
            'sits: RAF at 58% and quality capture at 34% are both still moveable.',
          isCurrent: true,
        },
        {
          key: 'py_close_submission',
          label: 'Year close & risk-adjustment submission',
          demands:
            'The performance year locks; the annual risk-adjustment submission ' +
            'is filed. Coding accuracy is now fixed — RADV-defensible or not.',
          isCurrent: false,
        },
        {
          key: 'settlement',
          label: 'Settlement & shared-savings reconciliation',
          demands:
            'The CMS benchmark-and-settlement report lands six to twelve ' +
            'months after year close and decides savings vs. loss. The cash ' +
            'result is lagged — the forecast must say when it actually arrives.',
          isCurrent: false,
        },
      ],
      currentDemand:
        'Meridian is in the capture window — the last stretch where RAF ' +
        'capture and quality-measure capture can still be moved before the ' +
        'performance year locks. Both Meridian metrics that are off are ' +
        'addressable from here; after year close they are fixed.',
    };

    return { headline, decisions, cadence };
  },
};

// Register the Meridian binding eagerly on module load. The generic builder
// consults the registry; Meridian is one tenant among several.
registerDecisionHomeBinding(MERIDIAN_DECISION_HOME_BINDING);

/**
 * Build the decision home for the Meridian × Population-Health / VBC binding —
 * the original reference binding.
 *
 * A thin back-compat shim over the generic `buildVbcDecisionHome`: existing
 * callers and tests that imported `buildMeridianVbcDecisionHome` keep working
 * unchanged, and the result is identical to what the old function produced.
 *
 * @param tenantName The resolved tenant display name (e.g. "Meridian Health").
 */
export function buildMeridianVbcDecisionHome(
  tenantName: string,
): VbcDecisionHome | null {
  return buildVbcDecisionHome(
    MERIDIAN_INDUSTRY_KEY,
    MERIDIAN_FUNCTION_KEY,
    tenantName,
  );
}

/** Exported for tests — the metric keys Meridian has grounded with substrate. */
export const MERIDIAN_GROUNDED_VBC_METRIC_KEYS = MERIDIAN_GROUNDED_METRIC_KEYS;
