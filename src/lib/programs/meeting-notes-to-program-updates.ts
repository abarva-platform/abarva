// MW5 · Meeting Notes → Program State Updates Read Model.
//
// Pure deterministic read model that turns structured MW4 meeting note
// captures into proposed program-state updates. Operationalizes the
// MW1 Maestro Workshop Intelligence Contract section F (after-workshop
// synthesis) and section J (dynamic deliverable refinement loop).
//
// What this module does:
//   - Defines the proposal types for program state, actions, risks,
//     open questions, evidence candidates, deliverable update hints,
//     and gate readiness impacts.
//   - Translates a list of MeetingNoteCapture records into a flat list
//     of ProgramUpdateProposal rows.
//   - Tags every proposal with its source workshop + note id and marks
//     it `proposed` (never `applied`).
//   - Synthesizes the proposals into a deterministic counts summary.
//
// What this module deliberately does NOT do:
//   - No model invocation. No live clocks, randomness, or network IO.
//   - No persistence. No database, supabase, or auth dependencies.
//   - No DB writes. No state mutation. No phase advance / gate signoff.
//   - No imports from the Source UI, Sentinel, Atlas, Nexus, Agent, or
//     auth runtime modules.
//
// Read-only references to the MW4 meeting-notes-capture module are
// allowed; this module imports the canonical capture types so the
// proposal shape stays reconciled with MW4.

import type {
  MeetingActionItem,
  MeetingEvidenceCandidate,
  MeetingNoteCapture,
  MeetingOpenQuestion,
  MeetingRisk,
  MeetingStakeholderAlignment,
} from '@/lib/programs/meeting-notes-capture';

// ---------------------------------------------------------------------
// Public proposal-type union
// ---------------------------------------------------------------------

export const PROGRAM_UPDATE_PROPOSAL_TYPES = [
  'action_proposal',
  'risk_proposal',
  'open_question_proposal',
  'evidence_candidate_proposal',
  'deliverable_update_proposal',
  'gate_impact_proposal',
] as const;

export type ProgramUpdateProposalType =
  (typeof PROGRAM_UPDATE_PROPOSAL_TYPES)[number];

// Proposals are always read-only suggestions surfaced for the Maestro
// to confirm. They are never applied automatically by this module.
export type ProgramUpdateProposalStatus = 'proposed';

// ---------------------------------------------------------------------
// Source attribution
// ---------------------------------------------------------------------

/**
 * Provenance for every proposal. Ties the proposal back to the source
 * note + workshop so the caller can show the Maestro "this came from
 * note X in workshop Y".
 */
export interface ProgramUpdateSource {
  programKey: string;
  workshopType: string;
  workshopOrdinal: number;
  noteId: string;
}

// ---------------------------------------------------------------------
// Proposal shapes
// ---------------------------------------------------------------------

export interface ProgramActionProposal {
  id: string;
  proposalType: 'action_proposal';
  status: ProgramUpdateProposalStatus;
  source: ProgramUpdateSource;
  description: string;
  ownerRole: string;
  dueByLabel: MeetingActionItem['dueByLabel'];
  initialState: MeetingActionItem['state'];
  rationale: string;
  createdFrom: 'deterministic_meeting_notes_seed';
}

export interface ProgramRiskProposal {
  id: string;
  proposalType: 'risk_proposal';
  status: ProgramUpdateProposalStatus;
  source: ProgramUpdateSource;
  description: string;
  likelihood: MeetingRisk['likelihood'];
  impact: MeetingRisk['impact'];
  ownerRole?: string;
  mitigation?: string;
  rationale: string;
  createdFrom: 'deterministic_meeting_notes_seed';
}

export interface ProgramOpenQuestionProposal {
  id: string;
  proposalType: 'open_question_proposal';
  status: ProgramUpdateProposalStatus;
  source: ProgramUpdateSource;
  question: string;
  blocks: NonNullable<MeetingOpenQuestion['blocks']>;
  routingHint?: string;
  rationale: string;
  createdFrom: 'deterministic_meeting_notes_seed';
}

export interface ProgramEvidenceCandidateProposal {
  id: string;
  proposalType: 'evidence_candidate_proposal';
  status: ProgramUpdateProposalStatus;
  source: ProgramUpdateSource;
  description: string;
  sourceLabel: MeetingEvidenceCandidate['sourceLabel'];
  needsCapture: boolean;
  linkedClaimHint?: string;
  rationale: string;
  createdFrom: 'deterministic_meeting_notes_seed';
}

export type DeliverableUpdateProposalKind =
  | 'draft_input_added'
  | 'review_feedback'
  | 'approval_blocked'
  | 'rework_required';

