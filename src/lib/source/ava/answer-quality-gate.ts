// ─────────────────────────────────────────────────────────────────────────────
// aVa Source ANSWER QUALITY GATE — Phase A (9 checks) + Phase B (3 more checks)
// + Phase C (extends the Phase B checks to 2 new value modes; lightens the bar
// for `general_advisory`).
//
// Mirrors Intelligence's `answer-safety.ts` pattern (see
// src/lib/intelligence/answer/answer-safety.ts): a deterministic, non-LLM gate
// that checks an answer against a fixed set of rules and can trigger ONE
// targeted repair pass. It reuses Intelligence's ID-scrubbing helpers directly
// (`containsUnsafePublicText`, `sanitizePublicText`) rather than duplicating
// the regexes — Source is the SECOND consumer of that safety surface.
//
// Scope: Phase A's 6 answer modes (event_status, workflow_how_to,
// evidence_readiness, artifact_lineage, artifact_finality, stage_gate). The
// chat route is a raw streaming-text endpoint (no `AvaAnswerPacket` object is
// built today), so this gate operates on the buffered answer TEXT plus the
// same mode-grounding facts bag that was read ONCE for prompt injection —
// passed into both the generation prompt and this gate so they can never
// disagree by construction (checklist item #9 in the design).
//
// Phase B adds 3 checks scoped to the 8 vendor/value/commercial modes:
//   - `traceable_to_grounding` (value/pricing modes): every $ figure the answer
//     states must appear verbatim in the grounding block — the SAME
//     quote-not-compute philosophy as #4567, applied post-hoc to the buffered
//     answer text instead of only as a prompt directive.
//   - `includes_value_type_breakdown` (value/pricing modes): when the grounding
//     block carries a classified value-type breakdown, the answer must reflect
//     at least one value-type label — never fold classified value into one
//     blended savings claim.
//   - `uses_specific_ask_when_available` (BAFO/vendor modes): when the grounding
//     has a real, specific vendor/lever ask, the answer must not stay generic.
// The existing 9 Phase A checks are unchanged; Phase B checks are additive and
// only evaluated for Phase B modes (Phase A modes always pass them vacuously).
//
// Phase C extends the SAME 3 Phase B checks to `decision_recommendation` and
// `contract_optimization` (both state $ / value-type figures, composited from
// existing groundings — the traceability check still holds because every
// figure they surface is quoted verbatim from an underlying Phase A/B
// builder's block). `general_advisory` gets a LIGHTER bar by design (it's the
// catch-all, intentionally general): it is exempted from the value-mode and
// ask-mode checks (nothing in its compact roll-up is a specific vendor/lever
// ask) but still must pass every core Phase A check unchanged.
// ─────────────────────────────────────────────────────────────────────────────

import {
  containsUnsafePublicText,
  sanitizePublicText,
} from "@/lib/intelligence/answer/answer-safety";
import type { SourceAnswerMode } from "./answer-mode";

export type SourceAnswerQualityCheckId =
  | "has_direct_answer"
  | "has_mode_classification"
  | "uses_current_event_context"
  | "matches_workflow_state"
  | "no_banned_language"
  | "no_raw_internal_ids"
  | "includes_gap_or_caveat_when_incomplete"
  | "includes_next_step"
  | "matches_read_once_grounding"
  | "traceable_to_grounding"
  | "includes_value_type_breakdown"
  | "uses_specific_ask_when_available";

export const SOURCE_CHAT_UNSAVED_FACT_NOTICE =
  "I can use that here, but it is not saved to the Source record yet.";

/** The Phase B modes whose answers state $ / value-type figures — the
 * traceability + value-type-breakdown checks apply only to these. */
const PHASE_B_VALUE_MODES = new Set<SourceAnswerMode>([
  "value_at_stake",
  "vendor_comparison",
  "should_cost",
  "risk_exposure",
  "clause_coverage",
  "bafo_strategy",
  "committed_value",
  "value_realization",
]);

/** The Phase B modes where a specific vendor/lever ask is the expected answer
 * shape — the generic-answer-when-data-exists check applies only to these. */
