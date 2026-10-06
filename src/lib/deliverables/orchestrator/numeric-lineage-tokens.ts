// The figures the numeric-lineage check examines, and how two renderings of
// the same figure are recognised as equal.
//
// One definition, used by the citation repair (which adds a citation when
// every figure in a sentence matches governed evidence) and by the quality
// gate's blocker message (which names the figures that matched nothing).

import type { GovernedEvidenceItem } from "./types";

export const FACT_TOKEN_RE =
  /(\$\s?\d[\d,]*(?:\.\d+)?[kmb]?|\b\d{1,3}(?:,\d{3})+\b|\b\d+(?:\.\d+)?%|\bFY?20\d\d\b|\b\d{4}-\d{2}-\d{2}\b)/gi;

export function normalizeFactToken(value: string): string {
  return value.toLowerCase().replace(/[\s,$]/g, "");
}

export function factTokens(value: string): string[] {
  const matches = value.match(FACT_TOKEN_RE) ?? [];
  return Array.from(new Set(matches.map(normalizeFactToken)));
}

/**
 * The figures in a sentence that match no governed evidence, as written.
 *
 * Same tokens and same exact-match rule as the citation repair. This changes
 * nothing about what is supported; it names what was not, so a blocked table
 * can be read. Before this, the blocker quoted the first characters of the
 * table and left the reader to guess which figure in it had failed to trace.
 */
export function untracedFigures(
  sentence: string,
  evidence: readonly GovernedEvidenceItem[],
): string[] {
  const backed = new Set(
    evidence.flatMap((item) => factTokens(`${item.label} ${item.statement}`)),
  );
  const seen = new Set<string>();
  const untraced: string[] = [];
  for (const raw of sentence.match(FACT_TOKEN_RE) ?? []) {
    const token = normalizeFactToken(raw);
    if (backed.has(token) || seen.has(token)) continue;
    seen.add(token);
    untraced.push(raw.trim());
  }
  return untraced;
}
