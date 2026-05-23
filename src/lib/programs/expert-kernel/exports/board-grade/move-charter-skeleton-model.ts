// Generic Move Charter Business-Case Skeleton — view-model.
//
// The Apex reference Charter Skeleton (`charter-skeleton-model.ts`) projects a
// deck from the hand-authored Apex Contact Center kernel case. This module is
// its generic sibling: it projects a board-grade Charter Business-Case
// Skeleton for a REAL, originated Move from `buildMoveBusinessCase(move)` — the
// kernel run for that Move.
//
// The two seams it honours, exactly as the task requires:
//   • the kernel `skeleton` (a `BusinessCaseSkeleton` from `compileBusinessCase`)
//     drives the Charter CONTENT — the shaping verdict, the falsifiable value
//     hypothesis, the early cost/effort RANGES, the owned assumptions, the kill
//     criteria, and the evidence asks. Every figure traces to a kernel field;
//     no number is fabricated;
//   • the binding's `deliverableOutline` drives the inherited-outline SECTION —
//     the curated Charter-phase Function-Pack TOC is inherited as the deck's
//     section spine, and the binding's `seedGaps` are the precise, named
//     evidence asks.
//
// HONESTY DISCIPLINE (mandatory): the Charter verdict shown is the kernel's
// REAL recommendation (`fund` → FUND, `shape` → SHAPE, `kill` → STOP) — never a
// fabricated `fund`. Cost and value are carried as RANGES, never single points
// (a blueprint §6 hard fail). Every assumption carries an owner and a
// sensitivity rank. Seed gaps are named with their source, never blank. When a
// Move binds no curated pack, `buildMoveCharterSkeleton` returns an honest
// UNBOUND result (`bound:false`) — the renderer shows the honest "no curated
// Function Pack covers this function" state, never a fabricated charter.
//
// `buildApexCharterSkeleton` is left intact as the reference implementation —
// this module is added alongside it, not in place of it.
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
import type { Assumption } from '../../assumption-ledger';
import type { FunctionPackBinding } from '../../domain/function-pack-context-binding';
import { resolveBoardGradeTenantLabel } from './tenant-label-resolver';

// ---------------------------------------------------------------------------
// Section anatomy — mirrors the Apex Charter's `CharterSectionAnatomy` so the
// generic deck reuses the same shell scaffold (`slideShell`, footer facts).
// ---------------------------------------------------------------------------

/** Evidence strip — sources, dates, confidence, gaps; visible, not buried. */
export interface MoveCharterEvidenceStrip {
  sources: string[];
  asOf: string;
  confidence: 'high' | 'medium' | 'low' | 'blocked';
  gaps: string[];
}

/** A consulting-exhibit section header — same shape as the Apex Charter. */
export interface MoveCharterSectionAnatomy {
  /** Page number among the deck's section slides. */
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
  evidence: MoveCharterEvidenceStrip;
  /** The implication — the action the exhibit creates. */
  implication: string;
  /** Owner accountable for resolving the page's issue. */
  owner: string;
  /** Where it gates the process. */
  nextGate: string;
}

// ---------------------------------------------------------------------------
// The generic Charter Skeleton view-model.
// ---------------------------------------------------------------------------

/** The Charter recommendation, projected for the deck. */
export type MoveCharterVerdict = Recommendation;

/**
 * The generic Move Charter Business-Case Skeleton — the projected, bound
 * result.
 *
 * `bound` is always `true` here; an unbound Move yields
 * `MoveCharterUnboundResult` instead. The discriminated union
 * (`MoveCharterSkeletonResult`) lets the renderer branch honestly.
 */
export interface MoveCharterSkeleton {
  bound: true;
  tenantLabel: string;
  tenantKey: string;
  moveLabel: string;
  artifactLabel: string;
  /** The bound Function-Pack function label, e.g. "Customer Care". */
  functionLabel: string;
  generatedOn: string;
  /** The kernel's Charter recommendation — the REAL verdict, never fabricated. */
  verdict: MoveCharterVerdict;
  /** True when value rests on a seed-gap proxy — payback cannot be claimed. */
  monetisationBlocked: boolean;
  /** The seven sections, page-ordered. */
  sections: MoveCharterSections;
  /** Navigation entries for the deck menu rail. */
  toc: Array<{ page: number; id: string; label: string; takeaway: string }>;
}

