"use client";

// ── Moves File Cabinet ────────────────────────────────────────────────────────
// The durable Artifact Vault view for a Move. Every artifact (generated
// deliverable, uploaded evidence, template, session output, approval packet,
// historical version) registered in move_artifacts (Azure Blob + Postgres) is
// listed here — organized by family, filterable, with open/download + version
// lineage. Reads /api/v1/programs/:id/artifacts (no browser-only files).

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface Artifact {
  artifactId: string;
  artifactType: string;
  family: string;
  title: string;
  phase: number | null;
  fileFormat: string;
  fileName: string;
  version: number;
  status: string;
  lifecycleState: string;
  qualityScore: number | null;
  unsupportedClaims: number;
  generatedBy: string | null;
  createdAt: string;
  fileSize: number | null;
  stored: string | null;
  openItems: string[];
  reviewStatus?: string | null;
  feedbackStatus?: string | null;
  feedbackItemCount?: number | null;
  regeneratedFromArtifactId?: string | null;
  qualityStatus?: string | null;
  goldenBarStatus?: string | null;
  artifactStatus?: string | null;
  preliminaryCaveat?: string | null;
  clientFacingVersionLabel?: string | null;
  outputRole?: string | null;
  provenanceCategory?: string | null;
  primaryEditableRecordLabel?: string | null;
  pairedVisualCompanionArtifactId?: string | null;
  visualCompanionArtifactType?: string | null;
  downloadUrl: string;
}

type SponsorReviewDecision =
  | "approve_for_p3_draft"
  | "request_revisions"
  | "hold_for_evidence";

interface SponsorReviewState {
  packet: {
    headline: string;
    diagnosticThesis: string;
    strongestEvidence: string[];
    quantifiedFacts: string[];
    knownLimitations: string[];
    missingEvidence: string[];
    decisionsRequired: string[];
    recommendedNextAction: string;
    p3Implication: string;
  };
  latestDecision: {
    decision: SponsorReviewDecision;
    rationale: string;
    created_at: string;
  } | null;
  readiness: {
    readyForP3Draft: boolean;
    readyForP3Final: boolean;
    p2FinalApproved: boolean;
    allowedNextAction: string;
    reason: string;
  };
}

interface SponsorReviewPostResponse extends SponsorReviewState {
  ok?: boolean;
  error?: string;
  detail?: string;
  decision?: {
    decision: SponsorReviewDecision;
    rationale: string;
    created_at: string;
  };
}

const FAMILIES: { key: string; label: string }[] = [
  { key: "generated_deliverable", label: "Deliverables" },
  { key: "session_artifact", label: "Session Artifacts" },
  { key: "uploaded_evidence", label: "Uploads & Evidence" },
  { key: "template", label: "Templates" },
  { key: "approval_artifact", label: "Approvals" },
  { key: "historical_version", label: "Historical" },
];

const STATUS_TONE: Record<string, { bg: string; fg: string }> = {
  board_ready: { bg: "#E6F4EA", fg: "#1E7E34" },
  approved: { bg: "#E6F4EA", fg: "#1E7E34" },
  aligned: { bg: "#E6F0FB", fg: "#1B2B5C" },
  review_required: { bg: "#FFF4E5", fg: "#B26A00" },
  preliminary: { bg: "#FFF4E5", fg: "#B26A00" },
  client_to_complete: { bg: "#FFF4E5", fg: "#B26A00" },
  evidence_missing: { bg: "#FDECEA", fg: "#B71C1C" },
  legal_review_required: { bg: "#FDECEA", fg: "#B71C1C" },
  blocked: { bg: "#FDECEA", fg: "#B71C1C" },
  draft: { bg: "#EEF0F3", fg: "#5A6472" },
  superseded: { bg: "#EEF0F3", fg: "#9AA3B2" },
  retired: { bg: "#EEF0F3", fg: "#9AA3B2" },
};

function fmtBytes(n: number | null): string {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso.slice(0, 10);
  }
}

function StatusChip({ status }: { status: string }) {
  const tone = STATUS_TONE[status] ?? { bg: "#EEF0F3", fg: "#5A6472" };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "1px 8px",
        borderRadius: 10,
        fontSize: 10.5,
        fontWeight: 600,
        background: tone.bg,
        color: tone.fg,
        letterSpacing: "0.01em",
        whiteSpace: "nowrap",
      }}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

