// PROG-A — Page-view builder functions for the Programs surface.
// Pure functions: no React, no model calls, no network, no Date.now() reads.
// Consumes APEX_PROGRAMS_FIXTURE and returns typed view-models.

import type {
  ProgramPhaseId,
  ProgramPhaseSlot,
  ProgramAgentRailItem,
  ProgramWorkbenchContent,
  ProgramPhasePanel,
  ProgramsIndexView,
  ProgramDetailView,
  ProgramOriginationView,
  AgentRailState,
} from './programs-types';
import { APEX_PROGRAMS_FIXTURE, PHASE_LABEL_MAP } from './programs-fixture';

// ─── Agent definitions ───────────────────────────────────────────────────────

const AGENT_NEXUS: Omit<ProgramAgentRailItem, 'job' | 'state'> = {
  initials: 'Nx',
  name: 'Nexus',
};
const AGENT_SENTINEL: Omit<ProgramAgentRailItem, 'job' | 'state'> = {
  initials: 'Sn',
  name: 'Sentinel',
};
const AGENT_ATLAS: Omit<ProgramAgentRailItem, 'job' | 'state'> = {
  initials: 'At',
  name: 'Atlas',
};
const AGENT_STEWARD: Omit<ProgramAgentRailItem, 'job' | 'state'> = {
  initials: 'St',
  name: 'Steward',
};

function makeAgent(
  base: Omit<ProgramAgentRailItem, 'job' | 'state'>,
  job: string,
  state: AgentRailState,
): ProgramAgentRailItem {
  return { ...base, job, state };
}

// ─── Phase-scoped agent rail logic ───────────────────────────────────────────
//
// P0 (origination)          : Steward active, Nexus on_call
// P1 (discovery)            : Nexus active, Atlas on_call
// P2 (synthesis)            : Nexus active, Atlas on_call
// P2-P3 with gate pending   : Nexus active, Sentinel on_call, Atlas on_call
// P3 (design)               : Nexus active, Atlas on_call
// P4 (build)                : Nexus active, Atlas on_call
// P5-P6 (activate/operate)  : Nexus active, Steward advisory
// Idle programs              : Steward advisory

function buildAgentRailForPhase(
  phase: ProgramPhaseId,
  gateStatus: string,
  isIdle: boolean,
): ProgramAgentRailItem[] {
  if (phase === 0) {
    return [
      makeAgent(AGENT_STEWARD, 'Leading origination — framing the problem', 'active'),
      makeAgent(AGENT_NEXUS, 'Ready to assist with charter framing', 'on_call'),
    ];
  }

  if (isIdle) {
    return [
      makeAgent(AGENT_STEWARD, 'Monitoring idle program — no active owner', 'advisory'),
      makeAgent(AGENT_NEXUS, 'Standing by for re-engagement', 'idle'),
    ];
  }

  if (phase >= 5) {
    return [
      makeAgent(AGENT_NEXUS, 'Tracking operate/activate signals', 'active'),
      makeAgent(AGENT_STEWARD, 'Advisory — governance oversight', 'advisory'),
    ];
  }

  // P2 or P3 with gate pending: add Sentinel
  if ((phase === 2 || phase === 3) && gateStatus === 'pending') {
    return [
      makeAgent(AGENT_NEXUS, 'Driving synthesis toward gate decision', 'active'),
      makeAgent(AGENT_SENTINEL, 'Reviewing gate criteria and risk signals', 'on_call'),
      makeAgent(AGENT_ATLAS, 'Pattern benchmarking for design gate', 'on_call'),
    ];
  }

  // P1-P4 default
  const jobsByPhase: Record<number, string> = {
    1: 'Running discovery — capturing evidence and interviews',
    2: 'Synthesizing findings into gate-ready materials',
    3: 'Evaluating design options against success criteria',
    4: 'Tracking build artifacts and integration progress',
  };
  return [
    makeAgent(AGENT_NEXUS, jobsByPhase[phase] ?? 'Active on current phase work', 'active'),
    makeAgent(AGENT_ATLAS, 'Pattern and benchmark advisory', 'on_call'),
  ];
}

// ─── Workbench content builders ──────────────────────────────────────────────

function buildPortfolioWorkbench(): ProgramWorkbenchContent {
  return {
    title: 'Portfolio overview · Apex Retail',
    prose:
      'You have 5 active programs in flight, 2 gates pending decision, and 2 idle programs. ' +
      'APX-01 is closest to a gate — the Design gate decision for Morrison Owned Brand Margin Recovery is ready for your review.',
    actionsLabel: 'Suggested actions',
    actions: [
      {
        letter: 'A',
        text: 'Review Design gate — APX-01',
        detail: 'Nexus has prepared the gate package. 2 criteria met, 1 outstanding.',
      },
      {
        letter: 'B',
        text: 'Re-engage sponsor on APX-04',
        detail: 'Markdown Cadence Reset has been idle 12 days. Steward recommends a nudge.',
      },
      {
        letter: 'C',
        text: 'Unblock Activate gate — APX-05',
        detail: 'Store Replenishment Vision needs 2 criteria resolved before Activate can proceed.',
      },
    ],
  };
}

