// Moves phase workspace — the live mount panel (increments 3-4).
// Presentational: maps the app's numeric phase (0-5) to the governed phase-
// template catalog and renders (1) a Stripe-style task checklist built from REAL
// move state and (2) the catalog-driven guidance cards. Everything here comes
// from real data keyed on the phase — no fabricated numbers, no fixture.

import * as React from 'react';
import { templatesForPhase } from '../../../lib/programs/phase-templates/catalog';
import type { MovePhaseCode } from '../../../lib/programs/phase-templates/types';
import {
  buildPhaseWorkflow,
  type PhaseEvidenceSignal,
  type PhaseGateSignal,
  type PhaseTask,
} from '../../../lib/programs/phase-templates/phase-workflow';
import { PhaseCompletionGuideCard, PhaseTemplatesAndSessionsCard } from './cards';
import { PhaseTaskChecklist } from './PhaseTaskChecklist';
import { PhaseWorkspaceStyles } from './styles';

/** App numeric phase → governed catalog phase code. Only P2-P5 have templates. */
const PHASE_NUM_TO_CODE: Record<number, MovePhaseCode> = {
  2: 'P2',
  3: 'P3',
  4: 'P4',
  5: 'P5',
};

const PHASE_STEPS = [
  'Run the recommended sessions for this phase with the right people.',
  'Upload each completed session document — AbarVa maps what it finds to your solution lanes.',
  'Confirm the open questions AbarVa surfaces, then attest at the gate to advance.',
];

export function MovePhaseWorkspacePanel({
  phaseNum,
  phaseLabel,
  nextPhaseLabel = null,
  evidence = [],
  gate = [],
  onTaskAction,
}: {
  phaseNum: number;
  /** The app's own phase label (e.g. "P2 · Discover"), kept authoritative. */
  phaseLabel: string;
  /** The app's label for the next phase, for the advance task. */
  nextPhaseLabel?: string | null;
  /** REAL evidence-need signals (structural subset of MoveEvidenceNeedPacket). */
  evidence?: PhaseEvidenceSignal[];
  /** REAL gate criteria (structural subset of move.gateCriteria). */
  gate?: PhaseGateSignal[];
  /**
   * Wire a checklist task's action to the host. The checklist NEVER commits —
   * this only navigates the user to the host's own controls (single write path).
   */
  onTaskAction?: (taskId: PhaseTask['id']) => void;
}): React.ReactElement | null {
  const code = PHASE_NUM_TO_CODE[phaseNum];
  if (!code) return null; // Originate/Charter (0/1) have no session catalog yet.
  const templates = templatesForPhase(code);
  if (templates.length === 0) return null;

  const hasWorkflowSignal = evidence.length > 0 || gate.length > 0;
  const workflow = hasWorkflowSignal
    ? buildPhaseWorkflow({ phaseLabel, nextPhaseLabel, evidence, gate })
    : null;

  return (
    <div className="pw" id="move-phase-workspace-v2" data-testid="move-phase-workspace-v2">
      <PhaseWorkspaceStyles />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '4px 0 8px' }}>
        {workflow ? (
          <PhaseTaskChecklist phaseLabel={phaseLabel} workflow={workflow} onAction={onTaskAction} />
        ) : null}
        <PhaseCompletionGuideCard phaseLabel={phaseLabel} templates={templates} steps={PHASE_STEPS} />
        <PhaseTemplatesAndSessionsCard templates={templates} />
      </div>
    </div>
  );
}
