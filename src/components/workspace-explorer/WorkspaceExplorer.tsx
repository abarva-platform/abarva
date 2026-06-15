"use client";

import { useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  WorkspaceGenerateCandidate,
  WorkspaceGenerateIntent,
  WorkspaceItem,
  WorkspaceItemKind,
  WorkspaceProgression,
  WorkspaceProgressionNeed,
  WorkspaceUploadIntent,
} from "@/lib/workspace-explorer/types";
import {
  SOURCE_STAGE_ORDER,
  SOURCE_STAGE_LABELS,
  isSourceStageKey,
} from "@/lib/source/constants";
import { evidenceForStage } from "@/lib/source/canonical-specs";
import type { SourceStageKey } from "@/lib/source/types";

interface WorkspaceExplorerProps {
  title: string;
  eyebrow: string;
  backHref: string;
  backLabel?: string;
  items: WorkspaceItem[];
  mode?: "page" | "drawer";
  progression?: WorkspaceProgression;
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

const KIND_LABELS: Record<WorkspaceItemKind, string> = {
  input: "Inputs",
  deliverable: "Deliverables",
  approval: "Approvals",
  evidence: "Evidence",
  vendor_response: "Vendor responses",
  attachment: "Attachments",
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

function stateTone(state: WorkspaceItem["state"]): CSSProperties {
  if (state === "approved" || state === "usable") {
    return { color: "#166534", background: "#ecfdf3", borderColor: "#bbf7d0" };
  }
  if (state === "blocked" || state === "missing") {
    return { color: "#9a3412", background: "#fff7ed", borderColor: "#fed7aa" };
  }
  if (state === "review" || state === "draft") {
    return { color: "#854d0e", background: "#fffbeb", borderColor: "#fde68a" };
  }
  return { color: "#1d4ed8", background: "#eff6ff", borderColor: "#bfdbfe" };
}

export function WorkspaceExplorer({
  title,
  eyebrow,
  backHref,
  progression,
  backLabel = "Back to event",
  items,
  mode = "page",
  generateIntent,
  uploadIntent,
}: WorkspaceExplorerProps) {
  const router = useRouter();
  // By-step explorer: the left nav is the lifecycle stages as folders, ordered
  // by the canonical source lifecycle. Items carry stageKey; stage-less items
  // fall under "Event".
  const stageFolders = useMemo(() => {
    const present = new Set(items.map(stageOf));
    const ordered: string[] = [];
    for (const stage of SOURCE_STAGE_ORDER) {
      if (present.has(stage)) ordered.push(stage);
    }
    if (present.has("event")) ordered.push("event");
    for (const stage of present) {
      if (!ordered.includes(stage)) ordered.push(stage);
    }
    return ordered;
  }, [items]);
  const [activeStage, setActiveStage] = useState<string>(
    () => stageFolders[0] ?? "all",
  );
  const [activeId, setActiveId] = useState(items[0]?.id ?? null);
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
    for (const item of items)
      next.set(stageOf(item), (next.get(stageOf(item)) ?? 0) + 1);
    return next;
  }, [items]);
  const filtered =
    activeStage === "all"
      ? items
      : items.filter((item) => stageOf(item) === activeStage);
  // What this step still needs — the canonical evidence requirements for the
  // selected source stage, surfaced as "needed" rows (templates/uploads/gaps).
  const stageNeeds =
    activeStage !== "all" && isSourceStageKey(activeStage)
      ? evidenceForStage(activeStage as SourceStageKey)
      : [];
  const activeItem =
    filtered.find((item) => item.id === activeId) ??
    filtered[0] ??
    items[0] ??
    null;
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

