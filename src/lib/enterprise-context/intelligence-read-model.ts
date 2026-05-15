import { getServerSupabase } from '@/lib/supabase-server';

export interface EnterpriseContextRecordRow {
  record_type: string;
  title: string;
  source_system: string;
  owner: string | null;
  freshness_status: 'fresh' | 'attention' | 'stale' | 'unknown';
  confidence: number | null;
  payload: Record<string, unknown>;
}

export interface EnterpriseContextQualityRow {
  issue_type: string;
  severity: string;
  status: string;
  source_file: string | null;
  owner: string | null;
}

export interface EnterpriseContextSourceRow {
  source_system: string;
  display_name: string;
  system_of_record: boolean;
  source_owner: string | null;
  last_synced_at: string | null;
}

export interface EnterpriseContextOverviewCard {
  key: string;
  title: string;
  whatWeKnow: string;
  whyItMatters: string;
  owner: string;
  freshness: string;
  confidence: string;
  evidenceCount: number;
  sourceSystems: string[];
  actions: string[];
}

export interface EnterpriseContextOverview {
  tenantKey: string;
  tenantName: string;
  counts: {
    sources: number;
    records: number;
    facts: number;
    relationships: number;
    evidence: number;
    qualityIssues: number;
    stewardshipTasks: number;
    chunkQueue: number;
  };
  recordTypeCounts: Record<string, number>;
  freshnessCounts: Record<string, number>;
  sourceSystems: string[];
  evidenceUsableCount: number;
  confidenceAverage: number;
  qualitySummary: Record<string, number>;
  cards: EnterpriseContextOverviewCard[];
  sentinelFacts: string[];
}

const TABLES = {
  sources: 'enterprise_context_sources',
  records: 'enterprise_context_records',
  facts: 'enterprise_context_facts',
  relationships: 'enterprise_context_relationships',
  evidence: 'enterprise_context_evidence',
  qualityIssues: 'enterprise_context_quality_issues',
  stewardshipTasks: 'enterprise_context_stewardship_tasks',
  chunkQueue: 'enterprise_context_chunk_queue',
} as const;

export async function getEnterpriseContextOverviewForTenant(
  tenantKey: string | null | undefined,
  tenantName: string | null | undefined,
): Promise<EnterpriseContextOverview | null> {
  const normalizedTenantKey = tenantKey?.trim();
  if (!normalizedTenantKey) return null;

  try {
    const [
      counts,
      records,
      sources,
      qualityRows,
      evidenceRows,
    ] = await Promise.all([
      countEnterpriseContextRows(normalizedTenantKey),
      fetchTenantRows<EnterpriseContextRecordRow>(
        TABLES.records,
        normalizedTenantKey,
        'record_type,title,source_system,owner,freshness_status,confidence,payload',
      ),
      fetchTenantRows<EnterpriseContextSourceRow>(
        TABLES.sources,
        normalizedTenantKey,
        'source_system,display_name,system_of_record,source_owner,last_synced_at',
      ),
      fetchTenantRows<EnterpriseContextQualityRow>(
        TABLES.qualityIssues,
        normalizedTenantKey,
        'issue_type,severity,status,source_file,owner',
      ),
      fetchTenantRows<{ evidence_usable: boolean }>(
        TABLES.evidence,
        normalizedTenantKey,
        'evidence_usable',
      ),
    ]);

    if (counts.records === 0) return null;

    return summarizeEnterpriseContextRows({
      tenantKey: normalizedTenantKey,
      tenantName: tenantName ?? normalizedTenantKey,
      counts,
      records,
      sources,
      qualityRows,
      evidenceRows,
    });
  } catch (error) {
    console.warn('[enterprise-context.overview]', error);
    return null;
  }
}

