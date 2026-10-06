/**
 * One decimal-safe sentence tokenizer for generated Home narrative.
 *
 * Every caller here splits narrative into sentences, decides something per sentence (drop a
 * stale claim, replace it, chunk it), and then re-joins the survivors with a single space.
 * That round trip is only lossless if the split agrees with the reader about where a sentence
 * ends. The naive `[^.!?]+[.!?]+` tokenizer does not: it treats the period in `17.4%` as a
 * terminator, so `17.` and `4%` become two "sentences", and the re-join puts a space between
 * them. The figure an executive reads is then `17. 4%`.
 *
 * That is a silent corruption -- nothing throws, the guard still reports that it ran, and the
 * defect is invisible at the call site because the call site never looks at the seam. It is also
 * invisible to a per-example test, which is why the suite beside this file counts broken
 * decimals over the real published corpus rather than asserting one crafted string survives.
 *
 * The rule: a period terminates a sentence unless it sits directly between two digits. Fixing it
 * here, in the step that splits, rather than re-joining `\d\. \d` at display time, is deliberate
 * -- a display-time repair would launder a pipeline that still emits broken text, and leave every
 * other reader of that text (export, copy, model prompt) holding the broken form.
 */
const NARRATIVE_SENTENCE_PATTERN =
  /(?:[^.!?]|(?<=\d)\.(?=\d))+[.!?]+(?:["')\]]+)?|(?:[^.!?]|(?<=\d)\.(?=\d))+$/g;

/**
 * Splits narrative into trimmed, non-empty sentences without breaking a decimal figure.
 *
 * Returns `[text]` unchanged when the input holds no sentence at all (for example `"..."`), which
 * is the behaviour every caller already depended on.
 */
export function splitNarrativeSentences(text: string): string[] {
  const matched = text.match(NARRATIVE_SENTENCE_PATTERN);
  if (!matched) return [text];
  return matched.map((sentence) => sentence.trim()).filter(Boolean);
}

/**
 * The shape this module exists to prevent: a digit, a period, whitespace, a digit. Exported so a
 * test and a reader share one definition of "broken decimal" rather than each writing their own.
 */
export const BROKEN_DECIMAL_PATTERN = /\d\.\s+\d/g;

/** Counts broken decimals in a string. */
export function countBrokenDecimals(text: string): number {
  return text.match(BROKEN_DECIMAL_PATTERN)?.length ?? 0;
}
