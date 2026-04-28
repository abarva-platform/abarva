// PROG25 · Workshop notes → actions/deliverables plan view model.
//
// Pure deterministic read model for the Program Workshop section.
// Translates deterministic workshop-note seeds + current program panel
// state into a workflow-oriented plan with known/missing/blocked lanes
// and explicit next actions.
//
// Deliberately out of scope:
// - No model calls
// - No upload/parsing
// - No persistence
// - No workflow engine / dispatch

import {
  deriveProgramUpdatesFromMeetingNotesCapture,
  type ProgramUpdateProposal,
} from '@/lib/programs/meeting-notes-to-program-updates';
import { buildMeetingNoteCaptureSeed } from '@/lib/programs/meeting-notes-capture';
import type { ProgramDetailView } from '@/lib/programs/programs-types';
import type { WorkshopType } from '@/lib/programs/workshop-readiness';

export interface WorkshopNotesActionPlanView {
  headline: string;
  contextLine: string;
  known: readonly string[];
  missing: readonly string[];
  blocked: readonly string[];
  nextAction: string;
  deliverableNextAction: string;
  honestDisclaimer: string;
  deterministicSeed: true;
}

export function buildWorkshopNotesActionPlanView(
  view: ProgramDetailView,
): WorkshopNotesActionPlanView {
  const workshopType = phaseToWorkshopType(view.viewingPhase);
  const notes = buildMeetingNoteCaptureSeed(view.programId, workshopType);
  const proposals = deriveProgramUpdatesFromMeetingNotesCapture(notes);

  const actionProposals = proposals.filter(
    (proposal): proposal is Extract<ProgramUpdateProposal, { proposalType: 'action_proposal' }> =>
      proposal.proposalType === 'action_proposal',
  );
  const deliverableProposals = proposals.filter(
    (proposal): proposal is Extract<ProgramUpdateProposal, { proposalType: 'deliverable_update_proposal' }> =>
      proposal.proposalType === 'deliverable_update_proposal',
  );
  const gateImpactProposals = proposals.filter(
    (proposal): proposal is Extract<ProgramUpdateProposal, { proposalType: 'gate_impact_proposal' }> =>
      proposal.proposalType === 'gate_impact_proposal',
  );
  const openQuestionProposals = proposals.filter(
    (proposal): proposal is Extract<ProgramUpdateProposal, { proposalType: 'open_question_proposal' }> =>
      proposal.proposalType === 'open_question_proposal',
  );

  const deliverables = view.phasePanel.deliverables ?? [];
  const gateCriteria = view.phasePanel.gateCriteria ?? [];
  const unmetGateCriteria = gateCriteria.filter((criterion) => !criterion.met);
  const pendingDeliverables = deliverables.filter((deliverable) => deliverable.status === 'pending');
  const blockedDeliverables = deliverables.filter((deliverable) => deliverable.status === 'blocked');
  const completeDeliverables = deliverables.filter((deliverable) => deliverable.status === 'done');

  const known = withFallback(
    [
      ...actionProposals.slice(0, 2).map((proposal) =>
        `Seeded action · ${proposal.description} (${proposal.ownerRole})`,
      ),
      ...completeDeliverables.slice(0, 2).map((deliverable) =>
        `Deliverable complete · ${deliverable.label}`,
      ),
    ],
    'No completed actions/deliverables are confirmed in this deterministic snapshot.',
  );

  const missing = withFallback(
    [
      ...unmetGateCriteria.slice(0, 3).map((criterion) =>
        `Gate criterion missing · ${criterion.criterion}`,
      ),
      ...pendingDeliverables.slice(0, 2).map((deliverable) =>
        `Deliverable input missing · ${deliverable.label}`,
      ),
      ...openQuestionProposals.slice(0, 1).map((proposal) =>
        `Open workshop question · ${proposal.question}`,
      ),
    ],
    'No missing inputs were detected in the deterministic workshop-note seed.',
  );

  const blocked = withFallback(
    [
      ...blockedDeliverables.slice(0, 3).map((deliverable) =>
        `Deliverable blocked · ${deliverable.label}`,
      ),
      ...gateImpactProposals
        .filter(
          (proposal) =>
            proposal.impactKind === 'gate_signoff_blocked' ||
            proposal.impactKind === 'gate_evidence_needed',
        )
        .slice(0, 2)
        .map((proposal) => `Gate impact · ${proposal.rationale}`),
      ...(view.phasePanel.blockerNote
        ? [`Phase blocker note · ${view.phasePanel.blockerNote}`]
        : []),
    ],
    'No hard blockers are flagged in this deterministic workshop-note seed.',
  );

  const nextAction = blockedDeliverables.length > 0
    ? `Unblock ${blockedDeliverables[0].label} by resolving its top dependency before the next workshop.`
    : actionProposals.length > 0
      ? `Execute first seeded action: ${actionProposals[0].description}.`
      : view.workbench.actions.length > 0
        ? `Run workbench action ${view.workbench.actions[0].letter}: ${view.workbench.actions[0].text}.`
        : 'Capture one concrete owner-assigned action before closing the workshop loop.';

  const deliverableNextAction = deliverableProposals.length > 0
    ? `Apply deliverable refinement: ${deliverableProposals[0].rationale}.`
    : pendingDeliverables.length > 0
      ? `Collect missing evidence for ${pendingDeliverables[0].label} before approval routing.`
      : 'No deliverable refinement steps are required in this deterministic snapshot.';

  const headline = 'Workshop notes → execution plan';
  const contextLine =
    `${view.displayId} · P${view.viewingPhase} · ${toWorkshopLabel(workshopType)} workflow`;

  const honestDisclaimer =
    'Deterministic seed: workshop notes are fixture-derived and read-only. ' +
    'Live notes ingestion, model extraction, uploads/parsing, persistence, and workflow dispatch are deferred.';

  return {
    headline,
    contextLine,
    known,
    missing,
    blocked,
    nextAction,
    deliverableNextAction,
    honestDisclaimer,
    deterministicSeed: true,
  };
}

function withFallback(
  values: readonly string[],
  fallback: string,
): readonly string[] {
  return values.length > 0 ? values : [fallback];
}

function phaseToWorkshopType(phase: number): WorkshopType {
  switch (phase) {
    case 0:
    case 1:
      return 'current_state_discovery';
    case 2:
      return 'data_foundation_assessment';
    case 3:
      return 'architecture_solution_design';
    case 4:
      return 'adoption_change_readiness';
    case 5:
    case 6:
      return 'executive_decision_review';
    default:
      return 'use_case_framing';
  }
}

function toWorkshopLabel(type: WorkshopType): string {
  switch (type) {
    case 'current_state_discovery':
      return 'Current-state discovery';
    case 'use_case_framing':
      return 'Use-case framing';
    case 'data_foundation_assessment':
      return 'Data foundation assessment';
    case 'value_framing':
      return 'Value framing';
    case 'governance_risk_review':
      return 'Governance and risk review';
    case 'architecture_solution_design':
      return 'Architecture and solution design';
    case 'operating_model_alignment':
      return 'Operating model alignment';
    case 'adoption_change_readiness':
      return 'Adoption and change readiness';
    case 'executive_decision_review':
      return 'Executive decision review';
    default:
      return 'Workshop';
  }
}
