// PROG11 · Phase Journey + Approval Gate Canvas — pure deterministic view-model.
//
// This module exposes a read-only projection of where a program sits across the
// canonical 6-phase AbarVa program journey, plus the current gate's
// readiness, requirements, missing inputs, and Steward implication.
//
// Intentional honesty:
//   - No live program-state ingestion.
//   - No phase transitions, gate signoffs, approvals, or DB writes are performed.
//   - The `caveat` and `currentGate.approvalCaveat` make this explicit on every output.

export type PhaseStatus = 'not-started' | 'in-progress' | 'gate-pending' | 'complete';
export type GateStatus = 'open' | 'pending' | 'closed' | 'blocked';
export type GateOwner = 'nexus' | 'sentinel' | 'atlas' | 'steward';

export interface PhaseSlot {
  phaseId: string;
  phaseLabel: string;
  order: number;
  status: PhaseStatus;
  shortSummary: string;
}

export interface GateRequirement {
  requirementId: string;
  label: string;
  satisfied: boolean;
  detail: string;
}

export interface PhaseGateCanvasViewModel {
  programLabel: string;
  currentPhaseId: string;
  phases: PhaseSlot[];
  currentGate: {
    gateId: string;
    label: string;
    status: GateStatus;
    owner: GateOwner;
    requirements: GateRequirement[];
    missingInputs: string[];
    stewardImplication: string;
    approvalCaveat: string;
    nextAction: string;
  };
  caveat: string;
  generatedAt: string;
}

export interface PhaseGateCanvasInput {
  programLabel?: string;
  currentPhaseId?: string;
}

interface CanonicalPhase {
  phaseId: string;
  phaseLabel: string;
  order: number;
  shortSummary: string;
}

const CANONICAL_PHASES: readonly CanonicalPhase[] = [
  {
    phaseId: 'discovery',
    phaseLabel: 'Discovery',
    order: 1,
    shortSummary: 'Frame the problem space, stakeholders, and current-state evidence.',
  },
  {
    phaseId: 'synthesis',
    phaseLabel: 'Synthesis',
    order: 2,
    shortSummary: 'Consolidate findings into a value hypothesis with evidence trace.',
  },
  {
    phaseId: 'design',
    phaseLabel: 'Design',
    order: 3,
    shortSummary: 'Shape the target solution, architecture, and adoption arc.',
  },
  {
    phaseId: 'build',
    phaseLabel: 'Execution Roadmap',
    order: 4,
    shortSummary: 'Define workstreams, estimates, timeline, milestones, dependencies, RACI, risks, and execution success criteria.',
  },
  {
    phaseId: 'activate',
    phaseLabel: 'Approval & Mobilization',
    order: 5,
    shortSummary: 'Package business case, funding, stakeholder alignment, readiness, and change plan for approval.',
  },
  {
    phaseId: 'operate',
    phaseLabel: 'Tower Handoff',
    order: 6,
    shortSummary: 'Set Tower monitoring metrics, data owners, cadence, escalation thresholds, and benefits tracking.',
  },
] as const;

function phaseStatusFor(currentPhaseId: string, phase: CanonicalPhase): PhaseStatus {
  const currentOrder = CANONICAL_PHASES.find((p) => p.phaseId === currentPhaseId)?.order ?? 1;
  if (phase.order < currentOrder) return 'complete';
  if (phase.order === currentOrder) return 'in-progress';
  return 'not-started';
}

export function buildPhaseGateCanvasView(
  input?: PhaseGateCanvasInput,
): PhaseGateCanvasViewModel {
  const programLabel = input?.programLabel ?? 'Apex Retail · CDP Activation';
  const currentPhaseId = input?.currentPhaseId ?? 'synthesis';

  const phases: PhaseSlot[] = CANONICAL_PHASES.map((p) => ({
    phaseId: p.phaseId,
    phaseLabel: p.phaseLabel,
    order: p.order,
    status: phaseStatusFor(currentPhaseId, p),
    shortSummary: p.shortSummary,
  }));

  const currentGate: PhaseGateCanvasViewModel['currentGate'] = {
    gateId: 'g-synthesis-design',
    label: 'Synthesis → Design gate',
    status: 'pending',
    owner: 'steward',
    requirements: [
      {
        requirementId: 'req-discovery-consolidated',
        label: 'Discovery findings consolidated',
        satisfied: true,
        detail: 'Discovery report v1.2 published',
      },
      {
        requirementId: 'req-synthesis-workshop',
        label: 'Synthesis workshop completed',
        satisfied: false,
        detail:
          'Workshop 5 held on 2026-04-18 (Value Hypothesis Validation). Three decisions reached; gate narrative captured. Value baseline and platform owner confirmation still pending.',
      },
      {
        requirementId: 'req-value-hypothesis-trace',
        label: 'Value hypothesis evidence trace',
        satisfied: false,
        detail: 'Evidence trace for primary value claim incomplete',
      },
      {
        requirementId: 'req-sponsor-brief',
        label: 'Executive sponsor brief acknowledged',
        satisfied: true,
        detail: 'Atlas brief acknowledged on 2026-04-22',
      },
    ],
    missingInputs: [
      'Synthesis workshop completion',
      'Value hypothesis evidence trace',
    ],
    stewardImplication:
      'Gate cannot advance until synthesis workshop is held and value hypothesis evidence is complete. Steward should request workshop scheduling and follow up on evidence trace.',
    approvalCaveat:
      'This canvas reflects deterministic seed state. Gate transitions are not wired in this view; the gate state machine is informational only. No actual approval is performed here.',
    nextAction: 'Schedule synthesis workshop',
  };

  return {
    programLabel,
    currentPhaseId,
    phases,
    currentGate,
    caveat:
      'Phase gate canvas is read-only and deterministic. No actual phase transitions, approvals, or persistence are performed.',
    generatedAt: '2026-04-26',
  };
}
