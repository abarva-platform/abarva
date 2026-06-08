"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";

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
  recordsPromoted?: number;
  factsPromoted?: number;
  blobBucket?: string;
  workflow?: {
    jobId: string;
    summary: string;
    status?: {
      persisted: boolean;
      bucket: string | null;
      path: string | null;
      pollable: boolean;
    };
    steps: Array<{
      id: string;
      label: string;
      status: "complete" | "active" | "pending" | "skipped" | "blocked";
      detail: string;
    }>;
  };
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
    queue?: {
      queueName: string;
      messageId: string;
    } | null;
    loadResult?: {
      rowsParsed: number;
      chunksQueued: number;
      enterpriseContextPromotion?: {
        recordsPromoted: number;
        factsPromoted: number;
      };
      persistence: { status: string };
    } | null;
    processing?: {
      status: string;
      label: string;
      nextAction: string;
    };
  }>;
};

type BulkJobStatus = {
  jobId: string;
  status: string;
  summary: string;
  updatedAt: string;
  workflow: NonNullable<BulkResult["workflow"]>;
  counts: {
    filesProcessed: number;
    rowsParsed: number;
    chunksQueued: number;
    recordsPromoted: number;
    factsPromoted: number;
  };
  files: Array<{
    fileName: string;
    templateId: string;
    queueMessageId: string | null;
    processingStatus: string;
    nextAction: string;
  }>;
};

