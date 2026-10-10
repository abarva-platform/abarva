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
import { evidenceById } from "@/lib/source/canonical-specs/evidence-requirements";
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
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  extractSourceUploadText,
  type ExtractedUploadText,
} from "@/lib/source/artifact-registry/upload-text-extraction";
import {
  evaluateSensitiveUpload,
  sensitiveUploadRejectedResponse,
} from "@/lib/security/sensitive-upload-guard";
import {
  syncUploadToCanvasSubstrate,
  type UploadSubstrateSyncResult,
} from "@/lib/source/canvas-substrate/upload-sync";
import { parseNormalizedVendorResponseWorkbook } from "@/lib/source/vendor-response-workbook";
import { persistNormalizedVendorResponsePackage } from "@/lib/source/vendor-response-persistence";
import { readAcceptedCandidatesForEvent } from "@/lib/source/candidate-suppliers/event-candidate-authority-repository";

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

function describeUnknownError(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    const parts = [record.message, record.code, record.detail]
      .filter((value): value is string =>
        typeof value === "string" && value.trim().length > 0,
      )
      .map((value) => value.trim());
    if (parts.length > 0) return parts.join(" | ");
  }
  return fallback;
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

interface UploadLandingResult {
  /** True when the extracted text replaced the canvas artifact body. */
  bodyLanded: boolean;
  /** Canonical criterion ids satisfied (or already satisfied) by this upload. */
  satisfiedCriteria: string[];
  warnings: string[];
}

/**
 * Land extracted text on the canvas artifact. The upload may supply evidence,
 * but it cannot make the accountable decision for a linked gate criterion.
 * Best-effort and non-fatal: the file remains registered if landing fails.
 */
