import 'server-only';

import {
  allowedCorpusIndustryScopes,
  normalizeCorpusIndustryScope,
  type CorpusIndustryScopeInput,
} from '@/lib/corpus/industry-scope';
import { searchCorpus } from '@/lib/corpus/retrieval';
import type { CorpusSearchHit } from '@/lib/corpus/types';
import type {
  CanonicalConfidenceLevel,
  CanonicalEnterpriseArea,
  CanonicalIndustry,
  CanonicalMaturityLevel,
  CanonicalQuantitativeClaim,
  CanonicalSourceBasis,
  CanonicalSourceReference,
  CanonicalStrategicMovePhase,
  CanonicalUnsupportedClaimFlag,
  CanonicalValueLever,
  IndustryAIPattern,
} from './industry-ai-pattern';
import {
  CANONICAL_PATTERN_INDEX_SOURCE,
  WARNING_CANONICAL_CORPUS_READ_FAILED,
  WARNING_CANONICAL_KEYWORD_FALLBACK_USED,
  WARNING_CANONICAL_PATTERN_NO_MATCH,
  type CanonicalPatternIndexHit,
  type CanonicalPatternIndexOptions,
  type CanonicalPatternIndexQuery,
  type CanonicalPatternIndexResult,
} from './runtime-pattern-index';

export interface IndustryScopedCorpusPatternIndexOptions extends CanonicalPatternIndexOptions {
  scope?: CorpusIndustryScopeInput;
}

const SOURCE_BASIS_VALUES = new Set<CanonicalSourceBasis>([
  'internal_pattern',
  'public_research',
  'inferred_from_patterns',
  'user_seeded',
  'tenant_evidence',
  'synthetic_seed',
  'unknown',
]);

const CONFIDENCE_LEVELS = new Set<CanonicalConfidenceLevel>(['low', 'medium', 'high', 'validated']);
const ENTERPRISE_AREAS = new Set<CanonicalEnterpriseArea>([
  'front_office',
  'middle_office',
  'back_office',
  'enterprise_platform',
]);
const MATURITY_LEVELS = new Set<CanonicalMaturityLevel>(['emerging', 'proven', 'scaled', 'experimental']);
const VALUE_LEVERS = new Set<CanonicalValueLever>([
  'cost_takeout',
  'revenue_growth',
  'risk_reduction',
  'experience',
  'productivity',
  'speed_to_market',
  'working_capital',
  'quality',
  'compliance',
]);
const STRATEGIC_MOVE_PHASES = new Set<CanonicalStrategicMovePhase>([
  'originate',
  'charter',
  'diagnose_discover',
  'design',
  'roadmap_business_case_change_value_plan',
  'mobilize_handoff',
]);
const CANONICAL_INDUSTRY_VALUES = new Set<CanonicalIndustry>([
  'retail',
  'healthcare',
  'healthcare_provider',
  'healthcare_medtech',
  'financial_services',
  'financial_services_banking',
  'airline',
  'cross_industry',
  'energy',
  'public_sector',
  'other',
]);

function jsonRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function scopedSearchText(query: CanonicalPatternIndexQuery): string {
  return [
    query.query,
    query.function,
    query.process_area,
    query.use_case_category,
    query.enterprise_area,
    query.strategic_move_phase,
    query.value_lever,
  ].filter(Boolean).join(' ').trim();
}

function scopesFromCanonicalIndustry(industry: CanonicalIndustry | undefined): string[] | undefined {
  if (!industry) return undefined;
  if (industry === 'healthcare') return ['healthcare_provider', 'healthcare_medtech', 'cross_industry'];
  if (industry === 'financial_services') return ['financial_services_banking', 'cross_industry'];
  if (industry === 'other') return ['cross_industry'];
  return [industry, 'cross_industry'];
}

function allowedScopesForQuery(
  query: CanonicalPatternIndexQuery,
  scope: CorpusIndustryScopeInput | undefined,
): string[] {
  const inferred = allowedCorpusIndustryScopes({
    tenantKey: scope?.tenantKey ?? query.tenant_key,
    clientKey: scope?.clientKey ?? query.client_id,
    activeClient: scope?.activeClient,
    facts: [
      ...(scope?.facts ?? []),
      query.industry,
      query.enterprise_area,
      query.function,
      query.process_area,
      query.use_case_category,
    ].filter((item): item is string => Boolean(item)),
  });
  return inferred ?? scopesFromCanonicalIndustry(query.industry) ?? ['cross_industry'];
}

