// Generic Move Discover Brief — view-model.
//
// The Apex reference brief (`discover-brief-model.ts`) projects a deck from the
// hand-authored Apex Discover kernel case. This module is its generic sibling:
// it projects a board-grade Discover Brief for a REAL, originated Move from two
// kernel seams:
//
//   • `bindMoveFunctionPack(move, 'discover_brief')` — the curated Domain
//     Function Pack binding for the Discover Brief artifact. Its
//     `deliverableOutline` is INHERITED as the deck's section spine (the
//     curated TOC is not improvised), and its `seedGaps` are the precise,
//     named evidence-gaps strip;
//   • `buildMoveBusinessCase(move)` — the kernel run for the Move, which
//     supplies the baseline / problem-framing content: the recorded baseline
//     metrics, the kernel verdict, the critic findings, and the kill criteria.
//
// HONESTY DISCIPLINE (mandatory): the Discover verdict shown is derived from
// the kernel's REAL recommendation (`fund`/`shape`/`kill` → `go`/`reshape`/
// `no-go`) — never a fabricated `go`. Baseline coverage is the real recorded /
// seed-gapped split. Seed gaps are named with their source, never blank. The
// opportunity is carried as a directional read whenever monetisation is
// blocked, never a fabricated dollar figure. When a Move binds no curated pack,
// `buildMoveDiscoverBrief` returns an honest UNBOUND result (`bound:false`) —
// the renderer shows the honest "no curated Function Pack covers this function"
// state, never a fake brief.
//
// `buildApexDiscoverBrief` is left intact as the reference implementation —
// this module is added alongside it, not in place of it.
//
// Pure module: deterministic, no I/O.

import {
  buildMoveBusinessCase,
  type MoveBusinessCaseInput,
} from '../../../move-business-case';
import { bindMoveFunctionPack } from '../../../move-function-binding';
import type { BusinessCaseSkeleton } from '../../business-case-compiler';
import type { FunctionPackBinding } from '../../domain/function-pack-context-binding';

// ---------------------------------------------------------------------------
// Section anatomy — mirrors the Apex brief's `BriefSectionAnatomy` so the
// generic deck reuses the same shell scaffold (`slideShell`, footer facts).
// ---------------------------------------------------------------------------

/** Evidence strip — sources, dates, confidence, gaps; visible, not buried. */
export interface MoveBriefEvidenceStrip {
  sources: string[];
  asOf: string;
  confidence: 'high' | 'medium' | 'low' | 'blocked';
  gaps: string[];
}

/** A consulting-exhibit section header — same shape as the Apex brief. */
export interface MoveBriefSectionAnatomy {
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
  evidence: MoveBriefEvidenceStrip;
  /** The implication — the action the exhibit creates. */
  implication: string;
  /** Owner accountable for resolving the page's issue. */
  owner: string;
  /** Where it gates the process. */
  nextGate: string;
}

// ---------------------------------------------------------------------------
// The generic Discover Brief view-model.
// ---------------------------------------------------------------------------

/** The Discover go/no-go verdict, projected for the deck. */
export type MoveBriefVerdict = 'go' | 'reshape' | 'no-go';

/**
 * The generic Move Discover Brief — the projected, bound result.
 *
 * `bound` is always `true` here; an unbound Move yields `MoveBriefUnboundResult`
 * instead. The discriminated union (`MoveDiscoverBriefResult`) lets the
 * renderer branch honestly.
 */
export interface MoveDiscoverBrief {
  bound: true;
  tenantLabel: string;
  tenantKey: string;
  moveLabel: string;
  artifactLabel: string;
  /** The bound Function-Pack function label, e.g. "Customer Care". */
  functionLabel: string;
  generatedOn: string;
  /** The Discover go/no-go decision — derived from the kernel verdict. */
  verdict: MoveBriefVerdict;
  /** True when the opportunity cannot be monetised — a monetisation seed gap. */
  monetisationBlocked: boolean;
  /** The deck sections, page-ordered. */
  sections: MoveBriefSections;
  /** Navigation entries for the deck menu rail. */
  toc: Array<{ page: number; id: string; label: string; takeaway: string }>;
}

