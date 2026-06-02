// The bet-selection binding — the function-aware Intelligence surface.
//
// This module is the data layer for the function-aware Intelligence surface —
// the "which AI bet should we make" facet of the Apple-grade experience
// (docs/strategy/ABARVA-EXPERIENCE-DESIGN-SPEC.md §3, §6). It is the next facet
// after the decision home: where the decision home answers "what is true now",
// this answers "which AI bet should we fund first" for the bound function.
//
// It binds a Domain Function Pack over `(industryKey, functionKey)` and uses
// the pack's LAYER 3 — the AI use-case archetypes — as the candidate bet set.
// Each archetype already carries a value mechanism, an adoption profile, data
// dependencies, a control/risk posture and the operating metrics it moves.
// `buildVbcBetSelection` ranks those archetypes by what the function — plus any
// audited tenant substrate — make most fundable now. The builder is GENERIC
// over the pack: every line after `resolveFunctionPack(...)` reads
// `pack.operatingMetrics` / `pack.aiUseCaseArchetypes`, with no industry
// hardcoding.
//
// GROUNDING DISCIPLINE — a ranking is only as confident as the tenant substrate
// behind it. The Meridian × Population-Health / VBC binding is the one binding
// that carries an audited substrate today (`meridian-vbc-decision-home.ts` →
// the program evidence base behind `meridian-ambient-clinical-case.ts`).
// Meridian's audited program is the Ambient Clinical Value Chain — a clinical-
// operations / documentation program — so its substrate genuinely measures only
// a SUBSET of the VBC function: RAF capture (E28), quality-measure capture
// (E47), the ambulatory-visit cadence (E19). The risk-contract economics — MLR,
// the shared-savings settlement, PMPM trend, attribution stability, network
// leakage — are NOT in Meridian's audited substrate.
//
// For any other `(industryKey, functionKey)` binding the surface has no audited
// tenant substrate to ground against — so every bet is honestly held for
// evidence rather than fabricated as fundable. Where a bet's feasibility
// depends on a metric the tenant has not seeded, the ranking says so as an
// explicit, named SEED GAP and never fabricates a confident fundability claim.
// That honesty is the spec's §3 "honest by construction" bar.
//
// Pure, deterministic, typed module — no I/O. The route renders it as a pure
// server read; no kernel logic changes.

import { resolveFunctionPack } from './function-pack-registry';
import type {
  AdoptionProfile,
  AiUseCaseArchetype,
  ControlPosture,
  FunctionPack,
  FunctionPackIndustryKey,
  OperatingMetric,
} from './function-pack-types';
import type {
  TenantMetricObservation,
  TenantSubstrate,
} from './tenant-substrate';
import {
  type BetSelectionBinding,
  type BetSelectionBindingContext,
  type BetSelectionGroundedBlocks,
  registerBetSelectionBinding,
  resolveBetSelectionBinding,
} from './tenant-binding-registry';

// ─────────────────────────────────────────────────────────────────────────────
// Keys — the Meridian reference binding the surface ships as its example
// ─────────────────────────────────────────────────────────────────────────────

/** The industry of the Meridian tenant — a healthcare provider / IDN. */
export const MERIDIAN_INDUSTRY_KEY = 'healthcare-provider' as const;

/** The function the bet-selection surface binds for a population-health user. */
export const MERIDIAN_FUNCTION_KEY = 'population_health_value_based_care' as const;

/** The Meridian tenant key — matches `client-config.ts` and `active-client.ts`. */
export const MERIDIAN_TENANT_KEY = 'meridian' as const;

// ─────────────────────────────────────────────────────────────────────────────
// Meridian substrate — the audited evidence that grounds the ranking
// ─────────────────────────────────────────────────────────────────────────────

/**
 * One audited Meridian observation against a VBC Function-Pack operating
 * metric — OR a declared seed gap. A `value` of `null` with a `seedGapReason`
 * is the honest "the function expects this, Meridian has not measured it"
 * state — the no-fabrication discipline made visible (spec §3).
 *
 * This is intentionally the SAME substrate shape and the SAME audited values
 * as `meridian-vbc-decision-home.ts`; the bet-selection facet must agree with
 * the decision home, not invent a second, divergent picture of Meridian.
 */
