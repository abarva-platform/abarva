// Upload an event document through the GOVERNED registry route.
//
// Seam-sweep fix (2026-06-11): the only visible upload affordance on the Source canvas
// was the chat paperclip, which posts to /api/v1/agent/attachments — a chat attachment
// that never reaches the artifact registry, the EVENT DOCUMENTS shelf, or the evidence
// readiness ladder. This button is the user-facing path to
// /api/v1/source/{eventId}/artifacts/upload (blob + registry + parse + substrate sync).

import { useRef, useState } from "react";
import type { SourceStageKey } from "@/lib/source/types";

interface Props {
  eventId: string;
  stageKey: SourceStageKey;
  onUploaded?: () => void;
}

export function UploadEventDocumentButton({
  eventId,
  stageKey,
  onUploaded,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("stageKey", stageKey);
        fd.append("dataClassification", "Internal");
        const res = await fetch(
          `/api/v1/source/${encodeURIComponent(eventId)}/artifacts/upload`,
          { method: "POST", body: fd, credentials: "include" },
        );
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as {
            detail?: string;
            error?: string;
          } | null;
          throw new Error(
            body?.detail ?? body?.error ?? `Upload failed (${res.status}).`,
          );
        }
      }
      onUploaded?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {error ? (
        <span style={{ fontSize: 11, color: "#B3261E", maxWidth: 280 }}>
          {error}
        </span>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.docx,.xlsx,.pptx,.md,.csv,.txt"
        style={{ display: "none" }}
        data-testid="source-upload-event-document-input"
        onChange={(e) => void onFiles(e.target.files)}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        data-testid="source-upload-event-document"
        style={{
          padding: "7px 14px",
          borderRadius: 6,
          border: "1px solid rgba(10,10,11,0.15)",
          background: "#0C1A3A",
          color: "#fff",
          fontSize: 12,
          fontWeight: 600,
          cursor: busy ? "not-allowed" : "pointer",
          opacity: busy ? 0.6 : 1,
          whiteSpace: "nowrap",
        }}
      >
        {busy ? "Uploading…" : "Upload document"}
      </button>
    </div>
  );
}
