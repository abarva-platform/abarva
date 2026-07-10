// Phase Explorer tallies — per-phase gate-criteria counts for the Moves
// left-side phase explorer (Source's CanvasGateSidebar pattern, ported to
// Moves' P0..P5 journey).
//
// Deterministic, no fabrication: totals come from the SAME canonical rule
// catalog (`gateCriteriaForPhase`) that the gate-approval flow evaluates
// against, so this can never drift from what actually gates advancement.
// A phase already passed is credited met === total (it could not have
// advanced otherwise); the live current phase uses the move's real,
// evaluated `gateCriteria`; a phase not yet reached shows 0 of its total.

import { gateCriteriaForPhase } from "./governance";
import { PHASE_LABELS_SHORT, TOTAL_PHASES } from "./phase-labels";
import type { StrategicMove } from "./types.ui";

export interface PhaseTallyRow {
  phase: number;
  label: string;
  met: number;
  total: number;
  state: "done" | "current" | "upcoming";
}

export function getMovePhaseTallies(
  move: Pick<StrategicMove, "currentPhase" | "gateCriteria">,
): PhaseTallyRow[] {
  const currentPhase = move.currentPhase ?? 0;
  const rows: PhaseTallyRow[] = [];

  for (let phase = 0; phase < TOTAL_PHASES; phase += 1) {
    const rule = gateCriteriaForPhase(phase);
    const total = rule?.length ?? 0;

    if (phase < currentPhase) {
      rows.push({
        phase,
        label: PHASE_LABELS_SHORT[phase] ?? `P${phase}`,
        met: total,
        total,
        state: "done",
      });
    } else if (phase === currentPhase) {
      const liveTotal = move.gateCriteria.length || total;
      const liveMet = move.gateCriteria.filter((c) => c.completed).length;
      rows.push({
        phase,
        label: PHASE_LABELS_SHORT[phase] ?? `P${phase}`,
        met: liveMet,
        total: liveTotal,
        state: "current",
      });
    } else {
      rows.push({
        phase,
        label: PHASE_LABELS_SHORT[phase] ?? `P${phase}`,
        met: 0,
        total,
        state: "upcoming",
      });
    }
  }

  return rows;
}
