// PROG8 · Phase Gate Advancement Flow Contract.
//
// Pure deterministic projection of (tenant, program, canonical phase)
// seed state into a *proposed* phase gate advancement record the
// Steward, the Maestro, and the Atlas executive readout can use to
// answer the question: "What would advancing this program past the
// next gate require, and is the gate ready, partially ready, blocked,
// in need of waiver, or in need of review?"
//
// This module operationalizes the phase gate advancement lifecycle
// named in the S9C Program Phase Gate Status, the PF2 Program Phase
// Workspace, and the MW1 Maestro Workshop Intelligence contracts —
// WITHOUT performing any state transition. Every advancement is a
// proposal: `proposed: true`, with no `applied`, `signed`, or
// `transitioned` flag. The production gate state machine + audit log
// + Steward signoff persistence remain deferred to a later slice.
//
// What this module deliberately does NOT do:
//   - No DB writes, no migrations, no persistence layer.
//   - No model invocation. No live clocks. No randomness. No network IO.
//   - No actual gate transition. No phase advance. No waiver issuance.
//   - No timestamps. State is described by structured labels (e.g.,
//     `'requires_review'`, `'pending'`, `'unknown'`) — never by a
//     fabricated date or duration.
//   - No fake "completed" decisions or fake gate transitions. Items
//     the seed cannot derive surface as `status: 'unknown'` with an
//     explicit reason or as a `requires_review` proposal status.
//
// This module does NOT import:
//   - src/lib/source/**, src/app/(maestro)/source/**
//   - src/lib/sentinel/**, src/lib/atlas/**, src/lib/nexus/**
//   - src/lib/agent/**, src/components/agent/**
//   - src/lib/auth/**
//   - supabase/**
//   - src/lib/programs/mock.ts

import {
  buildCanonicalHardGateStrip,
  buildCanonicalPhaseTimeline,
  buildProgramReadinessSummary,
  buildStewardReadinessNote,
  CANONICAL_FOUR_GATES,
  CANONICAL_SIX_PHASES,
  getCurrentCanonicalPhase,
  mapSpecPhaseToCanonicalIndex,
  type CanonicalGate,
  type CanonicalHardGateEntry,
  type CanonicalPhase,
} from '@/lib/programs/programs-canonical-view';
import type {
  ProgramSeedPlan,
  TenantSeedPlan,
} from '@/lib/programs/enhancement-seed-planner';

// ---------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------

/**
 * Source attribution for an advancement proposal. Always
 * `'deterministic_phase_gate_advancement_seed'` so downstream surfaces
 * can tell the record was not produced by a live state machine or a
 * Steward signoff event.
 */
export type PhaseGateAdvancementSource =
  | 'deterministic_phase_gate_advancement_seed';

/**
 * The advancement disposition the Steward / Maestro can act on. Pure
 * deterministic label derived from seed signal density alone:
 *
 * - `'ready'` — the proposal carries no missing inputs, no blocking
 *   reasons, and the steward readiness summary has at least one
 *   ready signal (Steward could clear with a confirmation).
 * - `'partially_ready'` — at least one missing input but no blocking
 *   reasons; Steward can advance with the listed gaps closed.
 * - `'blocked'` — at least one blocking reason; advancement cannot
 *   proceed without resolving the block or invoking the waiver path.
 * - `'requires_waiver'` — gate is blocked AND the gate is the
 *   program's current canonical exit gate (so a waiver path is the
 *   honest production option once persistence + auth slices land).
 * - `'requires_review'` — the seed cannot deterministically classify
 *   advancement (e.g., gate sits ahead of the program's canonical
 *   phase, no production state machine wired); honest "needs human"
 *   default rather than fabricated readiness.
 */
export type PhaseGateAdvancementStatus =
  | 'ready'
  | 'partially_ready'
  | 'blocked'
  | 'requires_waiver'
  | 'requires_review';

/**
 * A single steward-readiness signal contributing to (or detracting
 * from) the proposal. Roles only — never a real person name.
 */
export interface PhaseGateReadinessSignal {
  id: string;
  label: string;
  state: 'ready' | 'missing' | 'blocking' | 'deferred';
  reason: string;
}

/**
 * A single missing input the seed knows the gate's production state
 * machine would require before advancing.
 */
export interface PhaseGateMissingInput {
  id: string;
  label: string;
  reason: string;
  /**
   * Whether this missing input alone would block advancement. False
   * for "nice-to-have" inputs that downgrade readiness to
   * `partially_ready` rather than `blocked`.
   */
  blocking: boolean;
}

