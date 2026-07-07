import crypto from "node:crypto";
import path from "node:path";

import {
  describeObjectStorageLocation,
  getObjectStorageAdapter,
} from "@/lib/data-plane/objectStorage";
import { getTemplateById } from "@/lib/context-ingestion/template-registry";
import type {
  CsvSchemaMapping,
  CsvUploadLoadResult,
} from "@/lib/context-ingestion/csv-upload-connector";
import {
  loadCsvUploadToTenantContext,
  segmentKeyForContextDimension,
} from "@/lib/context-ingestion/csv-upload-connector";
import { enqueueAzureLandingZoneMessage } from "@/lib/ingestion/service-bus-producer";
import type {
  AzureLandingZoneMessage,
  SegmentKey,
} from "@/lib/ingestion/azure-landing-zone-types";
import {
  evaluateSensitiveUpload,
  type UploadProtectionResult,
} from "@/lib/security/sensitive-upload-guard";
import {
  bulkContextUploadJobStatusLocation,
  persistBulkContextUploadJobStatus,
} from "./bulk-context-upload-status";
import type { PilotUploadAttestation } from "./upload-attestation";

export interface BulkContextUploadManifestFile {
  path: string;
  templateId: string;
  sourceRecordIdColumn?: string | null;
  titleColumn?: string | null;
  textColumns?: string[];
  fieldMappings?: Record<string, string>;
  dataClassification?: string | null;
}

export interface BulkContextUploadManifest {
  loadName: string;
  defaultDataClassification?: string | null;
  files: BulkContextUploadManifestFile[];
}

export interface BulkContextUploadFileInput {
  name: string;
  type?: string;
  bytes: ArrayBuffer;
}

export interface BulkContextUploadInput {
  clientId: string;
  tenantKey: string;
  uploadedBy: string;
  manifest: BulkContextUploadManifest;
  files: BulkContextUploadFileInput[];
  attestation: PilotUploadAttestation;
  mode: "validate_only" | "stage_and_enqueue" | "stage_and_process";
  uploadedAt?: string;
  enqueueMessageFn?: (
    message: AzureLandingZoneMessage,
  ) => Promise<BulkContextUploadQueueResult>;
}

export interface BulkContextUploadQueueResult {
  queueName: string;
  messageId: string;
}

export interface BulkContextUploadFileResult {
  fileName: string;
  templateId: string;
  dataProtection: UploadProtectionResult;
  blob: {
    bucket: string;
    path: string;
    sha256: string;
    staged: boolean;
  };
  queue: BulkContextUploadQueueResult | null;
  loadResult: CsvUploadLoadResult | null;
  processing: {
    status:
      | "validated_only"
      | "staged_for_worker"
      | "processed_now"
      | "blocked";
    label: string;
    nextAction: string;
  };
}

export interface BulkContextUploadWorkflowStep {
  id:
    | "package_received"
    | "attestation_verified"
    | "sensitive_data_scan"
    | "blob_staging"
    | "worker_queue"
    | "immediate_processing"
    | "enterprise_context_promotion"
    | "private_worker"
    | "operator_review"
    | "tenant_context_commit";
  label: string;
  status: "complete" | "active" | "pending" | "skipped" | "blocked";
  detail: string;
}

export interface BulkContextUploadResult {
  ok: boolean;
  mode: BulkContextUploadInput["mode"];
  loadName: string;
  filesReceived: number;
  filesProcessed: number;
  rowsParsed: number;
  chunksQueued: number;
  recordsPromoted: number;
  factsPromoted: number;
  blobBucket: string;
  workflow: {
    jobId: string;
    summary: string;
    status:
      | {
          persisted: true;
          bucket: string;
          path: string;
          pollable: true;
        }
      | {
          persisted: false;
          bucket: null;
          path: null;
          pollable: false;
        };
    steps: BulkContextUploadWorkflowStep[];
  };
  results: BulkContextUploadFileResult[];
  persistence: {
    status: "validation_only" | "staged_and_enqueued" | "staged_and_processed";
    detail: string;
  };
}

const BULK_CONTEXT_BUCKET = "context-uploads";
const MAX_BULK_FILES = 40;

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("bulk_manifest_not_object");
  }
  return value as Record<string, unknown>;
}

function asString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`bulk_manifest_missing_${field}`);
  }
  return value.trim();
}

