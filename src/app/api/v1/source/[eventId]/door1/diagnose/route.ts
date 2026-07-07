// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/source/[eventId]/door1/diagnose
//
// Door 1 — existing-contract Diagnose → Recover. Runs the deterministic four-step
// flow over the event's persisted facts and returns the diagnosis + value bridge +
// play (including the Door-2 rebid handoff descriptor when a rebid is warranted).
//
// Gated behind the `source_analytics` master switch (the whole value-analytics
// layer ships dark) and `requireTenancy()` (auth + tenant scope). When the flag is
// off the route 404s — nothing about Door 1 is observable for un-enrolled tenants.
// ─────────────────────────────────────────────────────────────────────────────

import type { NextRequest } from 'next/server';

import { requireTenancy, tenancyErrorResponse } from '@/lib/auth/tenancy';
import { isFeatureEnabled } from '@/lib/features/is-feature-enabled';
import { getActiveClientRow } from '@/lib/active-client';
import { getSourcingEvent } from '@/lib/source/queries';
import { resolveArchetypeForEvent } from '@/lib/source/archetypes/event-archetype-resolver';
import type { SourceCategoryId } from '@/lib/source/taxonomy/category-taxonomy';
import { readEventFactMap } from '@/lib/source/door1/facts-reader';
import { runSourceOptimization } from '@/lib/source/door1/optimize';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type RouteContext = {
  params: Promise<{ eventId?: string }>;
};

export async function POST(_request: NextRequest, { params }: RouteContext) {
  try {
    const ctx = await requireTenancy();

    // Master switch — the whole value-analytics layer ships dark. Off → 404 so
    // Door 1 is not observable for un-enrolled tenants.
    if (
      !isFeatureEnabled(
        { clientKey: ctx.clientKey, clientId: ctx.clientId },
        'source_analytics',
      )
    ) {
      return Response.json(
        { ok: false, error: 'not_found' },
        { status: 404 },
      );
    }

    const { eventId } = await params;
    if (!eventId) {
      return Response.json(
        { ok: false, error: 'missing_event' },
        { status: 400 },
      );
    }

    const activeClient = await getActiveClientRow().catch(() => null);
    const clientKey = activeClient?.key ?? ctx.clientKey ?? null;
    const event = await getSourcingEvent(eventId, clientKey);
    if (!event) {
      return Response.json({ ok: false, error: 'not_found' }, { status: 404 });
    }

    // Resolve the archetype (classifier category preferred). Door 1 reuses the
    // archetype's value-lever rules; without a resolved archetype it refuses
    // rather than diagnose under the wrong DNA.
    const resolution = resolveArchetypeForEvent({
      categoryId: (event.classifiedCategory as SourceCategoryId | null) ?? null,
    });
    if (!resolution.resolved || !resolution.archetype) {
      return Response.json(
        {
          ok: false,
          error: 'archetype_unresolved',
          detail: resolution.reason,
        },
        { status: 409 },
      );
    }

    if (!clientKey) {
      return Response.json(
        { ok: false, error: 'no_client' },
        { status: 403 },
      );
    }

    // Read the event's facts and run the deterministic optimization.
    const facts = await readEventFactMap({ eventId: event.id, clientKey });
    const optimization = runSourceOptimization({
      eventId: event.id,
      archetype: resolution.archetype,
      facts,
    });

    return Response.json(
      {
        ok: true,
        eventId: event.id,
        archetypeId: optimization.archetypeId,
        baseline: optimization.baseline,
        diagnosis: optimization.diagnosis,
        bridge: optimization.bridge,
        play: optimization.play,
      },
      { status: 200, headers: { 'cache-control': 'no-store' } },
    );
  } catch (error) {
    try {
      return tenancyErrorResponse(error);
    } catch {
      return Response.json(
        {
          ok: false,
          error: 'internal_error',
          detail:
            error instanceof Error
              ? error.message
              : 'Unknown Door 1 diagnose error',
        },
        { status: 500 },
      );
    }
  }
}
