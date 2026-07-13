import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";

import { emitNotification } from "@/lib/admin/broker/notification-broker";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import {
  parseBulkContextUploadManifest,
  runBulkContextUpload,
  type BulkContextUploadInput,
  type BulkContextUploadResult,
} from "@/lib/context-ingestion/bulk-context-upload";
import { validatePilotUploadAttestation } from "@/lib/context-ingestion/upload-attestation";
import { canonicalTenantKey } from "@/lib/tenant/aliases";
import { LEGACY_CONTROLLED_IMPORT_WARNING } from "@/lib/admin/setup-control";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_ZIP_BYTES = 25 * 1024 * 1024;
const LEGACY_CONTROLLED_IMPORT = {
  legacyControlledImport: true,
  directActiveMutationPossible: true,
  candidateRunwayBypassed: true,
  warning: LEGACY_CONTROLLED_IMPORT_WARNING,
} as const;

type BulkRouteFile = {
  name: string;
  type: string;
  size: number;
  arrayBuffer: () => Promise<ArrayBuffer>;
  text?: () => Promise<string>;
};

function formString(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function readManifest(formData: FormData): Promise<string> {
  const inline = formString(formData, "manifestJson");
  if (inline) return inline;
  const manifestFile = formData.get("manifest");
  if (manifestFile instanceof File) return manifestFile.text();
  throw new Error("manifest required");
}

function normalizeZipPath(value: string): string {
  const normalized = value.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!normalized || normalized.includes("..")) {
    throw new Error(`bulk_zip_unsafe_path:${value}`);
  }
  return normalized;
}

function zipEntryPath(entry: JSZip.JSZipObject): string {
  return (
    (entry as JSZip.JSZipObject & { unsafeOriginalName?: string })
      .unsafeOriginalName ?? entry.name
  );
}

function isZipFile(file: File): boolean {
  return file.name.toLowerCase().endsWith(".zip");
}

function zipMimeType(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".csv")) return "text/csv";
  if (lower.endsWith(".json")) return "application/json";
  if (lower.endsWith(".jsonl")) return "application/x-ndjson";
  if (lower.endsWith(".yaml") || lower.endsWith(".yml"))
    return "application/x-yaml";
  if (lower.endsWith(".xlsx"))
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".docx"))
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (lower.endsWith(".pptx"))
    return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  if (lower.endsWith(".md") || lower.endsWith(".markdown"))
    return "text/markdown";
  return "application/octet-stream";
}

async function readZipPackage(file: File): Promise<{
  manifestJson: string;
  files: BulkRouteFile[];
}> {
  if (file.size > MAX_ZIP_BYTES) {
    throw new Error(`bulk_zip_exceeds_${MAX_ZIP_BYTES}_bytes`);
  }
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const entries = Object.values(zip.files).filter((entry) => !entry.dir);
  const manifestEntries = entries.filter((entry) => {
    const normalized = normalizeZipPath(zipEntryPath(entry)).toLowerCase();
    return (
      normalized === "manifest.json" || normalized === "bulk-manifest.json"
    );
  });
  if (manifestEntries.length === 0)
    throw new Error("bulk_zip_missing_manifest");
  if (manifestEntries.length > 1)
    throw new Error("bulk_zip_multiple_manifests");

  const manifestEntry = manifestEntries[0]!;
  const files: BulkRouteFile[] = [];
  for (const entry of entries) {
    const normalized = normalizeZipPath(zipEntryPath(entry));
    if (entry === manifestEntry) continue;
    const bytes = await entry.async("uint8array");
    if (bytes.byteLength > MAX_FILE_BYTES) {
      throw new Error(
        `bulk_zip_file_exceeds_${MAX_FILE_BYTES}_bytes:${normalized}`,
      );
    }
    const arrayBuffer = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength,
    ) as ArrayBuffer;
    files.push({
      name: normalized,
      type: zipMimeType(normalized),
      size: bytes.byteLength,
      arrayBuffer: async () => arrayBuffer,
    });
  }
  if (files.length === 0) throw new Error("bulk_zip_missing_files");

  return {
    manifestJson: await manifestEntry.async("text"),
    files,
  };
}

async function emitBulkUploadSuccessNotification(args: {
  tenantKey: string;
  userId: string;
  mode: BulkContextUploadInput["mode"];
  result: BulkContextUploadResult;
}): Promise<
  | { ok: true; eventId: string; enqueuedDeliveries: number }
  | { ok: false; error: string }
  | null
