import type {
  ActivityEntry,
  AdvanceResult,
  ArchetypeKey,
  ContextSource,
  CreateProgramRequest,
  DeliverableSummary,
  DraftResult,
  ExecuteSurfaceProps,
  InboxItem,
  Milestone,
  ModuleContent,
  ModuleState,
  NextTurn,
  NexusDraft,
  NexusFlag,
  OriginationForm,
  OriginationRequest,
  OriginationStageEvent,
  PatternLibraryItem,
  PatternMatch,
  PersonRef,
  PortfolioFilters,
  ProgramFullState,
  ProgramSummary,
  Question,
  Risk,
  StatusReport,
  Synthesis,
  Turn,
  ViewerRole,
  WorkItem,
} from '@/lib/programs/types';

const PEOPLE: Record<string, PersonRef> = {
  sarah: { id: 'person-sarah-kline', name: 'Sarah Kline', title: 'Chief Transformation Officer', initials: 'SK', avatarColor: '#0f766e', clientName: 'Meridian Health System' },
  jake: { id: 'person-jake-chen', name: 'Jake Chen', title: 'Program Lead', initials: 'JC', avatarColor: '#1d4ed8', clientName: 'Meridian Health System' },
  amy: { id: 'person-amy-shah', name: 'Amy Shah', title: 'Clinical Operations Lead', initials: 'AS', avatarColor: '#9333ea', clientName: 'Meridian Health System' },
  mike: { id: 'person-mike-bowen', name: 'Mike Bowen', title: 'IT Platform Director', initials: 'MB', avatarColor: '#b45309', clientName: 'Meridian Health System' },
  lena: { id: 'person-lena-morales', name: 'Lena Morales', title: 'Maestro Oversight', initials: 'LM', avatarColor: '#be123c' },
  priya: { id: 'person-priya-nair', name: 'Priya Nair', title: 'Workstream Lead', initials: 'PN', avatarColor: '#0ea5e9', clientName: 'Meridian Health System' },
  noah: { id: 'person-noah-brooks', name: 'Noah Brooks', title: 'Finance Partner', initials: 'NB', avatarColor: '#16a34a', clientName: 'Meridian Health System' },
  elena: { id: 'person-elena-ford', name: 'Elena Ford', title: 'Chief Financial Officer', initials: 'EF', avatarColor: '#7c3aed', clientName: 'First Capital Financial' },
  maya: { id: 'person-maya-ortiz', name: 'Maya Ortiz', title: 'Retail Operations VP', initials: 'MO', avatarColor: '#ea580c', clientName: 'Apex Retail Group' },
};

const archetypeLabelMap: Record<ArchetypeKey, string> = {
  strategic_transformation: 'Strategic Transformation',
  workflow_automation: 'Workflow Automation',
  platform_modernization: 'Platform Modernization',
  ai_product_enablement: 'AI Product Enablement',
  operational_optimization: 'Operational Optimization',
};

const MODULE_NAMES: Record<string, string> = {
  'problem-framing': 'Problem Framing',
  'stakeholder-map': 'Stakeholder Map',
  'success-criteria': 'Success Criteria Definition',
  'baseline-data-request': 'Baseline Data Request',
  'diagnostic-instrument': 'Diagnostic Instrument',
  'data-analysis-findings': 'Data Analysis + Findings',
  'contradiction-surface': 'Contradiction Surface',
  'cxo-interview': 'CXO Interview Prep + Capture',
  'solution-library-match': 'Solution Library Match',
  'vendor-tech-evaluation': 'Vendor/Tech Evaluation',
  'tradeoff-matrix': 'Tradeoff Matrix + Recommendation',
  'business-case-roi': 'Business Case + ROI',
  'implementation-plan': 'Implementation Plan',
  'build-integration-tracking': 'Build + Integration Tracking',
  'change-management-plan': 'Change Management Plan',
  'outcome-measurement': 'Outcome Measurement',
  'benefits-realization': 'Benefits Realization + Genome Feedback',
};

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

const patterns: PatternLibraryItem[] = [
  {
    key: 'ambient-docs-rollout',
    name: 'Ambient Docs Rollout',
    archetype: 'workflow_automation',
    promotionState: 'proven',
    summary: 'Clinical ambient documentation pattern with charter preload, stakeholder templates, and phased verification.',
    typicalDurationMonths: 5,
    deploymentCount: 14,
    preloadDepthPct: 68,
  },
  {
    key: 'ams-optimization',
    name: 'AMS Optimization',
    archetype: 'operational_optimization',
    promotionState: 'mature',
    summary: 'Managed services optimization for labor transition, savings capture, and change-management governance.',
    typicalDurationMonths: 6,
    deploymentCount: 22,
    preloadDepthPct: 62,
  },
  {
    key: 'clinical-workflow-automation',
    name: 'Clinical Workflow Automation',
    archetype: 'ai_product_enablement',
    promotionState: 'proven',
    summary: 'Clinical workflow automation with diagnostic instrumentation, deployment evidence, and outcome tracking.',
    typicalDurationMonths: 4,
    deploymentCount: 11,
    preloadDepthPct: 64,
  },
  {
    key: 'pdlc-capital-reallocation',
    name: 'PDLC Capital Reallocation',
    archetype: 'strategic_transformation',
    promotionState: 'candidate',
    summary: 'Custom PDLC-informed capital reallocation pattern with executive tradeoff framing.',
    typicalDurationMonths: 3,
    deploymentCount: 3,
    preloadDepthPct: 48,
  },
];

function makeDeliverable(id: string, title: string, moduleKey: string, version: number, owner: PersonRef, summary: string, status: DeliverableSummary['status']): DeliverableSummary {
  return { id, title, moduleKey, version, owner, summary, status, updatedAt: hoursAgo(version * 8), };
}

const ambientModules: ModuleState[] = [
  { moduleKey: 'problem-framing', name: MODULE_NAMES['problem-framing'], phase: 2, status: 'signed_off', currentVersion: 2, lastEditedBy: PEOPLE.jake, lastEditedAt: daysAgo(2), deliverableIds: ['deliv-problem-framing'] },
  { moduleKey: 'stakeholder-map', name: MODULE_NAMES['stakeholder-map'], phase: 2, status: 'draft', currentVersion: 1, lastEditedBy: PEOPLE.jake, lastEditedAt: hoursAgo(6), nexusDraftPending: true, deliverableIds: ['deliv-stakeholders'] },
  { moduleKey: 'success-criteria', name: MODULE_NAMES['success-criteria'], phase: 2, status: 'in_progress', currentVersion: 1, lastEditedBy: PEOPLE.amy, lastEditedAt: hoursAgo(14), deliverableIds: ['deliv-success'] },
  { moduleKey: 'baseline-data-request', name: MODULE_NAMES['baseline-data-request'], phase: 2, status: 'blocked', blockerReason: 'Waiting on Meridian IT extracts for baseline utilization and turnaround time.', lastEditedBy: PEOPLE.mike, lastEditedAt: hoursAgo(18), deliverableIds: ['deliv-baseline'] },
];