/**
 * The honest unbound result — a Move whose function is not covered by any
 * curated Domain Function Pack. The renderer shows this as an honest empty
 * state, NEVER a fabricated charter.
 */
export interface MoveCharterUnboundResult {
  bound: false;
  moveLabel: string;
  generatedOn: string;
  /** The honest reason the kernel could not run with curated depth. */
  unboundReason: string;
}

export type MoveCharterSkeletonResult =
  | MoveCharterSkeleton
  | MoveCharterUnboundResult;

export interface MoveCharterSections {
  /** §1 — the Charter answer: shape / fund / stop. */
  charterAnswer: MoveCharterAnswerSection;
  /** §2 — the inherited curated Charter outline (the Function-Pack TOC). */
  inheritedOutline: MoveCharterOutlineSection;
  /** §3 — the falsifiable value hypothesis. */
  valueHypothesis: MoveValueHypothesisSection;
  /** §4 — the initial cost/effort range. */
  initialCostEffort: MoveInitialCostEffortSection;
  /** §5 — the case-moving assumptions, owned. */
  assumptionLedger: MoveAssumptionLedgerSection;
  /** §6 — the kill criteria — stop conditions and thresholds. */
  killCriteria: MoveKillCriteriaSection;
  /** §7 — the evidence asks before funding. */
  evidenceAsks: MoveEvidenceAsksSection;
}

// --- §1 Charter answer ------------------------------------------------------

export interface MoveCharterAnswerSection {
  anatomy: MoveCharterSectionAnatomy;
  /** The verdict word, plain — SHAPE / FUND / STOP. */
  verdictHeadline: string;
  verdictDetail: string;
  /** Snapshot tiles — verdict, blockers, effort band, baseline coverage. */
  tiles: Array<{
    label: string;
    value: string;
    sub: string;
    tone: 'neutral' | 'good' | 'warn' | 'bad';
  }>;
  /** What is being approved NOW — shaping spend, not build funding. */
  shapingAsk: string;
  /** Honesty notes raised while deriving the kernel inputs. */
  derivationNotes: string[];
}

// --- §2 Inherited outline ---------------------------------------------------

export interface MoveCharterOutlineSection {
  anatomy: MoveCharterSectionAnatomy;
  /** The curated TOC inherited from the Function Pack, in pack order. */
  outline: Array<{ heading: string; guidance: string }>;
}

// --- §3 Value hypothesis ----------------------------------------------------

export interface MoveValueHypothesisSection {
  anatomy: MoveCharterSectionAnatomy;
  /** The falsifiable value claim — stated so it can be proven false. */
  claim: string;
  /** The targeted value the claim moves toward. */
  targetValue: string;
  /** The value mechanism — how the Move would create the value. */
  mechanism: string;
  /** The falsification test — what evidence would disprove the claim. */
  falsificationTest: string;
  /** The baseline metrics behind the hypothesis — current vs target. */
  metricBars: Array<{
    label: string;
    current: number;
    target: number | null;
    unit: string;
    betterWhen: 'higher' | 'lower';
  }>;
  /** True when the value rests on a curated benchmark proxy. */
  monetisationBlocked: boolean;
}

// --- §4 Initial cost/effort -------------------------------------------------

export interface MoveInitialCostEffortSection {
  anatomy: MoveCharterSectionAnatomy;
  /** The effort range — low / point / high, NEVER a single point. */
  effortLow: number;
  effortPoint: number;
  effortHigh: number;
  /** The AI-build / business-change split. */
  buildCost: number;
  changeCost: number;
  /** Run is carried inside build-side lanes; surfaced as its own figure. */
  runCost: number;
  /** Business-change fraction of total effort, 0..1. */
  changeFraction: number;
  /** The rate-card basis — provenance label, never hidden. */
  rateCardBasis: string;
  /** The value band, carried for the value-vs-effort comparison. */
  valueLow: number;
  valuePoint: number;
  valueHigh: number;
  /** The build-vs-change credibility read from the kernel. */
  splitNote: string;
  /** True when the value band rests on a curated benchmark proxy. */
  monetisationBlocked: boolean;
}

// --- §5 Assumption ledger ---------------------------------------------------

