// GET /api/v1/intelligence/foundation/browse
// Zone 4 faceted browse across layers (L1-L4) · tiles + items per facet.
//
// Delegates to the existing library catalog loader (Phase 2 work) and
// shapes the response to match the Intelligence Zone 4 contract.

import { NextRequest } from 'next/server';
import { loadLibraryCatalog } from '@/lib/intelligence/library';
import { requireTenancy, tenancyErrorResponse } from '../../../_intel-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const LAYER_CATEGORIES: Record<string, string[]> = {
  L1: ['pattern', 'benchmark', 'vendor', 'regulation', 'framework', 'research'],
  L2: ['topic'],
  L3: ['topic'],
  L4: [],
};

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireTenancy();
    const url = new URL(req.url);
    const layer = (url.searchParams.get('layer') ?? 'L1') as 'L1' | 'L2' | 'L3' | 'L4';
    const facet = url.searchParams.get('facet');

    const catalog = await loadLibraryCatalog({ clientId: ctx.clientId });
    const allowed = LAYER_CATEGORIES[layer] ?? [];

    let items = catalog.entries.filter((e) => allowed.includes(e.category));
    if (facet) items = items.filter((e) => e.category === facet);

    const tiles = allowed.map((cat) => ({
      id: cat,
      label: cat,
      count: catalog.entries.filter((e) => e.category === cat).length,
      active: cat === facet,
    }));

    return Response.json({
      layer,
      activeLayer: layer,
      tiles,
      items: items.slice(0, 100),
      totalCount: items.length,
    });
  } catch (err) {
    try { return tenancyErrorResponse(err); } catch {}
    console.error('[GET /intelligence/foundation/browse]', err);
    return Response.json({ error: 'internal_error' }, { status: 500 });
  }
}
