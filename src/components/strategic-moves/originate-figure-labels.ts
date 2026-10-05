// originate-figure-labels.ts — the P0 Originate screen's figures.
//
// Every figure this screen renders must (a) say what it counts, (b) agree with
// the noun it is concatenated to, and (c) be derived from something that
// actually measured it. Three figures on this one screen broke one of those
// rules each:
//
//   1. The phase rail rendered a bare `N of M` for all six phases, where only
//      the P0 row was measured (captured P0 answers) and the P1-P5 rows were
//      hard-coded literals (`0 of 5`, `0 of 5`, `0 of 4`, `0 of 4`, `0 of 4`)
//      that match no capture or gate contract. Five invented figures sat in the
//      same column, in the same format, as one real one.
//   2. The promote bar read `${filled} of ${total} answers captured` with a
//      fixed plural, so a single-answer scaffold reads "1 answers".
//   3. The discard dialog's numerator counted EVERY brief field while its
//      denominator counted only the REQUIRED ones, so the two sides measured
//      different sets and the figure could exceed its own total.
//
// The rule applied here, from the unmeasured-row precedent: a row nothing
// measured claims nothing. There is no honest total to fall back to for
// P1-P5, because the number itself was invented.

/** One row of the P0 Originate phase rail. */
export interface OriginateRailRow {
  readonly phase: number;
  readonly label: string;
  readonly state: "done" | "current" | "upcoming";
  /**
   * `null` when nothing on this screen measured the row. The P0 Originate
   * screen can only measure P0: it holds the P0 brief and no capture state,
   * gate state or evidence for any later phase.
   */
  readonly measured: { readonly met: number; readonly total: number } | null;
}

/**
 * Agrees a noun to the quantity it describes. `N of M <noun>` describes M
 * things, so the denominator governs the noun — "0 of 1 answer", not
 * "0 of 1 answers".
 */
export function agreeNoun(
  count: number,
  singular: string,
  plural: string,
): string {
  return count === 1 ? singular : plural;
}

/**
 * The rail's six rows. Only P0 carries a measurement; the later rows are
 * emitted with `measured: null` so no invented total can reach the screen.
 */
export function buildOriginateRailRows(input: {
  readonly requiredFilled: number;
  readonly requiredFieldCount: number;
  readonly laterPhases: readonly {
    readonly phase: number;
    readonly label: string;
  }[];
}): readonly OriginateRailRow[] {
  return [
    {
      phase: 0,
      label: "P0 Originate",
      state: "current",
      measured: {
        met: input.requiredFilled,
        total: input.requiredFieldCount,
      },
    },
    ...input.laterPhases.map((p) => ({
      phase: p.phase,
      label: p.label,
      state: "upcoming" as const,
      measured: null,
    })),
  ];
}

/**
 * What a rail row renders in its tally column. A measured row states its noun;
 * an unmeasured row says it has not started rather than showing a figure.
 */
export function formatOriginateRailTally(row: OriginateRailRow): string {
  if (row.measured === null) return "Not started";
  const { met, total } = row.measured;
  return `${met} of ${total} ${agreeNoun(total, "answer", "answers")}`;
}

/** The promote bar's progress sentence. */
export function formatAnswersCaptured(input: {
  readonly filled: number;
  readonly total: number;
}): string {
  const noun = agreeNoun(input.total, "answer", "answers");
  return `${input.filled} of ${input.total} ${noun} captured — finish the remaining P0 answers.`;
}

/**
 * The discard dialog's progress sentence. Both sides of the figure count the
 * same set — the required scaffold — so it can never exceed its own total.
 */
export function formatOriginateDiscardProgress(input: {
  readonly requiredFilled: number;
  readonly requiredFieldCount: number;
}): string {
  const noun = agreeNoun(input.requiredFieldCount, "answer", "answers");
  return `You’ve captured ${input.requiredFilled} of ${input.requiredFieldCount} required ${noun}.`;
}
