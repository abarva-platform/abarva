"use client";

import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";

import {
  MERIDIAN_HEALTHCARE_CONTEXT_TEMPLATES,
  PHS_CONTEXT_TEMPLATES,
  getTemplatesForTenant,
} from "@/lib/context-ingestion/template-registry";
import { buildTemplateSchemaPreflight } from "@/lib/context-ingestion/schema-preflight";
import { PILOT_UPLOAD_ATTESTATION_VERSION } from "@/lib/context-ingestion/upload-attestation";
import { RATE_CARD_TEMPLATE_DEFINITIONS } from "@/lib/programs/expert-kernel/rate-card/rate-card-templates";

type UploadResult = {
  ok: boolean;
  uploadId?: string;
  rowsParsed?: number;
  chunksQueued?: number;
  mapping?: {
    templateId: string;
    sourceRecordIdColumn: string | null;
    titleColumn: string | null;
    textColumns: string[];
  };
  embeddingHandoff?: {
    command: string;
    searchableWhen: string;
  };
  persistence?: {
    status: string;
    detail: string;
  };
  evidenceLedger?: {
    status: string;
    rowsRecorded: number;
    evidenceIds: string[];
    detail: string;
  };
  enterpriseContextPromotion?: {
    status: string;
    recordsPromoted: number;
    factsPromoted: number;
    factsSuperseded: number;
    sourceFileId: string | null;
    detail: string;
  };
  mode?: string;
  readyForCommit?: boolean;
  validation?: {
    valid: boolean;
    errors: Array<{ field: string; message: string; rowIndex: number }>;
    warnings: Array<{ field: string; message: string; rowIndex: number }>;
  };
  detail?: string;
};

