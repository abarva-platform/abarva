// /intelligence/map · the canonical "where am I in the universe of
// AI bets" surface. Reads the active tenant + renders MapData from
// the knowledge corpus. Currently fixture-bound (Meridian healthcare)
// for the v1.1 ship; once corpus population lands, the loader in
// src/lib/knowledge-corpus/ supplies live MapData per tenant.

import type { Metadata } from 'next';
import { IntelligenceMap } from '@/components/intelligence-v4/IntelligenceMap';
import { getMeridianMapData } from '@/lib/knowledge-corpus/fixtures/meridian-healthcare';

export const metadata: Metadata = {
  title: 'Intelligence · The Map · AbarVa',
  description:
    'A 2-D landscape of every AI bet for your industry — lifecycle stage × value-leverage at your scale, color-coded by your engagement.',
};
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function IntelligenceMapPage() {
  // TODO(PR-K3): replace with live tenant lookup + corpus retrieval:
  //   const tenant = await getActiveClientRow();
  //   const data = await loadMapForTenant(tenant);
  // For PR-K2 we ship Meridian healthcare as the canonical demo
  // tenant. Other tenants render with the same component once
  // fixtures or live data exist for them.
  const data = getMeridianMapData();
  return <IntelligenceMap data={data} />;
}
