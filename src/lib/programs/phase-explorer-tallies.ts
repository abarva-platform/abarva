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
//
// Hard-only scope: the phase workspace's own "N of M met" gate-readiness
// tile (buildPhaseWorkflow in phase-templates/phase-workflow.ts) counts
// hard-severity criteria only, falling back to the full set when a phase
// has none — soft criteria don't block advancement. The explorer mirrors
// that exact scoping so it never shows a second, different "gate criteria"
// number next to the one already on screen for the current phase.

import { gateCriteriaForPhase, type GateRuleCriterion } from "./governance";
import { PHASE_LABELS_SHORT, TOTAL_PHASES } from "./phase-labels";
import type { StrategicMove } from "./types.ui";

export interface PhaseTallyRow {
  phase: number;
  label: string;
  met: number;
  total: number;
  state: "done" | "current" | "upcoming";
}

function hardScope<T extends { severity: "hard" | "soft" }>(criteria: T[]): T[] {
  const hard = criteria.filter((c) => c.severity === "hard");
  return hard.length > 0 ? hard : criteria;
}

export function getMovePhaseTallies(
  move: Pick<StrategicMove, "currentPhase" | "gateCriteria">,
): PhaseTallyRow[] {
  const currentPhase = move.currentPhase ?? 0;
  const rows: PhaseTallyRow[] = [];

  for (let phase = 0; phase < TOTAL_PHASES; phase += 1) {
    const rule: GateRuleCriterion[] = gateCriteriaForPhase(phase) ?? [];
    const total = hardScope(rule).length;

    if (phase < currentPhase) {
      rows.push({
        phase,
        label: PHASE_LABELS_SHORT[phase] ?? `P${phase}`,
        met: total,
        total,
        state: "done",
      });
    } else if (phase === currentPhase) {
      const scoped = hardScope(move.gateCriteria);
      const liveTotal = scoped.length || total;
      const liveMet = scoped.filter((c) => c.completed).length;
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