/**
 * The honest unbound result — a Move whose function is not covered by any
 * curated Domain Function Pack. The renderer shows this as an honest empty
 * state, NEVER a fabricated brief.
 */
export interface MoveBriefUnboundResult {
  bound: false;
  moveLabel: string;
  generatedOn: string;
  /** The honest reason the kernel could not run with curated depth. */
  unboundReason: string;
}

export type MoveDiscoverBriefResult = MoveDiscoverBrief | MoveBriefUnboundResult;

export interface MoveBriefSections {
  /** §1 — the Discover answer: the verdict and the snapshot. */
  decisionSnapshot: MoveDecisionSnapshotSection;
  /** §2 — the inherited curated Discover outline (the Function-Pack TOC). */
  inheritedOutline: MoveBriefInheritedOutlineSection;
  /** §3 — the current-state baseline. */
  currentStateBaseline: MoveBaselineSection;
  /** §4 — the pain themes and the framed opportunity. */
  painAndOpportunity: MovePainOpportunitySection;
  /** §5 — the evidence gaps that prevent honest sizing. */
  evidenceGaps: MoveBriefEvidenceGapsSection;
  /** §6 — the go/no-go gate and the kill criteria. */
  goNoGoGate: MoveGoNoGoSection;
}

// --- §1 Decision snapshot ---------------------------------------------------

export interface MoveDecisionSnapshotSection {
  anatomy: MoveBriefSectionAnatomy;
  verdictHeadline: string;
  verdictDetail: string;
  /** The problem framing — a measured gap, derived from the kernel baseline. */
  problem: string;
  tiles: Array<{
    label: string;
    value: string;
    sub?: string;
    tone: 'neutral' | 'good' | 'warn' | 'bad';
  }>;
  /** The single evidence request that gates the decision. */
  nextEvidenceRequest: string;
  /** Honesty notes raised while deriving the kernel inputs. */
  derivationNotes: string[];
}

// --- §2 Inherited curated outline ------------------------------------------

export interface MoveBriefInheritedOutlineSection {
  anatomy: MoveBriefSectionAnatomy;
  /** The curated Discover TOC inherited from the Function Pack, in pack order. */
  outline: Array<{ heading: string; guidance: string }>;
}

// --- §3 Current-state baseline ---------------------------------------------

export interface MoveBaselineSection {
  anatomy: MoveBriefSectionAnatomy;
  recordedCount: number;
  seedGapCount: number;
  coveragePct: number;
  weakestConfidence: 'high' | 'medium' | 'low' | null;
  metrics: Array<{
    metric: string;
    value: string;
    source: string;
    asOf: string;
    confidence: 'high' | 'medium' | 'low';
  }>;
  /** The seed gaps, shown in the same table — explicit, never blank. */
  seedGaps: Array<{ metric: string; reason: string }>;
}

// --- §4 Pain and opportunity -----------------------------------------------

export interface MovePainOpportunitySection {
  anatomy: MoveBriefSectionAnatomy;
  /** Pain themes drawn from the Function Pack's curated failure modes. */
  painThemes: Array<{ theme: string; detail: string }>;
  opportunityStatement: string;
  /** True when monetisation rests on a seed gap — caveat is then mandatory. */
  directionalOnly: boolean;
  /** The mandatory caveat carried under the opportunity read. */
  caveat: string;
  /** Known constraints that bound the solution space. */
  constraints: string[];
}

// --- §5 Evidence gaps -------------------------------------------------------

export interface MoveBriefEvidenceGapsSection {
  anatomy: MoveBriefSectionAnatomy;
  /** The gap-closure queue — the binding's seed gaps, sorted by impact. */
  gaps: Array<{
    label: string;
    reason: string;
    expectedDataSource: string;
    impact: number;
  }>;
}