const PHASE_B_ASK_MODES = new Set<SourceAnswerMode>([
  "bafo_strategy",
  "vendor_comparison",
]);

/**
 * The Phase C modes whose answers ALSO state $ / value-type figures —
 * `decision_recommendation` composites the exec-decision + vendor-comparison +
 * BAFO facets (all $ figures quoted from their underlying blocks);
 * `contract_optimization` composites the value-pool + scope-coverage facets.
 * `general_advisory` is deliberately excluded — its compact roll-up is not
 * held to the same value-mode bar (see module doc).
 */
const PHASE_C_VALUE_MODES = new Set<SourceAnswerMode>([
  "decision_recommendation",
  "contract_optimization",
]);

/** decision_recommendation's assembled BAFO facet can name a specific
 * still-open lever ask — same bar as Phase B's bafo_strategy/vendor_comparison. */
const PHASE_C_ASK_MODES = new Set<SourceAnswerMode>(["decision_recommendation"]);

export interface SourceAnswerQualityCheckResult {
  id: SourceAnswerQualityCheckId;
  passed: boolean;
  detail: string;
}

export interface SourceAnswerQualityGateResult {
  passed: boolean;
  checks: SourceAnswerQualityCheckResult[];
  /** Checks that still fail after the repair pass (empty when passed, or when
   * no repair was needed). Never silently dropped — surfaced for telemetry. */
  unresolvedChecks: SourceAnswerQualityCheckId[];
  /** The (possibly repaired) answer text to ship. */
  finalText: string;
  /** True when the repair pass ran (regardless of whether it fully succeeded). */
  repaired: boolean;
}

export interface SourceAnswerQualityGateInput {
  /** The candidate answer text, already streamed/buffered. */
  answerText: string;
  /** The mode classification for this turn. */
  mode: SourceAnswerMode | null;
  /** True when a non-empty grounding block (base or mode-specific) was injected
   * into the prompt for this turn — the "uses current event context" signal. */
  hasGroundingContext: boolean;
  /**
   * The SAME read-once grounding facts bag used to build the prompt (from
   * `buildModeGrounding` / `renderAvaSourceGroundingFromFacts`) — passed here so
   * generation and gate check against IDENTICAL data, never a stale re-read.
   */
  groundingFacts?: Record<string, string>;
  /** Whether the evidence/artifact data behind this answer is known incomplete
   * (drives the "must include a gap/caveat" check for evidence/artifact modes). */
  evidenceIsIncomplete?: boolean;
  /**
   * The RAW mode-grounding block text (the SAME string injected into the
   * generation prompt via `buildModeGrounding(...).block`) — Phase B's
   * traceability check scans this for the $ figures the answer is allowed to
   * quote. Optional: Phase A modes never set it, so their existing 9 checks are
   * unaffected; Phase B modes should always pass it when grounding is active.
   */
  groundingBlockText?: string;
  /**
   * True when the grounding block for this turn names a SPECIFIC vendor/lever
   * ask (e.g. a BAFO-open-lever list, or a per-vendor should-cost breakdown) —
   * drives the "generic answer when real data exists" check for BAFO/vendor
   * modes. Absent/false when the grounding is itself a MODEL with nothing
   * specific to point to (the check then does not require specificity).
   */
  groundingHasSpecificAsk?: boolean;
}

/** Every $ figure appearing in a text, compact-notation aware (e.g. "$4.2M",
 * "$650K", "$1,200,000"). Used by the traceability check to compare the
 * answer's stated figures against the grounding block's cited figures. */
const USD_FIGURE_RE = /\$\s?[\d,]+(?:\.\d+)?\s?(?:[KkMmBb]|thousand|million|billion)?\b/g;

function extractUsdFigures(text: string): string[] {
  const matches = text.match(USD_FIGURE_RE) ?? [];
  // Normalize whitespace/case for a tolerant comparison (the model may render
  // "$4.2M" vs "$4.2 M" — both should compare equal).
  return matches.map((m) => m.replace(/\s+/g, "").toLowerCase());
}

/** Value-type labels the classification lines use — matched loosely (word
 * fragments) so "protected value" and "protected" both count as a hit. */
