import type { AskSource, AskSurfaceContext } from '../types';

const QUERY_STAGE_HINTS: Record<string, readonly string[]> = {
  brief: ['brief', 'bet', 'above', 'below', 'line', 'priority', 'quarter', 'decision'],
  map: ['map', 'landscape', 'kanban', 'heatmap', 'node', 'use case', 'portfolio'],
  'enterprise-context': ['enterprise', 'context', 'org', 'cmdb', 'incident', 'problem', 'contract', 'renewal', 'spend', 'policy', 'stewardship'],
  vendors: ['vendor', 'spend', 'renewal', 'risk', 'platform', 'data', 'analytics', 'stack', 'technology'],
  patterns: ['pattern', 'failure', 'genome', 'control', 'success'],
  today: ['today', 'urgent', 'current', 'priority', 'attention', 'risk'],
  'by-function': ['function', 'office', 'front', 'middle', 'back', 'capability'],
  'peer-activity': ['peer', 'cohort', 'market', 'adoption', 'benchmark'],
  'my-strategy': ['strategy', 'sequence', 'roadmap', 'next', 'decision'],
  sessions: ['session', 'conversation', 'thread', 'history'],
  'art-of-possible': ['possible', 'opportunity', 'value', 'portfolio', 'band'],
};

export function retrieveSurfaceContextSources(
  context: AskSurfaceContext | null | undefined,
  query: string,
): AskSource[] {
  if (!context || typeof context !== 'object') return [];

  const pageFacts = sanitizeFacts(context.pageFacts);
  const stageFacts = sanitizeFacts(context.stageFacts);
  const allFacts = sanitizeFacts(context.facts);
  const surfaceFacts = uniqueFacts([
    ...stageFacts,
    ...pageFacts,
    ...(stageFacts.length === 0 && pageFacts.length === 0 ? allFacts : []),
  ]);
  const tenantDomains = buildTenantDomains(context);
  const tenantFacts = tenantDomains.flatMap((domain) => domain.items);
  const graphFacts = uniqueFacts(sanitizeFacts(context.graphFacts));
  if (surfaceFacts.length === 0 && tenantFacts.length === 0 && graphFacts.length === 0) return [];

  const activeTab = cleanString(context.activeTab) ?? 'current page';
  const activeClient = cleanString(context.activeClient) ?? 'active client';
  const activeModule = cleanString(context.module) ?? 'Intelligence';
  const sources: AskSource[] = [];

  if (surfaceFacts.length > 0) {
    const detail = [
      `Active ${activeModule} surface: ${activeTab}.`,
      `Active client: ${activeClient}.`,
      ...surfaceFacts.slice(0, 28),
    ].join('\n- ');

    sources.push({
      type: 'SURFACE',
      name: `${activeClient} live ${activeModule} surface`,
      id: activeTab,
      detail,
      confidence: stageMatchesQuery(activeTab, query) ? 0.99 : 0.92,
    });
  }

  if (tenantFacts.length > 0) {
    const detail = [
      `Tenant 360: ${activeClient}.`,
      `Current ${activeModule} surface: ${activeTab}.`,
      ...tenantDomains.flatMap((domain) =>
        domain.items.length > 0 ? [`${domain.label}:`, ...domain.items] : [],
      ),
    ].join('\n- ');

    sources.push({
      type: 'TENANT',
      name: `${activeClient} 360 ${activeModule} substrate`,
      id: cleanString(context.clientKey) ?? activeClient,
      detail,
      confidence: tenantMatchesQuery(query) ? 0.96 : 0.91,
    });
  }

  if (graphFacts.length > 0) {
    const detail = [
      `Graph view: ${activeClient}.`,
      `Current ${activeModule} surface: ${activeTab}.`,
      ...graphFacts.slice(0, 34),
    ].join('\n- ');

    sources.push({
      type: 'GRAPH',
      name: `${activeClient} ${activeModule} graph`,
      id: cleanString(context.clientKey) ?? activeClient,
      detail,
      confidence: graphMatchesQuery(query) ? 0.95 : 0.89,
    });
  }

  return sources;
}

/**
 * The tenant substrate is assembled from several typed buckets. It used to be
 * flattened into one list and cut at 34 items, so whichever bucket came last
 * in the merge order was silently starved -- a richer page payload could not
 * reach the model at all. Each domain now carries its own budget and its own
 * label, so every domain is represented and the model can tell an AI-footprint
 * fact from a vendor fact.
 */
const TENANT_DOMAINS: ReadonlyArray<{
  key: keyof AskSurfaceContext;
  label: string;
  cap: number;
}> = [
  { key: 'tenantFacts', label: 'Enterprise and operating context', cap: 14 },
  { key: 'strategyFacts', label: 'Strategy and priorities', cap: 8 },
  { key: 'vendorFacts', label: 'Vendors, contracts and spend', cap: 8 },
  { key: 'useCaseFacts', label: 'AI and automation footprint', cap: 8 },
  { key: 'riskFacts', label: 'Risk, controls and reliability', cap: 8 },
  { key: 'qualityFacts', label: 'Evidence quality and maturity', cap: 6 },
  { key: 'sourceFacts', label: 'Evidence sources', cap: 6 },
];

function buildTenantDomains(
  context: AskSurfaceContext,
): Array<{ label: string; items: string[] }> {
  // Dedupe across domains, not only within one, so a fact carried in two
  // buckets appears once, under the domain that claims it first.
  const seen = new Set<string>();
  return TENANT_DOMAINS.map((domain) => {
    const items: string[] = [];
    for (const fact of sanitizeFacts(context[domain.key])) {
      if (items.length >= domain.cap) break;
      const key = fact.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      items.push(fact);
    }
    return { label: domain.label, items };
  });
}

function tenantMatchesQuery(query: string): boolean {
  return /\b(current|state|tenant|apex|meridian|retail|priority|risk|strategy|vendor|use case|source|evidence|today|data|analytics|landscape|org|decision|cmdb|incident|problem|change|policy|contract|renewal|spend|stewardship)\b/i.test(query);
}

function graphMatchesQuery(query: string): boolean {
  return /\b(graph|edge|relationship|depend|block|support|contradict|contradiction|ownership|integration|hub|sequence|ready|readiness)\b/i.test(query);
}

function stageMatchesQuery(activeTab: string, query: string): boolean {
  const terms = QUERY_STAGE_HINTS[activeTab] ?? [];
  const normalized = query.toLowerCase();
  return terms.length === 0 || terms.some((term) => normalized.includes(term));
}

function sanitizeFacts(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.replace(/\s+/g, ' ').trim())
    .filter((item) => item.length > 0)
    .slice(0, 60);
}

function uniqueFacts(facts: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const fact of facts) {
    const key = fact.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(fact);
  }
  return out;
}

function cleanString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}