export interface ProgramDeliverableUpdateProposal {
  id: string;
  proposalType: 'deliverable_update_proposal';
  status: ProgramUpdateProposalStatus;
  source: ProgramUpdateSource;
  deliverableKey: string;
  updateKind: DeliverableUpdateProposalKind;
  rationale: string;
  createdFrom: 'deterministic_meeting_notes_seed';
}

export type GateImpactKind =
  | 'gate_readiness_at_risk'
  | 'gate_readiness_advanced'
  | 'gate_signoff_blocked'
  | 'gate_evidence_needed';

export interface ProgramGateImpactProposal {
  id: string;
  proposalType: 'gate_impact_proposal';
  status: ProgramUpdateProposalStatus;
  // Gate impacts are advisory only: the Maestro decides whether to
  // surface them in the gate-readiness review.
  advisory: true;
  source: ProgramUpdateSource;
  gate: 'G1' | 'G2' | 'G3' | 'G4';
  impactKind: GateImpactKind;
  rationale: string;
  createdFrom: 'deterministic_meeting_notes_seed';
}

// ---------------------------------------------------------------------
// Discriminated union
// ---------------------------------------------------------------------

export type ProgramUpdateProposal =
  | ProgramActionProposal
  | ProgramRiskProposal
  | ProgramOpenQuestionProposal
  | ProgramEvidenceCandidateProposal
  | ProgramDeliverableUpdateProposal
  | ProgramGateImpactProposal;

// ---------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------

export interface MeetingNotesProgramUpdateSummary {
  totalProposals: number;
  byType: Record<ProgramUpdateProposalType, number>;
  actionProposals: number;
  riskProposals: number;
  openQuestionProposals: number;
  evidenceCandidateProposals: number;
  deliverableUpdateProposals: number;
  gateImpactProposals: number;
  // Proposals are never auto-applied; this surface lets callers assert
  // the invariant explicitly.
  appliedProposals: 0;
}

// ---------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------

const ROLE_EXECUTIVE_SPONSOR = 'Executive Sponsor';

// ---------------------------------------------------------------------
// Public derivation helpers
// ---------------------------------------------------------------------

/**
 * Top-level entry point. Walks the captured notes and returns the
 * full list of proposed program-state updates in a deterministic
 * order: actions, risks, open questions, evidence candidates,
 * deliverable updates, gate impacts.
 *
 * Pure: same input list → identical output across calls.
 */
export function deriveProgramUpdatesFromMeetingNotesCapture(
  notes: readonly MeetingNoteCapture[],
): readonly ProgramUpdateProposal[] {
  const out: ProgramUpdateProposal[] = [];
  for (const proposal of deriveActionProposals(notes)) {
    out.push(proposal);
  }
  for (const proposal of deriveRiskProposals(notes)) {
    out.push(proposal);
  }
  for (const proposal of deriveOpenQuestionProposals(notes)) {
    out.push(proposal);
  }
  for (const proposal of deriveEvidenceCandidateProposals(notes)) {
    out.push(proposal);
  }
  for (const proposal of deriveDeliverableUpdateProposals(notes)) {
    out.push(proposal);
  }
  for (const proposal of deriveGateImpactProposals(notes)) {
    out.push(proposal);
  }
  return out;
}

/**
 * Derive one ProgramActionProposal per captured action item. Every
 * proposal preserves the source workshop + note id and starts in
 * `proposed` status. The original action's `state` is recorded as
 * `initialState` so the caller knows where the room left it.
 */
export function deriveActionProposals(
  notes: readonly MeetingNoteCapture[],
): readonly ProgramActionProposal[] {
  const out: ProgramActionProposal[] = [];
  for (const note of notes) {
    const source = buildSource(note);
    for (const action of note.actionItems) {
      out.push({
        id: `prop-action-${action.id}`,
        proposalType: 'action_proposal',
        status: 'proposed',
        source,
        description: action.description,
        ownerRole: action.ownerRole,
        dueByLabel: action.dueByLabel,
        initialState: action.state,
        rationale: composeActionRationale(note, action),
        createdFrom: 'deterministic_meeting_notes_seed',
      });
    }
  }
  return out;
}

/**
 * Derive one ProgramRiskProposal per captured risk. High-impact and
 * high-likelihood risks compose stronger rationale strings, but every
 * captured risk surfaces as a proposal.
 */
