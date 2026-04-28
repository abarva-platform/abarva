// PROG7 · Program Resume State Read Model.
//
// Pure deterministic projection of (tenant, program) seed state into a
// per-program resume-state record the Maestro Workshop Mode shell, the
// Programs canonical detail surface, and the Atlas executive readout
// can use to answer the question: "If I closed this program last
// session, where do I pick up?"
//
// This module operationalizes the save / stop / resume lifecycle named
// in the PF2 Program Phase Workspace contract and the MW1 Maestro
// Workshop Intelligence contract WITHOUT persisting state. Resume
// state is derived from the deterministic program / workshop / notes
// seed alone.
//
// What this module deliberately does NOT do:
//   - No DB writes, no migrations, no persistence layer.
//   - No model invocation. No live clocks. No randomness. No network IO.
//   - No timestamps. State is described by structured labels (e.g.,
//     `'workshop_session'`, `'pending'`, `'unknown'`) — never by a
//     fabricated date or duration.
//   - No fake "completed" decisions or fake gate transitions. Items
//     the seed cannot derive surface as `status: 'unknown'` with an
//     explicit reason.
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
  CANONICAL_SIX_PHASES,
  getCurrentCanonicalPhase,
  mapSpecPhaseToCanonicalIndex,
  type CanonicalPhase,
  type CanonicalHardGateEntry,
} from '@/lib/programs/programs-canonical-view';
import {
  buildNextRecommendedWorkshop,
  buildWorkshopReadinessForProgram,
  type WorkshopReadiness,
  type WorkshopType,
} from '@/lib/programs/workshop-readiness';
import {
  buildMeetingNoteCaptureSeed,
  deriveEvidenceCandidatesFromMeetingNotes,
  synthesizeMeetingNotes,
  type MeetingNoteCapture,
} from '@/lib/programs/meeting-notes-capture';
import type {
  DeliverableSeedPlan,
  ProgramSeedPlan,
  TenantSeedPlan,
} from '@/lib/programs/enhancement-seed-planner';

// ---------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------

/**
 * Confidence band the renderer can show next to the resume card. Pure
 * label — never a percentile, never a probability. Determined from
 * deterministic seed alone (presence of phase, current workshop,
 * captured notes) so re-renders are identical.
 */
export type ProgramResumeConfidence = 'low' | 'medium' | 'high';

/**
 * The kinds of in-flight items a resume state can name. Each kind has
 * a structured shape under `ProgramResumeOpenItem`.
 */
export type ProgramResumeOpenItemKind =
  | 'open_action'
  | 'open_question'
  | 'evidence_gap'
  | 'pending_gate_check'
  | 'draft_deliverable';

/**
 * A single explicit open item the program is carrying into resume.
 * `status` is `'unknown'` when the seed cannot derive it; the renderer
 * shows that honestly rather than fabricating progress.
 */
export interface ProgramResumeOpenItem {
  id: string;
  kind: ProgramResumeOpenItemKind;
  description: string;
  /**
   * Structured status label. Never a date. `'unknown'` is the honest
   * default when the seed cannot say more.
   */
  status: 'open' | 'in_progress' | 'blocked' | 'unknown';
  /**
   * Short single-line reason the renderer can show next to the row.
   * Always a structured prose label drawn from seed; never fabricated.
   */
  reason: string;
}

/**
 * The most recently active workshop the program was in, derived from
 * the deterministic next-recommended-workshop helper. Carries the
 * workshop type label and the canonical hard gate it touches so the
 * renderer can show the user where they were.
 */
export interface ProgramResumeCheckpoint {
  workshopType: WorkshopType;
  workshopTitle: string;
  workshopId: string;
  tiesToPhaseSpec: number;
  tiesToGate: 'G1' | 'G2' | 'G3' | 'G4' | null;
}

/**
 * The single most recently viewed artifact reference the renderer can
 * link back to. Pure — derived from the program's deliverables roster.
 * `null` when no deliverable is suitable (e.g., empty seed).
 */
export interface ProgramResumeRecommendation {
  label: string;
  routePath: string;
  reason: string;
}

