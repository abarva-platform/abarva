import type { AskSource, AskSurfaceContext } from '../types';

const QUERY_STAGE_HINTS: Record<string, readonly string[]> = {
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
  const facts = uniqueFacts([...stageFacts, ...pageFacts, ...allFacts]);
  if (facts.length === 0) return [];

  const activeTab = cleanString(context.activeTab) ?? 'current page';
  const activeClient = cleanString(context.activeClient) ?? 'active client';
  const detail = [
    `Active Intelligence surface: ${activeTab}.`,
    `Active client: ${activeClient}.`,
    ...facts.slice(0, 22),
  ].join('\n- ');

  const confidence = stageMatchesQuery(activeTab, query) ? 0.98 : 0.9;
  return [
    {
      type: 'SURFACE',
      name: `${activeClient} Intelligence surface`,
      id: activeTab,
      detail,
      confidence,
    },
  ];
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
    .slice(0, 30);
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
