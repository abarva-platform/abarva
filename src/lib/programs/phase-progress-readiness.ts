import type { MoveEvidenceNeedPacket } from "@/lib/programs/evidence-readiness/move-evidence-need-packet";

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