function canonicalIndustriesFromScopes(scopes: readonly string[]): CanonicalIndustry[] {
  const industries = scopes
    .map(normalizeCorpusIndustryScope)
    .map((scope) => {
      if (scope === 'global_network_airline' || scope === 'aviation') return 'airline';
      if (CANONICAL_INDUSTRY_VALUES.has(scope as CanonicalIndustry)) return scope as CanonicalIndustry;
      return null;
    })
    .filter((item): item is CanonicalIndustry => Boolean(item));
  return Array.from(new Set(industries.length > 0 ? industries : ['other']));
}

function sourceBasisFromSynthesis(synthesis: Record<string, unknown>): CanonicalSourceBasis {
  const value = synthesis.source_basis;
  return typeof value === 'string' && SOURCE_BASIS_VALUES.has(value as CanonicalSourceBasis)
    ? value as CanonicalSourceBasis
    : 'inferred_from_patterns';
}

function confidenceLevelFromHit(hit: CorpusSearchHit): CanonicalConfidenceLevel {
  if (hit.depthScore >= 9 || hit.confidence >= 0.92) return 'validated';
  if (hit.depthScore >= 8 || hit.confidence >= 0.8) return 'high';
  if (hit.depthScore >= 6 || hit.confidence >= 0.65) return 'medium';
  return 'low';
}

function synthesisStringArray(synthesis: Record<string, unknown>, key: string): string[] {
  return stringArray(synthesis[key]);
}

function firstValid<T extends string>(values: unknown, allowed: Set<T>, fallback: T): T {
  if (typeof values === 'string' && allowed.has(values as T)) return values as T;
  if (Array.isArray(values)) {
    const match = values.find((item) => typeof item === 'string' && allowed.has(item as T));
    if (match) return match as T;
  }
  return fallback;
}

function sourceReferences(hit: CorpusSearchHit): CanonicalSourceReference[] {
  return hit.evidence
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item))
    .map((item, index) => ({
      source_id: typeof item.source_id === 'string' ? item.source_id : `${hit.slug}:evidence:${index + 1}`,
      label: typeof item.title === 'string' ? item.title : hit.title,
      url: typeof item.url === 'string' ? item.url : undefined,
      note: typeof item.note === 'string' ? item.note : undefined,
    }));
}

function quantitativeClaims(hit: CorpusSearchHit): CanonicalQuantitativeClaim[] {
  return hit.claims
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item))
    .map((item) => ({
      claim: typeof item.claim === 'string' ? item.claim : JSON.stringify(item),
      metric: typeof item.metric === 'string' ? item.metric : undefined,
      value: typeof item.value === 'string' ? item.value : undefined,
      confidence_level: firstValid(item.confidence_level, CONFIDENCE_LEVELS, 'medium'),
    }));
}

function unsupportedClaimFlags(hit: CorpusSearchHit): CanonicalUnsupportedClaimFlag[] {
  return hit.counterarguments
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item))
    .map((item) => ({
      claim: typeof item.claim === 'string' ? item.claim : hit.title,
      reason: typeof item.reason === 'string' ? item.reason : 'counterargument recorded in corpus pattern',
      recommended_action: firstValid(item.recommended_action, new Set(['remove', 'qualify', 'source_required', 'mark_low_confidence']), 'qualify'),
    }));
}

function missingRequiredFields(hit: CorpusSearchHit, synthesis: Record<string, unknown>): (keyof IndustryAIPattern)[] {
  const missing: (keyof IndustryAIPattern)[] = [];
  if (synthesisStringArray(synthesis, 'primary_kpis').length === 0) missing.push('primary_kpis');
  if (synthesisStringArray(synthesis, 'baseline_needed').length === 0) missing.push('baseline_needed');
  if (typeof synthesis.measurement_method !== 'string') missing.push('measurement_method');
  if (sourceReferences(hit).length === 0) missing.push('source_references');
  return missing;
}

