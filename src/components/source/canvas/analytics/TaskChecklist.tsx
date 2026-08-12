"use client";

import {
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { ANALYTICS, taskVerb } from "./analytics-tokens";
import {
  evidenceRequirementIdForTask,
  factTemplateCodeForTask,
  FACT_TEMPLATE_BY_TASK_ID,
} from "@/lib/source/facts/task-evidence-requirements";
import { requirementIdForFactTemplate } from "@/lib/source/facts/template-requirements";
import {
  CANVAS_UPLOAD_ACCEPT,
  formatUploadSize,
  ingestSourceCanvasFacts,
  isAcceptedCanvasUpload,
  uploadSourceCanvasArtifact,
  type IngestFactsResult,
  type UploadedArtifactResult,
} from "./upload-artifact";
import type {
  StageTaskView,
  TaskFileView,
  TaskReviewRowView,
  TaskState,
  TaskTemplateView,
  TaskType,
} from "./view-model";

export { FACT_TEMPLATE_BY_TASK_ID, factTemplateCodeForTask };

interface TaskChecklistProps {
  tasks: readonly StageTaskView[];
  /**
   * The Source event id this checklist belongs to. When present, `provide`
   * dropzones become real (a file uploads to the governed artifacts route and
   * persists to Azure Blob + the artifact registry). Absent → the dropzone is
   * presentational (sample/preview mode), never a fake "uploaded" state.
   */
  eventId?: string;
  /** Canonical stage key, forwarded to the upload route so the artifact scopes right. */
  stageKey?: string;
}

const TYPE_LABEL: Record<TaskType, string> = {
  provide: "Provide",
  confirm: "Confirm",
  decide: "Decide",
};

/**
 * Beat 2 — "Your inputs & feedback." The stage task checklist. Every task is
 * typed provide / confirm / decide, carries its "where this comes from:
 * owner · source" line, a concrete state, and its complete affordance. One row
 * per task; the form reveals on click (density contract: "every click is a
 * decision").
 */
export function TaskChecklist({
  tasks,
  eventId,
  stageKey,
}: TaskChecklistProps) {
  // Track local "just completed" so the demo feels responsive without a backend.
  const [openId, setOpenId] = useState<string | null>(() => {
    // Open the first genuinely-incomplete task — one that is neither marked done
    // by the server nor complete from persisted evidence.
    const firstOpen = tasks.find(
      (t) => t.state !== "done" && t.evidenceComplete !== true,
    );
    return firstOpen?.id ?? null;
  });
  // Seed the in-session "done" set from server-derived persisted evidence so a
  // reloaded / tab-switched page reflects real uploaded facts/artifacts — not just
  // this session's just-uploaded flag. A task is seeded only when its evidence
  // genuinely reached a usable, persisted state (`evidenceComplete`); the honest
  // "done = evidence, never a fake done" rule is preserved. The just-uploaded path
  // still adds to this set live via onComplete.
  const [locallyDone, setLocallyDone] = useState<ReadonlySet<string>>(
    () =>
      new Set(
        tasks.filter((t) => t.evidenceComplete === true).map((t) => t.id),
      ),
  );

  const done = tasks.filter(
    (t) => t.state === "done" || locallyDone.has(t.id),
  ).length;

  return (
    <div data-testid="task-checklist">
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
          margin: "0 0 10px 2px",
        }}
      >
        <span
          style={{
            fontSize: 11,
            letterSpacing: 0.5,
            textTransform: "uppercase",
            color: ANALYTICS.FAINT,
            fontWeight: 600,
          }}
        >
          Your inputs &amp; feedback
        </span>
        <span style={{ fontSize: 12, color: ANALYTICS.MUTED, fontWeight: 600 }}>
          {done} / {tasks.length} complete
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {tasks.map((task) => {
          const isDone = task.state === "done" || locallyDone.has(task.id);
          const isOpen = openId === task.id;
          return (
            <TaskRow
              key={task.id}
              task={task}
              isDone={isDone}
              isOpen={isOpen}
              eventId={eventId}
              stageKey={stageKey}
              onToggle={() => setOpenId(isOpen ? null : task.id)}
              onComplete={() =>
                setLocallyDone((prev) => new Set(prev).add(task.id))
              }
            />
          );
        })}
      </div>
    </div>
  );
}