export function summarizeEnterpriseContextRows(input: {
  tenantKey: string;
  tenantName: string;
  counts: EnterpriseContextOverview['counts'];
  records: EnterpriseContextRecordRow[];
  sources: EnterpriseContextSourceRow[];
  qualityRows: EnterpriseContextQualityRow[];
  evidenceRows: Array<{ evidence_usable: boolean }>;
}): EnterpriseContextOverview {
  const recordTypeCounts = countBy(input.records, (row) => row.record_type);
  const freshnessCounts = countBy(input.records, (row) => row.freshness_status);
  const qualitySummary = countBy(input.qualityRows, (row) => `${row.severity}:${row.status}:${row.issue_type}`);
  const sourceSystems = [...new Set(input.sources.map((row) => row.source_system))].sort();
  const evidenceUsableCount = input.evidenceRows.filter((row) => row.evidence_usable).length;
  const confidenceAverage = average(input.records.map((row) => row.confidence ?? 0).filter((value) => value > 0));

  const recordsByType = new Map<string, EnterpriseContextRecordRow[]>();
  for (const row of input.records) {
    const bucket = recordsByType.get(row.record_type) ?? [];
    bucket.push(row);
    recordsByType.set(row.record_type, bucket);
  }

  const applications = recordsByType.get('cmdb_applications_services') ?? [];
  const incidents = recordsByType.get('incidents') ?? [];
  const problems = recordsByType.get('problems') ?? [];
  const changes = recordsByType.get('changes') ?? [];
  const renewals = recordsByType.get('renewal_calendar') ?? [];
  const contracts = recordsByType.get('vendors_contract_inventory') ?? [];
  const spendRows = recordsByType.get('spend_baseline') ?? [];
  const policies = recordsByType.get('policies_procedures') ?? [];
  const initiatives = recordsByType.get('initiative_portfolio') ?? [];
  const dataDomains = recordsByType.get('data_domains_stewardship') ?? [];
  const risks = recordsByType.get('risk_compliance_register') ?? [];
  const slaBreaches = incidents.filter((row) => row.payload.breach_sla === 'true' || row.payload.breach_sla === true).length;
  const tierOneApps = applications.filter((row) => String(row.payload.criticality ?? '').toLowerCase().includes('tier 1')).length;
  const highRenewals = renewals.filter((row) => String(row.payload.renewal_risk ?? '').toLowerCase() === 'high').length;
  const annualSpend = spendRows.reduce((sum, row) => sum + numeric(row.payload.run_rate_usd), 0);
  const renewalExposure = renewals.reduce((sum, row) => sum + numeric(row.payload.estimated_value_usd), 0);

  const cards: EnterpriseContextOverviewCard[] = [
    {
      // L1 fix (2026-05-13): the previous key/title used "clinical" — a
      // healthcare-specific term that surfaced on Apex Retail and First
      // Capital Enterprise Context cards. The body is industry-neutral
      // CMDB/ITSM narrative; rename the card itself to match.
      key: 'platform-and-service-reliability',
      title: 'Platform and service reliability',
      whatWeKnow: `${applications.length} systems/services loaded; ${tierOneApps} are Tier 1. ServiceNow contributes ${incidents.length} incidents, ${problems.length} problems, and ${changes.length} changes.`,
      whyItMatters: 'This turns CMDB and ITSM data into a practical dependency map before approving AI, sourcing, or platform work.',
      owner: topOwner([...applications, ...incidents, ...problems]) ?? 'CMDB Stewardship',
      freshness: freshnessLabel(freshnessCounts),
      confidence: confidenceLabel(confidenceAverage),
      evidenceCount: input.counts.evidence,
      sourceSystems: systemsFor([...applications, ...incidents, ...problems]),
      actions: ['Ask Sentinel', 'Create Source event', 'Link to Move', 'Add to Tower watchlist'],
    },
    {
      key: 'incident-problem-pressure',
      title: 'Incident and problem pressure',
      whatWeKnow: `${slaBreaches} incidents breached SLA. ${problems.length} problem records are available to separate noisy symptoms from durable blockers.`,
      whyItMatters: 'Operational pain can now shape sourcing scope and phase-gate evidence instead of arriving as anecdote.',
      owner: topOwner([...incidents, ...problems]) ?? 'IT Service Management',
      freshness: freshnessLabel(freshnessCounts),
      confidence: confidenceLabel(average([...incidents, ...problems].map((row) => row.confidence ?? 0))),
      evidenceCount: incidents.length + problems.length,
      sourceSystems: systemsFor([...incidents, ...problems]),
      actions: ['Ask Sentinel', 'Open blocker brief', 'Link to Move', 'Add to Tower watchlist'],
    },
    {
      key: 'contract-renewal-exposure',
      title: 'Contract renewal exposure',
      whatWeKnow: `${contracts.length} vendor/contracts and ${renewals.length} renewals are loaded; ${highRenewals} renewals are high risk. Estimated renewal exposure is ${formatUsd(renewalExposure)}.`,
      whyItMatters: 'Source can prioritize events from renewal exposure instead of waiting for a procurement escalation.',
      owner: topOwner([...contracts, ...renewals]) ?? 'IT Sourcing',
      freshness: freshnessLabel(freshnessCounts),
      confidence: confidenceLabel(average([...contracts, ...renewals].map((row) => row.confidence ?? 0))),
      evidenceCount: contracts.length + renewals.length,
      sourceSystems: systemsFor([...contracts, ...renewals]),
      actions: ['Ask Sentinel', 'Create Source event', 'Generate brief', 'Add to Tower watchlist'],
    },
    {
      key: 'spend-baseline-confidence',
      title: 'Spend baseline confidence',
      whatWeKnow: `${spendRows.length} spend-baseline rows are loaded across ${new Set(spendRows.map((row) => row.payload.category)).size} categories. Annual run-rate represented is ${formatUsd(annualSpend)}.`,
      whyItMatters: 'Financial context gives CXOs a credible starting point for value capture, vendor leverage, and sourcing thresholds.',
      owner: topOwner(spendRows) ?? 'Finance Operations',
      freshness: freshnessLabel(freshnessCounts),
      confidence: confidenceLabel(average(spendRows.map((row) => row.confidence ?? 0))),
      evidenceCount: spendRows.length,
      sourceSystems: systemsFor(spendRows),
      actions: ['Ask Sentinel', 'Generate brief', 'Create Source event'],
    },
    {
      key: 'policy-ai-guardrails',
      title: 'Policy constraints for AI use',
      whatWeKnow: `${policies.length} policies/procedures and ${risks.length} risk/compliance findings are loaded. ${input.counts.qualityIssues} quality issues remain open.`,
      whyItMatters: 'AI initiatives can be shaped around real governance constraints instead of generic policy warnings.',
      owner: topOwner([...policies, ...risks]) ?? 'GRC',
      freshness: freshnessLabel(freshnessCounts),
      confidence: confidenceLabel(average([...policies, ...risks].map((row) => row.confidence ?? 0))),
      evidenceCount: policies.length + risks.length,
      sourceSystems: systemsFor([...policies, ...risks]),
      actions: ['Ask Sentinel', 'Generate brief', 'Link to Move'],
    },
    {
      key: 'initiative-dependency-map',
      title: 'Initiative dependency map',
      whatWeKnow: `${initiatives.length} initiatives and ${dataDomains.length} data-domain stewardship records are loaded against ${input.counts.relationships} CI relationships.`,
      whyItMatters: 'Moves and Tower can see collisions across systems, contracts, data domains, and owners before approvals proceed.',
      owner: topOwner([...initiatives, ...dataDomains]) ?? 'Enterprise PMO',
      freshness: freshnessLabel(freshnessCounts),
      confidence: confidenceLabel(average([...initiatives, ...dataDomains].map((row) => row.confidence ?? 0))),
      evidenceCount: initiatives.length + dataDomains.length,
      sourceSystems: systemsFor([...initiatives, ...dataDomains]),
      actions: ['Ask Sentinel', 'Link to Move', 'Add to Tower watchlist'],
    },
  ];

  const sentinelFacts = [
    `${input.tenantName} Enterprise Context: ${input.counts.records} records, ${input.counts.facts} facts, ${input.counts.relationships} CI relationships, and ${input.counts.evidence} evidence rows are loaded from internal context sources.`,
    `Enterprise Context domains include org and decision rights (${recordTypeCounts.org_decision_rights ?? 0}), facilities/business units (${recordTypeCounts.facilities_business_units ?? 0}), systems/services (${recordTypeCounts.cmdb_applications_services ?? 0}), vendors/contracts (${recordTypeCounts.vendors_contract_inventory ?? 0}), renewals (${recordTypeCounts.renewal_calendar ?? 0}), spend baseline (${recordTypeCounts.spend_baseline ?? 0}), incidents (${recordTypeCounts.incidents ?? 0}), problems (${recordTypeCounts.problems ?? 0}), changes (${recordTypeCounts.changes ?? 0}), policies/procedures (${recordTypeCounts.policies_procedures ?? 0}), initiatives (${recordTypeCounts.initiative_portfolio ?? 0}), data domains (${recordTypeCounts.data_domains_stewardship ?? 0}), and risks/compliance (${recordTypeCounts.risk_compliance_register ?? 0}).`,
    `Evidence posture: ${evidenceUsableCount}/${input.counts.evidence} evidence rows are currently usable; ${input.counts.qualityIssues} quality issues and ${input.counts.stewardshipTasks} stewardship tasks remain open.`,
    `Operational posture: ${incidents.length} incidents, ${problems.length} problems, ${changes.length} changes, and ${slaBreaches} SLA-breaching incidents are available for current-state guidance.`,
    `Commercial posture: ${contracts.length} contracts, ${renewals.length} renewal rows, ${highRenewals} high-risk renewals, ${formatUsd(renewalExposure)} estimated renewal exposure, and ${formatUsd(annualSpend)} annualized spend baseline are available.`,
    `Sentinel rule: answer Meridian current-state questions from Enterprise Context first, cite internal source systems and freshness/confidence, and mark external or industry guidance as outside this internal-context layer.`,
  ];

  return {
    tenantKey: input.tenantKey,
    tenantName: input.tenantName,
    counts: input.counts,
    recordTypeCounts,
    freshnessCounts,
    sourceSystems,
    evidenceUsableCount,
    confidenceAverage,
    qualitySummary,
    cards,
    sentinelFacts,
  };
}

