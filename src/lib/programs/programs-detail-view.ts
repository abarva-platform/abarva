// programs-detail-view.ts — PROG-D
//
// Builds the ProgramDetailView for a single program from the Apex fixture.
// Deterministic: no Date.now(), no random, no model calls.
//
// Phase model: the fixture uses 0–6 (Originate through Operate).
// The ProgramJourneyRail displays phases 1–6 (Discovery through Operate).
// Phase 0 (Originate) is treated as a completed pre-condition and not shown
// in the navigator.

import {
  APEX_PROGRAMS_FIXTURE,
  PHASE_LABEL_MAP,
} from './programs-fixture';
import type {
  ProgramAgentRailItem,
  ProgramDetailView,
  ProgramPhaseId,
  ProgramPhasePanel,
  ProgramPhaseSlot,
  ProgramWorkbenchContent,
} from './programs-types';

// ─── Agent definitions ───────────────────────────────────────────────────────
// Four canonical agents; job text is scoped to the phase state.

function buildAgentRail(
  currentPhase: ProgramPhaseId,
  viewingPhase: ProgramPhaseId,
): ProgramAgentRailItem[] {
  const isActive = (targetPhase: ProgramPhaseId) => viewingPhase === targetPhase;
  const isCurrentOrPast = (targetPhase: ProgramPhaseId) =>
    targetPhase <= currentPhase;

  // Nexus — always present as orchestrator
  const nexus: ProgramAgentRailItem = {
    initials: 'Nx',
    name: 'Nexus',
    job: viewingPhase === currentPhase
      ? `Orchestrating P${viewingPhase} · ${PHASE_LABEL_MAP[viewingPhase as ProgramPhaseId]}`
      : viewingPhase < currentPhase
      ? `Completed P${viewingPhase} orchestration`
      : `Waiting for P${currentPhase} completion`,
    state: viewingPhase === currentPhase ? 'active' : 'advisory',
  };

  // Sentinel — evidence and risk monitoring
  const sentinel: ProgramAgentRailItem = {
    initials: 'Sn',
    name: 'Sentinel',
    job: isActive(currentPhase)
      ? 'Monitoring evidence + risk signals'
      : isCurrentOrPast(viewingPhase)
      ? 'Evidence archived for this phase'
      : 'Awaiting phase activation',
    state: viewingPhase === currentPhase ? 'active' : viewingPhase < currentPhase ? 'on_call' : 'idle',
  };

  // Atlas — impact and value tracking
  const atlas: ProgramAgentRailItem = {
    initials: 'At',
    name: 'Atlas',
    job: viewingPhase >= 4
      ? 'Tracking value realization metrics'
      : isCurrentOrPast(viewingPhase)
      ? 'Tracking baseline inputs'
      : 'Impact model not yet active',
    state: viewingPhase >= 4 ? 'active' : viewingPhase < currentPhase ? 'on_call' : 'idle',
  };

  // Steward — gate readiness and compliance
  const steward: ProgramAgentRailItem = {
    initials: 'St',
    name: 'Steward',
    job: viewingPhase === currentPhase
      ? `Assessing gate readiness for P${viewingPhase + 1} entry`
      : viewingPhase < currentPhase
      ? 'Gate passed — archived'
      : 'Gate criteria not yet active',
    state: viewingPhase === currentPhase ? 'on_call' : viewingPhase < currentPhase ? 'advisory' : 'idle',
  };

  return [nexus, sentinel, atlas, steward];
}

// ─── APX-SAP-2026 specific workbench (P1 Discovery · Active) ─────────────────

const APX_SAP_2026_P1_WORKBENCH: ProgramWorkbenchContent = {
  title: 'P1 Discovery · Active',
  prose:
    'Discovery phase is tracking well — 6 interviews scheduled across store operations and HR. Data access requests for the Point-of-Sale and scheduling systems are pending IT approval. The value hypothesis is strong but needs validation from field supervisors before Synthesis entry.',
  actionsLabel: 'Nexus recommends',
  actions: [
    {
      letter: 'A',
      text: 'Complete store ops interviews',
      detail: 'Weeks of Mar 18–29 · 4 interviews confirmed',
    },
    {
      letter: 'B',
      text: 'Resolve IT data access requests',
      detail: 'POS + scheduling systems · IT ticket ITS-2291',
    },
    {
      letter: 'C',
      text: 'Draft value hypothesis',
      detail: 'Needs field supervisor input before Synthesis gate',
    },
  ],
};

