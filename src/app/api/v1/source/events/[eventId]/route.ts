// GET /api/v1/source/events/:eventId
//
// Tenant-safe event-by-id lookup. Returns the serialized SourcingEventDetail
// when the caller's active tenant owns the event, and a 404 (NOT 403) when
// the event does not exist or belongs to a different tenant — the same
// anti-enumeration rule applied across the Source API surface.
//
// The bulk of the tenancy check lives inside `getSourcingEvent`, which after
// the Finding 1 fix returns `null` for cross-tenant ids. This route layers an
// auth gate on top so unauthenticated callers never reach the data layer.

import type { NextRequest } from 'next/server';
import { requireTenancy, tenancyErrorResponse } from '@/lib/auth/tenancy';
import { getActiveClientRow } from '@/lib/active-client';
import { getSourcingEvent } from '@/lib/source/queries';
import type { SourcingEventDetail } from '@/lib/source/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteCtx = { params: Promise<{ eventId: string }> };

// Serialize the SourcingEventDetail for the API consumer. The internal type
// is camelCase; the API contract exposes snake_case `current_stage_key` (and
// related fields) so callers don't have to know the in-memory shape. Both
// shapes are included for backwards compatibility with existing consumers
// that already read the camelCase form.
function serializeEvent(event: SourcingEventDetail) {
  return {
    ...event,
    current_stage_key: event.currentStageKey,
    current_stage_label: event.currentStageLabel,
  };
}

export async function GET(_req: NextRequest, { params }: RouteCtx) {
  try {
    await requireTenancy();
  } catch (error) {
    return tenancyErrorResponse(error);
  }

  const activeClient = await getActiveClientRow().catch(() => null);
  if (!activeClient) {
    // No active tenant → treat as not-found rather than leaking auth state.
    return Response.json({ error: 'not_found' }, { status: 404 });
  }

  const { eventId } = await params;

  let event: SourcingEventDetail | null;
  try {
    event = await getSourcingEvent(eventId);
  } catch (err) {
    console.error('[GET /api/v1/source/events/:eventId]', err);
    return Response.json({ error: 'internal_error' }, { status: 500 });
  }

  if (!event) {
    // Cross-tenant or genuinely missing — both return 404 to prevent
    // enumeration of other tenants' event ids.
    return Response.json({ error: 'not_found' }, { status: 404 });
  }

  return Response.json({ event: serializeEvent(event) }, { status: 200 });
}
