// MW4 · Meeting Notes Capture Read Model.
//
// Pure deterministic read model for the Maestro Workshop Intelligence
// notes-capture surface. Operationalizes the MW1 contract section on
// during/after-workshop capture without inserting itself into the room.
//
// What this module does:
//   - Defines the eight canonical meeting note types.
//   - Emits empty templates per workshop type the Maestro can populate.
//   - Emits ≥ 2 deterministic seed notes per (programKey, workshopType)
//     pair so downstream surfaces have a known-good shape to render.
//   - Derives program / deliverable / evidence updates implied by the
//     note set without invoking a model and without persistence.
//   - Synthesizes the captured notes into a deterministic top-N summary.
//
// What this module deliberately does NOT do:
//   - No audio capture. No file uploads. No live transcription.
//   - No model invocation. No live clocks, randomness, or network IO.
//   - No persistence. No database, supabase, or auth dependencies.
//   - No imports from the Source UI, Sentinel, Atlas, Nexus, Agent, or
//     auth runtime modules.
//
// Read-only references to the MW2 workshop-readiness module are
// allowed; this module imports the canonical workshop-type union so
// the eight canonical workshop types stay reconciled with MW2.

import type { WorkshopType } from '@/lib/programs/workshop-readiness';

// ---------------------------------------------------------------------
// Public note-type union
// ---------------------------------------------------------------------

export const MEETING_NOTE_TYPES = [
  'workshop_observation',
  'decision',
  'action_item',
  'risk',
  'open_question',
  'evidence_candidate',
  'stakeholder_alignment',
  'follow_up_meeting',
] as const;

export type MeetingNoteType = (typeof MEETING_NOTE_TYPES)[number];

// ---------------------------------------------------------------------
// Public sub-record types
// ---------------------------------------------------------------------

export interface MeetingDecision {
  id: string;
  decision: string;
  decidedBy: string;
  rationale: string;
  affectsProgramKey?: string;
  affectsDeliverableKey?: string;
  decidedAt: 'workshop_session';
}

export interface MeetingActionItem {
  id: string;
  description: string;
  ownerRole: string;
  dueByLabel:
    | 'this_week'
    | 'before_next_workshop'
    | 'before_next_gate'
    | 'parking_lot';
  state: 'open' | 'in_progress' | 'completed' | 'blocked';
}

export interface MeetingRisk {
  id: string;
  description: string;
  likelihood: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  ownerRole?: string;
  mitigation?: string;
}

export interface MeetingOpenQuestion {
  id: string;
  question: string;
  blocks?:
    | 'phase_advancement'
    | 'deliverable_approval'
    | 'gate_signoff'
    | 'none';
  routingHint?: string;
}

export interface MeetingEvidenceCandidate {
  id: string;
  description: string;
  sourceLabel:
    | 'shared_screen'
    | 'whiteboard'
    | 'verbal_only'
    | 'document_referenced'
    | 'preexisting_artifact';
  needsCapture: boolean;
  linkedClaimHint?: string;
}

export interface MeetingStakeholderAlignment {
  id: string;
  topic: string;
  state: 'aligned' | 'divergent' | 'pending' | 'escalated';
  participants: readonly string[];
}

// ---------------------------------------------------------------------
// Public note record
// ---------------------------------------------------------------------

export interface MeetingNoteCapture {
  id: string;
  programKey: string;
  workshopType: string;
  workshopOrdinal: number;
  capturedBy: string;
  noteType: MeetingNoteType;
  observation: string;
  decisions: readonly MeetingDecision[];
  actionItems: readonly MeetingActionItem[];
  risks: readonly MeetingRisk[];
  openQuestions: readonly MeetingOpenQuestion[];
  evidenceCandidates: readonly MeetingEvidenceCandidate[];
  stakeholderAlignment: readonly MeetingStakeholderAlignment[];
  honestDisclaimer: string;
  createdFrom: 'deterministic_seed';
}

// ---------------------------------------------------------------------
// Public synthesis result
// ---------------------------------------------------------------------

export interface MeetingSynthesisResult {
  programKey: string;
  workshopType: string;
  topDecisions: readonly MeetingDecision[];
  topActionItems: readonly MeetingActionItem[];
  topRisks: readonly MeetingRisk[];
  unresolvedQuestions: readonly MeetingOpenQuestion[];
  evidenceCandidatesNeedingCapture: readonly MeetingEvidenceCandidate[];
  recommendedNextStep: string;
  basis: { synthesizer: 'meeting_synthesis_v1' };
  createdFrom: 'deterministic_seed';
}

// ---------------------------------------------------------------------
// Update derivations
// ---------------------------------------------------------------------

export type ProgramUpdateKind =
  | 'phase_advance_request'
  | 'gate_readiness_change'
  | 'risk_register_update'
  | 'value_at_stake_update';

export interface ProgramUpdateFromMeetingNote {
  programKey: string;
  updateKind: ProgramUpdateKind;
  rationale: string;
}

export type DeliverableUpdateKind =
  | 'draft_input_added'
  | 'review_feedback'
  | 'approval_blocked'
  | 'rework_required';