/**
 * Source attribution for the resume state. Always
 * `'deterministic_program_seed'` so downstream surfaces can tell the
 * record was not produced by a live save/resume runtime.
 */
export type ProgramResumeSource = 'deterministic_program_seed';

/**
 * The resume state for a single program. All fields are derived from
 * deterministic seed; the structure mirrors the save / stop / resume
 * lifecycle named in PF2 + MW1 without inventing the runtime that
 * produces it.
 */
export interface ProgramResumeState {
  id: string;
  tenantKey: string;
  tenantName: string;
  programCode: string;
  programSlug: string;
  programName: string;

  /**
   * The canonical phase the program was last sitting in. Always
   * non-null because every seeded program maps onto canonical 2..6.
   */
  lastActivePhase: CanonicalPhase;

  /**
   * The most recently active workshop checkpoint (from the
   * next-recommended-workshop helper). `null` only when the program
   * produces no workshop readiness records.
   */
  lastActiveWorkshop: ProgramResumeCheckpoint | null;

  /**
   * The most recently viewed artifact the user can re-open. `null`
   * when the program has no deliverables.
   */
  lastViewedArtifact: ProgramResumeRecommendation | null;

  /**
   * Open action items, open questions, unresolved evidence gaps,
   * pending gate checks, and draft deliverables — flattened into a
   * single list of typed open items so the renderer can show them in
   * one column.
   */
  openActions: ReadonlyArray<ProgramResumeOpenItem>;
  openQuestions: ReadonlyArray<ProgramResumeOpenItem>;
  unresolvedEvidenceGaps: ReadonlyArray<ProgramResumeOpenItem>;
  pendingGateChecks: ReadonlyArray<ProgramResumeOpenItem>;
  draftDeliverables: ReadonlyArray<ProgramResumeOpenItem>;

  /**
   * The single deterministic next action label the renderer surfaces
   * as the primary CTA. Always non-empty.
   */
  nextRecommendedAction: ProgramResumeRecommendation;

  /**
   * Confidence band the renderer can show next to the resume card.
   * Computed from deterministic seed signal density alone.
   */
  resumeConfidence: ProgramResumeConfidence;

  createdFrom: ProgramResumeSource;
}

/**
 * Aggregate roll-up across many programs, suitable for the Atlas
 * executive readout of "where do we resume across the portfolio".
 */
export interface ProgramResumeSummary {
  totalCount: number;
  byConfidence: Record<ProgramResumeConfidence, number>;
  totalOpenActions: number;
  totalOpenQuestions: number;
  totalUnresolvedEvidenceGaps: number;
  totalPendingGateChecks: number;
  totalDraftDeliverables: number;
  perTenant: ReadonlyArray<{
    tenantKey: string;
    tenantName: string;
    count: number;
  }>;
}

// ---------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------

const CREATED_FROM: ProgramResumeSource = 'deterministic_program_seed';

const HONEST_FALLBACK_REASON =
  'Derived from deterministic program seed; live save/resume runtime is not wired.';

// ---------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------

/**
 * Build the deterministic resume-state record for a single program.
 * Pure: same input → identical output across calls.
 */
