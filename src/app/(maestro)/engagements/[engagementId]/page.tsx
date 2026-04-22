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

type NormalizedDeliverable = {
  type: string;
  phase: number;
  generated_at: string;
  content: Record<string, unknown>;
  label?: string;
};

type ContradictionRow = {
  id: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  evidence: {
    impact?: {
      one_liner?: string;
      monthly_total_usd?: number;
      eliminable_usd_annual?: number;
      owner_named?: boolean;
    };
  } | null;
  impact: {
    one_liner?: string;
    monthly_total_usd?: number;
    eliminable_usd_annual?: number;
    owner_named?: boolean;
  } | null;
};

function slugifyLabel(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
  return slug || 'legacy_deliverable';
}

function normalizeDeliverables(
  rawDeliverables: unknown[],
  fallbackPhase: number,
  fallbackGeneratedAt: string,
): NormalizedDeliverable[] {
  return rawDeliverables.flatMap((entry, index) => {
    if (!entry || typeof entry !== 'object') return [];
    const record = entry as Record<string, unknown>;
    const title = typeof record.title === 'string' ? record.title : null;
    const type = typeof record.type === 'string' && record.type.length > 0
      ? record.type
      : title
        ? slugifyLabel(title)
        : `legacy_deliverable_${index + 1}`;
    const phase = typeof record.phase === 'number' ? record.phase : fallbackPhase;
    const generatedAt = typeof record.generated_at === 'string' && record.generated_at.length > 0
      ? record.generated_at
      : fallbackGeneratedAt;
    const content = record.content && typeof record.content === 'object'
      ? (record.content as Record<string, unknown>)
      : record;

    return [{
      type,
      phase,
      generated_at: generatedAt,
      content,
      label: title ?? undefined,
    }];
  });
}

function dedupeTopContradictions<T extends { description: string; one_liner: string | null }>(rows: T[]): T[] {
  const seen = new Set<string>();
  const output: T[] = [];
  for (const row of rows) {
    const signature = `${row.description.trim().toLowerCase()}|${(row.one_liner ?? '').trim().toLowerCase()}`;
    if (seen.has(signature)) continue;
    seen.add(signature);
    output.push(row);
  }
  return output;
}

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

  if (assignedTopics.length === 0 && engagement.topic_code) {
    const fallbackTopic = topicsByKey.get(engagement.topic_code);
    assignedTopics.push({
      key: engagement.topic_code,
      title: fallbackTopic?.title ?? engagement.topic_code,
      isPrimary: true,
    });
  }

  // VIP greeting data — only populates when the caller matches a VIP profile.
  // Rendered as a welcome card above empty conversations; generic users see
  // the standard "say something to Nexus" empty state.
  const vipGreeting = caller
    ? await loadVipGreetingData({ personId: caller.id, displayName: caller.name })
    : null;

  const sb = getServerSupabase();
  const deliverables = Array.isArray(engagement.deliverables)
    ? normalizeDeliverables(engagement.deliverables, engagement.current_phase, engagement.updated_at)
    : [];
  try {
    const { data: v2Rows } = await sb
      .from('deliverables_v2')
      .select('deliverable_type_key, updated_at')
      .eq('engagement_id', engagement.id)
      .order('updated_at', { ascending: false });
    for (const row of (v2Rows as Array<{ deliverable_type_key: string; updated_at: string }> | null) ?? []) {
      if (deliverables.some((d) => d.type === row.deliverable_type_key)) continue;
      deliverables.push({
        type: row.deliverable_type_key,
        phase: engagement.current_phase,
        generated_at: row.updated_at,
        content: {},
      });
    }
  } catch (err) {
    console.warn('[engagement-page] deliverables_v2 failed:', err);
  }

  // Meta-strip + console signals · contradictions (count + top-3 with impact
  // framing) + activity events (turns + gate approvals + deliverable updates).
  let contradictionsCount = 0;
  let contradictionsScope: 'program' | 'client' | 'none' = 'none';
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
    const { data: engClient } = await sb
      .from('engagements')
      .select('client_id')
      .eq('id', engagement.id)
      .maybeSingle();
    const clientId = (engClient as { client_id: string | null } | null)?.client_id ?? null;
    const mapContradictions = (rows: ContradictionRow[]) =>
      rows.map((c) => ({
        id: c.id,
        severity: c.severity,
        description: c.description,
        one_liner: c.impact?.one_liner ?? c.evidence?.impact?.one_liner ?? null,
        monthly_total_usd: c.impact?.monthly_total_usd ?? c.evidence?.impact?.monthly_total_usd ?? null,
        eliminable_usd_annual: c.impact?.eliminable_usd_annual ?? c.evidence?.impact?.eliminable_usd_annual ?? null,
        owner_named: c.impact?.owner_named ?? c.evidence?.impact?.owner_named ?? null,
      }));

    const { count: programCount, data: programRows } = await sb
      .from('contradictions')
      .select('id, severity, description, evidence, impact', { count: 'exact' })
      .eq('triggered_engagement_id', engagement.id)
      .is('resolved_at', null)
      .order('severity', { ascending: true })
      .limit(3);

    if ((programCount ?? 0) > 0) {
      contradictionsCount = programCount ?? 0;
      contradictionsScope = 'program';
      const typedProgramRows = ((programRows as ContradictionRow[] | null) ?? []);
      const programContradictions = dedupeTopContradictions(mapContradictions(typedProgramRows));
      topContradictions = programContradictions.slice(0, 3);
    } else if (clientId) {
      const { count, data: rows } = await sb
        .from('contradictions')
        .select('id, severity, description, evidence, impact', { count: 'exact' })
        .eq('client_id', clientId)
        .is('resolved_at', null);
      contradictionsCount = count ?? 0;
      contradictionsScope = contradictionsCount > 0 ? 'client' : 'none';
      const typedClientRows = ((rows as ContradictionRow[] | null) ?? []);
      const clientContradictions = dedupeTopContradictions(mapContradictions(typedClientRows));
      topContradictions = clientContradictions.slice(0, 3);
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
    const deliverableLabel = d.label ?? d.type.replace(/_/g, ' ');
    events.push({
      kind: 'deliverable',
      label: `${deliverableLabel} drafted`,
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
        contradictionsScope={contradictionsScope}
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
        contradictionsScope={contradictionsScope}
        activityEvents={activityEvents}
      />
    </div>
  );
}