// The bet-selection facet uses the shared `TenantMetricObservation` shape from
// `tenant-substrate.ts` so Meridian, Apex, and First Capital all express their
// audited substrates in the same vocabulary. Aliased locally so the existing
// Meridian-named call sites read unchanged.
type MeridianMetricObservation = TenantMetricObservation;

/**
 * Meridian's audited substrate, expressed against the VBC Function Pack's
 * operating-metric vocabulary. Every non-null value traces to the audited
 * Meridian program evidence base; everything else is a precise seed gap.
 *
 * RAF capture and quality-measure capture are measured and both sit below the
 * Function-Pack planning bands. The annual-wellness-visit rate, and the whole
 * risk-contract economics layer, are seed gaps — Meridian's clinical-operations
 * program never measured them.
 */
const MERIDIAN_VBC_OBSERVATIONS: readonly MeridianMetricObservation[] = [
  {
    metricKey: 'raf_score_accuracy',
    value: 58,
    source:
      'Meridian evidence base E28 (D10 Benchmark Comparison · cohort ' +
      'scorecard) — HCC capture on the MA panel, as-of 2026-02-26.',
  },
  {
    metricKey: 'quality_composite_score',
    value: 34,
    source:
      'Meridian evidence base E47 (D15 Intervention Portfolio · lever ' +
      'outcome envelope) — HEDIS + Stars documentation capture, 2026-03-18.',
  },
  {
    metricKey: 'annual_wellness_visit_rate',
    value: null,
    source: 'seed gap — not in Meridian’s audited substrate.',
    seedGapReason:
      'Meridian’s audited evidence base measures ambulatory visit volume ' +
      '(84 visits / clinician / week, E19) but records no annual ' +
      'wellness-visit completion rate for the attributed population. The ' +
      'AWV is the primary structured opportunity to close care gaps and ' +
      'capture coding — until it is seeded the capture cadence has no ' +
      'baseline.',
  },
  {
    metricKey: 'medical_loss_ratio',
    value: null,
    source: 'seed gap — not in Meridian’s audited substrate.',
    seedGapReason:
      'The medical loss ratio is sourced from payer settlement and premium ' +
      'data reconciled against the claims feed. Meridian’s audited program ' +
      'is a clinical-operations program and carries no risk-contract ' +
      'solvency data — MLR is a precise seed gap.',
  },
  {
    metricKey: 'shared_savings_rate',
    value: null,
    source: 'seed gap — not in Meridian’s audited substrate.',
    seedGapReason:
      'The shared-savings achievement rate is sourced from the CMS or payer ' +
      'benchmark-and-settlement report. Meridian has not seeded a ' +
      'settlement feed — the contract result itself is a seed gap.',
  },
  {
    metricKey: 'pmpm_trend',
    value: null,
    source: 'seed gap — not in Meridian’s audited substrate.',
    seedGapReason:
      'Risk-adjusted PMPM cost trend is sourced from the payer claims feed, ' +
      'risk-normalised and compared period over period. Meridian’s audited ' +
      'substrate carries no longitudinal claims feed — PMPM trend is a ' +
      'seed gap.',
  },
  {
    metricKey: 'attribution_stability',
    value: null,
    source: 'seed gap — not in Meridian’s audited substrate.',
    seedGapReason:
      'Attribution stability is sourced from period-over-period payer ' +
      'attribution files. Meridian has not seeded the attribution feed — ' +
      'how much of the population is retained period-over-period is ' +
      'unmeasured.',
  },
  {
    metricKey: 'in_network_utilization_rate',
    value: null,
    source: 'seed gap — not in Meridian’s audited substrate.',
    seedGapReason:
      'In-network (leakage) utilisation is sourced from the claims feed ' +
      'classified against the network directory. Meridian’s audited ' +
      'substrate carries no network-classified claims — leakage is ' +
      'unmeasured.',
  },
] as const;

// The shared `TenantSubstrate` type from `tenant-substrate.ts` — every tenant
// binding (Meridian × VBC, Apex × customer care, First Capital × fraud) uses
// the same vocabulary, and the substrate for an `(industry, function)` is
// resolved through `tenant-binding-registry.ts`.

/** Look up a substrate's observation for a Function-Pack metric, if any. */
function observationFor(
  substrate: TenantSubstrate,
  metricKey: string,
): MeridianMetricObservation | undefined {
  return substrate.find((o) => o.metricKey === metricKey);
}

