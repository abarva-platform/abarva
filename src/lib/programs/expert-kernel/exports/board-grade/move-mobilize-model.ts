// Generic Move Mobilize & Go-Decision Packet — view-model.
//
// The Apex reference packet (`mobilize-packet-model.ts`) projects a deck from
// the hand-authored Apex Mobilize case. This module is its generic sibling: it
// projects a board-grade Mobilize & Go-Decision Packet from a REAL, originated
// Move — `buildMoveBusinessCase(move)` (the kernel run) plus
// `bindMoveFunctionPack(move, 'mobilization_plan')` (the curated binding).
//
// The two seams it honours — exactly as the task requires:
//   • the binding's `deliverableOutline` for the `mobilization_plan` artifact
//     drives the SECTION STRUCTURE — the curated Function-Pack mobilization
//     outline is inherited as the deck's section spine, and the binding's
//     `seedGaps` are rendered into the open-actions / gaps strip;
//   • the kernel `skeleton` (a `BusinessCaseSkeleton` from `compileBusinessCase`)
//     drives the GO-DECISION verdict, the kill criteria, the readiness state,
//     the value/effort content and the Tower handoff — every figure traces to
//     a kernel field, no number is fabricated.
//
// HONESTY DISCIPLINE (mandatory): the go-decision is the kernel's REAL verdict,
// never a fabricated `go`. The kernel's business-case recommendation
// (`fund` / `shape` / `kill`) maps deterministically onto the go-decision
// verdict (`go` / `conditional_go` / `no_go`) — a thin Move whose monetisation
// is blocked yields an honest `conditional_go` or `no_go`, never a `go`. When a
// Move binds no curated pack, `buildMoveMobilizePacket` returns an honest
// UNBOUND result (`bound:false`) — the renderer shows the honest "no curated
// Function Pack covers this function" state, not a fabricated packet.
//
// `buildApexMobilizePacket` is left intact as the reference implementation —
// this module is added alongside it, not in place of it.
//
// Pure module: deterministic, no I/O.

import {
  buildMoveBusinessCase,
  type MoveBusinessCaseInput,
} from '../../../move-business-case';
import type { BusinessCaseSkeleton } from '../../business-case-compiler';
import type { FunctionPackBinding } from '../../domain/function-pack-context-binding';

// ---------------------------------------------------------------------------
// The go-decision verdict — the same union the Apex reference packet uses.
// ---------------------------------------------------------------------------

/** The go-decision verdict, as derived from the kernel recommendation. */
export type MoveGoVerdict = 'go' | 'conditional_go' | 'no_go';

// ---------------------------------------------------------------------------
// Section anatomy — mirrors the Apex packet's `MobilizeSectionAnatomy` so the
// generic deck reuses the same shell scaffold (`slideShell`, footer facts).
// ---------------------------------------------------------------------------

/** Evidence strip — sources, dates, confidence, gaps. */
export interface MoveMobilizeEvidenceStrip {
  sources: string[];
  asOf: string;
  confidence: 'high' | 'medium' | 'low' | 'blocked';
  gaps: string[];
}

/** A consulting-exhibit section header — same shape as the Apex packet. */
export interface MoveMobilizeSectionAnatomy {
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
  evidence: MoveMobilizeEvidenceStrip;
  /** The implication — the action the exhibit creates. */
  implication: string;
  /** Owner accountable for resolving the page's issue. */
  owner: string;
  /** Where it gates the process. */
  nextGate: string;
}

// ---------------------------------------------------------------------------
// The generic packet view-model.
// ---------------------------------------------------------------------------

/**
 * The generic Move Mobilize & Go-Decision Packet — the projected, bound result.
 *
 * `bound` is always `true` here; an unbound Move yields `MoveMobilizeUnbound`
 * instead. The discriminated union (`MoveMobilizeResult`) lets the renderer
 * branch honestly.
 */
export interface MoveMobilizePacket {
  bound: true;
  tenantLabel: string;
  tenantKey: string;
  moveLabel: string;
  artifactLabel: string;
  /** The bound Function-Pack function label, e.g. "Customer Care". */
  functionLabel: string;
  generatedOn: string;
  /** The go-decision verdict — derived from the kernel's REAL recommendation. */
  verdict: MoveGoVerdict;
  /** The kernel's plain rationale for the underlying recommendation. */
  verdictRationale: string;
  /** True when the kernel cannot monetise the value. */
  monetisationBlocked: boolean;
  /** The deck sections, page-ordered. */
  sections: MoveMobilizeSections;
  /** Navigation entries for the sticky TOC. */
  toc: Array<{ page: number; id: string; label: string; takeaway: string }>;
}

