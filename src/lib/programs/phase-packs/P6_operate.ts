// P6 Tower Handoff · Phase Intelligence Pack
//
// P6 is where AbarVa hands approved execution to delivery teams and configures
// Tower to observe, escalate, and track value. Nexus does not operate the build.

import type { PhasePack } from './types';

export const P6_OPERATE: PhasePack = {
  phase: 6,
  label: 'P6 Tower Handoff',
  outcome:
    'A completed handoff from Nexus strategy coaching to Tower execution observation. The phase produces an execution tracking contract: milestone/KPI reporting model, external status feed requirements, Tower alert thresholds, risk escalation rules, benefits tracking cadence, execution owner, closeout/kill criteria, and first-status intake path. P6 is complete when delivery teams know where execution happens, Tower knows what to monitor, and leaders know how decisions will be escalated.',

  definitionOfDone: [
    { id: 'execution-tracking-contract-signed', label: 'Execution tracking contract signed', severity: 'hard', evaluationHint: 'Handoff artifact names milestones, KPIs, cadence, source systems, owner, thresholds, and escalation path.', preventsFailureModes: [5, 9] },
    { id: 'external-status-feed-defined', label: 'External status feed defined', severity: 'hard', evaluationHint: 'Contract names Jira, Smartsheet, ServiceNow, vendor PMO, manual upload, or other source; field mapping and feed owner are identified.', preventsFailureModes: [3, 5] },
    { id: 'tower-alerts-configured', label: 'Tower alerts and thresholds configured', severity: 'hard', evaluationHint: 'Tower rules define milestone variance, KPI drift, risk severity, decision aging, and escalation recipient.', preventsFailureModes: [5, 10] },
    { id: 'benefits-tracking-cadence-defined', label: 'Benefits tracking cadence tied to promise contract', severity: 'hard', evaluationHint: 'Realized value review cadence maps to P2 promise contract metrics, owner, source, and decision rights.', preventsFailureModes: [2, 9] },
    { id: 'execution-owner-handoff-complete', label: 'Execution owner handoff complete', severity: 'hard', evaluationHint: 'Sarah or sponsor hands execution accountability to named delivery owner, with Tower observer and escalation owner recorded.', preventsFailureModes: [1, 5] },
    { id: 'first-status-intake-ready', label: 'First weekly status intake path ready', severity: 'soft', evaluationHint: 'The first weekly/monthly status can arrive by upload/API/manual entry and map into Tower fields.', preventsFailureModes: [5, 9] },
    { id: 'closeout-criteria-defined', label: 'Closeout, kill, or rebaseline criteria defined', severity: 'soft', evaluationHint: 'Program closeout criteria include executed scope, realized value, unresolved risks, pattern harvest, and kill/rebaseline triggers.', preventsFailureModes: [2, 10] },
  ],

  rightQuestions: {
    open: [
      { id: 'handoff-boundary', text: 'Who owns execution after P5, and what exactly does Tower monitor instead of manage?', why: 'P6 must clarify ownership boundary before handoff.', expectedAnswerShape: 'Delivery owner, sponsor escalation path, Tower observer, and external execution system.', preventsFailureModes: [1, 5] },
      { id: 'status-source', text: 'Where will weekly or monthly status come from, and what fields must Tower receive?', why: 'Tower cannot observe execution without a reporting contract.', expectedAnswerShape: 'Source, fields, cadence, owner, format, threshold.', preventsFailureModes: [3, 9] },
    ],
    converge: [
      { id: 'alert-thresholds', text: 'What variance, drift, risk, or decision-aging thresholds should trigger escalation?', why: 'Tower must know when normal monitoring becomes executive intervention.', expectedAnswerShape: 'Trigger, threshold, recipient, required decision, SLA.', preventsFailureModes: [5, 10] },
      { id: 'benefits-cadence', text: 'When will realized value be checked against the P2 promise contract, and who owns the measurement?', why: 'Handoff is incomplete if benefits tracking is not assigned.', expectedAnswerShape: 'Metric, source, cadence, owner, review forum, action rule.', preventsFailureModes: [2, 9] },
    ],
    close: [
      { id: 'handoff-complete', text: 'Can Sarah step out of Nexus coaching now because execution ownership, reporting, escalation, and benefits cadence are all assigned?', why: 'P6 closes the strategy lifecycle only when Tower can observe independently.', expectedAnswerShape: 'Yes/no with missing handoff items and owner for each gap.', preventsFailureModes: [1, 5, 9] },
    ],
  },

  antiPatterns: [
    { id: 'tower-as-pmo', label: 'Tower-as-PMO Confusion', detectionHint: 'User asks Tower/Nexus to run delivery ceremonies, assign build tasks, or manage vendor work.', whatToFlag: 'Tower observes and escalates; execution happens in delivery systems.', mitigation: 'Convert the request into status feed, alert, owner, or decision-card requirements.', preventsFailureModes: [5] },
    { id: 'status-deck-black-box', label: 'Status Deck Black Box', detectionHint: 'Execution status arrives only as narrative slides with no structured fields.', whatToFlag: 'Tower needs structured milestone, KPI, risk, and decision fields, even if the source is a deck upload.', mitigation: 'Define required fields and parsing/entry path for each status cycle.', preventsFailureModes: [3, 9] },
    { id: 'benefits-orphan', label: 'Benefits Orphan', detectionHint: 'Execution tracking monitors milestones but not realized value against the promise contract.', whatToFlag: 'A delivered milestone is not value realization.', mitigation: 'Add benefits cadence, metric owner, data source, and decision rule.', preventsFailureModes: [2, 9] },
  ],

  coachingArc: {
    entry: 'Make the handoff boundary explicit: delivery teams execute externally; Tower observes, detects drift, and escalates decisions.',
    midPhase: 'Build the tracking contract: external status feeds, milestone/KPI mapping, alert thresholds, escalation rules, benefits cadence, execution owner, and closeout criteria.',
    exit: 'Confirm Tower can run the first monitoring cycle without Nexus improvising missing fields. Capture handoff event and transition from coaching to observation.',
  },

  dependencies: {
    requiresFromPrior: [
      'P5 approved funding/authority decision',
      'P5 mobilization package',
      'P5 Tower handoff plan',
      'P5 risk acceptance record',
      'P5 execution owner and reporting cadence',
      'Execution roadmap',
      'P2 promise contract',
    ],
    producesForNext: ['Tower execution tracking contract', 'First status intake path', 'Escalation rules', 'Benefits tracking cadence', 'Closeout and pattern harvest criteria'],
  },

  steps: [
    { id: 'p6-handoff-intake', label: 'Ingest approval decision and roadmap', complexity: 'simple', agentRole: 'extract', inputs: ['P5 approval', 'P4 roadmap'], outputs: ['handoff summary'], templateRefs: ['roadmap'], preventsFailureModes: [1, 5], intentCaptureRequired: false, postMeetingUploadExpected: false },
    { id: 'p6-tracking-contract', label: 'Draft execution tracking contract', complexity: 'simple', agentRole: 'compose_artifact', inputs: ['roadmap', 'promise contract'], outputs: ['tracking contract'], templateRefs: ['execution-plan'], preventsFailureModes: [5, 9], intentCaptureRequired: false, postMeetingUploadExpected: false },
    { id: 'p6-status-feed', label: 'Define external status feed mapping', complexity: 'complex', agentRole: 'validate', inputs: ['external tools'], outputs: ['status feed map'], templateRefs: [], preventsFailureModes: [3, 9], intentCaptureRequired: true, postMeetingUploadExpected: true },
    { id: 'p6-alerts', label: 'Configure Tower alert thresholds and escalation rules', complexity: 'simple', agentRole: 'compose_artifact', inputs: ['status feed map'], outputs: ['alert rules'], templateRefs: ['decision-log'], preventsFailureModes: [5, 10], intentCaptureRequired: false, postMeetingUploadExpected: false },
    { id: 'p6-benefits', label: 'Define benefits tracking cadence', complexity: 'simple', agentRole: 'evaluate_evidence', inputs: ['promise contract'], outputs: ['benefits tracking cadence'], templateRefs: ['outcome-report'], preventsFailureModes: [2, 9], intentCaptureRequired: false, postMeetingUploadExpected: false },
    { id: 'p6-owner-handoff', label: 'Complete execution owner handoff', complexity: 'complex', agentRole: 'request_approval', inputs: ['tracking contract'], outputs: ['handoff acceptance'], templateRefs: [], preventsFailureModes: [1, 5], intentCaptureRequired: true, postMeetingUploadExpected: true },
    { id: 'p6-first-status', label: 'Prepare first status intake', complexity: 'simple', agentRole: 'validate', inputs: ['status feed map'], outputs: ['first status checklist'], templateRefs: ['meeting-notes'], preventsFailureModes: [5, 9], intentCaptureRequired: false, postMeetingUploadExpected: false },
    { id: 'p6-closeout', label: 'Define closeout and pattern harvest criteria', complexity: 'simple', agentRole: 'compose_artifact', inputs: ['promise contract', 'risk rules'], outputs: ['closeout criteria'], templateRefs: ['outcome-report'], preventsFailureModes: [2, 10], intentCaptureRequired: false, postMeetingUploadExpected: false },
  ],
};
