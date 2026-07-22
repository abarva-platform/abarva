"use client";

import { useState, type CSSProperties, type FormEvent } from "react";
import { ANALYTICS } from "./analytics-tokens";
import type { ArtifactAcceptanceRecord } from "@/lib/source/artifact-acceptances";

// SOURCE-SHELL-004 — the "Artifact status" panel: an explicit, reasoned
// "accept this artifact as authoritative" action, distinct from the stage
// GATE (the separate Approvals ledger / ApprovalsWorkspace). Plain-language
// copy only — never "Track A" / "Track B" on screen, per direct user
// feedback in an earlier session.

interface ArtifactAcceptancePanelProps {
  eventId: string;
  artifactCode: string;
  artifactName: string;
  latestAcceptance: ArtifactAcceptanceRecord | null;
  onAccepted?: () => void;
}

const DRIFT_OPTIONS: { value: string; label: string }[] = [
  { value: "current", label: "Current — matches live facts" },
  { value: "stale", label: "Stale — live facts have moved on" },
  { value: "unknown", label: "Unknown — not checked" },
];
const GATE_PRECONDITION_OPTIONS: { value: string; label: string }[] = [
  { value: "ready", label: "Ready — satisfies this stage's gate criteria" },
  { value: "waived", label: "Waived — accepted without meeting a criterion" },
  { value: "not_ready", label: "Not ready" },
];
const CONTEXT_POLICY_OPTIONS: { value: string; label: string }[] = [
  { value: "include", label: "Include — eligible for agent context" },
  { value: "exclude", label: "Exclude — never used as agent context" },
  { value: "restricted", label: "Restricted — default, needs explicit review" },
];

function driftTone(status: string): { bg: string; fg: string } {
  if (status === "current") return { bg: ANALYTICS.GREEN_TINT, fg: ANALYTICS.GREEN_TEXT };
  if (status === "stale") return { bg: ANALYTICS.AMBER_TINT, fg: ANALYTICS.AMBER_TEXT };
  return { bg: "rgba(10,10,11,0.06)", fg: ANALYTICS.MUTED };
}

