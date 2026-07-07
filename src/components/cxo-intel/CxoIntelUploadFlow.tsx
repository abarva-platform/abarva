"use client";

import { useMemo, useState } from "react";
import type { CxoIntelBundleSchema, CxoIntelFileSchema } from "@/lib/cxo-intel/schemas";
import {
  parseCxoIntelCsv,
  validateCxoIntelCsv,
  type CxoIntelFileValidation,
} from "@/lib/cxo-intel/validators";
import { COLORS, RADIUS, TYPOGRAPHY } from "@/lib/design/design-tokens";

interface LoadedFileState {
  fileName: string;
  originalName: string;
  validation: CxoIntelFileValidation;
}

interface CxoIntelUploadFlowProps {
  bundle: CxoIntelBundleSchema;
  tenantName: string;
  clientId: string;
}

function labelStyle(color = `${COLORS.ink}99`) {
  return {
    color,
    fontFamily: TYPOGRAPHY.mono,
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  } as const;
}

function toneColor(tone: CxoIntelFileValidation["tone"]): string {
  if (tone === "green") return COLORS.mintInk;
  if (tone === "amber") return COLORS.amberInk;
  return COLORS.coralInk;
}

function statusLabel(validation: CxoIntelFileValidation | undefined): string {
  if (!validation) return "Not uploaded";
  if (validation.tone === "green") return "Ready for approval";
  if (validation.tone === "amber") return "Needs acknowledgement";
  return "Fix before approval";
}

function findSchemaForFile(bundle: CxoIntelBundleSchema, file: File): CxoIntelFileSchema | null {
  const normalized = file.name.trim().toLowerCase();
  return bundle.files.find((schema) => schema.fileName === normalized) ?? null;
}

