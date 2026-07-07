// Generic Move Solution Architecture Pack — view-model.
//
// The Apex reference pack (`solution-architecture-model.ts`) projects a deck
// from the hand-authored Apex architecture kernel. This module is its generic
// sibling: it projects a board-grade Solution Architecture Pack from a REAL,
// originated Move — pack-bound and kernel-derived — exactly the way
// `move-pack-model.ts` (#2245) is the generic sibling of the Apex Costed
// Business-Case pack.
//
// The three seams it honours:
//   • `bindMoveFunctionPack(move, 'solution_architecture')` returns the curated
//     `deliverableOutline` for the solution-architecture artifact — this drives
//     the deck's SECTION STRUCTURE. The agent does not improvise the structure;
//     it inherits the curated, function-calibrated TOC. The binding's
//     `seedGaps` are rendered into an evidence-gaps strip.
//   • the bound Function Pack's `referenceSolutionPatterns` and
//     `aiUseCaseArchetypes` (the curated architecture/pattern material) supply
//     the target-state architecture and the recurring-pattern content — every
//     pattern, archetype, accountability point and control posture traces to a
//     curated pack field, never invented.
//   • `buildMoveBusinessCase(move)` supplies the kernel context — the verdict,
//     the seed-gap baseline coverage, the kernel critic — so the architecture
//     deck is consistent with the Move's costed business case.
//
// HONESTY DISCIPLINE (mandatory): the architecture is grounded in a curated
// Domain Function Pack. When a Move binds no curated pack — or the pack carries
// no solution-architecture outline — `buildMoveSolutionArchitecture` returns an
// honest UNBOUND result (`bound:false`); the renderer shows the honest "no
// curated Function Pack covers this function" state, NEVER a fabricated
// architecture. The recommended pattern is the curated pack's lowest-autonomy
// human-accountable pattern — never full autonomy when the pack does not
// support it.
//
// `buildApexSolutionArchitecture` is left intact as the reference
// implementation — this module is added alongside it, not in place of it.
//
// Pure module: deterministic, no I/O.

import {
  buildMoveBusinessCase,
  type MoveBusinessCaseInput,
} from '../../../move-business-case';
import { bindMoveFunctionPack } from '../../../move-function-binding';
import { resolveMoveFunctionIdentity } from '../../../function-identity';
import { resolveFunctionPack } from '../../domain/function-pack-registry';
import type {
  AiUseCaseArchetype,
  ControlPosture,
  FunctionPack,
  ReferenceSolutionPattern,
} from '../../domain/function-pack-types';
import type { FunctionPackBinding } from '../../domain/function-pack-context-binding';
import type { BusinessCaseSkeleton } from '../../business-case-compiler';
import { resolveBoardGradeTenantLabel } from './tenant-label-resolver';
import {
  dominantVerdictCause,
  type VerdictExplainerChip,
} from './verdict-explainer';

// ---------------------------------------------------------------------------
// Section anatomy — mirrors the Apex pack's `ArchSectionAnatomy` so the generic
// deck reuses the same shell scaffold.
// ---------------------------------------------------------------------------

/** Evidence strip — sources, dates, confidence, gaps; visible, not buried. */
export interface MoveArchEvidenceStrip {
  sources: string[];
  asOf: string;
  confidence: 'high' | 'medium' | 'low' | 'blocked';
  gaps: string[];
}

/** A consulting-exhibit section header — same shape as the Apex pack. */
export interface MoveArchSectionAnatomy {
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
  evidence: MoveArchEvidenceStrip;
  /** The implication — the action the exhibit creates. */
  implication: string;
  /** Owner accountable for resolving the page's issue. */
  owner: string;
  /** Where it gates the process. */
  nextGate: string;
}

// ---------------------------------------------------------------------------
// The generic Solution Architecture Pack view-model.
// ---------------------------------------------------------------------------

/** The architecture verdict, projected for the deck. */
export type MoveArchVerdict = 'shape' | 'conditional' | 'hold';

/**
 * The generic Move Solution Architecture Pack — the projected, bound result.
 *
 * `bound` is always `true` here; an unbound Move yields
 * `MoveArchUnboundResult` instead. The discriminated union
 * (`MoveSolutionArchitectureResult`) lets the renderer branch honestly.
 */
