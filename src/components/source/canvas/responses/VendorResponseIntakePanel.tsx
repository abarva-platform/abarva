"use client";

import { useMemo, useState, type CSSProperties } from "react";

import type { SourceShellArtifactLike } from "@/lib/source/source-event-shell-v2";
import type { SourceEventEvidenceCurrentState } from "@/lib/source/canvas-substrate";
import {
  buildVendorResponseArtifactKind,
  buildVendorResponseIntakeRows,
  type VendorResponseIntakeSupplier,
} from "@/lib/source/vendor-response-intake";
import { CANVAS } from "../canvas-tokens";

interface VendorResponseIntakePanelProps {
  eventId: string;
  suppliers: readonly VendorResponseIntakeSupplier[];
  artifacts: readonly SourceShellArtifactLike[];
  responseProposalAvailabilityState: SourceEventEvidenceCurrentState | null;
  onUploaded?: () => void;
}

interface UploadResult {
  artifact?: SourceShellArtifactLike;
  detail?: string;
  error?: string;
}

export function VendorResponseIntakePanel({
  eventId,
  suppliers,
  artifacts,
  responseProposalAvailabilityState,
  onUploaded,
}: VendorResponseIntakePanelProps) {
  const [supplierId, setSupplierId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedArtifact, setUploadedArtifact] =
    useState<SourceShellArtifactLike | null>(null);
  const selectedSupplier = suppliers.find(
    (supplier) => supplier.vendorId === supplierId,
  );
  const rows = useMemo(
    () =>
      buildVendorResponseIntakeRows({
        suppliers,
        artifacts: uploadedArtifact
          ? [uploadedArtifact, ...artifacts]
          : artifacts,
        availabilityState: responseProposalAvailabilityState,
      }),
    [
      artifacts,
      responseProposalAvailabilityState,
      suppliers,
      uploadedArtifact,
    ],
  );

  async function uploadResponseWorkbook() {
    if (!file || !selectedSupplier || uploading) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file, file.name);
      formData.append("stageKey", "responses");
      formData.append("artifactFamily", "proposal");
      formData.append(
        "artifactKind",
        buildVendorResponseArtifactKind(selectedSupplier.vendorId),
      );
      formData.append("dataClassification", "Confidential");
      formData.append("vendorId", selectedSupplier.vendorId);
      formData.append("vendorName", selectedSupplier.vendorName);

      const response = await fetch(
        `/api/v1/source/${encodeURIComponent(eventId)}/artifacts/upload`,
        { method: "POST", body: formData, credentials: "include" },
      );
      const payload = (await response
        .json()
        .catch(() => null)) as UploadResult | null;
      if (!response.ok || !payload?.artifact) {
        throw new Error(
          payload?.detail ??
            payload?.error ??
            `Upload failed (${response.status}).`,
        );
      }
      setUploadedArtifact(payload.artifact);
      setFile(null);
      onUploaded?.();
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Upload failed.",
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <section
      aria-label="Vendor response workbook intake"
      data-testid="source-vendor-response-intake"
      style={PANEL}
    >
      <div>
        <div style={EYEBROW}>Response intake</div>
        <h3 style={TITLE}>Register each supplier response</h3>
        <p style={COPY}>
          Select an event supplier, then upload the received response. The file
          is stored and parsed through the governed artifact path. Upload does
          not record availability review, formal approval, acceptance,
          evaluation, or a commercial decision. Availability is the governed
          stage requirement; it does not individually approve a supplier file.
        </p>
      </div>

      {suppliers.length === 0 ? (
        <div style={EMPTY}>
          No event suppliers are available for response intake. Add a governed
          supplier candidate before registering a response.
        </div>
      ) : (
        <div style={FORM}>
          <label style={FIELD}>
            <span style={LABEL}>Supplier</span>
            <select
              aria-label="Supplier"
              value={supplierId}
              onChange={(event) => {
                setSupplierId(event.currentTarget.value);
                setError(null);
              }}
              style={CONTROL}
            >
              <option value="">Select supplier</option>
              {suppliers.map((supplier) => (
                <option key={supplier.vendorId} value={supplier.vendorId}>
                  {supplier.vendorName}
                </option>
              ))}
            </select>
          </label>
          <label style={FIELD}>
            <span style={LABEL}>Response workbook</span>
            <input
              aria-label="Response workbook"
              type="file"
              accept=".docx,.pdf,.xlsx,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.presentationml.presentation"
              onChange={(event) => {
                setFile(event.currentTarget.files?.[0] ?? null);
                setError(null);
              }}
              style={FILE_CONTROL}
            />
          </label>
          <button
            type="button"
            disabled={!selectedSupplier || !file || uploading}
            onClick={uploadResponseWorkbook}
            style={{
              ...BUTTON,
              opacity: !selectedSupplier || !file || uploading ? 0.55 : 1,
            }}
          >
            {uploading ? "Uploading..." : "Upload response workbook"}
          </button>
        </div>
      )}

      {error ? (
        <div role="alert" style={ERROR}>
          {error}
        </div>
      ) : null}

      <div style={TABLE_WRAP}>
        <table style={TABLE}>
          <thead>
            <tr>
              <th style={TH}>Supplier</th>
              <th style={TH}>Upload</th>
              <th style={TH}>Parse</th>
              <th style={TH}>Availability</th>
              <th style={TH}>Formal approval</th>
              <th style={TH}>Next action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.vendorId}
                data-testid={`response-intake-${row.vendorId}`}
              >
                <td style={TD_STRONG}>{row.vendorName}</td>
                <td style={TD}>{row.uploadLabel}</td>
                <td style={TD}>{row.parseLabel}</td>
                <td style={TD}>{row.availabilityLabel}</td>
                <td style={TD}>{row.formalApprovalLabel}</td>
                <td style={TD}>{row.nextAction}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const PANEL: CSSProperties = {
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: CANVAS.CARD,
  padding: 16,
  display: "grid",
  gap: 14,
};
const EYEBROW: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: CANVAS.INK_MUTED,
  fontWeight: 700,
};
const TITLE: CSSProperties = {
  margin: "5px 0 0",
  fontFamily: CANVAS.SERIF,
  fontSize: 22,
  lineHeight: 1.1,
  color: CANVAS.INK,
};
const COPY: CSSProperties = {
  margin: "7px 0 0",
  color: CANVAS.INK_SOFT,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.5,
  maxWidth: 820,
};
const FORM: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  alignItems: "end",
  gap: 12,
};
const FIELD: CSSProperties = { display: "grid", gap: 6 };
const LABEL: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: CANVAS.INK_MUTED,
  fontWeight: 700,
};
const CONTROL: CSSProperties = {
  minHeight: 38,
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  padding: "0 10px",
  background: CANVAS.CARD,
  color: CANVAS.INK,
  fontFamily: CANVAS.SANS,
  fontSize: CANVAS.T_BODY_SMALL,
};
const FILE_CONTROL: CSSProperties = {
  minHeight: 38,
  fontFamily: CANVAS.SANS,
  fontSize: CANVAS.T_BODY_SMALL,
};
const BUTTON: CSSProperties = {
  minHeight: 38,
  border: `1px solid ${CANVAS.INK}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  padding: "0 14px",
  background: CANVAS.INK,
  color: "#fff",
  fontFamily: CANVAS.SANS,
  fontSize: CANVAS.T_BODY_SMALL,
  fontWeight: 700,
  cursor: "pointer",
};
const EMPTY: CSSProperties = {
  border: `1px dashed ${CANVAS.RULE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  padding: 12,
  color: CANVAS.INK_SOFT,
  fontSize: CANVAS.T_BODY_SMALL,
};
const ERROR: CSSProperties = {
  color: CANVAS.BLOCKED,
  fontSize: CANVAS.T_BODY_SMALL,
};
const TABLE_WRAP: CSSProperties = { overflowX: "auto", minWidth: 0 };
const TABLE: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: 840,
};
const TH: CSSProperties = {
  borderBottom: `1px solid ${CANVAS.RULE}`,
  padding: "8px 10px",
  color: CANVAS.INK_MUTED,
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  textAlign: "left",
};
const TD: CSSProperties = {
  borderBottom: `1px solid ${CANVAS.HAIRLINE}`,
  padding: 10,
  color: CANVAS.INK_SOFT,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.4,
  verticalAlign: "top",
};
const TD_STRONG: CSSProperties = {
  ...TD,
  color: CANVAS.INK,
  fontWeight: 700,
};
