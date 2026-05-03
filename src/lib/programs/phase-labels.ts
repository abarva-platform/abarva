// User-facing phase labels for the move surface.
//
// Doctrine:
// - Keep internal DB/state as integer phases.
// - Centralize every user-visible phase label here.
export const PHASE_LABELS: Record<number, string> = {
  0: 'P0 Originate',
  1: 'P1 Charter',
  2: 'P2 Diagnose',
  3: 'P3 Solution Design',
  4: 'P4 Build',
  5: 'P5 Execute',
  6: 'P6 Verify',
  7: 'P7 Handoff',
};

export function getPhaseLabel(phase: number | null | undefined): string {
  if (phase === null || phase === undefined) return 'P0 Originate';
  return PHASE_LABELS[phase] ?? `P${phase}`;
}
