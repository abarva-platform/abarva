// Generic Move Estimate & Financial Model — view-model.
//
// The Apex reference Estimate Model (`estimate-model-model.ts`) projects a deck
// from the THREE hand-authored Apex kernel cases. This module is its generic
// sibling: it projects a board-grade Estimate & Financial Model from
// `buildMoveBusinessCase(move)` — the kernel run for a REAL, originated Move.
//
// The seam it honours, exactly as the task requires:
//   • the kernel `skeleton` (a `BusinessCaseSkeleton` from `compileBusinessCase`)
//     drives the estimate CONTENT — the effort decomposition, the role-mix and
//     cost build-up, the value forecast and the haircuts all trace to a kernel
//     field, no number is fabricated;
//   • the binding's `seedGaps` drive the baseline-gap strip — every unrecorded
//     metric is a precise, named seed gap, never a blank.
//
// HONESTY DISCIPLINE (mandatory): every figure is a labelled PLANNING estimate
// or range, never an asserted fact. The effort estimate runs on a researched
// benchmark rate card explicitly labelled NOT a quote. The value forecast rests
// on the Function Pack's curated benchmark proxies, so the kernel honestly
// blocks a claimable dollar payback — the cash-flow models discounted net
// value, never verified cash, and never crosses zero as a payback claim. When a
// Move binds no curated pack, `buildMoveEstimateModel` returns an honest
// UNBOUND result (`bound:false`) — the renderer shows the honest "no curated
// Function Pack" state, never a fabricated model.
//
// `buildApexEstimateModel` is left intact as the reference implementation —
// this module is added alongside it, not in place of it.
//
// A difference from the Apex deck worth stating plainly: the Apex Estimate
// Model runs `buildApexContactCenterFullCase` and so can render a per-PHASE
// roadmap and cash flow. `buildMoveBusinessCase` returns only the Charter-phase
// `BusinessCaseSkeleton` — there is no costed roadmap on it — so the generic
// deck projects its cost build-up by WORKSTREAM (the effort estimate's own
// decomposition), not by phase, and its cash-flow shape is staged across the
// effort estimate's build / change / run lanes. Every figure still traces to a
// kernel field; the deck simply shows what the skeleton honestly carries.
//
// Pure module: deterministic, no I/O.

import {
  buildMoveBusinessCase,
  type MoveBusinessCaseInput,
} from '../../../move-business-case';
import type { BusinessCaseSkeleton } from '../../business-case-compiler';
import {
  BUSINESS_CHANGE_WORKSTREAMS,
  type WorkstreamId,
} from '../../effort-estimator';
import type { FunctionPackBinding } from '../../domain/function-pack-context-binding';
import { resolveBoardGradeTenantLabel } from './tenant-label-resolver';
import {
  dominantVerdictCause,
  type VerdictExplainerChip,
} from './verdict-explainer';

// ---------------------------------------------------------------------------
// Section anatomy — mirrors the Apex Estimate Model's `EstimateSectionAnatomy`
// so the generic deck reuses the same shell scaffold (`slideShell`, footer
// facts).
// ---------------------------------------------------------------------------

/** Evidence strip — sources, dates, confidence, gaps; visible, not buried. */
export interface MoveEstimateEvidenceStrip {
  sources: string[];
  asOf: string;
  confidence: 'high' | 'medium' | 'low' | 'blocked';
  gaps: string[];
}

/** A consulting-exhibit section header — same shape as the Apex deck. */
export interface MoveEstimateSectionAnatomy {
  /** Section number among the deck's section slides. */
  page: number;
  /** Anchor id for the deck slide. */
  id: string;
  /** Short menu / eyebrow label. */
  navLabel: string;
  /** Takeaway title — a sentence with a point of view (NOT a label). */
  takeaway: string;
  /** The decision this page supports. */
  decisionRole: string;
  /** Evidence strip — sources, dates, confidence, gaps. */
  evidence: MoveEstimateEvidenceStrip;
  /** The implication — the action the exhibit creates. */
  implication: string;
  /** Owner accountable for resolving the page's issue. */
  owner: string;
  /** Where it gates the process. */
  nextGate: string;
}

// ---------------------------------------------------------------------------
// The generic Estimate Model view-model.
// ---------------------------------------------------------------------------

/**
 * The generic Move Estimate & Financial Model — the projected, bound result.
 *
 * `bound` is always `true` here; an unbound Move yields `MoveEstimateUnbound`
 * instead. The discriminated union (`MoveEstimateModelResult`) lets the
 * renderer branch honestly.
 */
