/**
 * Explicit claim prohibitions, checked against the RENDERED deck.
 *
 * Some governed corpora carry, per row, the claims an artifact must not make —
 * "do not claim a production longitudinal patient view exists", "do not claim
 * automation savings without baseline and adoption evidence". These are the
 * sharpest governance signal available: not a fact to cite, but an assertion the
 * client has said is unsupported.
 *
 * Matching them is a detection problem, not a string-equality one. A prohibition
 * is written as an instruction ("Do not claim X is implemented") and a violation
 * is written as an assertion ("the medallion architecture is implemented"), so
 * comparing the sentences finds nothing. What transfers is the SUBJECT plus the
 * CLAIM VERB: the distinctive terms of the thing, near a word that asserts it
 * exists, is proven, or is delivering.
 *
 * This is deliberately a HIGH-RECALL, reviewable check rather than a confident
 * one. It reports candidates with the sentence that triggered them and says so;
 * a gate that silently decided a prohibition was respected would be worse than
 * no gate, because the prohibition is exactly the thing nobody re-reads.
 */

import type { InspectedDeck } from '../orchestrator/deck-inspection';

export interface ProhibitionFinding {
  prohibition: string;
  slide: number;
  sentence: string;
  matchedTerms: string[];
  assertionVerb: string;
}

export interface ProhibitionVerdict {
  /** No candidate violations. Not a guarantee — see the file comment. */
  clean: boolean;
  prohibitionsChecked: number;
  sentencesScanned: number;
  findings: ProhibitionFinding[];
}

/** Words that turn a subject into a claim about its existence or performance. */
const ASSERTION = new RegExp(
  '\\b(is|are|was|were|has|have|delivers?|delivered|achieves?|achieved|' +
    'proven|proves?|demonstrated|implemented|live|in production|production-ready|' +
    'operational|established|audited|certified|validated|realis(?:ed|es)|realiz(?:ed|es)|' +
    'saves?|saved|savings of|reduces?|reduced|improves?|improved)\\b',
  'i',
);

/** Negations that turn an assertion back into a denial — the safe form. */
const NEGATION = /\b(not|no|never|without|cannot|can't|isn't|aren't|lacks?|absent|missing|unproven|un\w+ed|before|until|pending|required|requires)\b/i;

const STOP = new Set([
  'do', 'not', 'claim', 'claims', 'cite', 'state', 'assert', 'say', 'the', 'a', 'an', 'is', 'are',
  'was', 'were', 'has', 'have', 'been', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'with',
  'without', 'any', 'all', 'that', 'this', 'it', 'as', 'at', 'by', 'from', 'real', 'evidence',
  'production', 'ready', 'exists', 'exist', 'implemented', 'audited',
]);

function subjectTerms(prohibition: string): string[] {
  return [
    ...new Set(
      prohibition
        .toLowerCase()
        .replace(/[^a-z0-9\s/-]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 3 && !STOP.has(w)),
    ),
  ];
}

function sentences(deck: InspectedDeck): { slide: number; text: string }[] {
  const out: { slide: number; text: string }[] = [];
  for (const slide of deck.slides) {
    for (const run of slide.textRuns) {
      for (const part of run.split(/(?<=[.;:])\s+|\s{2,}/)) {
        const text = part.trim();
        if (text.length > 12) out.push({ slide: slide.index, text });
      }
    }
  }
  return out;
}

export function checkProhibitions(deck: InspectedDeck, prohibitions: string[]): ProhibitionVerdict {
  const scanned = sentences(deck);
  const findings: ProhibitionFinding[] = [];

  for (const prohibition of prohibitions) {
    const terms = subjectTerms(prohibition);
    if (terms.length === 0) continue;
    for (const { slide, text } of scanned) {
      const lower = text.toLowerCase();
      const hits = terms.filter((t) => lower.includes(t));
      // Two distinctive terms, not one: a single shared word like "clinical"
      // appears on half the deck and would flag everything, which trains a
      // reader to ignore the check.
      if (hits.length < 2) continue;
      const assertion = text.match(ASSERTION);
      if (!assertion) continue;
      // "No certified medallion architecture" carries the subject and a verb but
      // denies it. Denying a prohibited claim is the compliant form.
      if (NEGATION.test(text)) continue;
      findings.push({
        prohibition,
        slide,
        sentence: text.slice(0, 200),
        matchedTerms: hits,
        assertionVerb: assertion[0],
      });
    }
  }

  return {
    clean: findings.length === 0,
    prohibitionsChecked: prohibitions.length,
    sentencesScanned: scanned.length,
    findings,
  };
}
