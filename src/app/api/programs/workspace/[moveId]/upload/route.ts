// POST /api/programs/workspace/[moveId]/upload · Step 8.2-D
//
// Upload endpoint for the strategic-moves workspace chat paperclip.
// Accepts multipart/form-data with fields:
//   - file   : the uploaded file
//   - phase  : integer 1–5 (optional; falls back to program currentPhase)
//
// Pipeline:
//   1. Auth via requireTenancy(); 401 if unauthenticated.
//   2. Validate moveId belongs to the active tenant; 403 otherwise.
//   3. Reject: unsupported mime → 415; oversize → 413.
//   4. Compute SHA-256.
//   5. Upload bytes to `program-attachments` bucket at
//      {tenantKey}/{moveId}/{attachmentId}/{safeFilename}.
//   6. Insert row into `program_attachments`.
//   7. Fire-and-forget text extraction + chunking (doc-parser).
//   8. Return { attachmentId, originalName, status: 'processing' }.
//
// Auth: requireTenancy() + program tenancy gate (403 if not found).
// Mime allowlist / size cap: inherits from @/lib/programs/attachments/mime.
// Bucket: program-attachments (existing, created by migration OV2-4a).
//
// Spec: docs/build/PROGRAMS_MODULE_FAILURE_MODE_DRIVEN_DESIGN.md
// Section B.4 (file uploads), slice OV2-4b workspace variant.

import { createHash, randomUUID } from 'node:crypto';
import { getServerSupabase } from '@/lib/supabase-server';
import { getProgramById } from '@/lib/programs/queries';
import {
  buildStoragePath,
  recordAttachmentUpload,
  type AttachmentScanStatus,
} from '@/lib/programs/attachments';
import {
  isAllowedMimeType,
  isWithinSizeLimit,
  MAX_ATTACHMENT_SIZE_BYTES,
} from '@/lib/programs/attachments/mime';
import { requireTenancy, tenancyErrorResponse } from '@/app/api/v1/programs/_auth';
import { getActiveClientRow } from '@/lib/active-client';
import { clientKeyToBrokerTenantKey } from '@/lib/agent/tools/intelligence/_shared';
import { extractAndChunk } from '@/lib/programs/doc-parser';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const STORAGE_BUCKET = 'program-attachments';

function jsonError(status: number, code: string, detail?: string): Response {
  return Response.json({ error: code, ...(detail ? { detail } : {}) }, { status });
}