export interface MoveEstimateModel {
  bound: true;
  tenantLabel: string;
  tenantKey: string;
  moveLabel: string;
  artifactLabel: string;
  /** The bound Function-Pack function label, e.g. "Customer Care". */
  functionLabel: string;
  generatedOn: string;
  /** The kernel recommendation — the REAL verdict, never fabricated. */
  recommendation: 'fund' | 'shape' | 'kill';
  /** True when payback cannot be computed — a monetisation seed gap. */
  paybackBlocked: boolean;
  /**
   * Pilot rehearsal P2-3 — the explainer chip surfaced on a non-`fund`
   * verdict. `null` when the verdict is `fund`. Pulled from the kernel's
   * structured fields by `dominantVerdictCause`.
   */
  verdictExplainerChip: VerdictExplainerChip | null;
  /** The deck sections, page-ordered. */
  sections: MoveEstimateSections;
  /** Navigation entries for the deck menu rail. */
  toc: Array<{ page: number; id: string; label: string; takeaway: string }>;
}

/**
 * The honest unbound result — a Move whose function is not covered by any
 * curated Domain Function Pack. The renderer shows this as an honest empty
 * state, NEVER a fabricated model.
 */
export interface MoveEstimateUnbound {
  bound: false;
  moveLabel: string;
  generatedOn: string;
  /** The honest reason the kernel could not run with curated depth. */
  unboundReason: string;
}

export type MoveEstimateModelResult = MoveEstimateModel | MoveEstimateUnbound;

export interface MoveEstimateSections {
  /** §1 — the estimate verdict and the headline economics. */
  executiveSummary: MoveEstimateExecutiveSummarySection;
  /** §2 — the baseline metrics the model is built on, and the seed gaps. */
  baselineInputs: MoveEstimateBaselineSection;
  /** §3 — the per-workstream cost build-up. */
  workstreamEstimate: MoveEstimateWorkstreamSection;
  /** §4 — the role-mix lanes and the rate card the cost runs on. */
  rateCard: MoveEstimateRateCardSection;
  /** §5 — the value forecast (planning ranges, post-haircut). */
  valueForecast: MoveEstimateValueSection;
  /** §6 — sensitivity, the case-movers, and the staged cash-flow shape. */
  sensitivity: MoveEstimateSensitivitySection;
}

// --- §1 Executive summary ---------------------------------------------------

export interface MoveEstimateExecutiveSummarySection {
  anatomy: MoveEstimateSectionAnatomy;
  verdictHeadline: string;
  verdictDetail: string;
  /** Headline economics tiles. */
  tiles: Array<{
    label: string;
    value: string;
    sub: string;
    tone: 'neutral' | 'good' | 'warn' | 'bad';
  }>;
  /** Plain statement of the rate-card basis — benchmark vs client-specific. */
  rateCardBasis: string;
}

// --- §2 Baseline inputs -----------------------------------------------------

export interface MoveEstimateBaselineSection {
  anatomy: MoveEstimateSectionAnatomy;
  recordedCount: number;
  seedGapCount: number;
  coveragePct: number;
  /** Recorded baseline metrics — source + confidence are mandatory. */
  metrics: Array<{
    metric: string;
    value: string;
    source: string;
    asOf: string;
    confidence: 'high' | 'medium' | 'low';
  }>;
  /** The precise seed gaps inherited from the binding — never blank. */
  seedGaps: Array<{
    metric: string;
    reason: string;
    expectedDataSource: string;
  }>;
}

// --- §3 Workstream estimate -------------------------------------------------

export interface MoveEstimateWorkstreamSection {
  anatomy: MoveEstimateSectionAnatomy;
  /** Per-workstream cost rows — every workstream the estimate carries. */
  workstreams: Array<{
    id: WorkstreamId;
    label: string;
    baseCost: number;
    conservativeCost: number;
    upsideCost: number;
    humanCost: number;
    agentCost: number;
    headcount: number;
    durationMonths: number;
    agentSplitPct: number;
    isBusinessChange: boolean;
  }>;
  totalBase: number;
  totalConservative: number;
  totalUpside: number;
  aiBuildCost: number;
  businessChangeCost: number;
  businessChangeFraction: number;
  aiOpsCost: number;
  aiOps: MoveEstimateAiOpsSummary | null;
  buildVsChangeNote: string;
}

export interface MoveEstimateAiOpsSummary {
  threeYearTotal: number;
  fiveYearTotal: number;
  costPerCallUsd: number;
  costPerDecisionUsd: number | null;
  decisionUnit: string | null;
  rateCardAsOf: string;
  pricingTierShockWarning: string | null;
  modelTierDriftWarning: string | null;
  perYear: Array<{
    year: number;
    inferenceUsd: number;
    embeddingUsd: number;
    evalUsd: number;
    fineTuneUsd: number;
    totalUsd: number;
    tierBreachWarnings: string[];
  }>;
}

// --- §4 Rate card & overrides -----------------------------------------------

