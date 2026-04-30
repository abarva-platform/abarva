// INT-1.3 — /intelligence is the J0 cold landing surface.
// Server component renders the failure-mode card grid as the primary
// affordance. No filter param; the legacy ?filter= query is dropped
// because the J0 cold landing has no filter chrome (the topic browser
// in INT-2 will own filter semantics).

import { IntelligenceIndexPage } from '@/components/intelligence/IntelligenceIndexPage';

export const metadata = {
  title: 'Intelligence · Why AI programs fail | AbarVa',
  description:
    'Why enterprise AI transformation fails — and how AbarVa prevents it. Ten failure modes, grounded in pattern doctrine, with cited research anchors from McKinsey, MIT/BCG, RAND, Forrester, and Gartner.',
};

export default function IntelligencePage() {
  return <IntelligenceIndexPage />;
}
