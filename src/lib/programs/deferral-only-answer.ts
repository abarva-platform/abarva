// Detecting an answer that promises work instead of doing it.
//
// Found by live proof. Asked to draft the P1 capture inputs and cite each
// field, aVa replied in full:
//
//   "Looking at the active program — Predictive Turnaround & Maintenance
//    Reliability — I'll draft the P1 inputs from what's confirmed in the
//    upstream record. Let me pull the charter and origination brief together
//    now."
//
// and stopped. No draft, no fields, nothing. The Moves chat packet then
// attached its standard readiness chart, two tables, two fixed citations and
// a next-steps list to that sentence, so a non-answer rendered as substantial,
// sourced work. A reader skimming saw dense evidence furniture and reasonably
// concluded the drafting had happened.
//
// The furniture is not the bug — that context is real and useful on a genuine
// answer. The bug is dressing a deferral in it. This module is the narrow
// detector that lets the caller tell the two apart.
//
// Deliberately conservative. A false positive suppresses context on a real
// answer, which is a visible annoyance; a false negative restores exactly the
// failure above, which is invisible. So it fires only when BOTH hold: the text
// is short, and every sentence in it is either scene-setting or a promise.
// Any sentence carrying actual substance disqualifies it.

/** Longest an answer can be and still be considered a bare deferral. */
const MAX_DEFERRAL_CHARS = 400;

/**
 * Forward-looking promises: the model announcing work rather than doing it.
 * Anchored at sentence start so "we'll need a CMDB export" — a real finding
 * that happens to contain "we'll" — does not match.
 */
const PROMISE_PATTERNS: readonly RegExp[] = [
  /^(?:so\s+)?(?:let me|let's|i'll|i will|i am going to|i'm going to)\b/i,
  /^(?:one moment|give me a moment|hold on|stand by|bear with me)\b/i,
  /^(?:i'll|let me)\s+(?:pull|gather|check|look|review|draft|prepare|put)\b/i,
  /^(?:pulling|gathering|checking|reviewing|drafting|preparing|working)\b.*\bnow\b/i,
  /^here(?:'s| is) what i(?:'ll| will)\s+do\b/i,
];

/**
 * Scene-setting: restating the context before (supposedly) getting to work.
 * Harmless on its own, but it is never an answer.
 */
const PREAMBLE_PATTERNS: readonly RegExp[] = [
  /^(?:looking at|based on|starting (?:from|with)|working from)\b/i,
  /^(?:for|on)\s+(?:the\s+)?(?:active|current)\s+(?:program|move|phase)\b/i,
  /^(?:good|great|sure|okay|ok|understood|absolutely)[.,!]?$/i,
];

/**
 * Split into clauses, not just sentences.
 *
 * Sentences alone were too coarse: models routinely pack scene-setting and a
 * promise into one — "Looking at the active Move — let me gather the
 * evidence." — which reads as pure preamble at sentence granularity and hides
 * the promise. Equally, "Based on the charter, the sponsor is X" reads as pure
 * preamble while carrying a complete answer in its second clause.
 *
 * Splitting on dashes, semicolons and commas separates both. It stays safe in
 * the direction that matters, because any clause carrying substance makes the
 * whole answer real — the split can only reveal substance, never hide it.
 */
function clausesOf(text: string): string[] {
  // A paired dash aside is an appositive — usually the model restating the
  // Move's own name: "Looking at the active program — Predictive Turnaround &
  // Maintenance Reliability — I'll draft the inputs." Left in, that name
  // becomes its own clause and reads as substance, which is how the real
  // non-answer slipped past. It is a label, not a claim, so it is dropped and
  // the text either side becomes separate clauses.
  //
  // Safe in the direction that matters: if an aside really did carry
  // substance, the surrounding text almost always does too, and one
  // substantive clause anywhere makes the answer real.
  const withoutAsides = text.replace(/\s+[—–]\s+[^—–]+?\s+[—–]\s+/g, " | ");

  return withoutAsides
    .split(/(?<=[.!?])\s+|\n+|\s*\|\s*|\s+[—–-]\s+|;\s*|,\s+/)
    .map((part) =>
      part
        .trim()
        .replace(/[.!?]+$/, "")
        .trim(),
    )
    .filter((part) => part.length > 0);
}

function matchesAny(sentence: string, patterns: readonly RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(sentence));
}

/** True when this sentence promises future work rather than delivering any. */
export function isPromiseSentence(sentence: string): boolean {
  return matchesAny(sentence.trim(), PROMISE_PATTERNS);
}

/** True when this sentence only restates context. */
export function isPreambleSentence(sentence: string): boolean {
  return matchesAny(sentence.trim(), PREAMBLE_PATTERNS);
}

export interface DeferralAssessment {
  /** True when the answer promises work without doing any. */
  isDeferralOnly: boolean;
  /** Why, for logging and for the reviewer-facing note. */
  reason:
    | "empty"
    | "too_long_to_be_a_deferral"
    | "contains_substance"
    | "no_promise_made"
    | "promise_without_delivery";
}

/**
 * Assess whether `visibleText` is a bare deferral.
 *
 * At least one sentence must be an actual promise — scene-setting alone is
 * not enough, since a short factual answer can open with "Based on the
 * charter, ..." and be perfectly complete.
 */
export function assessDeferralOnlyAnswer(
  visibleText: string,
): DeferralAssessment {
  const text = String(visibleText ?? "").trim();
  if (text.length === 0) return { isDeferralOnly: true, reason: "empty" };
  if (text.length > MAX_DEFERRAL_CHARS) {
    return { isDeferralOnly: false, reason: "too_long_to_be_a_deferral" };
  }

  const clauses = clausesOf(text);
  let sawPromise = false;
  for (const clause of clauses) {
    const promise = isPromiseSentence(clause);
    if (promise) sawPromise = true;
    // A clause that is neither a promise nor scene-setting is substance, and
    // substance means this is a real answer however short.
    if (!promise && !isPreambleSentence(clause)) {
      return { isDeferralOnly: false, reason: "contains_substance" };
    }
  }

  if (!sawPromise) return { isDeferralOnly: false, reason: "no_promise_made" };
  return { isDeferralOnly: true, reason: "promise_without_delivery" };
}

/** Convenience predicate for call sites that do not need the reason. */
export function isDeferralOnlyAnswer(visibleText: string): boolean {
  return assessDeferralOnlyAnswer(visibleText).isDeferralOnly;
}
