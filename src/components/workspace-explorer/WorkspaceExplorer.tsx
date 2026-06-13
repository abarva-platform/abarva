"use client";

import { useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  WorkspaceGenerateCandidate,
  WorkspaceGenerateIntent,
  WorkspaceItem,
  WorkspaceItemKind,
} from "@/lib/workspace-explorer/types";

interface WorkspaceExplorerProps {
  title: string;
  eyebrow: string;
  backHref: string;
  items: WorkspaceItem[];
  mode?: "page" | "drawer";
  generateIntent?: WorkspaceGenerateIntent;
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

const KIND_ORDER: WorkspaceItemKind[] = [
  "input",
  "deliverable",
  "vendor_response",
  "evidence",
  "approval",
  "attachment",
];

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
  items,
  mode = "page",
  generateIntent,
}: WorkspaceExplorerProps) {
  const router = useRouter();
  const [activeKind, setActiveKind] = useState<WorkspaceItemKind | "all">(
    "all",
  );
  const [activeId, setActiveId] = useState(items[0]?.id ?? null);
  const [selectedGenerateId, setSelectedGenerateId] = useState(
    generateIntent?.candidates[0]?.id ?? "",
  );
  const [generatePending, setGeneratePending] = useState(false);
  const [generateResult, setGenerateResult] = useState<GenerateResult>({
    state: "idle",
  });
  const counts = useMemo(() => {
    const next = new Map<WorkspaceItemKind, number>();
    for (const kind of KIND_ORDER) next.set(kind, 0);
    for (const item of items)
      next.set(item.kind, (next.get(item.kind) ?? 0) + 1);
    return next;
  }, [items]);
  const filtered =
    activeKind === "all"
      ? items
      : items.filter((item) => item.kind === activeKind);
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
      const response = await fetch(selectedGenerateCandidate.generateHref, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
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
          Back to event
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

      <div style={SHELL_STYLE}>
        <nav aria-label="Workspace groups" style={NAV_STYLE}>
          <button
            type="button"
            onClick={() => setActiveKind("all")}
            style={navButtonStyle(activeKind === "all")}
          >
            <span>All items</span>
            <strong>{items.length}</strong>
          </button>
          {KIND_ORDER.map((kind) => {
            const count = counts.get(kind) ?? 0;
            if (count === 0) return null;
            return (
              <button
                key={kind}
                type="button"
                onClick={() => setActiveKind(kind)}
                style={navButtonStyle(activeKind === kind)}
              >
                <span>{KIND_LABELS[kind]}</span>
                <strong>{count}</strong>
              </button>
            );
          })}
        </nav>

        <div style={LIST_STYLE} aria-label="Workspace item list">
          {filtered.length === 0 ? (
            <div style={EMPTY_STYLE}>No workspace items in this group yet.</div>
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
