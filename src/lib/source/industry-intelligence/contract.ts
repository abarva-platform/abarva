import {
  CORPUS_GLOBAL_SCOPE,
  evaluateGovernedObject,
  type ConfidenceLevel,
  type GovernedObject,
} from '@/lib/governance/context-corpus-policy';

export const INDUSTRY_SOURCE_AUTHORITIES = [
  'official_public',
  'licensed_research',
  'client_provided_benchmark',
  'curated_anonymized_cohort',
] as const;

export type IndustrySourceAuthority =
  (typeof INDUSTRY_SOURCE_AUTHORITIES)[number];

export type IndustryCitationMode =
  | 'public_link_and_excerpt'
  | 'licensed_reference_only'
  | 'client_document_reference'
  | 'cohort_methodology_only';

export type IndustryBenchmarkKind =
  | 'published_rate'
  | 'market_range'
  | 'cohort_distribution'
  | 'standard_or_control';

export interface IndustrySourceRecord {
  governance: GovernedObject;
  publisher: string;
  title: string;
  authority: IndustrySourceAuthority;
  citationMode: IndustryCitationMode;
  publicUrl?: string | null;
  publicationDate: string;
  retrievedAt: string;
  versionHash: string;
  licenseReference?: string | null;
}

export interface IndustryBenchmarkObservation {
  id: string;
  source: IndustrySourceRecord;
  archetypeIds: string[];
  metricKey: string;
  metricLabel: string;
  kind: IndustryBenchmarkKind;
  unit: string;
  currency?: string | null;
  low?: number | null;
  median?: number | null;
  high?: number | null;
  geography?: string | null;
  industry?: string | null;
  serviceScope?: string | null;
  scaleBand?: string | null;
  deliveryModel?: string | null;
  sampleSize?: number | null;
  methodology?: string | null;
  sourceLocator: string;
  supportingExcerpt?: string | null;
  effectiveFrom: string;
  effectiveTo?: string | null;
  confidence: ConfidenceLevel;
  comparabilityNotes: string;
}

export type IndustryObservationDecision =
  | 'usable_for_calculation'
  | 'context_only'
  | 'blocked';

export interface IndustryObservationEvaluation {
  decision: IndustryObservationDecision;
  reasons: string[];
  warnings: string[];
}

function validDate(value: string): boolean {
  return Number.isFinite(Date.parse(value));
}

function hasNumericObservation(
  observation: IndustryBenchmarkObservation,
): boolean {
  return [observation.low, observation.median, observation.high].some(
    (value) => typeof value === 'number' && Number.isFinite(value),
  );
}

export function evaluateIndustryBenchmarkObservation(
  observation: IndustryBenchmarkObservation,
  options: {
    archetypeId: string;
    requiredComparabilityFields?: ReadonlyArray<
      'geography' | 'industry' | 'serviceScope' | 'scaleBand' | 'deliveryModel'
    >;
    asOf?: Date;
  },
): IndustryObservationEvaluation {
  const reasons: string[] = [];
  const warnings: string[] = [];
  const sourcePolicy = evaluateGovernedObject(observation.source.governance);

  if (!sourcePolicy.agentReady) {
    reasons.push(
      `Source is not agent_ready: ${[
        ...sourcePolicy.errors,
        ...sourcePolicy.warnings,
      ].join('; ') || 'governance readiness incomplete'}`,
    );
  }
  if (observation.source.governance.source_layer !== 'industry_corpus') {
    reasons.push('Source layer must be industry_corpus.');
  }
  if (
    observation.source.governance.client_key !== CORPUS_GLOBAL_SCOPE ||
    observation.source.governance.tenant_id !== null
  ) {
    reasons.push('Industry intelligence must be tenant-neutral corpus_global.');
  }
  if (!observation.archetypeIds.includes(options.archetypeId)) {
    reasons.push(`Observation is not approved for archetype ${options.archetypeId}.`);
  }
  if (!observation.metricKey.trim() || !observation.unit.trim()) {
    reasons.push('Metric key and unit are required.');
  }
  if (!observation.sourceLocator.trim()) {
    reasons.push('A precise source locator is required.');
  }
  if (
    !validDate(observation.source.publicationDate) ||
    !validDate(observation.source.retrievedAt) ||
    !validDate(observation.effectiveFrom)
  ) {
    reasons.push('Publication, retrieval, and effective dates must be valid.');
  }
  if (observation.effectiveTo && !validDate(observation.effectiveTo)) {
    reasons.push('Effective-to date must be valid when provided.');
  }
  if (
    (observation.kind === 'market_range' ||
      observation.kind === 'cohort_distribution') &&
    (!observation.sampleSize || observation.sampleSize < 1)
  ) {
    reasons.push('Market/cohort observations require a positive sample size.');
  }
  if (
    (observation.kind === 'market_range' ||
      observation.kind === 'cohort_distribution') &&
    !observation.methodology?.trim()
  ) {
    reasons.push('Market/cohort observations require a methodology.');
  }
  if (!hasNumericObservation(observation)) {
    warnings.push('No numeric observation is present; source is narrative context only.');
  }
  for (const field of options.requiredComparabilityFields ?? []) {
    if (!observation[field]?.trim()) {
      reasons.push(`Required comparability field ${field} is missing.`);
    }
  }

  const asOf = options.asOf ?? new Date();
  if (
    observation.effectiveTo &&
    Date.parse(observation.effectiveTo) < asOf.getTime()
  ) {
    warnings.push('Observation is outside its effective period.');
  }

  if (reasons.length > 0) return { decision: 'blocked', reasons, warnings };
  if (warnings.length > 0) return { decision: 'context_only', reasons, warnings };
  return { decision: 'usable_for_calculation', reasons, warnings };
}

export interface IndustryCitationView {
  label: string;
  locator: string;
  href: string | null;
  published: string;
  retrieved: string;
  excerpt: string | null;
  confidence: ConfidenceLevel;
  sourceAuthority: IndustrySourceAuthority;
}

export function buildIndustryCitationView(
  observation: IndustryBenchmarkObservation,
): IndustryCitationView {
  const canExposePublicLink =
    observation.source.citationMode === 'public_link_and_excerpt';
  return {
    label: `${observation.source.publisher} · ${observation.source.title}`,
    locator: observation.sourceLocator,
    href: canExposePublicLink ? observation.source.publicUrl ?? null : null,
    published: observation.source.publicationDate,
    retrieved: observation.source.retrievedAt,
    excerpt: canExposePublicLink
      ? observation.supportingExcerpt?.trim() || null
      : null,
    confidence: observation.confidence,
    sourceAuthority: observation.source.authority,
  };
}
