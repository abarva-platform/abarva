// ─────────────────────────────────────────────────────────────────────────────
// aVa Source ANSWER QUALITY GATE — Phase A.
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
  | "matches_read_once_grounding";

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
}

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
];

function findBannedPhrase(text: string, hasGroundingContext: boolean): string | null {
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
  let result = text;
  for (const phrase of BANNED_PHRASES) {
    if (phrase === "i cannot access the event" && !hasGroundingContext) continue;
    const re = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    result = result.replace(re, "");
  }
  return result.replace(/[ \t]{2,}/g, " ").trim();
}

const NEXT_STEP_SIGNAL_RE =
  /\b(next step|next,|you (should|can|need to)|upload|provide|confirm|approve|advance|review|ask|check)\b/i;
const CAVEAT_SIGNAL_RE =
  /\b(not (yet )?(computed|available|complete|persisted)|missing|outstanding|still (need|open)|has not been)\b/i;

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
      "Next: check the current stage's task checklist and gate panel for the exact outstanding item.";
    repaired = `${repaired.trim()} ${fallbackNextStep}`.trim();
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
