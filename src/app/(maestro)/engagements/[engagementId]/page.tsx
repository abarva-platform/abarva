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
import { EngagementMetaStrip } from '@/components/engagement/EngagementMetaStrip';
import { getCurrentPerson } from '@/lib/auth/maestro';
import { loadVipGreetingData } from '@/lib/agent/prompts/_shared/user-context';
import { listAllTopics, listEngagementTopics } from '@/lib/topics/db';
import { getServerSupabase } from '@/lib/supabase-server';

export default async function EngagePage({
  params,
}: {
  params: Promise<{ engagementId: string }>;
}) {
  const { engagementId } = await params;

  const engagement = await getEngagementByGraphId(engagementId);
  if (!engagement) notFound();

  // Defensive fetches · graph-backed helpers talk to Neo4j/AGE which may be
  // unreachable or the engagement may lack a graph node yet for freshly-
  // seeded rows. A single thrown promise 500s the whole page; catch-and-
  // default keeps the console usable when graph retrieval is soft-broken.
  // Real errors still surface to server logs.
  const safe = <T,>(label: string, p: Promise<T>, fallback: T): Promise<T> =>
    p.catch((err) => {
      console.warn(`[engagement-page] ${label} failed:`, err);
      return fallback;
    });

  const [sponsor, turns, activePatterns, peerDecisions, chainedPatterns, caller, assignedTopicRows, allTopicRows] = await Promise.all([
    engagement.sponsor_person_id ? safe('sponsor', getPersonById(engagement.sponsor_person_id), null) : Promise.resolve(null),
    safe('turns', getRecentTurns(engagement.id), []),
    safe('activePatterns', getActivePatterns(engagementId), []),
    safe('peerDecisions', getPeerDecisionsForPhase(engagementId, engagement.current_phase), []),
    safe('chainedPatterns', getChainedPatterns(engagementId), []),
    safe('caller', getCurrentPerson(), null),
    safe('assignedTopics', listEngagementTopics(engagement.id), []),
    safe('allTopics', listAllTopics(), []),
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

  // Meta-strip + console signals · contradictions (count + top-3 with impact
  // framing) + activity events (turns + gate approvals + deliverable updates).
  let contradictionsCount = 0;
  let topContradictions: Array<{
    id: string;
    severity: 'high' | 'medium' | 'low';
    description: string;
    one_liner: string | null;
    monthly_total_usd: number | null;
    eliminable_usd_annual: number | null;
    owner_named: boolean | null;
  }> = [];
  try {
    const sb = getServerSupabase();
    const { data: engClient } = await sb
      .from('engagements')
      .select('client_id')
      .eq('id', engagement.id)
      .maybeSingle();
    const clientId = (engClient as { client_id: string | null } | null)?.client_id ?? null;
    if (clientId) {
      const { count } = await sb
        .from('contradictions')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', clientId)
        .is('resolved_at', null);
      contradictionsCount = count ?? 0;

      const { data: rows } = await sb
        .from('contradictions')
        .select('id, severity, description, evidence')
        .eq('client_id', clientId)
        .is('resolved_at', null)
        .order('severity', { ascending: true })
        .limit(3);
      topContradictions = ((rows as Array<{
        id: string;
        severity: 'high' | 'medium' | 'low';
        description: string;
        evidence: { impact?: { one_liner?: string; monthly_total_usd?: number; eliminable_usd_annual?: number; owner_named?: boolean } } | null;
      }> | null) ?? []).map((c) => ({
        id: c.id,
        severity: c.severity,
        description: c.description,
        one_liner: c.evidence?.impact?.one_liner ?? null,
        monthly_total_usd: c.evidence?.impact?.monthly_total_usd ?? null,
        eliminable_usd_annual: c.evidence?.impact?.eliminable_usd_annual ?? null,
        owner_named: c.evidence?.impact?.owner_named ?? null,
      }));
    }
  } catch {
    // quiet fail; strip will render 0, console will render no panel
  }

  const lastTurn = turns.length > 0 ? turns[turns.length - 1] : null;

  // Activity events · unify turns + gate approvals + deliverable updates
  // into a single reverse-chron stream (last 5).
  const events: Array<{ kind: 'turn' | 'gate' | 'deliverable'; label: string; detail: string; at: string }> = [];
  for (const t of turns.slice(-3)) {
    events.push({
      kind: 'turn',
      label: t.sender === 'agent' ? 'Nexus reply' : `${sponsor?.name ?? 'Sponsor'} turn`,
      detail: t.text.slice(0, 72).replace(/\n/g, ' '),
      at: t.created_at,
    });
  }
  const gates = (engagement.gates_passed as Array<{ phase?: number; signed_at?: string; status?: string; summary?: string }> | null) ?? [];
  for (const g of gates) {
    if (g.status === 'approved' && g.signed_at) {
      events.push({
        kind: 'gate',
        label: `Phase ${g.phase} gate approved`,
        detail: g.summary ?? 'Phase advanced',
        at: g.signed_at,
      });
    }
  }
  for (const d of deliverables.slice(0, 3)) {
    events.push({
      kind: 'deliverable',
      label: `${d.type.replace(/_/g, ' ')} drafted`,
      detail: `Phase ${d.phase}`,
      at: d.generated_at,
    });
  }
  events.sort((a, b) => b.at.localeCompare(a.at));
  const activityEvents = events.slice(0, 5);

  return (
    <div style={{ padding: '24px 24px 40px', maxWidth: 1400, margin: '0 auto' }}>
      <EngagementMetaStrip
        engagement={engagement}
        sponsor={sponsor}
        turnCount={turns.length}
        lastTurnAt={lastTurn?.created_at ?? null}
        activePatternsCount={activePatterns.length}
        assignedTopicsCount={assignedTopics.length}
        contradictionsCount={contradictionsCount}
      />
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
        topContradictions={topContradictions}
        activityEvents={activityEvents}
      />
    </div>
  );
}
