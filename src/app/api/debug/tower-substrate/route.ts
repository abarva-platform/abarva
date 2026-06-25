// GET /api/debug/tower-substrate · per-tenant AI-initiative substrate counts.
//
// The Supabase coupling (client resolution + count queries) lives behind the
// data-plane seam in `selectTowerSubstrateReadAdapter` — `supabase` by
// default, `azure-postgres` when `ABARVA_DATA_PLANE` opts in. This route is
// a thin shell: pick the adapter, shape the JSON response.

import { NextResponse } from 'next/server';
import type { ClientKey } from '@/lib/client-config';
import {
  selectTowerSubstrateReadAdapter,
  type SubstrateTenantSpec,
} from '@/lib/data-plane/read-adapters/towerSubstrateReadAdapter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TENANTS: Array<{ key: ClientKey; slugAliases: string[] }> = [
  { key: 'apexretail', slugAliases: ['apexretail', 'apex-retail'] },
  { key: 'meridian', slugAliases: ['meridian', 'meridian-health'] },
  { key: 'arcturus', slugAliases: ['arcturus', 'first-capital', 'first-capital-financial'] },
  { key: 'skyharbor', slugAliases: ['skyharbor', 'skyharbor-air'] },
  { key: 'lakeshore', slugAliases: ['lakeshore', 'lakeshore-holdings', 'lakeshore-industries'] },
];

export async function GET() {
  const adapter = selectTowerSubstrateReadAdapter();
  const tenants = await adapter.getSubstrateReport(TENANTS as SubstrateTenantSpec[]);

  return NextResponse.json({
    ok: true,
    checkedAt: new Date().toISOString(),
    source: 'production-db-counts',
    tenants,
  });
}