/**
 * A single evidence requirement the gate names. Honest:
 * `evidenceRegistryWired === false` is the default today because the
 * canonical seed does not capture an evidence registry.
 */
export interface PhaseGateEvidenceRequirement {
  id: string;
  label: string;
  reason: string;
  /**
   * Structured kind label the renderer can group by. Pure label —
   * never fabricated.
   */
  kind:
    | 'document_capture'
    | 'cxo_interview_capture'
    | 'projected_value_capture'
    | 'realized_value_capture'
    | 'design_signoff'
    | 'charter_signature'
    | 'unknown';
  /**
   * `false` until the production evidence registry seed lands. The
   * renderer shows this honestly rather than fabricating an `E-###`
   * citation.
   */
  evidenceRegistryWired: boolean;
}

/**
 * The audit requirement every advancement proposal carries. Pure
 * deterministic label set — describes what the production audit log
 * would record once persistence + auth slices land. No actual write.
 */
export interface PhaseGateAuditRequirement {
  /**
   * Structured kinds of audit events the production state machine
   * would record on advancement. Each label is a pure structured
   * string — no timestamps, no actor names.
   */
  requiredAuditEvents: ReadonlyArray<
    | 'gate_advancement_proposed'
    | 'gate_advancement_evaluated'
    | 'steward_signoff_recorded'
    | 'evidence_capture_attached'
    | 'waiver_path_invoked'
  >;
  /**
   * The role that would record the signoff event. Roles only — never
   * a real person name. Always `'steward'` for now (production model).
   */
  signoffRole: 'steward';
  /**
   * Structured prose reason describing why the audit requirement is
   * non-negotiable for this gate. Drawn from canonical gate label.
   */
  reason: string;
  /**
   * `false` until the production audit log + signoff persistence
   * slices land. The renderer shows this honestly so the surface
   * never claims an audited transition that did not happen.
   */
  auditLogWired: false;
}

/**
 * The single deterministic next action a Steward / Maestro can take
 * given the proposal's current advancement status. Pure label —
 * structured, never fabricated.
 */
export interface PhaseGateRecommendedNextAction {
  label: string;
  routePath: string;
  reason: string;
  /**
   * Structured kind label so the renderer can group / icon by intent.
   */
  kind:
    | 'capture_missing_input'
    | 'resolve_blocker'
    | 'invoke_waiver_path'
    | 'request_steward_signoff'
    | 'review_gate_readiness';
}

/**
 * A single proposed gate advancement record. Carries everything a
 * surface needs to render the proposal honestly without inventing the
 * runtime that would actually advance the gate.
 */
export interface PhaseGateAdvancementProposal {
  id: string;

  tenantKey: string;
  tenantName: string;
  programCode: string;
  programSlug: string;
  programName: string;

  /** The canonical phase the proposal is evaluating exit from. */
  fromPhase: CanonicalPhase;
  /** The canonical phase the proposal would advance into. Null when the gate is G4 (verify is terminal). */
  toPhase: CanonicalPhase | null;
  /** The canonical hard gate the proposal would clear. */
  gate: CanonicalGate;

  /**
   * Always `true`. Marker the renderer can rely on to never claim a
   * transition has happened. The production state machine is the
   * only system that may flip this to `false` (i.e., applied), and
   * that runtime is deferred.
   */
  proposed: true;

  /** Deterministic advancement disposition. */
  advancementStatus: PhaseGateAdvancementStatus;

  /**
   * Steward readiness summary mapped onto the proposal. Lists the
   * ready / missing / blocking / deferred signals the seed surfaces
   * for the program at this gate.
   */
  stewardReadiness: {
    summary: string;
    signals: ReadonlyArray<PhaseGateReadinessSignal>;
    readyCount: number;
    missingCount: number;
    blockingCount: number;
    deferredCount: number;
  };

  /** Explicit list of missing inputs the gate needs before advancing. */
  missingInputs: ReadonlyArray<PhaseGateMissingInput>;

  /** Explicit list of evidence requirements the gate names. */
  evidenceRequirements: ReadonlyArray<PhaseGateEvidenceRequirement>;

  /** Audit requirement the production state machine would honor. */
  auditRequirement: PhaseGateAuditRequirement;

  /** Single deterministic next action the surface can show as primary CTA. */
  recommendedNextAction: PhaseGateRecommendedNextAction;