> {
  if (!args.result.ok || args.mode === "validate_only") return null;

  try {
    const notification = await emitNotification({
      tenantKey: args.tenantKey,
      eventType: "intelligence.context_refreshed",
      actorUserId: args.userId,
      targetResourceId: args.result.workflow.jobId,
      payload: {
        title: "Context load completed",
        body: `${args.result.loadName} processed ${args.result.filesProcessed} files, ${args.result.rowsParsed} rows, ${args.result.recordsPromoted} structured records, and ${args.result.factsPromoted} facts.`,
        href: "/admin/setup",
        segmentId: args.result.loadName,
        segmentLabel: args.result.loadName,
        refreshedBy: args.userId,
        loadName: args.result.loadName,
        mode: args.mode,
        jobId: args.result.workflow.jobId,
        filesProcessed: args.result.filesProcessed,
        rowsParsed: args.result.rowsParsed,
        chunksQueued: args.result.chunksQueued,
        recordsPromoted: args.result.recordsPromoted,
        factsPromoted: args.result.factsPromoted,
        blobBucket: args.result.blobBucket,
        workflowStatus: args.result.workflow.status,
        persistence: args.result.persistence,
      },
    });
    return { ok: true, ...notification };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function POST(request: NextRequest) {
  let tenancy;
  try {
    tenancy = await requireTenancy();
  } catch (error) {
    return tenancyErrorResponse(error) as NextResponse;
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "invalid_multipart" }, { status: 400 });
  }

  const clientId = formString(formData, "clientId");
  if (!clientId) {
    return NextResponse.json({ error: "clientId required" }, { status: 400 });
  }
  if (clientId !== tenancy.clientId) {
    return NextResponse.json(
      { error: "forbidden_cross_tenant" },
      { status: 403 },
    );
  }
  if (!tenancy.clientKey) {
    return NextResponse.json({ error: "tenant_key_required" }, { status: 403 });
  }

  const attestation = validatePilotUploadAttestation({
    accepted: formData.get("operatorAttestationAccepted"),
    version: formData.get("operatorAttestationVersion"),
    authorityConfirmed: formData.get("operatorDataAuthorityConfirmed"),
    dataUseConfirmed: formData.get("operatorDataUseConfirmed"),
    sensitiveDataConfirmed: formData.get("operatorSensitiveDataConfirmed"),
    note: formData.get("operatorAttestationNote"),
  });
  if ("error" in attestation) {
    return NextResponse.json(attestation, { status: 400 });
  }

  const tenantKey = canonicalTenantKey(tenancy.clientKey);
  const rawMode = formString(formData, "mode");
  const mode =
    rawMode === "stage_and_process" || rawMode === "stage_and_enqueue"
      ? rawMode
      : "validate_only";

  try {
    const rawUploadedFiles = formData
      .getAll("files")
      .filter((file): file is File => file instanceof File);
    if (rawUploadedFiles.length === 0) {
      return NextResponse.json({ error: "files required" }, { status: 400 });
    }
    const zipFiles = rawUploadedFiles.filter(isZipFile);
    if (
      zipFiles.length > 1 ||
      (zipFiles.length === 1 && rawUploadedFiles.length > 1)
    ) {
      return NextResponse.json(
        {
          error: "bulk_upload_invalid",
          detail: "bulk_zip_must_be_single_file",
        },
        { status: 400 },
      );
    }

    let manifestJson: string;
    let uploadedFiles: BulkRouteFile[];
    if (zipFiles.length === 1) {
      const zipPackage = await readZipPackage(zipFiles[0]!);
      manifestJson = zipPackage.manifestJson;
      uploadedFiles = zipPackage.files;
    } else {
      manifestJson = await readManifest(formData);
      uploadedFiles = rawUploadedFiles;
    }

    const manifest = parseBulkContextUploadManifest(manifestJson, tenantKey);
    for (const file of uploadedFiles) {
      if (file.size > MAX_FILE_BYTES) {
        return NextResponse.json(
          {
            error: `file exceeds ${MAX_FILE_BYTES} bytes`,
            fileName: file.name,
          },
          { status: 413 },
        );
      }
    }

    const result = await runBulkContextUpload({
      clientId: tenancy.clientId,
      tenantKey,
      uploadedBy: tenancy.userId,
      manifest,
      mode,
      attestation,
      files: await Promise.all(
        uploadedFiles.map(async (file) => ({
          name: file.name,
          type: file.type,
          bytes: await file.arrayBuffer(),
        })),
      ),
    });

    const notification = await emitBulkUploadSuccessNotification({
      tenantKey,
      userId: tenancy.userId,
      mode,
      result,
    });

    return NextResponse.json(
      {
        ...result,
        legacyControlledImport:
          mode === "stage_and_process"
            ? LEGACY_CONTROLLED_IMPORT
            : {
                ...LEGACY_CONTROLLED_IMPORT,
                directActiveMutationPossible: false,
                candidateRunwayBypassed: false,
              },
        adminNotification: notification,
      },
      {
        status: mode === "validate_only" ? 202 : 200,
      },
    );
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    const status =
      detail.startsWith("bulk_manifest_") ||
      detail.startsWith("bulk_upload_") ||
      detail.startsWith("bulk_zip_") ||
      detail === "manifest required"
        ? 400
        : 500;
    return NextResponse.json(
      {
        ok: false,
        error: status === 400 ? "bulk_upload_invalid" : "bulk_upload_failed",
        detail,
      },
      { status },
    );
  }
}