export interface MoveSolutionArchitecture {
  bound: true;
  tenantLabel: string;
  tenantKey: string;
  moveLabel: string;
  artifactLabel: string;
  /** The bound Function-Pack function label, e.g. "Customer Care". */
  functionLabel: string;
  generatedOn: string;
  /** The architecture gate verdict — derived from the kernel context. */
  verdict: MoveArchVerdict;
  /** A short verdict sub-line. */
  verdictSub: string;
  /**
   * Pilot rehearsal P2-3 — the explainer chip surfaced on the non-`shape`
   * architecture verdict, when the kernel skeleton supplied the cause.
   * `null` when no kernel skeleton is available (the deck still renders the
   * verdict sub-line in that case).
   */
  verdictExplainerChip: VerdictExplainerChip | null;
  /** The named target-state architecture pattern. */
  targetPattern: MoveTargetPattern;
  /** The deck sections, page-ordered. */
  sections: MoveArchSections;
  /** Navigation entries for the deck menu rail. */
  toc: Array<{ page: number; id: string; label: string; takeaway: string }>;
}

/**
 * The honest unbound result — a Move whose function is not covered by any
 * curated Domain Function Pack (or whose pack carries no solution-architecture
 * outline). The renderer shows this as an honest empty state, NEVER a
 * fabricated architecture.
 */
export interface MoveArchUnboundResult {
  bound: false;
  moveLabel: string;
  generatedOn: string;
  /** The honest reason the kernel could not produce a curated architecture. */
  unboundReason: string;
}

export type MoveSolutionArchitectureResult =
  | MoveSolutionArchitecture
  | MoveArchUnboundResult;

/**
 * The named target-state architecture pattern. Named explicitly per blueprint
 * §7 — the selected pattern is the curated pack's lowest-autonomy
 * human-accountable reference pattern; the higher-autonomy patterns are named
 * as the rejected alternatives.
 */
export interface MoveTargetPattern {
  /** The pattern name, from the curated pack's reference solution patterns. */
  name: string;
  /** A one-line statement of what the pattern commits to. */
  oneLine: string;
  /** The patterns considered and rejected, with the reason. */
  rejected: Array<{ name: string; reason: string }>;
}

export interface MoveArchSections {
  /** §1 — the architecture decision: which pattern to shape around. */
  architectureDecision: MoveArchDecisionSection;
  /** §2 — the inherited curated outline (the Function-Pack §7 TOC). */
  inheritedOutline: MoveArchInheritedOutlineSection;
  /** §3 — the target-state architecture from the curated reference patterns. */
  targetArchitecture: MoveArchTargetSection;
  /** §4 — the AI use-case archetypes the architecture must support. */
  archetypes: MoveArchArchetypeSection;
  /** §5 — control posture and the human-accountability points. */
  controlPosture: MoveArchControlSection;
  /** §6 — the evidence baseline and the precise seed gaps. */
  evidenceGaps: MoveArchEvidenceGapsSection;
  /** §7 — open architecture decisions before the production gate. */
  openDecisions: MoveArchOpenDecisionsSection;
}

// --- §1 Architecture decision ----------------------------------------------

export interface MoveArchDecisionSection {
  anatomy: MoveArchSectionAnatomy;
  /** The decision headline — the selected pattern, plain. */
  decisionHeadline: string;
  /** The decision detail — why this pattern. */
  decisionDetail: string;
  /** The candidate patterns as a scorecard — selected + rejected. */
  options: Array<{
    name: string;
    shapeLabel: string;
    /** A 0..100 readiness meter — lower-autonomy patterns score higher. */
    referenceScore: number;
    productionShaped: boolean;
    selected: boolean;
    disposition: string;
  }>;
  /** The decision rationale lines. */
  reasons: string[];
}

// --- §2 Inherited outline ---------------------------------------------------

export interface MoveArchInheritedOutlineSection {
  anatomy: MoveArchSectionAnatomy;
  /** The curated solution-architecture TOC inherited from the Function Pack. */
  outline: Array<{ heading: string; guidance: string }>;
}

// --- §3 Target-state architecture -------------------------------------------

export interface MoveArchTargetSection {
  anatomy: MoveArchSectionAnatomy;
  /** The curated reference solution OPTIONS, projected (the ranked scorecard). */
  patterns: Array<{
    name: string;
    description: string;
    boundary: string;
    humanAccountabilityPoint: string;
    controlPosture: ControlPosture;
    selected: boolean;
  }>;
  /**
   * The adopted platform-foundation components (`dispositionKind: 'foundation'`)
   * — landing zone, ingestion, medallion, governed serving, governance spine.
   * Every entry is adopted; none is ranked or rejected.
   */
  foundation: Array<{
    name: string;
    /** A short boundary statement — what the component owns and does not. */
    boundary: string;
    controlPosture: ControlPosture;
    humanAccountabilityPoint: string;
  }>;
}

