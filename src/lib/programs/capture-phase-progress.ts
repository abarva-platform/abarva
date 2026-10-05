/**
 * Which "N of M answered" the redesigned capture flow's phase strip shows for
 * each of the six phases.
 *
 * The strip renders one row per phase, but the host component only ever holds
 * live capture values for ONE phase: the one on screen. Its section list, and
 * therefore its answered count, are derived from the viewed phase. Everything
 * else has to be inferred from how far the Move itself has advanced.
 *
 * Keeping that inference here — rather than inline in the host — is what makes
 * it testable, because the host has no suite of its own and the strip is only
 * reachable behind the capture flags.
 */

/** One row of the phase strip: the phase it stands for and its question count. */
export type CapturePhaseProgressRow = {
  /** 0-5. The phase this row stands for. */
  phase: number;
  /** How many capture sections that phase has. The "M" of "N of M". */
  total: number;
};

export type CapturePhaseProgressContext = {
  /**
   * The phase currently on screen. This is the ONLY phase the host has live
   * capture values for, so it is the only row whose count can be measured
   * rather than inferred.
   */
  viewedPhase: number;
  /** How far the Move has advanced (`move.currentPhase`). */
  currentPhase: number;
  /**
   * The live answered count for `viewedPhase` — never for `currentPhase`.
   * Attributing this to the current phase instead of the viewed one is what
   * produced counts above a phase's own total (e.g. "11 of 7") whenever the
   * two differed.
   */
  viewedAnsweredCount: number;
};

/**
 * The answered count for one row.
 *
 * Three rules, in this order:
 *
 * 1. The row on screen is the one we can actually measure, so it reports the
 *    live count. This deliberately wins over rule 2: revisiting a phase the
 *    Move has already advanced past shows what that phase holds NOW, not a
 *    blanket "complete" that a later edit may have invalidated.
 * 2. A phase the Move has advanced past is complete — it could not have been
 *    left behind otherwise.
 * 3. Anything else has no live values and has not been passed, so it is 0.
 *
 * The result is clamped to `[0, total]` only as a floor/ceiling of last resort;
 * the attribution above is what has to be right. A clamp alone would turn the
 * impossible "11 of 7" into a believable but still-wrong "7 of 7".
 */
export function capturePhaseAnsweredCount(
  row: CapturePhaseProgressRow,
  context: CapturePhaseProgressContext,
): number {
  const total = Math.max(0, row.total);
  const answered =
    row.phase === context.viewedPhase
      ? context.viewedAnsweredCount
      : row.phase < context.currentPhase
        ? total
        : 0;
  return Math.min(Math.max(0, answered), total);
}

/** `capturePhaseAnsweredCount` over every row of the strip. */
export function capturePhaseProgress<Row extends CapturePhaseProgressRow>(
  rows: readonly Row[],
  context: CapturePhaseProgressContext,
): Array<Row & { answered: number }> {
  return rows.map((row) => ({
    ...row,
    answered: capturePhaseAnsweredCount(row, context),
  }));
}