  /**
   * When the proposal is `'requires_waiver'`, the structured prose
   * the surface can show describing the waiver path. `null` for any
   * other status.
   */
  waiverPathReason: string | null;

  createdFrom: PhaseGateAdvancementSource;
}

/**
 * Aggregate roll-up across many advancement proposals. Suitable for
 * the Atlas executive readout of "where is the portfolio across
 * phase gate advancement".
 */
export interface PhaseGateAdvancementFlowSummary {
  totalCount: number;
  byStatus: Record<PhaseGateAdvancementStatus, number>;
  totalMissingInputs: number;
  totalBlockingMissingInputs: number;
  totalEvidenceRequirements: number;
  perTenant: ReadonlyArray<{
    tenantKey: string;
    tenantName: string;
    count: number;
  }>;
  perGate: ReadonlyArray<{
    gateIndex: 1 | 2 | 3 | 4;
    label: string;
    count: number;
  }>;
}

// ---------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------

const CREATED_FROM: PhaseGateAdvancementSource =
  'deterministic_phase_gate_advancement_seed';

const HONEST_FALLBACK_REASON =
  'Derived from deterministic phase gate advancement seed; production gate state machine + audit log are not wired.';

const REQUIRED_AUDIT_EVENTS_BASE: PhaseGateAuditRequirement['requiredAuditEvents'] = [
  'gate_advancement_proposed',
  'gate_advancement_evaluated',
  'steward_signoff_recorded',
  'evidence_capture_attached',
];

// ---------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------

/**
 * Build the deterministic advancement proposal for a single
 * (tenant, program, canonical phase). Pure: same input → identical
 * output across calls.
 *
 * `phase` is the canonical phase the proposal is evaluating exit
 * from. The proposal targets the canonical hard gate that exits
 * `phase` (when one exists). Phases with no exiting gate (Origination,
 * Diagnose, Execute) still produce a proposal, but the gate field
 * carries the next downstream gate and `advancementStatus` defaults
 * to `'requires_review'` because the seed cannot deterministically
 * classify mid-phase advancement.
 */
export function buildPhaseGateAdvancementProposal(
  tenant: TenantSeedPlan,
  program: ProgramSeedPlan,
  phase: CanonicalPhase,
): PhaseGateAdvancementProposal {
  // Touch downstream read models so any contract drift surfaces here.
  const readinessSummary = buildProgramReadinessSummary(program);
  const stewardNote = buildStewardReadinessNote(program);
  const phaseTimeline = buildCanonicalPhaseTimeline(program);
  const gateStrip = buildCanonicalHardGateStrip(program);
  void phaseTimeline;

  const gate = pickGateForPhase(phase);
  const fromPhase = phase;
  const toPhase = pickToPhase(phase);

  const gateEntry = findGateEntry(gateStrip, gate);

  const stewardReadiness = composeStewardReadiness(
    program,
    stewardNote,
    gateEntry,
  );
  const missingInputs = composeMissingInputs(
    program,
    gate,
    gateEntry,
    readinessSummary,
  );
  const evidenceRequirements = composeEvidenceRequirements(gate);
  const auditRequirement = composeAuditRequirement(gate, gateEntry);

  const advancementStatus = classifyAdvancementStatus({
    program,
    phase,
    gate,
    gateEntry,
    stewardReadiness,
    missingInputs,
  });

  const waiverPathReason =
    advancementStatus === 'requires_waiver'
      ? composeWaiverPathReason(gate, gateEntry)
      : null;

  const recommendedNextAction = composeRecommendedNextAction({
    program,
    gate,
    advancementStatus,
    missingInputs,
    gateEntry,
  });

  const id = `phase-gate-advancement:${tenant.tenantKey}:${program.programSlug}:p${phase.index}-g${gate.index}`;

  return {
    id,
    tenantKey: tenant.tenantKey,
    tenantName: tenant.displayName,
    programCode: program.code,
    programSlug: program.programSlug,
    programName: program.name,
    fromPhase,
    toPhase,
    gate,
    proposed: true,
    advancementStatus,
    stewardReadiness,
    missingInputs,
    evidenceRequirements,
    auditRequirement,
    recommendedNextAction,
    waiverPathReason,
    createdFrom: CREATED_FROM,
  };
}

/**
 * Aggregate counts across a list of advancement proposals. Pure.
 */
