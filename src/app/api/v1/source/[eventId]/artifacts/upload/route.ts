// POST /api/v1/source/:eventId/artifacts/upload
//
// Server-mediated Source paperclip upload. This is intentionally the first
// receipt step only: bytes land in the private source-artifacts bucket and a
// registry row is created with parser/vector/graph states still pending.

import { createHash, randomUUID } from "node:crypto";

import { requireTenancy, tenancyErrorResponse } from "@/app/api/v1/_intel-auth";
import { getActiveClientRow } from "@/lib/active-client";
import { clientKeyToInventorySubstrateKey } from "@/lib/agent/tools/intelligence/_shared";
import { getObjectStorageAdapter } from "@/lib/data-plane/objectStorage";
import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import { selectSourceWriteAdapter } from "@/lib/data-plane/write-adapters/sourceWriteAdapter";
import {
  normalizeSourceStageKey,
  SOURCE_STAGE_ORDER,
} from "@/lib/source/constants";
import { getSourcingEvent, type SourceEventRow } from "@/lib/source/queries";
import type { SourceStageKey } from "@/lib/source/types";
import {
  buildSourceArtifactBlobPath,
  isAllowedSourceArtifactMimeType,
  isWithinSourceArtifactSizeLimit,
  MAX_SOURCE_ARTIFACT_SIZE_BYTES,
  registerSourceArtifactUpload,
  type SourceDataClassification,
} from "@/lib/source/artifact-registry";
import {
  inferSourceArtifactFamily,
  sourceArtifactFormatFromMime,
} from "@/lib/source/artifact-registry/upload-contract";
import {
  isSynchronouslyParseableSourceFormat,
  parseSourceTextArtifact,
} from "@/lib/source/artifact-registry/text-parser";
import { getCriterionIdsForArtifactFamily } from "@/lib/source/artifact-gate-map";
import { addEvidence } from "@/lib/reasoning/evidence-ingestion-store";
import {
  syncUploadToCanvasSubstrate,
  type UploadSubstrateSyncResult,
} from "@/lib/source/canvas-substrate/upload-sync";
import {
  evaluateSensitiveUpload,
  sensitiveUploadRejectedResponse,
} from "@/lib/security/sensitive-upload-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const STORAGE_BUCKET = "source-artifacts";

type SourceUploadRouteContext = {
  params: Promise<{ eventId?: string }>;
};

type ResolvedSourceEventScope = {
  eventId: string;
  sourceEventRowId?: string;
  stageKey: SourceStageKey;
};

function jsonError(status: number, code: string, detail?: string): Response {
  return Response.json(
    { ok: false, error: code, ...(detail ? { detail } : {}) },
    { status },
  );
}

function parseOptionalString(
  raw: FormDataEntryValue | null,
): string | undefined {
  if (raw === null || raw === undefined) return undefined;
  const str = String(raw).trim();
  return str.length > 0 ? str : undefined;
}

function parseDataClassification(
  raw: FormDataEntryValue | null,
): SourceDataClassification | undefined {
  const value = parseOptionalString(raw);
  if (!value) return undefined;
  if (
    value === "Public" ||
    value === "Internal" ||
    value === "Confidential" ||
    value === "Restricted"
  ) {
    return value;
  }
  throw new Error(
    `dataClassification must be Public, Internal, Confidential, or Restricted; got ${value}`,
  );
}

function parseStageKey(
  raw: FormDataEntryValue | null,
): SourceStageKey | undefined {
  const value = parseOptionalString(raw);
  if (!value) return undefined;
  const normalized = normalizeSourceStageKey(value);
  if (
    normalized &&
    (SOURCE_STAGE_ORDER as readonly string[]).includes(normalized)
  )
    return normalized;
  throw new Error(`stageKey must be canonical Source stage, got ${value}`);
}

function seedEventMatchesClient(
  accountName: string,
  clientKey: string,
): boolean {
  const normalized = accountName.toLowerCase();
  if (clientKey === "apexretail") return normalized.includes("apex");
  if (clientKey === "meridian") return normalized.includes("meridian");
  return false;
}

async function getPersistedSourceEventRow(
  clientKey: string,
  eventId: string,
): Promise<SourceEventRow | null> {
  const { data, error } = await getAzureReadFluentClient()
    .from("source_events")
    .select("*")
    .eq("id", eventId)
    .eq("client_key", clientKey)
    .maybeSingle();

  if (error) throw error;
  return (data as SourceEventRow | null) ?? null;
}

