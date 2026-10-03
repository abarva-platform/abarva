import type { StageReadinessProposalDisposition } from "./proposals";
import type { MoveEvidenceNeedPacket } from "@/lib/programs/evidence-readiness/move-evidence-need-packet";

export type StageReadinessGateAnswerState =
  | "answered"
  | "unknown"
  | "insufficient_evidence"
  | "blank";

export interface StageReadinessGateProposal {
  questionId: string;
  dimensionId: string;
  requirement: "required" | "recommended";
  answerState: StageReadinessGateAnswerState;
  disposition: StageReadinessProposalDisposition;
  evidenceOrSource: string;
}

export interface StageReadinessGateBlocker {
  dimensionId: string;
  questionId: string;
  reason:
    | "review_required"
    | "answer_unresolved"
    | "source_not_named"
    | "source_not_linked";
}

export interface StageReadinessGateAssessment {
  ready: boolean;
  requiredCount: number;
  readyCount: number;
  blockers: StageReadinessGateBlocker[];
}

/** Required transition answers are complete only when a human accepts a substantive, sourced answer. */
export function assessStageReadinessGate(
  proposals: readonly StageReadinessGateProposal[] | null | undefined,
): StageReadinessGateAssessment {
  const required = (proposals ?? []).filter(
    (proposal) => proposal.requirement === "required",
  );
  const blockers: StageReadinessGateBlocker[] = [];
  let readyCount = 0;

  if (required.length === 0) {
    return {
      ready: false,
      requiredCount: 0,
      readyCount: 0,
      blockers: [
        {
          dimensionId: "stage_readiness_workbook",
          questionId: "required_workbook_review",
          reason: "review_required",
        },
      ],
    };
  }

  for (const proposal of required) {
    if (proposal.disposition !== "accepted") {
      blockers.push({
        dimensionId: proposal.dimensionId,
        questionId: proposal.questionId,
        reason: "review_required",
      });
      continue;
    }
    if (proposal.answerState !== "answered") {
      blockers.push({
        dimensionId: proposal.dimensionId,
        questionId: proposal.questionId,
        reason: "answer_unresolved",
      });
      continue;
    }
    if (!proposal.evidenceOrSource.trim()) {
      blockers.push({
        dimensionId: proposal.dimensionId,
        questionId: proposal.questionId,
        reason: "source_not_named",
      });
      continue;
    }
    readyCount += 1;
  }

  return {
    ready: blockers.length === 0,
    requiredCount: required.length,
    readyCount,
    blockers,
  };
}

/**
 * Keep the active phase's evidence checklist aligned with the reviewed
 * transition workbook. Presence of a file remains necessary, but cannot turn
 * an unknown or unsourced required answer into covered evidence.
 */
