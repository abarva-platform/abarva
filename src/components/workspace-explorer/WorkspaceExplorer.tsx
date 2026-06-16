"use client";

import { useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  WorkspaceGenerateCandidate,
  WorkspaceGenerateIntent,
  WorkspaceItem,
  WorkspaceItemState,
  WorkspaceUploadIntent,
} from "@/lib/workspace-explorer/types";
import {
  SOURCE_STAGE_ORDER,
  SOURCE_STAGE_LABELS,
  isSourceStageKey,
} from "@/lib/source/constants";
import {
  evidenceForStage,
  type SourceEvidenceRequirement,
} from "@/lib/source/canonical-specs";
import type { SourceStageKey } from "@/lib/source/types";

interface WorkspaceExplorerProps {
  title: string;
  eyebrow: string;
  backHref: string;
  backLabel?: string;
  items: WorkspaceItem[];
  mode?: "page" | "drawer";
  generateIntent?: WorkspaceGenerateIntent;
  uploadIntent?: WorkspaceUploadIntent;
}

type GenerateResult =
  | {
      state: "idle";
    }
  | {
      state: "success";
      artifactName: string;
      review: QualityGateSummary | null;
      reviewHref: string;
    }
  | {
      state: "error";
      detail: string;
      missingUpstream?: string[];
    };

type UploadResult =
  | {
      state: "idle";
    }
  | {
      state: "success";
      artifactName: string;
      version: number | string | null;
      parseStatus: string | null;
    }
  | {
      state: "error";
      detail: string;
    };

interface QualityGateSummary {
  passed: boolean;
  attempts: number;
  finalSummary: string;
}

type WorkspaceTableRow =
  | {
      kind: "requirement";
      id: string;
      requirement: SourceEvidenceRequirement;
      doc: WorkspaceItem | null;
    }
  | {
      kind: "document";
      id: string;
      doc: WorkspaceItem;
    };

/** The lifecycle step an item belongs to (its folder in the by-step explorer). */
function stageOf(item: WorkspaceItem): string {
  return typeof item.stageKey === "string" && item.stageKey.length > 0
    ? item.stageKey
    : "event";
}

