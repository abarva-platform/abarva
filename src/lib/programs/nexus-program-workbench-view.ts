// Nexus Program Workbench view model.
//
// Pure deterministic helper for the canonical Program detail page. The
// shape is built to match the AbarVa Active-Program reference mockup:
//   header → six-phase journey card (uniform tinted tiles, no raised
//   pop) → single dark-navy Nexus brief card with context chips,
//   confidence + blocker pills, and a primary CTA → suggested actions
//   plus deferred Ask Nexus → side-by-side Current gate + Evidence
//   coverage cards → right-rail agent handoff list.
//
// No model calls, no runtime chat, no persistence, no Date.now reads.

import type { SpecPhaseNumber } from '@/lib/programs/enhancement-spec';

// --- types ---------------------------------------------------------------

export type NexusWorkbenchAgentKey = 'nexus' | 'steward' | 'sentinel' | 'atlas';

export type NexusWorkbenchPhaseState = 'done' | 'current' | 'gate-pending' | 'locked';

export interface NexusWorkbenchPhaseNode {
  key: string;
  index: number;
  label: string;
  state: NexusWorkbenchPhaseState;
  stateLabel: string;
}

export interface NexusWorkbenchSuggestedAction {
  label: string;
  description: string;
}

export type NexusWorkbenchAgentState = 'active' | 'blocked' | 'partial' | 'idle';

export interface NexusWorkbenchAgentHandoff {
  agent: NexusWorkbenchAgentKey;
  label: string;
  state: NexusWorkbenchAgentState;
  stateLabel: string;
  role: string;
}

export interface NexusWorkbenchWorkshop {
  title: string;
  agenda: string[];
  questions: string[];
  evidenceToCapture: string[];
  attendees: string[];
}

export interface NexusWorkbenchMissingInput {
  label: string;
  state: 'open' | 'in-progress' | 'satisfied';
  sourceLabel: string;
}

export interface NexusWorkbenchPhaseFocus {
  key: string;
  brief: string;
  cta: string;
  contextUsed: string[];
  confidenceLabel: string;
  blockerLabel: string;
  suggestedActions: NexusWorkbenchSuggestedAction[];
  agentHandoffs: NexusWorkbenchAgentHandoff[];
  workshop: NexusWorkbenchWorkshop;
  missingInputs: NexusWorkbenchMissingInput[];
}

export interface NexusWorkbenchEvidenceSlice {
  phaseKey: string;
  phaseLabel: string;
  percentage: number;
  tone: 'strong' | 'partial' | 'draft' | 'staged' | 'planned';
}

export interface NexusWorkbenchSubnavTab {
  key: 'overview' | 'workshop' | 'deliverables' | 'evidence' | 'actions' | 'gate';
  label: string;
}

export interface NexusWorkbenchContextStrip {
  tenantBadgeLabel: string;
  programCode: string;
  phaseLabel: string;
  gateLabel: string;
  caveat: string;
  sourceEventLabel: string;
  sourceEventHref: string;
}

export interface NexusWorkbenchView {
  programCode: string;
  programName: string;
  tenantLabel: string;
  programIdentity: string;
  headerSubtitle: string;
  contextStrip: NexusWorkbenchContextStrip;
  phaseJourney: NexusWorkbenchPhaseNode[];
  journeySubtitle: string;
  defaultPhaseKey: string;
  phaseFocusByKey: Record<string, NexusWorkbenchPhaseFocus>;
  brief: string;
  cta: string;
  contextUsed: string[];
  confidenceLabel: string;
  blockerLabel: string;
  suggestedActions: NexusWorkbenchSuggestedAction[];
  agentHandoffs: NexusWorkbenchAgentHandoff[];
  workshop: NexusWorkbenchWorkshop;
  missingInputs: NexusWorkbenchMissingInput[];
  subnavTabs: NexusWorkbenchSubnavTab[];
  currentGateLabel: string;
  currentGateDescription: string;
  evidenceCoverage: NexusWorkbenchEvidenceSlice[];
  evidenceCoverageNote: string;
  customAskPlaceholder: string;
  deterministicCaveat: string;
  threeChoicesRule: string;
}