const ambientContent: Record<string, ModuleContent> = {
  'problem-framing': {
    summary: 'Pattern-preloaded problem statement, scope boundaries, and sponsor objective.',
    formFields: [
      { label: 'Core problem', value: 'Ambient documentation workflows vary by service line, creating uneven clinician adoption and documentation quality.', hint: 'Pre-loaded from matched pattern and origination notes.' },
      { label: 'Why now', value: 'Meridian wants to compress pilot-to-scale time before FY27 budgeting closes.' },
      { label: 'Success lens', value: 'Reduce clinician after-hours charting while preserving coding integrity.' },
    ],
  },
  'stakeholder-map': {
    summary: 'Eight stakeholder groups pre-populated from org context and relationship notes.',
    formFields: [
      { label: 'Decision owner', value: 'Sarah Kline approves charter, gate progression, and sponsor interview scheduling.' },
      { label: 'Implementation lead', value: 'Jake Chen coordinates clinical, IT, and vendor sequencing.' },
      { label: 'Escalation trigger', value: 'Any baseline metric delay beyond 48h or privacy review slip beyond five business days.' },
    ],
    stakeholders: [
      { id: 'st-sarah', name: 'Sarah Kline', role: 'Sponsor', x: 82, y: 18, quadrant: 'manage_closely' },
      { id: 'st-jake', name: 'Jake Chen', role: 'Program lead', x: 72, y: 38, quadrant: 'manage_closely' },
      { id: 'st-amy', name: 'Amy Shah', role: 'Clinical ops', x: 76, y: 62, quadrant: 'keep_satisfied' },
      { id: 'st-mike', name: 'Mike Bowen', role: 'IT platform', x: 58, y: 52, quadrant: 'manage_closely' },
      { id: 'st-priya', name: 'Priya Nair', role: 'Change lead', x: 48, y: 70, quadrant: 'keep_informed' },
      { id: 'st-noah', name: 'Noah Brooks', role: 'Finance', x: 62, y: 28, quadrant: 'keep_satisfied' },
      { id: 'st-megan', name: 'Megan Reese', role: 'Physician champion', x: 36, y: 46, quadrant: 'keep_informed' },
      { id: 'st-omar', name: 'Omar Hale', role: 'Privacy counsel', x: 26, y: 30, quadrant: 'monitor' },
    ],
  },
  'success-criteria': {
    summary: 'Four of five success criteria are already shaped and one remains open pending data availability.',
    tracker: [
      { label: 'After-hours charting minutes / clinician / day', baseline: '39 min', target: '22 min', current: 'Pending baseline', trend: 'Waiting on pull' },
      { label: 'Pilot activation cycle time', baseline: '11 weeks', target: '6 weeks', current: '8 weeks forecast', trend: 'Down' },
      { label: 'Documentation completion within 24h', baseline: '71%', target: '90%', current: 'Pilot 84%', trend: 'Up' },
      { label: 'Coder correction rate', baseline: '6.8%', target: '<5%', current: '5.2%', trend: 'Improving' },
    ],
  },
  'baseline-data-request': {
    summary: 'Blocked baseline request with dependency on Meridian IT extracts and privacy review.',
    formFields: [
      { label: 'Requested datasets', value: 'Charting timestamps, coder correction logs, service-line deployment roster, vendor usage exports.' },
      { label: 'Owner', value: 'Mike Bowen + Meridian analytics team' },
      { label: 'Current blocker', value: 'Utilization export schema changed last week and needs remapping.' },
    ],
  },
};

const amsMilestones: Milestone[] = [
  { id: 'm1', name: 'Transition blueprint locked', owner: PEOPLE.jake, status: 'done', plannedWindow: 'Apr 1 - Apr 9', actualWindow: 'Apr 1 - Apr 8', progressLabel: 'Signed off', evidenceCount: 4 },
  { id: 'm2', name: 'Offshore handoff wave 1', owner: PEOPLE.amy, status: 'in_progress', plannedWindow: 'Apr 10 - Apr 24', progressLabel: '62% complete', evidenceCount: 5 },
  { id: 'm3', name: 'Automation accuracy stabilization', owner: PEOPLE.mike, status: 'at_risk', plannedWindow: 'Apr 18 - May 2', progressLabel: '+1 week drift', evidenceCount: 2 },
  { id: 'm4', name: 'Savings attribution audit', owner: PEOPLE.noah, status: 'not_started', plannedWindow: 'May 1 - May 8', progressLabel: 'Queued', evidenceCount: 0 },
];

const amsWork: WorkItem[] = [
  { id: 'w1', title: 'Validate 45-FTE transition plan', milestoneId: 'm2', assignee: PEOPLE.jake, status: 'blocked', dueLabel: 'Overdue by 3 days', dependency: 'HR review', nexusDrafted: false },
  { id: 'w2', title: 'Refresh automation QA thresholds', milestoneId: 'm3', assignee: PEOPLE.amy, status: 'in_progress', dueLabel: 'Due tomorrow', nexusDrafted: true },
  { id: 'w3', title: 'Finalize change champion roster', milestoneId: 'm2', assignee: PEOPLE.priya, status: 'done', dueLabel: 'Completed yesterday', nexusDrafted: false },
  { id: 'w4', title: 'Attach savings evidence to wave 1', milestoneId: 'm4', assignee: PEOPLE.noah, status: 'not_started', dueLabel: 'Due in 4 days', nexusDrafted: true },
  { id: 'w5', title: 'Resolve vendor delay on monitoring feed', milestoneId: 'm3', assignee: PEOPLE.mike, status: 'done', dueLabel: 'Closed 2 days ago', nexusDrafted: false },
  { id: 'w6', title: 'Prepare sponsor weekly report', milestoneId: 'm4', assignee: PEOPLE.jake, status: 'in_progress', dueLabel: 'Sunday draft', nexusDrafted: true },
];

const amsRisks: Risk[] = [
  { id: 'r1', severity: 'critical', title: 'Transition plan for 45 FTEs is stalled in HR review', owner: PEOPLE.jake, mitigation: 'Escalate HR signoff to sponsor and split approval into two cohorts.', status: 'open' },
  { id: 'r2', severity: 'medium', title: 'Automation accuracy drift in complex ticket classes', owner: PEOPLE.amy, mitigation: 'Run a 7-day QA burn-down with manual reviewer pairing.', status: 'watching' },
  { id: 'r3', severity: 'low', title: 'Vendor delay on monitoring feed resolved but still needs retrospective', owner: PEOPLE.mike, mitigation: 'Close with runbook update and add to cohort failure modes.', status: 'resolved' },
];

const amsEvidence = [
  { id: 'e1', title: 'Wave 1 cutover checklist', kind: 'report' as const, relatedTo: 'm2', summary: 'Signed cutover checklist with operations and IT initials.' },
  { id: 'e2', title: 'Savings attribution workbook', kind: 'metric' as const, relatedTo: 'm4', summary: 'Tracked savings at $1.8M against a $4.2M annualized target.' },
  { id: 'e3', title: 'QA error distribution export', kind: 'log' as const, relatedTo: 'm3', summary: 'Shows concentration in three complex ticket categories.' },
  { id: 'e4', title: 'Executive steering notes', kind: 'approval' as const, relatedTo: 'm2', summary: 'Sponsor-approved staffing sequence and reporting cadence.' },
];

const amsReports: StatusReport[] = [
  { id: 'rep-1', title: 'Week 16 sponsor readout', audience: 'sponsor', summary: 'Savings on track, transition approval stalled, mitigation underway.', draftedBy: 'nexus', publishedAt: hoursAgo(30) },
  { id: 'rep-2', title: 'Execution checkpoint brief', audience: 'lead', summary: 'Milestone 3 drifting by one week due to QA stabilization.', draftedBy: 'lead', publishedAt: hoursAgo(42) },
];

const executeContent: Record<string, ModuleContent> = {
  'build-integration-tracking': {
    summary: 'Execution tracker with milestone, assignee, and evidence coverage.',
    tracker: [
      { label: 'Milestones complete', baseline: '0', target: '6', current: '3', trend: 'On pace' },
      { label: 'Tracked savings', baseline: '$0', target: '$4.2M', current: '$1.8M', trend: 'Positive' },
      { label: 'Critical blockers', baseline: '0', target: '0', current: '1', trend: 'Needs action' },
    ],
  },
  'change-management-plan': {
    summary: 'Change-management stream is behind pattern expectations and drives the current drift flag.',
    formFields: [
      { label: 'Champion cadence', value: 'Weekly huddle in place with 12 site champions.' },
      { label: 'Training package', value: 'Wave 2 materials drafted, pending HR review alignment.' },
      { label: 'Current gap', value: 'Transition communications are lagging by one review cycle.' },
    ],
  },
};

const verifyContent: Record<string, ModuleContent> = {
  'outcome-measurement': {
    summary: 'Live dashboard tying baseline, target, current, and cohort overlay together.',
    tracker: [
      { label: 'Prior authorization turnaround', baseline: '52 hours', target: '28 hours', current: '24 hours', trend: 'Ahead' },
      { label: 'Manual touches / case', baseline: '7.2', target: '3.0', current: '2.8', trend: 'Ahead' },
      { label: 'Nurse overtime spend', baseline: '$410K/qtr', target: '$290K/qtr', current: '$301K/qtr', trend: 'Down' },
    ],
  },
  'benefits-realization': {
    summary: 'Benefits realization closeout with sponsor attestation and Genome feedback.',
    narrativeBlocks: [
      { title: 'Outcome attestation', body: 'Sponsor confirms the program delivered measurable cycle-time improvement with no clinical quality degradation.' },
      { title: 'Failure modes avoided', body: 'Pattern guardrails around privacy review and physician champion sequencing prevented typical pilot drift.' },
      { title: 'Genome feedback', body: 'Promote the revised baseline capture checklist into the pattern preload for future healthcare rollouts.' },
    ],
  },
};

