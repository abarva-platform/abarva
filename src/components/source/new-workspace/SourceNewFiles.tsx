"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { containsUuidDisplayValue } from "@/lib/source/display-identifiers";
import type { SourceArtifactRecord } from "@/lib/source/file-cabinet/types";

export type SourceNewFilePhase =
  | "request"
  | "define"
  | "suppliers"
  | "rfi"
  | "other";

export type SourceNewFileRow = Pick<
  SourceArtifactRecord,
  | "id"
  | "artifactGroup"
  | "artifactType"
  | "artifactFamily"
  | "description"
  | "title"
  | "fileName"
  | "fileFormat"
  | "fileSize"
  | "version"
  | "status"
  | "lifecycleState"
  | "generatedAt"
  | "generatedBy"
  | "sourceBasis"
  | "confidence"
  | "citationReady"
  | "evidenceFamiliesUsed"
  | "sourceRegisterId"
  | "contextBundleTraceId"
  | "missingInputs"
  | "clientCompleteItems"
  | "assumptions"
  | "supersedesArtifactId"
  | "supersededByArtifactId"
  | "blobSha256"
  | "approvalState"
  | "approvedBy"
  | "approvedAt"
  | "isClientFinal"
  | "isCurrentAuthoritative"
  | "sourceGeneratedArtifactId"
  | "clientFinalUploadedBy"
  | "clientFinalUploadedAt"
  | "clientFinalAcceptedBy"
  | "clientFinalAcceptedAt"
  | "clientFinalNote"
  | "clientFinalReviewMeetingDate"
  | "clientFinalStakeholderGroup"
  | "createdAt"
  | "updatedAt"
> & {
  // The authorized caller assigns the product phase; the cabinet's sourcingStage
  // is a separate, finer-grained workflow vocabulary.
  phase: SourceNewFilePhase;
  coveredSupplierLegalEntity?: string | null;
  coveredScopeId?: string | null;
  effectiveFrom?: string | null;
  expiresOn?: string | null;
};

export interface SourceNewFilesProps {
  rows: readonly SourceNewFileRow[];
  initialPhase?: SourceNewFilePhase;
  marketPackageLabel?: string;
  onPreview?: (row: SourceNewFileRow) => void;
  onDownload?: (row: SourceNewFileRow) => void;
  onUpload?: (phase: SourceNewFilePhase) => void;
  onReview?: (row: SourceNewFileRow) => void;
}

const PHASES: readonly { key: SourceNewFilePhase; label: string }[] = [
  { key: "request", label: "Request" },
  { key: "define", label: "Define" },
  { key: "suppliers", label: "Suppliers" },
  { key: "rfi", label: "Market package" },
  // Artifacts from the rest of the event. The folder appears only when such
  // files exist, but they are never hidden: an empty folder beside a cabinet
  // that holds files would read as "no files" when the truth is "not here".
  { key: "other", label: "Other stages" },
];

const label = (value: string) => value.replaceAll("_", " ");

function displayRows(
  rows: readonly SourceNewFileRow[],
  includeHistory: boolean,
) {
  return rows
    .filter((row) => includeHistory || row.lifecycleState === "current")
    .sort(
      (a, b) =>
        b.generatedAt.localeCompare(a.generatedAt) || b.version - a.version,
    );
}