function buildDetailWorkbench(
  programName: string,
  displayId: string,
  viewingPhase: ProgramPhaseId,
  currentPhase: ProgramPhaseId,
  gateStatus: string,
): ProgramWorkbenchContent {
  const phaseLabel = PHASE_LABEL_MAP[viewingPhase];

  if (viewingPhase === currentPhase) {
    // Active workbench — next actions for the current phase
    const titleByPhase: Record<number, string> = {
      0: `P0 · Originate — ${programName}`,
      1: `P1 · Discovery active — ${displayId}`,
      2: `P2 · Synthesis active — ${displayId}`,
      3: `P3 · Design active — ${displayId}`,
      4: `P4 · Build active — ${displayId}`,
      5: `P5 · Activate active — ${displayId}`,
      6: `P6 · Operate — ${displayId}`,
    };
    const proseByPhase: Record<number, string> = {
      0: `${programName} is in origination. Steward is leading the framing conversation. Define the problem statement and identify the executive sponsor to proceed to Discovery.`,
      1: `Discovery is underway for ${programName}. Nexus is capturing evidence items and scheduling interviews. Advance to Synthesis when the evidence backlog is closed.`,
      2: `Synthesis is active for ${programName}. Nexus is anchoring the ${gateStatus === 'pending' ? 'Design gate decision' : 'synthesis package'}. ${gateStatus === 'pending' ? 'The gate package is ready for your review.' : 'Findings are being consolidated.'}`,
      3: `Design phase is active for ${programName}. Nexus is evaluating solution options. ${gateStatus === 'pending' ? 'The gate criteria package is ready for your review.' : 'Design options are being assessed.'}`,
      4: `Build is active for ${programName}. Nexus is tracking artifact completion and integration milestones. ${gateStatus === 'open' ? 'Gate is open — no blocking criteria.' : 'Gate criteria are being evaluated.'}`,
      5: `Activate is underway for ${programName}. ${gateStatus === 'pending' ? 'Gate criteria are partially met — 2 items outstanding.' : 'Activation is progressing.'} Nexus is monitoring rollout signals.`,
      6: `${programName} is operating in steady state. Nexus is monitoring performance signals. No maestro input currently required.`,
    };
    return {
      title: titleByPhase[viewingPhase] ?? `P${viewingPhase} · ${phaseLabel} — ${displayId}`,
      prose: proseByPhase[viewingPhase] ?? `${programName} is active in ${phaseLabel}.`,
      actionsLabel: 'Next actions',
      actions: buildActivePhaseActions(viewingPhase, gateStatus, displayId),
    };
  }

  if (viewingPhase < currentPhase) {
    // Historical workbench — reviewing a completed phase
    const itemCount = viewingPhase === 1 ? 4 : viewingPhase === 2 ? 6 : 3;
    return {
      title: `Reviewing P${viewingPhase} · ${phaseLabel} — ${displayId}`,
      prose:
        `You're reviewing P${viewingPhase} · ${phaseLabel}. ` +
        `Completed with ${itemCount} evidence items captured. ` +
        `This phase is behind the program's current position at P${currentPhase} · ${PHASE_LABEL_MAP[currentPhase]}.`,
      actionsLabel: 'Historical record',
      actions: [
        {
          letter: 'A',
          text: `Review ${phaseLabel} deliverables`,
          detail: `${itemCount} items from this phase are available in the archive.`,
        },
        {
          letter: 'B',
          text: `Return to current phase (P${currentPhase})`,
          detail: `Jump back to ${PHASE_LABEL_MAP[currentPhase]} where active work is happening.`,
        },
      ],
    };
  }

  // viewingPhase > currentPhase — pending/locked phase
  return {
    title: `P${viewingPhase} · ${phaseLabel} is gated — ${displayId}`,
    prose:
      `P${viewingPhase} · ${phaseLabel} is gated. ` +
      `${programName} is currently in P${currentPhase} · ${PHASE_LABEL_MAP[currentPhase]}. ` +
      `This phase cannot be entered until the current phase gate is cleared.`,
    actionsLabel: 'Gate criteria',
    actions: [
      {
        letter: 'A',
        text: `Review current phase (P${currentPhase})`,
        detail: `Return to ${PHASE_LABEL_MAP[currentPhase]} to work toward opening this gate.`,
      },
    ],
  };
}