      {progression ? <ProgressionPanel progression={progression} /> : null}

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
            <strong>{items.length}</strong>
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
              <strong>{counts.get(stage) ?? 0}</strong>
            </button>
          ))}
        </nav>

        <div style={LIST_STYLE} aria-label="Workspace item list">
          {stageNeeds.length > 0 ? (
            <div data-testid="workspace-step-needs">
              <div style={NEEDS_HEADING_STYLE}>Needed for this step</div>
              {stageNeeds.map((req) => (
                <div key={req.requirementId} style={NEED_ROW_STYLE}>
                  <span style={needDotStyle(req.level)} aria-hidden />
                  <span style={NEED_BODY_STYLE}>
                    <span style={NEED_NAME_STYLE}>{req.label}</span>
                    <span style={NEED_META_STYLE}>
                      {req.sourceLabel} · needs {req.minimumState}
                    </span>
                  </span>
                  <Link
                    href={`?intent=upload&stage=${activeStage}`}
                    style={NEED_UPLOAD_STYLE}
                  >
                    Upload
                  </Link>
                </div>
              ))}
              <div style={NEEDS_SUBHEAD_STYLE}>In this step</div>
            </div>
          ) : null}
          {filtered.length === 0 ? (
            <div style={EMPTY_STYLE}>Nothing loaded in this step yet.</div>
          ) : (
            filtered.map((item) => {
              const active = item.id === activeItem?.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  data-testid="workspace-explorer-item"
                  aria-current={active ? "true" : undefined}
                  onClick={() => setActiveId(item.id)}
                  style={itemButtonStyle(active)}
                >
                  <span style={ITEM_TOPLINE_STYLE}>
                    <span>{item.type}</span>
                    <span style={{ ...STATE_STYLE, ...stateTone(item.state) }}>
                      {item.state.replaceAll("_", " ")}
                    </span>
                  </span>
                  <strong style={ITEM_NAME_STYLE}>{item.name}</strong>
                  <span style={ITEM_META_STYLE}>
                    {item.stageKey ?? "event"} · v{item.version ?? "n/a"} ·{" "}
                    {formatDate(item.audit.updatedAt ?? item.audit.createdAt)}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <aside style={PREVIEW_STYLE} aria-label="Workspace item preview">
          {activeItem ? (
            <>
              <div style={EYEBROW_STYLE}>Preview</div>
              <h2 style={PREVIEW_TITLE_STYLE}>{activeItem.name}</h2>
              <p style={PREVIEW_COPY_STYLE}>
                {activeItem.description ?? "No description recorded yet."}
              </p>
              <dl style={DETAIL_GRID_STYLE}>
                <div>
                  <dt>Kind</dt>
                  <dd>{KIND_LABELS[activeItem.kind]}</dd>
                </div>
                <div>
                  <dt>Origin</dt>
                  <dd>{activeItem.origin}</dd>
                </div>
                <div>
                  <dt>Classification</dt>
                  <dd>{activeItem.classification ?? "Not classified"}</dd>
                </div>
                <div>
                  <dt>Source</dt>
                  <dd>{activeItem.sourceLabel ?? "Not recorded"}</dd>
                </div>
              </dl>
              <div style={LINEAGE_STYLE}>
                <strong>Lineage</strong>
                <span>
                  {activeItem.lineage.status === "recorded"
                    ? `${activeItem.lineage.cites.length} cited input(s) · ${activeItem.lineage.usedBy.length} used-by edge(s)`
                    : "Lineage not yet recorded"}
                </span>
              </div>
              {activeItem.href ? (
                <a href={activeItem.href} style={ACTION_LINK_STYLE}>
                  Open item
                </a>
              ) : (
                <span style={DISABLED_ACTION_STYLE}>No file preview yet</span>
              )}
            </>
          ) : (
            <div style={EMPTY_STYLE}>No workspace items recorded yet.</div>
          )}
        </aside>
      </div>
    </section>
  );
}

const NEED_KIND_META: Record<
  WorkspaceProgressionNeed["kind"],
  { label: string; cta: string; tone: CSSProperties }
> = {
  upload: {
    label: "Upload",
    cta: "Upload",
    tone: { color: "#1d4ed8", background: "#eff6ff", borderColor: "#bfdbfe" },
  },
  generate: {
    label: "Generate",
    cta: "Generate",
    tone: { color: "#1d4ed8", background: "#eff6ff", borderColor: "#bfdbfe" },
  },
  prepare: {
    label: "Prepare",
    cta: "Prepare",
    tone: { color: "#854d0e", background: "#fffbeb", borderColor: "#fde68a" },
  },
  send: {
    label: "Send",
    cta: "Send",
    tone: { color: "#854d0e", background: "#fffbeb", borderColor: "#fde68a" },
  },
  approve: {
    label: "Approve",
    cta: "Approve",
    tone: { color: "#166534", background: "#ecfdf3", borderColor: "#bbf7d0" },
  },
  advance: {
    label: "Advance",
    cta: "Advance",
    tone: { color: "#166534", background: "#ecfdf3", borderColor: "#bbf7d0" },
  },
};

function ProgressionPanel({
  progression,
}: {
  progression: WorkspaceProgression;
}) {
  if (progression.needs.length === 0) return null;
  return (
    <section
      data-testid="workspace-progression"
      aria-label="What is needed to advance"
      style={PROGRESSION_PANEL_STYLE}
    >
      <div style={PROGRESSION_HEAD_STYLE}>
        <div>
          <div style={EYEBROW_STYLE}>Next move</div>
          <h2 style={GENERATE_TITLE_STYLE}>
            {progression.allClear
              ? "Ready to advance"
              : "What's needed to advance"}
          </h2>
        </div>
        <span style={PROGRESSION_SUMMARY_STYLE}>{progression.gateSummary}</span>
      </div>
      <ol style={PROGRESSION_LIST_STYLE}>
        {progression.needs.map((need, index) => (
          <ProgressionRow
            key={need.id}
            need={need}
            primary={index === 0 && !progression.allClear}
          />
        ))}
      </ol>
    </section>
  );
}

function ProgressionRow({
  need,
  primary,
}: {
  need: WorkspaceProgressionNeed;
  primary: boolean;
}) {
  const meta = NEED_KIND_META[need.kind];
  return (
    <li
      data-testid={`progression-need-${need.kind}`}
      style={primary ? PROGRESSION_ROW_PRIMARY_STYLE : PROGRESSION_ROW_STYLE}
    >
      <span style={{ ...PROGRESSION_CHIP_STYLE, ...meta.tone }}>
        {meta.label}
      </span>
      <div style={PROGRESSION_BODY_STYLE}>
        <span style={PROGRESSION_LABEL_STYLE}>
          {need.label}
          {need.optional ? " (recommended)" : ""}
        </span>
        {need.detail ? (
          <span style={PROGRESSION_DETAIL_STYLE}>{need.detail}</span>
        ) : null}
        {need.blocked && need.blockedReason ? (
          <span style={PROGRESSION_BLOCKED_STYLE}>{need.blockedReason}</span>
        ) : null}
      </div>
      {need.href ? (
        <Link href={need.href} style={PROGRESSION_ACTION_STYLE}>
          {meta.cta}
        </Link>
      ) : (
        <span style={PROGRESSION_DISABLED_STYLE}>{meta.cta}</span>
      )}
    </li>
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

function navButtonStyle(active: boolean): CSSProperties {
  return {
    border: "none",
    borderRadius: 6,
    padding: "10px 12px",
    background: active ? "#ffffff" : "transparent",
    color: active ? "#0f172a" : "#64748b",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    font: "600 13px DM Sans, Arial, sans-serif",
    cursor: "pointer",
    boxShadow: active ? "0 0 0 1px rgba(15,23,42,0.08)" : "none",
  };
}

function itemButtonStyle(active: boolean): CSSProperties {
  return {
    width: "100%",
    textAlign: "left",
    border: `1px solid ${active ? "#1d4ed8" : "#e5e7eb"}`,
    borderRadius: 8,
    background: active ? "#f8fbff" : "#ffffff",
    padding: 14,
    cursor: "pointer",
    display: "grid",
    gap: 8,
  };
}

const PAGE_WRAP_STYLE: CSSProperties = {
  background: "#f8f7f4",
  minHeight: "100%",
  padding: "24px",
  color: "#111827",
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
  font: "700 10px/1.2 ui-monospace, SFMono-Regular, Menlo, monospace",
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "#64748b",
};

const TITLE_STYLE: CSSProperties = {
  margin: "6px 0 0",
  font: "700 30px/1.1 Georgia, serif",
  letterSpacing: 0,
  color: "#10172f",
};

const BACK_LINK_STYLE: CSSProperties = {
  border: "1px solid #d8d5ce",
  borderRadius: 6,
  padding: "9px 12px",
  color: "#111827",
  textDecoration: "none",
  font: "700 12px DM Sans, Arial, sans-serif",
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
  font: "700 22px/1.15 Georgia, serif",
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
  font: "700 11px/1.2 ui-monospace, SFMono-Regular, Menlo, monospace",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "#64748b",
};

const GENERATE_SELECT_STYLE: CSSProperties = {
  border: "1px solid #d8d5ce",
  borderRadius: 6,
  padding: "10px 12px",
  background: "#fbfaf7",
  color: "#111827",
  font: "600 13px/1.35 DM Sans, Arial, sans-serif",
};

const FILE_INPUT_STYLE: CSSProperties = {
  border: "1px solid #d8d5ce",
  borderRadius: 6,
  padding: "9px 10px",
  background: "#ffffff",
  color: "#111827",
  font: "600 13px/1.35 DM Sans, Arial, sans-serif",
};

const GENERATE_DESCRIPTION_STYLE: CSSProperties = {
  margin: 0,
  font: "500 13px/1.45 DM Sans, Arial, sans-serif",
  color: "#475569",
};

const ACTION_BUTTON_STYLE: CSSProperties = {
  justifySelf: "start",
  border: "none",
  borderRadius: 6,
  background: "#10172f",
  color: "#ffffff",
  padding: "10px 13px",
  font: "700 12px DM Sans, Arial, sans-serif",
  cursor: "pointer",
};

const GENERATE_EMPTY_STYLE: CSSProperties = {
  border: "1px solid #e5e1da",
  borderRadius: 8,
  padding: 14,
  background: "#fbfaf7",
  color: "#64748b",
  font: "600 13px/1.45 DM Sans, Arial, sans-serif",
};

const GENERATE_SUCCESS_STYLE: CSSProperties = {
  border: "1px solid #bbf7d0",
  borderRadius: 8,
  background: "#ecfdf3",
  color: "#166534",
  padding: 12,
  display: "grid",
  gap: 6,
  font: "600 13px/1.45 DM Sans, Arial, sans-serif",
};

const GENERATE_ERROR_STYLE: CSSProperties = {
  border: "1px solid #fed7aa",
  borderRadius: 8,
  background: "#fff7ed",
  color: "#9a3412",
  padding: 12,
  display: "grid",
  gap: 6,
  font: "600 13px/1.45 DM Sans, Arial, sans-serif",
};

const INLINE_REVIEW_LINK_STYLE: CSSProperties = {
  justifySelf: "start",
  color: "#14532d",
  font: "700 12px/1.35 DM Sans, Arial, sans-serif",
};

const SHELL_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "220px minmax(360px, 0.95fr) minmax(360px, 1.05fr)",
  gap: 14,
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
  background: "#fbfaf7",
  padding: 12,
  display: "grid",
  alignContent: "start",
  gap: 10,
  overflow: "auto",
};

const PREVIEW_STYLE: CSSProperties = {
  border: "1px solid #e5e1da",
  borderRadius: 8,
  background: "#ffffff",
  padding: 22,
  overflow: "auto",
};

const EMPTY_STYLE: CSSProperties = {
  color: "#64748b",
  font: "500 13px/1.5 DM Sans, Arial, sans-serif",
};

const ITEM_TOPLINE_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  font: "700 10px/1.2 ui-monospace, SFMono-Regular, Menlo, monospace",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "#64748b",
};

const STATE_STYLE: CSSProperties = {
  border: "1px solid",
  borderRadius: 999,
  padding: "3px 7px",
  letterSpacing: "0.08em",
};

const ITEM_NAME_STYLE: CSSProperties = {
  font: "700 14px/1.25 DM Sans, Arial, sans-serif",
  color: "#111827",
};

const ITEM_META_STYLE: CSSProperties = {
  font: "500 12px/1.35 DM Sans, Arial, sans-serif",
  color: "#64748b",
};

const NEEDS_HEADING_STYLE: CSSProperties = {
  font: "700 10px/1 DM Sans, Arial, sans-serif",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "#94a3b8",
  padding: "2px 2px 10px",
};

const NEEDS_SUBHEAD_STYLE: CSSProperties = {
  ...NEEDS_HEADING_STYLE,
  padding: "16px 2px 8px",
  borderTop: "1px solid #ece8e1",
  marginTop: 12,
};

const NEED_ROW_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 10,
  padding: "9px 2px",
  borderBottom: "1px solid #f0ece4",
};

const NEED_BODY_STYLE: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
  flex: 1,
  minWidth: 0,
};

