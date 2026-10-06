"use client";

import type { PhaseCaptureHold } from "@/lib/programs/phase-capture-hold";

/**
 * States why a fully captured step cannot continue.
 *
 * `MovesCaptureFlow` disables Continue whenever a question in the step is not
 * complete, and `phaseCaptureStatusForSection` reports "Evidence open" for any
 * section with no `evidenceFamily` of its own once the phase's evidence check
 * has not passed — which is every P3, P4 and P5 section. So a phase whose
 * questions are all answered and saved can sit on step 1 with Continue
 * disabled, a per-field badge as the only clue, and the thing actually holding
 * it (required evidence, closed in Files & Evidence, not on this screen) never
 * named. From P3 on that evidence is the discovery set re-stamped onto the
 * active phase by `buildMoveEvidenceNeedPackets`, so it is not even collected
 * here.
 *
 * Renders nothing unless the hold is an EVIDENCE hold. An inputs hold needs no
 * band: the control that clears it is the question on screen.
 */
export function CaptureEvidenceHoldNotice({
  hold,
  onOpenFiles,
}: {
  hold: PhaseCaptureHold;
  onOpenFiles?: () => void;
}) {
  if (!hold || hold.kind !== "evidence") return null;
  return (
    <div
      className="mxw-phase-blocker"
      role="status"
      data-testid="capture-evidence-hold"
    >
      <span>{hold.message}</span>
      {onOpenFiles ? (
        <button type="button" className="mcf-btn-quiet" onClick={onOpenFiles}>
          Open Files &amp; Evidence
        </button>
      ) : null}
    </div>
  );
}