export function deriveRiskProposals(
  notes: readonly MeetingNoteCapture[],
): readonly ProgramRiskProposal[] {
  const out: ProgramRiskProposal[] = [];
  for (const note of notes) {
    const source = buildSource(note);
    for (const risk of note.risks) {
      out.push({
        id: `prop-risk-${risk.id}`,
        proposalType: 'risk_proposal',
        status: 'proposed',
        source,
        description: risk.description,
        likelihood: risk.likelihood,
        impact: risk.impact,
        ownerRole: risk.ownerRole,
        mitigation: risk.mitigation,
        rationale: composeRiskRationale(note, risk),
        createdFrom: 'deterministic_meeting_notes_seed',
      });
    }
  }
  return out;
}

/**
 * Derive one ProgramOpenQuestionProposal per captured open question
 * whose `blocks` flag is set and not `'none'`. Questions that block
 * nothing are read-only context, not proposed program updates.
 */
export function deriveOpenQuestionProposals(
  notes: readonly MeetingNoteCapture[],
): readonly ProgramOpenQuestionProposal[] {
  const out: ProgramOpenQuestionProposal[] = [];
  for (const note of notes) {
    const source = buildSource(note);
    for (const question of note.openQuestions) {
      if (!question.blocks || question.blocks === 'none') continue;
      out.push({
        id: `prop-question-${question.id}`,
        proposalType: 'open_question_proposal',
        status: 'proposed',
        source,
        question: question.question,
        blocks: question.blocks,
        routingHint: question.routingHint,
        rationale: composeOpenQuestionRationale(note, question),
        createdFrom: 'deterministic_meeting_notes_seed',
      });
    }
  }
  return out;
}

/**
 * Derive one ProgramEvidenceCandidateProposal per captured evidence
 * candidate. The `needsCapture` flag is preserved so downstream
 * surfaces can show the Maestro which evidence is verbal-only / on a
 * whiteboard and still needs explicit follow-up capture.
 */
export function deriveEvidenceCandidateProposals(
  notes: readonly MeetingNoteCapture[],
): readonly ProgramEvidenceCandidateProposal[] {
  const out: ProgramEvidenceCandidateProposal[] = [];
  for (const note of notes) {
    const source = buildSource(note);
    for (const evidence of note.evidenceCandidates) {
      out.push({
        id: `prop-evidence-${evidence.id}`,
        proposalType: 'evidence_candidate_proposal',
        status: 'proposed',
        source,
        description: evidence.description,
        sourceLabel: evidence.sourceLabel,
        needsCapture: evidence.needsCapture,
        linkedClaimHint: evidence.linkedClaimHint,
        rationale: composeEvidenceRationale(note, evidence),
        createdFrom: 'deterministic_meeting_notes_seed',
      });
    }
  }
  return out;
}

/**
 * Derive deliverable update hints. Decisions referencing a deliverable
 * key produce review_feedback proposals; questions blocking deliverable
 * approval produce approval_blocked; divergent / escalated stakeholder
 * alignment produces rework_required; document- or artifact-sourced
 * evidence produces draft_input_added.
 *
 * Mirrors the MW4 deriveDeliverableUpdatesFromMeetingNotes contract
 * but emits richer ProgramUpdateProposal shapes with provenance and
 * `proposed` status.
 */
export function deriveDeliverableUpdateProposals(
  notes: readonly MeetingNoteCapture[],
): readonly ProgramDeliverableUpdateProposal[] {
  const out: ProgramDeliverableUpdateProposal[] = [];
  for (const note of notes) {
    const source = buildSource(note);
    const fallbackDeliverableKey = composeDeliverableKey(
      note.programKey,
      note.workshopType,
    );

    for (const decision of note.decisions) {
      if (!decision.affectsDeliverableKey) continue;
      out.push({
        id: `prop-deliverable-decision-${decision.id}`,
        proposalType: 'deliverable_update_proposal',
        status: 'proposed',
        source,
        deliverableKey: decision.affectsDeliverableKey,
        updateKind: 'review_feedback',
        rationale: `Decision ${decision.id} during ${note.workshopType} session names a deliverable change.`,
        createdFrom: 'deterministic_meeting_notes_seed',
      });
    }

    for (const question of note.openQuestions) {
      if (question.blocks !== 'deliverable_approval') continue;
      out.push({
        id: `prop-deliverable-question-${question.id}`,
        proposalType: 'deliverable_update_proposal',
        status: 'proposed',
        source,
        deliverableKey: fallbackDeliverableKey,
        updateKind: 'approval_blocked',
        rationale: `Open question ${question.id} blocks deliverable approval.`,
        createdFrom: 'deterministic_meeting_notes_seed',
      });
    }

    for (const alignment of note.stakeholderAlignment) {
      if (alignment.state !== 'divergent' && alignment.state !== 'escalated') {
        continue;
      }
      out.push({
        id: `prop-deliverable-alignment-${alignment.id}`,
        proposalType: 'deliverable_update_proposal',
        status: 'proposed',
        source,
        deliverableKey: fallbackDeliverableKey,
        updateKind: 'rework_required',
        rationale: composeAlignmentReworkRationale(alignment),
        createdFrom: 'deterministic_meeting_notes_seed',
      });
    }

    for (const evidence of note.evidenceCandidates) {
      if (
        evidence.sourceLabel !== 'document_referenced' &&
        evidence.sourceLabel !== 'preexisting_artifact'
      ) {
        continue;
      }
      out.push({
        id: `prop-deliverable-evidence-${evidence.id}`,
        proposalType: 'deliverable_update_proposal',
        status: 'proposed',
        source,
        deliverableKey: fallbackDeliverableKey,
        updateKind: 'draft_input_added',
        rationale: `Evidence ${evidence.id} from ${evidence.sourceLabel} source feeds deliverable draft.`,
        createdFrom: 'deterministic_meeting_notes_seed',
      });
    }
  }
  return out;
}

