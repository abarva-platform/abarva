import type { MovesAvaAnswerMode, MovesAvaChatPacket } from "./types";

const DETERMINISTIC_STATUS_MODES = new Set<MovesAvaAnswerMode>([
  "evidence_gap",
  "gate_blocker",
  "next_phase_readiness",
]);

export function buildDeterministicMovesAvaStatusAnswer(
  packet: MovesAvaChatPacket,
  mode: MovesAvaAnswerMode,
): string | null {
  if (!DETERMINISTIC_STATUS_MODES.has(mode)) return null;
  const checklist = packet.checklistStatus;
  if (!checklist) return null;

  const lines = [
    `From the live Move record for ${packet.moveTitle}: ${checklist.evidenceLabel}; ${checklist.gateLabel}; can advance: ${checklist.canAdvance ? "yes" : "no"}.`,
    "",
    "Current workflow status:",
    `- Evidence readiness: ${checklist.evidenceLabel} - ${checklist.evidenceDone ? "met" : "open"}.`,
    `- Gate readiness: ${checklist.gateLabel} - ${checklist.gateDone ? "met" : "open"}.`,
    `- Next phase: ${checklist.canAdvance ? `ready for ${checklist.nextPhaseLabel ?? "the next phase"}` : `blocked before ${checklist.nextPhaseLabel ?? "the next phase"}`}.`,
  ];

  if (packet.evidenceNeedPackets.length > 0) {
    lines.push("", "Evidence still needed:");
    for (const need of packet.evidenceNeedPackets.slice(0, 6)) {
      lines.push(`- ${need}`);
    }
  }

  lines.push(
    "",
    "I am not using the generic phase-pack gate checklist as the live count. The live Move page is the source of truth for current evidence, gate, and advance status.",
  );

  return lines.join("\n");
}