function asOptionalString(value: unknown): string | null | undefined {
  if (value === null) return null;
  if (value === undefined) return undefined;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function asOptionalStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function asOptionalStringMap(
  value: unknown,
): Record<string, string> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([, mapValue]) => typeof mapValue === "string")
      .map(([key, mapValue]) => [key, String(mapValue).trim()])
      .filter(([, mapValue]) => mapValue.length > 0),
  );
}

function safeLoadSlug(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 72) || "bulk-load"
  );
}

function cleanManifestPath(value: string): string {
  const normalized = value.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!normalized || normalized.includes("..")) {
    throw new Error(`bulk_manifest_unsafe_path:${value}`);
  }
  return normalized;
}

function pathKey(value: string): string {
  return cleanManifestPath(value).toLowerCase();
}

function fileKey(value: string): string {
  return path.posix.basename(value.replace(/\\/g, "/")).toLowerCase();
}

export function parseBulkContextUploadManifest(
  raw: string,
  tenantKey: string,
): BulkContextUploadManifest {
  const parsed = asObject(JSON.parse(raw) as unknown);
  const loadName = asString(parsed.loadName, "loadName");
  const rawFiles = parsed.files;
  if (!Array.isArray(rawFiles) || rawFiles.length === 0) {
    throw new Error("bulk_manifest_missing_files");
  }
  if (rawFiles.length > MAX_BULK_FILES) {
    throw new Error(`bulk_manifest_too_many_files:${MAX_BULK_FILES}`);
  }

  const files = rawFiles.map(
    (rawFile, index): BulkContextUploadManifestFile => {
      const file = asObject(rawFile);
      const templateId = asString(file.templateId, `files_${index}_templateId`);
      if (!getTemplateById(templateId, { tenantKey })) {
        throw new Error(`bulk_manifest_unknown_template:${templateId}`);
      }
      return {
        path: cleanManifestPath(asString(file.path, `files_${index}_path`)),
        templateId,
        sourceRecordIdColumn: asOptionalString(file.sourceRecordIdColumn),
        titleColumn: asOptionalString(file.titleColumn),
        textColumns: asOptionalStringArray(file.textColumns),
        fieldMappings: asOptionalStringMap(file.fieldMappings),
        dataClassification:
          asOptionalString(file.dataClassification) ??
          asOptionalString(parsed.defaultDataClassification) ??
          "confidential_business",
      };
    },
  );

  const duplicatePaths = new Set<string>();
  const seenPaths = new Set<string>();
  for (const file of files) {
    const key = pathKey(file.path);
    if (seenPaths.has(key)) duplicatePaths.add(key);
    seenPaths.add(key);
  }
  if (duplicatePaths.size > 0) {
    throw new Error(
      `bulk_manifest_duplicate_file:${[...duplicatePaths].join(",")}`,
    );
  }

  return {
    loadName,
    defaultDataClassification: asOptionalString(
      parsed.defaultDataClassification,
    ),
    files,
  };
}

function sha256(bytes: ArrayBuffer): string {
  return crypto.createHash("sha256").update(Buffer.from(bytes)).digest("hex");
}

function mimeType(file: BulkContextUploadFileInput): string {
  if (file.type?.trim()) return file.type;
  const lower = file.name.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".docx"))
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (lower.endsWith(".pptx"))
    return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  if (lower.endsWith(".xlsx"))
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  if (lower.endsWith(".json")) return "application/json";
  if (lower.endsWith(".jsonl")) return "application/x-ndjson";
  if (lower.endsWith(".yaml") || lower.endsWith(".yml"))
    return "application/x-yaml";
  if (lower.endsWith(".md") || lower.endsWith(".markdown"))
    return "text/markdown";
  return "text/csv";
}

function canProcessImmediately(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return (
    lower.endsWith(".csv") ||
    lower.endsWith(".json") ||
    lower.endsWith(".jsonl") ||
    lower.endsWith(".yaml") ||
    lower.endsWith(".yml")
  );
}

function metadataValue(value: unknown): string {
  return String(value ?? "")
    .replace(/[^a-zA-Z0-9 _.-]/g, "_")
    .slice(0, 256);
}

