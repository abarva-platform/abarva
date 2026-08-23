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
  contextExtract?: MoveContextExtractReview | null;
  downloadUrl: string;
}

interface MoveContextExtractReviewItem {
  status?: string;
  label?: string;
  summary?: string;
  reason?: string;
  evidenceId?: string;
  evidenceFamily?: string;
  sourceType?: string;
  sourceFileRef?: string;
  readinessStatus?: string;
  targetPhase?: number;
  whyAttached?: string;
}

interface MoveContextExtractReview {
  sourceMode?: string;
  phase?: number;
  targetPhase?: number;
  generatedAt?: string;
  candidateVersionId?: string | null;
  activeTenantAccessVersionId?: string | null;
  attachedEvidenceItems?: MoveContextExtractReviewItem[];
  suggestedContextItems?: MoveContextExtractReviewItem[];
  excludedContextItems?: MoveContextExtractReviewItem[];
  gapItems?: MoveContextExtractReviewItem[];
}

interface ContextExtractReviewModel {
  artifact: Artifact;
  sourceModeLabel: string;
  generatedLabel: string;
  attached: MoveContextExtractReviewItem[];
  suggested: MoveContextExtractReviewItem[];
  excluded: MoveContextExtractReviewItem[];
  gaps: MoveContextExtractReviewItem[];
  gatheredMessage: string;
  nextPhaseMessage: string;
  coverageItems: string[];
}

type SponsorReviewDecision =
  | "approve_for_p3_draft"
  | "request_revisions"
  | "hold_for_evidence";

interface SponsorReviewState {
  reviewPackage: {
    reviewedArtifactId: string;
    htmlVisualCompanionArtifactId: string | null;
    docxEditableArtifactId: string | null;
    reviewedArtifactIds: string[];
  };
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
  { key: "session_artifact", label: "Session files" },
  { key: "uploaded_evidence", label: "Evidence" },
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

export function artifactStatusLabel(status: string): string {
  if (status === "quarantined") return "needs review";
  return status
    .replace(/review_required/g, "needs review")
    .replace(/client_to_complete/g, "client to complete")
    .replace(/board_ready/g, "ready")
    .replace(/_/g, " ");
}

export function supportsSponsorReviewDecisionArtifact(
  artifact: Pick<
    Artifact,
    "artifactType" | "downloadUrl" | "family" | "lifecycleState" | "phase"
  >,
  moveId: string,
): boolean {
  if (artifact.lifecycleState !== "current") return false;
  if (!artifact.downloadUrl.includes(`/api/v1/programs/${moveId}/artifacts/`)) {
    return false;
  }
  if (artifact.phase === 2) return true;
  return (
    artifact.family === "approval_artifact" ||
    /review|diagnostic|current.state|sponsor/i.test(artifact.artifactType)
  );
}

export function supportsGeneratedClientApproval(
  artifact: Pick<
    Artifact,
    | "downloadUrl"
    | "family"
    | "fileFormat"
    | "lifecycleState"
    | "outputRole"
    | "status"
  >,
): boolean {
  return (
    artifact.family === "generated_deliverable" &&
    artifact.lifecycleState === "current" &&
    artifact.downloadUrl.startsWith("/api/v1/artifacts/") &&
    artifact.fileFormat !== "html" &&
    artifact.outputRole !== "html_visual_review_companion" &&
    artifact.status !== "approved"
  );
}

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
  const toneKey = status === "quarantined" ? "review_required" : status;
  const tone = STATUS_TONE[toneKey] ?? { bg: "#EEF0F3", fg: "#5A6472" };
  const label = artifactStatusLabel(status);
  return (
    <span
      title={
        status === "quarantined"
          ? "Held for review before client-ready use."
          : undefined
      }
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
      {label}
    </span>
  );
}

function metaLabel(value: string | null | undefined): string {
  return value ? value.replace(/_/g, " ") : "";
}

function itemList(value: unknown): MoveContextExtractReviewItem[] {
  return Array.isArray(value) ? value : [];
}

