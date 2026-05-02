// PATCH /api/v1/source/:eventId/stage
// Body: { stageKey: SourceStageKey }
//
// Advances a persisted Source event to the requested stage. Seed events keep the
// legacy in-memory override path for demo fixtures, but DB rows must persist so
// the production E2E crawler can resume the lifecycle.

import type { NextRequest } from 'next/server';
import { requireTenancy, tenancyErrorResponse } from '@/lib/auth/tenancy';
import { getActiveClientRow } from '@/lib/active-client';
import { getCurrentUser } from '@/lib/auth/current-user';
import { CANONICAL_CLIENT_ADMIN_EMAILS } from '@/lib/auth/canonical-auth-roster';
import { loadUserSourceAccessPolicy } from '@/lib/auth/source-access-policy';
import { getServerSupabase } from '@/lib/supabase-server';
import { setStageOverride } from '@/lib/source/stage-overrides';
import { getSourceEventSeed } from '@/lib/source/mock-seed';
import { isCanonicalSourceStageKey, SOURCE_STAGE_ORDER } from '@/lib/source/constants';
import type { SourceStageKey } from '@/lib/source/types';
import { inferClientKeyFromEmail, isClientKey } from '@/lib/client-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteCtx = { params: Promise<{ eventId: string }> };

function isCanonicalClientAdminEmail(email: string | null | undefined): boolean {
  const normalized = email?.trim().toLowerCase() ?? '';
  return CANONICAL_CLIENT_ADMIN_EMAILS.includes(normalized as (typeof CANONICAL_CLIENT_ADMIN_EMAILS)[number]);
}

export async function PATCH(req: NextRequest, { params }: RouteCtx) {
  let tenancy;
  let tenancyError: unknown = null;
  try {
    tenancy = await requireTenancy();
  } catch (err) {
    tenancyError = err;
  }

  try {
    const { eventId } = await params;
    const [activeClient, currentUser] = await Promise.all([
      getActiveClientRow().catch(() => null),
      getCurrentUser().catch(() => null),
    ]);

    const body = (await req.json()) as { stageKey?: unknown };
    const stageKey = body?.stageKey;

    if (!isCanonicalSourceStageKey(stageKey)) {
      return Response.json(
        {
          error: 'bad_request',
          detail: `stageKey must be one of: ${SOURCE_STAGE_ORDER.join(', ')}`,
        },
        { status: 400 },
      );
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

    const fallbackClientKey =
      (isClientKey(currentUser?.metadataClientKey) ? currentUser.metadataClientKey : null) ??
      inferClientKeyFromEmail(currentUser?.email);
    const effectiveClientKey = activeClient?.key ?? fallbackClientKey;
    if (!effectiveClientKey) {
      if (tenancyError) return tenancyErrorResponse(tenancyError);
      return Response.json({ error: 'no_client', detail: 'No active client for Source stage advancement' }, { status: 403 });
    }

    const accessPolicy = tenancy && activeClient
      ? await loadUserSourceAccessPolicy(tenancy, {
          activeClientKey: activeClient.key,
          sourceEventId: eventId,
        }).catch(() => null)
      : null;
    const canonicalAdminFallbackAllowed =
      !activeClient &&
      isCanonicalClientAdminEmail(currentUser?.email) &&
      Boolean(persistedEvent) &&
      persistedEvent?.client_key === effectiveClientKey;
    const canAdvance = Boolean(accessPolicy?.canApproveSourceStages || canonicalAdminFallbackAllowed);
    if (!canAdvance) {
      return Response.json({
        error: 'forbidden_source_stage_approval_required',
        detail: 'Source stage approval rights are required to advance sourcing events.',
      }, { status: 403 });
    }

    if (persistedEvent) {
      if (persistedEvent.client_key !== effectiveClientKey) {
        return Response.json({ error: 'not_found', detail: `No source event with id ${eventId}` }, { status: 404 });
      }

      const { error: updateError } = await supabase
        .from('source_events')
        .update({
          current_stage_key: stageKey,
          lifecycle_state: stageKey === 'value' ? 'completed' : 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', eventId)
        .eq('client_key', effectiveClientKey);

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
