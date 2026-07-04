import { useState, type CSSProperties, type ReactNode } from "react";
import { UploadEventDocumentButton } from "./UploadEventDocumentButton";
import { AcceptClientFinalButton } from "./AcceptClientFinalButton";
import {
  specByCode,
  type SourceArtifactSpec,
} from "@/lib/source/canonical-specs";
import type {
  SourceEventArtifactState,
  SourceEventArtifactStatus,
} from "@/lib/source/canvas-substrate";
import type { SourceArtifactRegistryRecord } from "@/lib/source/artifact-registry/types";
import type { SourceStageKey } from "@/lib/source/types";
import { SOURCE_STAGE_LABELS } from "@/lib/source/constants";
import {
  artifactDisplayName,
  artifactStatusDisplayName,
} from "@/lib/source/artifact-display-names";
import { CANVAS } from "../canvas-tokens";
import { VendorPricingSubmissionsPanel } from "./VendorPricingSubmissionsPanel";
import { VendorResponsePackPanel } from "./VendorResponsePackPanel";

// Codes that surface the vendor-pricing-submissions panel below the
// body editor. Today only d19 (pricing); future variants would extend.
const VENDOR_SUBMISSIONS_CODES: ReadonlySet<string> = new Set([
  "d19_pricing_workbook",
]);
const EXPORT_READY_ARTIFACTS: Record<
  string,
  { label: string; formats: Array<"docx" | "xlsx" | "pdf"> }
> = {
  d09_rfp_pack: { label: "RFP Pack", formats: ["docx", "pdf"] },
  d11_response_checklist: {
    label: "Response Control Pack",
    formats: ["xlsx", "docx", "pdf"],
  },
  d16_scorecard: {
    label: "Evaluation Scorecard",
    formats: ["xlsx", "docx", "pdf"],
  },
  d22_bafo_question_pack: {
    label: "BAFO Question Pack",
    formats: ["docx", "xlsx", "pdf"],
  },
  d24_decision_brief: {
    label: "Decision Brief",
    formats: ["pdf", "docx"],
  },
};

interface DocumentTabProps {
  /** Source event id; used by the vendor-submissions panel for API calls. */
  eventId?: string;
  stage: SourceStageKey;
  artifacts: SourceEventArtifactState[];
  /** Uploaded/generated documents for the event. */
  registryArtifacts?: SourceArtifactRegistryRecord[];
  /** Map of artifact code → markdown template body (server-loaded). */
  templateByCode: Record<string, string | null>;
  /** Currently focused artifact code; UI lets user switch. */
  selectedCode?: string;
  onSelectCode?: (code: string) => void;
  /**
   * Status mutator. When omitted (e.g. SSR / read-only previews) the
   * Mark-complete button is hidden — the tab renders identically to
   * the read-only display it had before B1.
   */
  onChangeStatus?: (
    code: string,
    next: SourceEventArtifactStatus,
  ) => Promise<void>;
  /** Per-artifact pending flag — disables the button while the PATCH is in flight. */
  pendingByCode?: Record<string, boolean>;
  /**
   * Body mutator. When omitted the artifact body stays read-only —
   * the canvas falls back to the canonical template.
   */
  onSaveBody?: (code: string, body: string) => Promise<void>;
  /** Per-artifact body-pending flag (separate from status pending). */
  bodyPendingByCode?: Record<string, boolean>;
  /**
   * Trigger AI generation for a specific artifact code.
   * Returns generation result so the caller can surface failure
   * states (missing upstream, etc.).
   */
  onGenerateArtifact?: (
    code: string,
  ) => Promise<
    | { ok: true }
    | { ok: false; error: string; detail: string; missingUpstream?: string[] }
  >;
  /** Set of codes the prompt registry knows how to generate. */
  generatableCodes?: ReadonlySet<string>;
  /** Per-artifact generation-pending flag. */
  generationPendingByCode?: Record<string, boolean>;
  /** Reasoning envelope captured after source advisor generation. */
  reasoningByCode?: Record<string, { status: string; envelope?: unknown }>;
  /**
   * Set of codes that have an xlsx renderer wired.
   */
  xlsxGeneratableCodes?: ReadonlySet<string>;
  /**
   * Build the xlsx download URL for a given artifact code. Page passes
   * this so the button can deep-link directly to the GET endpoint —
   * no fetch + Blob plumbing on the client.
   */
  xlsxDownloadHref?: (code: string) => string;
  /**
   * Set of codes that have a comparison-mode xlsx renderer (e.g. d19
   * pricing-comparison aggregating vendor submissions). When a code is
   * in this set the card shows a second "Download comparison xlsx"
   * anchor alongside the standard template anchor.
   */
  xlsxComparisonCodes?: ReadonlySet<string>;
  /** Build the comparison xlsx download URL for a given artifact code. */
  xlsxComparisonDownloadHref?: (code: string) => string;
  /**
   * Set of codes that have a docx renderer wired. The card shows a
   * "Download docx" anchor when its code is in this set.
   */
  docxGeneratableCodes?: ReadonlySet<string>;
  /** Build the docx download URL for a given artifact code. */
  docxDownloadHref?: (code: string) => string;
  /**
   * Set of codes that have an HTML renderer wired. Card shows a
   * "View HTML" anchor (opens in a new tab, no attachment).
   */
  htmlGeneratableCodes?: ReadonlySet<string>;
  /** Build the HTML view URL for a given artifact code. */
  htmlViewHref?: (code: string) => string;
  /**
   * Set of codes that have a PDF renderer wired. Card shows a
   * "Download PDF" anchor.
   */
  pdfGeneratableCodes?: ReadonlySet<string>;
  /** Build the PDF download URL for a given artifact code. */
  pdfDownloadHref?: (code: string) => string;
  /** Optional stage-specific panel shown below the active artifact. */
  supplementalPanel?: ReactNode;
  /** Called after a registry-backed upload so the canvas can refresh shelves/logs. */
  onRegistryUploaded?: () => void;
}

/**
 * The Document tab is the workspace's main surface — shows what's being
 * assembled at the current stage. Left rail of artifact slots, right side
 * renders the selected artifact's content (starter body when stub, real content
 * when promoted).
 */