export interface MoveEstimateRateCardSection {
  anatomy: MoveEstimateSectionAnatomy;
  /** The rate-card provenance — `researched_benchmark`, `client_specific`, … */
  provenance: string;
  /** The full provenance label — the rate-card source, never hidden. */
  provenanceLabel: string;
  /** True when the card is a client-specific / comprehensive override. */
  isClientOverride: boolean;
  /** Coverage cells — one per role family, onshore + offshore rates. */
  cells: Array<{
    domain: string;
    onshore: number | null;
    offshore: number | null;
  }>;
  /** The effective AI-agent split of base effort, as a percentage. */
  agentSplitPct: number;
  /** The override note — how a client rate card replaces the default. */
  overrideNote: string;
}

// --- §5 Value forecast ------------------------------------------------------

export interface MoveEstimateValueSection {
  anatomy: MoveEstimateSectionAnatomy;
  /** Net 3-year value as a base/low/high planning range. */
  netValue: { low: number; point: number; high: number };
  /** The upper planning bound treated as the unhaircut ceiling. */
  grossCeiling: number;
  /** The implied haircut percentage (ceiling → net point). */
  haircutPct: number;
  /** True — the gross value rests on a curated benchmark proxy. */
  monetisationBlocked: boolean;
  /** Per-year net-value curve along a conservative adoption ramp. */
  curve: Array<{ year: number; adoption: number; netValue: number }>;
}

// --- §6 Sensitivity & cash flow ---------------------------------------------

export interface MoveEstimateSensitivitySection {
  anatomy: MoveEstimateSectionAnatomy;
  /** Conservative / base / upside net return. */
  scenarios: Array<{
    label: string;
    netReturn: number;
    tone: 'base' | 'low' | 'high';
  }>;
  /** Sensitivity tornado bars — the assumptions that move the case. */
  tornado: Array<{ label: string; swing: number; isProxy: boolean }>;
  whatBreaksTheCase: string;
  /** Cumulative net-value cash-flow series, staged across the cost lanes. */
  cashFlow: {
    base: number[];
    conservative: number[];
    upside: number[];
    periodLabels: string[];
  };
  paybackBlocked: boolean;
  paybackNote: string;
}

// ===========================================================================
// Builder.
// ===========================================================================

/** The deliverable artifact label for the estimate / financial model deck. */
const ARTIFACT_LABEL = 'Estimate & Financial Model';

/**
 * Build the generic Move Estimate & Financial Model view-model.
 *
 * Runs `buildMoveBusinessCase(move)`. When the Move binds a curated pack and
 * the kernel produces a real skeleton, projects the bound estimate model. When
 * the Move is unbound, returns the honest `MoveEstimateUnbound` — never a
 * fabricated deck.
 *
 * Deterministic — same Move + `generatedOn` → same result.
 */
export function buildMoveEstimateModel(
  move: MoveBusinessCaseInput,
  generatedOn: string,
): MoveEstimateModelResult {
  const result = buildMoveBusinessCase(move);
  const moveLabel = readMoveLabel(move, result.binding);

  // Unbound — the honest dead end. No curated depth, no kernel skeleton.
  if (!result.bound || !result.skeleton) {
    return {
      bound: false,
      moveLabel,
      generatedOn,
      unboundReason: result.unboundReason,
    };
  }

  const skeleton = result.skeleton;
  const binding = result.binding;
  const paybackBlocked = !skeleton.economics.monetisable;
  const functionLabel = binding.functionLabel ?? 'this function';

  const executiveSummary = buildExecutiveSummary(
    skeleton,
    generatedOn,
    paybackBlocked,
  );
  const baselineInputs = buildBaselineInputs(skeleton, binding, generatedOn);
  const workstreamEstimate = buildWorkstreamEstimate(skeleton, generatedOn);
  const rateCard = buildRateCard(skeleton, generatedOn);
  const valueForecast = buildValueForecast(
    skeleton,
    generatedOn,
    paybackBlocked,
  );
  const sensitivity = buildSensitivity(skeleton, generatedOn, paybackBlocked);

  const sections: MoveEstimateSections = {
    executiveSummary,
    baselineInputs,
    workstreamEstimate,
    rateCard,
    valueForecast,
    sensitivity,
  };

  const ordered: MoveEstimateSectionAnatomy[] = [
    executiveSummary.anatomy,
    baselineInputs.anatomy,
    workstreamEstimate.anatomy,
    rateCard.anatomy,
    valueForecast.anatomy,
    sensitivity.anatomy,
  ];

  const { tenantLabel, tenantKey } = resolveBoardGradeTenantLabel(
    move,
    skeleton.tenantKey,
  );
  return {
    bound: true,
    tenantLabel,
    tenantKey,
    moveLabel,
    artifactLabel: ARTIFACT_LABEL,
    functionLabel,
    generatedOn,
    recommendation: skeleton.recommendation,
    paybackBlocked,
    verdictExplainerChip: dominantVerdictCause(skeleton, binding),
    sections,
    toc: ordered.map((a) => ({
      page: a.page,
      id: a.id,
      label: a.navLabel,
      takeaway: a.takeaway,
    })),
  };
}

