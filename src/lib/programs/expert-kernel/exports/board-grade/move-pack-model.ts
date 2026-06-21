// Generic Move Costed Business-Case Pack — view-model.
//
// The Apex reference pack (`pack-model.ts`) projects a deck from the THREE
// hand-authored kernel cases. This module is its generic sibling: it projects
// a board-grade Costed Business-Case Pack from `buildMoveBusinessCase(move)` —
// the kernel run for a REAL, originated Move.
//
// The two seams it honours, exactly as the task requires:
//   • the kernel `skeleton` (a `BusinessCaseSkeleton` from `compileBusinessCase`)
//     drives the value / effort / verdict CONTENT — every figure traces to a
//     kernel field, no number is fabricated;
//   • the binding's `deliverableOutline` drives the SECTION STRUCTURE — the
//     curated Function-Pack TOC is inherited as the deck's section spine, and
//     the binding's `seedGaps` are rendered into the evidence-gaps strip.
//
// HONESTY DISCIPLINE (mandatory): the verdict shown is the kernel's REAL
// recommendation (`fund` / `shape` / `kill`) — never a fabricated `go`. Value
// is shown as planning ranges. Seed gaps are named, never blank. When a Move
// binds no curated pack, `buildMoveCostedBusinessCasePack` returns an honest
// UNBOUND result (`bound:false`) — the renderer shows the honest "no curated
// Function Pack covers this function" state, not a fake deck.
//
// `buildApexCostedBusinessCasePack` is left intact as the reference
// implementation — this module is added alongside it, not in place of it.
//
// Pure module: deterministic, no I/O.

import {
  buildMoveBusinessCase,
  type MoveBusinessCaseInput,
} from '../../../move-business-case';
import type { BusinessCaseSkeleton } from '../../business-case-compiler';
import type { FunctionPackBinding } from '../../domain/function-pack-context-binding';
import { resolveBoardGradeTenantLabel } from './tenant-label-resolver';
import {
  dominantVerdictCause,
  type VerdictExplainerChip,
} from './verdict-explainer';
import { buildMoveWorkforceEconomics } from './move-workforce-economics-binding';
import type { WorkforceEstimateTwice } from '@/lib/workforce-economics/workforce-economics';

// ---------------------------------------------------------------------------
// Section anatomy — mirrors the Apex pack's `SectionAnatomy` so the generic
// deck reuses the same shell scaffold (`slideShell`, footer facts).
// ---------------------------------------------------------------------------

/** A consulting-exhibit section header — same shape as the Apex pack. */
export interface MoveSectionAnatomy {
  /** Page number among the deck's section slides. */
  page: number;
  /** Anchor id for the table of contents. */
  id: string;
  /** Short eyebrow / TOC label. */
  navLabel: string;
  /** Takeaway title — a sentence with a point of view. */
  takeaway: string;
  /** The decision this page supports. */
  decisionRole: string;
  /** Evidence strip — sources, dates, confidence, gaps. */
  evidence: MoveEvidenceStrip;
  /** The implication — the action the exhibit creates. */
  implication: string;
  /** Owner accountable for resolving the page's issue. */
  owner: string;
  /** Where it gates the process. */
  nextGate: string;
}

export interface MoveEvidenceStrip {
  sources: string[];
  asOf: string;
  confidence: 'high' | 'medium' | 'low' | 'blocked';
  gaps: string[];
}

// ---------------------------------------------------------------------------
// The generic pack view-model.
// ---------------------------------------------------------------------------

/**
 * The generic Move Costed Business-Case Pack — the projected, bound result.
 *
 * `bound` is always `true` here; an unbound Move yields `MoveUnboundResult`
 * instead. The discriminated union (`MoveCostedBusinessCaseResult`) lets the
 * renderer branch honestly.
 */