const NEED_NAME_STYLE: CSSProperties = {
  font: "600 13px/1.3 DM Sans, Arial, sans-serif",
  color: "#111827",
};

const NEED_META_STYLE: CSSProperties = {
  font: "500 11.5px/1.35 DM Sans, Arial, sans-serif",
  color: "#64748b",
};

const NEED_UPLOAD_STYLE: CSSProperties = {
  font: "700 11px/1 DM Sans, Arial, sans-serif",
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

const PREVIEW_TITLE_STYLE: CSSProperties = {
  margin: "8px 0 8px",
  font: "700 28px/1.15 Georgia, serif",
  letterSpacing: 0,
  color: "#10172f",
};

const PREVIEW_COPY_STYLE: CSSProperties = {
  margin: "0 0 18px",
  font: "500 14px/1.55 DM Sans, Arial, sans-serif",
  color: "#475569",
};

const DETAIL_GRID_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 12,
  margin: "0 0 18px",
};

const LINEAGE_STYLE: CSSProperties = {
  borderTop: "1px solid #e5e7eb",
  borderBottom: "1px solid #e5e7eb",
  padding: "14px 0",
  marginBottom: 18,
  display: "grid",
  gap: 4,
  font: "500 13px/1.45 DM Sans, Arial, sans-serif",
  color: "#475569",
};

