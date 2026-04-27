// AGENTUI1 · Nexus Program Workbench view model.
//
// Pure deterministic helper for the Program detail page anchor.
// No model calls, no runtime chat, no persistence, no Date.now reads.

import type { SpecPhaseNumber } from '@/lib/programs/enhancement-spec';

export type NexusWorkbenchAgentKey = 'nexus' | 'steward' | 'sentinel' | 'atlas';

export type NexusWorkbenchPhaseState = 'complete' | 'current' | 'blocked' | 'future';

export interface NexusWorkbenchPhaseNode {
  key: string;
  label: string;
  state: NexusWorkbenchPhaseState;
  note: string;
}

export interface NexusWorkbenchSuggestedAction {
  label: string;
  description: string;
  state: 'available' | 'deferred';
}

export interface NexusWorkbenchAgentHandoff {
  agent: NexusWorkbenchAgentKey;
  label: string;
  state: 'active' | 'blocker' | 'gap' | 'impact';
  summary: string;
}

export interface NexusWorkbenchConversationTurn {
  speaker: 'You' | 'Nexus';
  text: string;
}

export type NexusWorkbenchRequiredInputState = 'satisfied' | 'in-progress' | 'open';

export interface NexusWorkbenchRequiredInput {
  label: string;
  state: NexusWorkbenchRequiredInputState;
}

export interface NexusWorkbenchPhaseFocus {
  key: string;
  brief: string;
  blocker: string;
  recommendedNextAction: string;
  contextUsed: string[];
  requiredInputs: NexusWorkbenchRequiredInput[];
  suggestedActions: NexusWorkbenchSuggestedAction[];
  agentHandoffs: NexusWorkbenchAgentHandoff[];
  conversation: NexusWorkbenchConversationTurn[];
}

export interface NexusProgramWorkbenchView {
  programCode: string;
  programName: string;
  tenantLabel: string;
  currentProgram: string;
  currentPhase: string;
  currentGateState: string;
  currentWorkflowStage: string;
  phaseJourney: NexusWorkbenchPhaseNode[];
  defaultPhaseKey: string;
  phaseFocusByKey: Record<string, NexusWorkbenchPhaseFocus>;
  nexusBrief: string;
  contextUsed: string[];
  requiredInputs: NexusWorkbenchRequiredInput[];
  confidenceState: string;
  evidenceState: string;
  blocker: string;
  recommendedNextAction: string;
  suggestedActions: NexusWorkbenchSuggestedAction[];
  customAskPlaceholder: string;
  customAskDeferredState: string;
  agentHandoffs: NexusWorkbenchAgentHandoff[];
  deterministicCaveat: string;
}

export interface NexusProgramWorkbenchInput {
  programCode?: string;
  programName?: string;
  tenantLabel?: string;
  currentPhaseSpec?: SpecPhaseNumber;
  deliverableCount?: number;
  evidenceBackedDeliverables?: number;
}

const DEFAULT_PROGRAM_CODE = 'APX-CDP-2026';
const DEFAULT_PROGRAM_NAME = 'Apex Retail CDP Activation';
const DEFAULT_TENANT_LABEL = 'Apex Retail';

const PHASE_LABEL_BY_SPEC: Record<SpecPhaseNumber, string> = {
  1: 'Intake & Framing',
  2: 'Diagnosis & Analysis',
  3: 'Design & Decision',
  4: 'Build & Deliver',
  5: 'Outcome & Accountability',
};

const JOURNEY: ReadonlyArray<NexusWorkbenchPhaseNode> = [
  {
    key: 'discovery',
    label: 'Discovery',
    state: 'complete',
    note: 'Intake and context captured',
  },
  {
    key: 'synthesis',
    label: 'Synthesis',
    state: 'current',
    note: 'Maestro is here',
  },
  {
    key: 'design-gate',
    label: 'Design Gate',
    state: 'blocked',
    note: 'Value evidence missing',
  },
  {
    key: 'build',
    label: 'Build',
    state: 'future',
    note: 'Opens after gate',
  },
  {
    key: 'verify',
    label: 'Verify',
    state: 'future',
    note: 'Outcome proof later',
  },
];

const AGENT_HANDOFFS: ReadonlyArray<NexusWorkbenchAgentHandoff> = [
  {
    agent: 'nexus',
    label: 'Nexus',
    state: 'active',
    summary: 'Orchestration lead for the current program and gate.',
  },
  {
    agent: 'steward',
    label: 'Steward',
    state: 'blocker',
    summary: 'Design gate approval is blocked until readiness inputs land.',
  },
  {
    agent: 'sentinel',
    label: 'Sentinel',
    state: 'gap',
    summary: 'Evidence gap on value and deliverable support.',
  },
  {
    agent: 'atlas',
    label: 'Atlas',
    state: 'impact',
    summary: 'Executive value/risk implication needs evidence confidence.',
  },
];

