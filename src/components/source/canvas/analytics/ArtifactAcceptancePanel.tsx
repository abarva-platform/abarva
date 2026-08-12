"use client";

import { useState, type CSSProperties, type FormEvent } from "react";
import { ANALYTICS } from "./analytics-tokens";
import type { ArtifactAcceptanceRecord } from "@/lib/source/artifact-acceptances";
import type { ArtifactAuthorityDecision } from "@/lib/source/contracts/artifact-authority";
import {
  normalizeArtifactBlockers,
  type ArtifactBlockerLike,
} from "@/lib/source/contracts/blocker-copy";
import { ArtifactBlockerList } from "../ArtifactBlockerList";
import type { SourceArtifactOperation } from "@/lib/source/artifact-operations";

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
  operation?: SourceArtifactOperation | null;
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
  if (status === "current")
    return { bg: ANALYTICS.GREEN_TINT, fg: ANALYTICS.GREEN_TEXT };
  if (status === "stale")
    return { bg: ANALYTICS.AMBER_TINT, fg: ANALYTICS.AMBER_TEXT };
  return { bg: "rgba(10,10,11,0.06)", fg: ANALYTICS.MUTED };
}

export function ArtifactAcceptancePanel({
  eventId,
  artifactCode,
  artifactName,
  latestAcceptance,
  operation,
  onAccepted,
}: ArtifactAcceptancePanelProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [blockers, setBlockers] = useState<ArtifactBlockerLike[]>([]);
  const [authority, setAuthority] = useState<ArtifactAuthorityDecision | null>(
    null,
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBlockers([]);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const approvalRationale = String(
      formData.get("approvalRationale") ?? "",
    ).trim();
    if (!approvalRationale) {
      setBlockers([
        {
          code: "rationale_required",
          detail: "A reason for accepting this artifact is required.",
        },
      ]);
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
        authority?: ArtifactAuthorityDecision;
      } | null;
      if (!response.ok || !payload?.ok) {
        setBlockers(
          normalizeArtifactBlockers(payload, "Accepting the artifact failed."),
        );
        return;
      }
      form.reset();
      setOpen(false);
      setAuthority(payload.authority ?? null);
      onAccepted?.();
    } catch {
      setBlockers([
        {
          code: "network_error",
          detail: "Could not reach the server to accept this artifact.",
        },
      ]);
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
            Gate precondition:{" "}
            {latestAcceptance.gatePreconditionStatus.replace("_", " ")}
          </div>
        </div>
      ) : null}
      {authority ? (
        <div
          data-testid={`source-shell-artifact-authority-${artifactCode}`}
          style={AUTHORITY_STYLE}
        >
          {authority.isFinal
            ? "Accepted, authoritative, and final."
            : authority.isExportEligible
              ? "Accepted and authoritative — cleared for export."
              : authority.isAuthoritative
                ? "Accepted and authoritative, but not yet cleared for export — see below."
                : "Accepted, but not yet authoritative — see below."}
          {authority.blockers.length > 0 ? (
            <ArtifactBlockerList
              blockers={authority.blockers}
              testIdPrefix={`source-shell-artifact-authority-${artifactCode}`}
            />
          ) : null}
        </div>
      ) : null}
      {operation ? (
        <ArtifactContextManifest
          artifactCode={artifactCode}
          operation={operation}
        />
      ) : null}
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setBlockers([]);
        }}
        data-testid={`source-shell-artifact-accept-toggle-${artifactCode}`}
        style={TOGGLE_STYLE}
      >
        {latestAcceptance
          ? "Re-accept with a new reason"
          : "Accept as authoritative"}
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
            <select
              name="contentDriftStatus"
              defaultValue="unknown"
              style={INPUT_STYLE}
            >
              {DRIFT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label style={LABEL_STYLE}>
            Gate precondition
            <select
              name="gatePreconditionStatus"
              defaultValue="ready"
              style={INPUT_STYLE}
            >
              {GATE_PRECONDITION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label style={LABEL_STYLE}>
            Agent context eligibility
            <select
              name="downstreamContextPolicy"
              defaultValue="restricted"
              style={INPUT_STYLE}
            >
              {CONTEXT_POLICY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <ArtifactBlockerList
            blockers={blockers}
            testIdPrefix={`source-shell-artifact-accept-${artifactCode}`}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={GHOST_STYLE}
            >
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

function ArtifactContextManifest({
  artifactCode,
  operation,
}: {
  artifactCode: string;
  operation: SourceArtifactOperation;
}) {
  return (
    <div
      data-testid={`source-shell-artifact-context-${artifactCode}`}
      style={MANIFEST_STYLE}
    >
      <div style={MANIFEST_HEADER_STYLE}>
        <span>Context manifest</span>
        <span
          style={{
            ...MANIFEST_STATUS_STYLE,
            ...operationStatusTone(operation.status),
          }}
        >
          {operation.status}
        </span>
      </div>
      <div style={MANIFEST_GRID_STYLE}>
        <ManifestLine
          label="Source of record"
          value={operation.sourceOfRecord}
        />
        <ManifestLine label="Store and parse" value={operation.parseAndStore} />
        <ManifestLine label="Agent use" value={operation.agentUse} />
        <ManifestLine label="Current gap" value={operation.nextGap} />
      </div>
      <div style={MANIFEST_FOOTER_STYLE}>
        Human approval owner: {operation.goldStandard.approvalOwner}. Supported
        uploads: {operation.acceptedFormats.join(", ")}.
      </div>
    </div>
  );
}

function ManifestLine({ label, value }: { label: string; value: string }) {
  return (
    <div style={MANIFEST_LINE_STYLE}>
      <span style={MANIFEST_LINE_LABEL_STYLE}>{label}</span>
      <p style={MANIFEST_LINE_VALUE_STYLE}>{value}</p>
    </div>
  );
}

function operationStatusTone(
  status: SourceArtifactOperation["status"],
): CSSProperties {
  if (status === "wired") {
    return {
      background: ANALYTICS.GREEN_TINT,
      color: ANALYTICS.GREEN_TEXT,
    };
  }
  if (status === "planned") {
    return {
      background: "rgba(10,10,11,0.06)",
      color: ANALYTICS.MUTED,
    };
  }
  return {
    background: ANALYTICS.AMBER_TINT,
    color: ANALYTICS.AMBER_TEXT,
  };
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

const AUTHORITY_STYLE: CSSProperties = {
  marginTop: 8,
  border: `1px solid ${ANALYTICS.LINE_SOFT}`,
  borderRadius: ANALYTICS.RADIUS_SM,
  background: ANALYTICS.GREEN_TINT,
  color: ANALYTICS.GREEN_TEXT,
  padding: "8px 10px",
  fontSize: 11.5,
  fontWeight: 700,
  display: "grid",
  gap: 6,
};

const MANIFEST_STYLE: CSSProperties = {
  marginTop: 8,
  border: `1px solid ${ANALYTICS.LINE_SOFT}`,
  borderRadius: ANALYTICS.RADIUS_SM,
  background: ANALYTICS.CARD,
  padding: 10,
  display: "grid",
  gap: 8,
};

const MANIFEST_HEADER_STYLE: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  alignItems: "center",
  fontFamily: ANALYTICS.MONO,
  fontSize: 10,
  fontWeight: 900,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: ANALYTICS.FAINT,
};

const MANIFEST_GRID_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 8,
};

const MANIFEST_LINE_STYLE: CSSProperties = {
  display: "grid",
  gap: 3,
  color: ANALYTICS.INK_2,
  fontSize: 11.5,
  lineHeight: 1.38,
};

const MANIFEST_LINE_LABEL_STYLE: CSSProperties = {
  fontFamily: ANALYTICS.MONO,
  fontSize: 9.5,
  fontWeight: 900,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: ANALYTICS.FAINT,
};

const MANIFEST_LINE_VALUE_STYLE: CSSProperties = {
  margin: 0,
};

const MANIFEST_STATUS_STYLE: CSSProperties = {
  display: "inline-flex",
  borderRadius: 999,
  padding: "2px 7px",
  fontWeight: 900,
};

const MANIFEST_FOOTER_STYLE: CSSProperties = {
  borderTop: `1px solid ${ANALYTICS.LINE_SOFT}`,
  paddingTop: 7,
  color: ANALYTICS.MUTED,
  fontSize: 11,
  lineHeight: 1.35,
};
