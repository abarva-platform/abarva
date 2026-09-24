import type { MovesAvaAnswerMode, MovesAvaChatPacket } from "./types";
import type { AvaPhaseInputProposal } from "@/lib/programs/phase-input-draft-proposals";

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
  if (packet.terminalHandoffComplete && packet.currentPhase === 5) {
    return buildTerminalP5ExecutionGuidance(packet, checklist);
  }

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

function buildTerminalP5ExecutionGuidance(
  packet: MovesAvaChatPacket,
  checklist: NonNullable<MovesAvaChatPacket["checklistStatus"]>,
): string {
  const metHardGates = packet.gateCriteria.filter(
    (criterion) => criterion.severity === "hard" && criterion.met,
  );
  const openHardGates = packet.gateCriteria.filter(
    (criterion) => criterion.severity === "hard" && !criterion.met,
  );
  const metGateSummary =
    metHardGates.length > 0
      ? metHardGates
          .slice(0, 4)
          .map((criterion) => criterion.label)
          .join("; ")
      : "terminal P5 handoff criteria in the live Move record";
  const openGateSummary =
    openHardGates.length > 0
      ? openHardGates.map((criterion) => criterion.label).join("; ")
      : "none";

  const lines = [
    `From the live Move record for ${packet.moveTitle}: ${checklist.evidenceLabel}; ${checklist.gateLabel}; can advance: ${checklist.canAdvance ? "yes" : "no"}.`,
    "",
    "Execution readiness answer:",
    `- Ready now: P5 is handed off to Tower. The completed hard-gate basis is ${metGateSummary}.`,
    `- Remaining blockers before Tower starts: ${openGateSummary}.`,
    "- Evidence posture: do not reopen P5 for new collection. Confirm the attached evidence pack is accessible to the Tower owner, then track any caveats as Tower follow-up items.",
    "",
    "Sessions to run next:",
    "- Tower kickoff: sponsor, delivery lead, Tower owner, and workstream owners confirm cadence, escalation path, first reporting date, and decision rights.",
    "- Metric baseline lock: finance/value owner, operating owner, and data owner confirm baseline, target, cadence, and source for each Tower metric.",
    "- Caveat burn-down: accountable owners review any residual risks, missing confirmations, or assumptions and assign dated follow-up actions outside the P5 gate.",
    "",
    "Metrics to carry into Tower:",
    "- Value realization: benefit baseline, target, and actuals cadence tied to the approved business case.",
    "- Adoption and operating health: workflow uptake, cycle time, exception volume, and owner sign-off cadence.",
    "- Delivery control: open caveats, overdue actions, dependency risk, and metric-source freshness.",
    "",
    "Next concrete action: schedule the Tower kickoff and metric baseline lock sessions, using the attached Move evidence pack as the source package. The live Move page remains the source of truth for current evidence, gate, and handoff status.",
  ];

  return lines.join("\n");
}

function sentinelJson(value: unknown): string {
  return JSON.stringify(value).replace(/<\//g, "<\\/");
}

export function buildDeterministicPhaseInputDraftAnswer(args: {
  packet: MovesAvaChatPacket;
  phase: number;
  proposals: AvaPhaseInputProposal[];
  refusal?: string | null;
}): string {
  if (args.proposals.length === 0) {
    return (
      args.refusal ||
      "I cannot draft phase inputs from approved upstream state yet. Add cited upstream phase capture first, or write the field manually."
    );
  }

  const lines = [
    `I found ${args.proposals.length} cited draft ${args.proposals.length === 1 ? "proposal" : "proposals"} for ${args.packet.currentPhaseClientLabel}.`,
    "They are not saved. Insert a proposal as a local draft, review it, then save through phase capture.",
    "",
  ];

  for (const proposal of args.proposals) {
    lines.push(
      `- ${proposal.fieldKey}: ${proposal.evidenceRefs.join("; ")}`,
      `[[artifact:capture-field]]${sentinelJson({
        phase: args.phase,
        key: proposal.fieldKey,
        value: proposal.proposedValue,
        citations: proposal.evidenceRefs,
        confidence: proposal.confidence,
      })}[[/artifact]]`,
    );
  }

  return lines.join("\n");
}