export interface NexusProgramWorkbenchInput {
  programCode?: string;
  programName?: string;
  tenantLabel?: string;
  currentPhaseSpec?: SpecPhaseNumber;
  deliverableCount?: number;
  evidenceBackedDeliverables?: number;
}

// --- defaults / catalog --------------------------------------------------

const DEFAULT_PROGRAM_CODE = 'APX-CDP-2026';
const DEFAULT_PROGRAM_NAME = 'Customer Data Platform Activation';
const DEFAULT_TENANT_LABEL = 'Apex Retail';
const DEFAULT_CURRENT_SPEC: SpecPhaseNumber = 2;

// The seed model carries five spec phases (1-5). The workbench journey
// shows six product-friendly phases. Internal keys remain stable for
// compatibility, while labels now reflect the Programs strategy-to-approval
// control plane: P4 roadmaps execution, P5 packages approval/mobilization,
// and P6 hands monitoring to Tower.
const SPEC_TO_WORKBENCH_KEY: Record<SpecPhaseNumber, string> = {
  1: 'discovery',
  2: 'synthesis',
  3: 'design',
  4: 'build',
  5: 'operate',
};

const PHASE_DEFINITIONS: ReadonlyArray<{ key: string; index: number; label: string }> = [
  { key: 'discovery', index: 1, label: 'Discovery' },
  { key: 'synthesis', index: 2, label: 'Synthesis' },
  { key: 'design',    index: 3, label: 'Design'    },
  { key: 'build',     index: 4, label: 'Execution Roadmap' },
  { key: 'activate',  index: 5, label: 'Approval & Mobilization' },
  { key: 'operate',   index: 6, label: 'Tower Handoff' },
];

function buildPhaseJourneyForCurrent(currentKey: string): NexusWorkbenchPhaseNode[] {
  const currentIndex = PHASE_DEFINITIONS.findIndex((p) => p.key === currentKey);
  return PHASE_DEFINITIONS.map((definition, idx) => {
    let state: NexusWorkbenchPhaseState;
    let stateLabel: string;
    if (idx < currentIndex) {
      state = 'done';
      stateLabel = 'Done';
    } else if (idx === currentIndex) {
      state = 'current';
      stateLabel = 'Current';
    } else if (idx === currentIndex + 1) {
      state = 'gate-pending';
      stateLabel = 'Gate pending';
    } else {
      state = 'locked';
      stateLabel = 'Locked';
    }
    return { ...definition, state, stateLabel };
  });
}

