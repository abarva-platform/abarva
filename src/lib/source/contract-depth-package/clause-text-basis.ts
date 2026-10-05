/**
 * Whether a contract clause row's `value_text` was read off a document, or
 * generated — and what the canonical object is therefore allowed to assert
 * about it.
 *
 * A governed contract-depth package carried 56 clause rows whose `value_text`
 * was a template sentence stating nothing the clause says, while every one of
 * those rows also carried `review_state: synthetic_demo_reviewed`,
 * `confidence: 0.91` and a populated `source_page`. The rows presented
 * themselves as reviewed, page-cited extractions at high confidence. A
 * uniqueness check passed them, because the 56 sentences differ in their
 * leading concept and trailing evidence-row id and are therefore all distinct.
 *
 * The defect is in the metadata, not the prose. A page citation for text that
 * was never read off that page is a falsehood, and so is a confidence score
 * for an extraction that never ran. So this module answers one question — did
 * a document produce this text? — and derives from the answer the fields the
 * canonical object may carry. It never authors clause prose: text that says
 * nothing stays as it is and stops claiming to be evidence.
 *
 * Clearing the columns in the source file is not enough on its own. Both
 * consumers manufacture the same assertions when the row is silent: the
 * contract-term loader hard-codes `quality_state: 'reviewed'` and defaults a
 * missing `confidence` to `0.82`, and the projection copies `value_text` into
 * `source_excerpt` and stamps an `extractor_version` unconditionally. The
 * classification therefore has to run in code, over the row, at both sinks.
 */

export type ClauseTextBasis = "derived_not_extracted" | "document_extracted";

export const DERIVED_CLAUSE_TEXT_BASIS: ClauseTextBasis =
  "derived_not_extracted";
export const EXTRACTED_CLAUSE_TEXT_BASIS: ClauseTextBasis =
  "document_extracted";

/**
 * The review state a derived row carries. `unreviewed` is the column default
 * in `source.contract_term`, and "clauses marked unreviewed" is the branch of
 * the governing item's acceptance taken here — the alternative was authoring
 * clause language, which would make the metadata true-looking rather than
 * true.
 */
export const DERIVED_CLAUSE_REVIEW_STATE =
  "synthetic_demo_derived_text_not_extracted";
export const DERIVED_CLAUSE_QUALITY_STATE = "unreviewed";
export const EXTRACTED_CLAUSE_QUALITY_STATE = "reviewed";

/**
 * Structural markers of a sentence that describes a row's provenance instead
 * of a clause's content.
 *
 * Deliberately NOT a regex over the one sentence the package happens to hold.
 * A narrow pattern pinned to the singular wording — `is governed by the 2024
 * managed-services agreement and mapped to Source evidence row X.` — lets a
 * plural, a re-ordered clause, or a different year through untouched, and the
 * next generated batch would classify as extracted. Each marker is matched
 * independently and all must hold, so order between them does not matter.
 *
 * Both markers together say only "something governs this and it maps to an
 * evidence row". That is metadata about the row. It is not what the clause
 * says, whatever words surround it.
 */
const DERIVED_TEXT_MARKERS: readonly RegExp[] = [
  /\b(?:is|are|was|were)\s+governed\s+by\b/i,
  /\bmapp(?:ed|ing|s)?\s+to\b[^.]*\bevidence\s+rows?\b/i,
];

/**
 * True when the text asserts only the row's own provenance, so no document
 * produced it.
 */
export function describesNoClauseContent(valueText: string): boolean {
  const text = valueText.trim();
  if (!text) return true;
  return DERIVED_TEXT_MARKERS.every((marker) => marker.test(text));
}

/**
 * True when the row itself declares that its text is derived. Kept as a second
 * channel so a row that has already been classified stays classified even if
 * its wording is later changed to something this module cannot recognise.
 */
export function declaresDerivedText(reviewState: string): boolean {
  // NOT `\bderived\b` / `\bnot_extracted\b`. `_` is a word character, so in
  // `synthetic_demo_derived_text_not_extracted` there is no word boundary on
  // either side of `derived` or before `not_extracted`, and a `\b`-anchored
  // pattern matches NEITHER. Snake-case tokens are matched as substrings and
  // the separator is asserted explicitly instead.
  return (
    /(?:^|_)derived(?:_|$)/i.test(reviewState) &&
    /not_extracted/i.test(reviewState)
  );
}

export interface ClauseTextBasisVerdict {
  readonly textBasis: ClauseTextBasis;
  /** `null` means absent, and absent is the point: never a placeholder. */
  readonly confidence: number | null;
  readonly sourcePage: string | null;
  readonly sourceExcerpt: string | null;
  readonly extractorVersion: string | null;
  readonly reviewState: string;
  readonly qualityState: string;
}

function trimmed(row: Record<string, string>, key: string): string {
  return (row[key] ?? "").trim();
}

function parsedConfidence(raw: string): number | null {
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Classify one clause row and state what may be asserted about it.
 *
 * A derived row leaves `confidence`, `source_page`, `source_excerpt` and
 * `extractor_version` ABSENT rather than defaulted. The text is still carried
 * — removing it would lose the concept the row names — but it no longer
 * presents itself as an extraction.
 *
 * The text test takes precedence over the row's own declaration in the
 * derived direction only: a row whose text says nothing is derived even when
 * its `review_state` and `confidence` claim otherwise, which is exactly the
 * state this was built for.
 */
export function classifyContractClauseTextBasis(
  clause: Record<string, string>,
  options: { readonly extractorVersion?: string } = {},
): ClauseTextBasisVerdict {
  const valueText = trimmed(clause, "value_text");
  const reviewState = trimmed(clause, "review_state");

  const derived =
    describesNoClauseContent(valueText) || declaresDerivedText(reviewState);

  if (derived) {
    return {
      textBasis: DERIVED_CLAUSE_TEXT_BASIS,
      confidence: null,
      sourcePage: null,
      sourceExcerpt: null,
      extractorVersion: null,
      reviewState: DERIVED_CLAUSE_REVIEW_STATE,
      qualityState: DERIVED_CLAUSE_QUALITY_STATE,
    };
  }

  const sourcePage = trimmed(clause, "source_page");
  return {
    textBasis: EXTRACTED_CLAUSE_TEXT_BASIS,
    confidence: parsedConfidence(trimmed(clause, "confidence")),
    sourcePage: sourcePage || null,
    sourceExcerpt: valueText || null,
    extractorVersion: options.extractorVersion ?? null,
    reviewState: reviewState || DERIVED_CLAUSE_QUALITY_STATE,
    qualityState: EXTRACTED_CLAUSE_QUALITY_STATE,
  };
}

export interface ContractTermGovernance {
  readonly pageRef: string | null;
  readonly confidence: number | null;
  readonly qualityState: string;
  readonly textBasis: ClauseTextBasis;
}

/**
 * The governed fields a clause row contributes to `source.contract_term`.
 *
 * Extracted from the loader so it can be driven over the real package without
 * a database. The loader previously hard-coded `quality_state: 'reviewed'` and
 * defaulted a missing `confidence` to `0.82`, which means blanking the columns
 * in the source file would not have been enough on its own: the loader would
 * have manufactured both assertions back.
 */
export function contractTermGovernance(
  clause: Record<string, string>,
): ContractTermGovernance {
  const verdict = classifyContractClauseTextBasis(clause);
  return {
    pageRef: verdict.sourcePage,
    confidence: verdict.confidence,
    qualityState: verdict.qualityState,
    textBasis: verdict.textBasis,
  };
}
