// Deterministic view-model helpers for the canonical Programs surface.
//
// S9 slice. Pure functions only. No model calls, no network, no Date.now()
// reads. These helpers consume the existing seed types (TenantSeedPlan,
// ProgramSeedPlan, DeliverableSeedPlan) and return shapes the canonical
// index/detail components render. Keep this module narrow: it exists so
// the components stay thin and so the mapping is testable from
// TypeScript without a React harness.

import type { SpecPhaseNumber } from '@/lib/programs/enhancement-spec';
import type {
  DeliverableSeedPlan,
  ProgramSeedPlan,
  TenantSeedPlan,
} from '@/lib/programs/enhancement-seed-planner';

// --- Canonical six phases (per S8 readiness contract §H) -------------

export interface CanonicalPhase {
  index: 1 | 2 | 3 | 4 | 5 | 6;
  key: 'origination' | 'charter' | 'diagnose' | 'design' | 'execute' | 'verify';
  label: string;
  summary: string;
}

export const CANONICAL_SIX_PHASES: ReadonlyArray<CanonicalPhase> = [
  {
    index: 1,
    key: 'origination',
    label: 'Origination',
    summary: 'Frame the problem, identify the sponsor, scope the opportunity.',
  },
  {
    index: 2,
    key: 'charter',
    label: 'Charter',
    summary: 'Lock objectives, success criteria, and baseline data request.',
  },
  {
    index: 3,
    key: 'diagnose',
    label: 'Diagnose',
    summary: 'Surface findings, contradictions, and CXO interview capture.',
  },
  {
    index: 4,
    key: 'design',
    label: 'Design',
    summary: 'Solution match, vendor evaluation, business case, decision memo.',
  },
  {
    index: 5,
    key: 'execute',
    label: 'Execute',
    summary: 'Implementation plan, build, integration, change management.',
  },
  {
    index: 6,
    key: 'verify',
    label: 'Verify',
    summary: 'Outcome measurement, benefits realization, genome feedback.',
  },
];

// --- Canonical four hard gates ---------------------------------------

export interface CanonicalGate {
  index: 1 | 2 | 3 | 4;
  label: string;
  exitsPhase: CanonicalPhase['key'];
}

export const CANONICAL_FOUR_GATES: ReadonlyArray<CanonicalGate> = [
  {
    index: 1,
    label: 'Charter signed by executive sponsor',
    exitsPhase: 'charter',
  },
  {
    index: 2,
    label: 'CXO interview completed before findings publish',
    exitsPhase: 'diagnose',
  },
  {
    index: 3,
    label: 'Design approved with projected value documented',
    exitsPhase: 'design',
  },
  {
    index: 4,
    label: 'CXO verification of realized outcomes before outcome-fee claim',
    exitsPhase: 'verify',
  },
];

// --- Phase mapping ----------------------------------------------------

/**
 * The seed runs five spec phases (Intake & Framing → Outcome &
 * Accountability) which map onto canonical phases 2–6. Canonical
 * phase 1 (Origination) is pre-charter framing not yet captured in
 * the seed; programs in the seed never report Origination as their
 * current phase. Returns the canonical index a program is currently
 * sitting at.
 */
export function mapSpecPhaseToCanonicalIndex(
  spec: SpecPhaseNumber,
): CanonicalPhase['index'] {
  switch (spec) {
    case 1:
      return 2; // Charter
    case 2:
      return 3; // Diagnose
    case 3:
      return 4; // Design
    case 4:
      return 5; // Execute
    case 5:
      return 6; // Verify
  }
}

export type CanonicalPhaseStatus =
  | 'complete'
  | 'active'
  | 'pending'
  | 'origination_pre_seed';

/**
 * For a given program and a canonical phase index, classify status
 * deterministically:
 * - phases before the program's current phase → complete
 * - the program's current phase → active
 * - phases after the program's current phase → pending
 * - canonical Origination is always pre-seed (the seed cannot record
 *   programs in this state today)
 */
export function statusForCanonicalPhase(
  program: Pick<ProgramSeedPlan, 'currentPhaseSpec'>,
  canonicalIndex: CanonicalPhase['index'],
): CanonicalPhaseStatus {
  if (canonicalIndex === 1) return 'origination_pre_seed';
  const programIndex = mapSpecPhaseToCanonicalIndex(program.currentPhaseSpec);
  if (canonicalIndex < programIndex) return 'complete';
  if (canonicalIndex === programIndex) return 'active';
  return 'pending';
}

// --- Tier counting / portfolio summary -------------------------------

export interface DeliverableTierCounts {
  rich: number;
  outline: number;
  stub: number;
  total: number;
}

