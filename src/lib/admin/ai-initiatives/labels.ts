// Pure-runtime labels + helpers for AI initiatives.
//
// This file is intentionally free of `import 'server-only'` so client
// components (e.g. Intelligence v3 stage canvases) can import the
// labels and the formatter without dragging in the Supabase server
// client. Server components import the same constants via the
// re-exports in queries.ts.

export type Stage =
  | 'pilot'
  | 'scaled'
  | 'sunset'
  | 'multi_year_strategic_bet'
  | 'in_strategic_move';

export type StatusFlag =
  | 'healthy'
  | 'adoption_gap'
  | 'value_lag'
  | 'cost_overrun'
  | 'duplication_risk'
  | 'stalled'
  | 'foundation_phase'
  | 'in_move';

export type ConfidenceLevel = 'HIGH' | 'MED' | 'LOW';

export const STAGE_LABELS: Record<Stage, string> = {
  pilot: 'Pilot',
  scaled: 'Scaled',
  sunset: 'Sunset',
  multi_year_strategic_bet: 'Multi-year strategic bet',
  in_strategic_move: 'In Strategic Move',
};

export const STATUS_LABELS: Record<StatusFlag, string> = {
  healthy: 'Healthy',
  adoption_gap: 'Adoption gap',
  value_lag: 'Value lag',
  cost_overrun: 'Cost overrun',
  duplication_risk: 'Duplication risk',
  stalled: 'Stalled',
  foundation_phase: 'Foundation phase',
  in_move: 'In Move',
};

export function formatUsd(value: number | null): string {
  if (value === null) return '—';
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}
