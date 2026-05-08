// GET /api/programs/[id]/attachments
//
// Lists all non-deleted attachments for a program, newest first.
// Used by the MoveArtifactUpload component to render the existing
// uploads panel on the Move detail page.
//
// Auth: requireTenancy() + program tenant gate.
// Returns: { attachments: AttachmentRecord[] }

import { requireTenancy, tenancyErrorResponse } from '@/app/api/v1/programs/_auth';
import { getProgramById } from '@/lib/programs/queries';
import { listAttachmentsForProgram } from '@/lib/programs/attachments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function jsonError(status: number, code: string): Response {
  return Response.json({ error: code }, { status });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  let ctx: Awaited<ReturnType<typeof requireTenancy>>;
  try {
    ctx = await requireTenancy();
  } catch (err) {
    try { return tenancyErrorResponse(err); } catch { return jsonError(500, 'internal_error'); }
  }

  const { id: programId } = await params;
  if (!programId) return jsonError(400, 'missing_program_id');

  const program = await getProgramById(ctx, programId);
  if (!program) return jsonError(403, 'forbidden');

  try {
    const attachments = await listAttachmentsForProgram(programId);
    return Response.json({ attachments });
  } catch (err) {
    console.error('[GET /api/programs/:id/attachments]', err);
    return jsonError(500, 'fetch_failed');
  }
}