/** True when the substrate has an audited (non-null) value for the metric. */
function isGrounded(substrate: TenantSubstrate, metricKey: string): boolean {
  const obs = observationFor(substrate, metricKey);
  return Boolean(obs && obs.value !== null);
}

// ─────────────────────────────────────────────────────────────────────────────
// The bet-selection model
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The funding read for a candidate bet (§3 block 2). Each bet resolves to
 * exactly one — fund / shape / hold-for-evidence.
 */
export type BetRead = 'fund_first' | 'shape' | 'hold_for_evidence';

/**
 * One candidate VBC AI bet — a Function-Pack AI use-case archetype scored
 * against Meridian's substrate.
 *
 * The archetype IS the candidate: its `valueMechanism`, `adoptionProfile`,
 * `dataDependencies`, `controlPosture` and `metricsMoved` are inherited from
 * the Function Pack, not improvised. The bet adds the FUNDABILITY read for
 * Meridian specifically.
 */
export interface CandidateBet {
  /** The archetype key — stable, from the Function Pack. */
  key: string;
  /** The archetype name — the bet, named. */
  name: string;
  /** The funding read — fund first / shape / hold for evidence. */
  read: BetRead;
  /** 1-based rank in the ranked-bets list (1 = make this bet first). */
  rank: number;
  /**
   * The value mechanism — the causal chain by which the bet creates value,
   * inherited verbatim from the Function Pack archetype.
   */
  valueMechanism: string;
  /** How readily the function is adopting this bet today (Function Pack). */
  adoptionProfile: AdoptionProfile;
  /** The control / risk posture the bet demands (Function Pack). */
  controlPosture: ControlPosture;
  /**
   * The one piece of evidence that makes the bet fundable now — OR the one
   * seed gap that gates it. Exactly one sentence, answer-first.
   */
  evidenceOrGate: string;
  /**
   * True when `evidenceOrGate` is a seed gap rather than audited evidence —
   * the honesty marker. A bet that rests on a seed gap is never ranked
   * `fund_first`.
   */
  restsOnSeedGap: boolean;
  /**
   * The operating metrics this bet moves, each tagged with whether Meridian
   * has an audited baseline for it. A bet whose moved metrics are all seed
   * gaps cannot have its value proven on Meridian's current substrate.
   */
  movesMetrics: { metricName: string; grounded: boolean }[];
  /** The label of the one gesture deeper — into the bet's full case. */
  gestureLabel: string;
  /** Where the gesture leads. */
  gestureHref: string;
}

/**
 * The single confident headline (§3 block 1) — which VBC AI bet to make first
 * and why, in VBC's own language. Honest by construction: it asserts only what
 * Meridian's audited substrate supports and names the gating gap plainly.
 */
export interface BetSelectionHeadline {
  /** The eyebrow — the function, in its own language. */
  eyebrow: string;
  /** The question the surface answers, stated as the user would ask it. */
  question: string;
  /** The answer — which bet to make first, one confident line. */
  answer: string;
  /** Why this bet, grounded in Meridian's audited substrate. */
  rationale: string;
  /**
   * The honesty clause — the load-bearing caveat. The answer leads with what
   * is true; this names, in the same breath, what bounds it.
   */
  honestyClause: string;
}

/**
 * One evidence / seed gap that gates the ranking (§3 block 3). Closing it
 * would move the order — so it is shown plainly, never buried.
 */
export interface RankingGate {
  /** Stable key. */
  key: string;
  /** The gating gap, named. */
  title: string;
  /** What the gap is and where it is sourced. */
  description: string;
  /** How the ranking would move if the gap were closed. */
  whatItWouldMove: string;
}

/**
 * The complete data for the function-aware bet-selection surface. The route
 * renders exactly these three blocks, in this order — the §3 experience bar.
 */
export interface VbcBetSelection {
  /** The bound Function Pack's function label — the frame. */
  functionLabel: string;
  /** The pack version + last-reviewed date — provenance for the frame. */
  packProvenance: string;
  /** The tenant display name. */
  tenantName: string;
  /**
   * True when the surface is showing the Meridian reference binding rather
   * than the active tenant's own analysis — the route labels it honestly so a
   * non-Meridian tenant never reads Meridian's metrics as their own.
   */
  isReferenceExample: boolean;
  /** Block 1 — the answer. */
  headline: BetSelectionHeadline;
  /** Block 2 — the ranked bets, best-funded-now first. */
  bets: CandidateBet[];
  /** Block 3 — what gates the ranking. */
  gates: RankingGate[];
  /** How many of the function's AI archetypes the tenant can ground evidence for. */
  groundedBetCount: number;
  /** The total candidate bets — the archetype count. */
  totalBetCount: number;
}

