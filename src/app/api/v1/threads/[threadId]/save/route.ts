// POST /api/v1/threads/:threadId/save · touch thread (auto-saved on every
// turn, but the UI exposes an explicit "Save" action per §7.4 Flow 10).

import { getThread, touchThread, updateThreadState } from '@/lib/intelligence/db/threadRepository';
import { requireTenancy, tenancyErrorResponse } from '../../../_intel-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(_req: Request, { params }: { params: Promise<{ threadId: string }> }) {
  try {
    const { threadId } = await params;
    const ctx = await requireTenancy();
    const thread = await getThread(ctx, threadId);
    if (!thread) return Response.json({ error: 'not_found' }, { status: 404 });
    await touchThread(ctx, threadId);
    if (thread.state === 'A') await updateThreadState(ctx, threadId, 'B');
    return Response.json({ ok: true, threadId, savedAt: new Date().toISOString() });
  } catch (err) {
    try { return tenancyErrorResponse(err); } catch {}
    console.error('[POST /threads/:id/save]', err);
    return Response.json({ error: 'internal_error' }, { status: 500 });
  }
}