async function completeTaskEvidenceAnswer(args: {
  eventId: string;
  requirementId: string;
  stageKey: string;
  answer: string;
}): Promise<void> {
  const href = `/api/v1/source/${encodeURIComponent(
    args.eventId,
  )}/evidence/${encodeURIComponent(args.requirementId)}/answer`;

  let response: Response;
  try {
    response = await fetch(href, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answer: args.answer,
        stage: args.stageKey,
      }),
    });
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `Checklist save failed: ${error.message}`
        : "Checklist save failed before reaching the server.",
    );
  }

  const payload = (await response.json().catch(() => null)) as {
    ok?: boolean;
    detail?: string;
    error?: string;
  } | null;

  if (!response.ok || !payload?.ok) {
    throw new Error(
      payload?.detail ??
        payload?.error ??
        `Checklist save failed with HTTP ${response.status}.`,
    );
  }
}

interface TaskRowProps {
  task: StageTaskView;
  isDone: boolean;
  isOpen: boolean;
  eventId?: string;
  stageKey?: string;
  onToggle: () => void;
  onComplete: () => void;
}

function TaskRow({
  task,
  isDone,
  isOpen,
  eventId,
  stageKey,
  onToggle,
  onComplete,
}: TaskRowProps) {
  const router = useRouter();
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionError, setCompletionError] = useState<string | null>(null);
  const effectiveState: TaskState = isDone ? "done" : "todo";
  const factTemplateCode = factTemplateCodeForTask(task);
  const evidenceRequirementId = evidenceRequirementIdForTask(task);
  const canPersistAnswer =
    Boolean(eventId && stageKey && evidenceRequirementId) &&
    task.type !== "provide";
  const rowStyle: CSSProperties = {
    border: `1px solid ${isOpen ? ANALYTICS.LINE_STRONG : ANALYTICS.LINE}`,
    borderRadius: ANALYTICS.RADIUS,
    background: ANALYTICS.CARD,
    overflow: "hidden",
  };

  return (
    <div style={rowStyle}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr auto",
          gap: 13,
          alignItems: "center",
          width: "100%",
          padding: "13px 15px",
          border: "none",
          background: "none",
          textAlign: "left",
          cursor: "pointer",
          fontFamily: ANALYTICS.SANS,
        }}
      >
        <StatusDot done={isDone} type={task.type} />
        <span style={{ minWidth: 0 }}>
          <span
            style={{
              display: "block",
              fontSize: 14.5,
              fontWeight: 600,
              color: ANALYTICS.INK,
            }}
          >
            {task.title}
          </span>
          <span
            style={{
              display: "block",
              fontSize: 12,
              color: ANALYTICS.MUTED,
              marginTop: 3,
            }}
          >
            {task.subtitle}
          </span>
        </span>
        <TypeTag type={task.type} done={isDone} />
      </button>

      {isOpen ? (
        <div
          style={{
            padding: "0 15px 15px 15px",
            borderTop: `1px solid ${ANALYTICS.LINE_SOFT}`,
          }}
        >
          <p
            style={{
              fontSize: 13,
              color: ANALYTICS.INK_2,
              lineHeight: 1.55,
              margin: "13px 0",
            }}
          >
            {task.guide}
          </p>

          {task.rows ? <ReviewRows rows={task.rows} /> : null}
          {task.type === "provide" ? (
            <EvidenceRequestPanel
              task={task}
              isDone={isDone}
              eventId={eventId}
              factTemplateCode={factTemplateCode}
            >
              {task.file ? (
                <FileChip file={task.file} />
              ) : (
                <TaskProvideUpload
                  signed={/letter|commit/i.test(task.title)}
                  eventId={eventId}
                  stageKey={stageKey}
                  factTemplateCode={factTemplateCode}
                  onUploaded={onComplete}
                />
              )}
            </EvidenceRequestPanel>
          ) : (
            <>
              {task.template ? <TemplateChip template={task.template} /> : null}
              {factTemplateCode ? (
                <TemplateDownloadLink
                  eventId={eventId}
                  factTemplateCode={factTemplateCode}
                />
              ) : null}
              {task.file ? <FileChip file={task.file} /> : null}
            </>
          )}

          {task.provenance ? (
            <div
              style={{
                fontSize: 12,
                color: ANALYTICS.MUTED,
                marginTop: 12,
                lineHeight: 1.5,
              }}
            >
              Where this comes from:{" "}
              <b style={{ color: ANALYTICS.INK_2 }}>{task.provenance.owner}</b>{" "}
              · {task.provenance.source}
            </div>
          ) : null}

          <div style={{ marginTop: 16 }}>
            {completionError ? (
              <div
                role="alert"
                style={{
                  marginBottom: 10,
                  padding: "9px 12px",
                  borderRadius: ANALYTICS.RADIUS_SM,
                  border: `1px solid ${ANALYTICS.AMBER}`,
                  background: "rgba(180,120,10,0.06)",
                  color: ANALYTICS.AMBER_TEXT,
                  fontSize: 12.5,
                  lineHeight: 1.45,
                }}
              >
                {completionError}
              </div>
            ) : null}

            {effectiveState === "done" ? (
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: ANALYTICS.GREEN,
                }}
              >
                ✓ Done
              </span>
            ) : (
              <button
                type="button"
                onClick={async () => {
                  if (!canPersistAnswer) {
                    onComplete();
                    return;
                  }
                  setIsCompleting(true);
                  setCompletionError(null);
                  try {
                    await completeTaskEvidenceAnswer({
                      eventId: eventId!,
                      requirementId: evidenceRequirementId!,
                      stageKey: stageKey!,
                      answer: `${task.title}: ${task.guide}`,
                    });
                    onComplete();
                    router.refresh();
                  } catch (error) {
                    setCompletionError(
                      error instanceof Error
                        ? error.message
                        : "Could not save this checklist action.",
                    );
                  } finally {
                    setIsCompleting(false);
                  }
                }}
                disabled={isCompleting}
                style={{
                  border: "none",
                  borderRadius: ANALYTICS.RADIUS_SM,
                  background: isCompleting ? ANALYTICS.FAINT : ANALYTICS.INK,
                  color: "#fff",
                  fontFamily: ANALYTICS.SANS,
                  fontSize: 13,
                  fontWeight: 600,
                  padding: "9px 16px",
                  cursor: isCompleting ? "wait" : "pointer",
                }}
              >
                {isCompleting ? "Saving…" : task.cta}
              </button>
            )}
            <span
              style={{
                marginLeft: 12,
                fontSize: 11.5,
                color: ANALYTICS.FAINT,
              }}
            >
              {taskVerb(task.type)}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function EvidenceRequestPanel({
  task,
  isDone,
  eventId,
  factTemplateCode,
  children,
}: {
  task: StageTaskView;
  isDone: boolean;
  eventId?: string;
  factTemplateCode?: string;
  children: ReactNode;
}) {
  const signed = /letter|commit/i.test(task.title);
  const format = signed ? "Signed PDF" : "CSV or XLSX";
  const templateName = task.template?.name ?? `${task.title} file`;
  const source = task.provenance?.source ?? "Client source extract or template";
  const owner = task.provenance?.owner ?? "Stage owner";
  const parseTarget = factTemplateCode
    ? `Parse with ${factTemplateCode}; write governed Source facts`
    : "Store file in Source artifacts; no structured fact parser for this task yet";

  return (
    <section
      aria-label="Evidence request"
      data-testid="task-evidence-request"
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) minmax(260px, 0.42fr)",
        gap: 14,
        marginTop: 10,
        padding: 13,
        border: `1px solid ${ANALYTICS.LINE_SOFT}`,
        borderRadius: ANALYTICS.RADIUS,
        background: ANALYTICS.SOFT,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 10,
          }}
        >
          <span
            style={{
              fontFamily: ANALYTICS.MONO,
              fontSize: 10,
              letterSpacing: 0.9,
              textTransform: "uppercase",
              color: ANALYTICS.BLUE,
              fontWeight: 800,
            }}
          >
            Evidence request
          </span>
          <span
            style={{
              fontFamily: ANALYTICS.MONO,
              fontSize: 10,
              letterSpacing: 0.5,
              textTransform: "uppercase",
              fontWeight: 800,
              color: isDone ? ANALYTICS.GREEN_TEXT : ANALYTICS.AMBER_TEXT,
              background: isDone ? ANALYTICS.GREEN_TINT : ANALYTICS.AMBER_TINT,
              borderRadius: 999,
              padding: "4px 8px",
              whiteSpace: "nowrap",
            }}
          >
            {isDone ? "Accepted" : "Action needed"}
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 8,
          }}
        >
          <EvidenceRequestCell label="What to load" value={templateName} />
          <EvidenceRequestCell label="Source system" value={source} />
          <EvidenceRequestCell label="Owner" value={owner} />
          <EvidenceRequestCell label="Format" value={format} />
          <EvidenceRequestCell
            label="Parse/writeback"
            value={parseTarget}
            wide
          />
        </div>

        {factTemplateCode ? (
          <div style={{ marginTop: 10 }}>
            <TemplateDownloadLink
              eventId={eventId}
              factTemplateCode={factTemplateCode}
            />
          </div>
        ) : null}
      </div>

      <div
        style={{
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <span
          style={{
            fontFamily: ANALYTICS.MONO,
            fontSize: 10,
            letterSpacing: 0.9,
            textTransform: "uppercase",
            color: ANALYTICS.FAINT,
            fontWeight: 800,
          }}
        >
          Upload status
        </span>
        {children}
      </div>
    </section>
  );
}