/**
 * Back-compat type alias — the original name for the assembled bet selection.
 * Existing consumers (the `BetSelectionView`, its tests) import this name.
 */
export type MeridianVbcBetSelection = VbcBetSelection;

// ─────────────────────────────────────────────────────────────────────────────
// The scoring — the FRAME (Function Pack) scored against the SUBSTRATE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The fundability score for one archetype against Meridian's substrate. The
 * score is deterministic and is built from three honest signals:
 *
 *  1. Grounded baseline — does Meridian have an AUDITED value for at least one
 *     metric the bet moves? A bet whose every moved metric is a seed gap
 *     cannot have its value proven on Meridian's current substrate.
 *  2. Off-benchmark pull — does the bet move a metric Meridian has measured
 *     and that is sitting OFF its planning band? That is value visibly on the
 *     table right now.
 *  3. Adoption maturity — a mainstream archetype is a lower-risk first bet
 *     than an experimental one.
 *
 * The score is a means to a stable ranking; the surface never shows the raw
 * number — it shows the read (fund / shape / hold) and the reasoning.
 */
interface BetScore {
  archetype: AiUseCaseArchetype;
  /** How many moved metrics Meridian has an audited baseline for. */
  groundedMetricCount: number;
  /** How many moved metrics Meridian has measured AND that are off-benchmark. */
  offBenchmarkMetricCount: number;
  /** The total composite score — higher is more fundable now. */
  score: number;
}

const ADOPTION_WEIGHT: Record<AdoptionProfile, number> = {
  mainstream: 3,
  emerging: 2,
  experimenting: 1,
  early: 0,
};

/**
 * Decide whether a grounded metric is off its Function-Pack planning band in
 * the wrong direction. Mirrors the decision-home `vitalFor` logic so the two
 * surfaces agree on what "off" means.
 */
function isMetricOffBenchmark(
  substrate: TenantSubstrate,
  metric: OperatingMetric,
): boolean {
  const obs = observationFor(substrate, metric.key);
  if (!obs || obs.value === null) return false;
  const { low, high } = metric.benchmarkRange;
  switch (metric.directionOfGood) {
    case 'higher':
      return obs.value < low;
    case 'lower':
      return obs.value > high;
    case 'in-range':
    default:
      return obs.value < low || obs.value > high;
  }
}

/** Score one archetype's fundability against the tenant's substrate. */
function scoreArchetype(
  archetype: AiUseCaseArchetype,
  metricsByKey: Map<string, OperatingMetric>,
  substrate: TenantSubstrate,
): BetScore {
  const groundedMetricCount = archetype.metricsMoved.filter((k) =>
    isGrounded(substrate, k),
  ).length;

  const offBenchmarkMetricCount = archetype.metricsMoved.filter((k) => {
    const metric = metricsByKey.get(k);
    return metric ? isMetricOffBenchmark(substrate, metric) : false;
  }).length;

  // The composite. Off-benchmark pull is weighted hardest — value visibly on
  // the table dominates. A grounded baseline at all is the next signal: a bet
  // with no grounded metric cannot be proven on Meridian's substrate today.
  // Adoption maturity is the lightest tie-breaker.
  const score =
    offBenchmarkMetricCount * 100 +
    groundedMetricCount * 25 +
    ADOPTION_WEIGHT[archetype.adoptionProfile];

  return { archetype, groundedMetricCount, offBenchmarkMetricCount, score };
}

/**
 * Resolve the funding read from a score. The rule is honest by construction:
 *
 *  - `fund_first` — Meridian has an audited baseline AND the bet moves a
 *     metric that is visibly off-benchmark. The value is real and measured.
 *  - `shape` — Meridian has an audited baseline but the bet moves nothing
 *     currently off-benchmark, OR it moves an off-benchmark metric but the
 *     adjacency is partial. The bet is worth shaping, not yet funding blind.
 *  - `hold_for_evidence` — Meridian has NO audited baseline for any metric the
 *     bet moves. Its value cannot be quantified on the current substrate; it
 *     waits on a seed gap. Never `fund_first`.
 */
