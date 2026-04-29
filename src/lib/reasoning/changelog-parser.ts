// Reasoning changelog parser.
//
// Pure-function parser for the raw `git log` output produced by
// `scripts/generate-reasoning-changelog.ts`. Kept in `src/lib/reasoning`
// so it can be tested by the same Jest config as the rest of the
// reasoning runtime, and so consumers can import the typed result
// alongside the generated JSON fixture.
//
// The script invokes git with `--pretty=format:"%H|%s|%an|%aI"`. Each
// raw line therefore has the shape:
//
//   <sha>|<subject>|<author>|<iso8601-date>
//
// The parser is deterministic — given the same raw input it always
// emits the same entries in the same order (preserving git's order,
// which is newest-first by default).

export type ReasoningCommitKind =
  | 'feat'
  | 'fix'
  | 'refactor'
  | 'docs'
  | 'chore';

export interface ReasoningCommitEntry {
  /** Full git commit SHA. */
  sha: string;
  /** Raw subject line as committed. */
  subject: string;
  /** Author display name. */
  author: string;
  /** ISO-8601 timestamp from `%aI`. */
  date: string;
  /** Pull request number parsed from a trailing `(#NNN)`, or null. */
  prNumber: number | null;
  /** Conventional-commit kind extracted from the prefix. */
  kind: ReasoningCommitKind;
  /** Subject minus the `kind(scope):` prefix and trailing PR number. */
  short: string;
}

export interface ReasoningChangelog {
  /** ISO-8601 timestamp at which the JSON fixture was generated. */
  generatedAt: string;
  /** Newest-first list of reasoning-layer commits. */
  entries: ReadonlyArray<ReasoningCommitEntry>;
}

const KIND_PATTERN = /^(feat|fix|refactor|docs|chore)\s*\(reasoning\)\s*:/i;
const PREFIX_PATTERN = /^(feat|fix|refactor|docs|chore)\s*\(reasoning\)\s*:\s*/i;
const PR_PATTERN = /\s*\(#(\d+)\)\s*$/;

const ALLOWED_KINDS: ReadonlyArray<ReasoningCommitKind> = [
  'feat',
  'fix',
  'refactor',
  'docs',
  'chore',
];

function isReasoningCommitKind(value: string): value is ReasoningCommitKind {
  return (ALLOWED_KINDS as ReadonlyArray<string>).includes(value);
}

/**
 * Parse a single `git log` line of the shape `<sha>|<subject>|<author>|<aI>`.
 *
 * Returns null if the line is empty, malformed, or does not carry a
 * recognised conventional-commit kind. The script filter already
 * narrows to `(reasoning)` commits, but defensive null-on-malformed
 * lets us tolerate the trailing newline `git` emits without losing
 * data.
 */
export function parseReasoningCommitLine(
  raw: string,
): ReasoningCommitEntry | null {
  const line = raw.trim();
  if (line.length === 0) {
    return null;
  }

  // Subjects can contain `|` in rare edge cases (parens, em-dashes).
  // Split into at most 4 fields by anchoring on the first 3 separators.
  const firstSep = line.indexOf('|');
  if (firstSep < 0) return null;
  const secondSep = line.indexOf('|', firstSep + 1);
  if (secondSep < 0) return null;
  const lastSep = line.lastIndexOf('|');
  if (lastSep <= secondSep) return null;

  const sha = line.slice(0, firstSep).trim();
  const author = line.slice(secondSep + 1, lastSep).trim();
  const date = line.slice(lastSep + 1).trim();

  // Subject is whatever sits between the first and the second-to-last
  // separator. We use lastIndexOf to make the date split unambiguous,
  // then take `secondSep` (the first `|` after sha) only if there are
  // exactly three separators. Recompute by taking everything between
  // the first separator and the lastSep, then peeling the trailing
  // `<author>|<date>` we've already extracted.
  const middle = line.slice(firstSep + 1, lastSep);
  const lastAuthorSep = middle.lastIndexOf('|');
  if (lastAuthorSep < 0) return null;
  const subject = middle.slice(0, lastAuthorSep).trim();

  if (sha.length === 0 || subject.length === 0 || author.length === 0 || date.length === 0) {
    return null;
  }

  const kindMatch = KIND_PATTERN.exec(subject);
  if (!kindMatch) return null;
  const rawKind = kindMatch[1].toLowerCase();
  if (!isReasoningCommitKind(rawKind)) return null;

  const prMatch = PR_PATTERN.exec(subject);
  const prNumber = prMatch ? Number.parseInt(prMatch[1], 10) : null;

  const short = subject
    .replace(PREFIX_PATTERN, '')
    .replace(PR_PATTERN, '')
    .trim();

  return {
    sha,
    subject,
    author,
    date,
    prNumber,
    kind: rawKind,
    short,
  };
}

/**
 * Parse the full `git log` block produced by the generator script.
 * Order is preserved — git emits newest-first.
 */
export function parseReasoningCommitLog(raw: string): ReadonlyArray<ReasoningCommitEntry> {
  const lines = raw.split('\n');
  const entries: ReasoningCommitEntry[] = [];
  for (const line of lines) {
    const entry = parseReasoningCommitLine(line);
    if (entry) entries.push(entry);
  }
  return entries;
}
