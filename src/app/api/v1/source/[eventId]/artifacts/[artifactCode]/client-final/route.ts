import { createHash, randomUUID } from "node:crypto";

import { requireTenancy, tenancyErrorResponse } from "@/app/api/v1/_intel-auth";
import { getActiveClientRow } from "@/lib/active-client";
import { clientKeyToInventorySubstrateKey } from "@/lib/agent/tools/intelligence/_shared";
import { getObjectStorageAdapter } from "@/lib/data-plane/objectStorage";
import {
  getAzureReadFluentClient,
  getAzureWriteFluentClient,
} from "@/lib/data-plane/postgresCompat";
import { selectSourceWriteAdapter } from "@/lib/data-plane/write-adapters/sourceWriteAdapter";
import {
  buildSourceArtifactBlobPath,
  isAllowedSourceArtifactMimeType,
  isWithinSourceArtifactSizeLimit,
  MAX_SOURCE_ARTIFACT_SIZE_BYTES,
  registerSourceArtifactUpload,
} from "@/lib/source/artifact-registry";
import { sourceArtifactFormatFromMime } from "@/lib/source/artifact-registry/upload-contract";
import {
  artifactStateRowToView,
  type SourceEventArtifactStateRow,
} from "@/lib/source/canvas-substrate/types";
import {
  buildClientFinalChangeSummary,
  CLIENT_FINAL_GOVERNANCE_MESSAGE,
  resolveAuthoritativeArtifact,
} from "@/lib/source/client-final-artifacts";
import { specByCode } from "@/lib/source/canonical-specs";
import {
  listSourceArtifacts,
  supersedePriorVersions,
} from "@/lib/source/file-cabinet/repository";
import type { ArtifactFileFormat } from "@/lib/source/file-cabinet/types";
import type { SourceArtifactFamily } from "@/lib/source/artifact-registry/types";
import type { SourceEventRow } from "@/lib/source/queries";
import type { SourceStageKey } from "@/lib/source/types";
import {
  evaluateSensitiveUpload,
  sensitiveUploadRejectedResponse,
} from "@/lib/security/sensitive-upload-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const STORAGE_BUCKET = "source-artifacts";

type RouteContext = {
  params: Promise<{ eventId?: string; artifactCode?: string }>;
};

function jsonError(status: number, code: string, detail?: string): Response {
  return Response.json(
    { ok: false, error: code, ...(detail ? { detail } : {}) },
    { status },
  );
}

function parseOptionalString(raw: FormDataEntryValue | null): string | null {
  if (raw === null || raw === undefined) return null;
  const value = String(raw).trim();
  return value.length > 0 ? value : null;
}

function parseOptionalDate(raw: FormDataEntryValue | null): string | null {
  const value = parseOptionalString(raw);
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return value;
}