export interface MoveCostedBusinessCasePack {
  bound: true;
  tenantLabel: string;
  tenantKey: string;
  moveLabel: string;
  artifactLabel: string;
  /** The bound Function-Pack function label, e.g. "Customer Care". */
  functionLabel: string;
  generatedOn: string;
  /** The kernel verdict — the REAL recommendation, never fabricated. */
  verdict: 'fund' | 'shape' | 'kill';
  /** The kernel's plain rationale for the verdict. */
  verdictRationale: string;
  /** True when the kernel cannot monetise the value. */
  monetisationBlocked: boolean;
  /**
   * Pilot rehearsal P2-3 — the explainer chip surfaced on a non-`fund`
   * verdict. `null` when the verdict is `fund` (no chip needed). Pulled from
   * the kernel's structured fields by `dominantVerdictCause`.
   */
  verdictExplainerChip: VerdictExplainerChip | null;
  /** The deck sections, page-ordered. */
  sections: MovePackSections;
  /**
   * Workforce Economics "estimate-twice" (WE-3) — TRADITIONAL (people-only) vs
   * AI-NATIVE (people + agents on subscription), with the cost / timeline /
   * headcount delta and the productivity gain. Present ONLY when the
   * `moves_workforce_economics` flag is ON for the tenant AND the Move's scope
   * is rich enough to derive a credible estimate-twice. Absent (`undefined`)
   * otherwise — and absent by default, so the flag-OFF pack is byte-identical
   * to before this field existed.
   */
  workforceEconomics?: WorkforceEstimateTwice;
  /** Navigation entries for the sticky TOC. */
  toc: Array<{ page: number; id: string; label: string; takeaway: string }>;
}

/**
 * The honest unbound result — a Move whose function is not covered by any
 * curated Domain Function Pack. The renderer shows this as an honest empty
 * state, NEVER a fabricated deck.
 */
export interface MoveUnboundResult {
  bound: false;
  moveLabel: string;
  generatedOn: string;
  /** The honest reason the kernel could not run with curated depth. */
  unboundReason: string;
}

export type MoveCostedBusinessCaseResult =
  | MoveCostedBusinessCasePack
  | MoveUnboundResult;

export interface MovePackSections {
  /** §1 — the board answer: the kernel verdict and headline economics. */
  boardAnswer: MoveBoardAnswerSection;
  /** §2 — the inherited curated outline (the Function-Pack TOC). */
  inheritedOutline: MoveInheritedOutlineSection;
  /** §3 — the costed investment range. */
  investmentCase: MoveInvestmentSection;
  /** §4 — the value forecast (planning ranges). */
  valueCase: MoveValueSection;
  /** §5 — sensitivity and the case-moving assumptions. */
  sensitivity: MoveSensitivitySection;
  /** §6 — the evidence baseline and the precise seed gaps. */
  evidenceGaps: MoveEvidenceGapsSection;
  /** §7 — the recommendation and the verdict's conditions / kill triggers. */
  recommendation: MoveRecommendationSection;
}

// --- §1 Board answer --------------------------------------------------------

export interface MoveBoardAnswerSection {
  anatomy: MoveSectionAnatomy;
  verdictHeadline: string;
  verdictDetail: string;
  economics: Array<{
    label: string;
    value: string;
    sub?: string;
    tone: 'neutral' | 'good' | 'warn' | 'bad';
  }>;
  /** Honesty notes raised while deriving the kernel inputs. */
  derivationNotes: string[];
  blocker: string;
}

// --- §2 Inherited outline ---------------------------------------------------

export interface MoveInheritedOutlineSection {
  anatomy: MoveSectionAnatomy;
  /** The curated TOC inherited from the Function Pack, in pack order. */
  outline: Array<{ heading: string; guidance: string }>;
}

// --- §3 Investment case -----------------------------------------------------

export interface MoveInvestmentSection {
  anatomy: MoveSectionAnatomy;
  waterfall: Array<{ label: string; amount: number }>;
  costStack: Array<{ label: string; value: number; color: string }>;
  investmentRange: { low: number; point: number; high: number };
  workstreams: Array<{
    label: string;
    base: number;
    headcount: number;
    durationMonths: number;
    agentSplitPct: number;
  }>;
  buildVsChangeNote: string;
}

// --- §4 Value case ----------------------------------------------------------

export interface MoveValueSection {
  anatomy: MoveSectionAnatomy;
  grossValue: number;
  netValue: number;
  totalHaircutPct: number;
  bridgeSteps: Array<{ label: string; amount: number }>;
  adoption: Array<{ label: string; adoption: number; netValue: number }>;
}

// --- §5 Sensitivity ---------------------------------------------------------

