// POST /api/v1/programs/:programId/nexus/cxo-takeover · start or commit
//
// Two sub-actions routed by body.action:
//   start  — body: { phase: 3 | 6 } · returns { session }
//   commit — body: { threadId, phase, transcript, synthesis } · returns target
//
// Mode C per Packet 8 §8.5. Phase 3 writes to module state_jsonb
// (cxo_interview module completed). Phase 6 writes an outcome_report
// deliverable draft.

import { NextRequest } from 'next/server';
import { commitCxoTranscript, startCxoTakeover } from '@/lib/programs/nexus';
import { requireTenancy, tenancyErrorResponse } from '../../../_auth';
import { getProgramById } from '@/lib/programs/queries';
import { getProgramsRouteSupabase } from '@/lib/programs/programs-auth-mode-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ programId: string }> }) {
  try {
    const { programId } = await params;
    const ctx = await requireTenancy();
    const { supabase } = await getProgramsRouteSupabase('mutation');
    const program = await getProgramById(ctx, programId, { supabase });
    if (!program) return Response.json({ error: 'not_found' }, { status: 404 });
    const body = (await req.json()) as {
      action?: 'start' | 'commit';
      phase?: 3 | 6;
      threadId?: string;
      transcript?: Array<{ speaker: 'nexus' | 'sponsor' | 'lead'; text: string }>;
      synthesis?: { headline: string; bullets: string[] };
    };
    if (body?.action !== 'start' && body?.action !== 'commit') {
      return Response.json({ error: 'bad_request', detail: 'action must be start|commit' }, { status: 400 });
    }

    if (body.action === 'start') {
      if (body.phase !== 3 && body.phase !== 6) {
        return Response.json({ error: 'bad_request', detail: 'phase must be 3 or 6' }, { status: 400 });
      }
      const session = await startCxoTakeover(ctx, { programId, phase: body.phase });
      return Response.json({ session }, { status: 201 });
    }

    // commit
    if (!body.threadId || !body.transcript || !body.synthesis || (body.phase !== 3 && body.phase !== 6)) {
      return Response.json({ error: 'bad_request', detail: 'threadId + transcript + synthesis + phase required' }, { status: 400 });
    }
    const result = await commitCxoTranscript(ctx, {
      threadId: body.threadId,
      programId,
      phase: body.phase,
      transcript: body.transcript,
      synthesis: body.synthesis,
    });
    return Response.json({ ok: true, ...result });
  } catch (err) {
    try { return tenancyErrorResponse(err); } catch {}
    console.error('[POST /programs/:id/nexus/cxo-takeover]', err);
    return Response.json({ error: 'internal_error', message: (err as Error).message }, { status: 500 });
  }
}
