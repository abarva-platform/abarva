"use client";

import { useState, type CSSProperties } from "react";

import { CANVAS } from "../canvas-tokens";

interface VendorResponsePackPanelProps {
  eventId: string;
  onUploaded?: () => void;
}

interface UploadResult {
  artifact?: {
    id: string;
    originalName: string;
    sourceFormat: string;
    parseStatus: string;
  };
  parseWarnings?: string[];
  detail?: string;
  error?: string;
}

export function VendorResponsePackPanel({
  eventId,
  onUploaded,
}: VendorResponsePackPanelProps) {
  const [vendorName, setVendorName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);

  async function uploadResponsePack() {
    if (!file || uploading) return;
    setUploading(true);
    setError(null);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("stageKey", "responses");
      formData.append("artifactCode", "d13_vendor_responses");
      formData.append("artifactFamily", "proposal");
      formData.append("artifactKind", "vendor_response_pack");
      formData.append("dataClassification", "Confidential");
      if (vendorName.trim()) formData.append("vendorName", vendorName.trim());

      const response = await fetch(
        `/api/v1/source/${encodeURIComponent(eventId)}/artifacts/upload`,
        { method: "POST", body: formData, credentials: "include" },
      );
      const payload = (await response.json().catch(() => null)) as UploadResult | null;
      if (!response.ok || !payload) {
        throw new Error(
          payload?.detail ?? payload?.error ?? `Upload failed (${response.status}).`,
        );
      }
      setResult(payload);
      setFile(null);
      onUploaded?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <section
      data-testid="source-vendor-response-pack-panel"
      aria-label="Vendor response pack intake"
      style={PANEL_STYLE}
    >
      <header style={HEADER_STYLE}>
        <div>
          <div style={EYEBROW_STYLE}>Vendor response intake</div>
          <h3 style={TITLE_STYLE}>Upload received response packs</h3>
          <p style={BODY_STYLE}>
            Store each vendor response against this event. Supported formats:
            DOCX, PDF, XLSX, and PPTX. AbarVa records the upload and parser
            status; the procurement system remains the external system of
            record for vendor delivery.
          </p>
        </div>
        <span style={BADGE_STYLE}>event scoped</span>
      </header>

      <div style={FORM_STYLE}>
        <label style={FIELD_STYLE}>
          <span style={LABEL_STYLE}>Vendor</span>
          <input
            value={vendorName}
            onChange={(event) => setVendorName(event.currentTarget.value)}
            placeholder="Vendor name"
            style={INPUT_STYLE}
          />
        </label>
        <label style={FIELD_STYLE}>
          <span style={LABEL_STYLE}>Response file</span>
          <input
            type="file"
            accept=".docx,.pdf,.xlsx,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.presentationml.presentation"
            onChange={(event) => {
              setFile(event.currentTarget.files?.[0] ?? null);
              setError(null);
              setResult(null);
            }}
            style={FILE_INPUT_STYLE}
          />
        </label>
        <button
          type="button"
          disabled={!file || uploading}
          onClick={uploadResponsePack}
          style={{
            ...PRIMARY_BUTTON_STYLE,
            opacity: !file || uploading ? 0.62 : 1,
          }}
        >
          {uploading ? "Uploading..." : "Upload response pack"}
        </button>
      </div>

      {error ? <div role="alert" style={ERROR_STYLE}>{error}</div> : null}

      {result?.artifact ? (
        <div style={SUCCESS_STYLE} data-testid="source-vendor-response-pack-success">
          Stored <strong>{result.artifact.originalName}</strong> ·{" "}
          {result.artifact.sourceFormat} · parser {result.artifact.parseStatus}
          {result.parseWarnings && result.parseWarnings.length > 0
            ? ` · ${result.parseWarnings.length} warning${result.parseWarnings.length === 1 ? "" : "s"}`
            : ""}
        </div>
      ) : null}
    </section>
  );
}

const PANEL_STYLE: CSSProperties = {
  display: "grid",
  gap: 14,
  marginTop: 16,
  padding: "16px 18px",
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: 8,
  background: "#fff",
};

const HEADER_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 16,
};

const EYEBROW_STYLE: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: 10,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: CANVAS.GRAY_DK,
};

const TITLE_STYLE: CSSProperties = {
  margin: "4px 0 6px",
  fontFamily: CANVAS.SERIF,
  fontSize: 20,
  color: CANVAS.INK,
  lineHeight: 1.2,
};

const BODY_STYLE: CSSProperties = {
  margin: 0,
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  lineHeight: 1.5,
  color: CANVAS.INK_SOFT,
};

const BADGE_STYLE: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: 10,
  letterSpacing: "0.10em",
  textTransform: "uppercase",
  color: CANVAS.GRAY_DK,
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: 999,
  padding: "5px 9px",
};

const FORM_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(180px, 1fr) minmax(220px, 1.2fr) auto",
  gap: 12,
  alignItems: "end",
};

const FIELD_STYLE: CSSProperties = {
  display: "grid",
  gap: 6,
};

const LABEL_STYLE: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: 10,
  letterSpacing: "0.10em",
  textTransform: "uppercase",
  color: CANVAS.GRAY_DK,
  fontWeight: 700,
};

const INPUT_STYLE: CSSProperties = {
  minHeight: 38,
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: 6,
  padding: "0 10px",
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  color: CANVAS.INK,
  background: "#fff",
};

const FILE_INPUT_STYLE: CSSProperties = {
  minHeight: 38,
  fontFamily: CANVAS.SANS,
  fontSize: 13,
};

const PRIMARY_BUTTON_STYLE: CSSProperties = {
  minHeight: 38,
  border: `1px solid ${CANVAS.INK}`,
  borderRadius: 999,
  padding: "0 14px",
  background: CANVAS.INK,
  color: "#fff",
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  cursor: "pointer",
};

const ERROR_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  color: CANVAS.BLOCKED,
};

const SUCCESS_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  lineHeight: 1.45,
  color: CANVAS.ACTIVE,
};
