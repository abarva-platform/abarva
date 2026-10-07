"use client";

/**
 * Explains the gate-versus-capture gap on a phase that has already advanced.
 *
 * Two independent measures sit on the same phase: the phase bar's gate tally
 * ("3 of 3 gate criteria") and the capture strip's answered count ("0 of 11
 * answered"). They are not the same thing. The gate is the governed
 * advancement rule; a phase can satisfy it from existing or migrated
 * origination data (or from approved evidence) without anyone working the
 * guided capture questions in this screen. So a phase the Move has already
 * moved past can honestly show a met gate and an empty capture strip at once.
 *
 * Left unexplained that reads as a contradiction — "it says done, why is
 * Continue disabled and nothing answered?". This band names the distinction
 * where the confusion is, and says the capture here is now optional enrichment,
 * not a blocker. It renders ONLY for an already-advanced phase (`state: done`)
 * whose capture is not fully answered; the host owns that condition.
 */
export function CaptureGateMetNotice({
  met,
  total,
}: {
  met: number;
  total: number;
}) {
  return (
    <div
      role="status"
      data-testid="capture-gate-met-notice"
      style={{
        margin: "0 0 12px",
        padding: "10px 12px",
        border: "1px solid #cfe3d4",
        borderRadius: 6,
        background: "#f7fbf8",
        fontSize: 13,
        lineHeight: 1.5,
        color: "#28402f",
      }}
    >
      <strong style={{ fontWeight: 600 }}>
        This phase already met its gate ({met} of {total} criteria) and the Move
        has moved past it.
      </strong>{" "}
      A phase can meet its gate from existing or migrated data, so the capture
      questions below were not all worked here. Answering them now only enriches
      the written brief — it is optional, and your answers save as you go. Use
      the phase bar above to move between phases.
    </div>
  );
}

/**
 * The host condition for showing the notice, as a pure function so the rule is
 * tested in isolation of the big phase client. Show it only for a phase the
 * Move has already advanced past (`state: done`) whose gate has criteria and
 * whose measured capture is started-or-empty but not fully answered. An
 * unmeasured capture row (`answered === null`) cannot claim a gap, so it never
 * triggers the notice.
 */
export function isGateMetWithCaptureUnfinished(
  tally: { state: string; total: number } | undefined,
  captureRow: { total: number; answered: number | null } | undefined,
): boolean {
  return Boolean(
    tally &&
      tally.state === "done" &&
      tally.total > 0 &&
      captureRow &&
      captureRow.total > 0 &&
      captureRow.answered !== null &&
      captureRow.answered < captureRow.total,
  );
}
