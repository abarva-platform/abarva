// POST /api/programs/[id]/attachments/upload · OV2-4b
//
// Server-mediated upload pipeline for chat-window paper-clip attachments.
// Client POSTs multipart/form-data with field `file` (+ optional phase /
// stepId / deliverableId). This route:
//
//   1. Auth-gates via requireTenancy(); 401 if no signed-in user.
//   2. Validates programId belongs to the active tenant; 403 if not.
//      (We deliberately 403 — not 404 — so tenants can't enumerate
//      program ids belonging to other tenants.)
//   3. Validates mime allowlist (415) + size cap (413).
//   4. Computes SHA-256 of the file bytes (required by the schema).
//   5. Generates a fresh attachment id + canonical storage path.
//   6. Uploads bytes to the `program-attachments` bucket via the
//      service-role client (RLS bypass — clients never get direct
//      bucket creds).
//   7. Persists metadata via recordAttachmentUpload().
//   8. Returns 200 with the AttachmentRecord.
//
// On storage upload failure: best-effort logs the error code in the
// response body so the client toast can surface something actionable
// (and we don't leak internal diagnostics into a 500 with no detail).
// On metadata-insert failure AFTER bytes have landed: we attempt a
// best-effort bucket cleanup — the file would otherwise become
// orphaned (no row pointing at it).
//
// Spec: docs/build/PROGRAMS_MODULE_FAILURE_MODE_DRIVEN_DESIGN.md
// Section B.4 (file uploads) and Part G (slice OV2-4b).

import { createHash, randomUUID } from "node:crypto";
import { getObjectStorageAdapter } from "@/lib/data-plane/objectStorage";
import { getProgramById } from "@/lib/programs/queries";
import {
  buildStoragePath,
  recordAttachmentUpload,
  type AttachmentRecord,
  type AttachmentScanStatus,
} from "@/lib/programs/attachments";
import {
  isAllowedMimeType,
  isWithinSizeLimit,
  MAX_ATTACHMENT_SIZE_BYTES,
} from "@/lib/programs/attachments/mime";
import {
  requireTenancy,
  tenancyErrorResponse,
} from "@/app/api/v1/programs/_auth";
import { clientKeyToBrokerTenantKey } from "@/lib/agent/tools/intelligence/_shared";
import { getActiveClientRow } from "@/lib/active-client";
import {
  extractProgramEvidenceFromUploadBuffer,
  recordProgramEvidence,
} from "@/lib/programs/evidence-ingestion";
import {
  classifyUploadedMoveEvidence,
  mergeMoveEvidenceClassification,
} from "@/lib/programs/uploaded-move-evidence-classification";
import { applyUploadedEvidenceToMove } from "@/lib/programs/mutations";
import type { ExtractionReceipt } from "@/lib/programs/discovery/extraction-planner";
import { loadUserProgramAccessPolicy } from "@/lib/auth/program-access-policy";
import {
  evaluateSensitiveUpload,
  sensitiveUploadRejectedResponse,
} from "@/lib/security/sensitive-upload-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// 100 MB cap (mirror MAX_ATTACHMENT_SIZE_BYTES). Without this, Next 16's
// default body-size limit may reject uploads earlier than our own check.
export const maxDuration = 60;