function EvidenceRequestCell({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div
      style={{
        gridColumn: wide ? "1 / -1" : undefined,
        padding: "8px 9px",
        border: `1px solid ${ANALYTICS.LINE_SOFT}`,
        borderRadius: ANALYTICS.RADIUS_SM,
        background: ANALYTICS.CARD,
        minWidth: 0,
      }}
    >
      <span
        style={{
          display: "block",
          marginBottom: 3,
          fontFamily: ANALYTICS.MONO,
          fontSize: 9,
          letterSpacing: 0.5,
          textTransform: "uppercase",
          color: ANALYTICS.FAINT,
          fontWeight: 800,
        }}
      >
        {label}
      </span>
      <span
        style={{
          display: "block",
          fontSize: 12.5,
          lineHeight: 1.35,
          color: ANALYTICS.INK_2,
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function StatusDot({ done, type }: { done: boolean; type: TaskType }) {
  if (done) {
    return (
      <span
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: ANALYTICS.GREEN,
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        ✓
      </span>
    );
  }
  const hue =
    type === "provide"
      ? ANALYTICS.BLUE
      : type === "confirm"
        ? ANALYTICS.GREEN
        : ANALYTICS.AMBER;
  return (
    <span
      style={{
        width: 20,
        height: 20,
        borderRadius: "50%",
        border: `1.5px solid ${hue}`,
        background: ANALYTICS.CARD,
        flexShrink: 0,
      }}
    />
  );
}

function TypeTag({ type, done }: { type: TaskType; done: boolean }) {
  return (
    <span
      style={{
        fontFamily: ANALYTICS.MONO,
        fontSize: 9,
        letterSpacing: 0.6,
        textTransform: "uppercase",
        fontWeight: 700,
        padding: "3px 8px",
        borderRadius: 5,
        background: done ? "rgba(10,10,11,0.05)" : "rgba(10,10,11,0.06)",
        color: done ? ANALYTICS.FAINT : ANALYTICS.MUTED,
        whiteSpace: "nowrap",
      }}
    >
      {TYPE_LABEL[type]}
    </span>
  );
}

function ReviewRows({ rows }: { rows: readonly TaskReviewRowView[] }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        border: `1px solid ${ANALYTICS.LINE_SOFT}`,
        borderRadius: ANALYTICS.RADIUS_SM,
        overflow: "hidden",
      }}
    >
      {rows.map((row, i) => (
        <div
          key={`${row.key}-${i}`}
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            padding: "9px 12px",
            borderTop: i === 0 ? "none" : `1px solid ${ANALYTICS.LINE_SOFT}`,
            fontSize: 13,
          }}
        >
          <span style={{ color: ANALYTICS.MUTED }}>{row.key}</span>
          <span
            style={{
              fontWeight: 600,
              color: row.flag ? ANALYTICS.AMBER_TEXT : ANALYTICS.INK,
              textAlign: "right",
            }}
          >
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function FileChip({
  file,
  onRemove,
}: {
  file: TaskFileView;
  onRemove?: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "11px 13px",
        border: `1px solid ${ANALYTICS.LINE_SOFT}`,
        borderRadius: ANALYTICS.RADIUS_SM,
        background: ANALYTICS.SOFT,
      }}
    >
      <span
        style={{
          fontFamily: ANALYTICS.MONO,
          fontSize: 10,
          fontWeight: 700,
          padding: "6px 8px",
          borderRadius: 5,
          background: ANALYTICS.CARD,
          border: `1px solid ${ANALYTICS.LINE}`,
          color: ANALYTICS.MUTED,
        }}
      >
        {file.format}
      </span>
      <span style={{ minWidth: 0, flex: 1 }}>
        <span
          style={{
            display: "block",
            fontSize: 13,
            fontWeight: 600,
            color: ANALYTICS.INK,
          }}
        >
          {file.name}
        </span>
        <span
          style={{ display: "block", fontSize: 11.5, color: ANALYTICS.MUTED }}
        >
          {file.meta}
        </span>
      </span>
      {onRemove ? (
        <button
          type="button"
          aria-label={`Remove ${file.name}`}
          onClick={onRemove}
          style={{
            border: "none",
            background: "none",
            cursor: "pointer",
            color: ANALYTICS.MUTED,
            fontSize: 16,
            lineHeight: 1,
            padding: 4,
            flexShrink: 0,
          }}
        >
          ✕
        </button>
      ) : null}
    </div>
  );
}

function TemplateChip({ template }: { template: TaskTemplateView }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "11px 13px",
        border: `1px solid ${ANALYTICS.LINE_SOFT}`,
        borderRadius: ANALYTICS.RADIUS_SM,
        background: ANALYTICS.CARD,
        marginBottom: 8,
      }}
    >
      <span
        style={{
          fontFamily: ANALYTICS.MONO,
          fontSize: 10,
          fontWeight: 700,
          padding: "6px 8px",
          borderRadius: 5,
          background: ANALYTICS.BLUE_TINT,
          color: ANALYTICS.BLUE,
        }}
      >
        {template.format}
      </span>
      <span style={{ minWidth: 0, flex: 1 }}>
        <span
          style={{
            display: "block",
            fontSize: 13,
            fontWeight: 600,
            color: ANALYTICS.INK,
          }}
        >
          {template.name}
        </span>
        <span
          style={{ display: "block", fontSize: 11.5, color: ANALYTICS.MUTED }}
        >
          {template.meta}
        </span>
      </span>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: ANALYTICS.BLUE }}>
        Download blank →
      </span>
    </div>
  );
}

