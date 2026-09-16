"use client";

import { useState } from "react";
import type { SourceArtifactRecord } from "@/lib/source/file-cabinet/types";

export type SourceNewFilePhase = "request" | "define" | "suppliers" | "rfi";

export type SourceNewFileRow = Pick<
  SourceArtifactRecord,
  | "id"
  | "artifactGroup"
  | "artifactType"
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
  | "blobSha256"
  | "approvalState"
  | "approvedBy"
  | "approvedAt"
> & {
  // The authorized caller assigns the product phase; the cabinet's sourcingStage
  // is a separate, finer-grained workflow vocabulary.
  phase: SourceNewFilePhase;
};

export interface SourceNewFilesProps {
  rows: readonly SourceNewFileRow[];
  initialPhase?: SourceNewFilePhase;
  onPreview?: (row: SourceNewFileRow) => void;
  onDownload?: (row: SourceNewFileRow) => void;
  onUpload?: (phase: SourceNewFilePhase) => void;
  onReview?: (row: SourceNewFileRow) => void;
}

const PHASES: readonly { key: SourceNewFilePhase; label: string }[] = [
  { key: "request", label: "Request" },
  { key: "define", label: "Define" },
  { key: "suppliers", label: "Suppliers" },
  { key: "rfi", label: "RFI" },
];

const label = (value: string) => value.replaceAll("_", " ");

function displayRows(rows: readonly SourceNewFileRow[], includeHistory: boolean) {
  const sorted = [...rows].sort((a, b) => b.version - a.version);
  if (includeHistory) return sorted;

  const seen = new Set<string>();
  return sorted.filter((row) => {
    if (row.lifecycleState !== "current") return false;
    const key = `${row.phase}:${row.artifactGroup}:${row.artifactType}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function fileSize(bytes: number | null) {
  if (bytes === null) return null;
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function SourceNewFiles({ rows, initialPhase = "request", onPreview, onDownload, onUpload, onReview }: SourceNewFilesProps) {
  const [phase, setPhase] = useState<SourceNewFilePhase>(initialPhase);
  const [search, setSearch] = useState("");
  const [includeHistory, setIncludeHistory] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const visible = displayRows(rows, includeHistory).filter(
    (row) => row.phase === phase && `${row.title} ${row.fileName}`.toLowerCase().includes(search.trim().toLowerCase()),
  );
  const selected = visible.find((row) => row.id === selectedId) ?? visible[0] ?? null;

  return (
    <section className="source-new-files" aria-label="Files">
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
        .source-new-files__details { padding: 16px; min-width: 0; }
        .source-new-files__details h4 { margin: 0 0 3px; font-size: 15px; overflow-wrap: anywhere; }
        .source-new-files__details dl { margin: 17px 0; display: grid; grid-template-columns: 65px minmax(0, 1fr); gap: 8px; font-size: 12px; }
        .source-new-files__details dt { color: #697671; }
        .source-new-files__details dd { margin: 0; overflow-wrap: anywhere; }
        .source-new-files__actions { display: flex; gap: 6px; flex-wrap: wrap; }
        .source-new-files__empty { padding: 32px 16px; color: #65716c; }
        @media (max-width: 760px) { .source-new-files__body { grid-template-columns: 1fr; } .source-new-files__folders { display: flex; gap: 4px; overflow-x: auto; border-right: 0; border-bottom: 1px solid #e5e9e7; } .source-new-files__folder { width: auto; white-space: nowrap; } .source-new-files__columns { grid-template-columns: 1fr; } .source-new-files__list { border-right: 0; } .source-new-files__details { border-top: 1px solid #e5e9e7; } }
      `}</style>
      <div className="source-new-files__toolbar">
        <h2>Files</h2>
        <label className="source-new-files__search">
          <input aria-label="Search files" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search files" />
        </label>
        <label className="source-new-files__history">
          <input type="checkbox" checked={includeHistory} onChange={(event) => setIncludeHistory(event.target.checked)} />
          Older versions
        </label>
      </div>
      <div className="source-new-files__body">
        <nav className="source-new-files__folders" aria-label="File folders">
          {PHASES.map((folder) => (
            <button key={folder.key} type="button" className="source-new-files__folder" aria-current={phase === folder.key ? "true" : undefined} onClick={() => { setPhase(folder.key); setSelectedId(null); }}>
              {folder.label}
            </button>
          ))}
        </nav>
        <div className="source-new-files__content">
          <div className="source-new-files__heading">
            <h3>{PHASES.find((folder) => folder.key === phase)?.label}</h3>
            {onUpload && <button type="button" className="source-new-files__command" onClick={() => onUpload(phase)}>Upload</button>}
          </div>
          <div className="source-new-files__columns">
            <div className="source-new-files__list" role="listbox" aria-label="Files in folder">
              {visible.length === 0 ? <p className="source-new-files__empty">{search ? "No matching files" : "No files here yet"}</p> : visible.map((row) => (
                <button key={row.id} type="button" role="option" aria-selected={selected?.id === row.id} className="source-new-files__file" onClick={() => setSelectedId(row.id)}>
                  <span className="source-new-files__file-copy"><span className="source-new-files__file-name">{row.title}</span><span className="source-new-files__file-meta">{label(row.status)} · {row.fileFormat.toUpperCase()}{fileSize(row.fileSize) ? ` · ${fileSize(row.fileSize)}` : ""}</span></span>
                  <span className="source-new-files__file-version">v{row.version}</span>
                </button>
              ))}
            </div>
            <aside className="source-new-files__details" aria-label="Selected file details">
              {selected ? <>
                <h4>{selected.title}</h4>
                <span className="source-new-files__file-meta">{selected.fileName} · v{selected.version}</span>
                <dl>
                  <dt>Status</dt><dd>{label(selected.status)}{selected.lifecycleState !== "current" && selected.lifecycleState !== selected.status ? ` · ${selected.lifecycleState}` : ""}</dd>
                  <dt>Origin</dt><dd>{selected.generatedBy ?? selected.sourceBasis ?? "Not recorded"}</dd>
                  <dt>Review</dt><dd>{selected.approvedBy ? `Approved by ${selected.approvedBy}${selected.approvedAt ? ` · ${new Date(selected.approvedAt).toLocaleDateString()}` : ""}` : selected.approvalState ? label(selected.approvalState) : "Not recorded"}</dd>
                  <dt>SHA-256</dt><dd>{selected.blobSha256 ?? "Not recorded"}</dd>
                </dl>
                <div className="source-new-files__actions">
                  {onPreview && <button type="button" className="source-new-files__command" onClick={() => onPreview(selected)}>Preview</button>}
                  {onDownload && <button type="button" className="source-new-files__command" onClick={() => onDownload(selected)}>Download</button>}
                  {onReview && <button type="button" className="source-new-files__command" onClick={() => onReview(selected)}>Review</button>}
                </div>
              </> : <p className="source-new-files__file-meta">Select a file to see its details.</p>}
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}
