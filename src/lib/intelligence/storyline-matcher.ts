import { loadCorpus } from '@/lib/intelligence/loader';
import type { PatternSeed } from '@/lib/intelligence/seed-types';

export type StorylineSurface = 'programs' | 'source' | 'tower';

export interface StorylineContext {
  surface: StorylineSurface;
  id: string;
  title: string;
  phase?: string;
  domainTags: string[];
  workflowTags?: string[];
  instanceTags?: string[];
}

export interface StorylinePatternMatch {
  id: string;
  slug: string;
  title: string;
  domain: PatternSeed['domain'];
  tier: PatternSeed['tier'];
  confidence: number;
  href: string;
  matchReason: string;
  score: number;
}

const corpus = loadCorpus({ loadedAt: '2026-04-28T00:00:00.000Z' });

const DOMAIN_ALIASES: Record<PatternSeed['domain'], string[]> = {
  ai_programs: ['ai', 'agent', 'portfolio', 'copilot', 'roi', 'adoption'],
  architecture: ['architecture', 'design', 'ui', 'surface', 'provenance', 'iceberg'],
  cdp: ['cdp', 'customer data', 'activation', 'data platform', 'p3 design'],
  compliance: ['compliance', 'regulatory', 'policy'],
  future_of_work: ['talent', 'future of work', 'workforce'],
  industry_specific: ['retail', 'healthcare', 'financial services', 'energy', 'owned brand'],
  meta: ['outcome', 'reconciliation', 'pattern', 'knowledge'],
  sourcing: ['sourcing', 'vendor', 'bafo', 'rfp', 'procurement', 'commercial'],
};

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function contextTokens(context: StorylineContext): string[] {
  return [
    context.surface,
    context.id,
    context.title,
    context.phase ?? '',
    ...context.domainTags,
    ...(context.workflowTags ?? []),
    ...(context.instanceTags ?? []),
  ]
    .map(normalize)
    .filter(Boolean);
}

function patternText(pattern: PatternSeed): string {
  return normalize([
    pattern.id,
    pattern.title,
    pattern.domain,
    pattern.vertical,
    pattern.thesis,
    pattern.applicability,
  ].join(' '));
}

function tokenMatchesAlias(token: string, alias: string): boolean {
  const normalizedAlias = normalize(alias);
  const words = token.split(' ');

  if (normalizedAlias.includes(' ')) {
    return token.includes(normalizedAlias);
  }

  return words.includes(normalizedAlias);
}

function tokenMatchesText(token: string, searchable: string): boolean {
  if (token.length < 3) {
    return searchable.split(' ').includes(token);
  }

  return searchable.includes(token);
}

function scorePattern(pattern: PatternSeed, tokens: string[]): number {
  const searchable = patternText(pattern);
  const aliases = DOMAIN_ALIASES[pattern.domain];
  const domainScore = tokens.some((token) => aliases.some((alias) => tokenMatchesAlias(token, alias)))
    ? 3
    : 0;
  const tokenScore = tokens.reduce((score, token) => (tokenMatchesText(token, searchable) ? score + 1 : score), 0);
  const confidenceScore = pattern.confidence >= 0.85 ? 1 : 0;

  return domainScore + tokenScore + confidenceScore;
}

function reasonFor(pattern: PatternSeed, context: StorylineContext): string {
  if (context.phase && normalize(patternText(pattern)).includes(normalize(context.phase))) {
    return `Matched ${context.phase} context`;
  }

  if (DOMAIN_ALIASES[pattern.domain].some((alias) => contextTokens(context).some((token) => tokenMatchesAlias(token, alias)))) {
    return `Matched ${pattern.domain.replace('_', ' ')} domain`;
  }

  return 'Matched storyline tags';
}

export function matchStorylinePatterns(
  context: StorylineContext,
  options: { limit?: number; minScore?: number } = {},
): StorylinePatternMatch[] {
  const limit = options.limit ?? 3;
  const minScore = options.minScore ?? 3;
  const tokens = contextTokens(context);

  return corpus.patterns
    .map((pattern) => ({
      pattern,
      score: scorePattern(pattern, tokens),
    }))
    .filter(({ score }) => score >= minScore)
    .sort((a, b) => b.score - a.score || b.pattern.confidence - a.pattern.confidence || a.pattern.id.localeCompare(b.pattern.id))
    .slice(0, limit)
    .map(({ pattern, score }) => ({
      id: pattern.id,
      slug: pattern.slug,
      title: pattern.title,
      domain: pattern.domain,
      tier: pattern.tier,
      confidence: pattern.confidence,
      href: `/patterns/${pattern.slug}`,
      matchReason: reasonFor(pattern, context),
      score,
    }));
}

export function buildProgramStorylineContext(input: {
  programId: string;
  displayId: string;
  name: string;
  phaseLabel: string;
}): StorylineContext {
  return {
    surface: 'programs',
    id: input.displayId,
    title: input.name,
    phase: input.phaseLabel,
    domainTags: ['cdp', 'customer data activation', 'retail'],
    workflowTags: ['program gate', 'p3 design', 'architecture sprint'],
    instanceTags: [input.programId, input.displayId],
  };
}

export function buildSourceStorylineContext(): StorylineContext {
  return {
    surface: 'source',
    id: 'SRC-AMS-2026',
    title: 'AMS Vendor Consolidation 2026',
    phase: 'BAFO',
    domainTags: ['sourcing', 'vendor', 'commercial', 'cdp'],
    workflowTags: ['bafo', 'vendor selection', 'pricing normalization', 'claim verification'],
    instanceTags: ['APX-CDP-2026', 'managed cdp layer'],
  };
}

export function buildTowerStorylineContext(): StorylineContext {
  return {
    surface: 'tower',
    id: 'APX-CDP-2026',
    title: 'Apex Retail CDP Activation',
    phase: 'P3 Design',
    domainTags: ['cdp', 'architecture', 'retail', 'program portfolio'],
    workflowTags: ['gate pending', 'evidence coverage', 'build gate'],
    instanceTags: ['customer data platform', 'activation'],
  };
}