export function TemplateDownloadLink({
  eventId,
  factTemplateCode,
}: {
  eventId?: string;
  factTemplateCode: string;
}) {
  const requirementId = requirementIdForFactTemplate(factTemplateCode);
  if (!eventId || !requirementId) return null;
  return (
    <a
      href={`/api/v1/source/${encodeURIComponent(eventId)}/evidence/${encodeURIComponent(requirementId)}/template`}
      download
      data-testid="task-template-download"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 8,
        color: ANALYTICS.BLUE,
        fontFamily: ANALYTICS.SANS,
        fontSize: 12.5,
        fontWeight: 700,
        textDecoration: "none",
      }}
    >
      Download CSV/XLSX template
    </a>
  );
}

/**
 * The honest fact-ingest receipt shown under the uploaded-file card: how many
 * typed facts were written, plus any unmapped columns / rejected rows. Zero
 * facts written is stated plainly (amber), never dressed as success. This is what
 * tells the user the ✦ Intelligence insight just flipped LIVE.
 */
function FactResultChip({ ingest }: { ingest: IngestFactsResult }) {
  const wrote = ingest.factsWritten > 0;
  const parts: string[] = [];
  if (ingest.unmappedColumns.length > 0) {
    parts.push(
      `${ingest.unmappedColumns.length} column${
        ingest.unmappedColumns.length === 1 ? "" : "s"
      } unmapped`,
    );
  }
  if (ingest.rejectedRowCount > 0) {
    parts.push(
      `${ingest.rejectedRowCount} cell${
        ingest.rejectedRowCount === 1 ? "" : "s"
      } rejected`,
    );
  }
  return (
    <div
      role="status"
      data-testid="fact-ingest-result"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 9,
        marginTop: 8,
        padding: "9px 12px",
        borderRadius: ANALYTICS.RADIUS_SM,
        border: `1px solid ${ANALYTICS.LINE_SOFT}`,
        background: wrote ? "rgba(20,140,90,0.06)" : "rgba(180,120,10,0.06)",
        fontSize: 12.5,
        fontFamily: ANALYTICS.SANS,
      }}
    >
      <span style={{ color: wrote ? ANALYTICS.GREEN : ANALYTICS.AMBER_TEXT }}>
        {wrote ? "✦" : "△"}
      </span>
      <span style={{ color: ANALYTICS.INK_2 }}>
        <b style={{ color: ANALYTICS.INK }}>
          {ingest.factsWritten} fact{ingest.factsWritten === 1 ? "" : "s"}{" "}
          written
        </b>
        {wrote ? " — Intelligence updated from your file" : " — nothing mapped"}
        {parts.length > 0 ? ` (${parts.join(" · ")})` : ""}
      </span>
    </div>
  );
}

