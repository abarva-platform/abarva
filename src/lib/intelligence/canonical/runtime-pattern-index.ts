import 'server-only';

import { getServerSupabase } from '@/lib/supabase-server';

import type {
  CanonicalConfidenceLevel,
  CanonicalEnterpriseArea,
  CanonicalIndustry,
  CanonicalLifecycleStatus,
  CanonicalMaturityLevel,
  CanonicalPatternSourceSystem,
  CanonicalSourceBasis,
  CanonicalSourceReference,
  CanonicalStrategicMovePhase,
  CanonicalUnsupportedClaimFlag,
  CanonicalValueLever,
  CanonicalQuantitativeClaim,
  IndustryAIPattern,
} from './industry-ai-pattern';
import {
  CANONICAL_INDUSTRY_AI_PATTERNS_TABLE,
  type CanonicalPatternDuplicateRisk,
  type PersistedCanonicalIndustryAIPatternRow,
} from './persistence-contract';

export const CANONICAL_PATTERN_INDEX_SOURCE = 'persisted_canonical_corpus' as const;
export const WARNING_CANONICAL_CORPUS_EMPTY =
  'WARNING_CANONICAL_CORPUS_EMPTY: persisted canonical corpus returned zero active patterns.';
export const WARNING_CANONICAL_PATTERN_NO_MATCH =
  'WARNING_CANONICAL_PATTERN_NO_MATCH: no persisted canonical patterns matched the query.';
export const WARNING_CANONICAL_CORPUS_READ_FAILED =
  'WARNING_CANONICAL_CORPUS_READ_FAILED: persisted canonical corpus read failed.';

const DEFAULT_LIMIT = 8;
const MAX_LIMIT = 50;
const CACHE_TTL_MS = 60_000;

export interface CanonicalPatternIndexQuery {
  tenant_key?: string;
  client_id?: string;
  industry?: CanonicalIndustry;
  enterprise_area?: CanonicalEnterpriseArea;
  function?: string;
  process_area?: string;
  use_case_category?: string;
  strategic_move_phase?: CanonicalStrategicMovePhase;
  confidence_level?: CanonicalConfidenceLevel;
  maturity_level?: CanonicalMaturityLevel;
  lifecycle_status?: CanonicalLifecycleStatus;
  source_system?: CanonicalPatternSourceSystem;
  value_lever?: CanonicalValueLever;
  query?: string;
  limit?: number;
  include_private?: boolean;
}

export interface CanonicalPatternIndexHit {
  canonical_id: string;
  title: string;
  summary: string;
  industry: CanonicalIndustry[];
  enterprise_area: CanonicalEnterpriseArea;
  function: string;
  process_area: string;
  use_case_category: string;
  strategic_move_phases: CanonicalStrategicMovePhase[];
  maturity_level: CanonicalMaturityLevel;
  confidence_level: CanonicalConfidenceLevel;
  value_hypothesis: string;
  primary_kpis: string[];
  secondary_kpis: string[];
  baseline_needed: string[];
  measurement_method: string;
  value_levers: CanonicalValueLever[];
  quantitative_claims: CanonicalQuantitativeClaim[];
  source_basis: CanonicalSourceBasis;
  source_references: CanonicalSourceReference[];
  confidence_rationale: string;
  missing_required_fields: (keyof IndustryAIPattern)[];
  missing_provenance: boolean;
  unsupported_claim_flags: CanonicalUnsupportedClaimFlag[];
  duplicate_risk: CanonicalPatternDuplicateRisk | null;
  score: number;
  match_reasons: string[];
}

export type CanonicalPatternIndexStatus = 'ready' | 'empty' | 'no_match' | 'error';

export interface CanonicalPatternIndexResult {
  source: typeof CANONICAL_PATTERN_INDEX_SOURCE;
  status: CanonicalPatternIndexStatus;
  patterns: CanonicalPatternIndexHit[];
  total: number;
  warnings: string[];
  filters_applied: CanonicalPatternIndexQuery;
  cache: {
    mode: 'hit' | 'miss' | 'disabled';
    key: string | null;
    ttl_ms: number;
  };
  error?: string;
}

