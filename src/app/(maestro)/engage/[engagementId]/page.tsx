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
import { listAllTopics, listEngagementTopics } from '@/lib/topics/db';

export default async function EngagePage({
  params,
}: {
  params: Promise<{ engagementId: string }>;
}) {
  const { engagementId } = await params;

  const engagement = await getEngagementByGraphId(engagementId);
  if (!engagement) notFound();

  const [sponsor, turns, activePatterns, peerDecisions, chainedPatterns, caller, assignedTopicRows, allTopicRows] = await Promise.all([
    engagement.sponsor_person_id ? getPersonById(engagement.sponsor_person_id) : Promise.resolve(null),
    getRecentTurns(engagement.id),
    getActivePatterns(engagementId),
    getPeerDecisionsForPhase(engagementId, engagement.current_phase),
    getChainedPatterns(engagementId),
    getCurrentPerson(),
    listEngagementTopics(engagement.id),
    listAllTopics(),
  ]);

  const topicsByKey = new Map(allTopicRows.map((t) => [t.topic_key, t]));
  const assignedTopics = assignedTopicRows
    .map((a) => {
      const topic = topicsByKey.get(a.topic_key);
      if (!topic) return null;
      return { key: a.topic_key, title: topic.title, isPrimary: a.is_primary };
    })
    .filter((t): t is { key: string; title: string; isPrimary: boolean } => t !== null);

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
      assignedTopics={assignedTopics}
    />
  );
}