export function countDeliverableTiers(
  deliverables: ReadonlyArray<DeliverableSeedPlan>,
): DeliverableTierCounts {
  let rich = 0;
  let outline = 0;
  let stub = 0;
  for (const d of deliverables) {
    if (d.renderTier === 'rich') rich += 1;
    else if (d.renderTier === 'outline') outline += 1;
    else stub += 1;
  }
  return { rich, outline, stub, total: deliverables.length };
}

export interface PortfolioSummary {
  programCount: number;
  activeProgramCount: number;
  completedProgramCount: number;
  /** Programs grouped by canonical phase index (1-6). */
  programsByCanonicalPhase: Record<CanonicalPhase['index'], number>;
  deliverableTiers: DeliverableTierCounts;
  /** Identifier of the program the portfolio guidance recommends opening first. */
  recommendedFirstProgramSlug: string | null;
  recommendedFirstProgramReason: string;
}

export function summarizePortfolio(tenant: TenantSeedPlan): PortfolioSummary {
  const counts: Record<CanonicalPhase['index'], number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
  };
  let activeProgramCount = 0;
  let completedProgramCount = 0;
  const allDeliverables: DeliverableSeedPlan[] = [];

  for (const program of tenant.programs) {
    const canonical = mapSpecPhaseToCanonicalIndex(program.currentPhaseSpec);
    counts[canonical] += 1;
    if (program.status === 'active') activeProgramCount += 1;
    if (program.status === 'completed') completedProgramCount += 1;
    allDeliverables.push(...program.deliverables);
  }

  const recommendation = pickRecommendedFirstProgram(tenant);

  return {
    programCount: tenant.programs.length,
    activeProgramCount,
    completedProgramCount,
    programsByCanonicalPhase: counts,
    deliverableTiers: countDeliverableTiers(allDeliverables),
    recommendedFirstProgramSlug: recommendation?.slug ?? null,
    recommendedFirstProgramReason: recommendation?.reason
      ?? 'No programs in this tenant.',
  };
}

/**
 * Deterministic recommendation: prefer the active program with the
 * highest canonical phase index (closest to value realization). Stable
 * tie-break by program code so re-renders are identical.
 */
function pickRecommendedFirstProgram(
  tenant: TenantSeedPlan,
): { slug: string; reason: string } | null {
  if (tenant.programs.length === 0) return null;

  const ranked = [...tenant.programs]
    .filter((p) => p.status === 'active')
    .map((p) => ({
      program: p,
      canonical: mapSpecPhaseToCanonicalIndex(p.currentPhaseSpec),
    }))
    .sort((a, b) => {
      if (a.canonical !== b.canonical) return b.canonical - a.canonical;
      return a.program.code.localeCompare(b.program.code);
    });

  if (ranked.length === 0) {
    const fallback = [...tenant.programs].sort((a, b) =>
      a.code.localeCompare(b.code),
    )[0];
    return {
      slug: fallback.programSlug,
      reason: `No active programs; ${fallback.code} is the next-most-canonical entry by code.`,
    };
  }

  const top = ranked[0];
  const phase = CANONICAL_SIX_PHASES[top.canonical - 1];
  return {
    slug: top.program.programSlug,
    reason: `${top.program.code} is active in canonical ${phase.label} (P${top.canonical}); review it first.`,
  };
}

// --- Per-program summary ---------------------------------------------

export interface ProgramSummaryView {
  code: string;
  name: string;
  archetypeCode: string;
  appArchetype: string;
  status: ProgramSeedPlan['status'];
  patternSlug: string | null;
  roleInDemo: string;
  routePath: string;
  currentPhaseSpec: SpecPhaseNumber;
  currentCanonicalPhase: CanonicalPhase;
  deliverableTiers: DeliverableTierCounts;
}

export function summarizeProgram(program: ProgramSeedPlan): ProgramSummaryView {
  const canonicalIndex = mapSpecPhaseToCanonicalIndex(program.currentPhaseSpec);
  const canonical = CANONICAL_SIX_PHASES[canonicalIndex - 1];
  return {
    code: program.code,
    name: program.name,
    archetypeCode: program.archetypeCode,
    appArchetype: program.appArchetype,
    status: program.status,
    patternSlug: program.patternSlug,
    roleInDemo: program.roleInDemo,
    routePath: program.routePath,
    currentPhaseSpec: program.currentPhaseSpec,
    currentCanonicalPhase: canonical,
    deliverableTiers: countDeliverableTiers(program.deliverables),
  };
}

// --- Deterministic Nexus-style editorial -----------------------------

