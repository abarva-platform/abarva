// GET /api/programs/[id]/attachments/[attachmentId] · OV2-4b
//
// Streams attachment bytes through the authenticated app route. The
// route verifies both the program tenancy AND that the attachment row
// belongs to the program before reading object storage.
//
// We intentionally proxy the file instead of redirecting to a signed
// Azure Blob URL. The recording proof found browser downloads could
// receive a 302 and then fail at Blob with AuthorizationFailure. Keeping
// the download server-mediated makes the tenant/auth gate and storage
// credential path deterministic for product demos and client use.

import { getObjectStorageAdapter } from '@/lib/data-plane/objectStorage';
import { getProgramById } from '@/lib/programs/queries';
import { getAttachment } from '@/lib/programs/attachments';
import { requireTenancy, tenancyErrorResponse } from '@/app/api/v1/programs/_auth';
import { clientKeyToBrokerTenantKey } from '@/lib/agent/tools/intelligence/_shared';
import { getActiveClientRow } from '@/lib/active-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STORAGE_BUCKET = 'program-attachments';

function jsonError(status: number, code: string, detail?: string): Response {
  return Response.json({ error: code, ...(detail ? { detail } : {}) }, { status });
}

function contentDisposition(filename: string): string {
  const safe = filename
    .replace(/[\r\n"]/g, '_')
    .replace(/[\\/]/g, '_')
    .trim() || 'download';
  return `attachment; filename="${safe}"`;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; attachmentId: string }> },
) {
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

  const { id: programId, attachmentId } = await params;
  if (!programId || !attachmentId) {
    return jsonError(400, 'missing_ids');
  }

  // Tenancy gate — confirm program belongs to this tenant.
  const program = await getProgramById(ctx, programId);
  if (!program) {
    return jsonError(403, 'forbidden');
  }

  const attachment = await getAttachment(attachmentId);
  if (!attachment || attachment.deletedAt) {
    return jsonError(404, 'not_found');
  }

  // Defense in depth: program-id link AND tenant-key link must both
  // match. The DB row already binds program_id, but if a future
  // refactor split tenant-key from program scoping we'd still catch
  // a cross-tenant pull here.
  const client = await getActiveClientRow();
  if (!client) {
    return jsonError(403, 'no_client');
  }
  const expectedTenantKey = clientKeyToBrokerTenantKey(client.key);
  if (
    attachment.programId !== programId ||
    attachment.tenantKey !== expectedTenantKey
  ) {
    return jsonError(403, 'forbidden');
  }

  let bytes: Buffer;
  try {
    bytes = await getObjectStorageAdapter().download(
      STORAGE_BUCKET,
      attachment.storagePath,
    );
  } catch (error) {
    console.error('[GET /api/programs/:id/attachments/:attachmentId] download_failed', {
      storagePath: attachment.storagePath,
      message: error instanceof Error ? error.message : String(error),
    });
    return jsonError(
      500,
      'download_failed',
      error instanceof Error ? error.message : 'object storage download failed',
    );
  }

  return new Response(new Uint8Array(bytes), {
    status: 200,
    headers: {
      'content-type': attachment.mimeType || 'application/octet-stream',
      'content-disposition': contentDisposition(attachment.originalName),
      'content-length': String(bytes.length),
      'cache-control': 'private, no-store',
      'x-abarva-download-proxy': 'object-storage',
    },
  });
}