export function summarizePhaseGateAdvancements(
  proposals: ReadonlyArray<PhaseGateAdvancementProposal>,
): PhaseGateAdvancementFlowSummary {
  const byStatus: Record<PhaseGateAdvancementStatus, number> = {
    ready: 0,
    partially_ready: 0,
    blocked: 0,
    requires_waiver: 0,
    requires_review: 0,
  };
  let totalMissingInputs = 0;
  let totalBlockingMissingInputs = 0;
  let totalEvidenceRequirements = 0;
  const perTenantMap = new Map<
    string,
    { tenantKey: string; tenantName: string; count: number }
  >();
  const perGateMap = new Map<
    1 | 2 | 3 | 4,
    { gateIndex: 1 | 2 | 3 | 4; label: string; count: number }
  >();
  for (const proposal of proposals) {
    byStatus[proposal.advancementStatus] += 1;
    totalMissingInputs += proposal.missingInputs.length;
    for (const mi of proposal.missingInputs) {
      if (mi.blocking) totalBlockingMissingInputs += 1;
    }
    totalEvidenceRequirements += proposal.evidenceRequirements.length;

    const existingTenant = perTenantMap.get(proposal.tenantKey);
    if (existingTenant) {
      existingTenant.count += 1;
    } else {
      perTenantMap.set(proposal.tenantKey, {
        tenantKey: proposal.tenantKey,
        tenantName: proposal.tenantName,
        count: 1,
      });
    }

    const gateIndex = proposal.gate.index;
    const existingGate = perGateMap.get(gateIndex);
    if (existingGate) {
      existingGate.count += 1;
    } else {
      perGateMap.set(gateIndex, {
        gateIndex,
        label: proposal.gate.label,
        count: 1,
      });
    }
  }
  const perTenant = Array.from(perTenantMap.values()).sort((a, b) =>
    a.tenantKey.localeCompare(b.tenantKey),
  );
  const perGate = Array.from(perGateMap.values()).sort(
    (a, b) => a.gateIndex - b.gateIndex,
  );
  return {
    totalCount: proposals.length,
    byStatus,
    totalMissingInputs,
    totalBlockingMissingInputs,
    totalEvidenceRequirements,
    perTenant,
    perGate,
  };
}

/**
 * Return the deterministic readiness signal aggregate the Steward
 * surface can render at-a-glance. Convenience wrapper that re-uses
 * the proposal's `stewardReadiness` field.
 */
export function evaluatePhaseGateReadiness(
  proposal: PhaseGateAdvancementProposal,
): {
  status: PhaseGateAdvancementStatus;
  readyCount: number;
  missingCount: number;
  blockingCount: number;
  deferredCount: number;
  summary: string;
} {
  return {
    status: proposal.advancementStatus,
    readyCount: proposal.stewardReadiness.readyCount,
    missingCount: proposal.stewardReadiness.missingCount,
    blockingCount: proposal.stewardReadiness.blockingCount,
    deferredCount: proposal.stewardReadiness.deferredCount,
    summary: proposal.stewardReadiness.summary,
  };
}

/**
 * Return the union of every proposal whose advancementStatus is
 * `'blocked'` OR `'requires_waiver'`. The renderer can use this for
 * the "what is keeping us from advancing" rollup. `'requires_review'`
 * is NOT promoted to blocked because the seed honestly cannot say.
 */
export function getBlockedPhaseGates(
  proposals: ReadonlyArray<PhaseGateAdvancementProposal>,
): ReadonlyArray<PhaseGateAdvancementProposal> {
  return proposals.filter(
    (p) =>
      p.advancementStatus === 'blocked' ||
      p.advancementStatus === 'requires_waiver',
  );
}

// ---------------------------------------------------------------------
// Internal helpers · gate + phase resolution
// ---------------------------------------------------------------------

function pickGateForPhase(phase: CanonicalPhase): CanonicalGate {
  // Each canonical phase maps to a canonical hard gate. When a phase
  // has no direct exit gate (Origination, Diagnose, Execute), pick
  // the next downstream gate so the surface can still show the
  // Steward / Maestro what the next checkpoint looks like.
  const exact = CANONICAL_FOUR_GATES.find((g) => g.exitsPhase === phase.key);
  if (exact) return exact;
  switch (phase.key) {
    case 'origination':
      return CANONICAL_FOUR_GATES[0]; // G1 (charter exit)
    case 'diagnose':
      return CANONICAL_FOUR_GATES[1]; // G2 (diagnose exit)
    case 'execute':
      return CANONICAL_FOUR_GATES[3]; // G4 (verify exit)
    default:
      return CANONICAL_FOUR_GATES[0];
  }
}

