// GET /api/v1/deliverables/:deliverableId/patterns
// Returns the patterns cited by a deliverable. `deliverableId` should use the
// canonical `id` returned by the pattern-deliverable query layer; ambiguous
// generic identifiers return 409 with candidate matches.

import { requireTenancy, tenancyErrorResponse } from '@/app/api/v1/_intel-auth';
import { getDeliverablePatternsQuery } from '@/lib/intelligence/pattern-deliverable-query';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ deliverableId: string }> }) {
  try {
    await requireTenancy();
    const { deliverableId } = await params;
    const result = await getDeliverablePatternsQuery(deliverableId);

    if (result.kind === 'not_found') {
      return Response.json({ error: 'not_found' }, { status: 404 });
    }

    if (result.kind === 'ambiguous') {
      return Response.json(
        {
          error: 'ambiguous_deliverable_id',
          matches: result.matches,
        },
        { status: 409 },
      );
    }

    return Response.json(result.data);
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {}
    console.error('[GET /api/v1/deliverables/:deliverableId/patterns]', err);
    return Response.json({ error: 'internal_error' }, { status: 500 });
  }
}