// ---------------------------------------------------------------------------
// Section builders.
// ---------------------------------------------------------------------------

function buildExecutiveSummary(
  skeleton: BusinessCaseSkeleton,
  generatedOn: string,
  paybackBlocked: boolean,
): MoveEstimateExecutiveSummarySection {
  const recommendation = skeleton.recommendation;
  const effort = skeleton.effort;
  const seedGapLabels = skeleton.baseline.seedGaps.map((g) => g.label);
  const isClientCard =
    effort.rateCard.provenance === 'comprehensive' ||
    effort.rateCard.provenance === 'client_specific';

  const rateCardBasis = isClientCard
    ? 'Rates are CLIENT-SPECIFIC — a client rate-card pack, not a generic ' +
      'benchmark. The provenance is shown in the rate-card section.'
    : 'Rates are a researched market BENCHMARK — a planning range, NOT a ' +
      'quote. Override with a client-specific card before any commitment.';

  return {
    anatomy: {
      page: 1,
      id: 'executive-summary',
      navLabel: 'Executive summary',
      takeaway: verdictHeadlineText(recommendation, paybackBlocked),
      decisionRole:
        'Decide whether the estimate is credible enough to plan against.',
      evidence: {
        sources: [
          'Moves Expert Kernel — effort estimator + value forecast',
          'The Move’s recorded data + its bound Domain Function Pack',
        ],
        asOf: generatedOn,
        confidence: paybackBlocked ? 'blocked' : 'medium',
        gaps: seedGapLabels,
      },
      implication: paybackBlocked
        ? 'The cost side is plannable now; the return side stays a planning ' +
          'proxy until the seed-gapped metrics and the tenant spend base land.'
        : 'The estimate is planning-grade — a range derived from the curated ' +
          'Function Pack, not a quote.',
      owner: 'Move sponsor (to be confirmed with the tenant)',
      nextGate: 'A client-specific estimate before any funding commitment',
    },
    verdictHeadline: verdictChipText(recommendation),
    verdictDetail: skeleton.recommendationRationale,
    tiles: [
      {
        label: 'Recommendation',
        value: recommendation.toUpperCase(),
        sub:
          recommendation === 'shape'
            ? 'Credible estimate · not fundable as-is'
            : recommendation === 'fund'
              ? 'Estimate supports funding'
              : 'Estimate does not support funding',
        tone:
          recommendation === 'fund'
            ? 'good'
            : recommendation === 'kill'
              ? 'bad'
              : 'warn',
      },
      {
        label: 'Investment (base)',
        value: formatUsd(skeleton.economics.investment.point),
        sub:
          `${formatUsd(skeleton.economics.investment.low)}–` +
          `${formatUsd(skeleton.economics.investment.high)} · planning range`,
        tone: 'neutral',
      },
      {
        label: 'Net value (3-yr)',
        value: formatUsd(skeleton.valueRange.point),
        sub:
          `${formatUsd(skeleton.valueRange.low)}–` +
          `${formatUsd(skeleton.valueRange.high)} · post-haircut`,
        tone: paybackBlocked ? 'warn' : 'neutral',
      },
      {
        label: 'Payback',
        value:
          skeleton.economics.paybackMonths === null
            ? 'Blocked'
            : `${skeleton.economics.paybackMonths} mo`,
        sub:
          skeleton.economics.paybackMonths === null
            ? 'Monetisation blocked — seed gap'
            : 'Base case',
        tone: skeleton.economics.paybackMonths === null ? 'bad' : 'good',
      },
      {
        label: 'Rate-card basis',
        value: isClientCard ? 'Client' : 'Benchmark',
        sub: isClientCard
          ? 'Client-specific pack'
          : 'Researched benchmark',
        tone: 'neutral',
      },
    ],
    rateCardBasis,
  };
}

