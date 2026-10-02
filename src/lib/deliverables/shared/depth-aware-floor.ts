// Depth-aware deliverable floors.
//
// The per-artifact word/slide FLOORS in the quality bar (quality-bar-registry.ts
// → artifact-contracts.ts P3_P4_WORD_BAND_CONTRACTS, and slide-contract.ts
// SLIDE_BANDS) are a single calibrated number per type. For most types that
// number is modest and right-sized. For target_state_architecture it is large
// — 9,000 words / 10 slides — calibrated for a FULL-scope enterprise design.
//
// A fixed large floor conflates length with depth. A Move that confirmed one
// narrow use case is forced to the same volume as an eight-domain
// transformation, and the only way a generator reaches that volume on thin
// confirmed evidence is to PAD with ungrounded prose — the exact failure the
// governance model (every figure traces to governed evidence) and the
// "no demo thinking" bar exist to prevent. The floor was manufacturing the risk
// it was meant to guard against.
//
// This module scales the floor DOWN for smaller-confirmed-scope Moves. Two
// invariants keep it honest:
//
//   1. The floor is a function of confirmed scope, never a target to pad toward.
//      A genuinely large Move keeps the full calibrated floor; a small one gets
//      a smaller — but still substantial — floor. It only ever scales DOWN from
//      the calibrated base, so big transformations still clear a high bar.
//
//   2. The calibrated base stays the documented base. We do not lower the number
//      in the registry/contract; we derive a per-request floor from it. So the
//      base remains the full-scope calibration and the reconciliation tests that
//      pin it are untouched.
//
// Scope signal, in order of preference:
//   - adaptiveDepth.complexityTier — the SANCTIONED deterministic depth decision
//     (resolveAdaptiveDepth). Present on the generate-phase request path.
//   - confirmed-evidence volume — the count of governed evidence items the
//     deliverable is actually built from. Used on the orchestrated-Moves request
//     path, which does not resolve adaptiveDepth. This is the most honest
//     fallback: it ties the floor to how much grounded material exists to say.
//   - neither → the full calibrated floor (a safe no-op).

import type { ComplexityTier } from "@/lib/deliverables/adaptive-depth";

/**
 * Deliverable types whose single calibrated floor is large enough that a
 * one-size value forces padding on a small-scope Move. Only these are
 * depth-scaled; every already-modest floor is left exactly as calibrated.
 *
 * Today this is target_state_architecture alone (9,000 words / 10 slides).
 * `roadmap` (5,000) is a candidate but stays on its fixed floor until it is
 * seen to force padding on a real small Move — add it here when that is shown,
 * not on speculation.
 */
export const DEPTH_SCALED_DELIVERABLES: ReadonlySet<string> = new Set([
  "target_state_architecture",
]);

/**
 * Fraction of the calibrated floor required at each deterministic complexity
 * tier. `complex` keeps the full floor. A reasoned starting point, not a
 * measured curve — documented like the word-band ratios in artifact-contracts.ts.
 */
const TIER_FACTOR: Record<ComplexityTier, number> = {
  straightforward: 0.5,
  standard: 0.75,
  complex: 1,
};

/**
 * Fraction of the calibrated floor by confirmed-evidence volume, used only when
 * no deterministic complexity tier is available. Boundaries are a reasoned
 * starting point calibrated against confirmed-evidence counts observed on
 * synthetic Moves, not a measured curve.
 */
function factorFromEvidence(count: number): number {
  if (count <= 6) return 0.5;
  if (count <= 12) return 0.72;
  if (count <= 20) return 0.85;
  return 1;
}

/**
 * The smallest fraction of the calibrated floor a depth-scaled deliverable may
 * fall to. Guarantees the smallest Move still produces a substantial executive
 * document (architecture: 0.5 × 9,000 = 4,500 words — well above golden-bar's
 * own 2,500 realistic minimum) rather than collapsing toward the generic floor.
 */
const MIN_FLOOR_FRACTION = 0.5;

/**
 * The smallest fraction of the calibrated slide floor a depth-scaled deck may
 * fall to. A deck still has to be an argument, not a title and a chart, so the
 * slide floor contracts more gently than the word floor.
 */
const MIN_SLIDE_FRACTION = 0.6;

export interface DepthAwareFloorInput {
  /** Canonical orchestrator deliverableType key. */
  deliverableType: string;
  /** The calibrated word floor from the quality bar (qb.minBodyWords). */
  baseMinWords: number;
  /** The calibrated slide floor from SLIDE_BANDS[type].min, when the type is a deck. */
  baseSlideMin?: number;
  /** Sanctioned deterministic depth decision, when the request path resolved it. */
  complexityTier?: ComplexityTier | null;
  /** Count of governed evidence items backing the deliverable (fallback signal). */
  confirmedEvidenceCount?: number | null;
}

export interface DepthAwareFloors {
  /** Depth-aware word floor to use in place of the calibrated base. */
  minBodyWords: number;
  /**
   * Depth-aware slide floor — present ONLY when it is a real REDUCTION below the
   * base band min (i.e. an override worth applying). When the full slide floor
   * still holds, or the type is not a deck / not depth-scaled, this is absent so
   * the caller leaves the fixed SLIDE_BANDS band in place untouched.
   */
  slideMin?: number;
  /** The fraction applied (1 = unchanged). */
  depthFactor: number;
  /** Human-readable signal basis, for logging and audit traceability. */
  basis: string;
}

/**
 * Derive the depth-aware floors for one deliverable request. For a type that is
 * not depth-scaled, or with no usable scope signal, returns the calibrated base
 * unchanged — so every caller can call this unconditionally.
 */
export function depthAwareFloors(input: DepthAwareFloorInput): DepthAwareFloors {
  const { deliverableType, baseMinWords, baseSlideMin } = input;

  if (!DEPTH_SCALED_DELIVERABLES.has(deliverableType)) {
    // Leave the calibrated base and the fixed slide band exactly as they are.
    return { minBodyWords: baseMinWords, depthFactor: 1, basis: "not depth-scaled" };
  }

  let depthFactor = 1;
  let basis = "full (no depth signal)";
  if (input.complexityTier) {
    depthFactor = TIER_FACTOR[input.complexityTier];
    basis = `tier:${input.complexityTier}`;
  } else if (typeof input.confirmedEvidenceCount === "number") {
    depthFactor = factorFromEvidence(input.confirmedEvidenceCount);
    basis = `evidence:${input.confirmedEvidenceCount}`;
  }

  // Only ever scale DOWN from the calibrated base, and never below the floor
  // fraction — the smallest Move still produces a substantial document.
  const minBodyWords = Math.max(
    Math.round(baseMinWords * MIN_FLOOR_FRACTION),
    Math.min(baseMinWords, Math.round(baseMinWords * depthFactor)),
  );

  let slideMin: number | undefined;
  if (typeof baseSlideMin === "number") {
    const scaled = Math.max(
      Math.round(baseSlideMin * MIN_SLIDE_FRACTION),
      Math.min(baseSlideMin, Math.round(baseSlideMin * depthFactor)),
    );
    // Only surface an override when it is a real reduction; otherwise the fixed
    // band min still holds and the caller should leave it untouched.
    if (scaled < baseSlideMin) slideMin = scaled;
  }

  return {
    minBodyWords,
    ...(slideMin !== undefined ? { slideMin } : {}),
    depthFactor,
    basis,
  };
}
