// /api/v1/agent/attachments · POST
//
// Server endpoint for the AgentDock paperclip uploader.
//
// 1. Auth: Clerk session required.
// 2. Tenant: resolved via getActiveClientRow() — returns 404 if the
//    user has no active tenant binding.
// 3. Multipart: expects `file`, `surface`, optional `agent` and
//    `surfaceContext` JSON.
// 4. Validation: MIME allowlist + 25 MB size cap.
// 5. Guard: sensitive-upload pre-scan runs before storage, extraction,
//    indexing, or evidence use.
// 6. Upload: blob lands in `agent-attachments` bucket at
//    `{tenant_id}/{user_id}/{uuid}-{filename}`.
// 7. Extract: best-effort text extraction by MIME (defensive — never
//    throws on parser failure).
// 8. Persist: row in `agent_attachment` carries metadata + extracted
//    text. Cleans up the blob if the metadata insert fails.
//
// Spec: this PR · feat(agent): shared AgentDock with 5 modes + Claude-
// style upload (foundation).

import { currentUser } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { getActiveClientRow } from "@/lib/active-client";
import { getObjectStorageAdapter } from "@/lib/data-plane/objectStorage";
import {
  AGENT_ATTACHMENT_BUCKET,
  AGENT_ATTACHMENT_MAX_BYTES,
  type AgentAttachmentParseResult,
  extractAgentAttachmentParseResult,
  isAllowedAgentAttachmentMime,
  safeStorageFileName,
  snipExtractedTextPreview,
} from "@/lib/agent/attachments";
import { selectAttachmentsWriteAdapter } from "@/lib/data-plane/write-adapters/attachmentsWriteAdapter";
import {
  evaluateSensitiveUpload,
  sensitiveUploadRejectedResponse,
} from "@/lib/security/sensitive-upload-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await currentUser().catch(() => null);
  if (!user) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  // Parse multipart
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return Response.json(
      { error: "bad_request", detail: "invalid multipart" },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  const surface = (formData.get("surface") as string | null)?.trim();
  const agent = (formData.get("agent") as string | null)?.trim() ?? "sentinel";
  const surfaceContextRaw =
    (formData.get("surfaceContext") as string | null) ?? null;
  const declaredClassification =
    formData.get("dataProtectionClassification") ??
    formData.get("dataClassification");

  if (!(file instanceof File)) {
    return Response.json(
      { error: "bad_request", detail: "file required" },
      { status: 400 },
    );
  }
  if (!surface) {
    return Response.json(
      { error: "bad_request", detail: "surface required" },
      { status: 400 },
    );
  }

  // Per-surface entity linkage. The dock threads its `surfaceContext`
  // through as a JSON form field so we can stamp foreign keys at insert
  // time without a follow-up update round-trip. Today we read `moveId`
  // for the Moves detail surface; canvas / brief surfaces will add
  // `linked_event_id` etc. the same way in their own migration chips.
  const linkedMoveId = extractUuid(surfaceContextRaw, "moveId");

  if (!isAllowedAgentAttachmentMime(file.type)) {
    return Response.json(
      { error: "unsupported_mime", detail: `mime ${file.type} not allowed` },
      { status: 415 },
    );
  }
  if (file.size > AGENT_ATTACHMENT_MAX_BYTES) {
    return Response.json(
      { error: "oversize", detail: `max ${AGENT_ATTACHMENT_MAX_BYTES} bytes` },
      { status: 413 },
    );
  }

  // Resolve tenant
  const activeClient = await getActiveClientRow(null);
  if (!activeClient) {
    return Response.json({ error: "tenant_not_resolved" }, { status: 404 });
  }

  // Allocate ids and storage path
  const attachmentId = randomUUID();
  const safeName = safeStorageFileName(file.name);
  const storagePath = `${activeClient.id}/${user.id}/${attachmentId}-${safeName}`;

  // Read into Buffer (we need bytes for both upload + parse)
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const dataProtection = evaluateSensitiveUpload({
    filename: file.name,
    mimeType: file.type,
    bytes: buffer,
    declaredClassification,
  });
  if (dataProtection.decision === "quarantine") {
    return sensitiveUploadRejectedResponse(dataProtection);
  }

  // Upload blob first — if metadata insert later fails we'll roll back.
  const storage = getObjectStorageAdapter();
  try {
    await storage.upload(AGENT_ATTACHMENT_BUCKET, storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });
  } catch (uploadError) {
    return Response.json(
      {
        error: "upload_failed",
        detail:
          uploadError instanceof Error
            ? uploadError.message
            : "object storage upload failed",
      },
      { status: 500 },
    );
  }

  // Best-effort text extraction — never throws.
  const parseResult = await extractAgentAttachmentParseResult({
    filename: file.name,
    mimeType: file.type,
    buffer,
    cacheScope: activeClient.id,
  });
  const extractedText = parseResult.text;
  const parseMetadata = buildParseMetadataResponse(parseResult, file);

  // Persist metadata row. The DB-write half is routed through the data-plane
  // write seam (Slice 3c); the blob upload above and the rollback below stay
  // route concerns. Default plane = Supabase — the row is byte-faithful.
  try {
    await selectAttachmentsWriteAdapter().insertAgentAttachment({
      id: attachmentId,
      tenant_id: activeClient.id,
      surface,
      agent,
      user_id: user.id,
      file_name: file.name,
      mime: file.type,
      bytes: file.size,
      storage_path: storagePath,
      extracted_text: extractedText || null,
      linked_move_id: linkedMoveId,
      parse_metadata: parseMetadata,
    });
  } catch (insertError) {
    // Roll back the blob — orphan storage objects are toxic to ops.
    await storage
      .remove(AGENT_ATTACHMENT_BUCKET, [storagePath])
      .catch(() => undefined);
    return Response.json(
      {
        error: "persist_failed",
        detail: insertError instanceof Error ? insertError.message : "unknown",
      },
      { status: 500 },
    );
  }

  return Response.json(
    {
      id: attachmentId,
      file_name: file.name,
      mime: file.type,
      bytes: file.size,
      storage_path: storagePath,
      extracted_text_preview: snipExtractedTextPreview(extractedText),
      parse_metadata: parseMetadata,
      dataProtection,
    },
    { status: 200 },
  );
}