function phaseState(canonicalPhase: number, name: string, state: ProgramFullState['phases'][number]['state'], summary: string, gateType: ProgramFullState['phases'][number]['gateType']): ProgramFullState['phases'][number] {
  return { canonicalPhase, name, state, summary, gateType };
}

const programs: ProgramFullState[] = [
  {
    id: 'ambient-docs-rollout',
    name: 'Ambient Documentation Rollout',
    clientName: 'Meridian Health System',
    archetype: 'workflow_automation',
    charter: {
      headline: 'Scale ambient documentation from pilot to enterprise service-line rollout.',
      bullets: [
        'Lock the service-line rollout scope and deployment sequencing across Meridian acute and ambulatory care.',
        'Confirm sponsor-level outcomes tied to clinician time saved, chart completion, and coding integrity.',
        'Capture baseline requests before Diagnose so hard-gate quality holds.',
      ],
      sponsorDecision: 'Approve the Charter package and confirm the baseline request owner.',
      baselineNeed: 'Utilization, coding correction, and service-line readiness extracts from Meridian analytics.',
    },
    currentPhase: 2,
    shape: 'pattern',
    patternKey: 'ambient-docs-rollout',
    patternName: 'Ambient Docs Rollout',
    phases: [
      phaseState(1, 'Origination', 'complete', 'Problem framing locked and shape selected.', 'none'),
      phaseState(2, 'Charter', 'active', 'Stakeholder map and success criteria are actively being shaped.', 'hard'),
      phaseState(3, 'Diagnose', 'locked', 'Hard-gated on signed Charter and baseline request.', 'hard'),
      phaseState(4, 'Design', 'locked', 'Recommendation work opens after findings synthesis.', 'soft'),
      phaseState(5, 'Execute', 'locked', 'Execution unlocks after Design approval.', 'hard'),
      phaseState(6, 'Verify', 'locked', 'Verification follows implementation evidence.', 'hard'),
    ],
    modules: ambientModules,
    team: [
      { ...PEOPLE.sarah, role: 'sponsor', workstream: 'Executive sponsor', activitySummary: 'Decision owner for Phase 2 hard gate', notificationState: 'priority' },
      { ...PEOPLE.jake, role: 'lead', workstream: 'Program orchestration', activitySummary: 'Driving charter completion and baseline unblock', notificationState: 'all' },
      { ...PEOPLE.amy, role: 'team_member', workstream: 'Clinical workflow', activitySummary: 'Owns success-criteria refinement', notificationState: 'all' },
      { ...PEOPLE.mike, role: 'team_member', workstream: 'Data + platform', activitySummary: 'Owns baseline request fulfillment', notificationState: 'priority' },
      { ...PEOPLE.lena, role: 'maestro', workstream: 'Oversight', activitySummary: 'Watching pattern adherence and gate quality', notificationState: 'priority' },
    ],
    activity: [
      { id: 'act-a1', type: 'approval', title: 'Charter signoff queued', detail: 'Sarah Kline has 14 hours left on the Charter SLA.', at: hoursAgo(10), actor: PEOPLE.jake },
      { id: 'act-a2', type: 'risk', title: 'Baseline extract blocked', detail: 'Meridian IT schema change requires remapping before data pull.', at: hoursAgo(18), actor: PEOPLE.mike },
      { id: 'act-a3', type: 'nexus', title: 'Nexus preload refreshed', detail: 'Relationship notes pulled into the stakeholder draft with provenance.', at: hoursAgo(22), actor: PEOPLE.jake },
    ],
    linkedIntelligenceThreads: [
      { id: 'thread-ambient-1', title: 'Ambient docs sizing and scope thread', source: 'intelligence', lastTouchedAt: daysAgo(3) },
      { id: 'thread-ambient-2', title: 'Pilot benchmark comparisons', source: 'intelligence', lastTouchedAt: daysAgo(6) },
    ],
    sponsorPerson: PEOPLE.sarah,
    leadPerson: PEOPLE.jake,
    phaseStatus: 'awaiting_gate',
    gateSummary: 'Diagnose remains locked until Charter is signed off and the baseline extract arrives.',
    gateStatus: 'pending',
    deliverables: [
      makeDeliverable('deliv-problem-framing', 'Problem Framing Brief', 'problem-framing', 2, PEOPLE.jake, 'Signed-off scope statement and sponsor framing.', 'signed_off'),
      makeDeliverable('deliv-stakeholders', 'Stakeholder Map', 'stakeholder-map', 1, PEOPLE.jake, 'Draft 2x2 influence-interest map with 8 Meridian leaders.', 'draft'),
      makeDeliverable('deliv-success', 'Success Criteria Sheet', 'success-criteria', 1, PEOPLE.amy, 'Four defined success metrics and one pending baseline input.', 'in_review'),
      makeDeliverable('deliv-baseline', 'Baseline Data Request Pack', 'baseline-data-request', 1, PEOPLE.mike, 'Blocked request packet waiting on Meridian IT extracts.', 'draft'),
    ],
    metrics: [
      { label: 'Active modules', value: '4', tone: 'teal' },
      { label: 'Gate SLA', value: '14h', tone: 'amber' },
      { label: 'Stakeholders mapped', value: '8', tone: 'default' },
      { label: 'Baseline blockers', value: '1', tone: 'red' },
    ],
    sponsorDashboard: {
      openDecisions: ['Approve Charter package for Phase 3 entry.', 'Confirm sponsor attendee for the Phase 3 CXO interview.'],
      milestones: ['Problem Framing signed off.', 'Stakeholder map draft is ready for sponsor review.'],
      keyFindings: ['Baseline request is the only hard blocker.', 'Pattern preload already covers 80% of stakeholder framing.'],
      outcomeSignal: 'If the gate clears this week, Diagnose starts on schedule Monday morning.',
    },
    nexusPanel: {
      programId: 'ambient-docs-rollout',
      mode: 'collapsed',
      activeTab: 'chat',
      thread: {
        id: 'program-thread-ambient',
        title: 'Ambient docs delivery thread',
        turns: [
          { id: 'turn-1', speaker: 'lead', text: 'What still blocks the Charter hard gate?' },
          { id: 'turn-2', speaker: 'nexus', text: 'Baseline extracts and sponsor signoff remain outstanding; both are cited in the gate summary.' },
        ],
      },
      drafts: [
        { id: 'draft-ambient-1', title: 'Stakeholder map draft', moduleKey: 'stakeholder-map', status: 'pending_review', summary: 'Pattern-preloaded influence map with 8 stakeholders and sponsor notes.' },
      ],
      flags: [
        { id: 'flag-ambient-1', severity: 'medium', title: 'Baseline dependency gap', detail: 'Diagnose will slip if Meridian IT does not remap the extract within 48 hours.' },
        { id: 'flag-ambient-2', severity: 'low', title: 'Change lead not yet confirmed', detail: 'Priya Nair is tagged provisional until sponsor confirms workstream ownership.' },
      ],
      sources: [
        { id: 'source-ambient-1', label: 'Ambient Docs Rollout pattern v3', sourceType: 'pattern', detail: '14 deployments with 68% preload depth.' },
        { id: 'source-ambient-2', label: 'Meridian org notes', sourceType: 'l2', detail: 'Relationship notes and org map from Dec 2025 fieldwork.' },
        { id: 'source-ambient-3', label: 'Origination thread summary', sourceType: 'l3', detail: 'Scoped from Intelligence thread and accepted in Path 1.' },
      ],
    },
    moduleContent: ambientContent,
  },
  {
    id: 'ams-optimization',
    name: 'AMS Optimization',
    clientName: 'Meridian Health System',
    archetype: 'operational_optimization',
    charter: {
      headline: 'Capture labor savings and service quality gains from AMS transition redesign.',
      bullets: [
        'Drive managed services savings toward a $4.2M annualized target while protecting service continuity.',
        'Track workforce transition, QA stability, and sponsor reporting in one execution surface.',
        'Collect evidence in Execute so Verify can attest benefits cleanly.',
      ],
      sponsorDecision: 'Confirm whether the stalled transition plan should escalate to the sponsor steering committee.',
      baselineNeed: 'Savings attribution audit and QA variance tracking remain active evidence dependencies.',
    },
    currentPhase: 5,
    shape: 'pattern',
    patternKey: 'ams-optimization',
    patternName: 'AMS Optimization',
    phases: [
      phaseState(1, 'Origination', 'complete', 'Pattern selected with AMS optimization preload.', 'none'),
      phaseState(2, 'Charter', 'complete', 'Scope and baseline requirements signed off.', 'hard'),
      phaseState(3, 'Diagnose', 'complete', 'Findings and CXO interview captured.', 'hard'),
      phaseState(4, 'Design', 'complete', 'Recommendation and business case approved.', 'hard'),
      phaseState(5, 'Execute', 'active', 'Execution tracking, risks, and evidence are live.', 'soft'),
      phaseState(6, 'Verify', 'locked', 'Unlocks after Design-approved execution evidence is complete.', 'hard'),
    ],
    modules: [
      { moduleKey: 'implementation-plan', name: MODULE_NAMES['implementation-plan'], phase: 5, status: 'signed_off', currentVersion: 2, lastEditedBy: PEOPLE.jake, lastEditedAt: daysAgo(5) },
      { moduleKey: 'build-integration-tracking', name: MODULE_NAMES['build-integration-tracking'], phase: 5, status: 'in_progress', currentVersion: 3, lastEditedBy: PEOPLE.jake, lastEditedAt: hoursAgo(5), deliverableIds: ['deliv-ams-report'] },
      { moduleKey: 'change-management-plan', name: MODULE_NAMES['change-management-plan'], phase: 5, status: 'blocked', blockerReason: 'Transition communications are waiting on HR review.', lastEditedBy: PEOPLE.priya, lastEditedAt: hoursAgo(7) },
    ],
    team: [
      { ...PEOPLE.sarah, role: 'sponsor', workstream: 'Executive sponsor', activitySummary: 'Reads weekly reports and approves escalations', notificationState: 'priority' },
      { ...PEOPLE.jake, role: 'lead', workstream: 'Execution lead', activitySummary: 'Owns milestone progression and sponsor reporting', notificationState: 'all' },
      { ...PEOPLE.amy, role: 'team_member', workstream: 'QA + operations', activitySummary: 'Owns automation accuracy stabilization', notificationState: 'all' },
      { ...PEOPLE.mike, role: 'team_member', workstream: 'Vendor + tooling', activitySummary: 'Closed monitoring feed issue and maintains integrations', notificationState: 'priority' },
      { ...PEOPLE.noah, role: 'team_member', workstream: 'Finance', activitySummary: 'Owns savings attribution evidence pack', notificationState: 'all' },
    ],
    activity: [
      { id: 'act-b1', type: 'risk', title: 'Transition plan blocked', detail: '45-FTE transition package is waiting on HR review.', at: hoursAgo(8), actor: PEOPLE.jake },
      { id: 'act-b2', type: 'milestone', title: 'Milestone 2 at 62%', detail: 'Wave 1 offshore handoff is tracking but needs sponsor escalation.', at: hoursAgo(11), actor: PEOPLE.amy },
      { id: 'act-b3', type: 'deliverable', title: 'Weekly report drafted', detail: 'Nexus drafted the Sunday sponsor report for Jake to edit.', at: hoursAgo(20), actor: PEOPLE.jake },
    ],
    sponsorPerson: PEOPLE.sarah,
    leadPerson: PEOPLE.jake,
    phaseStatus: 'blocked',
    gateSummary: 'Execution remains active, but the HR approval blocker must clear before Wave 2 starts.',
    gateStatus: 'blocked',
    deliverables: [
      makeDeliverable('deliv-ams-report', 'Week 16 Sponsor Report', 'build-integration-tracking', 3, PEOPLE.jake, 'Sponsor-facing status report with savings, drift, and risks.', 'in_review'),
    ],
    metrics: [
      { label: 'Savings tracked', value: '$1.8M', tone: 'teal' },
      { label: 'Target', value: '$4.2M', tone: 'default' },
      { label: 'Drift', value: '+1 week', tone: 'amber' },
      { label: 'Critical risks', value: '1', tone: 'red' },
    ],
    sponsorDashboard: {
      openDecisions: ['Escalate HR review for the transition plan.', 'Confirm whether Wave 2 should hold until QA thresholds stabilize.'],
      milestones: ['Three milestones complete.', 'Wave 1 is 62% complete with evidence attached.'],
      keyFindings: ['Savings are tracking to plan.', 'Change-management drift is the strongest risk signal.'],
      outcomeSignal: 'If the sponsor escalation lands this week, the program recovers most of the one-week slip.',
    },
    nexusPanel: {
      programId: 'ams-optimization',
      mode: 'collapsed',
      activeTab: 'flags',
      thread: {
        id: 'program-thread-ams',
        title: 'AMS execute thread',
        turns: [
          { id: 'turn-ams-1', speaker: 'lead', text: 'Summarize the savings attribution gap for the sponsor report.' },
          { id: 'turn-ams-2', speaker: 'nexus', text: 'Savings are directional but the Wave 1 evidence pack is still missing finance signoff.' },
        ],
      },
      drafts: [
        { id: 'draft-ams-1', title: 'Week 16 status report', moduleKey: 'build-integration-tracking', status: 'ready', summary: 'Sunday weekly report drafted with sponsor-ready language.' },
        { id: 'draft-ams-2', title: 'Savings attribution audit memo', moduleKey: 'build-integration-tracking', status: 'needs_context', summary: 'Waiting on finance evidence before finalizing attribution memo.' },
      ],
      flags: [
        { id: 'flag-ams-1', severity: 'high', title: 'Savings attribution audit incomplete', detail: 'Evidence gap could weaken Verify-phase benefit attestation.' },
        { id: 'flag-ams-2', severity: 'high', title: 'Pattern drift on change management', detail: 'Skipped communication milestones are diverging from the mature AMS pattern.' },
        { id: 'flag-ams-3', severity: 'medium', title: 'Milestone slip > 1 week', detail: 'Automation QA stabilization is pushing the next milestone by seven days.' },
      ],
      sources: [
        { id: 'source-ams-1', label: 'AMS Optimization mature pattern', sourceType: 'pattern', detail: '22 deployments with mature change-management guardrails.' },
        { id: 'source-ams-2', label: 'Meridian savings workbook', sourceType: 'l2', detail: 'Finance workbook and execution evidence updated yesterday.' },
        { id: 'source-ams-3', label: 'Phase 3 findings', sourceType: 'l3', detail: 'Findings pack tied labor transition timing to savings capture risk.' },
      ],
    },
    moduleContent: executeContent,
    executeData: {
      programId: 'ams-optimization',
      activeTab: 'work',
      milestones: amsMilestones,
      workItems: amsWork,
      risks: amsRisks,
      evidence: amsEvidence,
      reports: amsReports,
      viewerRole: 'lead',
    },
  },
  {
    id: 'it-capital-reallocation',
    name: 'IT Capital Reallocation via PDLC',
    clientName: 'Meridian Health System',
    archetype: 'strategic_transformation',
    charter: {
      headline: 'Reallocate IT capital toward higher-return productivity programs using PDLC framing.',
      bullets: [
        'Use a custom PDLC shape with executive tradeoff framing and portfolio-weighted business case logic.',
        'Surface stranded spend and investment shifts before the next capital committee.',
        'Keep charter rigor and governance while allowing a custom phase/module set.',
      ],
      sponsorDecision: 'Agree the custom PDLC shape is the right fit before Diagnose patterns are added.',
      baselineNeed: 'Capital allocation baseline and stranded-cost inventory still need finance confirmation.',
    },
    currentPhase: 2,
    shape: 'custom',
    patternKey: 'pdlc-capital-reallocation',
    patternName: 'PDLC Capital Reallocation',
    phases: [
      phaseState(1, 'Origination', 'complete', 'Custom PDLC shape selected at origination.', 'none'),
      phaseState(2, 'Charter', 'active', 'Executive charter and tradeoff framing underway.', 'hard'),
      phaseState(3, 'Diagnose', 'locked', 'Opens when sponsor confirms capital baseline.', 'hard'),
      phaseState(4, 'Design', 'locked', 'Custom tradeoff design opens after Diagnose.', 'soft'),
    ],
    modules: [
      { moduleKey: 'stakeholder-map', name: MODULE_NAMES['stakeholder-map'], phase: 2, status: 'in_review', currentVersion: 1, lastEditedBy: PEOPLE.jake, lastEditedAt: hoursAgo(9) },
      { moduleKey: 'success-criteria', name: MODULE_NAMES['success-criteria'], phase: 2, status: 'in_progress', currentVersion: 1, lastEditedBy: PEOPLE.noah, lastEditedAt: hoursAgo(16) },
      { moduleKey: 'tradeoff-matrix', name: MODULE_NAMES['tradeoff-matrix'], phase: 2, status: 'draft', currentVersion: 1, lastEditedBy: PEOPLE.noah, lastEditedAt: hoursAgo(22), nexusDraftPending: true },
      { moduleKey: 'business-case-roi', name: MODULE_NAMES['business-case-roi'], phase: 2, status: 'draft', currentVersion: 1, lastEditedBy: PEOPLE.jake, lastEditedAt: hoursAgo(26) },
    ],
    team: [
      { ...PEOPLE.sarah, role: 'sponsor', workstream: 'Executive sponsor', activitySummary: 'Preps capital committee decision package', notificationState: 'priority' },
      { ...PEOPLE.jake, role: 'lead', workstream: 'Program orchestration', activitySummary: 'Owns custom-shape module sequencing', notificationState: 'all' },
      { ...PEOPLE.noah, role: 'team_member', workstream: 'Finance modeling', activitySummary: 'Drafting ROI and tradeoff inputs', notificationState: 'all' },
      { ...PEOPLE.lena, role: 'maestro', workstream: 'Custom pattern oversight', activitySummary: 'Reviewing whether this shape should become a candidate pattern', notificationState: 'priority' },
    ],
    activity: [
      { id: 'act-c1', type: 'nexus', title: 'Custom shape quality flag', detail: 'Business case draft still needs capital committee language tuning.', at: hoursAgo(8), actor: PEOPLE.lena },
      { id: 'act-c2', type: 'deliverable', title: 'Tradeoff matrix draft created', detail: 'Nexus assembled a first-pass option matrix from PDLC notes.', at: hoursAgo(15), actor: PEOPLE.noah },
    ],
    sponsorPerson: PEOPLE.sarah,
    leadPerson: PEOPLE.jake,
    phaseStatus: 'active',
    gateSummary: 'Custom Charter work is moving, but sponsor review is required before finance baselines lock.',
    gateStatus: 'pending',
    deliverables: [
      makeDeliverable('deliv-pdlc-charter', 'Custom Charter Pack', 'stakeholder-map', 1, PEOPLE.jake, 'Custom-shape charter and stakeholder framing for capital committee.', 'in_review'),
    ],
    metrics: [
      { label: 'Custom modules', value: '4', tone: 'teal' },
      { label: 'Quality flags', value: '1', tone: 'amber' },
      { label: 'ROI draft', value: 'v1', tone: 'default' },
      { label: 'Sponsor review', value: 'Pending', tone: 'red' },
    ],
    sponsorDashboard: {
      openDecisions: ['Confirm the PDLC capital-reallocation framing before Diagnose opens.'],
      milestones: ['Tradeoff matrix first pass complete.', 'Finance modeling is 60% shaped.'],
      keyFindings: ['This custom shape may become a candidate pattern after a second deployment.'],
      outcomeSignal: 'Fast sponsor feedback here keeps the capital committee date intact.',
    },
    nexusPanel: {
      programId: 'it-capital-reallocation',
      mode: 'collapsed',
      activeTab: 'drafts',
      thread: {
        id: 'program-thread-pdlc',
        title: 'PDLC charter thread',
        turns: [
          { id: 'turn-pdlc-1', speaker: 'lead', text: 'What is the sharpest sponsor choice to frame in the Charter?' },
          { id: 'turn-pdlc-2', speaker: 'nexus', text: 'Decide whether to concentrate capital on automation-enabling platforms or spread investment across smaller operational fixes.' },
        ],
      },
      drafts: [
        { id: 'draft-pdlc-1', title: 'Tradeoff matrix draft', moduleKey: 'tradeoff-matrix', status: 'pending_review', summary: 'Three capital-allocation paths with weighted criteria and rationale.' },
      ],
      flags: [
        { id: 'flag-pdlc-1', severity: 'medium', title: 'Custom-shape quality flag', detail: 'Business case voice needs sharper capital-committee language before sponsor review.' },
      ],
      sources: [
        { id: 'source-pdlc-1', label: 'PDLC candidate pattern', sourceType: 'pattern', detail: 'Candidate state with 3 deployments and 48% preload depth.' },
        { id: 'source-pdlc-2', label: 'Meridian capital baseline', sourceType: 'l2', detail: 'Finance extracts and prior portfolio notes from Q1 planning cycle.' },
      ],
    },
    moduleContent: {
      'stakeholder-map': {
        summary: 'Executive stakeholders are mapped around capital committee influence and implementation dependency.',
        stakeholders: ambientContent['stakeholder-map'].stakeholders,
        formFields: [
          { label: 'Decision forum', value: 'Capital committee in 18 days.' },
          { label: 'Primary tension', value: 'Balancing quick wins against platform modernization commitments.' },
        ],
      },
      'success-criteria': {
        summary: 'Criteria emphasize capital released, productivity returned, and governance confidence.',
        tracker: [
          { label: 'Capital reallocated', baseline: '$0', target: '$18M', current: '$11M candidate', trend: 'Emerging' },
          { label: 'Programs funded', baseline: '0', target: '3', current: '2 likely', trend: 'Positive' },
        ],
      },
      'tradeoff-matrix': {
        summary: 'Capital-reallocation options compared across return, speed, risk, and change burden.',
        matrix: {
          criteria: ['Return', 'Speed', 'Risk', 'Strategic fit', 'Change burden'],
          options: [
            { name: 'Concentrate on automation platforms', scores: [5, 3, 3, 5, 2], rationale: 'Highest upside, moderate delivery risk.' },
            { name: 'Spread across productivity fixes', scores: [3, 5, 4, 3, 4], rationale: 'Fast to start, lower strategic concentration.' },
            { name: 'Hybrid staged reallocation', scores: [4, 4, 4, 5, 3], rationale: 'Balances near-term proof with long-term platform bets.' },
          ],
        },
      },
      'business-case-roi': {
        summary: 'Business case narrative with ROI ranges and phased investment shifts.',
        narrativeBlocks: [
          { title: 'Investment thesis', body: 'Reallocating capital toward automation-enabling platforms creates a stronger two-year return profile than incremental spend across isolated fixes.' },
          { title: 'Return profile', body: 'Hybrid staged reallocation is pacing to a 19-month payback with the strongest confidence band.' },
        ],
      },
    },
  },
  {
    id: 'clinical-workflow-automation',
    name: 'Clinical Workflow Automation',
    clientName: 'Meridian Health System',
    archetype: 'ai_product_enablement',
    charter: {
      headline: 'Clinical workflow automation program closed with verified outcome gains.',
      bullets: [
        'Outcome metrics are ahead of target across cycle time and manual touches.',
        'Sponsor verification is scheduled as the second CXO touchpoint.',
        'Genome feedback is ready to promote improved baseline capture guidance.',
      ],
      sponsorDecision: 'Complete the Phase 6 verification attestation and close the program.',
      baselineNeed: 'All baseline references are already attached for verification.',
    },
    currentPhase: 6,
    shape: 'pattern',
    patternKey: 'clinical-workflow-automation',
    patternName: 'Clinical Workflow Automation',
    phases: [
      phaseState(1, 'Origination', 'complete', 'Pattern accepted.', 'none'),
      phaseState(2, 'Charter', 'complete', 'Charter signed.', 'hard'),
      phaseState(3, 'Diagnose', 'complete', 'Findings locked.', 'hard'),
      phaseState(4, 'Design', 'complete', 'Recommendation approved.', 'hard'),
      phaseState(5, 'Execute', 'complete', 'Execution evidence catalog complete.', 'soft'),
      phaseState(6, 'Verify', 'active', 'Verification and Genome feedback underway.', 'hard'),
    ],
    modules: [
      { moduleKey: 'outcome-measurement', name: MODULE_NAMES['outcome-measurement'], phase: 6, status: 'in_review', currentVersion: 2, lastEditedBy: PEOPLE.jake, lastEditedAt: hoursAgo(5) },
      { moduleKey: 'benefits-realization', name: MODULE_NAMES['benefits-realization'], phase: 6, status: 'draft', currentVersion: 1, lastEditedBy: PEOPLE.sarah, lastEditedAt: hoursAgo(12) },
    ],
    team: [
      { ...PEOPLE.sarah, role: 'sponsor', workstream: 'Executive sponsor', activitySummary: 'Needs to complete verification interview', notificationState: 'priority' },
      { ...PEOPLE.jake, role: 'lead', workstream: 'Program lead', activitySummary: 'Preparing Phase 6 attestation pack', notificationState: 'all' },
      { ...PEOPLE.lena, role: 'maestro', workstream: 'Pattern oversight', activitySummary: 'Ready to log Genome feedback after sponsor attestation', notificationState: 'priority' },
    ],
    activity: [
      { id: 'act-d1', type: 'approval', title: 'Verification interview scheduled', detail: 'Phase 6 sponsor verification slot booked for tomorrow morning.', at: hoursAgo(4), actor: PEOPLE.sarah },
      { id: 'act-d2', type: 'deliverable', title: 'Outcome dashboard refreshed', detail: 'Outcome metrics updated with the latest quarter-end extracts.', at: hoursAgo(9), actor: PEOPLE.jake },
    ],
    sponsorPerson: PEOPLE.sarah,
    leadPerson: PEOPLE.jake,
    phaseStatus: 'active',
    gateSummary: 'Verification closes after sponsor attestation and Genome feedback submission.',
    gateStatus: 'pending',
    deliverables: [
      makeDeliverable('deliv-verify', 'Outcome Verification Pack', 'outcome-measurement', 2, PEOPLE.jake, 'Outcome dashboard and attestation prep for sponsor verification.', 'in_review'),
    ],
    metrics: [
      { label: 'Outcome metrics ahead', value: '3/3', tone: 'teal' },
      { label: 'Verification slot', value: 'Tomorrow', tone: 'amber' },
      { label: 'Genome feedback', value: 'Ready', tone: 'default' },
      { label: 'Attestation', value: 'Pending', tone: 'red' },
    ],
    sponsorDashboard: {
      openDecisions: ['Confirm benefits realized versus plan during the Phase 6 verification session.'],
      milestones: ['Outcome dashboard refreshed.', 'Genome feedback memo drafted.'],
      keyFindings: ['All primary metrics are at or ahead of target.', 'Pattern improvements are ready for future healthcare deployments.'],
      outcomeSignal: 'This program is positioned to close cleanly with a reusable pattern improvement.',
    },
    nexusPanel: {
      programId: 'clinical-workflow-automation',
      mode: 'collapsed',
      activeTab: 'sources',
      thread: {
        id: 'program-thread-verify',
        title: 'Verification prep thread',
        turns: [
          { id: 'turn-verify-1', speaker: 'lead', text: 'What should Sarah be ready to confirm in the verification session?' },
          { id: 'turn-verify-2', speaker: 'nexus', text: 'Confirm cycle-time gains, manual touch reduction, and any unexpected impacts before benefits are attested.' },
        ],
      },
      drafts: [
        { id: 'draft-verify-1', title: 'Outcome attestation memo', moduleKey: 'benefits-realization', status: 'ready', summary: 'Draft memo ready for sponsor verification session.' },
      ],
      flags: [
        { id: 'flag-verify-1', severity: 'low', title: 'Verification interview pending', detail: 'Final closeout depends on the scheduled sponsor session.' },
      ],
      sources: [
        { id: 'source-verify-1', label: 'Clinical Workflow Automation pattern', sourceType: 'pattern', detail: '11 deployments, proven state.' },
        { id: 'source-verify-2', label: 'Outcome dashboard extracts', sourceType: 'l2', detail: 'Latest quarter-end metrics and supporting evidence.' },
      ],
    },
    moduleContent: verifyContent,
  },
];