const PHASE_FOCUS_TEMPLATES: ReadonlyArray<NexusWorkbenchPhaseFocus> = [
  {
    key: 'discovery',
    brief:
      'Discovery is closed. Sponsor, problem, value hypothesis, and the source AMS event are captured and signed off. Re-open only if framing changes.',
    cta: 'Open Discovery brief',
    contextUsed: ['Sponsor brief', 'Stakeholder map', 'Source AMS event', 'Constraints register'],
    confidenceLabel: 'Confidence: framing signed off',
    blockerLabel: 'Blocker: none · Discovery closed',
    suggestedActions: [
      { label: 'Open Discovery brief', description: 'Inspect the closed Discovery framing.' },
      { label: 'Inspect stakeholder map', description: 'Review captured stakeholders and influence map.' },
      { label: 'Review framing decisions', description: 'Show the framing decisions Discovery captured.' },
    ],
    agentHandoffs: [
      { agent: 'nexus',    label: 'Nexus',    state: 'active',  stateLabel: 'ACTIVE',  role: 'Orchestration lead' },
      { agent: 'steward',  label: 'Steward',  state: 'partial', stateLabel: 'PARTIAL', role: 'Discovery sign-off recorded' },
      { agent: 'sentinel', label: 'Sentinel', state: 'partial', stateLabel: 'PARTIAL', role: 'No evidence gaps' },
      { agent: 'atlas',    label: 'Atlas',    state: 'partial', stateLabel: 'PARTIAL', role: 'Baseline value hypothesis captured' },
    ],
    workshop: {
      title: 'Discovery debrief (closed)',
      agenda: ['Review framing decisions', 'Confirm sponsor and scope', 'Hand off to Synthesis'],
      questions: ['Does Synthesis have everything it needs?', 'Any framing gaps surfaced post-sign-off?'],
      evidenceToCapture: ['Sponsor commitment minutes', 'Stakeholder map version'],
      attendees: ['Sponsor', 'Client Maestro', 'Program Manager'],
    },
    missingInputs: [
      { label: 'Sponsor confirmation', state: 'satisfied', sourceLabel: 'Sponsor brief' },
      { label: 'Stakeholder map sign-off', state: 'satisfied', sourceLabel: 'Stakeholder map' },
      { label: 'Source AMS event link', state: 'satisfied', sourceLabel: 'Source event registry' },
    ],
  },
  {
    key: 'synthesis',
    brief:
      'The program is in Phase 2 · Synthesis. The Design gate is pending because Workshop 5 outcomes and value hypothesis evidence are incomplete. The next best move is to prepare the Design Readiness workshop and resolve the evidence blockers before approving the gate.',
    cta: 'Prepare workshop',
    contextUsed: ['Program state', 'Workshop 5', 'Deliverables', 'Evidence gaps', 'Source AMS event'],
    confidenceLabel: 'Confidence: partial evidence',
    blockerLabel: 'Blocker: value hypothesis evidence',
    suggestedActions: [
      { label: 'Review Design gate blockers', description: 'Show the gate items preventing approval.' },
      { label: 'Open Workshop 5 outcomes',    description: 'Review synthesis decisions and unresolved questions.' },
      { label: 'Inspect deliverable evidence', description: 'Open evidence coverage before gate review.' },
    ],
    agentHandoffs: [
      { agent: 'nexus',    label: 'Nexus',    state: 'active',  stateLabel: 'ACTIVE',  role: 'Orchestration lead' },
      { agent: 'steward',  label: 'Steward',  state: 'blocked', stateLabel: 'BLOCKED', role: 'Gate/readiness' },
      { agent: 'sentinel', label: 'Sentinel', state: 'partial', stateLabel: 'PARTIAL', role: 'Evidence gaps' },
      { agent: 'atlas',    label: 'Atlas',    state: 'partial', stateLabel: 'PARTIAL', role: 'Executive value/risk under-evidenced' },
    ],
    workshop: {
      title: 'Workshop 5 · Design Readiness',
      agenda: [
        'Review value hypothesis evidence',
        'Confirm Workshop 5 outputs',
        'Stakeholder readiness check',
        'Define gate-decision criteria',
      ],
      questions: [
        'What evidence still needs an owner?',
        'Are commercial readiness conditions visible to the steering group?',
        'What would unblock the platform owner sign-off?',
      ],
      evidenceToCapture: [
        'Value hypothesis evidence pack',
        'Platform owner confirmation',
        'Workshop 5 decision log',
      ],
      attendees: ['Sponsor', 'Client Maestro', 'Platform Owner', 'Value Office', 'Steward'],
    },
    missingInputs: [
      { label: 'Value hypothesis evidence', state: 'open', sourceLabel: 'Evidence ledger' },
      { label: 'Platform owner confirmation', state: 'in-progress', sourceLabel: 'Stakeholder roster' },
      { label: 'Workshop 5 outputs captured', state: 'in-progress', sourceLabel: 'Workshop 5 log' },
    ],
  },
  {
    key: 'design',
    brief:
      'Design gate is pending after Synthesis closes. Solution match, vendor evaluation, and the business case must each carry value evidence before approval.',
    cta: 'Open gate checklist',
    contextUsed: ['Gate checklist', 'Evidence ledger', 'Solution match', 'Business case', 'Vendor evaluation'],
    confidenceLabel: 'Confidence: gate not yet ready',
    blockerLabel: 'Blocker: value evidence pack',
    suggestedActions: [
      { label: 'Open gate checklist',    description: 'Inspect every open item on the Design gate.' },
      { label: 'Open evidence ledger',   description: 'Show outstanding value evidence items.' },
      { label: 'Open vendor evaluation', description: 'Review the in-flight vendor evaluation.' },
    ],
    agentHandoffs: [
      { agent: 'nexus',    label: 'Nexus',    state: 'active',  stateLabel: 'ACTIVE',  role: 'Orchestration lead' },
      { agent: 'steward',  label: 'Steward',  state: 'blocked', stateLabel: 'BLOCKED', role: 'Design gate' },
      { agent: 'sentinel', label: 'Sentinel', state: 'partial', stateLabel: 'PARTIAL', role: 'Evidence pack incomplete' },
      { agent: 'atlas',    label: 'Atlas',    state: 'partial', stateLabel: 'PARTIAL', role: 'Value at stake under-evidenced' },
    ],
    workshop: {
      title: 'Design gate review',
      agenda: [
        'Walk the gate checklist',
        'Inspect outstanding value evidence',
        'Vendor evaluation summary',
        'Capture gate-decision conditions',
      ],
      questions: [
        'Which gate items will be waived vs resolved?',
        'Who owns the remaining evidence pack?',
        'When is the next gate review window?',
      ],
      evidenceToCapture: ['Gate checklist completion', 'Solution match rationale', 'Vendor scorecard'],
      attendees: ['Sponsor', 'Steward', 'Vendor lead', 'Value Office'],
    },
    missingInputs: [
      { label: 'Gate checklist completion', state: 'open', sourceLabel: 'Gate checklist' },
      { label: 'Solution match rationale', state: 'open', sourceLabel: 'Solution match' },
      { label: 'Vendor evaluation summary', state: 'in-progress', sourceLabel: 'Vendor evaluation' },
    ],
  },
  {
    key: 'build',
    brief:
      'Execution Roadmap is locked behind the Design gate. Nexus should define how execution will happen outside AbarVa: workstreams, estimates, timeline, critical milestones, dependencies, RACI, risks, and success criteria by execution phase.',
    cta: 'View roadmap checklist',
    contextUsed: ['Gate dependency', 'Execution roadmap', 'Design package', 'Change readiness'],
    confidenceLabel: 'Confidence: locked',
    blockerLabel: 'Blocker: Design gate not approved',
    suggestedActions: [
      { label: 'View roadmap checklist', description: 'Confirm what is required to authorize roadmap creation.' },
      { label: 'Open execution roadmap', description: 'Inspect drafted workstreams, estimates, timeline, milestones, dependencies, and risks.' },
      { label: 'Inspect change readiness', description: 'Review readiness inputs that must carry into the approval package.' },
    ],
    agentHandoffs: [
      { agent: 'nexus',    label: 'Nexus',    state: 'active',  stateLabel: 'ACTIVE',  role: 'Orchestration lead' },
      { agent: 'steward',  label: 'Steward',  state: 'partial', stateLabel: 'PARTIAL', role: 'Awaiting gate clearance' },
      { agent: 'sentinel', label: 'Sentinel', state: 'partial', stateLabel: 'PARTIAL', role: 'Capacity not yet validated' },
      { agent: 'atlas',    label: 'Atlas',    state: 'partial', stateLabel: 'PARTIAL', role: 'Timeline at risk' },
    ],
    workshop: {
      title: 'Execution roadmap workshop (locked)',
      agenda: ['Walk target-state design', 'Define execution workstreams', 'Estimate timeline and capacity', 'Capture milestones and risks'],
      questions: ['What are the execution phases?', 'What must be true before each phase starts?', 'Which milestones and risks decide go/no-go?'],
      evidenceToCapture: ['Roadmap workstreams', 'Estimate basis', 'Milestone map', 'Risk register'],
      attendees: ['Sponsor', 'Program Lead', 'Architecture Lead', 'Finance Partner', 'Change Lead'],
    },
    missingInputs: [
      { label: 'Design gate approval', state: 'open', sourceLabel: 'Gate registry' },
      { label: 'Roadmap estimate basis', state: 'in-progress', sourceLabel: 'Execution roadmap' },
      { label: 'Execution success criteria', state: 'in-progress', sourceLabel: 'Roadmap package' },
    ],
  },
  {
    key: 'activate',
    brief:
      'Approval & Mobilization is locked until the execution roadmap is complete. Nexus should package the business case, funding ask, sponsor alignment, readiness, change-management plan, governance model, and mobilization approval packet.',
    cta: 'Pre-load approval packet',
    contextUsed: ['Business case', 'Funding ask', 'Stakeholder alignment', 'Readiness plan'],
    confidenceLabel: 'Confidence: locked',
    blockerLabel: 'Blocker: Execution roadmap not approved',
    suggestedActions: [
      { label: 'Pre-load approval packet', description: 'Stage business case, funding, readiness, and sponsor alignment artifacts.' },
      { label: 'Stage change plan', description: 'Prepare business readiness, communications, training, and adoption plan.' },
      { label: 'Stage governance model', description: 'Confirm decision rights, steering cadence, risk acceptance, and escalation path.' },
    ],
    agentHandoffs: [
      { agent: 'nexus',    label: 'Nexus',    state: 'active',  stateLabel: 'ACTIVE',  role: 'Orchestration lead' },
      { agent: 'steward',  label: 'Steward',  state: 'partial', stateLabel: 'PARTIAL', role: 'Mobilization approval gate' },
      { agent: 'sentinel', label: 'Sentinel', state: 'partial', stateLabel: 'PARTIAL', role: 'Approval risks not yet resolved' },
      { agent: 'atlas',    label: 'Atlas',    state: 'partial', stateLabel: 'PARTIAL', role: 'Business case evidence staged' },
    ],
    workshop: {
      title: 'Approval and mobilization review (locked)',
      agenda: ['Review business case', 'Confirm funding and capacity', 'Stress-test readiness and change plan', 'Capture sponsor decision conditions'],
      questions: ['What decision is being requested?', 'What evidence defends funding?', 'What readiness gaps block mobilization?'],
      evidenceToCapture: ['Business case', 'Funding approval memo', 'Stakeholder alignment log', 'Readiness and change plan'],
      attendees: ['Sponsor', 'Finance Partner', 'Program Lead', 'Change Lead', 'Business Owner'],
    },
    missingInputs: [
      { label: 'Execution roadmap approved', state: 'open', sourceLabel: 'Roadmap gate' },
      { label: 'Business case drafted', state: 'in-progress', sourceLabel: 'Approval packet' },
      { label: 'Readiness and change plan', state: 'in-progress', sourceLabel: 'Change plan' },
    ],
  },
  {
    key: 'operate',
    brief:
      'Tower Handoff defines how execution will be monitored after mobilization. Nexus should not run execution here; it should create the monitoring contract, data feeds, milestone cadence, escalation thresholds, and benefits tracking model for Tower.',
    cta: 'Pre-load Tower contract',
    contextUsed: ['Tower metrics', 'Milestone cadence', 'Escalation thresholds', 'Benefits tracking'],
    confidenceLabel: 'Confidence: locked',
    blockerLabel: 'Blocker: Mobilization approval not complete',
    suggestedActions: [
      { label: 'Pre-load Tower contract', description: 'Stage monitoring metrics, owners, cadence, and escalation thresholds.' },
      { label: 'Draft data-feed map', description: 'Name source systems, file owners, update cadence, and quality caveats.' },
      { label: 'Inspect benefits cadence', description: 'Review how Tower will track milestone and value movement.' },
    ],
    agentHandoffs: [
      { agent: 'nexus',    label: 'Nexus',    state: 'active',  stateLabel: 'ACTIVE',  role: 'Orchestration lead' },
      { agent: 'steward',  label: 'Steward',  state: 'partial', stateLabel: 'PARTIAL', role: 'Tower handoff gate' },
      { agent: 'sentinel', label: 'Sentinel', state: 'partial', stateLabel: 'PARTIAL', role: 'Monitoring risks pending' },
      { agent: 'atlas',    label: 'Atlas',    state: 'partial', stateLabel: 'PARTIAL', role: 'Execution signal model staged' },
    ],
    workshop: {
      title: 'Tower handoff review (locked)',
      agenda: ['Confirm monitoring metrics', 'Map data feeds and owners', 'Set escalation thresholds', 'Define weekly/monthly reporting cadence'],
      questions: ['What will Tower see every week?', 'Which signal triggers escalation?', 'Who owns data quality for each feed?'],
      evidenceToCapture: ['Tower monitoring contract', 'Data feed map', 'Escalation rules', 'Benefits tracking cadence'],
      attendees: ['Sponsor', 'Program Lead', 'Tower Owner', 'Data Owner', 'Value Office'],
    },
    missingInputs: [
      { label: 'Mobilization approval', state: 'open', sourceLabel: 'Approval packet' },
      { label: 'Monitoring metric model', state: 'open', sourceLabel: 'Tower contract' },
      { label: 'Data-feed owner map', state: 'in-progress', sourceLabel: 'Data feed map' },
    ],
  },
];