function landingMessage(args: {
  tenantKey: string;
  segmentKey: SegmentKey;
  location: ReturnType<typeof describeObjectStorageLocation>;
  contentType: string;
  sizeBytes: number;
  sha256: string;
  classification: string | null | undefined;
  producedAt: string;
  metadata: Record<string, string | number | boolean>;
}): AzureLandingZoneMessage {
  return {
    schema: "abarva.ingestion.v1",
    tenantClientKey: args.tenantKey,
    segmentKey: args.segmentKey,
    storage: {
      accountName: args.location.accountName,
      containerName: args.location.containerName,
      blobPath: args.location.blobPath,
      sizeBytes: args.sizeBytes,
      contentType: args.contentType,
      sha256: args.sha256,
    },
    declaredClassification:
      (args.classification as AzureLandingZoneMessage["declaredClassification"]) ??
      "confidential_business",
    producedAt: args.producedAt,
    metadata: args.metadata,
  };
}

function progressJobId(args: {
  tenantKey: string;
  loadName: string;
  uploadedAt: string;
  files: Array<{ fileName: string; sha256: string }>;
}): string {
  const basis = [
    args.tenantKey,
    args.loadName,
    args.uploadedAt,
    ...args.files.map((file) => `${file.fileName}:${file.sha256}`),
  ].join("|");
  return `bulk-${crypto.createHash("sha256").update(basis).digest("hex").slice(0, 16)}`;
}

function matchManifestFiles(args: {
  manifest: BulkContextUploadManifest;
  files: BulkContextUploadFileInput[];
}): Map<string, BulkContextUploadFileInput> {
  const filesByPath = new Map<string, BulkContextUploadFileInput>();
  const duplicateUploadPaths = new Set<string>();
  for (const file of args.files) {
    const key = pathKey(file.name);
    if (filesByPath.has(key)) duplicateUploadPaths.add(key);
    filesByPath.set(key, file);
  }
  if (duplicateUploadPaths.size > 0) {
    throw new Error(
      `bulk_upload_duplicate_file:${[...duplicateUploadPaths].join(",")}`,
    );
  }

  const manifestBaseCounts = new Map<string, number>();
  for (const file of args.manifest.files) {
    const key = fileKey(file.path);
    manifestBaseCounts.set(key, (manifestBaseCounts.get(key) ?? 0) + 1);
  }
  const uploadBaseCounts = new Map<string, number>();
  for (const file of args.files) {
    const key = fileKey(file.name);
    uploadBaseCounts.set(key, (uploadBaseCounts.get(key) ?? 0) + 1);
  }

  const matches = new Map<string, BulkContextUploadFileInput>();
  const usedUploadPaths = new Set<string>();
  const missingUploads: string[] = [];
  for (const manifestFile of args.manifest.files) {
    const manifestPathKey = pathKey(manifestFile.path);
    const exact = filesByPath.get(manifestPathKey);
    if (exact) {
      matches.set(manifestFile.path, exact);
      usedUploadPaths.add(manifestPathKey);
      continue;
    }

    const baseKey = fileKey(manifestFile.path);
    if (
      (manifestBaseCounts.get(baseKey) ?? 0) === 1 &&
      (uploadBaseCounts.get(baseKey) ?? 0) === 1
    ) {
      const fallback = args.files.find(
        (file) => fileKey(file.name) === baseKey,
      );
      if (fallback) {
        matches.set(manifestFile.path, fallback);
        usedUploadPaths.add(pathKey(fallback.name));
        continue;
      }
    }
    missingUploads.push(manifestFile.path);
  }
  if (missingUploads.length > 0) {
    throw new Error(`bulk_upload_missing_files:${missingUploads.join(",")}`);
  }

  const unexpectedUploads = args.files
    .map((file) => pathKey(file.name))
    .filter((key) => !usedUploadPaths.has(key));
  if (unexpectedUploads.length > 0) {
    throw new Error(
      `bulk_upload_unmapped_files:${unexpectedUploads.join(",")}`,
    );
  }

  return matches;
}