function buildProgramSummary(program: ProgramFullState): ProgramSummary {
  return {
    id: program.id,
    name: program.name,
    archetype: program.archetype,
    patternKey: program.patternKey,
    patternName: program.patternName,
    charterSummary: program.charter.headline,
    currentPhase: program.currentPhase,
    phaseStatus: program.phaseStatus,
    sponsorPerson: program.sponsorPerson,
    leadPerson: program.leadPerson,
    lastActivityAt: program.activity[0]?.at ?? daysAgo(2),
    attentionBadge:
      program.id === 'ambient-docs-rollout'
        ? { label: 'Awaiting approval', variant: 'warning' }
        : program.id === 'ams-optimization'
          ? { label: 'Blocked', variant: 'danger' }
          : program.id === 'it-capital-reallocation'
            ? { label: 'Quality flag', variant: 'info' }
            : { label: 'CXO verification', variant: 'success' },
    shape: program.shape,
    clientName: program.clientName,
  };
}

function defaultInbox(role: ViewerRole): InboxItem[] {
  if (role === 'sponsor') {
    return [
      { id: 'inbox-s1', priority: 'high', label: 'Decision waiting', title: 'Approve Ambient Documentation Charter', detail: 'Hard gate is ready as soon as you sign the Charter pack.', dueLabel: '14h remaining', programId: 'ambient-docs-rollout', programName: 'Ambient Documentation Rollout', actionLabel: 'Review gate' },
      { id: 'inbox-s2', priority: 'medium', label: 'Interview request', title: 'Confirm Phase 6 verification slot', detail: 'Clinical Workflow Automation is ready for sponsor verification.', dueLabel: 'Tomorrow 9:00 AM', programId: 'clinical-workflow-automation', programName: 'Clinical Workflow Automation', actionLabel: 'View verification' },
    ];
  }
  if (role === 'maestro' || role === 'founder') {
    return [
      { id: 'inbox-m1', priority: 'critical', label: 'Intervention', title: 'AMS change-management drift needs review', detail: 'Pattern drift is compounding the execution slip.', dueLabel: 'Now', programId: 'ams-optimization', programName: 'AMS Optimization', actionLabel: 'Open execute view' },
      { id: 'inbox-m2', priority: 'medium', label: 'Pattern health', title: 'PDLC custom shape needs quality pass', detail: 'Business case language needs sharper committee framing.', dueLabel: 'Today', programId: 'it-capital-reallocation', programName: 'IT Capital Reallocation via PDLC', actionLabel: 'Review custom shape' },
    ];
  }
  return [
    { id: 'inbox-l1', priority: 'high', label: 'Hard gate', title: 'Ambient Documentation is waiting on Charter signoff', detail: 'Stakeholder map is ready, but the baseline request is still blocked.', dueLabel: '14h on SLA', programId: 'ambient-docs-rollout', programName: 'Ambient Documentation Rollout', actionLabel: 'Open charter' },
    { id: 'inbox-l2', priority: 'critical', label: 'Blocked', title: 'AMS transition plan is 3 days overdue', detail: 'HR review is holding the 45-FTE transition sequence.', dueLabel: 'Escalate today', programId: 'ams-optimization', programName: 'AMS Optimization', actionLabel: 'Open execute' },
    { id: 'inbox-l3', priority: 'medium', label: 'Quality flag', title: 'PDLC business case needs sharper sponsor language', detail: 'Custom-shape draft is good structurally, but not ready for committee review.', dueLabel: 'This afternoon', programId: 'it-capital-reallocation', programName: 'IT Capital Reallocation via PDLC', actionLabel: 'Open custom shape' },
  ];
}