const EVIDENCE_COVERAGE: ReadonlyArray<NexusWorkbenchEvidenceSlice> = [
  { phaseKey: 'discovery', phaseLabel: 'Discovery', percentage: 36, tone: 'strong' },
  { phaseKey: 'synthesis', phaseLabel: 'Synthesis', percentage: 24, tone: 'partial' },
  { phaseKey: 'design',    phaseLabel: 'Design',    percentage: 18, tone: 'draft' },
  { phaseKey: 'build',     phaseLabel: 'Execution Roadmap', percentage: 12, tone: 'staged' },
  { phaseKey: 'activate',  phaseLabel: 'Approval & Mobilization', percentage: 6,  tone: 'staged' },
  { phaseKey: 'operate',   phaseLabel: 'Tower Handoff', percentage: 4,  tone: 'planned' },
];

// --- helpers -------------------------------------------------------------

function clonePhaseFocus(focus: NexusWorkbenchPhaseFocus): NexusWorkbenchPhaseFocus {
  return {
    key: focus.key,
    brief: focus.brief,
    cta: focus.cta,
    contextUsed: [...focus.contextUsed],
    confidenceLabel: focus.confidenceLabel,
    blockerLabel: focus.blockerLabel,
    suggestedActions: focus.suggestedActions.map((action) => ({ ...action })),
    agentHandoffs: focus.agentHandoffs.map((handoff) => ({ ...handoff })),
    workshop: {
      title: focus.workshop.title,
      agenda: [...focus.workshop.agenda],
      questions: [...focus.workshop.questions],
      evidenceToCapture: [...focus.workshop.evidenceToCapture],
      attendees: [...focus.workshop.attendees],
    },
    missingInputs: focus.missingInputs.map((input) => ({ ...input })),
  };
}

