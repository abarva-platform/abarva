"use client";

// Shared confirmation step for gate-approval actions (MOVES-UI-010). Both
// approval paths (P0's "Approve gate" and P1-P5's "Approve & Build") used to
// fire the instant the button was clicked, with no summary of what was being
// approved and no visible confirmation of who was approving. This dialog is
// purely additive client-side UI in front of the SAME existing mutation —
// the server already resolves the real approver identity from the session
// (resolvePhaseGateActorPersonId), this dialog only displays it back to the
// user before they commit. Reuses the same confirm-dialog CSS pattern
// already established in StrategicMoveOriginateClient.tsx.

import styles from "./StrategicMoves.module.css";

interface Props {
  open: boolean;
  title: string;
  /** Plain-language summary of exactly what will happen on confirm. */
  summary: string;
  /** e.g. "anand@apex-retail.com · Client admin" — the signed-in session's
   *  identity, threaded down from the server page component. Never
   *  free-text/user-editable — this is a display of who the session
   *  already resolves to, not an identity claim the user can alter. */
  approverLabel: string | null;
  confirmLabel?: string;
  cancelLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function GateApprovalConfirmDialog({
  open,
  title,
  summary,
  approverLabel,
  confirmLabel = "Confirm approval",
  cancelLabel = "Cancel",
  onCancel,
  onConfirm,
}: Props) {
  if (!open) return null;
  return (
    <div
      className={`${styles.confirmOverlay} ${styles.confirmOverlayShow}`}
      role="presentation"
    >
      <div
        className={styles.confirmDialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="gate-approval-confirm-title"
      >
        <h3 id="gate-approval-confirm-title" className={styles.confirmDialogTitle}>
          {title}
        </h3>
        <p className={styles.confirmDialogBody}>{summary}</p>
        {approverLabel ? (
          <p className={styles.confirmDialogBody} style={{ fontWeight: 700 }}>
            Approving as: {approverLabel}
          </p>
        ) : null}
        <div className={styles.confirmActions}>
          <button
            className={styles.confirmBtn}
            onClick={onCancel}
            type="button"
          >
            {cancelLabel}
          </button>
          <button
            className={`${styles.confirmBtn} ${styles.confirmBtnPrimary}`}
            onClick={onConfirm}
            type="button"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