interface CacheEntry {
  expiresAt: number;
  result: CanonicalPatternIndexResult;
}

export interface CanonicalPatternIndexOptions {
  supabase?: CanonicalPatternIndexSupabase;
  now?: () => number;
  useCache?: boolean;
}

export interface CanonicalPatternIndexSupabase {
  from(table: typeof CANONICAL_INDUSTRY_AI_PATTERNS_TABLE): PatternQueryBuilder;
}

type PatternQueryBuilder = {
  select: (...args: unknown[]) => PatternQueryBuilder;
  eq: (...args: unknown[]) => PatternQueryBuilder;
  neq: (...args: unknown[]) => PatternQueryBuilder;
  contains: (...args: unknown[]) => PatternQueryBuilder;
  or: (...args: unknown[]) => PatternQueryBuilder;
  order: (...args: unknown[]) => PatternQueryBuilder;
  limit: (...args: unknown[]) => PromiseLike<{
    data: unknown[] | null;
    error: { message?: string } | null;
    count?: number | null;
  }>;
};

const indexCache = new Map<string, CacheEntry>();

export function clearCanonicalPatternIndexCache(): void {
  indexCache.clear();
}

export async function searchCanonicalPatternIndex(
  query: CanonicalPatternIndexQuery = {},
  options: CanonicalPatternIndexOptions = {},
): Promise<CanonicalPatternIndexResult> {
  const normalizedQuery = normalizeQuery(query);
  const cacheKey = stableCacheKey(normalizedQuery);
  const now = options.now ?? Date.now;
  const useCache = options.useCache !== false;

  if (useCache) {
    const cached = indexCache.get(cacheKey);
    if (cached && cached.expiresAt > now()) {
      return {
        ...cached.result,
        cache: { mode: 'hit', key: cacheKey, ttl_ms: CACHE_TTL_MS },
      };
    }
  }

  const result = await readCanonicalPatternIndex(normalizedQuery, options);
  const resultWithCache: CanonicalPatternIndexResult = {
    ...result,
    cache: { mode: useCache ? 'miss' : 'disabled', key: useCache ? cacheKey : null, ttl_ms: CACHE_TTL_MS },
  };

  if (useCache && resultWithCache.status !== 'error') {
    indexCache.set(cacheKey, {
      expiresAt: now() + CACHE_TTL_MS,
      result: resultWithCache,
    });
  }

  return resultWithCache;
}