/**
 * Produces a 2-3 sentence portfolio editorial for a tenant. Pure prose —
 * no live model call. Frames programs by canonical phase distribution
 * and points the reader at the recommended first program.
 */
export function buildPortfolioGuidance(
  tenant: TenantSeedPlan,
  summary: PortfolioSummary,
): string {
  if (summary.programCount === 0) {
    return `${tenant.displayName} has no seeded programs yet. Open Charter authoring to start the first one.`;
  }

  const phaseLine = describePhaseDistribution(summary);
  const recommendation = summary.recommendedFirstProgramReason;
  const programsWord = summary.programCount === 1 ? 'program' : 'programs';

  return [
    `${tenant.displayName}: ${summary.programCount} canonical ${programsWord} (${summary.activeProgramCount} active, ${summary.completedProgramCount} completed).`,
    phaseLine,
    recommendation,
  ].join(' ');
}

function describePhaseDistribution(summary: PortfolioSummary): string {
  const populated: string[] = [];
  for (const phase of CANONICAL_SIX_PHASES) {
    const count = summary.programsByCanonicalPhase[phase.index];
    if (count > 0) {
      populated.push(`${count} in ${phase.label}`);
    }
  }
  if (populated.length === 0) return 'No programs are currently in flight.';
  return `Phase mix: ${populated.join(', ')}.`;
}

/**
 * 2-3 sentence editorial lead for a single program detail page.
 * Names the canonical phase, role in demo, and a sober reminder that
 * gate-state, evidence, and value rendering are placeholders until the
 * S9b–S9e slices wire the live state machine.
 */
export function buildProgramEditorial(view: ProgramSummaryView): string {
  const phase = view.currentCanonicalPhase;
  const tierLine = describeTierMix(view.deliverableTiers);
  return [
    `${view.code} · ${view.name} is in canonical ${phase.label} (P${phase.index}).`,
    `${view.roleInDemo}.`,
    tierLine,
  ].join(' ');
}

function describeTierMix(tiers: DeliverableTierCounts): string {
  if (tiers.total === 0) return 'No deliverables seeded yet.';
  const parts: string[] = [];
  if (tiers.rich > 0) parts.push(`${tiers.rich} Rich`);
  if (tiers.outline > 0) parts.push(`${tiers.outline} Outline`);
  if (tiers.stub > 0) parts.push(`${tiers.stub} Stub`);
  return `${tiers.total} deliverables: ${parts.join(', ')}.`;
}

// --- Honest fallback labels ------------------------------------------

/**
 * Single source of truth for the "we do not have this data yet" labels
 * the canonical pages render. Keeps wording consistent across the
 * surface and across tests.
 */
export const HONEST_FALLBACK_LABELS = {
  gateState: 'Informational · gate state machine not yet wired.',
  valueAtStake: 'Projected value not yet captured in seed.',
  riskRegister: 'Risk register not yet captured in seed.',
  decisionsPending: 'Decisions registry not yet captured in seed.',
  origination: 'Origination phase predates the seed; treated as pre-Charter.',
  productionStateMachineDeferred:
    'Seed-informed gate readiness; production state machine deferred.',
} as const;

// =====================================================================
// S9c · Phase + hard-gate status rendering view model
// =====================================================================
//
// The functions below consume only seed data. They do NOT implement a
// production state machine. They produce deterministic status enums
// the canonical detail component can render without fabricating
// approval state.

/**
 * The richer 6-state phase status enum the canonical detail surface
 * renders against. Mirrors the S8 readiness contract §H.
 */
export type CanonicalPhaseRenderStatus =
  | 'not_started'
  | 'current'
  | 'complete'
  | 'informational'
  | 'blocked'
  | 'not_seeded';

/**
 * Map the existing 4-state classification (statusForCanonicalPhase) to
 * the 6-state enum the renderer wants. Behavior is deterministic and
 * pure: no model calls, no time reads.
 */
export function statusToCanonicalPhaseRenderStatus(
  status: CanonicalPhaseStatus,
): CanonicalPhaseRenderStatus {
  switch (status) {
    case 'complete':
      return 'complete';
    case 'active':
      return 'current';
    case 'pending':
      return 'not_started';
    case 'origination_pre_seed':
      return 'informational';
  }
}

export interface CanonicalPhaseTimelineEntry {
  phase: CanonicalPhase;
  status: CanonicalPhaseRenderStatus;
  /** True for the phase the program is currently sitting at. */
  isCurrent: boolean;
  /**
   * Spec phase the timeline entry can link to (1..5). Origination has
   * no spec phase mapping today; null for that entry.
   */
  specPhase: SpecPhaseNumber | null;
  /** Short single-line reason the renderer can show next to the tile. */
  reason: string;
}