function metaLabel(value: string | null | undefined): string {
  return value ? value.replace(/_/g, " ") : "";
}

export function artifactOutputRoleLabel(a: {
  outputRole?: string | null;
  fileFormat?: string | null;
}): string {
  if (a.outputRole === "docx_editable_phase_record") return "Editable deliverable";
  if (a.outputRole === "html_visual_review_companion") {
    return "Visual review companion";
  }
  if (a.fileFormat === "docx") return "Word-equivalent";
  if (a.fileFormat === "html") return "Review view";
  return "";
}

export function artifactFormatLabel(format: string | null | undefined): string {
  if (format === "docx") return "Word-equivalent";
  if (format === "html") return "HTML review view";
  if (format === "xlsx") return "Excel model";
  if (format === "pdf") return "PDF snapshot";
  return format ? format.toUpperCase() : "File";
}

function BulletList({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <ul style={{ margin: "6px 0 0", paddingLeft: 18, color: "#334155" }}>
      {items.slice(0, 6).map((item) => (
        <li key={item} style={{ marginBottom: 3 }}>
          {item}
        </li>
      ))}
    </ul>
  );
}

// Fetch an artifact with a short retry on 503 (transient tenant-lookup outage). A bare
// <a href> top-level navigation that hit a one-off 503 previously dead-ended Open/Download;
// fetching the bytes here lets us retry, then open/save via an object URL so the file is
// reliably delivered regardless of format/cookie quirks.
async function fetchArtifact(url: string): Promise<Blob> {
  const backoffMs = [250, 700];
  let res = await fetch(url, { credentials: "include" });
  for (let i = 0; res.status === 503 && i < backoffMs.length; i += 1) {
    await new Promise((r) => setTimeout(r, backoffMs[i]));
    res = await fetch(url, { credentials: "include" });
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.blob();
}

function ArtifactRow({
  a,
  moveId,
  onChanged,
}: {
  a: Artifact;
  moveId: string;
  onChanged: () => Promise<void>;
}) {
  const stored = a.stored === "azure_blob";
  const [busy, setBusy] = useState<null | "open" | "download">(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);
  const [packetLoading, setPacketLoading] = useState(false);
  const [sponsorReview, setSponsorReview] = useState<SponsorReviewState | null>(
    null,
  );
  const [decisionRationale, setDecisionRationale] = useState("");
  const [missingEvidenceText, setMissingEvidenceText] = useState("");
  const [actionErr, setActionErr] = useState<string | null>(null);
  const roleLabel = artifactOutputRoleLabel(a);

  const openArtifact = useCallback(async () => {
    setBusy("open");
    setActionErr(null);
    try {
      const blob = await fetchArtifact(`${a.downloadUrl}?inline=1`);
      const url = URL.createObjectURL(blob);
      const win = window.open(url, "_blank", "noopener");
      if (!win) {
        // Popup blocked — fall back to a same-tab navigation so Open is never a no-op.
        window.location.href = url;
      }
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      setActionErr(e instanceof Error ? e.message : "open failed");
    } finally {
      setBusy(null);
    }
  }, [a.downloadUrl]);

  const downloadArtifact = useCallback(async () => {
    setBusy("download");
    setActionErr(null);
    try {
      const blob = await fetchArtifact(a.downloadUrl);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download =
        a.fileName ||
        `${a.title.replace(/[\\/:*?"<>|]+/g, "_")}.${a.fileFormat || "bin"}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      setActionErr(e instanceof Error ? e.message : "download failed");
    } finally {
      setBusy(null);
    }
  }, [a.downloadUrl, a.fileName, a.title, a.fileFormat]);

  const submitReviewFeedback = useCallback(async () => {
    const text = feedbackText.trim();
    if (!text || reviewBusy) return;
    setReviewBusy(true);
    setActionErr(null);
    try {
      const res = await fetch(
        `/api/v1/programs/${moveId}/artifacts/${a.artifactId}/review-regenerate`,
        {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ feedbackText: text }),
        },
      );
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        detail?: string;
      };
      if (!res.ok || !json.ok) {
        throw new Error(json.detail || json.error || `HTTP ${res.status}`);
      }
      setFeedbackText("");
      setReviewOpen(false);
      await onChanged();
    } catch (e) {
      setActionErr(e instanceof Error ? e.message : "review update failed");
    } finally {
      setReviewBusy(false);
    }
  }, [a.artifactId, feedbackText, moveId, onChanged, reviewBusy]);

  const loadSponsorReview = useCallback(async () => {
    if (!reviewOpen || a.lifecycleState !== "current") return;
    setPacketLoading(true);
    setActionErr(null);
    try {
      const res = await fetch(
        `/api/v1/programs/${moveId}/artifacts/${a.artifactId}/review-decision`,
        { credentials: "include" },
      );
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      } & SponsorReviewState;
      if (!res.ok || !json.ok) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      setSponsorReview({
        packet: json.packet,
        latestDecision: json.latestDecision,
        readiness: json.readiness,
      });
    } catch (e) {
      setActionErr(e instanceof Error ? e.message : "review packet failed");
      setSponsorReview(null);
    } finally {
      setPacketLoading(false);
    }
  }, [a.artifactId, a.lifecycleState, moveId, reviewOpen]);

  useEffect(() => {
    void loadSponsorReview();
  }, [loadSponsorReview]);

  const submitSponsorDecision = useCallback(
    async (decision: SponsorReviewDecision) => {
      if (reviewBusy) return;
      const defaultRationale =
        decision === "approve_for_p3_draft"
          ? "P2 diagnostic accepted as sufficient to begin P3 draft shaping; final sponsor/signoff gates remain required."
          : decision === "request_revisions"
            ? "Reviewer requested changes before proceeding to P3."
            : "Reviewer requires missing evidence before proceeding to P3.";
      const rationale = (decisionRationale.trim() || defaultRationale).trim();
      setReviewBusy(true);
      setActionErr(null);
      try {
        const missingEvidence = missingEvidenceText
          .split(/\n|;/)
          .map((item) => item.trim())
          .filter(Boolean);
        const res = await fetch(
          `/api/v1/programs/${moveId}/artifacts/${a.artifactId}/review-decision`,
          {
            method: "POST",
            credentials: "include",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              decision,
              rationale,
              carriedForwardCaveats:
                sponsorReview?.packet.knownLimitations ?? [],
              missingEvidence:
                missingEvidence.length > 0
                  ? missingEvidence
                  : sponsorReview?.packet.missingEvidence ?? [],
            }),
          },
        );
        const json = (await res.json().catch(
          () => ({}),
        )) as SponsorReviewPostResponse;
        if (!res.ok || !json.ok) {
          throw new Error(json.detail || json.error || `HTTP ${res.status}`);
        }
        setSponsorReview({
          packet: json.packet,
          latestDecision: json.decision
            ? {
                decision: json.decision.decision,
                rationale: json.decision.rationale,
                created_at: json.decision.created_at,
              }
            : null,
          readiness: json.readiness,
        });
        await onChanged();
      } catch (e) {
        setActionErr(e instanceof Error ? e.message : "review decision failed");
      } finally {
        setReviewBusy(false);
      }
    },
    [
      a.artifactId,
      decisionRationale,
      missingEvidenceText,
      moveId,
      onChanged,
      reviewBusy,
      sponsorReview,
    ],
  );

  const hasReviewSignals =
    Boolean(a.regeneratedFromArtifactId) ||
    Boolean(a.reviewStatus) ||
    Boolean(a.feedbackItemCount) ||
    Boolean(a.qualityStatus) ||
    Boolean(a.goldenBarStatus);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: 8,
        padding: "11px 14px",
        borderBottom: "1px solid #EEF0F3",
        opacity: a.lifecycleState === "current" ? 1 : 0.62,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) auto",
          gap: 12,
          alignItems: "center",
        }}
      >
        <div style={{ minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#1A1A18",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {a.title}
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#5A6472",
              textTransform: "uppercase",
              background: "#F4F5F7",
              padding: "1px 6px",
              borderRadius: 4,
            }}
          >
            {artifactFormatLabel(a.fileFormat)}
          </span>
          {roleLabel && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color:
                  a.outputRole === "docx_editable_phase_record"
                    ? "#166534"
                    : "#1B2B5C",
                textTransform: "uppercase",
                background:
                  a.outputRole === "docx_editable_phase_record"
                    ? "#E6F4EA"
                    : "#E6F0FB",
                padding: "1px 6px",
                borderRadius: 4,
              }}
            >
              {roleLabel}
            </span>
          )}
          <span style={{ fontSize: 11, color: "#9AA3B2" }}>v{a.version}</span>
          {a.regeneratedFromArtifactId && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#1B2B5C",
                background: "#E6F0FB",
                padding: "1px 6px",
                borderRadius: 4,
              }}
            >
              Regenerated from feedback
            </span>
          )}
          <StatusChip status={a.status} />
        </div>
        <div
          style={{
            marginTop: 4,
            fontSize: 11,
            color: "#9AA3B2",
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          {a.phase != null && <span>Phase {a.phase}</span>}
          {a.qualityScore != null && <span>Quality {a.qualityScore}/100</span>}
          {a.unsupportedClaims > 0 && (
            <span style={{ color: "#B26A00" }}>
              {a.unsupportedClaims} unsupported
            </span>
          )}
          <span>{fmtBytes(a.fileSize)}</span>
          <span>{fmtDate(a.createdAt)}</span>
          <span
            title={
              stored
                ? "Stored in the secure artifact vault"
                : "Storage pending"
            }
            style={{ color: stored ? "#1E7E34" : "#B71C1C", fontWeight: 600 }}
          >
            {stored ? "Stored securely" : "Storage pending"}
          </span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        {actionErr && (
          <span
            style={{ fontSize: 10.5, color: "#B71C1C", whiteSpace: "nowrap" }}
            title={actionErr}
          >
            {actionErr}
          </span>
        )}
        <button
          onClick={() => setReviewOpen((open) => !open)}
          disabled={a.lifecycleState !== "current" || reviewBusy}
          style={{
            fontSize: 11.5,
            fontWeight: 600,
            color: "#1B2B5C",
            background: "transparent",
            border: "1px solid #D5DAE2",
            borderRadius: 5,
            padding: "5px 11px",
            whiteSpace: "nowrap",
            cursor:
              a.lifecycleState !== "current" || reviewBusy
                ? "default"
                : "pointer",
            opacity: a.lifecycleState !== "current" ? 0.5 : 1,
          }}
        >
          Sponsor review
        </button>
        <button
          onClick={openArtifact}
          disabled={busy !== null}
          style={{
            fontSize: 11.5,
            fontWeight: 600,
            color: "#1B2B5C",
            background: "transparent",
            border: "1px solid #D5DAE2",
            borderRadius: 5,
            padding: "5px 11px",
            whiteSpace: "nowrap",
            cursor: busy ? "default" : "pointer",
          }}
        >
          {busy === "open" ? "Opening…" : "Open"}
        </button>
        <button
          onClick={downloadArtifact}
          disabled={busy !== null}
          style={{
            fontSize: 11.5,
            fontWeight: 600,
            color: "#fff",
            background: busy ? "#9AA3B2" : "#1B2B5C",
            border: "none",
            borderRadius: 5,
            padding: "5px 11px",
            whiteSpace: "nowrap",
            cursor: busy ? "default" : "pointer",
          }}
        >
          {busy === "download" ? "Downloading…" : "Download"}
        </button>
      </div>
      </div>
      {hasReviewSignals && (
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            fontSize: 11.5,
            color: "#5A6472",
            lineHeight: 1.45,
          }}
        >
          {a.feedbackItemCount != null && (
            <span>{a.feedbackItemCount} feedback item(s) applied</span>
          )}
          {a.reviewStatus && <span>Review: {metaLabel(a.reviewStatus)}</span>}
          {a.qualityStatus && <span>Quality: {a.qualityStatus}</span>}
          {a.goldenBarStatus && (
            <span>Golden-bar check: {a.goldenBarStatus}</span>
          )}
          {a.preliminaryCaveat && (
            <span style={{ color: "#B26A00" }}>{a.preliminaryCaveat}</span>
          )}
        </div>
      )}
      {reviewOpen && (
        <div
          style={{
            border: "1px solid #D5DAE2",
            borderRadius: 8,
            background: "#FAFAF9",
            padding: 10,
          }}
        >
          <div
            style={{
              border: "1px solid #E2E8F0",
              borderRadius: 8,
              background: "#fff",
              padding: 12,
              marginBottom: 10,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
                alignItems: "flex-start",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: "#1B2B5C",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  P2 sponsor review packet
                </div>
                <p
                  style={{
                    margin: "6px 0 0",
                    fontSize: 12.5,
                    lineHeight: 1.45,
                    color: "#334155",
                  }}
                >
                  P2 diagnostic is review-ready. You can approve it for P3
                  draft shaping, request revisions, or hold for missing
                  evidence. Final phase approval still requires
                  sponsor/signoff gates.
                </p>
              </div>
              {packetLoading && (
                <span style={{ fontSize: 11, color: "#64748B" }}>
                  Loading packet…
                </span>
              )}
            </div>
            {sponsorReview && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 10,
                  marginTop: 12,
                  fontSize: 12,
                  lineHeight: 1.45,
                }}
              >
                <div>
                  <strong style={{ color: "#0F172A" }}>Diagnostic thesis</strong>
                  <p style={{ margin: "6px 0 0", color: "#334155" }}>
                    {sponsorReview.packet.diagnosticThesis}
                  </p>
                </div>
                <div>
                  <strong style={{ color: "#0F172A" }}>Quantified facts</strong>
                  <BulletList items={sponsorReview.packet.quantifiedFacts} />
                </div>
                <div>
                  <strong style={{ color: "#0F172A" }}>Known limitations</strong>
                  <BulletList items={sponsorReview.packet.knownLimitations} />
                </div>
                <div>
                  <strong style={{ color: "#0F172A" }}>P3 implication</strong>
                  <p style={{ margin: "6px 0 0", color: "#334155" }}>
                    {sponsorReview.packet.p3Implication}
                  </p>
                </div>
              </div>
            )}
            {sponsorReview?.latestDecision && (
              <div
                style={{
                  marginTop: 12,
                  padding: 10,
                  borderRadius: 7,
                  background: "#F0FDF4",
                  color: "#166534",
                  fontSize: 12,
                  lineHeight: 1.45,
                }}
              >
                Latest decision:{" "}
                <strong>{metaLabel(sponsorReview.latestDecision.decision)}</strong>
                . {sponsorReview.readiness.reason}
              </div>
            )}
            {sponsorReview && (
              <>
                <textarea
                  value={decisionRationale}
                  onChange={(e) => setDecisionRationale(e.target.value)}
                  rows={3}
                  placeholder="Optional rationale. If blank, AbarVa records the standard rationale for the selected decision."
                  style={{
                    width: "100%",
                    resize: "vertical",
                    border: "1px solid #D5DAE2",
                    borderRadius: 6,
                    padding: 8,
                    marginTop: 12,
                    fontSize: 12,
                    lineHeight: 1.45,
                    color: "#1A1A18",
                    background: "#fff",
                  }}
                />
                <textarea
                  value={missingEvidenceText}
                  onChange={(e) => setMissingEvidenceText(e.target.value)}
                  rows={2}
                  placeholder="Missing evidence to accept or require, one per line. Defaults to packet gaps if blank."
                  style={{
                    width: "100%",
                    resize: "vertical",
                    border: "1px solid #D5DAE2",
                    borderRadius: 6,
                    padding: 8,
                    marginTop: 8,
                    fontSize: 12,
                    lineHeight: 1.45,
                    color: "#1A1A18",
                    background: "#fff",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                    justifyContent: "flex-end",
                    marginTop: 10,
                  }}
                >
                  <button
                    onClick={() => void submitSponsorDecision("hold_for_evidence")}
                    disabled={reviewBusy}
                    style={{
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: "#92400E",
                      background: "#FFFBEB",
                      border: "1px solid #FCD34D",
                      borderRadius: 5,
                      padding: "6px 11px",
                    }}
                  >
                    Hold for evidence
                  </button>
                  <button
                    onClick={() => void submitSponsorDecision("request_revisions")}
                    disabled={reviewBusy}
                    style={{
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: "#1B2B5C",
                      background: "#EFF6FF",
                      border: "1px solid #BFDBFE",
                      borderRadius: 5,
                      padding: "6px 11px",
                    }}
                  >
                    Request revisions
                  </button>
                  <button
                    onClick={() =>
                      void submitSponsorDecision("approve_for_p3_draft")
                    }
                    disabled={reviewBusy}
                    style={{
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: "#fff",
                      background: reviewBusy ? "#9AA3B2" : "#166534",
                      border: "none",
                      borderRadius: 5,
                      padding: "6px 11px",
                    }}
                  >
                    {reviewBusy ? "Saving…" : "Approve for P3 draft"}
                  </button>
                </div>
              </>
            )}
          </div>
          <label
            style={{
              display: "block",
              fontSize: 11.5,
              fontWeight: 700,
              color: "#5A6472",
              marginBottom: 6,
            }}
          >
            Paste review notes to create the next version
          </label>
          <textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            rows={4}
            placeholder="Example: Add the missing AP exception aging caveat, keep this preliminary, and show what the client must upload before final approval."
            style={{
              width: "100%",
              resize: "vertical",
              border: "1px solid #D5DAE2",
              borderRadius: 6,
              padding: 8,
              fontSize: 12,
              lineHeight: 1.45,
              color: "#1A1A18",
              background: "#fff",
            }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 6,
              marginTop: 8,
            }}
          >
            <button
              onClick={() => setReviewOpen(false)}
              disabled={reviewBusy}
              style={{
                fontSize: 11.5,
                fontWeight: 600,
                color: "#5A6472",
                background: "transparent",
                border: "1px solid #D5DAE2",
                borderRadius: 5,
                padding: "5px 11px",
              }}
            >
              Cancel
            </button>
            <button
              onClick={submitReviewFeedback}
              disabled={!feedbackText.trim() || reviewBusy}
              style={{
                fontSize: 11.5,
                fontWeight: 600,
                color: "#fff",
                background:
                  !feedbackText.trim() || reviewBusy ? "#9AA3B2" : "#1B2B5C",
                border: "none",
                borderRadius: 5,
                padding: "5px 11px",
              }}
            >
              {reviewBusy ? "Creating version…" : "Create next version"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function FileCabinetPanel({
  moveId,
  phase = 0,
}: {
  moveId: string;
  phase?: number;
}) {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [family, setFamily] = useState<string>("all");
  const [showSuperseded, setShowSuperseded] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [uploadState, setUploadState] = useState<
    "idle" | "uploading" | "error"
  >("idle");
  const [uploadMsg, setUploadMsg] = useState<string>("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/v1/programs/${moveId}/artifacts`, {
        credentials: "include",
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      setArtifacts(Array.isArray(j.artifacts) ? j.artifacts : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "load failed");
    } finally {
      setLoading(false);
    }
  }, [moveId]);

  const onUpload = useCallback(
    async (file: File) => {
      setUploadState("uploading");
      setUploadMsg(`Uploading ${file.name}…`);
      try {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("phase", String(phase));
        fd.append("family", "uploaded_evidence");
        const r = await fetch(`/api/v1/programs/${moveId}/artifacts/upload`, {
          method: "POST",
          credentials: "include",
          body: fd,
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok || !j.ok)
          throw new Error(j.error || j.detail || `HTTP ${r.status}`);
        setUploadState("idle");
        setUploadMsg(
          `Uploaded ${file.name}${j.blobStored ? " → Azure Blob" : ""}.`,
        );
        await load();
      } catch (e) {
        setUploadState("error");
        setUploadMsg(e instanceof Error ? e.message : "upload failed");
      }
    },
    [moveId, phase, load],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(
    () =>
      artifacts
        .filter((a) => showSuperseded || a.lifecycleState === "current")
        .filter((a) => family === "all" || a.family === family),
    [artifacts, family, showSuperseded],
  );

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const a of artifacts) {
      if (!showSuperseded && a.lifecycleState !== "current") continue;
      m[a.family] = (m[a.family] ?? 0) + 1;
    }
    return m;
  }, [artifacts, showSuperseded]);

  const grouped = useMemo(() => {
    const m = new Map<string, Artifact[]>();
    for (const a of visible) {
      const arr = m.get(a.family) ?? [];
      arr.push(a);
      m.set(a.family, arr);
    }
    return m;
  }, [visible]);

  const totalCurrent = artifacts.filter(
    (a) => a.lifecycleState === "current",
  ).length;

  return (
    <div style={{ padding: "0 4px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: "Georgia, serif",
              fontSize: 18,
              fontWeight: 400,
              color: "#1A1A18",
              margin: 0,
            }}
          >
            File Cabinet
          </h2>
          <p style={{ fontSize: 12, color: "#9AA3B2", margin: "3px 0 0" }}>
            Every artifact for this Move — stored, versioned, and ready for
            review. {totalCurrent} current.
          </p>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input
            ref={fileRef}
            type="file"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onUpload(f);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploadState === "uploading"}
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              color: "#fff",
              background: uploadState === "uploading" ? "#9AA3B2" : "#1B2B5C",
              border: "none",
              borderRadius: 5,
              padding: "6px 12px",
              cursor: uploadState === "uploading" ? "default" : "pointer",
            }}
          >
            {uploadState === "uploading" ? "Uploading…" : "Upload evidence"}
          </button>
          <button
            onClick={() => void load()}
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              color: "#5A6472",
              background: "transparent",
              border: "1px solid #D5DAE2",
              borderRadius: 5,
              padding: "5px 11px",
              cursor: "pointer",
            }}
          >
            Refresh
          </button>
        </div>
      </div>
      {uploadMsg && (
        <div
          style={{
            margin: "2px 0 8px",
            fontSize: 12,
            color: uploadState === "error" ? "#B71C1C" : "#1E7E34",
          }}
        >
          {uploadMsg}
        </div>
      )}

      {/* Family filters */}
      <div
        style={{
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          margin: "12px 0 6px",
        }}
      >
        <FilterChip
          label={`All (${visible.length})`}
          active={family === "all"}
          onClick={() => setFamily("all")}
        />
        {FAMILIES.filter((f) => (counts[f.key] ?? 0) > 0).map((f) => (
          <FilterChip
            key={f.key}
            label={`${f.label} (${counts[f.key] ?? 0})`}
            active={family === f.key}
            onClick={() => setFamily(f.key)}
          />
        ))}
        <label
          style={{
            marginLeft: "auto",
            fontSize: 11.5,
            color: "#5A6472",
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={showSuperseded}
            onChange={(e) => setShowSuperseded(e.target.checked)}
          />
          Show version history
        </label>
      </div>

      {loading && (
        <div
          style={{
            padding: "32px 0",
            textAlign: "center",
            fontSize: 12,
            color: "#9AA3B2",
          }}
        >
          Loading the cabinet…
        </div>
      )}
      {error && !loading && (
        <div style={{ padding: "20px 0", fontSize: 12, color: "#B71C1C" }}>
          Could not load artifacts: {error}
        </div>
      )}
      {!loading && !error && visible.length === 0 && (
        <div
          style={{
            padding: "28px 16px",
            textAlign: "center",
            fontSize: 12.5,
            color: "#9AA3B2",
            border: "1px dashed #D5DAE2",
            borderRadius: 8,
            marginTop: 8,
          }}
        >
          No artifacts yet. Generated deliverables appear here automatically;
          use “Upload evidence” to add meeting notes, session outputs, data
          exports, or filled templates that ground deliverables and close gates.
        </div>
      )}

      {!loading &&
        !error &&
        Array.from(grouped.entries()).map(([fam, rows]) => {
          const meta = FAMILIES.find((f) => f.key === fam);
          return (
            <section key={fam} style={{ marginTop: 16 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#5A6472",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  marginBottom: 4,
                }}
              >
                {meta?.label ?? fam} · {rows.length}
              </div>
              <div
                style={{
                  border: "1px solid #EEF0F3",
                  borderRadius: 8,
                  overflow: "hidden",
                  background: "#fff",
                }}
              >
                {rows.map((a) => (
                  <ArtifactRow
                    key={a.artifactId}
                    a={a}
                    moveId={moveId}
                    onChanged={load}
                  />
                ))}
              </div>
            </section>
          );
        })}
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: 11.5,
        fontWeight: active ? 700 : 500,
        color: active ? "#fff" : "#5A6472",
        background: active ? "#1B2B5C" : "transparent",
        border: `1px solid ${active ? "#1B2B5C" : "#D5DAE2"}`,
        borderRadius: 14,
        padding: "4px 12px",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}