type DropZoneStatus =
  | { phase: "idle" }
  | { phase: "uploading"; name: string }
  | {
      phase: "uploaded";
      result: UploadedArtifactResult;
      /** Present when the file was also parsed into typed facts. */
      ingest?: IngestFactsResult;
    }
  | { phase: "error"; message: string };

interface DropZoneProps {
  signed: boolean;
  eventId?: string;
  stageKey?: string;
  /**
   * When set, an uploaded CSV/XLSX is ALSO parsed into typed facts via
   * `/facts/ingest-file` using this template code, flipping the step insight
   * LIVE. Absent → registry-only upload (the current behavior).
   */
  factTemplateCode?: string;
  onUploaded?: () => void;
}

/**
 * The redesigned canvas dropzone — now a REAL uploader. When `eventId` is
 * present, selecting or dropping a file POSTs it (multipart) to the governed
 * Source artifacts route, which persists it to Azure Blob + the artifact
 * registry and returns the persisted metadata. The uploaded-file card reflects
 * a real persisted file; upload failure shows an error, never a fake success.
 *
 * Without `eventId` the zone stays presentational (sample/preview mode).
 */
export function TaskProvideUpload({
  signed,
  eventId,
  stageKey,
  factTemplateCode,
  onUploaded,
}: DropZoneProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<DropZoneStatus>({ phase: "idle" });
  const [dragActive, setDragActive] = useState(false);

  const canUpload = Boolean(eventId);

  const handleFile = async (file: File) => {
    if (!eventId) return;
    const guard = isAcceptedCanvasUpload(file);
    if (!guard.ok) {
      setStatus({ phase: "error", message: guard.reason ?? "File rejected." });
      return;
    }
    setStatus({ phase: "uploading", name: file.name });
    try {
      // 1) Store the file as an artifact (unchanged behavior — always happens).
      const result = await uploadSourceCanvasArtifact({
        eventId,
        stageKey,
        file,
      });

      // 2) When this task binds a template, ALSO parse the file into typed facts.
      //    On success the step insight flips LIVE — refresh the page so the
      //    server re-reads facts and rebuilds it. A fact-ingest failure surfaces
      //    as an error (never a fake "done"): the artifact is already stored.
      if (factTemplateCode) {
        let ingest: IngestFactsResult;
        try {
          ingest = await ingestSourceCanvasFacts({
            eventId,
            file,
            templateCode: factTemplateCode,
            artifactId: result.artifactId,
          });
        } catch (ingestError) {
          setStatus({
            phase: "error",
            message:
              ingestError instanceof Error
                ? `File stored, but fact parse failed: ${ingestError.message}`
                : "File stored, but fact parse failed.",
          });
          return;
        }
        setStatus({ phase: "uploaded", result, ingest });
        onUploaded?.();
        if (ingest.factsWritten > 0) router.refresh();
        return;
      }

      setStatus({ phase: "uploaded", result });
      onUploaded?.();
      router.refresh();
    } catch (error) {
      setStatus({
        phase: "error",
        message: error instanceof Error ? error.message : "Upload failed.",
      });
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset so re-selecting the same file re-fires change.
    e.target.value = "";
    if (file) void handleFile(file);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    if (!canUpload) return;
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };

  // Signed/PDF tasks keep their document hint and are not wired to the CSV/XLSX
  // uploader (out of scope: this wires the volumetrics-style CSV/XLSX dropzone).
  if (status.phase === "uploaded") {
    return (
      <div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "26px minmax(0, 1fr)",
            gap: 10,
            alignItems: "center",
          }}
        >
          <span
            aria-label="File uploaded"
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: ANALYTICS.GREEN,
              color: "#fff",
              display: "grid",
              placeItems: "center",
              fontSize: 12,
              fontWeight: 900,
            }}
          >
            ✓
          </span>
          <FileChip
            file={{
              format: status.result.format,
              name: status.result.originalName,
              meta: `${formatUploadSize(status.result.sizeBytes)} · uploaded`,
            }}
            onRemove={() => setStatus({ phase: "idle" })}
          />
        </div>
        {status.ingest ? <FactResultChip ingest={status.ingest} /> : null}
      </div>
    );
  }

  const isUploading = status.phase === "uploading";
  const hint = signed ? "PDF · signed document" : "CSV or XLSX · up to 100 MB";

  return (
    <div>
      <div
        role={canUpload ? "button" : undefined}
        tabIndex={canUpload ? 0 : undefined}
        aria-label={canUpload ? "Drop a file here, or browse" : undefined}
        data-testid="task-dropzone"
        onClick={() => {
          if (canUpload && !isUploading) inputRef.current?.click();
        }}
        onKeyDown={(e) => {
          if (
            canUpload &&
            !isUploading &&
            (e.key === "Enter" || e.key === " ")
          ) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          if (!canUpload) return;
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 13,
          padding: "15px 16px",
          border: `1.5px dashed ${
            dragActive ? ANALYTICS.INK : ANALYTICS.LINE_STRONG
          }`,
          borderRadius: ANALYTICS.RADIUS,
          background: dragActive ? ANALYTICS.CARD : ANALYTICS.SOFT,
          cursor: canUpload && !isUploading ? "pointer" : "default",
          opacity: isUploading ? 0.7 : 1,
        }}
      >
        <span
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: ANALYTICS.CARD,
            border: `1px solid ${ANALYTICS.LINE}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: ANALYTICS.MUTED,
            flexShrink: 0,
          }}
        >
          {isUploading ? "⟳" : "↑"}
        </span>
        <span style={{ minWidth: 0 }}>
          <span
            style={{
              display: "block",
              fontSize: 13.5,
              fontWeight: 600,
              color: ANALYTICS.INK,
            }}
          >
            {isUploading
              ? `Uploading ${status.phase === "uploading" ? status.name : ""}…`
              : "Drop a file here, or browse"}
          </span>
          <span
            style={{ display: "block", fontSize: 11.5, color: ANALYTICS.MUTED }}
          >
            {hint}
          </span>
        </span>
        {canUpload ? (
          <span
            style={{
              marginLeft: "auto",
              borderRadius: ANALYTICS.RADIUS_SM,
              background: ANALYTICS.INK,
              color: "#fff",
              fontSize: 12,
              fontWeight: 800,
              padding: "8px 12px",
              whiteSpace: "nowrap",
            }}
          >
            Upload file
          </span>
        ) : null}
        {canUpload ? (
          <input
            ref={inputRef}
            type="file"
            accept={CANVAS_UPLOAD_ACCEPT}
            onChange={onInputChange}
            style={{ display: "none" }}
            data-testid="task-file-input"
          />
        ) : null}
      </div>
      {status.phase === "error" ? (
        <div
          role="alert"
          style={{
            fontSize: 12,
            color: ANALYTICS.AMBER_TEXT,
            marginTop: 8,
          }}
        >
          {status.message}
        </div>
      ) : null}
    </div>
  );
}
