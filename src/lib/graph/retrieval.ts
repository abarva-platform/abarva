import { azureRead } from '@/lib/data-plane/azureRead';
import type {
  ActivePattern,
  ChainedPattern,
  GenomePatternDetail,
  GenomePatternSummary,
  PeerDecisionSummary,
  PersonContext,
  SimilarEngagement,
} from './types';

type ActivePatternRow = {
  code: string | null;
  name: string | null;
  failure_rate: string | number | null;
  failure_rate_pct: string | number | null;
  category: string | null;
  office_category: string | null;
  observed_at: string | null;
};

type GenomePatternRow = {
  code: string | null;
  name: string | null;
  category: string | null;
  office_category: string | null;
  description: string | null;
  summary: string | null;
  failure_rate: string | number | null;
  failure_rate_pct: string | number | null;
  trigger_count: string | number | null;
};

type ChainRow = {
  from_code: string | null;
  to_code: string | null;
  to_name: string | null;
  to_failure_rate: string | number | null;
  weight: string | number | null;
};

type SimilarEngagementRow = {
  id: string | null;
  name: string | null;
  industry_code: string | null;
  status: string | null;
  outcome_savings_usd: string | number | null;
};

type SponsorRow = {
  id: string | null;
  name: string | null;
  role: string | null;
  organization: string | null;
  familiarity: PersonContext['familiarity'] | null;
  past_engagement_count: string | number | null;
  last_seen_at: string | null;
};

const FAMILIARITY_VALUES = new Set<PersonContext['familiarity']>([
  'first_meeting',
  'returning_recent',
  'returning_dormant',
  'frequent_collaborator',
]);

function numeric(value: string | number | null | undefined): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function narrowFamiliarity(v: unknown): PersonContext['familiarity'] {
  return typeof v === 'string' && FAMILIARITY_VALUES.has(v as PersonContext['familiarity'])
    ? (v as PersonContext['familiarity'])
    : 'first_meeting';
}

export async function getPeerDecisionsForPhase(
  engagementId: string,
  phase: number,
): Promise<PeerDecisionSummary[]> {
  const rows = await azureRead.query<{
    choice: string | null;
    engagement_count: string | number | null;
    avg_outcome_usd: string | number | null;
    total_savings_usd: string | number | null;
    notes: string[] | null;
  }>(
    `
      SELECT
        coalesce(properties->>'choice', edge_type) AS choice,
        count(*)::int AS engagement_count,
        avg(nullif(properties->>'savings_usd', '')::numeric) AS avg_outcome_usd,
        sum(nullif(properties->>'savings_usd', '')::numeric) AS total_savings_usd,
        array_remove(array_agg(properties->>'notes'), NULL) AS notes
      FROM enterprise_graph_edges
      WHERE (client_id::text = $1 OR tenant_key = $1)
        AND (properties->>'phase' = $2 OR source_segment_id = 'decision_history')
      GROUP BY coalesce(properties->>'choice', edge_type)
      ORDER BY engagement_count DESC
      LIMIT 10
    `,
    [engagementId, String(phase)],
    { missingTable: 'empty' },
  ).catch(() => []);

  return rows.map((row) => ({
    choice: row.choice ?? 'decision',
    engagement_count: numeric(row.engagement_count),
    avg_outcome_usd: numeric(row.avg_outcome_usd),
    total_savings_usd: numeric(row.total_savings_usd),
    notes: row.notes ?? [],
  }));
}