export interface DeliverableUpdateFromMeetingNote {
  deliverableKey: string;
  updateKind: DeliverableUpdateKind;
  rationale: string;
}

// ---------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------

const HONEST_DISCLAIMER =
  'Notes are deterministic seed; live capture is not wired.';

const TOP_DECISIONS_LIMIT = 3;
const TOP_ACTION_ITEMS_LIMIT = 5;
const TOP_RISKS_LIMIT = 3;

// Canonical role labels — all role-based, never real person names.
const ROLE_CLIENT_MAESTRO = 'Client Maestro';
const ROLE_VP_ENGINEERING = 'VP Engineering';
const ROLE_DATA_OWNER = 'Data Owner';
const ROLE_BUSINESS_OWNER = 'Business Owner';
const ROLE_EXECUTIVE_SPONSOR = 'Executive Sponsor';
const ROLE_COMPLIANCE_REVIEWER = 'Compliance Reviewer';
const ROLE_TECHNICAL_LEAD = 'Technical Lead';
const ROLE_ABARVA_CONSULTANT = 'AbarVa Consultant';

// ---------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------

/**
 * Build an empty template for the given workshop type. All arrays are
 * empty; the workshop type is recorded so the caller can tell which
 * template to use.
 */
export function buildMeetingNoteCaptureTemplate(
  workshopType: string,
): MeetingNoteCapture {
  return {
    id: `mtg-seed-template-${normalizeKey(workshopType)}`,
    programKey: '',
    workshopType,
    workshopOrdinal: 0,
    capturedBy: ROLE_CLIENT_MAESTRO,
    noteType: 'workshop_observation',
    observation: '',
    decisions: [],
    actionItems: [],
    risks: [],
    openQuestions: [],
    evidenceCandidates: [],
    stakeholderAlignment: [],
    honestDisclaimer: HONEST_DISCLAIMER,
    createdFrom: 'deterministic_seed',
  };
}

// ---------------------------------------------------------------------
// Seed builder
// ---------------------------------------------------------------------

/**
 * Build the deterministic seed list for a (programKey, workshopType)
 * pair. Always returns ≥ 2 notes. Each note carries at least one
 * decision, action item, risk, open question, and evidence candidate.
 *
 * Pure: same input → identical output across calls.
 */
export function buildMeetingNoteCaptureSeed(
  programKey: string,
  workshopType: string,
): readonly MeetingNoteCapture[] {
  const programSlug = normalizeKey(programKey);
  const wsSlug = normalizeKey(workshopType);
  const idPrefix = `mtg-seed-${programSlug}-${wsSlug}`;

  const noteOne: MeetingNoteCapture = {
    id: `${idPrefix}-1`,
    programKey,
    workshopType,
    workshopOrdinal: 1,
    capturedBy: ROLE_CLIENT_MAESTRO,
    noteType: 'workshop_observation',
    observation: composeObservationOne(workshopType),
    decisions: [
      {
        id: `${idPrefix}-1-decision-1`,
        decision: composeDecisionOne(workshopType),
        decidedBy: ROLE_EXECUTIVE_SPONSOR,
        rationale: composeDecisionRationaleOne(workshopType),
        affectsProgramKey: programKey,
        decidedAt: 'workshop_session',
      },
    ],
    actionItems: [
      {
        id: `${idPrefix}-1-action-1`,
        description: composeActionOne(workshopType),
        ownerRole: ROLE_BUSINESS_OWNER,
        dueByLabel: 'before_next_workshop',
        state: 'open',
      },
    ],
    risks: [
      {
        id: `${idPrefix}-1-risk-1`,
        description: composeRiskOne(workshopType),
        likelihood: 'medium',
        impact: 'high',
        ownerRole: ROLE_VP_ENGINEERING,
        mitigation: composeRiskMitigationOne(workshopType),
      },
    ],
    openQuestions: [
      {
        id: `${idPrefix}-1-question-1`,
        question: composeOpenQuestionOne(workshopType),
        blocks: 'phase_advancement',
        routingHint: 'Steward governance',
      },
    ],
    evidenceCandidates: [
      {
        id: `${idPrefix}-1-evidence-1`,
        description: composeEvidenceOne(workshopType),
        sourceLabel: 'whiteboard',
        needsCapture: true,
        linkedClaimHint: 'Maestro brief evidence checklist',
      },
    ],
    stakeholderAlignment: [
      {
        id: `${idPrefix}-1-alignment-1`,
        topic: composeAlignmentTopicOne(workshopType),
        state: 'pending',
        participants: [ROLE_EXECUTIVE_SPONSOR, ROLE_BUSINESS_OWNER],
      },
    ],
    honestDisclaimer: HONEST_DISCLAIMER,
    createdFrom: 'deterministic_seed',
  };

  const noteTwo: MeetingNoteCapture = {
    id: `${idPrefix}-2`,
    programKey,
    workshopType,
    workshopOrdinal: 1,
    capturedBy: ROLE_ABARVA_CONSULTANT,
    noteType: 'evidence_candidate',
    observation: composeObservationTwo(workshopType),
    decisions: [
      {
        id: `${idPrefix}-2-decision-1`,
        decision: composeDecisionTwo(workshopType),
        decidedBy: ROLE_CLIENT_MAESTRO,
        rationale: composeDecisionRationaleTwo(workshopType),
        affectsDeliverableKey: composeDeliverableKey(programKey, workshopType),
        decidedAt: 'workshop_session',
      },
    ],
    actionItems: [
      {
        id: `${idPrefix}-2-action-1`,
        description: composeActionTwo(workshopType),
        ownerRole: ROLE_DATA_OWNER,
        dueByLabel: 'before_next_gate',
        state: 'in_progress',
      },
    ],
    risks: [
      {
        id: `${idPrefix}-2-risk-1`,
        description: composeRiskTwo(workshopType),
        likelihood: 'high',
        impact: 'medium',
        ownerRole: ROLE_COMPLIANCE_REVIEWER,
        mitigation: composeRiskMitigationTwo(workshopType),
      },
    ],
    openQuestions: [
      {
        id: `${idPrefix}-2-question-1`,
        question: composeOpenQuestionTwo(workshopType),
        blocks: 'gate_signoff',
        routingHint: 'Atlas executive',
      },
    ],
    evidenceCandidates: [
      {
        id: `${idPrefix}-2-evidence-1`,
        description: composeEvidenceTwo(workshopType),
        sourceLabel: 'verbal_only',
        needsCapture: true,
        linkedClaimHint: 'Value ledger entry support',
      },
    ],
    stakeholderAlignment: [
      {
        id: `${idPrefix}-2-alignment-1`,
        topic: composeAlignmentTopicTwo(workshopType),
        state: 'divergent',
        participants: [ROLE_TECHNICAL_LEAD, ROLE_COMPLIANCE_REVIEWER],
      },
    ],
    honestDisclaimer: HONEST_DISCLAIMER,
    createdFrom: 'deterministic_seed',
  };

  return [noteOne, noteTwo];
}

