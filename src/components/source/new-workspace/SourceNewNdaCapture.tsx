"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { SourceNewFileRow } from "./SourceNewFiles";
import type { SourceNewStage05NdaCoverage } from "@/lib/source/new-workspace/stage05-nda-coverage";
import { canonicalTenantKey } from "@/lib/tenant/aliases";

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
  const syntheticLab = canonicalTenantKey(clientKey) === "meridian-health";
  if (templates.length === 0) {
    return syntheticLab
      ? <SyntheticTemplatePublication eventId={eventId} files={files} />
      : <p className="snw-note">Legal must publish an NDA template version before an executed document can be recorded.</p>;
  }
  const executedFiles = files.filter((file) =>
    file.artifactGroup === "upload" && file.artifactType === "nda_executed" &&
    file.lifecycleState === "current" && Boolean(file.blobSha256));
  const sendControl = syntheticLab ?
    <SyntheticNdaSendControl eventId={eventId} uncovered={uncovered} templates={templates} /> : null;
  if (executedFiles.length === 0) {
    return <>{sendControl}<p className="snw-note">Upload the executed NDA through this event&apos;s File Cabinet before recording its signature evidence.</p></>;
  }

  return <>{sendControl}<ReadyNdaForm eventId={eventId} uncovered={uncovered} templates={templates} executedFiles={executedFiles} /></>;
}

type OperatorSupplier = {
  vendorId: string;
  contactAuthorityId: string | null;
  contactName: string | null;
  envelopeId: string | null;
  envelopeStatus: "created" | "sent" | "viewed" | "completed" | "declined" | null;
  envelopeTemplateVersion: string | null;
};

type OperatorStatus = { available: boolean; fallback: "upload"; suppliers: OperatorSupplier[] };

function SyntheticNdaSendControl({ eventId, uncovered, templates }: {
  eventId: string;
  uncovered: SourceNewStage05NdaCoverage["suppliers"];
  templates: readonly string[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState<OperatorStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyVendor, setBusyVendor] = useState<string | null>(null);
  const [selectedVersions, setSelectedVersions] = useState<Record<string, string>>({});
  const [confirmed, setConfirmed] = useState<Record<string, boolean>>({});
  const [sentVendors, setSentVendors] = useState<Set<string>>(() => new Set());
  const [message, setMessage] = useState<string | null>(null);

  const refreshStatus = useCallback(async (signal?: AbortSignal) => {
    const response = await fetch(`/api/v1/source/${encodeURIComponent(eventId)}/nda/esign/status`, {
      cache: "no-store", signal,
    });
    if (!response.ok) throw new Error("status_unavailable");
    const next = await response.json() as OperatorStatus;
    if (typeof next.available !== "boolean" || !Array.isArray(next.suppliers)) {
      throw new Error("status_unavailable");
    }
    setStatus(next);
    setError(null);
  }, [eventId]);

  useEffect(() => {
    const controller = new AbortController();
    void refreshStatus(controller.signal).catch(() => {
      if (!controller.signal.aborted) {
        setStatus(null);
        setError("NDA signing status is unavailable. No send can proceed.");
      }
    });
    return () => controller.abort();
  }, [refreshStatus]);

  async function send(event: FormEvent<HTMLFormElement>, supplier: SourceNewStage05NdaCoverage["suppliers"][number]) {
    event.preventDefault();
    const current = status?.suppliers.find((row) => row.vendorId === supplier.legalEntityId);
    const templateVersion = selectedVersions[supplier.legalEntityId];
    if (!status?.available || !current?.contactAuthorityId || current.envelopeStatus ||
        !templateVersion || !confirmed[supplier.legalEntityId] ||
        busyVendor || sentVendors.has(supplier.legalEntityId)) return;

    const body = new FormData();
    body.set("vendorId", supplier.legalEntityId);
    body.set("contactAuthorityId", current.contactAuthorityId);
    body.set("templateVersion", templateVersion);
    body.set("deliveryMode", "email");
    body.set("acknowledged", "on");
    setBusyVendor(supplier.legalEntityId);
    setMessage(null);
    try {
      const response = await fetch(`/api/v1/source/${encodeURIComponent(eventId)}/nda/esign/send`, {
        method: "POST", body,
      });
      const result = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) {
        setStatus(null);
        setError(`Send was not confirmed (${result.error ?? "authority unavailable"}). Reconcile the provider envelope before trying again.`);
        return;
      }
      setSentVendors((previous) => new Set(previous).add(supplier.legalEntityId));
      setMessage("Sent to the internal test inbox. Executed NDA review is still required.");
      try {
        await refreshStatus();
      } catch {
        setStatus(null);
        setError("The send succeeded, but envelope status readback is unavailable. Do not retry until it is reconciled.");
      }
      router.refresh();
    } catch {
      setStatus(null);
      setError("The send outcome is uncertain. Reconcile the provider envelope before trying again.");
    } finally {
      setBusyVendor(null);
    }
  }

  return <div className="snw-nda-capture" aria-label="Synthetic NDA signing">
    <h4>Synthetic NDA signing</h4>
    {error && <p role="alert">{error}</p>}
    {status && !status.available && <p className="snw-note">Demo signing is unavailable; use the upload path.</p>}
    <div className="snw-nda-suppliers" role="list">
      {uncovered.map((supplier) => {
        const current = status?.suppliers.find((row) => row.vendorId === supplier.legalEntityId);
        const sent = sentVendors.has(supplier.legalEntityId);
        const ready = Boolean(status?.available && current?.contactAuthorityId &&
          !current.envelopeStatus && selectedVersions[supplier.legalEntityId] &&
          confirmed[supplier.legalEntityId] && !busyVendor && !sent);
        const stateNote = !status ? "Checking signing authority" :
          !status.available ? "Demo signing is unavailable" :
          !current?.contactAuthorityId ? "Approved active contact required" :
          current.envelopeStatus === "completed" ? "Completed envelope; executed NDA review is still required" :
          current.envelopeStatus === "declined" ? "Declined envelope; not covered, review before retry" :
          current.envelopeStatus === "created" ? "Draft envelope needs reconciliation before another send" :
          current.envelopeStatus ? "Sent for signature; not NDA-covered" :
          "Ready to send to the internal test inbox";
        return <article key={supplier.legalEntityId} role="listitem">
          <strong>{supplier.legalName}</strong>
          <p>{stateNote}</p>
          <form onSubmit={(event) => send(event, supplier)}>
            <label>Supplier-specific template
              <select value={selectedVersions[supplier.legalEntityId] ?? ""}
                onChange={(event) => setSelectedVersions((previous) => ({
                  ...previous, [supplier.legalEntityId]: event.target.value,
                }))}>
                <option value="">Select a version</option>
                {templates.map((version) => <option key={version} value={version}>{version}</option>)}
              </select>
            </label>
            <label><input type="checkbox" checked={confirmed[supplier.legalEntityId] ?? false}
              onChange={(event) => setConfirmed((previous) => ({
                ...previous, [supplier.legalEntityId]: event.target.checked,
              }))} /> I confirm this synthetic NDA goes only to the internal test inbox.</label>
            <button className="snw-primary" type="submit" disabled={!ready}
              aria-label={`Send NDA for ${supplier.legalName}`}>
              {busyVendor === supplier.legalEntityId ? "Sending..." : "Send for demo signature"}
            </button>
          </form>
        </article>;
      })}
    </div>
    {message && <p role="status">{message}</p>}
  </div>;
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
