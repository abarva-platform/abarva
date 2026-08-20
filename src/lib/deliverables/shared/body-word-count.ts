// Prose word counting — what a word band is actually measuring.
//
// A word band is a discipline on ARGUMENT length: how much prose a reader has
// to work through to reach the decision. Tables, exhibits and appendices are
// not argument. Counting them makes a well-exhibited document look bloated and
// pushes authors toward fewer tables and more paragraphs — the exact opposite
// of the visual-first standard every artifact contract asks for.
//
// Both quality pipelines historically counted everything: the orchestrated
// validator concatenates section markdown (so in-body markdown tables count),
// and the golden bar strips HTML tags but keeps table cell text. This module
// gives them one shared definition of "prose", so a band can be tightened
// without silently penalising exhibits.
//
// Opt-in by design: `QualityBar.excludeNonProseFromBody` gates it, so existing
// artifact bands calibrated against whole-body counts keep their current
// behavior until each is deliberately re-calibrated.
//
// Pure module: no I/O.

/**
 * Headings that mark supporting material rather than argument. An appendix is
 * reference the reader consults, not prose they must read to decide.
 */
// `(?![\w-])` rather than `\b`: a trailing `\b` matches at a hyphen, so
// "Appendix-free summary" would be classified as an appendix and dropped from
// the body count. The lookahead requires the heading word to actually end.
const APPENDIX_HEADING_RE =
  /^\s*(?:\d+[.)]\s*)?(?:appendices|appendix|annexes|annex|exhibits|exhibit|source register|evidence register|glossary|references|reference)(?![\w-])/i;

/** True when a section heading marks supporting material rather than argument. */
export function isAppendixHeading(title: string): boolean {
  return APPENDIX_HEADING_RE.test(title);
}

/**
 * Remove everything from markdown that is not prose:
 * - fenced blocks (exhibit specs, code, embedded SVG)
 * - markdown table rows and their alignment separators
 * - HTML tags and any inline `<table>`/`<svg>` blocks
 *
 * Deliberately conservative: it strips whole constructs rather than trying to
 * parse them, because an over-count is a worse failure than an under-count
 * here — an over-count blocks a good document.
 */
export function stripNonProseMarkdown(markdown: string): string {
  return (
    markdown
      // Fenced blocks, including unterminated ones at the end of a section.
      .replace(/```[\s\S]*?(?:```|$)/g, " ")
      .replace(/~~~[\s\S]*?(?:~~~|$)/g, " ")
      // Inline HTML tables and SVG, whole.
      .replace(/<table[\s\S]*?<\/table>/gi, " ")
      .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
      // Markdown table rows: any line whose first non-space character is a pipe.
      .replace(/^[ \t]*\|.*$/gm, " ")
      // Remaining HTML tags (keep their text content — that may be prose).
      .replace(/<[^>]+>/g, " ")
  );
}

/** Count whitespace-delimited tokens. */
function countTokens(text: string): number {
  return (text.trim().match(/\S+/g) ?? []).length;
}

export interface ProseSection {
  title: string;
  bodyMarkdown: string;
}

/**
 * Count the prose words a reader must actually read.
 *
 * `excludeNonProse: false` reproduces the legacy whole-body count exactly
 * (title + body, tables and all), so callers can switch on the flag without
 * changing behavior for artifacts that have not been re-calibrated.
 */
export function countBodyWords(
  sections: readonly ProseSection[],
  options: { excludeNonProse: boolean },
): number {
  if (!options.excludeNonProse) {
    return countTokens(
      sections.map((s) => `${s.title}\n${s.bodyMarkdown}`).join("\n\n"),
    );
  }
  return sections
    .filter((s) => !isAppendixHeading(s.title))
    .reduce(
      (total, s) => total + countTokens(stripNonProseMarkdown(s.bodyMarkdown)),
      0,
    );
}

/**
 * The HTML equivalent, for the golden-bar pipeline. Drops script, style,
 * table and SVG blocks whole, then strips remaining tags.
 */
export function countBodyWordsFromHtml(
  html: string,
  options: { excludeNonProse: boolean },
): number {
  const withoutInert = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ");
  const stripped = options.excludeNonProse
    ? withoutInert
        .replace(/<table[\s\S]*?<\/table>/gi, " ")
        .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    : withoutInert;
  return countTokens(stripped.replace(/<[^>]+>/g, " "));
}
