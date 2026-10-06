/**
 * Derive the material claims the deck must preserve, from the governed document.
 *
 * Deterministic and deliberately narrow. These are read from the recommendation
 * and next actions — the parts of the artifact that ARE the decision — not from
 * the whole narrative, because a gate that demanded every figure in an 8,000-word
 * document appear on a 15-slide deck would be demanding the deck not be a deck.
 *
 * What this cannot do: recognise a selected option the document names only in
 * prose it did not capitalise. The extractor reports what it found, the caller
 * can add to it, and the count is in the verdict so a run with zero options
 * checked does not read as a run with zero options missing.
 */

import type { MaterialClaims } from './cross-projection';

const DECISION_VERBS = ['approve', 'fund', 'hold', 'endorse', 'authorise', 'authorize', 'commit', 'defer'];
const MONEY = /\$\s?\d{1,3}(?:,\d{3})*(?:\.\d+)?\s?(?:bn|b|billion|m|mm|million|k)?/gi;
const PERCENT = /\d+(?:\.\d+)?\s?%/g;
const ISO_DATE = /\b(?:19|20)\d{2}-\d{2}-\d{2}\b/g;
/** "the Selective Replatform pattern", "Option B approach". */
const OPTION = /\b((?:[A-Z][\w-]+)(?:\s+[A-Z][\w-]+){0,3})\s+(?:pattern|option|approach|model|architecture)\b/g;
const OWNER =
  /\b((?:Chief|SVP|VP|Head of|Director of|Group)\s+[A-Z][\w&-]*(?:\s+[A-Z&][\w&-]*){0,3}|[A-Z][\w-]+(?:\s+[A-Z][\w-]+){0,3}\s+(?:Committee|Board|Council))\b/g;

function uniq(values: string[]): string[] {
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))];
}

/**
 * Strip a leading article.
 *
 * The owner pattern matched "The Architecture Steering Committee", and the deck
 * writes "Architecture Steering Committee" — so the gate would have reported a
 * lost owner that was on the slide in front of it. A false failure costs more
 * than the article is worth.
 */
function stripArticle(value: string): string {
  return value.replace(/^(?:the|a|an)\s+/i, '');
}

export function deriveMaterialClaims(input: {
  recommendation: string;
  nextActions: string[];
}): MaterialClaims {
  const decisionText = [input.recommendation, ...input.nextActions].join('\n');
  const lower = decisionText.toLowerCase();

  return {
    askTerms: DECISION_VERBS.filter((v) => lower.includes(v)),
    selectedOptions: uniq([...input.recommendation.matchAll(OPTION)].map((m) => m[1])),
    headlineFigures: uniq([
      ...(input.recommendation.match(MONEY) ?? []),
      ...(input.recommendation.match(PERCENT) ?? []),
    ]),
    materialDates: uniq(decisionText.match(ISO_DATE) ?? []),
    owners: uniq([...decisionText.matchAll(OWNER)].map((m) => stripArticle(m[1]))),
  };
}
