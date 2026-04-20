import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

import { getEngagementByGraphId } from '@/lib/db/engagement';
import { getPersonById } from '@/lib/db/person';
import { getRecentTurns } from '@/lib/db/turn';
import {
  getActivePatterns,
  getPeerDecisionsForPhase,
  getChainedPatterns,
} from '@/lib/graph/retrieval';
import { EngagementConsole } from '@/components/engagement/EngagementConsole';
import { getCurrentPerson } from '@/lib/auth/maestro';
import { loadVipGreetingData } from '@/lib/agent/prompts/_shared/user-context';

export default async function EngagePage({
  params,
}: {
  params: Promise<{ engagementId: string }>;
}) {
  const { engagementId } = await params;

  const engagement = await getEngagementByGraphId(engagementId);
  if (!engagement) notFound();

  const [sponsor, turns, activePatterns, peerDecisions, chainedPatterns, caller] = await Promise.all([
    engagement.sponsor_person_id ? getPersonById(engagement.sponsor_person_id) : Promise.resolve(null),
    getRecentTurns(engagement.id),
    getActivePatterns(engagementId),
    getPeerDecisionsForPhase(engagementId, engagement.current_phase),
    getChainedPatterns(engagementId),
    getCurrentPerson(),
  ]);

  // VIP greeting data — only populates when the caller matches a VIP profile.
  // Rendered as a welcome card above empty conversations; generic users see
  // the standard "say something to Nexus" empty state.
  const vipGreeting = caller
    ? await loadVipGreetingData({ personId: caller.id, displayName: caller.name })
    : null;

  const deliverables = Array.isArray(engagement.deliverables)
    ? (engagement.deliverables as Array<{
        type: string;
        phase: number;
        generated_at: string;
        content: Record<string, unknown>;
      }>)
    : [];

  return (
    <EngagementConsole
      engagement={engagement}
      sponsor={sponsor}
      turns={turns}
      activePatterns={activePatterns}
      peerDecisions={peerDecisions}
      chainedPatterns={chainedPatterns}
      deliverables={deliverables}
      vipGreeting={vipGreeting}
    />
  );
}
