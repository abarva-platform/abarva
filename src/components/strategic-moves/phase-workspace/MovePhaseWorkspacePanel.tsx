// Moves phase workspace — the live mount panel (increment 3).
// Presentational: maps the app's numeric phase (0-5) to the governed phase-
// template catalog and renders the catalog-driven guidance cards. Everything
// here comes from real catalog data keyed on the phase — no fabricated numbers,
// no fixture. Data-hungry cards (assessment/options/workstreams) wire in as
// their real sources come online (Pattern Assembly = later increment).

import * as React from 'react';
import { templatesForPhase } from '../../../lib/programs/phase-templates/catalog';
import type { MovePhaseCode } from '../../../lib/programs/phase-templates/types';
import { PhaseCompletionGuideCard, PhaseTemplatesAndSessionsCard } from './cards';
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
}: {
  phaseNum: number;
  /** The app's own phase label (e.g. "P2 · Discover"), kept authoritative. */
  phaseLabel: string;
}): React.ReactElement | null {
  const code = PHASE_NUM_TO_CODE[phaseNum];
  if (!code) return null; // Originate/Charter (0/1) have no session catalog yet.
  const templates = templatesForPhase(code);
  if (templates.length === 0) return null;

  return (
    <div className="pw" data-testid="move-phase-workspace-v2">
      <PhaseWorkspaceStyles />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '4px 0 8px' }}>
        <PhaseCompletionGuideCard phaseLabel={phaseLabel} templates={templates} steps={PHASE_STEPS} />
        <PhaseTemplatesAndSessionsCard templates={templates} />
      </div>
    </div>
  );
}