export function buildProgramResumeState(
  tenant: TenantSeedPlan,
  program: ProgramSeedPlan,
): ProgramResumeState {
  // Touch downstream read models so any contract drift surfaces here.
  const readinessSummary = buildProgramReadinessSummary(program);
  const stewardNote = buildStewardReadinessNote(program);
  const phaseTimeline = buildCanonicalPhaseTimeline(program);
  const gateStrip = buildCanonicalHardGateStrip(program);
  void phaseTimeline;

  const lastActivePhase = resolveLastActivePhase(program);
  const workshops = buildWorkshopReadinessForProgram(tenant, program);
  const recommendedWorkshop = buildNextRecommendedWorkshop(tenant, program);
  const lastActiveWorkshop = composeCheckpoint(recommendedWorkshop);
  const lastViewedArtifact = composeLastViewedArtifact(program);
  const notes = composeNotesAcrossWorkshops(program, workshops);
  const synthesis = synthesizeMeetingNotes(notes);
  const evidenceCandidates = deriveEvidenceCandidatesFromMeetingNotes(notes);

  const openActions = composeOpenActions(program, synthesis);
  const openQuestions = composeOpenQuestions(program, synthesis);
  const unresolvedEvidenceGaps = composeUnresolvedEvidenceGaps(
    program,
    evidenceCandidates,
    readinessSummary,
  );
  const pendingGateChecks = composePendingGateChecks(program, gateStrip);
  const draftDeliverables = composeDraftDeliverables(program);

  const nextRecommendedAction = composeNextRecommendedAction(
    program,
    recommendedWorkshop,
    pendingGateChecks,
    draftDeliverables,
  );

  const resumeConfidence = scoreResumeConfidence({
    hasWorkshop: lastActiveWorkshop !== null,
    hasArtifact: lastViewedArtifact !== null,
    openActionCount: openActions.length,
    openQuestionCount: openQuestions.length,
    evidenceGapCount: unresolvedEvidenceGaps.length,
    pendingGateCount: pendingGateChecks.length,
    draftDeliverableCount: draftDeliverables.length,
    stewardReadyCount: stewardNote.ready.length,
  });

  const id = `prog-resume:${tenant.tenantKey}:${program.programSlug}`;

  return {
    id,
    tenantKey: tenant.tenantKey,
    tenantName: tenant.displayName,
    programCode: program.code,
    programSlug: program.programSlug,
    programName: program.name,
    lastActivePhase,
    lastActiveWorkshop,
    lastViewedArtifact,
    openActions,
    openQuestions,
    unresolvedEvidenceGaps,
    pendingGateChecks,
    draftDeliverables,
    nextRecommendedAction,
    resumeConfidence,
    createdFrom: CREATED_FROM,
  };
}

/**
 * Build resume-state records for every (tenant, program) pair in the
 * supplied seed plan. Pure.
 */
export function buildAllProgramResumeStates(
  tenants: ReadonlyArray<TenantSeedPlan>,
): ReadonlyArray<ProgramResumeState> {
  const out: ProgramResumeState[] = [];
  for (const tenant of tenants) {
    for (const program of tenant.programs) {
      out.push(buildProgramResumeState(tenant, program));
    }
  }
  return out;
}

/**
 * Aggregate counts across a list of resume states. Pure.
 */
export function summarizeProgramResumeState(
  states: ReadonlyArray<ProgramResumeState>,
): ProgramResumeSummary {
  const byConfidence: Record<ProgramResumeConfidence, number> = {
    low: 0,
    medium: 0,
    high: 0,
  };
  let totalOpenActions = 0;
  let totalOpenQuestions = 0;
  let totalUnresolvedEvidenceGaps = 0;
  let totalPendingGateChecks = 0;
  let totalDraftDeliverables = 0;
  const perTenantMap = new Map<
    string,
    { tenantKey: string; tenantName: string; count: number }
  >();
  for (const state of states) {
    byConfidence[state.resumeConfidence] += 1;
    totalOpenActions += state.openActions.length;
    totalOpenQuestions += state.openQuestions.length;
    totalUnresolvedEvidenceGaps += state.unresolvedEvidenceGaps.length;
    totalPendingGateChecks += state.pendingGateChecks.length;
    totalDraftDeliverables += state.draftDeliverables.length;
    const existing = perTenantMap.get(state.tenantKey);
    if (existing) {
      existing.count += 1;
    } else {
      perTenantMap.set(state.tenantKey, {
        tenantKey: state.tenantKey,
        tenantName: state.tenantName,
        count: 1,
      });
    }
  }
  const perTenant = Array.from(perTenantMap.values()).sort((a, b) =>
    a.tenantKey.localeCompare(b.tenantKey),
  );
  return {
    totalCount: states.length,
    byConfidence,
    totalOpenActions,
    totalOpenQuestions,
    totalUnresolvedEvidenceGaps,
    totalPendingGateChecks,
    totalDraftDeliverables,
    perTenant,
  };
}

/**
 * Return the single deterministic next action label for a resume
 * state. Convenience helper so the renderer doesn't have to reach
 * into the `nextRecommendedAction.label` field.
 */
