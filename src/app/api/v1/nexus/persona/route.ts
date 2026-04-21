// POST /api/v1/nexus/persona
// Re-render an existing turn through a persona lens (CFO, CIO, CMIO, etc.).
// Reuses orchestrator with capability={persona: '<label>'}, loads the turn's
// original context, returns a new turn payload. Persona turns don't replace
// the original — they append as sibling turns with persona_key set.

import { NextRequest } from 'next/server';
import { runPipeline } from '@/lib/nexus/orchestrator';
import { appendTurn, getTurn, listTurns } from '@/lib/intelligence/db/turnRepository';
import { requireTenancy, tenancyErrorResponse } from '../../_intel-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const VALID_PERSONAS = ['CFO', 'CIO', 'CTO', 'CMIO', 'CDO', 'CISO', 'CHRO', 'CEO', 'Sponsor', 'Board'];

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireTenancy();
    const body = (await req.json()) as { turnId?: string; personaKey?: string };
    if (!body?.turnId || !body?.personaKey) {
      return Response.json({ error: 'bad_request', detail: 'turnId + personaKey required' }, { status: 400 });
    }
    if (!VALID_PERSONAS.includes(body.personaKey)) {
      return Response.json({ error: 'bad_request', detail: `personaKey must be one of ${VALID_PERSONAS.join(', ')}` }, { status: 400 });
    }

    const originalTurn = await getTurn(ctx, body.turnId);
    if (!originalTurn) return Response.json({ error: 'not_found' }, { status: 404 });

    const priorTurns = await listTurns(ctx, originalTurn.threadId, { limit: 50 });
    const hero = (originalTurn.payload.hero as string | undefined) ?? (originalTurn.payload.answer as string | undefined) ?? '';
    const retargetedQuery = `Re-render this answer through ${body.personaKey} lens: ${hero}`;

    const result = await runPipeline({
      query: retargetedQuery,
      tenancy: ctx,
      priorTurns,
      capability: { persona: body.personaKey },
      formatOverride: originalTurn.format ?? undefined,
    });

    const newTurn = await appendTurn(ctx, {
      threadId: originalTurn.threadId,
      role: 'nexus',
      mode: result.mode,
      format: result.format,
      confidence: (result.payload.confidence as 'high' | 'medium' | 'low' | null) ?? null,
      payload: result.payload,
      sources: result.bundle.sources,
      capabilitiesActive: ['persona'],
      personaKey: body.personaKey,
      latencyMs: result.latencyMs.total,
    });

    return Response.json({
      turn: newTurn,
      latencyMs: result.latencyMs,
    });
  } catch (err) {
    try { return tenancyErrorResponse(err); } catch {}
    console.error('[POST /nexus/persona]', err);
    return Response.json({ error: 'internal_error', message: (err as Error).message }, { status: 500 });
  }
}
