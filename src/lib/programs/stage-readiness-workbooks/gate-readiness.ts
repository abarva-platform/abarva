import type { StageReadinessProposalDisposition } from "./proposals";
import type { MoveEvidenceNeedPacket } from "@/lib/programs/evidence-readiness/move-evidence-need-packet";
import {
  charterReviewMissingFamiliesNextAction,
  familyNotInReviewNextAction,
  stageReadinessReviewHasDecidedRequiredResponse,
  uncoveredRequiredFamilyIds,
} from "./review-family-coverage";

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
    const requiredProposals = (proposals ?? []).filter(
      (proposal) => proposal.requirement === "required",
    );
    // Required only, which is what this packet's own next action has always
    // said. Requiring every RECOMMENDED response to be decided too made the
    // Charter phase unclosable whenever one optional cell was left empty: a
    // blank response is not reviewable from the review surface, so it could be
    // neither accepted nor rejected, and the workbook declares a recommended
    // question optional in the first place.
    const reviewComplete =
      requiredProposals.length > 0 &&
      requiredProposals.every((proposal) => proposal.disposition === "accepted");

    // Accepting every response in the review on file is not the same as having
    // been asked about every family that is required NOW. A review built from
    // an earlier family set is complete on its own terms and silent about the
    // rest, so coverage is checked separately — see `review-family-coverage`.
    const requiredPacketsBySlot = new Map<string, string>();
    for (const packet of packets) {
      if (packet.priority !== "required") continue;
      if (!requiredPacketsBySlot.has(packet.familyId)) {
        requiredPacketsBySlot.set(packet.familyId, packet.evidenceSlot);
      }
    }
    const uncoveredCharterFamilies = uncoveredRequiredFamilyIds({
      requiredFamilyIds: [...requiredPacketsBySlot.keys()],
      proposals,
    });

    if (reviewComplete && uncoveredCharterFamilies.length === 0) return packets;

    return [
      ...packets,
      readinessWorkbookPacket(
        moveId ?? packets[0]?.moveId ?? "",
        1,
        uncoveredCharterFamilies.length > 0
          ? charterReviewMissingFamiliesNextAction(
              uncoveredCharterFamilies.map(
                (familyId) => requiredPacketsBySlot.get(familyId) ?? familyId,
              ),
            )
          : "Review all required P1 to P2 workbook responses before closing the Charter phase.",
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

  // A transition whose workbook has not been reviewed AT ALL is one missing
  // workbook, not one missing item per required evidence family. Reporting it
  // per family told a Move with 11 of 11 families approved that "11 required
  // evidence items are still open" and never named the one artifact that would
  // clear the phase — the P1 branch above has always reported this as a single
  // named packet. A workbook that HAS been reviewed, but not for this family,
  // stays that family's own gap: the answer really is missing there.
  // "Not reviewed at all" is a question about the REQUIRED responses: a review
  // in which none of them has been acted on is a workbook nobody has reviewed,
  // whether or not the proposals were loaded. Reading it off the loaded set
  // alone would have reported a workbook reviewed down to one held response as
  // one gap per family again, which is what the comment above exists to stop.
  const anyRequiredDecided =
    stageReadinessReviewHasDecidedRequiredResponse(proposals);
  if (requiredProposalsByDimension.size === 0 || !anyRequiredDecided) {
    const nextAction = workbookUnreviewedNextAction(phase);
    return [
      ...packets.map((packet) =>
        packet.phase === phase && packet.priority === "required"
          ? markTransitionNotEstablished(packet, phase, nextAction, false)
          : packet,
      ),
      readinessWorkbookPacket(
        moveId ?? packets[0]?.moveId ?? "",
        phase,
        nextAction,
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
    // The review HAS been worked — the `anyRequiredDecided` guard above already
    // established that — so a family with no required response here is one this
    // workbook does not ask about, not one nobody has reviewed. Telling the
    // reviewer to complete the workbook would name a control that cannot clear
    // it: the workbook on file has no question for this family, and only a
    // fresh download does. See `review-family-coverage`.
    // Asked through the shared helper rather than off `dimensionProposals`
    // directly, so this reading and the Charter one above cannot drift on what
    // "covered" means.
    const familyNotInReview =
      uncoveredRequiredFamilyIds({
        requiredFamilyIds: [packet.familyId],
        proposals,
      }).length > 0;
    const nextAction = familyNotInReview
      ? familyNotInReviewNextAction(phase, packet.evidenceSlot)
      : reasons.has("source_not_linked")
        ? "Link each required response to an approved uploaded evidence item in this evidence family."
        : reasons.has("source_not_named")
        ? "Name the approved source file or interview record supporting each required answer."
        : reasons.has("answer_unresolved")
          ? "Replace unknown or insufficient responses with evidence-backed answers before this phase closes."
          : "Review and accept each required readiness-workbook response before this phase closes.";

    return markTransitionNotEstablished(packet, phase, nextAction, true);
  });
}

function workbookUnreviewedNextAction(phase: number): string {
  return `Complete the P${phase} to P${phase + 1} readiness workbook with an evidence-backed answer and source reference.`;
}

/**
 * This evidence family is not phase-ready: nothing may be drafted from it, and
 * anything generated anyway carries the caveat.
 *
 * `downgradeCovered` is the one difference between the two readings this module
 * keeps, stated here so they cannot drift apart. A family whose OWN required
 * answers are unresolved, unsourced, or unlinked is a fact about that family,
 * so its approved evidence stops counting as covered and it is reported as that
 * family's gap. A transition whose workbook is wholly unreviewed is not a fact
 * about any one family — the evidence really is approved and present — so the
 * status is left alone and the missing review is reported once, as its own
 * required packet. Either way the phase still cannot close: the gate counts the
 * workbook packet instead of counting the families.
 */
function markTransitionNotEstablished(
  packet: MoveEvidenceNeedPacket,
  phase: number,
  nextAction: string,
  downgradeCovered: boolean,
): MoveEvidenceNeedPacket {
  return {
    ...packet,
    status:
      downgradeCovered && packet.status === "covered"
        ? "partial"
        : packet.status,
    canDraftBoundary: {
      ...packet.canDraftBoundary,
      canDraft: false,
      canDraftLabel:
        "Evidence is present, but transition readiness is not established.",
      cannotDraftLabel: "Do not treat this evidence family as phase-ready yet.",
    },
    preliminaryGenerationCaveat: `The P${phase} to P${phase + 1} readiness review is incomplete for ${packet.evidenceSlot}.`,
    nextAction,
  };
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
    // Not from a family guidance table — this packet's wording is its own.
    guidanceBasis: "packet_specific",
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