function buildActivePhaseActions(
  phase: ProgramPhaseId,
  gateStatus: string,
  displayId: string,
): ProgramWorkbenchContent['actions'] {
  switch (phase) {
    case 0:
      return [
        { letter: 'A', text: 'Define problem statement', detail: 'Steward has a framing template ready.' },
        { letter: 'B', text: 'Identify executive sponsor', detail: 'Required before Discovery can begin.' },
      ];
    case 1:
      return [
        { letter: 'A', text: 'Review evidence backlog', detail: 'Nexus has captured items pending your review.' },
        { letter: 'B', text: 'Confirm interview schedule', detail: 'Stakeholder interviews need scheduling confirmation.' },
      ];
    case 2:
      if (gateStatus === 'pending') {
        return [
          { letter: 'A', text: 'Review Design gate package', detail: 'Nexus has prepared the gate criteria assessment.' },
          { letter: 'B', text: 'Approve or request changes', detail: 'Your decision unblocks P3 Design.' },
        ];
      }
      return [
        { letter: 'A', text: 'Review synthesis findings', detail: 'Nexus has consolidated the evidence into findings.' },
        { letter: 'B', text: 'Flag any contradictions', detail: `Sentinel is monitoring for risk signals in ${displayId}.` },
      ];
    case 3:
      if (gateStatus === 'pending') {
        return [
          { letter: 'A', text: 'Review design decision memo', detail: 'Gate package is ready — your approval advances to Build.' },
          { letter: 'B', text: 'Request Atlas benchmarks', detail: 'Compare against peer deployments before deciding.' },
        ];
      }
      return [
        { letter: 'A', text: 'Review design options', detail: 'Nexus is evaluating 3 solution configurations.' },
        { letter: 'B', text: 'Confirm evaluation criteria', detail: 'Atlas has loaded peer benchmarks for comparison.' },
      ];
    case 4:
      return [
        { letter: 'A', text: 'Review build progress', detail: 'Nexus is tracking artifact completion — currently 60%.' },
        { letter: 'B', text: 'Unblock any integration dependencies', detail: 'One external dependency flagged — review needed.' },
      ];
    case 5:
      return [
        { letter: 'A', text: 'Clear remaining gate criteria', detail: '2 Activate gate criteria outstanding.' },
        { letter: 'B', text: 'Review rollout signals', detail: 'Nexus is monitoring activation KPIs.' },
      ];
    case 6:
      return [
        { letter: 'A', text: 'Review operate dashboard', detail: 'Steady-state performance signals are available.' },
        { letter: 'B', text: 'Initiate outcome attestation', detail: 'G4 gate requires CXO verification of realized outcomes.' },
      ];
    default:
      return [];
  }
}

// ─── Phase panel builder ─────────────────────────────────────────────────────

function buildPhasePanel(
  viewingPhase: ProgramPhaseId,
  currentPhase: ProgramPhaseId,
  gateStatus: string,
  programName: string,
): ProgramPhasePanel {
  if (viewingPhase < currentPhase) {
    // Completed phase — historical summary
    return {
      summary: `P${viewingPhase} · ${PHASE_LABEL_MAP[viewingPhase]} completed. Evidence items captured and gate passed.`,
      deliverables: [
        { label: 'Phase kickoff brief', status: 'done' },
        { label: 'Stakeholder interview notes', status: 'done' },
        { label: 'Evidence summary memo', status: 'done' },
      ],
    };
  }

  if (viewingPhase === currentPhase) {
    // Current phase — active deliverables
    const hasPendingGate = gateStatus === 'pending';
    return {
      summary: `P${viewingPhase} · ${PHASE_LABEL_MAP[viewingPhase]} is active for ${programName}.`,
      deliverables: [
        { label: 'Phase brief', status: 'done' },
        { label: 'Primary workstream deliverable', status: hasPendingGate ? 'done' : 'pending' },
        { label: 'Gate criteria package', status: hasPendingGate ? 'pending' : 'pending' },
      ],
      gateCriteria: hasPendingGate
        ? [
            { criterion: 'Evidence package complete', met: true },
            { criterion: 'Sponsor sign-off received', met: false },
            { criterion: 'Risk register reviewed', met: true },
          ]
        : undefined,
    };
  }

  // viewingPhase > currentPhase — future/locked phase
  return {
    summary: `P${viewingPhase} · ${PHASE_LABEL_MAP[viewingPhase]} is locked. Advance through P${currentPhase} · ${PHASE_LABEL_MAP[currentPhase]} to unlock.`,
    gateCriteria: [
      { criterion: `P${currentPhase} gate must be cleared first`, met: false },
      { criterion: 'All current phase deliverables signed off', met: false },
    ],
    blockerNote: `Gate is closed. Complete P${currentPhase} · ${PHASE_LABEL_MAP[currentPhase]} to advance.`,
  };
}