// ─── APX-CC-2026 specific workbench (P4 Build · Active — 68% Complete) ───────

const APX_CC_2026_P4_WORKBENCH: ProgramWorkbenchContent = {
  title: 'P4 Build · Active — 68% Complete',
  prose:
    'Build is on track. The NLP intent classifier is deployed to staging with 94% accuracy. CRM integration is passing all smoke tests. The remaining 32% covers IVR routing rules and the operator dashboard. Activate gate target is May 15.',
  actionsLabel: 'Nexus recommends',
  actions: [
    {
      letter: 'A',
      text: 'Complete IVR routing rules',
      detail: 'Remaining build artifact — 2 sprints remaining',
    },
    {
      letter: 'B',
      text: 'Ship operator dashboard MVP',
      detail: 'Required for Activate gate — UX review Apr 30',
    },
    {
      letter: 'C',
      text: 'Schedule Activate gate review',
      detail: 'Sponsor + IT sign-off · target May 15',
    },
  ],
};

// ─── APX-CDP-2026 specific workbench (demo flagship) ─────────────────────────
// P2 Synthesis · Design gate pending · Workshop 5 incomplete · 36% evidence
// Linked source: AMS Vendor Consolidation 2026 · Stage 7 BAFO

const APX_CDP_2026_P2_WORKBENCH: ProgramWorkbenchContent = {
  title: 'P2 Synthesis · Design Gate Pending',
  prose:
    'Workshop 5 is incomplete — value hypothesis evidence is missing and privacy boundary confirmation has not been logged. Evidence coverage sits at 36%. The Design gate (P2 → P3) is held by Steward pending these three items. Linked source event AMS Vendor Consolidation 2026 is at Stage 7 BAFO — vendor data architecture decisions here will affect CDP scope.',
  actionsLabel: 'Nexus recommends',
  actions: [
    {
      letter: 'A',
      text: 'Complete Workshop 5',
      detail: 'Log value hypothesis evidence · confirm privacy boundary',
    },
    {
      letter: 'B',
      text: 'Review AMS Vendor BAFO',
      detail: 'Stage 7 decisions constrain CDP data layer — align now',
    },
    {
      letter: 'C',
      text: 'Request Design gate review',
      detail: 'Notify Steward once Workshop 5 items are resolved',
    },
  ],
};

// ─── Workbench content by phase state ────────────────────────────────────────

