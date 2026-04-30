// GET /api/programs/[id]/attachments/[attachmentId] · OV2-4b
//
// Issues a short-lived signed URL for an attachment and 302-redirects
// the user agent to it. Authenticated tenants only; we verify both
// the program tenancy AND that the attachment row belongs to the
// program, before brokering the signed URL.
//
// Why a redirect (not a JSON {url} response): a redirect is one round
// trip from the user's perspective and works with raw <a href>, which
// is the simplest in-conversation chip we can render. JSON would force
// the chat-message renderer to do its own fetch + redirect dance.

import { getServerSupabase } from '@/lib/supabase-server';
import { getProgramById } from '@/lib/programs/queries';
import { getAttachment } from '@/lib/programs/attachments';
import { requireTenancy, tenancyErrorResponse } from '@/app/api/v1/programs/_auth';
import { clientKeyToBrokerTenantKey } from '@/lib/agent/tools/intelligence/_shared';
import { getActiveClientRow } from '@/lib/active-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STORAGE_BUCKET = 'program-attachments';
const SIGNED_URL_TTL_SECONDS = 60;

function jsonError(status: number, code: string, detail?: string): Response {
  return Response.json({ error: code, ...(detail ? { detail } : {}) }, { status });
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

  const sb = getServerSupabase();
  const { data, error } = await sb.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(attachment.storagePath, SIGNED_URL_TTL_SECONDS, {
      download: attachment.originalName,
    });
  if (error || !data?.signedUrl) {
    console.error('[GET /api/programs/:id/attachments/:attachmentId] signed_url_failed', {
      storagePath: attachment.storagePath,
      message: error?.message,
    });
    return jsonError(500, 'signed_url_failed', error?.message);
  }

  return Response.redirect(data.signedUrl, 302);
}
