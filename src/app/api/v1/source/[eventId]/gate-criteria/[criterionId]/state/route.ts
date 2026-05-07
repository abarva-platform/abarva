// PATCH /api/v1/source/:eventId/gate-criteria/:criterionId/state
//
// Body: { state: SourceEventGateCriterionState }
//
// Flips the per-event gate-criterion state. Used by the Gate tab's
// "Mark met" / "Reopen" buttons so a sourcing lead (or admin) can
// satisfy the criteria one at a time and then promote the stage.
//
// Auth: requireTenancy + canApproveSourceStages — same gate as
// PATCH /stage, since this action is the precondition for promotion.
// Per Memory · Gate self-approval model: in pilot any user with
// stage-approval rights can self-approve criteria; production hardens
// to admin/maestro through the same flag.

import type { NextRequest } from 'next/server';
import { requireTenancy, tenancyErrorResponse } from '@/lib/auth/tenancy';
import { getActiveClientRow } from '@/lib/active-client';
import { getCurrentUser } from '@/lib/auth/current-user';
import { CANONICAL_CLIENT_ADMIN_EMAILS } from '@/lib/auth/canonical-auth-roster';
import { loadUserSourceAccessPolicy } from '@/lib/auth/source-access-policy';
import { getServerSupabase } from '@/lib/supabase-server';
import { inferClientKeyFromEmail, isClientKey } from '@/lib/client-config';
import {
  gateCriterionStateRowToView,
  type SourceEventGateCriterion,
  type SourceEventGateCriterionState,
  type SourceEventGateCriterionStateRow,
} from '@/lib/source/canvas-substrate/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteCtx = { params: Promise<{ eventId: string; criterionId: string }> };

const ALLOWED_STATES: SourceEventGateCriterionState[] = [
  'pending',
  'met',
  'not_met',
  'waived',
  'deferred',
];

function isAllowedState(value: unknown): value is SourceEventGateCriterionState {
  return typeof value === 'string' && (ALLOWED_STATES as string[]).includes(value);
}

function isCanonicalClientAdminEmail(email: string | null | undefined): boolean {
  const normalized = email?.trim().toLowerCase() ?? '';
  return CANONICAL_CLIENT_ADMIN_EMAILS.includes(
    normalized as (typeof CANONICAL_CLIENT_ADMIN_EMAILS)[number],
  );
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
    const { eventId, criterionId } = await params;
    const [activeClient, currentUser] = await Promise.all([
      getActiveClientRow().catch(() => null),
      getCurrentUser().catch(() => null),
    ]);

    const body = (await req.json().catch(() => null)) as { state?: unknown } | null;
    const state = body?.state;
    if (!isAllowedState(state)) {
      return Response.json(
        {
          error: 'bad_request',
          detail: `state must be one of: ${ALLOWED_STATES.join(', ')}`,
        },
        { status: 400 },
      );
    }
    if (state === 'waived') {
      // Waivers require an attached approval record; reject for now and
      // route the sourcing lead through the dedicated waiver flow once
      // it ships. (Mark met / Reopen are the canvas-level controls.)
      return Response.json(
        {
          error: 'waiver_required',
          detail: 'Waiver state requires an approval record. Use the waiver flow once available.',
        },
        { status: 409 },
      );
    }

    const supabase = getServerSupabase();
    const { data: persistedEvent, error: fetchError } = await supabase
      .from('source_events')
      .select('id, client_key')
      .eq('id', eventId)
      .maybeSingle();
    if (fetchError) {
      return Response.json(
        { error: 'lookup_failed', detail: fetchError.message },
        { status: 500 },
      );
    }
    if (!persistedEvent) {
      return Response.json(
        { error: 'not_found', detail: `No source event with id ${eventId}` },
        { status: 404 },
      );
    }

    const fallbackClientKey =
      (isClientKey(currentUser?.metadataClientKey) ? currentUser.metadataClientKey : null) ??
      inferClientKeyFromEmail(currentUser?.email);
    const effectiveClientKey = activeClient?.key ?? fallbackClientKey;
    if (!effectiveClientKey) {
      if (tenancyError) return tenancyErrorResponse(tenancyError);
      return Response.json(
        { error: 'no_client', detail: 'No active client for gate-criterion mutation' },
        { status: 403 },
      );
    }
    if (persistedEvent.client_key !== effectiveClientKey) {
      return Response.json(
        { error: 'not_found', detail: `No source event with id ${eventId}` },
        { status: 404 },
      );
    }

    const accessPolicy =
      tenancy && activeClient
        ? await loadUserSourceAccessPolicy(tenancy, {
            activeClientKey: activeClient.key,
            sourceEventId: eventId,
          }).catch(() => null)
        : null;
    const canonicalAdminFallbackAllowed =
      !activeClient &&
      isCanonicalClientAdminEmail(currentUser?.email) &&
      persistedEvent.client_key === effectiveClientKey;
    const canMutate = Boolean(
      accessPolicy?.canApproveSourceStages || canonicalAdminFallbackAllowed,
    );
    if (!canMutate) {
      return Response.json(
        {
          error: 'forbidden',
          detail: 'Source stage-approval rights are required to update gate criteria.',
        },
        { status: 403 },
      );
    }

    const { data: criterionRow, error: criterionFetchError } = await supabase
      .from('source_event_gate_criterion_states')
      .select('*')
      .eq('source_event_id', eventId)
      .eq('criterion_id', criterionId)
      .maybeSingle<SourceEventGateCriterionStateRow>();
    if (criterionFetchError) {
      return Response.json(
        { error: 'lookup_failed', detail: criterionFetchError.message },
        { status: 500 },
      );
    }
    if (!criterionRow) {
      return Response.json(
        {
          error: 'criterion_not_found',
          detail: `No criterion ${criterionId} on event ${eventId}. Run db:backfill:source-canvas to scaffold.`,
        },
        { status: 404 },
      );
    }

    const reviewerUserId = currentUser?.personId ?? null;
    const reviewedAt =
      state === 'met' || state === 'not_met' ? new Date().toISOString() : null;

    const { data: updatedRow, error: updateError } = await supabase
      .from('source_event_gate_criterion_states')
      .update({
        state,
        reviewer_user_id: state === 'pending' ? null : reviewerUserId,
        reviewed_at: reviewedAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', criterionRow.id)
      .select('*')
      .single<SourceEventGateCriterionStateRow>();
    if (updateError) {
      return Response.json(
        { error: 'update_failed', detail: updateError.message },
        { status: 500 },
      );
    }

    const view: SourceEventGateCriterion = gateCriterionStateRowToView(updatedRow);
    return Response.json({ ok: true, criterion: view });
  } catch (err) {
    console.error(
      '[PATCH /api/v1/source/:eventId/gate-criteria/:criterionId/state]',
      err,
    );
    return Response.json({ error: 'internal_error' }, { status: 500 });
  }
}