function buildWorkflow(args: {
  mode: BulkContextUploadInput["mode"];
  jobId: string;
  results: BulkContextUploadFileResult[];
}): BulkContextUploadResult["workflow"] {
  const files = args.results.length;
  const plural = files === 1 ? "file" : "files";
  const queued = args.results.filter((item) => item.queue).length;
  const processed = args.results.filter((item) => item.loadResult).length;
  const staged = args.results.filter((item) => item.blob.staged).length;

  const baseSteps: BulkContextUploadWorkflowStep[] = [
    {
      id: "package_received",
      label: "Package received",
      status: "complete",
      detail: `${files} ${plural} matched the manifest and tenant boundary.`,
    },
    {
      id: "attestation_verified",
      label: "Operator attestation verified",
      status: "complete",
      detail:
        "Authority, intended use, and restricted-data review were confirmed before processing.",
    },
    {
      id: "sensitive_data_scan",
      label: "Sensitive-data scan completed",
      status: "complete",
      detail: "Every file passed the pre-storage upload protection gate.",
    },
  ];

  if (args.mode === "validate_only") {
    return {
      jobId: args.jobId,
      summary:
        "Validation passed. Nothing was written to Azure Blob or tenant context.",
      status: {
        persisted: false,
        bucket: null,
        path: null,
        pollable: false,
      },
      steps: [
        ...baseSteps,
        {
          id: "blob_staging",
          label: "Azure Blob staging",
          status: "skipped",
          detail: "Validate-only mode stops before storage writes.",
        },
        {
          id: "tenant_context_commit",
          label: "Tenant context commit",
          status: "skipped",
          detail:
            "Run stage-and-process for structured files or stage-and-queue for worker processing.",
        },
      ],
    };
  }

  if (args.mode === "stage_and_enqueue") {
    return {
      jobId: args.jobId,
      summary:
        "Files are staged and queued. Azure private-worker processing is the next handoff.",
      status: {
        persisted: false,
        bucket: null,
        path: null,
        pollable: false,
      },
      steps: [
        ...baseSteps,
        {
          id: "blob_staging",
          label: "Azure Blob staging completed",
          status: "complete",
          detail: `${staged} ${plural} staged in the governed context upload container.`,
        },
        {
          id: "worker_queue",
          label: "Azure worker queued",
          status: "complete",
          detail: `${queued} ${plural} queued for private data-plane extraction and mapping.`,
        },
        {
          id: "private_worker",
          label: "Private worker processing",
          status: "active",
          detail:
            "Waiting for the Azure worker to extract, classify, map, and return file-level outcomes.",
        },
        {
          id: "operator_review",
          label: "Operator review",
          status: "pending",
          detail:
            "Review extracted records, warnings, and evidence counts before final tenant-context commit.",
        },
        {
          id: "tenant_context_commit",
          label: "Tenant context commit",
          status: "pending",
          detail: "Commit after worker output and operator review pass.",
        },
      ],
    };
  }

  return {
    jobId: args.jobId,
    summary:
      "Structured files were staged and processed through the governed loader.",
    status: {
      persisted: false,
      bucket: null,
      path: null,
      pollable: false,
    },
    steps: [
      ...baseSteps,
      {
        id: "blob_staging",
        label: "Azure Blob staging completed",
        status: "complete",
        detail: `${staged} ${plural} staged in the governed context upload container.`,
      },
      {
        id: "immediate_processing",
        label: "Immediate loader processing completed",
        status: "complete",
        detail: `${processed} ${plural} processed without waiting for the private worker.`,
      },
      {
        id: "enterprise_context_promotion",
        label: "Structured facts promoted",
        status: "complete",
        detail: `${args.results.reduce(
          (sum, item) =>
            sum +
            (item.loadResult?.enterpriseContextPromotion.recordsPromoted ?? 0),
          0,
        )} records and ${args.results.reduce(
          (sum, item) =>
            sum +
            (item.loadResult?.enterpriseContextPromotion.factsPromoted ?? 0),
          0,
        )} facts were promoted into Enterprise Context.`,
      },
      {
        id: "tenant_context_commit",
        label: "Tenant context commit completed",
        status: "complete",
        detail:
          "Parsed rows were written as chunks and normalized records/facts through the governed tenant-context loader.",
      },
    ],
  };
}

