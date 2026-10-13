"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./step-page/MovesStepPage.module.css";
import { AUTHORED_ADMISSION_RECORDED_EVENT, authoredDocumentSpec, type AuthoredAdmissionResponse, type AuthoredDocumentKey } from "@/lib/programs/authored-deliverable-receipt";

export function AuthoredDeliverableUploadAction({ moveId, documentKey, phase = 1 }: { moveId: string; documentKey: AuthoredDocumentKey; phase?: 1 | 2 }) {
  const router = useRouter();
  const spec = authoredDocumentSpec(phase, documentKey);
  const [file, setFile] = useState<File | null>(null);
  const [companion, setCompanion] = useState<File | null>(null);
  const [sha256, setSha256] = useState("");
  const [companionHash, setCompanionHash] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storedId, setStoredId] = useState<string | null>(null);
  const [retained, setRetained] = useState<Array<{ artifactId: string; fileRole: string; blobStored: boolean }>>([]);
  const [receipt, setReceipt] = useState<AuthoredAdmissionResponse | null>(null);
  const requestId = useRef("");
  const selection = useRef({ primary: 0, diagnostic_word: 0 });

  async function selectFile(next: File | null, role: "primary" | "diagnostic_word" = "primary") {
    const sequence = ++selection.current[role];
    const format = role === "primary" ? spec?.format ?? "docx" : "docx";
    if (role === "primary") { setFile(next); setSha256(""); }
    else { setCompanion(next); setCompanionHash(""); }
    setError(null); setStoredId(null); setRetained([]); setReceipt(null);
    requestId.current = crypto.randomUUID();
    if (!next) return;
    if (!new RegExp(`\\.${format}$`, "i").test(next.name) || next.size > 20 * 1024 * 1024 || next.size === 0) {
      setError(`Choose an editable ${format.toUpperCase()} file of at most 20 MB.`); return;
    }
    try {
      const digest = await crypto.subtle.digest("SHA-256", await next.arrayBuffer());
      if (sequence === selection.current[role]) {
        const value = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
        if (role === "primary") setSha256(value); else setCompanionHash(value);
      }
    } catch { if (sequence === selection.current[role]) setError("The selected file could not be read. Choose it again."); }
  }

  async function submit() {
    if (!spec || !file || !sha256 || busy || (spec.requiresWordCompanion && (!companion || !companionHash))) return;
    setBusy(true); setError(null);
    const form = new FormData();
    form.set("file", file); form.set("deliverableTypeKey", documentKey);
    form.set("expectedState", "absent"); form.set("expectedFileSha256", sha256);
    form.set("requestId", requestId.current);
    if (phase === 2) form.set("phase", "2");
    if (spec.requiresWordCompanion && companion) { form.set("companionFile", companion); form.set("companionFileSha256", companionHash); }
    try {
      const response = await fetch(`/api/v1/programs/${moveId}/deliverables/authored-upload`, { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok || result.ok !== true) {
        setError(typeof result.detail === "string" ? result.detail : "Admission could not be confirmed. Check the current document before retrying.");
        setStoredId(typeof result.storedArtifactId === "string" ? result.storedArtifactId : null);
        setRetained(Array.isArray(result.retainedOriginals) ? result.retainedOriginals : []);
        return;
      }
      setReceipt(result); setStoredId(null); setRetained([]);
      window.dispatchEvent(new CustomEvent(AUTHORED_ADMISSION_RECORDED_EVENT, { detail: { moveId } }));
      router.refresh();
    } catch { setError("The request result is unavailable. Keep this selected file and retry with the same request."); }
    finally { setBusy(false); }
  }

  if (!spec) return null;
  return <div className={styles.authoredUpload}>
    <p>Upload an authored {spec.format === "docx" ? "Word" : "presentation"} draft for review.</p>
    <label htmlFor={`authored-file-${documentKey}`}>Authored {spec.format.toUpperCase()}</label>
    <input id={`authored-file-${documentKey}`} type="file" accept={spec.format === "docx" ? ".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" : ".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"}
      disabled={busy} onChange={event => void selectFile(event.target.files?.[0] ?? null)} />
    {spec.requiresWordCompanion && <>
      <label htmlFor={`authored-companion-${documentKey}`}>Current-state Word record</label>
      <input id={`authored-companion-${documentKey}`} type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        disabled={busy} onChange={event => void selectFile(event.target.files?.[0] ?? null, "diagnostic_word")} />
    </>}
    <button type="button" disabled={busy || !sha256 || Boolean(receipt) || (spec.requiresWordCompanion && !companionHash)} onClick={() => void submit()}>
      {busy ? "Uploading…" : "Upload authored draft"}
    </button>
    {error && <p role="alert">{error}</p>}
    {retained.length ? retained.map(r => <p key={r.artifactId}>Storage record · {r.fileRole === "diagnostic_word" ? "Word record" : "primary file"} · admission unconfirmed. <a href={`/api/v1/programs/${moveId}/artifacts/${r.artifactId}/download`}>Check retained original</a></p>) :
      storedId && <a href={`/api/v1/programs/${moveId}/artifacts/${storedId}/download`}>Download retained upload</a>}
    {receipt && <p role="status">{receipt.replayed ? "Recorded authored version" : "Authored upload · draft"} · version {receipt.admittedVersion}. <a href={receipt.originalDownloadUrl}>Download uploaded original</a>
      {receipt.companionOriginal && <> · <a href={receipt.companionOriginal.originalDownloadUrl}>Download Word original</a></>}
    </p>}
    {sha256 && <details><summary>File receipt</summary><p className={styles.authoredHash}>{sha256}</p>
      {companionHash && <p className={styles.authoredHash}>Word original: {companionHash}</p>}
      {receipt && <p>File version {receipt.artifactVersion} · document version {receipt.admittedVersion}</p>}
    </details>}
  </div>;
}
