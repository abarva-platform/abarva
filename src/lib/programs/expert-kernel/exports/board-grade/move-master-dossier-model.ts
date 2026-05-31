// Generic Move Master Move Dossier — view-model.
//
// The Apex reference dossier (`master-dossier-model.ts`) assembles the whole
// Move book from the three hand-authored Apex kernel cases. This module is its
// generic sibling: it projects a board-grade Master Move Dossier from
// `buildMoveBusinessCase(move)` — the kernel run for a REAL, originated Move.
//
// The Master Move Dossier is the EIGHTH and LAST board-grade artifact: the
// "assembled book" that pulls the whole Move into one CEO / CFO / CIO read and
// LINKS every other artifact deck. The two seams it honours, exactly as the
// established generic pattern (`move-pack-model.ts`, `move-cfo-pack-model.ts`)
// requires:
//   • the kernel `skeleton` (a `BusinessCaseSkeleton` from `compileBusinessCase`)
//     drives the executive answer, the decision timeline, the economics, the
//     roadmap and the Tower handoff — every figure traces to a kernel field, no
//     number is fabricated;
//   • the binding's `seedGaps` drive the evidence/gap section — the precise,
//     named seed gaps inherited from the curated Function Pack are rendered
//     honestly, never blank.
//
// THE ASSEMBLED-BOOK PIVOT: §6 lists and LINKS every sibling generic
// board-grade deck for THIS Move — each route carrying `?moveId=<id>` so the
// reader opens that Move's kernel-derived chapter, not the Apex reference.
// The sibling list mirrors the seven other generic decks the key-driven
// registry serves.
//
// HONESTY DISCIPLINE (mandatory): the verdict shown is the kernel's REAL
// recommendation (`fund` / `shape` / `kill`) — never a fabricated `go`. Value
// is shown as planning ranges. Seed gaps are named, never blank. When a Move
// binds no curated pack, `buildMoveMasterDossier` returns an honest UNBOUND
// result (`bound:false`) — the renderer shows the honest "no curated Function
// Pack" state, never a fabricated dossier.
//
// `buildApexMasterMoveDossier` is left intact as the reference implementation
// — this module is added alongside it, not in place of it.
//
// Pure module: deterministic, no I/O.

import {
  buildMoveBusinessCase,
  type MoveBusinessCaseInput,
} from '../../../move-business-case';
import type {
  BusinessCaseSkeleton,
  Recommendation,
} from '../../business-case-compiler';
import type { FunctionPackBinding } from '../../domain/function-pack-context-binding';
import { resolveBoardGradeTenantLabel } from './tenant-label-resolver';
import {
  dominantVerdictCause,
  type VerdictExplainerChip,
} from './verdict-explainer';

// ---------------------------------------------------------------------------
// Section anatomy — mirrors the Apex dossier's `DossierSectionAnatomy` so the
// generic deck reuses the same shell scaffold (`slideShell`, footer facts).
// ---------------------------------------------------------------------------

/** Evidence strip — sources, dates, confidence, gaps; visible, not buried. */
export interface MoveDossierEvidenceStrip {
  sources: string[];
  asOf: string;
  confidence: 'high' | 'medium' | 'low' | 'blocked';
  gaps: string[];
}

/** A consulting-exhibit section header — same shape as the Apex dossier. */
export interface MoveDossierSectionAnatomy {
  /** Section number among the deck's section slides. */
  page: number;
  /** Anchor id for the deck slide. */
  id: string;
  /** Short menu / eyebrow label. */
  navLabel: string;
  /** Takeaway title — a sentence with a point of view. */
  takeaway: string;
  /** The decision this page supports. */
  decisionRole: string;
  /** Evidence strip — sources, dates, confidence, gaps. */
  evidence: MoveDossierEvidenceStrip;
  /** The implication — the action the exhibit creates. */
  implication: string;
  /** Owner accountable for resolving the page's issue. */
  owner: string;
  /** Where it gates the process. */
  nextGate: string;
}

// ---------------------------------------------------------------------------
// The generic Master Move Dossier view-model.
// ---------------------------------------------------------------------------

export type MoveDossierVerdict = Recommendation;

/**
 * The generic Move Master Move Dossier — the projected, bound result.
 *
 * `bound` is always `true` here; an unbound Move yields
 * `MoveDossierUnboundResult` instead. The discriminated union
 * (`MoveMasterDossierResult`) lets the renderer branch honestly.
 */