function pickToPhase(phase: CanonicalPhase): CanonicalPhase | null {
  const nextIndex = phase.index + 1;
  if (nextIndex < 1 || nextIndex > 6) return null;
  return CANONICAL_SIX_PHASES[nextIndex - 1] ?? null;
}

function findGateEntry(
  gateStrip: ReadonlyArray<CanonicalHardGateEntry>,
  gate: CanonicalGate,
): CanonicalHardGateEntry | null {
  return gateStrip.find((g) => g.gate.index === gate.index) ?? null;
}

// ---------------------------------------------------------------------
// Internal helpers · steward readiness composition
// ---------------------------------------------------------------------

function composeStewardReadiness(
  program: ProgramSeedPlan,
  stewardNote: ReturnType<typeof buildStewardReadinessNote>,
  gateEntry: CanonicalHardGateEntry | null,
): PhaseGateAdvancementProposal['stewardReadiness'] {
  const signals: PhaseGateReadinessSignal[] = [];
  let signalIndex = 0;
  for (const ready of stewardNote.ready) {
    signals.push({
      id: `${program.programSlug}:steward-ready:${++signalIndex}`,
      label: ready,
      state: 'ready',
      reason:
        'Derived from canonical phase + gate position; Steward signoff persistence remains deferred.',
    });
  }
  for (const missing of stewardNote.missing) {
    signals.push({
      id: `${program.programSlug}:steward-missing:${++signalIndex}`,
      label: missing,
      state: 'missing',
      reason:
        'Inputs are not captured in the canonical seed; production state machine would require capture before advancing.',
    });
  }
  for (const blocking of stewardNote.blocking) {
    signals.push({
      id: `${program.programSlug}:steward-blocking:${++signalIndex}`,
      label: blocking,
      state: 'blocking',
      reason:
        'Cannot be cleared from seed alone; production state machine + Steward signoff are required.',
    });
  }
  for (const deferred of stewardNote.deferred) {
    signals.push({
      id: `${program.programSlug}:steward-deferred:${++signalIndex}`,
      label: deferred,
      state: 'deferred',
      reason: HONEST_FALLBACK_REASON,
    });
  }

  // Add the gate-entry-specific blocking reason if the gate is at
  // missing_inputs / blocked status.
  if (
    gateEntry &&
    (gateEntry.status === 'missing_inputs' || gateEntry.status === 'blocked') &&
    gateEntry.blockedTransitionReason
  ) {
    signals.push({
      id: `${program.programSlug}:steward-gate-blocking:${gateEntry.gate.index}`,
      label: `G${gateEntry.gate.index}: ${gateEntry.gate.label}`,
      state: 'blocking',
      reason: gateEntry.blockedTransitionReason,
    });
  }

  const readyCount = signals.filter((s) => s.state === 'ready').length;
  const missingCount = signals.filter((s) => s.state === 'missing').length;
  const blockingCount = signals.filter((s) => s.state === 'blocking').length;
  const deferredCount = signals.filter((s) => s.state === 'deferred').length;

  return {
    summary: stewardNote.summary,
    signals,
    readyCount,
    missingCount,
    blockingCount,
    deferredCount,
  };
}

// ---------------------------------------------------------------------
// Internal helpers · missing inputs
// ---------------------------------------------------------------------