function buildBaselineInputs(
  skeleton: BusinessCaseSkeleton,
  binding: FunctionPackBinding,
  generatedOn: string,
): MoveEstimateBaselineSection {
  const recorded = skeleton.baseline.recordedMetrics;
  const seedGaps = skeleton.baseline.seedGaps;
  const total = recorded.length + seedGaps.length;
  const coveragePct =
    total > 0 ? Math.round((recorded.length / total) * 100) : 0;

  return {
    anatomy: {
      page: 2,
      id: 'baseline-inputs',
      navLabel: 'Baseline & seed gaps',
      takeaway:
        `The financial model is built on ${recorded.length} recorded ` +
        `${recorded.length === 1 ? 'metric' : 'metrics'} — ` +
        `${seedGaps.length} declared seed ` +
        `${seedGaps.length === 1 ? 'gap is' : 'gaps are'} the honest limits ` +
        'of what the model can claim today.',
      decisionRole:
        'Confirm the model is built on real inputs, with the gaps named.',
      evidence: {
        sources: [
          'The Move’s recorded baseline metrics',
          'Function Pack — expected operating metrics',
        ],
        asOf: generatedOn,
        confidence: skeleton.baseline.weakestConfidence ?? 'low',
        gaps: seedGaps.map((g) => g.label),
      },
      implication:
        'The recorded metrics are decision-grade; the seed gaps are the ' +
        'declared inputs the financial model cannot yet source — never blank.',
      owner: 'Move sponsor (to be confirmed with the tenant)',
      nextGate: 'Close the seed-gapped metrics before the funding gate',
    },
    recordedCount: recorded.length,
    seedGapCount: seedGaps.length,
    coveragePct,
    metrics: recorded.map((m) => ({
      metric: m.label,
      value: `${m.value} ${m.unit}`,
      source: m.source,
      asOf: m.asOf,
      confidence: m.confidence,
    })),
    seedGaps: binding.seedGaps.map((g) => ({
      metric: g.metricName,
      reason: g.gapStatement,
      expectedDataSource: g.expectedDataSource,
    })),
  };
}

function buildWorkstreamEstimate(
  skeleton: BusinessCaseSkeleton,
  generatedOn: string,
): MoveEstimateWorkstreamSection {
  const effort = skeleton.effort;
  const bvc = effort.buildVsChange;
  const isChange = (id: WorkstreamId): boolean =>
    BUSINESS_CHANGE_WORKSTREAMS.has(id);

  return {
    anatomy: {
      page: 3,
      id: 'workstream-estimate',
      navLabel: 'Workstream estimate',
      takeaway:
        `All ${effort.workstreams.length} workstreams are costed ` +
        'individually — the estimate is never collapsed into a generic ' +
        'six-role model.',
      decisionRole:
        'Challenge the workstream decomposition and the cost per stream.',
      evidence: {
        sources: [
          `Moves Expert Kernel — effort estimator ` +
            `(${effort.workstreams.length} workstreams)`,
        ],
        asOf: generatedOn,
        confidence: 'medium',
        gaps: [],
      },
      implication:
        'Business change is ' +
        `${Math.round(bvc.businessChangeFraction * 100)}% of effort — ` +
        'surfaced, not buried under AI build.',
      owner: 'Move sponsor (to be confirmed with the tenant)',
      nextGate: 'Estimate review before the funding gate',
    },
    workstreams: effort.workstreams.map((w) => ({
      id: w.id,
      label: w.label,
      baseCost: w.baseCost,
      // The cost Range carries low=upside, high=conservative.
      conservativeCost: w.cost.high,
      upsideCost: w.cost.low,
      humanCost: w.humanCost,
      agentCost: w.agentCost,
      headcount: w.totalHeadcount,
      durationMonths: w.durationMonths,
      agentSplitPct: Math.round(w.agentSplit * 100),
      isBusinessChange: isChange(w.id),
    })),
    totalBase: effort.totalCost.point,
    totalConservative: effort.totalCost.high,
    totalUpside: effort.totalCost.low,
    aiBuildCost: bvc.aiBuildCost,
    businessChangeCost: bvc.businessChangeCost,
    businessChangeFraction: bvc.businessChangeFraction,
    aiOpsCost: bvc.aiOpsCost,
    aiOps: skeleton.aiOpsCost
      ? {
          threeYearTotal: skeleton.aiOpsCost.threeYearTotal,
          fiveYearTotal: skeleton.aiOpsCost.fiveYearTotal,
          costPerCallUsd: skeleton.aiOpsCost.unitEconomic.costPerCallUsd,
          costPerDecisionUsd:
            skeleton.aiOpsCost.unitEconomic.costPerDecisionUsd ?? null,
          decisionUnit:
            skeleton.aiOpsCost.unitEconomic.decisionUnit ?? null,
          rateCardAsOf: skeleton.aiOpsCost.rateCard.asOf,
          pricingTierShockWarning:
            skeleton.aiOpsCost.pricingTierShockWarning,
          modelTierDriftWarning: skeleton.aiOpsCost.modelTierDriftWarning,
          perYear: skeleton.aiOpsCost.perYear,
        }
      : null,
    buildVsChangeNote: bvc.note,
  };
}

