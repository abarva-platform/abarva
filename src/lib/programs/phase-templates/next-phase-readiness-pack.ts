// Moves — Next-Phase Readiness Pack: what the CURRENT phase must hand the
// NEXT phase so it never starts cold. Real gap data only — every entry is
// sourced from `MoveEvidenceNeedPacket` (already move-specific and
// evidence-readiness backed) filtered to the artifacts the next phase
// actually produces. Suggested sessions/templates are the phase's own
// standing guidance, not fabricated per-Move content. No LLM, no invented
// numbers — a need with no real data simply does not appear.

import type {
  MoveEvidenceNeedPacket,
  MoveEvidenceNeedPriority,
  MoveEvidenceNeedStatus,
} from "@/lib/programs/evidence-readiness/move-evidence-need-packet";
import type { DeliverableContentSignal } from "@/lib/deliverables/deliverable-content-signals";

export interface NextPhaseReadinessNeed {
  evidenceSlot: string;
  priority: MoveEvidenceNeedPriority;
  status: MoveEvidenceNeedStatus;
  acceptedFormats: string[];
  exampleTemplate: string;
  whyItMatters: string;
  nextAction: string;
}

export interface NextPhaseReadinessPack {
  nextPhaseLabel: string;
  isTerminalHandoff: boolean;
  openNeeds: NextPhaseReadinessNeed[];
  suggestedSessions: string[];
  suggestedTemplates: Array<{ name: string; type: string }>;
  isFullyReady: boolean;
  /**
   * Real signals (workstreams, owners, metrics) extracted from the current
   * phase's own generated deliverable content — see
   * `deliverable-content-signals.ts`. Empty when nothing has been generated
   * yet or no signal keyword had a real matching heading/table. Never
   * fabricated; absence is honest, not an error.
   */
  carriesForwardContent: DeliverableContentSignal[];
}

const PRIORITY_RANK: Record<MoveEvidenceNeedPriority, number> = {
  required: 0,
  recommended: 1,
  optional: 2,
};

const OPEN_STATUSES = new Set<MoveEvidenceNeedStatus>(["missing", "partial"]);

export interface BuildNextPhaseReadinessPackInput {
  nextPhaseLabel: string;
  nextPhaseNum: number;
  isTerminalHandoff: boolean;
  evidenceNeedPackets: MoveEvidenceNeedPacket[];
  suggestedSessions: string[];
  suggestedTemplates: Array<{ name: string; type: string }>;
  /** Real content signals from the current phase's own generated deliverable(s). */
  carriesForwardContent?: DeliverableContentSignal[];
}

export function buildNextPhaseReadinessPack(
  input: BuildNextPhaseReadinessPackInput,
): NextPhaseReadinessPack {
  const openNeeds: NextPhaseReadinessNeed[] = input.evidenceNeedPackets
    .filter((packet) => OPEN_STATUSES.has(packet.status))
    .filter((packet) =>
      packet.blockedArtifacts.some((artifact) => artifact.phase === input.nextPhaseNum),
    )
    .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority])
    .map((packet) => ({
      evidenceSlot: packet.evidenceSlot,
      priority: packet.priority,
      status: packet.status,
      acceptedFormats: packet.acceptedFormats,
      exampleTemplate: packet.exampleTemplate,
      whyItMatters: packet.whyItMatters,
      nextAction: packet.nextAction,
    }));

  return {
    nextPhaseLabel: input.nextPhaseLabel,
    isTerminalHandoff: input.isTerminalHandoff,
    openNeeds,
    suggestedSessions: input.suggestedSessions,
    suggestedTemplates: input.suggestedTemplates,
    isFullyReady: openNeeds.every((need) => need.priority !== "required"),
    carriesForwardContent: input.carriesForwardContent ?? [],
  };
}