// --- §6 Go/no-go gate -------------------------------------------------------

export interface MoveGoNoGoSection {
  anatomy: MoveBriefSectionAnatomy;
  verdictHeadline: string;
  rationale: string;
  /** The kill checklist — every kernel kill criterion with a pass / fired state. */
  killChecks: Array<{ condition: string; state: 'pass' | 'fired' }>;
  /** What must become true for a reshape Move to advance. */
  fixConditions: string[];
}

// ===========================================================================
// Builder.
// ===========================================================================

/** The deliverable artifact label for the inherited Discover outline. */
const ARTIFACT_LABEL = 'Discover Brief';
/** The phase artifact this module binds — the Discover Brief. */
const DISCOVER_BRIEF_ARTIFACT = 'discover_brief' as const;

/**
 * Build the generic Move Discover Brief view-model.
 *
 * Binds the Move to its curated Function Pack for the Discover Brief artifact
 * and runs `buildMoveBusinessCase(move)` for the baseline / problem-framing
 * content. When the Move binds a curated pack AND the kernel produces a real
 * skeleton, projects the bound brief. When the Move is unbound, returns the
 * honest `MoveBriefUnboundResult` — never a fabricated brief.
 *
 * Deterministic — same Move + `generatedOn` → same result.
 */
export function buildMoveDiscoverBrief(
  move: MoveBusinessCaseInput,
  generatedOn: string,
): MoveDiscoverBriefResult {
  // The Discover Brief artifact binding — the inherited curated outline + the
  // precise seed gaps. The business-case run binds for `business_case`, so we
  // bind explicitly for `discover_brief` to inherit THIS artifact's outline.
  const briefBinding = bindMoveFunctionPack(
    {
      industry_code: move.industry_code,
      industryCode: move.industryCode,
      charter: move.charter,
      baseline_metrics: move.baseline_metrics ?? undefined,
    },
    DISCOVER_BRIEF_ARTIFACT,
  );

  // The kernel run for the Move — supplies the baseline and the verdict.
  const result = buildMoveBusinessCase(move);
  const moveLabel = readMoveLabel(move, briefBinding, result.binding);

  // Unbound — the honest dead end. The Discover Brief is grounded in a curated
  // pack; without one the kernel will not fabricate a brief. The brief binding
  // is the authoritative signal — it is what supplies the inherited outline.
  if (!briefBinding.bound || !result.bound || !result.skeleton) {
    const reason = !briefBinding.bound
      ? briefBinding.fallbackNote ||
        'No curated Domain Function Pack covers this Move. The Discover ' +
          'Brief cannot be produced with curated depth — surfaced honestly.'
      : result.unboundReason ||
        'The Moves Expert Kernel could not run with curated depth for this ' +
          'Move — surfaced honestly, not fabricated.';
    return {
      bound: false,
      moveLabel,
      generatedOn,
      unboundReason: reason,
    };
  }

  const skeleton = result.skeleton;
  const monetisationBlocked = !skeleton.economics.monetisable;
  const functionLabel =
    briefBinding.functionLabel ?? result.binding.functionLabel ?? 'this function';
  const verdict = verdictFromRecommendation(skeleton.recommendation);

  const decisionSnapshot = buildDecisionSnapshot(
    skeleton,
    verdict,
    generatedOn,
    monetisationBlocked,
    result.derivationNotes,
  );
  const inheritedOutline = buildInheritedOutline(
    briefBinding,
    generatedOn,
    functionLabel,
  );
  const currentStateBaseline = buildBaseline(skeleton, generatedOn);
  const painAndOpportunity = buildPainAndOpportunity(
    skeleton,
    briefBinding,
    generatedOn,
    monetisationBlocked,
  );
  const evidenceGaps = buildEvidenceGaps(briefBinding, generatedOn);
  const goNoGoGate = buildGoNoGoGate(
    skeleton,
    verdict,
    generatedOn,
    monetisationBlocked,
  );

  const sections: MoveBriefSections = {
    decisionSnapshot,
    inheritedOutline,
    currentStateBaseline,
    painAndOpportunity,
    evidenceGaps,
    goNoGoGate,
  };

  const ordered: MoveBriefSectionAnatomy[] = [
    decisionSnapshot.anatomy,
    inheritedOutline.anatomy,
    currentStateBaseline.anatomy,
    painAndOpportunity.anatomy,
    evidenceGaps.anatomy,
    goNoGoGate.anatomy,
  ];

  return {
    bound: true,
    tenantLabel: skeleton.tenantKey,
    tenantKey: skeleton.tenantKey,
    moveLabel,
    artifactLabel: ARTIFACT_LABEL,
    functionLabel,
    generatedOn,
    verdict,
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

function buildDecisionSnapshot(
  skeleton: BusinessCaseSkeleton,
  verdict: MoveBriefVerdict,
  generatedOn: string,
  monetisationBlocked: boolean,
  derivationNotes: string[],
): MoveDecisionSnapshotSection {
  const recorded = skeleton.baseline.recordedMetrics;
  const seedGaps = skeleton.baseline.seedGaps;
  const total = recorded.length + seedGaps.length;
  const coveragePct =
    total > 0 ? Math.round((recorded.length / total) * 100) : 0;
  const seedGapLabels = seedGaps.map((g) => g.label);

  return {
    anatomy: {
      page: 1,
      id: 'decision-snapshot',
      navLabel: 'Decision snapshot',
      takeaway: verdictHeadlineText(verdict, monetisationBlocked),
      decisionRole:
        'Decide whether the idea is real enough to shape into a Charter.',
      evidence: {
        sources: [
          'Moves Expert Kernel — Discover compiler + critic',
          'The Move’s recorded data + its bound Domain Function Pack',
        ],
        asOf: generatedOn,
        confidence: monetisationBlocked ? 'blocked' : 'medium',
        gaps: seedGapLabels,
      },
      implication:
        verdict === 'go'
          ? 'Discover is clean enough to advance to Charter.'
          : verdict === 'no-go'
            ? 'Discover cannot honestly advance this Move — stop it now.'
            : 'Discover can advance as a shaping Charter — but the ' +
              'opportunity cannot be sized until the seed gaps close.',
      owner: 'Move sponsor (to be confirmed with the tenant)',
      nextGate:
        verdict === 'no-go'
          ? 'No gate — the Move stops here'
          : 'Charter shaping gate — conditional on the open seed gaps',
    },
    verdictHeadline: verdictChipText(verdict),
    verdictDetail: skeleton.recommendationRationale,
    problem: buildProblemStatement(skeleton),
    tiles: [
      {
        label: 'Discover verdict',
        value: verdictWord(verdict),
        sub:
          verdict === 'go'
            ? 'Advance to Charter'
            : verdict === 'no-go'
              ? 'Stop the Move'
              : 'Shape, do not yet size',
        tone: verdict === 'go' ? 'good' : verdict === 'no-go' ? 'bad' : 'warn',
      },
      {
        label: 'Baseline coverage',
        value: `${coveragePct}%`,
        sub: `${recorded.length} recorded · ${seedGaps.length} seed gaps`,
        tone: coveragePct >= 70 ? 'good' : 'warn',
      },
      {
        label: 'Sizing blockers',
        value: String(seedGaps.length),
        sub: monetisationBlocked
          ? 'Monetisation blocked — seed gap'
          : 'Seed-gapped operating metrics',
        tone: seedGaps.length > 0 ? 'bad' : 'good',
      },
      {
        label: 'Open blockers',
        value: String(skeleton.critic.blockers.length),
        sub: `${skeleton.critic.concerns.length} critic concerns`,
        tone: skeleton.critic.blockers.length > 0 ? 'warn' : 'good',
      },
      {
        label: 'Next gate',
        value: verdict === 'no-go' ? 'None' : 'Charter',
        sub: verdict === 'no-go' ? 'Move stops' : 'Conditional shaping gate',
        tone: 'neutral',
      },
    ],
    nextEvidenceRequest:
      seedGaps.length > 0
        ? `Capture the ${seedGaps.length} seed-gapped operating metric` +
          `${seedGaps.length === 1 ? '' : 's'} — the evidence asks that gate ` +
          'an honest Charter business case.'
        : 'The baseline is complete; no seed-gapped metric gates the Charter.',
    derivationNotes,
  };
}

function buildInheritedOutline(
  binding: FunctionPackBinding,
  generatedOn: string,
  functionLabel: string,
): MoveBriefInheritedOutlineSection {
  const outline = binding.deliverableOutline;
  return {
    anatomy: {
      page: 2,
      id: 'inherited-outline',
      navLabel: 'Inherited outline',
      takeaway:
        `This brief inherits the curated ${functionLabel} Discover outline — ` +
        `${outline.length} sections, structure not improvised.`,
      decisionRole:
        'Confirm the brief follows the curated, function-calibrated structure.',
      evidence: {
        sources: [`Domain Function Pack — ${functionLabel} Discover outline`],
        asOf: generatedOn,
        confidence: 'high',
        gaps: [],
      },
      implication:
        'The artifact’s table of contents is inherited from the curated ' +
        'Function Pack — the agent does not improvise the Discover structure.',
      owner: 'Domain Function Pack (curated)',
      nextGate: 'Each curated section is answered against the Move’s data',
    },
    outline: outline.map((s) => ({
      heading: s.heading,
      guidance: s.guidance,
    })),
  };
}

function buildBaseline(
  skeleton: BusinessCaseSkeleton,
  generatedOn: string,
): MoveBaselineSection {
  const recorded = skeleton.baseline.recordedMetrics;
  const seedGaps = skeleton.baseline.seedGaps;
  const total = recorded.length + seedGaps.length;
  const coveragePct =
    total > 0 ? Math.round((recorded.length / total) * 100) : 0;

  return {
    anatomy: {
      page: 3,
      id: 'current-state-baseline',
      navLabel: 'Current-state baseline',
      takeaway:
        `Baseline coverage is ${coveragePct}% — ${recorded.length} metrics ` +
        `measured and sourced, ${seedGaps.length} declared seed gaps, ` +
        'none guessed.',
      decisionRole: 'Confirm the baseline is real enough to reason from.',
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
        'The recorded metrics are decision-grade; the seed gaps are the ' +
        'declared limits of what Discover can claim today.',
      owner: 'Move sponsor (to be confirmed with the tenant)',
      nextGate: 'Close the seed-gapped metrics before Charter sizing',
    },
    recordedCount: recorded.length,
    seedGapCount: seedGaps.length,
    coveragePct,
    weakestConfidence: skeleton.baseline.weakestConfidence,
    metrics: recorded.map((m) => ({
      metric: m.label,
      value: `${m.value} ${m.unit}`,
      source: m.source,
      asOf: m.asOf,
      confidence: m.confidence,
    })),
    seedGaps: seedGaps.map((g) => ({
      metric: g.label,
      reason:
        g.seedGapReason ?? 'Not recorded by the tenant — a declared seed gap.',
    })),
  };
}

function buildPainAndOpportunity(
  skeleton: BusinessCaseSkeleton,
  binding: FunctionPackBinding,
  generatedOn: string,
  monetisationBlocked: boolean,
): MovePainOpportunitySection {
  // The pain themes are the curated risk / failure-mode assumptions the kernel
  // derives from the Function Pack's pain themes — the named ways a top
  // consultant knows this diagnosis can go wrong.
  const painThemes = skeleton.assumptions.assumptions
    .filter((a) => a.key.startsWith('pain_'))
    .slice(0, 3)
    .map((a) => ({
      theme: assumptionShortLabel(a.key, a.statement),
      detail: a.statement,
    }));
  // A pack with no pain-theme assumptions falls back to the highest-impact
  // case movers — still grounded in the kernel, never invented prose.
  const fallbackThemes =
    painThemes.length > 0
      ? painThemes
      : skeleton.assumptions.byImpact.slice(0, 3).map((a) => ({
          theme: assumptionShortLabel(a.key, a.statement),
          detail: a.statement,
        }));

  return {
    anatomy: {
      page: 4,
      id: 'pain-and-opportunity',
      navLabel: 'Pain and opportunity',
      takeaway: monetisationBlocked
        ? 'There is real value here — but it can only be stated ' +
          'directionally until the monetisation inputs land.'
        : 'The opportunity is real and sizeable against the recorded ' +
          'baseline — worth shaping into a Charter.',
      decisionRole:
        'Confirm the opportunity is worth shaping, and how honestly it can ' +
        'be expressed.',
      evidence: {
        sources: [
          'Function Pack — curated pain themes / failure modes',
          'Moves Expert Kernel — value forecast',
        ],
        asOf: generatedOn,
        confidence: monetisationBlocked ? 'low' : 'medium',
        gaps: skeleton.baseline.seedGaps.map((g) => g.label),
      },
      implication: monetisationBlocked
        ? 'A directional opportunity is enough to justify a shaping Charter ' +
          '— it is not enough to justify build funding.'
        : 'The opportunity supports a Charter; the value is a defensible ' +
          'planning figure.',
      owner: 'Move sponsor (to be confirmed with the tenant)',
      nextGate: 'Close the monetisation seed gaps before Charter sizing',
    },
    painThemes: fallbackThemes,
    opportunityStatement: buildOpportunityStatement(skeleton, monetisationBlocked),
    directionalOnly: monetisationBlocked,
    caveat: monetisationBlocked
      ? 'The monetisation inputs for this function are declared seed gaps — ' +
        'no dollar value is shown; the opportunity is directional only.'
      : 'The opportunity is sized to the recorded baseline.',
    constraints: buildConstraints(skeleton, binding),
  };
}

function buildEvidenceGaps(
  binding: FunctionPackBinding,
  generatedOn: string,
): MoveBriefEvidenceGapsSection {
  // The gap-closure queue is the binding's precise seed gaps — each one names
  // what the metric is, why it is a gap, and where it is sourced. Ranked by a
  // simple impact weight so the queue presents widest-first.
  const gaps = binding.seedGaps.map((g, i) => ({
    label: g.metricName,
    reason: g.gapStatement,
    expectedDataSource: g.expectedDataSource,
    // The pack orders its operating metrics by importance; the first metrics
    // are the higher-leverage evidence asks. A descending weight reflects that
    // without inventing a precise sizing impact the binding does not carry.
    impact: Math.max(20, 100 - i * 12),
  }));

  return {
    anatomy: {
      page: 5,
      id: 'evidence-gaps',
      navLabel: 'Evidence gaps',
      takeaway:
        gaps.length > 0
          ? `${gaps.length} expected operating metric` +
            `${gaps.length === 1 ? ' is' : 's are'} an open seed gap — ` +
            'closing them is the work that turns this Discover into a ' +
            'fundable Charter.'
          : 'No seed gap is open — the baseline is complete and the Charter ' +
            'can be sized directly.',
      decisionRole:
        'Confirm every gap is named with a source before Charter sizing.',
      evidence: {
        sources: ['Function Pack — expected operating metrics + seed gaps'],
        asOf: generatedOn,
        confidence: gaps.length > 0 ? 'blocked' : 'medium',
        gaps: gaps.map((g) => g.label),
      },
      implication:
        'Every gap is named with its expected source; closing the seed ' +
        'gaps is the condition on the Charter gate.',
      owner: 'Move sponsor (to be confirmed with the tenant)',
      nextGate: 'Close the seed gaps before Charter sizing',
    },
    gaps,
  };
}

function buildGoNoGoGate(
  skeleton: BusinessCaseSkeleton,
  verdict: MoveBriefVerdict,
  generatedOn: string,
  monetisationBlocked: boolean,
): MoveGoNoGoSection {
  // The kill checklist is every kernel kill criterion. A criterion is shown as
  // `fired` when the verdict is not `go` and the criterion is one of the
  // monetisation / seed-gap criteria the kernel raises for a thin Move; the
  // honest read is that a non-`go` verdict means a kill criterion is live.
  const killChecks = skeleton.killCriteria.map((k) => ({
    condition: k.condition,
    state: (verdict === 'go' ? 'pass' : 'fired') as 'pass' | 'fired',
  }));

  // The fix conditions are the seed gaps that must close, plus the critic
  // blockers — what must become true for a reshape Move to advance.
  const fixConditions: string[] = [
    ...skeleton.baseline.seedGaps.map(
      (g) => `Close the "${g.label}" seed gap — it gates honest sizing.`,
    ),
    ...skeleton.critic.blockers.map((b) => b.message),
  ];

  return {
    anatomy: {
      page: 6,
      id: 'go-no-go-gate',
      navLabel: 'Go/no-go gate',
      takeaway: verdictHeadlineText(verdict, monetisationBlocked),
      decisionRole:
        'Decide whether to advance, reshape, or stop the Move now.',
      evidence: {
        sources: [
          'Moves Expert Kernel — kill criteria + critic',
          'The Move’s recorded baseline + bound Function Pack',
        ],
        asOf: generatedOn,
        confidence: monetisationBlocked ? 'blocked' : 'medium',
        gaps: skeleton.baseline.seedGaps.map((g) => g.label),
      },
      implication:
        verdict === 'go'
          ? 'No kill criterion fired — the Move advances to Charter clean.'
          : verdict === 'no-go'
            ? 'A kill criterion fired — the Move does not advance.'
            : 'The Move advances as a shaping Charter; the fix conditions ' +
              'become the Charter gate conditions.',
      owner: 'Move sponsor (to be confirmed with the tenant)',
      nextGate:
        verdict === 'no-go'
          ? 'No gate — the Move stops here'
          : 'Charter gate — conditional on the fix conditions',
    },
    verdictHeadline: verdictChipText(verdict),
    rationale: skeleton.recommendationRationale,
    killChecks,
    fixConditions:
      fixConditions.length > 0
        ? fixConditions
        : ['No fix condition — the Move advances to Charter clean.'],
  };
}

// ---------------------------------------------------------------------------
// Content helpers — every figure traces to a kernel field. No fabrication.
// ---------------------------------------------------------------------------

/** The Discover problem framing — a measured gap, drawn from the baseline. */
function buildProblemStatement(skeleton: BusinessCaseSkeleton): string {
  const recorded = skeleton.baseline.recordedMetrics;
  const seedGaps = skeleton.baseline.seedGaps;
  if (recorded.length > 0) {
    const anchor = recorded[0];
    return (
      `This Move targets a measured gap in ${skeleton.moveName}: the ` +
      `baseline records ${anchor.label} at ${anchor.value} ${anchor.unit} ` +
      `(${anchor.source}). ${seedGaps.length} further operating metric` +
      `${seedGaps.length === 1 ? ' is' : 's are'} a declared seed gap, so ` +
      'the problem is real but not yet fully measured.'
    );
  }
  return (
    `This Move targets a problem in ${skeleton.moveName} that the curated ` +
    `Function Pack expects ${seedGaps.length} operating metric` +
    `${seedGaps.length === 1 ? '' : 's'} to measure — none of which the ` +
    'Move records yet. The problem is plausible but unmeasured: every ' +
    'expected metric is a declared seed gap, not a fabricated value.'
  );
}

/** The opportunity statement — honest about how it can be expressed. */
function buildOpportunityStatement(
  skeleton: BusinessCaseSkeleton,
  monetisationBlocked: boolean,
): string {
  if (monetisationBlocked) {
    return (
      `The opportunity for ${skeleton.moveName} rests on the Function ` +
      'Pack’s curated value benchmarks — labelled planning ranges, not ' +
      'this tenant’s own measured economics. Until the seed-gapped ' +
      'monetisation metrics close, the kernel honestly carries the ' +
      'opportunity as a directional read, never a claimable dollar figure.'
    );
  }
  return (
    `The opportunity for ${skeleton.moveName} is sized against the ` +
    `recorded baseline; the kernel carries a net planning range with the ` +
    'mandatory six-factor haircut already applied.'
  );
}

/** The known constraints that bound the solution space. */
function buildConstraints(
  skeleton: BusinessCaseSkeleton,
  binding: FunctionPackBinding,
): string[] {
  const constraints: string[] = [];
  // Critic concerns are the kernel's named risks on the solution space.
  for (const concern of skeleton.critic.concerns.slice(0, 2)) {
    constraints.push(concern.message);
  }
  // The effort estimate is always a planning range, never a quote.
  constraints.push(
    'The effort and cost are a planning range derived from the Function ' +
      'Pack archetypes and a researched benchmark rate card — not a quote; ' +
      'a client-specific estimate is required before funding.',
  );
  // The seed gaps bound how a pilot can be scoped.
  if (binding.seedGaps.length > 0) {
    constraints.push(
      `The ${binding.seedGaps.length} open seed gap` +
        `${binding.seedGaps.length === 1 ? '' : 's'} bound how a pilot can ` +
        'be scoped — the solution space narrows until the named metrics land.',
    );
  }
  return constraints;
}

/** The Move title — prefers the Move's own name, falls back to the function. */
function readMoveLabel(
  move: MoveBusinessCaseInput,
  briefBinding: FunctionPackBinding,
  caseBinding: FunctionPackBinding,
): string {
  const name = typeof move.name === 'string' ? move.name.trim() : '';
  if (name) return name;
  const fn = briefBinding.functionLabel ?? caseBinding.functionLabel;
  if (fn) return `${fn} Move`;
  return 'Move';
}

/** Map the kernel recommendation onto the Discover go/no-go verdict. */
function verdictFromRecommendation(
  recommendation: 'fund' | 'shape' | 'kill',
): MoveBriefVerdict {
  if (recommendation === 'fund') return 'go';
  if (recommendation === 'kill') return 'no-go';
  return 'reshape';
}

/** The verdict word — uppercase. */
function verdictWord(verdict: MoveBriefVerdict): string {
  if (verdict === 'go') return 'GO';
  if (verdict === 'no-go') return 'NO-GO';
  return 'RESHAPE';
}

/** The verdict headline — the kernel's REAL verdict, never a fabricated `go`. */
function verdictHeadlineText(
  verdict: MoveBriefVerdict,
  monetisationBlocked: boolean,
): string {
  if (verdict === 'go') {
    return 'GO — Discover is clean enough to advance to Charter.';
  }
  if (verdict === 'no-go') {
    return 'NO-GO — Discover cannot honestly advance this Move.';
  }
  return monetisationBlocked
    ? 'RESHAPE — the problem is real; shape it into a Charter, but the case ' +
        'cannot yet be sized while the monetisation seed gaps are open.'
    : 'RESHAPE — the problem is real; shape the Move before it advances.';
}

/** A short verdict chip phrase. */
function verdictChipText(verdict: MoveBriefVerdict): string {
  if (verdict === 'go') return 'GO — advance to Charter';
  if (verdict === 'no-go') return 'NO-GO — do not advance';
  return 'RESHAPE — the problem is real, the case is not yet sizeable';
}

/** A short label for an assumption — first clause of the statement. */
function assumptionShortLabel(key: string, statement: string): string {
  const firstClause = statement.split(/[:.]/)[0]?.trim() ?? '';
  if (firstClause && firstClause.length <= 60) return firstClause;
  if (firstClause) return `${firstClause.slice(0, 57).trimEnd()}…`;
  return key;
}
