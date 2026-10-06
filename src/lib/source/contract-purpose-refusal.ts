/**
 * The stored values that mean "this contract purpose was never reviewed".
 *
 * A `purpose_summary` or `scope_summary` sometimes arrives as column values
 * rather than prose, and the surface that characterises a contract refuses to
 * read those as a reviewed purpose. Two separate mechanisms act on that input
 * and they disagree on purpose: this list REFUSES the whole value, while
 * `withoutIdentifierTokens` KEEPS whatever prose survives after identifiers
 * are removed. Which one runs first therefore decides the outcome, so the
 * order is stated where the control lives rather than left to the reader.
 *
 * The list lives here, apart from the surface that applies it, so a test can
 * enumerate the alternatives instead of restating them. An alternative the
 * control can never match is a gate that cannot fail, and this list carried
 * one: `for_cause_only` is the only snake_case entry, and it was consulted
 * only after identifier stripping had already deleted it (T-591).
 */
export const UNREVIEWED_PURPOSE_TOKENS = [
  "absent",
  "unknown",
  "unresolved",
  "none",
  "null",
  "n/a",
  "for_cause_only",
] as const;

const UNREVIEWED_PURPOSE_PATTERN = new RegExp(
  `\\b(?:${UNREVIEWED_PURPOSE_TOKENS.map((token) =>
    token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  ).join("|")})\\b`,
  "i",
);

/**
 * True when the value carries one of the unreviewed-value tokens as a
 * standalone word.
 *
 * This must be applied to the RAW value, before any identifier stripping, or
 * the snake_case alternatives cannot match. A listed word appearing inside a
 * longer identifier — `none_selected`, `benchmarking_absent` — has no word
 * boundary and is deliberately not matched: that is an identifier to be
 * stripped, not a declaration that the value is unreviewed.
 */
export function isUnreviewedPurposeValue(
  value: string | null | undefined,
): boolean {
  if (!value) return false;
  return UNREVIEWED_PURPOSE_PATTERN.test(value);
}

/**
 * A stored value that is safe to read as English, or null.
 *
 * The whole-string forms are refused outright; anything else is checked
 * against the unreviewed-value list and only then stripped of identifiers.
 */
export function usableText(value: string | null | undefined) {
  const text = value?.trim();
  if (
    !text ||
    /^(not established|unknown|unresolved|none|null|n\/a)$/i.test(text)
  ) {
    return null;
  }
  return text;
}

/**
 * Drop snake_case database values from a string meant to read as English.
 *
 * A scope summary arrived as "Managed Services - present_with_annual_right -
 * present_after_year_2_with_90_days_notice" — the clause and exit-rights enum
 * values concatenated onto a real phrase. Rendered whole, an executive read
 * column values as a sentence.
 *
 * The prose that survives is kept; if nothing usable remains, the caller falls
 * through to its next source rather than showing identifiers.
 */
export function withoutIdentifierTokens(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  const cleaned = value
    // A lowercase run joined by underscores is an identifier, never prose.
    .replace(/\b[a-z0-9]+(?:_[a-z0-9]+)+\b/g, " ")
    // Tidy the separators the removal leaves behind.
    .replace(/\s*[-–—]\s*(?=\s*[-–—]|$)/g, " ")
    .replace(/[-–—]\s*$/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
    .replace(/[,;:]\s*$/g, "");
  return cleaned.length > 0 ? cleaned : null;
}

/**
 * The contract-purpose refusal control.
 *
 * Ordering is the whole point of this function and is why it lives beside the
 * list rather than inside the 3,900-line surface that renders its result: a
 * test can hold the ordering without importing that surface, and the required
 * behaviour floor measures coverage over everything a suite loads.
 */
export function usableScopeSummary(value: string | null | undefined) {
  if (/\s[-–—]\s(?:present|absent)(?:\b|_)/i.test(value ?? "")) return null;
  const raw = usableText(value);
  if (!raw) return null;
  // The unreviewed-value list is consulted BEFORE identifiers are stripped.
  // The two mechanisms disagree about the same input and the list is the one
  // that governs here: it refuses the whole value, while stripping keeps
  // whatever prose survives. Run second, the list could never see a snake_case
  // alternative — `withoutIdentifierTokens` had already removed it — so a
  // purpose reading "<prose> for_cause_only" rendered as "<prose>", a reviewed
  // characterisation with a governing clause silently dropped from it (T-591).
  if (isUnreviewedPurposeValue(raw)) {
    return null;
  }
  const text = withoutIdentifierTokens(raw);
  if (!text) return null;
  return text;
}

/**
 * The template tails the migrations actually emit after `<vendor>: `.
 *
 * Both are generated when `purpose_summary_json` is empty. The wording changed
 * between migrations — `20260910203000` and `20260910233000` emit the first,
 * `20260911150000` emits the second — and that change is what defeated the
 * header's guard, which still blocked only the superseded phrasing.
 */
export const GENERATED_PURPOSE_HEADLINE_TAILS = [
  "contract purpose is not yet reviewed.",
  "contract purpose requires reviewed context.",
] as const;

/**
 * True when a story headline is a generated fallback rather than reviewed
 * prose about the contract.
 *
 * This matches the GENERATOR'S SHAPE, not its wording. Every generated purpose
 * headline is `<vendor name>: contract purpose …`, so the control keys on that
 * shape and survives the tail being reworded again — which is exactly how the
 * previous guard rotted: it listed `not yet reviewed`, a later migration
 * emitted `requires reviewed context`, and the new sentence passed through as
 * a page heading. A blocklist of phrasings is a gate that goes stale on
 * someone else's edit.
 *
 * The vendor name is used when it is known, because that makes the match
 * exact; without it the `: contract purpose` shape still identifies the
 * generator. A genuinely reviewed purpose that happens to begin "contract
 * purpose" is not addressed by this control and would be caught by neither —
 * it is prose, and prose is what the header is for.
 */
export function isGeneratedPurposeHeadline(
  headline: string | null | undefined,
  vendorName?: string | null,
): boolean {
  const text = headline?.trim();
  if (!text) return false;
  const vendor = vendorName?.trim();
  if (vendor) {
    const escaped = vendor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`^${escaped}\\s*:\\s*contract purpose\\b`, "i").test(text)) {
      return true;
    }
  }
  // Without a vendor name, or when the stored name differs from the one the
  // headline was built from, the generator's own separator still identifies it.
  return /:\s*contract purpose\b/i.test(text);
}