async function readCanonicalPatternIndex(
  query: CanonicalPatternIndexQuery,
  options: CanonicalPatternIndexOptions,
): Promise<CanonicalPatternIndexResult> {
  try {
    const supabase = (options.supabase ?? getServerSupabase()) as CanonicalPatternIndexSupabase;
    let request = supabase
      .from(CANONICAL_INDUSTRY_AI_PATTERNS_TABLE)
      .select('*', { count: 'exact' }) as unknown as PatternQueryBuilder;

    request = request.eq('lifecycle_status', query.lifecycle_status ?? 'reviewed');
    if (!query.include_private) request = request.neq('visibility_scope', 'private');

    if (query.tenant_key || query.client_id) {
      const visibilityClauses = ['visibility_scope.eq.global'];
      if (query.tenant_key) visibilityClauses.push(`tenant_key.eq.${escapeSupabaseOrValue(query.tenant_key)}`);
      if (query.client_id) visibilityClauses.push(`client_id.eq.${escapeSupabaseOrValue(query.client_id)}`);
      request = request.or(visibilityClauses.join(','));
    } else {
      request = request.eq('visibility_scope', 'global');
    }

    if (query.industry) request = request.contains('industry', [query.industry]);
    if (query.enterprise_area) request = request.eq('enterprise_area', query.enterprise_area);
    if (query.function) request = request.eq('function', query.function);
    if (query.process_area) request = request.eq('process_area', query.process_area);
    if (query.use_case_category) request = request.eq('use_case_category', query.use_case_category);
    if (query.strategic_move_phase) request = request.contains('strategic_move_phases', [query.strategic_move_phase]);
    if (query.confidence_level) request = request.eq('confidence_level', query.confidence_level);
    if (query.maturity_level) request = request.eq('maturity_level', query.maturity_level);
    if (query.source_system) request = request.contains('source_systems', [query.source_system]);
    if (query.value_lever) request = request.contains('value_levers', [query.value_lever]);
    if (query.query) request = request.or(searchClause(query.query));

    const response = await request
      .order('confidence_level', { ascending: false })
      .order('updated_at', { ascending: false })
      .limit(query.limit ?? DEFAULT_LIMIT);

    if (response.error) {
      return errorResult(query, response.error.message ?? 'Unknown Supabase error');
    }

    const rows = (response.data ?? []) as PersistedCanonicalIndustryAIPatternRow[];
    if (rows.length === 0) {
      const emptyStatus = hasAnySearchFilter(query) ? 'no_match' : 'empty';
      return {
        source: CANONICAL_PATTERN_INDEX_SOURCE,
        status: emptyStatus,
        patterns: [],
        total: response.count ?? 0,
        warnings: [emptyStatus === 'empty' ? WARNING_CANONICAL_CORPUS_EMPTY : WARNING_CANONICAL_PATTERN_NO_MATCH],
        filters_applied: query,
        cache: { mode: 'disabled', key: null, ttl_ms: CACHE_TTL_MS },
      };
    }

    const patterns = rows
      .map((row) => toIndexHit(row, query))
      .sort((a, b) => b.score - a.score || confidenceRank(b.confidence_level) - confidenceRank(a.confidence_level));

    return {
      source: CANONICAL_PATTERN_INDEX_SOURCE,
      status: 'ready',
      patterns,
      total: response.count ?? patterns.length,
      warnings: [],
      filters_applied: query,
      cache: { mode: 'disabled', key: null, ttl_ms: CACHE_TTL_MS },
    };
  } catch (error) {
    return errorResult(query, error instanceof Error ? error.message : String(error));
  }
}

function toIndexHit(
  row: PersistedCanonicalIndustryAIPatternRow,
  query: CanonicalPatternIndexQuery,
): CanonicalPatternIndexHit {
  const match_reasons = matchReasons(row, query);
  return {
    canonical_id: row.canonical_id,
    title: row.title,
    summary: row.summary,
    industry: row.industry,
    enterprise_area: row.enterprise_area,
    function: row.function,
    process_area: row.process_area,
    use_case_category: row.use_case_category,
    strategic_move_phases: row.strategic_move_phases,
    maturity_level: row.maturity_level,
    confidence_level: row.confidence_level,
    value_hypothesis: row.value_hypothesis,
    primary_kpis: row.primary_kpis,
    secondary_kpis: row.secondary_kpis,
    baseline_needed: row.baseline_needed,
    measurement_method: row.measurement_method,
    value_levers: row.value_levers,
    quantitative_claims: row.quantitative_claims,
    source_basis: row.source_basis,
    source_references: row.source_references,
    confidence_rationale: row.confidence_rationale,
    missing_required_fields: row.missing_required_fields,
    missing_provenance: row.missing_provenance,
    unsupported_claim_flags: row.unsupported_claim_flags,
    duplicate_risk: row.duplicate_risk,
    score: scoreRow(row, query, match_reasons),
    match_reasons,
  };
}

function normalizeQuery(query: CanonicalPatternIndexQuery): CanonicalPatternIndexQuery {
  return {
    ...query,
    query: query.query?.trim() || undefined,
    limit: clampLimit(query.limit),
  };
}

function clampLimit(value: number | undefined): number {
  if (!Number.isFinite(value)) return DEFAULT_LIMIT;
  return Math.max(1, Math.min(MAX_LIMIT, Math.trunc(value ?? DEFAULT_LIMIT)));
}

function hasAnySearchFilter(query: CanonicalPatternIndexQuery): boolean {
  return Boolean(
    query.query
      || query.industry
      || query.enterprise_area
      || query.function
      || query.process_area
      || query.use_case_category
      || query.strategic_move_phase
      || query.confidence_level
      || query.maturity_level
      || query.source_system
      || query.value_lever,
  );
}