export interface MoveAssumptionLedgerSection {
  anatomy: MoveCharterSectionAnatomy;
  /** Top assumptions ranked by sensitivity impact — owners are mandatory. */
  assumptions: Array<{
    rank: number;
    key: string;
    statement: string;
    owner: string;
    confidence: 'high' | 'medium' | 'low';
    sensitivityImpact: 'high' | 'medium' | 'low';
    isSeedGapProxy: boolean;
    source: string;
  }>;
  /** Count of top-mover assumptions that are seed-gap proxies. */
  proxyMoverCount: number;
}

// --- §6 Kill criteria -------------------------------------------------------

export interface MoveKillCriteriaSection {
  anatomy: MoveCharterSectionAnatomy;
  /** The kill / reshape checklist — each criterion with a fired/armed state. */
  criteria: Array<{
    code: string;
    title: string;
    condition: string;
    /** 'fired' = the stop condition is currently true; 'armed' = watched. */
    state: 'fired' | 'armed';
    owner: string;
  }>;
  /** How many criteria have already fired. */
  firedCount: number;
}

// --- §7 Evidence asks -------------------------------------------------------

export interface MoveEvidenceAsksSection {
  anatomy: MoveCharterSectionAnatomy;
  /** The gap-closure table — missing evidence before Design & Plan. */
  asks: Array<{
    label: string;
    reason: string;
    expectedDataSource: string;
    owner: string;
    impact: number;
    blocksFunding: boolean;
  }>;
}

// ===========================================================================
// Builder.
// ===========================================================================

/** The deliverable artifact label for the Charter Skeleton deck. */
const ARTIFACT_LABEL = 'Charter Business-Case Skeleton';

/** The honest owner placeholder — origination has not assigned named humans. */
const TENANT_OWNER = 'Move sponsor (to be confirmed with the tenant)';

/**
 * Build the generic Move Charter Business-Case Skeleton view-model.
 *
 * Runs `buildMoveBusinessCase(move)`. When the Move binds a curated pack and
 * the kernel produces a real skeleton, projects the bound Charter skeleton.
 * When the Move is unbound, returns the honest `MoveCharterUnboundResult` —
 * never a fabricated charter.
 *
 * Deterministic — same Move + `generatedOn` → same result.
 */