function buildRateCard(
  skeleton: BusinessCaseSkeleton,
  generatedOn: string,
): MoveEstimateRateCardSection {
  const effort = skeleton.effort;
  const isClientOverride =
    effort.rateCard.provenance === 'comprehensive' ||
    effort.rateCard.provenance === 'client_specific';
  const cells = buildRateCardCells(effort.rateCard.rates);

  return {
    anatomy: {
      page: 4,
      id: 'rate-card',
      navLabel: 'Rate card & overrides',
      takeaway: isClientOverride
        ? 'Every rate traces to a named source — the estimate runs on a ' +
          'client rate-card pack, not a hidden benchmark.'
        : 'Every rate traces to a named source — the estimate runs on a ' +
          'researched benchmark rate card, labelled NOT a quote.',
      decisionRole:
        'Audit the rate-card source and confirm the override path is real.',
      evidence: {
        sources: ['Moves Expert Kernel — effort estimator rate card', effort.rateCard.label],
        asOf: generatedOn,
        confidence: 'medium',
        gaps: isClientOverride
          ? []
          : [
              'The rate card is a researched planning benchmark — not a ' +
                'client quote; replace it with a client-specific card before ' +
                'funding.',
            ],
      },
      implication: isClientOverride
        ? 'A client-specific rate card already overrides the benchmark — the ' +
          'estimate is not built on generic rates.'
        : 'The investment range is planning-grade; a client-specific rate ' +
          'card must replace the benchmark before any funding commitment.',
      owner: 'Move sponsor (to be confirmed with the tenant)',
      nextGate: 'Replace the benchmark card with an executed client rate card',
    },
    provenance: effort.rateCard.provenance,
    provenanceLabel: effort.rateCard.label,
    isClientOverride,
    cells,
    agentSplitPct: Math.round(effort.effectiveAgentSplit * 100),
    overrideNote:
      'The effort estimator consumes a rate card through a labelled ' +
      'abstraction — a client-specific card always replaces the researched ' +
      'benchmark cleanly. Until an executed client rate card is supplied, ' +
      'the estimate runs on the kernel’s researched benchmark — a market ' +
      'planning range, explicitly NOT a quote.',
  };
}

function buildValueForecast(
  skeleton: BusinessCaseSkeleton,
  generatedOn: string,
  paybackBlocked: boolean,
): MoveEstimateValueSection {
  // The compiled skeleton does not re-expose the raw ValueForecast (the
  // per-dimension haircut factors). The honest read is the compiled net-value
  // planning range. The upper bound stands in as the unhaircut ceiling so the
  // deck can show that a discount was applied — without inventing a gross.
  const net = skeleton.valueRange;
  const grossCeiling = net.high;
  const haircutPct =
    grossCeiling > 0
      ? Math.round(((grossCeiling - net.point) / grossCeiling) * 100)
      : 0;

  return {
    anatomy: {
      page: 5,
      id: 'value-forecast',
      navLabel: 'Value forecast',
      takeaway: paybackBlocked
        ? 'Value is a planning range built on curated benchmark proxies — ' +
          'the kernel honestly blocks a claimable dollar payback.'
        : `Net 3-year value lands at ${formatUsd(net.point)} after the ` +
          'mandatory six-factor haircut discounts the gross planning range.',
      decisionRole:
        'Confirm the value is honestly discounted, not optimistic.',
      evidence: {
        sources: [
          'Moves Expert Kernel — value forecast (six-factor haircut model)',
          'Function Pack value model — curated planning benchmarks',
        ],
        asOf: generatedOn,
        confidence: paybackBlocked ? 'low' : 'medium',
        gaps: paybackBlocked
          ? [
              'Gross value rests on the Function Pack’s curated benchmark ' +
                'ranges — a planning proxy until the tenant’s spend base lands.',
            ]
          : [],
      },
      implication: paybackBlocked
        ? 'The net value is a planning proxy, not a forecast, until the ' +
          'seed-gapped metrics and the tenant spend base are supplied.'
        : 'The net value is a defensible planning figure.',
      owner: 'Move sponsor (to be confirmed with the tenant)',
      nextGate: 'Close the seed-gapped metrics that ground the forecast',
    },
    netValue: { low: net.low, point: net.point, high: net.high },
    grossCeiling,
    haircutPct,
    monetisationBlocked: paybackBlocked,
    // A deliberately conservative adoption ramp — value lands as people change
    // how they work, never on day one. A planning curve, not a commitment.
    curve: [
      { year: 1, adoption: 0.3, netValue: round2(net.point * 0.3) },
      { year: 2, adoption: 0.65, netValue: round2(net.point * 0.65) },
      { year: 3, adoption: 0.85, netValue: round2(net.point * 0.85) },
    ],
  };
}