// --- §4 AI use-case archetypes ----------------------------------------------

export interface MoveArchArchetypeSection {
  anatomy: MoveArchSectionAnatomy;
  /** Every curated AI use-case archetype, projected. */
  archetypes: Array<{
    name: string;
    valueMechanism: string;
    adoptionProfile: string;
    controlPosture: ControlPosture;
    dataDependencies: string[];
    controlRiskNotes: string[];
  }>;
}

// --- §5 Control posture -----------------------------------------------------

export interface MoveArchControlSection {
  anatomy: MoveArchSectionAnatomy;
  /** The accountability swimlane — agent prepares, human decides. */
  steps: Array<{
    label: string;
    lane: 'agent' | 'human';
    note: string;
    checkpoint: boolean;
  }>;
  /** The named human-accountability points from the curated patterns. */
  accountabilityPoints: Array<{
    pattern: string;
    owner: string;
    posture: ControlPosture;
  }>;
}

// --- §6 Evidence and gaps ---------------------------------------------------

export interface MoveArchEvidenceGapsSection {
  anatomy: MoveArchSectionAnatomy;
  recordedCount: number;
  gapCount: number;
  coveragePct: number;
  weakestConfidence: 'high' | 'medium' | 'low' | null;
  /** Recorded and seed-gap rows for the evidence/gap matrix. */
  matrix: Array<{ label: string; recorded: boolean; detail: string }>;
  /** The precise seed gaps inherited from the binding — never blank. */
  seedGaps: Array<{
    metric: string;
    reason: string;
    expectedDataSource: string;
  }>;
}

// --- §7 Open architecture decisions -----------------------------------------

export interface MoveArchOpenDecisionsSection {
  anatomy: MoveArchSectionAnatomy;
  decisions: Array<{
    decision: string;
    owner: string;
    gate: string;
    impact: number;
    blocksGate: boolean;
  }>;
}

// ===========================================================================
// Builder.
// ===========================================================================

/** The deliverable artifact label for the solution-architecture outline. */
const ARTIFACT_LABEL = 'Solution Architecture Pack';

/**
 * Build the generic Move Solution Architecture Pack view-model.
 *
 * Runs `buildMoveBusinessCase(move)` for the kernel context and binds the Move
 * for the `solution_architecture` artifact via `bindMoveFunctionPack`. When the
 * Move binds a curated pack with a solution-architecture outline, projects the
 * bound deck — the curated outline drives the section spine, the pack's
 * `referenceSolutionPatterns` + `aiUseCaseArchetypes` drive the target-state
 * architecture content. When the Move is unbound, returns the honest
 * `MoveArchUnboundResult` — never a fabricated architecture.
 *
 * Deterministic — same Move + `generatedOn` → same result.
 */
