// P4 Execution Roadmap · Phase Intelligence Pack
//
// P4 is not build execution. It is where the signed solution design becomes an
// executable delivery roadmap that external delivery teams, vendors, Jira,
// Smartsheet, ServiceNow, and Tower can run against after AbarVa's strategy
// lifecycle completes. Nexus must keep the user out of accidental build mode.

import type { PhasePack } from './types';

export const P4_BUILD: PhasePack = {
  phase: 4,
  label: 'P4 Execution Roadmap',
  outcome:
    'An execution-ready roadmap package that translates the signed P3 solution design into external delivery workstreams, phases, milestones, estimates, assumptions, dependencies, owners, governance cadence, success criteria, and Tower monitoring requirements. P4 is complete when a sponsor can see exactly how execution will run outside AbarVa, what it will require, what choices drive the estimate range, which milestones matter, and what evidence Tower will monitor after funding is approved. P4 is not where Nexus executes the build.',

  definitionOfDone: [
    {
      id: 'execution-roadmap-drafted',
      label: 'Execution roadmap drafted with workstreams, phases, and owners',
      severity: 'hard',
      evaluationHint:
        'A signed or accepted execution_plan/roadmap deliverable names workstreams, execution phases, owners, major activities, and handoff points to external delivery tools. A task list without owners and phase logic is not a roadmap.',
      preventsFailureModes: [2, 5, 8],
    },
    {
      id: 'execution-milestones-defined',
      label: 'Critical milestones and decision points defined',
      severity: 'hard',
      evaluationHint:
        'program_milestones or the roadmap deliverable names milestone, target window, owner, dependency, decision required, and evidence source. A date-only milestone is insufficient.',
      preventsFailureModes: [5, 8],
    },
    {
      id: 'execution-success-criteria-defined',
      label: 'Success criteria by execution phase tied to the P2 promise contract',
      severity: 'hard',
      evaluationHint:
        'Roadmap package maps each execution phase to observable success criteria, data source, owner, and acceptable variance. Criteria must trace back to the P2 baseline / promise contract or record a sponsor-approved change.',
      preventsFailureModes: [2, 9],
    },
    {
      id: 'estimate-range-with-assumptions',
      label: 'Estimate range documented with assumptions and configuration choices',
      severity: 'hard',
      evaluationHint:
        'Roadmap includes effort/cost/resource ranges, not unexplained point estimates. Assumptions name delivery model, internal/vendor split, tool/integration complexity, data readiness, and change burden. Restricted financial values must be redacted for users without finance visibility.',
      preventsFailureModes: [7, 9],
    },
    {
      id: 'technology-gap-manifest-produced',
      label: 'Technology gap manifest produced',
      severity: 'soft',
      evaluationHint:
        'Roadmap identifies system, data, integration, security, environment, and tooling gaps that must close before or during execution, with owner and mitigation path.',
      preventsFailureModes: [3, 6],
    },
    {
      id: 'responsibility-matrix-defined',
      label: 'Internal / vendor responsibility matrix defined',
      severity: 'soft',
      evaluationHint:
        'Roadmap or RACI names business, technology, data, security, finance, vendor/SI, and Tower responsibilities. It distinguishes accountable owner from contributor.',
      preventsFailureModes: [1, 5],
    },
    {
      id: 'implementation-governance-cadence-defined',
      label: 'Implementation governance cadence and escalation rules defined',
      severity: 'soft',
      evaluationHint:
        'Governance plan names steering cadence, attendees, metric pack, decision log owner, escalation thresholds, and who can accept risk during execution.',
      preventsFailureModes: [1, 5, 10],
    },
    {
      id: 'tower-monitoring-requirements-drafted',
      label: 'Tower monitoring requirements drafted',
      severity: 'soft',
      evaluationHint:
        'Roadmap names weekly/monthly status feed requirements, milestone/KPI fields, external source systems, alert thresholds, and data owner for P6 Tower Handoff.',
      preventsFailureModes: [5, 9],
    },
  ],

  rightQuestions: {
    open: [
      {
        id: 'roadmap-boundary',
        text: 'Before we draft the roadmap, what execution work happens outside AbarVa, and what must Tower observe after handoff?',
        why: 'P4 must keep Nexus in strategy-to-execution-planning mode rather than build-management mode.',
        expectedAnswerShape: 'Named external delivery tool/team plus the AbarVa-owned planning artifacts and Tower monitoring needs.',
        preventsFailureModes: [5],
      },
      {
        id: 'workstream-logic',
        text: 'What are the execution workstreams and which one is the critical path?',
        why: 'Roadmaps fail when they become flat task lists instead of sequenced execution logic.',
        expectedAnswerShape: 'Workstream list with owner, dependency, and critical-path rationale.',
        preventsFailureModes: [8],
      },
    ],
    converge: [
      {
        id: 'estimate-assumptions',
        text: 'Which assumptions drive the estimate range: delivery model, data readiness, integration complexity, vendor role, or change burden?',
        why: 'The sponsor needs to see why the range moves and what choices can reduce risk.',
        expectedAnswerShape: 'Assumption table with low/base/high drivers and sensitivity notes.',
        preventsFailureModes: [7, 9],
      },
      {
        id: 'tower-fields',
        text: 'What data must Tower receive weekly or monthly to know execution is drifting?',
        why: 'P6 handoff fails if monitoring requirements are invented after funding approval.',
        expectedAnswerShape: 'Milestone/KPI/status fields, source system, owner, cadence, threshold.',
        preventsFailureModes: [5, 9],
      },
    ],
    close: [
      {
        id: 'sponsor-roadmap-defense',
        text: 'Can the sponsor defend this roadmap as executable, funded-by-assumption, and observable by Tower?',
        why: 'P5 approval depends on a roadmap that can survive CFO/CIO scrutiny.',
        expectedAnswerShape: 'Sponsor-ready summary plus unresolved assumptions and explicit asks for P5.',
        preventsFailureModes: [1, 2, 9],
      },
    ],
  },

  antiPatterns: [
    {
      id: 'accidental-build-mode',
      label: 'Accidental Build Mode',
      detectionHint: 'User asks Nexus to execute sprints, assign Jira tickets, or run delivery inside AbarVa.',
      whatToFlag: 'AbarVa plans execution and Tower observes it; delivery happens in external delivery systems.',
      mitigation: 'Convert the request into roadmap fields, ownership, milestone, or Tower monitoring requirements.',
      preventsFailureModes: [5],
    },
    {
      id: 'single-point-estimate',
      label: 'Single-Point Estimate Theater',
      detectionHint: 'Roadmap uses one cost/date estimate without assumptions, range, or sensitivity.',
      whatToFlag: 'The sponsor cannot govern an unexplained point estimate.',
      mitigation: 'Document estimate range, assumptions, drivers, and decision choices that move the range.',
      preventsFailureModes: [7, 9],
    },
    {
      id: 'unobservable-roadmap',
      label: 'Unobservable Roadmap',
      detectionHint: 'Execution plan lacks milestone/KPI data feeds for Tower.',
      whatToFlag: 'P6 cannot monitor execution if P4 does not specify the reporting contract.',
      mitigation: 'Add Tower feed requirements, owners, cadence, thresholds, and escalation rules.',
      preventsFailureModes: [5, 9],
    },
  ],

  coachingArc: {
    entry:
      'Anchor the user: P4 is execution planning, not execution. Pull forward P3 design and P2 promise contract, then ask for workstream logic and external delivery boundary.',
    midPhase:
      'Force roadmap specificity: phases, milestones, owners, assumptions, estimates, dependencies, governance cadence, technology gaps, and Tower fields. Challenge flat task lists and unsupported estimates.',
    exit:
      'Package the roadmap for P5 approval. Confirm sponsor can defend the plan, the range, the risks, the readiness gaps, and the data Tower will use after handoff.',
  },

  dependencies: {
    requiresFromPrior: [
      'P3 signed solution / program design',
      'P2 promise contract, baseline, and kill criterion',
      'Known architecture, data, security, operating, and vendor implications',
      'Target cohort with inclusion/exclusion logic and generalisation limits',
      'Phase 3 findings, CXO interview, operating ownership, and support assumptions',
    ],
    producesForNext: [
      'Execution roadmap package',
      'Milestone and dependency plan',
      'Estimate range with assumptions',
      'Technology gap manifest',
      'Responsibility matrix',
      'Tower monitoring requirements for P6 handoff',
    ],
  },

  steps: [
    { id: 'p4-handoff-ingest', label: 'Ingest P3 design and P2 promise contract', complexity: 'simple', agentRole: 'extract', inputs: ['P3 design', 'P2 promise contract'], outputs: ['roadmap input summary'], templateRefs: [], preventsFailureModes: [2, 5], intentCaptureRequired: false, postMeetingUploadExpected: false },
    { id: 'p4-workstreams', label: 'Define execution workstreams and phase logic', complexity: 'complex', agentRole: 'compose_artifact', inputs: ['target state', 'operating model'], outputs: ['workstream map'], templateRefs: ['execution-plan'], preventsFailureModes: [5, 8], intentCaptureRequired: true, postMeetingUploadExpected: true },
    { id: 'p4-milestones', label: 'Define timeline, milestones, and decision points', complexity: 'simple', agentRole: 'compose_artifact', inputs: ['workstream map'], outputs: ['milestone plan'], templateRefs: ['roadmap'], preventsFailureModes: [8], intentCaptureRequired: false, postMeetingUploadExpected: false },
    { id: 'p4-estimates', label: 'Draft estimate ranges and assumptions', complexity: 'complex', agentRole: 'validate', inputs: ['roadmap', 'delivery model'], outputs: ['estimate assumptions'], templateRefs: ['financial-baseline'], preventsFailureModes: [7, 9], intentCaptureRequired: true, postMeetingUploadExpected: true },
    { id: 'p4-gap-manifest', label: 'Produce technology gap manifest', complexity: 'simple', agentRole: 'evaluate_evidence', inputs: ['architecture/data/security implications'], outputs: ['technology gap manifest'], templateRefs: [], preventsFailureModes: [3, 6], intentCaptureRequired: false, postMeetingUploadExpected: false },
    { id: 'p4-raci', label: 'Define internal/vendor responsibility matrix', complexity: 'simple', agentRole: 'compose_artifact', inputs: ['owners', 'vendors', 'workstreams'], outputs: ['responsibility matrix'], templateRefs: [], preventsFailureModes: [1, 5], intentCaptureRequired: false, postMeetingUploadExpected: false },
    { id: 'p4-governance', label: 'Define governance cadence and escalation rules', complexity: 'simple', agentRole: 'compose_artifact', inputs: ['steering model', 'risk posture'], outputs: ['implementation governance cadence'], templateRefs: ['decision-log'], preventsFailureModes: [1, 10], intentCaptureRequired: false, postMeetingUploadExpected: false },
    { id: 'p4-readiness', label: 'Prepare P5 roadmap approval package', complexity: 'simple', agentRole: 'request_approval', inputs: ['roadmap package'], outputs: ['P5 readiness packet'], templateRefs: ['execution-plan', 'roadmap'], preventsFailureModes: [1, 2, 9], intentCaptureRequired: false, postMeetingUploadExpected: false },
  ],
};
