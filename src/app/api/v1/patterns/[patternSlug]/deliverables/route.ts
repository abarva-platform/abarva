// GET /api/v1/patterns/:patternSlug/deliverables
// Returns the deliverables that cite a given pattern. The response stays
// stable whether the data comes from graph edges or the seed/manifest fallback.

import { requireTenancy, tenancyErrorResponse } from '@/app/api/v1/_intel-auth';
import { getPatternDeliverablesQuery } from '@/lib/intelligence/pattern-deliverable-query';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ patternSlug: string }> }) {
  try {
    await requireTenancy();
    const { patternSlug } = await params;
    const result = await getPatternDeliverablesQuery(patternSlug);
    if (!result) {
      return Response.json({ error: 'not_found' }, { status: 404 });
    }
    return Response.json(result);
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {}
    console.error('[GET /api/v1/patterns/:patternSlug/deliverables]', err);
    return Response.json({ error: 'internal_error' }, { status: 500 });
  }
}