function buildSensitivity(
  skeleton: BusinessCaseSkeleton,
  generatedOn: string,
  paybackBlocked: boolean,
): MoveEstimateSensitivitySection {
  const s = skeleton.sensitivity;

  // The cash-flow shape is staged across the effort estimate's three cost
  // lanes — foundational/build, then change & adoption, then run — with the
  // net value unlocked along the conservative adoption ramp. Because
  // monetisation is blocked the lines model discounted NET VALUE, never
  // verified cash, and never cross zero as a payback claim.
  const effort = skeleton.effort;
  const bvc = effort.buildVsChange;
  const runCost =
    effort.workstreams.find((w) => w.id === 'run')?.baseCost ?? 0;
  const buildLane = Math.max(0, bvc.aiBuildCost - runCost);
  const changeLane = bvc.businessChangeCost;
  const periodLabels = ['Start', 'Build', 'Change', 'Run'];
  const netPoint = skeleton.valueRange.point;
  // Cumulative net value: cost lands in the build/change periods, value
  // unlocks along the adoption ramp from the change period onward.
  const cashSeries = (
    effortScale: number,
    valueScale: number,
  ): number[] => {
    const v = netPoint * valueScale;
    return [
      0,
      Math.round(-buildLane * effortScale),
      Math.round(-buildLane * effortScale - changeLane * effortScale + v * 0.3),
      Math.round(
        -buildLane * effortScale - changeLane * effortScale - runCost * effortScale + v * 0.85,
      ),
    ];
  };

  return {
    anatomy: {
      page: 6,
      id: 'sensitivity',
      navLabel: 'Sensitivity & cash flow',
      takeaway:
        'The case is shown as three scenarios, never one point — and ' +
        'because monetisation is blocked the cash-flow curve is a net-value ' +
        'model, not a payback claim.',
      decisionRole:
        'Stress the estimate — find the downside and what would break it.',
      evidence: {
        sources: [
          'Business-case compiler — three-scenario sensitivity',
          'Assumption ledger — ranked by sensitivity impact',
        ],
        asOf: generatedOn,
        confidence: paybackBlocked ? 'blocked' : 'medium',
        gaps: skeleton.assumptions.seedGapProxies
          .slice(0, 3)
          .map((a) => `${a.key} — stands in for absent tenant data`),
      },
      implication: paybackBlocked
        ? 'No payback month is claimed — the curve models discounted net ' +
          'value, not verified cash, while monetisation is blocked.'
        : 'The seed-gap-proxy assumptions are the highest-leverage things to ' +
          'validate before the funding gate.',
      owner: 'Move sponsor (to be confirmed with the tenant)',
      nextGate: 'Validate the case-moving assumptions before funding',
    },
    scenarios: [
      { label: 'Conservative', netReturn: s.conservative.point, tone: 'low' },
      { label: 'Base', netReturn: s.base.point, tone: 'base' },
      { label: 'Upside', netReturn: s.upside.point, tone: 'high' },
    ],
    tornado: skeleton.assumptions.byImpact
      .filter((a) => a.sensitivityImpact !== 'low')
      .slice(0, 6)
      .map((a) => ({
        label: assumptionShortLabel(a.key, a.statement),
        swing:
          a.sensitivityImpact === 'high'
            ? a.isSeedGapProxy
              ? 100
              : 78
            : 46,
        isProxy: a.isSeedGapProxy,
      })),
    whatBreaksTheCase: s.whatBreaksTheCase,
    cashFlow: {
      base: cashSeries(1, 1),
      conservative: cashSeries(
        effort.totalCost.high / Math.max(1, effort.totalCost.point),
        0.7,
      ),
      upside: cashSeries(
        effort.totalCost.low / Math.max(1, effort.totalCost.point),
        1.25,
      ),
      periodLabels,
    },
    paybackBlocked,
    paybackNote: paybackBlocked
      ? 'Payback is not computable — the gross value the cash-flow rests on ' +
        'uses the Function Pack’s curated benchmark proxies (the value model ' +
        'is a planning range, not the tenant’s measured economics). The curve ' +
        'models discounted net value, not verified cash.'
      : 'Payback is computed at the base case — see the executive summary ' +
        'tile. The curve still models discounted net value, a planning shape.',
  };
}

// ---------------------------------------------------------------------------
// Rate-card coverage matrix — pure, mirrors the Apex Estimate Model helper.
// ---------------------------------------------------------------------------

/** Map a should-cost role-family domain to a short human label. */
const DOMAIN_LABELS: Record<string, string> = {
  ai_ml: 'AI / ML',
  data_engineering: 'Data engineering',
  integration: 'Integration',
  solution_architecture: 'Solution architecture',
  application_engineering: 'Application engineering',
  governance_compliance: 'Governance & compliance',
  process_redesign: 'Process redesign',
  change_management: 'Change & adoption',
  business_analysis: 'Business analysis',
  program_pmo: 'Program / PMO',
  qa_evaluation: 'QA / evaluation',
  security_risk: 'Security & risk',
};

