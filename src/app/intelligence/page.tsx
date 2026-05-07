// /intelligence · Explore layer for AI bets.
//
// v3 (2026-05-07) reframe: pattern-to-Move funnel surface with
// Sentinel chat as a first-class three-mode layout.
//
// 2026-05-07 (live data wave): page reads the active tenant via
// getActiveClientRow → loads initiatives + goals + per-stage data
// in parallel → composes the v3 canvas data from real substrate.
//
// Spec: docs/build/intelligence/INTELLIGENCE_DESIGN_INTENT_2026-05-07.md
// Wireframe: docs/design-canon/wireframe-intelligence-v3-2026-05-07.html

import { IntelligenceV3Page } from '@/components/intelligence-v3/IntelligenceV3Page';
import { buildIntelligenceV3PageData } from '@/lib/intelligence-v3/page-data';
import { getVendorsForClient } from '@/lib/intelligence-v3/vendors-data';
import {
  getByFunctionData,
  getPeerActivityData,
  getMyStrategyData,
} from '@/lib/intelligence-v3/stages-data';
import { getActiveClientRow } from '@/lib/active-client';
import { listInitiativesForClient } from '@/lib/admin/ai-initiatives/queries';

export const metadata = {
  title: 'Intelligence · Explore layer for AI bets | AbarVa',
  description:
    'Explore three substrates — what we know about you, what patterns exist, and what is possible — to originate stronger Strategic Moves or validate the bets already in flight.',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function IntelligencePage() {
  const client = await getActiveClientRow().catch(() => null);

  const [
    { data, isLiveBound },
    vendorsData,
    byFunctionData,
    peerActivityData,
    myStrategyData,
    initiatives,
  ] = await Promise.all([
    buildIntelligenceV3PageData(),
    client ? getVendorsForClient(client.id).catch(() => null) : Promise.resolve(null),
    getByFunctionData().catch(() => null),
    getPeerActivityData().catch(() => null),
    getMyStrategyData().catch(() => null),
    client ? listInitiativesForClient(client.id).catch(() => []) : Promise.resolve([]),
  ]);

  return (
    <IntelligenceV3Page
      data={data}
      isLiveBound={isLiveBound}
      vendorsData={vendorsData}
      byFunctionData={byFunctionData}
      peerActivityData={peerActivityData}
      myStrategyData={myStrategyData}
      initiatives={initiatives}
    />
  );
}