export async function getActivePatterns(
  engagementId: string,
): Promise<ActivePattern[]> {
  const rows = await azureRead.query<ActivePatternRow>(
    `
      SELECT
        gp.code,
        gp.name,
        gp.failure_rate_pct AS failure_rate_pct,
        gp.category,
        gp.office_category,
        e.created_at::text AS observed_at
      FROM enterprise_graph_edges e
      JOIN genome_patterns gp
        ON gp.code = e.to_node_id OR gp.code = e.from_node_id
      WHERE (e.client_id::text = $1 OR e.tenant_key = $1 OR e.from_node_id = $1 OR e.to_node_id = $1)
        AND e.edge_type IN ('TRIGGERED', 'triggered', 'cites_pattern', 'pattern_signal')
      ORDER BY gp.failure_rate_pct DESC NULLS LAST, gp.code ASC
      LIMIT 20
    `,
    [engagementId],
    { missingTable: 'empty' },
  ).catch(() => []);

  return rows.map((row) => ({
    code: row.code ?? '',
    name: row.name ?? '',
    failure_rate: numeric(row.failure_rate ?? row.failure_rate_pct),
    category: row.category ?? row.office_category ?? '',
    observed_at: row.observed_at,
  })).filter((row) => row.code.length > 0);
}

export async function getChainedPatterns(
  engagementId: string,
  minWeight: number = 0,
): Promise<ChainedPattern[]> {
  const rows = await azureRead.query<ChainRow>(
    `
      SELECT
        e.from_node_id AS from_code,
        e.to_node_id AS to_code,
        gp.name AS to_name,
        gp.failure_rate_pct AS to_failure_rate,
        coalesce(nullif(e.properties->>'weight', '')::numeric, e.confidence, 0) AS weight
      FROM enterprise_graph_edges e
      LEFT JOIN genome_patterns gp ON gp.code = e.to_node_id
      WHERE (e.client_id::text = $1 OR e.tenant_key = $1 OR e.from_node_id = $1 OR e.to_node_id = $1)
        AND e.edge_type IN ('CHAINS_TO', 'chains_to', 'depends_on', 'amplifies')
        AND coalesce(nullif(e.properties->>'weight', '')::numeric, e.confidence, 0) >= $2
      ORDER BY weight DESC
      LIMIT 20
    `,
    [engagementId, minWeight],
    { missingTable: 'empty' },
  ).catch(() => []);

  return rows.map((row) => ({
    from_code: row.from_code ?? '',
    to_code: row.to_code ?? '',
    to_name: row.to_name ?? '',
    to_failure_rate: numeric(row.to_failure_rate),
    weight: numeric(row.weight),
  })).filter((row) => row.from_code.length > 0 && row.to_code.length > 0);
}

export async function getSimilarEngagements(
  engagementId: string,
  limit: number = 10,
): Promise<SimilarEngagement[]> {
  const rows = await azureRead.query<SimilarEngagementRow>(
    `
      WITH target AS (
        SELECT industry_code
        FROM engagements
        WHERE id::text = $1 OR graph_node_id = $1
        LIMIT 1
      )
      SELECT
        e.id::text AS id,
        e.name,
        e.industry_code,
        e.status,
        null::numeric AS outcome_savings_usd
      FROM engagements e, target t
      WHERE e.industry_code = t.industry_code
        AND e.id::text <> $1
      ORDER BY e.name ASC
      LIMIT $2
    `,
    [engagementId, Math.min(Math.max(limit, 1), 25)],
    { missingTable: 'empty' },
  ).catch(() => []);

  return rows.map((row) => ({
    id: row.id ?? '',
    name: row.name ?? '',
    industry_code: row.industry_code ?? '',
    status: row.status ?? '',
    outcome_savings_usd: row.outcome_savings_usd == null ? null : numeric(row.outcome_savings_usd),
  })).filter((row) => row.id.length > 0);
}

