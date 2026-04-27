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

export interface NexusProgramWorkbenchView {
  programCode: string;
  programName: string;
  tenantLabel: string;
  currentProgram: string;
  currentPhase: string;
  currentGateState: string;
  currentWorkflowStage: string;
  phaseJourney: NexusWorkbenchPhaseNode[];
  nexusBrief: string;
  contextUsed: string[];
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

const CONTEXT_USED = [
  'Program state',
  'Workshop 5 outcomes',
  'Evidence ledger',
  'Deliverables',
  'Source AMS event',
] as const;

const SUGGESTED_ACTIONS: ReadonlyArray<NexusWorkbenchSuggestedAction> = [
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

  return {
    programCode,
    programName,
    tenantLabel,
    currentProgram: `${programCode} · ${programName}`,
    currentPhase: `Synthesis · seed phase ${currentPhaseSpec}: ${seedPhaseLabel}`,
    currentGateState: 'Design gate blocked',
    currentWorkflowStage: 'Workshop 5 outcomes -> Design gate review',
    phaseJourney: JOURNEY.map((phase) => ({ ...phase })),
    nexusBrief:
      'You are in Synthesis. The Design gate is pending because value evidence and stakeholder readiness are not strong enough for approval.',
    contextUsed: [...CONTEXT_USED],
    confidenceState: 'Deterministic confidence: partial',
    evidenceState,
    blocker: 'Missing value evidence, stakeholder sign-off, and commercial readiness confirmation.',
    recommendedNextAction:
      'Review Design gate blockers before advancing the program to the next phase.',
    suggestedActions: SUGGESTED_ACTIONS.map((action) => ({ ...action })),
    customAskPlaceholder:
      'Ask Nexus about this program, gate, workshop, or evidence...',
    customAskDeferredState:
      'Custom ask is scoped to this program and disabled until runtime Nexus execution is available.',
    agentHandoffs: AGENT_HANDOFFS.map((handoff) => ({ ...handoff })),
    deterministicCaveat:
      'Program guidance is deterministic and seed-backed. No live chat, model call, approval workflow, or persistence is executed from this workbench.',
  };
}
