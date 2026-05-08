// /intelligence/brief · Sentinel's tenant-overlay synthesis. Three
// candidate bets above the line, each with full citation discipline:
// factor breakdown · binding success patterns with quantified signal ·
// anti-patterns with early signals · vendor short list with tier +
// trajectory · regulatory headwinds.
//
// Currently fixture-bound (Meridian healthcare) for the v1.1 ship.
// Live corpus retrieval lands in PR-K3.

import type { Metadata } from 'next';
import { IntelligenceBrief } from '@/components/intelligence-v4/IntelligenceBrief';
import { getMeridianBriefData } from '@/lib/knowledge-corpus/fixtures/meridian-healthcare';

export const metadata: Metadata = {
  title: 'Intelligence · The Brief · AbarVa',
  description:
    "Sentinel's quarterly synthesis of which AI bets are above the line for your tenant — fully cited, with binding patterns and proof points.",
};
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function IntelligenceBriefPage() {
  // TODO(PR-K3): replace with live tenant lookup + corpus retrieval.
  const data = getMeridianBriefData();
  return <IntelligenceBrief data={data} />;
}
