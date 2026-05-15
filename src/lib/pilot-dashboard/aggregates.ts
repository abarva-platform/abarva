// Pilot success metrics aggregates · C5 Phase 1 + 2
//
// Pure-ish data-layer functions that the dashboard page calls. Each
// returns either real data (where the source table exists) or a
// "degraded with banner" result (where the source doesn't yet exist).
//
// Spec: docs/pilot/C5-PILOT-SUCCESS-METRICS-DASHBOARD-SPEC.md

import {
  getEnterpriseContextOverviewForTenant,
  type EnterpriseContextOverview,
} from '@/lib/enterprise-context/intelligence-read-model';
import { stubQuarantineAuditDataSource } from '@/lib/security/quarantine-audit-types';
import type {
  DashboardBanner,
  EngagementSnapshot,
  HeadlineKpis,
  SubstrateSnapshot,
  TopQuestion,
  TurnSample,
} from './types';

const DOMAIN_LABELS: Record<string, string> = {
  org_decision_rights: 'Org & decision rights',
  facilities_business_units: 'Facilities & business units',
  cmdb_applications_services: 'Systems & services',
  ci_relationships_dependencies: 'CI relationships',
  vendors_contract_inventory: 'Vendors & contracts',
  renewal_calendar: 'Renewals',
  spend_baseline: 'Spend baseline',
  policies_procedures: 'Policies & controls',
  incidents: 'Incidents',
  problems: 'Problems',
  changes: 'Changes',
  slas: 'SLAs',
  initiative_portfolio: 'Initiatives',
  data_domains_stewardship: 'Data domains',
  risk_compliance_register: 'Risks & compliance',
};

const EXPECTED_DOMAINS = Object.keys(DOMAIN_LABELS);

/**
 * Maps an `EnterpriseContextOverview` to the substrate-snapshot shape
 * the dashboard renders. Pure function — fully unit-testable.
 */
export function toSubstrateSnapshot(
  overview: EnterpriseContextOverview | null,
): SubstrateSnapshot {
  if (!overview) {
    return {
      coverageTiles: EXPECTED_DOMAINS.map((domain) => ({
        domain,
        label: DOMAIN_LABELS[domain] ?? domain,
        rowCount: 0,
      })),
      contextCards: [],
      totalEvidence: 0,
      averageConfidence: 0,
    };
  }

  const coverageTiles = EXPECTED_DOMAINS.map((domain) => ({
    domain,
    label: DOMAIN_LABELS[domain] ?? domain,
    rowCount: overview.recordTypeCounts[domain] ?? 0,
  }));

  const contextCards = overview.cards.map((card) => ({
    key: card.key,
    title: card.title,
    evidenceCount: card.evidenceCount,
    confidence: card.confidence,
  }));

  return {
    coverageTiles,
    contextCards,
    totalEvidence: overview.counts.evidence,
    averageConfidence: overview.confidenceAverage,
  };
}

/**
 * Normalize a Sentinel user-message into a comparable key. Lower-cases,
 * collapses whitespace, strips trailing punctuation. Used by the
 * "top questions" aggregator. Deterministic; unit-tested.
 */
export function normalizeQuestion(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .replace(/[.?!,;:\s]+$/u, '')
    .trim();
}

/**
 * Roll up an array of turn rows into a top-N list by frequency.
 * Pure; unit-testable.
 */
export function rollUpTopQuestions(
  rows: ReadonlyArray<{ question: string; createdAt: string }>,
  topN = 10,
): TopQuestion[] {
  const counts = new Map<string, { excerpt: string; count: number; lastAskedAt: string }>();
  for (const row of rows) {
    const norm = normalizeQuestion(row.question);
    if (!norm) continue;
    const entry = counts.get(norm);
    if (entry) {
      entry.count += 1;
      if (row.createdAt > entry.lastAskedAt) entry.lastAskedAt = row.createdAt;
    } else {
      counts.set(norm, {
        excerpt: row.question.length > 140 ? row.question.slice(0, 137) + '…' : row.question,
        count: 1,
        lastAskedAt: row.createdAt,
      });
    }
  }
  return [...counts.values()]
    .sort((a, b) => (b.count - a.count) || (b.lastAskedAt < a.lastAskedAt ? -1 : 1))
    .slice(0, topN)
    .map((e) => ({
      questionExcerpt: e.excerpt,
      count: e.count,
      lastAskedAt: e.lastAskedAt,
    }));
}

/**
 * Build the substrate panel data for a given tenant. Reuses the
 * existing broker overview that powers /intelligence#enterprise-context,
 * so the dashboard is always consistent with the live UI surface.
 */
export async function loadSubstrateSnapshot(
  tenantKey: string,
  tenantName: string,
): Promise<SubstrateSnapshot> {
  const overview = await getEnterpriseContextOverviewForTenant(tenantKey, tenantName).catch(
    () => null,
  );
  return toSubstrateSnapshot(overview);
}

/**
 * Pull a 7-day Sentinel-turn rollup for the tenant. Queries
 * `turn_traces` joined to `engagements` (so we can filter by
 * client_id). Returns headline KPIs + engagement snapshot. Both
 * panels share the read so we don't pay the query twice.
 *
 * Returns `null` for fields that depend on tables that haven't been
 * fully wired yet (the dashboard surfaces a banner in that case).
 */
