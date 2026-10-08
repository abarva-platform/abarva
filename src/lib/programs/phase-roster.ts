// An ORDERED roster of the Strategic Moves phases, derived from the
// canonical phase model in `phase-labels.ts`.
//
// Why this module exists: `PHASE_LABELS` and `PHASE_LABELS_SHORT` are
// keyed Records, so a surface that wants to `.map` over the phases — a
// rail, a phase-indicator grid, a filter dropdown — cannot consume them
// directly. Several surfaces solved that by declaring their own literal
// array, and every one of those arrays had drifted to a five-entry
// Build/Execute/Verify vocabulary that the doctrine explicitly retired:
// phases P1..P4 were mislabelled and P5 fell off the end entirely.
//
// Derive from `TOTAL_PHASES` and the canonical getters so the roster
// cannot drift from the source of truth again. Prefer this over a local
// literal whenever a surface iterates the phases.
import {
  PHASE_CODES,
  TOTAL_PHASES,
  getPhaseLabel,
  getPhaseLabelShort,
} from './phase-labels';

export interface PhaseRosterEntry {
  /** Integer phase as stored in the DB (0..5). */
  phase: number;
  /** 'P0'..'P5'. */
  code: string;
  /** Full user-facing label, e.g. 'P2 Discover & Diagnose'. */
  label: string;
  /** Space-tight label, e.g. 'Diagnose'. */
  shortLabel: string;
}

export const PHASE_ROSTER: readonly PhaseRosterEntry[] = Array.from(
  { length: TOTAL_PHASES },
  (_, phase): PhaseRosterEntry => ({
    phase,
    code: PHASE_CODES[phase] ?? `P${phase}`,
    label: getPhaseLabel(phase),
    shortLabel: getPhaseLabelShort(phase),
  }),
);

/**
 * The space-tight phase name, upper-cased for monospace chips.
 *
 * Returns a `P{n}` stand-in rather than an empty string for a phase
 * outside the canonical range, so a chip never renders a dangling
 * separator with nothing after it.
 */
export function getPhaseChipLabel(phase: number | null | undefined): string {
  if (phase === null || phase === undefined) return getPhaseLabelShort(0).toUpperCase();
  const entry = PHASE_ROSTER[phase];
  return (entry ? entry.shortLabel : `P${phase}`).toUpperCase();
}

/**
 * The phase name for prose and for model prompts — never `undefined`,
 * which is what a literal five-entry array yields at P5.
 */
export function getPhaseRosterName(phase: number | null | undefined): string {
  if (phase === null || phase === undefined) return getPhaseLabelShort(0);
  return PHASE_ROSTER[phase]?.shortLabel ?? `Phase ${phase}`;
}
