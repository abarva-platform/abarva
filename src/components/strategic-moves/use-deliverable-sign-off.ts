"use client";

import { useState } from "react";

/**
 * The one governed sign-off path for a generated deliverable, shared by every
 * surface that offers it (the gate ledger's `DeliverableApprovalAction` and
 * the step page's gate documents). It calls POST .../deliverables/:id/sign-off,
 * which sets deliverables_v2.signed_off_version for the CURRENT version, so a
 * later regeneration can never silently carry the signature forward.
 *
 * The server can refuse with `client_readiness_blockers`: findings in the
 * document the signer must explicitly acknowledge. The refusal keeps a pending
 * upload so acknowledging signs the same file the signer chose.
 */

export type ReadinessBlocker = {
  kind?: string;
  match?: string;
  why?: string;
  context?: string;
};

export type SignOffErrorState = {
  message: string;
  blockers?: ReadinessBlocker[];
  canAcknowledge?: boolean;
};

export type SignOffBusy = "idle" | "approving" | "uploading";

export function useDeliverableSignOff({
  moveId,
  deliverableId,
  onSigned = () => window.location.reload(),
}: {
  moveId: string;
  deliverableId: string;
  /**
   * Server state changed (status / signed_off_version). Default: reload, so the
   * server-rendered page reads the new state.
   */
  onSigned?: () => void;
}) {
  const [busy, setBusy] = useState<SignOffBusy>("idle");
  const [error, setError] = useState<SignOffErrorState | null>(null);
  const [pendingUpload, setPendingUpload] = useState<File | null>(null);

  async function submit(
    options: {
      file?: File;
      rationale?: string;
      acknowledgeReadinessBlockers?: boolean;
    } = {},
  ) {
    const { file, acknowledgeReadinessBlockers = false } = options;
    setError(null);
    setBusy(file ? "uploading" : "approving");
    try {
      const rationale = options.rationale?.trim() ?? "";
      const init: RequestInit = file
        ? {
            method: "POST",
            body: (() => {
              const form = new FormData();
              form.append("file", file);
              if (rationale) form.append("approvalRationale", rationale);
              if (acknowledgeReadinessBlockers) {
                form.append("acknowledgeReadinessBlockers", "true");
              }
              return form;
            })(),
          }
        : acknowledgeReadinessBlockers || rationale
          ? {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                ...(rationale ? { approvalRationale: rationale } : {}),
                ...(acknowledgeReadinessBlockers
                  ? { acknowledgeReadinessBlockers: true }
                  : {}),
              }),
            }
          : { method: "POST" };
      const res = await fetch(
        `/api/v1/programs/${moveId}/deliverables/${deliverableId}/sign-off`,
        init,
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (body?.error === "client_readiness_blockers") {
          if (file) setPendingUpload(file);
          setError({
            message:
              body?.detail ||
              "Client-readiness blockers must be acknowledged before sign-off.",
            blockers: Array.isArray(body?.blockers) ? body.blockers : [],
            canAcknowledge: true,
          });
          setBusy("idle");
          return;
        }
        setPendingUpload(null);
        setError({
          message:
            body?.detail ||
            body?.scannerDetail ||
            body?.error ||
            `HTTP ${res.status}`,
        });
        setBusy("idle");
        return;
      }
      onSigned();
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : "Approval failed",
      });
      setBusy("idle");
    }
  }

  return { busy, error, pendingUpload, submit };
}