const VALUE_TYPE_SIGNAL_RE =
  /\b(expected concession|incremental negotiated|solution tightening|protected( value)?|risk[- ]adjusted|recoverable leakage|avoided cost|negotiated improvement|realized value)\b/i;

// Banned model-deflection / inferiority phrases (spec-mandated list, verbatim
// intent). Case-insensitive; matched as substrings since the model may vary
// punctuation slightly.
const BANNED_PHRASES = [
  "claude could provide a better answer",
  "ask claude for more detail",
  "i can only give a high-level answer",
  "i do not have enough context to be useful",
  "i am just a workflow assistant",
  "i cannot access the event",
  "with more context, another model could improve this",
  "another model could do better",
  "a smarter model could help",
  "i'm just a simple assistant",
  "i'll lock it into the intake record",
  "i will lock it into the intake record",
  "i'll lock it into the source record",
  "i will lock it into the source record",
];

const SOURCE_RECORD_WRITE_CLAIM_RE =
  /\b(?:i(?:'ll|’ll| will| have|’ve|'ve| can)?|ava(?: will| has| can)?)\s+(?:save|saved|lock|locked|register|registered|capture|captured|update|updated|write|wrote|record|recorded)\b[^.!?\n]*(?:source|intake|event)\s+record\b/i;

const SOURCE_RECORD_WRITE_CLAIM_SENTENCE_RE =
  /(^|[.!?\n]\s*)[^.!?\n]*(?:\b(?:i(?:'ll|’ll| will| have|’ve|'ve| can)?|ava(?: will| has| can)?)\s+(?:save|saved|lock|locked|register|registered|capture|captured|update|updated|write|wrote|record|recorded)\b[^.!?\n]*(?:source|intake|event)\s+record\b)[^.!?\n]*[.!?]?/gi;

export function containsSourceRecordWriteClaim(text: string): boolean {
  return SOURCE_RECORD_WRITE_CLAIM_RE.test(text);
}

export function enforceSourceExistingEventWriteTruth(text: string): string {
  if (!containsSourceRecordWriteClaim(text)) return text;
  let repaired = text.replace(
    SOURCE_RECORD_WRITE_CLAIM_SENTENCE_RE,
    (match, prefix: string) => `${prefix}${SOURCE_CHAT_UNSAVED_FACT_NOTICE}`,
  );
  if (!repaired.includes(SOURCE_CHAT_UNSAVED_FACT_NOTICE)) {
    repaired = `${repaired.trim()} ${SOURCE_CHAT_UNSAVED_FACT_NOTICE}`.trim();
  }
  return repaired.replace(/[ \t]{2,}/g, " ").trim();
}

function findBannedPhrase(text: string, hasGroundingContext: boolean): string | null {
  if (containsSourceRecordWriteClaim(text)) {
    return "source record write claim";
  }
  const lower = text.toLowerCase();
  for (const phrase of BANNED_PHRASES) {
    if (!lower.includes(phrase)) continue;
    // "I cannot access the event" is only banned when event context IS
    // available (per spec) — when grounding is genuinely absent, honestly
    // saying so is not a banned deflection.
    if (phrase === "i cannot access the event" && !hasGroundingContext) continue;
    return phrase;
  }
  return null;
}

function stripBannedPhrases(text: string, hasGroundingContext: boolean): string {
  let result = enforceSourceExistingEventWriteTruth(text);
  for (const phrase of BANNED_PHRASES) {
    if (phrase === "i cannot access the event" && !hasGroundingContext) continue;
    const re = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    result = result.replace(re, "");
  }
  return result.replace(/[ \t]{2,}/g, " ").trim();
}

/**
 * Matches an "N of M" count the answer states near a completion/confirmation
 * word (e.g. "0 of 1 tasks complete", "4 of 6 levers protected", "2 of 3
 * confirmed") — captures the two integers plus the trailing word so the
 * numeric-contradiction check can decide which grounded count-pair it should
 * be compared against.
 */
const COUNT_CLAIM_RE =
  /\b(\d+)\s+of\s+(\d+)\s+(complete|completed|done|tasks?|confirm(?:ed|ations?)?|protected|met)\b/gi;