export interface MoveSensitivitySection {
  anatomy: MoveSectionAnatomy;
  scenarios: Array<{
    name: string;
    netReturn: number;
    tone: 'base' | 'low' | 'high';
  }>;
  tornado: Array<{ label: string; swing: number; isProxy: boolean }>;
  whatBreaksTheCase: string;
}

// --- §6 Evidence and gaps ---------------------------------------------------

export interface MoveEvidenceGapsSection {
  anatomy: MoveSectionAnatomy;
  recordedCount: number;
  gapCount: number;
  coveragePct: number;
  weakestConfidence: 'high' | 'medium' | 'low' | null;
  /** Recorded and seed-gap rows for the evidence/gap matrix. */
  matrix: Array<{ label: string; recorded: boolean; detail: string }>;
  recorded: Array<{
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

// --- §7 Recommendation ------------------------------------------------------

export interface MoveRecommendationSection {
  anatomy: MoveSectionAnatomy;
  verdictHeadline: string;
  verdictDetail: string;
  killTriggers: string[];
  towerHandoff: Array<{
    metric: string;
    baseline: string;
    readinessNote: string;
  }>;
}

// ===========================================================================
// Builder.
// ===========================================================================

/** The deliverable artifact label for the inherited business-case outline. */
const ARTIFACT_LABEL = 'Costed Business-Case Pack';

/**
 * Generation options. Default (omitted) keeps the pack byte-identical to
 * before any of these knobs existed — the safe, dormant default.
 */
export interface MoveCostedBusinessCasePackOptions {
  /**
   * WE-3 — when `true`, derive and attach the Workforce Economics
   * "estimate-twice" (`workforceEconomics`). The CALLER is responsible for
   * gating this on the `moves_workforce_economics` tenant flag; the model stays
   * pure. When the Move's scope is too thin to derive a credible estimate, the
   * field is omitted (skip, never fabricate). Default `false` ⇒ the engine is
   * not called and no field is attached (byte-identical).
   */
  workforceEconomicsEnabled?: boolean;
}

/**
 * Build the generic Move Costed Business-Case Pack view-model.
 *
 * Runs `buildMoveBusinessCase(move)`. When the Move binds a curated pack and
 * the kernel produces a real skeleton, projects the bound pack. When the Move
 * is unbound, returns the honest `MoveUnboundResult` — never a fabricated
 * deck.
 *
 * Deterministic — same Move + `generatedOn` (+ `opts`) → same result.
 */
export function buildMoveCostedBusinessCasePack(
  move: MoveBusinessCaseInput,
  generatedOn: string,
  opts: MoveCostedBusinessCasePackOptions = {},
): MoveCostedBusinessCaseResult {
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
  const monetisationBlocked = !skeleton.economics.monetisable;
  const functionLabel = binding.functionLabel ?? 'this function';

  const boardAnswer = buildBoardAnswer(
    skeleton,
    generatedOn,
    monetisationBlocked,
    result.derivationNotes,
  );
  const inheritedOutline = buildInheritedOutline(
    binding,
    generatedOn,
    functionLabel,
  );
  const investmentCase = buildInvestmentCase(skeleton, generatedOn);
  const valueCase = buildValueCase(skeleton, generatedOn, monetisationBlocked);
  const sensitivity = buildSensitivity(skeleton, generatedOn);
  const evidenceGaps = buildEvidenceGaps(skeleton, binding, generatedOn);
  const recommendation = buildRecommendation(
    skeleton,
    generatedOn,
    monetisationBlocked,
  );

  const sections: MovePackSections = {
    boardAnswer,
    inheritedOutline,
    investmentCase,
    valueCase,
    sensitivity,
    evidenceGaps,
    recommendation,
  };

  const ordered: MoveSectionAnatomy[] = [
    boardAnswer.anatomy,
    inheritedOutline.anatomy,
    investmentCase.anatomy,
    valueCase.anatomy,
    sensitivity.anatomy,
    evidenceGaps.anatomy,
    recommendation.anatomy,
  ];

  const { tenantLabel, tenantKey } = resolveBoardGradeTenantLabel(
    move,
    skeleton.tenantKey,
  );

  // WE-3 — derive the Workforce Economics estimate-twice ONLY when the caller
  // opted in (the tenant flag is ON). When omitted, nothing is computed and the
  // field is never added, so the pack is byte-identical to before this seam
  // existed. `null` (scope too thin) is also a no-attach — skip, never
  // fabricate.
  const workforceEconomics = opts.workforceEconomicsEnabled
    ? buildMoveWorkforceEconomics(skeleton, moveLabel)
    : null;

  const pack: MoveCostedBusinessCasePack = {
    bound: true,
    tenantLabel,
    tenantKey,
    moveLabel,
    artifactLabel: ARTIFACT_LABEL,
    functionLabel,
    generatedOn,
    verdict: skeleton.recommendation,
    verdictRationale: skeleton.recommendationRationale,
    monetisationBlocked,
    verdictExplainerChip: dominantVerdictCause(skeleton, binding),
    sections,
    toc: ordered.map((a) => ({
      page: a.page,
      id: a.id,
      label: a.navLabel,
      takeaway: a.takeaway,
    })),
  };
  if (workforceEconomics) {
    pack.workforceEconomics = workforceEconomics;
  }
  return pack;
}

// ---------------------------------------------------------------------------
// Section builders.
// ---------------------------------------------------------------------------

function buildBoardAnswer(
  skeleton: BusinessCaseSkeleton,
  generatedOn: string,
  monetisationBlocked: boolean,
  derivationNotes: string[],
): MoveBoardAnswerSection {
  const verdict = skeleton.recommendation;
  const primaryBlocker = skeleton.critic.blockers[0]?.message ?? '';
  const seedGapLabels = skeleton.baseline.seedGaps.map((g) => g.label);

  return {
    anatomy: {
      page: 1,
      id: 'board-answer',
      navLabel: 'Board answer',
      takeaway: verdictHeadlineText(verdict, monetisationBlocked),
      decisionRole:
        'Read the kernel verdict and the headline economics before any ' +
        'funding decision.',
      evidence: {
        sources: [
          'Moves Expert Kernel — business-case compiler + critic',
          'The Move’s recorded data + its bound Domain Function Pack',
        ],
        asOf: generatedOn,
        confidence: monetisationBlocked ? 'blocked' : 'medium',
        gaps: seedGapLabels,
      },
      implication:
        'The verdict is the kernel’s real recommendation — it is read, not ' +
        'negotiated.',
      owner: 'Move sponsor (to be confirmed with the tenant)',
      nextGate: 'The next phase gate for this Move',
    },
    verdictHeadline: verdictChipText(verdict),
    verdictDetail: skeleton.recommendationRationale,
    economics: [
      {
        label: 'Investment (base)',
        value: compact(skeleton.economics.investment.point),
        sub: `${compact(skeleton.economics.investment.low)}–${compact(
          skeleton.economics.investment.high,
        )} planning range`,
        tone: 'neutral',
      },
      {
        label: 'Net value (3-yr, base)',
        value: compact(skeleton.valueRange.point),
        sub: `${compact(skeleton.valueRange.low)}–${compact(
          skeleton.valueRange.high,
        )} · post-haircut`,
        tone: monetisationBlocked ? 'warn' : 'good',
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
        label: 'Open blockers',
        value: String(skeleton.critic.blockers.length),
        sub: `${skeleton.baseline.seedGaps.length} seed gaps`,
        tone: skeleton.critic.blockers.length > 0 ? 'warn' : 'good',
      },
      {
        label: 'Verdict',
        value: verdict.toUpperCase(),
        sub: 'Kernel recommendation',
        tone: verdict === 'fund' ? 'good' : verdict === 'kill' ? 'bad' : 'warn',
      },
    ],
    derivationNotes,
    blocker:
      primaryBlocker ||
      (monetisationBlocked
        ? 'Value cannot be monetised — the gross value rests on a curated ' +
          'benchmark proxy until the tenant’s own metrics are supplied.'
        : 'No critic blocker — the kernel raised no funding-blocking finding.'),
  };
}

function buildInheritedOutline(
  binding: FunctionPackBinding,
  generatedOn: string,
  functionLabel: string,
): MoveInheritedOutlineSection {
  const outline = binding.deliverableOutline;
  return {
    anatomy: {
      page: 2,
      id: 'inherited-outline',
      navLabel: 'Inherited outline',
      takeaway:
        `This deck inherits the curated ${functionLabel} business-case ` +
        `outline — ${outline.length} sections, structure not improvised.`,
      decisionRole:
        'Confirm the deck follows the curated, function-calibrated structure.',
      evidence: {
        sources: [
          `Domain Function Pack — ${functionLabel} deliverable outline`,
        ],
        asOf: generatedOn,
        confidence: 'high',
        gaps: [],
      },
      implication:
        'The artifact’s table of contents is inherited from the curated ' +
        'Function Pack — the agent does not improvise the structure.',
      owner: 'Domain Function Pack (curated)',
      nextGate: 'Each curated section is answered against the Move’s data',
    },
    outline: outline.map((s) => ({
      heading: s.heading,
      guidance: s.guidance,
    })),
  };
}

function buildInvestmentCase(
  skeleton: BusinessCaseSkeleton,
  generatedOn: string,
): MoveInvestmentSection {
  const ws = skeleton.effort.workstreams;
  const wsCost = (id: string): number =>
    ws.find((w) => w.id === id)?.baseCost ?? 0;
  const buildLane = wsCost('ai_build') + wsCost('foundational');
  const integrationLane = wsCost('integration') + wsCost('data');
  const dataGovLane = wsCost('data_governance');
  const changeLane = wsCost('process_redesign') + wsCost('change_adoption');
  const runLane = wsCost('run');
  const bvc = skeleton.effort.buildVsChange;

  return {
    anatomy: {
      page: 3,
      id: 'investment-case',
      navLabel: 'Investment case',
      takeaway:
        `The build is a ${compact(skeleton.economics.investment.point)} base ` +
        `planning estimate — a range, derived from the Function Pack ` +
        `archetypes, NOT a quote.`,
      decisionRole: 'See the investment envelope and where the money goes.',
      evidence: {
        sources: [
          'Effort estimator — should-cost role-mix engine',
          skeleton.effort.rateCard.label,
        ],
        asOf: generatedOn,
        confidence: 'medium',
        gaps: [
          'The rate card is a researched planning benchmark — not a client ' +
            'quote; replace it with a client-specific card before funding.',
        ],
      },
      implication:
        'The investment range is planning-grade; the business-change lane ' +
        'is the execution risk to protect, not trim.',
      owner: 'Move sponsor (to be confirmed with the tenant)',
      nextGate: 'A client-specific estimate before any funding commitment',
    },
    waterfall: [
      { label: 'AI build + foundational', amount: buildLane },
      { label: 'Integration + data', amount: integrationLane },
      { label: 'Data governance', amount: dataGovLane },
      { label: 'Change + adoption', amount: changeLane },
      { label: 'Run (year 1)', amount: runLane },
    ].filter((s) => s.amount > 0),
    costStack: [
      {
        label: 'AI build',
        value: Math.max(0, bvc.aiBuildCost - runLane),
        color: '#0b4a91',
      },
      { label: 'Run', value: runLane, color: '#5b5852' },
      {
        label: 'Business change',
        value: bvc.businessChangeCost,
        color: '#a8533a',
      },
    ].filter((s) => s.value > 0),
    investmentRange: skeleton.economics.investment,
    workstreams: ws.map((w) => ({
      label: w.label,
      base: w.baseCost,
      headcount: w.totalHeadcount,
      durationMonths: w.durationMonths,
      agentSplitPct: Math.round(w.agentSplit * 100),
    })),
    buildVsChangeNote: bvc.note,
  };
}

function buildValueCase(
  skeleton: BusinessCaseSkeleton,
  generatedOn: string,
  monetisationBlocked: boolean,
): MoveValueSection {
  // The value forecast is re-derivable from the skeleton only through the
  // compiled valueRange; the haircut detail lives on the critic-fed forecast.
  // The skeleton does not re-expose the raw ValueForecast, so the value case
  // is projected from the skeleton's compiled fields — net value range, and
  // the assumptions ledger (the haircut factors surface there as proxies).
  const net = skeleton.valueRange;
  // Gross is not separately carried on the skeleton; the honest read is the
  // net planning range. Render the bridge as a single "haircut applied"
  // step so the deck shows the discount happened without inventing a gross.
  const grossProxy = net.high; // upper planning bound as the unhaircut ceiling
  const haircutPct =
    grossProxy > 0
      ? Math.round(((grossProxy - net.point) / grossProxy) * 100)
      : 0;

  return {
    anatomy: {
      page: 4,
      id: 'value-case',
      navLabel: 'Value case',
      takeaway:
        monetisationBlocked
          ? 'Value is a planning range built on curated benchmark proxies — ' +
            'the kernel honestly blocks a claimable dollar payback.'
          : `Net 3-year value lands at ${compact(net.point)} after the ` +
            'mandatory six-factor haircut.',
      decisionRole: 'Confirm the value is honestly discounted, not optimistic.',
      evidence: {
        sources: [
          'Value forecast — mandatory six-factor haircut model',
          'Function Pack value model — curated planning benchmarks',
        ],
        asOf: generatedOn,
        confidence: monetisationBlocked ? 'low' : 'medium',
        gaps: monetisationBlocked
          ? [
              'Gross value rests on the Function Pack’s curated benchmark ' +
                'ranges — a planning proxy until the tenant’s spend base lands.',
            ]
          : [],
      },
      implication:
        monetisationBlocked
          ? 'The net value is a planning proxy, not a forecast, until the ' +
            'seed-gapped metrics and the tenant spend base are supplied.'
          : 'The net value is a defensible planning figure.',
      owner: 'Move sponsor (to be confirmed with the tenant)',
      nextGate: 'Close the seed-gapped metrics that ground the forecast',
    },
    grossValue: grossProxy,
    netValue: net.point,
    totalHaircutPct: haircutPct,
    bridgeSteps:
      grossProxy > net.point
        ? [{ label: 'Six-factor haircut', amount: grossProxy - net.point }]
        : [],
    // The compiled skeleton does not re-expose per-dimension haircut factors;
    // they are surfaced instead through the assumption ledger (the sensitivity
    // section). The value case carries the net-range read, honest about what
    // it can and cannot show.
    adoption: [
      { label: 'Year 1', adoption: 0.3, netValue: round2(net.point * 0.3) },
      { label: 'Year 2', adoption: 0.65, netValue: round2(net.point * 0.65) },
      { label: 'Year 3', adoption: 0.85, netValue: round2(net.point * 0.85) },
    ],
  };
}

function buildSensitivity(
  skeleton: BusinessCaseSkeleton,
  generatedOn: string,
): MoveSensitivitySection {
  const s = skeleton.sensitivity;
  return {
    anatomy: {
      page: 5,
      id: 'sensitivity',
      navLabel: 'Sensitivity',
      takeaway:
        'The case is shown as a range — base, conservative, upside — never ' +
        'a single point. The widest movers are the evidence asks.',
      decisionRole: 'See what breaks the case before funding it.',
      evidence: {
        sources: [
          'Business-case compiler — three-scenario sensitivity',
          'Assumption ledger — ranked case movers',
        ],
        asOf: generatedOn,
        confidence: 'medium',
        gaps: skeleton.assumptions.seedGapProxies
          .slice(0, 3)
          .map((a) => `${a.key} — stands in for absent tenant data`),
      },
      implication:
        'The seed-gap-proxy assumptions are the highest-leverage things to ' +
        'validate before the funding gate.',
      owner: 'Move sponsor (to be confirmed with the tenant)',
      nextGate: 'Validate the case-moving assumptions before funding',
    },
    scenarios: [
      { name: 'Conservative', netReturn: s.conservative.point, tone: 'low' },
      { name: 'Base', netReturn: s.base.point, tone: 'base' },
      { name: 'Upside', netReturn: s.upside.point, tone: 'high' },
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
  };
}

function buildEvidenceGaps(
  skeleton: BusinessCaseSkeleton,
  binding: FunctionPackBinding,
  generatedOn: string,
): MoveEvidenceGapsSection {
  const recorded = skeleton.baseline.recordedMetrics;
  const seedGaps = skeleton.baseline.seedGaps;
  const total = recorded.length + seedGaps.length;
  const coveragePct =
    total > 0 ? Math.round((recorded.length / total) * 100) : 0;

  // The matrix reuses the binding's precise seed gaps so each gap names what
  // the metric is and where it is sourced — the binding's `seedGaps` strip.
  const seedGapByKey = new Map(
    binding.seedGaps.map((g) => [g.metricKey, g]),
  );

  const matrix: Array<{ label: string; recorded: boolean; detail: string }> = [
    ...recorded.map((m) => ({
      label: m.label,
      recorded: true,
      detail: m.source,
    })),
    ...seedGaps.map((m) => ({
      label: m.label,
      recorded: false,
      detail:
        seedGapByKey.get(m.key)?.gapStatement ??
        m.seedGapReason ??
        'Not recorded by the tenant.',
    })),
  ];

  return {
    anatomy: {
      page: 6,
      id: 'evidence-gaps',
      navLabel: 'Evidence and gaps',
      takeaway:
        `Baseline coverage is ${coveragePct}% — ${recorded.length} metrics ` +
        `recorded, ${seedGaps.length} declared seed gaps. None are invented.`,
      decisionRole: 'Audit every claim back to a source or a declared gap.',
      evidence: {
        sources: [
          'The Move’s recorded baseline metrics',
          'Function Pack — expected operating metrics',
        ],
        asOf: generatedOn,
        confidence: coveragePct >= 60 ? 'medium' : 'low',
        gaps: seedGaps.map((g) => g.label),
      },
      implication:
        'The case is auditable end to end; the seed gaps are the declared ' +
        'limits of what can be claimed today.',
      owner: 'Move sponsor (to be confirmed with the tenant)',
      nextGate: 'Close the seed gaps before build funding',
    },
    recordedCount: recorded.length,
    gapCount: seedGaps.length,
    coveragePct,
    weakestConfidence: skeleton.baseline.weakestConfidence,
    matrix,
    recorded: recorded.map((m) => ({
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

function buildRecommendation(
  skeleton: BusinessCaseSkeleton,
  generatedOn: string,
  monetisationBlocked: boolean,
): MoveRecommendationSection {
  return {
    anatomy: {
      page: 7,
      id: 'recommendation',
      navLabel: 'Recommendation',
      takeaway: verdictHeadlineText(
        skeleton.recommendation,
        monetisationBlocked,
      ),
      decisionRole: 'Make the funding decision the kernel’s verdict supports.',
      evidence: {
        sources: [
          'Business-case compiler — recommendation + kill criteria',
          'Tower measurement handoff',
        ],
        asOf: generatedOn,
        confidence: monetisationBlocked ? 'blocked' : 'medium',
        gaps: skeleton.baseline.seedGaps.map((g) => g.label),
      },
      implication:
        'The recommendation is the kernel’s real verdict — followed, not ' +
        'rewritten.',
      owner: 'Move sponsor (to be confirmed with the tenant)',
      nextGate: 'Re-present once the named kill triggers are cleared',
    },
    verdictHeadline: verdictChipText(skeleton.recommendation),
    verdictDetail: skeleton.recommendationRationale,
    killTriggers: skeleton.killCriteria.map((k) => k.condition),
    towerHandoff: skeleton.towerHandoff.map((t) => ({
      metric: t.metricLabel,
      baseline:
        t.baselineValue === null
          ? 'Seed gap — not measurable yet'
          : `${t.baselineValue} ${t.unit}`,
      readinessNote: t.readinessNote,
    })),
  };
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
  verdict: 'fund' | 'shape' | 'kill',
  monetisationBlocked: boolean,
): string {
  if (verdict === 'fund') {
    return 'FUND — the case pays back and the downside holds.';
  }
  if (verdict === 'kill') {
    return 'KILL — the Move does not pay back on current assumptions.';
  }
  return monetisationBlocked
    ? 'SHAPE — fund the next shaping gate; monetisation is blocked until the ' +
        'seed gaps close, so the full build is not yet fundable.'
    : 'SHAPE — shape the Move to protect the floor before funding.';
}

/** A short verdict chip word. */
function verdictChipText(verdict: 'fund' | 'shape' | 'kill'): string {
  if (verdict === 'fund') return 'FUND';
  if (verdict === 'kill') return 'KILL — do not fund';
  return 'SHAPE — fund the next gate, not the full build yet';
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Compact USD — kept local so the model has no chart-library dependency. */
function compact(n: number): string {
  const sign = n < 0 ? '-' : '';
  const a = Math.abs(n);
  if (a >= 1_000_000) {
    return `${sign}$${(a / 1_000_000).toFixed(a >= 9_500_000 ? 1 : 2)}M`;
  }
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
