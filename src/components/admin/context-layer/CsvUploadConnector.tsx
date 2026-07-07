"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import {
  MERIDIAN_CONTEXT_TEMPLATES,
  NORTHSTAR_CONTEXT_TEMPLATES,
  getTemplatesForTenant,
} from "@/lib/context-ingestion/template-registry";
import { proposeCsvColumnMapping } from "@/lib/context-ingestion/csv-column-mapping";
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
  reviewRequired?: boolean;
};

type AdminUploadFileFormat =
  | "csv"
  | "json"
  | "jsonl"
  | "yaml"
  | "xlsx"
  | "pdf"
  | "docx"
  | "pptx"
  | "zip"
  | "unknown";

interface CsvUploadConnectorProps {
  clientId: string;
  tenantKey: string;
  tenantName: string;
  initialTemplateId?: string;
  mode?: "package" | "single";
}

const inputStyle = {
  border: "1px solid #d8d2c4",
  borderRadius: 6,
  padding: "7px 9px",
  background: "#fff",
  color: "#171717",
  fontFamily: "DM Sans, sans-serif",
  fontSize: 13,
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

const TEMPLATE_HEADER_SIGNATURES = [
  {
    templateId: "integration-topology",
    requiredHeaders: [
      "edge_id",
      "source_app_id",
      "target_app_id",
      "integration_type",
    ],
    titleColumns: ["business_purpose", "integration_type", "edge_id"],
  },
  {
    templateId: "application-portfolio",
    requiredHeaders: [
      "app_id",
      "name",
      "criticality",
      "owner_role",
      "system_of_record",
    ],
    titleColumns: ["name", "app_id"],
  },
  {
    templateId: "vendor-contracts",
    requiredHeaders: [
      "vendor_id",
      "vendor_name",
      "annual_value_usd",
      "renewal_date",
    ],
    titleColumns: ["vendor_name", "vendor_id"],
  },
  {
    templateId: "financial-kpi-workbook",
    requiredHeaders: [
      "period",
      "metric",
      "value",
      "currency_or_unit",
      "segment",
    ],
    titleColumns: ["metric", "segment", "period"],
  },
  {
    templateId: "org-roles",
    requiredHeaders: ["person_id", "name", "level", "role", "manager_id"],
    titleColumns: ["name", "role", "person_id"],
  },
] as const;

function normalizeHeader(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function detectTemplateFromHeaders(headers: string[]): {
  templateId: string;
  titleColumn: string;
} | null {
  const normalizedToRaw = new Map(
    headers.map((header) => [normalizeHeader(header), header]),
  );
  for (const signature of TEMPLATE_HEADER_SIGNATURES) {
    if (
      signature.requiredHeaders.every((header) =>
        normalizedToRaw.has(normalizeHeader(header)),
      )
    ) {
      const titleColumn =
        signature.titleColumns
          .map((header) => normalizedToRaw.get(normalizeHeader(header)))
          .find((header): header is string => Boolean(header)) ?? "";
      return { templateId: signature.templateId, titleColumn };
    }
  }
  return null;
}

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

function countCsvRows(text: string): number {
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
  return Math.max(0, lines.length - 1);
}

function labelForField(field: string): string {
  const friendly: Record<string, string> = {
    team_id: "Team",
    measured_at: "Measurement date",
    deploy_freq_per_week: "Deployment frequency",
    lead_time_hours: "Lead time",
    mttr_hours: "Recovery time",
    change_failure_rate_pct: "Change failure rate",
  };
  if (friendly[field]) return friendly[field];
  return field
    .replace(/_id$/i, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function detectFileFormat(fileName: string): AdminUploadFileFormat {
  const lowerName = fileName.toLowerCase();
  if (lowerName.endsWith(".csv")) return "csv";
  if (lowerName.endsWith(".json")) return "json";
  if (lowerName.endsWith(".jsonl")) return "jsonl";
  if (lowerName.endsWith(".yaml") || lowerName.endsWith(".yml")) return "yaml";
  if (lowerName.endsWith(".xlsx")) return "xlsx";
  if (lowerName.endsWith(".pdf")) return "pdf";
  if (lowerName.endsWith(".docx")) return "docx";
  if (lowerName.endsWith(".pptx")) return "pptx";
  if (lowerName.endsWith(".zip")) return "zip";
  return "unknown";
}

function readFileText(file: File): Promise<string> {
  if (typeof file.text === "function") return file.text();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () =>
      reject(reader.error ?? new Error("file_read_failed"));
    reader.readAsText(file);
  });
}

export function CsvUploadConnector({
  clientId,
  tenantKey,
  tenantName,
  initialTemplateId,
  mode = "single",
}: CsvUploadConnectorProps) {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [fileFormat, setFileFormat] =
    useState<AdminUploadFileFormat>("unknown");
  const [templateId, setTemplateId] = useState(
    initialTemplateId ?? "application-portfolio",
  );
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>(
    {},
  );
  const [sourceRecordIdColumn, setSourceRecordIdColumn] = useState("");
  const [titleColumn, setTitleColumn] = useState("");
  const [selectedTextColumns, setSelectedTextColumns] = useState<string[]>([]);
  const [attestationAccepted, setAttestationAccepted] = useState(false);
  const [attestationNote, setAttestationNote] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const templates = useMemo(
    () => getTemplatesForTenant(tenantKey),
    [tenantKey],
  );
  const healthcareTemplateIds = useMemo(
    () => new Set(MERIDIAN_CONTEXT_TEMPLATES.map((item) => item.id)),
    [],
  );
  const phsTemplateIds = useMemo(
    () => new Set(NORTHSTAR_CONTEXT_TEMPLATES.map((item) => item.id)),
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
  const mappingProposal = useMemo(
    () =>
      fileFormat === "csv" && headers.length > 0 && contextTemplate
        ? proposeCsvColumnMapping({ headers, template: contextTemplate })
        : null,
    [contextTemplate, fileFormat, headers],
  );
  const missingRequiredFields = useMemo(
    () =>
      contextTemplate
        ? contextTemplate.requiredFields.filter(
            (field) => !fieldMappings[field],
          )
        : [],
    [contextTemplate, fieldMappings],
  );
  const requiredFieldsBlocked =
    fileFormat === "csv" &&
    !rateCardTemplate &&
    missingRequiredFields.length > 0;
  const reviewOnlyUpload = Boolean(
    file &&
    ["xlsx", "pdf", "docx", "pptx", "zip", "unknown"].includes(fileFormat),
  );

  useEffect(() => {
    if (!mappingProposal) {
      setFieldMappings({});
      return;
    }
    setFieldMappings(mappingProposal.fieldMappings);
    setSourceRecordIdColumn(mappingProposal.sourceRecordIdColumn ?? "");
    setTitleColumn(mappingProposal.titleColumn ?? "");
    setSelectedTextColumns(mappingProposal.textColumns);
  }, [mappingProposal]);

  async function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;
    setFile(nextFile);
    setResult(null);
    if (!nextFile) {
      setHeaders([]);
      setRowCount(0);
      setFileFormat("unknown");
      return;
    }
    const nextFormat = detectFileFormat(nextFile.name);
    setFileFormat(nextFormat);
    const text = await readFileText(nextFile);
    if (nextFormat !== "csv") {
      setHeaders([]);
      setRowCount(0);
      setSourceRecordIdColumn("");
      setTitleColumn("");
      setSelectedTextColumns([]);
      return;
    }
    const firstLine =
      text.split(/\r?\n/).find((line) => line.trim() !== "") ?? "";
    const parsedHeaders = splitHeaderLine(firstLine);
    setHeaders(parsedHeaders);
    setRowCount(countCsvRows(text));
    const detectedTemplate = detectTemplateFromHeaders(parsedHeaders);
    if (
      detectedTemplate &&
      templates.some((item) => item.id === detectedTemplate.templateId)
    ) {
      setTemplateId(detectedTemplate.templateId);
    }
    const idColumn =
      parsedHeaders.find((header) =>
        /(^|_)id$/i.test(header.replace(/[^a-z0-9]+/gi, "_")),
      ) ?? "";
    const nameColumn =
      detectedTemplate?.titleColumn ??
      parsedHeaders.find((header) =>
        /^(name|title|vendor_name|tool_name|business_purpose|metric)$/i.test(
          header,
        ),
      ) ??
      "";
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
    formData.set("fieldMappings", JSON.stringify(fieldMappings));

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
        padding: 14,
        fontFamily: "DM Sans, sans-serif",
        display: "grid",
        gap: 12,
      }}
    >
      <div>
        <h2 style={{ fontSize: 16, lineHeight: 1.25, margin: 0 }}>Add data</h2>
        <p
          style={{
            color: "#514c43",
            fontSize: 13,
            margin: "4px 0 0",
            lineHeight: 1.45,
          }}
        >
          {mode === "package"
            ? `Start with a manifest and related files for ${tenantName}. Structured files can be mapped here; rich documents stay in review.`
            : `Files for ${tenantName} stay in review until the mapping and attestation are approved.`}
        </p>
      </div>

      <section
        aria-label="Upload workflow"
        style={{
          border: "1px solid #e3decf",
          borderRadius: 8,
          background: "#fbfaf7",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          overflow: "hidden",
        }}
      >
        {workflowSteps.map((step, index) => (
          <div
            key={step.label}
            style={{
              padding: 12,
              borderRight:
                index === workflowSteps.length - 1
                  ? "none"
                  : "1px solid #e3decf",
            }}
          >
            <strong style={{ display: "block", fontSize: 12 }}>
              {index + 1}. {step.label}
            </strong>
            <span style={{ color: "#514c43", fontSize: 12, lineHeight: 1.4 }}>
              {step.detail}
            </span>
          </div>
        ))}
      </section>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <section
          aria-label="File type and data area"
          style={{
            display: "grid",
            gap: 10,
          }}
        >
          <label style={{ display: "grid", gap: 5 }}>
            <span style={{ fontSize: 12, fontWeight: 700 }}>Data area</span>
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
        </section>

        <label
          style={{
            position: "relative",
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) auto",
            alignItems: "center",
            gap: 14,
            minHeight: 88,
            border: "1px dashed #b8b0a2",
            borderRadius: 8,
            background: "#fbfaf7",
            padding: "14px 16px",
            textAlign: "left",
            cursor: "pointer",
          }}
        >
          <span style={{ display: "grid", gap: 4 }}>
            <strong style={{ color: "#171717", fontSize: 14 }}>
              {mode === "package"
                ? "Choose the first setup package file"
                : "Drop or choose a structured file"}
            </strong>
            <span style={{ color: "#6b665c", fontSize: 12.5, lineHeight: 1.4 }}>
              {mode === "package"
                ? "Start with the file that best represents the first data area. AbarVa will ask before committing structured rows."
                : "Use this when one data area needs a refresh. Documents and workbooks go to review before facts commit."}
            </span>
          </span>
          <span
            style={{
              border: "1px solid #171717",
              borderRadius: 6,
              padding: "7px 11px",
              background: "#171717",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
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
              ".xlsx",
              ".pdf",
              ".docx",
              ".pptx",
              ".zip",
              "text/csv",
              "application/json",
              "application/x-ndjson",
              "application/yaml",
              "text/yaml",
              "application/pdf",
            ].join(",")}
            onChange={onFileChange}
          />
          {file ? (
            <span style={{ color: "#171717", fontWeight: 800 }}>
              Selected: {file.name}
            </span>
          ) : null}
        </label>

        {file && reviewOnlyUpload && !rateCardTemplate && (
          <section
            aria-label="Review-required upload"
            style={{
              border: "1px solid #e3decf",
              borderRadius: 6,
              padding: 12,
              background: "#F8F7F4",
              color: "#514c43",
              lineHeight: 1.5,
            }}
          >
            This file will be preserved for review. Documents, workbooks, and
            archives do not commit facts until source locations are reviewed.
          </section>
        )}

        {headers.length > 0 && !rateCardTemplate && contextTemplate && (
          <section
            aria-label="Column mapping confirmation"
            style={{
              border: "1px solid #e3decf",
              borderRadius: 6,
              padding: 12,
              background: "#fff",
              display: "grid",
              gap: 10,
            }}
          >
            <div>
              <strong style={{ display: "block", fontSize: 14 }}>
                I read {rowCount.toLocaleString()} rows and matched your columns
                to {contextTemplate.label}.
              </strong>
              <span style={{ color: "#514c43", fontSize: 12.5 }}>
                Confirm or adjust:
              </span>
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              {contextTemplate.requiredFields.map((field) => {
                const unresolved = !fieldMappings[field];
                return (
                  <label
                    key={field}
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "minmax(120px, 0.55fr) minmax(0, 1fr)",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span style={{ color: "#171717", fontSize: 12.5 }}>
                      {labelForField(field)}
                    </span>
                    <span style={{ display: "grid", gap: 4 }}>
                      <select
                        aria-label={`${labelForField(field)} source column`}
                        style={{
                          ...inputStyle,
                          borderColor: unresolved ? "#b42318" : "#d8d2c4",
                        }}
                        value={fieldMappings[field] ?? ""}
                        onChange={(event) =>
                          setFieldMappings((current) => ({
                            ...current,
                            [field]: event.target.value,
                          }))
                        }
                      >
                        <option value="">Choose a column</option>
                        {headers.map((header) => (
                          <option key={header} value={header}>
                            {header}
                          </option>
                        ))}
                      </select>
                      {unresolved ? (
                        <span style={{ color: "#b42318", fontSize: 11.5 }}>
                          Needs a matching source column before commit.
                        </span>
                      ) : null}
                    </span>
                  </label>
                );
              })}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              <label style={{ display: "grid", gap: 5 }}>
                <span style={{ fontSize: 12, fontWeight: 700 }}>Record id</span>
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
              <label style={{ display: "grid", gap: 5 }}>
                <span style={{ fontSize: 12, fontWeight: 700 }}>Title</span>
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
          </section>
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

        <details
          open={advancedOpen}
          onToggle={(event) =>
            setAdvancedOpen((event.currentTarget as HTMLDetailsElement).open)
          }
          style={{
            border: "1px solid #e3decf",
            borderRadius: 6,
            padding: "9px 10px",
            background: "#fff",
          }}
        >
          <summary
            style={{
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 800,
            }}
          >
            Advanced
          </summary>
          <div style={{ display: "grid", gap: 12, marginTop: 10 }}>
            {headers.length > 0 && !rateCardTemplate ? (
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
              </fieldset>
            ) : null}
            <label style={{ display: "grid", gap: 6 }}>
              <span>Attestation note</span>
              <textarea
                style={{ ...inputStyle, minHeight: 72 }}
                value={attestationNote}
                onChange={(event) => setAttestationNote(event.target.value)}
                placeholder="Optional approval reference or data-load ticket"
              />
            </label>
          </div>
        </details>

        <fieldset
          style={{
            border: "1px solid #d8d2c4",
            borderRadius: 6,
            padding: "9px 10px",
            background: "#fffaf0",
          }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              lineHeight: 1.35,
              fontSize: 12.5,
            }}
          >
            <input
              type="checkbox"
              checked={attestationAccepted}
              onChange={(event) => setAttestationAccepted(event.target.checked)}
            />
            <span>
              I have authority to load this data for {tenantName} and reviewed
              it for restricted data.
            </span>
          </label>
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
                ? "Needs review before commit"
                : !attestationAccepted
                  ? "Accept attestation"
                  : rateCardTemplate
                    ? "Validate rate card"
                    : reviewOnlyUpload
                      ? "Send to review"
                      : "Confirm & load"}
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