async function countEnterpriseContextRows(tenantKey: string): Promise<EnterpriseContextOverview['counts']> {
  const entries = await Promise.all(
    Object.entries(TABLES).map(async ([key, table]) => [key, await countRows(table, tenantKey)] as const),
  );
  return Object.fromEntries(entries) as EnterpriseContextOverview['counts'];
}

async function countRows(table: string, tenantKey: string): Promise<number> {
  const sb = getServerSupabase();
  const { count, error } = await sb
    .from(table)
    .select('id', { count: 'exact', head: true })
    .eq('tenant_key', tenantKey);
  if (error) throw new Error(`${table} count failed: ${error.message}`);
  return count ?? 0;
}

async function fetchTenantRows<T extends object>(
  table: string,
  tenantKey: string,
  columns: string,
): Promise<T[]> {
  const sb = getServerSupabase();
  const rows: T[] = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await sb
      .from(table)
      .select(columns)
      .eq('tenant_key', tenantKey)
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`${table} page fetch failed: ${error.message}`);
    const page = (data ?? []) as unknown as T[];
    rows.push(...page);
    if (page.length < pageSize) break;
  }
  return rows;
}

function countBy<T>(rows: T[], keyFn: (row: T) => string | null | undefined): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    const key = keyFn(row) || 'unknown';
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function average(values: number[]): number {
  const filtered = values.filter((value) => Number.isFinite(value) && value > 0);
  if (filtered.length === 0) return 0;
  return filtered.reduce((sum, value) => sum + value, 0) / filtered.length;
}

function numeric(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value !== 'string') return 0;
  const parsed = Number(value.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function topOwner(rows: EnterpriseContextRecordRow[]): string | null {
  const counts = countBy(rows, (row) => row.owner);
  const [owner] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] ?? [];
  return owner && owner !== 'unknown' ? owner : null;
}

function systemsFor(rows: EnterpriseContextRecordRow[]): string[] {
  return [...new Set(rows.map((row) => row.source_system).filter(Boolean))].sort().slice(0, 4);
}

function freshnessLabel(counts: Record<string, number>): string {
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  if (total === 0) return 'unknown';
  const fresh = counts.fresh ?? 0;
  return `${fresh}/${total} fresh`;
}

function confidenceLabel(value: number): string {
  if (!value) return 'unknown';
  return `${Math.round(value * 100)}%`;
}

function formatUsd(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${Math.round(value)}`;
}
