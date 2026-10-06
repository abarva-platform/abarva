/**
 * Why a phase's Approve & Build is held, and what the held control is allowed
 * to say about it.
 *
 * The phase workspace disables Approve & Build whenever a capture section is
 * not `complete`, and states one reason on the disabled control. That reason
 * was derived from the count of incomplete sections alone, which collapses two
 * genuinely different situations into one sentence:
 *
 *   1. The person has not answered a question yet. "Complete 3 phase inputs"
 *      is true, and the control that fixes it is on the same screen.
 *   2. Every question is answered AND saved, but the sections are reported
 *      incomplete because this phase still has open REQUIRED evidence.
 *      `phaseCaptureStatusForSection` returns "Evidence open" for a section
 *      with no `evidenceFamily` of its own whenever the phase's evidence check
 *      has not passed, so a fully captured phase reads as 0/N inputs.
 *
 * In case 2 the stated reason named a control that is not on the page: the
 * person is told to complete inputs that are already complete, and the thing
 * actually blocking the build — evidence — is not mentioned. From P3 onward
 * that evidence is the discovery set, re-stamped onto the active phase by
 * `buildMoveEvidenceNeedPackets` (`Math.max(2, currentPhase)`), so it is not
 * even collected on the screen stating the blocker; it is closed in Files &
 * Evidence. A person following the stated reason at P4 has nothing to do.
 *
 * This module decides which of the two holds applies and writes the sentence
 * for it. It is pure so the distinction is asserted without rendering the
 * 10k-line workspace, and so one statement of the rule serves the disabled
 * control, the progress card, and anything else that explains the hold.
 *
 * It deliberately does NOT weaken the hold: an evidence hold still blocks the
 * build exactly as before. Only the explanation changes.
 */

/** How many evidence items a hold sentence may name before it summarises. */
const MAX_NAMED_EVIDENCE_SLOTS = 3;

export interface PhaseCaptureHoldInput {
  /**
   * Sections whose persisted value is empty, in flight, failed, or diverging
   * from the server — the person's own unfinished capture work.
   */
  unansweredCount: number;
  /**
   * Sections that are answered, saved, and structurally valid, and are
   * reported incomplete ONLY because this phase's evidence check has not
   * passed. Computed by the host as the difference between a section's status
   * with the real evidence verdict and its status with the verdict forced to
   * passed, so this module never re-implements the status machine.
   */
  evidenceHeldCount: number;
  /**
   * Labels of this phase's still-open REQUIRED evidence items. May be empty
   * even when `evidenceHeldCount` is positive (for example when the open items
   * are known only as a count), in which case the sentence names no item
   * rather than inventing one.
   */
  openRequiredEvidenceSlots: readonly string[];
}

export type PhaseCaptureHold =
  | { kind: "inputs"; count: number; message: string }
  | { kind: "evidence"; count: number; message: string }
  | null;

function pluralItems(count: number): string {
  return count === 1 ? "item" : "items";
}

/**
 * Resolve the hold to state on the phase's Approve & Build control.
 *
 * Unanswered capture wins, because that is work on the screen the person is
 * already looking at. Only once nothing is left to type does the evidence hold
 * become the honest answer.
 */
export function resolvePhaseCaptureHold(
  input: PhaseCaptureHoldInput,
): PhaseCaptureHold {
  const unanswered = Math.max(0, Math.trunc(input.unansweredCount));
  const evidenceHeld = Math.max(0, Math.trunc(input.evidenceHeldCount));

  if (unanswered > 0) {
    return {
      kind: "inputs",
      count: unanswered,
      message: `Complete ${unanswered} phase input${
        unanswered === 1 ? "" : "s"
      } before Approve & Build.`,
    };
  }
  if (evidenceHeld === 0) return null;

  const slots = input.openRequiredEvidenceSlots.filter(
    (slot) => typeof slot === "string" && slot.trim().length > 0,
  );
  const named = slots.slice(0, MAX_NAMED_EVIDENCE_SLOTS);
  const remaining = slots.length - named.length;
  // The count in the sentence is the count of OPEN EVIDENCE, never the count
  // of held sections: the held sections are complete, and saying "3 items"
  // about them is the claim this module exists to stop.
  const subject = slots.length > 0 ? slots.length : evidenceHeld;
  const detail =
    named.length > 0
      ? ` (${named.join(", ")}${remaining > 0 ? `, +${remaining} more` : ""})`
      : "";
  return {
    kind: "evidence",
    count: subject,
    message:
      `Phase inputs are captured. ${subject} required evidence ${pluralItems(
        subject,
      )}${detail} ${
        subject === 1 ? "is" : "are"
      } still open — review or approve ${
        subject === 1 ? "it" : "them"
      } in Files & Evidence before Approve & Build.`,
  };
}