/**
 * Derive gate readiness impact proposals. Gate impacts are advisory
 * only — they surface as suggestions for the Maestro to consider in
 * the next gate-readiness review. They never advance or block a gate
 * directly. Mapping rules:
 *
 * - Open question blocking `gate_signoff` → `gate_signoff_blocked`.
 * - Open question blocking `phase_advancement` → `gate_readiness_at_risk`.
 * - High-impact risk → `gate_readiness_at_risk`.
 * - Decision by Executive Sponsor → `gate_readiness_advanced`.
 * - Verbal-only evidence flagged needsCapture → `gate_evidence_needed`.
 *
 * Workshop-type → gate mapping uses the canonical phase progression:
 * discovery / framing → G1, governance / data / value → G2,
 * architecture / operating model → G3, adoption / executive review → G4.
 */
export function deriveGateImpactProposals(
  notes: readonly MeetingNoteCapture[],
): readonly ProgramGateImpactProposal[] {
  const out: ProgramGateImpactProposal[] = [];
  for (const note of notes) {
    const source = buildSource(note);
    const gate = mapWorkshopTypeToGate(note.workshopType);

    for (const question of note.openQuestions) {
      if (question.blocks === 'gate_signoff') {
        out.push({
          id: `prop-gate-question-signoff-${question.id}`,
          proposalType: 'gate_impact_proposal',
          status: 'proposed',
          advisory: true,
          source,
          gate,
          impactKind: 'gate_signoff_blocked',
          rationale: `Open question ${question.id} blocks ${gate} signoff per ${note.workshopType} session.`,
          createdFrom: 'deterministic_meeting_notes_seed',
        });
      } else if (question.blocks === 'phase_advancement') {
        out.push({
          id: `prop-gate-question-phase-${question.id}`,
          proposalType: 'gate_impact_proposal',
          status: 'proposed',
          advisory: true,
          source,
          gate,
          impactKind: 'gate_readiness_at_risk',
          rationale: `Open question ${question.id} blocks phase advancement toward ${gate}.`,
          createdFrom: 'deterministic_meeting_notes_seed',
        });
      }
    }

    for (const risk of note.risks) {
      if (risk.impact !== 'high') continue;
      out.push({
        id: `prop-gate-risk-${risk.id}`,
        proposalType: 'gate_impact_proposal',
        status: 'proposed',
        advisory: true,
        source,
        gate,
        impactKind: 'gate_readiness_at_risk',
        rationale: `High-impact risk ${risk.id} surfaced during ${note.workshopType} session puts ${gate} readiness at risk.`,
        createdFrom: 'deterministic_meeting_notes_seed',
      });
    }

    for (const decision of note.decisions) {
      if (decision.decidedBy !== ROLE_EXECUTIVE_SPONSOR) continue;
      out.push({
        id: `prop-gate-decision-${decision.id}`,
        proposalType: 'gate_impact_proposal',
        status: 'proposed',
        advisory: true,
        source,
        gate,
        impactKind: 'gate_readiness_advanced',
        rationale: `Sponsor decision ${decision.id} advances ${gate} readiness signal.`,
        createdFrom: 'deterministic_meeting_notes_seed',
      });
    }

    for (const evidence of note.evidenceCandidates) {
      if (
        evidence.sourceLabel !== 'verbal_only' &&
        evidence.sourceLabel !== 'whiteboard'
      ) {
        continue;
      }
      if (!evidence.needsCapture) continue;
      out.push({
        id: `prop-gate-evidence-${evidence.id}`,
        proposalType: 'gate_impact_proposal',
        status: 'proposed',
        advisory: true,
        source,
        gate,
        impactKind: 'gate_evidence_needed',
        rationale: `Evidence ${evidence.id} from ${evidence.sourceLabel} needs documented capture before ${gate} review.`,
        createdFrom: 'deterministic_meeting_notes_seed',
      });
    }
  }
  return out;
}