function toCanonicalHit(hit: CorpusSearchHit, query: CanonicalPatternIndexQuery): CanonicalPatternIndexHit {
  const synthesis = jsonRecord(hit.synthesis);
  const provenance = jsonRecord(synthesis.provenance);
  const sourceBasis = sourceBasisFromSynthesis(synthesis);
  const canonicalId = typeof provenance.legacy_id === 'string' ? provenance.legacy_id : hit.slug;
  const summary = hit.markdownBody
    .replace(/^# .+\n+/, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 320) || hit.title;
  const strategicMovePhases = hit.applicableHorizons
    .map((phase) => normalizeCorpusIndustryScope(phase))
    .filter((phase): phase is CanonicalStrategicMovePhase => STRATEGIC_MOVE_PHASES.has(phase as CanonicalStrategicMovePhase));
  const missing = missingRequiredFields(hit, synthesis);

  return {
    canonical_id: canonicalId,
    title: hit.title,
    summary,
    industry: canonicalIndustriesFromScopes(hit.verticalOverlays),
    enterprise_area: firstValid(synthesis.enterprise_area, ENTERPRISE_AREAS, 'enterprise_platform'),
    function: hit.category,
    process_area: hit.regionOverlays[1] ?? hit.category,
    use_case_category: hit.regionOverlays[2] ?? hit.category,
    strategic_move_phases: strategicMovePhases.length > 0 ? strategicMovePhases : [],
    maturity_level: firstValid(synthesis.maturity_level, MATURITY_LEVELS, 'proven'),
    confidence_level: confidenceLevelFromHit(hit),
    value_hypothesis: typeof synthesis.value_hypothesis === 'string' ? synthesis.value_hypothesis : summary,
    primary_kpis: synthesisStringArray(synthesis, 'primary_kpis'),
    secondary_kpis: synthesisStringArray(synthesis, 'secondary_kpis'),
    baseline_needed: synthesisStringArray(synthesis, 'baseline_needed'),
    measurement_method: typeof synthesis.measurement_method === 'string' ? synthesis.measurement_method : '',
    value_levers: synthesisStringArray(synthesis, 'value_levers')
      .filter((item): item is CanonicalValueLever => VALUE_LEVERS.has(item as CanonicalValueLever)),
    quantitative_claims: quantitativeClaims(hit),
    source_basis: sourceBasis,
    source_references: sourceReferences(hit),
    confidence_rationale: typeof synthesis.confidence_rationale === 'string'
      ? synthesis.confidence_rationale
      : `Corpus confidence ${hit.confidence.toFixed(2)}; depth score ${hit.depthScore.toFixed(1)}.`,
    missing_required_fields: missing,
    missing_provenance: sourceReferences(hit).length === 0,
    unsupported_claim_flags: unsupportedClaimFlags(hit),
    duplicate_risk: null,
    score: hit.score || hit.confidence,
    match_reasons: [
      query.query ? `query:${query.query}` : null,
      `corpus:${hit.source}`,
      hit.verticalOverlays.length > 0 ? `industry:${hit.verticalOverlays.join(',')}` : null,
    ].filter((item): item is string => Boolean(item)),
  };
}

export async function searchIndustryScopedCorpusPatternIndex(
  query: CanonicalPatternIndexQuery = {},
  options: IndustryScopedCorpusPatternIndexOptions = {},
): Promise<CanonicalPatternIndexResult> {
  const limit = Math.min(Math.max(query.limit ?? 8, 1), 50);
  const verticalOverlays = allowedScopesForQuery(query, options.scope);
  const searchText = scopedSearchText(query);

  try {
    const hits = await searchCorpus(searchText, {
      clientId: query.tenant_key ?? query.client_id ?? options.scope?.tenantKey ?? options.scope?.clientKey ?? 'global',
      userId: undefined,
      verticalOverlays,
      minConfidence: 0,
      minDepthScore: 0,
      limit,
      includePrivate: query.include_private,
    });
    const patterns = hits.map((hit) => toCanonicalHit(hit, query));
    const status = patterns.length > 0 ? 'ready' : 'no_match';

    return {
      source: CANONICAL_PATTERN_INDEX_SOURCE,
      status,
      patterns,
      total: patterns.length,
      warnings: patterns.length > 0
        ? [WARNING_CANONICAL_KEYWORD_FALLBACK_USED]
        : [WARNING_CANONICAL_PATTERN_NO_MATCH],
      filters_applied: query,
      cache: { mode: 'disabled', key: null, ttl_ms: 0 },
    };
  } catch (error) {
    return {
      source: CANONICAL_PATTERN_INDEX_SOURCE,
      status: 'error',
      patterns: [],
      total: 0,
      warnings: [WARNING_CANONICAL_CORPUS_READ_FAILED],
      filters_applied: query,
      cache: { mode: 'disabled', key: null, ttl_ms: 0 },
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
