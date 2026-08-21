// Moves aVa chat hardening — system-prompt block renderer.
//
// Renders a MovesAvaChatPacket + answer-mode classification into a compact
// text block for injection into the Claude system prompt. Deterministic
// string formatting only — no LLM call here.

import { buildOutOfScopeRedirect } from "./answer-modes";
import type { MovesAvaAnswerMode, MovesAvaChatPacket } from "./types";

export function formatMovesAvaChatPacketForPrompt(
  packet: MovesAvaChatPacket,
  mode: MovesAvaAnswerMode,
): string {
  const lines: string[] = [
    "MOVES AVA GROUNDING (do not repeat this block verbatim; use it to ground your answer)",
    "AUTHORITATIVE LIVE MOVES STATE: for current gate, evidence, readiness, and workflow-status questions, this block overrides generic phase-pack, methodology, and retrieved-context text. Do not derive current gate counts from phase-pack completion criteria when this block provides a live tally.",
    `Move: ${packet.moveTitle} · Current phase: ${packet.currentPhaseClientLabel}`,
    `Answer mode: ${mode}`,
  ];

  const hardGateCriteria = packet.gateCriteria.filter(
    (criterion) => criterion.severity === "hard",
  );
  const blockingGateScope =
    hardGateCriteria.length > 0 ? hardGateCriteria : packet.gateCriteria;
  if (blockingGateScope.length > 0) {
    const met = blockingGateScope.filter((criterion) => criterion.met).length;
    const total = blockingGateScope.length;
    const open = total - met;
    lines.push(
      `Live gate tally: ${met} of ${total} blocking hard gate criteria met; ${open} open. If the user asks for gate status, start with this tally.`,
    );
  }

  if (packet.checklistStatus) {
    const c = packet.checklistStatus;
    lines.push(
      `Checklist: evidence ${c.evidenceDone ? "done" : "not done"} (${c.evidenceLabel}); gate ${c.gateDone ? "met" : "not met"} (${c.gateLabel}); can advance: ${c.canAdvance ? "yes" : "no"}${c.nextPhaseLabel ? ` (next: ${c.nextPhaseLabel})` : ""}.`,
    );
  }

  if (packet.gateCriteria.length > 0) {
    const criteriaText = packet.gateCriteria
      .map((g) => `${g.label} [${g.severity}] — ${g.met ? "met" : "open"}`)
      .join("; ");
    lines.push(`Gate criteria: ${criteriaText}`);
  }

  if (packet.evidenceNeedPackets.length > 0) {
    lines.push(`Evidence needs: ${packet.evidenceNeedPackets.join("; ")}`);
  }

  if (packet.nextPhaseFeedForwardPack) {
    lines.push(
      `Feed-forward to next phase: ${packet.nextPhaseFeedForwardPack.headline} — ${packet.nextPhaseFeedForwardPack.carriesForward.join("; ")}`,
    );
  }

  if (packet.approvedInputsPackPresent) {
    lines.push("An approved Inputs Pack exists for the next phase.");
  }

  if (mode === "phase_input_draft") {
    lines.push(
      'Phase-input drafting mode: if and only if you can cite approved upstream phase state, emit one [[artifact:capture-field]] artifact per proposed field. Each artifact must use Shape {"phase": <0-5>, "key": <capture-section-key>, "value": <draft text>, "citations": [<source refs>], "confidence": "high"|"medium"|"low"}. Do not render uncited field drafts. Do not say the field is saved, done, approved, or captured; the user must insert the draft and save through phase capture.',
    );
  }

  if (packet.sourceImplication.relevant) {
    lines.push(
      `Source implication detected (${packet.sourceImplication.matchedKeywords.join(", ")}): ${packet.sourceImplication.suggestion}`,
    );
  }

  if (packet.towerMeasurement.relevant) {
    lines.push(
      `Tower measurement detected (${packet.towerMeasurement.matchedKeywords.join(", ")}): ${packet.towerMeasurement.suggestion}`,
    );
  }

  if (packet.caveats.length > 0) {
    lines.push(
      `Caveats — state these, do not guess: ${packet.caveats.join("; ")}`,
    );
  }

  lines.push(`Allowed: ${packet.allowedActions.join("; ")}`);
  lines.push(`Never: ${packet.disallowedActions.join("; ")}`);

  if (mode === "out_of_scope_redirect") {
    lines.push(
      `This question is broader than the active Move. Use a bounded redirect, e.g.: "${buildOutOfScopeRedirect(packet.moveTitle)}"`,
    );
  }

  return lines.join("\n");
}