function parseOptionalPhase(raw: FormDataEntryValue | null): number | undefined {
  if (raw === null || raw === undefined) return undefined;
  const str = String(raw).trim();
  if (!str) return undefined;
  const n = Number(str);
  if (!Number.isInteger(n) || n < 1 || n > 5) {
    throw new Error(`phase must be an integer in [1,5], got ${str}`);
  }
  return n;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ moveId: string }> },
) {
  // 1. Auth gate.
  let ctx: Awaited<ReturnType<typeof requireTenancy>>;
  try {
    ctx = await requireTenancy();
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {
      return jsonError(500, 'internal_error');
    }
  }

  const { moveId } = await params;
  if (!moveId) {
    return jsonError(400, 'missing_move_id');
  }

  // 2. Tenant gate — confirm the move/program belongs to this tenant.
  const program = await getProgramById(ctx, moveId);
  if (!program) {
    return jsonError(403, 'forbidden');
  }
  if (program.archivedAt || program.deletedAt) {
    return jsonError(410, 'archived_or_deleted');
  }

  const client = await getActiveClientRow();
  if (!client) {
    return jsonError(403, 'no_client');
  }
  const tenantKey = clientKeyToBrokerTenantKey(client.key);

  // Parse multipart body.
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return jsonError(400, 'invalid_multipart');
  }

  const fileEntry = formData.get('file');
  if (!fileEntry || typeof fileEntry === 'string') {
    return jsonError(400, 'missing_file');
  }
  const file = fileEntry as File;

  // 3. Mime + size pre-flight.
  const mimeType = file.type || 'application/octet-stream';
  if (!isAllowedMimeType(mimeType)) {
    return jsonError(
      415,
      'unsupported_mime',
      `mime "${mimeType}" is not in the allowlist`,
    );
  }
  if (!isWithinSizeLimit(file.size)) {
    return jsonError(
      413,
      'oversize',
      `size ${file.size} exceeds limit ${MAX_ATTACHMENT_SIZE_BYTES}`,
    );
  }

  // Optional phase field.
  let phase: number | undefined;
  try {
    phase = parseOptionalPhase(formData.get('phase'));
  } catch (err) {
    return jsonError(
      400,
      'invalid_phase',
      err instanceof Error ? err.message : 'invalid phase',
    );
  }
  const effectivePhase = phase ?? (program.currentPhase != null ? program.currentPhase : undefined);

  // 4. Read bytes once — shared by SHA-256 computation and storage upload.
  const buffer = Buffer.from(await file.arrayBuffer());
  const sha256 = createHash('sha256').update(buffer).digest('hex');

  const attachmentId = randomUUID();
  const filename = file.name && file.name.trim().length > 0 ? file.name : 'upload';

  let storagePath: string;
  try {
    storagePath = buildStoragePath({ tenantKey, programId: moveId, attachmentId, filename });
  } catch (err) {
    return jsonError(
      400,
      'invalid_filename',
      err instanceof Error ? err.message : 'invalid filename',
    );
  }

  // 5. Upload bytes to Supabase Storage.
  const sb = getServerSupabase();
  const { error: uploadError } = await sb.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, buffer, {
      contentType: mimeType,
      cacheControl: 'private, max-age=0',
      upsert: false,
    });
  if (uploadError) {
    console.error('[workspace/upload] storage_upload_failed', {
      moveId,
      storagePath,
      message: uploadError.message,
    });
    return jsonError(500, 'storage_upload_failed', uploadError.message);
  }

  // Synchronous text types skip the async virus-scan queue; we mark them
  // 'skipped' to keep scan_status consistent with the main upload path.
  const synchronousTextMimes = new Set([
    'text/plain',
    'text/markdown',
    'text/csv',
    'application/json',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ]);
  const scanStatus: AttachmentScanStatus = synchronousTextMimes.has(mimeType)
    ? 'skipped'
    : 'pending';

  // 6. Persist metadata row. On failure clean up the orphaned bucket object.
  let record: Awaited<ReturnType<typeof recordAttachmentUpload>>;
  try {
    record = await recordAttachmentUpload({
      tenantKey,
      programId: moveId,
      phase: effectivePhase,
      originalName: filename,
      uploaderUserId: ctx.userId,
      mimeType,
      sizeBytes: file.size,
      sha256,
      storagePath,
      scanStatus,
      scanFindings: scanStatus === 'skipped'
        ? { reason: 'synchronous_text_extraction_path' }
        : null,
    });
  } catch (err) {
    await sb.storage.from(STORAGE_BUCKET).remove([storagePath]).catch(() => undefined);
    console.error('[workspace/upload] metadata_insert_failed', err);
    return jsonError(
      500,
      'metadata_insert_failed',
      err instanceof Error ? err.message : 'failed to persist metadata',
    );
  }

  // 7. Fire-and-forget: extract text → chunk → insert into enterprise_context_chunks.
  void extractAndChunk({
    attachmentId: record.id,
    moveId,
    tenantKey,
    filename,
    mimeType,
    buffer,
    phase: effectivePhase ?? null,
  }).catch(console.error);

  // 8. Return immediately — caller should poll or receive a push event
  //    when chunking completes (future work).
  return Response.json(
    {
      attachmentId: record.id,
      originalName: filename,
      status: 'processing',
    },
    { status: 200 },
  );
}