function matchReasons(row: PersistedCanonicalIndustryAIPatternRow, query: CanonicalPatternIndexQuery): string[] {
  const reasons: string[] = [];
  if (query.industry && row.industry.includes(query.industry)) reasons.push(`industry:${query.industry}`);
  if (query.enterprise_area && row.enterprise_area === query.enterprise_area) reasons.push(`enterprise_area:${query.enterprise_area}`);
  if (query.function && row.function === query.function) reasons.push(`function:${query.function}`);
  if (query.process_area && row.process_area === query.process_area) reasons.push(`process_area:${query.process_area}`);
  if (query.use_case_category && row.use_case_category === query.use_case_category) {
    reasons.push(`use_case_category:${query.use_case_category}`);
  }
  if (query.strategic_move_phase && row.strategic_move_phases.includes(query.strategic_move_phase)) {
    reasons.push(`phase:${query.strategic_move_phase}`);
  }
  if (query.value_lever && row.value_levers.includes(query.value_lever)) reasons.push(`value_lever:${query.value_lever}`);
  if (query.query) {
    const terms = tokenize(query.query);
    const haystack = [
      row.canonical_id,
      row.title,
      row.summary,
      row.business_problem,
      row.function,
      row.process_area,
      row.use_case_category,
      ...row.primary_kpis,
      ...row.required_data_domains,
    ].join(' ').toLowerCase();
    const matchedTerms = terms.filter((term) => haystack.includes(term));
    if (matchedTerms.length > 0) reasons.push(`query:${matchedTerms.join('+')}`);
  }

  return reasons.length > 0 ? reasons : ['persisted_canonical_corpus'];
}

function scoreRow(
  row: PersistedCanonicalIndustryAIPatternRow,
  query: CanonicalPatternIndexQuery,
  reasons: string[],
): number {
  let score = confidenceRank(row.confidence_level) * 0.1;
  score += reasons.filter((reason) => reason !== 'persisted_canonical_corpus').length * 0.12;
  if (query.query && reasons.some((reason) => reason.startsWith('query:'))) score += 0.3;
  if (row.missing_provenance) score -= 0.15;
  if (row.unsupported_claim_flags.length > 0) score -= 0.1;
  return Math.max(0, Math.min(1, Number(score.toFixed(3))));
}

function confidenceRank(value: CanonicalConfidenceLevel): number {
  switch (value) {
    case 'validated':
      return 4;
    case 'high':
      return 3;
    case 'medium':
      return 2;
    case 'low':
      return 1;
  }
}

function searchClause(value: string): string {
  const term = escapeSupabaseOrValue(value);
  return [
    `canonical_id.ilike.%${term}%`,
    `title.ilike.%${term}%`,
    `summary.ilike.%${term}%`,
    `business_problem.ilike.%${term}%`,
    `function.ilike.%${term}%`,
    `process_area.ilike.%${term}%`,
    `use_case_category.ilike.%${term}%`,
  ].join(',');
}

function escapeSupabaseOrValue(value: string): string {
  return value.replace(/[%_,]/g, ' ').replace(/\s+/g, ' ').trim();
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9_]+/g)
    .map((term) => term.trim())
    .filter((term) => term.length > 1)
    .slice(0, 8);
}

function stableCacheKey(query: CanonicalPatternIndexQuery): string {
  return JSON.stringify(Object.keys(query)
    .sort()
    .reduce<Record<string, unknown>>((acc, key) => {
      const value = query[key as keyof CanonicalPatternIndexQuery];
      if (value !== undefined) acc[key] = value;
      return acc;
    }, {}));
}

function errorResult(query: CanonicalPatternIndexQuery, message: string): CanonicalPatternIndexResult {
  return {
    source: CANONICAL_PATTERN_INDEX_SOURCE,
    status: 'error',
    patterns: [],
    total: 0,
    warnings: [WARNING_CANONICAL_CORPUS_READ_FAILED],
    filters_applied: query,
    cache: { mode: 'disabled', key: null, ttl_ms: CACHE_TTL_MS },
    error: message,
  };
}