function matchProgramFilters(program: ProgramSummary, role: ViewerRole, filters: PortfolioFilters): boolean {
  const search = (filters.search ?? '').trim().toLowerCase();
  if (search) {
    const haystack = [
      program.name,
      program.charterSummary,
      program.patternName ?? '',
      program.sponsorPerson.name,
      archetypeLabelMap[program.archetype],
      program.clientName,
    ]
      .join(' ')
      .toLowerCase();
    if (!haystack.includes(search)) return false;
  }
  if (filters.phase && filters.phase !== 'all' && String(program.currentPhase) !== filters.phase) return false;
  if (filters.archetype && filters.archetype !== 'all' && program.archetype !== filters.archetype) return false;
  if (filters.status && filters.status !== 'all') {
    const target = filters.status;
    const current =
      program.phaseStatus === 'awaiting_gate'
        ? 'pending'
        : program.phaseStatus === 'blocked'
          ? 'blocked'
          : program.phaseStatus === 'complete'
            ? 'complete'
            : 'active';
    if (target !== current) return false;
  }
  if (filters.sponsor && filters.sponsor !== 'all' && program.sponsorPerson.id !== filters.sponsor) return false;
  if (filters.pattern && filters.pattern !== 'all' && program.patternKey !== filters.pattern) return false;
  if (filters.shape && filters.shape !== 'all' && program.shape !== filters.shape) return false;
  if (filters.myRole && filters.myRole !== 'all') {
    if (filters.myRole === 'sponsor' && program.sponsorPerson.id !== PEOPLE.sarah.id) return false;
    if (filters.myRole === 'lead' && program.leadPerson.id !== PEOPLE.jake.id) return false;
    if (filters.myRole === 'maestro' && role !== 'maestro' && role !== 'founder') return false;
  }
  return true;
}