// ---------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------

/**
 * Reconcile the proposals into a deterministic counts summary. The
 * `appliedProposals` field is hard-coded to `0` so callers can assert
 * the no-applied-state invariant against the same shape.
 */
export function summarizeProgramUpdateProposals(
  proposals: readonly ProgramUpdateProposal[],
): MeetingNotesProgramUpdateSummary {
  const byType = emptyByProposalType();
  for (const proposal of proposals) {
    byType[proposal.proposalType] += 1;
  }
  return {
    totalProposals: proposals.length,
    byType,
    actionProposals: byType.action_proposal,
    riskProposals: byType.risk_proposal,
    openQuestionProposals: byType.open_question_proposal,
    evidenceCandidateProposals: byType.evidence_candidate_proposal,
    deliverableUpdateProposals: byType.deliverable_update_proposal,
    gateImpactProposals: byType.gate_impact_proposal,
    appliedProposals: 0,
  };
}

// ---------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------

function buildSource(note: MeetingNoteCapture): ProgramUpdateSource {
  return {
    programKey: note.programKey,
    workshopType: note.workshopType,
    workshopOrdinal: note.workshopOrdinal,
    noteId: note.id,
  };
}

function emptyByProposalType(): Record<ProgramUpdateProposalType, number> {
  return {
    action_proposal: 0,
    risk_proposal: 0,
    open_question_proposal: 0,
    evidence_candidate_proposal: 0,
    deliverable_update_proposal: 0,
    gate_impact_proposal: 0,
  };
}

function composeActionRationale(
  note: MeetingNoteCapture,
  action: MeetingActionItem,
): string {
  return `Action ${action.id} captured during ${note.workshopType} session by ${note.capturedBy}; due ${action.dueByLabel}.`;
}

function composeRiskRationale(
  note: MeetingNoteCapture,
  risk: MeetingRisk,
): string {
  if (risk.impact === 'high' && risk.likelihood === 'high') {
    return `High-likelihood, high-impact risk ${risk.id} surfaced during ${note.workshopType} session warrants immediate register update.`;
  }
  if (risk.impact === 'high') {
    return `High-impact risk ${risk.id} surfaced during ${note.workshopType} session warrants register update.`;
  }
  return `Risk ${risk.id} captured during ${note.workshopType} session; severity ${risk.likelihood}/${risk.impact}.`;
}

function composeOpenQuestionRationale(
  note: MeetingNoteCapture,
  question: MeetingOpenQuestion,
): string {
  return `Open question ${question.id} surfaced during ${note.workshopType} session blocks ${question.blocks ?? 'none'}.`;
}

function composeEvidenceRationale(
  note: MeetingNoteCapture,
  evidence: MeetingEvidenceCandidate,
): string {
  if (evidence.needsCapture) {
    return `Evidence ${evidence.id} from ${evidence.sourceLabel} surfaced during ${note.workshopType} session still needs documented capture.`;
  }
  return `Evidence ${evidence.id} from ${evidence.sourceLabel} surfaced during ${note.workshopType} session is captured and ready to link.`;
}

function composeAlignmentReworkRationale(
  alignment: MeetingStakeholderAlignment,
): string {
  return `Stakeholder alignment on ${alignment.topic} is ${alignment.state}; deliverable rework needed.`;
}

function normalizeKey(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function composeDeliverableKey(
  programKey: string,
  workshopType: string,
): string {
  return `${normalizeKey(programKey)}-${normalizeKey(workshopType)}-deliverable`;
}

function mapWorkshopTypeToGate(
  workshopType: string,
): 'G1' | 'G2' | 'G3' | 'G4' {
  switch (workshopType) {
    case 'current_state_discovery':
    case 'use_case_framing':
      return 'G1';
    case 'data_foundation_assessment':
    case 'value_framing':
    case 'governance_risk_review':
      return 'G2';
    case 'architecture_solution_design':
    case 'operating_model_alignment':
      return 'G3';
    case 'adoption_change_readiness':
    case 'executive_decision_review':
      return 'G4';
    default:
      return 'G1';
  }
}
