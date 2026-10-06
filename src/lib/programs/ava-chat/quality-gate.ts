// Moves aVa chat hardening — quality gate.
//
// Deterministic post-hoc checks on the assembled answer text, modeled on
// src/lib/source/ava/answer-quality-gate.ts and
// src/lib/intelligence/synthesis/outputValidator.ts: a fixed list of named
// checks, each pass/fail, plus a list of repair instructions the caller can
// feed back into a targeted re-generation pass. This module never calls an
// LLM and never edits the text itself — it only judges and advises.

import {
  textMentionsAny,
  type AvaModuleQualityGateResult,
} from "@/lib/agent/module-expert-contract";
import { checkMovesAvaBannedLanguage } from "./banned-language";
import type { MovesAvaAnswerMode, MovesAvaChatPacket } from "./types";

export type MovesAvaQualityCheckId =
  | "has_direct_answer"
  | "references_move_or_phase"
  | "uses_deterministic_state"
  | "includes_caveat_when_incomplete"
  | "includes_next_action"
  | "no_banned_language"
  | "mentions_source_when_relevant"
  | "mentions_tower_when_relevant";

export type MovesAvaQualityGateResult =
  AvaModuleQualityGateResult<MovesAvaQualityCheckId>;

const NEXT_ACTION_HINTS = [
  "next action",
  "next step",
  "you should",
  "recommend",
  "upload",
  "review",
  "confirm",
  "advance",
  "provide",
];

export function runMovesAvaQualityGate(
  text: string,
  packet: MovesAvaChatPacket,
  mode: MovesAvaAnswerMode,
): MovesAvaQualityGateResult {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();
  const banned = checkMovesAvaBannedLanguage(trimmed);

  const hasDeterministicStateReference =
    packet.checklistStatus !== null ||
    packet.gateCriteria.length > 0 ||
    packet.evidenceNeedPackets.length > 0 ||
    packet.nextPhaseFeedForwardPack !== null ||
    packet.approvedInputsPackPresent;

  const checks: Record<MovesAvaQualityCheckId, boolean> = {
    has_direct_answer: trimmed.length > 0,
    references_move_or_phase:
      mode === "out_of_scope_redirect" ||
      lower.includes(packet.moveTitle.toLowerCase()) ||
      lower.includes(packet.currentPhaseClientLabel.toLowerCase()) ||
      /\bthis (move|phase)\b/i.test(trimmed) ||
      /\bp[0-5]\b/i.test(trimmed),
    uses_deterministic_state:
      mode === "out_of_scope_redirect" || !hasDeterministicStateReference
        ? true
        : hasDeterministicStateReference,
    includes_caveat_when_incomplete:
      packet.missingInputs.length === 0 ||
      textMentionsAny(trimmed, ["confirm", "missing", "gap", "not yet", "needs confirmation"]),
    includes_next_action:
      mode === "out_of_scope_redirect" || textMentionsAny(trimmed, NEXT_ACTION_HINTS),
    no_banned_language: banned.pass,
    mentions_source_when_relevant:
      !packet.sourceImplication.relevant || lower.includes("source"),
    mentions_tower_when_relevant:
      !packet.towerMeasurement.relevant || lower.includes("tower"),
  };

  const failedChecks = (Object.keys(checks) as MovesAvaQualityCheckId[]).filter(
    (id) => !checks[id],
  );

  const repairInstructions = failedChecks.map((id) => REPAIR_INSTRUCTIONS[id]);

  return {
    pass: failedChecks.length === 0,
    checks,
    failedChecks,
    repairInstructions,
  };
}

const REPAIR_INSTRUCTIONS: Record<MovesAvaQualityCheckId, string> = {
  has_direct_answer: "Add a direct answer as the first sentence.",
  references_move_or_phase:
    "Ground the answer in the active Move or current phase by name — do not answer generically.",
  uses_deterministic_state:
    "Reference at least one piece of real Move state (checklist, gate criteria, evidence gaps, or feed-forward) already provided.",
  includes_caveat_when_incomplete:
    "Evidence is incomplete for this Move — add a caveat naming what still needs confirmation instead of stating it as fact.",
  includes_next_action: "End with one concrete, practical next action.",
  no_banned_language:
    "Remove any Claude-deflection language, internal IDs/schema terms, or claims that chat approved/advanced/promoted anything.",
  mentions_source_when_relevant:
    "This question touches vendor/commercial terms — mention Source as the surface for that validation.",
  mentions_tower_when_relevant:
    "This question touches value/metric terms — mention Tower as the measurement system.",
};