// ---------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------

export function summarizeMeetingNotesCapture(
  notes: readonly MeetingNoteCapture[],
): {
  totalNotes: number;
  byType: Record<MeetingNoteType, number>;
  totalDecisions: number;
  totalActionItems: number;
  totalEvidenceCandidates: number;
} {
  const byType = emptyByNoteType();
  let totalDecisions = 0;
  let totalActionItems = 0;
  let totalEvidenceCandidates = 0;
  for (const note of notes) {
    byType[note.noteType] += 1;
    totalDecisions += note.decisions.length;
    totalActionItems += note.actionItems.length;
    totalEvidenceCandidates += note.evidenceCandidates.length;
  }
  return {
    totalNotes: notes.length,
    byType,
    totalDecisions,
    totalActionItems,
    totalEvidenceCandidates,
  };
}

// ---------------------------------------------------------------------
// Update derivations
// ---------------------------------------------------------------------

/**
 * Derive program-level updates implied by the captured notes. Updates
 * are emitted only when a note carries content implying a phase-advance
 * request, gate readiness change, risk-register update, or value-at-
 * stake update.
 */
export function deriveProgramUpdatesFromMeetingNotes(
  notes: readonly MeetingNoteCapture[],
): readonly ProgramUpdateFromMeetingNote[] {
  const updates: ProgramUpdateFromMeetingNote[] = [];
  for (const note of notes) {
    // Decisions referencing the program imply a phase-advance request.
    for (const decision of note.decisions) {
      if (decision.affectsProgramKey) {
        updates.push({
          programKey: decision.affectsProgramKey,
          updateKind: 'phase_advance_request',
          rationale: `Decision ${decision.id} captured by ${decision.decidedBy} implies advance request.`,
        });
      }
    }
    // Open questions blocking gate signoff imply a readiness change.
    for (const question of note.openQuestions) {
      if (question.blocks === 'gate_signoff') {
        updates.push({
          programKey: note.programKey,
          updateKind: 'gate_readiness_change',
          rationale: `Open question ${question.id} blocks gate signoff per ${note.workshopType} session.`,
        });
      }
    }
    // High-impact risks imply a risk register update.
    for (const risk of note.risks) {
      if (risk.impact === 'high') {
        updates.push({
          programKey: note.programKey,
          updateKind: 'risk_register_update',
          rationale: `High-impact risk ${risk.id} surfaced during ${note.workshopType} session.`,
        });
      }
    }
    // Decisions made by the Executive Sponsor imply a value update.
    for (const decision of note.decisions) {
      if (decision.decidedBy === ROLE_EXECUTIVE_SPONSOR) {
        updates.push({
          programKey: note.programKey,
          updateKind: 'value_at_stake_update',
          rationale: `Sponsor decision ${decision.id} reframes value at stake.`,
        });
      }
    }
  }
  return updates;
}

/**
 * Derive deliverable-level updates implied by the captured notes.
 * Updates are emitted only when a note explicitly mentions a
 * deliverable key (via decisions.affectsDeliverableKey or via the
 * action items referencing a deliverable).
 */
