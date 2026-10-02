// Exhibit content extractor — Stage 1 of extracting real "carries forward"
// signals from already-generated Move deliverables (see memory:
// project_moves_readiness_pack_and_generation_pipeline for why this exists).
//
// `golden-bar.ts`'s `extractExhibitKinds` already scans generated HTML for a
// fixed keyword vocabulary ("raci", "roadmap", "kpi", ...) to detect whether a
// required visual/table is PRESENT. This module answers the next question —
// given a keyword that's known to be present, what does that section
// actually SAY? Real generated Move deliverables are freeform, board-grade
// HTML (see solution-prompt-factory.ts) with no canonical section keys, so
// this is a heuristic heading/table locator, not a structured parser. A
// keyword with no matching heading or table returns null — never fabricated.

export interface ExhibitContentMatch {
  /** The literal heading or table-header text the keyword matched against. */
  heading: string;
  /** Plain-text content of the section/table that followed the match. */
  snippet: string;
}

const MAX_SNIPPET_LENGTH = 600;

function normalise(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const STOPWORDS = new Set(["the", "a", "an", "of", "and", "or", "to", "with", "for"]);

function keywordWords(keyword: string): string[] {
  return keyword
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 1 && !STOPWORDS.has(word));
}

/** Direct substring match, or (for multi-word keywords) every keyword word present. */
function headingMatchesKeyword(headingText: string, keyword: string): boolean {
  const normalisedHeading = normalise(headingText);
  if (normalisedHeading.includes(normalise(keyword))) return true;
  const words = keywordWords(keyword);
  return words.length > 0 && words.every((word) => normalisedHeading.includes(word));
}

function stripTags(html: string): string {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|tr|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}

function truncate(text: string): string {
  return text.length > MAX_SNIPPET_LENGTH
    ? `${text.slice(0, MAX_SNIPPET_LENGTH).trim()}…`
    : text;
}

const HEADING_RE = /<h([1-4])[^>]*>([\s\S]*?)<\/h\1>/gi;

function findHeadingMatch(html: string, keyword: string): ExhibitContentMatch | null {
  const headings: Array<{ index: number; end: number; level: number; text: string }> = [];
  let match: RegExpExecArray | null;
  HEADING_RE.lastIndex = 0;
  while ((match = HEADING_RE.exec(html)) !== null) {
    headings.push({
      index: match.index,
      end: HEADING_RE.lastIndex,
      level: Number(match[1]),
      text: stripTags(match[2]).trim(),
    });
  }

  const hit = headings.find((h) => headingMatchesKeyword(h.text, keyword));
  if (!hit) return null;

  const next = headings.find((h) => h.index > hit.index);
  const bodyEnd = next ? next.index : html.length;
  const body = stripTags(html.slice(hit.end, bodyEnd)).trim();
  if (!body) return null;

  return { heading: hit.text, snippet: truncate(body) };
}

const TABLE_RE = /<table[^>]*>([\s\S]*?)<\/table>/gi;
const TABLE_HEADER_CELL_RE = /<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi;

function findTableMatch(html: string, keyword: string): ExhibitContentMatch | null {
  let match: RegExpExecArray | null;
  TABLE_RE.lastIndex = 0;
  while ((match = TABLE_RE.exec(html)) !== null) {
    const tableHtml = match[1];
    const headerCells: string[] = [];
    let cellMatch: RegExpExecArray | null;
    TABLE_HEADER_CELL_RE.lastIndex = 0;
    const firstRowEnd = tableHtml.toLowerCase().indexOf("</tr>");
    const headerRowHtml = firstRowEnd >= 0 ? tableHtml.slice(0, firstRowEnd) : tableHtml;
    while ((cellMatch = TABLE_HEADER_CELL_RE.exec(headerRowHtml)) !== null) {
      headerCells.push(stripTags(cellMatch[1]).trim());
    }
    const headerText = headerCells.join(" ");
    const matches =
      headingMatchesKeyword(headerText, keyword) || headingMatchesKeyword(tableHtml.slice(0, 400), keyword);
    if (!matches) continue;
    const body = stripTags(tableHtml).trim();
    if (!body) continue;
    return { heading: headerText || `Table matching "${keyword}"`, snippet: truncate(body) };
  }
  return null;
}