type TimelineStep = {
  id: string;
  label: string;
  status: "complete" | "active" | "pending" | "skipped" | "blocked";
  detail: string;
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

const pendingSteps: TimelineStep[] = [
  {
    id: "package_received",
    label: "Package upload",
    status: "active",
    detail: "Uploading files and manifest to the governed loader endpoint.",
  },
  {
    id: "attestation_verified",
    label: "Attestation gate",
    status: "pending",
    detail:
      "The loader will verify authority, intended use, and restricted-data review.",
  },
  {
    id: "sensitive_data_scan",
    label: "Sensitive-data scan",
    status: "pending",
    detail:
      "Files must pass the upload protection gate before any storage write.",
  },
  {
    id: "blob_staging",
    label: "Azure Blob staging",
    status: "pending",
    detail:
      "Commit modes stage files to the governed context upload container.",
  },
  {
    id: "worker_queue",
    label: "Worker handoff",
    status: "pending",
    detail:
      "Document-heavy packages are queued for Azure private-worker extraction.",
  },
];

function badgeStyle(status: TimelineStep["status"]) {
  const palette: Record<TimelineStep["status"], { bg: string; fg: string }> = {
    complete: { bg: "#e7f4ea", fg: "#1c6b35" },
    active: { bg: "#e8f0ff", fg: "#244b9a" },
    pending: { bg: "#f4efe5", fg: "#7b6232" },
    skipped: { bg: "#f0f1f3", fg: "#5f6673" },
    blocked: { bg: "#ffe9e9", fg: "#9a2626" },
  };
  return {
    borderRadius: 999,
    padding: "3px 8px",
    background: palette[status].bg,
    color: palette[status].fg,
    fontSize: 12,
    fontWeight: 800,
    textTransform: "uppercase" as const,
  };
}

function WorkflowTimeline({
  title,
  summary,
  steps,
  framed = true,
}: {
  title: string;
  summary: string;
  steps: TimelineStep[];
  framed?: boolean;
}) {
  return (
    <div
      style={{
        border: framed ? "1px solid #d8d2c4" : "0",
        borderRadius: framed ? 6 : 0,
        padding: framed ? 12 : 0,
        background: framed ? "#fff" : "transparent",
      }}
    >
      <p style={{ margin: 0, fontWeight: 800 }}>{title}</p>
      <p style={{ margin: "6px 0 0", color: "#5f6673", lineHeight: 1.45 }}>
        {summary}
      </p>
      <ol
        style={{
          listStyle: "none",
          margin: "12px 0 0",
          padding: 0,
          display: "grid",
          gap: 8,
        }}
      >
        {steps.map((step, index) => (
          <li
            key={step.id}
            style={{
              display: "grid",
              gridTemplateColumns: "28px minmax(0, 1fr)",
              gap: 10,
              alignItems: "start",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                display: "inline-grid",
                placeItems: "center",
                background: step.status === "complete" ? "#1c6b35" : "#f4efe5",
                color: step.status === "complete" ? "#fff" : "#5f6673",
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              {index + 1}
            </span>
            <span style={{ display: "grid", gap: 4 }}>
              <span
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <span style={{ fontWeight: 800 }}>{step.label}</span>
                <span style={badgeStyle(step.status)}>{step.status}</span>
              </span>
              <span style={{ color: "#5f6673", lineHeight: 1.45 }}>
                {step.detail}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function BulkContextUploadConnector({
  clientId,
  tenantName,
}: BulkContextUploadConnectorProps) {
  const [manifestJson, setManifestJson] = useState(defaultManifest);
  const [showPackageMapping, setShowPackageMapping] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [mode, setMode] = useState<
    "validate_only" | "stage_and_enqueue" | "stage_and_process"
  >("validate_only");
  const [attestationAccepted, setAttestationAccepted] = useState(false);
  const [attestationNote, setAttestationNote] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<BulkResult | null>(null);
  const [jobStatus, setJobStatus] = useState<BulkJobStatus | null>(null);
  const [jobStatusError, setJobStatusError] = useState<string | null>(null);
  const [jobStatusCheckedAt, setJobStatusCheckedAt] = useState<string | null>(
    null,
  );

  function onFilesChange(event: ChangeEvent<HTMLInputElement>) {
    setFiles(Array.from(event.target.files ?? []));
    setResult(null);
    setJobStatus(null);
    setJobStatusError(null);
    setJobStatusCheckedAt(null);
  }

  useEffect(() => {
    const jobId = result?.workflow?.jobId;
    const pollable = result?.workflow?.status?.pollable;
    if (!jobId || !pollable) return undefined;

    const pollJobId = jobId;
    let cancelled = false;
    async function fetchStatus() {
      try {
        const params = new URLSearchParams({
          clientId,
          jobId: pollJobId,
        });
        const response = await fetch(
          `/api/admin/context-layer/bulk-upload/status?${params.toString()}`,
          { cache: "no-store" },
        );
        const body = (await response.json()) as {
          ok?: boolean;
          status?: BulkJobStatus;
          detail?: string;
          error?: string;
        };
        if (cancelled) return;
        if (response.ok && body.status) {
          setJobStatus(body.status);
          setJobStatusError(null);
        } else {
          setJobStatusError(body.detail ?? body.error ?? "Status check failed");
        }
        setJobStatusCheckedAt(new Date().toLocaleTimeString());
      } catch (error) {
        if (cancelled) return;
        setJobStatusError(
          error instanceof Error ? error.message : "Status check failed",
        );
        setJobStatusCheckedAt(new Date().toLocaleTimeString());
      }
    }

    void fetchStatus();
    const interval = window.setInterval(fetchStatus, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [clientId, result?.workflow?.jobId, result?.workflow?.status?.pollable]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setResult(null);
    setJobStatus(null);
    setJobStatusError(null);
    setJobStatusCheckedAt(null);
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

  const submitLabel =
    mode === "stage_and_process"
      ? "Process package"
      : mode === "stage_and_enqueue"
        ? "Stage package"
        : "Validate package";

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
          Advanced package loader
        </p>
        <h2 style={{ margin: 0, fontSize: 22 }}>
          Use Azure landing-zone and package mapping
        </h2>
        <p style={{ margin: "8px 0 0", color: "#5f6673", lineHeight: 1.55 }}>
          This is the operator path for multi-file setup packets, Azure Blob
          staging, worker handoff, and corpus-adjacent package handling. Most
          uploads should start in Add data; use this only when file mapping or
          IT-controlled landing is required.
        </p>
      </div>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 700 }}>Files or ZIP package</span>
          <input
            type="file"
            multiple
            accept=".csv,.json,.jsonl,.yaml,.yml,.xlsx,.pdf,.docx,.pptx,.md,.markdown,.zip"
            onChange={onFilesChange}
            style={inputStyle}
          />
          <span style={{ color: "#5f6673", fontSize: 13, lineHeight: 1.45 }}>
            PDF, DOCX, PPTX, XLSX, and Markdown files are staged and queued for
            Azure processing. Use process-now mode for CSV, JSON, JSONL, and
            YAML template files.
          </span>
        </label>

        <div
          style={{
            border: "1px solid #e3decf",
            borderRadius: 8,
            background: "#fbfaf7",
            overflow: "hidden",
          }}
        >
          <button
            type="button"
            aria-expanded={showPackageMapping}
            onClick={() => setShowPackageMapping((current) => !current)}
            style={{
              width: "100%",
              border: 0,
              background: "transparent",
              color: "#171717",
              cursor: "pointer",
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              padding: "12px 14px",
              fontFamily: "DM Sans, sans-serif",
              fontSize: 14,
              fontWeight: 800,
              textAlign: "left",
            }}
          >
            <span>Advanced package mapping</span>
            <span aria-hidden="true">
              {showPackageMapping ? "Hide" : "Show"}
            </span>
          </button>
          {showPackageMapping ? (
            <label
              style={{
                display: "grid",
                gap: 6,
                padding: "0 14px 14px",
              }}
            >
              <span
                style={{ color: "#5f6673", fontSize: 13, lineHeight: 1.45 }}
              >
                Optional operator mapping. Edit only when the package needs
                explicit file-to-template routing.
              </span>
              <textarea
                aria-label="Advanced package mapping JSON"
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
          ) : null}
        </div>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 700 }}>Run mode</span>
          <select
            value={mode}
            onChange={(event) =>
              setMode(
                event.target.value as
                  | "validate_only"
                  | "stage_and_enqueue"
                  | "stage_and_process",
              )
            }
            style={inputStyle}
          >
            <option value="validate_only">Validate only</option>
            <option value="stage_and_enqueue">
              Stage to Azure Blob and queue worker
            </option>
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
            processed as pilot context for {tenantName}, and I have reviewed the
            files for PHI, PII, payment-card, and other restricted data.
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
          {pending ? "Running package..." : submitLabel}
        </button>
      </form>

      {pending ? (
        <WorkflowTimeline
          title="Upload workflow running"
          summary="Keep this page open while the loader verifies the package. The final Azure handoff status appears below when the run returns."
          steps={pendingSteps}
        />
      ) : null}

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
          {result.workflow ? (
            <p
              style={{
                margin: "8px 0 0",
                color: "#4f5663",
                fontFamily:
                  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
                fontSize: 12,
              }}
            >
              Job {result.workflow.jobId}
              {result.workflow.status?.pollable ? " · polling enabled" : ""}
            </p>
          ) : null}
          {typeof result.filesProcessed === "number" ? (
            <p style={{ margin: "8px 0 0" }}>
              Files {result.filesProcessed} · Rows {result.rowsParsed ?? 0} ·
              Chunks {result.chunksQueued ?? 0} · Records{" "}
              {result.recordsPromoted ?? 0} · Facts {result.factsPromoted ?? 0}{" "}
              · Bucket {result.blobBucket ?? "not staged"}
            </p>
          ) : null}
          {result.results && result.results.length > 0 ? (
            <ul style={{ margin: "10px 0 0", paddingLeft: 18 }}>
              {result.results.map((item) => (
                <li key={item.fileName}>
                  {item.fileName} · {item.templateId} ·{" "}
                  {item.queue
                    ? `queued ${item.queue.messageId}`
                    : item.blob.staged
                      ? item.blob.path
                      : "validated only"}
                  {item.processing
                    ? ` · next: ${item.processing.nextAction}`
                    : ""}
                </li>
              ))}
            </ul>
          ) : null}
          {result.workflow ? (
            <div style={{ marginTop: 12 }}>
              <WorkflowTimeline
                title="Loader workflow"
                summary={jobStatus?.summary ?? result.workflow.summary}
                steps={jobStatus?.workflow.steps ?? result.workflow.steps}
                framed={false}
              />
              {result.workflow.status?.pollable ? (
                <div
                  style={{
                    marginTop: 10,
                    paddingTop: 10,
                    borderTop: "1px solid #d8d2c4",
                    color: "#4f5663",
                    display: "grid",
                    gap: 6,
                  }}
                >
                  <p style={{ margin: 0, fontWeight: 800 }}>
                    Private worker status:{" "}
                    {jobStatus?.status ?? "checking status"}
                  </p>
                  <p style={{ margin: 0 }}>
                    {jobStatusCheckedAt
                      ? `Last checked ${jobStatusCheckedAt}`
                      : "Waiting for first status refresh"}
                    {jobStatusError ? ` · ${jobStatusError}` : ""}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