export function applyStageReadinessToEvidencePackets(
  packets: MoveEvidenceNeedPacket[],
  phase: number,
  proposals: readonly StageReadinessGateProposal[] | null | undefined,
  moveId?: string,
): MoveEvidenceNeedPacket[] {
  if (phase < 1 || phase > 4) return packets;

  if (phase === 1) {
    const allProposals = proposals ?? [];
    const requiredProposals = (proposals ?? []).filter(
      (proposal) => proposal.requirement === "required",
    );
    const reviewComplete =
      allProposals.length > 0 &&
      allProposals.every(
        (proposal) =>
          proposal.requirement === "required"
            ? proposal.disposition === "accepted"
            : proposal.disposition === "accepted" ||
              proposal.disposition === "rejected",
      ) &&
      requiredProposals.length > 0 &&
      requiredProposals.every((proposal) => proposal.disposition === "accepted");
    return reviewComplete
      ? packets
      : [
          ...packets,
          readinessWorkbookPacket(
            moveId ?? packets[0]?.moveId ?? "",
            1,
            "Review all required P1 to P2 workbook responses before closing the Charter phase.",
          ),
        ];
  }

  const requiredProposalsByDimension = new Map<
    string,
    StageReadinessGateProposal[]
  >();
  for (const proposal of proposals ?? []) {
    if (proposal.requirement !== "required") continue;
    const dimensionProposals =
      requiredProposalsByDimension.get(proposal.dimensionId) ?? [];
    dimensionProposals.push(proposal);
    requiredProposalsByDimension.set(proposal.dimensionId, dimensionProposals);
  }

  const phaseRequiredPackets = packets.filter(
    (packet) => packet.phase === phase && packet.priority === "required",
  );
  if (phaseRequiredPackets.length === 0) {
    return [
      ...packets,
      readinessWorkbookPacket(
        moveId ?? packets[0]?.moveId ?? "",
        phase,
        "Configure the required evidence families and complete the transition readiness workbook.",
      ),
    ];
  }

  return packets.map((packet) => {
    if (packet.phase !== phase || packet.priority !== "required") return packet;

    const dimensionProposals = requiredProposalsByDimension.get(packet.familyId);
    const assessment = assessStageReadinessGate(dimensionProposals);
    const evidenceRefs = [
      ...(packet.evidenceIds ?? []),
      ...packet.evidenceTitles,
    ]
      .map(normalizeEvidenceReference)
      .filter(Boolean);
    const unlinkedSources = (dimensionProposals ?? []).filter(
      (proposal) =>
        proposal.requirement === "required" &&
        proposal.disposition === "accepted" &&
        proposal.answerState === "answered" &&
        proposal.evidenceOrSource.trim() &&
        !evidenceRefs.some((reference) =>
          normalizeEvidenceReference(proposal.evidenceOrSource).includes(reference),
        ),
    );
    if (assessment.ready && unlinkedSources.length === 0) return packet;

    const reasons = new Set(assessment.blockers.map((blocker) => blocker.reason));
    if (unlinkedSources.length > 0) reasons.add("source_not_linked");
    const nextAction = !dimensionProposals?.length
      ? `Complete the P${phase} to P${phase + 1} readiness workbook with an evidence-backed answer and source reference.`
      : reasons.has("source_not_linked")
        ? "Link each required response to an approved uploaded evidence item in this evidence family."
        : reasons.has("source_not_named")
        ? "Name the approved source file or interview record supporting each required answer."
        : reasons.has("answer_unresolved")
          ? "Replace unknown or insufficient responses with evidence-backed answers before this phase closes."
          : "Review and accept each required readiness-workbook response before this phase closes.";

    return {
      ...packet,
      status: packet.status === "covered" ? "partial" : packet.status,
      canDraftBoundary: {
        ...packet.canDraftBoundary,
        canDraft: false,
        canDraftLabel: "Evidence is present, but transition readiness is not established.",
        cannotDraftLabel: "Do not treat this evidence family as phase-ready yet.",
      },
      preliminaryGenerationCaveat:
        `The P${phase} to P${phase + 1} readiness review is incomplete for ${packet.evidenceSlot}.`,
      nextAction,
    };
  });
}

function readinessWorkbookPacket(
  moveId: string,
  phase: number,
  nextAction: string,
): MoveEvidenceNeedPacket {
  return {
    moveId,
    phase,
    artifactType: null,
    evidenceSlot: `P${phase} to P${phase + 1} readiness workbook`,
    familyId: `stage_readiness_p${phase}_p${phase + 1}`,
    priority: "required",
    ownerSource: "Move team",
    acceptedFormats: ["XLSX"],
    exampleTemplate: "Stage readiness workbook",
    exampleContent: ["Evidence-backed answers with approved source references"],
    whyItMatters:
      "The next phase must not open on an unreviewed or unsupported evidence posture.",
    blockedArtifacts: [
      {
        artifactType: "stage_readiness_workbook",
        title: `P${phase + 1} readiness review`,
        phase: phase + 1,
        reason: "Required transition readiness review",
      },
    ],
    canDraftBoundary: {
      canDraft: false,
      canDraftLabel: "The transition review is still open.",
      cannotDraftLabel: "Do not advance without a reviewed readiness workbook.",
    },
    preliminaryGenerationCaveat: null,
    waiverOption: null,
    nextAction,
    status: "missing",
    evidenceTitles: [],
  };
}

function normalizeEvidenceReference(value: string): string {
  return value.trim().toLocaleLowerCase().replace(/\s+/g, " ");
}
