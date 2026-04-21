// GET /api/v1/threads/:threadId · load thread + turns
// DELETE /api/v1/threads/:threadId · soft delete (7-day retention per §7.8)

import { archiveThread, getThread } from '@/lib/intelligence/db/threadRepository';
import { listTurns } from '@/lib/intelligence/db/turnRepository';
import { requireTenancy, tenancyErrorResponse } from '../../_intel-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ threadId: string }> }) {
  try {
    const { threadId } = await params;
    const ctx = await requireTenancy();
    const thread = await getThread(ctx, threadId);
    if (!thread) return Response.json({ error: 'not_found' }, { status: 404 });
    if (thread.archivedAt) return Response.json({ error: 'archived' }, { status: 410 });
    const turns = await listTurns(ctx, threadId, { limit: 100 });
    return Response.json({ thread, turns });
  } catch (err) {
    try { return tenancyErrorResponse(err); } catch {}
    console.error('[GET /threads/:id]', err);
    return Response.json({ error: 'internal_error' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ threadId: string }> }) {
  try {
    const { threadId } = await params;
    const ctx = await requireTenancy();
    const thread = await getThread(ctx, threadId);
    if (!thread) return Response.json({ error: 'not_found' }, { status: 404 });
    await archiveThread(ctx, threadId);
    return Response.json({ ok: true, threadId, archivedAt: new Date().toISOString() });
  } catch (err) {
    try { return tenancyErrorResponse(err); } catch {}
    console.error('[DELETE /threads/:id]', err);
    return Response.json({ error: 'internal_error' }, { status: 500 });
  }
}
