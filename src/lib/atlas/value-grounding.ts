import 'server-only';

import { normalizeIndustry } from '@/lib/intelligence/canonical/normalizers';
import {
  buildAgentGroundingDisclosure,
  type AgentGroundingDisclosure,
} from '@/lib/intelligence/canonical/agent-grounding-disclosure';
import {
  searchCanonicalPatternIndex,
  type CanonicalPatternIndexOptions,
  type CanonicalPatternIndexQuery,
  type CanonicalPatternIndexResult,
} from '@/lib/intelligence/canonical/runtime-pattern-index';
import type {
  AtlasPortfolioSummary,
  AtlasTenancyCtx,
  AtlasValueEvidencePoint,
  AtlasValueGrounding,
  AtlasValueGroundingPattern,
} from '@/lib/atlas/types';
import type { AtlasTowerCurrentState } from '@/lib/atlas/tower-grounding';
import type { CanonicalValueLever } from '@/lib/intelligence/canonical/industry-ai-pattern';

type SearchCanonicalPatternIndex = (
  query?: CanonicalPatternIndexQuery,
  options?: CanonicalPatternIndexOptions,
) => Promise<CanonicalPatternIndexResult>;

export interface AtlasValueGroundingInput {
  ctx: AtlasTenancyCtx;
  message: string;
  portfolio: AtlasPortfolioSummary;
  towerState?: AtlasTowerCurrentState | null;
}

export interface AtlasValueGroundingOptions extends CanonicalPatternIndexOptions {
  search?: SearchCanonicalPatternIndex;
}

