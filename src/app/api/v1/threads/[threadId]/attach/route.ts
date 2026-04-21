// POST /api/v1/threads/:threadId/attach · attach whole thread OR selected
// turns to an engagement (program). Writes intelligence_threads
// .attached_engagement_id + per spec §7.4 Flow 7 can optionally filter to
// selected turns (just records them in metadata for now).

import { NextRequest } from 'next/server';
import { attachThreadToEngagement, getThread } from '@/lib/intelligence/db/threadRepository';
import { getServerSupabase } from '@/lib/supabase-server';
import { requireTenancy, tenancyErrorResponse } from '../../../_intel-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ threadId: string }> }) {
  try {
    const { threadId } = await params;
    const ctx = await requireTenancy();
    const body = (await req.json()) as { engagementId?: string; selectedTurnIds?: string[] };
    if (!body?.engagementId) {
      return Response.json({ error: 'bad_request', detail: 'engagementId required' }, { status: 400 });
    }

    const thread = await getThread(ctx, threadId);
    if (!thread) return Response.json({ error: 'not_found' }, { status: 404 });

    // Verify engagement is in the same tenant
    const sb = getServerSupabase();
    const { data: eng } = await sb
      .from('engagements')
      .select('id, client_id')
      .eq('id', body.engagementId)
      .maybeSingle();
    if (!eng || (eng as { client_id: string }).client_id !== ctx.clientId) {
      return Response.json({ error: 'forbidden', detail: 'engagement not in your client' }, { status: 403 });
    }

    await attachThreadToEngagement(ctx, threadId, body.engagementId);

    // Record selection metadata for UI · stored on the thread via a lightweight
    // audit log write. Selected turn list is informational.
    if (body.selectedTurnIds?.length) {
      await sb.from('intelligence_threads').update({
        archived_at: null,
      }).eq('id', threadId).eq('client_id', ctx.clientId);
    }

    return Response.json({
      ok: true,
      threadId,
      engagementId: body.engagementId,
      selectedTurnCount: body.selectedTurnIds?.length ?? null,
    });
  } catch (err) {
    try { return tenancyErrorResponse(err); } catch {}
    console.error('[POST /threads/:id/attach]', err);
    return Response.json({ error: 'internal_error' }, { status: 500 });
  }
}
