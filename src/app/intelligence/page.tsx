// /intelligence · Explore layer for AI bets.
//
// v3 (2026-05-07) reframe: pattern-to-Move funnel surface with
// Sentinel chat as a first-class three-mode layout. Replaces the prior
// J0 failure-mode card grid landing as the index. The failure-mode
// editorial library remains reachable at /intelligence/failure-modes/<slug>.
//
// Spec: docs/build/intelligence/INTELLIGENCE_DESIGN_INTENT_2026-05-07.md
// Wireframe: docs/design-canon/wireframe-intelligence-v3-2026-05-07.html

import { IntelligenceV3Page } from '@/components/intelligence-v3/IntelligenceV3Page';

export const metadata = {
  title: 'Intelligence · Explore layer for AI bets | AbarVa',
  description:
    'Explore three substrates — what we know about you, what patterns exist, and what is possible — to originate stronger Strategic Moves or validate the bets already in flight.',
};

export default function IntelligencePage() {
  return <IntelligenceV3Page />;
}