function composeMissingInputs(
  program: ProgramSeedPlan,
  gate: CanonicalGate,
  gateEntry: CanonicalHardGateEntry | null,
  readinessSummary: ReturnType<typeof buildProgramReadinessSummary>,
): ReadonlyArray<PhaseGateMissingInput> {
  const out: PhaseGateMissingInput[] = [];

  // When the gate sits behind the program's canonical phase (gate is
  // already passed informationally per the gate strip), missing
  // inputs are honestly historical — they describe what the
  // production audit log would have captured had it been wired at
  // the time. The classifier treats those as non-blocking so a
  // passed gate with reconstructable gaps surfaces as
  // `partially_ready` rather than `blocked`.
  const gateIsBehind =
    gateEntry !== null && gateEntry.isPassed === true;

  // Per-gate canonical missing inputs. Each gate names what the
  // production state machine would require before advancing.
  switch (gate.index) {
    case 1:
      out.push({
        id: `${program.programSlug}:missing:g1-charter-signature`,
        label: 'Charter signature from executive sponsor',
        reason:
          'G1 requires charter signature capture; the canonical seed does not record signature events.',
        blocking: true,
      });
      out.push({
        id: `${program.programSlug}:missing:g1-objectives-locked`,
        label: 'Objectives + success criteria locked',
        reason:
          'G1 requires locked charter objectives; honest default until charter capture lands.',
        blocking: false,
      });
      break;
    case 2:
      out.push({
        id: `${program.programSlug}:missing:g2-cxo-interview-capture`,
        label: 'CXO interview capture',
        reason:
          'G2 requires CXO interview capture before findings publish; the seed does not capture interview events.',
        blocking: true,
      });
      out.push({
        id: `${program.programSlug}:missing:g2-findings-publication`,
        label: 'Findings publication readiness',
        reason:
          'G2 requires Diagnose phase findings publication; honest default until findings capture lands.',
        blocking: false,
      });
      break;
    case 3:
      out.push({
        id: `${program.programSlug}:missing:g3-projected-value`,
        label: 'Projected value with confidence band per workstream',
        reason:
          'G3 requires projected value documentation; the value registry is not seeded today.',
        blocking: true,
      });
      out.push({
        id: `${program.programSlug}:missing:g3-design-signoff`,
        label: 'Design pack signoff',
        reason:
          'G3 requires design signoff; honest default until design signoff capture lands.',
        blocking: true,
      });
      break;
    case 4:
      out.push({
        id: `${program.programSlug}:missing:g4-realized-outcomes`,
        label: 'Realized outcomes verification by CXO',
        reason:
          'G4 requires CXO verification of realized outcomes; the measurement registry is not seeded today.',
        blocking: true,
      });
      out.push({
        id: `${program.programSlug}:missing:g4-variance-attribution`,
        label: 'Variance attribution between projected and realized',
        reason:
          'G4 requires variance attribution; honest default until dual-ledger entries land.',
        blocking: false,
      });
      break;
  }

  // Honest "evidence registry not seeded" missing input — applies
  // only to gates that explicitly depend on the evidence registry
  // (G2 CXO interview capture, G3 projected value, G4 realized
  // value). G1 (charter signature) is decoupled from the evidence
  // registry and therefore does not surface this gap.
  if (
    readinessSummary.evidence.signal === 'not_seeded' &&
    gate.index !== 1
  ) {
    out.push({
      id: `${program.programSlug}:missing:evidence-registry-not-seeded`,
      label: 'Evidence registry capture',
      reason:
        'Evidence registry is not captured in the canonical seed; production gate cannot validate evidence dependencies until the registry lands.',
      blocking: false,
    });
  }

  // Gate-strip-derived blocking reason (when present).
  if (
    gateEntry &&
    (gateEntry.status === 'blocked' || gateEntry.status === 'missing_inputs') &&
    gateEntry.blockedTransitionReason
  ) {
    out.push({
      id: `${program.programSlug}:missing:gate-blocking-reason:${gate.index}`,
      label: `G${gate.index} blocking reason`,
      reason: gateEntry.blockedTransitionReason,
      blocking: gateEntry.status === 'blocked',
    });
  }

  // When the gate is already passed by the program, demote blocking
  // flags to non-blocking. Passed gates cannot meaningfully be
  // "blocked" — the inputs are historical, and the proposal lists
  // them so the production audit log can be reconstructed.
  if (gateIsBehind) {
    return out.map((mi) => ({ ...mi, blocking: false }));
  }

  return out;
}

// ---------------------------------------------------------------------
// Internal helpers · evidence requirements
// ---------------------------------------------------------------------