function buildWorkbenchContent(
  programName: string,
  currentPhase: ProgramPhaseId,
  viewingPhase: ProgramPhaseId,
  viewingPhaseLabel: string,
  viewingPhaseState: ProgramPhaseSlot['state'],
  programId?: string,
): ProgramWorkbenchContent {
  // Demo program overrides — specific phase workbench content
  if (programId === 'apx-sap-2026' && viewingPhase === 1 && viewingPhaseState === 'current') {
    return APX_SAP_2026_P1_WORKBENCH;
  }
  if (programId === 'apx-cc-2026' && viewingPhase === 4 && viewingPhaseState === 'current') {
    return APX_CC_2026_P4_WORKBENCH;
  }
  // Demo flagship override — P2 Synthesis active view
  if (programId === 'apx-cdp-2026' && viewingPhase === 2 && viewingPhaseState === 'current') {
    return APX_CDP_2026_P2_WORKBENCH;
  }
  switch (viewingPhaseState) {
    case 'done':
      return {
        title: `P${viewingPhase} ${viewingPhaseLabel} · Complete`,
        prose: `This phase was successfully completed. All required deliverables were produced and the phase gate was cleared. You're reviewing archived outputs from P${viewingPhase} — ${viewingPhaseLabel}.`,
        actionsLabel: 'Review actions',
        actions: [
          { letter: 'A', text: 'View deliverables', detail: 'Browse artifacts produced in this phase' },
          { letter: 'B', text: 'Review gate record', detail: 'Approval chain and gate criteria met' },
          { letter: 'C', text: 'Open evidence log', detail: 'Supporting evidence captured here' },
        ],
      };
    case 'current':
      return {
        title: `P${viewingPhase} ${viewingPhaseLabel} · Active`,
        prose: `You're in P${viewingPhase} — ${viewingPhaseLabel}. Nexus is orchestrating active workstreams. Review next actions below and clear open blockers to advance toward the gate.`,
        actionsLabel: 'Next actions',
        actions: [
          { letter: 'A', text: 'Open workshop', detail: 'Resume active modules for this phase' },
          { letter: 'B', text: 'Review gate criteria', detail: 'Check what\'s needed to advance' },
          { letter: 'C', text: 'Brief sponsor', detail: 'Share current status and blockers' },
        ],
      };
    case 'pending': {
      const prevPhase = (viewingPhase - 1) as ProgramPhaseId;
      const prevLabel = PHASE_LABEL_MAP[prevPhase] ?? '';
      return {
        title: `P${viewingPhase} ${viewingPhaseLabel} · Pending gate`,
        prose: `P${viewingPhase} entry requires clearing the P${prevPhase} ${prevLabel} gate. Review the gate criteria and resolve any outstanding items to unlock this phase.`,
        actionsLabel: 'Gate actions',
        actions: [
          { letter: 'A', text: 'Review gate criteria', detail: `Check P${prevPhase} gate requirements` },
          { letter: 'B', text: 'Resolve blockers', detail: 'Address open items blocking gate approval' },
          { letter: 'C', text: 'Request gate review', detail: 'Notify sponsor to approve phase advance' },
        ],
      };
    }
    case 'locked':
      return {
        title: `P${viewingPhase} ${viewingPhaseLabel} · Locked`,
        prose: `Complete P${currentPhase} — ${PHASE_LABEL_MAP[currentPhase]} to unlock this phase. Phases must be completed sequentially.`,
        actionsLabel: 'Unlock path',
        actions: [
          { letter: 'A', text: `Return to P${currentPhase}`, detail: `Resume active phase: ${PHASE_LABEL_MAP[currentPhase]}` },
          { letter: 'B', text: 'View prerequisites', detail: 'See what must be completed first' },
          { letter: 'C', text: 'Preview phase brief', detail: 'Read what this phase will cover' },
        ],
      };
  }
}

// ─── Phase panel by phase state ───────────────────────────────────────────────