function readForScore(score: BetScore): BetRead {
  if (score.groundedMetricCount === 0) return 'hold_for_evidence';
  if (score.offBenchmarkMetricCount > 0) return 'fund_first';
  return 'shape';
}

/**
 * Build the one piece of evidence — or the one gating seed gap — for a bet.
 * For a grounded bet this is the audited metric that makes it fundable; for an
 * ungrounded bet it is the seed gap, named, that gates it.
 */
function evidenceOrGateFor(
  archetype: AiUseCaseArchetype,
  score: BetScore,
  metricsByKey: Map<string, OperatingMetric>,
  substrate: TenantSubstrate,
  tenantName: string,
): { text: string; restsOnSeedGap: boolean } {
  // A bet with an off-benchmark grounded metric: the evidence is that metric.
  const offMetric = archetype.metricsMoved
    .map((k) => metricsByKey.get(k))
    .find(
      (m): m is OperatingMetric =>
        Boolean(m) && isMetricOffBenchmark(substrate, m!),
    );
  if (offMetric) {
    const obs = observationFor(substrate, offMetric.key)!;
    return {
      restsOnSeedGap: false,
      text:
        `Evidence: ${tenantName}’s audited ${offMetric.name.toLowerCase()} ` +
        `sits at ${obs.value}${offMetric.unit.includes('%') ? '%' : ''} — ` +
        `below the function’s ${offMetric.benchmarkRange.low}–` +
        `${offMetric.benchmarkRange.high} planning band (${obs.source}). ` +
        `That gap is value on the table this bet directly moves.`,
    };
  }

  // A grounded bet with no off-benchmark metric: shaped, the baseline exists.
  if (score.groundedMetricCount > 0) {
    const grounded = archetype.metricsMoved
      .map((k) => metricsByKey.get(k))
      .find(
        (m): m is OperatingMetric => Boolean(m) && isGrounded(substrate, m!.key),
      );
    return {
      restsOnSeedGap: false,
      text:
        `Evidence: ${tenantName} has an audited baseline for ` +
        `${grounded ? grounded.name.toLowerCase() : 'a metric this bet moves'} ` +
        `— the bet can be shaped against real substrate, though no metric it ` +
        `moves is currently off-benchmark.`,
    };
  }

  // An ungrounded bet: the gate is the seed gap on its first moved metric.
  const firstGap = archetype.metricsMoved
    .map((k) => observationFor(substrate, k))
    .find((o): o is MeridianMetricObservation => Boolean(o) && o!.value === null);
  if (firstGap?.seedGapReason) {
    return { restsOnSeedGap: true, text: `Seed gap: ${firstGap.seedGapReason}` };
  }

  // No observation at all for any moved metric — still an honest gap.
  const firstMetric = metricsByKey.get(archetype.metricsMoved[0] ?? '');
  return {
    restsOnSeedGap: true,
    text:
      `Seed gap: this bet moves ${firstMetric?.name ?? 'metrics'} that ` +
      `${tenantName}’s audited substrate has not seeded — its value cannot ` +
      `be quantified until the baseline is in place.`,
  };
}

/**
 * Build the §3 honesty clause for a binding with NO audited tenant substrate.
 * Every bet is held for evidence — the surface says so plainly rather than
 * fabricating a fundable bet on data the tenant has not seeded.
 */
function ungroundedHonestyClause(tenantName: string, betCount: number): string {
  return (
    `This ranking is honest about its own limits. ${tenantName} has not yet ` +
    `seeded an audited operating-metric substrate for this function, so all ` +
    `${betCount} bets are held for evidence — ordered by adoption maturity, ` +
    `not ranked on a fabricated fundability number. Seeding the function’s ` +
    `operating metrics is the gate that would let these bets be ranked on ` +
    `measured value; the metrics that would do it are named in full below.`
  );
}

/**
 * Build the gates for a binding with NO audited tenant substrate — a single,
 * honest gate naming the seed gap that bounds the whole ranking. Each named
 * gate is a real Function-Pack operating metric the tenant has not seeded.
 */