function composeEvidenceRequirements(
  gate: CanonicalGate,
): ReadonlyArray<PhaseGateEvidenceRequirement> {
  const out: PhaseGateEvidenceRequirement[] = [];
  switch (gate.index) {
    case 1:
      out.push({
        id: `evidence:g1:charter-signature`,
        label: 'Executive sponsor charter signature',
        reason:
          'G1 audit requires a captured signature event; honest default until charter capture lands.',
        kind: 'charter_signature',
        evidenceRegistryWired: false,
      });
      break;
    case 2:
      out.push({
        id: `evidence:g2:cxo-interview-capture`,
        label: 'CXO interview capture record',
        reason:
          'G2 audit requires CXO interview capture before findings publish; honest default until interview capture lands.',
        kind: 'cxo_interview_capture',
        evidenceRegistryWired: false,
      });
      break;
    case 3:
      out.push({
        id: `evidence:g3:projected-value`,
        label: 'Projected value documentation per workstream',
        reason:
          'G3 audit requires projected-value capture with a confidence band; the value registry is not seeded today.',
        kind: 'projected_value_capture',
        evidenceRegistryWired: false,
      });
      out.push({
        id: `evidence:g3:design-signoff`,
        label: 'Design pack signoff record',
        reason:
          'G3 audit requires a design pack signoff event; honest default until design signoff capture lands.',
        kind: 'design_signoff',
        evidenceRegistryWired: false,
      });
      break;
    case 4:
      out.push({
        id: `evidence:g4:realized-value`,
        label: 'Realized value measurement after Verify phase',
        reason:
          'G4 audit requires realized-value measurement and CXO verification; the measurement registry is not seeded today.',
        kind: 'realized_value_capture',
        evidenceRegistryWired: false,
      });
      break;
  }
  return out;
}

// ---------------------------------------------------------------------
// Internal helpers · audit requirement
// ---------------------------------------------------------------------

function composeAuditRequirement(
  gate: CanonicalGate,
  gateEntry: CanonicalHardGateEntry | null,
): PhaseGateAuditRequirement {
  const events = [...REQUIRED_AUDIT_EVENTS_BASE];
  // Waiver event is added when the gate is at blocked status — the
  // production state machine would record a waiver invocation if
  // advancement proceeds via that path.
  if (gateEntry && gateEntry.status === 'blocked') {
    events.push('waiver_path_invoked');
  }
  return {
    requiredAuditEvents: events,
    signoffRole: 'steward',
    reason: `G${gate.index}: ${gate.label} — production audit log would record proposal, evaluation, signoff, and evidence attachment events.`,
    auditLogWired: false,
  };
}

// ---------------------------------------------------------------------
// Internal helpers · advancement status classification
// ---------------------------------------------------------------------

interface ClassifyInputs {
  program: ProgramSeedPlan;
  phase: CanonicalPhase;
  gate: CanonicalGate;
  gateEntry: CanonicalHardGateEntry | null;
  stewardReadiness: PhaseGateAdvancementProposal['stewardReadiness'];
  missingInputs: ReadonlyArray<PhaseGateMissingInput>;
}

function classifyAdvancementStatus(
  inputs: ClassifyInputs,
): PhaseGateAdvancementStatus {
  const { program, phase, gate, gateEntry, stewardReadiness, missingInputs } =
    inputs;
  void phase;

  const programIndex = mapSpecPhaseToCanonicalIndex(program.currentPhaseSpec);
  const currentPhase = getCurrentCanonicalPhase(program);
  void currentPhase;

  const gatePhaseIndex = CANONICAL_SIX_PHASES.find(
    (p) => p.key === gate.exitsPhase,
  )!.index;

  const blockingMissing = missingInputs.filter((m) => m.blocking);
  const nonBlockingMissing = missingInputs.filter((m) => !m.blocking);

  // Case 1: Gate sits behind the program's canonical phase. The
  // gate-strip classifier marks this `informational` with
  // `isPassed: true`. Missing inputs at a passed gate are honestly
  // historical (production audit log would have captured them at
  // the time); the classifier surfaces:
  //   - `requires_review` defensively if the seed surfaces blocking
  //     signals even at a passed gate.
  //   - `ready` when the gate is *deeply* behind the program (≥ 2
  //     canonical phases past) — the gap is large enough that the
  //     deterministic readiness signal dominates the historical
  //     reconstruction gap.
  //   - `partially_ready` when the gate is recently passed (1
  //     phase behind) and historical gaps remain.
  //   - `ready` when no historical gaps remain at all.
  if (programIndex > gatePhaseIndex) {
    if (stewardReadiness.blockingCount > 0) {
      return 'requires_review';
    }
    const phaseGap = programIndex - gatePhaseIndex;
    if (phaseGap >= 2 && stewardReadiness.readyCount >= 1) {
      return 'ready';
    }
    if (nonBlockingMissing.length > 0) {
      return 'partially_ready';
    }
    if (stewardReadiness.readyCount >= 1) {
      return 'ready';
    }
    return 'requires_review';
  }

  // Case 2: Gate sits ahead of the program's canonical phase. The
  // gate-strip classifier marks this `not_wired`. Forward-looking
  // proposals fall through to honest defaults:
  //   - Blocking missing inputs → `blocked` (waiver path does NOT
  //     apply because the gate is not yet the program's current
  //     exit; the production state machine would resolve when the
  //     program reaches the gate phase).
  //   - Only non-blocking gaps → `partially_ready`.
  //   - No missing inputs at all → `requires_review` (honest:
  //     cannot say ready when the gate is still ahead of the
  //     program's canonical phase).
  if (programIndex < gatePhaseIndex) {
    if (blockingMissing.length > 0) {
      return 'blocked';
    }
    if (nonBlockingMissing.length > 0) {
      return 'partially_ready';
    }
    return 'requires_review';
  }

  // Case 3: Gate exit phase === program canonical phase. The gate
  // is the program's current canonical exit gate.

  // Gate-strip-classified `blocked` → waiver path is the honest
  // production option (the gate is the program's current exit).
  if (gateEntry && gateEntry.status === 'blocked') {
    return 'requires_waiver';
  }

  // Any blocking missing input at the current gate → waiver path,
  // because the production state machine would require either
  // resolution or waiver invocation to advance.
  if (blockingMissing.length > 0) {
    return 'requires_waiver';
  }

  // No blocking inputs but at least one non-blocking missing input
  // → partially_ready.
  if (nonBlockingMissing.length > 0 && stewardReadiness.blockingCount === 0) {
    return 'partially_ready';
  }

  // No missing inputs at all and at least one ready signal → ready.
  if (missingInputs.length === 0 && stewardReadiness.readyCount >= 1) {
    return 'ready';
  }

  // Honest default: needs review.
  return 'requires_review';
}

