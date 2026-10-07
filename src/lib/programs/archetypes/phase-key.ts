import { PHASE_NUMBER, type PhaseKey } from "./types";

/**
 * The inverse of `PHASE_NUMBER`, derived from it rather than written out a
 * second time.
 *
 * Callers that hold a phase NUMBER (the product's own currency — a Move row
 * carries `currentPhase`, routes take `phase`) and need the archetype's phase
 * KEY were hand-rolling the mapping, and a hand-rolled one falls back rather
 * than failing: `phase === 1 ? "charter" : phase === 2 ? "diagnose" :
 * "charter"` answers P0, P3, P4 and P5 with the charter phase's content. Every
 * archetype but one declares `design`, `roadmap_business_case` and `mobilize`
 * entries, so that fallback made most of each pack unreachable and attributed
 * the charter entries to four phases that are not charter.
 *
 * Deriving the inverse means a seventh `PhaseKey` is mapped the moment it is
 * added to `PHASE_NUMBER`, with no second place to forget.
 */
const PHASE_KEY_BY_NUMBER: ReadonlyMap<number, PhaseKey> = new Map(
  (Object.entries(PHASE_NUMBER) as Array<[PhaseKey, number]>).map(
    ([key, number]) => [number, key],
  ),
);

/**
 * The archetype phase key for a product phase number, or `null` when the
 * number names no phase. `null` is deliberately not a phase: a caller that
 * cannot resolve a phase should say so, not quietly answer for another one.
 */
export function phaseKeyForNumber(phase: number): PhaseKey | null {
  return PHASE_KEY_BY_NUMBER.get(phase) ?? null;
}