const SUBNAV_TABS: ReadonlyArray<NexusWorkbenchSubnavTab> = [
  { key: 'overview',     label: 'Overview' },
  { key: 'workshop',     label: 'Workshop' },
  { key: 'deliverables', label: 'Deliverables' },
  { key: 'evidence',     label: 'Evidence' },
  { key: 'actions',      label: 'Actions' },
  { key: 'gate',         label: 'Gate' },
];

function buildPhaseFocusByKey(): Record<string, NexusWorkbenchPhaseFocus> {
  const map: Record<string, NexusWorkbenchPhaseFocus> = {};
  for (const focus of PHASE_FOCUS_TEMPLATES) map[focus.key] = clonePhaseFocus(focus);
  return map;
}

// --- public --------------------------------------------------------------

// Per-program copy for the strip + journey subtitle + gate card. Keyed
// off the workbench phase derived from the seed's currentPhaseSpec.
function buildContextStripFor(
  tenantLabel: string,
  programCode: string,
  currentPhase: NexusWorkbenchPhaseNode,
): NexusWorkbenchContextStrip {
  const gateLabel =
    currentPhase.state === 'current' && currentPhase.key !== 'operate'
      ? 'Gate: Pending'
      : currentPhase.key === 'operate'
        ? 'Gate: Closed'
        : 'Gate: Pending';
  return {
    tenantBadgeLabel: `${tenantLabel} · Rich`,
    programCode,
    phaseLabel: `P${currentPhase.index} · ${currentPhase.label}`,
    gateLabel,
    caveat: 'Seed-backed · deterministic',
    sourceEventLabel: 'Linked Source event · Vendor C selected · apex-retail-ams-outsourcing-2026',
    sourceEventHref: '/source/events/apex-retail-ams-outsourcing-2026',
  };
}