export interface MoveMasterDossier {
  bound: true;
  tenantLabel: string;
  tenantKey: string;
  moveLabel: string;
  /** The Move's id — carried so every sibling-deck link can use `?moveId=`. */
  moveId: string;
  artifactLabel: string;
  /** The bound Function-Pack function label, e.g. "Customer Care". */
  functionLabel: string;
  generatedOn: string;
  /** The kernel verdict — the REAL recommendation, never fabricated. */
  verdict: MoveDossierVerdict;
  /** True when value rests on a seed-gap proxy — payback cannot be claimed. */
  monetisationBlocked: boolean;
  /**
   * Pilot rehearsal P2-3 — the explainer chip surfaced on a non-`fund`
   * verdict. `null` when the verdict is `fund`. Pulled from the kernel's
   * structured fields by `dominantVerdictCause`.
   */
  verdictExplainerChip: VerdictExplainerChip | null;
  /** The seven sections, page-ordered. */
  sections: MoveDossierSections;
  /** Navigation entries for the deck menu rail. */
  toc: Array<{ page: number; id: string; label: string; takeaway: string }>;
}

/**
 * The honest unbound result — a Move whose function is not covered by any
 * curated Domain Function Pack. The renderer shows this as an honest empty
 * state, NEVER a fabricated dossier.
 */
export interface MoveDossierUnboundResult {
  bound: false;
  moveLabel: string;
  generatedOn: string;
  /** The honest reason the kernel could not run with curated depth. */
  unboundReason: string;
}

export type MoveMasterDossierResult =
  | MoveMasterDossier
  | MoveDossierUnboundResult;

export interface MoveDossierSections {
  /** §1 — the executive answer: fund / shape / kill, in one sentence. */
  executiveAnswer: MoveDossierExecutiveSection;
  /** §2 — the decision timeline: how the case is sequenced through phases. */
  decisionTimeline: MoveDossierTimelineSection;
  /** §3 — the economics: investment, value, sensitivity, what breaks it. */
  economics: MoveDossierEconomicsSection;
  /** §4 — the roadmap and Tower handoff: workstreams + measurement. */
  roadmapTower: MoveDossierRoadmapSection;
  /** §5 — evidence and gaps: recorded metrics, declared seed gaps. */
  evidenceAndGaps: MoveDossierEvidenceSection;
  /** §6 — the assembled book: every sibling artifact deck, linked. */
  assembledBook: MoveDossierAssembledBookSection;
  /** §7 — the recommendation: the verdict, the conditions, the kill triggers. */
  recommendation: MoveDossierRecommendationSection;
}

// --- §1 Executive answer ----------------------------------------------------

export interface MoveDossierExecutiveSection {
  anatomy: MoveDossierSectionAnatomy;
  /** The one-sentence verdict word, plain. */
  verdictHeadline: string;
  verdictDetail: string;
  /** Decision-card tiles — verdict, investment, value, payback, blockers. */
  tiles: Array<{
    label: string;
    value: string;
    sub: string;
    tone: 'neutral' | 'good' | 'warn' | 'bad';
  }>;
  /** Investment vs return — two paired range bars. */
  investmentVsReturn: {
    investmentLow: number;
    investmentHigh: number;
    valueLow: number;
    valueHigh: number;
  };
  /** The blocker strip — open critic blockers, plainly. */
  blockers: Array<{ label: string; detail: string }>;
  /** The single ask that gates the decision. */
  nextAsk: string;
  /** Honesty notes raised while deriving the kernel inputs. */
  derivationNotes: string[];
}

// --- §2 Decision timeline ---------------------------------------------------

export interface MoveDossierTimelineSection {
  anatomy: MoveDossierSectionAnatomy;
  /** The phase states, ordered Discover → Mobilize. */
  phases: Array<{
    phase: string;
    state: string;
    verdict: string;
    tone: 'good' | 'warn' | 'bad' | 'neutral';
    /** What the phase contributes to the assembled case. */
    revision: string;
  }>;
}

// --- §3 Economics -----------------------------------------------------------

export interface MoveDossierEconomicsSection {
  anatomy: MoveDossierSectionAnatomy;
  /** Investment waterfall steps — workstream-lane cost. */
  waterfall: Array<{ label: string; amount: number }>;
  /** Three-scenario net-return range — conservative / base / upside. */
  scenarios: Array<{ label: string; value: number; tone: 'base' | 'low' | 'high' }>;
  /** Tornado bars — sensitivity drivers. */
  tornado: Array<{ label: string; swing: number; isProxy: boolean }>;
  investmentLow: number;
  investmentPoint: number;
  investmentHigh: number;
  netValueLow: number;
  netValuePoint: number;
  netValueHigh: number;
  /** Payback, plainly. */
  paybackText: string;
  paybackBlocked: boolean;
  /** What breaks the case. */
  whatBreaksTheCase: string;
}

// --- §4 Roadmap and Tower handoff -------------------------------------------

