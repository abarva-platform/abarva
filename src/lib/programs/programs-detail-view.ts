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

// ─── Workbench content by phase state ────────────────────────────────────────

function buildWorkbenchContent(
  programName: string,
  currentPhase: ProgramPhaseId,
  viewingPhase: ProgramPhaseId,
  viewingPhaseLabel: string,
  viewingPhaseState: ProgramPhaseSlot['state'],
): ProgramWorkbenchContent {
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
): ProgramPhasePanel {
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
    linkedSourceEvent: program.nexusNote,
    workbench: buildWorkbenchContent(
      program.name,
      clampedCurrent,
      viewingPhase,
      viewingPhaseLabel,
      viewingPhaseState,
    ),
    agentRail: buildAgentRail(clampedCurrent, viewingPhase),
    phasePanel: buildPhasePanel(
      viewingPhase,
      viewingPhaseLabel,
      viewingPhaseState,
      clampedCurrent,
    ),
    deterministicSeed: true,
  };
}
