// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/source/[eventId]/door1/diagnose
//
// Existing-contract Diagnose to Recover. Runs the deterministic four-step
// flow over the event's persisted facts and returns the diagnosis + value bridge +
// play (including the Door-2 rebid handoff descriptor when a rebid is warranted).
//
// Gated behind the `source_analytics` master switch (the whole value-analytics
// layer ships dark) and `requireTenancy()` (auth + tenant scope). When the flag is
// off the route 404s, so the optimization path is not observable for un-enrolled tenants.
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
import { withGovernedOpportunityFinding } from '@/lib/source/door1/governed-opportunity-diagnosis';
import {
  getContract360,
  getContractOptimizationOpportunitySet,
} from '@/lib/source/data-model/read-adapter';
import type { ContractOptimizationOpportunity } from '@/lib/source/data-model/contract-optimization-opportunity';

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
    // The optimization path is not observable for un-enrolled tenants.
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

    // Resolve the archetype (classifier category preferred). This path reuses the
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
    const selectedOpportunity = await selectedOpportunityForEvent({
      event,
      clientKey,
    });
    const optimization = withGovernedOpportunityFinding({
      optimization: runSourceOptimization({
        eventId: event.id,
        archetype: resolution.archetype,
        facts,
      }),
      opportunity: selectedOpportunity,
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
              : 'Unknown contract optimization diagnose error',
        },
        { status: 500 },
      );
    }
  }
}

async function selectedOpportunityForEvent(input: {
  readonly event: {
    readonly name?: string | null;
    readonly problemStatement?: string | null;
    readonly synopsis?: string | null;
    readonly nextAction?: string | null;
  };
  readonly clientKey: string;
}): Promise<ContractOptimizationOpportunity | null> {
  const text = [
    input.event.name,
    input.event.problemStatement,
    input.event.synopsis,
    input.event.nextAction,
  ]
    .filter(Boolean)
    .join(" ");
  const contractId =
    /Contract ref:\s*([A-Z0-9-]+)/iu.exec(text)?.[1] ??
    /contract\s+([A-Z]{2,}-\d{3,})/iu.exec(text)?.[1] ??
    /\b([A-Z]{2,}-\d{3,})\b/u.exec(text)?.[1] ??
    null;
  if (!contractId) return null;
  const opportunityId = /Opportunity ref:\s*([A-Z0-9:-]+)/iu.exec(text)?.[1] ?? null;
  const contract = await getContract360(input.clientKey, contractId).catch(() => null);
  const opportunitySet = await getContractOptimizationOpportunitySet(
    input.clientKey,
    contractId,
    contract,
  ).catch(() => null);
  const opportunities = opportunitySet?.opportunities ?? [];
  if (opportunityId) {
    return opportunities.find((opportunity) => opportunity.opportunityId === opportunityId) ?? null;
  }
  return (
    opportunities.find(
      (opportunity) => opportunity.opportunityId === opportunitySet?.selectedOpportunityId,
    ) ??
    opportunities.find((opportunity) => opportunity.amountUsd != null) ??
    null
  );
}