const ACTION_LINK_STYLE: CSSProperties = {
  display: "inline-flex",
  borderRadius: 6,
  background: "#10172f",
  color: "#ffffff",
  padding: "10px 13px",
  textDecoration: "none",
  font: "700 12px DM Sans, Arial, sans-serif",
};

const DISABLED_ACTION_STYLE: CSSProperties = {
  display: "inline-flex",
  borderRadius: 6,
  border: "1px solid #d8d5ce",
  color: "#64748b",
  padding: "10px 13px",
  font: "700 12px DM Sans, Arial, sans-serif",
};

const PROGRESSION_PANEL_STYLE: CSSProperties = {
  border: "1px solid #e5e1da",
  borderRadius: 12,
  background: "#ffffff",
  padding: 20,
  marginBottom: 16,
  display: "grid",
  gap: 14,
};

const PROGRESSION_HEAD_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  gap: 16,
};

const PROGRESSION_SUMMARY_STYLE: CSSProperties = {
  font: "700 12px DM Sans, Arial, sans-serif",
  color: "#475569",
  background: "#f1f5f9",
  borderRadius: 999,
  padding: "6px 12px",
  whiteSpace: "nowrap",
};

const PROGRESSION_LIST_STYLE: CSSProperties = {
  listStyle: "none",
  margin: 0,
  padding: 0,
  display: "grid",
  gap: 10,
};