export function getRoleDefaults(viewerRole: ViewerRole): PortfolioFilters {
  if (viewerRole === 'sponsor') return { myRole: 'sponsor', status: 'pending', phase: 'all', archetype: 'all', pattern: 'all', sponsor: 'all', shape: 'all', search: '' };
  if (viewerRole === 'maestro') return { myRole: 'maestro', status: 'all', phase: 'all', archetype: 'all', pattern: 'all', sponsor: 'all', shape: 'all', search: '' };
  if (viewerRole === 'founder') return { myRole: 'all', status: 'all', phase: 'all', archetype: 'all', pattern: 'all', sponsor: 'all', shape: 'all', search: '' };
  return { myRole: 'lead', status: 'active', phase: 'all', archetype: 'all', pattern: 'all', sponsor: 'all', shape: 'all', search: '' };
}

export async function getPrograms(args: { role: ViewerRole; filters: PortfolioFilters }): Promise<{ programs: ProgramSummary[]; inbox: InboxItem[]; totalCount: number }> {
  const summaries = programs.map(buildProgramSummary).filter((program) => matchProgramFilters(program, args.role, args.filters));
  return { programs: summaries, inbox: defaultInbox(args.role), totalCount: summaries.length };
}

export async function searchPrograms(args: { q: string; filters: PortfolioFilters }): Promise<{ programs: ProgramSummary[] }> {
  const merged = { ...args.filters, search: args.q };
  const results = programs.map(buildProgramSummary).filter((program) => matchProgramFilters(program, 'lead', merged));
  return { programs: results };
}

