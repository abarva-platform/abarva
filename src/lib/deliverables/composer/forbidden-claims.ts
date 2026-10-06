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

/**
 * A sentence that carries the very qualifier a prohibition demands is the
 * compliant form, not a violation.
 *
 * "Every one is labelled a synthetic planning figure" was flagged against "do
 * not present the cost or KPI figures as measured" — it is the most compliant
 * sentence in the deck. So was a list of the artifacts required before a claim
 * can be made.
 */
const COMPLIANCE =
  /\b(synthetic|planning figure|planning-grade|not measured|unvalidated|not validated|unaudited|hypothes[ie]s|not finance-confirmed|not attested|requires? (?:proof|evidence|attestation|validation)|labelled|labeled|marked as|stated as|before any claim|pending|requested|artifacts?|to be provided|open input)\b/i;

/**
 * Denial by quantity.
 *
 * "$0 of the $8.0M promised value is validated" denies the claim using a number
 * rather than a negation word, and the first version of the negation list had no
 * notion of zero. Three of four false positives on one deck were this shape.
 */
const ZERO_QUANTITY = /(^|[\s(])(\$\s?0(?![.\d])|0(?![.\d])\s+(?:of|out of)\b|zero\b|none of\b|nil\b)/i;

/** Negations that turn an assertion back into a denial — the safe form. */
const NEGATION =
  /\b(not|no|never|none|nothing|zero|without|cannot|can't|isn't|aren't|lacks?|absent|missing|unproven|unvalidated|un\w+ed|before|until|pending|require[sd]?|must|should|would|only after|only once|yet to|not yet|if |when |subject to|conditional)\b/i;

const STOP = new Set([
  'do', 'not', 'claim', 'claims', 'cite', 'state', 'assert', 'say', 'the', 'a', 'an', 'is', 'are',
  'was', 'were', 'has', 'have', 'been', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'with',
  'without', 'any', 'all', 'that', 'this', 'it', 'as', 'at', 'by', 'from', 'real', 'evidence',
  'production', 'ready', 'exists', 'exist', 'implemented', 'audited', 'cannot', 'create',
  'unless', 'until', 'yes', 'no',
]);

/**
 * The first few subject terms — what the prohibition is ABOUT.
 *
 * "Interview context cannot create approved funding or value claims" was matched
 * by a sentence citing approved funding from a budget record. It shares the
 * prohibition's predicate and none of its subject: the sentence never mentions
 * interviews or context. A sentence has to engage what the item is about, not
 * merely reuse the words that follow it.
 */
function leadTerms(prohibition: string): Set<string> {
  // Two, not three. At three, "approved" was the third term of "Interview
  // context cannot create approved funding..." and a sentence citing approved
  // funding from a budget record still matched. The subject of that item is
  // "interview context", and it stops there.
  return new Set(subjectTerms(prohibition).slice(0, 2));
}

function subjectTerms(prohibition: string): string[] {
  return [
    ...new Set(
      prohibition
        .toLowerCase()
        // Split on the slash too. "HEDIS/STAR outputs are audited" tokenised as
        // one term "hedis/star", so a deck saying "HEDIS and STAR outputs are
        // audited" matched only "outputs" and fell below the two-term floor —
        // a planted violation the detector missed.
        .replace(/[^a-z0-9\s-]/g, ' ')
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

const MIN_SENTENCE_WORDS = 6;
/** A term appearing in more prohibitions than this is boilerplate, not a subject. */
const RARE_MAX_PROHIBITIONS = 2;

export function checkProhibitions(deck: InspectedDeck, prohibitions: string[]): ProhibitionVerdict {
  const scanned = sentences(deck);
  const findings: ProhibitionFinding[] = [];

  // How many prohibitions each term appears in. Governance corpora repeat words
  // like "value", "claim", "approved" and "funding" across most of their
  // prohibitions; a sentence matching only those has matched the vocabulary of
  // the list, not the subject of any one item.
  const docFreq = new Map<string, number>();
  for (const p of prohibitions) {
    for (const t of new Set(subjectTerms(p))) docFreq.set(t, (docFreq.get(t) ?? 0) + 1);
  }

  for (const prohibition of prohibitions) {
    const terms = subjectTerms(prohibition);
    if (terms.length === 0) continue;
    const lead = leadTerms(prohibition);
    for (const { slide, text } of scanned) {
      const lower = text.toLowerCase();
      const hits = terms.filter((t) => lower.includes(t));
      // Two terms, not one: a single shared word like "clinical" appears on half
      // the deck and would flag everything.
      if (hits.length < 2) continue;
      // And at least one of them must be distinctive to THIS prohibition.
      if (!hits.some((t) => (docFreq.get(t) ?? 0) <= RARE_MAX_PROHIBITIONS)) continue;
      // And at least one must be part of what the prohibition is ABOUT.
      if (!hits.some((t) => lead.has(t))) continue;
      // A label is not a claim. "Finance-validated value" is a column header and
      // was flagged twice on one deck.
      if (text.split(/\s+/).length < MIN_SENTENCE_WORDS) continue;
      const assertion = text.match(ASSERTION);
      if (!assertion) continue;
      // The two signals must be INDEPENDENT. "Finance-validated" supplies both
      // the subject term and the assertion verb, so a bare label self-triggers:
      // the guard appears to have fired twice when only one thing happened.
      if (hits.includes(assertion[0].toLowerCase())) continue;
      // "No certified medallion architecture" carries the subject and a verb but
      // denies it. Denying a prohibited claim is the compliant form, and so is a
      // conditional: "only after transcript evidence is governed".
      if (NEGATION.test(text)) continue;
      if (ZERO_QUANTITY.test(text)) continue;
      if (COMPLIANCE.test(text)) continue;
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
