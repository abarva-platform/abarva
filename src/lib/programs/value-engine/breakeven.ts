/**
 * Moves value engine — breakeven per lever driver.
 *
 * For one lever, holding every other input where it is: the driver delta d*
 * at which the case's steady-state counted annual cash × horizon years
 * equals the cost (base scenario). The basis is stated on every result so a
 * reader never mistakes it for a timed, discounted breakeven.
 *
 * - Closed form when the lever is a pure product of its terms and shares no
 *   overlap group: annual cash = others + k·d, so d* = (cost / H − others) / k.
 * - Bisection over the driver's bounds otherwise (an overlap member: which
 *   lever counts depends on d, but the counted total is non-decreasing in d).
 *
 * Outcomes: `solved`; `met_without_lever` (the case already covers its cost
 * at the lower bound); `never_within_bounds` (not even the upper bound
 * covers it); `not_applicable` (the lever's driver does not move cash — a
 * risk lever outside cash, a non-cash lever, a lever with no driver term).
 *
 * Pure, no I/O.
 */
import { overlapExclusions, runScenario, type ReadyCase } from "./case-model";
import { productOfTerms } from "./formula-terms";
import { pick, type PreparedLever } from "./lever-eval";
import { sharesOverlapGroup } from "./overlap";
import type { LeverBreakeven } from "./types";

/** Bisection stops after this many halvings at most. */
export const BISECTION_MAX_ITERATIONS = 200;
/** …or once the bracket is narrower than this fraction of the upper bound (min 1). */
export const BISECTION_RELATIVE_TOLERANCE = 1e-12;

function result(
  prepared: PreparedLever,
  fields: Pick<
    LeverBreakeven,
    "status" | "method" | "breakevenDelta" | "bounds"
  >,
): LeverBreakeven {
  const delta = fields.breakevenDelta;
  const baseline = prepared.baseline.base;
  return {
    leverId: prepared.lever.id,
    ...fields,
    breakevenTarget:
      delta === null
        ? null
        : prepared.lever.driver.direction === "decrease"
          ? baseline - delta
          : baseline + delta,
    basis: "steady_state_annual_x_horizon",
  };
}

export function leverBreakeven(
  ready: ReadyCase,
  prepared: PreparedLever,
  overrides: ReadonlyMap<string, number>,
): LeverBreakeven {
  const hasDriverTerm = prepared.terms.some(
    (term) => term.role === "driver_delta",
  );
  if (!prepared.inCash || !hasDriverTerm || prepared.release?.counted) {
    return result(prepared, {
      status: "not_applicable",
      method: null,
      breakevenDelta: null,
      bounds: null,
    });
  }
  const bounds = prepared.bounds;
  const costCents = pick(ready.cost, "base", overrides);
  const H = ready.horizonYears;
  const deltaKey = prepared.delta.key;

  const annualCashAt = (d: number): number => {
    const o = new Map(overrides);
    o.set(deltaKey, d);
    return runScenario(ready, "base", o, overlapExclusions(ready, o)).annualCash
      .figure;
  };
  const covers = (d: number) => annualCashAt(d) * H >= costCents;

  const inOverlap = sharesOverlapGroup(
    prepared.lever.id,
    prepared.lever.overlapGroup,
    ready.levers.map((p) => p.lever),
  );

  if (!inOverlap) {
    const run = runScenario(
      ready,
      "base",
      overrides,
      overlapExclusions(ready, overrides),
    );
    const own = run.levers.find((lever) => lever.prepared === prepared);
    const k = productOfTerms(
      (own?.inputs ?? []).filter((term) => term.cellRole !== "driver_delta"),
    );
    const others = run.annualCash.figure - (own?.cents ?? 0);
    if ((others + k * bounds.min) * H >= costCents) {
      return result(prepared, {
        status: "met_without_lever",
        method: "closed_form",
        breakevenDelta: bounds.min,
        bounds,
      });
    }
    const dStar = k > 0 ? (costCents / H - others) / k : Infinity;
    if (dStar > bounds.max) {
      return result(prepared, {
        status: "never_within_bounds",
        method: "closed_form",
        breakevenDelta: null,
        bounds,
      });
    }
    return result(prepared, {
      status: "solved",
      method: "closed_form",
      breakevenDelta: dStar,
      bounds,
    });
  }

  if (covers(bounds.min)) {
    return result(prepared, {
      status: "met_without_lever",
      method: "bisection",
      breakevenDelta: bounds.min,
      bounds,
    });
  }
  if (!covers(bounds.max)) {
    return result(prepared, {
      status: "never_within_bounds",
      method: "bisection",
      breakevenDelta: null,
      bounds,
    });
  }
  let lo = bounds.min;
  let hi = bounds.max;
  const tolerance = BISECTION_RELATIVE_TOLERANCE * Math.max(1, bounds.max);
  for (let i = 0; i < BISECTION_MAX_ITERATIONS && hi - lo > tolerance; i += 1) {
    const mid = (lo + hi) / 2;
    if (covers(mid)) hi = mid;
    else lo = mid;
  }
  return result(prepared, {
    status: "solved",
    method: "bisection",
    breakevenDelta: hi,
    bounds,
  });
}

export function caseBreakeven(
  ready: ReadyCase,
  overrides: ReadonlyMap<string, number>,
): LeverBreakeven[] {
  return ready.levers.map((prepared) =>
    leverBreakeven(ready, prepared, overrides),
  );
}
