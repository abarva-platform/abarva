// GET /api/v1/programs/patterns · list pattern library entries
// Reads engagement_topics catalog. Only 'mature' and 'pilot' promotion states
// surface to clients; 'draft' (Maestro authoring) and 'deprecated' are hidden.
// Returns PatternLibraryItem[] (view-model from types.ts).

import { NextRequest } from 'next/server';
import { getServerSupabase } from '@/lib/supabase-server';
import { requireTenancy, tenancyErrorResponse } from '../_auth';
import type { ArchetypeKey, PatternLibraryItem } from '@/lib/programs/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CLIENT_VISIBLE_STATES = ['pilot', 'mature'] as const;

export async function GET(req: NextRequest) {
  try {
    await requireTenancy(); // auth only · topics are shared across clients
    const url = new URL(req.url);
    const archetypeFilter = url.searchParams.get('archetype') as ArchetypeKey | null;
    const industryFilter = url.searchParams.get('industry');
    const includeAll = url.searchParams.get('all') === '1'; // Maestro-only — add an auth check when admin endpoint lands

    const sb = getServerSupabase();
    let q = sb
      .from('engagement_topics')
      .select('topic_key, title, tagline, industries, deployment_count, successful_deployment_count, promotion_state, canonical_shape_json, maturity_version')
      .order('successful_deployment_count', { ascending: false, nullsFirst: false });
    if (!includeAll) q = q.in('promotion_state', CLIENT_VISIBLE_STATES as unknown as string[]);
    if (industryFilter) q = q.contains('industries', [industryFilter]);
    const { data, error } = await q.limit(100);
    if (error) throw error;

    const rows = (data as Array<{
      topic_key: string;
      title: string;
      tagline: string | null;
      industries: string[] | null;
      deployment_count: number;
      successful_deployment_count: number;
      promotion_state: string | null;
      canonical_shape_json: Record<string, unknown> | null;
      maturity_version: number;
    }> | null) ?? [];

    const patterns: PatternLibraryItem[] = rows
      .filter((r) => {
        if (!archetypeFilter) return true;
        const archetype = (r.canonical_shape_json?.archetype as string | undefined) ?? null;
        return archetype === archetypeFilter;
      })
      .map((r) => {
        const archetype = ((r.canonical_shape_json?.archetype as ArchetypeKey | undefined) ?? 'strategic_transformation');
        const durationMonths = (r.canonical_shape_json?.typical_duration_months as number | undefined) ?? 6;
        const preloadDepth = (r.canonical_shape_json?.preload_depth_pct as number | undefined) ?? (r.promotion_state === 'mature' ? 80 : 60);
        return {
          key: r.topic_key,
          name: r.title,
          archetype,
          promotionState: (r.promotion_state === 'mature' ? 'mature' : r.promotion_state === 'draft' ? 'candidate' : 'proven') as PatternLibraryItem['promotionState'],
          summary: r.tagline ?? '',
          typicalDurationMonths: durationMonths,
          deploymentCount: r.deployment_count ?? 0,
          preloadDepthPct: preloadDepth,
        };
      });

    return Response.json({ patterns });
  } catch (err) {
    try { return tenancyErrorResponse(err); } catch {}
    console.error('[GET /programs/patterns]', err);
    return Response.json({ error: 'internal_error' }, { status: 500 });
  }
}
