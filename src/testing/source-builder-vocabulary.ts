/**
 * Item U-400 / `N3` in the Source master backlog: builder vocabulary must not
 * ship on a Source surface a client reads.
 *
 * This lives in `src/testing/` rather than `src/lib/` deliberately. It is a
 * control, so nothing in the product calls it, and `audit:lib-orphans` is
 * right to refuse a `src/lib` module that only a test reaches. Baselining that
 * refusal would have declared the defect normal; moving the module says what
 * is actually true — this is test infrastructure.
 *
 * The item is the **class**, not the two strings the master backlog names as
 * examples. This module defines that class once so a control can be run over
 * **rendered output** rather than over source text. That distinction is the
 * whole point of the item: a string in a file that no mounted route reaches is
 * not a shipped defect, and a term assembled at runtime from parts is one a
 * grep never sees. Give this function the text a surface actually produced.
 *
 * ## What counts
 *
 * Two rules, and each is here because it can be decided from the text alone.
 *
 * 1. **Identifier shape.** A token carrying an internal word separator —
 *    `snake_case` or `SCREAMING_SNAKE` — is a key, not English. No English
 *    word and no product name has an underscore inside it, which is what makes
 *    this rule safe to run against arbitrary client-facing prose.
 * 2. **The named phrases.** `internal stage key` and `compatibility key` are
 *    the two examples the master backlog names. They are ordinary words in an
 *    extraordinary place: they describe our storage to someone who does not
 *    have one.
 *
 * ## What deliberately does NOT count, and why it was measured rather than assumed
 *
 * `camelCase` is **not** in the class. It looks like it should be — `stageKey`
 * rendered as prose would plainly be builder vocabulary — but every camelCase
 * token found in a rendered-text position across the 168 `.tsx` files
 * reachable from the 38 mounted Source route roots was the product's own agent
 * name, `aVa`. Including the shape would have bought zero true positives and
 * one false positive per Source screen.
 *
 * That is the defect item 39 already paid for once: a guard that rejects an
 * ordinary word costs more than the term it was written to catch, because the
 * people it blocks are the people writing the client-facing copy. So the
 * mutation proof for this module runs in **both** directions — re-introducing
 * a key must fail, and ordinary English using the same words must not.
 *
 * **Stated gap:** because camelCase is out, a camelCase key assembled at
 * runtime and rendered would pass this control. Nothing found one; nothing
 * rules one out either. The rendered-output harness is the layer that would
 * see it, so the gap narrows by covering more surfaces, not by widening the
 * shape rule and re-acquiring item 39's defect.
 */

import { SOURCE_STAGE_LABELS } from "@/lib/source/constants";

export interface BuilderVocabularyOccurrence {
  /** The offending token exactly as it was rendered. */
  readonly term: string;
  /** Which rule matched — useful when a control reports what it found. */
  readonly rule: "identifier-shape" | "named-phrase";
  /**
   * The canonical client-facing wording, when the rail already publishes one
   * for this exact key. Absent means the replacement is a product decision
   * rather than a rename, and U-400 says to surface those and leave them.
   */
  readonly canonicalLabel?: string;
  /** Character offset of the term within the text that was scanned. */
  readonly index: number;
}

/**
 * Keys the rail already publishes a client-facing label for. Read from
 * `SOURCE_STAGE_LABELS` rather than typed out, so a stage added later is
 * covered without touching this file — the governance rule that tenants and
 * canonical keys come from code, not from a hand-maintained list.
 */
const CANONICAL_LABEL_BY_KEY: ReadonlyMap<string, string> = new Map(
  Object.entries(SOURCE_STAGE_LABELS).map(([key, label]) => [key, label]),
);

const NAMED_PHRASES = ["internal stage key", "compatibility key"] as const;

/**
 * A token with an internal underscore. The boundaries are deliberately not
 * `\b`: `\b` treats `_` as a word character, so `\bfoo_bar\b` also matches
 * inside `a_foo_bar_b` and reports a fragment rather than the token. Matching
 * the whole run and then testing it keeps the reported term equal to what was
 * rendered.
 */
const TOKEN_RUN = /[A-Za-z0-9_]+/g;

/** A filename — `vendor_response.xlsx` is client data, not our vocabulary. */
const FILENAME_TAIL = /^\.[A-Za-z0-9]{1,8}\b/;

/**
 * Require a letter before and after some underscore. `2026_09` — a date
 * fragment in client data — does not qualify, and neither does a bare `_`
 * used as padding. `_tower_watch` does, because the key is in there.
 */
function hasInternalUnderscore(token: string): boolean {
  return /[A-Za-z][A-Za-z0-9]*_[A-Za-z0-9]*[A-Za-z]/.test(token);
}

/**
 * Find builder vocabulary in text a surface actually rendered.
 *
 * Pass `container.textContent` from a render, or the text extracted from a
 * live page — not a source file. Scanning source is the measurement this item
 * exists to replace.
 */
export function findBuilderVocabulary(
  renderedText: string | null | undefined,
): BuilderVocabularyOccurrence[] {
  if (!renderedText) return [];
  const occurrences: BuilderVocabularyOccurrence[] = [];

  TOKEN_RUN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = TOKEN_RUN.exec(renderedText)) !== null) {
    const token = match[0];
    if (!hasInternalUnderscore(token)) continue;

    const after = renderedText.slice(match.index + token.length);
    if (FILENAME_TAIL.test(after)) continue;

    // A token that sits either side of an `@`, or under a path separator,
    // belongs to an address or a path the client supplied, not to our
    // vocabulary. The leading `@` alone is not enough: an email's LOCAL part
    // comes before it, which is how `a_buyer@vendor.example` slipped through
    // the first draft of this guard.
    if (after.startsWith("@")) continue;
    const before = renderedText.slice(Math.max(0, match.index - 1), match.index);
    if (before === "@" || before === "/" || before === ".") continue;

    occurrences.push({
      term: token,
      rule: "identifier-shape",
      canonicalLabel: CANONICAL_LABEL_BY_KEY.get(token.toLowerCase()),
      index: match.index,
    });
  }

  const lowered = renderedText.toLowerCase();
  for (const phrase of NAMED_PHRASES) {
    let from = 0;
    for (;;) {
      const at = lowered.indexOf(phrase, from);
      if (at === -1) break;
      occurrences.push({
        term: renderedText.slice(at, at + phrase.length),
        rule: "named-phrase",
        index: at,
      });
      from = at + phrase.length;
    }
  }

  return occurrences.sort((a, b) => a.index - b.index);
}

/** One line per occurrence, for a control's failure message. */
export function describeBuilderVocabulary(
  occurrences: readonly BuilderVocabularyOccurrence[],
): string {
  return occurrences
    .map((o) =>
      o.canonicalLabel
        ? `${o.term} (${o.rule}) — the rail already publishes "${o.canonicalLabel}" for this key`
        : `${o.term} (${o.rule}) — no canonical label; replacing it is a product decision`,
    )
    .join("\n");
}