function dollars(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'missing';
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${Math.round(value)}`;
}

function percent(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'missing';
  return `${Math.round(value)}%`;
}

function positiveMoneyPoint(
  label: string,
  value: number | null | undefined,
  basis: string,
  status: AtlasValueEvidencePoint['status'],
): AtlasValueEvidencePoint {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return { label, value: 'missing', basis, status: 'missing' };
  }

  return { label, value: dollars(value), basis, status };
}

function nullableNumberPoint(
  label: string,
  value: number | null | undefined,
  basis: string,
  status: AtlasValueEvidencePoint['status'],
  formatter: (value: number) => string,
): AtlasValueEvidencePoint {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return { label, value: 'missing', basis, status: 'missing' };
  }

  return { label, value: formatter(value), basis, status };
}

function canonicalIndustryFromTower(state?: AtlasTowerCurrentState | null) {
  if (!state) return undefined;
  if (state.client.industryCode === 'HEALTHCARE_IDN') return 'healthcare';
  if (state.client.industryCode === 'FINSERV') return 'financial_services';
  if (state.client.industryCode === 'RETAIL') return 'retail';
  const normalized = normalizeIndustry(state.client.industryCode);
  const industry = normalized.values[0];
  return industry && industry !== 'other' ? industry : undefined;
}

function inferValueLever(message: string): CanonicalValueLever | undefined {
  const text = message.toLowerCase();
  if (/(cost|spend|savings|expense|margin)/.test(text)) return 'cost_takeout';
  if (/(productivity|hours|cycle time|throughput)/.test(text)) return 'productivity';
  if (/(risk|exposure|control|trust|compliance)/.test(text)) return 'risk_reduction';
  if (/(experience|csat|nps|customer|patient|employee)/.test(text)) return 'experience';
  if (/(revenue|growth|conversion|retention)/.test(text)) return 'revenue_growth';
  return undefined;
}

function buildPatternQuery(input: AtlasValueGroundingInput): CanonicalPatternIndexQuery {
  const industry = canonicalIndustryFromTower(input.towerState);
  const valueLever = inferValueLever(input.message);
  const pressureTerms = input.towerState?.pressuresView.cards
    .slice(0, 3)
    .map((card) => card.headline)
    .join(' ');

  return {
    tenant_key: input.towerState?.client.tenantKey ?? undefined,
    client_id: input.ctx.clientId,
    industry,
    value_lever: valueLever,
    query: [
      input.message,
      pressureTerms,
      'AI value ROI value realization KPI baseline measurement attribution',
    ].filter(Boolean).join(' '),
    limit: 3,
  };
}

function mapPattern(pattern: CanonicalPatternIndexResult['patterns'][number]): AtlasValueGroundingPattern {
  return {
    canonicalId: pattern.canonical_id,
    title: pattern.title,
    confidenceLevel: pattern.confidence_level,
    score: pattern.score,
    matchReasons: pattern.match_reasons,
    valueHypothesis: pattern.value_hypothesis,
    primaryKpis: pattern.primary_kpis,
    secondaryKpis: pattern.secondary_kpis,
    baselineNeeded: pattern.baseline_needed,
    measurementMethod: pattern.measurement_method,
    valueLevers: pattern.value_levers,
    sourceBasis: pattern.source_basis,
    sourceReferencesCount: pattern.source_references.length,
    confidenceRationale: pattern.confidence_rationale,
    missingProvenance: pattern.missing_provenance,
    missingRequiredFields: pattern.missing_required_fields.map(String),
    unsupportedClaimFlags: pattern.unsupported_claim_flags.map((flag) => `${flag.claim}: ${flag.reason}`),
    quantitativeClaimCount: pattern.quantitative_claims.length,
  };
}

function missingFromValueSeparation(valueSeparation: AtlasValueGrounding['valueSeparation']): string[] {
  const missing: string[] = [];
  if (valueSeparation.projected.status === 'missing') {
    missing.push('projected value is absent or zero in the Atlas portfolio aggregate');
  }
  if (valueSeparation.verified.status === 'missing') {
    missing.push('verified realized value is absent or zero in the Atlas portfolio aggregate');
  }
  for (const tracked of valueSeparation.tracked) {
    if (tracked.status === 'missing') missing.push(`${tracked.label} is missing from tracked portfolio metrics`);
  }
  return missing;
}

function missingFromPatterns(result: CanonicalPatternIndexResult, patterns: AtlasValueGroundingPattern[]): string[] {
  if (result.status !== 'ready') {
    return ['no canonical pattern matched this value question; do not use external value benchmarks'];
  }

  const lead = patterns[0];
  if (!lead) return ['no canonical pattern matched this value question; do not use external value benchmarks'];

  const missing: string[] = [];
  if (lead.primaryKpis.length === 0 || lead.missingRequiredFields.includes('primary_kpis')) {
    missing.push('canonical pattern primary KPIs are missing');
  }
  if (lead.baselineNeeded.length === 0 || lead.missingRequiredFields.includes('baseline_needed')) {
    missing.push('canonical pattern baseline requirements are missing');
  }
  if (!lead.measurementMethod || lead.missingRequiredFields.includes('measurement_method')) {
    missing.push('canonical pattern measurement method is missing');
  }
  if (lead.missingProvenance || lead.sourceReferencesCount === 0) {
    missing.push('canonical pattern provenance is missing or thin');
  }
  if (lead.quantitativeClaimCount === 0) {
    missing.push('canonical pattern has no quantified outcome claim; do not state external lift or savings');
  }
  if (lead.unsupportedClaimFlags.length > 0) {
    missing.push('canonical pattern contains unsupported claim flags that must be qualified');
  }
  return missing;
}

export async function buildAtlasValueGrounding(
  input: AtlasValueGroundingInput,
  options: AtlasValueGroundingOptions = {},
): Promise<AtlasValueGrounding> {
  const query = buildPatternQuery(input);
  const search = options.search ?? searchCanonicalPatternIndex;
  const indexOptions: CanonicalPatternIndexOptions = {
    supabase: options.supabase,
    now: options.now,
    useCache: options.useCache,
  };
  const result = await search(query, indexOptions);

  const valueSeparation: AtlasValueGrounding['valueSeparation'] = {
    projected: positiveMoneyPoint(
      'Projected value',
      input.portfolio.estimatedValueUsd,
      'atlas_portfolio_summary.estimatedValueUsd',
      'projected',
    ),
    tracked: [
      nullableNumberPoint(
        'Tracked value attainment',
        input.portfolio.valueAttainmentPctAvg,
        'atlas_portfolio_summary.valueAttainmentPctAvg',
        'tracked',
        percent,
      ),
      nullableNumberPoint(
        'Tracked active users',
        input.portfolio.trackedActiveUsers,
        'atlas_portfolio_summary.trackedActiveUsers',
        'tracked',
        (value) => value.toLocaleString(),
      ),
    ],
    verified: positiveMoneyPoint(
      'Verified realized value',
      input.portfolio.realizedValueUsd,
      'atlas_portfolio_summary.realizedValueUsd',
      'verified',
    ),
  };

  const patterns = result.patterns.map(mapPattern);
  const missingEvidence = [
    ...missingFromValueSeparation(valueSeparation),
    ...missingFromPatterns(result, patterns),
  ];

  return {
    source: result.source,
    status: result.status,
    warnings: result.warnings,
    filtersApplied: result.filters_applied as Record<string, unknown>,
    valueSeparation,
    patterns,
    missingEvidence,
  };
}

export function renderAtlasValueGrounding(grounding: AtlasValueGrounding): string {
  const separation = [
    `${grounding.valueSeparation.projected.label}: ${grounding.valueSeparation.projected.value} (${grounding.valueSeparation.projected.status})`,
    ...grounding.valueSeparation.tracked.map((item) => `${item.label}: ${item.value} (${item.status})`),
    `${grounding.valueSeparation.verified.label}: ${grounding.valueSeparation.verified.value} (${grounding.valueSeparation.verified.status})`,
  ].join('; ');

  const lead = grounding.patterns[0];
  const patternLine = lead
    ? `Canonical pattern: ${lead.title} (${lead.confidenceLevel} confidence). KPIs: ${lead.primaryKpis.join(', ') || 'missing'}. Baseline needed: ${lead.baselineNeeded.join(', ') || 'missing'}. Measurement: ${lead.measurementMethod || 'missing'}.`
    : `Canonical pattern: ${grounding.status}; ${grounding.warnings.join(' ') || 'no canonical value pattern returned'}.`;
  const missingLine = grounding.missingEvidence.length > 0
    ? `Missing evidence: ${grounding.missingEvidence.join('; ')}.`
    : 'Missing evidence: none surfaced by the current Atlas/canonical pattern context.';

  return [
    `Value separation: ${separation}.`,
    patternLine,
    missingLine,
  ].join(' ');
}

export function buildAtlasGroundingDisclosure(
  grounding: AtlasValueGrounding | undefined,
): AgentGroundingDisclosure | undefined {
  if (!grounding) return undefined;

  return buildAgentGroundingDisclosure({
    source: grounding.source,
    status: grounding.status,
    warnings: grounding.warnings,
    missingEvidence: grounding.missingEvidence,
    patterns: grounding.patterns.map((pattern) => ({
      canonicalId: pattern.canonicalId,
      title: pattern.title,
      sourceBasis: pattern.sourceBasis,
      confidenceLevel: pattern.confidenceLevel,
      confidenceRationale: pattern.confidenceRationale,
      sourceReferenceCount: pattern.sourceReferencesCount,
      missingRequiredFields: pattern.missingRequiredFields,
      missingProvenance: pattern.missingProvenance,
      unsupportedClaimFlags: pattern.unsupportedClaimFlags,
      quantitativeClaimCount: pattern.quantitativeClaimCount,
      matchReasons: pattern.matchReasons,
    })),
  });
}