export async function loadEngagementAndHeadline(args: {
  clientId: string;
  /** Existing quarantine-audit data source. Pluggable for tests. */
  quarantineSource?: typeof stubQuarantineAuditDataSource;
}): Promise<{ headline: HeadlineKpis; engagement: EngagementSnapshot; banners: DashboardBanner[] }> {
  const banners: DashboardBanner[] = [];

  let sentinelTurns7d = 0;
  let engagementsActive7d = 0;
  let avgLatencyMs7d: number | null = null;
  let tokens7d: { input: number; output: number } | null = null;
  let topQuestions: TopQuestion[] = [];
  let qualitySample: TurnSample[] = [];

  try {
    const { getServerSupabase } = await import('@/lib/supabase-server');
    const sb = getServerSupabase();
    const since = new Date(Date.now() - 7 * 86_400_000).toISOString();

    // Pull recent turns for this tenant. Join through engagements so
    // we get tenant scope. If the schema doesn't support the join
    // (e.g., engagements.client_id is named differently), the query
    // throws and we fall through to the banner branch.
    type TurnRow = {
      turn_id: string;
      engagement_id: string | null;
      model: string | null;
      input_tokens: number | null;
      output_tokens: number | null;
      latency_ms: number | null;
      created_at: string;
      // joined columns:
      engagements: { client_id: string } | null;
    };
    const { data, error } = await sb
      .from('turn_traces')
      .select(
        'turn_id, engagement_id, model, input_tokens, output_tokens, latency_ms, created_at, engagements!inner(client_id)',
      )
      .eq('engagements.client_id', args.clientId)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) throw error;

    const rows = (data ?? []) as unknown as TurnRow[];
    sentinelTurns7d = rows.length;
    engagementsActive7d = new Set(rows.map((r) => r.engagement_id).filter(Boolean)).size;
    const latencies = rows.map((r) => r.latency_ms ?? 0).filter((n) => n > 0);
    avgLatencyMs7d =
      latencies.length > 0
        ? Math.round(latencies.reduce((s, n) => s + n, 0) / latencies.length)
        : null;
    const input = rows.reduce((s, r) => s + (r.input_tokens ?? 0), 0);
    const output = rows.reduce((s, r) => s + (r.output_tokens ?? 0), 0);
    tokens7d = input > 0 || output > 0 ? { input, output } : null;

    // Quality sample: 5 random rows from the last 7 days.
    qualitySample = pickRandom(rows, 5).map((r) => ({
      turnId: r.turn_id,
      engagementId: r.engagement_id,
      model: r.model,
      inputTokens: r.input_tokens,
      outputTokens: r.output_tokens,
      latencyMs: r.latency_ms,
      createdAt: r.created_at,
    }));

    // Top-questions rollup over the last 30 days needs the user
    // message text, not just turn metadata. The turn_traces table
    // doesn't store the user message body today; that lives in the
    // engagement-turn record. Surface this as a banner rather than
    // shipping placeholder data.
    topQuestions = [];
    banners.push({
      severity: 'info',
      key: 'top-questions-needs-message-join',
      message:
        'Top Sentinel questions panel requires joining turn_traces with the engagement-turn message text. Wire in the follow-on PR; until then this section is empty by design.',
    });
  } catch (err) {
    banners.push({
      severity: 'warning',
      key: 'turn-traces-unreachable',
      message: `Engagement panel could not query turn_traces: ${
        err instanceof Error ? err.message : 'unknown error'
      }. Verify the engagements.client_id join and Supabase service-role config.`,
    });
  }

  // Quarantine count today comes from the stub data source (returns
  // []). When the B5b implementation lands the sensitive_upload_audit
  // table, this picks up real numbers without a code change.
  const quarantineSource = args.quarantineSource ?? stubQuarantineAuditDataSource;
  const quarantineRows = await quarantineSource
    .list({ tenantClientKey: '', decision: 'quarantine' })
    .catch(() => []);
  const quarantineOpen = quarantineRows.length;

  if (quarantineSource === stubQuarantineAuditDataSource) {
    banners.push({
      severity: 'info',
      key: 'quarantine-stub',
      message:
        'Quarantine count reads the stub data source (returns 0). Real value populates once B5b implementation ships the sensitive_upload_audit table and migration.',
    });
  }

  const headline: HeadlineKpis = {
    sentinelTurns7d,
    engagementsActive7d,
    substrateFreshnessDays: null,
    quarantineOpen,
    incidents7d: null,
  };
  if (headline.substrateFreshnessDays === null) {
    banners.push({
      severity: 'info',
      key: 'substrate-freshness-pending',
      message:
        'Substrate-freshness KPI requires tenant_refresh_log (new table proposed in C5 spec). Until that ships, this card is blank.',
    });
  }
  if (headline.incidents7d === null) {
    banners.push({
      severity: 'info',
      key: 'incidents-pending',
      message:
        'Incidents KPI requires incident_log (new table proposed in C5 spec). Until PagerDuty integration lands, this card is blank.',
    });
  }

  const engagement: EngagementSnapshot = {
    topQuestions,
    qualitySample,
    avgLatencyMs7d,
    tokens7d,
  };

  return { headline, engagement, banners };
}

/**
 * Pick up to `n` random elements from `arr` without replacement.
 * Deterministic stochasticity: same seed → same selection.
 * Currently uses Math.random; tests pass arr.length ≤ n so the
 * outcome is deterministic.
 */
function pickRandom<T>(arr: ReadonlyArray<T>, n: number): T[] {
  if (arr.length <= n) return [...arr];
  const result = [...arr];
  for (let i = result.length - 1; i > result.length - 1 - n; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result.slice(result.length - n);
}