export function getNextResumeAction(state: ProgramResumeState): string {
  return state.nextRecommendedAction.label;
}

/**
 * Return the union of every blocked open item across the resume state.
 * `blocked` is a sub-state of the `'blocked'` status; `'unknown'` is
 * NOT promoted to blocked because the seed honestly cannot say.
 */
export function getBlockedResumeItems(
  state: ProgramResumeState,
): ReadonlyArray<ProgramResumeOpenItem> {
  const all: ProgramResumeOpenItem[] = [
    ...state.openActions,
    ...state.openQuestions,
    ...state.unresolvedEvidenceGaps,
    ...state.pendingGateChecks,
    ...state.draftDeliverables,
  ];
  return all.filter((item) => item.status === 'blocked');
}

// ---------------------------------------------------------------------
// Internal helpers · phase + checkpoint + artifact
// ---------------------------------------------------------------------

function resolveLastActivePhase(program: ProgramSeedPlan): CanonicalPhase {
  const phase = getCurrentCanonicalPhase(program);
  if (phase) return phase;
  // Defensive fallback. The seed always maps onto canonical 2..6.
  const idx = mapSpecPhaseToCanonicalIndex(program.currentPhaseSpec);
  return CANONICAL_SIX_PHASES[idx - 1];
}

function composeCheckpoint(
  recommended: WorkshopReadiness | null,
): ProgramResumeCheckpoint | null {
  if (!recommended) return null;
  return {
    workshopType: recommended.type,
    workshopTitle: recommended.title,
    workshopId: recommended.id,
    tiesToPhaseSpec: recommended.objective.ties_to_phase_spec,
    tiesToGate: recommended.objective.ties_to_gate ?? null,
  };
}

function composeLastViewedArtifact(
  program: ProgramSeedPlan,
): ProgramResumeRecommendation | null {
  const candidate = pickResumeArtifact(program);
  if (!candidate) return null;
  return {
    label: `${candidate.deliverableCode} · ${candidate.title}`,
    routePath: candidate.routePath,
    reason: composeArtifactReason(candidate),
  };
}

/**
 * Pick the deliverable a Maestro is most likely to re-open on resume.
 * Deterministic: prefers a required deliverable in the program's
 * current phase at non-stub fidelity, then any deliverable in the
 * current phase, then the first deliverable by phase + code.
 */
function pickResumeArtifact(
  program: ProgramSeedPlan,
): DeliverableSeedPlan | null {
  if (program.deliverables.length === 0) return null;
  const phase = program.currentPhaseSpec;
  const sorted = [...program.deliverables].sort((a, b) => {
    if (a.phaseSpec !== b.phaseSpec) return a.phaseSpec - b.phaseSpec;
    return a.deliverableCode.localeCompare(b.deliverableCode);
  });
  // Pass 1: required + current phase + non-stub.
  for (const d of sorted) {
    if (
      d.phaseSpec === phase &&
      d.requirement === 'required' &&
      d.renderTier !== 'stub'
    ) {
      return d;
    }
  }
  // Pass 2: current phase, any requirement.
  for (const d of sorted) {
    if (d.phaseSpec === phase) return d;
  }
  // Pass 3: first deliverable in canonical order.
  return sorted[0] ?? null;
}

function composeArtifactReason(d: DeliverableSeedPlan): string {
  const tier = d.renderTier;
  const requirement = d.requirement;
  return `Phase ${d.phaseSpec} ${requirement} deliverable at ${tier} fidelity; opened from canonical seed.`;
}

// ---------------------------------------------------------------------
// Internal helpers · notes synthesis bridge
// ---------------------------------------------------------------------

/**
 * Compose the deterministic notes set the resume state derives open
 * actions and questions from. Uses the workshop readiness list so
 * every workshop the program is poised for contributes its seed
 * notes.
 */
function composeNotesAcrossWorkshops(
  program: ProgramSeedPlan,
  workshops: ReadonlyArray<WorkshopReadiness>,
): ReadonlyArray<MeetingNoteCapture> {
  const notes: MeetingNoteCapture[] = [];
  for (const ws of workshops) {
    const seed = buildMeetingNoteCaptureSeed(program.programSlug, ws.type);
    for (const note of seed) notes.push(note);
  }
  return notes;
}