export function DocumentTab({
  eventId,
  stage,
  artifacts,
  registryArtifacts = [],
  templateByCode,
  selectedCode,
  onSelectCode,
  onChangeStatus,
  pendingByCode,
  onSaveBody,
  bodyPendingByCode,
  onGenerateArtifact,
  generatableCodes,
  generationPendingByCode,
  reasoningByCode,
  xlsxGeneratableCodes,
  xlsxDownloadHref,
  xlsxComparisonCodes,
  xlsxComparisonDownloadHref,
  docxGeneratableCodes,
  docxDownloadHref,
  htmlGeneratableCodes,
  htmlViewHref,
  pdfGeneratableCodes,
  pdfDownloadHref,
  supplementalPanel,
  onRegistryUploaded,
}: DocumentTabProps) {
  if (artifacts.length === 0) {
    return (
      <div data-testid="source-canvas-document-tab" style={EMPTY_STYLE}>
        <p style={EMPTY_TITLE_STYLE}>
          Start with the next {SOURCE_STAGE_LABELS[stage]} document.
        </p>
        <p style={EMPTY_BODY_STYLE}>
          When this stage is ready, draft the required document with aVa or ask
          your AbarVa lead to load the event facts before using it for an
          executive decision, vendor communication, or approval.
        </p>
      </div>
    );
  }

  // Resolve the active artifact (default to first required one).
  const required = artifacts.filter((a) => a.requirementLevel === "required");
  const optional = artifacts.filter((a) => a.requirementLevel !== "required");
  const ordered = [...required, ...optional];
  const active =
    ordered.find((a) => a.artifactCode === selectedCode) ?? ordered[0] ?? null;
  const activeSpec = active ? specByCode(active.artifactCode) : null;
  // Per-event authored body wins; falls back to the canonical template
  // when the user hasn't authored anything yet.
  const authoredBody = active?.body ?? null;
  const templateBody = active
    ? (templateByCode[active.artifactCode] ?? null)
    : null;
  const body = authoredBody ?? templateBody;
  const authoredBodyCanExport = Boolean(authoredBody?.trim());
  const bodyIsAuthored = authoredBodyCanExport;

  return (
    <div data-testid="source-canvas-document-tab" style={DOCUMENT_TAB_STYLE}>
      <RegistryDocumentsShelf
        eventId={eventId}
        stage={stage}
        documents={registryArtifacts}
        onUploaded={onRegistryUploaded}
      />
      <div style={CONTAINER_STYLE}>
        {/* Artifact list (left) */}
        <aside
          style={LIST_STYLE}
          aria-label={`Artifacts at ${SOURCE_STAGE_LABELS[stage]}`}
        >
          {required.length > 0 ? (
            <div>
              <div style={GROUP_LABEL_STYLE}>Required</div>
              <ul style={LIST_RESET_STYLE}>
                {required.map((a) => (
                  <ArtifactRow
                    key={a.artifactCode}
                    artifact={a}
                    spec={specByCode(a.artifactCode)}
                    isActive={a.artifactCode === active?.artifactCode}
                    onClick={() => onSelectCode?.(a.artifactCode)}
                  />
                ))}
              </ul>
            </div>
          ) : null}
          {optional.length > 0 ? (
            <div>
              <div style={GROUP_LABEL_STYLE}>Optional</div>
              <ul style={LIST_RESET_STYLE}>
                {optional.map((a) => (
                  <ArtifactRow
                    key={a.artifactCode}
                    artifact={a}
                    spec={specByCode(a.artifactCode)}
                    isActive={a.artifactCode === active?.artifactCode}
                    onClick={() => onSelectCode?.(a.artifactCode)}
                  />
                ))}
              </ul>
            </div>
          ) : null}
        </aside>

        {/* Active artifact body (right) */}
        <article
          data-testid="source-stage-canvas-panel"
          style={BODY_STYLE}
          aria-labelledby="active-artifact-title"
        >
          {active && activeSpec ? (
            <>
              <header style={BODY_HEADER_STYLE}>
                <div style={BODY_EYEBROW_STYLE}>
                  <span style={BODY_CODE_STYLE} title={active.artifactCode}>
                    {artifactRequirementLabel(active)}
                  </span>
                </div>
                <div style={BODY_TITLE_ROW_STYLE}>
                  <h2 id="active-artifact-title" style={BODY_TITLE_STYLE}>
                    {artifactDisplayName(active.artifactCode, activeSpec.name)}
                  </h2>
                  <ArtifactStatusControls
                    artifact={active}
                    onChangeStatus={onChangeStatus}
                    pending={pendingByCode?.[active.artifactCode] ?? false}
                  />
                </div>
                <p style={BODY_DESC_STYLE}>{activeSpec.description}</p>
              </header>
              <ArtifactBodyEditor
                artifact={active}
                eventId={eventId}
                artifactName={artifactDisplayName(
                  active.artifactCode,
                  activeSpec.name,
                )}
                templateBody={templateBody}
                authoredBody={authoredBody}
                bodyIsAuthored={bodyIsAuthored}
                onSaveBody={onSaveBody}
                pending={bodyPendingByCode?.[active.artifactCode] ?? false}
                stage={stage}
                onGenerateArtifact={onGenerateArtifact}
                isGeneratable={
                  generatableCodes?.has(active.artifactCode) ?? false
                }
                generationPending={
                  generationPendingByCode?.[active.artifactCode] ?? false
                }
                xlsxDownloadHref={
                  xlsxGeneratableCodes?.has(active.artifactCode) &&
                  xlsxDownloadHref
                    ? xlsxDownloadHref(active.artifactCode)
                    : null
                }
                xlsxComparisonDownloadHref={
                  xlsxComparisonCodes?.has(active.artifactCode) &&
                  xlsxComparisonDownloadHref
                    ? xlsxComparisonDownloadHref(active.artifactCode)
                    : null
                }
                docxDownloadHref={
                  authoredBodyCanExport &&
                  docxGeneratableCodes?.has(active.artifactCode) &&
                  docxDownloadHref
                    ? docxDownloadHref(active.artifactCode)
                    : null
                }
                htmlViewHref={
                  authoredBodyCanExport &&
                  htmlGeneratableCodes?.has(active.artifactCode) &&
                  htmlViewHref
                    ? htmlViewHref(active.artifactCode)
                    : null
                }
                pdfDownloadHref={
                  authoredBodyCanExport &&
                  pdfGeneratableCodes?.has(active.artifactCode) &&
                  pdfDownloadHref
                    ? pdfDownloadHref(active.artifactCode)
                    : null
                }
                exportOptionsHidden={
                  !authoredBodyCanExport &&
                  (docxGeneratableCodes?.has(active.artifactCode) ||
                    htmlGeneratableCodes?.has(active.artifactCode) ||
                    pdfGeneratableCodes?.has(active.artifactCode) ||
                    false)
                }
                reasoning={reasoningByCode?.[active.artifactCode]}
                onClientFinalAccepted={onRegistryUploaded}
              />
              {eventId && VENDOR_SUBMISSIONS_CODES.has(active.artifactCode) ? (
                <VendorPricingSubmissionsPanel
                  eventId={eventId}
                  artifactCode={active.artifactCode}
                />
              ) : null}
              {eventId && active.artifactCode === "d13_vendor_responses" ? (
                <VendorResponsePackPanel
                  eventId={eventId}
                  onUploaded={onRegistryUploaded}
                />
              ) : null}
              {supplementalPanel}
              {body ? null : (
                <p style={MISSING_TEMPLATE_STYLE}>
                  This document is not ready to draft yet. Ask your AbarVa lead
                  to load the starter content before using this stage for
                  review.
                </p>
              )}
            </>
          ) : null}
        </article>
      </div>
    </div>
  );
}