export async function getAllGenomePatterns(): Promise<GenomePatternSummary[]> {
  const rows = await azureRead.query<GenomePatternRow>(
    `
      SELECT
        gp.code,
        gp.name,
        gp.failure_rate_pct,
        gp.category,
        gp.office_category,
        count(e.edge_id)::int AS trigger_count
      FROM genome_patterns gp
      LEFT JOIN enterprise_graph_edges e
        ON gp.code = e.to_node_id
       AND e.edge_type IN ('TRIGGERED', 'triggered', 'cites_pattern', 'pattern_signal')
      GROUP BY gp.code, gp.name, gp.failure_rate_pct, gp.category, gp.office_category
      ORDER BY gp.failure_rate_pct DESC NULLS LAST, gp.code ASC
      LIMIT 500
    `,
    [],
    { missingTable: 'empty' },
  ).catch(() => []);

  return rows.map((row) => ({
    code: row.code ?? '',
    name: row.name ?? '',
    failure_rate: numeric(row.failure_rate ?? row.failure_rate_pct),
    category: row.category ?? row.office_category ?? '',
    trigger_count: numeric(row.trigger_count),
  })).filter((row) => row.code.length > 0);
}

export async function getGenomePatternDetail(code: string): Promise<GenomePatternDetail | null> {
  const pattern = await azureRead.maybeSingle<GenomePatternRow>({
    table: 'genome_patterns',
    columns: ['code', 'name', 'category', 'office_category', 'description', 'summary', 'failure_rate_pct'],
    where: { code },
    missingTable: 'empty',
  }).catch(() => null);
  if (!pattern?.code) return null;

  const chainsTo = await azureRead.query<ChainRow>(
    `
      SELECT e.to_node_id AS to_code, gp.name AS to_name,
             coalesce(nullif(e.properties->>'weight', '')::numeric, e.confidence, 0) AS weight
      FROM enterprise_graph_edges e
      LEFT JOIN genome_patterns gp ON gp.code = e.to_node_id
      WHERE e.from_node_id = $1
        AND e.edge_type IN ('CHAINS_TO', 'chains_to', 'depends_on', 'amplifies')
      ORDER BY weight DESC
      LIMIT 20
    `,
    [code],
    { missingTable: 'empty' },
  ).catch(() => []);

  const chainsFrom = await azureRead.query<{ from_code: string | null; from_name: string | null; weight: string | number | null }>(
    `
      SELECT e.from_node_id AS from_code, gp.name AS from_name,
             coalesce(nullif(e.properties->>'weight', '')::numeric, e.confidence, 0) AS weight
      FROM enterprise_graph_edges e
      LEFT JOIN genome_patterns gp ON gp.code = e.from_node_id
      WHERE e.to_node_id = $1
        AND e.edge_type IN ('CHAINS_TO', 'chains_to', 'depends_on', 'amplifies')
      ORDER BY weight DESC
      LIMIT 20
    `,
    [code],
    { missingTable: 'empty' },
  ).catch(() => []);

  return {
    code: pattern.code,
    name: pattern.name ?? '',
    category: pattern.category ?? pattern.office_category ?? '',
    description: pattern.description ?? pattern.summary ?? null,
    failure_rate: numeric(pattern.failure_rate ?? pattern.failure_rate_pct),
    engagements_triggering: [],
    chains_to: chainsTo.map((row) => ({
      to_code: row.to_code ?? '',
      to_name: row.to_name ?? '',
      weight: numeric(row.weight),
    })).filter((row) => row.to_code.length > 0),
    chains_from: chainsFrom.map((row) => ({
      from_code: row.from_code ?? '',
      from_name: row.from_name ?? '',
      weight: numeric(row.weight),
    })).filter((row) => row.from_code.length > 0),
  };
}

export async function getSponsorContext(engagementId: string): Promise<PersonContext | null> {
  const row = await azureRead.maybeSingle<SponsorRow>({
    table: 'engagements',
    columns: ['sponsor_id', 'sponsor_name', 'sponsor_role', 'client_name', 'updated_at'],
    where: { id: engagementId },
    missingTable: 'empty',
  }).catch(() => null);

  if (!row?.id && !row?.name) return null;
  return {
    id: row.id ?? engagementId,
    name: row.name ?? 'Sponsor',
    role: row.role ?? 'Sponsor',
    organization: row.organization ?? 'Client organization',
    familiarity: narrowFamiliarity(row.familiarity),
    past_engagement_count: numeric(row.past_engagement_count),
    last_seen_at: row.last_seen_at,
  };
}