function buildParseMetadataResponse(
  parseResult: AgentAttachmentParseResult,
  file: File,
): Record<string, unknown> {
  return {
    page_count: parseResult.metadata.pageCount,
    table_count: parseResult.metadata.tableCount,
    parser_id: parseResult.metadata.parserId,
    document_key: parseResult.metadata.economics?.documentKey ?? null,
    document_hash: parseResult.metadata.economics?.documentHash ?? null,
    document_label: parseResult.metadata.economics?.documentLabel ?? null,
    original_filename:
      parseResult.metadata.economics?.originalFilename ?? file.name,
    parse_provider: parseResult.metadata.economics?.parseProvider ?? null,
    parse_cost_usd: parseResult.metadata.economics?.parseCostUsd ?? null,
    parse_cost_basis: parseResult.metadata.economics?.parseCostBasis ?? null,
    parse_unit_count: parseResult.metadata.economics?.parseUnitCount ?? null,
    parse_unit: parseResult.metadata.economics?.parseUnit ?? null,
    byte_size: parseResult.metadata.economics?.byteSize ?? file.size,
    small_doc_shortcut: parseResult.metadata.smallDocumentShortcut
      ? {
          eligible: parseResult.metadata.smallDocumentShortcut.eligible,
          route: parseResult.metadata.smallDocumentShortcut.route,
          reason: parseResult.metadata.smallDocumentShortcut.reason,
          byte_size: parseResult.metadata.smallDocumentShortcut.byteSize,
          page_count: parseResult.metadata.smallDocumentShortcut.pageCount,
          thresholds: {
            max_bytes:
              parseResult.metadata.smallDocumentShortcut.thresholds.maxBytes,
            max_pages_exclusive:
              parseResult.metadata.smallDocumentShortcut.thresholds
                .maxPagesExclusive,
          },
        }
      : null,
    raw_mode_escape: parseResult.metadata.rawModeEscape
      ? {
          eligible: parseResult.metadata.rawModeEscape.eligible,
          requires_user_approval:
            parseResult.metadata.rawModeEscape.requiresUserApproval,
          route: parseResult.metadata.rawModeEscape.route,
          reason: parseResult.metadata.rawModeEscape.reason,
          estimated_tokens_per_turn:
            parseResult.metadata.rawModeEscape.estimatedTokensPerTurn,
          parser_bug_ticket_id:
            parseResult.metadata.rawModeEscape.parserBugTicketId,
          cost_warning: parseResult.metadata.rawModeEscape.costWarning,
        }
      : null,
  };
}

// Defensive: surfaceContext is client-supplied JSON. Pull the named
// field, validate UUID v4-ish shape, and return null on any whiff of
// trouble. The agent_attachment table column is UUID, so a malformed
// value would crash the insert and reject the whole upload.
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function extractUuid(rawJson: string | null, key: string): string | null {
  if (!rawJson) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const value = (parsed as Record<string, unknown>)[key];
  if (typeof value !== "string") return null;
  if (!UUID_RE.test(value)) return null;
  return value;
}