export function deriveDeliverableUpdatesFromMeetingNotes(
  notes: readonly MeetingNoteCapture[],
): readonly DeliverableUpdateFromMeetingNote[] {
  const updates: DeliverableUpdateFromMeetingNote[] = [];
  for (const note of notes) {
    for (const decision of note.decisions) {
      if (!decision.affectsDeliverableKey) continue;
      updates.push({
        deliverableKey: decision.affectsDeliverableKey,
        updateKind: 'review_feedback',
        rationale: `Decision ${decision.id} during ${note.workshopType} session names a deliverable change.`,
      });
    }
    // Open questions blocking deliverable approval imply approval block.
    for (const question of note.openQuestions) {
      if (question.blocks === 'deliverable_approval') {
        updates.push({
          deliverableKey: composeDeliverableKey(
            note.programKey,
            note.workshopType,
          ),
          updateKind: 'approval_blocked',
          rationale: `Open question ${question.id} blocks deliverable approval.`,
        });
      }
    }
    // Stakeholder alignment marked divergent implies rework required.
    for (const alignment of note.stakeholderAlignment) {
      if (alignment.state === 'divergent' || alignment.state === 'escalated') {
        updates.push({
          deliverableKey: composeDeliverableKey(
            note.programKey,
            note.workshopType,
          ),
          updateKind: 'rework_required',
          rationale: `Stakeholder alignment on ${alignment.topic} is ${alignment.state}; deliverable rework needed.`,
        });
      }
    }
    // Notes with a captured evidence candidate marked from the
    // workshop room imply a draft input addition.
    for (const evidence of note.evidenceCandidates) {
      if (
        evidence.sourceLabel === 'document_referenced' ||
        evidence.sourceLabel === 'preexisting_artifact'
      ) {
        updates.push({
          deliverableKey: composeDeliverableKey(
            note.programKey,
            note.workshopType,
          ),
          updateKind: 'draft_input_added',
          rationale: `Evidence ${evidence.id} from ${evidence.sourceLabel} source feeds deliverable draft.`,
        });
      }
    }
  }
  return updates;
}

/**
 * Return the union of all evidence candidates across the supplied notes.
 * Order is preserved across notes; within a note, source order is
 * preserved.
 */
export function deriveEvidenceCandidatesFromMeetingNotes(
  notes: readonly MeetingNoteCapture[],
): readonly MeetingEvidenceCandidate[] {
  const out: MeetingEvidenceCandidate[] = [];
  for (const note of notes) {
    for (const evidence of note.evidenceCandidates) {
      out.push(evidence);
    }
  }
  return out;
}

// ---------------------------------------------------------------------
// Synthesis
// ---------------------------------------------------------------------

/**
 * Deterministic synthesis of captured notes into a top-N readout. Top
 * decisions, action items, and risks are taken in canonical id order
 * (i.e., the order the notes were filed, then the order within each
 * note). Action items keep only `open` and `in_progress` states.
 */
export function synthesizeMeetingNotes(
  notes: readonly MeetingNoteCapture[],
): MeetingSynthesisResult {
  // Pick first note for program/workshop context; fall back to empty
  // strings when the input list is empty so the caller still gets a
  // structured shape back.
  const first = notes[0];
  const programKey = first ? first.programKey : '';
  const workshopType = first ? first.workshopType : '';

  const decisions: MeetingDecision[] = [];
  const actionItems: MeetingActionItem[] = [];
  const risks: MeetingRisk[] = [];
  const unresolvedQuestions: MeetingOpenQuestion[] = [];
  const needCaptureEvidence: MeetingEvidenceCandidate[] = [];

  for (const note of notes) {
    for (const decision of note.decisions) {
      decisions.push(decision);
    }
    for (const action of note.actionItems) {
      if (action.state === 'open' || action.state === 'in_progress') {
        actionItems.push(action);
      }
    }
    for (const risk of note.risks) {
      risks.push(risk);
    }
    for (const question of note.openQuestions) {
      if (question.blocks && question.blocks !== 'none') {
        unresolvedQuestions.push(question);
      }
    }
    for (const evidence of note.evidenceCandidates) {
      if (evidence.needsCapture) {
        needCaptureEvidence.push(evidence);
      }
    }
  }

  // Stable sort by id for risks and actions so ordering does not
  // depend on note insertion order.
  const sortedActionItems = [...actionItems].sort((a, b) =>
    a.id.localeCompare(b.id),
  );
  const sortedRisks = [...risks].sort((a, b) => {
    const impactDelta =
      impactRank(b.impact) - impactRank(a.impact);
    if (impactDelta !== 0) return impactDelta;
    return a.id.localeCompare(b.id);
  });

  return {
    programKey,
    workshopType,
    topDecisions: decisions.slice(0, TOP_DECISIONS_LIMIT),
    topActionItems: sortedActionItems.slice(0, TOP_ACTION_ITEMS_LIMIT),
    topRisks: sortedRisks.slice(0, TOP_RISKS_LIMIT),
    unresolvedQuestions,
    evidenceCandidatesNeedingCapture: needCaptureEvidence,
    recommendedNextStep: composeRecommendedNextStep(
      workshopType,
      sortedRisks.length,
      unresolvedQuestions.length,
    ),
    basis: { synthesizer: 'meeting_synthesis_v1' },
    createdFrom: 'deterministic_seed',
  };
}

// ---------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------

