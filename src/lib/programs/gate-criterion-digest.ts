// How many open gate criteria a short list shows, and how it says what it left
// out.
//
// The gate panel's blocker list renders two halves in one `<ul>`: the open HARD
// criteria, then the open SOFT ones (its "caveats"). Each half shows a few
// entries and the rest are not rendered anywhere on the surface. The hard half
// was written with a remainder row ("{N} more"); the soft half, three lines
// below it, was written without one. So the hard half told the reader it was
// truncating and the soft half did not.
//
// The soft counts on the canonical gate rules are 3 / 1 / 0 / 2 / 6 / 1 for the
// P0->P1 .. P5->P6 transitions, against a soft limit of 2 — so at P4->P5 four
// open caveats were dropped with nothing on the surface saying a caveat had
// been dropped at all, and one was dropped at P0->P1.
//
// The adjacent decision line understated the same set in the other direction:
// it read "Ready with caveat: <first label>." in the SINGULAR however many were
// open, so six open caveats were reported as one. That is a claim about the
// count, not a truncated list, which is why it is derived here too.
//
// Both slots read one digest, so the shown entries, the hidden count and the
// sentence's number cannot disagree: `shown.length + hidden === total` holds by
// construction, and a half that forgets to render `remainderLabel` is a missing
// render of a value that exists, not a missing branch nobody wrote.

/**
 * How many entries each half of the blocker list shows before it starts
 * counting the rest. The hard limit is the one the hard half already used.
 */
export const GATE_CRITERION_DIGEST_LIMITS = {
  hard: 3,
  soft: 2,
} as const;

export type GateCriterionDigestSeverity =
  keyof typeof GATE_CRITERION_DIGEST_LIMITS;

export type GateCriterionDigest<T> = {
  /** The entries the list renders. */
  readonly shown: readonly T[];
  /** How many open criteria are NOT rendered. 0 when the list is complete. */
  readonly hidden: number;
  /** Every open criterion of this severity. */
  readonly total: number;
  /**
   * The remainder row's text, or `null` when nothing was left out. A half that
   * renders this whenever it is non-null cannot silently truncate.
   */
  readonly remainderLabel: string | null;
};

/**
 * Split the open criteria of one severity into what the short list shows and
 * how many it is leaving out.
 */
export function digestOpenGateCriteria<T>(
  openCriteria: readonly T[],
  severity: GateCriterionDigestSeverity,
): GateCriterionDigest<T> {
  const limit = GATE_CRITERION_DIGEST_LIMITS[severity];
  const shown = openCriteria.slice(0, limit);
  const hidden = openCriteria.length - shown.length;
  return {
    shown,
    hidden,
    total: openCriteria.length,
    remainderLabel: hidden > 0 ? `${hidden} more` : null,
  };
}

/**
 * The decision line for a phase with no open hard blockers but open caveats.
 *
 * Returns `null` when no caveat is open, which is the caller's "no hard
 * blockers are open" case — the sentence is only about caveats, so it does not
 * invent wording for their absence.
 *
 * States the count in every arm. Naming the first open caveat is useful and is
 * kept, but it is no longer the whole sentence: a named first caveat beside a
 * total of six reads as one of six, not as the only one.
 */
export function readyWithCaveatsSentence(
  openSoftCriteria: readonly { readonly label?: string | null }[],
): string | null {
  const total = openSoftCriteria.length;
  if (total === 0) return null;
  const noun = total === 1 ? "caveat" : "caveats";
  const first = openSoftCriteria[0]?.label ?? null;
  if (!first) return `Ready with ${total} ${noun}.`;
  return total === 1
    ? `Ready with 1 caveat: ${first}.`
    : `Ready with ${total} caveats, including: ${first}.`;
}
