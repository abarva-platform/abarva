"use client";

// Client approval action for a single deliverable — the real
// "AI Draft → Client Approved" step, not another AI-generation trigger.
// Two modes: approve the AI-drafted content as-is, or upload an edited
// replacement file. Either way calls POST .../deliverables/:id/sign-off,
// which sets deliverables_v2.signed_off_version so later regeneration can
// never silently clobber the approval record (see v2-generator.ts /
// moves-generate-deps.ts).

import { useRef, useState } from "react";

interface Props {
  moveId: string;
  deliverableId: string;
  /** True once this exact version has already been client-approved. */
  alreadyApproved: boolean;
}

export function DeliverableApprovalAction({
  moveId,
  deliverableId,
  alreadyApproved,
}: Props) {
  const [busy, setBusy] = useState<"idle" | "approving" | "uploading">("idle");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function submitApproval(file?: File) {
    setError(null);
    setBusy(file ? "uploading" : "approving");
    try {
      const init: RequestInit = file
        ? { method: "POST", body: (() => {
            const form = new FormData();
            form.append("file", file);
            return form;
          })() }
        : { method: "POST" };
      const res = await fetch(
        `/api/v1/programs/${moveId}/deliverables/${deliverableId}/sign-off`,
        init,
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.detail || body?.error || `HTTP ${res.status}`);
      }
      // Server state changed (status/signed_off_version) — the page's next
      // load reflects it. A full reload keeps this component simple and
      // matches the rest of this server-rendered panel.
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approval failed");
      setBusy("idle");
    }
  }

  if (alreadyApproved) {
    return null;
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
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
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void submitApproval(file);
        }}
      />
      {error ? (
        <span style={{ fontSize: 10, color: "#B91C1C" }}>{error}</span>
      ) : null}
    </div>
  );
}