function ungroundedGates(
  pack: FunctionPack,
  tenantName: string,
): RankingGate[] {
  const sampleMetrics = pack.operatingMetrics
    .slice(0, 3)
    .map((m) => m.name.toLowerCase())
    .join(', ');
  return [
    {
      key: 'gate_operating_metric_substrate',
      title: 'The function’s operating-metric substrate is unseeded',
      description:
        `The ${pack.functionLabel} Function Pack expects ` +
        `${pack.operatingMetrics.length} operating metrics — ${sampleMetrics}, ` +
        `and the rest — each sourced from a named system of record. ` +
        `${tenantName} has not yet seeded an audited value for any of them, ` +
        `so no bet can be ranked on measured, on-the-table value.`,
      whatItWouldMove:
        `Seeding the function’s operating metrics from ${tenantName}’s ` +
        `systems of record would let every bet be ranked on a real baseline ` +
        `— the bets whose moved metrics land off-benchmark would rise into ` +
        `fundable positions instead of being held for evidence.`,
    },
  ];
}

/**
 * Build the three §3 blocks of the function-aware bet-selection surface for any
 * `(industryKey, functionKey)` binding.
 *
 * The builder is GENERIC over the Function Pack: the pack's Layer 3 AI use-case
 * archetypes ARE the candidate bets, the pack's Layer 1 operating metrics are
 * the scoring frame. The ranking is grounded against `substrateFor(...)` — the
 * Meridian × VBC binding carries audited tenant data, every other binding gets
 * the empty substrate and so its bets are honestly held for evidence rather
 * than fabricated as fundable.
 *
 * Returns `null` only if no Function Pack is catalogued for the binding — the
 * same honest "no curated pack" signal the registry uses. The route surfaces
 * that rather than fabricating a frame.
 *
 * @param industryKey The Function Pack industry — e.g. `'retail'`.
 * @param functionKey The Function Pack function — e.g. `'pricing_promotions'`.
 * @param tenantName  The resolved tenant display name (e.g. "Apex Retail").
 */
export function buildVbcBetSelection(
  industryKey: FunctionPackIndustryKey,
  functionKey: string,
  tenantName: string,
): VbcBetSelection | null {
  const pack: FunctionPack | null = resolveFunctionPack(
    industryKey,
    functionKey,
  );
  if (!pack) return null;

  // Consult the tenant-binding registry — Meridian × VBC, Apex × customer
  // care, First Capital × fraud each register an audited substrate plus a
  // grounded-blocks builder. An unknown `(industry, function)` resolves to
  // `null` and the surface renders honestly as unseeded.
  const binding = resolveBetSelectionBinding(industryKey, functionKey);
  const substrate: TenantSubstrate = binding?.substrate ?? [];
  const isGroundedBinding = substrate.length > 0;

  const metricsByKey = new Map(
    pack.operatingMetrics.map((m) => [m.key, m] as const),
  );

  // ── Score & rank — the Function Pack archetypes ARE the candidate bets ────
  const scored = pack.aiUseCaseArchetypes
    .map((a) => scoreArchetype(a, metricsByKey, substrate))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // Stable tie-break: keep Function-Pack declaration order.
      return (
        pack.aiUseCaseArchetypes.indexOf(a.archetype) -
        pack.aiUseCaseArchetypes.indexOf(b.archetype)
      );
    });

  const bets: CandidateBet[] = scored.map((s, i) => {
    const read = readForScore(s);
    const { text, restsOnSeedGap } = evidenceOrGateFor(
      s.archetype,
      s,
      metricsByKey,
      substrate,
      tenantName,
    );
    return {
      key: s.archetype.key,
      name: s.archetype.name,
      read,
      rank: i + 1,
      valueMechanism: s.archetype.valueMechanism,
      adoptionProfile: s.archetype.adoptionProfile,
      controlPosture: s.archetype.controlPosture,
      evidenceOrGate: text,
      restsOnSeedGap,
      movesMetrics: s.archetype.metricsMoved.map((k) => ({
        metricName: metricsByKey.get(k)?.name ?? k,
        grounded: isGrounded(substrate, k),
      })),
      // One gesture deeper — into the bet's full, costed Move case. The
      // Intelligence surface points into Moves; the bet becomes a Move.
      gestureLabel:
        read === 'hold_for_evidence'
          ? 'Review the seed gap that gates this bet'
          : 'Open the costed case for this bet',
      gestureHref: read === 'hold_for_evidence' ? '/admin/data-trust' : '/moves',
    };
  });

  const groundedBetCount = scored.filter(
    (s) => s.groundedMetricCount > 0,
  ).length;

  // ── Block 1 — the answer ──────────────────────────────────────────────────
  // The top-ranked bet is the answer. For a grounded tenant binding the
  // headline asserts audited truth — the top bet earned its rank on a
  // measured, off-benchmark metric — and the honesty clause names the
  // structural gap. For any other binding there is no audited substrate, so
  // the headline says so plainly: every bet is held for evidence, ordered by
  // adoption maturity, never fabricated as fundable.
  const topBet = bets[0];
  const heldBets = bets.filter((b) => b.read === 'hold_for_evidence');

  // ── Block 3 — what gates the ranking ──────────────────────────────────────
  // The seed gaps that, if closed, would move the order. For a grounded
  // tenant binding the gates are the named function-specific metrics the
  // tenant has not seeded; for any other binding the gate is the function's
  // whole operating-metric substrate. Each gate is real, never invented.
  let headline: BetSelectionHeadline;
  let gates: RankingGate[];

  if (isGroundedBinding && binding) {
    const ctx: BetSelectionBindingContext = {
      pack,
      tenantName,
      substrate,
      topBetName: topBet.name,
      topBetRead: topBet.read,
      totalBets: bets.length,
      heldBetCount: heldBets.length,
    };
    const grounded = binding.buildBlocks(ctx);
    headline = grounded.headline;
    gates = [...grounded.gates];
  } else {
    headline = {
      eyebrow: `${pack.functionLabel} · the bet to make first`,
      question: `Which ${pack.functionLabel.toLowerCase()} AI bet should ${tenantName} make first?`,
      answer:
        `The strongest candidate today is ${topBet.name} — but ${tenantName} ` +
        `has not yet seeded the substrate to fund it on measured value.`,
      rationale:
        `The ${pack.functionLabel.toLowerCase()} function offers ` +
        `${bets.length} AI use-case archetypes. ${topBet.name} leads the ` +
        `order on adoption maturity — it is the most-proven bet in the ` +
        `function. But the order is provisional: ${tenantName} has not ` +
        `seeded an audited operating-metric substrate, so no bet can yet ` +
        `be shown moving a metric that is visibly off-benchmark.`,
      honestyClause: ungroundedHonestyClause(tenantName, bets.length),
    };
    gates = ungroundedGates(pack, tenantName);
  }

  return {
    functionLabel: pack.functionLabel,
    packProvenance: `Function Pack v${pack.version} · reviewed ${pack.lastReviewed}`,
    tenantName,
    isReferenceExample: false,
    headline,
    bets,
    gates,
    groundedBetCount,
    totalBetCount: bets.length,
  };
}

