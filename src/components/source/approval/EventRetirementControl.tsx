"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SOURCE_APPROVAL_REASON_MIN_LENGTH } from "@/lib/source/source-governance-enforcement";

export function EventRetirementControl({
  eventId,
  eventCode,
}: {
  eventId: string;
  eventCode: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canSubmit = reason.trim().length >= SOURCE_APPROVAL_REASON_MIN_LENGTH && acknowledged && !submitting;

  async function retire() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/source/events/${encodeURIComponent(eventId)}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", notes: reason.trim() }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.detail || "Retirement was not recorded.");
      }
      router.push("/source/new");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Retirement was not recorded.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section style={{ borderTop: "1px solid #d7dce1", marginTop: 24, paddingTop: 16 }}>
      {open ? (
        <div style={{ display: "grid", gap: 12, maxWidth: 580 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Retire {eventCode}</h3>
          <p style={{ color: "#475569", fontSize: 13, lineHeight: 1.5, margin: 0 }}>
            This archives the event and preserves its decision history. It does not approve the current stage.
          </p>
          <label style={{ display: "grid", gap: 6, fontSize: 13, fontWeight: 600 }}>
            Reason for retirement
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              minLength={SOURCE_APPROVAL_REASON_MIN_LENGTH}
              style={{ border: "1px solid #94a3b8", borderRadius: 4, padding: 8, resize: "vertical" }}
            />
          </label>
          <label style={{ alignItems: "start", display: "flex", gap: 8, fontSize: 13 }}>
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(event) => setAcknowledged(event.target.checked)}
            />
            I understand this removes the event from active work while retaining its audit history.
          </label>
          {error ? <p role="alert" style={{ color: "#b42318", margin: 0 }}>{error}</p> : null}
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={retire} disabled={!canSubmit}>
              {submitting ? "Retiring..." : "Confirm retirement"}
            </button>
            <button type="button" onClick={() => setOpen(false)} disabled={submitting}>Cancel</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setOpen(true)}>Retire event</button>
      )}
    </section>
  );
}