const STORAGE_BUCKET = "program-attachments";
const SYNCHRONOUS_EVIDENCE_MIME_TYPES = new Set([
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

function jsonError(status: number, code: string, detail?: string): Response {
  return Response.json(
    { error: code, ...(detail ? { detail } : {}) },
    { status },
  );
}

function parseOptionalPhase(
  raw: FormDataEntryValue | null,
): number | undefined {
  if (raw === null || raw === undefined) return undefined;
  const str = String(raw).trim();
  if (!str) return undefined;
  const n = Number(str);
  if (!Number.isInteger(n) || n < 0 || n > 6) {
    throw new Error(`phase must be an integer in [0,6], got ${str}`);
  }
  return n;
}

function parseOptionalString(
  raw: FormDataEntryValue | null,
): string | undefined {
  if (raw === null || raw === undefined) return undefined;
  const str = String(raw).trim();
  return str.length > 0 ? str : undefined;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let ctx: Awaited<ReturnType<typeof requireTenancy>>;
  try {
    ctx = await requireTenancy();
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {
      return jsonError(500, "internal_error");
    }
  }

  const { id: programId } = await params;
  if (!programId) {
    return jsonError(400, "missing_program_id");
  }

  // Tenant gate — fetch the program scoped by client_id. If it doesn't
  // exist (or is for a different tenant), 403. Per the spec, we never
  // 404 here because that would let a tenant probe whether a given
  // program id exists in another tenant.
  const program = await getProgramById(ctx, programId);
  if (!program) {
    return jsonError(403, "forbidden");
  }
  if (program.archivedAt || program.deletedAt) {
    return jsonError(410, "archived_or_deleted");
  }
  const accessPolicy = await loadUserProgramAccessPolicy(ctx, { programId });
  if (!accessPolicy.canUploadArtifacts) {
    return jsonError(403, "upload_not_permitted");
  }

  // Resolve broker-tenant key (apex-retail vs apexretail split). Storage
  // path's first segment must match the JWT tenant_key claim for the
  // RLS storage policy; the service-role client bypasses RLS, but we
  // still write into the canonical {tenantKey}/... layout so signed-URL
  // reads issued later validate cleanly.
  const client = await getActiveClientRow();
  if (!client) {
    return jsonError(403, "no_client");
  }
  const tenantKey = clientKeyToBrokerTenantKey(client.key);

  // Parse multipart body.
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return jsonError(400, "invalid_multipart");
  }

  const fileEntry = formData.get("file");
  if (!fileEntry || typeof fileEntry === "string") {
    return jsonError(400, "missing_file");
  }
  const file = fileEntry as File;

  // Mime + size pre-flight.
  const mimeType = file.type || "application/octet-stream";
  if (!isAllowedMimeType(mimeType)) {
    return jsonError(
      415,
      "unsupported_mime",
      `mime "${mimeType}" is not in the allowlist`,
    );
  }
  if (!isWithinSizeLimit(file.size)) {
    return jsonError(
      413,
      "oversize",
      `size ${file.size} exceeds limit ${MAX_ATTACHMENT_SIZE_BYTES}`,
    );
  }

  // Optional fields.
  let phase: number | undefined;
  try {
    phase = parseOptionalPhase(formData.get("phase"));
  } catch (err) {
    return jsonError(
      400,
      "invalid_phase",
      err instanceof Error ? err.message : "invalid phase",
    );
  }
  const effectivePhase = phase ?? program.currentPhase ?? undefined;
  const stepId = parseOptionalString(formData.get("stepId"));
  const deliverableId = parseOptionalString(formData.get("deliverableId"));
  const filename =
    file.name && file.name.trim().length > 0 ? file.name : "upload";

  // Read bytes once → SHA-256 + storage upload share the same buffer.
  const buffer = Buffer.from(await file.arrayBuffer());
  const dataProtection = evaluateSensitiveUpload({
    filename,
    mimeType,
    bytes: buffer,
    declaredClassification: formData.get("dataClassification"),
  });
  if (dataProtection.decision === "quarantine") {
    return sensitiveUploadRejectedResponse(dataProtection);
  }

  const sha256 = createHash("sha256").update(buffer).digest("hex");

  const attachmentId = randomUUID();
  let storagePath: string;
  try {
    storagePath = buildStoragePath({
      tenantKey,
      programId,
      attachmentId,
      filename,
    });
  } catch (err) {
    return jsonError(
      400,
      "invalid_filename",
      err instanceof Error ? err.message : "invalid filename",
    );
  }

  // Upload bytes — service role bypasses RLS at storage layer.
  const storage = getObjectStorageAdapter();
  try {
    await storage.upload(STORAGE_BUCKET, storagePath, buffer, {
      contentType: mimeType,
      cacheControl: "private, max-age=0",
      upsert: false,
    });
  } catch (uploadError) {
    console.error(
      "[POST /api/programs/:id/attachments/upload] storage_upload_failed",
      {
        storagePath,
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

  const synchronousEvidence = SYNCHRONOUS_EVIDENCE_MIME_TYPES.has(mimeType);
  const initialScanStatus: AttachmentScanStatus = synchronousEvidence
    ? "skipped"
    : "pending";
  const initialScanFindings = synchronousEvidence
    ? {
        reason: "synchronous_evidence_extraction_only",
        detail:
          "Evidence was extracted during upload; no malware scanner is wired in this synchronous path.",
      }
    : null;

  // Persist metadata. On failure, best-effort cleanup of the orphaned
  // bucket object so we don't leave dead bytes behind.
  let record: AttachmentRecord;
  try {
    record = await recordAttachmentUpload({
      tenantKey,
      programId,
      phase: effectivePhase,
      stepId,
      deliverableId,
      originalName: filename,
      uploaderUserId: ctx.userId,
      mimeType,
      sizeBytes: file.size,
      sha256,
      storagePath,
      scanStatus: initialScanStatus,
      scanFindings: initialScanFindings,
    });
  } catch (err) {
    await storage.remove(STORAGE_BUCKET, [storagePath]).catch(() => undefined);
    console.error(
      "[POST /api/programs/:id/attachments/upload] metadata_insert_failed",
      err,
    );
    return jsonError(
      500,
      "metadata_insert_failed",
      err instanceof Error ? err.message : "failed to persist metadata",
    );
  }

  let evidenceId: string | null = null;
  let evidenceWarning: string | null = null;
  let evidenceParseMethod: string | null = null;
  let evidenceWarnings: string[] = [];
  let evidenceWhatFound: string[] = [];
  let evidenceWhereUsed: string[] = [];
  let discoveryReceipt: ExtractionReceipt | null = null;
  try {
    const rawEvidence = await extractProgramEvidenceFromUploadBuffer({
      filename,
      mimeType,
      buffer,
      cacheScope: tenantKey,
    });
    const classification = classifyUploadedMoveEvidence({
      filename,
      phase: effectivePhase ?? null,
      extractedText: rawEvidence.extractedText,
      originalEvidenceType: rawEvidence.evidenceType,
    });
    const evidence = mergeMoveEvidenceClassification({
      evidence: rawEvidence,
      classification,
      filename,
    });
    evidenceParseMethod = evidence.extractedStructured.parse_method;
    evidenceWarnings = evidence.extractedStructured.warnings;
    evidenceWhatFound = classification.whatFound;
    evidenceWhereUsed = classification.whereUsed;
    evidenceId = await recordProgramEvidence(ctx, {
      ...evidence,
      evidenceType: rawEvidence.evidenceType,
      tenantKey,
      programId,
      attachmentId: record.id,
      phase: effectivePhase ?? null,
      stepId: stepId ?? null,
    });
    // Discovery Intake (S3c): route the parsed evidence into the Move's
    // discovery shape (flag-gated inside the mutation; null when off). Best-
    // effort — a failure here never blocks the upload or the evidence capture.
    try {
      discoveryReceipt = await applyUploadedEvidenceToMove(ctx, {
        programId,
        evidence,
        sourceFile: filename,
      });
    } catch (discErr) {
      console.error(
        "[POST /api/programs/:id/attachments/upload] discovery_extraction_failed",
        {
          programId,
          message: discErr instanceof Error ? discErr.message : String(discErr),
        },
      );
    }
  } catch (err) {
    evidenceWarning = err instanceof Error ? err.message : String(err);
    console.error(
      "[POST /api/programs/:id/attachments/upload] evidence_ingestion_failed",
      {
        attachmentId: record.id,
        programId,
        message: evidenceWarning,
      },
    );
  }

  return Response.json(
    {
      attachment: record,
      evidence: evidenceId
        ? {
            id: evidenceId,
            status: "captured",
            parseMethod: evidenceParseMethod,
            warnings: evidenceWarnings,
            whatFound: evidenceWhatFound,
            whereUsed: evidenceWhereUsed,
          }
        : { id: null, status: "not_captured", warning: evidenceWarning },
      discovery: discoveryReceipt ?? undefined,
      dataProtection,
    },
    { status: 200 },
  );
}