/**
 * Build the bet-selection surface for the Meridian × Population-Health / VBC
 * binding — the original reference binding.
 *
 * A thin back-compat shim over the generic `buildVbcBetSelection`: it calls the
 * generic builder with the Meridian constants. Existing callers and tests that
 * imported `buildMeridianVbcBetSelection` keep working unchanged, and the result
 * is byte-identical to what the old function produced.
 *
 * @param tenantName The resolved tenant display name (e.g. "Meridian Health").
 */
export function buildMeridianVbcBetSelection(
  tenantName: string,
): VbcBetSelection | null {
  return buildVbcBetSelection(
    MERIDIAN_INDUSTRY_KEY,
    MERIDIAN_FUNCTION_KEY,
    tenantName,
  );
}

/** Exported for tests — the metric keys Meridian has grounded with substrate. */
export const MERIDIAN_GROUNDED_VBC_BET_METRIC_KEYS: ReadonlySet<string> =
  new Set(
    MERIDIAN_VBC_OBSERVATIONS.filter((o) => o.value !== null).map(
      (o) => o.metricKey,
    ),
  );

// ─────────────────────────────────────────────────────────────────────────────
// The Meridian × VBC bet-selection binding — the original reference binding.
//
// The grounded headline + gates Meridian has shipped from day one, now
// expressed as a registered `BetSelectionBinding` so the generic builder
// treats Meridian as one tenant among several — Apex, First Capital, and any
// future grounded binding follow the same shape.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The Meridian × VBC bet-selection binding. Carries the audited substrate
 * (`MERIDIAN_VBC_OBSERVATIONS`) and the tenant-named operator copy for the VBC
 * bet-selection surface. Exported for test inspection and so a future tenant
 * binding has a canonical example to mirror.
 */