/**
 * Extract every "N of M <word>" count claim the answer text states, so the
 * numeric-contradiction check can compare each against the grounding block's
 * OWN stated counts for the same concept (never a fresh computation — purely
 * a string/number comparison against facts already read once for this turn).
 */
function extractCountClaims(
  text: string,
): { done: number; total: number; word: string }[] {
  const claims: { done: number; total: number; word: string }[] = [];
  for (const match of text.matchAll(COUNT_CLAIM_RE)) {
    const done = Number(match[1]);
    const total = Number(match[2]);
    if (Number.isFinite(done) && Number.isFinite(total)) {
      claims.push({ done, total, word: match[3].toLowerCase() });
    }
  }
  return claims;
}

const NEXT_STEP_SIGNAL_RE =
  /(?:\bnext(?: step|[:,])|\byou (?:should|can|need to)\b|\b(?:upload|provide|confirm|approve|advance|review|ask|check)\b)/i;
const CAVEAT_SIGNAL_RE =
  /\b(not (yet )?(computed|available|complete|persisted)|missing|outstanding|still (need|open)|has not been)\b/i;

const OPEN_VALUE_PROOF_SIGNAL_RE =
  /\bvalue-proof gate open\b|Finance\/Tower evidence pending approval|Approved realized value:\s*\$0/i;

const CONFIRMED_REALIZED_VALUE_CLAIM_RE =
  /\b(?:Finance(?:\/Tower)?\s+(?:has\s+)?confirmed|Finance-confirmed)\b[^.!?\n]*(?:realized value|value)|\brealized value (?:to date|is|of)\b[^.!?\n]*\$\s?[\d,]+(?:\.\d+)?\s?(?:[KkMmBb]|thousand|million|billion)?\b/i;

const CONFIRMED_REALIZED_VALUE_SENTENCE_RE =
  /(^|[.!?\n]\s*)[^.!?\n]*(?:(?:Finance(?:\/Tower)?\s+(?:has\s+)?confirmed|Finance-confirmed)[^.!?\n]*(?:realized value|value)|realized value (?:to date|is|of)[^.!?\n]*\$\s?[\d,]+(?:\.\d+)?\s?(?:[KkMmBb]|thousand|million|billion)?\b)[^.!?\n]*[.!?]?/gi;

// Vague negotiation-posture phrases that dodge naming the SPECIFIC vendor/lever
// ask the grounding block already carries (e.g. the archetype's `bafoAsk` text,
// or a named vendor/lever). Flagged only when the grounding actually HAS a
// specific ask to point to — see `groundingHasSpecificAsk` on the gate input.
const GENERIC_ASK_DEFLECTION_RE =
  /\b(negotiate (harder|better)|push for (a )?better (price|deal|terms)|ask for (a )?discount|try to (get|negotiate) (a )?better (price|deal)|sharpen (your|their) pencil|see what (they|the vendor) (can|will) do)\b/i;

