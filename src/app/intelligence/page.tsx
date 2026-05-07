// /intelligence · Explore layer for AI bets.
//
// v3 (2026-05-07) reframe: pattern-to-Move funnel surface with
// Sentinel chat as a first-class three-mode layout.
//
// 2026-05-07 (live data wave): page now reads the active tenant via
// getActiveClientRow → loads initiatives + goals → composes the v3
// page data from real substrate. Falls back to the First Capital
// fixture when no active client / no substrate loaded so the demo
// surface still works pre-bind.
//
// Spec: docs/build/intelligence/INTELLIGENCE_DESIGN_INTENT_2026-05-07.md
// Wireframe: docs/design-canon/wireframe-intelligence-v3-2026-05-07.html

import { IntelligenceV3Page } from '@/components/intelligence-v3/IntelligenceV3Page';
import { buildIntelligenceV3PageData } from '@/lib/intelligence-v3/page-data';

export const metadata = {
  title: 'Intelligence · Explore layer for AI bets | AbarVa',
  description:
    'Explore three substrates — what we know about you, what patterns exist, and what is possible — to originate stronger Strategic Moves or validate the bets already in flight.',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function IntelligencePage() {
  const { data, isLiveBound } = await buildIntelligenceV3PageData();
  return <IntelligenceV3Page data={data} isLiveBound={isLiveBound} />;
}
