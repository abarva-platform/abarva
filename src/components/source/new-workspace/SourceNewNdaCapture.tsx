"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { SourceNewFileRow } from "./SourceNewFiles";
import type { SourceNewStage05NdaCoverage } from "@/lib/source/new-workspace/stage05-nda-coverage";

export function SourceNewNdaCapture({
  eventId,
  clientKey,
  files,
  coverage,
}: {
  eventId: string;
  clientKey: string;
  files: readonly SourceNewFileRow[];
  coverage: SourceNewStage05NdaCoverage;
}) {
  const uncovered = coverage.suppliers.filter((supplier) => supplier.state === "not_covered");
  if (uncovered.length === 0) return null;

  const templates = coverage.publishedTemplateVersions ?? [];
  if (templates.length === 0) {
    return clientKey === "meridian-health"
      ? <SyntheticTemplatePublication eventId={eventId} files={files} />
      : <p className="snw-note">Legal must publish an NDA template version before an executed document can be recorded.</p>;
  }
  const executedFiles = files.filter((file) =>
    file.artifactGroup === "upload" && file.artifactType === "nda_executed" &&
    file.lifecycleState === "current" && Boolean(file.blobSha256));
  if (executedFiles.length === 0) {
    return <p className="snw-note">Upload the executed NDA through this event&apos;s File Cabinet before recording its signature evidence.</p>;
  }

  return <ReadyNdaForm eventId={eventId} uncovered={uncovered} templates={templates} executedFiles={executedFiles} />;
}

function SyntheticTemplatePublication({ eventId, files }: {
  eventId: string;
  files: readonly SourceNewFileRow[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const uploaded = files.filter((file) => file.artifactGroup === "upload" &&
    file.artifactType === "nda_template" && file.fileFormat === "pdf" &&
    file.lifecycleState === "current" && Boolean(file.blobSha256));

  async function submit(event: FormEvent<HTMLFormElement>, action: "upload" | "publish") {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    if (action === "upload") {
      form.set("stageKey", "suppliers");
      form.set("artifactKind", "nda_template");
      form.set("artifactFamily", "legal");
      form.set("dataClassification", "Internal");
    }
    setBusy(true);
    setMessage(null);
    try {
      const path = action === "upload" ? "artifacts/upload" : "nda/templates/publish";
      const response = await fetch(`/api/v1/source/${encodeURIComponent(eventId)}/${path}`, {
        method: "POST", body: form,
      });
      const result = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) {
        setMessage(`${action === "upload" ? "Upload" : "Publication"} failed: ${result.error ?? "authority unavailable"}.`);
        return;
      }
      setMessage(action === "upload" ? "PDF uploaded. Select it to publish the synthetic template." :
        "Synthetic template published for this event. Refreshing NDA coverage.");
      router.refresh();
    } catch {
      setMessage("NDA template service is unavailable.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="snw-scorecard-form snw-nda-capture" aria-label="Synthetic NDA template publication">
    <h4>Synthetic NDA template</h4>
    <p className="snw-note snw-nda-capture-wide">Lab event only. Admin publication is recorded as a synthetic test decision, not Legal approval or an executed NDA.</p>
    <form className="snw-nda-capture-wide" aria-label="Upload synthetic NDA template" onSubmit={(event) => submit(event, "upload")}>
      <label>Template PDF<input name="file" type="file" accept="application/pdf,.pdf" required /></label>
      <button className="snw-primary" type="submit" disabled={busy}>{busy ? "Working..." : "Upload PDF"}</button>
    </form>
    {uploaded.length > 0 && <form className="snw-nda-capture-wide" aria-label="Publish synthetic NDA template" onSubmit={(event) => submit(event, "publish")}>
      <label>Uploaded PDF<select name="artifactId" required>{uploaded.map((file) => <option key={file.id} value={file.id}>{file.title}</option>)}</select></label>
      <label>Template version<input name="templateVersion" required minLength={3} maxLength={64} /></label>
      <label>Display name<input name="displayName" required minLength={3} /></label>
      <label>Decision rationale<input name="rationale" required minLength={12} /></label>
      <label><input name="acknowledged" type="checkbox" required /> I authorize this PDF as a synthetic template for this event only.</label>
      <button className="snw-primary" type="submit" disabled={busy}>{busy ? "Working..." : "Publish synthetic template"}</button>
    </form>}
    {message && <p className="snw-nda-capture-wide" role="status">{message}</p>}
  </div>;
}

function ReadyNdaForm({
  eventId,
  uncovered,
  templates,
  executedFiles,
}: {
  eventId: string;
  uncovered: SourceNewStage05NdaCoverage["suppliers"];
  templates: readonly string[];
  executedFiles: readonly SourceNewFileRow[];
}) {
  const router = useRouter();
  const [method, setMethod] = useState<"wet_ink" | "e_signature_out_of_band">("wet_ink");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    const signedAt = String(form.get("executedAt") ?? "");
    const parsed = Date.parse(signedAt);
    if (!Number.isFinite(parsed)) {
      setMessage("Enter a valid signature date and time.");
      return;
    }
    form.set("executedAt", new Date(parsed).toISOString());
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/v1/source/${encodeURIComponent(eventId)}/nda/executed`, {
        method: "POST", body: form,
      });
      const result = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) {
        setMessage(`NDA not recorded: ${result.error ?? "authority unavailable"}.`);
        return;
      }
      setMessage("Executed NDA recorded. Refreshing governed coverage.");
      router.refresh();
    } catch {
      setMessage("NDA not recorded: the authority service is unavailable.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="snw-scorecard-form snw-nda-capture" onSubmit={submit} aria-label="Record executed NDA">
      <h4>Record executed NDA</h4>
      <label>Accepted supplier
        <select name="vendorId" required>
          {uncovered.map((supplier) => <option key={supplier.legalEntityId} value={supplier.legalEntityId}>{supplier.legalName}</option>)}
        </select>
      </label>
      <label>Uploaded signed file
        <select name="artifactId" required>
          {executedFiles.map((file) => <option key={file.id} value={file.id}>{file.title}</option>)}
        </select>
      </label>
      <label>Published template
        <select name="templateVersion" required>
          {templates.map((version) => <option key={version} value={version}>{version}</option>)}
        </select>
      </label>
      <label>Effective from<input name="effectiveFrom" type="date" required /></label>
      <label>Effective to<input name="effectiveTo" type="date" /></label>
      <label>Signed at<input name="executedAt" type="datetime-local" required /></label>
      <label>Signature method
        <select name="signatureMethod" value={method} onChange={(event) => setMethod(event.target.value as typeof method)}>
          <option value="wet_ink">Wet ink</option>
          <option value="e_signature_out_of_band">E-signature, completed elsewhere</option>
        </select>
      </label>
      <label>Supplier signatory<input name="supplierSignatoryName" required minLength={2} /></label>
      <label>Buyer signatory<input name="buyerSignatoryName" required minLength={2} /></label>
      {method === "wet_ink" ? (
        <label>Private signed-evidence reference<input name="privateEvidenceRef" required minLength={3} /></label>
      ) : (
        <label>Completion certificate SHA-256<input name="certificateSha256" required pattern="[0-9a-fA-F]{64}" /></label>
      )}
      <label className="snw-nda-capture-wide">Evidence reference and review rationale
        <input name="evidenceReference" required minLength={12} maxLength={2000} />
      </label>
      <button className="snw-primary" type="submit" disabled={busy}>{busy ? "Recording..." : "Record executed NDA"}</button>
      {message && <p className="snw-nda-capture-wide" role="status">{message}</p>}
    </form>
  );
}
