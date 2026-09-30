import type { MoveEvidenceNeedPacket } from "@/lib/programs/evidence-readiness/move-evidence-need-packet";

export function p0SourceEvidenceNeedPacket(args: {
  moveId: string;
  evidenceTitles: string[];
  pendingReviewCount?: number;
}): MoveEvidenceNeedPacket {
  const covered = args.evidenceTitles.length > 0;
  const awaitingReview = !covered && (args.pendingReviewCount ?? 0) > 0;
  return {
    moveId: args.moveId,
    phase: 0,
    artifactType: null,
    evidenceSlot: "P0 source evidence",
    familyId: "p0_origination_source",
    priority: "required",
    ownerSource: "Client-provided source file",
    acceptedFormats: ["DOCX", "PDF", "PPTX", "XLSX", "CSV", "TXT", "MD"],
    exampleTemplate: "One source file supporting the Move mandate or scope",
    exampleContent: ["Executive note", "Workshop record", "Operational record"],
    whyItMatters:
      "P0 approval authorizes Discovery. At least one uploaded, parsed, and human-reviewed source file must support that decision.",
    blockedArtifacts: [],
    canDraftBoundary: {
      canDraft: true,
      canDraftLabel: "Draft the origination brief from captured intake",
      cannotDraftLabel:
        "Cannot approve P0 or unlock P1 without an approved source file",
    },
    preliminaryGenerationCaveat: null,
    waiverOption: null,
    nextAction: awaitingReview
      ? "Review the uploaded P0 source extraction in Files & Evidence, then approve P0."
      : "Upload one P0 source file in Files & Evidence, review its extraction, then approve P0.",
    status: covered ? "covered" : awaitingReview ? "partial" : "missing",
    evidenceTitles: args.evidenceTitles,
  };
}

export function currentPhaseRequiredEvidenceGaps(
  packets: readonly MoveEvidenceNeedPacket[],
  phase: number,
): MoveEvidenceNeedPacket[] {
  return packets.filter(
    (packet) =>
      packet.phase === phase &&
      packet.priority === "required" &&
      packet.status !== "covered" &&
      packet.status !== "waived" &&
      packet.status !== "not_applicable",
  );
}

export function phaseProgressReadiness(args: {
  phase: number;
  phaseCaptureBlocker: string | null;
  evidenceNeedPackets: readonly MoveEvidenceNeedPacket[];
}) {
  const requiredEvidenceGaps = currentPhaseRequiredEvidenceGaps(
    args.evidenceNeedPackets,
    args.phase,
  );

  return {
    requiredEvidenceGaps,
    ready:
      args.phaseCaptureBlocker === null && requiredEvidenceGaps.length === 0,
    blocker:
      requiredEvidenceGaps.length > 0
        ? `${requiredEvidenceGaps.length} required evidence item${requiredEvidenceGaps.length === 1 ? " is" : "s are"} still open.`
        : args.phaseCaptureBlocker,
  };
}