export function isContextExtractArtifact(a: {
  artifactType?: string | null;
  contextExtract?: MoveContextExtractReview | null;
}): boolean {
  return Boolean(
    a.contextExtract &&
    typeof a.artifactType === "string" &&
    a.artifactType.startsWith("move_context_extract_p"),
  );
}

export function buildContextExtractReviewModel(
  artifact: Artifact,
): ContextExtractReviewModel | null {
  const extract = artifact.contextExtract;
  if (!extract) return null;
  const attached = itemList(extract.attachedEvidenceItems);
  const suggested = itemList(extract.suggestedContextItems);
  const excluded = itemList(extract.excludedContextItems);
  const gaps = itemList(extract.gapItems);
  const phase = extract.phase ?? artifact.phase ?? 0;
  const targetPhase = extract.targetPhase ?? phase;
  const sourceModeLabel = metaLabel(extract.sourceMode) || "active context";
  const generatedLabel = extract.generatedAt
    ? fmtDate(extract.generatedAt)
    : fmtDate(artifact.createdAt);
  const coverageCounts = new Map<string, number>();
  for (const item of attached) {
    const family = item.evidenceFamily || "uncategorized";
    coverageCounts.set(family, (coverageCounts.get(family) ?? 0) + 1);
  }
  const coverageItems = [...coverageCounts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([family, count]) => `${metaLabel(family)}: ${count}`);
  const gatheredMessage =
    extract.sourceMode === "candidate_preview"
      ? "AbarVa reviewed an explicitly acknowledged candidate preview. It is visible for review, not treated as active runtime truth."
      : `AbarVa reviewed active Move evidence and active module context for P${phase}. Candidate preview data stayed out of the default path.`;
  const nextPhaseMessage =
    gaps.length > 0
      ? `Do not treat P${targetPhase} as evidence-complete yet. Resolve the listed gaps before relying on this extract for phase decisions.`
      : attached.length > 0
        ? `P${targetPhase} has usable attached evidence, but phase advancement still requires the governed Approve & Build gate. Suggested and excluded context remain review-only until a human approves or loads it as evidence.`
        : `No agent-ready evidence is attached yet. Upload or approve source-backed evidence before using this extract for P${targetPhase}.`;
  return {
    artifact,
    sourceModeLabel,
    generatedLabel,
    attached,
    suggested,
    excluded,
    gaps,
    gatheredMessage,
    nextPhaseMessage,
    coverageItems,
  };
}

export function artifactOutputRoleLabel(a: {
  outputRole?: string | null;
  fileFormat?: string | null;
}): string {
  if (a.outputRole === "docx_editable_phase_record") return "Editable final";
  if (a.outputRole === "html_visual_review_companion") {
    return "Preview only";
  }
  if (a.fileFormat === "docx") return "Word-equivalent";
  if (a.fileFormat === "pptx") return "Presentation";
  if (a.fileFormat === "html") return "Preview only";
  return "";
}

