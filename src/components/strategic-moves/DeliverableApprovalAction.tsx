"use client";

// Authorized workspace-user approval action for one generated deliverable.
// Two modes: approve the AI-drafted content as-is, or upload an edited
// replacement file. Either way calls POST .../deliverables/:id/sign-off,
// which sets deliverables_v2.signed_off_version so later regeneration can
// never silently clobber the approved version; governed regeneration uses the
// deliverable-version persistence contract.

import { useRef, useState } from "react";
import { useDeliverableSignOff } from "@/components/strategic-moves/use-deliverable-sign-off";

interface Props {
  moveId: string;
  deliverableId: string;
  /** True once this exact version has already been approved in the workspace. */
  alreadyApproved: boolean;
}

export function DeliverableApprovalAction({
  moveId,
  deliverableId,
  alreadyApproved,
}: Props) {
  const { busy, error, pendingUpload, submit } = useDeliverableSignOff({
    moveId,
    deliverableId,
  });
  const [approvalRationale, setApprovalRationale] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function submitApproval(file?: File, acknowledgeReadinessBlockers = false) {
    return submit({
      file,
      rationale: approvalRationale,
      acknowledgeReadinessBlockers,
    });
  }

  if (alreadyApproved) {
    return null;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 6,
      }}
    >
      <label
        htmlFor={`approval-rationale-${deliverableId}`}
        style={{ fontSize: 11, fontWeight: 600, color: "#475569" }}
      >
        Approval note (optional)
      </label>
      <textarea
        id={`approval-rationale-${deliverableId}`}
        aria-label="Approval note (optional)"
        value={approvalRationale}
        maxLength={1000}
        rows={2}
        placeholder="Record why this version is accepted"
        onChange={(event) => setApprovalRationale(event.target.value)}
        style={{
          width: "min(100%, 420px)",
          minHeight: 46,
          resize: "vertical",
          border: "1px solid #CBD5E1",
          borderRadius: 4,
          padding: "7px 9px",
          color: "#243142",
          fontSize: 12,
          lineHeight: 1.4,
        }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          disabled={busy !== "idle"}
          onClick={() => void submitApproval()}
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "#14532D",
            backgroundColor: "rgba(22,163,74,0.1)",
            border: "1px solid rgba(22,163,74,0.3)",
            borderRadius: 4,
            padding: "4px 8px",
            cursor: busy === "idle" ? "pointer" : "default",
            whiteSpace: "nowrap",
          }}
        >
          {busy === "approving" ? "Approving…" : "Approve as-is"}
        </button>
        <button
          type="button"
          disabled={busy !== "idle"}
          onClick={() => fileInputRef.current?.click()}
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: "#1B2B5C",
            backgroundColor: "rgba(27,43,92,0.05)",
            border: "1px solid rgba(27,43,92,0.2)",
            borderRadius: 4,
            padding: "4px 8px",
            cursor: busy === "idle" ? "pointer" : "default",
            whiteSpace: "nowrap",
          }}
        >
          {busy === "uploading" ? "Uploading…" : "Upload approved version"}
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void submitApproval(file);
          e.currentTarget.value = "";
        }}
      />
      {error ? (
        <div
          role="alert"
          style={{
            flexBasis: "100%",
            maxWidth: 520,
            border: "1px solid rgba(185,28,28,0.22)",
            borderRadius: 6,
            background: "rgba(254,242,242,0.88)",
            color: "#7F1D1D",
            padding: "8px 10px",
            fontSize: 12,
            lineHeight: 1.45,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 4 }}>
            {error.message}
          </div>
          {error.blockers?.length ? (
            <ul style={{ margin: "4px 0 8px 16px", padding: 0 }}>
              {error.blockers.map((blocker, index) => (
                <li key={`${blocker.kind ?? "blocker"}-${index}`}>
                  <strong>{blocker.kind ?? "blocker"}</strong>
                  {blocker.match ? `: ${blocker.match}` : ""}
                  {blocker.why ? ` - ${blocker.why}` : ""}
                </li>
              ))}
            </ul>
          ) : null}
          {error.canAcknowledge ? (
            <button
              type="button"
              disabled={busy !== "idle"}
              onClick={() =>
                void submitApproval(pendingUpload ?? undefined, true)
              }
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#7F1D1D",
                backgroundColor: "#FFFFFF",
                border: "1px solid rgba(185,28,28,0.35)",
                borderRadius: 4,
                padding: "5px 8px",
                cursor: busy === "idle" ? "pointer" : "default",
              }}
            >
              {pendingUpload
                ? "Acknowledge blockers and approve uploaded version"
                : "Acknowledge blockers and approve"}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