export function CxoIntelUploadFlow({
  bundle,
  tenantName,
  clientId,
}: CxoIntelUploadFlowProps) {
  const [loadedFiles, setLoadedFiles] = useState<LoadedFileState[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadedByName = useMemo(() => {
    return new Map(loadedFiles.map((file) => [file.fileName, file]));
  }, [loadedFiles]);

  const summary = useMemo(() => {
    const uploaded = loadedFiles.length;
    const red = loadedFiles.filter((file) => file.validation.tone === "red").length;
    const amber = loadedFiles.filter((file) => file.validation.tone === "amber").length;
    const green = loadedFiles.filter((file) => file.validation.tone === "green").length;
    return { uploaded, red, amber, green };
  }, [loadedFiles]);

  async function onFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    const next = new Map(loadedFiles.map((file) => [file.fileName, file]));

    for (const file of Array.from(files)) {
      const schema = findSchemaForFile(bundle, file);
      if (!schema) {
        setError(`Ignored ${file.name}; expected one of this bundle's named CSV files.`);
        continue;
      }
      const text = await file.text();
      const parsed = parseCxoIntelCsv(text);
      next.set(schema.fileName, {
        fileName: schema.fileName,
        originalName: file.name,
        validation: validateCxoIntelCsv(schema, parsed),
      });
    }

    setLoadedFiles(Array.from(next.values()).sort((a, b) => a.fileName.localeCompare(b.fileName)));
  }

  return (
    <section
      style={{
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.md,
        background: COLORS.white,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.5fr) minmax(260px, 0.8fr)",
          gap: 0,
        }}
      >
        <div style={{ padding: 22, borderRight: `1px solid ${COLORS.ink}14` }}>
          <div style={labelStyle()}>Six-step loader</div>
          <h2
            style={{
              margin: "8px 0 6px",
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 28,
              fontWeight: 400,
              letterSpacing: 0,
            }}
          >
            {bundle.title}
          </h2>
          <p style={{ margin: 0, color: `${COLORS.ink}99`, fontSize: 13, maxWidth: 760 }}>
            {tenantName} · {bundle.ownerRole} approval · rows stay scoped to client
            {clientId ? ` ${clientId.slice(0, 8)}` : ""}. Validation runs here; commit evidence
            remains in the governed loader ledger.
          </p>

          <div
            style={{
              marginTop: 18,
              display: "grid",
              gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
              border: `1px solid ${COLORS.ink}14`,
              borderRadius: RADIUS.sm,
              overflow: "hidden",
            }}
          >
            {["Intro", "Template", "Upload", "Preview", "Validate", "Approve"].map((step, index) => (
              <div
                key={step}
                style={{
                  padding: "12px 8px",
                  minHeight: 66,
                  borderRight: index === 5 ? "none" : `1px solid ${COLORS.ink}14`,
                  background: index <= 4 ? COLORS.cream : COLORS.white,
                  textAlign: "center",
                }}
              >
                <span style={labelStyle()}>{index + 1}</span>
                <strong style={{ display: "block", marginTop: 5, fontSize: 12 }}>{step}</strong>
              </div>
            ))}
          </div>

          <label
            style={{
              display: "inline-flex",
              marginTop: 18,
              borderRadius: RADIUS.sm,
              padding: "10px 16px",
              background: COLORS.ink,
              color: COLORS.white,
              fontSize: 13,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Upload CSV files
            <input
              type="file"
              multiple
              accept=".csv,text/csv"
              onChange={(event) => void onFilesSelected(event.target.files)}
              style={{ display: "none" }}
            />
          </label>
          {error ? (
            <p style={{ margin: "10px 0 0", color: COLORS.coralInk, fontSize: 12 }}>{error}</p>
          ) : null}
        </div>

        <div style={{ padding: 22, background: COLORS.cream }}>
          <div style={labelStyle()}>Validation posture</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
            {[
              ["Uploaded", summary.uploaded],
              ["Green", summary.green],
              ["Amber", summary.amber],
              ["Red", summary.red],
            ].map(([label, value]) => (
              <div
                key={label}
                style={{
                  border: `1px solid ${COLORS.ink}14`,
                  borderRadius: RADIUS.sm,
                  background: COLORS.white,
                  padding: 12,
                }}
              >
                <span style={labelStyle()}>{label}</span>
                <strong style={{ display: "block", marginTop: 6, fontSize: 24 }}>{value}</strong>
              </div>
            ))}
          </div>
          <a
            href="/admin/context-layer/approval-queue"
            style={{
              display: "inline-block",
              marginTop: 14,
              color: COLORS.ink,
              fontSize: 12,
              fontWeight: 800,
              textDecoration: "underline",
              textUnderlineOffset: 3,
            }}
          >
            Open governed approval queue
          </a>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: COLORS.cream }}>
              {["File", "Expected", "Required headers", "Move unlocks", "Status"].map((header) => (
                <th
                  key={header}
                  style={{
                    ...labelStyle(),
                    textAlign: "left",
                    padding: "12px 14px",
                    borderTop: `1px solid ${COLORS.ink}14`,
                    borderBottom: `1px solid ${COLORS.ink}14`,
                  }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bundle.files.map((schema, index) => {
              const loaded = loadedByName.get(schema.fileName);
              const validation = loaded?.validation;
              const accent = validation ? toneColor(validation.tone) : `${COLORS.ink}66`;
              return (
                <tr key={schema.fileName}>
                  <td style={{ padding: 14, borderBottom: `1px solid ${COLORS.ink}10` }}>
                    <strong style={{ display: "block" }}>{schema.fileName}</strong>
                    <span style={{ color: `${COLORS.ink}88`, fontSize: 12 }}>{schema.purpose}</span>
                  </td>
                  <td style={{ padding: 14, borderBottom: `1px solid ${COLORS.ink}10` }}>
                    {schema.expectedRows}
                  </td>
                  <td style={{ padding: 14, borderBottom: `1px solid ${COLORS.ink}10`, maxWidth: 360 }}>
                    <span style={{ color: `${COLORS.ink}99`, fontSize: 12 }}>
                      {schema.requiredColumns.join(", ")}
                    </span>
                  </td>
                  <td style={{ padding: 14, borderBottom: `1px solid ${COLORS.ink}10` }}>
                    {schema.moveUnlocks.join(" · ")}
                  </td>
                  <td
                    style={{
                      padding: 14,
                      borderBottom:
                        index === bundle.files.length - 1 ? "none" : `1px solid ${COLORS.ink}10`,
                      minWidth: 220,
                    }}
                  >
                    <strong style={{ color: accent }}>{statusLabel(validation)}</strong>
                    {validation ? (
                      <span style={{ display: "block", color: `${COLORS.ink}88`, fontSize: 12 }}>
                        {validation.rowCount} rows · {validation.greenRows} green ·{" "}
                        {validation.amberRows} amber · {validation.redRows} red
                      </span>
                    ) : null}
                    {validation?.issues.length ? (
                      <ul style={{ margin: "6px 0 0", paddingLeft: 16, color: `${COLORS.ink}88`, fontSize: 11 }}>
                        {validation.issues.slice(0, 3).map((issue) => (
                          <li key={issue}>{issue}</li>
                        ))}
                      </ul>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
