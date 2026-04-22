// GET /api/v1/intelligence/foundation
// Zone 1 readout · 5-min cache (disabled in dev).

import { loadFoundation } from '@/lib/intelligence/db/foundationRepository';
import { requireTenancy, tenancyErrorResponse } from '../../_intel-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const ctx = await requireTenancy();
    const foundation = await loadFoundation(ctx);
    return Response.json(foundation, {
      headers: { 'Cache-Control': 'private, max-age=300, stale-while-revalidate=60' },
    });
  } catch (err) {
    try { return tenancyErrorResponse(err); } catch {}
    console.error('[GET /intelligence/foundation]', err);
    return Response.json({ error: 'internal_error' }, { status: 500 });
  }
}