async function landUploadOnArtifact(args: {
  eventId: string;
  clientKey: string;
  artifactCode: string;
  extracted: ExtractedUploadText;
  authorId: string | null;
}): Promise<UploadLandingResult> {
  const warnings: string[] = [];
  const supabase = getAzureReadFluentClient();
  const writer = selectSourceWriteAdapter(undefined, args.clientKey);

  // 1. Land extracted text on the canvas artifact body.
  let bodyLanded = false;
  const { data: artifactRow } = await supabase
    .from("source_event_artifact_states")
    .select("id, tier, status")
    .eq("source_event_id", args.eventId)
    .eq("artifact_code", args.artifactCode)
    .maybeSingle<{ id: string; tier: string; status: string }>();

  if (!artifactRow) {
    warnings.push(
      `No canvas artifact ${args.artifactCode} on this event — document stored to the registry only.`,
    );
    return { bodyLanded: false, satisfiedCriteria: [], warnings };
  }

  if (artifactRow.status === "locked" || artifactRow.status === "superseded") {
    warnings.push(
      `Artifact ${args.artifactCode} is ${artifactRow.status}; its body was not replaced.`,
    );
  } else {
    warnings.push(...args.extracted.warnings);
    if (args.extracted.text) {
      const nowIso = new Date().toISOString();
      const columns: Record<string, unknown> = {
        body: args.extracted.text,
        body_format: "markdown",
        body_authored_by: args.authorId,
        body_updated_at: nowIso,
        updated_at: nowIso,
      };
      if (artifactRow.tier === "stub") columns.tier = "outline";
      const write = await writer.updateArtifactBody({
        artifactRowId: artifactRow.id,
        columns,
      });
      bodyLanded = write.ok;
      if (!write.ok) warnings.push(`Body update failed: ${write.error}`);
    } else {
      warnings.push(
        `No extracted text available for artifact ${args.artifactCode}; canvas body was not replaced.`,
      );
    }
  }

  return { bodyLanded, satisfiedCriteria: [], warnings };
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
  const currentUser = await getCurrentUser().catch(() => null);

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

  let responseSupplier: { supplierId: string; legalName: string } | null = null;
  if (scope.stageKey === "responses" && sourceArtifactFormatFromMime(mimeType) === "xlsx") {
    const supplierId = parseOptionalString(formData.get("supplierId"));
    if (!supplierId) return jsonError(409, "accepted_supplier_required");
    const accepted = await readAcceptedCandidatesForEvent({
      clientKey: client.key,
      eventId: scope.eventId,
    }).catch(() => null);
    if (!accepted?.registryAvailable) return jsonError(503, "candidate_panel_unavailable");
    const matches = accepted.acceptedCandidates.filter((item) => item.supplierId === supplierId);
    if (matches.length !== 1 || !matches[0].legalName.trim()) {
      return jsonError(409, "supplier_not_accepted_for_event");
    }
    responseSupplier = { supplierId, legalName: matches[0].legalName };
  }

  const requirementId = parseOptionalString(formData.get("evidenceRequirementId"));
  if (formData.has("evidenceRequirementId") && !requirementId)
    return jsonError(400, "invalid_evidence_requirement");
  if (requirementId) {
    const requirement = evidenceById(requirementId);
    const extension = filename.split(".").pop()?.toLowerCase();
    const format = sourceArtifactFormatFromMime(mimeType);
    if (!requirement || requirement.stage !== scope.stageKey)
      return jsonError(400, "invalid_evidence_requirement");
    if (
      !extension ||
      !requirement.acceptedFileTypes.includes(extension) ||
      (format !== extension && !(format === "markdown" && extension === "md"))
    )
      return jsonError(400, "invalid_evidence_file_type");
  }

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

  let preparedResponse: Awaited<ReturnType<typeof parseNormalizedVendorResponseWorkbook>> = null;
  let responseParseError: string | null = null;
  if (responseSupplier) {
    try {
      preparedResponse = await parseNormalizedVendorResponseWorkbook({
        buffer,
        vendorId: responseSupplier.supplierId,
      });
      const declaredName = preparedResponse?.declaredVendorName;
      if (
        declaredName &&
        declaredName.trim().replace(/\s+/g, " ").toLowerCase() !==
          responseSupplier.legalName.trim().replace(/\s+/g, " ").toLowerCase()
      ) {
        return jsonError(409, "response_supplier_name_mismatch");
      }
      if (preparedResponse) {
        preparedResponse = { ...preparedResponse, vendorName: responseSupplier.legalName };
      }
    } catch (error) {
      responseParseError = describeUnknownError(error, "normalized vendor-response parse failed");
    }
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
    const artifactFamily = requirementId ? "other" : inferSourceArtifactFamily({
      stageKey: scope.stageKey,
      filename,
      requestedFamily: parseOptionalString(formData.get("artifactFamily")),
    });
    const artifactKind = requirementId
      ? "uploaded_source_artifact"
      : parseOptionalString(formData.get("artifactKind")) ??
        "uploaded_source_artifact";
    const sourceFormat = sourceArtifactFormatFromMime(mimeType);
    const fileFormat = sourceFormat === "markdown" ? "md" : sourceFormat;
    let artifact = await registerSourceArtifactUpload({
      artifactId,
      tenantKey,
      sourceEventId: scope.eventId,
      sourceEventRowId: scope.sourceEventRowId,
      stageKey: scope.stageKey,
      artifactFamily,
      artifactKind,
      sourceOrigin: "uploaded",
      sourceFormat,
      originalName: filename,
      blobUri,
      uploaderUserId: tenancy.userId,
      mimeType,
      sizeBytes: file.size,
      sha256,
      dataClassification,
      createdBy: tenancy.userId,
      fileCabinet: {
        clientId: client.id,
        sourcingStage: scope.stageKey,
        artifactGroup: "upload",
        artifactType: artifactKind,
        artifactFamily,
        title: filename,
        description: null,
        fileName: filename,
        fileFormat,
        blobContainer: STORAGE_BUCKET,
        blobPath: blobUri,
        fileSize: file.size,
        version: 1,
        status: "draft",
        generatedBy: tenancy.userId,
        sourceBasis: "uploaded source document",
        citationReady: false,
        evidenceFamiliesUsed: [artifactFamily],
        sourceRegisterId: artifactId,
        blobSha256: sha256,
      },
    });

    const extracted = await extractSourceUploadText({
      buffer,
      mimeType,
    });

    // Land extracted text on the targeted canvas artifact. Receipt alone
    // never records the named decision required by a governance gate.
    const artifactCode = parseOptionalString(formData.get("artifactCode"));
    const landing = artifactCode
      ? await landUploadOnArtifact({
          eventId: scope.eventId,
          clientKey: client.key,
          artifactCode,
          extracted,
          authorId: currentUser?.clerkUserId ?? null,
        })
      : null;

    const parseWarnings: string[] = [...extracted.warnings];
    if (
      extracted.text &&
      (isSynchronouslyParseableSourceFormat(artifact.sourceFormat) ||
        extracted.method !== "unsupported")
    ) {
      try {
        artifact = await parseSourceTextArtifact({
          artifact,
          text: extracted.text,
        });
      } catch (parseError) {
        parseWarnings.push(describeUnknownError(parseError, "text parse failed"));
        console.error(
          "[POST /api/v1/source/:eventId/artifacts/upload] text_parse_failed",
          {
            artifactId: artifact.id,
            sourceEventId: artifact.sourceEventId,
            message: parseWarnings[0],
          },
        );
      }
    } else if (extracted.method !== "unsupported" && !extracted.text) {
      parseWarnings.push(
        `No text was extracted from ${filename}; document remains registry-only until async parsing is available.`,
      );
    }

    let normalizedResponse: Awaited<ReturnType<typeof parseNormalizedVendorResponseWorkbook>> = null;
    let responseParseState: "parsed" | "failed" | "not_parsed" = "not_parsed";
    if (responseSupplier) {
      if (responseParseError) {
        responseParseState = "failed";
        parseWarnings.push(responseParseError);
      }
      try {
        if (preparedResponse) {
          await persistNormalizedVendorResponsePackage({
            artifact,
            parsed: preparedResponse,
          });
          normalizedResponse = preparedResponse;
          responseParseState = "parsed";
          parseWarnings.push(...preparedResponse.parserWarnings);
        }
      } catch (normalizedError) {
        responseParseState = "failed";
        const message = describeUnknownError(
          normalizedError,
          "normalized vendor-response parse failed",
        );
        parseWarnings.push(message);
        console.error(
          "[POST /api/v1/source/:eventId/artifacts/upload] normalized_response_parse_failed",
          { artifactId: artifact.id, sourceEventId: artifact.sourceEventId, message },
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
          requirementId,
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
      reason: responseSupplier
        ? `Vendor response received from ${responseSupplier.legalName}`
        : parseOptionalString(formData.get("vendorName"))
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
        ...(responseSupplier
          ? {
              responseSupplierId: responseSupplier.supplierId,
              responseParseState,
            }
          : {}),
      },
      occurredAtIso: new Date().toISOString(),
    }).catch((error) => {
      if (!responseSupplier) throw error;
      return {
        ok: false as const,
        error: describeUnknownError(error, "response receipt write failed"),
      };
    });
    if (!activityWrite.ok) {
      console.error(
        "[POST /api/v1/source/:eventId/artifacts/upload] activity_insert_failed",
        activityWrite.error,
      );
      if (responseSupplier) {
        return Response.json(
          { ok: false, error: "response_receipt_failed", artifactId: artifact.id },
          { status: 503 },
        );
      }
    }

    return Response.json(
      {
        ok: true,
        artifact,
        dataProtection,
        ...(landing ? { landing } : {}),
        substrateSync,
        ...(normalizedResponse
          ? {
              normalizedResponse: {
                vendorId: normalizedResponse.vendorId,
                vendorName: normalizedResponse.vendorName,
                requirementCount: normalizedResponse.rows.length,
                analytics: normalizedResponse.analytics,
              },
            }
          : {}),
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
