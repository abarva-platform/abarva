/**
 * `overlap_treatment` is a narrative, not a vocabulary. This is the decision.
 *
 * The column has no CHECK and the question was whether it should. Measured
 * against the canonical opportunity set, every production value is a full
 * sentence naming **what** the value is kept separate from and **under what
 * condition**:
 *
 *   "Separated from AP invoice-line rate variance. VMS labor rate-card rows
 *    are included once as their own recoverable-leakage opportunity."
 *
 *   "Included only in the recoverable opportunity calculation. Pending
 *    off-contract lines are excluded until coverage review is complete, so
 *    the page avoids double counting."
 *
 * An enum cannot carry either half. `included` says a value is counted
 * somewhere without saying where, which is the one thing a reader checking
 * for double-counting needs. Constraining this column would delete the
 * information it exists to hold.
 *
 * The bare tokens that made the column look like a half-built enum —
 * `"none"`, `"included"` — appear **only in test fixtures**, never in the
 * canonical set. Fixtures written as placeholders taught the wrong shape,
 * which is why the field read as both a vocabulary and a narrative at once.
 *
 * So: no CHECK, no enum, no migration. What the field needs instead is a
 * boundary that refuses to present a token as if it were an explanation, and
 * refuses to fill an absent explanation with a sentence about something else.
 */

export type OverlapTreatmentPresentation =
  | { state: "explained"; text: string }
  | { state: "unexplained"; text: string; token: string }
  | { state: "unrecorded"; text: string };

/**
 * A token is a bare word standing where a sentence belongs. It is not an
 * explanation, and presenting it as one under a heading a client reads is
 * how builder shorthand reaches a CXO.
 *
 * Deliberately shape-based rather than a list of known tokens: a new
 * placeholder nobody has seen yet is the same defect, and a list would have
 * to be updated by the person least likely to notice.
 */
function looksLikeAToken(value: string): boolean {
  const trimmed = value.trim();
  // One or two words, no terminal punctuation. A real treatment sentence in
  // the canonical set is never shorter than a clause.
  return /^[\w\-/]+(?:[ _][\w\-/]+)?$/.test(trimmed) && !/[.!?]$/.test(trimmed);
}

/**
 * How an overlap treatment should be presented to a reader.
 *
 * Every branch returns text that answers the question the heading asks. That
 * is the whole point: the surface previously answered a different one when
 * the value was missing.
 */
export function presentOverlapTreatment(
  value: string | null | undefined,
): OverlapTreatmentPresentation {
  const trimmed = (value ?? "").trim();

  if (trimmed.length === 0) {
    // The surface previously filled this with "No opportunity value is
    // approved until evidence is resolved." — a true sentence about
    // approval, shown under the heading "Overlap". An absent explanation is
    // not an explanation of something else.
    return {
      state: "unrecorded",
      text: "How this overlaps other opportunities has not been recorded.",
    };
  }

  if (looksLikeAToken(trimmed)) {
    return {
      state: "unexplained",
      token: trimmed,
      text:
        `Recorded as "${trimmed}", which does not say what this overlaps or ` +
        "under what condition.",
    };
  }

  return { state: "explained", text: trimmed };
}