function runChecks(
  input: SourceAnswerQualityGateInput,
  text: string,
): SourceAnswerQualityCheckResult[] {
  const checks: SourceAnswerQualityCheckResult[] = [];

  // 1. Has a direct answer.
  const trimmed = text.trim();
  checks.push({
    id: "has_direct_answer",
    passed: trimmed.length > 0,
    detail: trimmed.length > 0 ? "Answer text is non-empty." : "Answer text is empty.",
  });

  // 2. Has a mode classification.
  checks.push({
    id: "has_mode_classification",
    passed: input.mode !== null,
    detail: input.mode ? `Classified as ${input.mode}.` : "No mode was classified.",
  });

  // 3. Uses current Source event context when available.
  checks.push({
    id: "uses_current_event_context",
    passed: input.hasGroundingContext,
    detail: input.hasGroundingContext
      ? "A non-empty grounding block was injected for this turn."
      : "No grounding block was available for this event/turn (honest — nothing to check against).",
  });

  // 4. Does not contradict structured workflow state — text-based consistency
  // check: if the grounding names a current stage label, the answer must not
  // assert the event is on a DIFFERENT canonical stage label.
  const groundingStageLabel = input.groundingFacts?.currentStageLabel ?? input.groundingFacts?.gateStageLabel;
  let matchesWorkflowState = true;
  let matchesDetail = "No stage label asserted in grounding to cross-check.";
  if (groundingStageLabel) {
    const otherStageLabels = [
      "Strategy",
      "Scope",
      "RFP",
      "Responses",
      "Evaluation",
      "Pricing",
      "BAFO",
      "Executive Decision",
      "Selection",
      "Transition",
      "Value",
    ].filter((label) => label !== groundingStageLabel);
    const claimsWrongStage = otherStageLabels.some((label) => {
      const re = new RegExp(`\\b(currently|now|is)\\s+(on|in|at)\\s+(the\\s+)?${label}\\b`, "i");
      return re.test(text);
    });
    matchesWorkflowState = !claimsWrongStage;
    matchesDetail = claimsWrongStage
      ? `Answer appears to claim a stage other than the grounded "${groundingStageLabel}".`
      : `Answer does not contradict the grounded stage "${groundingStageLabel}".`;
  }
  // 4b. Does not contradict the grounding block's OWN stated task/gate
  // counts — this is the specific failure class a live invariant violation
  // surfaced: the answer claimed "0 of 1 tasks complete" / gate confirms
  // unmet while the grounding block (built from the SAME read-once facts)
  // stated "1 of 1" / gate confirms met. Folded into `matches_workflow_state`
  // (the "does this answer match structured state" check) rather than a new
  // check id, since it is the same invariant, just on counts instead of a
  // stage label.
  const groundingTaskDone = input.groundingFacts?.taskChecklistDone;
  const groundingTaskTotal = input.groundingFacts?.taskChecklistTotal;
  if (groundingTaskDone !== undefined && groundingTaskTotal !== undefined) {
    const groundedDone = Number(groundingTaskDone);
    const groundedTotal = Number(groundingTaskTotal);
    const claims = extractCountClaims(text);
    const contradictingClaim = claims.find(
      (c) => c.total === groundedTotal && c.done !== groundedDone,
    );
    if (contradictingClaim) {
      matchesWorkflowState = false;
      matchesDetail = `Answer states "${contradictingClaim.done} of ${contradictingClaim.total} ${contradictingClaim.word}" but the grounding block's own task checklist shows "${groundingTaskDone} of ${groundingTaskTotal}" complete — numeric contradiction.`;
    } else if (matchesWorkflowState) {
      matchesDetail = `${matchesDetail} No task-count contradiction (grounded: ${groundingTaskDone} of ${groundingTaskTotal}).`;
    }
  }
  if (
    input.groundingBlockText &&
    OPEN_VALUE_PROOF_SIGNAL_RE.test(input.groundingBlockText) &&
    CONFIRMED_REALIZED_VALUE_CLAIM_RE.test(text)
  ) {
    matchesWorkflowState = false;
    matchesDetail =
      "Answer claims finance-confirmed or realized value while the grounding says the value-proof gate is open and Finance/Tower approval is pending.";
  }
  checks.push({
    id: "matches_workflow_state",
    passed: matchesWorkflowState,
    detail: matchesDetail,
  });

  // 5. No banned deflection language.
  const bannedHit = findBannedPhrase(text, input.hasGroundingContext);
  checks.push({
    id: "no_banned_language",
    passed: bannedHit === null,
    detail: bannedHit ? `Found banned phrase: "${bannedHit}".` : "No banned phrases found.",
  });

  // 6. No raw internal IDs exposed.
  const hasUnsafeIds = containsUnsafePublicText(text);
  checks.push({
    id: "no_raw_internal_ids",
    passed: !hasUnsafeIds,
    detail: hasUnsafeIds
      ? "Answer exposes a raw UUID / internal record id / internal field name."
      : "No raw internal ids detected.",
  });

  // 7. For evidence/artifact modes with incomplete evidence, must assert what
  // CAN be concluded (a gap/caveat signal), not a bare apology.
  const isEvidenceOrArtifactMode =
    input.mode === "evidence_readiness" ||
    input.mode === "artifact_lineage" ||
    input.mode === "artifact_finality";
  const needsCaveat = isEvidenceOrArtifactMode && input.evidenceIsIncomplete === true;
  const hasCaveatSignal = CAVEAT_SIGNAL_RE.test(text);
  checks.push({
    id: "includes_gap_or_caveat_when_incomplete",
    passed: !needsCaveat || hasCaveatSignal,
    detail: !needsCaveat
      ? "Evidence/artifact completeness not flagged incomplete — no caveat required."
      : hasCaveatSignal
        ? "Answer names what is missing/outstanding."
        : "Evidence is incomplete but the answer does not name a gap or caveat.",
  });

  // 8. Includes actionable next steps.
  const hasNextStep = NEXT_STEP_SIGNAL_RE.test(text);
  checks.push({
    id: "includes_next_step",
    passed: hasNextStep,
    detail: hasNextStep
      ? "Answer names a next action."
      : "Answer does not name a concrete next step or action.",
  });

  // 9. For artifact_finality/stage_gate/event_status, claims must match the
  // SAME read-once grounding facts passed in (not a stale re-read). We assert
  // this structurally: the check simply confirms groundingFacts were provided
  // for these modes when hasGroundingContext is true — the "same read"
  // guarantee is enforced by construction at the call site (one grounding
  // object threaded into both generation and this gate), not re-derived here.
  const needsReadOnceFacts =
    input.mode === "artifact_finality" ||
    input.mode === "stage_gate" ||
    input.mode === "event_status";
  const hasReadOnceFacts =
    !needsReadOnceFacts || (input.groundingFacts !== undefined && Object.keys(input.groundingFacts).length > 0);
  checks.push({
    id: "matches_read_once_grounding",
    passed: !input.hasGroundingContext || hasReadOnceFacts,
    detail: hasReadOnceFacts
      ? "Read-once grounding facts were threaded into this check."
      : "This mode requires read-once grounding facts but none were provided to the gate.",
  });

  // ── Phase B + Phase C checks (only evaluated for the value/pricing modes;
  // vacuously pass for every Phase A mode and for general_advisory) ───────────

  // 10. Traceability: every $ figure the answer states must appear verbatim in
  // the grounding block — the same quote-not-compute philosophy as #4567's
  // prompt guard, checked post-hoc against the buffered answer text. A mode
  // outside the value/pricing set, or a turn with no grounding block, passes
  // vacuously (nothing to check against).
  const isValueMode =
    input.mode !== null &&
    (PHASE_B_VALUE_MODES.has(input.mode) || PHASE_C_VALUE_MODES.has(input.mode));
  const needsTraceability =
    isValueMode && input.hasGroundingContext && Boolean(input.groundingBlockText);
  let traceableToGrounding = true;
  let traceabilityDetail = "Not a value/pricing mode, or no grounding block to trace against.";
  if (needsTraceability) {
    const groundingFigures = new Set(extractUsdFigures(input.groundingBlockText!));
    const answerFigures = extractUsdFigures(text);
    const untraceable = answerFigures.filter((f) => !groundingFigures.has(f));
    traceableToGrounding = untraceable.length === 0;
    traceabilityDetail = traceableToGrounding
      ? "Every $ figure in the answer appears verbatim in the grounding block."
      : `Answer states $ figure(s) not found in the grounding block: ${untraceable.join(", ")}.`;
  }
  checks.push({
    id: "traceable_to_grounding",
    passed: traceableToGrounding,
    detail: traceabilityDetail,
  });

  // 11. Value-type breakdown present: when the grounding block carries a
  // classified value-type breakdown (its VALUE-TYPE CLASSIFICATION section),
  // the answer must reflect at least one value-type label — never fold
  // classified value into one blended savings claim.
  const groundingHasValueTypeBreakdown =
    Boolean(input.groundingBlockText) &&
    input.groundingBlockText!.includes("VALUE-TYPE CLASSIFICATION");
  const needsValueTypeBreakdown =
    isValueMode && input.hasGroundingContext && groundingHasValueTypeBreakdown;
  const hasValueTypeSignal = VALUE_TYPE_SIGNAL_RE.test(text);
  checks.push({
    id: "includes_value_type_breakdown",
    passed: !needsValueTypeBreakdown || hasValueTypeSignal,
    detail: !needsValueTypeBreakdown
      ? "Grounding carries no classified value-type breakdown for this turn — no breakdown required."
      : hasValueTypeSignal
        ? "Answer names at least one value-type classification."
        : "Grounding carries a classified value-type breakdown but the answer does not name any value type — risks reading as one blended savings figure.",
  });

  // 12. Generic-ask check: for BAFO/vendor modes (+ decision_recommendation,
  // which composites the BAFO facet), when the grounding has a real, specific
  // vendor/lever ask, the answer must not stay generic (e.g. "negotiate
  // harder") instead of using the specific ask/vendor/lever the data provides.
  const isAskMode =
    input.mode !== null &&
    (PHASE_B_ASK_MODES.has(input.mode) || PHASE_C_ASK_MODES.has(input.mode));
  const needsSpecificAsk =
    isAskMode && input.hasGroundingContext && input.groundingHasSpecificAsk === true;
  const hasGenericDeflection = GENERIC_ASK_DEFLECTION_RE.test(text);
  checks.push({
    id: "uses_specific_ask_when_available",
    passed: !needsSpecificAsk || !hasGenericDeflection,
    detail: !needsSpecificAsk
      ? "Not a BAFO/vendor mode with a specific ask available — no specificity required."
      : hasGenericDeflection
        ? "Grounding names a specific vendor/lever ask but the answer stayed generic."
        : "Answer does not fall back to a generic ask when specific data is available.",
  });

  return checks;
}