const PHASE_FOCUS_TEMPLATES: ReadonlyArray<NexusWorkbenchPhaseFocus> = [
  {
    key: 'discovery',
    brief:
      'Discovery is closed. Intake, stakeholder map, and source events are captured and signed off — re-open only if framing changes.',
    blocker: 'No outstanding blocker. Discovery is closed.',
    recommendedNextAction:
      'Review Discovery artifacts before re-opening any framing decisions.',
    contextUsed: [
      'Intake brief',
      'Stakeholder map',
      'Source AMS event',
      'Constraints register',
    ],
    requiredInputs: [
      { label: 'Sponsor confirmed', state: 'satisfied' },
      { label: 'Stakeholder map signed off', state: 'satisfied' },
      { label: 'Source AMS event captured', state: 'satisfied' },
    ],
    suggestedActions: [
      {
        label: 'Open Discovery brief',
        description: 'Inspect the closed Discovery framing.',
        state: 'available',
      },
      {
        label: 'Inspect stakeholder map',
        description: 'Review captured stakeholders and influence map.',
        state: 'available',
      },
      {
        label: 'Review intake decisions',
        description: 'Show the framing decisions Discovery captured.',
        state: 'available',
      },
    ],
    agentHandoffs: [
      {
        agent: 'nexus',
        label: 'Nexus',
        state: 'active',
        summary: 'Orchestrator for Discovery review and re-open requests.',
      },
      {
        agent: 'steward',
        label: 'Steward',
        state: 'impact',
        summary: 'Discovery sign-off recorded; gate to Synthesis cleared.',
      },
      {
        agent: 'sentinel',
        label: 'Sentinel',
        state: 'impact',
        summary: 'No evidence gap flagged for the closed framing.',
      },
      {
        agent: 'atlas',
        label: 'Atlas',
        state: 'impact',
        summary: 'Baseline value hypothesis captured for downstream phases.',
      },
    ],
    conversation: [
      { speaker: 'You', text: 'What is left to confirm in Discovery?' },
      {
        speaker: 'Nexus',
        text: 'Discovery is closed — intake, stakeholders, and source events are captured. Re-open only if framing changes.',
      },
    ],
  },
  {
    key: 'synthesis',
    brief:
      'You are in Synthesis. The Design gate is pending because value evidence and stakeholder readiness are not strong enough for approval.',
    blocker:
      'Missing value evidence, stakeholder sign-off, and commercial readiness confirmation.',
    recommendedNextAction:
      'Review Design gate blockers before advancing the program to the next phase.',
    contextUsed: [
      'Program state',
      'Workshop 5 outcomes',
      'Evidence ledger',
      'Deliverables',
      'Source AMS event',
    ],
    requiredInputs: [
      { label: 'Workshop 5 outcomes captured', state: 'satisfied' },
      { label: 'Value evidence pack', state: 'open' },
      { label: 'Stakeholder readiness signal', state: 'in-progress' },
    ],
    suggestedActions: [
      {
        label: 'Review Design gate blockers',
        description: 'Show the gate items preventing approval.',
        state: 'available',
      },
      {
        label: 'Open Workshop 5 outcomes',
        description: 'Review synthesis decisions and unresolved questions.',
        state: 'available',
      },
      {
        label: 'Inspect deliverable evidence',
        description: 'Open evidence coverage before gate review.',
        state: 'available',
      },
    ],
    agentHandoffs: AGENT_HANDOFFS.map((handoff) => ({ ...handoff })),
    conversation: [
      { speaker: 'You', text: 'Can we move this program to Build?' },
      {
        speaker: 'Nexus',
        text: 'Hold until Design gate blockers are resolved: value evidence, workshop outcomes, and stakeholder alignment.',
      },
    ],
  },
  {
    key: 'design-gate',
    brief:
      'Design gate is the next checkpoint. Value evidence, stakeholder sign-off, and commercial readiness must all land before the program advances.',
    blocker:
      'Three open items: value evidence, stakeholder sign-off, commercial readiness. Value evidence is the longest pole.',
    recommendedNextAction:
      'Resolve the value evidence pole first, then close stakeholder sign-off and commercial readiness in parallel.',
    contextUsed: [
      'Gate checklist',
      'Evidence ledger',
      'Workshop 5 outcomes',
      'Stakeholder roster',
      'Commercial readiness pack',
    ],
    requiredInputs: [
      { label: 'Value evidence pack', state: 'open' },
      { label: 'Stakeholder sign-off', state: 'open' },
      { label: 'Commercial readiness confirmation', state: 'open' },
    ],
    suggestedActions: [
      {
        label: 'Open gate checklist',
        description: 'Inspect every open item on the Design gate.',
        state: 'available',
      },
      {
        label: 'Open evidence ledger',
        description: 'Show outstanding value evidence items.',
        state: 'available',
      },
      {
        label: 'Open stakeholder roster',
        description: 'Review pending stakeholder sign-offs.',
        state: 'available',
      },
    ],
    agentHandoffs: [
      {
        agent: 'nexus',
        label: 'Nexus',
        state: 'active',
        summary: 'Orchestrator for the Design gate review and approval flow.',
      },
      {
        agent: 'steward',
        label: 'Steward',
        state: 'blocker',
        summary: 'Design gate approval is held until readiness inputs land.',
      },
      {
        agent: 'sentinel',
        label: 'Sentinel',
        state: 'gap',
        summary: 'Evidence gap on value and deliverable support.',
      },
      {
        agent: 'atlas',
        label: 'Atlas',
        state: 'impact',
        summary: 'Executive value and risk depend on evidence confidence.',
      },
    ],
    conversation: [
      { speaker: 'You', text: 'What blocks the Design gate?' },
      {
        speaker: 'Nexus',
        text: 'Three items — value evidence, stakeholder sign-off, commercial readiness. Value evidence is the longest pole.',
      },
    ],
  },
  {
    key: 'build',
    brief:
      'Build is locked behind the Design gate. Capacity and sequencing plans are drafted but not authorized.',
    blocker: 'Locked behind Design gate — Build work cannot start.',
    recommendedNextAction:
      'Hold Build planning until the Design gate clears.',
    contextUsed: ['Gate dependency', 'Capacity plan', 'Sequencing plan'],
    requiredInputs: [
      { label: 'Design gate clearance', state: 'open' },
      { label: 'Capacity plan authorized', state: 'in-progress' },
      { label: 'Sequencing plan authorized', state: 'in-progress' },
    ],
    suggestedActions: [
      {
        label: 'View Build readiness checklist',
        description: 'Confirm what is required to authorize Build.',
        state: 'available',
      },
      {
        label: 'Open capacity plan',
        description: 'Inspect the drafted capacity allocation.',
        state: 'available',
      },
      {
        label: 'Inspect sequencing plan',
        description: 'Review the drafted Build sequencing.',
        state: 'available',
      },
    ],
    agentHandoffs: [
      {
        agent: 'nexus',
        label: 'Nexus',
        state: 'active',
        summary: 'Orchestrator for Build readiness, awaiting gate clearance.',
      },
      {
        agent: 'steward',
        label: 'Steward',
        state: 'gap',
        summary: 'Build authorization is pending Design gate approval.',
      },
      {
        agent: 'sentinel',
        label: 'Sentinel',
        state: 'gap',
        summary: 'Capacity and sequencing evidence not yet validated.',
      },
      {
        agent: 'atlas',
        label: 'Atlas',
        state: 'impact',
        summary: 'Build delay risks the executive outcome timeline.',
      },
    ],
    conversation: [
      { speaker: 'You', text: 'Can we start Build now?' },
      {
        speaker: 'Nexus',
        text: 'Hold — Build is gated by Design approval. Capacity and sequencing plans are drafted but not authorized.',
      },
    ],
  },
  {
    key: 'verify',
    brief:
      'Verify confirms outcomes after Build delivery. Outcome KPIs and sponsor sign-off are required to close.',
    blocker: 'Locked — opens after Build delivery and outcome capture.',
    recommendedNextAction:
      'Pre-load outcome KPIs and the sponsor sign-off pattern so Verify is ready when Build closes.',
    contextUsed: ['Outcome KPIs', 'Sponsor pattern', 'Risk close-out'],
    requiredInputs: [
      { label: 'Build delivery confirmation', state: 'open' },
      { label: 'Outcome KPIs measured', state: 'open' },
      { label: 'Sponsor sign-off pattern staged', state: 'in-progress' },
    ],
    suggestedActions: [
      {
        label: 'Pre-load outcome KPIs',
        description: 'Stage outcome KPIs against the intake hypothesis.',
        state: 'available',
      },
      {
        label: 'Draft sponsor sign-off plan',
        description: 'Stage the sponsor sign-off pattern for Verify.',
        state: 'available',
      },
      {
        label: 'Inspect risk close-out plan',
        description: 'Review the planned risk close-out path.',
        state: 'available',
      },
    ],
    agentHandoffs: [
      {
        agent: 'nexus',
        label: 'Nexus',
        state: 'active',
        summary: 'Orchestrator for Verify staging while Build runs.',
      },
      {
        agent: 'steward',
        label: 'Steward',
        state: 'gap',
        summary: 'Verify authorization opens after Build delivery is recorded.',
      },
      {
        agent: 'sentinel',
        label: 'Sentinel',
        state: 'gap',
        summary: 'Outcome evidence will be captured during Verify.',
      },
      {
        agent: 'atlas',
        label: 'Atlas',
        state: 'impact',
        summary: 'Sponsor outcome story closes here; pattern is staged.',
      },
    ],
    conversation: [
      { speaker: 'You', text: 'What proves the outcome here?' },
      {
        speaker: 'Nexus',
        text: 'Outcome KPIs against the intake hypothesis, sponsor sign-off, and risk close-out — captured but unverified.',
      },
    ],
  },
];