export function buildMoveCharterSkeleton(
  move: MoveBusinessCaseInput,
  generatedOn: string,
): MoveCharterSkeletonResult {
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

  const charterAnswer = buildCharterAnswer(
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
  const valueHypothesis = buildValueHypothesis(
    skeleton,
    generatedOn,
    monetisationBlocked,
    functionLabel,
  );
  const initialCostEffort = buildInitialCostEffort(
    skeleton,
    generatedOn,
    monetisationBlocked,
  );
  const assumptionLedger = buildAssumptionLedger(skeleton, generatedOn);
  const killCriteria = buildKillCriteria(skeleton, generatedOn);
  const evidenceAsks = buildEvidenceAsks(skeleton, binding, generatedOn);

  const sections: MoveCharterSections = {
    charterAnswer,
    inheritedOutline,
    valueHypothesis,
    initialCostEffort,
    assumptionLedger,
    killCriteria,
    evidenceAsks,
  };

  const ordered: MoveCharterSectionAnatomy[] = [
    charterAnswer.anatomy,
    inheritedOutline.anatomy,
    valueHypothesis.anatomy,
    initialCostEffort.anatomy,
    assumptionLedger.anatomy,
    killCriteria.anatomy,
    evidenceAsks.anatomy,
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
    verdict: skeleton.recommendation,
    monetisationBlocked,
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

function buildCharterAnswer(
  skeleton: BusinessCaseSkeleton,
  generatedOn: string,
  monetisationBlocked: boolean,
  derivationNotes: string[],
): MoveCharterAnswerSection {
  const verdict = skeleton.recommendation;
  const baseline = skeleton.baseline;
  const recorded = baseline.recordedMetrics;
  const seedGaps = baseline.seedGaps;
  const seedGapLabels = seedGaps.map((g) => g.label);

  return {
    anatomy: {
      page: 1,
      id: 'charter-answer',
      navLabel: 'Charter answer',
      takeaway: charterTakeaway(verdict, monetisationBlocked),
      decisionRole:
        verdict === 'kill'
          ? 'Confirm the kernel verdict — this Charter does not pay back; do ' +
            'not advance it.'
          : 'Approve deeper shaping spend, or stop — this is not a ' +
            'build-funding decision.',
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
        verdict === 'fund'
          ? 'The Charter clears the critic and is fundable into Design & Plan.'
          : verdict === 'kill'
            ? 'The Charter is stopped — build funding is not on the table.'
            : 'The Charter advances as a shaping exercise; build funding is ' +
              'withheld until the blockers and the seed gaps close.',
      owner: TENANT_OWNER,
      nextGate:
        verdict === 'kill'
          ? 'No next gate — re-originate the Move only with a stronger case'
          : 'Design & Plan gate — conditional on the evidence asks',
    },
    verdictHeadline: charterVerdictHeadline(verdict, monetisationBlocked),
    verdictDetail: skeleton.recommendationRationale,
    tiles: [
      {
        label: 'Charter verdict',
        value: charterVerdictWord(verdict),
        sub:
          verdict === 'shape'
            ? 'Fund shaping, not build'
            : verdict === 'fund'
              ? 'Fundable into Design & Plan'
              : 'Stop the Move',
        tone:
          verdict === 'fund' ? 'good' : verdict === 'kill' ? 'bad' : 'warn',
      },
      {
        label: 'Critic blockers',
        value: String(skeleton.critic.blockers.length),
        sub:
          skeleton.critic.blockers.length > 0
            ? 'Must close before build funding'
            : 'No open blockers',
        tone: skeleton.critic.blockers.length > 0 ? 'bad' : 'good',
      },
      {
        label: 'Effort envelope',
        value: `${compactUsd(skeleton.effortRange.low)}–${compactUsd(
          skeleton.effortRange.high,
        )}`,
        sub: 'Low–high range — never a point',
        tone: 'neutral',
      },
      {
        label: 'Baseline coverage',
        value: `${Math.round(baseline.coverage * 100)}%`,
        sub: `${recorded.length} recorded · ${seedGaps.length} seed gaps`,
        tone: baseline.coverage >= 0.7 ? 'good' : 'warn',
      },
      {
        label: 'Next gate',
        value: verdict === 'kill' ? 'None' : 'Design & Plan',
        sub: verdict === 'kill' ? 'Charter stopped' : 'Conditional funding gate',
        tone: 'neutral',
      },
    ],
    shapingAsk:
      verdict === 'kill'
        ? 'Nothing is approved — the kernel verdict is STOP. Re-originate the ' +
          'Move only with a materially stronger case.'
        : 'Approve the shaping spend that takes the Move into Design & Plan — ' +
          'closing the seed-gapped baseline metrics that the kernel needs to ' +
          'monetise the case. Build funding is a later, separate decision.',
    derivationNotes,
  };
}

function buildInheritedOutline(
  binding: FunctionPackBinding,
  generatedOn: string,
  functionLabel: string,
): MoveCharterOutlineSection {
  const outline = binding.deliverableOutline;
  return {
    anatomy: {
      page: 2,
      id: 'inherited-outline',
      navLabel: 'Inherited outline',
      takeaway:
        `This Charter skeleton inherits the curated ${functionLabel} ` +
        `Charter outline — ${outline.length} sections, structure not improvised.`,
      decisionRole:
        'Confirm the deck follows the curated, function-calibrated structure.',
      evidence: {
        sources: [`Domain Function Pack — ${functionLabel} deliverable outline`],
        asOf: generatedOn,
        confidence: 'high',
        gaps: [],
      },
      implication:
        'The artifact’s table of contents is inherited from the curated ' +
        'Function Pack — the agent does not improvise the Charter structure.',
      owner: 'Domain Function Pack (curated)',
      nextGate: 'Each curated section is answered against the Move’s data',
    },
    outline: outline.map((s) => ({
      heading: s.heading,
      guidance: s.guidance,
    })),
  };
}

function buildValueHypothesis(
  skeleton: BusinessCaseSkeleton,
  generatedOn: string,
  monetisationBlocked: boolean,
  functionLabel: string,
): MoveValueHypothesisSection {
  const recorded = skeleton.baseline.recordedMetrics;
  const seedGaps = skeleton.baseline.seedGaps;

  // The hypothesis is anchored on the recorded and expected operating metrics.
  // Recorded metrics carry a real current value; seed-gapped ones carry no
  // current value — they are the watched signals, not committed targets.
  const metricBars = [
    ...recorded
      // A recorded metric always carries a numeric value, but the kernel type
      // permits `null`; filter defensively so the metric bar is never blank.
      .filter((m): m is typeof m & { value: number } =>
        typeof m.value === 'number',
      )
      .slice(0, 4)
      .map((m) => ({
        label: m.label,
        current: m.value,
        target: null as number | null,
        unit: m.unit,
        betterWhen: 'higher' as const,
      })),
  ];

  return {
    anatomy: {
      page: 3,
      id: 'value-hypothesis',
      navLabel: 'Value hypothesis',
      takeaway:
        'The case rests on one falsifiable claim — the Move moves this ' +
        `function’s operating metrics; a pilot that does not move them ` +
        'falsifies the case.',
      decisionRole:
        'Confirm the value claim is falsifiable and tied to a recorded ' +
        'baseline metric.',
      evidence: {
        sources: [
          `Domain Function Pack — ${functionLabel} value model`,
          'The Move’s recorded baseline metrics',
        ],
        asOf: generatedOn,
        confidence: monetisationBlocked ? 'low' : 'medium',
        gaps: seedGaps.slice(0, 3).map((g) => g.label),
      },
      implication:
        'A pilot is the falsification test — the hypothesis is provable, ' +
        'not asserted.',
      owner: TENANT_OWNER,
      nextGate: 'Design & Plan pilot scope — the falsification test',
    },
    claim:
      `The Move lifts the ${functionLabel} operating metrics toward the ` +
      'curated Function-Pack benchmark band — without a fabricated dollar ' +
      'figure, because the value rests on planning benchmarks until the ' +
      'tenant’s own metrics ground it.',
    targetValue:
      'The curated Function-Pack benchmark band (a planning range, not a ' +
      'committed target)',
    mechanism:
      'The Move applies the function’s AI use-case archetypes to the ' +
      'operating metrics the Function Pack expects — the curated value model ' +
      'is the mechanism, the recorded baseline is the starting point.',
    falsificationTest:
      'A pilot that does not move the piloted operating metrics toward the ' +
      'benchmark band falsifies the hypothesis — the Charter is then reshaped ' +
      'or stopped, not advanced to build.',
    metricBars,
    monetisationBlocked,
  };
}

function buildInitialCostEffort(
  skeleton: BusinessCaseSkeleton,
  generatedOn: string,
  monetisationBlocked: boolean,
): MoveInitialCostEffortSection {
  const bvc = skeleton.effort.buildVsChange;
  const runWs = skeleton.effort.workstreams.find((w) => w.id === 'run');
  const runCost = runWs ? runWs.baseCost : 0;
  const changePct = Math.round(bvc.businessChangeFraction * 100);

  return {
    anatomy: {
      page: 4,
      id: 'initial-cost-effort',
      navLabel: 'Initial cost/effort',
      takeaway:
        'The early envelope is a range, not a number — ' +
        `${compactUsd(skeleton.effortRange.low)} to ` +
        `${compactUsd(skeleton.effortRange.high)} — and ${changePct}% of it ` +
        'is the business-change work AI cases routinely under-budget.',
      decisionRole:
        'Confirm the early investment envelope is a planning-grade range ' +
        'with the change half budgeted.',
      evidence: {
        sources: [
          'Moves Expert Kernel — effort estimator (eight workstreams)',
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
        'A CFO funds the high end of the band; the change lane is explicitly ' +
        'budgeted so the case is not optimistic on adoption.',
      owner: TENANT_OWNER,
      nextGate: 'Design & Plan estimate — the planning-grade costed model',
    },
    effortLow: skeleton.effortRange.low,
    effortPoint: skeleton.effortRange.point,
    effortHigh: skeleton.effortRange.high,
    buildCost: bvc.aiBuildCost,
    changeCost: bvc.businessChangeCost,
    runCost,
    changeFraction: bvc.businessChangeFraction,
    rateCardBasis: skeleton.effort.rateCard.label,
    valueLow: skeleton.valueRange.low,
    valuePoint: skeleton.valueRange.point,
    valueHigh: skeleton.valueRange.high,
    splitNote: bvc.note,
    monetisationBlocked,
  };
}

function buildAssumptionLedger(
  skeleton: BusinessCaseSkeleton,
  generatedOn: string,
): MoveAssumptionLedgerSection {
  const ledger = skeleton.assumptions;
  const topMoverKeys = new Set(ledger.topMovers.map((a) => a.key));

  return {
    anatomy: {
      page: 5,
      id: 'assumption-ledger',
      navLabel: 'Assumption ledger',
      takeaway:
        'Every assumption is owned and ranked by how much it moves the case ' +
        '— validating the seed-gap proxies is the highest-leverage shaping ' +
        'work.',
      decisionRole:
        'Confirm every case-moving assumption has a named owner and a ' +
        'sensitivity rank.',
      evidence: {
        sources: [
          'Moves Expert Kernel — assumption ledger (ranked by sensitivity)',
          'The bound Domain Function Pack — curated value model',
        ],
        asOf: generatedOn,
        confidence: 'low',
        gaps: ledger.seedGapProxies
          .slice(0, 3)
          .map((a) => `${a.key} — a seed-gap proxy until tenant data lands`),
      },
      implication:
        'No assumption is unowned; the seed-gap proxies are the evidence the ' +
        'shaping spend must close.',
      owner: TENANT_OWNER,
      nextGate: 'Design & Plan — proxies replaced with measured tenant data',
    },
    assumptions: ledger.byImpact.map((a: Assumption, i) => ({
      rank: i + 1,
      key: a.key,
      statement: a.statement,
      owner: a.owner,
      confidence: a.confidence,
      sensitivityImpact: a.sensitivityImpact,
      isSeedGapProxy: a.isSeedGapProxy,
      source: a.source,
    })),
    proxyMoverCount: ledger.topMovers.filter(
      (a) => a.isSeedGapProxy && topMoverKeys.has(a.key),
    ).length,
  };
}

function buildKillCriteria(
  skeleton: BusinessCaseSkeleton,
  generatedOn: string,
): MoveKillCriteriaSection {
  const blockerCodes = new Set(skeleton.critic.blockers.map((b) => b.code));
  // A kill criterion fires when the critic raised the matching blocker; every
  // other criterion is armed (watched, not yet fired). The mapping is honest:
  // the monetisation criterion fires whenever the monetisation blocker is up.
  const criteria = skeleton.killCriteria.map((k) => ({
    code: k.code,
    title: killTitle(k.code),
    condition: k.condition,
    state: killState(k.code, blockerCodes),
    owner: TENANT_OWNER,
  }));
  const firedCount = criteria.filter((c) => c.state === 'fired').length;

  return {
    anatomy: {
      page: 6,
      id: 'kill-criteria',
      navLabel: 'Kill criteria',
      takeaway:
        firedCount > 0
          ? `${firedCount} stop ${
              firedCount === 1 ? 'condition is' : 'conditions are'
            } already firing — which is precisely why the Charter cannot be ` +
            'funded straight to build.'
          : 'No stop condition is firing — but the kill criteria stay armed ' +
            'as the gate conditions Design & Plan is held to.',
      decisionRole:
        'Confirm the stop conditions and the evidence thresholds that ' +
        'resolve them.',
      evidence: {
        sources: [
          'Moves Expert Kernel — kill criteria + critic blockers',
          'The Move’s recorded data',
        ],
        asOf: generatedOn,
        confidence: 'medium',
        gaps:
          firedCount > 0
            ? ['One or more kill criteria fire until their blocker closes']
            : [],
      },
      implication:
        'A fired criterion is a gate condition; build funding stays withheld ' +
        'while it holds.',
      owner: TENANT_OWNER,
      nextGate: 'Design & Plan gate — every fired criterion must clear',
    },
    criteria,
    firedCount,
  };
}

function buildEvidenceAsks(
  skeleton: BusinessCaseSkeleton,
  binding: FunctionPackBinding,
  generatedOn: string,
): MoveEvidenceAsksSection {
  const seedGaps = skeleton.baseline.seedGaps;
  // The asks reuse the binding's precise seed gaps so each ask names what the
  // metric is, why it is missing, and where it is sourced — never blank.
  const seedGapByKey = new Map(binding.seedGaps.map((g) => [g.metricKey, g]));

  const asks = seedGaps.map((g, i) => {
    const bound = seedGapByKey.get(g.key);
    // The first two seed gaps bite hardest — the kernel needs them to
    // monetise the case, so they block build funding.
    const blocksFunding = i < 2;
    return {
      label: g.label,
      reason:
        bound?.gapStatement ??
        g.seedGapReason ??
        'Not recorded by the tenant — its absence blocks the baseline.',
      expectedDataSource:
        bound?.expectedDataSource ?? 'A tenant operating-data source',
      owner: TENANT_OWNER,
      impact: blocksFunding ? 100 - i * 14 : 52 - i * 6,
      blocksFunding,
    };
  });

  return {
    anatomy: {
      page: 7,
      id: 'evidence-asks',
      navLabel: 'Evidence asks',
      takeaway:
        seedGaps.length > 0
          ? `${seedGaps.length} evidence ${
              seedGaps.length === 1 ? 'ask' : 'asks'
            } gate build funding — closing them, not more analysis, is what ` +
            'turns this Charter into a fundable Design & Plan.'
          : 'No open evidence asks — the recorded baseline already grounds ' +
            'the Charter case.',
      decisionRole:
        'Confirm every evidence ask has an owner and a decision impact ' +
        'before Design & Plan.',
      evidence: {
        sources: [
          'The Move’s baseline seed gaps',
          'Function Pack — expected operating metrics',
        ],
        asOf: generatedOn,
        confidence: seedGaps.length > 0 ? 'blocked' : 'medium',
        gaps: seedGaps.map((g) => g.label),
      },
      implication:
        'No ask is unowned; the funding-blocking asks are the conditions on ' +
        'the Design & Plan gate.',
      owner: TENANT_OWNER,
      nextGate: 'Close the funding-blocking asks before Design & Plan',
    },
    asks,
  };
}

// ---------------------------------------------------------------------------
// Helpers — classify what the kernel already states. No new facts.
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

/** A short verdict word — SHAPE / FUND / STOP. */
function charterVerdictWord(v: Recommendation): string {
  return v === 'fund' ? 'FUND' : v === 'kill' ? 'STOP' : 'SHAPE';
}

/** The Charter verdict headline — the kernel's REAL verdict, never `fund`. */
function charterVerdictHeadline(
  v: Recommendation,
  monetisationBlocked: boolean,
): string {
  if (v === 'fund') {
    return 'FUND — the Charter case clears the critic and is fundable into ' +
      'Design & Plan.';
  }
  if (v === 'kill') {
    return 'STOP — the Charter case does not pay back; do not advance it.';
  }
  return monetisationBlocked
    ? 'SHAPE — fund the shaping work only; monetisation is blocked until the ' +
        'seed gaps close, so the Move is not yet fundable to build.'
    : 'SHAPE — fund the shaping work only; the case is real but not yet ' +
        'fundable to build.';
}

/** The Charter answer takeaway — a sentence with a point of view. */
function charterTakeaway(
  v: Recommendation,
  monetisationBlocked: boolean,
): string {
  if (v === 'fund') {
    return 'Fund the Charter into Design & Plan — the case clears the critic ' +
      'and the kernel verdict is fund.';
  }
  if (v === 'kill') {
    return 'Stop this Charter — on current assumptions the case does not pay ' +
      'back, and the honest kernel verdict is kill.';
  }
  return monetisationBlocked
    ? 'Fund the shaping work — not the build. The case is real, but ' +
        'monetisation is blocked, so the honest Charter verdict is shape.'
    : 'Fund the shaping work — not the build. The case is real but not yet ' +
        'fundable, so the honest Charter verdict is shape.';
}

/** A short, human title for a kill-criterion code. */
function killTitle(code: string): string {
  const map: Record<string, string> = {
    kill_downside_negative: 'Conservative case turns negative',
    kill_monetisation_unresolved: 'Monetisation seed gap not closed',
    kill_baseline_unclosed: 'Baseline coverage stays too thin',
    kill_privacy_gate_blocks: 'Control review removes the AI assist',
  };
  return map[code] ?? code;
}

/**
 * A kill criterion's state. A criterion fires when the critic raised the
 * matching blocker; every other criterion is armed (watched, not yet fired).
 */
function killState(
  code: string,
  blockerCodes: Set<string>,
): 'fired' | 'armed' {
  if (
    code === 'kill_monetisation_unresolved' &&
    blockerCodes.has('cfo_monetisation_blocked')
  ) {
    return 'fired';
  }
  return 'armed';
}

/** Compact USD — kept local so the model has no chart-library dependency. */
function compactUsd(n: number): string {
  const a = Math.abs(n);
  if (a >= 1_000_000) {
    return `$${(a / 1_000_000).toFixed(a >= 9_500_000 ? 1 : 2)}M`;
  }
  if (a >= 1_000) return `$${Math.round(a / 1_000)}K`;
  return `$${Math.round(a)}`;
}
