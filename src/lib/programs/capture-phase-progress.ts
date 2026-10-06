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
  /**
   * How far the Move has advanced (`move.currentPhase`). Retained because the
   * strip still uses it for reachability; it is deliberately NOT used to infer
   * an answered count, because advancing past a phase does not answer it.
   */
  currentPhase: number;
  /**
   * The live answered count for `viewedPhase` — never for `currentPhase`.
   * Attributing this to the current phase instead of the viewed one is what
   * produced counts above a phase's own total (e.g. "11 of 7") whenever the
   * two differed.
   */
  viewedAnsweredCount: number;
  /**
   * Optional per-phase SAVED-ANSWER counts, from the module rows the host
   * already holds for the whole Move (`capturePhaseSavedAnswerCounts`).
   *
   * This is NOT a second source for `answered`. A saved answer is a persisted
   * non-empty value; the viewed row's `answered` additionally requires
   * structured validity, evidence readiness and — on P1 — a satisfied charter
   * basis, so this count is strictly weaker and routinely larger. It is carried
   * on a separate field, under a separate noun, so an unmeasured row can show
   * the work behind it without claiming any of it is complete.
   *
   * Absent (the default, and whenever the rollup flag is off) ⇒ every row
   * behaves exactly as it did before, stating a question count alone.
   */
  savedAnswerCountByPhase?: Readonly<Record<number, number>>;
};

/**
 * The answered count for one row, or `null` when this screen cannot measure it.
 *
 * Only ONE phase can be counted: the one on screen, whose live capture values
 * the host holds. Every other row is UNMEASURED, and says so by returning
 * `null` rather than a number.
 *
 * An earlier rule inferred that a phase the Move had advanced past must be
 * complete, and filled the row with its own total. That inference is unsound.
 * A Move can advance for reasons that never touch the structured capture
 * questions — it predates the capture flow, or its gate was approved from
 * evidence held elsewhere — and the questions are then still blank. The strip
 * nonetheless reported the phase fully answered, and the flow drew a
 * completion tick beside it, on every screen except that phase's own. Viewing
 * the phase itself showed the true count, so one row read two different values
 * depending on where you stood.
 *
 * Claiming coverage that was never measured is the failure mode this product
 * treats as most serious, so an unmeasured row now claims nothing. The caller
 * renders the question count alone and no tick.
 *
 * A measured count is still clamped to `[0, total]` as a floor/ceiling of last
 * resort; the attribution is what has to be right. A clamp alone would turn an
 * impossible "11 of 7" into a believable but still-wrong "7 of 7".
 */
export function capturePhaseAnsweredCount(
  row: CapturePhaseProgressRow,
  context: CapturePhaseProgressContext,
): number | null {
  if (row.phase !== context.viewedPhase) return null;
  const total = Math.max(0, row.total);
  return Math.min(Math.max(0, context.viewedAnsweredCount), total);
}

/**
 * How many of a row's questions hold a saved answer, or `null` when nothing
 * says.
 *
 * Returned only for a row this screen CANNOT measure. The viewed row already
 * states a live `answered` count, and putting a second, weaker figure beside it
 * would show the same row two numbers under two nouns — the shape of the defect
 * that produced "11 of 7" in the first place. One figure per row.
 *
 * Clamped to the row's own total: the count is derived against the same
 * route-aware section list, so exceeding it would mean the two disagree about
 * which questions the phase asks, and a figure above its own total is never the
 * honest reading of that disagreement.
 */
export function capturePhaseSavedAnswers(
  row: CapturePhaseProgressRow,
  context: CapturePhaseProgressContext,
): number | null {
  if (row.phase === context.viewedPhase) return null;
  const counts = context.savedAnswerCountByPhase;
  if (!counts) return null;
  const saved = counts[row.phase];
  if (typeof saved !== "number" || !Number.isFinite(saved)) return null;
  const total = Math.max(0, row.total);
  return Math.min(Math.max(0, Math.trunc(saved)), total);
}

/**
 * `capturePhaseAnsweredCount` and `capturePhaseSavedAnswers` over every row of
 * the strip.
 *
 * The two never both carry a number for the same row, by construction: one is
 * defined only on the viewed phase and the other only off it.
 */
export function capturePhaseProgress<Row extends CapturePhaseProgressRow>(
  rows: readonly Row[],
  context: CapturePhaseProgressContext,
): Array<Row & { answered: number | null; savedAnswers: number | null }> {
  return rows.map((row) => ({
    ...row,
    answered: capturePhaseAnsweredCount(row, context),
    savedAnswers: capturePhaseSavedAnswers(row, context),
  }));
}
