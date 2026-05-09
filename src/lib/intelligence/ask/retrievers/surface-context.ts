import type { AskSource, AskSurfaceContext } from '../types';

const QUERY_STAGE_HINTS: Record<string, readonly string[]> = {
  brief: ['brief', 'bet', 'above', 'below', 'line', 'priority', 'quarter', 'decision'],
  map: ['map', 'landscape', 'kanban', 'heatmap', 'node', 'use case', 'portfolio'],
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
  const tenantFacts = uniqueFacts([
    ...sanitizeFacts(context.tenantFacts),
    ...sanitizeFacts(context.riskFacts),
    ...sanitizeFacts(context.strategyFacts),
    ...sanitizeFacts(context.vendorFacts),
    ...sanitizeFacts(context.useCaseFacts),
    ...sanitizeFacts(context.sourceFacts),
    ...sanitizeFacts(context.qualityFacts),
  ]);
  const graphFacts = uniqueFacts(sanitizeFacts(context.graphFacts));
  if (surfaceFacts.length === 0 && tenantFacts.length === 0 && graphFacts.length === 0) return [];

  const activeTab = cleanString(context.activeTab) ?? 'current page';
  const activeClient = cleanString(context.activeClient) ?? 'active client';
  const sources: AskSource[] = [];

  if (surfaceFacts.length > 0) {
    const detail = [
      `Active Intelligence surface: ${activeTab}.`,
      `Active client: ${activeClient}.`,
      ...surfaceFacts.slice(0, 28),
    ].join('\n- ');

    sources.push({
      type: 'SURFACE',
      name: `${activeClient} live Intelligence surface`,
      id: activeTab,
      detail,
      confidence: stageMatchesQuery(activeTab, query) ? 0.99 : 0.92,
    });
  }

  if (tenantFacts.length > 0) {
    const detail = [
      `Tenant 360: ${activeClient}.`,
      `Current Intelligence surface: ${activeTab}.`,
      ...tenantFacts.slice(0, 34),
    ].join('\n- ');

    sources.push({
      type: 'TENANT',
      name: `${activeClient} 360 Intelligence substrate`,
      id: cleanString(context.clientKey) ?? activeClient,
      detail,
      confidence: tenantMatchesQuery(query) ? 0.96 : 0.91,
    });
  }

  if (graphFacts.length > 0) {
    const detail = [
      `Graph view: ${activeClient}.`,
      `Current Intelligence surface: ${activeTab}.`,
      ...graphFacts.slice(0, 34),
    ].join('\n- ');

    sources.push({
      type: 'GRAPH',
      name: `${activeClient} Intelligence graph`,
      id: cleanString(context.clientKey) ?? activeClient,
      detail,
      confidence: graphMatchesQuery(query) ? 0.95 : 0.89,
    });
  }

  return sources;
}

function tenantMatchesQuery(query: string): boolean {
  return /\b(current|state|tenant|apex|retail|priority|risk|strategy|vendor|use case|source|evidence|today|data|analytics|landscape)\b/i.test(query);
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
