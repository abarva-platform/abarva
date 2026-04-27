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

export interface NexusWorkbenchPhaseFocus {
  key: string;
  brief: string;
  cta: string;
  contextUsed: string[];
  confidenceLabel: string;
  blockerLabel: string;
  suggestedActions: NexusWorkbenchSuggestedAction[];
  agentHandoffs: NexusWorkbenchAgentHandoff[];
}

export interface NexusWorkbenchEvidenceSlice {
  phaseKey: string;
  phaseLabel: string;
  percentage: number;
  tone: 'strong' | 'partial' | 'draft' | 'staged' | 'planned';
}

export interface NexusWorkbenchView {
  programCode: string;
  programName: string;
  tenantLabel: string;
  programIdentity: string;
  headerSubtitle: string;
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

const PHASE_TEMPLATES: ReadonlyArray<NexusWorkbenchPhaseNode> = [
  { key: 'discovery', index: 1, label: 'Discovery', state: 'done',         stateLabel: 'Done' },
  { key: 'synthesis', index: 2, label: 'Synthesis', state: 'current',      stateLabel: 'Current' },
  { key: 'design',    index: 3, label: 'Design',    state: 'gate-pending', stateLabel: 'Gate pending' },
  { key: 'build',     index: 4, label: 'Build',     state: 'locked',       stateLabel: 'Locked' },
  { key: 'activate',  index: 5, label: 'Activate',  state: 'locked',       stateLabel: 'Locked' },
  { key: 'operate',   index: 6, label: 'Operate',   state: 'locked',       stateLabel: 'Locked' },
];

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
  };
}

function buildPhaseFocusByKey(): Record<string, NexusWorkbenchPhaseFocus> {
  const map: Record<string, NexusWorkbenchPhaseFocus> = {};
  for (const focus of PHASE_FOCUS_TEMPLATES) map[focus.key] = clonePhaseFocus(focus);
  return map;
}

// --- public --------------------------------------------------------------

export function buildNexusProgramWorkbenchView(
  input: NexusProgramWorkbenchInput = {},
): NexusWorkbenchView {
  const programCode = input.programCode ?? DEFAULT_PROGRAM_CODE;
  const programName = input.programName ?? DEFAULT_PROGRAM_NAME;
  const tenantLabel = input.tenantLabel ?? DEFAULT_TENANT_LABEL;

  const phaseJourney = PHASE_TEMPLATES.map((phase) => ({ ...phase }));
  const phaseFocusByKey = buildPhaseFocusByKey();
  const defaultPhaseKey =
    phaseJourney.find((phase) => phase.state === 'current')?.key ?? phaseJourney[0]!.key;
  const defaultFocus = phaseFocusByKey[defaultPhaseKey] ?? phaseFocusByKey['synthesis']!;

  return {
    programCode,
    programName,
    tenantLabel,
    programIdentity: `${programCode} · ${programName}`,
    headerSubtitle:
      'Active Program workspace. Phase journey appears first; Nexus anchors the conversation and moves the Client Maestro toward the next gate decision.',
    phaseJourney,
    journeySubtitle:
      'P2 is active. P3 Design is gated by Workshop 5 outcomes and value hypothesis evidence.',
    defaultPhaseKey,
    phaseFocusByKey,
    brief: defaultFocus.brief,
    cta: defaultFocus.cta,
    contextUsed: [...defaultFocus.contextUsed],
    confidenceLabel: defaultFocus.confidenceLabel,
    blockerLabel: defaultFocus.blockerLabel,
    suggestedActions: defaultFocus.suggestedActions.map((action) => ({ ...action })),
    agentHandoffs: defaultFocus.agentHandoffs.map((handoff) => ({ ...handoff })),
    currentGateLabel: 'Synthesis → Design · Pending',
    currentGateDescription:
      'Steward blocks approval until Workshop 5 outcomes, value baseline, and platform owner confirmation are captured.',
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