/**
 * Build the rate-card coverage matrix cells. The kernel rate card carries one
 * `RoleRateCard` row per should-cost role (onshore + offshore). This folds the
 * roles into role-family rows — keeping domain / location lanes distinct (the
 * hard fail to avoid is collapsing them into one blended row). A role family
 * the rate card does not price renders an honest unpriced (`null`) lane.
 */
function buildRateCardCells(
  rates: Array<{
    role: string;
    onshoreAnnualRate: number;
    offshoreAnnualRate: number;
  }>,
): Array<{ domain: string; onshore: number | null; offshore: number | null }> {
  const roleToFamily: Record<string, string> = {
    solution_architect: 'solution_architecture',
    senior_engineer: 'application_engineering',
    engineer: 'application_engineering',
    data_engineer: 'data_engineering',
    ai_ml_lead: 'ai_ml',
    integration_engineer: 'integration',
    analyst: 'business_analysis',
    project_manager: 'program_pmo',
    change_lead: 'change_management',
    process_lead: 'process_redesign',
    governance_risk_lead: 'governance_compliance',
    qa_eval_lead: 'qa_evaluation',
    security_architect: 'security_risk',
  };
  const familyOrder = [
    'ai_ml',
    'data_engineering',
    'integration',
    'solution_architecture',
    'application_engineering',
    'governance_compliance',
    'process_redesign',
    'change_management',
    'business_analysis',
    'program_pmo',
    'qa_evaluation',
    'security_risk',
  ];
  const byFamily = new Map<
    string,
    { onshore: number[]; offshore: number[] }
  >();
  for (const r of rates) {
    const fam = roleToFamily[r.role];
    if (!fam) continue;
    const bucket = byFamily.get(fam) ?? { onshore: [], offshore: [] };
    bucket.onshore.push(r.onshoreAnnualRate);
    bucket.offshore.push(r.offshoreAnnualRate);
    byFamily.set(fam, bucket);
  }
  const avg = (xs: number[]): number | null =>
    xs.length === 0
      ? null
      : Math.round(xs.reduce((sum, x) => sum + x, 0) / xs.length);
  // Only render the families the rate card actually prices — an empty matrix
  // would be misleading, so a card with no recognised roles falls back to the
  // full family list with honest unpriced lanes.
  const pricedFamilies = familyOrder.filter((fam) => byFamily.has(fam));
  const order = pricedFamilies.length > 0 ? pricedFamilies : familyOrder;
  return order.map((fam) => {
    const bucket = byFamily.get(fam);
    return {
      domain: DOMAIN_LABELS[fam] ?? fam,
      onshore: bucket ? avg(bucket.onshore) : null,
      offshore: bucket ? avg(bucket.offshore) : null,
    };
  });
}

// ---------------------------------------------------------------------------
// Helpers.
// ---------------------------------------------------------------------------

/** The Move title — prefers the Move's own name, falls back to the function. */
function readMoveLabel(
  move: MoveBusinessCaseInput,
  binding: FunctionPackBinding,
): string {
  const name = typeof move.name === 'string' ? move.name.trim() : '';
  if (name) return name;
  if (binding.functionLabel) return `${binding.functionLabel} Move`;
  return 'Move';
}

/** The verdict headline — the kernel's REAL verdict, never a fabricated `go`. */
function verdictHeadlineText(
  recommendation: 'fund' | 'shape' | 'kill',
  paybackBlocked: boolean,
): string {
  if (recommendation === 'fund') {
    return 'FUND — the estimate holds and the case pays back.';
  }
  if (recommendation === 'kill') {
    return 'KILL — the estimate does not support funding.';
  }
  return paybackBlocked
    ? 'SHAPE — the estimate is credible, but payback cannot be stated until ' +
        'the monetisation seed gaps close, so the case is not yet fundable.'
    : 'SHAPE — the estimate is credible, but the case is not yet fundable ' +
        'as-is.';
}

/** A short verdict chip word. */
function verdictChipText(recommendation: 'fund' | 'shape' | 'kill'): string {
  if (recommendation === 'fund') return 'FUND — the estimate supports funding';
  if (recommendation === 'kill') return 'KILL — do not fund';
  return 'SHAPE — credible estimate, not fundable as-is';
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Format a USD number compactly, e.g. $2.20M, $940K. */
function formatUsd(n: number): string {
  const a = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (a >= 1_000_000) return `${sign}$${(a / 1_000_000).toFixed(2)}M`;
  if (a >= 1_000) return `${sign}$${Math.round(a / 1_000)}K`;
  return `${sign}$${Math.round(a)}`;
}

/** A short label for an assumption — first clause of the statement. */
function assumptionShortLabel(key: string, statement: string): string {
  const firstClause = statement.split(/[:.]/)[0]?.trim() ?? '';
  if (firstClause && firstClause.length <= 48) return firstClause;
  if (firstClause) return `${firstClause.slice(0, 45).trimEnd()}…`;
  return key;
}
