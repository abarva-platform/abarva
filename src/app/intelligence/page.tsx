// /intelligence · Explore layer for AI bets.
//
// v3 (2026-05-07) reframe: pattern-to-Move funnel surface with
// Sentinel chat as a first-class three-mode layout.
//
// 2026-05-07 (live data wave): page reads the active tenant via
// getActiveClientRow → loads initiatives + goals → composes the v3
// Today canvas data from real substrate. Vendors stage data also
// fetched here (Vendors stage canvas wired post-PR-Vendors).
//
// Spec: docs/build/intelligence/INTELLIGENCE_DESIGN_INTENT_2026-05-07.md
// Wireframe: docs/design-canon/wireframe-intelligence-v3-2026-05-07.html

import { IntelligenceV3Page } from '@/components/intelligence-v3/IntelligenceV3Page';
import { buildIntelligenceV3PageData } from '@/lib/intelligence-v3/page-data';
import { getVendorsForClient, type VendorsData } from '@/lib/intelligence-v3/vendors-data';
import { getActiveClientRow } from '@/lib/active-client';

export const metadata = {
  title: 'Intelligence · Explore layer for AI bets | AbarVa',
  description:
    'Explore three substrates — what we know about you, what patterns exist, and what is possible — to originate stronger Strategic Moves or validate the bets already in flight.',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function IntelligencePage() {
  const [{ data, isLiveBound }, vendorsData] = await Promise.all([
    buildIntelligenceV3PageData(),
    fetchVendorsForActive(),
  ]);
  return <IntelligenceV3Page data={data} isLiveBound={isLiveBound} vendorsData={vendorsData} />;
}

async function fetchVendorsForActive(): Promise<VendorsData | null> {
  const client = await getActiveClientRow().catch(() => null);
  if (!client) return null;
  return getVendorsForClient(client.id).catch(() => null);
}
