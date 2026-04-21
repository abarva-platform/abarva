// GET /api/v1/emergent/cohort
// Service-to-service · returns aggregated cross-client benchmark data.
// Cohort minimum n=3 enforced at DB + API layer. Source client IDs NEVER
// returned — only hashes + aggregates per spec §4.7 + §7.8 call #3.
//
// Auth: requires x-service-auth header matching SERVICE_AUTH_TOKEN env
// (or SUPABASE_SERVICE_ROLE_KEY in dev). NOT user-facing.

import { NextRequest } from 'next/server';
import { findEmergentPattern } from '@/lib/intelligence/db/emergentRepository';
import { requireServiceAuth } from '../../_intel-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authFail = requireServiceAuth(req);
  if (authFail) return authFail;

  const url = new URL(req.url);
  const patternKey = url.searchParams.get('patternId') ?? url.searchParams.get('patternKey') ?? undefined;
  const industry = url.searchParams.get('clientIndustry') ?? url.searchParams.get('industry') ?? undefined;
  const tier = url.searchParams.get('clientTier') ?? url.searchParams.get('tier') ?? undefined;

  if (!patternKey && !industry) {
    return Response.json({ error: 'bad_request', detail: 'patternKey or industry required' }, { status: 400 });
  }

  try {
    const pattern = await findEmergentPattern({
      patternKey: patternKey ?? undefined,
      industry: industry ?? undefined,
      tier: tier ?? undefined,
    });

    if (!pattern) {
      return Response.json(
        { error: 'insufficient_peer_data', detail: 'Cohort size below n=3 threshold or no match' },
        { status: 404 },
      );
    }

    const aggregates = pattern.aggregateOutcomes;
    return Response.json({
      cohortSize: pattern.cohortSize,
      median: aggregates.median ?? null,
      range: aggregates.range ?? null,
      distribution: aggregates.distribution ?? null,
      failureModes: aggregates.failureModes ?? null,
      successRate: aggregates.success_rate ?? null,
      lastAggregatedAt: pattern.lastAggregatedAt,
      // Explicit non-return of client identities per spec §7.8 call #3
      sourceClientIds: null,
    });
  } catch (err) {
    console.error('[GET /emergent/cohort]', err);
    return Response.json({ error: 'internal_error', message: (err as Error).message }, { status: 500 });
  }
}