/**
 * The honest unbound result — a Move whose function is not covered by any
 * curated Domain Function Pack. The renderer shows this as an honest empty
 * state, NEVER a fabricated packet.
 */
export interface MoveMobilizeUnbound {
  bound: false;
  moveLabel: string;
  generatedOn: string;
  /** The honest reason the kernel could not run with curated depth. */
  unboundReason: string;
}

export type MoveMobilizeResult = MoveMobilizePacket | MoveMobilizeUnbound;

export interface MoveMobilizeSections {
  /** §1 — the go-decision: the kernel verdict and readiness at a glance. */
  goDecision: MoveGoDecisionSection;
  /** §2 — the inherited curated mobilization outline (the Function-Pack TOC). */
  inheritedPlan: MoveInheritedPlanSection;
  /** §3 — the value & effort to mobilize. */
  valueEffort: MoveValueEffortSection;
  /** §4 — controls & readiness gates. */
  controlsReadiness: MoveControlsReadinessSection;
  /** §5 — the Tower measurement handoff. */
  towerHandoff: MoveTowerHandoffSection;
  /** §6 — the open action queue and the precise seed gaps. */
  openActions: MoveOpenActionsSection;
}

// --- §1 Go-decision ---------------------------------------------------------

export interface MoveGoDecisionSection {
  anatomy: MoveMobilizeSectionAnatomy;
  verdictHeadline: string;
  verdictDetail: string;
  /** Mobilize readiness — the three Mobilize questions, answered. */
  readiness: { owned: boolean; adoptable: boolean; measurable: boolean };
  /** Headline readiness tiles. */
  tiles: Array<{
    label: string;
    value: string;
    sub: string;
    tone: 'neutral' | 'good' | 'warn' | 'bad';
  }>;
  /** Kill criteria — verbatim from the kernel, never hidden. */
  killCriteria: Array<{ code: string; condition: string }>;
  /** Critic blockers that hold the gate — verbatim, never hidden. */
  blockers: string[];
}

// --- §2 Inherited mobilization plan ----------------------------------------

export interface MoveInheritedPlanSection {
  anatomy: MoveMobilizeSectionAnatomy;
  /** The curated mobilization TOC inherited from the Function Pack, in order. */
  outline: Array<{ heading: string; guidance: string }>;
}

// --- §3 Value & effort to mobilize -----------------------------------------

export interface MoveValueEffortSection {
  anatomy: MoveMobilizeSectionAnatomy;
  investmentRange: { low: number; point: number; high: number };
  valueRange: { low: number; point: number; high: number };
  paybackMonths: number | null;
  /** The earliest mobilization workstreams — the stand-up cost. */
  workstreams: Array<{
    label: string;
    base: number;
    headcount: number;
    durationMonths: number;
  }>;
}

// --- §4 Controls & readiness ------------------------------------------------

export interface MoveControlsReadinessSection {
  anatomy: MoveMobilizeSectionAnatomy;
  /** Readiness rows — ready / partial / blocked. */
  rows: Array<{
    label: string;
    state: 'ready' | 'partial' | 'blocked';
    note: string;
  }>;
}

// --- §5 Tower measurement handoff ------------------------------------------

export interface MoveTowerHandoffSection {
  anatomy: MoveMobilizeSectionAnatomy;
  wiredCount: number;
  unwiredCount: number;
  loopCloses: boolean;
  /** Measurement metrics — wired to a baseline or flagged as a seed gap. */
  metrics: Array<{
    label: string;
    baseline: string;
    wired: boolean;
    readinessNote: string;
  }>;
}

// --- §6 Open action queue ---------------------------------------------------

export interface MoveOpenActionsSection {
  anatomy: MoveMobilizeSectionAnatomy;
  /** Open actions — kill criteria and seed gaps, each with a gate impact. */
  actions: Array<{
    action: string;
    owner: string;
    gateImpact: string;
    blocksGoLive: boolean;
  }>;
}

// ===========================================================================
// Builder.
// ===========================================================================

/** The deliverable artifact label for the inherited mobilization outline. */
const ARTIFACT_LABEL = 'Mobilize & Go-Decision Packet';

/** The honest owner placeholder — origination has not assigned named owners. */
const TENANT_OWNER = 'Move sponsor (to be confirmed with the tenant)';