function buildPhasePanel(
  viewingPhase: ProgramPhaseId,
  viewingPhaseLabel: string,
  viewingPhaseState: ProgramPhaseSlot['state'],
  currentPhase: ProgramPhaseId,
  programId?: string,
): ProgramPhasePanel {
  // APX-SAP-2026 P1 gate criteria
  if (programId === 'apx-sap-2026' && viewingPhase === 1 && viewingPhaseState === 'current') {
    return {
      gateCriteria: [
        { criterion: 'Discovery interviews completed (4 of 6)', met: false },
        { criterion: 'Value hypothesis drafted', met: false },
        { criterion: 'Data access confirmed for all source systems', met: false },
        { criterion: 'Stakeholder alignment documented', met: true },
        { criterion: 'Discovery brief reviewed by sponsor', met: false },
      ],
    };
  }
  // APX-CC-2026 P4 gate criteria
  if (programId === 'apx-cc-2026' && viewingPhase === 4 && viewingPhaseState === 'current') {
    return {
      gateCriteria: [
        { criterion: 'NLP intent classifier deployed to staging', met: true },
        { criterion: 'CRM integration smoke tests passing', met: true },
        { criterion: 'IVR routing rules complete', met: false },
        { criterion: 'Operator dashboard MVP complete', met: false },
        { criterion: 'Load test passing at 2× peak traffic', met: false },
        { criterion: 'Sponsor sign-off on Activate criteria', met: false },
      ],
    };
  }
  // APX-CDP-2026 P2 gate — real blockers surfaced from demo anchor
  if (programId === 'apx-cdp-2026' && viewingPhase === 2 && viewingPhaseState === 'current') {
    return {
      gateCriteria: [
        { criterion: 'Workshop 5 completed', met: false },
        { criterion: 'Value hypothesis evidence logged', met: false },
        { criterion: 'Privacy boundary confirmed', met: false },
        { criterion: 'AMS vendor architecture alignment noted', met: true },
        { criterion: 'Sponsor sign-off on Synthesis findings', met: false },
      ],
    };
  }
  switch (viewingPhaseState) {
    case 'done':
      return {
        summary: `P${viewingPhase} ${viewingPhaseLabel} completed successfully. All deliverables were produced and reviewed.`,
        deliverables: [
          { label: `${viewingPhaseLabel} brief document`, status: 'done' },
          { label: 'Stakeholder sign-off record', status: 'done' },
          { label: 'Phase gate approval', status: 'done' },
          { label: 'Evidence artifacts submitted', status: 'done' },
        ],
      };
    case 'current':
      return {
        gateCriteria: [
          { criterion: 'All required deliverables submitted', met: false },
          { criterion: 'Sponsor sign-off obtained', met: false },
          { criterion: 'Evidence artifacts linked', met: true },
          { criterion: 'No critical risks unresolved', met: true },
          { criterion: 'Workshop modules completed', met: false },
        ],
      };
    case 'pending': {
      const prevPhase = (viewingPhase - 1) as ProgramPhaseId;
      const prevLabel = PHASE_LABEL_MAP[prevPhase] ?? '';
      return {
        blockerNote: `Awaiting P${prevPhase} ${prevLabel} gate approval before P${viewingPhase} can begin.`,
        gateCriteria: [
          { criterion: `P${prevPhase} gate formally approved`, met: false },
          { criterion: 'Phase lead assigned', met: false },
          { criterion: 'Kickoff meeting scheduled', met: false },
        ],
      };
    }
    case 'locked':
      return {
        blockerNote: `Complete P${currentPhase} — ${PHASE_LABEL_MAP[currentPhase]} to unlock P${viewingPhase}.`,
      };
  }
}

// ─── Main builder ─────────────────────────────────────────────────────────────

export function buildProgramDetailView(
  programId: string,
  requestedPhase?: number,
): ProgramDetailView {
  // Look up program by id; fall back to APX-01 for demo safety
  const program =
    APEX_PROGRAMS_FIXTURE.find((p) => p.id === programId) ??
    APEX_PROGRAMS_FIXTURE[0];

  // The fixture phases include 0 (Originate). We expose 1-6 in the navigator.
  // Filter to phases 1-6 for the rail.
  const railPhases = program.phases.filter(
    (slot): slot is ProgramPhaseSlot & { id: 1 | 2 | 3 | 4 | 5 | 6 } =>
      slot.id >= 1 && slot.id <= 6,
  );

  // Resolve viewing phase: default to currentPhase, clamped to 1-6
  const clampedCurrent = Math.max(1, Math.min(6, program.currentPhase)) as ProgramPhaseId;
  let viewingPhase: ProgramPhaseId;
  if (requestedPhase !== undefined && requestedPhase >= 1 && requestedPhase <= 6) {
    viewingPhase = requestedPhase as ProgramPhaseId;
  } else {
    viewingPhase = clampedCurrent;
  }

  const viewingSlot = railPhases.find((s) => s.id === viewingPhase) ?? railPhases[0];
  const viewingPhaseState = viewingSlot?.state ?? 'locked';
  const viewingPhaseLabel = PHASE_LABEL_MAP[viewingPhase] ?? '';

  return {
    programId: program.id,
    displayId: program.displayId,
    name: program.name,
    tenant: 'Apex Retail Group',
    currentPhase: clampedCurrent,
    viewingPhase,
    phases: railPhases,
    gateStatus: program.gateStatus,
    linkedSourceEvent: program.linkedSourceEvent ?? undefined,
    workbench: buildWorkbenchContent(
      program.name,
      clampedCurrent,
      viewingPhase,
      viewingPhaseLabel,
      viewingPhaseState,
      program.id,
    ),
    agentRail: buildAgentRail(clampedCurrent, viewingPhase),
    phasePanel: buildPhasePanel(
      viewingPhase,
      viewingPhaseLabel,
      viewingPhaseState,
      clampedCurrent,
      program.id,
    ),
    deterministicSeed: true,
  };
}