function buildJourneySubtitleFor(
  currentPhase: NexusWorkbenchPhaseNode,
  nextPhase: NexusWorkbenchPhaseNode | undefined,
): string {
  const nextLabel = nextPhase?.label;
  if (!nextLabel) {
    return `P${currentPhase.index} ${currentPhase.label} is current. Outcome confirmation is the close-out gate.`;
  }
  return `P${currentPhase.index} ${currentPhase.label} is current. P${currentPhase.index + 1} ${nextLabel} is the next gate.`;
}

function buildGateCardFor(
  currentPhase: NexusWorkbenchPhaseNode,
  nextPhase: NexusWorkbenchPhaseNode | undefined,
): { label: string; description: string } {
  if (!nextPhase) {
    return {
      label: `${currentPhase.label} · Outcome close-out`,
      description:
        'Steward closes the program once outcome KPIs and sponsor sign-off are recorded.',
    };
  }
  if (currentPhase.key === 'synthesis' && nextPhase.key === 'design') {
    return {
      label: 'Synthesis → Design · Pending',
      description:
        'Steward blocks approval until Workshop 5 outcomes, value baseline, and platform owner confirmation are captured.',
    };
  }
  return {
    label: `${currentPhase.label} → ${nextPhase.label} · Pending`,
    description:
      `Steward blocks ${nextPhase.label} approval until the ${currentPhase.label} gate readiness conditions are captured.`,
  };
}

