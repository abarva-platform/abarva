// POST /api/v1/nexus/upload
// Multi-modal ingestion · ephemeral · session-scoped blob store per spec §4.6.
// For demo purposes we record the upload in the existing uploaded_files table
// with the current session id; content extraction is a follow-up.

import { NextRequest } from 'next/server';
import { requireTenancy, tenancyErrorResponse } from '../../_intel-auth';
import {
  evaluateSensitiveUpload,
  sensitiveUploadRejectedResponse,
} from '@/lib/security/sensitive-upload-guard';
import { selectUploadsWriteAdapter } from '@/lib/data-plane/write-adapters/uploadsWriteAdapter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const MAX_BYTES = 50 * 1024 * 1024;
const ALLOWED = ['application/pdf', 'image/png', 'image/jpeg', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireTenancy();
    const form = await req.formData();
    const file = form.get('file');
    const sessionId = (form.get('sessionId') as string | null) ?? `session-${Date.now()}`;

    if (!(file instanceof File)) {
      return Response.json({ error: 'bad_request', detail: 'file required' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return Response.json({ error: 'too_large', detail: '50MB max' }, { status: 413 });
    }
    if (file.type && !ALLOWED.includes(file.type)) {
      return Response.json({ error: 'unsupported_format', detail: `supported: ${ALLOWED.join(', ')}` }, { status: 415 });
    }

    // B5a (audit 2026-05-13): scan-before-write — quarantine suspected
    // PHI/PII/regulated-identifier uploads before they touch storage.
    // Same pattern as the other 5 wired upload routes.
    const bytes = await file.arrayBuffer();
    const dataProtection = evaluateSensitiveUpload({
      filename: file.name,
      mimeType: file.type,
      bytes,
      declaredClassification: form.get('dataClassification'),
    });
    if (dataProtection.decision === 'quarantine') {
      return sensitiveUploadRejectedResponse(dataProtection);
    }

    // DB-write half routed through the data-plane write seam (Slice 3c).
    // This route records ephemeral upload metadata only — no blob storage
    // operation here — so the seam owns the whole write. Default = Supabase.
    const inserted = await selectUploadsWriteAdapter().insertUploadedFile({
      client_id: ctx.clientId,
      uploaded_by_person_id: ctx.userId,
      file_name: file.name,
      file_size_bytes: file.size,
      mime_type: file.type || 'application/octet-stream',
      storage_path: `ephemeral/${ctx.clientId}/${sessionId}/${file.name}`,
      metadata: { session_id: sessionId, ephemeral: true },
    });

    const expiryAt = new Date(Date.now() + 24 * 3_600_000).toISOString();
    return Response.json({
      fileId: inserted.id,
      ingestionStatus: 'received',
      analyzedLayers: [],
      storageExpiry: expiryAt,
      sessionId,
    });
  } catch (err) {
    try { return tenancyErrorResponse(err); } catch {}
    console.error('[POST /nexus/upload]', err);
    return Response.json({ error: 'internal_error', message: (err as Error).message }, { status: 500 });
  }
}
