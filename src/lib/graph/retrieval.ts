import { isInt, Integer } from 'neo4j-driver';
import { getGraphDriver } from './driver';
import type {
  ActivePattern,
  ChainedPattern,
  GenomePatternDetail,
  GenomePatternSummary,
  PeerDecisionSummary,
  PersonContext,
  SimilarEngagement,
} from './types';

const FAMILIARITY_VALUES = new Set<PersonContext['familiarity']>([
  'first_meeting',
  'returning_recent',
  'returning_dormant',
  'frequent_collaborator',
]);

function narrowFamiliarity(v: unknown): PersonContext['familiarity'] {
  return typeof v === 'string' && FAMILIARITY_VALUES.has(v as PersonContext['familiarity'])
    ? (v as PersonContext['familiarity'])
    : 'first_meeting';
}

function toNum(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  if (isInt(v)) return (v as Integer).toNumber();
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

const PEER_DECISIONS_CYPHER = `
MATCH (e:Engagement {id: $engagementId})-[:IN_INDUSTRY]->(:Industry)<-[:IN_INDUSTRY]-(peer:Engagement)
WHERE peer.id <> e.id
MATCH (peer)-[:MADE]->(d:Decision {phase: $phase})-[:RESULTED_IN]->(o:Outcome)
RETURN d.choice AS choice,
       count(peer) AS engagement_count,
       avg(o.savings_usd) AS avg_outcome_usd,
       sum(o.savings_usd) AS total_savings_usd,
       collect(coalesce(o.notes, '')) AS notes
ORDER BY engagement_count DESC
`;

export async function getPeerDecisionsForPhase(
  engagementId: string,
  phase: number,
): Promise<PeerDecisionSummary[]> {
  const session = getGraphDriver().session();
  try {
    const res = await session.run(PEER_DECISIONS_CYPHER, { engagementId, phase });
    return res.records.map((r) => ({
      choice: r.get('choice') as string,
      engagement_count: toNum(r.get('engagement_count')),
      avg_outcome_usd: toNum(r.get('avg_outcome_usd')),
      total_savings_usd: toNum(r.get('total_savings_usd')),
      notes: ((r.get('notes') as unknown[]) ?? [])
        .map((n) => (typeof n === 'string' ? n : ''))
        .filter((n) => n.length > 0),
    }));
  } finally {
    await session.close();
  }
}

const ACTIVE_PATTERNS_CYPHER = `
MATCH (e:Engagement {id: $engagementId})-[r:TRIGGERED]->(p:GenomePattern)
RETURN p.code AS code, p.name AS name, p.failure_rate AS failure_rate,
       p.category AS category, toString(r.observed_at) AS observed_at
ORDER BY p.failure_rate DESC
`;

export async function getActivePatterns(
  engagementId: string,
): Promise<ActivePattern[]> {
  const session = getGraphDriver().session();
  try {
    const res = await session.run(ACTIVE_PATTERNS_CYPHER, { engagementId });
    return res.records.map((r) => ({
      code: r.get('code') as string,
      name: r.get('name') as string,
      failure_rate: toNum(r.get('failure_rate')),
      category: r.get('category') as string,
      observed_at: (r.get('observed_at') as string | null) ?? null,
    }));
  } finally {
    await session.close();
  }
}

const CHAINED_PATTERNS_CYPHER = `
MATCH (e:Engagement {id: $engagementId})-[:TRIGGERED]->(from:GenomePattern)-[c:CHAINS_TO]->(to:GenomePattern)
WHERE c.weight >= $minWeight
RETURN from.code AS from_code, to.code AS to_code, to.name AS to_name,
       to.failure_rate AS to_failure_rate, c.weight AS weight
ORDER BY c.weight DESC
`;

export async function getChainedPatterns(
  engagementId: string,
  minWeight: number = 0,
): Promise<ChainedPattern[]> {
  const session = getGraphDriver().session();
  try {
    const res = await session.run(CHAINED_PATTERNS_CYPHER, { engagementId, minWeight });
    return res.records.map((r) => ({
      from_code: r.get('from_code') as string,
      to_code: r.get('to_code') as string,
      to_name: r.get('to_name') as string,
      to_failure_rate: toNum(r.get('to_failure_rate')),
      weight: toNum(r.get('weight')),
    }));
  } finally {
    await session.close();
  }
}

const SIMILAR_ENGAGEMENTS_CYPHER = `
MATCH (e:Engagement {id: $engagementId})-[:IN_INDUSTRY]->(:Industry)<-[:IN_INDUSTRY]-(peer:Engagement)
WHERE peer.id <> e.id
OPTIONAL MATCH (peer)-[:MADE]->(:Decision)-[:RESULTED_IN]->(o:Outcome)
RETURN peer.id AS id, peer.name AS name, peer.industry_code AS industry_code,
       peer.status AS status, o.savings_usd AS outcome_savings_usd
ORDER BY peer.name LIMIT $limit
`;

export async function getSimilarEngagements(
  engagementId: string,
  limit: number = 10,
): Promise<SimilarEngagement[]> {
  const session = getGraphDriver().session();
  try {
    const res = await session.run(SIMILAR_ENGAGEMENTS_CYPHER, {
      engagementId,
      limit: Integer.fromNumber(limit),
    });
    return res.records.map((r) => ({
      id: r.get('id') as string,
      name: r.get('name') as string,
      industry_code: r.get('industry_code') as string,
      status: r.get('status') as string,
      outcome_savings_usd:
        r.get('outcome_savings_usd') == null ? null : toNum(r.get('outcome_savings_usd')),
    }));
  } finally {
    await session.close();
  }
}

const SPONSOR_CYPHER = `
MATCH (sponsor:Person)-[:SPONSORED]->(e:Engagement {id: $engagementId})
OPTIONAL MATCH (sponsor)-[:SPONSORED|LED]->(prior:Engagement)
WHERE prior.id <> e.id
RETURN sponsor.id AS id, sponsor.name AS name, sponsor.role AS role,
       sponsor.organization AS organization,
       coalesce(sponsor.familiarity, 'first_meeting') AS familiarity,
       count(prior) AS past_engagement_count,
       toString(sponsor.last_seen_at) AS last_seen_at
`;

const ALL_PATTERNS_CYPHER = `
MATCH (p:GenomePattern)
OPTIONAL MATCH (p)<-[t:TRIGGERED]-(:Engagement)
RETURN p.code AS code, p.name AS name, p.failure_rate AS failure_rate,
       p.category AS category, count(t) AS trigger_count
ORDER BY p.failure_rate DESC
`;

export async function getAllGenomePatterns(): Promise<GenomePatternSummary[]> {
  const session = getGraphDriver().session();
  try {
    const res = await session.run(ALL_PATTERNS_CYPHER);
    return res.records.map((r) => ({
      code: r.get('code') as string,
      name: r.get('name') as string,
      failure_rate: toNum(r.get('failure_rate')),
      category: r.get('category') as string,
      trigger_count: toNum(r.get('trigger_count')),
    }));
  } finally {
    await session.close();
  }
}

export async function getGenomePatternDetail(code: string): Promise<GenomePatternDetail | null> {
  const session = getGraphDriver().session();
  try {
    const patternRes = await session.run(
      `MATCH (p:GenomePattern {code: $code}) RETURN p`,
      { code },
    );
    if (patternRes.records.length === 0) return null;
    const p = (patternRes.records[0].get('p') as { properties: Record<string, unknown> }).properties;

    const engRes = await session.run(
      `MATCH (p:GenomePattern {code: $code})<-[:TRIGGERED]-(e:Engagement)
       OPTIONAL MATCH (e)-[:IN_INDUSTRY]->(i:Industry)
       RETURN e.id AS id, e.name AS name, e.current_phase AS phase, i.code AS industry`,
      { code },
    );

    const toRes = await session.run(
      `MATCH (p:GenomePattern {code: $code})-[c:CHAINS_TO]->(t:GenomePattern)
       RETURN t.code AS code, t.name AS name, c.weight AS weight`,
      { code },
    );

    const fromRes = await session.run(
      `MATCH (f:GenomePattern)-[c:CHAINS_TO]->(p:GenomePattern {code: $code})
       RETURN f.code AS code, f.name AS name, c.weight AS weight`,
      { code },
    );

    return {
      code: (p.code as string) ?? code,
      name: (p.name as string) ?? '',
      category: (p.category as string) ?? '',
      description: (p.description as string | null) ?? null,
      failure_rate: toNum(p.failure_rate),
      engagements_triggering: engRes.records.map((r) => ({
        graph_node_id: r.get('id') as string,
        name: r.get('name') as string,
        industry: (r.get('industry') as string) ?? 'unknown',
        current_phase: toNum(r.get('phase')),
      })),
      chains_to: toRes.records.map((r) => ({
        to_code: r.get('code') as string,
        to_name: r.get('name') as string,
        weight: toNum(r.get('weight')),
      })),
      chains_from: fromRes.records.map((r) => ({
        from_code: r.get('code') as string,
        from_name: r.get('name') as string,
        weight: toNum(r.get('weight')),
      })),
    };
  } finally {
    await session.close();
  }
}

export async function getSponsorContext(engagementId: string): Promise<PersonContext | null> {
  const session = getGraphDriver().session();
  try {
    const res = await session.run(SPONSOR_CYPHER, { engagementId });
    if (res.records.length === 0) return null;
    const r = res.records[0];
    if (r.get('id') == null) return null;
    return {
      id: r.get('id') as string,
      name: r.get('name') as string,
      role: r.get('role') as string,
      organization: r.get('organization') as string,
      familiarity: narrowFamiliarity(r.get('familiarity')),
      past_engagement_count: toNum(r.get('past_engagement_count')),
      last_seen_at: (r.get('last_seen_at') as string | null) ?? null,
    };
  } finally {
    await session.close();
  }
}