function fileCabinetFormatFromMime(
  mimeType: string,
): ArtifactFileFormat | null {
  const sourceFormat = sourceArtifactFormatFromMime(mimeType);
  switch (sourceFormat) {
    case "docx":
    case "xlsx":
    case "pptx":
    case "pdf":
    case "html":
    case "csv":
      return sourceFormat;
    case "markdown":
    case "txt":
      return "md";
    default:
      return null;
  }
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

async function getArtifactState(args: {
  eventId: string;
  tenantKey: string;
  artifactCode: string;
}): Promise<SourceEventArtifactStateRow | null> {
  const client = getAzureReadFluentClient();
  const { data, error } = await client
    .from("source_event_artifact_states")
    .select("*")
    .eq("source_event_id", args.eventId)
    .eq("tenant_key", args.tenantKey)
    .eq("artifact_code", args.artifactCode)
    .maybeSingle();
  if (error) throw error;
  const strictMatch = (data as SourceEventArtifactStateRow | null) ?? null;
  if (strictMatch) return strictMatch;

  // Older Source events were scaffolded before tenant_key normalization was
  // consistent across source_event_artifact_states. The event row above is
  // already client-scoped, so this fallback stays inside the same tenant fence
  // while allowing client-final acceptance on legacy generated artifacts.
  const { data: fallbackData, error: fallbackError } = await client
    .from("source_event_artifact_states")
    .select("*")
    .eq("source_event_id", args.eventId)
    .eq("artifact_code", args.artifactCode)
    .maybeSingle();
  if (fallbackError) throw fallbackError;
  return (fallbackData as SourceEventArtifactStateRow | null) ?? null;
}

export async function POST(request: Request, { params }: RouteContext) {
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

  const { eventId, artifactCode } = await params;
  if (!eventId) return jsonError(400, "missing_event_id");
  if (!artifactCode) return jsonError(400, "missing_artifact_code");

  const client = await getActiveClientRow();
  if (!client || client.id !== tenancy.clientId) {
    return jsonError(403, "no_active_client");
  }
  const tenantKey = clientKeyToInventorySubstrateKey(client.key);

  const event = await getPersistedSourceEventRow(client.key, eventId);
  if (!event) return jsonError(403, "forbidden_event");

  const artifactState = await getArtifactState({
    eventId: event.id,
    tenantKey,
    artifactCode,
  });
  if (!artifactState) return jsonError(404, "artifact_state_not_found");

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError(400, "invalid_multipart");
  }

  const fileEntry = formData.get("file");
  if (!fileEntry || typeof fileEntry === "string") {
    return jsonError(400, "missing_file");
  }

  const file = fileEntry as File;
  const filename =
    file.name && file.name.trim().length > 0
      ? file.name
      : `${artifactCode}-client-final`;
  const mimeType = file.type || "application/octet-stream";
  const fileFormat = fileCabinetFormatFromMime(mimeType);
  if (!fileFormat || !isAllowedSourceArtifactMimeType(mimeType)) {
    return jsonError(
      415,
      "unsupported_mime",
      `mime "${mimeType}" is not supported for client-final artifacts`,
    );
  }
  if (!isWithinSourceArtifactSizeLimit(file.size)) {
    return jsonError(
      413,
      "oversize",
      `size ${file.size} exceeds limit ${MAX_SOURCE_ARTIFACT_SIZE_BYTES}`,
    );
  }

  const note = parseOptionalString(formData.get("note"));
  const reviewMeetingDate = parseOptionalDate(
    formData.get("reviewMeetingDate"),
  );
  const stakeholderGroup = parseOptionalString(
    formData.get("stakeholderGroup"),
  );
  const acceptedAt = new Date().toISOString();
  const buffer = Buffer.from(await file.arrayBuffer());

  const dataProtection = evaluateSensitiveUpload({
    filename,
    mimeType,
    bytes: buffer,
    declaredClassification: formData.get("dataProtectionClassification"),
  });
  if (dataProtection.decision === "quarantine") {
    return sensitiveUploadRejectedResponse(dataProtection);
  }

  const sha256 = createHash("sha256").update(buffer).digest("hex");
  const artifactId = randomUUID();
  let blobUri: string;
  try {
    blobUri = buildSourceArtifactBlobPath({
      tenantKey,
      sourceEventId: event.id,
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

  const storage = getObjectStorageAdapter();
  try {
    await storage.upload(STORAGE_BUCKET, blobUri, buffer, {
      contentType: mimeType,
      cacheControl: "private, max-age=0",
      upsert: false,
    });
  } catch (uploadError) {
    console.error("[source client-final] storage_upload_failed", {
      blobUri,
      message:
        uploadError instanceof Error
          ? uploadError.message
          : String(uploadError),
    });
    return jsonError(
      500,
      "storage_upload_failed",
      uploadError instanceof Error
        ? uploadError.message
        : "object storage upload failed",
    );
  }

  try {
    const allArtifacts = await listSourceArtifacts(event.id, client.id, {
      includeHistory: true,
    });
    const siblingArtifacts = allArtifacts.filter(
      (artifact) => artifact.artifactType === artifactCode,
    );
    const previousGenerated =
      resolveAuthoritativeArtifact(
        siblingArtifacts.filter(
          (artifact) => artifact.artifactGroup === "generated",
        ),
      ) ?? null;
    const previousAuthoritative =
      resolveAuthoritativeArtifact(siblingArtifacts);
    const nextVersion =
      Math.max(0, ...siblingArtifacts.map((artifact) => artifact.version)) + 1;
    const spec = specByCode(artifactCode);
    const changeSummary = buildClientFinalChangeSummary({
      previousGeneratedArtifactId:
        previousGenerated?.id ?? artifactState.linked_artifact_id ?? null,
      previousGeneratedVersion: previousGenerated?.version ?? null,
      clientFinalArtifactId: artifactId,
      clientFinalVersion: nextVersion,
      note,
      reviewMeetingDate,
      stakeholderGroup,
    });

    const artifact = await registerSourceArtifactUpload({
      artifactId,
      tenantKey,
      sourceEventId: event.id,
      sourceEventRowId: event.id,
      stageKey: artifactState.stage_key as SourceStageKey,
      artifactFamily: artifactState.artifact_family as SourceArtifactFamily,
      artifactKind: artifactCode,
      sourceOrigin: "reuploaded",
      sourceFormat: sourceArtifactFormatFromMime(mimeType),
      originalName: filename,
      blobUri,
      uploaderUserId: tenancy.userId,
      mimeType,
      sizeBytes: file.size,
      sha256,
      dataClassification: "Confidential",
      createdBy: tenancy.userId,
      supersedesArtifactVersionId: previousAuthoritative?.id ?? undefined,
      fileCabinet: {
        clientId: client.id,
        sourcingStage: artifactState.stage_key,
        artifactGroup: "approval",
        artifactType: artifactCode,
        artifactFamily: artifactState.artifact_family,
        title: `${spec?.name ?? artifactCode} — Client Final`,
        description: CLIENT_FINAL_GOVERNANCE_MESSAGE,
        fileName: filename,
        fileFormat,
        blobContainer: STORAGE_BUCKET,
        blobPath: blobUri,
        fileSize: file.size,
        version: nextVersion,
        status: "client_final",
        generatedBy: null,
        sourceBasis: `client-final:${artifactState.id}`,
        confidence: "client-approved",
        citationReady: true,
        evidenceFamiliesUsed: [artifactState.artifact_family],
        supersedesArtifactId:
          previousAuthoritative?.id ?? artifactState.linked_artifact_id,
        blobSha256: sha256,
        isClientFinal: true,
        isCurrentAuthoritative: true,
        sourceGeneratedArtifactId:
          previousGenerated?.id ?? artifactState.linked_artifact_id,
        clientFinalUploadedBy: tenancy.userId,
        clientFinalUploadedAt: acceptedAt,
        clientFinalAcceptedBy: tenancy.userId,
        clientFinalAcceptedAt: acceptedAt,
        clientFinalNote: note,
        clientFinalReviewMeetingDate: reviewMeetingDate,
        clientFinalStakeholderGroup: stakeholderGroup,
        clientFinalChangeSummary: changeSummary,
      },
    });

    const db = getAzureWriteFluentClient();
    const { error: authoritativeError } = await db
      .from("source_artifacts")
      .update({ is_current_authoritative: false })
      .eq("source_event_id", event.id)
      .eq("artifact_type", artifactCode)
      .neq("id", artifact.id);
    if (authoritativeError) {
      throw new Error(
        `failed to clear previous authoritative versions: ${authoritativeError.message}`,
      );
    }
    await supersedePriorVersions(
      event.id,
      artifactCode,
      "generated",
      artifact.id,
    );
    await supersedePriorVersions(
      event.id,
      artifactCode,
      "approval",
      artifact.id,
    );

    const previousMetadata =
      artifactState.body_generation_metadata &&
      typeof artifactState.body_generation_metadata === "object"
        ? artifactState.body_generation_metadata
        : {};
    const clientFinalMetadata = {
      artifactId: artifact.id,
      fileName: artifact.originalName,
      version: artifact.version,
      acceptedAt,
      acceptedBy: tenancy.userId,
      uploadedAt: acceptedAt,
      uploadedBy: tenancy.userId,
      note,
      reviewMeetingDate,
      stakeholderGroup,
      sourceGeneratedArtifactId:
        previousGenerated?.id ?? artifactState.linked_artifact_id,
      governanceMessage: CLIENT_FINAL_GOVERNANCE_MESSAGE,
    };
    const updatedMetadata = {
      ...previousMetadata,
      clientFinal: clientFinalMetadata,
      clientFinalChangeSummary: changeSummary,
    };
    const updateResult = await selectSourceWriteAdapter(
      undefined,
      client.key,
    ).updateArtifactBody({
      artifactRowId: artifactState.id,
      columns: {
        linked_artifact_id: artifact.id,
        status: "approved",
        tier: "rich",
        body_generation_metadata: updatedMetadata,
        updated_at: acceptedAt,
      },
    });
    if (!updateResult.ok) {
      throw new Error(updateResult.error ?? "artifact state update failed");
    }

    const activityWrite = await selectSourceWriteAdapter(
      undefined,
      client.key,
    ).insertActivityLog({
      eventId: event.id,
      clientKey: client.key,
      actorUserId: tenancy.userId,
      actorDisplayName: null,
      actorRole: null,
      actionType: "artifact_client_final_accepted",
      actionLabel: `Accepted client-final version for ${spec?.name ?? artifactCode}`,
      stageKey: artifactState.stage_key,
      artifactCode,
      reason: note,
      metadata: {
        artifactId: artifact.id,
        fileName: artifact.originalName,
        previousGeneratedArtifactId:
          previousGenerated?.id ?? artifactState.linked_artifact_id,
        previousAuthoritativeArtifactId: previousAuthoritative?.id ?? null,
        reviewMeetingDate,
        stakeholderGroup,
        governanceMessage: CLIENT_FINAL_GOVERNANCE_MESSAGE,
      },
      occurredAtIso: acceptedAt,
    });
    if (!activityWrite.ok) {
      console.error("[source client-final] activity_insert_failed", {
        error: activityWrite.error,
        eventId: event.id,
        artifactCode,
      });
    }

    return Response.json(
      {
        ok: true,
        artifact,
        artifactState: artifactStateRowToView(
          updateResult.data as unknown as SourceEventArtifactStateRow,
        ),
        clientFinal: {
          ...clientFinalMetadata,
          changeSummary,
        },
        dataProtection,
      },
      { status: 200 },
    );
  } catch (error) {
    await storage.remove(STORAGE_BUCKET, [blobUri]).catch(() => undefined);
    console.error("[source client-final] metadata_insert_failed", error);
    return jsonError(
      500,
      "metadata_insert_failed",
      error instanceof Error
        ? error.message
        : "failed to persist client-final artifact",
    );
  }
}
