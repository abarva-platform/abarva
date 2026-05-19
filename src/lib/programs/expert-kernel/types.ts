// Moves Expert Kernel — shared types.
//
// The Expert Kernel is a set of deterministic, pure expert modules the Moves
// agent orchestrates to turn a structured Move into a costed, CFO-readable
// business case. Every module is a pure function: no model calls, no network,
// no DB, no clock, no randomness. Same input → same output.
//
// Honesty rules are encoded in the types themselves:
//  - Baseline data that is not seeded is `not_recorded`, never a fabricated
//    number.
//  - Value is always a range with named, owned assumptions.
//  - The value forecast always passes through a haircut model — never raw
//    optimism.

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

/** Confidence rung for any kernel datum. */
export type Confidence = 'high' | 'medium' | 'low';

/** Quality of the source a datum was drawn from. */
export type SourceQuality =
  | 'measured' // instrumented system of record
  | 'derived' // computed from measured inputs
  | 'stated' // asserted by a named owner, not yet instrumented
  | 'benchmark' // external industry reference
  | 'absent'; // not recorded — a seed gap

/** A low / point / high range. The kernel never emits bare point numbers. */
export interface Range {
  low: number;
  point: number;
  high: number;
}

/** Build a range from low/high, deriving the point as the midpoint. */
export function rangeOf(low: number, high: number): Range {
  return { low, point: Math.round(((low + high) / 2) * 100) / 100, high };
}

/** Add two ranges component-wise. */
export function addRanges(a: Range, b: Range): Range {
  return {
    low: round2(a.low + b.low),
    point: round2(a.point + b.point),
    high: round2(a.high + b.high),
  };
}

/** Sum a list of ranges. */
export function sumRanges(ranges: Range[]): Range {
  return ranges.reduce(addRanges, { low: 0, point: 0, high: 0 });
}

/** Scale a range by a scalar factor. */
export function scaleRange(r: Range, factor: number): Range {
  return {
    low: round2(r.low * factor),
    point: round2(r.point * factor),
    high: round2(r.high * factor),
  };
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