// ─── Origination phase slots ─────────────────────────────────────────────────

function buildOriginationPhaseSlots(): ProgramPhaseSlot[] {
  return [
    { id: 0, label: PHASE_LABEL_MAP[0], state: 'current' },
    { id: 1, label: PHASE_LABEL_MAP[1], state: 'locked' },
    { id: 2, label: PHASE_LABEL_MAP[2], state: 'locked' },
    { id: 3, label: PHASE_LABEL_MAP[3], state: 'locked' },
    { id: 4, label: PHASE_LABEL_MAP[4], state: 'locked' },
    { id: 5, label: PHASE_LABEL_MAP[5], state: 'locked' },
    { id: 6, label: PHASE_LABEL_MAP[6], state: 'locked' },
  ];
}

// ─── Public builder functions ────────────────────────────────────────────────

export function buildProgramsIndexView(tenantSlug: string): ProgramsIndexView {
  const programs = APEX_PROGRAMS_FIXTURE;
  const totalActive = programs.filter((p) => !p.isIdle).length;
  const gatesPending = programs.filter((p) => p.gateStatus === 'pending').length;
  const idleCount = programs.filter((p) => p.isIdle).length;

  // Capacity label: active + idle / total
  const capacityLabel = `${totalActive} active · ${idleCount} idle · ${programs.length} total`;

  // Portfolio-level agent rail (index view uses Nexus as primary)
  const agentRail: ProgramAgentRailItem[] = [
    makeAgent(AGENT_NEXUS, 'Monitoring portfolio — 2 gates need attention', 'active'),
    makeAgent(AGENT_SENTINEL, 'Pattern drift monitoring across all programs', 'on_call'),
    makeAgent(AGENT_ATLAS, 'Benchmark intelligence on demand', 'advisory'),
    makeAgent(AGENT_STEWARD, 'Governance and capacity oversight', 'advisory'),
  ];

  void tenantSlug; // consumed for future multi-tenant routing; fixture is Apex Retail

  return {
    tenant: 'Apex Retail Group',
    totalActive,
    gatesPending,
    idleCount,
    capacityLabel,
    portfolioWorkbench: buildPortfolioWorkbench(),
    agentRail,
    programs,
  };
}

export function buildProgramDetailView(
  programId: string,
  viewingPhase: ProgramPhaseId,
): ProgramDetailView {
  const program = APEX_PROGRAMS_FIXTURE.find((p) => p.id === programId);
  if (!program) {
    throw new Error(`buildProgramDetailView: no fixture found for programId="${programId}"`);
  }

  const { currentPhase, gateStatus, isIdle } = program;
  const agentRail = buildAgentRailForPhase(currentPhase, gateStatus, isIdle);
  const workbench = buildDetailWorkbench(
    program.name,
    program.displayId,
    viewingPhase,
    currentPhase,
    gateStatus,
  );
  const phasePanel = buildPhasePanel(viewingPhase, currentPhase, gateStatus, program.name);

  return {
    programId: program.id,
    displayId: program.displayId,
    name: program.name,
    tenant: 'Apex Retail Group',
    currentPhase,
    viewingPhase,
    phases: program.phases,
    gateStatus: program.gateStatus,
    workbench,
    agentRail,
    phasePanel,
    deterministicSeed: true,
  };
}

export function buildProgramOriginationView(tenantSlug: string): ProgramOriginationView {
  void tenantSlug; // consumed for future multi-tenant routing

  const agentRail: ProgramAgentRailItem[] = [
    makeAgent(AGENT_STEWARD, 'Leading origination — guiding the problem framing conversation', 'active'),
    makeAgent(AGENT_NEXUS, 'Ready to draft the charter once framing is complete', 'on_call'),
  ];

  const workbench: ProgramWorkbenchContent = {
    title: 'P0 · Originate — new program',
    prose:
      'Steward is leading this origination session. Define the problem statement and identify the executive sponsor. ' +
      'When you have a clear scope and sponsor confirmed, Nexus will draft the charter and Discovery can begin.',
    actionsLabel: 'Origination steps',
    actions: [
      {
        letter: 'A',
        text: 'Define the problem statement',
        detail: 'What is the business problem or opportunity? Be specific about the outcome you want to achieve.',
      },
      {
        letter: 'B',
        text: 'Identify the executive sponsor',
        detail: 'Programs require a named executive sponsor before advancing to Discovery.',
      },
      {
        letter: 'C',
        text: 'Confirm scope boundary',
        detail: 'Steward will flag scope creep risks based on peer program patterns.',
      },
    ],
  };

  return {
    tenant: 'Apex Retail Group',
    phases: buildOriginationPhaseSlots(),
    workbench,
    agentRail,
    deterministicSeed: true,
  };
}
