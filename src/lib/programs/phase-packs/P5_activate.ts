// P5 Approval & Mobilization · Phase Intelligence Pack
//
// P5 packages the approved strategy and execution roadmap for funding,
// authority, readiness, and launch decision. It does not execute the rollout.

import type { PhasePack } from './types';

export const P5_ACTIVATE: PhasePack = {
  phase: 5,
  label: 'P5 Approval & Mobilization',
  outcome:
    'A funding-and-authority package that lets the sponsor, CFO/CIO, and required approvers decide whether execution should start outside AbarVa. The package includes business case, funding request, stakeholder alignment, readiness assessment, change and communications plan, governance structure, risk acceptance, decision memo, and Tower handoff plan. P5 is complete when approval authority is explicit, funding or non-funding is recorded, readiness gaps are accepted or remediated, and P6 can configure Tower monitoring.',

  definitionOfDone: [
    { id: 'business-case-approved', label: 'Business case and funding request approved', severity: 'hard', evaluationHint: 'Approval package contains business case, value model defense, funding request, assumptions, and decision record. Exact financial values must be redacted for users without finance visibility.', preventsFailureModes: [1, 2, 9] },
    { id: 'sponsor-alignment-confirmed', label: 'Sponsor alignment confirmed', severity: 'hard', evaluationHint: 'Sponsor has explicitly accepted scope, roadmap, readiness gaps, funding ask, and execution authority. Delegated enthusiasm is insufficient.', preventsFailureModes: [1] },
    { id: 'readiness-and-change-plan-signed-off', label: 'Readiness, change, and communications plan signed off', severity: 'hard', evaluationHint: 'Package names impacted groups, readiness risks, change owner, communications cadence, training/support approach, and unresolved readiness exceptions.', preventsFailureModes: [5, 8] },
    { id: 'tower-handoff-plan-accepted', label: 'Tower handoff plan accepted', severity: 'hard', evaluationHint: 'Approvers accept what Tower will monitor, reporting cadence, feed owner, thresholds, escalation path, and benefits tracking cadence.', preventsFailureModes: [5, 9] },
    { id: 'risk-acceptance-recorded', label: 'Risk acceptance package recorded', severity: 'soft', evaluationHint: 'Material execution, compliance, data, vendor, financial, and adoption risks have owner, mitigation, accepted residual risk, and decision rationale.', preventsFailureModes: [6, 7, 10] },
    { id: 'approver-routing-complete', label: 'Approver routing complete', severity: 'soft', evaluationHint: 'Approval path names sponsor, CIO/CDIO, CFO if budget applies, board if material, and whether approvals are serial or parallel.', preventsFailureModes: [1, 10] },
    { id: 'mobilization-owner-named', label: 'Execution owner and mobilization lead named', severity: 'soft', evaluationHint: 'Post-P5 execution owner, delivery lead, vendor/SI lead if applicable, and Tower monitoring owner are named.', preventsFailureModes: [1, 5] },
  ],

  rightQuestions: {
    open: [
      { id: 'approval-authority', text: 'Who has authority to approve funding and execution start, and who only needs to be aligned?', why: 'P5 fails when social alignment is mistaken for decision authority.', expectedAnswerShape: 'Approver list by decision right, required evidence, and routing order.', preventsFailureModes: [1, 10] },
      { id: 'funding-ask', text: 'What exactly is being requested: funding, people, vendor authority, timeline, or risk acceptance?', why: 'A vague approval ask produces a vague decision.', expectedAnswerShape: 'Specific ask with decision owner and acceptance criteria.', preventsFailureModes: [2] },
    ],
    converge: [
      { id: 'readiness-exceptions', text: 'Which readiness gaps remain, and who is accepting each one?', why: 'Execution starts badly when readiness gaps are buried inside the business case.', expectedAnswerShape: 'Gap, owner, mitigation, residual risk, accept/hold decision.', preventsFailureModes: [5, 8] },
      { id: 'financial-redaction', text: 'Which parts of the business case require finance visibility, and what redacted summary can non-finance users see?', why: 'P5 packages sensitive economics and must enforce the output firewall.', expectedAnswerShape: 'Finance-only fields plus non-finance qualitative summary.', preventsFailureModes: [7, 9] },
    ],
    close: [
      { id: 'launch-recommendation', text: 'Is the recommendation approve, reject, defer, or approve with conditions?', why: 'The P5 decision memo must force an explicit executive decision.', expectedAnswerShape: 'Recommendation, conditions, dissent, evidence, and next state.', preventsFailureModes: [1, 2, 10] },
    ],
  },

  antiPatterns: [
    { id: 'approval-theater', label: 'Approval Theater', detectionHint: 'Packet uses phrases like aligned, supportive, or aware without naming decision authority.', whatToFlag: 'Alignment is not approval. Nexus must identify who can release funds and authority.', mitigation: 'Route the decision to named approvers with explicit approve/reject actions.', preventsFailureModes: [1] },
    { id: 'business-case-leak', label: 'Business Case Leakage', detectionHint: 'Exact dollars or sensitive financial KPIs appear in chat or deliverables for a restricted user.', whatToFlag: 'Financial-sensitive values cannot be exposed to this user.', mitigation: 'Use qualitative summary and require finance/admin entitlement for exact values.', preventsFailureModes: [7, 9] },
    { id: 'readiness-handwave', label: 'Readiness Handwave', detectionHint: 'Change/readiness is summarized as training/comms without owner, impacted groups, or exception handling.', whatToFlag: 'Execution approval requires operational readiness, not launch language.', mitigation: 'Build readiness assessment, change plan, communications plan, and exception log.', preventsFailureModes: [5, 8] },
  ],

  coachingArc: {
    entry: 'Shift the user from design confidence to executive decision readiness. Identify decision owners, funding ask, and required evidence immediately.',
    midPhase: 'Build the approval package: business case, stakeholder alignment, readiness/change/comms, governance, risks, decision memo, and Tower handoff plan. Keep financial redaction active.',
    exit: 'Force a real decision: approve, reject, defer, or approve with conditions. Capture rationale, conditions, owners, and P6 handoff requirements.',
  },

  dependencies: {
    requiresFromPrior: [
      'P4 execution roadmap package',
      'P4 milestone and dependency plan',
      'P4 estimate assumptions and technology gap manifest',
      'P4 responsibility matrix',
      'P4 Tower monitoring requirements for P6 handoff',
      'P2 promise contract',
      'P3 design sign-off',
    ],
    producesForNext: ['Approved funding/authority decision', 'Mobilization package', 'Tower handoff plan', 'Risk acceptance record', 'Execution owner and reporting cadence'],
  },

  steps: [
    { id: 'p5-intake', label: 'Ingest roadmap and approval ask', complexity: 'simple', agentRole: 'extract', inputs: ['P4 roadmap'], outputs: ['approval ask summary'], templateRefs: [], preventsFailureModes: [1, 2], intentCaptureRequired: false, postMeetingUploadExpected: false },
    { id: 'p5-business-case', label: 'Assemble business case and funding request', complexity: 'complex', agentRole: 'compose_artifact', inputs: ['roadmap', 'promise contract'], outputs: ['business case'], templateRefs: ['financial-baseline'], preventsFailureModes: [2, 7, 9], intentCaptureRequired: true, postMeetingUploadExpected: true },
    { id: 'p5-stakeholder-alignment', label: 'Confirm stakeholder alignment and dissent', complexity: 'complex', agentRole: 'coach_interview', inputs: ['stakeholder map'], outputs: ['alignment record'], templateRefs: ['stakeholder-map'], preventsFailureModes: [1], intentCaptureRequired: true, postMeetingUploadExpected: true },
    { id: 'p5-readiness', label: 'Complete readiness/change/communications plan', complexity: 'complex', agentRole: 'validate', inputs: ['impacted groups', 'operating model'], outputs: ['readiness package'], templateRefs: [], preventsFailureModes: [5, 8], intentCaptureRequired: true, postMeetingUploadExpected: true },
    { id: 'p5-risk-acceptance', label: 'Record governance and risk acceptance', complexity: 'simple', agentRole: 'evaluate_evidence', inputs: ['risk register'], outputs: ['risk acceptance package'], templateRefs: ['decision-log'], preventsFailureModes: [6, 10], intentCaptureRequired: false, postMeetingUploadExpected: false },
    { id: 'p5-decision-memo', label: 'Compose decision / approval memo', complexity: 'simple', agentRole: 'compose_artifact', inputs: ['approval package'], outputs: ['decision memo'], templateRefs: ['program-charter'], preventsFailureModes: [1, 2], intentCaptureRequired: false, postMeetingUploadExpected: false },
    { id: 'p5-multi-approval', label: 'Route multi-approver decision', complexity: 'complex', agentRole: 'request_approval', inputs: ['decision memo'], outputs: ['approval decisions'], templateRefs: [], preventsFailureModes: [1, 10], intentCaptureRequired: false, postMeetingUploadExpected: false },
    { id: 'p5-p6-readiness', label: 'Prepare Tower handoff readiness', complexity: 'simple', agentRole: 'validate', inputs: ['approval decision', 'tower plan'], outputs: ['P6 entry package'], templateRefs: ['roadmap'], preventsFailureModes: [5, 9], intentCaptureRequired: false, postMeetingUploadExpected: false },
  ],
};
