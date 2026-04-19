import { notFound } from 'next/navigation';
import { getEngagementByGraphId } from '@/lib/db/engagement';
import { getPersonById } from '@/lib/db/person';
import { getRecentTurns } from '@/lib/db/turn';
import {
  getActivePatterns,
  getPeerDecisionsForPhase,
  getChainedPatterns,
} from '@/lib/graph/retrieval';
import { EngagementConsole } from '@/components/engagement/EngagementConsole';

export default async function EngagePage({
  params,
}: {
  params: Promise<{ engagementId: string }>;
}) {
  const { engagementId } = await params;

  const engagement = await getEngagementByGraphId(engagementId);
  if (!engagement) notFound();

  const [sponsor, turns, activePatterns, peerDecisions, chainedPatterns] = await Promise.all([
    engagement.sponsor_person_id ? getPersonById(engagement.sponsor_person_id) : Promise.resolve(null),
    getRecentTurns(engagement.id),
    getActivePatterns(engagementId),
    getPeerDecisionsForPhase(engagementId, engagement.current_phase),
    getChainedPatterns(engagementId),
  ]);

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
    />
  );
}