export async function getPatterns(args: { role: ViewerRole }): Promise<PatternLibraryItem[]> {
  if (args.role === 'maestro' || args.role === 'founder') return patterns;
  return patterns.filter((pattern) => pattern.promotionState !== 'candidate');
}

export async function getPatternByKey(patternKey: string): Promise<PatternLibraryItem | null> {
  return patterns.find((pattern) => pattern.key === patternKey) ?? null;
}

export async function getProgramById(programId: string): Promise<ProgramFullState | null> {
  return programs.find((program) => program.id === programId) ?? null;
}

export async function getProgramPhase(programId: string, phaseNumber: number): Promise<ProgramFullState | null> {
  const program = await getProgramById(programId);
  if (!program) return null;
  return { ...program, currentPhase: phaseNumber };
}

export async function getProgramModule(programId: string, moduleKey: string): Promise<{ program: ProgramFullState | null; moduleState: ModuleState | null }> {
  const program = await getProgramById(programId);
  const moduleState = program?.modules.find((module) => module.moduleKey === moduleKey) ?? null;
  return { program, moduleState };
}

function rankPatternsFromText(text: string): PatternMatch[] {
  const lower = text.toLowerCase();
  const ambientScore = lower.includes('ambient') || lower.includes('documentation') ? 0.88 : 0.71;
  const amsScore = lower.includes('managed services') || lower.includes('transition') ? 0.81 : 0.68;
  const workflowScore = lower.includes('workflow') || lower.includes('automation') ? 0.79 : 0.66;
  const pdlcScore = lower.includes('capital') || lower.includes('portfolio') || lower.includes('reallocation') ? 0.83 : 0.47;

  const matches: PatternMatch[] = [
    {
      patternKey: 'ambient-docs-rollout',
      patternName: 'Ambient Docs Rollout',
      confidence: ambientScore,
      confidenceBand: ambientScore >= 0.75 ? 'high' : ambientScore >= 0.5 ? 'medium' : 'low',
      deploymentCount: 14,
      successfulDeploymentCount: 11,
      medianOutcomeUsd: 4_300_000,
      typicalDurationMonths: 5,
      successRatePct: 86,
      preloadDepthPct: 68,
      proposedShape: {
        phases: [
          { canonicalPhase: 1, name: 'Origination' },
          { canonicalPhase: 2, name: 'Charter' },
          { canonicalPhase: 3, name: 'Diagnose' },
          { canonicalPhase: 4, name: 'Design' },
          { canonicalPhase: 5, name: 'Execute' },
          { canonicalPhase: 6, name: 'Verify' },
        ],
        modules: [
          { moduleKey: 'problem-framing', name: MODULE_NAMES['problem-framing'] },
          { moduleKey: 'stakeholder-map', name: MODULE_NAMES['stakeholder-map'] },
          { moduleKey: 'success-criteria', name: MODULE_NAMES['success-criteria'] },
          { moduleKey: 'baseline-data-request', name: MODULE_NAMES['baseline-data-request'] },
        ],
      },
      isTopMatch: false,
    },
    {
      patternKey: 'ams-optimization',
      patternName: 'AMS Optimization',
      confidence: amsScore,
      confidenceBand: amsScore >= 0.75 ? 'high' : amsScore >= 0.5 ? 'medium' : 'low',
      deploymentCount: 22,
      successfulDeploymentCount: 19,
      medianOutcomeUsd: 6_100_000,
      typicalDurationMonths: 6,
      successRatePct: 91,
      preloadDepthPct: 62,
      proposedShape: {
        phases: [
          { canonicalPhase: 1, name: 'Origination' },
          { canonicalPhase: 2, name: 'Charter' },
          { canonicalPhase: 3, name: 'Diagnose' },
          { canonicalPhase: 4, name: 'Design' },
          { canonicalPhase: 5, name: 'Execute' },
          { canonicalPhase: 6, name: 'Verify' },
        ],
        modules: [
          { moduleKey: 'data-analysis-findings', name: MODULE_NAMES['data-analysis-findings'] },
          { moduleKey: 'tradeoff-matrix', name: MODULE_NAMES['tradeoff-matrix'] },
          { moduleKey: 'build-integration-tracking', name: MODULE_NAMES['build-integration-tracking'] },
          { moduleKey: 'change-management-plan', name: MODULE_NAMES['change-management-plan'] },
        ],
      },
      isTopMatch: false,
    },
    {
      patternKey: pdlcScore > workflowScore ? 'pdlc-capital-reallocation' : 'clinical-workflow-automation',
      patternName: pdlcScore > workflowScore ? 'PDLC Capital Reallocation' : 'Clinical Workflow Automation',
      confidence: Math.max(pdlcScore, workflowScore),
      confidenceBand: Math.max(pdlcScore, workflowScore) >= 0.75 ? 'high' : Math.max(pdlcScore, workflowScore) >= 0.5 ? 'medium' : 'low',
      deploymentCount: pdlcScore > workflowScore ? 3 : 11,
      successfulDeploymentCount: pdlcScore > workflowScore ? 2 : 9,
      medianOutcomeUsd: pdlcScore > workflowScore ? 8_200_000 : 3_400_000,
      typicalDurationMonths: pdlcScore > workflowScore ? 3 : 4,
      successRatePct: pdlcScore > workflowScore ? 67 : 82,
      preloadDepthPct: pdlcScore > workflowScore ? 48 : 64,
      proposedShape: {
        phases: pdlcScore > workflowScore
          ? [
              { canonicalPhase: 1, name: 'Origination' },
              { canonicalPhase: 2, name: 'Charter' },
              { canonicalPhase: 3, name: 'Diagnose' },
              { canonicalPhase: 4, name: 'Design' },
            ]
          : [
              { canonicalPhase: 1, name: 'Origination' },
              { canonicalPhase: 2, name: 'Charter' },
              { canonicalPhase: 3, name: 'Diagnose' },
              { canonicalPhase: 5, name: 'Execute' },
              { canonicalPhase: 6, name: 'Verify' },
            ],
        modules: pdlcScore > workflowScore
          ? [
              { moduleKey: 'stakeholder-map', name: MODULE_NAMES['stakeholder-map'] },
              { moduleKey: 'success-criteria', name: MODULE_NAMES['success-criteria'] },
              { moduleKey: 'tradeoff-matrix', name: MODULE_NAMES['tradeoff-matrix'] },
              { moduleKey: 'business-case-roi', name: MODULE_NAMES['business-case-roi'] },
            ]
          : [
              { moduleKey: 'diagnostic-instrument', name: MODULE_NAMES['diagnostic-instrument'] },
              { moduleKey: 'build-integration-tracking', name: MODULE_NAMES['build-integration-tracking'] },
              { moduleKey: 'outcome-measurement', name: MODULE_NAMES['outcome-measurement'] },
            ],
      },
      isTopMatch: false,
    },
  ];

  const ranked = matches.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
  return ranked.map((match, index) => ({ ...match, isTopMatch: index === 0 }));
}