/**
 * Returns the canonical phase the program is currently sitting at.
 * Pure; null only if the program has an out-of-range spec phase.
 */
export function getCurrentCanonicalPhase(
  program: Pick<ProgramSeedPlan, 'currentPhaseSpec'>,
): CanonicalPhase | null {
  const idx = mapSpecPhaseToCanonicalIndex(program.currentPhaseSpec);
  return CANONICAL_SIX_PHASES.find((p) => p.index === idx) ?? null;
}

/**
 * Build the deterministic six-phase timeline view-model. The renderer
 * iterates this array — no per-tile decisions in JSX. Each entry
 * carries its own status and reason so the component stays thin.
 */
export function buildCanonicalPhaseTimeline(
  program: Pick<ProgramSeedPlan, 'currentPhaseSpec'>,
): ReadonlyArray<CanonicalPhaseTimelineEntry> {
  return CANONICAL_SIX_PHASES.map((phase) => {
    const baseStatus = statusForCanonicalPhase(program, phase.index);
    const status = statusToCanonicalPhaseRenderStatus(baseStatus);
    const specPhase = phase.index === 1
      ? null
      : ((phase.index - 1) as SpecPhaseNumber);
    return {
      phase,
      status,
      isCurrent: status === 'current',
      specPhase,
      reason: phaseReasonFor(phase, status),
    } satisfies CanonicalPhaseTimelineEntry;
  });
}

function phaseReasonFor(
  phase: CanonicalPhase,
  status: CanonicalPhaseRenderStatus,
): string {
  switch (status) {
    case 'informational':
      return phase.key === 'origination'
        ? HONEST_FALLBACK_LABELS.origination
        : 'Informational placeholder.';
    case 'current':
      return `Program is in ${phase.label} (P${phase.index}).`;
    case 'complete':
      return `${phase.label} (P${phase.index}) is behind the program; treated as complete.`;
    case 'not_started':
      return `${phase.label} (P${phase.index}) has not been reached yet.`;
    case 'blocked':
      return `${phase.label} (P${phase.index}) is blocked.`;
    case 'not_seeded':
      return `${phase.label} (P${phase.index}) is not represented in the seed.`;
  }
}

// --- Hard-gate readiness ----------------------------------------------

/**
 * 5-state hard-gate render status. Honest defaults while the production
 * gate state machine is deferred to a later slice.
 */
export type CanonicalHardGateRenderStatus =
  | 'informational'
  | 'ready'
  | 'missing_inputs'
  | 'blocked'
  | 'not_wired';

export interface CanonicalHardGateEntry {
  gate: CanonicalGate;
  status: CanonicalHardGateRenderStatus;
  /** Short single-line label the renderer can show next to the row. */
  label: string;
  /**
   * When status is `missing_inputs` or `blocked`, names the seed-known
   * reason transition is not safe today. Null otherwise.
   */
  blockedTransitionReason: string | null;
  /** True iff the program's current canonical phase exits this gate. */
  isCurrentGate: boolean;
  /** True iff the program has passed this gate's exit phase. */
  isPassed: boolean;
}

/**
 * Convert a render-status enum to a short uppercase label suitable for
 * the badge column in the gate strip.
 */
export function getGateReadinessLabel(
  status: CanonicalHardGateRenderStatus,
): string {
  switch (status) {
    case 'informational':
      return 'INFORMATIONAL';
    case 'ready':
      return 'READY';
    case 'missing_inputs':
      return 'MISSING INPUTS';
    case 'blocked':
      return 'BLOCKED';
    case 'not_wired':
      return 'NOT WIRED';
  }
}

/**
 * Per-gate seed-known reason a transition is not safe today. Returns a
 * single-sentence prose string when the gate is `missing_inputs` (or
 * one day `blocked`). Returns null when the gate is `informational`,
 * `ready`, or `not_wired`.
 */
export function getBlockedTransitionReason(
  gate: CanonicalGate,
  program: Pick<ProgramSeedPlan, 'currentPhaseSpec' | 'status'>,
): string | null {
  const status = classifyGateStatus(gate, program);
  if (status !== 'missing_inputs' && status !== 'blocked') return null;
  return describeGateMissingInputs(gate);
}

function describeGateMissingInputs(gate: CanonicalGate): string {
  switch (gate.index) {
    case 1:
      return 'Charter signature is not captured in the seed; G1 readiness deferred to the production state machine.';
    case 2:
      return 'CXO interview capture is not captured in the seed; G2 readiness deferred to the production state machine.';
    case 3:
      return 'Projected value documentation is not captured in the seed; G3 readiness deferred until evidence and value seed land.';
    case 4:
      return 'Realized outcomes verification is not captured in the seed; G4 readiness deferred until measurement seed lands.';
  }
}

