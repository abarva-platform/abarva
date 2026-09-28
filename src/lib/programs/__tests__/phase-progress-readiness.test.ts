import {
  currentPhaseRequiredEvidenceGaps,
  phaseProgressReadiness,
} from "../phase-progress-readiness";
import type { MoveEvidenceNeedPacket } from "../evidence-readiness/move-evidence-need-packet";

function packet(
  phase: number | null,
  status: MoveEvidenceNeedPacket["status"],
  priority: MoveEvidenceNeedPacket["priority"] = "required",
) {
  return { phase, status, priority } as MoveEvidenceNeedPacket;
}

describe("phase progress readiness", () => {
  it("keeps progression closed while required evidence for this phase is open", () => {
    const packets = [packet(3, "missing"), packet(2, "missing")];

    expect(currentPhaseRequiredEvidenceGaps(packets, 3)).toHaveLength(1);
    expect(
      phaseProgressReadiness({
        phase: 3,
        phaseCaptureBlocker: null,
        evidenceNeedPackets: packets,
      }),
    ).toMatchObject({ ready: false, blocker: "1 required evidence item is still open." });
  });

  it("enables progression when required evidence is covered or explicitly waived", () => {
    expect(
      phaseProgressReadiness({
        phase: 3,
        phaseCaptureBlocker: null,
        evidenceNeedPackets: [
          packet(3, "covered"),
          packet(3, "waived"),
          packet(3, "missing", "optional"),
          packet(2, "missing"),
        ],
      }).ready,
    ).toBe(true);
  });

  it("keeps progression closed for unsaved phase inputs even when evidence is clear", () => {
    expect(
      phaseProgressReadiness({
        phase: 3,
        phaseCaptureBlocker: "Save the recommendation before building.",
        evidenceNeedPackets: [packet(3, "covered")],
      }),
    ).toMatchObject({
      ready: false,
      blocker: "Save the recommendation before building.",
    });
  });
});