/**
 * Map the kernel's business-case recommendation onto the go-decision verdict.
 *
 * This is a deterministic, honesty-preserving projection — NOT a re-decision.
 * The kernel already folded its critic findings into the recommendation; the
 * Mobilize verdict simply reads it in go-decision language:
 *   • `fund`  → `go`            — the case pays back and the downside holds;
 *   • `shape` → `conditional_go`— mobilize only once the conditions clear;
 *   • `kill`  → `no_go`         — the Move does not pay back, do not mobilize.
 * It NEVER upgrades the verdict and NEVER fabricates a `go`.
 */
function goVerdictFor(
  recommendation: 'fund' | 'shape' | 'kill',
): MoveGoVerdict {
  if (recommendation === 'fund') return 'go';
  if (recommendation === 'kill') return 'no_go';
  return 'conditional_go';
}

/**
 * Build the generic Move Mobilize & Go-Decision Packet view-model.
 *
 * Runs `buildMoveBusinessCase(move)`. When the Move binds a curated pack and
 * the kernel produces a real skeleton, projects the bound packet. When the
 * Move is unbound, returns the honest `MoveMobilizeUnbound` — never a
 * fabricated packet.
 *
 * Deterministic — same Move + `generatedOn` → same result.
 */
export function buildMoveMobilizePacket(
  move: MoveBusinessCaseInput,
  generatedOn: string,
): MoveMobilizeResult {
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
  const verdict = goVerdictFor(skeleton.recommendation);

  const goDecision = buildGoDecision(skeleton, generatedOn, verdict);
  const inheritedPlan = buildInheritedPlan(binding, generatedOn, functionLabel);
  const valueEffort = buildValueEffort(
    skeleton,
    generatedOn,
    monetisationBlocked,
  );
  const controlsReadiness = buildControlsReadiness(skeleton, generatedOn);
  const towerHandoff = buildTowerHandoff(skeleton, generatedOn);
  const openActions = buildOpenActions(skeleton, binding, generatedOn);

  const sections: MoveMobilizeSections = {
    goDecision,
    inheritedPlan,
    valueEffort,
    controlsReadiness,
    towerHandoff,
    openActions,
  };

  const ordered: MoveMobilizeSectionAnatomy[] = [
    goDecision.anatomy,
    inheritedPlan.anatomy,
    valueEffort.anatomy,
    controlsReadiness.anatomy,
    towerHandoff.anatomy,
    openActions.anatomy,
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
    verdictRationale: skeleton.recommendationRationale,
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

/**
 * Read the three Mobilize readiness questions off the kernel skeleton.
 *
 *   • owned      — there are no critic blockers on accountability/sponsorship;
 *                  the kernel's recommendation is the readable proxy here.
 *   • adoptable  — the kernel recommendation is not `kill` (a killed case is
 *                  not an adoptable Move);
 *   • measurable — at least one Tower-handoff metric is wired to a recorded
 *                  baseline, so the value loop can close.
 *
 * Each answer is read FROM the kernel state — none is asserted.
 */
function readReadiness(skeleton: BusinessCaseSkeleton): {
  owned: boolean;
  adoptable: boolean;
  measurable: boolean;
} {
  const hasBlocker = skeleton.critic.blockers.length > 0;
  const measurable = skeleton.towerHandoff.some(
    (t) => t.baselineValue !== null,
  );
  return {
    owned: !hasBlocker,
    adoptable: skeleton.recommendation !== 'kill',
    measurable,
  };
}

function buildGoDecision(
  skeleton: BusinessCaseSkeleton,
  generatedOn: string,
  verdict: MoveGoVerdict,
): MoveGoDecisionSection {
  const readiness = readReadiness(skeleton);
  const blockers = skeleton.critic.blockers.map((b) => b.message);
  const verdictWord = goVerdictWord(verdict);

  return {
    anatomy: {
      page: 1,
      id: 'go-decision',
      navLabel: 'Go / no-go answer',
      takeaway: goVerdictHeadline(verdict),
      decisionRole:
        'Decide whether to mobilize to execution, mobilize on conditions, ' +
        'or hold.',
      evidence: {
        sources: [
          'Moves Expert Kernel — business-case compiler + critic',
          'The Move’s recorded data + its bound Domain Function Pack',
        ],
        asOf: generatedOn,
        confidence: verdict === 'no_go' ? 'blocked' : 'medium',
        gaps: skeleton.killCriteria.map((k) => k.code),
      },
      implication:
        verdict === 'go'
          ? 'The Move is ready to mobilize — the conditions below are tracked, ' +
            'not gating.'
          : 'The kill criteria and blockers below are the gate to a clean go ' +
            '— they are tracked, not waived.',
      owner: TENANT_OWNER,
      nextGate:
        verdict === 'go'
          ? 'Launch gate — proceed to execution'
          : 'Launch gate — held until the kill criteria are cleared',
    },
    verdictHeadline: goVerdictChip(verdict),
    verdictDetail: skeleton.recommendationRationale,
    readiness,
    tiles: [
      {
        label: 'Go-decision',
        value: verdictWord,
        sub:
          verdict === 'go'
            ? 'Proceed to execution'
            : verdict === 'conditional_go'
              ? 'Proceed on conditions'
              : 'Not ready to mobilize',
        tone:
          verdict === 'go' ? 'good' : verdict === 'no_go' ? 'bad' : 'warn',
      },
      {
        label: 'Owned',
        value: readiness.owned ? 'Yes' : 'No',
        sub: 'No open critic blocker',
        tone: readiness.owned ? 'good' : 'bad',
      },
      {
        label: 'Adoptable',
        value: readiness.adoptable ? 'Yes' : 'No',
        sub: 'The case is not killed',
        tone: readiness.adoptable ? 'good' : 'bad',
      },
      {
        label: 'Measurable',
        value: readiness.measurable ? 'Yes' : 'No',
        sub: 'A metric is wired to a baseline',
        tone: readiness.measurable ? 'good' : 'warn',
      },
      {
        label: 'Kill criteria',
        value: String(skeleton.killCriteria.length),
        sub: `${blockers.length} open blocker${
          blockers.length === 1 ? '' : 's'
        }`,
        tone:
          skeleton.killCriteria.length > 0 || blockers.length > 0
            ? 'warn'
            : 'good',
      },
    ],
    killCriteria: skeleton.killCriteria.map((k) => ({
      code: k.code,
      condition: k.condition,
    })),
    blockers,
  };
}

function buildInheritedPlan(
  binding: FunctionPackBinding,
  generatedOn: string,
  functionLabel: string,
): MoveInheritedPlanSection {
  const outline = binding.deliverableOutline;
  return {
    anatomy: {
      page: 2,
      id: 'inherited-plan',
      navLabel: 'Mobilization plan',
      takeaway:
        `This packet inherits the curated ${functionLabel} mobilization ` +
        `outline — ${outline.length} sections, the plan structure is not ` +
        'improvised.',
      decisionRole:
        'Confirm the mobilization plan follows the curated, ' +
        'function-calibrated structure.',
      evidence: {
        sources: [
          `Domain Function Pack — ${functionLabel} mobilization-plan outline`,
        ],
        asOf: generatedOn,
        confidence: 'high',
        gaps: [],
      },
      implication:
        'The packet’s mobilization structure is inherited from the curated ' +
        'Function Pack — the agent does not improvise the plan.',
      owner: 'Domain Function Pack (curated)',
      nextGate: 'Each curated section is mobilized against the Move’s data',
    },
    outline: outline.map((s) => ({
      heading: s.heading,
      guidance: s.guidance,
    })),
  };
}

function buildValueEffort(
  skeleton: BusinessCaseSkeleton,
  generatedOn: string,
  monetisationBlocked: boolean,
): MoveValueEffortSection {
  // The earliest mobilization workstreams — the foundational and governance
  // lanes that the first stand-up funds. Read off the kernel effort estimate.
  const standUpIds = new Set([
    'foundational',
    'data_governance',
    'data',
    'integration',
  ]);
  const workstreams = skeleton.effort.workstreams
    .filter((w) => standUpIds.has(w.id))
    .map((w) => ({
      label: w.label,
      base: w.baseCost,
      headcount: w.totalHeadcount,
      durationMonths: w.durationMonths,
    }));

  return {
    anatomy: {
      page: 3,
      id: 'value-effort',
      navLabel: 'Value & effort',
      takeaway:
        monetisationBlocked
          ? 'The value to mobilize is a planning range built on curated ' +
            'benchmark proxies — the kernel honestly blocks a claimable ' +
            'dollar payback.'
          : `Net value is ${compact(skeleton.valueRange.point)} against a ` +
            `${compact(skeleton.economics.investment.point)} base investment.`,
      decisionRole:
        'Confirm the economics that justify mobilizing this Move now.',
      evidence: {
        sources: [
          'Moves Expert Kernel — business-case economics',
          'Effort estimator — should-cost role-mix engine',
        ],
        asOf: generatedOn,
        confidence: monetisationBlocked ? 'low' : 'medium',
        gaps: monetisationBlocked
          ? [
              'Value rests on the Function Pack’s curated benchmark ranges — ' +
                'a planning proxy until the tenant’s spend base lands.',
            ]
          : [],
      },
      implication:
        'The economics are planning-grade — the stand-up workstreams are the ' +
        'first money mobilized.',
      owner: TENANT_OWNER,
      nextGate: 'A client-specific estimate before the launch funding gate',
    },
    investmentRange: skeleton.economics.investment,
    valueRange: skeleton.valueRange,
    paybackMonths: skeleton.economics.paybackMonths,
    workstreams,
  };
}

function buildControlsReadiness(
  skeleton: BusinessCaseSkeleton,
  generatedOn: string,
): MoveControlsReadinessSection {
  const hasBlocker = skeleton.critic.blockers.length > 0;
  const measurable = skeleton.towerHandoff.some(
    (t) => t.baselineValue !== null,
  );
  const seedGapCount = skeleton.baseline.seedGaps.length;
  const recordedCount = skeleton.baseline.recordedMetrics.length;
  const total = seedGapCount + recordedCount;
  const coveragePct =
    total > 0 ? Math.round((recordedCount / total) * 100) : 0;

  const rows: MoveControlsReadinessSection['rows'] = [
    {
      label: 'Business-case critic',
      state: hasBlocker ? 'blocked' : 'ready',
      note: hasBlocker
        ? `${skeleton.critic.blockers.length} open critic blocker(s) hold ` +
          'the launch gate.'
        : 'No open critic blocker on the business case.',
    },
    {
      label: 'Value-measurement loop to Tower',
      state: measurable ? 'partial' : 'blocked',
      note: measurable
        ? 'At least one Tower metric is wired to a recorded baseline — the ' +
          'remaining metrics are seed gaps.'
        : 'No Tower metric is wired to a recorded baseline — the value loop ' +
          'cannot close yet.',
    },
    {
      label: 'Baseline coverage',
      state:
        coveragePct >= 60 ? 'ready' : coveragePct > 0 ? 'partial' : 'blocked',
      note:
        `Baseline coverage is ${coveragePct}% — ${recordedCount} recorded, ` +
        `${seedGapCount} declared seed gap(s).`,
    },
    {
      label: 'Monetisation',
      state: skeleton.economics.monetisable ? 'ready' : 'blocked',
      note: skeleton.economics.monetisable
        ? 'The kernel can monetise the value into a claimable payback.'
        : 'Monetisation is blocked — value rests on a curated benchmark proxy.',
    },
    {
      label: 'Operating-model owner',
      state: 'partial',
      note:
        'Origination has not yet assigned a named operating-model owner — ' +
        'the Move sponsor is the placeholder until the tenant confirms one.',
    },
  ];

  return {
    anatomy: {
      page: 4,
      id: 'controls-readiness',
      navLabel: 'Controls & readiness',
      takeaway:
        'The readiness gates below are scored from the kernel state — the ' +
        'blocked gates are exactly what hold the go-decision.',
      decisionRole:
        'See what must be true before launch, and what is not yet.',
      evidence: {
        sources: [
          'Moves Expert Kernel — critic + baseline + Tower handoff',
        ],
        asOf: generatedOn,
        confidence: hasBlocker ? 'blocked' : 'medium',
        gaps: skeleton.baseline.seedGaps.map((g) => g.label),
      },
      implication:
        'Clearing the blocked gates is the work that converts the verdict ' +
        'into a clean go.',
      owner: TENANT_OWNER,
      nextGate: 'Launch readiness review',
    },
    rows,
  };
}

function buildTowerHandoff(
  skeleton: BusinessCaseSkeleton,
  generatedOn: string,
): MoveTowerHandoffSection {
  const metrics = skeleton.towerHandoff.map((t) => {
    const wired = t.baselineValue !== null;
    return {
      label: t.metricLabel,
      baseline: wired
        ? `${t.baselineValue} ${t.unit}`
        : 'SEED GAP — not recorded',
      wired,
      readinessNote: t.readinessNote,
    };
  });
  const wiredCount = metrics.filter((m) => m.wired).length;
  const unwiredCount = metrics.length - wiredCount;
  const loopCloses = metrics.length > 0 && unwiredCount === 0;

  return {
    anatomy: {
      page: 5,
      id: 'tower-handoff',
      navLabel: 'Tower handoff',
      takeaway:
        loopCloses
          ? 'Every committed metric is wired to a recorded baseline — the ' +
            'value loop closes to Tower.'
          : `${wiredCount} of ${metrics.length} metrics are wired to a ` +
            'recorded baseline — the rest are honest seed gaps.',
      decisionRole:
        'Confirm what Tower will measure, and that it ties to a baseline.',
      evidence: {
        sources: ['Moves Expert Kernel — Tower measurement handoff'],
        asOf: generatedOn,
        confidence: loopCloses ? 'medium' : 'blocked',
        gaps: metrics.filter((m) => !m.wired).map((m) => m.label),
      },
      implication:
        loopCloses
          ? 'Tower can verify value movement from go-live.'
          : 'The value loop does not close until the seed-gapped baselines ' +
            'are captured — Tower cannot verify value before then.',
      owner: TENANT_OWNER,
      nextGate: 'Loop closes when every metric is wired',
    },
    wiredCount,
    unwiredCount,
    loopCloses,
    metrics,
  };
}

function buildOpenActions(
  skeleton: BusinessCaseSkeleton,
  binding: FunctionPackBinding,
  generatedOn: string,
): MoveOpenActionsSection {
  // Gate-blocking actions — the kill criteria and the open critic blockers.
  const killActions: MoveOpenActionsSection['actions'] =
    skeleton.killCriteria.map((k) => ({
      action: `Hold against the kill criterion: ${k.condition}`,
      owner: TENANT_OWNER,
      gateImpact:
        `Kill criterion ${k.code} — the launch gate stays held while this ` +
        'condition could be tripped.',
      blocksGoLive: true,
    }));
  const blockerActions: MoveOpenActionsSection['actions'] =
    skeleton.critic.blockers.map((b) => ({
      action: `Resolve the open critic blocker: ${b.message}`,
      owner: TENANT_OWNER,
      gateImpact:
        'A critic blocker holds the launch gate until it is resolved.',
      blocksGoLive: true,
    }));
  // Supporting actions — the precise seed gaps inherited from the binding.
  const gapActions: MoveOpenActionsSection['actions'] = binding.seedGaps.map(
    (g) => ({
      action:
        `Capture "${g.metricName}" — ${g.gapStatement}`,
      owner: `${TENANT_OWNER} · expected source: ${g.expectedDataSource}`,
      gateImpact:
        'A seed gap weakens the baseline — close it before the value loop ' +
        'is locked.',
      blocksGoLive: false,
    }),
  );
  const actions = [...killActions, ...blockerActions, ...gapActions];

  return {
    anatomy: {
      page: 6,
      id: 'open-actions',
      navLabel: 'Open action queue',
      takeaway:
        actions.length === 0
          ? 'No open action gates the launch — the kernel raised no kill ' +
            'criterion, blocker, or seed gap.'
          : 'Every open action — kill criteria, critic blockers, and the ' +
            'precise seed gaps — is named, never blank.',
      decisionRole: 'Confirm every gate blocker is named with its impact.',
      evidence: {
        sources: [
          'Moves Expert Kernel — kill criteria + critic blockers',
          'Domain Function Pack binding — precise seed gaps',
        ],
        asOf: generatedOn,
        confidence: 'medium',
        gaps: [],
      },
      implication:
        'The gate-blocking actions are the critical path to a clean go.',
      owner: TENANT_OWNER,
      nextGate: 'Launch gate — held until the gate-blocking actions close',
    },
    actions,
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

/** The go-decision word — GO / CONDITIONAL GO / NO-GO. */
export function goVerdictWord(verdict: MoveGoVerdict): string {
  if (verdict === 'go') return 'GO';
  if (verdict === 'conditional_go') return 'CONDITIONAL GO';
  return 'NO-GO';
}

/** The go-decision headline — the kernel's REAL verdict, never fabricated. */
function goVerdictHeadline(verdict: MoveGoVerdict): string {
  if (verdict === 'go') {
    return 'GO — the Move is ready to mobilize to execution.';
  }
  if (verdict === 'no_go') {
    return 'NO-GO — the Move does not pay back on current assumptions; do ' +
      'not mobilize.';
  }
  return 'CONDITIONAL GO — mobilize only once the kill criteria and ' +
    'blockers are cleared.';
}

/** A short verdict chip sentence. */
function goVerdictChip(verdict: MoveGoVerdict): string {
  if (verdict === 'go') return 'GO — ready to mobilize';
  if (verdict === 'no_go') return 'NO-GO — do not mobilize';
  return 'CONDITIONAL GO — mobilize on conditions, not yet a clean go';
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
