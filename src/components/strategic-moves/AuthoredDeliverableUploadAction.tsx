"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./step-page/MovesStepPage.module.css";
import type { AuthoredAdmissionResponse, AuthoredP1Key } from "@/lib/programs/authored-deliverable-receipt";
import { AUTHORED_ADMISSION_RECORDED_EVENT } from "@/lib/programs/authored-deliverable-receipt";

export function AuthoredDeliverableUploadAction({ moveId, documentKey }: { moveId: string; documentKey: AuthoredP1Key }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [sha256, setSha256] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storedId, setStoredId] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<AuthoredAdmissionResponse | null>(null);
  const requestId = useRef("");
  const selection = useRef(0);

  async function selectFile(next: File | null) {
    const sequence = ++selection.current;
    setFile(next); setSha256(""); setError(null); setStoredId(null); setReceipt(null);
    requestId.current = crypto.randomUUID();
    if (!next) return;
    if (!/\.docx$/i.test(next.name) || next.size > 20 * 1024 * 1024 || next.size === 0) {
      setError("Choose an editable DOCX file of at most 20 MB."); return;
    }
    try {
      const digest = await crypto.subtle.digest("SHA-256", await next.arrayBuffer());
      if (sequence === selection.current) setSha256(Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join(""));
    } catch { if (sequence === selection.current) setError("The selected file could not be read. Choose it again."); }
  }

  async function submit() {
    if (!file || !sha256 || busy) return;
    setBusy(true); setError(null);
    const form = new FormData();
    form.set("file", file); form.set("deliverableTypeKey", documentKey);
    form.set("expectedState", "absent"); form.set("expectedFileSha256", sha256);
    form.set("requestId", requestId.current);
    try {
      const response = await fetch(`/api/v1/programs/${moveId}/deliverables/authored-upload`, { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok || result.ok !== true) {
        setError(typeof result.detail === "string" ? result.detail : "Admission could not be confirmed. Check the current document before retrying.");
        setStoredId(typeof result.storedArtifactId === "string" ? result.storedArtifactId : null);
        return;
      }
      setReceipt(result); setStoredId(null);
      window.dispatchEvent(new CustomEvent(AUTHORED_ADMISSION_RECORDED_EVENT, { detail: { moveId } }));
      router.refresh();
    } catch { setError("The request result is unavailable. Keep this selected file and retry with the same request."); }
    finally { setBusy(false); }
  }

  return <div className={styles.authoredUpload}>
    <p>Upload an authored Word draft for review.</p>
    <label htmlFor={`authored-file-${documentKey}`}>Authored DOCX</label>
    <input id={`authored-file-${documentKey}`} type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      disabled={busy} onChange={event => void selectFile(event.target.files?.[0] ?? null)} />
    <button type="button" disabled={busy || !sha256 || Boolean(receipt)} onClick={() => void submit()}>
      {busy ? "Uploading…" : "Upload authored draft"}
    </button>
    {error && <p role="alert">{error}</p>}
    {storedId && <a href={`/api/v1/programs/${moveId}/artifacts/${storedId}/download`}>Download retained upload</a>}
    {receipt && <p role="status">{receipt.replayed ? "Recorded authored version" : "Authored upload · draft"} · version {receipt.admittedVersion}. <a href={receipt.originalDownloadUrl}>Download uploaded original</a></p>}
    {sha256 && <details><summary>File receipt</summary><p className={styles.authoredHash}>{sha256}</p>
      {receipt && <p>File version {receipt.artifactVersion} · document version {receipt.admittedVersion}</p>}
    </details>}
  </div>;
}
