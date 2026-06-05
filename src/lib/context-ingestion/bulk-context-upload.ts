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
}

export interface BulkContextUploadResult {
  ok: boolean;
  mode: BulkContextUploadInput["mode"];
  loadName: string;
  filesReceived: number;
  filesProcessed: number;
  rowsParsed: number;
  chunksQueued: number;
  blobBucket: string;
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

function asOptionalStringMap(value: unknown): Record<string, string> | undefined {
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

  const files = rawFiles.map((rawFile, index): BulkContextUploadManifestFile => {
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
  });

  const duplicatePaths = new Set<string>();
  const seenPaths = new Set<string>();
  for (const file of files) {
    const key = fileKey(file.path);
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
    defaultDataClassification: asOptionalString(parsed.defaultDataClassification),
    files,
  };
}

function sha256(bytes: ArrayBuffer): string {
  return crypto.createHash("sha256").update(Buffer.from(bytes)).digest("hex");
}

function mimeType(file: BulkContextUploadFileInput): string {
  if (file.type?.trim()) return file.type;
  const lower = file.name.toLowerCase();
  if (lower.endsWith(".json")) return "application/json";
  if (lower.endsWith(".jsonl")) return "application/x-ndjson";
  if (lower.endsWith(".yaml") || lower.endsWith(".yml"))
    return "application/x-yaml";
  return "text/csv";
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

export async function runBulkContextUpload(
  input: BulkContextUploadInput,
): Promise<BulkContextUploadResult> {
  const filesByName = new Map(input.files.map((file) => [fileKey(file.name), file]));
  const manifestByName = new Map(
    input.manifest.files.map((file) => [fileKey(file.path), file]),
  );
  const missingUploads = [...manifestByName.keys()].filter(
    (key) => !filesByName.has(key),
  );
  if (missingUploads.length > 0) {
    throw new Error(`bulk_upload_missing_files:${missingUploads.join(",")}`);
  }
  const unexpectedUploads = [...filesByName.keys()].filter(
    (key) => !manifestByName.has(key),
  );
  if (unexpectedUploads.length > 0) {
    throw new Error(
      `bulk_upload_unmapped_files:${unexpectedUploads.join(",")}`,
    );
  }

  const uploadedAt = input.uploadedAt ?? new Date().toISOString();
  const loadSlug = safeLoadSlug(input.manifest.loadName);
  const results: BulkContextUploadFileResult[] = [];
  const enqueueMessage = input.enqueueMessageFn ?? enqueueAzureLandingZoneMessage;

  for (const manifestFile of input.manifest.files) {
    const uploadFile = filesByName.get(fileKey(manifestFile.path))!;
    const template = getTemplateById(manifestFile.templateId, {
      tenantKey: input.tenantKey,
    });
    if (!template) {
      throw new Error(`bulk_manifest_unknown_template:${manifestFile.templateId}`);
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

    let loadResult: CsvUploadLoadResult | null = null;
    let queue: BulkContextUploadQueueResult | null = null;
    if (input.mode === "stage_and_process" || input.mode === "stage_and_enqueue") {
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
            segmentKey: metadataValue(segmentKey),
            loadName: metadataValue(input.manifest.loadName),
            templateId: metadataValue(manifestFile.templateId),
            declaredClassification: metadataValue(
              manifestFile.dataClassification ?? "confidential_business",
            ),
            sha256: hash,
            uploadedBy: metadataValue(input.uploadedBy),
          },
        },
      );
    }

    if (input.mode === "stage_and_enqueue") {
      const location = describeObjectStorageLocation(BULK_CONTEXT_BUCKET, blobPath);
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
            loadName: metadataValue(input.manifest.loadName),
            templateId: metadataValue(manifestFile.templateId),
            originalFileName: metadataValue(uploadFile.name),
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
        staged: input.mode === "stage_and_process" || input.mode === "stage_and_enqueue",
      },
      queue,
      loadResult,
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

  return {
    ok: true,
    mode: input.mode,
    loadName: input.manifest.loadName,
    filesReceived: input.files.length,
    filesProcessed: results.length,
    rowsParsed,
    chunksQueued,
    blobBucket: BULK_CONTEXT_BUCKET,
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
              "Files were staged to Azure Blob and processed through the governed context loader.",
          },
  };
}