const PROGRESSION_ROW_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  border: "1px solid #ece8e1",
  borderRadius: 10,
  background: "#fbfaf7",
  padding: "12px 14px",
};

const PROGRESSION_ROW_PRIMARY_STYLE: CSSProperties = {
  ...PROGRESSION_ROW_STYLE,
  background: "#f5f9ff",
  borderColor: "#bfdbfe",
  boxShadow: "0 0 0 3px rgba(37,99,235,0.10)",
};

const PROGRESSION_CHIP_STYLE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: 999,
  border: "1px solid",
  padding: "5px 11px",
  font: "700 11px DM Sans, Arial, sans-serif",
  letterSpacing: "0.02em",
  whiteSpace: "nowrap",
};

const PROGRESSION_BODY_STYLE: CSSProperties = {
  display: "grid",
  gap: 3,
  flex: 1,
  minWidth: 0,
};

const PROGRESSION_LABEL_STYLE: CSSProperties = {
  font: "600 14px DM Sans, Arial, sans-serif",
  color: "#0f172a",
};

const PROGRESSION_DETAIL_STYLE: CSSProperties = {
  font: "400 12.5px DM Sans, Arial, sans-serif",
  color: "#64748b",
};

const PROGRESSION_BLOCKED_STYLE: CSSProperties = {
  font: "500 12px DM Sans, Arial, sans-serif",
  color: "#9a3412",
};

const PROGRESSION_ACTION_STYLE: CSSProperties = {
  display: "inline-flex",
  borderRadius: 6,
  background: "#10172f",
  color: "#ffffff",
  padding: "9px 14px",
  textDecoration: "none",
  font: "700 12px DM Sans, Arial, sans-serif",
  whiteSpace: "nowrap",
};

const PROGRESSION_DISABLED_STYLE: CSSProperties = {
  display: "inline-flex",
  borderRadius: 6,
  border: "1px solid #d8d5ce",
  color: "#94a3b8",
  padding: "9px 14px",
  font: "700 12px DM Sans, Arial, sans-serif",
  whiteSpace: "nowrap",
};