// ---------------------------------------------------------------------
// Internal helpers · waiver path
// ---------------------------------------------------------------------

function composeWaiverPathReason(
  gate: CanonicalGate,
  gateEntry: CanonicalHardGateEntry | null,
): string {
  const base = `G${gate.index}: ${gate.label} — waiver path is the honest production option once persistence + auth slices land.`;
  if (gateEntry?.blockedTransitionReason) {
    return `${base} ${gateEntry.blockedTransitionReason}`;
  }
  return `${base} ${HONEST_FALLBACK_REASON}`;
}

// ---------------------------------------------------------------------
// Internal helpers · recommended next action
// ---------------------------------------------------------------------

interface NextActionInputs {
  program: ProgramSeedPlan;
  gate: CanonicalGate;
  advancementStatus: PhaseGateAdvancementStatus;
  missingInputs: ReadonlyArray<PhaseGateMissingInput>;
  gateEntry: CanonicalHardGateEntry | null;
}

function composeRecommendedNextAction(
  inputs: NextActionInputs,
): PhaseGateRecommendedNextAction {
  const { program, gate, advancementStatus, missingInputs } = inputs;
  switch (advancementStatus) {
    case 'ready':
      return {
        label: `Request Steward signoff on G${gate.index}`,
        routePath: program.routePath,
        reason: `G${gate.index} is ready per the deterministic readiness summary; signoff persistence remains deferred.`,
        kind: 'request_steward_signoff',
      };
    case 'partially_ready': {
      const firstMissing = missingInputs[0];
      return {
        label: firstMissing
          ? `Capture: ${firstMissing.label}`
          : `Review G${gate.index} readiness gaps`,
        routePath: program.routePath,
        reason: firstMissing
          ? firstMissing.reason
          : 'Non-blocking gaps remain; close before requesting signoff.',
        kind: 'capture_missing_input',
      };
    }
    case 'blocked': {
      const firstBlocking =
        missingInputs.find((m) => m.blocking) ?? missingInputs[0];
      return {
        label: firstBlocking
          ? `Resolve blocker: ${firstBlocking.label}`
          : `Resolve G${gate.index} blocker`,
        routePath: program.routePath,
        reason: firstBlocking
          ? firstBlocking.reason
          : HONEST_FALLBACK_REASON,
        kind: 'resolve_blocker',
      };
    }
    case 'requires_waiver':
      return {
        label: `Invoke waiver path for G${gate.index}`,
        routePath: program.routePath,
        reason: `G${gate.index} is at the program's current canonical exit; waiver path is the honest production option once persistence + auth slices land.`,
        kind: 'invoke_waiver_path',
      };
    case 'requires_review':
      return {
        label: `Review G${gate.index} readiness`,
        routePath: program.routePath,
        reason: HONEST_FALLBACK_REASON,
        kind: 'review_gate_readiness',
      };
  }
}
