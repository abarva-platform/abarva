// Pattern relevance binding — pure, deterministic, no I/O (no server-only, no
// data-plane imports) so it is unit-testable in isolation.
//
// Why this exists: the Lakeshore Intelligence brief previously bound each bet to
// the corpus pattern at its ARRAY POSITION (depth-ranked), with no relevance to
// the bet's use case. That let an off-domain pattern (e.g. the public-sector
// procurement pattern PAT-LSH-D18-00479) land on a treasury / Kyriba decision
// card. These helpers score candidates against the use case and FAIL CLOSED
// when nothing clears threshold — a decision binds a real, on-topic pattern or
// none, never an off-domain one.

export interface RelevancePatternRow {
  title: string;
  category?: string | null;
  vertical_overlays?: string[] | null;
  depth_score?: string | number | null;
}

const RELEVANCE_STOPWORDS = new Set<string>([
  'the', 'and', 'for', 'with', 'from', 'that', 'this', 'into', 'onto', 'over',
  'under', 'are', 'its', 'be', 'as', 'at', 'is', 'or', 'by', 'to', 'in', 'on',
  'of', 'an', 'lakeshore', 'holdings', 'private', 'portfolio', 'decision',
  'pattern', 'use', 'case', 'initiative', 'program', 'governed', 'corpus',
  'holdco', 'global', 'new', 'across',
]);

function relevanceTokens(text: string): Set<string> {
  const out = new Set<string>();
  for (const tok of text.toLowerCase().match(/[a-z0-9]+/g) ?? []) {
    if (tok.length > 2 && !RELEVANCE_STOPWORDS.has(tok)) out.add(tok);
  }
  return out;
}

function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Shared meaningful-token count between a use case and a pattern's text. */
export function patternRelevanceScore(useCaseText: string, patternText: string): number {
  const a = relevanceTokens(useCaseText);
  const b = relevanceTokens(patternText);
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const tok of a) if (b.has(tok)) shared += 1;
  return shared;
}

/** Minimum shared-token relevance a pattern must clear to bind to a bet. */
export const MIN_PATTERN_RELEVANCE = 1;

function rowText(row: RelevancePatternRow): string {
  return `${row.title} ${row.category ?? ''} ${(row.vertical_overlays ?? []).join(' ')}`;
}

/**
 * Select the candidate pattern rows genuinely relevant to a use case, ranked by
 * relevance then depth. Returns [] when nothing clears MIN_PATTERN_RELEVANCE —
 * the fail-closed guardrail. Generic so callers get their own row type back.
 */
export function selectRelevantPatternRows<T extends RelevancePatternRow>(
  useCaseText: string,
  rows: readonly T[],
  limit = 1,
): T[] {
  return rows
    .map((row) => ({ row, score: patternRelevanceScore(useCaseText, rowText(row)) }))
    .filter((candidate) => candidate.score >= MIN_PATTERN_RELEVANCE)
    .sort(
      (a, b) =>
        b.score - a.score || toNumber(b.row.depth_score) - toNumber(a.row.depth_score),
    )
    .slice(0, limit)
    .map((candidate) => candidate.row);
}
