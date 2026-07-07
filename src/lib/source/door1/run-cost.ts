// Door 1 — the incumbent run-cost anchor.
//
// The play measures the recoverable gap AGAINST the incumbent's annual run cost so
// the "large vs modest" threshold is spend-relative, not an absolute dollar figure.
// `annual_run_cost` is a per-tower fact in the catalog; a Door-1 fact map may carry
// it as a single event-level rollup (a bare number / Door1FactValue) — this reads
// whichever form is present and returns 0 when no run-cost anchor exists (the play
// then falls back to evidence strength).

import type { Door1FactMap, Door1FactValue } from './types';

const RUN_COST_KEY = 'annual_run_cost';

/** Resolve the incumbent annual run-cost anchor from a fact map (0 when absent). */
export function resolveAnnualRunCost(factMap: Door1FactMap): number {
  const raw = factMap[RUN_COST_KEY];
  if (raw === undefined || raw === null) return 0;
  const value = typeof raw === 'number' ? raw : (raw as Door1FactValue).value;
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : 0;
}