async function resolveSourceEventScope(args: {
  clientKey: string;
  eventId: string;
  requestedStageKey?: SourceStageKey;
}): Promise<ResolvedSourceEventScope | null> {
  const persisted = await getPersistedSourceEventRow(
    args.clientKey,
    args.eventId,
  );
  if (persisted) {
    return {
      eventId: persisted.id,
      sourceEventRowId: persisted.id,
      stageKey:
        args.requestedStageKey ??
        normalizeSourceStageKey(persisted.current_stage_key) ??
        "strategy",
    };
  }

  const seedEvent = await getSourcingEvent(args.eventId);
  if (
    !seedEvent ||
    !seedEventMatchesClient(seedEvent.accountName, args.clientKey)
  )
    return null;
  return {
    eventId: seedEvent.id,
    stageKey: args.requestedStageKey ?? seedEvent.currentStageKey,
  };
}

export async function POST(
  request: Request,
  { params }: SourceUploadRouteContext,
) {
  let tenancy: Awaited<ReturnType<typeof requireTenancy>>;
  try {
    tenancy = await requireTenancy();
  } catch (error) {
    try {
      return tenancyErrorResponse(error);
    } catch {
      return jsonError(500, "internal_error");
    }
  }

  const { eventId } = await params;
  if (!eventId) return jsonError(400, "missing_event_id");

  const client = await getActiveClientRow();
  if (!client || client.id !== tenancy.clientId)
    return jsonError(403, "no_active_client");
  const tenantKey = clientKeyToInventorySubstrateKey(client.key);

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError(400, "invalid_multipart");
  }

  const fileEntry = formData.get("file");
  if (!fileEntry || typeof fileEntry === "string")
    return jsonError(400, "missing_file");
  const file = fileEntry as File;
  const filename =
    file.name && file.name.trim().length > 0 ? file.name : "upload";
  const mimeType = file.type || "application/octet-stream";

  if (!isAllowedSourceArtifactMimeType(mimeType)) {
    return jsonError(
      415,
      "unsupported_mime",
      `mime "${mimeType}" is not in the allowlist`,
    );
  }
  if (!isWithinSourceArtifactSizeLimit(file.size)) {
    return jsonError(
      413,
      "oversize",
      `size ${file.size} exceeds limit ${MAX_SOURCE_ARTIFACT_SIZE_BYTES}`,
    );
  }

  let requestedStageKey: SourceStageKey | undefined;
  let dataClassification: SourceDataClassification | undefined;
  try {
    requestedStageKey = parseStageKey(formData.get("stageKey"));
    dataClassification = parseDataClassification(
      formData.get("dataClassification"),
    );
  } catch (error) {
    return jsonError(
      400,
      "invalid_metadata",
      error instanceof Error ? error.message : "invalid metadata",
    );
  }

  const scope = await resolveSourceEventScope({
    clientKey: client.key,
    eventId,
    requestedStageKey,
  });
  if (!scope) return jsonError(403, "forbidden_event");

  const artifactId = randomUUID();
  let blobUri: string;
  try {
    blobUri = buildSourceArtifactBlobPath({
      tenantKey,
      sourceEventId: scope.eventId,
      artifactId,
      filename,
    });
  } catch (error) {
    return jsonError(
      400,
      "invalid_filename",
      error instanceof Error ? error.message : "invalid filename",
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const dataProtection = evaluateSensitiveUpload({
    filename,
    mimeType,
    bytes: buffer,
    declaredClassification:
      formData.get("dataProtectionClassification") ??
      formData.get("dataClassification"),
  });
  if (dataProtection.decision === "quarantine") {
    return sensitiveUploadRejectedResponse(dataProtection);
  }

  const sha256 = createHash("sha256").update(buffer).digest("hex");
  const storage = getObjectStorageAdapter();

  try {
    await storage.upload(STORAGE_BUCKET, blobUri, buffer, {
      contentType: mimeType,
      cacheControl: "private, max-age=0",
      upsert: false,
    });
  } catch (uploadError) {
    console.error(
      "[POST /api/v1/source/:eventId/artifacts/upload] storage_upload_failed",
      {
        blobUri,
        message:
          uploadError instanceof Error
            ? uploadError.message
            : String(uploadError),
      },
    );
    return jsonError(
      500,
      "storage_upload_failed",
      uploadError instanceof Error
        ? uploadError.message
        : "object storage upload failed",
    );
  }

  try {
    let artifact = await registerSourceArtifactUpload({
      artifactId,
      tenantKey,
      sourceEventId: scope.eventId,
      sourceEventRowId: scope.sourceEventRowId,
      stageKey: scope.stageKey,
      artifactFamily: inferSourceArtifactFamily({
        stageKey: scope.stageKey,
        filename,
        requestedFamily: parseOptionalString(formData.get("artifactFamily")),
      }),
      artifactKind:
        parseOptionalString(formData.get("artifactKind")) ??
        "uploaded_source_artifact",
      sourceOrigin: "uploaded",
      sourceFormat: sourceArtifactFormatFromMime(mimeType),
      originalName: filename,
      blobUri,
      uploaderUserId: tenancy.userId,
      mimeType,
      sizeBytes: file.size,
      sha256,
      dataClassification,
      createdBy: tenancy.userId,
    });

    // Flip gate criteria that are satisfied by this artifact type.
    // Uses the in-memory evidence ingestion store so the next page render
    // sees updated gate states without a DB round-trip.
    const criterionIds = getCriterionIdsForArtifactFamily(
      artifact.artifactFamily,
    );
    for (const criterionId of criterionIds) {
      addEvidence(scope.eventId, {
        field: criterionId,
        value: "met",
        source: `artifact-upload:${artifact.id}`,
        recordedAt: new Date().toISOString(),
      });
    }

    const parseWarnings: string[] = [];
    if (isSynchronouslyParseableSourceFormat(artifact.sourceFormat)) {
      try {
        artifact = await parseSourceTextArtifact({
          artifact,
          text: buffer.toString("utf8"),
        });
      } catch (parseError) {
        parseWarnings.push(
          parseError instanceof Error
            ? parseError.message
            : "text parse failed",
        );
        console.error(
          "[POST /api/v1/source/:eventId/artifacts/upload] text_parse_failed",
          {
            artifactId: artifact.id,
            sourceEventId: artifact.sourceEventId,
            message: parseWarnings[0],
          },
        );
      }
    }

    // Durably reflect the upload in the canvas substrate (evidence readiness
    // ladder + gate-criterion evidence links). The in-memory addEvidence above
    // only survives the current process; the canvas reads the Postgres
    // substrate tables, so without this write an upload never moves the
    // Evidence/Gate panels (audit F1, 2026-06-11). Best-effort: a sync failure
    // must not lose the uploaded file, but it is logged and surfaced.
    let substrateSync:
      | UploadSubstrateSyncResult
      | { skippedReason: string }
      | { error: string } = {
      skippedReason: "no persisted source_events row for this event",
    };
    if (scope.sourceEventRowId) {
      try {
        substrateSync = await syncUploadToCanvasSubstrate({
          sourceEventRowId: scope.sourceEventRowId,
          tenantKey,
          stageKey: scope.stageKey,
          artifactId: artifact.id,
          artifactFamily: artifact.artifactFamily,
          filename,
          parsed: artifact.parseStatus === "parsed",
        });
      } catch (syncError) {
        const message =
          syncError instanceof Error
            ? syncError.message
            : "substrate sync failed";
        substrateSync = { error: message };
        console.error(
          "[POST /api/v1/source/:eventId/artifacts/upload] substrate_sync_failed",
          {
            artifactId: artifact.id,
            sourceEventId: artifact.sourceEventId,
            message,
          },
        );
      }
    }

    const activityWrite = await selectSourceWriteAdapter(
      undefined,
      client.key,
    ).insertActivityLog({
      eventId: scope.sourceEventRowId ?? scope.eventId,
      clientKey: client.key,
      actorUserId: tenancy.userId,
      actorDisplayName: null,
      actorRole: null,
      actionType: "artifact_uploaded",
      actionLabel: `Uploaded Source document: ${filename}`,
      stageKey: scope.stageKey,
      artifactCode: parseOptionalString(formData.get("artifactCode")) ?? null,
      reason: parseOptionalString(formData.get("vendorName"))
        ? `Vendor response received from ${parseOptionalString(formData.get("vendorName"))}`
        : null,
      metadata: {
        artifactId: artifact.id,
        artifactFamily: artifact.artifactFamily,
        artifactKind: artifact.artifactKind,
        sourceFormat: artifact.sourceFormat,
        originalName: artifact.originalName,
        sizeBytes: artifact.sizeBytes,
        parseStatus: artifact.parseStatus,
        parseWarnings,
        externalSend: false,
      },
      occurredAtIso: new Date().toISOString(),
    });
    if (!activityWrite.ok) {
      console.error(
        "[POST /api/v1/source/:eventId/artifacts/upload] activity_insert_failed",
        activityWrite.error,
      );
    }

    return Response.json(
      {
        ok: true,
        artifact,
        dataProtection,
        substrateSync,
        ...(parseWarnings.length > 0 ? { parseWarnings } : {}),
      },
      { status: 200 },
    );
  } catch (error) {
    await storage.remove(STORAGE_BUCKET, [blobUri]).catch(() => undefined);
    console.error(
      "[POST /api/v1/source/:eventId/artifacts/upload] metadata_insert_failed",
      error,
    );
    return jsonError(
      500,
      "metadata_insert_failed",
      error instanceof Error
        ? error.message
        : "failed to persist Source artifact metadata",
    );
  }
}
