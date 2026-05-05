// User-facing phase labels for the move surface.
//
// Doctrine: docs/design/strategic-moves/PHASE_MODEL_V2_DOCTRINE.md
//
// AbarVa Strategic Moves runs across six phases (P0–P5). Tower owns
// downstream execution tracking, so Build / Execute / Verify are not
// Strategic Move phases.
//
// - Keep internal DB/state as integer phases (0..5).
// - Centralize every user-visible phase label here.
export const PHASE_LABELS: Record<number, string> = {
  0: 'P0 Originate',
  1: 'P1 Charter',
  2: 'P2 Discover & Diagnose',
  3: 'P3 Design Future State',
  4: 'P4 Roadmap & Business Case',
  5: 'P5 Mobilize & Handoff',
};

// Short labels used on the Phase Rail dot row and other space-tight
// surfaces. Source of truth for the rail short labels.
export const PHASE_LABELS_SHORT: Record<number, string> = {
  0: 'Originate',
  1: 'Charter',
  2: 'Diagnose',
  3: 'Design',
  4: 'Roadmap',
  5: 'Mobilize',
};

// P0..P5 codes, in order. Use this to derive rail dot codes rather
// than hard-coding ['P0', ..., 'P5'] in components.
export const PHASE_CODES: readonly string[] = ['P0', 'P1', 'P2', 'P3', 'P4', 'P5'];

// The Strategic Moves rail has six phases. After P5 the surface shows
// a "→ Tower" indicator (different surface, not a phase).
export const TOTAL_PHASES = 6;

export function getPhaseLabel(phase: number | null | undefined): string {
  if (phase === null || phase === undefined) return 'P0 Originate';
  return PHASE_LABELS[phase] ?? `P${phase}`;
}

export function getPhaseLabelShort(phase: number | null | undefined): string {
  if (phase === null || phase === undefined) return 'Originate';
  return PHASE_LABELS_SHORT[phase] ?? `P${phase}`;
}