function emptyByNoteType(): Record<MeetingNoteType, number> {
  return {
    workshop_observation: 0,
    decision: 0,
    action_item: 0,
    risk: 0,
    open_question: 0,
    evidence_candidate: 0,
    stakeholder_alignment: 0,
    follow_up_meeting: 0,
  };
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

function impactRank(impact: 'low' | 'medium' | 'high'): number {
  switch (impact) {
    case 'high':
      return 3;
    case 'medium':
      return 2;
    case 'low':
      return 1;
  }
}

function composeRecommendedNextStep(
  workshopType: string,
  riskCount: number,
  questionCount: number,
): string {
  if (questionCount > 0) {
    return `Resolve open questions surfaced during ${workshopType || 'session'} before scheduling the next workshop.`;
  }
  if (riskCount > 0) {
    return `Brief ${ROLE_EXECUTIVE_SPONSOR} on the risk register update before the next ${workshopType || 'workshop'} session.`;
  }
  return `File the captured notes and confirm the next ${workshopType || 'workshop'} agenda with the Maestro.`;
}

// ---------------------------------------------------------------------
// Workshop-type aware composition
// ---------------------------------------------------------------------

function composeObservationOne(workshopType: string): string {
  switch (workshopType as WorkshopType | string) {
    case 'current_state_discovery':
      return 'Room confirmed the operating reality the program must improve, with named friction points captured for downstream evidence chain.';
    case 'use_case_framing':
      return 'Room walked the candidate use-case longlist; first-wave priorities surfaced with feasibility caveats.';
    case 'data_foundation_assessment':
      return 'Room walked the data inventory for the prioritized use cases; lineage and freshness gaps surfaced openly.';
    case 'value_framing':
      return 'Room framed projected value with confidence band; baseline anchor captured for the value ledger.';
    case 'governance_risk_review':
      return 'Room walked the regulatory map and risk register; required controls surfaced for the design pack.';
    case 'architecture_solution_design':
      return 'Room walked the candidate target architecture; vendor stance and integration boundary tensions captured.';
    case 'operating_model_alignment':
      return 'Room walked the run-state RACI; ownership gaps and on-call boundary captured.';
    case 'adoption_change_readiness':
      return 'Room stress-tested adoption signals from the pilot population; gating signal captured.';
    case 'executive_decision_review':
      return 'Room walked the evidence chain that supports the decision in question; deferred items surfaced.';
    default:
      return 'Room captured the workshop observation as the Maestro framed the agenda; downstream evidence pending.';
  }
}

function composeObservationTwo(workshopType: string): string {
  switch (workshopType as WorkshopType | string) {
    case 'current_state_discovery':
      return 'Consultant captured contradictions between business and technical leads on the friction source.';
    case 'use_case_framing':
      return 'Consultant captured the deferral rationale for use cases pulled from the first wave.';
    case 'data_foundation_assessment':
      return 'Consultant captured the data owner roster and gap-fix timeline commitments.';
    case 'value_framing':
      return 'Consultant captured the variance attribution placeholder for projected-vs-realized after Verify.';
    case 'governance_risk_review':
      return 'Consultant captured the regulatory map references the controls are mapped to.';
    case 'architecture_solution_design':
      return 'Consultant captured the trade-off log for cost, latency, and migration-risk decisions.';
    case 'operating_model_alignment':
      return 'Consultant captured operating-model deviations from prior comparable engagements.';
    case 'adoption_change_readiness':
      return 'Consultant captured training coverage gaps relative to the readiness rubric.';
    case 'executive_decision_review':
      return 'Consultant captured the executive-readout preview the Atlas summary will draw from.';
    default:
      return 'Consultant captured supporting evidence the Maestro flagged for downstream synthesis.';
  }
}

function composeDecisionOne(workshopType: string): string {
  switch (workshopType as WorkshopType | string) {
    case 'current_state_discovery':
      return 'Confirm the operating-state framing the program will improve against.';
    case 'use_case_framing':
      return 'Lock the prioritized first-wave use-case set.';
    case 'data_foundation_assessment':
      return 'Lock the data gaps the program will close before phase advance.';
    case 'value_framing':
      return 'Lock the projected value framing and confidence band.';
    case 'governance_risk_review':
      return 'Lock the controls the design pack must carry.';
    case 'architecture_solution_design':
      return 'Lock the target architecture and integration boundary.';
    case 'operating_model_alignment':
      return 'Lock the RACI for the run-state.';
    case 'adoption_change_readiness':
      return 'Confirm the readiness signal the room accepts as gating.';
    case 'executive_decision_review':
      return 'Capture the executive decision the sponsor signs.';
    default:
      return 'Confirm the workshop framing the room accepts.';
  }
}

function composeDecisionRationaleOne(workshopType: string): string {
  switch (workshopType as WorkshopType | string) {
    case 'current_state_discovery':
      return 'Discovery findings reconciled with prior charter intent; framing is defensible.';
    case 'use_case_framing':
      return 'Wave selection balances operating impact with feasibility per the prioritization rubric.';
    case 'data_foundation_assessment':
      return 'Lineage and freshness gaps would block downstream phases without remediation.';
    case 'value_framing':
      return 'Confidence band aligns with the evidence the platform can produce today.';
    case 'governance_risk_review':
      return 'Required controls map to the regulatory anchors the program must satisfy.';
    case 'architecture_solution_design':
      return 'Trade-offs surfaced are acceptable to procurement and technical leads.';
    case 'operating_model_alignment':
      return 'Run-state ownership map clears before execution begins.';
    case 'adoption_change_readiness':
      return 'Readiness signal is honest and verifiable per the rubric.';
    case 'executive_decision_review':
      return 'Evidence chain supports the decision the sponsor signs today.';
    default:
      return 'Decision aligns with the workshop objective the Maestro framed.';
  }
}

function composeDecisionTwo(workshopType: string): string {
  switch (workshopType as WorkshopType | string) {
    case 'current_state_discovery':
      return 'Approve the evidence-collection plan for the next session.';
    case 'use_case_framing':
      return 'Approve the deferral rationale for the use cases not in the first wave.';
    case 'data_foundation_assessment':
      return 'Approve the gap-owner assignment and timeline.';
    case 'value_framing':
      return 'Approve the baseline anchor and target-metric definition.';
    case 'governance_risk_review':
      return 'Approve the risk-register entries and owners.';
    case 'architecture_solution_design':
      return 'Approve the vendor stance and material trade-offs.';
    case 'operating_model_alignment':
      return 'Approve the on-call boundary and ownership map.';
    case 'adoption_change_readiness':
      return 'Approve the training and change-management coverage plan.';
    case 'executive_decision_review':
      return 'Approve the executive readout for distribution.';
    default:
      return 'Approve the next-step plan the room agreed to.';
  }
}

function composeDecisionRationaleTwo(workshopType: string): string {
  switch (workshopType as WorkshopType | string) {
    case 'current_state_discovery':
      return 'Open questions cannot be answered in-room; assigned for next session preparation.';
    case 'use_case_framing':
      return 'Deferred use cases are honestly out of the first wave; rationale captured.';
    case 'data_foundation_assessment':
      return 'Owners committed to a fix window the program can defend.';
    case 'value_framing':
      return 'Baseline anchor is defensible and can be reproduced from operating evidence.';
    case 'governance_risk_review':
      return 'Risk owners and mitigation windows are aligned with the regulatory anchors.';
    case 'architecture_solution_design':
      return 'Vendor stance reflects the procurement and technical-lead consensus.';
    case 'operating_model_alignment':
      return 'On-call boundary is acceptable to platform and business teams.';
    case 'adoption_change_readiness':
      return 'Coverage plan addresses the gaps surfaced in the readiness review.';
    case 'executive_decision_review':
      return 'Atlas-style readout reflects the evidence chain the room walked.';
    default:
      return 'Plan is acceptable to the room and aligns with the workshop objective.';
  }
}

function composeActionOne(workshopType: string): string {
  switch (workshopType as WorkshopType | string) {
    case 'current_state_discovery':
      return 'Compile the current-state findings note and circulate before next session.';
    case 'use_case_framing':
      return 'Document the prioritized first-wave selection rationale.';
    case 'data_foundation_assessment':
      return 'Compile the data gap register with named owners.';
    case 'value_framing':
      return 'Compile the projected value ledger entry with confidence band.';
    case 'governance_risk_review':
      return 'Compile the required-control list for the design pack.';
    case 'architecture_solution_design':
      return 'Document the locked target architecture decision record.';
    case 'operating_model_alignment':
      return 'Compile the run-state RACI and circulate to owners.';
    case 'adoption_change_readiness':
      return 'Compile the readiness signal log with gating-signal annotation.';
    case 'executive_decision_review':
      return 'Compile the executive decision record and circulate for sponsor sign.';
    default:
      return 'Compile the workshop output and circulate to attendees.';
  }
}

function composeActionTwo(workshopType: string): string {
  switch (workshopType as WorkshopType | string) {
    case 'current_state_discovery':
      return 'Schedule the discovery follow-up with the named ground-truth owner.';
    case 'use_case_framing':
      return 'Update the charter with the prioritized first wave.';
    case 'data_foundation_assessment':
      return 'Coordinate the data-owner roster confirmation before the next session.';
    case 'value_framing':
      return 'Stage the variance attribution placeholder in the value ledger.';
    case 'governance_risk_review':
      return 'Stage the regulatory map references for the design pack update.';
    case 'architecture_solution_design':
      return 'Stage the trade-off log entries in the design pack.';
    case 'operating_model_alignment':
      return 'Stage the operating-model deviations note for the next review.';
    case 'adoption_change_readiness':
      return 'Stage the training coverage gap remediation plan.';
    case 'executive_decision_review':
      return 'Stage the Atlas executive-readout preview for distribution.';
    default:
      return 'Stage supporting workshop artifacts for the next session.';
  }
}

function composeRiskOne(workshopType: string): string {
  switch (workshopType as WorkshopType | string) {
    case 'current_state_discovery':
      return 'Framing locks before discovery is complete and forces rework downstream.';
    case 'use_case_framing':
      return 'Sponsor priority and technical feasibility do not converge on the first wave.';
    case 'data_foundation_assessment':
      return 'Material data gap blocks the prioritized wave and stalls phase advance.';
    case 'value_framing':
      return 'Confidence band overstates platform-supported evidence.';
    case 'governance_risk_review':
      return 'Required control cannot land within the mitigation window.';
    case 'architecture_solution_design':
      return 'Cost, latency, and migration trade-offs do not converge on a target.';
    case 'operating_model_alignment':
      return 'On-call ownership remains contested between platform and business teams.';
    case 'adoption_change_readiness':
      return 'Pilot population does not represent the scale population.';
    case 'executive_decision_review':
      return 'Evidence chain has gaps the sponsor flags during the review.';
    default:
      return 'Workshop output is incomplete and triggers downstream rework.';
  }
}

function composeRiskMitigationOne(workshopType: string): string {
  switch (workshopType as WorkshopType | string) {
    case 'current_state_discovery':
      return 'Reserve a follow-up discovery slot before the framing is locked.';
    case 'use_case_framing':
      return 'Run the prioritization rubric against both stances before locking the wave.';
    case 'data_foundation_assessment':
      return 'Stage the gap remediation against the gate readiness check.';
    case 'value_framing':
      return 'Tighten the confidence band to evidence the platform supports today.';
    case 'governance_risk_review':
      return 'Negotiate a phased control deployment with the compliance reviewer.';
    case 'architecture_solution_design':
      return 'Commission a trade-off comparison memo before the next decision review.';
    case 'operating_model_alignment':
      return 'Escalate the on-call ownership question to the executive sponsor.';
    case 'adoption_change_readiness':
      return 'Expand the pilot population before the scale decision.';
    case 'executive_decision_review':
      return 'Surface the evidence gaps in the Atlas readout and queue for next session.';
    default:
      return 'Capture the mitigation plan and revisit at the next workshop.';
  }
}

function composeRiskTwo(workshopType: string): string {
  switch (workshopType as WorkshopType | string) {
    case 'current_state_discovery':
      return 'No business owner is available to ground-truth the operating reality.';
    case 'use_case_framing':
      return 'Data owner cannot commit to the data needed for the candidate wave.';
    case 'data_foundation_assessment':
      return 'No data owner can commit to the gap-fix timeline.';
    case 'value_framing':
      return 'Baseline anchor is contested between business and technical owners.';
    case 'governance_risk_review':
      return 'No run-state owner is identified for a material risk.';
    case 'architecture_solution_design':
      return 'Vendor stance is contested between procurement and technical leads.';
    case 'operating_model_alignment':
      return 'RACI for a material run-state decision remains unclear.';
    case 'adoption_change_readiness':
      return 'Training coverage is thinner than the readiness rubric requires.';
    case 'executive_decision_review':
      return 'Deferred items create asymmetric risk the room has not adjudicated.';
    default:
      return 'Secondary risk surfaced during the workshop discussion.';
  }
}

function composeRiskMitigationTwo(workshopType: string): string {
  switch (workshopType as WorkshopType | string) {
    case 'current_state_discovery':
      return 'Schedule the ground-truth owner before the next session.';
    case 'use_case_framing':
      return 'Coordinate a data feasibility assessment before the next session.';
    case 'data_foundation_assessment':
      return 'Escalate gap-fix ownership to the executive sponsor.';
    case 'value_framing':
      return 'Reconcile baseline anchor positions before the value ledger entry is filed.';
    case 'governance_risk_review':
      return 'Assign run-state owners through the operating-model alignment session.';
    case 'architecture_solution_design':
      return 'Run a procurement and technical-lead reconciliation before next review.';
    case 'operating_model_alignment':
      return 'Stage a follow-up RACI walk with the executive sponsor.';
    case 'adoption_change_readiness':
      return 'Expand training coverage before the scale decision lands.';
    case 'executive_decision_review':
      return 'Catalogue deferred items in the Atlas readout for follow-up.';
    default:
      return 'Stage a follow-up review with the relevant owner.';
  }
}

function composeOpenQuestionOne(workshopType: string): string {
  switch (workshopType as WorkshopType | string) {
    case 'current_state_discovery':
      return 'Which contradiction in the current operating state is most material to the program advance?';
    case 'use_case_framing':
      return 'Which use case carries the largest operating impact in the first wave?';
    case 'data_foundation_assessment':
      return 'Which data domain is the most material gap for the prioritized wave?';
    case 'value_framing':
      return 'What baseline anchor does the room agree the program is improving against?';
    case 'governance_risk_review':
      return 'What is the most severe risk the design pack does not currently mitigate?';
    case 'architecture_solution_design':
      return 'Which integration boundary is most material for cost, latency, or risk?';
    case 'operating_model_alignment':
      return 'Who owns the run-state for each workstream and how is on-call structured?';
    case 'adoption_change_readiness':
      return 'What adoption signal from the pilot population gives the room confidence?';
    case 'executive_decision_review':
      return 'Which decision must the room capture today and who owns it?';
    default:
      return 'Which open question must be resolved before the next workshop?';
  }
}

function composeOpenQuestionTwo(workshopType: string): string {
  switch (workshopType as WorkshopType | string) {
    case 'current_state_discovery':
      return 'Where are we missing evidence that an SME could ground-truth before the next session?';
    case 'use_case_framing':
      return 'What use cases are we explicitly deferring and why?';
    case 'data_foundation_assessment':
      return 'Who owns each gap and what is the earliest date a fix can land?';
    case 'value_framing':
      return 'Which projections does the platform have evidence for today and which are deferred?';
    case 'governance_risk_review':
      return 'Who owns each risk in the run-state and what is the mitigation window?';
    case 'architecture_solution_design':
      return 'What is the vendor stance and which evaluation evidence supports it?';
    case 'operating_model_alignment':
      return 'Where does the operating model differ from prior comparable programs?';
    case 'adoption_change_readiness':
      return 'Where is the training and change-management coverage thin?';
    case 'executive_decision_review':
      return 'Which deferred items must be flagged in the executive readout?';
    default:
      return 'Which secondary question requires routing to a downstream owner?';
  }
}

function composeEvidenceOne(workshopType: string): string {
  switch (workshopType as WorkshopType | string) {
    case 'current_state_discovery':
      return 'Whiteboard sketch of the current-state operating reality the room walked.';
    case 'use_case_framing':
      return 'Whiteboard map of the prioritized use-case wave with feasibility annotations.';
    case 'data_foundation_assessment':
      return 'Whiteboard summary of the data inventory and material gaps.';
    case 'value_framing':
      return 'Whiteboard sketch of the baseline anchor and projected value range.';
    case 'governance_risk_review':
      return 'Whiteboard summary of the risk register entries the room walked.';
    case 'architecture_solution_design':
      return 'Whiteboard sketch of the target architecture and integration boundary.';
    case 'operating_model_alignment':
      return 'Whiteboard RACI sketch the run-state owners walked.';
    case 'adoption_change_readiness':
      return 'Whiteboard summary of pilot adoption signals.';
    case 'executive_decision_review':
      return 'Whiteboard summary of the evidence chain the decision rests on.';
    default:
      return 'Whiteboard sketch the room used to anchor the discussion.';
  }
}

function composeEvidenceTwo(workshopType: string): string {
  switch (workshopType as WorkshopType | string) {
    case 'current_state_discovery':
      return 'Verbal claim from the business owner about the most material friction point; needs follow-up capture.';
    case 'use_case_framing':
      return 'Verbal claim about deferral rationale that needs documented follow-up.';
    case 'data_foundation_assessment':
      return 'Verbal commitment from the data owner on the gap-fix timeline; needs documented follow-up.';
    case 'value_framing':
      return 'Verbal commitment from the sponsor on the value ledger entry that needs documented capture.';
    case 'governance_risk_review':
      return 'Verbal commitment from the compliance reviewer on the mitigation window; needs documented follow-up.';
    case 'architecture_solution_design':
      return 'Verbal trade-off commitment that needs documented capture in the design pack.';
    case 'operating_model_alignment':
      return 'Verbal commitment on on-call boundary that needs documented follow-up.';
    case 'adoption_change_readiness':
      return 'Verbal commitment on the gating readiness signal that needs documented capture.';
    case 'executive_decision_review':
      return 'Verbal claim from the sponsor on a deferred item that needs documented capture.';
    default:
      return 'Verbal claim from the workshop that needs documented follow-up capture.';
  }
}

function composeAlignmentTopicOne(workshopType: string): string {
  switch (workshopType as WorkshopType | string) {
    case 'current_state_discovery':
      return 'Operating-state framing the program will improve against.';
    case 'use_case_framing':
      return 'First-wave use-case prioritization.';
    case 'data_foundation_assessment':
      return 'Severity of the lineage gap blocking the prioritized wave.';
    case 'value_framing':
      return 'Baseline anchor for the projected value entry.';
    case 'governance_risk_review':
      return 'Required controls for the design pack.';
    case 'architecture_solution_design':
      return 'Target architecture trade-offs.';
    case 'operating_model_alignment':
      return 'Run-state ownership map.';
    case 'adoption_change_readiness':
      return 'Gating readiness signal.';
    case 'executive_decision_review':
      return 'Executive decision the sponsor will sign.';
    default:
      return 'Workshop-level alignment topic the Maestro framed.';
  }
}

function composeAlignmentTopicTwo(workshopType: string): string {
  switch (workshopType as WorkshopType | string) {
    case 'current_state_discovery':
      return 'Discovery deferrals and follow-up evidence collection plan.';
    case 'use_case_framing':
      return 'Deferral rationale for use cases not in the first wave.';
    case 'data_foundation_assessment':
      return 'Gap-owner assignment and timeline.';
    case 'value_framing':
      return 'Projected-vs-realized variance attribution placeholder.';
    case 'governance_risk_review':
      return 'Risk register ownership and mitigation windows.';
    case 'architecture_solution_design':
      return 'Vendor stance and procurement reconciliation.';
    case 'operating_model_alignment':
      return 'On-call boundary between platform and business.';
    case 'adoption_change_readiness':
      return 'Training coverage relative to the readiness rubric.';
    case 'executive_decision_review':
      return 'Atlas executive-readout coverage of deferred items.';
    default:
      return 'Secondary alignment topic surfaced during the workshop.';
  }
}