export async function* originateProgram(body: OriginationRequest): AsyncGenerator<OriginationStageEvent | { id: 'complete'; matches: PatternMatch[]; prefilledForm: OriginationForm }, void, void> {
  const prefilledForm: OriginationForm =
    'source' in body
      ? body.source === 'intelligence_thread'
        ? {
            name: 'Scoped from Intelligence',
            useCase: 'Scale ambient documentation without adding sponsor overhead.',
            targetOutcome: 'Reduce after-hours charting and compress pilot-to-scale timeline.',
            sponsorPersonId: PEOPLE.sarah.id,
            leadPersonId: PEOPLE.jake.id,
            industryHint: 'Healthcare',
            functionHint: 'Clinical operations',
          }
        : {
            name: 'Signal-triggered program',
            useCase: 'Stabilize an execution signal that is creating sponsor-visible risk.',
            targetOutcome: 'Turn a contradiction into a governed program within one review cycle.',
            sponsorPersonId: PEOPLE.sarah.id,
            leadPersonId: PEOPLE.jake.id,
            industryHint: 'Healthcare',
            functionHint: 'Operations',
          }
      : body;

  const stageSeed: OriginationStageEvent[] = [
    { id: 'intent-extraction', label: 'Intent extraction', detail: 'Distilling archetype, scope, and target-outcome signals from the intake.', state: 'running' },
    { id: 'vector-match', label: 'Genome match', detail: 'Comparing the scoped use case against pattern embeddings and prior deployments.', state: 'running' },
    { id: 'scoring', label: 'Shape scoring', detail: 'Ranking the top matches with confidence, preload depth, and success evidence.', state: 'running' },
  ];

  for (const stage of stageSeed) {
    await new Promise((resolve) => setTimeout(resolve, 450));
    yield { ...stage, state: 'complete' };
  }

  const matches = rankPatternsFromText(`${prefilledForm.name} ${prefilledForm.useCase} ${prefilledForm.targetOutcome}`);
  yield { id: 'complete', matches, prefilledForm };
}

export async function createProgram(body: CreateProgramRequest): Promise<{ programId: string; redirectTo: string }> {
  const selected = body.acceptedPatternKey ?? body.shapeModifications?.shape;
  if (selected === 'pdlc-capital-reallocation' || body.shapeModifications?.shape === 'custom') {
    return { programId: 'it-capital-reallocation', redirectTo: '/programs/it-capital-reallocation?created=1' };
  }
  if (selected === 'ams-optimization') {
    return { programId: 'ams-optimization', redirectTo: '/programs/ams-optimization?created=1' };
  }
  return { programId: 'ambient-docs-rollout', redirectTo: '/programs/ambient-docs-rollout?created=1' };
}

export async function advancePhase(_programId: string, fromPhase: number): Promise<AdvanceResult> {
  return { ok: true, message: `Mock phase advance recorded from Phase ${fromPhase}.` };
}

export async function publishModule(_programId: string, _moduleKey: string): Promise<void> {
  return;
}

export async function updateModuleField(_programId: string, _moduleKey: string, _field: string, _value: unknown): Promise<void> {
  return;
}

export async function requestNexusDraft(_programId: string, _moduleKey: string): Promise<DraftResult> {
  // TODO(Packet 8 §8.4, Packet 12 §12.3): replace this typed stub with the real
  // Mode B drafting SSE integration after Intelligence Nexus infra merges.
  return {
    ok: false,
    message: 'Nexus module drafting is intentionally stubbed in this frontend-only branch.',
  };
}

export async function* streamNexusChat(_programId: string): AsyncGenerator<Turn, void, void> {
  // TODO(Packet 8 §8.3, Packet 12 §12.3): wire the side-panel chat tab to the
  // real program-scoped Nexus SSE endpoint after shared infra merges.
  yield {
    id: 'stub-chat-turn',
    speaker: 'nexus',
    text: 'Programs chat is running in static-shell mode on this branch.',
  };
}

export async function answerCxoTakeover(_programId: string, _mode: 'phase_3_interview' | 'phase_6_verification', answer: string): Promise<NextTurn> {
  // TODO(Packet 8 §8.5, Packet 12 §12.3): replace this typed stub with the real
  // Mode C takeover interaction flow after shared interview infrastructure lands.
  return {
    nextQuestion: undefined,
    transcript: [
      { id: 'stub-q', speaker: 'nexus', text: 'Mode C takeover is intentionally static on this branch.' },
      { id: 'stub-a', speaker: 'sponsor', text: answer },
    ],
  };
}

export async function closeCxoTakeover(_programId: string): Promise<Synthesis> {
  // TODO(Packet 8 §8.5): replace with the real synthesis closeout once the
  // interview persistence layer is available.
  return {
    headline: 'Static takeover preview',
    bullets: [
      'Question flow is spec-aligned but not yet interactive.',
      'Transcript persistence will be added with the shared Nexus backend merge.',
    ],
  };
}

export function getArchetypeLabel(archetype: ArchetypeKey): string {
  return archetypeLabelMap[archetype];
}

export function getViewerRole(value: string | null | undefined): ViewerRole {
  switch (value) {
    case 'sponsor':
    case 'lead':
    case 'team_member':
    case 'maestro':
    case 'founder':
      return value;
    default:
      return 'lead';
  }
}

export function mergeFilters(defaults: PortfolioFilters, overrides: Partial<PortfolioFilters>): PortfolioFilters {
  return { ...defaults, ...overrides };
}

export function getSponsorOptions(): PersonRef[] {
  return [PEOPLE.sarah, PEOPLE.elena, PEOPLE.maya];
}

export function getLeadOptions(): PersonRef[] {
  return [PEOPLE.jake, PEOPLE.amy, PEOPLE.priya];
}

export function getAllPrograms(): ProgramFullState[] {
  return programs;
}

export function getProgramByIdSync(programId: string): ProgramFullState | null {
  return programs.find((program) => program.id === programId) ?? null;
}

export function getProgramPhaseSync(programId: string, phaseNumber: number): ProgramFullState | null {
  const program = getProgramByIdSync(programId);
  if (!program) return null;
  return { ...program, currentPhase: phaseNumber };
}

export function getProgramModuleSync(programId: string, moduleKey: string): { program: ProgramFullState | null; moduleState: ModuleState | null } {
  const program = getProgramByIdSync(programId);
  const moduleState = program?.modules.find((module) => module.moduleKey === moduleKey) ?? null;
  return { program, moduleState };
}

export function getDeliverable(programId: string, deliverableId: string) {
  const program = programs.find((entry) => entry.id === programId);
  return program?.deliverables.find((deliverable) => deliverable.id === deliverableId) ?? null;
}

export function getModuleName(moduleKey: string) {
  return MODULE_NAMES[moduleKey] ?? moduleKey;
}

export function getCxoQuestionBank(mode: 'phase_3_interview' | 'phase_6_verification'): Question[] {
  return mode === 'phase_3_interview'
    ? [
        { id: 'q1', prompt: 'What part of the findings feels most true to your team right now?', rationale: 'Starts with recognition before recommendation.' },
        { id: 'q2', prompt: 'Where do you see the biggest execution risk if Design begins next week?', rationale: 'Surfaces sponsor-owned blockers early.' },
        { id: 'q3', prompt: 'What should Design absolutely preserve as we move forward?', rationale: 'Captures non-negotiables for the next phase.' },
      ]
    : [
        { id: 'qv1', prompt: 'Which outcome improved most materially from your perspective?', rationale: 'Confirms the strongest realized value signal.' },
        { id: 'qv2', prompt: 'What still feels incomplete before you would fully attest benefits?', rationale: 'Captures residual gaps before closeout.' },
        { id: 'qv3', prompt: 'What should this pattern remember for the next client deployment?', rationale: 'Feeds Genome learning back into the pattern.' },
      ];
}

export const STATIC_NEXUS_SOURCES: ContextSource[] = [
  { id: 'static-source-1', label: 'Pattern preload', sourceType: 'pattern', detail: 'Canonical module framing and benchmark defaults.' },
  { id: 'static-source-2', label: 'Client uploads', sourceType: 'l2', detail: 'Uploaded CSVs, sponsor notes, and activity history.' },
  { id: 'static-source-3', label: 'Program history', sourceType: 'l3', detail: 'Published findings, reports, and gate decisions.' },
];