/**
 * Run ONE targeted repair pass: strip banned phrases, scrub unsafe ids, and
 * (when missing) append a minimal, honest next-step / caveat line built from
 * the grounding facts already in hand — never a full regeneration, never a new
 * model call. This is a deterministic text transform only.
 */
function repairAnswer(
  text: string,
  failedChecks: SourceAnswerQualityCheckResult[],
  input: SourceAnswerQualityGateInput,
): string {
  let repaired = text;

  const failedIds = new Set(failedChecks.map((c) => c.id));

  if (failedIds.has("no_banned_language")) {
    repaired = stripBannedPhrases(repaired, input.hasGroundingContext);
  }

  if (failedIds.has("no_raw_internal_ids")) {
    repaired = sanitizePublicText(repaired, repaired.length > 0 ? repaired : "the event");
  }

  // matches_workflow_state / numeric-contradiction repair: correct any
  // "N of M <word>" claim whose total matches the grounding's task-checklist
  // total but whose done-count does not, replacing it with the grounding
  // block's OWN count (never re-derived — quoted straight from
  // `groundingFacts.taskChecklistDone/Total`, the exact numbers the canvas
  // renders for this event/stage).
  if (
    failedIds.has("matches_workflow_state") &&
    input.groundingFacts?.taskChecklistDone !== undefined &&
    input.groundingFacts?.taskChecklistTotal !== undefined
  ) {
    const groundedDone = input.groundingFacts.taskChecklistDone;
    const groundedTotal = input.groundingFacts.taskChecklistTotal;
    let correctedAny = false;
    repaired = repaired.replace(COUNT_CLAIM_RE, (match, done, total, word) => {
      if (Number(total) === Number(groundedTotal) && Number(done) !== Number(groundedDone)) {
        correctedAny = true;
        return `${groundedDone} of ${groundedTotal} ${word}`;
      }
      return match;
    });
    if (correctedAny) {
      repaired =
        `${repaired.trim()} (Corrected to match this event's actual stage checklist — ${groundedDone} of ${groundedTotal} — rather than a stale or invented count.)`.trim();
    }
  }

  if (
    failedIds.has("matches_workflow_state") &&
    input.groundingBlockText &&
    OPEN_VALUE_PROOF_SIGNAL_RE.test(input.groundingBlockText) &&
    CONFIRMED_REALIZED_VALUE_CLAIM_RE.test(repaired)
  ) {
    repaired = repaired.replace(
      CONFIRMED_REALIZED_VALUE_SENTENCE_RE,
      (match, prefix: string) =>
        `${prefix}Finance/Tower evidence is loaded but still pending approval; approved realized value remains $0 until the confirmation request is approved.`,
    );
    repaired = repaired.replace(/[ \t]{2,}/g, " ").trim();
  }

  if (failedIds.has("has_direct_answer") && repaired.trim().length === 0) {
    repaired =
      "That is not computed yet from this event's evidence — tell me what you'd like to check and I can point to the exact stage or task.";
  }

  if (failedIds.has("includes_gap_or_caveat_when_incomplete")) {
    repaired = `${repaired.trim()} Some of this event's evidence is not yet persisted — I've named what's outstanding above rather than guessing.`.trim();
  }

  if (failedIds.has("includes_next_step")) {
    const fallbackNextStep =
      input.groundingFacts?.howToAction ??
      "Use the current stage checklist and Source Approvals page for the authoritative outstanding item.";
    repaired = `${repaired.trim()} ${fallbackNextStep}`.trim();
  }

  // Phase B repairs — strip/append only, never a full regeneration.

  if (failedIds.has("traceable_to_grounding") && input.groundingBlockText) {
    // Strip the specific untraceable $ token(s) rather than the whole sentence
    // (a targeted strip, not a rewrite) and append a caveat pointing back to the
    // grounding block's own cited figures — never silently ship a self-computed
    // number as if it were cited.
    const groundingFigures = new Set(extractUsdFigures(input.groundingBlockText));
    repaired = repaired.replace(USD_FIGURE_RE, (match) => {
      const normalized = match.replace(/\s+/g, "").toLowerCase();
      return groundingFigures.has(normalized) ? match : "[figure not in the grounding record]";
    });
    repaired =
      `${repaired.trim()} Every dollar figure above is quoted from the deterministic grounding record for this event — I do not compute new figures myself.`.trim();
  }

  if (failedIds.has("includes_value_type_breakdown") && input.groundingBlockText) {
    // Append the grounding block's own VALUE-TYPE CLASSIFICATION section
    // verbatim — quoted, never re-derived — so the answer never reads as one
    // blended savings number.
    const classificationLines = input.groundingBlockText
      .split("\n")
      .filter((line) => /value[- ]?type|expected concession|incremental negotiated|solution tightening|protected|risk[- ]adjusted/i.test(line))
      .slice(0, 6);
    if (classificationLines.length > 0) {
      repaired =
        `${repaired.trim()}\n\nValue is classified, not blended: ${classificationLines.map((l) => l.trim()).join(" ")}`.trim();
    }
  }

  if (failedIds.has("uses_specific_ask_when_available")) {
    const specificAsk =
      input.groundingFacts?.bafoOpenLeverCount !== undefined
        ? "See the BAFO grounding above for the specific per-lever ask — press each open lever's named concession, not a general price reduction."
        : "See the grounding above for the specific vendor/lever detail rather than a general negotiation posture.";
    repaired = `${repaired.trim()} ${specificAsk}`.trim();
  }

  return repaired;
}

/**
 * Run the Phase A quality gate against a candidate Source aVa answer. If any
 * check fails, run ONE targeted repair pass (fixing only the failed checks)
 * and re-check once. If checks still fail after repair, return the repaired
 * text anyway (best-effort — never silently ship the ORIGINAL bad answer) with
 * `unresolvedChecks` naming what still fails, so the caller can log it rather
 * than loop indefinitely.
 */
export function runSourceAnswerQualityGate(
  input: SourceAnswerQualityGateInput,
): SourceAnswerQualityGateResult {
  const initialChecks = runChecks(input, input.answerText);
  const initialFailed = initialChecks.filter((c) => !c.passed);

  if (initialFailed.length === 0) {
    return {
      passed: true,
      checks: initialChecks,
      unresolvedChecks: [],
      finalText: input.answerText,
      repaired: false,
    };
  }

  const repairedText = repairAnswer(input.answerText, initialFailed, input);
  const repairedChecks = runChecks(input, repairedText);
  const stillFailed = repairedChecks.filter((c) => !c.passed);

  return {
    passed: stillFailed.length === 0,
    checks: repairedChecks,
    unresolvedChecks: stillFailed.map((c) => c.id),
    finalText: repairedText,
    repaired: true,
  };
}
