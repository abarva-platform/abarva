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
// 5. Upload: blob lands in `agent-attachments` bucket at
//    `{tenant_id}/{user_id}/{uuid}-{filename}`.
// 6. Extract: best-effort text extraction by MIME (defensive — never
//    throws on parser failure).
// 7. Persist: row in `agent_attachment` carries metadata + extracted
//    text. Cleans up the blob if the metadata insert fails.
//
// Spec: this PR · feat(agent): shared AgentDock with 5 modes + Claude-
// style upload (foundation).

import { currentUser } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';
import { getActiveClientRow } from '@/lib/active-client';
import { getServerSupabase } from '@/lib/supabase-server';
import {
  AGENT_ATTACHMENT_BUCKET,
  AGENT_ATTACHMENT_MAX_BYTES,
  extractAgentAttachmentText,
  isAllowedAgentAttachmentMime,
  safeStorageFileName,
  snipExtractedTextPreview,
} from '@/lib/agent/attachments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const user = await currentUser().catch(() => null);
  if (!user) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }

  // Parse multipart
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return Response.json({ error: 'bad_request', detail: 'invalid multipart' }, { status: 400 });
  }

  const file = formData.get('file');
  const surface = (formData.get('surface') as string | null)?.trim();
  const agent = (formData.get('agent') as string | null)?.trim() ?? 'sentinel';
  const surfaceContextRaw = (formData.get('surfaceContext') as string | null) ?? null;

  if (!(file instanceof File)) {
    return Response.json({ error: 'bad_request', detail: 'file required' }, { status: 400 });
  }
  if (!surface) {
    return Response.json({ error: 'bad_request', detail: 'surface required' }, { status: 400 });
  }

  // Per-surface entity linkage. The dock threads its `surfaceContext`
  // through as a JSON form field so we can stamp foreign keys at insert
  // time without a follow-up update round-trip. Today we read `moveId`
  // for the Moves detail surface; canvas / brief surfaces will add
  // `linked_event_id` etc. the same way in their own migration chips.
  const linkedMoveId = extractUuid(surfaceContextRaw, 'moveId');

  if (!isAllowedAgentAttachmentMime(file.type)) {
    return Response.json(
      { error: 'unsupported_mime', detail: `mime ${file.type} not allowed` },
      { status: 415 },
    );
  }
  if (file.size > AGENT_ATTACHMENT_MAX_BYTES) {
    return Response.json(
      { error: 'oversize', detail: `max ${AGENT_ATTACHMENT_MAX_BYTES} bytes` },
      { status: 413 },
    );
  }

  // Resolve tenant
  const activeClient = await getActiveClientRow(null);
  if (!activeClient) {
    return Response.json({ error: 'tenant_not_resolved' }, { status: 404 });
  }

  // Allocate ids and storage path
  const attachmentId = randomUUID();
  const safeName = safeStorageFileName(file.name);
  const storagePath = `${activeClient.id}/${user.id}/${attachmentId}-${safeName}`;

  // Read into Buffer (we need bytes for both upload + parse)
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Upload blob first — if metadata insert later fails we'll roll back.
  const sb = getServerSupabase();
  const uploadResult = await sb.storage
    .from(AGENT_ATTACHMENT_BUCKET)
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });
  if (uploadResult.error) {
    return Response.json(
      { error: 'upload_failed', detail: uploadResult.error.message },
      { status: 500 },
    );
  }

  // Best-effort text extraction — never throws.
  const extractedText = await extractAgentAttachmentText({
    filename: file.name,
    mimeType: file.type,
    buffer,
  });

  // Persist metadata row.
  const { error: insertError } = await sb.from('agent_attachment').insert({
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
  });

  if (insertError) {
    // Roll back the blob — orphan storage objects are toxic to ops.
    await sb.storage
      .from(AGENT_ATTACHMENT_BUCKET)
      .remove([storagePath])
      .catch(() => undefined);
    return Response.json(
      { error: 'persist_failed', detail: insertError.message },
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
    },
    { status: 200 },
  );
}

// Defensive: surfaceContext is client-supplied JSON. Pull the named
// field, validate UUID v4-ish shape, and return null on any whiff of
// trouble. The agent_attachment table column is UUID, so a malformed
// value would crash the insert and reject the whole upload.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function extractUuid(rawJson: string | null, key: string): string | null {
  if (!rawJson) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  const value = (parsed as Record<string, unknown>)[key];
  if (typeof value !== 'string') return null;
  if (!UUID_RE.test(value)) return null;
  return value;
}