// ---------------------------------------------------------------------
// Internal helpers · open items
// ---------------------------------------------------------------------

function composeOpenActions(
  program: ProgramSeedPlan,
  synthesis: ReturnType<typeof synthesizeMeetingNotes>,
): ReadonlyArray<ProgramResumeOpenItem> {
  const out: ProgramResumeOpenItem[] = [];
  for (const action of synthesis.topActionItems) {
    out.push({
      id: `${program.programSlug}:open-action:${action.id}`,
      kind: 'open_action',
      description: action.description,
      status: action.state === 'in_progress' ? 'in_progress' : 'open',
      reason: `Owner role: ${action.ownerRole}; due-by label: ${action.dueByLabel}.`,
    });
  }
  return out;
}

function composeOpenQuestions(
  program: ProgramSeedPlan,
  synthesis: ReturnType<typeof synthesizeMeetingNotes>,
): ReadonlyArray<ProgramResumeOpenItem> {
  const out: ProgramResumeOpenItem[] = [];
  for (const question of synthesis.unresolvedQuestions) {
    const blocks = question.blocks ?? 'none';
    const status: ProgramResumeOpenItem['status'] =
      blocks === 'none' ? 'open' : 'blocked';
    out.push({
      id: `${program.programSlug}:open-question:${question.id}`,
      kind: 'open_question',
      description: question.question,
      status,
      reason:
        blocks === 'none'
          ? 'Open question; no downstream block recorded in seed.'
          : `Blocks ${blocks.replace(/_/g, ' ')} per workshop seed.`,
    });
  }
  return out;
}

function composeUnresolvedEvidenceGaps(
  program: ProgramSeedPlan,
  evidenceCandidates: ReadonlyArray<{
    id: string;
    description: string;
    needsCapture: boolean;
    sourceLabel: string;
  }>,
  readinessSummary: ReturnType<typeof buildProgramReadinessSummary>,
): ReadonlyArray<ProgramResumeOpenItem> {
  const out: ProgramResumeOpenItem[] = [];
  for (const evidence of evidenceCandidates) {
    if (!evidence.needsCapture) continue;
    out.push({
      id: `${program.programSlug}:evidence-gap:${evidence.id}`,
      kind: 'evidence_gap',
      description: evidence.description,
      status: 'open',
      reason: `Source: ${evidence.sourceLabel}; needs documented capture before next session.`,
    });
  }
  // Add a single explicit "registry not seeded" item when the
  // readiness summary classifies evidence as `not_seeded`. This is the
  // honest signal the seed cannot derive more.
  if (readinessSummary.evidence.signal === 'not_seeded') {
    out.push({
      id: `${program.programSlug}:evidence-gap:registry-not-seeded`,
      kind: 'evidence_gap',
      description: 'Evidence registry is not captured in the program seed.',
      status: 'unknown',
      reason: HONEST_FALLBACK_REASON,
    });
  }
  return out;
}

function composePendingGateChecks(
  program: ProgramSeedPlan,
  gateStrip: ReadonlyArray<CanonicalHardGateEntry>,
): ReadonlyArray<ProgramResumeOpenItem> {
  const out: ProgramResumeOpenItem[] = [];
  for (const entry of gateStrip) {
    if (entry.status === 'missing_inputs' || entry.status === 'blocked') {
      out.push({
        id: `${program.programSlug}:gate-check:G${entry.gate.index}`,
        kind: 'pending_gate_check',
        description: `G${entry.gate.index}: ${entry.gate.label}`,
        status: 'blocked',
        reason: entry.blockedTransitionReason ?? HONEST_FALLBACK_REASON,
      });
    } else if (entry.status === 'not_wired' && !entry.isPassed) {
      // The gate is ahead of the program's current phase. The
      // production state machine would govern it later; today we
      // surface it as an unknown pending check so the resume
      // renderer can show the user what is still ahead.
      out.push({
        id: `${program.programSlug}:gate-check:G${entry.gate.index}`,
        kind: 'pending_gate_check',
        description: `G${entry.gate.index}: ${entry.gate.label}`,
        status: 'unknown',
        reason: 'Production gate state machine is not wired; status cannot be derived from seed.',
      });
    }
  }
  return out;
}