interface CsvUploadConnectorProps {
  clientId: string;
  tenantKey: string;
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

const workflowSteps = [
  {
    label: "Choose lane",
    detail: "Confirm this file updates enterprise context, not event evidence.",
  },
  {
    label: "Parse",
    detail: "AbarVa reads the shape, template, source rows, and citations.",
  },
  {
    label: "Promote",
    detail: "Approved rows update active facts; old facts are superseded.",
  },
  {
    label: "Retrieve",
    detail: "Embeddings make the latest approved context usable by agents.",
  },
];

const contextReceiptSteps = [
  "Source file preserved with tenant, hash, attestation, and sensitivity metadata.",
  "Template and required fields checked before context promotion.",
  "Rows promoted into enterprise context records and facts.",
  "Matching active facts superseded; previous values stay auditable.",
  "Embedding handoff queued so Sentinel, Source, Moves, and Tower can retrieve the latest approved facts.",
];

const sourceEventReceiptSteps = [
  "Attach vendor responses, architecture docs, and event evidence inside the relevant Source event workspace.",
  "Event uploads create immutable artifact versions; they do not rewrite enterprise current-state facts.",
  "Generated RFPs, scorecards, and cost models cite event evidence plus approved enterprise context separately.",
];

function splitHeaderLine(line: string): string[] {
  const headers: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (char === "," && !quoted) {
      headers.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  headers.push(current.trim());
  return headers.filter(Boolean);
}

export function CsvUploadConnector({
  clientId,
  tenantKey,
  tenantName,
}: CsvUploadConnectorProps) {
  const [headers, setHeaders] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [fileFormat, setFileFormat] = useState<
    "csv" | "json" | "jsonl" | "yaml" | "unknown"
  >("unknown");
  const [templateId, setTemplateId] = useState("application-portfolio");
  const [showSpecificArea, setShowSpecificArea] = useState(false);
  const [sourceRecordIdColumn, setSourceRecordIdColumn] = useState("");
  const [titleColumn, setTitleColumn] = useState("");
  const [selectedTextColumns, setSelectedTextColumns] = useState<string[]>([]);
  const [attestationAccepted, setAttestationAccepted] = useState(false);
  const [attestationNote, setAttestationNote] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const templates = useMemo(
    () => getTemplatesForTenant(tenantKey),
    [tenantKey],
  );
  const healthcareTemplateIds = useMemo(
    () => new Set(MERIDIAN_HEALTHCARE_CONTEXT_TEMPLATES.map((item) => item.id)),
    [],
  );
  const phsTemplateIds = useMemo(
    () => new Set(PHS_CONTEXT_TEMPLATES.map((item) => item.id)),
    [],
  );
  const generalTemplates = useMemo(
    () =>
      templates.filter(
        (item) =>
          !healthcareTemplateIds.has(item.id) && !phsTemplateIds.has(item.id),
      ),
    [healthcareTemplateIds, phsTemplateIds, templates],
  );
  const healthcareTemplates = useMemo(
    () => templates.filter((item) => healthcareTemplateIds.has(item.id)),
    [healthcareTemplateIds, templates],
  );
  const phsTemplates = useMemo(
    () => templates.filter((item) => phsTemplateIds.has(item.id)),
    [phsTemplateIds, templates],
  );

  const template = useMemo(
    () => templates.find((item) => item.id === templateId) ?? templates[0],
    [templateId, templates],
  );
  const rateCardTemplate = useMemo(
    () =>
      RATE_CARD_TEMPLATE_DEFINITIONS.find((item) => item.id === templateId) ??
      null,
    [templateId],
  );
  const contextTemplate = rateCardTemplate ? null : template;
  const schemaPreflight = useMemo(
    () =>
      fileFormat === "csv" && headers.length > 0 && !rateCardTemplate
        ? buildTemplateSchemaPreflight({ templateId, headers })
        : null,
    [fileFormat, headers, rateCardTemplate, templateId],
  );
  const requiredFieldsBlocked =
    !rateCardTemplate &&
    (schemaPreflight?.missingRequiredFields.length ?? 0) > 0;

  async function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;
    setFile(nextFile);
    setResult(null);
    if (!nextFile) {
      setHeaders([]);
      setFileFormat("unknown");
      return;
    }
    const lowerName = nextFile.name.toLowerCase();
    const nextFormat = lowerName.endsWith(".csv")
      ? "csv"
      : lowerName.endsWith(".json")
        ? "json"
        : lowerName.endsWith(".jsonl")
          ? "jsonl"
          : lowerName.endsWith(".yaml") || lowerName.endsWith(".yml")
            ? "yaml"
            : "unknown";
    setFileFormat(nextFormat);
    const text = await nextFile.slice(0, 64 * 1024).text();
    if (nextFormat !== "csv") {
      setHeaders([]);
      setSourceRecordIdColumn("");
      setTitleColumn("");
      setSelectedTextColumns([]);
      return;
    }
    const firstLine =
      text.split(/\r?\n/).find((line) => line.trim() !== "") ?? "";
    const parsedHeaders = splitHeaderLine(firstLine);
    setHeaders(parsedHeaders);
    const idColumn =
      parsedHeaders.find((header) =>
        /(^|_)id$/i.test(header.replace(/[^a-z0-9]+/gi, "_")),
      ) ?? "";
    const nameColumn =
      parsedHeaders.find((header) =>
        /^(name|title|vendor_name|tool_name)$/i.test(header),
      ) ?? "";
    setSourceRecordIdColumn(idColumn);
    setTitleColumn(nameColumn);
    setSelectedTextColumns(parsedHeaders.slice(0, 8));
  }

  function toggleTextColumn(header: string) {
    setSelectedTextColumns((current) =>
      current.includes(header)
        ? current.filter((item) => item !== header)
        : [...current, header],
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;
    setPending(true);
    setResult(null);
    const formData = new FormData();
    formData.set("clientId", clientId);
    formData.set("file", file);
    formData.set("templateId", templateId);
    formData.set("dataClassification", "confidential");
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
    if (sourceRecordIdColumn)
      formData.set("sourceRecordIdColumn", sourceRecordIdColumn);
    if (titleColumn) formData.set("titleColumn", titleColumn);
    formData.set("textColumns", JSON.stringify(selectedTextColumns));
    formData.set("fieldMappings", JSON.stringify({}));
    if (schemaPreflight) {
      formData.set(
        "schemaPreflight",
        JSON.stringify({
          templateId,
          clarificationRequired: schemaPreflight.clarificationRequired,
          missingRequiredFields: schemaPreflight.missingRequiredFields,
          unknownColumns: schemaPreflight.unknownColumns,
        }),
      );
    }

    try {
      const response = await fetch("/api/admin/context-layer/csv-upload", {
        method: "POST",
        body: formData,
      });
      setResult((await response.json()) as UploadResult);
    } catch (error) {
      setResult({
        ok: false,
        detail: error instanceof Error ? error.message : "Upload failed",
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
          Add {tenantName}&apos;s data
        </h2>
        <p style={{ color: "#514c43", margin: "6px 0 0", lineHeight: 1.5 }}>
          Drop or choose a file. AbarVa will preserve it, check the tenant,
          validate the mapping, and only write context after the gates pass.
        </p>
      </div>

      <section
        aria-label="Upload destination"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
          gap: 10,
        }}
      >
        <div
          style={{
            border: "2px solid #171717",
            borderRadius: 8,
            background: "#F8F7F4",
            padding: 12,
            display: "grid",
            gap: 6,
          }}
        >
          <strong>Update enterprise context</strong>
          <span style={{ color: "#514c43", lineHeight: 1.45 }}>
            Use this lane for CMDB, org roles, ERP, integration topology,
            financial baselines, and other current-state facts. New approved
            values supersede older active facts by key.
          </span>
          <span
            style={{
              width: "fit-content",
              border: "1px solid #171717",
              borderRadius: 999,
              padding: "4px 8px",
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: 0.4,
              textTransform: "uppercase",
            }}
          >
            Selected
          </span>
        </div>
        <div
          style={{
            border: "1px solid #d8d2c4",
            borderRadius: 8,
            background: "#fff",
            padding: 12,
            display: "grid",
            gap: 6,
          }}
        >
          <strong>Attach to Source event</strong>
          <span style={{ color: "#514c43", lineHeight: 1.45 }}>
            Use the Source event workspace for vendor responses, RFP exhibits,
            BAFO letters, and event-specific evidence. Those uploads preserve
            versions and do not change tenant current state.
          </span>
          <span style={{ color: "#6b665c", fontSize: 12 }}>
            Open the event workspace to attach event evidence.
          </span>
        </div>
      </section>

      <ol
        aria-label="Upload workflow"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 8,
          listStyle: "none",
          margin: 0,
          padding: 0,
        }}
      >
        {workflowSteps.map((step, index) => (
          <li
            key={step.label}
            style={{
              border: "1px solid #e3decf",
              borderRadius: 8,
              background: index === 0 ? "#171717" : "#fbfaf7",
              color: index === 0 ? "#fff" : "#514c43",
              minHeight: 82,
              padding: 10,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 900 }}>
              {index + 1}. {step.label}
            </div>
            <div style={{ fontSize: 12, lineHeight: 1.4, marginTop: 6 }}>
              {step.detail}
            </div>
          </li>
        ))}
      </ol>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <label
          style={{
            position: "relative",
            display: "grid",
            placeItems: "center",
            gap: 10,
            minHeight: 168,
            border: "1px dashed #b8b0a2",
            borderRadius: 12,
            background: "#fbfaf7",
            padding: 22,
            textAlign: "center",
            cursor: "pointer",
          }}
        >
          <span
            style={{
              fontFamily: "Georgia, serif",
              fontSize: 22,
              color: "#171717",
            }}
          >
            Drop files or choose one structured file
          </span>
          <span style={{ color: "#6b665c", lineHeight: 1.45 }}>
            CSV, JSON, JSONL, or YAML today. Excel, PDF, Word, PowerPoint, and
            ZIP packages use the Advanced path until parser review is enabled.
          </span>
          <span
            style={{
              border: "1px solid #171717",
              borderRadius: 999,
              padding: "8px 14px",
              background: "#171717",
              color: "#fff",
              fontWeight: 800,
            }}
          >
            Choose file
          </span>
          <input
            style={{
              position: "absolute",
              width: 1,
              height: 1,
              opacity: 0,
              pointerEvents: "none",
            }}
            type="file"
            accept={[
              ".csv",
              ".json",
              ".jsonl",
              ".yaml",
              ".yml",
              "text/csv",
              "application/json",
              "application/x-ndjson",
              "application/yaml",
              "text/yaml",
            ].join(",")}
            onChange={onFileChange}
          />
          {file ? (
            <span style={{ color: "#171717", fontWeight: 800 }}>
              Selected: {file.name}
            </span>
          ) : null}
        </label>

        <button
          type="button"
          onClick={() => setShowSpecificArea((current) => !current)}
          style={{
            border: 0,
            background: "transparent",
            color: "#171717",
            cursor: "pointer",
            fontFamily: "DM Sans, sans-serif",
            fontSize: 14,
            fontWeight: 800,
            padding: 0,
            textAlign: "left",
            width: "fit-content",
          }}
        >
          {showSpecificArea
            ? "Hide specific-area mapping"
            : "Load into a specific area"}
        </button>

        {showSpecificArea ? (
          <label style={{ display: "grid", gap: 6 }}>
            <span>Template</span>
            <select
              style={inputStyle}
              value={templateId}
              onChange={(event) => setTemplateId(event.target.value)}
            >
              <optgroup label="Context templates">
                {generalTemplates.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </optgroup>
              {healthcareTemplates.length > 0 && (
                <optgroup label="Meridian/PHS healthcare context">
                  {healthcareTemplates.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </optgroup>
              )}
              {phsTemplates.length > 0 && (
                <optgroup label="PHS command center phase 0">
                  {phsTemplates.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label="Moves rate cards">
                {RATE_CARD_TEMPLATE_DEFINITIONS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </optgroup>
            </select>
          </label>
        ) : null}

        {headers.length > 0 && !rateCardTemplate && (
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <label style={{ display: "grid", gap: 6 }}>
              <span>Record id column</span>
              <select
                style={inputStyle}
                value={sourceRecordIdColumn}
                onChange={(event) =>
                  setSourceRecordIdColumn(event.target.value)
                }
              >
                <option value="">Row number</option>
                {headers.map((header) => (
                  <option key={header} value={header}>
                    {header}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span>Title column</span>
              <select
                style={inputStyle}
                value={titleColumn}
                onChange={(event) => setTitleColumn(event.target.value)}
              >
                <option value="">None</option>
                {headers.map((header) => (
                  <option key={header} value={header}>
                    {header}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        {file && fileFormat !== "csv" && !rateCardTemplate && (
          <section
            aria-label="Structured file preflight"
            style={{
              border: "1px solid #e3decf",
              borderRadius: 6,
              padding: 12,
              background: "#F8F7F4",
              color: "#514c43",
              lineHeight: 1.5,
            }}
          >
            JSON, JSONL, and YAML files are parsed on the server with the
            selected template. Submit stays available after attestation; schema
            errors, if any, return in the upload result.
          </section>
        )}

        {headers.length > 0 && !rateCardTemplate && (
          <fieldset
            style={{
              border: "1px solid #e3decf",
              borderRadius: 6,
              padding: 12,
            }}
          >
            <legend>Chunk text columns</legend>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginTop: 8,
              }}
            >
              {headers.map((header) => (
                <label
                  key={header}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    border: "1px solid #d8d2c4",
                    borderRadius: 6,
                    padding: "6px 8px",
                    background: selectedTextColumns.includes(header)
                      ? "#EEE8D8"
                      : "#fff",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedTextColumns.includes(header)}
                    onChange={() => toggleTextColumn(header)}
                  />
                  <span>{header}</span>
                </label>
              ))}
            </div>
            <p style={{ color: "#6b665c", marginBottom: 0 }}>
              Required fields for {contextTemplate?.label}:{" "}
              {(contextTemplate?.requiredFields ?? []).join(", ")}
            </p>
          </fieldset>
        )}

        {headers.length > 0 && rateCardTemplate && (
          <section
            aria-label="Rate-card template preflight"
            style={{
              border: "1px solid #e3decf",
              borderRadius: 6,
              padding: 12,
              background: "#F8F7F4",
              display: "grid",
              gap: 8,
            }}
          >
            <strong>{rateCardTemplate.label}</strong>
            <span style={{ color: "#514c43" }}>
              {rateCardTemplate.description}
            </span>
            <div>
              <span style={{ fontWeight: 700 }}>Required fields: </span>
              <span>{rateCardTemplate.requiredFields.join(", ")}</span>
            </div>
            <p style={{ margin: 0, color: "#6b665c", lineHeight: 1.45 }}>
              This upload validates rate-card rows only. Commit to the tenant
              data plane is a controlled follow-up slice.
            </p>
          </section>
        )}

        {schemaPreflight && (
          <section
            aria-label="Template schema preflight"
            style={{
              border: "1px solid #e3decf",
              borderRadius: 6,
              padding: 12,
              background: schemaPreflight.clarificationRequired
                ? "#FFF9EC"
                : "#F4F8F1",
              display: "grid",
              gap: 8,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <strong>
                {schemaPreflight.clarificationRequired
                  ? "Schema clarification required"
                  : "Template fit confirmed"}
              </strong>
              <span style={{ color: "#6b665c" }}>
                {schemaPreflight.mappedRequiredFields.length}/
                {template.requiredFields.length} required fields mapped
              </span>
            </div>
            {schemaPreflight.missingRequiredFields.length > 0 && (
              <div>
                <span style={{ fontWeight: 700 }}>
                  Missing required fields:{" "}
                </span>
                <span>{schemaPreflight.missingRequiredFields.join(", ")}</span>
              </div>
            )}
            {schemaPreflight.unknownColumns.length > 0 && (
              <div>
                <span style={{ fontWeight: 700 }}>
                  Columns needing context:{" "}
                </span>
                <span>{schemaPreflight.unknownColumns.join(", ")}</span>
              </div>
            )}
            {schemaPreflight.clarificationRequests.length > 0 && (
              <ul style={{ margin: 0, paddingLeft: 18, color: "#514c43" }}>
                {schemaPreflight.clarificationRequests
                  .slice(0, 4)
                  .map((request) => (
                    <li key={`${request.action}:${request.field}`}>
                      {request.message}
                    </li>
                  ))}
              </ul>
            )}
          </section>
        )}

        <fieldset
          style={{
            border: "1px solid #d8d2c4",
            borderRadius: 6,
            padding: 12,
            background: "#fffaf0",
          }}
        >
          <legend>Data load attestation</legend>
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
              I have authority to load this tenant data, I understand it will be
              processed as pilot context for {tenantName}, and I have reviewed
              the file for PHI, PII, payment-card, and other restricted data
              before starting the load.
            </span>
          </label>
          <label style={{ display: "grid", gap: 6, marginTop: 10 }}>
            <span>Attestation note</span>
            <textarea
              style={{ ...inputStyle, minHeight: 72 }}
              value={attestationNote}
              onChange={(event) => setAttestationNote(event.target.value)}
              placeholder="Optional context, approval reference, or data-load ticket"
            />
          </label>
          <p style={{ color: "#6b665c", margin: "8px 0 0", lineHeight: 1.45 }}>
            Version {PILOT_UPLOAD_ATTESTATION_VERSION}. Uploads without this
            confirmation are rejected before processing starts.
          </p>
        </fieldset>

        <div>
          <button
            type="submit"
            disabled={
              !file || pending || requiredFieldsBlocked || !attestationAccepted
            }
            style={{
              border: "1px solid #171717",
              borderRadius: 6,
              padding: "10px 14px",
              background:
                pending || requiredFieldsBlocked || !attestationAccepted
                  ? "#d8d2c4"
                  : "#171717",
              color:
                pending || requiredFieldsBlocked || !attestationAccepted
                  ? "#514c43"
                  : "#fff",
              fontFamily: "DM Sans, sans-serif",
              cursor:
                !file ||
                pending ||
                requiredFieldsBlocked ||
                !attestationAccepted
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {pending
              ? rateCardTemplate
                ? "Validating rate card..."
                : "Loading structured data..."
              : requiredFieldsBlocked
                ? "Resolve required fields"
                : !attestationAccepted
                  ? "Accept attestation"
                  : rateCardTemplate
                    ? "Validate rate card"
                    : "Start governed load"}
          </button>
        </div>
      </form>

      {result && (
        <div
          role="status"
          style={{
            border: "1px solid #e3decf",
            borderRadius: 6,
            padding: 12,
            background: result.ok ? "#F4F8F1" : "#FFF4F1",
          }}
        >
          {result.ok ? (
            <div style={{ display: "grid", gap: 6 }}>
              <strong>
                {result.chunksQueued?.toLocaleString()} chunks queued from{" "}
                {result.rowsParsed?.toLocaleString()} rows.
              </strong>
              {result.enterpriseContextPromotion ? (
                <span>
                  Structured context:{" "}
                  {result.enterpriseContextPromotion.recordsPromoted.toLocaleString()}{" "}
                  records and{" "}
                  {result.enterpriseContextPromotion.factsPromoted.toLocaleString()}{" "}
                  facts promoted.{" "}
                  {result.enterpriseContextPromotion.factsSuperseded > 0
                    ? `${result.enterpriseContextPromotion.factsSuperseded.toLocaleString()} active fact${result.enterpriseContextPromotion.factsSuperseded === 1 ? "" : "s"} superseded.`
                    : "No prior active facts were superseded."}
                </span>
              ) : null}
              <span>{result.persistence?.detail}</span>
              {result.evidenceLedger?.rowsRecorded ? (
                <span>
                  Evidence ledger:{" "}
                  {result.evidenceLedger.rowsRecorded.toLocaleString()} row
                  {result.evidenceLedger.rowsRecorded === 1 ? "" : "s"} recorded
                  ({result.evidenceLedger.evidenceIds.join(", ")}).
                </span>
              ) : null}
              <code style={{ whiteSpace: "normal" }}>
                {result.embeddingHandoff?.command}
              </code>
              <section
                aria-label="Load receipt"
                style={{
                  border: "1px solid #d8d2c4",
                  borderRadius: 6,
                  background: "#fff",
                  padding: 10,
                  display: "grid",
                  gap: 8,
                }}
              >
                <strong>Load receipt</strong>
                <ol style={{ margin: 0, paddingLeft: 18, lineHeight: 1.5 }}>
                  {contextReceiptSteps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </section>
              <section
                aria-label="Used in output trace"
                style={{
                  border: "1px solid #d8d2c4",
                  borderRadius: 6,
                  background: "#fbfaf7",
                  padding: 10,
                  lineHeight: 1.5,
                }}
              >
                <strong>Used in outputs</strong>
                <p style={{ margin: "6px 0 0", color: "#514c43" }}>
                  Generated artifacts should show evidence to pattern to output
                  change traces. Example: high bank-count complexity increases
                  integration scoring, testing effort, hypercare cost, and RFP
                  bank-connectivity questions.
                </p>
              </section>
              <section
                aria-label="Source event upload guidance"
                style={{
                  border: "1px solid #d8d2c4",
                  borderRadius: 6,
                  background: "#fff",
                  padding: 10,
                  lineHeight: 1.5,
                }}
              >
                <strong>Event evidence is separate</strong>
                <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                  {sourceEventReceiptSteps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
              </section>
            </div>
          ) : result.mode === "rate_card_validation_preview" ? (
            <div style={{ display: "grid", gap: 8 }}>
              <strong>
                {result.readyForCommit
                  ? "Rate-card rows passed validation."
                  : "Rate-card rows need correction."}
              </strong>
              <span>{result.persistence?.detail}</span>
              {result.validation && result.validation.errors.length > 0 && (
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {result.validation.errors.slice(0, 6).map((error) => (
                    <li
                      key={`${error.rowIndex}:${error.field}:${error.message}`}
                    >
                      Row {error.rowIndex + 2}, {error.field}: {error.message}
                    </li>
                  ))}
                </ul>
              )}
              {result.validation && result.validation.warnings.length > 0 && (
                <span style={{ color: "#6b665c" }}>
                  {result.validation.warnings.length} provenance warning(s) need
                  review before commit.
                </span>
              )}
            </div>
          ) : (
            <span>
              {result.detail ??
                result.persistence?.detail ??
                "CSV upload did not complete."}
            </span>
          )}
        </div>
      )}
    </section>
  );
}