export function ArtifactAcceptancePanel({
  eventId,
  artifactCode,
  artifactName,
  latestAcceptance,
  onAccepted,
}: ArtifactAcceptancePanelProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const approvalRationale = String(formData.get("approvalRationale") ?? "").trim();
    if (!approvalRationale) {
      setError("A reason for accepting this artifact is required.");
      return;
    }
    setPending(true);
    try {
      const response = await fetch(
        `/api/v1/source/${encodeURIComponent(eventId)}/artifacts/${encodeURIComponent(artifactCode)}/accept`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            approvalRationale,
            contentDriftStatus: formData.get("contentDriftStatus"),
            gatePreconditionStatus: formData.get("gatePreconditionStatus"),
            downstreamContextPolicy: formData.get("downstreamContextPolicy"),
            diffSummary: formData.get("diffSummary") || undefined,
          }),
        },
      );
      const payload = (await response.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
        detail?: string;
      } | null;
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.detail ?? payload?.error ?? "Accepting the artifact failed.");
      }
      form.reset();
      setOpen(false);
      onAccepted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Accepting the artifact failed.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div style={{ marginTop: 10 }}>
      {latestAcceptance ? (
        <div
          data-testid={`source-shell-artifact-status-${artifactCode}`}
          style={{
            border: `1px solid ${ANALYTICS.LINE_SOFT}`,
            borderRadius: ANALYTICS.RADIUS_SM,
            background: ANALYTICS.CARD,
            padding: 10,
            fontSize: 11.5,
            display: "grid",
            gap: 6,
          }}
        >
          <div
            style={{
              fontFamily: ANALYTICS.MONO,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: ANALYTICS.FAINT,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            Artifact status
            <span
              style={{
                display: "inline-flex",
                borderRadius: 999,
                padding: "2px 7px",
                fontWeight: 800,
                ...driftTone(latestAcceptance.contentDriftStatus),
              }}
            >
              {latestAcceptance.contentDriftStatus}
            </span>
          </div>
          <div style={{ color: ANALYTICS.INK_2 }}>
            Accepted by {latestAcceptance.acceptedBy} on{" "}
            {new Date(latestAcceptance.acceptedAt).toLocaleDateString()}
          </div>
          <div style={{ color: ANALYTICS.MUTED, lineHeight: 1.4 }}>
            &ldquo;{latestAcceptance.approvalRationale}&rdquo;
          </div>
          {latestAcceptance.diffSummary ? (
            <div style={{ color: ANALYTICS.MUTED, lineHeight: 1.4 }}>
              Change since prior version: {latestAcceptance.diffSummary}
            </div>
          ) : null}
          <div style={{ color: ANALYTICS.FAINT }}>
            Gate precondition: {latestAcceptance.gatePreconditionStatus.replace("_", " ")}
          </div>
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setError(null);
        }}
        data-testid={`source-shell-artifact-accept-toggle-${artifactCode}`}
        style={TOGGLE_STYLE}
      >
        {latestAcceptance ? "Re-accept with a new reason" : "Accept as authoritative"}
      </button>
      {open ? (
        <form
          onSubmit={handleSubmit}
          data-testid={`source-shell-artifact-accept-form-${artifactCode}`}
          style={{
            marginTop: 8,
            border: `1px solid ${ANALYTICS.LINE_SOFT}`,
            borderRadius: ANALYTICS.RADIUS_SM,
            background: ANALYTICS.SOFT,
            padding: 12,
            display: "grid",
            gap: 8,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 800, color: ANALYTICS.INK }}>
            Accept {artifactName} as authoritative
          </div>
          <label style={LABEL_STYLE}>
            Reason (required)
            <textarea
              name="approvalRationale"
              rows={2}
              required
              style={TEXTAREA_STYLE}
              placeholder="Why is this version being accepted now?"
            />
          </label>
          <label style={LABEL_STYLE}>
            Change since prior version (optional)
            <input name="diffSummary" type="text" style={INPUT_STYLE} />
          </label>
          <label style={LABEL_STYLE}>
            Content drift
            <select name="contentDriftStatus" defaultValue="unknown" style={INPUT_STYLE}>
              {DRIFT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label style={LABEL_STYLE}>
            Gate precondition
            <select name="gatePreconditionStatus" defaultValue="ready" style={INPUT_STYLE}>
              {GATE_PRECONDITION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label style={LABEL_STYLE}>
            Agent context eligibility
            <select name="downstreamContextPolicy" defaultValue="restricted" style={INPUT_STYLE}>
              {CONTEXT_POLICY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          {error ? (
            <div role="alert" style={ERROR_STYLE}>
              {error}
            </div>
          ) : null}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button type="button" onClick={() => setOpen(false)} style={GHOST_STYLE}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              style={{ ...PRIMARY_STYLE, opacity: pending ? 0.6 : 1 }}
            >
              {pending ? "Accepting…" : "Accept"}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

const TOGGLE_STYLE: CSSProperties = {
  marginTop: 8,
  border: `1px solid ${ANALYTICS.LINE}`,
  borderRadius: ANALYTICS.RADIUS_SM,
  background: ANALYTICS.CARD,
  color: ANALYTICS.INK,
  fontFamily: ANALYTICS.SANS,
  fontSize: 11.5,
  fontWeight: 700,
  padding: "6px 10px",
  cursor: "pointer",
};

const LABEL_STYLE: CSSProperties = {
  display: "grid",
  gap: 4,
  fontFamily: ANALYTICS.SANS,
  fontSize: 11.5,
  fontWeight: 700,
  color: ANALYTICS.INK_2,
};

const INPUT_STYLE: CSSProperties = {
  border: `1px solid ${ANALYTICS.LINE}`,
  borderRadius: ANALYTICS.RADIUS_SM,
  padding: "6px 8px",
  fontSize: 12,
  fontFamily: ANALYTICS.SANS,
  color: ANALYTICS.INK,
};

const TEXTAREA_STYLE: CSSProperties = {
  ...INPUT_STYLE,
  resize: "vertical",
};

const GHOST_STYLE: CSSProperties = {
  border: `1px solid ${ANALYTICS.LINE}`,
  borderRadius: ANALYTICS.RADIUS_SM,
  background: ANALYTICS.CARD,
  color: ANALYTICS.INK_2,
  fontWeight: 700,
  fontSize: 12,
  padding: "6px 10px",
  cursor: "pointer",
};

const PRIMARY_STYLE: CSSProperties = {
  border: "1px solid #0f766e",
  borderRadius: ANALYTICS.RADIUS_SM,
  background: "#0f766e",
  color: "#fff",
  fontWeight: 800,
  fontSize: 12,
  padding: "6px 10px",
  cursor: "pointer",
};

const ERROR_STYLE: CSSProperties = {
  border: "1px solid #fecaca",
  borderRadius: ANALYTICS.RADIUS_SM,
  background: "#fff1f2",
  color: "#991b1b",
  padding: "6px 8px",
  fontSize: 11.5,
};