function composeDraftDeliverables(
  program: ProgramSeedPlan,
): ReadonlyArray<ProgramResumeOpenItem> {
  const out: ProgramResumeOpenItem[] = [];
  const drafts = program.deliverables.filter((d) => d.status === 'draft');
  // Stable order: by phase, then by code.
  drafts.sort((a, b) => {
    if (a.phaseSpec !== b.phaseSpec) return a.phaseSpec - b.phaseSpec;
    return a.deliverableCode.localeCompare(b.deliverableCode);
  });
  for (const d of drafts) {
    out.push({
      id: `${program.programSlug}:draft:${d.instanceKey}`,
      kind: 'draft_deliverable',
      description: `${d.deliverableCode} · ${d.title}`,
      status: d.lifecycleState === 'completed_or_current' ? 'in_progress' : 'open',
      reason: `Phase ${d.phaseSpec} ${d.requirement} deliverable at ${d.renderTier} fidelity; lifecycle ${d.lifecycleState}.`,
    });
  }
  return out;
}

// ---------------------------------------------------------------------
// Internal helpers · next recommended action
// ---------------------------------------------------------------------

function composeNextRecommendedAction(
  program: ProgramSeedPlan,
  recommendedWorkshop: WorkshopReadiness | null,
  pendingGateChecks: ReadonlyArray<ProgramResumeOpenItem>,
  draftDeliverables: ReadonlyArray<ProgramResumeOpenItem>,
): ProgramResumeRecommendation {
  // Priority 1: a pending gate check that is `blocked` — surface the
  // gate workshop link.
  const blockedGate = pendingGateChecks.find((g) => g.status === 'blocked');
  if (blockedGate && recommendedWorkshop) {
    return {
      label: `Resume ${recommendedWorkshop.title} to unblock ${blockedGate.description.split(':')[0]}`,
      routePath: program.routePath,
      reason: blockedGate.reason,
    };
  }
  // Priority 2: the next recommended workshop (always present for
  // active programs).
  if (recommendedWorkshop) {
    return {
      label: `Resume ${recommendedWorkshop.title}`,
      routePath: program.routePath,
      reason: recommendedWorkshop.stewardGateImplication,
    };
  }
  // Priority 3: a draft deliverable — open the canvas.
  const firstDraft = draftDeliverables[0];
  if (firstDraft) {
    return {
      label: `Open the draft deliverable: ${firstDraft.description}`,
      routePath: program.routePath,
      reason: firstDraft.reason,
    };
  }
  // Honest fallback: open the program detail page.
  return {
    label: `Open ${program.code} program detail`,
    routePath: program.routePath,
    reason: HONEST_FALLBACK_REASON,
  };
}

// ---------------------------------------------------------------------
// Internal helpers · confidence scoring
// ---------------------------------------------------------------------

interface ConfidenceInputs {
  hasWorkshop: boolean;
  hasArtifact: boolean;
  openActionCount: number;
  openQuestionCount: number;
  evidenceGapCount: number;
  pendingGateCount: number;
  draftDeliverableCount: number;
  stewardReadyCount: number;
}

/**
 * Score the resume confidence from deterministic seed signals. No
 * randomness, no time, no probability — pure rule:
 *
 * - high: workshop + artifact + ≥1 open action + steward signals exist.
 * - low: no workshop OR no artifact AND no open actions.
 * - medium: everything else.
 */
function scoreResumeConfidence(
  inputs: ConfidenceInputs,
): ProgramResumeConfidence {
  if (
    inputs.hasWorkshop &&
    inputs.hasArtifact &&
    inputs.openActionCount >= 1 &&
    inputs.stewardReadyCount >= 1
  ) {
    return 'high';
  }
  if (
    !inputs.hasWorkshop ||
    (!inputs.hasArtifact && inputs.openActionCount === 0)
  ) {
    return 'low';
  }
  return 'medium';
}