export const MERIDIAN_BET_SELECTION_BINDING: BetSelectionBinding = {
  industryKey: MERIDIAN_INDUSTRY_KEY,
  functionKey: MERIDIAN_FUNCTION_KEY,
  tenantBindingKey: 'meridian-vbc',
  expectedClientKey: 'meridian',
  substrate: MERIDIAN_VBC_OBSERVATIONS,
  buildBlocks(ctx: BetSelectionBindingContext): BetSelectionGroundedBlocks {
    const { topBetName, topBetRead, totalBets, heldBetCount } = ctx;

    const headline: BetSelectionHeadline = {
      eyebrow: 'Population health & value-based care · the bet to make first',
      question: 'Which value-based-care AI bet should Meridian make first?',
      answer:
        topBetRead === 'fund_first'
          ? `Make the ${topBetName} bet first.`
          : `The most fundable bet today is ${topBetName} — but shape it before funding.`,
      rationale:
        `Of the value-based-care function’s ${totalBets} AI use-case ` +
        `archetypes, ${topBetName} is the one Meridian’s audited substrate ` +
        `makes fundable now: it moves a metric Meridian has measured and ` +
        `that is sitting below the function’s planning band — RAF capture ` +
        `at 58% against an 85–100% band. That is risk-adjusted revenue ` +
        `visibly on the table, and accurate (never inflated) capture is ` +
        `the lever that lifts it. It is also a mainstream bet — the ` +
        `lower-risk first move.`,
      honestyClause:
        `This ranking is honest about its own limits. ${heldBetCount} ` +
        `of the ${totalBets} bets — the contract-simulation and ` +
        `network-leakage archetypes — move only metrics Meridian has not ` +
        `seeded (the shared-savings settlement, PMPM trend, attribution ` +
        `stability, network leakage). They are held for evidence, not ` +
        `ranked on a fabricated number. The gates that would re-order this ` +
        `list are named in full below.`,
    };

    const gates: RankingGate[] = [
      {
        key: 'gate_settlement_economics',
        title: 'The contract-settlement economics are unseeded',
        description:
          'The VBC Function Pack expects the medical loss ratio, the ' +
          'shared-savings achievement rate, and risk-adjusted PMPM trend — ' +
          'all sourced from the CMS / payer benchmark-and-settlement report ' +
          'and the claims feed. Meridian’s audited program is a clinical-' +
          'operations program and carries none of them.',
        whatItWouldMove:
          'Seeding the settlement and claims feeds would let the VBC ' +
          'contract-performance-simulation bet be ranked on real downside ' +
          'rather than held for evidence — it could rise into a fundable ' +
          'position.',
      },
      {
        key: 'gate_attribution_feed',
        title: 'The attribution feed is unseeded',
        description:
          'Attribution stability — the share of the population retained ' +
          'period over period — is sourced from payer attribution files. ' +
          'Meridian has not seeded that feed, so no bet can be credited for ' +
          'value on a population whose churn is unknown.',
        whatItWouldMove:
          'A seeded attribution feed would sharpen the value haircut on ' +
          'every grounded bet and is a precondition for trusting any ' +
          'contract-economics forecast.',
      },
      {
        key: 'gate_network_claims',
        title: 'Network-classified claims are unseeded',
        description:
          'In-network (leakage) utilisation and high-value specialist ' +
          'referral rates are sourced from the claims feed classified ' +
          'against the network directory. Meridian’s audited substrate ' +
          'carries no network-classified claims.',
        whatItWouldMove:
          'Seeding network-classified claims would move the network-leakage ' +
          'and referral-steering bet out of hold-for-evidence and let it be ' +
          'ranked on a measured leakage baseline.',
      },
      {
        key: 'gate_awv_baseline',
        title: 'The annual-wellness-visit baseline is unseeded',
        description:
          'The AWV completion rate is the structured opportunity that the ' +
          'top two bets — coding-gap intelligence and quality-measure ' +
          'intelligence — both lean on. Meridian measures ambulatory visit ' +
          'volume (E19) but not AWV completion.',
        whatItWouldMove:
          'A seeded AWV baseline would tighten the value case for the ' +
          'top-ranked bet — it would not change its rank, but it would ' +
          'raise the confidence behind its forecast.',
      },
    ];

    return { headline, gates };
  },
};

// Register the Meridian binding eagerly on module load. The generic builder
// consults the registry; Meridian is one tenant among several.
registerBetSelectionBinding(MERIDIAN_BET_SELECTION_BINDING);
