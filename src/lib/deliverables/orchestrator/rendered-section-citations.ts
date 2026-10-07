// Which governed sources a rendered deliverable actually cites.
//
// The source register is the resolution table for the `[n]` markers in the
// body: a reader who meets `[4]` looks for row 4. It was built from each
// section's `citationsUsed`, which is the MODEL's self-report (or, when the
// section response omits it, the architect plan's `evidenceCitations`) —
// captured before the deterministic repairs run.
//
// Two of those repairs put `[n]` into the body afterwards:
// `repairEvidenceBackedUncitedFigures` appends a citation to every sentence
// whose numeric/date tokens all appear in one governed evidence item (that is
// its whole purpose — the model omitted the citation for a fact it took from
// the bundle), and it runs again over the consolidated sections in
// `assembleDeliverable`. Neither updates `citationsUsed`.
//
// So the register could disagree with the body in both directions at once:
//   - a cited source with no row — the reader cannot resolve `[4]`; and
//   - with nothing reported at all, an EMPTY register on a document whose body
//     does cite, which the quality gate blocks as `no source register`
//     (`requiresSourceRegister` is set from the evidence bundle, so it is on
//     for every Move with approved evidence). That blocker names no control a
//     human can use: the register is derived, not authored, so the document is
//     quarantined and the phase's `*_signed_off` gate criterion cannot pass.
//
// This reads the citations off the text a reader sees, unioned with what the
// section reports, so the register covers exactly what the document claims.
// It can only add a row for evidence already in the bundle handed to the
// register, so an audience-excluded item still cannot appear.

/**
 * A `[n]` citation marker. Deliberately narrow: only digits inside the
 * brackets, so `[ASSUMPTION TO VALIDATE: ...]` and the other placeholder tags
 * are not citations. A marker followed by `(` or `:` is markdown link syntax
 * (`[1](https://…)`, a reference definition), not a citation.
 */
const CITATION_MARKER = /\[(\d{1,3})\](?![(:])/g;

export interface CitingSection {
  /** The text a reader sees. */
  bodyMarkdown: string;
  /** What the quality gate judges, when it differs from the rendered body. */
  rawBodyMarkdown?: string;
  /** What the model (or the architect plan) said this section cites. */
  citationsUsed?: number[];
}

/** Every citation number a section's rendered text makes. */
export function citationsInText(text: string | undefined): number[] {
  if (!text) return [];
  // The marker captures one to three digits, so the parse always yields a
  // finite integer — a `Number.isFinite` guard here would be unreachable, and
  // an unreachable guard hides a later widening of the marker instead of
  // catching it.
  return [...text.matchAll(CITATION_MARKER)].map((match) => Number(match[1]));
}

/**
 * The union of what the sections report and what their text actually cites.
 * Both bodies are read because the rendered body is sanitized and the raw body
 * is not, and a citation present in either is one the document carries.
 */
export function citationsCarriedBySections(
  sections: readonly CitingSection[],
): Set<number> {
  const carried = new Set<number>();
  for (const section of sections) {
    for (const n of section.citationsUsed ?? []) carried.add(n);
    for (const n of citationsInText(section.bodyMarkdown)) carried.add(n);
    for (const n of citationsInText(section.rawBodyMarkdown)) carried.add(n);
  }
  return carried;
}