export function artifactFormatLabel(format: string | null | undefined): string {
  if (format === "docx") return "Word-equivalent";
  if (format === "pptx") return "PPTX final";
  if (format === "html") return "HTML preview";
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

function ContextExtractMiniList({
  title,
  items,
  empty,
}: {
  title: string;
  items: MoveContextExtractReviewItem[];
  empty: string;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 10.5,
          fontWeight: 800,
          color: "#5A6472",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          marginBottom: 6,
        }}
      >
        {title} · {items.length}
      </div>
      {items.length === 0 ? (
        <p
          style={{
            margin: 0,
            fontSize: 12,
            lineHeight: 1.45,
            color: "#64748B",
          }}
        >
          {empty}
        </p>
      ) : (
        <ul
          style={{
            margin: 0,
            paddingLeft: 16,
            color: "#334155",
            fontSize: 12,
            lineHeight: 1.45,
          }}
        >
          {items.slice(0, 3).map((item, index) => (
            <li key={`${title}-${item.evidenceId ?? item.label ?? index}`}>
              <strong>{item.label ?? "Context item"}</strong>
              {item.evidenceFamily
                ? ` · ${metaLabel(item.evidenceFamily)}`
                : ""}
              <br />
              <span style={{ color: "#64748B" }}>
                {(item.whyAttached || item.reason || item.summary || "").slice(
                  0,
                  180,
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
      {items.length > 3 && (
        <div style={{ marginTop: 5, fontSize: 11, color: "#64748B" }}>
          +{items.length - 3} more in the extract
        </div>
      )}
    </div>
  );
}

function ContextExtractReviewPanel({
  model,
}: {
  model: ContextExtractReviewModel;
}) {
  return (
    <section
      style={{
        border: "1px solid #DDE3EA",
        borderRadius: 8,
        background: "#fff",
        padding: 14,
        margin: "12px 0 10px",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) auto",
          gap: 14,
          alignItems: "start",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 800,
              color: "#0B5CAB",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Executive context review
          </div>
          <h3
            style={{
              margin: "4px 0 4px",
              fontFamily: "Georgia, serif",
              fontSize: 18,
              lineHeight: 1.18,
              color: "#1A1A18",
            }}
          >
            What AbarVa gathered for the next phase
          </h3>
          <p
            style={{
              margin: 0,
              maxWidth: 860,
              fontSize: 12.5,
              lineHeight: 1.45,
              color: "#475569",
            }}
          >
            {model.gatheredMessage}
          </p>
        </div>
        <div
          style={{
            minWidth: 180,
            border: "1px solid #EEF0F3",
            borderRadius: 8,
            padding: "9px 10px",
            background: "#FAFAF9",
            fontSize: 11.5,
            lineHeight: 1.45,
            color: "#475569",
          }}
        >
          <strong style={{ display: "block", color: "#0F172A", fontSize: 12 }}>
            {model.attached.length} attached
          </strong>
          {model.sourceModeLabel}
          <br />
          {model.generatedLabel}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          gap: 12,
          marginTop: 14,
        }}
      >
        <ContextExtractMiniList
          title="Attached evidence"
          items={model.attached}
          empty="No approved Move evidence was attached."
        />
        <ContextExtractMiniList
          title="Suggested"
          items={model.suggested}
          empty="No review-only context was suggested."
        />
        <ContextExtractMiniList
          title="Excluded"
          items={model.excluded}
          empty="Nothing was explicitly excluded."
        />
        <ContextExtractMiniList
          title="Gaps"
          items={model.gaps}
          empty="No blocking context gaps were recorded."
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 12,
          marginTop: 14,
          paddingTop: 12,
          borderTop: "1px solid #EEF0F3",
          fontSize: 12,
          lineHeight: 1.45,
          color: "#334155",
        }}
      >
        <div>
          <strong style={{ color: "#0F172A" }}>Evidence family coverage</strong>
          <p style={{ margin: "5px 0 0", color: "#64748B" }}>
            {model.coverageItems.length > 0
              ? model.coverageItems.join(" · ")
              : "No attached evidence families yet."}
          </p>
        </div>
        <div>
          <strong style={{ color: "#0F172A" }}>What this means</strong>
          <p style={{ margin: "5px 0 0", color: "#64748B" }}>
            {model.nextPhaseMessage}
          </p>
        </div>
      </div>
    </section>
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
  const [clientApprovalReason, setClientApprovalReason] = useState("");
  const [clientApprovalBusy, setClientApprovalBusy] = useState(false);
  const [actionErr, setActionErr] = useState<string | null>(null);
  const reviewPanelRef = useRef<HTMLDivElement | null>(null);
  const approvedFileInputRef = useRef<HTMLInputElement | null>(null);
  const roleLabel = artifactOutputRoleLabel(a);
  const canLoadSponsorReview = supportsSponsorReviewDecisionArtifact(a, moveId);
  const canApproveGeneratedDraft = supportsGeneratedClientApproval(a);
  const previewOnly =
    a.fileFormat === "html" || a.outputRole === "html_visual_review_companion";
  const isGeneratedArtifactRoute =
    a.downloadUrl.startsWith("/api/v1/artifacts/");

  const openArtifact = useCallback(async () => {
    setBusy("open");
    setActionErr(null);
    try {
      const openParams = isGeneratedArtifactRoute
        ? "format=html&inline=1"
        : "inline=1";
      const inlineUrl = `${a.downloadUrl}${a.downloadUrl.includes("?") ? "&" : "?"}${openParams}`;
      const win = window.open(
        inlineUrl,
        `moves-artifact-${a.artifactId}`,
        "noopener,noreferrer",
      );
      if (!win) {
        setActionErr("Browser blocked the artifact tab. Use Download instead.");
      }
    } catch (e) {
      setActionErr(e instanceof Error ? e.message : "open failed");
    } finally {
      setBusy(null);
    }
  }, [a.artifactId, a.downloadUrl, isGeneratedArtifactRoute]);

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
    if (!reviewOpen || !canLoadSponsorReview) return;
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
        reviewPackage: json.reviewPackage,
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
  }, [a.artifactId, canLoadSponsorReview, moveId, reviewOpen]);

  useEffect(() => {
    void loadSponsorReview();
  }, [loadSponsorReview]);

  useEffect(() => {
    if (!reviewOpen) return;
    window.requestAnimationFrame(() => {
      reviewPanelRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    });
  }, [reviewOpen]);

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
                  : (sponsorReview?.packet.missingEvidence ?? []),
            }),
          },
        );
        const json = (await res
          .json()
          .catch(() => ({}))) as SponsorReviewPostResponse;
        if (!res.ok || !json.ok) {
          throw new Error(json.detail || json.error || `HTTP ${res.status}`);
        }
        setSponsorReview({
          reviewPackage: json.reviewPackage,
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

  const acceptGeneratedDraft = useCallback(async () => {
    if (!canApproveGeneratedDraft || clientApprovalBusy) return;
    setClientApprovalBusy(true);
    setActionErr(null);
    try {
      const res = await fetch(
        `/api/v1/programs/${moveId}/artifacts/${a.artifactId}/client-approval`,
        {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            reason:
              clientApprovalReason.trim() ||
              "Client reviewer accepted the AI-prepared draft as the authoritative phase deliverable.",
          }),
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
      setReviewOpen(false);
      await onChanged();
    } catch (e) {
      setActionErr(e instanceof Error ? e.message : "client approval failed");
    } finally {
      setClientApprovalBusy(false);
    }
  }, [
    a.artifactId,
    canApproveGeneratedDraft,
    clientApprovalBusy,
    clientApprovalReason,
    moveId,
    onChanged,
  ]);

  const uploadApprovedReplacement = useCallback(
    async (file: File | null | undefined) => {
      if (!file || !canApproveGeneratedDraft || clientApprovalBusy) return;
      setClientApprovalBusy(true);
      setActionErr(null);
      try {
        const body = new FormData();
        body.append("file", file);
        body.append(
          "reason",
          clientApprovalReason.trim() ||
            "Client reviewer uploaded an edited approved final to replace the AI-prepared draft.",
        );
        const res = await fetch(
          `/api/v1/programs/${moveId}/artifacts/${a.artifactId}/client-approval`,
          {
            method: "POST",
            credentials: "include",
            body,
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
        setReviewOpen(false);
        await onChanged();
      } catch (e) {
        setActionErr(e instanceof Error ? e.message : "approved upload failed");
      } finally {
        setClientApprovalBusy(false);
        if (approvedFileInputRef.current) {
          approvedFileInputRef.current.value = "";
        }
      }
    },
    [
      a.artifactId,
      canApproveGeneratedDraft,
      clientApprovalBusy,
      clientApprovalReason,
      moveId,
      onChanged,
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
            {previewOnly && (
              <span
                title="HTML is a browser preview only. Client-final artifacts must be DOCX or PPTX."
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#7C2D12",
                  background: "#FEF3C7",
                  padding: "1px 6px",
                  borderRadius: 4,
                  textTransform: "uppercase",
                }}
              >
                Not final
              </span>
            )}
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
            {a.qualityScore != null && (
              <span>Automated quality signal {a.qualityScore}/100</span>
            )}
            {a.unsupportedClaims > 0 && (
              <span style={{ color: "#B26A00" }}>
                {a.unsupportedClaims} unsupported claim signal
                {a.unsupportedClaims === 1 ? "" : "s"}
              </span>
            )}
            {!roleLabel && <span>{fmtBytes(a.fileSize)}</span>}
            <span>{fmtDate(a.createdAt)}</span>
            <span
              title={
                stored
                  ? "Stored in the secure artifact vault"
                  : "Storage pending"
              }
              style={{ color: stored ? "#1E7E34" : "#B71C1C", fontWeight: 600 }}
            >
              {stored ? "Vault" : "Storage pending"}
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
            Review
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
        <details
          style={{
            fontSize: 11.5,
            color: "#5A6472",
            lineHeight: 1.45,
          }}
        >
          <summary
            style={{
              cursor: "pointer",
              width: "fit-content",
              color: "#1B2B5C",
              fontWeight: 650,
              listStyle: "none",
            }}
          >
            Review details
          </summary>
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginTop: 6,
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
        </details>
      )}
      {reviewOpen && (
        <div
          ref={reviewPanelRef}
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
                  Artifact review
                </div>
                <p
                  style={{
                    margin: "6px 0 0",
                    fontSize: 12.5,
                    lineHeight: 1.45,
                    color: "#334155",
                  }}
                >
                  <strong>{a.title}</strong>
                  <br />
                  Phase {a.phase ?? "not set"} ·{" "}
                  {artifactFormatLabel(a.fileFormat)} · {metaLabel(a.family)} ·{" "}
                  {metaLabel(a.status)}
                </p>
                {sponsorReview ? (
                  <p
                    style={{
                      margin: "8px 0 0",
                      fontSize: 12.5,
                      lineHeight: 1.45,
                      color: "#334155",
                    }}
                  >
                    This artifact also has a sponsor-review packet. You can
                    approve it for draft shaping, request revisions, or hold for
                    missing evidence without bypassing final phase gates.
                  </p>
                ) : null}
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
                  <strong style={{ color: "#0F172A" }}>
                    Diagnostic thesis
                  </strong>
                  <p style={{ margin: "6px 0 0", color: "#334155" }}>
                    {sponsorReview.packet.diagnosticThesis}
                  </p>
                </div>
                <div>
                  <strong style={{ color: "#0F172A" }}>Quantified facts</strong>
                  <BulletList items={sponsorReview.packet.quantifiedFacts} />
                </div>
                <div>
                  <strong style={{ color: "#0F172A" }}>
                    Known limitations
                  </strong>
                  <BulletList items={sponsorReview.packet.knownLimitations} />
                </div>
                <div>
                  <strong style={{ color: "#0F172A" }}>P3 implication</strong>
                  <p style={{ margin: "6px 0 0", color: "#334155" }}>
                    {sponsorReview.packet.p3Implication}
                  </p>
                </div>
                <div>
                  <strong style={{ color: "#0F172A" }}>Review package</strong>
                  <p style={{ margin: "6px 0 0", color: "#334155" }}>
                    HTML companion:{" "}
                    {sponsorReview.reviewPackage.htmlVisualCompanionArtifactId
                      ? "linked"
                      : "not linked"}
                    <br />
                    Editable Word record:{" "}
                    {sponsorReview.reviewPackage.docxEditableArtifactId
                      ? "linked"
                      : "not linked"}
                  </p>
                </div>
                <div>
                  <strong style={{ color: "#0F172A" }}>Gate status</strong>
                  <p style={{ margin: "6px 0 0", color: "#334155" }}>
                    P3 draft readiness:{" "}
                    {sponsorReview.readiness.readyForP3Draft
                      ? "ready"
                      : "blocked"}
                    <br />
                    P3 final readiness:{" "}
                    {sponsorReview.readiness.readyForP3Final
                      ? "ready"
                      : "blocked"}
                    <br />
                    P2 final approval:{" "}
                    {sponsorReview.readiness.p2FinalApproved
                      ? "approved"
                      : "not final"}
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
                <strong>
                  {metaLabel(sponsorReview.latestDecision.decision)}
                </strong>
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
                    onClick={() =>
                      void submitSponsorDecision("hold_for_evidence")
                    }
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
                    onClick={() =>
                      void submitSponsorDecision("request_revisions")
                    }
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
          {canApproveGeneratedDraft ? (
            <div
              style={{
                border: "1px solid #BBE3D3",
                borderRadius: 8,
                background: "#F2FBF7",
                padding: 12,
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: "#0F766E",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Client approval
              </div>
              <p
                style={{
                  margin: "6px 0 10px",
                  fontSize: 12.5,
                  lineHeight: 1.45,
                  color: "#334155",
                }}
              >
                This is an AI-prepared draft. It can inform the gate only after
                a human reviewer accepts it as authoritative or uploads an
                edited client-approved final.
              </p>
              <textarea
                value={clientApprovalReason}
                onChange={(e) => setClientApprovalReason(e.target.value)}
                rows={2}
                placeholder="Approval rationale, e.g. Sponsor reviewed the charter and approved this version for P1 gate closure."
                style={{
                  width: "100%",
                  resize: "vertical",
                  border: "1px solid #A7D8C4",
                  borderRadius: 6,
                  padding: 8,
                  fontSize: 12,
                  lineHeight: 1.45,
                  color: "#1A1A18",
                  background: "#fff",
                }}
              />
              <input
                ref={approvedFileInputRef}
                type="file"
                style={{ display: "none" }}
                onChange={(event) =>
                  void uploadApprovedReplacement(event.target.files?.[0])
                }
              />
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  justifyContent: "flex-end",
                  marginTop: 10,
                }}
              >
                <button
                  onClick={acceptGeneratedDraft}
                  disabled={clientApprovalBusy}
                  style={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: "#fff",
                    background: clientApprovalBusy ? "#9AA3B2" : "#166534",
                    border: "none",
                    borderRadius: 5,
                    padding: "7px 12px",
                  }}
                >
                  {clientApprovalBusy
                    ? "Recording…"
                    : "Accept AI draft as authoritative"}
                </button>
                <button
                  onClick={() => approvedFileInputRef.current?.click()}
                  disabled={clientApprovalBusy}
                  style={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: "#0F766E",
                    background: "#fff",
                    border: "1px solid #99D6C0",
                    borderRadius: 5,
                    padding: "7px 12px",
                  }}
                >
                  Upload approved final
                </button>
              </div>
            </div>
          ) : null}
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
  presentationMode = false,
}: {
  moveId: string;
  phase?: number;
  presentationMode?: boolean;
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

  const contextExtractReview = useMemo(() => {
    const artifact = artifacts.find(
      (a) => a.lifecycleState === "current" && isContextExtractArtifact(a),
    );
    return artifact ? buildContextExtractReviewModel(artifact) : null;
  }, [artifacts]);

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
              fontSize: presentationMode ? 17 : 18,
              fontWeight: 650,
              color: "#1A1A18",
              margin: 0,
            }}
          >
            Downloads
          </h2>
          <p style={{ fontSize: 12, color: "#9AA3B2", margin: "3px 0 0" }}>
            Client-final DOCX/PPTX files and HTML previews for review.{" "}
            {totalCurrent} current.
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

      {contextExtractReview && (
        <ContextExtractReviewPanel model={contextExtractReview} />
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