function buildPhaseFocusByKey(): Record<string, NexusWorkbenchPhaseFocus> {
  const map: Record<string, NexusWorkbenchPhaseFocus> = {};
  for (const focus of PHASE_FOCUS_TEMPLATES) {
    map[focus.key] = {
      ...focus,
      contextUsed: [...focus.contextUsed],
      requiredInputs: focus.requiredInputs.map((input) => ({ ...input })),
      suggestedActions: focus.suggestedActions.map((action) => ({ ...action })),
      agentHandoffs: focus.agentHandoffs.map((handoff) => ({ ...handoff })),
      conversation: focus.conversation.map((turn) => ({ ...turn })),
    };
  }
  return map;
}

export function buildNexusProgramWorkbenchView(
  input: NexusProgramWorkbenchInput = {},
): NexusProgramWorkbenchView {
  const programCode = input.programCode ?? DEFAULT_PROGRAM_CODE;
  const programName = input.programName ?? DEFAULT_PROGRAM_NAME;
  const tenantLabel = input.tenantLabel ?? DEFAULT_TENANT_LABEL;
  const currentPhaseSpec = input.currentPhaseSpec ?? 4;
  const deliverableCount = input.deliverableCount ?? 14;
  const evidenceBackedDeliverables = input.evidenceBackedDeliverables ?? 5;
  const seedPhaseLabel = PHASE_LABEL_BY_SPEC[currentPhaseSpec];

  const evidenceState = `${evidenceBackedDeliverables}/${deliverableCount} deliverables evidence-backed`;

  const phaseFocusByKey = buildPhaseFocusByKey();
  const phaseJourney = JOURNEY.map((phase) => ({ ...phase }));
  const defaultPhaseKey =
    phaseJourney.find((phase) => phase.state === 'current')?.key ?? phaseJourney[0]!.key;
  const defaultFocus = phaseFocusByKey[defaultPhaseKey] ?? phaseFocusByKey['synthesis']!;

  return {
    programCode,
    programName,
    tenantLabel,
    currentProgram: `${programCode} · ${programName}`,
    currentPhase: `Synthesis · seed phase ${currentPhaseSpec}: ${seedPhaseLabel}`,
    currentGateState: 'Design gate blocked',
    currentWorkflowStage: 'Workshop 5 outcomes -> Design gate review',
    phaseJourney,
    defaultPhaseKey,
    phaseFocusByKey,
    nexusBrief: defaultFocus.brief,
    contextUsed: [...defaultFocus.contextUsed],
    requiredInputs: defaultFocus.requiredInputs.map((input) => ({ ...input })),
    confidenceState: 'Deterministic confidence: partial',
    evidenceState,
    blocker: defaultFocus.blocker,
    recommendedNextAction: defaultFocus.recommendedNextAction,
    suggestedActions: defaultFocus.suggestedActions.map((action) => ({ ...action })),
    customAskPlaceholder:
      'Ask Nexus about this program, gate, workshop, or evidence...',
    customAskDeferredState:
      'Custom ask is scoped to this program and disabled until runtime Nexus execution is available.',
    agentHandoffs: defaultFocus.agentHandoffs.map((handoff) => ({ ...handoff })),
    deterministicCaveat:
      'Program guidance is deterministic and seed-backed. No live chat, model call, approval workflow, or persistence is executed from this workbench.',
  };
}
