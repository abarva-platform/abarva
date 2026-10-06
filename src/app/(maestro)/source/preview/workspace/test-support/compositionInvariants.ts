/**
 * Composition invariants for a rendered Contract 360 surface.
 *
 * Every defect worth fixing on this product in one working day was found by
 * reading the deployed page, and the suite passed all of them — because each
 * render is correct in isolation and the falsehood only exists in composition.
 * A governed sentence is true; the same governed sentence four times on one
 * tab is not a statement, it is noise that reads as emphasis. An identifier is
 * a correct value; an identifier in a provenance line is builder vocabulary in
 * front of an executive.
 *
 * These two assertions are deliberately cheap and structural. They do not
 * check that a surface says the right thing. They check that it does not say
 * one thing twice, and that it does not leak the vocabulary of the machine.
 */

/**
 * The DOM's visible text, with a boundary between separate elements.
 *
 * `textContent` concatenates adjacent elements with nothing between them, so
 * `</p><p>` yields "…declares it.This archetype…" — one run with no space
 * after the period. Sentence splitting then merges the two into a single
 * string and a duplicate never registers, which would have made this whole
 * check silently useless on a real render. Walking the text nodes and joining
 * them restores the boundary a reader sees.
 */
function visibleText(root: HTMLElement): string {
  const walker = root.ownerDocument.createTreeWalker(
    root,
    root.ownerDocument.defaultView?.NodeFilter.SHOW_TEXT ?? 4,
  );
  const parts: string[] = [];
  let node = walker.nextNode();
  while (node) {
    const text = node.textContent?.trim();
    if (text) parts.push(text);
    node = walker.nextNode();
  }
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

/**
 * The canonical-record column documents real table and column names on
 * purpose — it is schema, shown as schema, under a heading that says so.
 * Anything else rendering an identifier is the defect this catches.
 */
const IDENTIFIER_EXEMPT_SELECTORS = [".sw-c3-anatomy-canonical"];

function textWithoutExemptRegions(root: HTMLElement): string {
  const clone = root.cloneNode(true) as HTMLElement;
  for (const selector of IDENTIFIER_EXEMPT_SELECTORS) {
    for (const node of clone.querySelectorAll(selector)) node.remove();
  }
  return visibleText(clone);
}

/**
 * A lowercase run joined by underscores is an identifier, never prose.
 *
 * Contract and document ids are upper case and hyphenated, so they do not
 * match. This caught `system_generated_from_reviewed_sources` in a provenance
 * line and `contract_pdf` in a lane caption.
 */
export function expectNoIdentifierLeak(root: HTMLElement): void {
  const text = textWithoutExemptRegions(root);
  const found = Array.from(
    new Set(text.match(/\b[a-z0-9]+(?:_[a-z0-9]+)+\b/g) ?? []),
  );
  if (found.length > 0) {
    throw new Error(
      `Identifier reached the reader's surface: ${found.join(", ")}. ` +
        "Translate it into words, or strip it — an unrecognised value must not " +
        "leak snake_case onto a governed surface.",
    );
  }
}

/**
 * Long enough that a coincidence is implausible.
 *
 * Short strings repeat legitimately — column headings, state chips, a lane
 * name beside its count. An eight-word sentence appearing twice on one screen
 * is the same claim told twice.
 *
 * Twelve was the first threshold tried and it caught nothing in a real render:
 * much of the governed prose on these surfaces is eight to eleven words, so
 * the check passed a deliberately introduced duplication. Eight bites on that
 * mutation and still leaves every legitimate repeat in the existing fixtures
 * alone.
 */
const MIN_WORDS = 8;

function governedSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.split(/\s+/).length >= MIN_WORDS);
}

/**
 * No governed sentence twice on one surface.
 *
 * This is the invariant the suite was missing. It caught the applicability
 * reason four times on Performance, the archetype paragraph four times on
 * Education, the lever list restated on all three Optimize sub-tabs, and the
 * evidence-basis clause in both columns on Story.
 */
export function expectNoRepeatedGovernedSentence(root: HTMLElement): void {
  const counts = new Map<string, number>();
  for (const sentence of governedSentences(visibleText(root))) {
    counts.set(sentence, (counts.get(sentence) ?? 0) + 1);
  }
  const repeated = [...counts.entries()].filter(([, n]) => n > 1);
  if (repeated.length > 0) {
    const detail = repeated
      .map(([sentence, n]) => `${n}x "${sentence.slice(0, 90)}…"`)
      .join("; ");
    throw new Error(
      `A governed sentence is stated more than once on one surface: ${detail}. ` +
        "Decide which column owns it; a second telling is not a second fact.",
    );
  }
}

/** Both invariants, for a surface that should satisfy them together. */
export function expectCleanComposition(root: HTMLElement): void {
  expectNoIdentifierLeak(root);
  expectNoRepeatedGovernedSentence(root);
}
