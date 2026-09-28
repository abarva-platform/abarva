// P5 Mobilize & Handoff · Phase Intelligence Pack
//
// P5 prepares and records the receiving-party handoff. Execution is external.

import type { PhasePack } from './types';

export const P5_ACTIVATE: PhasePack = {
  phase: 5,
  label: 'P5 Mobilize & Handoff',
  outcome:
    'A controlled handoff of the approved P4 roadmap, estimate, assumptions, delivery owners, dependencies, and Tower measurement contract to the receiving execution team. Confirm required authorizations and open conditions, but do not redo P4 estimation, redesign the solution, or execute the project inside Moves. P5 completes when the receiving owners accept the handoff; project delivery occurs in their execution environment and Tower tracks outcomes.',

  definitionOfDone: [
    { id: 'business-case-approved', label: 'Approved P4 roadmap and estimate carried forward', severity: 'hard', evaluationHint: 'The approved roadmap, estimate range, delivery model, and assumptions are version-linked; P5 does not recompute or silently alter them.', preventsFailureModes: [1, 2, 9] },
    { id: 'sponsor-alignment-confirmed', label: 'Decision authority and handoff conditions confirmed', severity: 'hard', evaluationHint: 'Named authority and any approval conditions are recorded. Prior funding approval is referenced, not re-litigated.', preventsFailureModes: [1] },
    { id: 'readiness-and-change-plan-signed-off', label: 'Adoption and change owner accepted', severity: 'hard', evaluationHint: 'Business/delivery ownership, adoption responsibility, and any roadmap change activities are assigned. P5 does not produce a detailed change or training plan.', preventsFailureModes: [5, 8] },
    { id: 'tower-handoff-plan-accepted', label: 'Tower measurement handoff accepted', severity: 'hard', evaluationHint: 'Metric definition, baseline, source, owner, cadence, and forecast-versus-realized rules are accepted by the receiving owner.', preventsFailureModes: [5, 9] },
    { id: 'risk-acceptance-recorded', label: 'Open delivery assumptions and risks transferred', severity: 'soft', evaluationHint: 'Material risks, dependencies, assumptions, owners, and next actions are transferred without implying they are resolved.', preventsFailureModes: [6, 7, 10] },
    { id: 'approver-routing-complete', label: 'Required handoff approvals and conditions recorded', severity: 'soft', evaluationHint: 'Only approvals still required for mobilization/handoff are listed with authority, status, and evidence.', preventsFailureModes: [1, 10] },
    { id: 'mobilization-owner-named', label: 'Receiving delivery and Tower owners named', severity: 'soft', evaluationHint: 'Named receiving execution owner, delivery lead, vendor/SI lead if applicable, business adoption owner, and Tower monitoring owner.', preventsFailureModes: [1, 5] },
  ],

  rightQuestions: {
    open: [
      { id: 'approval-authority', text: 'Which approvals or conditions remain before the receiving team can accept the handoff, and who owns each?', why: 'P5 closes explicit handoff conditions without reopening the approved P4 decision.', expectedAnswerShape: 'Open condition, accountable approver/owner, evidence, and due point.', preventsFailureModes: [1, 10] },
      { id: 'funding-ask', text: 'Which approved P4 roadmap, estimate version, and delivery assumptions are being handed over?', why: 'The receiving team must inherit the exact approved basis, not a re-created package.', expectedAnswerShape: 'Versioned roadmap and estimate references with accepted conditions.', preventsFailureModes: [2] },
    ],
    converge: [
      { id: 'readiness-exceptions', text: 'Which roadmap assumptions, dependencies, or readiness conditions remain open at handoff?', why: 'Open work must transfer with an owner rather than be presented as complete.', expectedAnswerShape: 'Gap, owner, next action, and accepted or unresolved status.', preventsFailureModes: [5, 8] },
      { id: 'financial-redaction', text: 'Which parts of the business case require finance visibility, and what redacted summary can non-finance users see?', why: 'P5 packages sensitive economics and must enforce the output firewall.', expectedAnswerShape: 'Finance-only fields plus non-finance qualitative summary.', preventsFailureModes: [7, 9] },
    ],
    close: [
      { id: 'launch-recommendation', text: 'Is the handoff accepted, accepted with conditions, deferred, or returned for clarification?', why: 'P5 records a handoff decision; it does not authorize or run project execution.', expectedAnswerShape: 'Receiving-party decision, conditions, evidence, owners, and next state.', preventsFailureModes: [1, 2, 10] },
    ],
  },

  antiPatterns: [
    { id: 'approval-theater', label: 'Approval Theater', detectionHint: 'Packet uses phrases like aligned, supportive, or aware without naming handoff authority.', whatToFlag: 'Alignment is not receiving-party acceptance. Name who can accept the handoff and what conditions remain.', mitigation: 'Record the authorized receiving owner, decision, conditions, and evidence.', preventsFailureModes: [1] },
    { id: 'business-case-leak', label: 'Business Case Leakage', detectionHint: 'Exact dollars or sensitive financial KPIs appear in chat or deliverables for a restricted user.', whatToFlag: 'Financial-sensitive values cannot be exposed to this user.', mitigation: 'Use qualitative summary and require finance/admin entitlement for exact values.', preventsFailureModes: [7, 9] },
    { id: 'readiness-handwave', label: 'Readiness Handwave', detectionHint: 'Open conditions or delivery assumptions are called ready without a named receiving owner.', whatToFlag: 'A handoff is only complete when the receiving owner accepts the package and its open conditions.', mitigation: 'Name each owner, next action, acceptance condition, and Tower metric handoff.', preventsFailureModes: [5, 8] },
  ],

  coachingArc: {
    entry: 'Load the approved P4 roadmap and estimate as versioned inputs. Confirm the receiving execution owner, business adoption owner, Tower owner, and remaining handoff conditions.',
    midPhase: 'Assemble a concise handoff: approved scope, roadmap, estimate assumptions, responsibilities, dependencies, risks, required authorizations, and Tower measurement contract. Do not re-estimate or redesign; preserve financial access controls.',
    exit: 'Record the receiving party decision: accepted, accepted with conditions, deferred, or returned. P5 ends at handoff; actual delivery is external and Tower tracks outcomes.',
  },

  dependencies: {
    requiresFromPrior: [
      'Approved P4 roadmap and estimate package (versioned; do not recalculate)',
      'P4 milestone and dependency plan',
      'P4 estimate assumptions and technology gap manifest',
      'P4 responsibility matrix',
      'P4 Tower measurement requirements for post-handoff tracking',
      'P2 promise contract',
      'P3 design sign-off',
    ],
    producesForNext: ['Receiving-party handoff decision', 'Versioned handoff package', 'Tower measurement contract acceptance', 'Owned open assumptions and conditions'],
  },

  steps: [
    { id: 'p5-intake', label: 'Ingest approved roadmap and handoff scope', complexity: 'simple', agentRole: 'extract', inputs: ['approved P4 roadmap'], outputs: ['versioned handoff basis'], templateRefs: [], preventsFailureModes: [1, 2], intentCaptureRequired: false, postMeetingUploadExpected: false },
    { id: 'p5-business-case', label: 'Verify approved P4 roadmap and estimate version', complexity: 'simple', agentRole: 'evaluate_evidence', inputs: ['approved roadmap', 'approved estimate'], outputs: ['versioned P4 decision basis'], templateRefs: ['financial-baseline'], preventsFailureModes: [2, 7, 9], intentCaptureRequired: false, postMeetingUploadExpected: false },
    { id: 'p5-stakeholder-alignment', label: 'Confirm receiving owners and handoff responsibilities', complexity: 'complex', agentRole: 'coach_interview', inputs: ['approved responsibility matrix'], outputs: ['receiving owner acceptance'], templateRefs: ['stakeholder-map'], preventsFailureModes: [1], intentCaptureRequired: true, postMeetingUploadExpected: true },
    { id: 'p5-readiness', label: 'Transfer adoption ownership and open conditions', complexity: 'complex', agentRole: 'validate', inputs: ['P3 adoption boundary', 'P4 roadmap conditions'], outputs: ['handoff readiness record'], templateRefs: [], preventsFailureModes: [5, 8], intentCaptureRequired: true, postMeetingUploadExpected: true },
    { id: 'p5-risk-acceptance', label: 'Transfer open assumptions, dependencies, and risks', complexity: 'simple', agentRole: 'evaluate_evidence', inputs: ['approved risk and assumption register'], outputs: ['owned open items'], templateRefs: ['decision-log'], preventsFailureModes: [6, 10], intentCaptureRequired: false, postMeetingUploadExpected: false },
    { id: 'p5-decision-memo', label: 'Compose handoff decision record', complexity: 'simple', agentRole: 'compose_artifact', inputs: ['handoff package'], outputs: ['receiving party decision'], templateRefs: ['program-charter'], preventsFailureModes: [1, 2], intentCaptureRequired: false, postMeetingUploadExpected: false },
    { id: 'p5-multi-approval', label: 'Record remaining required handoff approvals', complexity: 'complex', agentRole: 'request_approval', inputs: ['handoff decision record'], outputs: ['approval evidence'], templateRefs: [], preventsFailureModes: [1, 10], intentCaptureRequired: false, postMeetingUploadExpected: false },
    { id: 'p5-p6-readiness', label: 'Confirm Tower measurement handoff acceptance', complexity: 'simple', agentRole: 'validate', inputs: ['approved metric plan', 'receiving owner decision'], outputs: ['Tower measurement handoff'], templateRefs: ['roadmap'], preventsFailureModes: [5, 9], intentCaptureRequired: false, postMeetingUploadExpected: false },
  ],
};
