// POST /api/v1/nexus/counter
// Counter-argument generation · Nexus owns both sides · includes tiebreaker.
// Re-runs orchestrator with capability='counter', linked back via
// counter_of_turn_id.

import { NextRequest } from 'next/server';
import { runPipeline } from '@/lib/nexus/orchestrator';
import { appendTurn, getTurn, listTurns } from '@/lib/intelligence/db/turnRepository';
import { requireTenancy, tenancyErrorResponse } from '../../_intel-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireTenancy();
    const body = (await req.json()) as { turnId?: string };
    if (!body?.turnId) return Response.json({ error: 'bad_request', detail: 'turnId required' }, { status: 400 });

    const original = await getTurn(ctx, body.turnId);
    if (!original) return Response.json({ error: 'not_found' }, { status: 404 });

    const priorTurns = await listTurns(ctx, original.threadId, { limit: 50 });
    const originalHero = (original.payload.hero as string | undefined) ?? (original.payload.framing as string | undefined) ?? (original.payload.answer as string | undefined) ?? '';
    const counterQuery = `Steelman the counter to this answer: ${originalHero}`;

    const result = await runPipeline({
      query: counterQuery,
      tenancy: ctx,
      priorTurns,
      capability: 'counter',
      formatOverride: 'counter_pair',
    });

    const newTurn = await appendTurn(ctx, {
      threadId: original.threadId,
      role: 'nexus',
      mode: result.mode,
      format: 'counter_pair',
      confidence: (result.payload.confidence as 'high' | 'medium' | 'low' | null) ?? null,
      payload: result.payload,
      sources: result.bundle.sources,
      capabilitiesActive: ['counter'],
      counterOfTurnId: original.id,
      latencyMs: result.latencyMs.total,
    });

    return Response.json({
      turn: newTurn,
      latencyMs: result.latencyMs,
    });
  } catch (err) {
    try { return tenancyErrorResponse(err); } catch {}
    console.error('[POST /nexus/counter]', err);
    return Response.json({ error: 'internal_error', message: (err as Error).message }, { status: 500 });
  }
}
