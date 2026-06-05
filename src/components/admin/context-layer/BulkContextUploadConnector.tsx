"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";

import { PILOT_UPLOAD_ATTESTATION_VERSION } from "@/lib/context-ingestion/upload-attestation";

interface BulkContextUploadConnectorProps {
  clientId: string;
  tenantName: string;
}

type BulkResult = {
  ok?: boolean;
  detail?: string;
  error?: string;
  mode?: string;
  filesProcessed?: number;
  rowsParsed?: number;
  chunksQueued?: number;
  blobBucket?: string;
  persistence?: {
    status: string;
    detail: string;
  };
  results?: Array<{
    fileName: string;
    templateId: string;
    blob: {
      bucket: string;
      path: string;
      staged: boolean;
    };
    loadResult?: {
      rowsParsed: number;
      chunksQueued: number;
      persistence: { status: string };
    } | null;
  }>;
};

const inputStyle = {
  border: "1px solid #d8d2c4",
  borderRadius: 6,
  padding: "9px 10px",
  background: "#fff",
  color: "#171717",
  fontFamily: "DM Sans, sans-serif",
};

const defaultManifest = JSON.stringify(
  {
    loadName: "meridian-phase-0-gap-load",
    defaultDataClassification: "confidential_business",
    files: [
      {
        path: "enterprise-profile.yaml",
        templateId: "enterprise-profile",
      },
      {
        path: "hl7-fhir-integration-topology.json",
        templateId: "hl7-fhir-integration-topology",
      },
    ],
  },
  null,
  2,
);

export function BulkContextUploadConnector({
  clientId,
  tenantName,
}: BulkContextUploadConnectorProps) {
  const [manifestJson, setManifestJson] = useState(defaultManifest);
  const [files, setFiles] = useState<File[]>([]);
  const [mode, setMode] = useState<"validate_only" | "stage_and_process">(
    "validate_only",
  );
  const [attestationAccepted, setAttestationAccepted] = useState(false);
  const [attestationNote, setAttestationNote] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<BulkResult | null>(null);

  function onFilesChange(event: ChangeEvent<HTMLInputElement>) {
    setFiles(Array.from(event.target.files ?? []));
    setResult(null);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setResult(null);
    const formData = new FormData();
    formData.set("clientId", clientId);
    formData.set("manifestJson", manifestJson);
    formData.set("mode", mode);
    formData.set(
      "operatorAttestationVersion",
      PILOT_UPLOAD_ATTESTATION_VERSION,
    );
    formData.set("operatorAttestationAccepted", String(attestationAccepted));
    formData.set("operatorDataAuthorityConfirmed", String(attestationAccepted));
    formData.set("operatorDataUseConfirmed", String(attestationAccepted));
    formData.set("operatorSensitiveDataConfirmed", String(attestationAccepted));
    if (attestationNote.trim())
      formData.set("operatorAttestationNote", attestationNote.trim());
    for (const file of files) formData.append("files", file);

    try {
      const response = await fetch("/api/admin/context-layer/bulk-upload", {
        method: "POST",
        body: formData,
      });
      setResult((await response.json()) as BulkResult);
    } catch (error) {
      setResult({
        ok: false,
        detail: error instanceof Error ? error.message : "Bulk upload failed",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <section
      style={{
        background: "#fffdf8",
        border: "1px solid #d8d2c4",
        borderRadius: 8,
        padding: 18,
        fontFamily: "DM Sans, sans-serif",
        display: "grid",
        gap: 14,
      }}
    >
      <div>
        <p
          style={{
            margin: "0 0 6px",
            color: "#6f7480",
            fontSize: 12,
            letterSpacing: 0,
            textTransform: "uppercase",
          }}
        >
          Bulk load
        </p>
        <h2 style={{ margin: 0, fontSize: 22 }}>
          Stage files to Azure Blob and process through the loader
        </h2>
        <p style={{ margin: "8px 0 0", color: "#5f6673", lineHeight: 1.55 }}>
          Upload a manifest plus matching template files for {tenantName}. Use
          validation first; commit mode stages each file to Azure Blob and then
          writes tenant context through the governed loader.
        </p>
      </div>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 700 }}>Manifest JSON</span>
          <textarea
            value={manifestJson}
            onChange={(event) => setManifestJson(event.target.value)}
            rows={12}
            spellCheck={false}
            style={{
              ...inputStyle,
              minHeight: 220,
              fontFamily:
                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
              fontSize: 13,
              lineHeight: 1.45,
            }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 700 }}>Files referenced by manifest</span>
          <input
            type="file"
            multiple
            accept=".csv,.json,.jsonl,.yaml,.yml"
            onChange={onFilesChange}
            style={inputStyle}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 700 }}>Run mode</span>
          <select
            value={mode}
            onChange={(event) =>
              setMode(event.target.value as "validate_only" | "stage_and_process")
            }
            style={inputStyle}
          >
            <option value="validate_only">Validate only</option>
            <option value="stage_and_process">
              Stage to Azure Blob and process now
            </option>
          </select>
        </label>

        <label
          style={{
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
            padding: 12,
            border: "1px solid #d8d2c4",
            borderRadius: 6,
            background: "#fbf6eb",
          }}
        >
          <input
            type="checkbox"
            checked={attestationAccepted}
            onChange={(event) => setAttestationAccepted(event.target.checked)}
            style={{ marginTop: 3 }}
          />
          <span>
            I have authority to load this tenant data, I understand it will be
            processed as pilot context for {tenantName}, and I have reviewed
            the files for PHI, PII, payment-card, and other restricted data.
          </span>
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 700 }}>Attestation note</span>
          <input
            value={attestationNote}
            onChange={(event) => setAttestationNote(event.target.value)}
            placeholder="Optional approval, ticket, or source package reference"
            style={inputStyle}
          />
        </label>

        <button
          disabled={!attestationAccepted || files.length === 0 || pending}
          type="submit"
          style={{
            ...inputStyle,
            width: "fit-content",
            background:
              !attestationAccepted || files.length === 0 || pending
                ? "#c9c2b4"
                : "#171717",
            color: "#fff",
            cursor:
              !attestationAccepted || files.length === 0 || pending
                ? "not-allowed"
                : "pointer",
            fontWeight: 800,
          }}
        >
          {pending ? "Running bulk load..." : "Run bulk load"}
        </button>
      </form>

      {result ? (
        <div
          style={{
            border: "1px solid #d8d2c4",
            borderRadius: 6,
            padding: 12,
            background: result.ok ? "#eff8ef" : "#fff1f1",
          }}
        >
          <p style={{ margin: 0, fontWeight: 800 }}>
            {result.ok ? "Bulk load accepted" : "Bulk load blocked"}
          </p>
          <p style={{ margin: "6px 0 0", color: "#4f5663" }}>
            {result.persistence?.detail ?? result.detail ?? result.error}
          </p>
          {typeof result.filesProcessed === "number" ? (
            <p style={{ margin: "8px 0 0" }}>
              Files {result.filesProcessed} · Rows {result.rowsParsed ?? 0} ·
              Chunks {result.chunksQueued ?? 0} · Bucket{" "}
              {result.blobBucket ?? "not staged"}
            </p>
          ) : null}
          {result.results && result.results.length > 0 ? (
            <ul style={{ margin: "10px 0 0", paddingLeft: 18 }}>
              {result.results.map((item) => (
                <li key={item.fileName}>
                  {item.fileName} · {item.templateId} ·{" "}
                  {item.blob.staged ? item.blob.path : "validated only"}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