export interface MoveDossierRoadmapSection {
  anatomy: MoveDossierSectionAnatomy;
  /** The costed workstreams. */
  workstreams: Array<{
    label: string;
    base: number;
    headcount: number;
    durationMonths: number;
    agentSplitPct: number;
  }>;
  /** The Tower measurement handoff metrics. */
  towerHandoff: Array<{
    metric: string;
    baseline: string;
    readinessNote: string;
    isSeedGap: boolean;
  }>;
  wiredCount: number;
  unwiredCount: number;
  aiBuildCost: number;
  businessChangeCost: number;
  aiOpsCost: number;
  aiOps: MoveDossierAiOpsSummary | null;
  buildVsChangeNote: string;
}

export interface MoveDossierAiOpsSummary {
  threeYearTotal: number;
  fiveYearTotal: number;
  costPerCallUsd: number;
  costPerDecisionUsd: number | null;
  decisionUnit: string | null;
  pricingTierShockWarning: string | null;
  modelTierDriftWarning: string | null;
}

// --- §5 Evidence and gaps ---------------------------------------------------

export interface MoveDossierEvidenceSection {
  anatomy: MoveDossierSectionAnatomy;
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

// --- §6 The assembled book --------------------------------------------------

/** One sibling board-grade artifact deck, projected with a `?moveId=` link. */
export interface MoveDossierArtifactCard {
  id: string;
  label: string;
  phase: string;
  blurb: string;
  /** The route that opens the HTML deck — carries `?moveId=<id>`. */
  htmlHref: string;
}

export interface MoveDossierAssembledBookSection {
  anatomy: MoveDossierSectionAnatomy;
  /** Every sibling generic board-grade deck for this Move — the book. */
  artifacts: MoveDossierArtifactCard[];
}

// --- §7 Recommendation ------------------------------------------------------

export interface MoveDossierRecommendationSection {
  anatomy: MoveDossierSectionAnatomy;
  verdictHeadline: string;
  verdictDetail: string;
  killTriggers: string[];
  /** The conditions that gate moving the verdict to FUND. */
  conditions: string[];
}

// ===========================================================================
// Builder.
// ===========================================================================

/** The deliverable artifact label for the Master Move Dossier. */
const ARTIFACT_LABEL = 'Master Move Dossier';

/**
 * The seven sibling generic board-grade decks the key-driven registry serves
 * for any Move with a resolvable function. The Master Dossier — the eighth
 * deck — links to every one of them. Kept here as the dossier's own read of
 * the registry's generic set so the assembled-book section stays in sync; the
 * `route` is the board-grade route, `?moveId=` is appended by the builder.
 */
const SIBLING_DECKS: ReadonlyArray<{
  id: string;
  label: string;
  phase: string;
  route: string;
  blurb: string;
}> = [
  {
    id: 'discover-brief',
    label: 'Discover Brief',
    phase: 'Discover',
    route: '/api/v1/moves/board-grade-discover-brief',
    blurb:
      'The diagnosed problem, the recorded baseline, the framed opportunity ' +
      'and the go/no-go verdict — kernel-derived for this Move.',
  },
  {
    id: 'charter-skeleton',
    label: 'Charter Business-Case Skeleton',
    phase: 'Charter',
    route: '/api/v1/moves/board-grade-charter-skeleton',
    blurb:
      'The shaping verdict, the falsifiable value hypothesis, the early ' +
      'cost/effort range and the evidence asks before funding.',
  },
  {
    id: 'costed-business-case',
    label: 'Costed Business-Case Pack',
    phase: 'Design & Plan',
    route: '/api/v1/moves/board-grade-business-case',
    blurb:
      'The curated Function-Pack outline, the value forecast, the costed ' +
      'investment range and the kernel verdict.',
  },
  {
    id: 'solution-architecture',
    label: 'Solution Architecture Pack',
    phase: 'Design & Plan',
    route: '/api/v1/moves/board-grade-solution-architecture',
    blurb:
      'The target-state design, the curated reference solution patterns, the ' +
      'AI use-case archetypes and the control posture.',
  },
  {
    id: 'estimate-model',
    label: 'Estimate & Financial Model',
    phase: 'Design & Plan',
    route: '/api/v1/moves/board-grade-estimate-model',
    blurb:
      'The workstream cost build-up, the role-mix lanes, the rate card, the ' +
      'value forecast and the staged cash-flow shape — labelled planning ' +
      'estimates, never a quote.',
  },
  {
    id: 'mobilize-packet',
    label: 'Mobilize & Go-Decision Packet',
    phase: 'Mobilize',
    route: '/api/v1/moves/board-grade-mobilize-packet',
    blurb:
      'The curated mobilization outline, the readiness gates, the Tower ' +
      'handoff and the kernel’s real go-decision verdict.',
  },
  {
    id: 'cfo-pack',
    label: 'CFO Pack',
    phase: 'Design & Plan',
    route: '/api/v1/moves/board-grade-cfo-pack',
    blurb:
      'A financial challenge: the funding ask, the downside, the do-not-fund ' +
      'holdbacks, what Tower will measure and the evidence/gap audit.',
  },
];

/**
 * Build the generic Move Master Move Dossier view-model.
 *
 * Runs `buildMoveBusinessCase(move)`. When the Move binds a curated pack and
 * the kernel produces a real skeleton, projects the bound dossier — assembling
 * the executive answer, decision timeline, economics, roadmap, evidence and
 * the linked sibling-deck book. When the Move is unbound, returns the honest
 * `MoveDossierUnboundResult` — never a fabricated deck.
 *
 * `moveId` is the Move's id — carried so every sibling-deck link can append
 * `?moveId=<id>` and open that Move's kernel-derived chapter.
 *
 * Deterministic — same Move + `moveId` + `generatedOn` → same result.
 */
export function buildMoveMasterDossier(
  move: MoveBusinessCaseInput,
  moveIdOrGeneratedOn: string,
  generatedOnArg?: string,
): MoveMasterDossierResult {
  // Signature harmonisation (P2-2): the other 7 board-grade renderers take
  // `(move, generatedOn)`. The Master Dossier still accepts the legacy
  // 3-arg form for back-compat, but the modern call is `(move, generatedOn)`
  // — `moveId` is read from the Move itself (`move.id` / `move_id`).
  const usingLegacyShape = typeof generatedOnArg === 'string';
  const moveId = usingLegacyShape
    ? moveIdOrGeneratedOn
    : (move.id ?? move.move_id ?? move.moveId ?? 'unknown-move');
  const generatedOn = usingLegacyShape
    ? (generatedOnArg as string)
    : moveIdOrGeneratedOn;

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
  const verdict = skeleton.recommendation;

  const executiveAnswer = buildExecutiveAnswer(
    skeleton,
    generatedOn,
    monetisationBlocked,
    result.derivationNotes,
  );
  const decisionTimeline = buildDecisionTimeline(
    skeleton,
    generatedOn,
    monetisationBlocked,
  );
  const economics = buildEconomics(skeleton, generatedOn, monetisationBlocked);
  const roadmapTower = buildRoadmapTower(skeleton, generatedOn);
  const evidenceAndGaps = buildEvidence(skeleton, binding, generatedOn);
  const assembledBook = buildAssembledBook(moveId, generatedOn, functionLabel);
  const recommendation = buildRecommendation(
    skeleton,
    generatedOn,
    monetisationBlocked,
  );

  const sections: MoveDossierSections = {
    executiveAnswer,
    decisionTimeline,
    economics,
    roadmapTower,
    evidenceAndGaps,
    assembledBook,
    recommendation,
  };

  const ordered: MoveDossierSectionAnatomy[] = [
    executiveAnswer.anatomy,
    decisionTimeline.anatomy,
    economics.anatomy,
    roadmapTower.anatomy,
    evidenceAndGaps.anatomy,
    assembledBook.anatomy,
    recommendation.anatomy,
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
    moveId,
    artifactLabel: ARTIFACT_LABEL,
    functionLabel,
    generatedOn,
    verdict,
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
}

// ---------------------------------------------------------------------------
// Section builders.
// ---------------------------------------------------------------------------

function buildExecutiveAnswer(
  skeleton: BusinessCaseSkeleton,
  generatedOn: string,
  monetisationBlocked: boolean,
  derivationNotes: string[],
): MoveDossierExecutiveSection {
  const verdict = skeleton.recommendation;
  const seedGapLabels = skeleton.baseline.seedGaps.map((g) => g.label);
  const blockers: MoveDossierExecutiveSection['blockers'] =
    skeleton.critic.blockers.map((b) => ({
      label: `Critic blocker — ${b.code}`,
      detail: b.message,
    }));

  return {
    anatomy: {
      page: 1,
      id: 'executive-answer',
      navLabel: 'Executive answer',
      takeaway: verdictHeadlineText(verdict, monetisationBlocked),
      decisionRole:
        'Read the kernel verdict and the headline economics before any ' +
        'funding decision for the whole Move.',
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
        'The verdict is the kernel’s real recommendation for the assembled ' +
        'Move — it is read, not negotiated.',
      owner: 'Move sponsor (to be confirmed with the tenant)',
      nextGate: 'The next phase gate for this Move — a conditional decision',
    },
    verdictHeadline: verdictChipText(verdict),
    verdictDetail: skeleton.recommendationRationale,
    tiles: [
      {
        label: 'Move verdict',
        value: verdict.toUpperCase(),
        sub:
          verdict === 'fund'
            ? 'Approve funding'
            : verdict === 'kill'
              ? 'Stop the Move'
              : 'Shape, do not yet fund',
        tone: verdict === 'fund' ? 'good' : verdict === 'kill' ? 'bad' : 'warn',
      },
      {
        label: 'Investment',
        value: `${compact(skeleton.economics.investment.low)}–${compact(
          skeleton.economics.investment.high,
        )}`,
        sub: `Base ${compact(skeleton.economics.investment.point)} · planning range`,
        tone: 'neutral',
      },
      {
        label: 'Net value (3-yr)',
        value: `${compact(skeleton.valueRange.low)}–${compact(
          skeleton.valueRange.high,
        )}`,
        sub: monetisationBlocked
          ? 'Proxy ceiling — not a verified return'
          : 'Post-haircut planning range',
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
            ? 'Monetisation seed gap'
            : 'Base case',
        tone: skeleton.economics.paybackMonths === null ? 'bad' : 'good',
      },
      {
        label: 'Open blockers',
        value: String(skeleton.critic.blockers.length),
        sub: `${skeleton.baseline.seedGaps.length} seed gaps`,
        tone: skeleton.critic.blockers.length > 0 ? 'warn' : 'good',
      },
    ],
    investmentVsReturn: {
      investmentLow: skeleton.economics.investment.low,
      investmentHigh: skeleton.economics.investment.high,
      valueLow: skeleton.valueRange.low,
      valueHigh: skeleton.valueRange.high,
    },
    blockers,
    nextAsk: nextAskText(verdict, monetisationBlocked),
    derivationNotes,
  };
}

function buildDecisionTimeline(
  skeleton: BusinessCaseSkeleton,
  generatedOn: string,
  monetisationBlocked: boolean,
): MoveDossierTimelineSection {
  const verdict = skeleton.recommendation;
  const designVerdict =
    verdict === 'fund'
      ? 'Fund'
      : verdict === 'kill'
        ? 'Do not fund'
        : 'Shape — not yet fundable';
  const designTone: 'good' | 'warn' | 'bad' =
    verdict === 'fund' ? 'good' : verdict === 'kill' ? 'bad' : 'warn';

  return {
    anatomy: {
      page: 2,
      id: 'decision-timeline',
      navLabel: 'Decision timeline',
      takeaway:
        'The assembled case is sequenced through the curated phase outline — ' +
        'each phase narrows the scope and hardens the same evidence asks ' +
        'rather than papering over them.',
      decisionRole:
        'Show how the case is sequenced from Discover through Mobilize.',
      evidence: {
        sources: [
          'Moves Expert Kernel — phase-gated business-case compiler',
          'The bound Domain Function Pack — curated phase outline',
        ],
        asOf: generatedOn,
        confidence: monetisationBlocked ? 'low' : 'medium',
        gaps: skeleton.baseline.seedGaps.map((g) => g.label),
      },
      implication:
        'A reviewer can trust the verdict because the same seed gaps are ' +
        'named consistently from Discover through Mobilize.',
      owner: 'Move sponsor (to be confirmed with the tenant)',
      nextGate: 'The funding gate inherits this sequencing unchanged',
    },
    phases: [
      {
        phase: 'Discover',
        state: 'Framed',
        verdict: 'Problem framed',
        tone: 'neutral',
        revision:
          'The problem is framed against the curated Function-Pack pain ' +
          'themes; the recorded baseline and the named seed gaps are set.',
      },
      {
        phase: 'Charter',
        state: 'Shaped',
        verdict: 'Value hypothesis set',
        tone: 'neutral',
        revision:
          'The falsifiable value hypothesis is set against the curated value ' +
          'benchmarks; the seed-gapped metrics are carried as owned proxies.',
      },
      {
        phase: 'Design & Plan',
        state: 'Costed',
        verdict: designVerdict,
        tone: designTone,
        revision:
          `Eight workstreams costed, three-scenario sensitivity run; the ` +
          `kernel verdict is ${verdict.toUpperCase()} — ` +
          (monetisationBlocked
            ? 'payback is blocked while the unit economics are a seed gap.'
            : 'the case clears the critic at the base scenario.'),
      },
      {
        phase: 'Mobilize',
        state: monetisationBlocked ? 'Gated' : 'Ready',
        verdict: monetisationBlocked
          ? 'Gated on the seed gaps'
          : 'Ready to mobilize',
        tone: monetisationBlocked ? 'bad' : 'good',
        revision:
          'The Tower measurement handoff is designed; ' +
          (monetisationBlocked
            ? 'the Move cannot mobilize until the seed-gapped metrics close.'
            : 'every committed metric is wired to a recorded baseline.'),
      },
    ],
  };
}

function buildEconomics(
  skeleton: BusinessCaseSkeleton,
  generatedOn: string,
  monetisationBlocked: boolean,
): MoveDossierEconomicsSection {
  const ws = skeleton.effort.workstreams;
  const wsCost = (id: string): number =>
    ws.find((w) => w.id === id)?.baseCost ?? 0;
  const waterfall = [
    {
      label: 'AI build + foundational',
      amount: wsCost('ai_build') + wsCost('foundational'),
    },
    {
      label: 'Integration + data',
      amount: wsCost('integration') + wsCost('data'),
    },
    { label: 'Data governance', amount: wsCost('data_governance') },
    {
      label: 'Change + adoption',
      amount: wsCost('process_redesign') + wsCost('change_adoption'),
    },
    { label: 'Run (year 1)', amount: wsCost('run') },
  ].filter((s) => s.amount > 0);

  const s = skeleton.sensitivity;

  return {
    anatomy: {
      page: 3,
      id: 'economics',
      navLabel: 'Economics',
      takeaway: monetisationBlocked
        ? 'The bet does not yet pay back under challenge — and the dossier is ' +
          'honest about why: the value rests on a seed-gap proxy, so no ' +
          'payback line is drawn.'
        : 'The bet pays back under challenge; the case is shown as a range, ' +
          'never a single optimistic point.',
      decisionRole:
        'Show whether the bet pays back under CFO-grade challenge.',
      evidence: {
        sources: [
          'Moves Expert Kernel — effort estimator + value forecast',
          'Moves Expert Kernel — three-scenario sensitivity',
        ],
        asOf: generatedOn,
        confidence: monetisationBlocked ? 'blocked' : 'medium',
        gaps: monetisationBlocked
          ? ['Monetisation blocker — the return is unverifiable until closed']
          : skeleton.baseline.seedGaps.map((g) => g.label),
      },
      implication: monetisationBlocked
        ? 'The CFO funds the conservative case; payback stays withheld until ' +
          'the seed-gapped metrics close.'
        : 'The CFO funds the conservative case — a defensible planning range.',
      owner: 'CFO · Move sponsor (to be confirmed with the tenant)',
      nextGate: 'The funding gate — value re-modelled on measured economics',
    },
    waterfall,
    scenarios: [
      { label: 'Conservative', value: s.conservative.point, tone: 'low' },
      { label: 'Base', value: s.base.point, tone: 'base' },
      { label: 'Upside', value: s.upside.point, tone: 'high' },
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
    investmentLow: skeleton.economics.investment.low,
    investmentPoint: skeleton.economics.investment.point,
    investmentHigh: skeleton.economics.investment.high,
    netValueLow: skeleton.valueRange.low,
    netValuePoint: skeleton.valueRange.point,
    netValueHigh: skeleton.valueRange.high,
    paybackText:
      skeleton.economics.paybackMonths === null
        ? 'Not claimable — the unit economics are a declared seed gap, so a ' +
          'payback month would be fabricated.'
        : `${skeleton.economics.paybackMonths} months at the base case.`,
    paybackBlocked: skeleton.economics.paybackMonths === null,
    whatBreaksTheCase: s.whatBreaksTheCase,
  };
}

function buildRoadmapTower(
  skeleton: BusinessCaseSkeleton,
  generatedOn: string,
): MoveDossierRoadmapSection {
  const wired = skeleton.towerHandoff.filter((t) => t.baselineValue !== null);
  const unwired = skeleton.towerHandoff.filter(
    (t) => t.baselineValue === null,
  );

  return {
    anatomy: {
      page: 4,
      id: 'roadmap-tower',
      navLabel: 'Roadmap and Tower handoff',
      takeaway:
        `The execution path is decomposed into eight costed workstreams, and ` +
        `${wired.length} of ${skeleton.towerHandoff.length} committed value ` +
        'metrics are wired to a recorded baseline — the rest are honest seed ' +
        'gaps, not dropped.',
      decisionRole:
        'Show the execution path and how the Move’s value will be proven.',
      evidence: {
        sources: [
          'Moves Expert Kernel — effort estimator (eight workstreams)',
          'Moves Expert Kernel — Tower measurement handoff',
        ],
        asOf: generatedOn,
        confidence: unwired.length === 0 ? 'medium' : 'low',
        gaps: unwired.map(
          (t) => `${t.metricLabel} — Tower cannot verify until captured`,
        ),
      },
      implication:
        'Every workstream is costed and every metric is either wired or an ' +
        'honestly-declared seed gap — nothing on the path is unaccounted for.',
      owner: 'Move sponsor (to be confirmed with the tenant) · Tower',
      nextGate: 'Tower handoff — forecast-to-actual once the Move is live',
    },
    workstreams: skeleton.effort.workstreams.map((w) => ({
      label: w.label,
      base: w.baseCost,
      headcount: w.totalHeadcount,
      durationMonths: w.durationMonths,
      agentSplitPct: Math.round(w.agentSplit * 100),
    })),
    towerHandoff: skeleton.towerHandoff.map((t) => ({
      metric: t.metricLabel,
      baseline:
        t.baselineValue === null
          ? 'Not recorded — seed gap'
          : `${t.baselineValue} ${t.unit}`,
      readinessNote: t.readinessNote,
      isSeedGap: t.baselineValue === null,
    })),
    wiredCount: wired.length,
    unwiredCount: unwired.length,
    aiBuildCost: skeleton.effort.buildVsChange.aiBuildCost,
    businessChangeCost: skeleton.effort.buildVsChange.businessChangeCost,
    aiOpsCost: skeleton.effort.buildVsChange.aiOpsCost,
    aiOps: skeleton.aiOpsCost
      ? {
          threeYearTotal: skeleton.aiOpsCost.threeYearTotal,
          fiveYearTotal: skeleton.aiOpsCost.fiveYearTotal,
          costPerCallUsd: skeleton.aiOpsCost.unitEconomic.costPerCallUsd,
          costPerDecisionUsd:
            skeleton.aiOpsCost.unitEconomic.costPerDecisionUsd ?? null,
          decisionUnit:
            skeleton.aiOpsCost.unitEconomic.decisionUnit ?? null,
          pricingTierShockWarning:
            skeleton.aiOpsCost.pricingTierShockWarning,
          modelTierDriftWarning: skeleton.aiOpsCost.modelTierDriftWarning,
        }
      : null,
    buildVsChangeNote: skeleton.effort.buildVsChange.note,
  };
}

function buildEvidence(
  skeleton: BusinessCaseSkeleton,
  binding: FunctionPackBinding,
  generatedOn: string,
): MoveDossierEvidenceSection {
  const recorded = skeleton.baseline.recordedMetrics;
  const seedGaps = skeleton.baseline.seedGaps;
  const total = recorded.length + seedGaps.length;
  const coveragePct =
    total > 0 ? Math.round((recorded.length / total) * 100) : 0;

  // The matrix reuses the binding's precise seed gaps so each gap names what
  // the metric is and where it is sourced.
  const seedGapByKey = new Map(binding.seedGaps.map((g) => [g.metricKey, g]));

  const matrix: Array<{ label: string; recorded: boolean; detail: string }> = [
    ...recorded.map((m) => ({
      label: m.label,
      recorded: true,
      detail: `${m.value} ${m.unit} · ${m.source}`,
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
      page: 5,
      id: 'evidence-and-gaps',
      navLabel: 'Evidence and gaps',
      takeaway:
        `The assembled case is auditable end to end — baseline coverage is ` +
        `${coveragePct}%, with ${recorded.length} metrics recorded and ` +
        `${seedGaps.length} declared seed gaps. None is invented.`,
      decisionRole:
        'Make the trust behind the assembled case explicit and auditable.',
      evidence: {
        sources: [
          'The Move’s recorded baseline metrics',
          'The bound Function Pack — expected operating metrics',
        ],
        asOf: generatedOn,
        confidence: coveragePct >= 60 ? 'medium' : 'low',
        gaps: seedGaps.map((g) => g.label),
      },
      implication:
        'The dossier is auditable end to end; the seed gaps are the declared ' +
        'limits of what the case can claim today.',
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
      value: m.value === null ? '—' : `${m.value} ${m.unit}`,
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

function buildAssembledBook(
  moveId: string,
  generatedOn: string,
  functionLabel: string,
): MoveDossierAssembledBookSection {
  const q = `?moveId=${encodeURIComponent(moveId)}`;
  return {
    anatomy: {
      page: 6,
      id: 'assembled-book',
      navLabel: 'The assembled book',
      takeaway:
        `This dossier is the assembled book — and ${SIBLING_DECKS.length} ` +
        'other kernel-derived board-grade decks are its chapters, each linked ' +
        'below for THIS Move.',
      decisionRole:
        'Open any chapter deck — every other board-grade artifact for this Move.',
      evidence: {
        sources: [
          'Board-artifacts registry — the Move’s generic artifact set',
          `Domain Function Pack — ${functionLabel} curated deliverables`,
        ],
        asOf: generatedOn,
        confidence: 'high',
        gaps: [],
      },
      implication:
        'A reviewer can open any chapter deck from here; each link carries ' +
        'this Move’s id, so it renders this Move’s kernel-derived chapter — ' +
        'never the Apex reference.',
      owner: 'Move sponsor (to be confirmed with the tenant)',
      nextGate: 'Each chapter deck is read against the same kernel verdict',
    },
    artifacts: SIBLING_DECKS.map((d) => ({
      id: d.id,
      label: d.label,
      phase: d.phase,
      blurb: d.blurb,
      htmlHref: `${d.route}${q}`,
    })),
  };
}

function buildRecommendation(
  skeleton: BusinessCaseSkeleton,
  generatedOn: string,
  monetisationBlocked: boolean,
): MoveDossierRecommendationSection {
  const verdict = skeleton.recommendation;
  const conditions: string[] = [];
  if (monetisationBlocked) {
    conditions.push(
      'Close the seed-gapped operating metrics and supply the tenant’s own ' +
        'spend base so the value forecast can be stated in hard dollars.',
    );
  }
  for (const blocker of skeleton.critic.blockers.slice(0, 3)) {
    conditions.push(`Clear the critic blocker: ${blocker.message}`);
  }
  for (const gap of skeleton.baseline.seedGaps.slice(0, 3)) {
    conditions.push(
      `Capture "${gap.label}" from its named data source before the funding gate.`,
    );
  }
  if (conditions.length === 0) {
    conditions.push(
      'Replace the planning-grade rate card with a client-specific estimate ' +
        'before any capital commitment.',
    );
  }

  return {
    anatomy: {
      page: 7,
      id: 'recommendation',
      navLabel: 'Recommendation',
      takeaway: verdictHeadlineText(verdict, monetisationBlocked),
      decisionRole:
        'Make the funding decision the kernel’s verdict supports for the ' +
        'whole assembled Move.',
      evidence: {
        sources: [
          'Moves Expert Kernel — recommendation + kill criteria',
          'Moves Expert Kernel — Tower measurement handoff',
        ],
        asOf: generatedOn,
        confidence: monetisationBlocked ? 'blocked' : 'medium',
        gaps: skeleton.baseline.seedGaps.map((g) => g.label),
      },
      implication:
        'The recommendation is the kernel’s real verdict for the assembled ' +
        'Move — followed, not rewritten.',
      owner: 'Move sponsor (to be confirmed with the tenant)',
      nextGate: 'Re-present once the named conditions are cleared',
    },
    verdictHeadline: verdictChipText(verdict),
    verdictDetail: skeleton.recommendationRationale,
    killTriggers: skeleton.killCriteria.map((k) => k.condition),
    conditions,
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
  verdict: MoveDossierVerdict,
  monetisationBlocked: boolean,
): string {
  if (verdict === 'fund') {
    return 'FUND — the assembled case pays back and the downside holds.';
  }
  if (verdict === 'kill') {
    return 'KILL — the Move does not pay back on current evidence.';
  }
  return monetisationBlocked
    ? 'SHAPE — fund the next shaping gate; monetisation is blocked until the ' +
        'seed gaps close, so the full build is not yet fundable.'
    : 'SHAPE — shape the Move to protect the floor before funding the build.';
}

/** A short verdict chip word — the plain verdict, never the word "go". */
function verdictChipText(verdict: MoveDossierVerdict): string {
  if (verdict === 'fund') return 'FUND';
  if (verdict === 'kill') return 'KILL — do not fund';
  return 'SHAPE — fund the next gate, not the full build yet';
}

/** The single ask that gates the decision — derived from the kernel verdict. */
function nextAskText(
  verdict: MoveDossierVerdict,
  monetisationBlocked: boolean,
): string {
  if (verdict === 'fund') {
    return 'Approve the capital for the costed build — the assembled case ' +
      'clears the critic and the downside holds.';
  }
  if (verdict === 'kill') {
    return 'Do not fund this Move — re-present only if the assumptions that ' +
      'break the case can be shown to be wrong.';
  }
  return monetisationBlocked
    ? 'Authorise the shaping work that closes the seed-gapped operating ' +
        'metrics and grounds the value forecast — the conditions that gate a ' +
        'funding decision.'
    : 'Authorise the shaping work that validates the case-moving assumptions ' +
        'and protects the conservative floor before the funding gate.';
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
  const firstClause = statement.split(/[:.—]/)[0]?.trim() ?? '';
  if (firstClause && firstClause.length <= 48) return firstClause;
  if (firstClause) return `${firstClause.slice(0, 45).trimEnd()}…`;
  return key;
}