interface RegistryDocumentsShelfProps {
  eventId?: string;
  stage: SourceStageKey;
  documents: SourceArtifactRegistryRecord[];
  onUploaded?: () => void;
}

function RegistryDocumentsShelf({
  eventId,
  stage,
  documents,
  onUploaded,
}: RegistryDocumentsShelfProps) {
  return (
    <section style={REGISTRY_SHELF_STYLE} aria-label="Event documents">
      <div style={REGISTRY_SHELF_HEADER_STYLE}>
        <div>
          <div style={GROUP_LABEL_STYLE}>Event documents</div>
          <h2 style={REGISTRY_SHELF_TITLE_STYLE}>
            {documents.length === 0
              ? "Attach a file when it supports the next decision"
              : `${documents.length} document${documents.length === 1 ? "" : "s"} available`}
          </h2>
        </div>
        {eventId ? (
          <UploadEventDocumentButton
            eventId={eventId}
            stageKey={stage}
            onUploaded={onUploaded}
          />
        ) : null}
      </div>
      {documents.length === 0 ? (
        <p style={REGISTRY_EMPTY_STYLE}>
          Uploads and generated packets will appear here after you add them from
          the workspace.
        </p>
      ) : (
        <div style={REGISTRY_GRID_STYLE}>
          {documents.map((doc) => {
            const exportReadyKind = exportReadyArtifactKind(doc);
            const detailHref = eventId
              ? `/source/events/${encodeURIComponent(eventId)}/artifacts/${encodeURIComponent(doc.id)}`
              : undefined;
            const downloadHref = `/api/v1/source/artifacts/${encodeURIComponent(doc.id)}/download`;
            return (
              <article
                key={doc.id}
                data-testid={`source-canvas-registry-doc-${doc.id}`}
                style={REGISTRY_DOC_CARD_STYLE}
              >
                <span style={REGISTRY_DOC_TOPLINE_STYLE}>
                  <span>{SOURCE_STAGE_LABELS[doc.stageKey]}</span>
                  <span style={DOT_STYLE}>·</span>
                  <span>{formatDocumentType(doc)}</span>
                  <span style={DOT_STYLE}>·</span>
                  <span>{formatDocumentSize(doc)}</span>
                  {doc.isClientFinal ? (
                    <span style={CLIENT_FINAL_BADGE_STYLE}>Client Final</span>
                  ) : null}
                  {doc.isCurrentAuthoritative ? (
                    <span style={AUTHORITATIVE_BADGE_STYLE}>Authoritative</span>
                  ) : null}
                  {doc.sourceOrigin === "generated" ? (
                    <span style={REGISTRY_SHELF_BADGE_STYLE}>
                      {exportReadyKind
                        ? "Export Ready"
                        : "Generated Draft"}
                    </span>
                  ) : null}
                </span>
                {detailHref ? (
                  <a
                    href={detailHref}
                    data-testid={`source-canvas-registry-doc-open-${doc.id}`}
                    style={REGISTRY_DOC_NAME_LINK_STYLE}
                    aria-label={`Open ${doc.originalName}`}
                  >
                    {doc.originalName}
                  </a>
                ) : (
                  <span style={REGISTRY_DOC_NAME_STYLE}>
                    {doc.originalName}
                  </span>
                )}
                <span style={REGISTRY_DOC_META_STYLE}>
                  {formatRegistryDocumentMeta(doc)}
                </span>
                <span style={REGISTRY_DOC_ACTIONS_STYLE}>
                  {eventId && exportReadyKind
                    ? EXPORT_READY_ARTIFACTS[exportReadyKind].formats.map(
                        (format) => (
                          <a
                            key={format}
                            href={`/api/v1/source/${encodeURIComponent(eventId)}/artifacts/${encodeURIComponent(exportReadyKind)}/render?format=${format}`}
                            data-testid={`source-canvas-registry-doc-export-${doc.id}-${format}`}
                            style={REGISTRY_DOC_ACTION_STYLE}
                            download
                          >
                            {format.toUpperCase()}
                          </a>
                        ),
                      )
                    : null}
                  {detailHref ? (
                    <a
                      href={detailHref}
                      data-testid={`source-canvas-registry-doc-open-action-${doc.id}`}
                      style={REGISTRY_DOC_ACTION_STYLE}
                    >
                      Open detail
                    </a>
                  ) : null}
                  <a
                    href={downloadHref}
                    data-testid={`source-canvas-registry-doc-download-${doc.id}`}
                    style={REGISTRY_DOC_ACTION_STYLE}
                    download
                  >
                    Download file
                  </a>
                </span>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function formatDocumentFamily(
  value: SourceArtifactRegistryRecord["artifactFamily"],
): string {
  if (value === "rfp") return "RFP";
  if (value === "rfi") return "RFI";
  if (value === "bafo") return "BAFO";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDocumentType(doc: SourceArtifactRegistryRecord): string {
  const exportReadyKind = exportReadyArtifactKind(doc);
  const exportReady = exportReadyKind
    ? EXPORT_READY_ARTIFACTS[exportReadyKind]
    : null;
  if (exportReady) return exportReady.label;
  return doc.sourceFormat.toUpperCase();
}

function formatDocumentSize(doc: SourceArtifactRegistryRecord): string {
  if (exportReadyArtifactKind(doc)) {
    return "Rendered export available";
  }
  return formatFileSize(doc.sizeBytes);
}

function formatRegistryDocumentMeta(doc: SourceArtifactRegistryRecord): string {
  const family = formatDocumentFamily(doc.artifactFamily);
  const exportReadyKind = exportReadyArtifactKind(doc);
  if (doc.isClientFinal && doc.isCurrentAuthoritative) {
    return `${family} · client-approved final · used as version of record`;
  }
  if (exportReadyKind) {
    return `${family} · reviewable deliverable · export surfaces available`;
  }
  if (doc.sourceOrigin === "uploaded" || doc.sourceOrigin === "reuploaded") {
    return `${family} · uploaded evidence · ${doc.approvalState.replace(/_/g, " ")}`;
  }
  if (doc.sourceOrigin === "note_capture") {
    return `${family} · session evidence`;
  }
  return `${family} · ${doc.approvalState.replace(/_/g, " ")}`;
}

function exportReadyArtifactKind(
  doc: SourceArtifactRegistryRecord,
): string | null {
  if (EXPORT_READY_ARTIFACTS[doc.artifactKind]) return doc.artifactKind;
  const haystack = `${doc.artifactKind} ${doc.originalName}`.toLowerCase();
  if (/\bd09[_-]?rfp[_-]?(pack|package)\b|rfp[_-]?pack/.test(haystack)) {
    return "d09_rfp_pack";
  }
  if (
    /\bd11[_-]?(response[_-]?(checklist|control[_-]?pack)|vendor[_-]?response[_-]?control[_-]?pack)\b|response[_-]?control[_-]?pack/.test(
      haystack,
    )
  ) {
    return "d11_response_checklist";
  }
  if (/\bd16[_-]?scorecard\b|evaluation[_-]?scorecard/.test(haystack)) {
    return "d16_scorecard";
  }
  if (
    /\bd22[_-]?bafo[_-]?question[_-]?pack\b|bafo[_-]?(instruction|question)[_-]?pack/.test(
      haystack,
    )
  ) {
    return "d22_bafo_question_pack";
  }
  if (/\bd24[_-]?decision[_-]?brief\b|decision[_-]?brief/.test(haystack)) {
    return "d24_decision_brief";
  }
  return null;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb >= 10 ? 0 : 1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(mb >= 10 ? 0 : 1)} MB`;
}

interface ArtifactBodyEditorProps {
  artifact: SourceEventArtifactState;
  eventId?: string;
  artifactName: string;
  templateBody: string | null;
  authoredBody: string | null;
  bodyIsAuthored: boolean;
  onSaveBody?: (code: string, body: string) => Promise<void>;
  pending: boolean;
  stage: SourceStageKey;
  onGenerateArtifact?: (
    code: string,
  ) => Promise<
    | { ok: true }
    | { ok: false; error: string; detail: string; missingUpstream?: string[] }
  >;
  isGeneratable: boolean;
  generationPending: boolean;
  /** When non-null the card shows a workbook download anchor. */
  xlsxDownloadHref: string | null;
  /** When non-null the card shows a "Download comparison xlsx" anchor. */
  xlsxComparisonDownloadHref?: string | null;
  /** When non-null the card shows a "Download docx" anchor. */
  docxDownloadHref?: string | null;
  /** When non-null the card shows a "View HTML" anchor (target="_blank"). */
  htmlViewHref?: string | null;
  /** When non-null the card shows a "Download PDF" anchor. */
  pdfDownloadHref?: string | null;
  exportOptionsHidden: boolean;
  /** Reasoning envelope from the last source advisor generation call. */
  reasoning?: { status: string; envelope?: unknown };
  onClientFinalAccepted?: () => void;
}

function ArtifactBodyEditor({
  artifact,
  eventId,
  artifactName,
  templateBody,
  authoredBody,
  bodyIsAuthored,
  onSaveBody,
  pending,
  onGenerateArtifact,
  isGeneratable,
  generationPending,
  xlsxDownloadHref,
  xlsxComparisonDownloadHref,
  docxDownloadHref,
  htmlViewHref,
  pdfDownloadHref,
  exportOptionsHidden,
  reasoning,
  onClientFinalAccepted,
}: ArtifactBodyEditorProps) {
  const [editing, setEditing] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  // Seed the editor: real authored content > template starter.
  const seed = authoredBody ?? templateBody ?? "";
  const [draft, setDraft] = useState(seed);

  // If the user navigates between artifacts the seed changes — sync draft
  // during render (React docs pattern: compare prev prop with useState, no
  // useEffect needed). See react.dev/learn/you-might-not-need-an-effect.
  const [prevSeed, setPrevSeed] = useState(seed);
  if (prevSeed !== seed) {
    setPrevSeed(seed);
    setDraft(seed);
    setEditing(false);
    setGenerationError(null);
  }

  const handleGenerate = async () => {
    if (!onGenerateArtifact) return;
    setGenerationError(null);
    const result = await onGenerateArtifact(artifact.artifactCode);
    if (!result.ok) {
      const detail =
        result.error === "upstream_required" && result.missingUpstream
          ? `Author and approve these first: ${result.missingUpstream.join(", ")}`
          : result.detail;
      setGenerationError(detail);
    }
  };

  if (editing && onSaveBody) {
    return (
      <div style={EDITOR_WRAP_STYLE}>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          spellCheck
          rows={20}
          data-testid={`source-canvas-document-body-editor-${artifact.artifactCode}`}
          style={EDITOR_TEXTAREA_STYLE}
        />
        <div style={EDITOR_TOOLBAR_STYLE}>
          <span style={EDITOR_HINT_STYLE}>
            Markdown supported. Your changes save to this event&apos;s document.
          </span>
          <div style={EDITOR_BUTTONS_STYLE}>
            <button
              type="button"
              onClick={() => {
                setDraft(seed);
                setEditing(false);
              }}
              data-testid={`source-canvas-document-body-cancel-${artifact.artifactCode}`}
              style={GHOST_BUTTON_STYLE}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={async () => {
                await onSaveBody(artifact.artifactCode, draft);
                setEditing(false);
              }}
              data-testid={`source-canvas-document-body-save-${artifact.artifactCode}`}
              style={{ ...PRIMARY_BUTTON_STYLE, opacity: pending ? 0.55 : 1 }}
            >
              {pending ? "Saving…" : "Save body"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isGenerated =
    artifact.bodyGenerationMetadata !== null && bodyIsAuthored;
  const clientFinal = readClientFinalMetadata(artifact.bodyGenerationMetadata);

  return (
    <div style={READER_WRAP_STYLE}>
      <div style={READER_HEADER_STYLE}>
        <span style={READER_BADGE_STYLE}>
          {isGenerated
            ? "Generated by aVa · editable"
            : bodyIsAuthored
              ? "Authored content"
              : "Draft needed"}
        </span>
        <div style={READER_BUTTONS_STYLE}>
          {onGenerateArtifact && isGeneratable ? (
            <button
              type="button"
              disabled={generationPending}
              onClick={handleGenerate}
              data-testid={`source-canvas-document-body-generate-${artifact.artifactCode}`}
              style={{
                ...PRIMARY_BUTTON_STYLE,
                opacity: generationPending ? 0.55 : 1,
                background: "#0c1a3a",
                color: "#faf7f1",
              }}
            >
              {generationPending
                ? "Generating with aVa…"
                : isGenerated || bodyIsAuthored
                  ? "Regenerate with aVa"
                  : "Generate with aVa"}
            </button>
          ) : null}
          {onSaveBody ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              data-testid={`source-canvas-document-body-edit-${artifact.artifactCode}`}
              style={GHOST_BUTTON_STYLE}
            >
              {bodyIsAuthored ? "Edit body" : "Author content"}
            </button>
          ) : null}
          {eventId ? (
            <AcceptClientFinalButton
              eventId={eventId}
              artifactCode={artifact.artifactCode}
              artifactName={artifactName}
              onAccepted={onClientFinalAccepted}
            />
          ) : null}
          {xlsxDownloadHref ? (
            <a
              href={xlsxDownloadHref}
              data-testid={`source-canvas-document-body-download-xlsx-${artifact.artifactCode}`}
              style={{ ...GHOST_BUTTON_STYLE, textDecoration: "none" }}
              download
            >
              Download workbook
            </a>
          ) : null}
          {xlsxComparisonDownloadHref ? (
            <a
              href={xlsxComparisonDownloadHref}
              data-testid={`source-canvas-document-body-download-xlsx-comparison-${artifact.artifactCode}`}
              style={{ ...GHOST_BUTTON_STYLE, textDecoration: "none" }}
              download
              title="Side-by-side comparison of vendor pricing submissions (currently demo mode)."
            >
              Download comparison xlsx
            </a>
          ) : null}
          {docxDownloadHref ? (
            <a
              href={docxDownloadHref}
              data-testid={`source-canvas-document-body-download-docx-${artifact.artifactCode}`}
              style={{ ...GHOST_BUTTON_STYLE, textDecoration: "none" }}
              download
              title="Download as Word document."
            >
              Download docx
            </a>
          ) : null}
          {htmlViewHref ? (
            <a
              href={htmlViewHref}
              data-testid={`source-canvas-document-body-view-html-${artifact.artifactCode}`}
              style={{ ...GHOST_BUTTON_STYLE, textDecoration: "none" }}
              target="_blank"
              rel="noopener noreferrer"
              title="View as a browser-readable HTML document — useful for sharing as a link, or printing to PDF from the browser."
            >
              View HTML
            </a>
          ) : null}
          {pdfDownloadHref ? (
            <a
              href={pdfDownloadHref}
              data-testid={`source-canvas-document-body-download-pdf-${artifact.artifactCode}`}
              style={{ ...GHOST_BUTTON_STYLE, textDecoration: "none" }}
              download
              title="Download as PDF — print-ready archival format with cover page, page numbers, and confidentiality footer."
            >
              Download PDF
            </a>
          ) : null}
        </div>
      </div>
      {clientFinal ? (
        <div
          style={CLIENT_FINAL_BANNER_STYLE}
          data-testid={`source-canvas-client-final-banner-${artifact.artifactCode}`}
        >
          <strong>
            Client Final accepted — this version is authoritative.
          </strong>
          <span>
            {clientFinal.fileName ? ` ${clientFinal.fileName}` : ""}
            {clientFinal.acceptedAt
              ? ` · accepted ${formatShortDate(clientFinal.acceptedAt)}`
              : ""}
          </span>
          {clientFinal.note ? <span>{clientFinal.note}</span> : null}
        </div>
      ) : null}
      {generationError ? (
        <div
          role="alert"
          data-testid={`source-canvas-document-body-generation-error-${artifact.artifactCode}`}
          style={GENERATION_ERROR_STYLE}
        >
          Generation failed — {generationError}
        </div>
      ) : null}
      {reasoning && reasoning.status !== "disabled" ? (
        <ReasoningBanner
          reasoning={reasoning}
          artifactCode={artifact.artifactCode}
        />
      ) : null}
      {exportOptionsHidden ? (
        <div style={EXPORT_EMPTY_NOTE_STYLE}>
          Document exports appear once this artifact has a draft. Workbook
          templates stay available for governed intake.
        </div>
      ) : null}
      {authoredBody ? (
        <pre
          style={MARKDOWN_BODY_STYLE}
          data-testid="source-canvas-document-body"
        >
          {authoredBody}
        </pre>
      ) : templateBody ? (
        <div
          style={UNAUTHORED_BODY_STYLE}
          data-testid="source-canvas-document-body"
        >
          <strong>No client-authored body yet.</strong> Use Generate with aVa,
          Author content, or upload evidence before this document is treated as
          review-ready. The starter content is kept out of the main workspace so
          it is not mistaken for approved event content.
        </div>
      ) : null}
    </div>
  );
}

interface ClientFinalMetadata {
  fileName?: string;
  acceptedAt?: string;
  note?: string;
}

function readClientFinalMetadata(
  metadata: Record<string, unknown> | null,
): ClientFinalMetadata | null {
  const value = metadata?.clientFinal;
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  return {
    fileName: typeof record.fileName === "string" ? record.fileName : undefined,
    acceptedAt:
      typeof record.acceptedAt === "string" ? record.acceptedAt : undefined,
    note: typeof record.note === "string" ? record.note : undefined,
  };
}

function formatShortDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface ReasoningEnvelopeShape {
  archetype?: string;
  rigor?: string;
  confidence?: { label: string; score: number };
  refusal?: { reason: string; missingEvidence?: { requirement: string }[] };
  claims?: unknown[];
}

function ReasoningBanner({
  reasoning,
  artifactCode,
}: {
  reasoning: { status: string; envelope?: unknown };
  artifactCode: string;
}) {
  // Slice 1.7: "ok" = grounded claims; "refusal" = no usable evidence (amber).
  // Gate-failed / error / disabled: suppress (internal, not user-actionable).
  if (reasoning.status !== "ok" && reasoning.status !== "refusal") return null;
  const env = reasoning.envelope as ReasoningEnvelopeShape | undefined;
  if (!env) return null;

  const isRefusal = reasoning.status === "refusal";
  const archetype = env.archetype ?? "unknown";
  const rigor = env.rigor ?? "standard";
  const conf = env.confidence;
  const claimCount = env.claims?.length ?? 0;
  const missing =
    env.refusal?.missingEvidence?.map((m) => m.requirement).join(", ") ?? "";

  const label = [
    archetype.toUpperCase(),
    rigor,
    conf ? `${conf.label} confidence` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      data-testid={`source-reasoning-banner-${artifactCode}`}
      style={isRefusal ? REASONING_WARN_STYLE : REASONING_INFO_STYLE}
    >
      <span style={REASONING_LABEL_STYLE}>Reasoning · {label}</span>
      {isRefusal ? (
        <span style={REASONING_DETAIL_STYLE}>
          {" "}
          — no gate-defining evidence yet
          {missing ? `: ${missing}` : ""}
        </span>
      ) : claimCount > 0 ? (
        <span style={REASONING_DETAIL_STYLE}>
          {" "}
          — {claimCount} claim{claimCount !== 1 ? "s" : ""} grounded
        </span>
      ) : null}
    </div>
  );
}

interface ArtifactRowProps {
  artifact: SourceEventArtifactState;
  spec: SourceArtifactSpec | undefined;
  isActive: boolean;
  onClick: () => void;
}

function ArtifactRow({ artifact, spec, isActive, onClick }: ArtifactRowProps) {
  const verification = sectionVerificationView(artifact);
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        data-testid={`source-canvas-artifact-${artifact.artifactCode}`}
        title={artifact.artifactCode}
        style={{
          ...ROW_BUTTON_STYLE,
          background: isActive ? "rgba(10,10,11,0.05)" : "transparent",
          color: CANVAS.INK,
        }}
      >
        <span style={ROW_NAME_STYLE}>
          {artifactDisplayName(artifact.artifactCode, spec?.name)}
        </span>
        <span style={ROW_META_STYLE}>
          <StatusPill artifact={artifact} />
          {verification ? (
            <span
              data-testid={`source-canvas-artifact-section-verification-${artifact.artifactCode}`}
              style={{
                ...SECTION_VERIFICATION_STYLE,
                color: verification.color,
                borderColor: verification.border,
                background: verification.background,
              }}
              title={verification.title}
            >
              {verification.label}
            </span>
          ) : null}
          {artifact.gateDefining ? (
            <span style={GATE_TAG_STYLE}>Required to advance</span>
          ) : null}
        </span>
      </button>
    </li>
  );
}

type SectionVerificationMetadata = {
  status?: unknown;
  checkedAt?: unknown;
  missingSections?: unknown;
  requiredSections?: unknown;
};

function sectionVerificationView(artifact: SourceEventArtifactState): {
  label: string;
  title: string;
  color: string;
  border: string;
  background: string;
} | null {
  const raw = artifact.bodyGenerationMetadata?.sectionVerification;
  if (!raw || typeof raw !== "object") return null;
  const verification = raw as SectionVerificationMetadata;
  const missingSections = Array.isArray(verification.missingSections)
    ? verification.missingSections.map(String)
    : [];

  if (verification.status === "incomplete") {
    const count = missingSections.length;
    return {
      label: `Unverified · ${count} section${count === 1 ? "" : "s"} missing`,
      title:
        missingSections.length > 0
          ? `Missing: ${missingSections.join(", ")}`
          : "Required section verification did not pass.",
      color: "#8a5a00",
      border: "rgba(138,90,0,0.28)",
      background: "rgba(138,90,0,0.09)",
    };
  }

  if (verification.status === "verified") {
    const requiredSections = Array.isArray(verification.requiredSections)
      ? verification.requiredSections.map(String)
      : [];
    return {
      label: "Verified",
      title:
        requiredSections.length > 0
          ? `Required sections present: ${requiredSections.join(", ")}`
          : "Required sections present.",
      color: "#2f6f4f",
      border: "rgba(47,111,79,0.22)",
      background: "rgba(47,111,79,0.08)",
    };
  }

  return null;
}

function StatusPill({ artifact }: { artifact: SourceEventArtifactState }) {
  const tone = statusTone(artifact.status);
  return (
    <span
      data-testid={`source-canvas-artifact-status-${artifact.status}`}
      style={{
        ...PILL_STYLE,
        background: tone.bg,
        color: tone.fg,
        borderColor: tone.border,
      }}
    >
      {artifactStatusDisplayName(artifact)}
    </span>
  );
}

interface ArtifactStatusControlsProps {
  artifact: SourceEventArtifactState;
  onChangeStatus?: (
    code: string,
    next: SourceEventArtifactStatus,
  ) => Promise<void>;
  pending: boolean;
}

function ArtifactStatusControls({
  artifact,
  onChangeStatus,
  pending,
}: ArtifactStatusControlsProps) {
  const isTerminal =
    artifact.status === "locked" || artifact.status === "superseded";
  const isApproved = artifact.status === "approved";
  return (
    <div style={STATUS_CONTROLS_STYLE}>
      <StatusPill artifact={artifact} />
      {onChangeStatus && !isTerminal ? (
        isApproved ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => onChangeStatus(artifact.artifactCode, "drafting")}
            data-testid={`source-canvas-artifact-reopen-${artifact.artifactCode}`}
            style={{ ...GHOST_BUTTON_STYLE, opacity: pending ? 0.55 : 1 }}
          >
            {pending ? "Reopening…" : "Reopen"}
          </button>
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={() => onChangeStatus(artifact.artifactCode, "approved")}
            data-testid={`source-canvas-artifact-mark-complete-${artifact.artifactCode}`}
            style={{ ...PRIMARY_BUTTON_STYLE, opacity: pending ? 0.55 : 1 }}
          >
            {pending ? "Saving…" : "Mark complete"}
          </button>
        )
      ) : null}
    </div>
  );
}

function statusTone(status: SourceEventArtifactStatus): {
  bg: string;
  fg: string;
  border: string;
} {
  switch (status) {
    case "approved":
      return {
        bg: "rgba(46,125,50,0.10)",
        fg: "#2E7D32",
        border: "rgba(46,125,50,0.32)",
      };
    case "drafting":
      return {
        bg: "rgba(186,117,23,0.10)",
        fg: "#A66400",
        border: "rgba(186,117,23,0.30)",
      };
    case "needs_review":
      return {
        bg: "rgba(211,84,0,0.10)",
        fg: "#B85B00",
        border: "rgba(211,84,0,0.30)",
      };
    case "locked":
      return {
        bg: "rgba(10,10,11,0.06)",
        fg: CANVAS.INK,
        border: "rgba(10,10,11,0.22)",
      };
    case "superseded":
      return {
        bg: "rgba(10,10,11,0.04)",
        fg: CANVAS.INK_SOFT,
        border: "rgba(10,10,11,0.14)",
      };
    case "not_started":
    default:
      return {
        bg: "rgba(10,10,11,0.04)",
        fg: CANVAS.INK_SOFT,
        border: "rgba(10,10,11,0.14)",
      };
  }
}

function artifactRequirementLabel(artifact: SourceEventArtifactState): string {
  if (artifact.gateDefining) return "Required artifact";
  if (artifact.requirementLevel === "recommended") return "Recommended";
  if (artifact.requirementLevel === "optional") return "Optional";
  return "Required";
}

const DOCUMENT_TAB_STYLE: CSSProperties = {
  display: "grid",
  gap: 20,
};

const REGISTRY_SHELF_STYLE: CSSProperties = {
  display: "grid",
  gap: 12,
  padding: "14px 16px",
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: 8,
  background: "#fff",
};

const REGISTRY_SHELF_HEADER_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 16,
};

const REGISTRY_SHELF_TITLE_STYLE: CSSProperties = {
  margin: 0,
  fontFamily: CANVAS.SERIF,
  fontSize: 20,
  lineHeight: 1.15,
  color: CANVAS.INK,
  letterSpacing: 0,
};

const REGISTRY_SHELF_BADGE_STYLE: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.10em",
  textTransform: "uppercase",
  color: CANVAS.ACTIVE,
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: 999,
  padding: "5px 8px",
  whiteSpace: "nowrap",
};

const REGISTRY_EMPTY_STYLE: CSSProperties = {
  margin: 0,
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  lineHeight: 1.45,
  color: CANVAS.INK_SOFT,
};

const REGISTRY_GRID_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
  gap: 8,
};

const REGISTRY_DOC_CARD_STYLE: CSSProperties = {
  display: "grid",
  gap: 5,
  minWidth: 0,
  padding: "10px 11px",
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: 6,
  color: CANVAS.INK,
  textDecoration: "none",
  background: "#fafafa",
};

const REGISTRY_DOC_TOPLINE_STYLE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  minWidth: 0,
  fontFamily: CANVAS.MONO,
  fontSize: 9,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: CANVAS.GRAY_DK,
};

const REGISTRY_DOC_NAME_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  fontWeight: 650,
  lineHeight: 1.3,
  color: CANVAS.INK,
  overflowWrap: "anywhere",
};

const REGISTRY_DOC_NAME_LINK_STYLE: CSSProperties = {
  ...REGISTRY_DOC_NAME_STYLE,
  textDecoration: "none",
};

const REGISTRY_DOC_META_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 12,
  lineHeight: 1.35,
  color: CANVAS.INK_SOFT,
};

const REGISTRY_DOC_ACTIONS_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
  marginTop: 4,
};

const REGISTRY_DOC_ACTION_STYLE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: 999,
  padding: "4px 8px",
  fontFamily: CANVAS.SANS,
  fontSize: 11,
  fontWeight: 650,
  color: CANVAS.INK,
  textDecoration: "none",
  background: "#fff",
};

const CONTAINER_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(220px, 280px) minmax(0, 1fr)",
  gap: 28,
  alignItems: "start",
};

const LIST_STYLE: CSSProperties = {
  display: "grid",
  gap: 16,
  position: "sticky",
  top: 0,
};

const GROUP_LABEL_STYLE: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: 9,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: CANVAS.GRAY_DK,
  marginBottom: 6,
};

const LIST_RESET_STYLE: CSSProperties = {
  listStyle: "none",
  padding: 0,
  margin: 0,
  display: "grid",
  gap: 2,
};

const ROW_BUTTON_STYLE: CSSProperties = {
  width: "100%",
  textAlign: "left",
  padding: "8px 10px",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  display: "grid",
  gap: 4,
  fontFamily: CANVAS.SANS,
  transition: "background 120ms ease",
};

const ROW_NAME_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  fontWeight: 500,
  color: CANVAS.INK,
  lineHeight: 1.35,
};

const ROW_META_STYLE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  fontFamily: CANVAS.MONO,
  fontSize: 10,
  color: CANVAS.INK_SOFT,
};

const GATE_TAG_STYLE: CSSProperties = {
  marginLeft: "auto",
  fontFamily: CANVAS.MONO,
  fontSize: 10,
  fontWeight: 600,
  color: CANVAS.INK_SOFT,
  letterSpacing: 0,
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: 999,
  padding: "2px 7px",
  background: "rgba(10,10,11,0.025)",
};

const UNAUTHORED_BODY_STYLE: CSSProperties = {
  margin: 0,
  padding: "18px 20px",
  border: `1px dashed ${CANVAS.RULE_STRONG}`,
  borderRadius: 8,
  background: "#fbfaf7",
  fontFamily: CANVAS.SANS,
  fontSize: 14,
  lineHeight: 1.55,
  color: CANVAS.INK_SOFT,
};

const BODY_STYLE: CSSProperties = {
  display: "grid",
  gap: 16,
  minWidth: 0,
};

const BODY_HEADER_STYLE: CSSProperties = {
  display: "grid",
  gap: 8,
  paddingBottom: 14,
  borderBottom: `1px solid ${CANVAS.HAIRLINE}`,
};

const BODY_EYEBROW_STYLE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  fontFamily: CANVAS.MONO,
  fontSize: 10,
  letterSpacing: 0,
  color: CANVAS.GRAY_DK,
};

const BODY_CODE_STYLE: CSSProperties = {
  fontWeight: 600,
  color: CANVAS.INK,
};

const DOT_STYLE: CSSProperties = {
  color: CANVAS.GRAY,
};

const BODY_TITLE_ROW_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 16,
  flexWrap: "wrap",
};

const BODY_TITLE_STYLE: CSSProperties = {
  fontFamily: CANVAS.SERIF,
  fontSize: 26,
  fontWeight: 400,
  letterSpacing: 0,
  color: CANVAS.INK,
  margin: 0,
  lineHeight: 1.15,
  flex: "1 1 auto",
  minWidth: 0,
};

const STATUS_CONTROLS_STYLE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 10,
  flex: "0 0 auto",
};

const PILL_STYLE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  fontFamily: CANVAS.MONO,
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: 0,
  padding: "3px 8px",
  borderRadius: 999,
  border: "1px solid transparent",
  whiteSpace: "nowrap",
};

const SECTION_VERIFICATION_STYLE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  fontFamily: CANVAS.MONO,
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: 0,
  padding: "3px 8px",
  borderRadius: 999,
  border: "1px solid transparent",
  whiteSpace: "nowrap",
};

const PRIMARY_BUTTON_STYLE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "7px 12px",
  borderRadius: 6,
  border: "none",
  background: CANVAS.INK,
  color: "#ffffff",
  fontFamily: CANVAS.MONO,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  cursor: "pointer",
};

const EDITOR_WRAP_STYLE: CSSProperties = {
  display: "grid",
  gap: 10,
  marginTop: 4,
};

const EDITOR_TEXTAREA_STYLE: CSSProperties = {
  width: "100%",
  minHeight: 360,
  padding: "14px 16px",
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  fontFamily: CANVAS.MONO,
  fontSize: 13,
  lineHeight: 1.6,
  color: CANVAS.INK,
  background: "#ffffff",
  resize: "vertical",
  outline: "none",
  boxSizing: "border-box",
};

const EDITOR_TOOLBAR_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
};

const EDITOR_HINT_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 11.5,
  color: CANVAS.INK_SOFT,
  fontStyle: "italic",
};

const EDITOR_BUTTONS_STYLE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
};

const READER_WRAP_STYLE: CSSProperties = {
  display: "grid",
  gap: 10,
  marginTop: 4,
};

const READER_HEADER_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  paddingBottom: 6,
  flexWrap: "wrap",
};

const READER_BUTTONS_STYLE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
};

const CLIENT_FINAL_BANNER_STYLE: CSSProperties = {
  display: "grid",
  gap: 4,
  borderRadius: CANVAS.RADIUS_TIGHT,
  border: "1px solid rgba(15,118,110,0.25)",
  background: "rgba(15,118,110,0.06)",
  padding: "10px 12px",
  fontFamily: CANVAS.SANS,
  fontSize: 12.5,
  color: "#0f766e",
  lineHeight: 1.45,
};

const CLIENT_FINAL_BADGE_STYLE: CSSProperties = {
  border: "1px solid rgba(15,118,110,0.22)",
  borderRadius: 999,
  background: "rgba(15,118,110,0.08)",
  color: "#0f766e",
  fontWeight: 800,
  padding: "2px 7px",
};

const AUTHORITATIVE_BADGE_STYLE: CSSProperties = {
  ...CLIENT_FINAL_BADGE_STYLE,
  color: "#1d4ed8",
  background: "rgba(29,78,216,0.08)",
  border: "1px solid rgba(29,78,216,0.22)",
};

const GENERATION_ERROR_STYLE: CSSProperties = {
  borderRadius: CANVAS.RADIUS_TIGHT,
  border: "1px solid rgba(186,117,23,0.30)",
  background: "rgba(186,117,23,0.06)",
  padding: "10px 12px",
  fontFamily: CANVAS.SANS,
  fontSize: 12.5,
  color: "#A66400",
  lineHeight: 1.5,
};

const READER_BADGE_STYLE: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: 10,
  letterSpacing: 0,
  color: CANVAS.INK_SOFT,
  fontWeight: 600,
};

const REASONING_WARN_STYLE: CSSProperties = {
  borderRadius: CANVAS.RADIUS_TIGHT,
  border: "1px solid rgba(186,117,23,0.25)",
  background: "rgba(186,117,23,0.04)",
  padding: "7px 12px",
  fontFamily: CANVAS.SANS,
  fontSize: 12,
  color: "#8B5500",
  lineHeight: 1.45,
};

const REASONING_INFO_STYLE: CSSProperties = {
  borderRadius: CANVAS.RADIUS_TIGHT,
  border: `1px solid ${CANVAS.HAIRLINE}`,
  background: "rgba(10,10,11,0.02)",
  padding: "7px 12px",
  fontFamily: CANVAS.SANS,
  fontSize: 12,
  color: CANVAS.INK_SOFT,
  lineHeight: 1.45,
};

const REASONING_LABEL_STYLE: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: 0.2,
};

const REASONING_DETAIL_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 12,
};

const EXPORT_EMPTY_NOTE_STYLE: CSSProperties = {
  margin: 0,
  padding: "12px 14px",
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: 8,
  background: "#fbfaf7",
  fontFamily: CANVAS.SANS,
  fontSize: 12.5,
  lineHeight: 1.5,
  color: CANVAS.INK_SOFT,
};

const GHOST_BUTTON_STYLE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "6px 11px",
  borderRadius: 6,
  border: `1px solid ${CANVAS.RULE}`,
  background: "transparent",
  color: CANVAS.INK,
  fontFamily: CANVAS.MONO,
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  cursor: "pointer",
};

const BODY_DESC_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 14,
  lineHeight: 1.55,
  color: CANVAS.INK_SOFT,
  margin: 0,
};

const MARKDOWN_BODY_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 13.5,
  lineHeight: 1.7,
  color: CANVAS.INK,
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  margin: 0,
};

const MISSING_TEMPLATE_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  color: CANVAS.INK_SOFT,
  background: "rgba(186,117,23,0.05)",
  border: `1px solid rgba(186,117,23,0.18)`,
  padding: "12px 14px",
  borderRadius: CANVAS.RADIUS_TIGHT,
};

const EMPTY_STYLE: CSSProperties = {
  display: "grid",
  gap: 8,
  padding: "32px 0",
};

const EMPTY_TITLE_STYLE: CSSProperties = {
  fontFamily: CANVAS.SERIF,
  fontSize: 20,
  fontWeight: 400,
  color: CANVAS.INK,
  margin: 0,
};

const EMPTY_BODY_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  lineHeight: 1.6,
  color: CANVAS.INK_SOFT,
  margin: 0,
  maxWidth: 520,
};