export async function runBulkContextUpload(
  input: BulkContextUploadInput,
): Promise<BulkContextUploadResult> {
  const uploadedAt = input.uploadedAt ?? new Date().toISOString();
  const loadSlug = safeLoadSlug(input.manifest.loadName);
  const enqueueMessage =
    input.enqueueMessageFn ?? enqueueAzureLandingZoneMessage;
  const matchedFiles = matchManifestFiles({
    manifest: input.manifest,
    files: input.files,
  });

  const workItems = input.manifest.files.map((manifestFile) => {
    const uploadFile = matchedFiles.get(manifestFile.path)!;
    if (
      input.mode === "stage_and_process" &&
      !canProcessImmediately(uploadFile.name)
    ) {
      throw new Error(
        `bulk_upload_process_requires_structured_file:${uploadFile.name}`,
      );
    }
    const template = getTemplateById(manifestFile.templateId, {
      tenantKey: input.tenantKey,
    });
    if (!template) {
      throw new Error(
        `bulk_manifest_unknown_template:${manifestFile.templateId}`,
      );
    }
    const segmentKey = segmentKeyForContextDimension(template.dimension);
    const contentType = mimeType(uploadFile);
    const hash = sha256(uploadFile.bytes);
    const dataProtection = evaluateSensitiveUpload({
      filename: uploadFile.name,
      mimeType: contentType,
      bytes: uploadFile.bytes,
      declaredClassification: manifestFile.dataClassification,
    });
    if (dataProtection.decision === "quarantine") {
      throw new Error(`bulk_upload_quarantined:${uploadFile.name}`);
    }
    const blobPath = [
      safeLoadSlug(input.tenantKey),
      loadSlug,
      hash.slice(0, 12),
      cleanManifestPath(manifestFile.path),
    ].join("/");

    return {
      manifestFile,
      uploadFile,
      template,
      segmentKey,
      contentType,
      hash,
      dataProtection,
      blobPath,
    };
  });

  const jobId = progressJobId({
    tenantKey: input.tenantKey,
    loadName: input.manifest.loadName,
    uploadedAt,
    files: workItems.map((item) => ({
      fileName: item.uploadFile.name,
      sha256: item.hash,
    })),
  });

  const results: BulkContextUploadFileResult[] = [];

  for (const {
    manifestFile,
    uploadFile,
    segmentKey,
    contentType,
    hash,
    dataProtection,
    blobPath,
  } of workItems) {
    let loadResult: CsvUploadLoadResult | null = null;
    let queue: BulkContextUploadQueueResult | null = null;
    if (
      input.mode === "stage_and_process" ||
      input.mode === "stage_and_enqueue"
    ) {
      await getObjectStorageAdapter().upload(
        BULK_CONTEXT_BUCKET,
        blobPath,
        Buffer.from(uploadFile.bytes),
        {
          contentType,
          upsert: false,
          metadata: {
            tenantClientKey: metadataValue(input.tenantKey),
            tenantKey: metadataValue(input.tenantKey),
            clientId: metadataValue(input.clientId),
            segmentKey: metadataValue(segmentKey),
            loadName: metadataValue(input.manifest.loadName),
            templateId: metadataValue(manifestFile.templateId),
            sourceSystem: "admin_bulk_context_upload",
            templateVersion: "unversioned",
            mappingProfileKey: metadataValue(manifestFile.templateId),
            mappingProfileVersion: "unversioned",
            bulkJobId: jobId,
            attestationVersion: metadataValue(input.attestation.version),
            declaredClassification: metadataValue(
              manifestFile.dataClassification ?? "confidential_business",
            ),
            sha256: hash,
            uploadedBy: metadataValue(input.uploadedBy),
            initiatedByUserId: metadataValue(input.uploadedBy),
          },
        },
      );
    }

    if (input.mode === "stage_and_enqueue") {
      const location = describeObjectStorageLocation(
        BULK_CONTEXT_BUCKET,
        blobPath,
      );
      queue = await enqueueMessage(
        landingMessage({
          tenantKey: input.tenantKey,
          segmentKey,
          location,
          contentType,
          sizeBytes: uploadFile.bytes.byteLength,
          sha256: hash,
          classification: manifestFile.dataClassification,
          producedAt: uploadedAt,
          metadata: {
            source: "admin_bulk_context_upload",
            sourceSystem: "admin_bulk_context_upload",
            clientId: metadataValue(input.clientId),
            initiatedByUserId: metadataValue(input.uploadedBy),
            uploadedBy: metadataValue(input.uploadedBy),
            attestationVersion: metadataValue(input.attestation.version),
            loadName: metadataValue(input.manifest.loadName),
            templateId: metadataValue(manifestFile.templateId),
            templateVersion: "unversioned",
            mappingProfileKey: metadataValue(manifestFile.templateId),
            mappingProfileVersion: "unversioned",
            bulkJobId: jobId,
            bulkJobStatusPath: bulkContextUploadJobStatusLocation({
              tenantKey: input.tenantKey,
              jobId,
            }).path,
            originalFileName: metadataValue(uploadFile.name),
            manifestPath: metadataValue(manifestFile.path),
          },
        }),
      );
    }

    if (input.mode === "stage_and_process") {
      loadResult = await loadCsvUploadToTenantContext({
        clientId: input.clientId,
        tenantKey: input.tenantKey,
        uploadedBy: input.uploadedBy,
        fileName: uploadFile.name,
        csvText: new TextDecoder("utf-8", { fatal: false }).decode(
          uploadFile.bytes,
        ),
        uploadedAt,
        attestation: input.attestation,
        mapping: {
          templateId: manifestFile.templateId,
          sourceRecordIdColumn: manifestFile.sourceRecordIdColumn,
          titleColumn: manifestFile.titleColumn,
          textColumns: manifestFile.textColumns,
          fieldMappings: manifestFile.fieldMappings,
          dataClassification: manifestFile.dataClassification,
        } satisfies CsvSchemaMapping,
      });
    }

    results.push({
      fileName: uploadFile.name,
      templateId: manifestFile.templateId,
      dataProtection,
      blob: {
        bucket: BULK_CONTEXT_BUCKET,
        path: blobPath,
        sha256: hash,
        staged:
          input.mode === "stage_and_process" ||
          input.mode === "stage_and_enqueue",
      },
      queue,
      loadResult,
      processing:
        input.mode === "validate_only"
          ? {
              status: "validated_only",
              label: "Validated only",
              nextAction:
                "Run stage-and-queue for Azure extraction or stage-and-process for structured files.",
            }
          : input.mode === "stage_and_enqueue"
            ? {
                status: "staged_for_worker",
                label: "Staged and queued",
                nextAction:
                  "Wait for Azure private-worker extraction, then review mapped records.",
              }
            : {
                status: "processed_now",
                label: "Processed and promoted",
                nextAction:
                  "Review chunk evidence, structured records, and fact coverage in Data Trust.",
              },
    });
  }

  const rowsParsed = results.reduce(
    (sum, item) => sum + (item.loadResult?.rowsParsed ?? 0),
    0,
  );
  const chunksQueued = results.reduce(
    (sum, item) => sum + (item.loadResult?.chunksQueued ?? 0),
    0,
  );
  const recordsPromoted = results.reduce(
    (sum, item) =>
      sum + (item.loadResult?.enterpriseContextPromotion.recordsPromoted ?? 0),
    0,
  );
  const factsPromoted = results.reduce(
    (sum, item) =>
      sum + (item.loadResult?.enterpriseContextPromotion.factsPromoted ?? 0),
    0,
  );

  const result: BulkContextUploadResult = {
    ok: true,
    mode: input.mode,
    loadName: input.manifest.loadName,
    filesReceived: input.files.length,
    filesProcessed: results.length,
    rowsParsed,
    chunksQueued,
    recordsPromoted,
    factsPromoted,
    blobBucket: BULK_CONTEXT_BUCKET,
    workflow: buildWorkflow({
      mode: input.mode,
      jobId,
      results,
    }),
    results,
    persistence:
      input.mode === "validate_only"
        ? {
            status: "validation_only",
            detail:
              "Manifest, files, template mappings, and sensitive-data gate passed. No Blob or context rows were written.",
          }
        : input.mode === "stage_and_enqueue"
          ? {
              status: "staged_and_enqueued",
              detail:
                "Files were staged to Azure Blob and queued for private Azure worker processing.",
            }
          : {
              status: "staged_and_processed",
              detail:
                "Files were staged to Azure Blob, parsed into chunk evidence, and promoted into structured Enterprise Context records/facts.",
            },
  };

  if (input.mode !== "validate_only") {
    const statusLocation = bulkContextUploadJobStatusLocation({
      tenantKey: input.tenantKey,
      jobId: result.workflow.jobId,
    });
    result.workflow.status = {
      persisted: true,
      bucket: statusLocation.bucket,
      path: statusLocation.path,
      pollable: true,
    };
    await persistBulkContextUploadJobStatus({
      clientId: input.clientId,
      tenantKey: input.tenantKey,
      result,
      updatedAt: uploadedAt,
    });
  }

  return result;
}
