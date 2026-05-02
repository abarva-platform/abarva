// PATCH /api/v1/source/:eventId/stage
// Body: { stageKey: SourceStageKey }
//
// Advances a persisted Source event to the requested stage. Seed events keep the
// legacy in-memory override path for demo fixtures, but DB rows must persist so
// the production E2E crawler can resume the lifecycle.

import type { NextRequest } from 'next/server';
import { requireTenancy, tenancyErrorResponse } from '@/lib/auth/tenancy';
import { getActiveClientRow } from '@/lib/active-client';
import { loadUserSourceAccessPolicy } from '@/lib/auth/source-access-policy';
import { getServerSupabase } from '@/lib/supabase-server';
import { setStageOverride } from '@/lib/source/stage-overrides';
import { getSourceEventSeed } from '@/lib/source/mock-seed';
import { SOURCE_STAGE_ORDER } from '@/lib/source/constants';
import type { SourceStageKey } from '@/lib/source/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteCtx = { params: Promise<{ eventId: string }> };

export async function PATCH(req: NextRequest, { params }: RouteCtx) {
  let tenancy;
  try {
    tenancy = await requireTenancy();
  } catch (err) {
    return tenancyErrorResponse(err);
  }

  try {
    const { eventId } = await params;
    const activeClient = await getActiveClientRow();
    if (!activeClient) {
      return Response.json({ error: 'no_client', detail: 'No active client for Source stage advancement' }, { status: 403 });
    }

    const accessPolicy = await loadUserSourceAccessPolicy(tenancy, {
      activeClientKey: activeClient.key,
      sourceEventId: eventId,
    }).catch(() => null);

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

    if (!accessPolicy?.canApproveSourceStages) {
      return Response.json({
        error: 'forbidden_source_stage_approval_required',
        detail: 'Source stage approval rights are required to advance sourcing events.',
      }, { status: 403 });
    }

    const supabase = getServerSupabase();
    const { data: persistedEvent, error: fetchError } = await supabase
      .from('source_events')
      .select('id, client_key, current_stage_key, lifecycle_state')
      .eq('id', eventId)
      .maybeSingle();

    if (fetchError) {
      return Response.json({ error: 'lookup_failed', detail: fetchError.message }, { status: 500 });
    }

    if (persistedEvent) {
      if (persistedEvent.client_key !== activeClient.key) {
        return Response.json({ error: 'not_found', detail: `No source event with id ${eventId}` }, { status: 404 });
      }

      const { error: updateError } = await supabase
        .from('source_events')
        .update({
          current_stage_key: stageKey,
          lifecycle_state: stageKey === 'value_realization' ? 'completed' : 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', eventId)
        .eq('client_key', activeClient.key);

      if (updateError) {
        return Response.json({ error: 'update_failed', detail: updateError.message }, { status: 500 });
      }

      return Response.json({ ok: true, eventId, stageKey, persisted: true });
    }

    const event = getSourceEventSeed(eventId);
    if (!event) {
      return Response.json({ error: 'not_found', detail: `No source event with id ${eventId}` }, { status: 404 });
    }

    setStageOverride(eventId, stageKey as SourceStageKey);

    return Response.json({ ok: true, eventId, stageKey, persisted: false });
  } catch (err) {
    console.error('[PATCH /api/v1/source/:eventId/stage]', err);
    return Response.json({ error: 'internal_error' }, { status: 500 });
  }
}