// ── Markdown ──
//
// A deliverable accepted from a structured generated artifact is stored as
// Markdown ("## Section title" + body), not HTML. The HTML locators above find
// no headings and no tables in it, so every signal read from an accepted
// deliverable came back empty. These are the same two locators for Markdown.

const MARKDOWN_HEADING_RE = /^(#{1,4})[ \t]+(.+?)[ \t]*#*[ \t]*$/gm;

function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/^[ \t]*\|?[ \t]*:?-{3,}:?[ \t]*(\|[ \t]*:?-{3,}:?[ \t]*)*\|?[ \t]*$/gm, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/(\*\*|__|`)/g, "")
    .replace(/^[ \t]*(?:[-*+]|\d+[.)])[ \t]+/gm, "")
    .replace(/^[ \t]*\|[ \t]*/gm, "")
    .replace(/[ \t]*\|[ \t]*$/gm, "")
    .replace(/[ \t]*\|[ \t]*/g, " | ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}

function findMarkdownHeadingMatch(markdown: string, keyword: string): ExhibitContentMatch | null {
  const headings: Array<{ index: number; end: number; text: string }> = [];
  let match: RegExpExecArray | null;
  MARKDOWN_HEADING_RE.lastIndex = 0;
  while ((match = MARKDOWN_HEADING_RE.exec(markdown)) !== null) {
    headings.push({
      index: match.index,
      end: MARKDOWN_HEADING_RE.lastIndex,
      text: stripMarkdown(match[2]),
    });
  }

  const hit = headings.find((h) => headingMatchesKeyword(h.text, keyword));
  if (!hit) return null;

  const next = headings.find((h) => h.index > hit.index);
  const body = stripMarkdown(markdown.slice(hit.end, next ? next.index : markdown.length));
  if (!body) return null;

  return { heading: hit.text, snippet: truncate(body) };
}

function isMarkdownTableRow(line: string): boolean {
  return /^[ \t]*\|.*\|[ \t]*$/.test(line);
}

function findMarkdownTableMatch(markdown: string, keyword: string): ExhibitContentMatch | null {
  const lines = markdown.split("\n");
  for (let start = 0; start < lines.length; start += 1) {
    if (!isMarkdownTableRow(lines[start])) continue;
    let end = start;
    while (end + 1 < lines.length && isMarkdownTableRow(lines[end + 1])) end += 1;
    const tableLines = lines.slice(start, end + 1);
    const headerText = stripMarkdown(tableLines[0]).replace(/ \| /g, " ");
    const tableText = stripMarkdown(tableLines.join("\n"));
    start = end;
    // A table is a header, a separator and at least one row.
    if (tableLines.length < 3) continue;
    const matches =
      headingMatchesKeyword(headerText, keyword) ||
      headingMatchesKeyword(tableText.slice(0, 400), keyword);
    if (!matches || !tableText) continue;
    return { heading: headerText || `Table matching "${keyword}"`, snippet: truncate(tableText) };
  }
  return null;
}

/**
 * Given real generated deliverable content (HTML, or Markdown for a
 * deliverable accepted from a structured artifact) and a keyword known to be present
 * (typically one of `golden-bar.ts`'s `extractExhibitKinds` markers), locate
 * the nearest heading or table associated with that keyword and return its
 * real text content. Returns `null` when no matching heading or table is
 * found — this is a heuristic locator over freeform board-grade HTML, not a
 * guaranteed structured parse, so absence must surface honestly rather than
 * be papered over.
 */
export function extractExhibitContent(html: string, keyword: string): ExhibitContentMatch | null {
  if (!html || !keyword.trim()) return null;
  return (
    findHeadingMatch(html, keyword) ??
    findTableMatch(html, keyword) ??
    findMarkdownHeadingMatch(html, keyword) ??
    findMarkdownTableMatch(html, keyword)
  );
}
