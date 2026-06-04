"use client";

import { useState, type FormEvent } from "react";

import { PILOT_UPLOAD_ATTESTATION_VERSION } from "@/lib/context-ingestion/upload-attestation";

type CorpusImportResult = {
  ok: boolean;
  mode?: "validate_only" | "commit";
  importId?: string;
  rowsParsed?: number;
  patternsPrepared?: number;
  edgesPrepared?: number;
  verticals?: string[];
  errors?: Array<{ line: number; field: string; message: string }>;
  warnings?: Array<{ line: number; field: string; message: string }>;
  persistence?: {
    status: string;
    patternsUpserted: number;
    edgesUpserted: number;
    ingestionRunRecorded: boolean;
    detail: string;
  };
  detail?: string;
};

interface CorpusJsonlImportConnectorProps {
  clientId: string;
  tenantName: string;
}

const inputStyle = {
  border: "1px solid #d8d2c4",
  borderRadius: 6,
  padding: "9px 10px",
  background: "#fff",
  color: "#171717",
  fontFamily: "DM Sans, sans-serif",
};

export function CorpusJsonlImportConnector({
  clientId,
  tenantName,
}: CorpusJsonlImportConnectorProps) {
  const [file, setFile] = useState<File | null>(null);
  const [defaultVertical, setDefaultVertical] = useState("healthcare_provider");
  const [commitEnabled, setCommitEnabled] = useState(false);
  const [attestationAccepted, setAttestationAccepted] = useState(false);
  const [attestationNote, setAttestationNote] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<CorpusImportResult | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;
    setPending(true);
    setResult(null);

    const formData = new FormData();
    formData.set("clientId", clientId);
    formData.set("file", file);
    formData.set("defaultVertical", defaultVertical);
    formData.set("commitMode", commitEnabled ? "commit" : "validate_only");
    formData.set("dataClassification", "confidential");
    formData.set(
      "operatorAttestationVersion",
      PILOT_UPLOAD_ATTESTATION_VERSION,
    );
    formData.set("operatorAttestationAccepted", String(attestationAccepted));
    formData.set("operatorDataAuthorityConfirmed", String(attestationAccepted));
    formData.set("operatorDataUseConfirmed", String(attestationAccepted));
    formData.set("operatorSensitiveDataConfirmed", String(attestationAccepted));
    if (attestationNote.trim()) {
      formData.set("operatorAttestationNote", attestationNote.trim());
    }

    try {
      const response = await fetch("/api/admin/context-layer/corpus-import", {
        method: "POST",
        body: formData,
      });
      setResult((await response.json()) as CorpusImportResult);
    } catch (error) {
      setResult({
        ok: false,
        detail: error instanceof Error ? error.message : "Corpus import failed",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <section
      style={{
        background: "#fff",
        border: "1px solid #d8d2c4",
        borderRadius: 8,
        padding: 18,
        fontFamily: "DM Sans, sans-serif",
        display: "grid",
        gap: 14,
      }}
    >
      <div>
        <h2 style={{ fontFamily: "Georgia, serif", fontSize: 24, margin: 0 }}>
          Import governed corpus JSONL
        </h2>
        <p style={{ color: "#514c43", margin: "6px 0 0", lineHeight: 1.5 }}>
          Validate and commit authored global pattern corpus files through the
          admin loader. The import keeps tenant operator audit evidence for{" "}
          {tenantName} while writing only anonymized genome patterns.
        </p>
      </div>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <div
          style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 12 }}
        >
          <label style={{ display: "grid", gap: 6 }}>
            <span>JSONL corpus file</span>
            <input
              style={inputStyle}
              type="file"
              accept=".jsonl,application/x-ndjson,application/jsonl"
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                setResult(null);
              }}
            />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span>Default vertical</span>
            <select
              style={inputStyle}
              value={defaultVertical}
              onChange={(event) => setDefaultVertical(event.target.value)}
            >
              <option value="healthcare_provider">Healthcare provider</option>
              <option value="cross_industry">Cross industry</option>
              <option value="retail">Retail</option>
              <option value="airline">Airline</option>
              <option value="banking">Banking</option>
              <option value="medtech">Medtech</option>
            </select>
          </label>
        </div>

        <fieldset
          style={{
            border: "1px solid #d8d2c4",
            borderRadius: 6,
            padding: 12,
            background: "#fffaf0",
            display: "grid",
            gap: 10,
          }}
        >
          <legend>Corpus import controls</legend>
          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              lineHeight: 1.5,
            }}
          >
            <input
              type="checkbox"
              checked={commitEnabled}
              onChange={(event) => setCommitEnabled(event.target.checked)}
              style={{ marginTop: 4 }}
            />
            <span>
              Commit valid rows to the governed genome corpus. Leave unchecked
              to run validation only.
            </span>
          </label>
          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              lineHeight: 1.5,
            }}
          >
            <input
              type="checkbox"
              checked={attestationAccepted}
              onChange={(event) => setAttestationAccepted(event.target.checked)}
              style={{ marginTop: 4 }}
            />
            <span>
              I have authority to import this authored corpus, it is anonymized
              and suitable for the global pattern layer, and I understand the
              load will be audit-recorded.
            </span>
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span>Attestation note</span>
            <textarea
              style={{ ...inputStyle, minHeight: 72 }}
              value={attestationNote}
              onChange={(event) => setAttestationNote(event.target.value)}
              placeholder="Optional approval, source brief, or data-load ticket"
            />
          </label>
          <p style={{ color: "#6b665c", margin: 0, lineHeight: 1.45 }}>
            Version {PILOT_UPLOAD_ATTESTATION_VERSION}. Validation returns row
            counts, warnings, and schema errors without exposing file contents.
          </p>
        </fieldset>

        <div>
          <button
            type="submit"
            disabled={!file || pending || !attestationAccepted}
            style={{
              border: "1px solid #171717",
              borderRadius: 6,
              padding: "10px 14px",
              background:
                pending || !attestationAccepted ? "#d8d2c4" : "#171717",
              color: pending || !attestationAccepted ? "#514c43" : "#fff",
              fontFamily: "DM Sans, sans-serif",
              cursor:
                !file || pending || !attestationAccepted
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {pending
              ? commitEnabled
                ? "Committing corpus..."
                : "Validating corpus..."
              : !attestationAccepted
                ? "Accept attestation"
                : commitEnabled
                  ? "Commit corpus import"
                  : "Validate corpus JSONL"}
          </button>
        </div>
      </form>

      {result && (
        <section
          aria-label="Corpus import result"
          style={{
            border: `1px solid ${result.ok ? "#9dbb9f" : "#c89875"}`,
            background: result.ok ? "#F4F8F1" : "#FFF3EA",
            borderRadius: 6,
            padding: 12,
            display: "grid",
            gap: 8,
          }}
        >
          <strong>{result.ok ? "Corpus import ready" : "Corpus import needs attention"}</strong>
          {result.detail && <span>{result.detail}</span>}
          {result.persistence?.detail && <span>{result.persistence.detail}</span>}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <span>Rows: {result.rowsParsed ?? 0}</span>
            <span>Patterns: {result.patternsPrepared ?? 0}</span>
            <span>Edges: {result.edgesPrepared ?? 0}</span>
            <span>Mode: {result.mode ?? "unknown"}</span>
          </div>
          {(result.verticals?.length ?? 0) > 0 && (
            <span>Verticals: {result.verticals?.join(", ")}</span>
          )}
          {(result.errors?.length ?? 0) > 0 && (
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {result.errors?.slice(0, 5).map((issue) => (
                <li key={`error-${issue.line}-${issue.field}`}>
                  Line {issue.line}, {issue.field}: {issue.message}
                </li>
              ))}
            </ul>
          )}
          {(result.warnings?.length ?? 0) > 0 && (
            <ul style={{ margin: 0, paddingLeft: 18, color: "#6b665c" }}>
              {result.warnings?.slice(0, 5).map((issue) => (
                <li key={`warning-${issue.line}-${issue.field}`}>
                  Warning line {issue.line}, {issue.field}: {issue.message}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </section>
  );
}