/** Human folder label for a stage key. */
function stageLabel(stage: string): string {
  if (isSourceStageKey(stage)) {
    return SOURCE_STAGE_LABELS[stage as SourceStageKey];
  }
  return stage === "event" ? "Event" : stage;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function WorkspaceExplorer({
  title,
  eyebrow,
  backHref,
  backLabel = "Back to event",
  items,
  mode = "page",
  generateIntent,
  uploadIntent,
}: WorkspaceExplorerProps) {
  const router = useRouter();
  const documentItems = useMemo(
    () => items.filter((item) => item.kind !== "approval"),
    [items],
  );
  // By-step explorer: the left nav is the lifecycle stages as folders, ordered
  // by the canonical source lifecycle. Items carry stageKey; stage-less items
  // fall under "Event".
  const stageFolders = useMemo(() => {
    const present = new Set(documentItems.map(stageOf));
    const ordered: string[] = [];
    for (const stage of SOURCE_STAGE_ORDER) {
      if (present.has(stage)) ordered.push(stage);
    }
    if (present.has("event")) ordered.push("event");
    for (const stage of present) {
      if (!ordered.includes(stage)) ordered.push(stage);
    }
    return ordered;
  }, [documentItems]);
  const [activeStage, setActiveStage] = useState<string>(
    () => stageFolders[0] ?? "all",
  );
  const [selectedGenerateId, setSelectedGenerateId] = useState(
    generateIntent?.candidates[0]?.id ?? "",
  );
  const [generatePending, setGeneratePending] = useState(false);
  const [generateResult, setGenerateResult] = useState<GenerateResult>({
    state: "idle",
  });
  const [uploadPending, setUploadPending] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult>({
    state: "idle",
  });
  const counts = useMemo(() => {
    const next = new Map<string, number>();
    for (const item of documentItems)
      next.set(stageOf(item), (next.get(stageOf(item)) ?? 0) + 1);
    return next;
  }, [documentItems]);
  const filtered =
    activeStage === "all"
      ? documentItems
      : documentItems.filter((item) => stageOf(item) === activeStage);
  // What this step still needs — the canonical evidence requirements for the
  // selected source stage, surfaced as "needed" rows (templates/uploads/gaps).
  const stageNeeds =
    activeStage !== "all" && isSourceStageKey(activeStage)
      ? evidenceForStage(activeStage as SourceStageKey)
      : [];
  // Real documents in this step — actual uploaded files / generated drafts only.
  // Excludes the scaffold noise the substrate carries (missing-state requirement
  // placeholders and gate-criterion/approval rows), so the right pane shows
  // documents, never internal EVID/GATE codes.
  const realDocs = filtered.filter(
    (item) => item.state !== "missing",
  );
  // The real file (if any) that satisfies a required document — best-effort by a
  // distinctive word in the requirement label.
  const matchedDoc = (req: { label: string }): WorkspaceItem | null => {
    const tokens = req.label
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 4);
    if (tokens.length === 0) return null;
    return (
      realDocs.find((item) =>
        tokens.some((token) => item.name.toLowerCase().includes(token)),
      ) ?? null
    );
  };
  // Pair each required document with its uploaded file (if any); the rest of the
  // real files (uploads/drafts not tied to a requirement) show under "Other".
  const coveredDocIds = new Set<string>();
  const docRows = stageNeeds.map((req) => {
    const doc = matchedDoc(req);
    if (doc) coveredDocIds.add(doc.id);
    return { req, doc };
  });
  const extraDocs = realDocs.filter((doc) => !coveredDocIds.has(doc.id));
  const tableRows: WorkspaceTableRow[] = [
    ...docRows.map(({ req, doc }) => ({
      kind: "requirement" as const,
      id: req.requirementId,
      requirement: req,
      doc,
    })),
    ...extraDocs.map((doc) => ({
      kind: "document" as const,
      id: doc.id,
      doc,
    })),
  ];
  const selectedGenerateCandidate =
    generateIntent?.candidates.find(
      (candidate) => candidate.id === selectedGenerateId,
    ) ??
    generateIntent?.candidates[0] ??
    null;

  const handleGenerate = async () => {
    if (!selectedGenerateCandidate) return;
    setGeneratePending(true);
    setGenerateResult({ state: "idle" });
    try {
      const method = selectedGenerateCandidate.method ?? "POST";
      const responseKind = selectedGenerateCandidate.responseKind ?? "json";
      const response = await fetch(selectedGenerateCandidate.generateHref, {
        method,
        ...(method === "POST"
          ? {
              headers: { "content-type": "application/json" },
              body: JSON.stringify({}),
            }
          : {}),
      });
      if (responseKind === "html") {
        const body = await response.text().catch(() => "");
        if (!response.ok) {
          setGenerateResult({
            state: "error",
            detail:
              body.trim().slice(0, 240) ||
              `Generation failed with HTTP ${response.status}.`,
          });
          return;
        }
        setGenerateResult({
          state: "success",
          artifactName: selectedGenerateCandidate.label,
          review: null,
          reviewHref: selectedGenerateCandidate.reviewHref,
        });
        router.refresh();
        return;
      }
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        detail?: string;
        missingUpstream?: string[];
        generation?: {
          qualityGate?: QualityGateSummary | null;
        };
      } | null;
      if (!response.ok || !payload) {
        setGenerateResult({
          state: "error",
          detail:
            payload?.detail ??
            `Generation failed with HTTP ${response.status}.`,
          missingUpstream: payload?.missingUpstream,
        });
        return;
      }
      setGenerateResult({
        state: "success",
        artifactName: selectedGenerateCandidate.label,
        review: payload.generation?.qualityGate ?? null,
        reviewHref: selectedGenerateCandidate.reviewHref,
      });
      router.refresh();
    } catch (error) {
      setGenerateResult({
        state: "error",
        detail:
          error instanceof Error
            ? error.message
            : "Generation request failed before reaching the Source route.",
      });
    } finally {
      setGeneratePending(false);
    }
  };

  const handleUpload = async (input: {
    file: File;
    classification: string;
    family: string;
  }) => {
    if (!uploadIntent) return;
    setUploadPending(true);
    setUploadResult({ state: "idle" });
    try {
      const formData = new FormData();
      formData.append("file", input.file, input.file.name);
      if (uploadIntent.stageKey) {
        formData.append("stageKey", String(uploadIntent.stageKey));
      }
      formData.append("dataClassification", input.classification);
      formData.append("dataProtectionClassification", input.classification);
      if (input.family) formData.append("artifactFamily", input.family);

      const response = await fetch(uploadIntent.uploadHref, {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json().catch(() => null)) as {
        detail?: string;
        error?: string;
        artifact?: {
          originalName?: string;
          version?: number | string | null;
          parseStatus?: string | null;
        };
      } | null;
      if (!response.ok || !payload?.artifact) {
        setUploadResult({
          state: "error",
          detail:
            payload?.detail ??
            payload?.error ??
            `Upload failed with HTTP ${response.status}.`,
        });
        return;
      }
      setUploadResult({
        state: "success",
        artifactName: payload.artifact.originalName ?? input.file.name,
        version: payload.artifact.version ?? null,
        parseStatus: payload.artifact.parseStatus ?? null,
      });
      router.refresh();
    } catch (error) {
      setUploadResult({
        state: "error",
        detail:
          error instanceof Error
            ? error.message
            : "Upload request failed before reaching the governed route.",
      });
    } finally {
      setUploadPending(false);
    }
  };

  return (
    <section
      data-testid="workspace-explorer"
      data-mode={mode}
      style={mode === "drawer" ? DRAWER_WRAP_STYLE : PAGE_WRAP_STYLE}
    >
      <header style={HEADER_STYLE}>
        <div>
          <div style={EYEBROW_STYLE}>{eyebrow}</div>
          <h1 style={TITLE_STYLE}>{title}</h1>
        </div>
        <Link href={backHref} style={BACK_LINK_STYLE}>
          {backLabel}
        </Link>
      </header>

      {generateIntent ? (
        <GeneratePanel
          intent={generateIntent}
          selected={selectedGenerateCandidate}
          selectedId={selectedGenerateId}
          pending={generatePending}
          result={generateResult}
          onSelect={setSelectedGenerateId}
          onGenerate={handleGenerate}
        />
      ) : null}

      {uploadIntent ? (
        <UploadPanel
          intent={uploadIntent}
          pending={uploadPending}
          result={uploadResult}
          onUpload={handleUpload}
        />
      ) : null}

      <div style={SHELL_STYLE}>
        <nav aria-label="Steps" style={NAV_STYLE}>
          <button
            type="button"
            onClick={() => setActiveStage("all")}
            style={navButtonStyle(activeStage === "all")}
          >
            <span>All items</span>
            <strong>{documentItems.length}</strong>
          </button>
          {stageFolders.map((stage) => (
            <button
              key={stage}
              type="button"
              data-testid={`workspace-step-${stage}`}
              onClick={() => setActiveStage(stage)}
              style={navButtonStyle(activeStage === stage)}
            >
              <span>{stageLabel(stage)}</span>
              <strong>
                {isSourceStageKey(stage)
                  ? evidenceForStage(stage as SourceStageKey).length
                  : (counts.get(stage) ?? 0)}
              </strong>
            </button>
          ))}
        </nav>

        <div style={LIST_STYLE} aria-label="Documents for this step">
          {tableRows.length > 0 ? (
            <div data-testid="workspace-table-wrap" style={TABLE_WRAP_STYLE}>
              <table data-testid="workspace-files-table" style={TABLE_STYLE}>
                <thead>
                  <tr>
                    <th style={{ ...TH_STYLE, width: "34%" }}>File</th>
                    <th style={{ ...TH_STYLE, width: "11%" }}>Stage</th>
                    <th style={{ ...TH_STYLE, width: "20%" }}>Needed for</th>
                    <th style={{ ...TH_STYLE, width: "12%" }}>Status</th>
                    <th style={{ ...TH_STYLE, width: "11%" }}>Owner</th>
                    <th style={{ ...TH_STYLE, width: "12%" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row) => {
                    const doc = row.doc;
                    const requirement =
                      row.kind === "requirement" ? row.requirement : null;
                    return (
                      <tr
                        key={row.id}
                        data-testid="workspace-explorer-row"
                        data-row-kind={row.kind}
                        style={tableRowStyle()}
                      >
                        <td style={TD_STYLE}>
                          <span style={FILE_CELL_STYLE}>
                            <span
                              style={
                                doc
                                  ? FILE_GLYPH_STYLE
                                  : needDotStyle(requirement?.level ?? "recommended")
                              }
                              aria-hidden
                            >
                              {doc ? fileGlyph(doc) : ""}
                            </span>
                            <span style={FILE_TEXT_STYLE}>
                              <strong style={FILE_NAME_STYLE}>
                                {doc?.name ?? requirement?.label}
                              </strong>
                              <span style={ITEM_META_STYLE}>
                                {doc
                                  ? `${doc.origin} · ${formatDate(
                                      doc.audit.updatedAt ?? doc.audit.createdAt,
                                    )}`
                                  : requirement?.sourceLabel}
                              </span>
                            </span>
                          </span>
                        </td>
                        <td style={TD_STYLE}>{stageLabel(tableStage(row))}</td>
                        <td style={TD_STYLE}>{tableNeededFor(row)}</td>
                        <td style={TD_STYLE}>
                          <span style={stateBadgeStyle(doc?.state ?? "missing")}>
                            {doc ? stateLabel(doc.state) : "Needed"}
                          </span>
                        </td>
                        <td style={TD_STYLE}>{tableOwner(row)}</td>
                        <td style={TD_STYLE}>
                          {doc ? (
                            <WorkspaceItemAction item={doc} />
                          ) : (
                            <Link
                              href={`?intent=upload&stage=${activeStage}`}
                              style={NEED_UPLOAD_STYLE}
                              onClick={(event) => event.stopPropagation()}
                            >
                              Upload
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={EMPTY_STYLE}>No documents in this step yet.</div>
          )}
        </div>
      </div>
    </section>
  );
}

function WorkspaceItemAction({ item }: { item: WorkspaceItem }) {
  const href = item.downloadHref ?? item.href;
  if (!href) {
    return <span style={DISABLED_ACTION_STYLE}>Not ready</span>;
  }
  return (
    <a
      href={href}
      data-testid={`workspace-open-item-${item.id}`}
      style={ACTION_LINK_STYLE}
      onClick={(event) => event.stopPropagation()}
    >
      Open
    </a>
  );
}

function UploadPanel({
  intent,
  pending,
  result,
  onUpload,
}: {
  intent: WorkspaceUploadIntent;
  pending: boolean;
  result: UploadResult;
  onUpload: (input: {
    file: File;
    classification: string;
    family: string;
  }) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [classification, setClassification] = useState(
    intent.defaultClassification,
  );
  const [family, setFamily] = useState(
    intent.defaultFamily ?? intent.familyOptions[0]?.value ?? "",
  );

  return (
    <section
      data-testid="workspace-upload-panel"
      aria-label="Governed workspace upload"
      style={UPLOAD_PANEL_STYLE}
    >
      <div>
        <div style={EYEBROW_STYLE}>Upload</div>
        <h2 style={GENERATE_TITLE_STYLE}>Add governed evidence</h2>
        <p style={PREVIEW_COPY_STYLE}>
          Uploads use the {intent.module} governed route, not the chat
          paperclip. Files are checked before storage; accepted uploads create a
          new registry version and never overwrite an existing artifact.
        </p>
      </div>
      <div style={GENERATE_CONTROLS_STYLE}>
        <label style={GENERATE_LABEL_STYLE}>
          File
          <input
            data-testid="workspace-upload-file"
            type="file"
            accept={intent.acceptedFormats}
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            style={FILE_INPUT_STYLE}
          />
        </label>
        <label style={GENERATE_LABEL_STYLE}>
          Classification
          <select
            value={classification}
            onChange={(event) => setClassification(event.target.value)}
            style={GENERATE_SELECT_STYLE}
          >
            {intent.classificationOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label style={GENERATE_LABEL_STYLE}>
          Evidence family
          <select
            value={family}
            onChange={(event) => setFamily(event.target.value)}
            style={GENERATE_SELECT_STYLE}
          >
            {intent.familyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          data-testid="workspace-upload-submit"
          disabled={pending || !file}
          onClick={() => {
            if (file) onUpload({ file, classification, family });
          }}
          style={{
            ...ACTION_BUTTON_STYLE,
            opacity: pending || !file ? 0.55 : 1,
          }}
        >
          {pending ? "Uploading…" : "Upload to workspace"}
        </button>
        <UploadResultView result={result} />
      </div>
    </section>
  );
}

function UploadResultView({ result }: { result: UploadResult }) {
  if (result.state === "idle") return null;
  if (result.state === "error") {
    return (
      <div data-testid="workspace-upload-error" style={GENERATE_ERROR_STYLE}>
        <strong>Upload blocked</strong>
        <span>{result.detail}</span>
      </div>
    );
  }
  return (
    <div data-testid="workspace-upload-success" style={GENERATE_SUCCESS_STYLE}>
      <strong>{result.artifactName} uploaded</strong>
      <span>
        Registry version: v{result.version ?? "recorded"} · Parse status:{" "}
        {result.parseStatus ?? "pending"}
      </span>
    </div>
  );
}

function GeneratePanel({
  intent,
  selected,
  selectedId,
  pending,
  result,
  onSelect,
  onGenerate,
}: {
  intent: WorkspaceGenerateIntent;
  selected: WorkspaceGenerateCandidate | null;
  selectedId: string;
  pending: boolean;
  result: GenerateResult;
  onSelect: (id: string) => void;
  onGenerate: () => void;
}) {
  return (
    <section
      data-testid="workspace-generate-panel"
      aria-label="Generate workspace artifact"
      style={GENERATE_PANEL_STYLE}
    >
      <div>
        <div style={EYEBROW_STYLE}>Generate</div>
        <h2 style={GENERATE_TITLE_STYLE}>Draft into the workspace</h2>
        <p style={PREVIEW_COPY_STYLE}>
          Uses the existing {intent.module} generate route. Output stays draft
          until a named human reviews it in the existing approval flow.
        </p>
      </div>
      {intent.candidates.length > 0 ? (
        <div style={GENERATE_CONTROLS_STYLE}>
          <label style={GENERATE_LABEL_STYLE}>
            Artifact
            <select
              value={selected?.id ?? selectedId}
              onChange={(event) => onSelect(event.target.value)}
              style={GENERATE_SELECT_STYLE}
            >
              {intent.candidates.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.label}
                </option>
              ))}
            </select>
          </label>
          {selected?.description ? (
            <p style={GENERATE_DESCRIPTION_STYLE}>{selected.description}</p>
          ) : null}
          <button
            type="button"
            data-testid="workspace-generate-submit"
            disabled={pending || !selected}
            onClick={onGenerate}
            style={{
              ...ACTION_BUTTON_STYLE,
              opacity: pending || !selected ? 0.55 : 1,
            }}
          >
            {pending ? "Generating…" : "Generate draft"}
          </button>
          <GenerateResultView result={result} />
        </div>
      ) : (
        <div style={GENERATE_EMPTY_STYLE}>
          No supported generator is available for this stage yet. Use the
          existing canvas authoring path for now.
        </div>
      )}
    </section>
  );
}

function GenerateResultView({ result }: { result: GenerateResult }) {
  if (result.state === "idle") return null;
  if (result.state === "error") {
    return (
      <div data-testid="workspace-generate-error" style={GENERATE_ERROR_STYLE}>
        <strong>Generation blocked</strong>
        <span>{result.detail}</span>
        {result.missingUpstream && result.missingUpstream.length > 0 ? (
          <span>Missing upstream: {result.missingUpstream.join(", ")}</span>
        ) : null}
      </div>
    );
  }
  return (
    <div
      data-testid="workspace-generate-success"
      style={GENERATE_SUCCESS_STYLE}
    >
      <strong>{result.artifactName} draft generated</strong>
      {result.review ? (
        <span>
          Quality review: {result.review.passed ? "passed" : "blocked"} ·{" "}
          {result.review.attempts} attempt(s). {result.review.finalSummary}
        </span>
      ) : (
        <span>
          This artifact did not require the consulting-grade quality gate on the
          active generator path.
        </span>
      )}
      <Link href={result.reviewHref} style={INLINE_REVIEW_LINK_STYLE}>
        Review draft on canvas
      </Link>
    </div>
  );
}

function tableStage(row: WorkspaceTableRow): string {
  return row.kind === "document"
    ? stageOf(row.doc)
    : row.doc
      ? stageOf(row.doc)
      : row.requirement.stage;
}

function tableNeededFor(row: WorkspaceTableRow): string {
  if (row.kind === "document") {
    return row.doc.artifactCode
      ? row.doc.artifactCode.replace(/[_-]+/g, " ")
      : humanizeToken(row.doc.kind);
  }
  return row.requirement.unlocks;
}

function tableOwner(row: WorkspaceTableRow): string {
  const doc = row.kind === "document" ? row.doc : row.doc;
  if (doc?.audit.createdBy) return displayActor(doc.audit.createdBy);
  if (doc?.audit.updatedBy) return displayActor(doc.audit.updatedBy);
  if (row.kind === "requirement") return humanizeToken(row.requirement.level);
  return "Not recorded";
}

function fileGlyph(item: WorkspaceItem): string {
  const type = item.type.toUpperCase();
  if (type.length > 0 && type.length <= 4) return type;
  if (item.kind === "vendor_response") return "VDR";
  if (item.kind === "deliverable") return "DOC";
  return "FILE";
}

function displayActor(value: string | null | undefined): string {
  if (!value) return "Not recorded";
  if (/^user_[a-z0-9]+/i.test(value)) return "User";
  return value;
}

function humanizeToken(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function stateLabel(state: WorkspaceItemState): string {
  switch (state) {
    case "loaded":
      return "Loaded";
    case "parsed":
      return "Parsed";
    case "available":
      return "Available";
    case "usable":
      return "Usable";
    case "draft":
      return "Draft";
    case "review":
      return "Review";
    case "approved":
      return "Approved";
    case "superseded":
      return "Superseded";
    case "blocked":
      return "Blocked";
    case "missing":
    default:
      return "Needed";
  }
}

function navButtonStyle(active: boolean): CSSProperties {
  return {
    border: "none",
    borderRadius: 6,
    padding: "10px 12px",
    background: active ? "#ffffff" : "transparent",
    color: active ? "#0c1a3a" : "#5b6c8a",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    font: "600 13px var(--font-inter), 'Inter', system-ui, -apple-system, sans-serif",
    cursor: "pointer",
    boxShadow: active ? "0 0 0 1px rgba(15,23,42,0.08)" : "none",
  };
}

function tableRowStyle(): CSSProperties {
  return {
    background: "#ffffff",
    cursor: "default",
  };
}

function stateBadgeStyle(state: WorkspaceItemState): CSSProperties {
  const palette =
    state === "usable" || state === "approved" || state === "parsed"
      ? {
          color: "#047857",
          background: "#ecfdf3",
          borderColor: "#bbf7d0",
        }
      : state === "missing" || state === "review" || state === "draft"
        ? {
            color: "#9a3412",
            background: "#fff7ed",
            borderColor: "#fed7aa",
          }
        : state === "blocked"
          ? {
              color: "#991b1b",
              background: "#fef2f2",
              borderColor: "#fecaca",
            }
          : {
              color: "#475569",
              background: "#f8fafc",
              borderColor: "#e2e8f0",
            };
  return {
    display: "inline-flex",
    alignItems: "center",
    width: "max-content",
    border: `1px solid ${palette.borderColor}`,
    borderRadius: 999,
    padding: "3px 7px",
    font: "700 11px/1.1 var(--font-inter), 'Inter', system-ui, -apple-system, sans-serif",
    color: palette.color,
    background: palette.background,
    whiteSpace: "nowrap",
  };
}

const PAGE_WRAP_STYLE: CSSProperties = {
  background: "#f8f7f4",
  minHeight: "100%",
  padding: "24px",
  color: "#0c1a3a",
};

const DRAWER_WRAP_STYLE: CSSProperties = {
  ...PAGE_WRAP_STYLE,
  padding: 16,
};

const HEADER_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 24,
  marginBottom: 18,
};

const EYEBROW_STYLE: CSSProperties = {
  font: "700 10px/1.2 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "#5b6c8a",
};

const TITLE_STYLE: CSSProperties = {
  margin: "6px 0 0",
  font: "700 30px/1.1 var(--font-fraunces), 'Fraunces', Georgia, serif",
  letterSpacing: 0,
  color: "#10172f",
};

const BACK_LINK_STYLE: CSSProperties = {
  border: "1px solid #d8d5ce",
  borderRadius: 6,
  padding: "9px 12px",
  color: "#0c1a3a",
  textDecoration: "none",
  font: "700 12px var(--font-inter), 'Inter', system-ui, -apple-system, sans-serif",
  background: "#ffffff",
};

const GENERATE_PANEL_STYLE: CSSProperties = {
  border: "1px solid #d8d5ce",
  borderRadius: 8,
  background: "#ffffff",
  padding: 18,
  marginBottom: 14,
  display: "grid",
  gridTemplateColumns: "minmax(260px, 0.8fr) minmax(320px, 1fr)",
  gap: 18,
  alignItems: "start",
};

const UPLOAD_PANEL_STYLE: CSSProperties = {
  ...GENERATE_PANEL_STYLE,
  borderColor: "#c7d2fe",
  background: "#f8fbff",
};

const GENERATE_TITLE_STYLE: CSSProperties = {
  margin: "6px 0 8px",
  font: "700 22px/1.15 var(--font-fraunces), 'Fraunces', Georgia, serif",
  letterSpacing: 0,
  color: "#10172f",
};

const GENERATE_CONTROLS_STYLE: CSSProperties = {
  display: "grid",
  gap: 10,
};

const GENERATE_LABEL_STYLE: CSSProperties = {
  display: "grid",
  gap: 6,
  font: "700 11px/1.2 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "#5b6c8a",
};

const GENERATE_SELECT_STYLE: CSSProperties = {
  border: "1px solid #d8d5ce",
  borderRadius: 6,
  padding: "10px 12px",
  background: "#fbfaf7",
  color: "#0c1a3a",
  font: "600 13px/1.35 var(--font-inter), 'Inter', system-ui, -apple-system, sans-serif",
};

const FILE_INPUT_STYLE: CSSProperties = {
  border: "1px solid #d8d5ce",
  borderRadius: 6,
  padding: "9px 10px",
  background: "#ffffff",
  color: "#0c1a3a",
  font: "600 13px/1.35 var(--font-inter), 'Inter', system-ui, -apple-system, sans-serif",
};

const GENERATE_DESCRIPTION_STYLE: CSSProperties = {
  margin: 0,
  font: "500 13px/1.45 var(--font-inter), 'Inter', system-ui, -apple-system, sans-serif",
  color: "#475569",
};

const ACTION_BUTTON_STYLE: CSSProperties = {
  justifySelf: "start",
  border: "none",
  borderRadius: 6,
  background: "#10172f",
  color: "#ffffff",
  padding: "10px 13px",
  font: "700 12px var(--font-inter), 'Inter', system-ui, -apple-system, sans-serif",
  cursor: "pointer",
};

const GENERATE_EMPTY_STYLE: CSSProperties = {
  border: "1px solid #e5e1da",
  borderRadius: 8,
  padding: 14,
  background: "#fbfaf7",
  color: "#5b6c8a",
  font: "600 13px/1.45 var(--font-inter), 'Inter', system-ui, -apple-system, sans-serif",
};

const GENERATE_SUCCESS_STYLE: CSSProperties = {
  border: "1px solid #bbf7d0",
  borderRadius: 8,
  background: "#ecfdf3",
  color: "#166534",
  padding: 12,
  display: "grid",
  gap: 6,
  font: "600 13px/1.45 var(--font-inter), 'Inter', system-ui, -apple-system, sans-serif",
};

const GENERATE_ERROR_STYLE: CSSProperties = {
  border: "1px solid #fed7aa",
  borderRadius: 8,
  background: "#fff7ed",
  color: "#9a3412",
  padding: 12,
  display: "grid",
  gap: 6,
  font: "600 13px/1.45 var(--font-inter), 'Inter', system-ui, -apple-system, sans-serif",
};

const INLINE_REVIEW_LINK_STYLE: CSSProperties = {
  justifySelf: "start",
  color: "#14532d",
  font: "700 12px/1.35 var(--font-inter), 'Inter', system-ui, -apple-system, sans-serif",
};

const SHELL_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "196px minmax(720px, 1fr)",
  gap: 12,
  minHeight: 620,
};

const NAV_STYLE: CSSProperties = {
  border: "1px solid #e5e1da",
  borderRadius: 8,
  background: "#f0eee8",
  padding: 8,
  display: "grid",
  alignContent: "start",
  gap: 4,
};

const LIST_STYLE: CSSProperties = {
  border: "1px solid #e5e1da",
  borderRadius: 8,
  background: "#ffffff",
  padding: 10,
  display: "grid",
  alignContent: "start",
  gap: 8,
  overflow: "auto",
};

const TABLE_WRAP_STYLE: CSSProperties = {
  border: "1px solid #e5e1da",
  borderRadius: 8,
  background: "#ffffff",
  overflow: "auto",
};

const TABLE_STYLE: CSSProperties = {
  width: "100%",
  minWidth: 700,
  borderCollapse: "collapse",
  tableLayout: "fixed",
};

const TH_STYLE: CSSProperties = {
  height: 32,
  padding: "0 9px",
  textAlign: "left",
  background: "#fbfaf7",
  borderBottom: "1px solid #e5e1da",
  color: "#7a8495",
  font: "800 10px/1.2 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
};

const TD_STYLE: CSSProperties = {
  padding: "9px",
  borderBottom: "1px solid #f0ece4",
  color: "#344054",
  verticalAlign: "middle",
  font: "600 11.5px/1.32 var(--font-inter), 'Inter', system-ui, -apple-system, sans-serif",
};

const FILE_CELL_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "28px minmax(0, 1fr)",
  alignItems: "center",
  gap: 8,
  minWidth: 0,
};

const FILE_TEXT_STYLE: CSSProperties = {
  minWidth: 0,
  display: "grid",
  gap: 3,
};

const FILE_NAME_STYLE: CSSProperties = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  color: "#10172f",
};

const FILE_GLYPH_STYLE: CSSProperties = {
  width: 26,
  height: 26,
  borderRadius: 6,
  display: "grid",
  placeItems: "center",
  background: "#f1f5f9",
  color: "#475569",
  font: "800 9px/1 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
};

const EMPTY_STYLE: CSSProperties = {
  color: "#5b6c8a",
  font: "500 13px/1.5 var(--font-inter), 'Inter', system-ui, -apple-system, sans-serif",
};

const ITEM_META_STYLE: CSSProperties = {
  font: "500 12px/1.35 var(--font-inter), 'Inter', system-ui, -apple-system, sans-serif",
  color: "#5b6c8a",
};

const NEED_UPLOAD_STYLE: CSSProperties = {
  font: "700 11px/1 var(--font-inter), 'Inter', system-ui, -apple-system, sans-serif",
  color: "#1d4ed8",
  background: "#eef4ff",
  border: "1px solid #cfdcfa",
  borderRadius: 6,
  padding: "6px 11px",
  textDecoration: "none",
  whiteSpace: "nowrap",
  flexShrink: 0,
};

function needDotStyle(level: "required" | "recommended"): CSSProperties {
  return {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: level === "required" ? "#d08700" : "#cbd5e1",
    marginTop: 5,
    flexShrink: 0,
  };
}

const PREVIEW_COPY_STYLE: CSSProperties = {
  margin: "0 0 14px",
  font: "500 12.5px/1.45 var(--font-inter), 'Inter', system-ui, -apple-system, sans-serif",
  color: "#475569",
};

const ACTION_LINK_STYLE: CSSProperties = {
  display: "inline-flex",
  borderRadius: 6,
  background: "#10172f",
  color: "#ffffff",
  padding: "10px 13px",
  textDecoration: "none",
  font: "700 12px var(--font-inter), 'Inter', system-ui, -apple-system, sans-serif",
};

const DISABLED_ACTION_STYLE: CSSProperties = {
  display: "inline-flex",
  borderRadius: 6,
  border: "1px solid #d8d5ce",
  color: "#5b6c8a",
  padding: "10px 13px",
  font: "700 12px var(--font-inter), 'Inter', system-ui, -apple-system, sans-serif",
};