export function buildMoveSolutionArchitecture(
  move: MoveBusinessCaseInput,
  generatedOn: string,
): MoveSolutionArchitectureResult {
  // Bind the Move for the solution-architecture artifact — this gives the
  // curated solution-architecture deliverable outline + the precise seed gaps.
  const binding = bindMoveFunctionPack(
    {
      industry_code: move.industry_code,
      industryCode: move.industryCode,
      function_pack_key: move.function_pack_key,
      functionPackKey: move.functionPackKey,
      charter: move.charter,
      baseline_metrics: move.baseline_metrics ?? undefined,
    },
    'solution_architecture',
  );
  const moveLabel = readMoveLabel(move, binding);

  // Unbound — the honest dead end. No curated solution-architecture outline.
  if (!binding.bound) {
    return {
      bound: false,
      moveLabel,
      generatedOn,
      unboundReason:
        binding.fallbackNote ||
        'No curated Domain Function Pack carries a solution-architecture ' +
          'outline for this Move. The architecture cannot be grounded in ' +
          'curated depth — surfaced honestly, not fabricated.',
    };
  }

  // Resolve the underlying pack — the binding bound, so the identity and pack
  // both resolved; resolve again rather than asserting.
  const identity = resolveMoveFunctionIdentity({
    industryCode: move.industry_code ?? move.industryCode,
    functionPackKey: move.function_pack_key ?? move.functionPackKey,
    charter: move.charter,
  });
  const pack =
    identity &&
    resolveFunctionPack(identity.industryKey, identity.functionKey);
  if (!pack) {
    return {
      bound: false,
      moveLabel,
      generatedOn,
      unboundReason:
        'The Move bound a solution-architecture outline but its curated ' +
        'Function Pack could not be resolved — the architecture cannot be ' +
        'grounded in curated depth.',
    };
  }

  // The kernel context — the costed business case for the same Move. It may be
  // unbound for the business-case artifact even when bound for the
  // architecture artifact; the architecture deck reads it defensively.
  const kernel = buildMoveBusinessCase(move);
  const skeleton = kernel.bound ? kernel.skeleton : null;

  const functionLabel = binding.functionLabel ?? pack.functionLabel;
  const tenantKey = identity?.industryKey ?? 'unknown-tenant';

  const targetPattern = buildTargetPattern(pack);
  const verdict = deriveVerdict(skeleton, binding);
  const verdictSub = verdictSubText(verdict);

  const architectureDecision = buildDecisionSection(
    pack,
    targetPattern,
    generatedOn,
    binding,
  );
  const inheritedOutline = buildInheritedOutline(
    binding,
    generatedOn,
    functionLabel,
  );
  const targetArchitecture = buildTargetSection(pack, generatedOn);
  const archetypes = buildArchetypeSection(pack, generatedOn);
  const controlPosture = buildControlSection(pack, generatedOn);
  const evidenceGaps = buildEvidenceGaps(binding, skeleton, generatedOn);
  const openDecisions = buildOpenDecisionsSection(
    pack,
    skeleton,
    binding,
    generatedOn,
  );

  const sections: MoveArchSections = {
    architectureDecision,
    inheritedOutline,
    targetArchitecture,
    archetypes,
    controlPosture,
    evidenceGaps,
    openDecisions,
  };

  const ordered: MoveArchSectionAnatomy[] = [
    architectureDecision.anatomy,
    inheritedOutline.anatomy,
    targetArchitecture.anatomy,
    archetypes.anatomy,
    controlPosture.anatomy,
    evidenceGaps.anatomy,
    openDecisions.anatomy,
  ];

  const resolvedTenant = resolveBoardGradeTenantLabel(move, tenantKey);
  return {
    bound: true,
    tenantLabel: resolvedTenant.tenantLabel,
    tenantKey: resolvedTenant.tenantKey,
    moveLabel,
    artifactLabel: ARTIFACT_LABEL,
    functionLabel,
    generatedOn,
    verdict,
    verdictSub,
    verdictExplainerChip: skeleton
      ? dominantVerdictCause(skeleton, binding, verdict)
      : null,
    targetPattern,
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
// Target-pattern selection — the lowest-autonomy curated pattern is selected.
// ---------------------------------------------------------------------------

/** A control-posture autonomy rank — lower is more human-accountable. */
const POSTURE_RANK: Record<ControlPosture, number> = {
  'human-in-the-loop': 0,
  'human-approval-required': 1,
  'human-on-the-loop': 2,
  'autonomous-with-audit': 3,
};

/**
 * Partition a pack's reference solution patterns into the competing OPTIONS
 * (ranked; one selected, the rest named as alternatives) and the adopted
 * platform-FOUNDATION components (`dispositionKind: 'foundation'` — landing
 * zone, ingestion, governance — adopted, never ranked or rejected).
 *
 * Foundation patterns are excluded from the option scorecard entirely, so the
 * select-one/reject-rest logic only ever runs over genuinely-competing
 * options. Omitted/`'option'` dispositions stay in the option set
 * (back-compatible: packs with no foundation patterns behave exactly as before).
 */
function partitionPatterns(pack: FunctionPack): {
  optionPatterns: ReferenceSolutionPattern[];
  foundationPatterns: ReferenceSolutionPattern[];
} {
  const optionPatterns: ReferenceSolutionPattern[] = [];
  const foundationPatterns: ReferenceSolutionPattern[] = [];
  for (const p of pack.referenceSolutionPatterns) {
    if (p.dispositionKind === 'foundation') foundationPatterns.push(p);
    else optionPatterns.push(p);
  }
  return { optionPatterns, foundationPatterns };
}

/**
 * Select the target-state pattern from the curated reference solution
 * patterns. The selected pattern is the lowest-autonomy (most
 * human-accountable) curated OPTION — blueprint §7 forbids recommending full
 * autonomy where the evidence does not support it. The higher-autonomy
 * options are named as the rejected alternatives. Foundation patterns are
 * never ranked or rejected here — they are presented as adopted foundation.
 */
function buildTargetPattern(pack: FunctionPack): MoveTargetPattern {
  const { optionPatterns, foundationPatterns } = partitionPatterns(pack);
  // In practice options always exist; if a pack carried only foundation
  // patterns, fall back to the first foundation pattern so we never crash.
  const patterns =
    optionPatterns.length > 0 ? [...optionPatterns] : [...foundationPatterns];
  // Stable sort by autonomy rank — the lowest-autonomy pattern is selected.
  patterns.sort(
    (a, b) => POSTURE_RANK[a.controlPosture] - POSTURE_RANK[b.controlPosture],
  );
  const selected = patterns[0];
  const rejected = patterns
    .slice(1)
    .filter((p) => POSTURE_RANK[p.controlPosture] > POSTURE_RANK[selected.controlPosture])
    .slice(0, 3)
    .map((p) => ({
      name: p.name,
      reason:
        `Higher autonomy (${postureLabel(p.controlPosture)}) — not the ` +
        `target for an originated Move whose curated evidence still favours ` +
        `a more human-accountable pattern. ${truncate(p.boundary, 160)}`,
    }));

  return {
    name: selected.name,
    oneLine:
      `${truncate(selected.description, 220)} Boundary: ` +
      `${truncate(selected.boundary, 160)}`,
    rejected,
  };
}

// ---------------------------------------------------------------------------
// Verdict derivation — read from the kernel context, never fabricated.
// ---------------------------------------------------------------------------

/**
 * Derive the architecture gate verdict from the kernel context. When the
 * kernel ran and produced a skeleton, the verdict tracks the kernel: a `kill`
 * recommendation or open critic blockers make the architecture `hold` /
 * `conditional`. With no kernel skeleton (the business-case artifact unbound)
 * or open seed gaps, the honest verdict is `conditional` — the architecture is
 * shaped but cannot pass the production gate until the evidence lands. A clean
 * `shape` requires the kernel `fund` and no open gaps.
 */
function deriveVerdict(
  skeleton: BusinessCaseSkeleton | null,
  binding: FunctionPackBinding,
): MoveArchVerdict {
  if (skeleton) {
    if (skeleton.recommendation === 'kill') return 'hold';
    if (
      skeleton.critic.blockers.length > 0 ||
      skeleton.baseline.seedGaps.length > 0
    ) {
      return 'conditional';
    }
    return skeleton.recommendation === 'fund' ? 'shape' : 'conditional';
  }
  // No kernel skeleton — the architecture is shaped on the curated pack, but
  // the seed gaps gate the production decision.
  return binding.seedGaps.length > 0 ? 'conditional' : 'shape';
}

function verdictSubText(verdict: MoveArchVerdict): string {
  if (verdict === 'shape') {
    return 'Shape this architecture — the curated pattern holds, no open gate blocker';
  }
  if (verdict === 'hold') {
    return 'Hold — the kernel does not support funding this architecture yet';
  }
  return 'Conditional — shape the architecture; seed gaps gate the production decision';
}

// ---------------------------------------------------------------------------
// Section builders.
// ---------------------------------------------------------------------------

function buildDecisionSection(
  pack: FunctionPack,
  targetPattern: MoveTargetPattern,
  generatedOn: string,
  binding: FunctionPackBinding,
): MoveArchDecisionSection {
  // Score every curated reference OPTION — a lower-autonomy pattern reads as
  // more production-ready for an originated Move (a readable rendering of the
  // posture rank, not an invented score). Foundation patterns are adopted, not
  // scored, so they never appear in the option scorecard.
  const { optionPatterns, foundationPatterns } = partitionPatterns(pack);
  const ranked = [...optionPatterns].sort(
    (a, b) => POSTURE_RANK[a.controlPosture] - POSTURE_RANK[b.controlPosture],
  );
  const selectedName = targetPattern.name;
  const options = ranked.map((p) => {
    const isSelected = p.name === selectedName;
    const score = 100 - POSTURE_RANK[p.controlPosture] * 18;
    return {
      name: p.name,
      shapeLabel: postureLabel(p.controlPosture),
      referenceScore: score,
      productionShaped: POSTURE_RANK[p.controlPosture] <= 1,
      selected: isSelected,
      disposition: isSelected
        ? 'Selected — the responsible target-state pattern: a curated ' +
          'reference pattern with a named human accountable for the decision.'
        : `Considered — a higher-autonomy alternative (${postureLabel(
            p.controlPosture,
          )}); not the target until the curated evidence supports it.`,
    };
  });

  return {
    anatomy: {
      page: 1,
      id: 'architecture-decision',
      navLabel: 'Architecture decision',
      takeaway:
        `Shape the Move around the curated "${targetPattern.name}" pattern — ` +
        'the most human-accountable of the function-calibrated reference ' +
        'patterns, not the highest-autonomy one.',
      decisionRole:
        'Decide which curated target-state architecture pattern to fund and ' +
        'shape the delivery around.',
      evidence: {
        sources: [
          `Domain Function Pack — ${pack.functionLabel} reference solution patterns`,
          'Moves Expert Kernel — solution-architecture binding',
        ],
        asOf: generatedOn,
        confidence: 'high',
        gaps: binding.seedGaps.slice(0, 3).map((g) => g.metricName),
      },
      implication:
        'The architecture is selected from the curated pack; the agent ' +
        'boundary, the human accountability point and the control posture ' +
        'are the design every later section builds on.',
      owner: 'Enterprise Architecture (with the Move sponsor)',
      nextGate: 'Production-readiness gate — conditional on the open seed gaps',
    },
    decisionHeadline: `Target-state pattern — ${targetPattern.name}.`,
    decisionDetail: targetPattern.oneLine,
    options,
    reasons: [
      `The pattern is inherited from the curated ${pack.functionLabel} ` +
        'Domain Function Pack — the section structure and the pattern set ' +
        'are not improvised.',
      'The lowest-autonomy curated option is selected: an originated Move ' +
        'keeps a named human accountable before autonomy expands.',
      `The pack carries ${optionPatterns.length} competing reference ` +
        `options plus ${foundationPatterns.length} adopted platform-foundation ` +
        `components and ${pack.aiUseCaseArchetypes.length} AI use-case ` +
        'archetypes — the architecture is calibrated to this function.',
    ],
  };
}

function buildInheritedOutline(
  binding: FunctionPackBinding,
  generatedOn: string,
  functionLabel: string,
): MoveArchInheritedOutlineSection {
  const outline = binding.deliverableOutline;
  return {
    anatomy: {
      page: 2,
      id: 'inherited-outline',
      navLabel: 'Inherited outline',
      takeaway:
        `This deck inherits the curated ${functionLabel} solution-` +
        `architecture outline — ${outline.length} sections, structure not ` +
        'improvised.',
      decisionRole:
        'Confirm the deck follows the curated, function-calibrated structure.',
      evidence: {
        sources: [
          `Domain Function Pack — ${functionLabel} solution-architecture outline`,
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

function buildTargetSection(
  pack: FunctionPack,
  generatedOn: string,
): MoveArchTargetSection {
  const { optionPatterns, foundationPatterns } = partitionPatterns(pack);
  const ranked = [...optionPatterns].sort(
    (a, b) => POSTURE_RANK[a.controlPosture] - POSTURE_RANK[b.controlPosture],
  );
  const selectedKey = ranked[0]?.key;
  const foundationClause =
    foundationPatterns.length > 0
      ? ` on an adopted platform foundation of ${foundationPatterns.length} ` +
        'components (landing zone, ingestion, governance)'
      : '';
  return {
    anatomy: {
      page: 3,
      id: 'target-architecture',
      navLabel: 'Target architecture',
      takeaway:
        `The target state is built from ${optionPatterns.length} ` +
        'curated reference solution options' +
        foundationClause +
        ' — every pattern names its ' +
        'boundary and a human accountability point.',
      decisionRole:
        'Confirm the target-state architecture the Move funds and shapes ' +
        'the delivery boundary around.',
      evidence: {
        sources: [
          `Domain Function Pack — ${pack.functionLabel} reference solution patterns`,
        ],
        asOf: generatedOn,
        confidence: 'high',
        gaps: [],
      },
      implication:
        'The architecture is grounded in the curated reference patterns; ' +
        'each pattern is a real design with an explicit boundary, not a box.',
      owner: 'Enterprise Architecture',
      nextGate: 'The AI use-case archetypes the architecture must support',
    },
    patterns: ranked.map((p: ReferenceSolutionPattern) => ({
      name: p.name,
      description: p.description,
      boundary: p.boundary,
      humanAccountabilityPoint: p.humanAccountabilityPoint,
      controlPosture: p.controlPosture,
      selected: p.key === selectedKey,
    })),
    foundation: foundationPatterns.map((p: ReferenceSolutionPattern) => ({
      name: p.name,
      boundary: p.boundary,
      controlPosture: p.controlPosture,
      humanAccountabilityPoint: p.humanAccountabilityPoint,
    })),
  };
}

function buildArchetypeSection(
  pack: FunctionPack,
  generatedOn: string,
): MoveArchArchetypeSection {
  return {
    anatomy: {
      page: 4,
      id: 'archetypes',
      navLabel: 'AI archetypes',
      takeaway:
        `The architecture must support ${pack.aiUseCaseArchetypes.length} ` +
        'curated AI use-case archetypes — each with a named value mechanism ' +
        'and control posture.',
      decisionRole:
        'Confirm which AI bets the target architecture is shaped to support.',
      evidence: {
        sources: [
          `Domain Function Pack — ${pack.functionLabel} AI use-case archetypes`,
        ],
        asOf: generatedOn,
        confidence: 'high',
        gaps: [],
      },
      implication:
        'The architecture is shaped to the function’s recurring AI bets — ' +
        'the agent recognises the bet rather than reasoning from zero.',
      owner: 'Enterprise Architecture (with AI Platform)',
      nextGate: 'Control posture — where the human stays in the loop',
    },
    archetypes: pack.aiUseCaseArchetypes.map((a: AiUseCaseArchetype) => ({
      name: a.name,
      valueMechanism: a.valueMechanism,
      adoptionProfile: a.adoptionProfile,
      controlPosture: a.controlPosture,
      dataDependencies: [...a.dataDependencies],
      controlRiskNotes: [...a.controlRiskNotes],
    })),
  };
}

function buildControlSection(
  pack: FunctionPack,
  generatedOn: string,
): MoveArchControlSection {
  // The accountability swimlane is the human-in-the-loop workflow the curated
  // patterns commit to: the agent retrieves, drafts and prepares; a named
  // human reviews and approves (the checkpoint); the agent executes only the
  // approved action; the human owns exceptions and the trace.
  const steps: MoveArchControlSection['steps'] = [
    {
      label: 'Retrieve + ground',
      lane: 'agent',
      note: 'Agent reads broker-scoped curated context; no decision yet.',
      checkpoint: false,
    },
    {
      label: 'Draft the action',
      lane: 'agent',
      note: 'Agent prepares the proposed function action.',
      checkpoint: false,
    },
    {
      label: 'Review + approve',
      lane: 'human',
      note: 'A named human holds the decision right to approve or reject.',
      checkpoint: true,
    },
    {
      label: 'Execute approved action',
      lane: 'agent',
      note: 'Agent executes only the human-approved action.',
      checkpoint: false,
    },
    {
      label: 'Own exceptions + trace',
      lane: 'human',
      note: 'Human owns escalations; every decision is traced.',
      checkpoint: false,
    },
  ];

  return {
    anatomy: {
      page: 5,
      id: 'control-posture',
      navLabel: 'Control posture',
      takeaway:
        'A named human holds the decision right at the checkpoint — the ' +
        'curated patterns keep the agent assisting, never deciding alone.',
      decisionRole:
        'Confirm the control posture and who owns each accountability point.',
      evidence: {
        sources: [
          `Domain Function Pack — ${pack.functionLabel} reference patterns ` +
            '(control posture + accountability point)',
        ],
        asOf: generatedOn,
        confidence: 'high',
        gaps: [],
      },
      implication:
        'Accountability is designed in, not asserted: every curated pattern ' +
        'names the human accountable for its decision.',
      owner: 'AI Governance (with the Move sponsor)',
      nextGate: 'Evidence and gaps — what must be true before production',
    },
    steps,
    accountabilityPoints: pack.referenceSolutionPatterns.map((p) => ({
      pattern: p.name,
      owner: p.humanAccountabilityPoint,
      posture: p.controlPosture,
    })),
  };
}

function buildEvidenceGaps(
  binding: FunctionPackBinding,
  skeleton: BusinessCaseSkeleton | null,
  generatedOn: string,
): MoveArchEvidenceGapsSection {
  // The recorded baseline comes from the kernel skeleton when it ran; the seed
  // gaps come from the binding (the precise, named gaps for the
  // solution-architecture artifact).
  const recorded = skeleton ? skeleton.baseline.recordedMetrics : [];
  const seedGaps = binding.seedGaps;
  const total = recorded.length + seedGaps.length;
  const coveragePct =
    total > 0 ? Math.round((recorded.length / total) * 100) : 0;

  const matrix: Array<{ label: string; recorded: boolean; detail: string }> = [
    ...recorded.map((m) => ({
      label: m.label,
      recorded: true,
      detail: m.source,
    })),
    ...seedGaps.map((g) => ({
      label: g.metricName,
      recorded: false,
      detail: g.gapStatement,
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
      decisionRole:
        'Audit every architecture claim back to a source or a declared gap.',
      evidence: {
        sources: [
          'The Move’s recorded baseline metrics',
          'Function Pack — expected operating metrics',
        ],
        asOf: generatedOn,
        confidence: coveragePct >= 60 ? 'medium' : 'low',
        gaps: seedGaps.map((g) => g.metricName),
      },
      implication:
        'The architecture is auditable; the seed gaps are the declared ' +
        'limits of what the design can claim today.',
      owner: 'Move sponsor (to be confirmed with the tenant)',
      nextGate: 'Close the seed gaps before the production-readiness gate',
    },
    recordedCount: recorded.length,
    gapCount: seedGaps.length,
    coveragePct,
    weakestConfidence: skeleton
      ? skeleton.baseline.weakestConfidence
      : null,
    matrix,
    seedGaps: seedGaps.map((g) => ({
      metric: g.metricName,
      reason: g.gapStatement,
      expectedDataSource: g.expectedDataSource,
    })),
  };
}

function buildOpenDecisionsSection(
  pack: FunctionPack,
  skeleton: BusinessCaseSkeleton | null,
  binding: FunctionPackBinding,
  generatedOn: string,
): MoveArchOpenDecisionsSection {
  const decisions: MoveArchOpenDecisionsSection['decisions'] = [];

  // A kernel critic blocker is a gate-blocking architecture decision.
  if (skeleton) {
    for (const blocker of skeleton.critic.blockers) {
      decisions.push({
        decision: blocker.message,
        owner: 'Enterprise Architecture (with the Move sponsor)',
        gate: 'Production-readiness gate',
        impact: 92,
        blocksGate: true,
      });
    }
  }

  // The seed gaps are open evidence decisions before the architecture is
  // production-ready.
  if (binding.seedGaps.length > 0) {
    decisions.push({
      decision:
        `Close the ${binding.seedGaps.length} seed-gapped operating ` +
        'metric(s) the architecture is reasoned against — when and from ' +
        'which named source.',
      owner: 'CDO / Data Sponsor',
      gate: 'Production-readiness gate',
      impact: 80,
      blocksGate: true,
    });
  }

  // The highest-autonomy curated OPTION is a future autonomy-expansion
  // decision — not blocking, but a real open question. Foundation patterns are
  // adopted, not autonomy-expansion candidates, so they are excluded here.
  const { optionPatterns } = partitionPatterns(pack);
  const highest = [...optionPatterns].sort(
    (a, b) => POSTURE_RANK[b.controlPosture] - POSTURE_RANK[a.controlPosture],
  )[0];
  if (highest) {
    decisions.push({
      decision:
        `When can the architecture expand toward the "${highest.name}" ` +
        `pattern (${postureLabel(highest.controlPosture)}) — what evidence ` +
        'is required before autonomy widens?',
      owner: 'AI Governance',
      gate: 'Autonomy-expansion gate',
      impact: 52,
      blocksGate: false,
    });
  }

  // A pack-grounded review decision — the curated pattern still needs the
  // tenant's own substrate confirmed before the production gate.
  decisions.push({
    decision:
      'Confirm the curated reference pattern against the tenant’s own ' +
      'systems of record and control environment before the production gate.',
    owner: 'Enterprise Architecture',
    gate: 'Production-readiness gate',
    impact: 60,
    blocksGate: false,
  });

  return {
    anatomy: {
      page: 7,
      id: 'open-decisions',
      navLabel: 'Open decisions',
      takeaway:
        `${decisions.length} architecture decisions are still open — ` +
        `${decisions.filter((d) => d.blocksGate).length} block the ` +
        'production gate and must close before any go-live.',
      decisionRole:
        'Confirm every open architecture decision has an owner and a gate.',
      evidence: {
        sources: [
          'Moves Expert Kernel — critic findings + seed-gap baseline',
          `Domain Function Pack — ${pack.functionLabel} reference patterns`,
        ],
        asOf: generatedOn,
        confidence: 'blocked',
        gaps: decisions.filter((d) => d.blocksGate).map((d) => d.decision),
      },
      implication:
        'No open decision is unowned; the gate-blocking decisions are the ' +
        'conditions on the production-readiness gate.',
      owner: 'Enterprise Architecture (decision-queue owner)',
      nextGate: 'Close the gate-blocking decisions before go-live',
    },
    decisions,
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

/** A short, human label for a control posture. */
function postureLabel(posture: ControlPosture): string {
  switch (posture) {
    case 'human-in-the-loop':
      return 'Human-in-the-loop';
    case 'human-approval-required':
      return 'Human-approval-required';
    case 'human-on-the-loop':
      return 'Human-on-the-loop';
    case 'autonomous-with-audit':
      return 'Autonomous-with-audit';
    default: {
      const _exhaustive: never = posture;
      return _exhaustive;
    }
  }
}

/** Truncate text to `max` characters, appending an ellipsis when cut. */
function truncate(text: string, max: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}
