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
// shows six product-friendly phases. This map collapses the spec into
// the workbench keys; "activate" is a transition phase between Build
// (spec 4) and Operate (spec 5) that has no seed-side counterpart.
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
  { key: 'build',     index: 4, label: 'Build'     },
  { key: 'activate',  index: 5, label: 'Activate'  },
  { key: 'operate',   index: 6, label: 'Operate'   },
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
      'Build is locked behind the Design gate. Implementation plan, integration design, and change management are drafted but not authorized.',
    cta: 'View readiness checklist',
    contextUsed: ['Gate dependency', 'Implementation plan', 'Integration design', 'Change management'],
    confidenceLabel: 'Confidence: locked',
    blockerLabel: 'Blocker: Design gate not approved',
    suggestedActions: [
      { label: 'View Build readiness checklist', description: 'Confirm what is required to authorize Build.' },
      { label: 'Open implementation plan',       description: 'Inspect the drafted implementation plan.' },
      { label: 'Inspect change management plan', description: 'Review the drafted change plan.' },
    ],
    agentHandoffs: [
      { agent: 'nexus',    label: 'Nexus',    state: 'active',  stateLabel: 'ACTIVE',  role: 'Orchestration lead' },
      { agent: 'steward',  label: 'Steward',  state: 'partial', stateLabel: 'PARTIAL', role: 'Awaiting gate clearance' },
      { agent: 'sentinel', label: 'Sentinel', state: 'partial', stateLabel: 'PARTIAL', role: 'Capacity not yet validated' },
      { agent: 'atlas',    label: 'Atlas',    state: 'partial', stateLabel: 'PARTIAL', role: 'Timeline at risk' },
    ],
    workshop: {
      title: 'Build readiness review (locked)',
      agenda: ['Walk implementation plan', 'Confirm capacity allocation', 'Inspect change-management plan'],
      questions: ['Is capacity validated end-to-end?', 'Who owns each change-management workstream?'],
      evidenceToCapture: ['Capacity sign-off', 'Sequencing plan', 'Risk register'],
      attendees: ['Implementation lead', 'Change lead', 'Vendor lead'],
    },
    missingInputs: [
      { label: 'Design gate approval', state: 'open', sourceLabel: 'Gate registry' },
      { label: 'Capacity allocation sign-off', state: 'in-progress', sourceLabel: 'Capacity plan' },
      { label: 'Change-management plan', state: 'in-progress', sourceLabel: 'Change plan' },
    ],
  },
  {
    key: 'activate',
    brief:
      'Activate is locked until Build delivery is confirmed. Cutover plan, training plan, and adoption playbook are pre-staged.',
    cta: 'Pre-load activation plan',
    contextUsed: ['Cutover plan', 'Training plan', 'Adoption playbook'],
    confidenceLabel: 'Confidence: locked',
    blockerLabel: 'Blocker: Build delivery not confirmed',
    suggestedActions: [
      { label: 'Pre-load cutover plan',   description: 'Stage the cutover plan for Activate.' },
      { label: 'Stage training plan',     description: 'Pre-load the training plan for Activate.' },
      { label: 'Stage adoption playbook', description: 'Pre-load the adoption playbook.' },
    ],
    agentHandoffs: [
      { agent: 'nexus',    label: 'Nexus',    state: 'active',  stateLabel: 'ACTIVE',  role: 'Orchestration lead' },
      { agent: 'steward',  label: 'Steward',  state: 'partial', stateLabel: 'PARTIAL', role: 'Post-Build gate' },
      { agent: 'sentinel', label: 'Sentinel', state: 'partial', stateLabel: 'PARTIAL', role: 'Adoption signals not yet wired' },
      { agent: 'atlas',    label: 'Atlas',    state: 'partial', stateLabel: 'PARTIAL', role: 'Adoption risk staged' },
    ],
    workshop: {
      title: 'Activation readiness preview (locked)',
      agenda: ['Cutover plan walkthrough', 'Training rollout', 'Adoption playbook stress test'],
      questions: ['Are training assets ready?', 'Where are adoption risks concentrated?'],
      evidenceToCapture: ['Cutover sign-off', 'Training completion', 'Adoption signal wiring'],
      attendees: ['Adoption lead', 'Training lead', 'Change lead'],
    },
    missingInputs: [
      { label: 'Build delivery confirmation', state: 'open', sourceLabel: 'Delivery log' },
      { label: 'Cutover plan authorized', state: 'in-progress', sourceLabel: 'Cutover plan' },
      { label: 'Training plan ready', state: 'in-progress', sourceLabel: 'Training plan' },
    ],
  },
  {
    key: 'operate',
    brief:
      'Operate confirms outcomes after Activate. Outcome KPIs, sponsor sign-off, and risk close-out are required to close the program.',
    cta: 'Pre-load outcome KPIs',
    contextUsed: ['Outcome KPIs', 'Sponsor pattern', 'Risk close-out'],
    confidenceLabel: 'Confidence: locked',
    blockerLabel: 'Blocker: Activate cutover not complete',
    suggestedActions: [
      { label: 'Pre-load outcome KPIs',  description: 'Stage outcome KPIs against the intake hypothesis.' },
      { label: 'Draft sponsor sign-off', description: 'Stage the sponsor sign-off pattern for Operate.' },
      { label: 'Inspect risk close-out', description: 'Review the planned risk close-out path.' },
    ],
    agentHandoffs: [
      { agent: 'nexus',    label: 'Nexus',    state: 'active',  stateLabel: 'ACTIVE',  role: 'Orchestration lead' },
      { agent: 'steward',  label: 'Steward',  state: 'partial', stateLabel: 'PARTIAL', role: 'Close-out gate' },
      { agent: 'sentinel', label: 'Sentinel', state: 'partial', stateLabel: 'PARTIAL', role: 'Outcome evidence pending' },
      { agent: 'atlas',    label: 'Atlas',    state: 'partial', stateLabel: 'PARTIAL', role: 'Sponsor outcome staged' },
    ],
    workshop: {
      title: 'Outcome close-out preview (locked)',
      agenda: ['Outcome KPI review', 'Sponsor sign-off pattern', 'Risk close-out walkthrough'],
      questions: ['Which KPIs prove the realized outcome?', 'Who signs off and when?'],
      evidenceToCapture: ['Outcome KPI evidence', 'Sponsor sign-off', 'Risk close-out memo'],
      attendees: ['Sponsor', 'Value Office', 'Steward'],
    },
    missingInputs: [
      { label: 'Activate cutover complete', state: 'open', sourceLabel: 'Cutover registry' },
      { label: 'Outcome KPI measurement', state: 'open', sourceLabel: 'Outcome KPIs' },
      { label: 'Sponsor sign-off pattern', state: 'in-progress', sourceLabel: 'Sponsor pattern' },
    ],
  },
];

const EVIDENCE_COVERAGE: ReadonlyArray<NexusWorkbenchEvidenceSlice> = [
  { phaseKey: 'discovery', phaseLabel: 'Discovery', percentage: 36, tone: 'strong' },
  { phaseKey: 'synthesis', phaseLabel: 'Synthesis', percentage: 24, tone: 'partial' },
  { phaseKey: 'design',    phaseLabel: 'Design',    percentage: 18, tone: 'draft' },
  { phaseKey: 'build',     phaseLabel: 'Build',     percentage: 12, tone: 'staged' },
  { phaseKey: 'activate',  phaseLabel: 'Activate',  percentage: 6,  tone: 'staged' },
  { phaseKey: 'operate',   phaseLabel: 'Operate',   percentage: 4,  tone: 'planned' },
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
    sourceEventLabel: 'Linked Source event · apex-retail-ams-outsourcing-2026',
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