function fileSize(bytes: number | null) {
  if (bytes === null) return null;
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function recorded(value: string | null | undefined) {
  return value?.trim() || "Not recorded";
}

function clientFacingRecorded(value: string | null | undefined, unresolved: string) {
  if (!value?.trim()) return "Not recorded";
  return containsUuidDisplayValue(value) ? unresolved : value.trim();
}

function actorWithDate(
  action: "Approved" | "Accepted" | "Uploaded",
  actor: string,
  at: string | null | undefined,
) {
  const actorLabel = containsUuidDisplayValue(actor)
    ? `${action === "Approved" ? "Recorded approver" : `${action} by recorded user`}; name unresolved`
    : `${action} by ${actor.trim()}`;
  return `${actorLabel}${at ? ` · ${new Date(at).toLocaleDateString()}` : ""}`;
}

function boolState(value: boolean) {
  return value ? "Yes" : "No";
}

function dateTime(value: string | null | undefined) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function listValue(values: readonly string[]) {
  return values.length > 0 ? values.join(", ") : "Not recorded";
}

function DetailRow({
  term,
  children,
}: {
  term: string;
  children: ReactNode;
}) {
  return (
    <>
      <dt>{term}</dt>
      <dd>{children}</dd>
    </>
  );
}

export function SourceNewFiles({
  rows,
  initialPhase = "request",
  marketPackageLabel = "Market package",
  onPreview,
  onDownload,
  onUpload,
  onReview,
}: SourceNewFilesProps) {
  const [phase, setPhase] = useState<SourceNewFilePhase>(initialPhase);
  const [search, setSearch] = useState("");
  const [includeHistory, setIncludeHistory] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const returnButtonRef = useRef<HTMLButtonElement | null>(null);
  const returnScrollRef = useRef({ list: 0, page: 0 });
  const restoreListRef = useRef(false);

  // "Other stages" is offered only when the cabinet actually holds such files.
  const folders = PHASES.filter(
    (folder) =>
      folder.key !== "other" || rows.some((row) => row.phase === "other"),
  ).map((folder) =>
    folder.key === "rfi" ? { ...folder, label: marketPackageLabel } : folder,
  );
  const visible = displayRows(rows, includeHistory).filter(
    (row) =>
      row.phase === phase &&
      `${row.title} ${row.fileName}`
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
  );
  const selected =
    visible.find((row) => row.id === selectedId) ?? visible[0] ?? null;
  // "No files here" must mean the folder is empty, not that the history toggle
  // is hiding what it holds. Superseded rows are files; they are just not the
  // current version.
  const hiddenOlder = includeHistory
    ? 0
    : rows.filter(
        (row) => row.phase === phase && row.lifecycleState !== "current",
      ).length;
  const emptyMessage = search
    ? "No matching files"
    : hiddenOlder > 0
      ? `No current version here. ${hiddenOlder} older ${hiddenOlder === 1 ? "version is" : "versions are"} hidden — turn on Older versions to see ${hiddenOlder === 1 ? "it" : "them"}.`
      : "No files here yet";

  useLayoutEffect(() => {
    if (mobileDetailOpen) {
      backRef.current?.focus();
    } else if (restoreListRef.current) {
      restoreListRef.current = false;
      returnButtonRef.current?.focus({ preventScroll: true });
      if (listRef.current)
        listRef.current.scrollTop = returnScrollRef.current.list;
      window.scrollTo(0, returnScrollRef.current.page);
    }
  }, [mobileDetailOpen]);

  function openFile(row: SourceNewFileRow, button: HTMLButtonElement) {
    setSelectedId(row.id);
    if (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(max-width: 760px)").matches
    ) {
      returnButtonRef.current = button;
      returnScrollRef.current = {
        list: listRef.current?.scrollTop ?? 0,
        page: window.scrollY,
      };
      setMobileDetailOpen(true);
    }
  }

  function backToFiles() {
    restoreListRef.current = true;
    setMobileDetailOpen(false);
  }

  return (
    <section
      className="source-new-files"
      aria-label="Files"
      data-mobile-detail={mobileDetailOpen}
    >
      <style>{`
        .source-new-files { color: #1a242b; background: #fff; border: 1px solid #d9dedc; border-radius: 6px; font-size: 13px; line-height: 1.45; min-width: 0; }
        .source-new-files * { box-sizing: border-box; }
        .source-new-files button { font: inherit; cursor: pointer; }
        .source-new-files button:focus-visible, .source-new-files input:focus-visible { outline: 2px solid #087f82; outline-offset: 2px; }
        .source-new-files__toolbar { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-bottom: 1px solid #e5e9e7; flex-wrap: wrap; }
        .source-new-files__toolbar h2 { font-size: 17px; margin: 0 auto 0 0; font-weight: 650; }
        .source-new-files__search { display: flex; align-items: center; gap: 7px; min-width: 180px; border: 1px solid #ccd4d1; border-radius: 5px; padding: 6px 9px; color: #64716e; }
        .source-new-files__search input { border: 0; outline: 0; width: 100%; min-width: 0; color: #1a242b; background: transparent; }
        .source-new-files__history { display: inline-flex; gap: 6px; align-items: center; white-space: nowrap; color: #4f5d59; }
        .source-new-files__body { display: grid; grid-template-columns: 162px minmax(0, 1fr); min-height: 300px; }
        .source-new-files__folders { border-right: 1px solid #e5e9e7; padding: 10px 8px; }
        .source-new-files__folder { display: flex; align-items: center; gap: 9px; width: 100%; border: 0; border-radius: 4px; background: transparent; color: #465651; text-align: left; padding: 9px; }
        .source-new-files__folder[aria-current="true"] { background: #e8f4f0; color: #075f59; font-weight: 650; }
        .source-new-files__content { min-width: 0; }
        .source-new-files__heading { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-bottom: 1px solid #e5e9e7; }
        .source-new-files__heading h3 { margin: 0 auto 0 0; font-size: 14px; }
        .source-new-files__command { display: inline-flex; align-items: center; justify-content: center; gap: 6px; border: 1px solid #cbd8d2; color: #155d54; background: #fff; border-radius: 4px; padding: 6px 9px; }
        .source-new-files__command:hover { background: #eff7f3; }
        .source-new-files__columns { display: grid; grid-template-columns: minmax(0, 1fr) 260px; min-height: 240px; }
        .source-new-files__list { min-width: 0; border-right: 1px solid #e5e9e7; }
        .source-new-files__file { display: flex; width: 100%; align-items: center; gap: 11px; text-align: left; border: 0; border-bottom: 1px solid #eef0ef; background: #fff; padding: 12px 16px; color: inherit; }
        .source-new-files__file[aria-selected="true"] { background: #f0f7f5; }
        .source-new-files__file:hover { background: #f6f9f8; }
        .source-new-files__file-copy { min-width: 0; flex: 1; }
        .source-new-files__file-name { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 600; }
        .source-new-files__file-meta { display: block; color: #67736f; font-size: 12px; margin-top: 2px; }
        .source-new-files__file-version { color: #51615b; flex: none; font-variant-numeric: tabular-nums; }
        .source-new-files__details { padding: 16px; min-width: 0; max-height: 68vh; overflow: auto; }
        .source-new-files__back { display: inline-flex; margin-bottom: 16px; }
        .source-new-files__details h4 { margin: 0 0 3px; font-size: 15px; overflow-wrap: anywhere; }
        .source-new-files__detail-section { margin-top: 16px; padding-top: 13px; border-top: 1px solid #e8ecea; }
        .source-new-files__detail-section h5 { margin: 0 0 9px; color: #30413c; font-size: 12px; letter-spacing: 0; font-weight: 700; }
        .source-new-files__details dl { margin: 0; display: grid; grid-template-columns: 92px minmax(0, 1fr); gap: 8px; font-size: 12px; }
        .source-new-files__details dt { color: #697671; }
        .source-new-files__details dd { margin: 0; overflow-wrap: anywhere; }
        .source-new-files__details code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace; font-size: 11px; color: #35423f; }
        .source-new-files__actions { display: flex; gap: 6px; flex-wrap: wrap; }
        .source-new-files__empty { padding: 32px 16px; color: #65716c; }
        @media (min-width: 761px) { .source-new-files__back { display: none; } }
        @media (max-width: 760px) {
          .source-new-files__body, .source-new-files__columns { grid-template-columns: 1fr; }
          .source-new-files__folders { display: flex; gap: 4px; overflow-x: auto; border-right: 0; border-bottom: 1px solid #e5e9e7; }
          .source-new-files__folder { width: auto; white-space: nowrap; }
          .source-new-files__list { border-right: 0; }
          .source-new-files__details { display: none; }
          .source-new-files[data-mobile-detail="true"] .source-new-files__toolbar,
          .source-new-files[data-mobile-detail="true"] .source-new-files__folders,
          .source-new-files[data-mobile-detail="true"] .source-new-files__heading,
          .source-new-files[data-mobile-detail="true"] .source-new-files__list { display: none; }
          .source-new-files[data-mobile-detail="true"] .source-new-files__details { display: block; }
        }
      `}</style>
      <div className="source-new-files__toolbar">
        <h2>Files</h2>
        <label className="source-new-files__search">
          <input
            aria-label="Search files"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search files"
          />
        </label>
        <label className="source-new-files__history">
          <input
            type="checkbox"
            checked={includeHistory}
            onChange={(event) => setIncludeHistory(event.target.checked)}
          />
          Older versions
        </label>
      </div>
      <div className="source-new-files__body">
        <nav className="source-new-files__folders" aria-label="File folders">
          {folders.map((folder) => (
            <button
              key={folder.key}
              type="button"
              className="source-new-files__folder"
              aria-current={phase === folder.key ? "true" : undefined}
              onClick={() => {
                setPhase(folder.key);
                setSelectedId(null);
              }}
            >
              {folder.label}
            </button>
          ))}
        </nav>
        <div className="source-new-files__content">
          <div className="source-new-files__heading">
            <h3>
              {folders.find((folder) => folder.key === phase)?.label ??
                PHASES.find((folder) => folder.key === phase)?.label}
            </h3>
            {onUpload && (
              <button
                type="button"
                className="source-new-files__command"
                onClick={() => onUpload(phase)}
              >
                Upload
              </button>
            )}
          </div>
          <div className="source-new-files__columns">
            <div
              ref={listRef}
              className="source-new-files__list"
              role="listbox"
              aria-label="Files in folder"
            >
              {visible.length === 0 ? (
                <p className="source-new-files__empty">{emptyMessage}</p>
              ) : (
                visible.map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    role="option"
                    aria-selected={selected?.id === row.id}
                    className="source-new-files__file"
                    onClick={(event) => openFile(row, event.currentTarget)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openFile(row, event.currentTarget);
                      }
                    }}
                  >
                    <span className="source-new-files__file-copy">
                      <span className="source-new-files__file-name">
                        {row.title}
                      </span>
                      <span className="source-new-files__file-meta">
                        {label(row.status)} · {row.fileFormat.toUpperCase()}
                        {fileSize(row.fileSize)
                          ? ` · ${fileSize(row.fileSize)}`
                          : ""}
                      </span>
                    </span>
                    <span className="source-new-files__file-version">
                      v{row.version}
                    </span>
                  </button>
                ))
              )}
            </div>
            <aside
              className="source-new-files__details"
              aria-label="Selected file details"
              onKeyDown={(event) => {
                if (event.key === "Escape" && mobileDetailOpen) backToFiles();
              }}
            >
              {selected ? (
                <>
                  <button
                    ref={backRef}
                    type="button"
                    className="source-new-files__command source-new-files__back"
                    onClick={backToFiles}
                  >
                    Back to files
                  </button>
                  <h4>{selected.title}</h4>
                  <span className="source-new-files__file-meta">
                    {selected.fileName} · v{selected.version}
                  </span>
                  <div className="source-new-files__detail-section">
                    <h5>Preview metadata</h5>
                    <dl>
                      <DetailRow term="File name">{selected.fileName}</DetailRow>
                      <DetailRow term="Format">
                        {selected.fileFormat.toUpperCase()}
                        {fileSize(selected.fileSize)
                          ? ` · ${fileSize(selected.fileSize)}`
                          : ""}
                      </DetailRow>
                      <DetailRow term="Type">
                        {label(selected.artifactType)}
                      </DetailRow>
                      <DetailRow term="Group">
                        {label(selected.artifactGroup)}
                        {selected.artifactFamily
                          ? ` · ${label(selected.artifactFamily)}`
                          : ""}
                      </DetailRow>
                      <DetailRow term="Description">
                        {recorded(selected.description)}
                      </DetailRow>
                      <DetailRow term="Generated">
                        {dateTime(selected.generatedAt)}
                      </DetailRow>
                      <DetailRow term="Origin">
                        {selected.generatedBy
                          ? clientFacingRecorded(selected.generatedBy, "Origin name unresolved")
                          : recorded(selected.sourceBasis)}
                      </DetailRow>
                    </dl>
                  </div>
                  <div className="source-new-files__detail-section">
                    <h5>Version</h5>
                    <dl>
                      <DetailRow term="Current">
                        {`v${selected.version}`}
                      </DetailRow>
                      <DetailRow term="Status">
                        {label(selected.status)}
                        {selected.lifecycleState !== "current" &&
                        selected.lifecycleState !== selected.status
                          ? ` · ${selected.lifecycleState}`
                          : ""}
                      </DetailRow>
                      <DetailRow term="Supersedes">
                        {clientFacingRecorded(selected.supersedesArtifactId, "Artifact reference unresolved")}
                      </DetailRow>
                      <DetailRow term="Superseded by">
                        {clientFacingRecorded(selected.supersededByArtifactId, "Artifact reference unresolved")}
                      </DetailRow>
                      <DetailRow term="Updated">
                        {dateTime(selected.updatedAt)}
                      </DetailRow>
                    </dl>
                  </div>
                  <div className="source-new-files__detail-section">
                    <h5>Evidence links</h5>
                    <dl>
                      <DetailRow term="Source basis">
                        {recorded(selected.sourceBasis)}
                      </DetailRow>
                      <DetailRow term="Register ID">
                        {selected.sourceRegisterId ? (
                          containsUuidDisplayValue(selected.sourceRegisterId) ? (
                            "Register reference unresolved"
                          ) : (
                            <code>{selected.sourceRegisterId}</code>
                          )
                        ) : (
                          "Not recorded"
                        )}
                      </DetailRow>
                      <DetailRow term="Context trace">
                        {selected.contextBundleTraceId ? (
                          <code>{selected.contextBundleTraceId}</code>
                        ) : (
                          "Not recorded"
                        )}
                      </DetailRow>
                      <DetailRow term="Families">
                        {listValue(selected.evidenceFamiliesUsed)}
                      </DetailRow>
                      <DetailRow term="Citation ready">
                        {boolState(selected.citationReady)}
                      </DetailRow>
                      <DetailRow term="Confidence">
                        {recorded(selected.confidence)}
                      </DetailRow>
                    </dl>
                  </div>
                  <div className="source-new-files__detail-section">
                    <h5>Approvals and comments</h5>
                    <dl>
                      <DetailRow term="Approval">
                        {selected.approvedBy
                          ? actorWithDate("Approved", selected.approvedBy, selected.approvedAt)
                          : selected.approvalState
                            ? label(selected.approvalState)
                            : "Not recorded"}
                      </DetailRow>
                      <DetailRow term="Client final">
                        {selected.clientFinalAcceptedBy
                          ? actorWithDate("Accepted", selected.clientFinalAcceptedBy, selected.clientFinalAcceptedAt)
                          : selected.isClientFinal
                            ? "Uploaded, not accepted"
                            : "No"}
                      </DetailRow>
                      <DetailRow term="Final upload">
                        {selected.clientFinalUploadedBy
                          ? actorWithDate("Uploaded", selected.clientFinalUploadedBy, selected.clientFinalUploadedAt)
                          : "Not recorded"}
                      </DetailRow>
                      <DetailRow term="Review group">
                        {recorded(selected.clientFinalStakeholderGroup)}
                      </DetailRow>
                      <DetailRow term="Meeting">
                        {recorded(selected.clientFinalReviewMeetingDate)}
                      </DetailRow>
                      <DetailRow term="Comment">
                        {recorded(selected.clientFinalNote)}
                      </DetailRow>
                    </dl>
                  </div>
                  <div className="source-new-files__detail-section">
                    <h5>Authenticity state</h5>
                    <dl>
                      <DetailRow term="SHA-256">
                        {selected.blobSha256 ? (
                          <code>{selected.blobSha256}</code>
                        ) : (
                          "Not recorded"
                        )}
                      </DetailRow>
                      <DetailRow term="Authoritative">
                        {boolState(selected.isCurrentAuthoritative)}
                      </DetailRow>
                      <DetailRow term="Client final">
                        {boolState(selected.isClientFinal)}
                      </DetailRow>
                      <DetailRow term="Generated ID">
                        {selected.sourceGeneratedArtifactId ? (
                          <code>{selected.sourceGeneratedArtifactId}</code>
                        ) : (
                          "Not recorded"
                        )}
                      </DetailRow>
                      <DetailRow term="Missing inputs">
                        {listValue(selected.missingInputs)}
                      </DetailRow>
                      <DetailRow term="Complete items">
                        {listValue(selected.clientCompleteItems)}
                      </DetailRow>
                      <DetailRow term="Assumptions">
                        {listValue(selected.assumptions)}
                      </DetailRow>
                    </dl>
                  </div>
                  <div className="source-new-files__actions">
                    {onPreview && (
                      <button
                        type="button"
                        className="source-new-files__command"
                        onClick={() => onPreview(selected)}
                      >
                        Preview
                      </button>
                    )}
                    {onDownload && (
                      <button
                        type="button"
                        className="source-new-files__command"
                        onClick={() => onDownload(selected)}
                      >
                        Download
                      </button>
                    )}
                    {onReview && (
                      <button
                        type="button"
                        className="source-new-files__command"
                        onClick={() => onReview(selected)}
                      >
                        Review
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <p className="source-new-files__file-meta">
                  Select a file to see its details.
                </p>
              )}
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}