export function buildNexusProgramWorkbenchView(
  input: NexusProgramWorkbenchInput = {},
): NexusWorkbenchView {
  const programCode = input.programCode ?? DEFAULT_PROGRAM_CODE;
  const programName = input.programName ?? DEFAULT_PROGRAM_NAME;
  const tenantLabel = input.tenantLabel ?? DEFAULT_TENANT_LABEL;
  const currentPhaseSpec = (input.currentPhaseSpec ?? DEFAULT_CURRENT_SPEC) as SpecPhaseNumber;
  const defaultPhaseKey = SPEC_TO_WORKBENCH_KEY[currentPhaseSpec] ?? 'synthesis';

  const phaseJourney = buildPhaseJourneyForCurrent(defaultPhaseKey);
  const phaseFocusByKey = buildPhaseFocusByKey();
  const currentPhase = phaseJourney.find((p) => p.state === 'current')!;
  const currentIndex = phaseJourney.findIndex((p) => p.state === 'current');
  const nextPhase = phaseJourney[currentIndex + 1];
  const defaultFocus = phaseFocusByKey[defaultPhaseKey] ?? phaseFocusByKey['synthesis']!;
  const gate = buildGateCardFor(currentPhase, nextPhase);

  return {
    programCode,
    programName,
    tenantLabel,
    programIdentity: `${programCode} · ${programName}`,
    headerSubtitle:
      'Active Program workspace. Phase journey appears first; Nexus anchors the conversation and moves the Client Maestro toward the next gate decision.',
    contextStrip: buildContextStripFor(tenantLabel, programCode, currentPhase),
    phaseJourney,
    journeySubtitle: buildJourneySubtitleFor(currentPhase, nextPhase),
    defaultPhaseKey,
    phaseFocusByKey,
    brief: defaultFocus.brief,
    cta: defaultFocus.cta,
    contextUsed: [...defaultFocus.contextUsed],
    confidenceLabel: defaultFocus.confidenceLabel,
    blockerLabel: defaultFocus.blockerLabel,
    suggestedActions: defaultFocus.suggestedActions.map((action) => ({ ...action })),
    agentHandoffs: defaultFocus.agentHandoffs.map((handoff) => ({ ...handoff })),
    workshop: {
      title: defaultFocus.workshop.title,
      agenda: [...defaultFocus.workshop.agenda],
      questions: [...defaultFocus.workshop.questions],
      evidenceToCapture: [...defaultFocus.workshop.evidenceToCapture],
      attendees: [...defaultFocus.workshop.attendees],
    },
    missingInputs: defaultFocus.missingInputs.map((input) => ({ ...input })),
    subnavTabs: SUBNAV_TABS.map((tab) => ({ ...tab })),
    currentGateLabel: gate.label,
    currentGateDescription: gate.description,
    evidenceCoverage: EVIDENCE_COVERAGE.map((slice) => ({ ...slice })),
    evidenceCoverageNote:
      'Discovery evidence is strongest. Synthesis evidence is partial. Design deliverables remain draft until gate blockers clear.',
    customAskPlaceholder:
      'Ask Nexus a custom question scoped to this program, phase, gate, workshop, or evidence...',
    deterministicCaveat:
      'Deterministic route shell. No fake approvals or live agent actions. No live chat, model call, or persistence is executed from this workbench.',
    threeChoicesRule: 'Only shown when it moves work forward.',
  };
}

// Legacy alias for older imports.
export type NexusProgramWorkbenchView = NexusWorkbenchView;
