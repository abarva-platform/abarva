// Moves — deterministic phase workflow (the "Stripe get-started" task model).
// Turns REAL move state (evidence needs + gate criteria) into an ordered task
// checklist with honest statuses. Pure + structurally typed so it stays
// decoupled from the app types and is unit-testable. NO model, NO fabrication:
// every status is derived from a real signal the caller supplies.

/** Structural subset of a real evidence-need packet (see MoveEvidenceNeedPacket). */
export interface PhaseEvidenceSignal {
  priority: 'required' | 'recommended' | 'optional';
  status: 'missing' | 'partial' | 'covered' | 'waived' | 'not_applicable';
}

/** Structural subset of a real gate criterion (see StrategicMove.gateCriteria). */
export interface PhaseGateSignal {
  completed: boolean;
  severity: 'hard' | 'soft';
}

export type PhaseTaskStatus = 'done' | 'active' | 'todo' | 'locked';

export interface PhaseTask {
  id: 'evidence' | 'gate' | 'advance';
  title: string;
  detail: string;
  status: PhaseTaskStatus;
  /** e.g. "3 of 5 in" — always a real count, never invented. */
  progressLabel: string;
  /** The single action for this task. */
  actionLabel: string;
}

export interface PhaseWorkflowInput {
  phaseLabel: string;
  nextPhaseLabel: string | null;
  evidence: PhaseEvidenceSignal[];
  gate: PhaseGateSignal[];
}

export interface PhaseWorkflow {
  tasks: PhaseTask[];
  /** Count of done tasks over the two prerequisite tasks (evidence + gate). */
  doneCount: number;
  totalCount: number;
  /** True only when both prerequisites are satisfied. */
  canAdvance: boolean;
}

const SATISFIED_EVIDENCE = new Set(['covered', 'waived', 'not_applicable']);

export function buildPhaseWorkflow(input: PhaseWorkflowInput): PhaseWorkflow {
  const { evidence, gate, phaseLabel, nextPhaseLabel } = input;

  // ── Task 1: evidence ──────────────────────────────────────────────
  const required = evidence.filter((e) => e.priority === 'required');
  // If nothing is marked required, fall back to the whole set so the task
  // still reflects real coverage rather than claiming "done" vacuously.
  const scope = required.length > 0 ? required : evidence;
  const satisfied = scope.filter((e) => SATISFIED_EVIDENCE.has(e.status)).length;
  const evidenceDone = scope.length > 0 ? satisfied === scope.length : true;

  // ── Task 2: gate ──────────────────────────────────────────────────
  const hard = gate.filter((g) => g.severity === 'hard');
  const gateScope = hard.length > 0 ? hard : gate;
  const gateMet = gateScope.filter((g) => g.completed).length;
  const gateDone = gateScope.length > 0 ? gateMet === gateScope.length : false;

  const canAdvance = evidenceDone && gateDone;
  const doneCount = (evidenceDone ? 1 : 0) + (gateDone ? 1 : 0);

  // Sequence statuses: the first unfinished prerequisite is "active", later
  // ones "todo"; advance is "locked" until both are done.
  const evidenceStatus: PhaseTaskStatus = evidenceDone ? 'done' : 'active';
  const gateStatus: PhaseTaskStatus = gateDone
    ? 'done'
    : evidenceDone
      ? 'active'
      : 'todo';
  const advanceStatus: PhaseTaskStatus = canAdvance ? 'active' : 'locked';

  const advanceTitle = nextPhaseLabel
    ? `Attest and advance to ${nextPhaseLabel}`
    : 'Attest and hand off to Tower';

  const tasks: PhaseTask[] = [
    {
      id: 'evidence',
      title: 'Provide the evidence this phase needs',
      detail: 'Upload the documents AbarVa asked for. It maps each one to your solution lanes.',
      status: evidenceStatus,
      progressLabel:
        scope.length > 0 ? `${satisfied} of ${scope.length} in` : 'Nothing required',
      actionLabel: 'Add evidence',
    },
    {
      id: 'gate',
      title: 'Meet the gate criteria',
      detail: `Confirm the checks that let ${phaseLabel} advance. AbarVa evaluates each against real state.`,
      status: gateStatus,
      progressLabel:
        gateScope.length > 0 ? `${gateMet} of ${gateScope.length} met` : 'No gate yet',
      actionLabel: 'Review gate',
    },
    {
      id: 'advance',
      title: advanceTitle,
      detail: 'A gate is a set of human attestations — you approve, AbarVa records it.',
      status: advanceStatus,
      progressLabel: canAdvance ? 'Ready' : 'Complete the steps above',
      actionLabel: canAdvance ? 'Advance the phase' : 'Locked',
    },
  ];

  return { tasks, doneCount, totalCount: 2, canAdvance };
}
