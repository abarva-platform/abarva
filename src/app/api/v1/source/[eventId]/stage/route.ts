// PATCH /api/v1/source/:eventId/stage
// Body: { stageKey: SourceStageKey }
//
// Demo affordance — advances the source event to the requested stage by writing
// to the in-memory override store. No DB write occurs; resets on server restart.

import type { NextRequest } from 'next/server';
import { requireTenancy, tenancyErrorResponse } from '../../../_intel-auth';
import { setStageOverride } from '@/lib/source/stage-overrides';
import { getSourceEventSeed } from '@/lib/source/mock-seed';
import { SOURCE_STAGE_ORDER } from '@/lib/source/constants';
import type { SourceStageKey } from '@/lib/source/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteCtx = { params: Promise<{ eventId: string }> };

export async function PATCH(req: NextRequest, { params }: RouteCtx) {
  try {
    await requireTenancy();
    const { eventId } = await params;

    const event = getSourceEventSeed(eventId);
    if (!event) {
      return Response.json({ error: 'not_found', detail: `No source event with id ${eventId}` }, { status: 404 });
    }

    const body = (await req.json()) as { stageKey?: unknown };
    const stageKey = body?.stageKey;

    if (typeof stageKey !== 'string' || !(SOURCE_STAGE_ORDER as string[]).includes(stageKey)) {
      return Response.json(
        {
          error: 'bad_request',
          detail: `stageKey must be one of: ${SOURCE_STAGE_ORDER.join(', ')}`,
        },
        { status: 400 },
      );
    }

    setStageOverride(eventId, stageKey as SourceStageKey);

    return Response.json({ ok: true, eventId, stageKey });
  } catch (err) {
    try { return tenancyErrorResponse(err); } catch {}
    console.error('[PATCH /api/v1/source/:eventId/stage]', err);
    return Response.json({ error: 'internal_error' }, { status: 500 });
  }
}