function classifyGateStatus(
  gate: CanonicalGate,
  program: Pick<ProgramSeedPlan, 'currentPhaseSpec' | 'status'>,
): CanonicalHardGateRenderStatus {
  const programIndex = mapSpecPhaseToCanonicalIndex(program.currentPhaseSpec);
  const gatePhaseIndex = CANONICAL_SIX_PHASES.find(
    (p) => p.key === gate.exitsPhase,
  )!.index;

  // Gate is still ahead of the program's current canonical phase: the
  // production state machine would govern it later. Today we mark it
  // as not_wired because we have no machine.
  if (programIndex < gatePhaseIndex) return 'not_wired';

  // Gate's exit phase IS the program's current phase: known to require
  // inputs the seed does not capture today. Honest label is
  // missing_inputs with a per-gate reason.
  if (programIndex === gatePhaseIndex) return 'missing_inputs';

  // Gate's exit phase is behind the program. Without a state machine,
  // we cannot claim it as approved/cleared. Honest label is
  // informational with the "passed" reason in the entry.
  return 'informational';
}

/**
 * Build the deterministic four-hard-gate strip view-model. The
 * renderer iterates this array. No per-row decisions in JSX.
 */
export function buildCanonicalHardGateStrip(
  program: Pick<ProgramSeedPlan, 'currentPhaseSpec' | 'status'>,
): ReadonlyArray<CanonicalHardGateEntry> {
  const programIndex = mapSpecPhaseToCanonicalIndex(program.currentPhaseSpec);
  return CANONICAL_FOUR_GATES.map((gate) => {
    const gatePhaseIndex = CANONICAL_SIX_PHASES.find(
      (p) => p.key === gate.exitsPhase,
    )!.index;
    const status = classifyGateStatus(gate, program);
    const isCurrentGate = programIndex === gatePhaseIndex;
    const isPassed = programIndex > gatePhaseIndex;
    return {
      gate,
      status,
      label: getGateReadinessLabel(status),
      blockedTransitionReason: getBlockedTransitionReason(gate, program),
      isCurrentGate,
      isPassed,
    } satisfies CanonicalHardGateEntry;
  });
}

// --- Steward readiness note ------------------------------------------

export interface StewardReadinessNote {
  ready: string[];
  missing: string[];
  blocking: string[];
  deferred: string[];
  /** Single-line summary the renderer can show as an eyebrow. */
  summary: string;
}

/**
 * Build a deterministic Steward readiness note from seed alone. No
 * model call. The note lists what is ready, what is missing, what
 * blocks advancement today, and what is deferred to the production
 * state machine.
 */
export function buildStewardReadinessNote(
  program: Pick<ProgramSeedPlan, 'currentPhaseSpec' | 'status'>,
): StewardReadinessNote {
  const phases = buildCanonicalPhaseTimeline(program);
  const gates = buildCanonicalHardGateStrip(program);
  const current = phases.find((p) => p.isCurrent);

  const ready: string[] = [];
  const missing: string[] = [];
  const blocking: string[] = [];
  const deferred: string[] = [];

  if (current) {
    ready.push(`Program is in canonical ${current.phase.label} (P${current.phase.index}).`);
  }
  for (const phase of phases) {
    if (phase.status === 'complete') {
      ready.push(`${phase.phase.label} treated as complete based on canonical position.`);
    }
  }

  for (const entry of gates) {
    if (entry.status === 'missing_inputs') {
      missing.push(`G${entry.gate.index}: ${entry.gate.label} → ${entry.blockedTransitionReason ?? 'inputs missing'}`);
      blocking.push(`G${entry.gate.index} cannot be cleared from seed alone.`);
    } else if (entry.status === 'not_wired') {
      deferred.push(`G${entry.gate.index} (${entry.gate.label}) — not wired yet.`);
    } else if (entry.status === 'informational' && entry.isPassed) {
      ready.push(`G${entry.gate.index} sits behind the program's current phase; treated informationally.`);
    }
  }

  deferred.push('Production gate state machine implementation (Steward-owned writer + audit log).');

  const summary = [
    HONEST_FALLBACK_LABELS.productionStateMachineDeferred,
    `${ready.length} ready signal(s), ${missing.length} missing input(s), ${blocking.length} blocking item(s).`,
  ].join(' ');

  return { ready, missing, blocking, deferred, summary };
}
