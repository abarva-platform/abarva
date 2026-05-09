import type {
  CanonicalConfidenceLevel,
  CanonicalEnterpriseArea,
  CanonicalIndustry,
  CanonicalLifecycleStatus,
  CanonicalPatternSourceSystem,
  CanonicalSourceBasis,
  CanonicalSourceCrosswalkEntry,
  CanonicalSourceReference,
  CanonicalStrategicMovePhase,
  IndustryAIPattern,
  IndustryAIPatternDraft,
} from './industry-ai-pattern';
import { CANONICAL_INDUSTRY_AI_PATTERN_REQUIRED_FIELDS } from './industry-ai-pattern';
import {
  normalizeConfidenceLevel,
  normalizeEnterpriseArea,
  normalizeFunction,
  normalizeIndustry,
  normalizeProcessArea,
  normalizeUseCaseCategory,
} from './normalizers';
import type { PatternManifestEntry } from '@/lib/intelligence/pattern-manifest';
import type { PatternSeed } from '@/lib/intelligence/seed-types';

export interface PatternPackRow {
  id?: string | number | null;
  code?: string | null;
  pattern_id?: string | null;
  title?: string | null;
  name?: string | null;
  pattern_name?: string | null;
  category?: string | null;
  sector_applicability?: unknown;
  trigger_symptoms?: unknown;
  detection_signals?: unknown;
  evidence_requirements?: unknown;
  intervention_options?: unknown;
  anti_patterns?: unknown;
  common_failure_modes?: unknown;
  phase_1_deliverables?: unknown;
  phase_2_deliverables?: unknown;
  phase_3_deliverables?: unknown;
  phase_4_deliverables?: unknown;
  expected_time_to_value?: string | null;
  success_metrics?: unknown;
  leading_indicators?: unknown;
  confidence_level?: string | null;
  source_id?: string | null;
  as_of_date?: string | null;
  last_verified_at?: string | null;
  raw_markdown?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface GenomePatternRow {
  id?: string | number | null;
  code?: string | null;
  name?: string | null;
  title?: string | null;
  description?: string | null;
  summary?: string | null;
  industry?: string | string[] | null;
  vertical?: string | string[] | null;
  office_category?: string | null;
  tags?: string[] | string | null;
  keywords?: string[] | string | null;
  failure_rate_pct?: number | null;
}

type DraftSourceInput = Pick<
  IndustryAIPatternDraft,
  | 'canonical_id'
  | 'title'
  | 'summary'
  | 'source_crosswalk'
  | 'source_systems'
  | 'source_ids'
  | 'version'
  | 'lifecycle_status'
  | 'industry'
  | 'enterprise_area'
  | 'function'
  | 'process_area'
  | 'use_case_category'
  | 'strategic_move_phases'
  | 'confidence_level'
  | 'business_problem'
  | 'value_hypothesis'
  | 'time_to_value_band'
  | 'common_failure_modes'
  | 'anti_patterns'
  | 'intervention_options'
  | 'recommended_artifacts'
  | 'gate_evidence_required'
  | 'source_basis'
  | 'source_references'
  | 'confidence_rationale'
  | 'quantitative_claims'
  | 'unsupported_claim_flags'
>;

const PHASES_BY_PATTERN_PACK_DELIVERABLE_FIELD: Array<[keyof PatternPackRow, CanonicalStrategicMovePhase]> = [
  ['phase_1_deliverables', 'charter'],
  ['phase_2_deliverables', 'diagnose_discover'],
  ['phase_3_deliverables', 'design'],
  ['phase_4_deliverables', 'roadmap_business_case_change_value_plan'],
];

function nonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function sourceIdFrom(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number') return String(value);
  }

  return 'unknown';
}

function arrayFromUnknown(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap(arrayFromUnknown);
  }

  if (typeof value === 'string') {
    return value
      .split(/\n|[,;|]/g)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function lifecycleFromPatternStatus(status: string | null | undefined): CanonicalLifecycleStatus | undefined {
  if (!status) return undefined;
  const normalized = status.toLowerCase();
  if (normalized.includes('expert') || normalized.includes('reviewed')) return 'reviewed';
  if (normalized.includes('validated')) return 'validated';
  if (normalized.includes('deprecated')) return 'deprecated';
  if (normalized.includes('draft') || normalized.includes('authored') || normalized.includes('proposed')) return 'draft';
  return undefined;
}

function firstValue<T extends string>(values: readonly T[]): T | undefined {
  return values[0];
}

function titleSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 72);
}

function canonicalId(sourceSystem: CanonicalPatternSourceSystem, sourceId: string, title: string, industries: CanonicalIndustry[] | undefined): string {
  const industry = industries?.find((value) => value !== 'other') ?? industries?.[0] ?? 'other';
  return `AIP-${industry.toUpperCase().replace(/_/g, '-')}-${titleSlug(title || sourceId).toUpperCase() || sourceSystem.toUpperCase()}`;
}

function crosswalk(
  sourceSystem: CanonicalPatternSourceSystem,
  sourceId: string,
  sourcePath?: string,
): CanonicalSourceCrosswalkEntry[] {
  return [{
    source_system: sourceSystem,
    source_id: sourceId,
    source_path: sourcePath,
    relationship: 'primary',
  }];
}

function sourceReferencesFromDocuments(documents: readonly string[] | undefined): CanonicalSourceReference[] | undefined {
  if (!documents || documents.length === 0) return undefined;
  return documents.map((label) => ({ label }));
}

function sourceReferenceFromPath(sourcePath: string | undefined, label: string): CanonicalSourceReference[] | undefined {
  if (!sourcePath) return undefined;
  return [{ label, source_path: sourcePath }];
}

function hasValue(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'string') return value.trim().length > 0;
  return value !== null && value !== undefined;
}

function missingRequiredFields(draft: Partial<IndustryAIPattern>): (keyof IndustryAIPattern)[] {
  return CANONICAL_INDUSTRY_AI_PATTERN_REQUIRED_FIELDS.filter((field) => !hasValue(draft[field]));
}

function buildDraft(input: DraftSourceInput): IndustryAIPatternDraft {
  const missing = missingRequiredFields(input);
  const missingProvenance = !input.source_basis || !input.confidence_rationale;

  return {
    ...input,
    source_references: input.source_references ?? [],
    quantitative_claims: input.quantitative_claims ?? [],
    unsupported_claim_flags: input.unsupported_claim_flags ?? [],
    missing_required_fields: missing,
    missing_provenance: missingProvenance,
  };
}

export function fromPatternSeed(pattern: PatternSeed): IndustryAIPatternDraft {
  const industry = normalizeIndustry(pattern.vertical).values;
  const confidence = firstValue(normalizeConfidenceLevel(pattern.confidence).values);
  const sourceReferences = sourceReferencesFromDocuments(pattern.sourceDocuments);

  return buildDraft({
    canonical_id: canonicalId('pattern_seed', pattern.id, pattern.title, industry),
    title: pattern.title,
    summary: pattern.thesis,
    source_crosswalk: crosswalk('pattern_seed', pattern.id, `src/lib/intelligence/${pattern.createdFrom}`),
    source_systems: ['pattern_seed'],
    source_ids: [pattern.id],
    version: pattern.version,
    lifecycle_status: lifecycleFromPatternStatus(pattern.status),
    industry,
    function: firstValue(normalizeFunction(pattern.domain).values),
    process_area: firstValue(normalizeProcessArea(pattern.category ?? pattern.domain).values),
    use_case_category: firstValue(normalizeUseCaseCategory(pattern.kind ?? pattern.domain).values),
    confidence_level: confidence,
    business_problem: pattern.applicability,
    value_hypothesis: pattern.thesis,
    common_failure_modes: pattern.taggedContradictionIds,
    intervention_options: pattern.riskFactors?.flatMap((risk) => risk.mitigations),
    source_references: sourceReferences,
    quantitative_claims: [],
    unsupported_claim_flags: [],
  });
}

export function fromManifestEntry(pattern: PatternManifestEntry): IndustryAIPatternDraft {
  const industry = pattern.crossIndustry
    ? (['cross_industry'] satisfies CanonicalIndustry[])
    : normalizeIndustry(pattern.sectorApplicability).values;
  const confidence = firstValue(normalizeConfidenceLevel(pattern.confidenceFloor).values);
  const sourceReferences = sourceReferenceFromPath(pattern.sourceFile, pattern.name);

  return buildDraft({
    canonical_id: canonicalId('generated_pattern_manifest', pattern.id, pattern.name, industry),
    title: pattern.name,
    summary: pattern.shortDescription ?? pattern.longDescription ?? pattern.name,
    source_crosswalk: crosswalk('generated_pattern_manifest', pattern.id, pattern.sourceFile),
    source_systems: ['generated_pattern_manifest'],
    source_ids: [pattern.id],
    version: pattern.version ?? undefined,
    lifecycle_status: lifecycleFromPatternStatus(pattern.status),
    industry,
    function: firstValue(normalizeFunction(pattern.category).values),
    process_area: firstValue(normalizeProcessArea(pattern.category).values),
    use_case_category: firstValue(normalizeUseCaseCategory(pattern.category).values),
    confidence_level: confidence,
    business_problem: pattern.longDescription ?? pattern.shortDescription ?? undefined,
    common_failure_modes: [...pattern.triggerSymptoms, ...pattern.detectionSignals],
    intervention_options: pattern.interventions,
    gate_evidence_required: pattern.evidenceRequirements,
    source_basis: 'internal_pattern',
    source_references: sourceReferences,
    confidence_rationale: confidence ? `Manifest confidence floor ${pattern.confidenceFloor} mapped to ${confidence}.` : undefined,
    quantitative_claims: [],
    unsupported_claim_flags: [],
  });
}

export function fromPatternPackRow(row: PatternPackRow): IndustryAIPatternDraft {
  const sourceId = sourceIdFrom(row.code, row.pattern_id, row.id);
  const title = nonEmptyString(row.title) ?? nonEmptyString(row.name) ?? nonEmptyString(row.pattern_name) ?? nonEmptyString(row.category) ?? sourceId;
  const industry = normalizeIndustry(row.sector_applicability ?? row.metadata?.industry ?? row.metadata?.vertical).values;
  const enterpriseArea = firstValue(normalizeEnterpriseArea(row.metadata?.enterprise_area ?? row.metadata?.office_category).values);
  const confidence = firstValue(normalizeConfidenceLevel(row.confidence_level).values);
  const phases = PHASES_BY_PATTERN_PACK_DELIVERABLE_FIELD
    .filter(([field]) => arrayFromUnknown(row[field]).length > 0)
    .map(([, phase]) => phase);

  return buildDraft({
    canonical_id: canonicalId('pattern_packs', sourceId, title, industry),
    title,
    summary: nonEmptyString(row.raw_markdown)?.slice(0, 500) ?? title,
    source_crosswalk: crosswalk('pattern_packs', sourceId),
    source_systems: ['pattern_packs'],
    source_ids: [sourceId],
    industry,
    enterprise_area: enterpriseArea,
    function: firstValue(normalizeFunction(row.category).values),
    process_area: firstValue(normalizeProcessArea(row.category).values),
    use_case_category: firstValue(normalizeUseCaseCategory(row.category).values),
    strategic_move_phases: phases,
    confidence_level: confidence,
    time_to_value_band: nonEmptyString(row.expected_time_to_value),
    common_failure_modes: arrayFromUnknown(row.common_failure_modes),
    anti_patterns: arrayFromUnknown(row.anti_patterns),
    intervention_options: arrayFromUnknown(row.intervention_options),
    recommended_artifacts: PHASES_BY_PATTERN_PACK_DELIVERABLE_FIELD.flatMap(([field]) => arrayFromUnknown(row[field])),
    gate_evidence_required: arrayFromUnknown(row.evidence_requirements),
    source_basis: row.source_id ? 'internal_pattern' : undefined,
    source_references: row.source_id ? [{
      label: row.source_id,
      source_id: row.source_id,
      as_of_date: row.as_of_date ?? undefined,
      last_verified_at: row.last_verified_at ?? undefined,
    }] : undefined,
    confidence_rationale: confidence ? `Pattern pack confidence_level mapped to ${confidence}.` : undefined,
    quantitative_claims: [],
    unsupported_claim_flags: [],
  });
}

export function fromGenomePatternRow(row: GenomePatternRow): IndustryAIPatternDraft {
  const sourceId = sourceIdFrom(row.code, row.id);
  const title = nonEmptyString(row.name) ?? nonEmptyString(row.title) ?? sourceId;
  const industry = normalizeIndustry(row.industry ?? row.vertical ?? row.tags).values;
  const enterpriseArea = firstValue(normalizeEnterpriseArea(row.office_category).values);
  const tags = [...arrayFromUnknown(row.tags), ...arrayFromUnknown(row.keywords)];

  return buildDraft({
    canonical_id: canonicalId('genome_patterns', sourceId, title, industry),
    title,
    summary: nonEmptyString(row.summary) ?? nonEmptyString(row.description) ?? title,
    source_crosswalk: crosswalk('genome_patterns', sourceId),
    source_systems: ['genome_patterns'],
    source_ids: [sourceId],
    industry,
    enterprise_area: enterpriseArea,
    function: firstValue(normalizeFunction(tags[0]).values),
    process_area: firstValue(normalizeProcessArea(tags[1]).values),
    use_case_category: firstValue(normalizeUseCaseCategory(tags[2]).values),
    common_failure_modes: row.failure_rate_pct === null || row.failure_rate_pct === undefined ? undefined : [title],
    source_references: [],
    quantitative_claims: row.failure_rate_pct === null || row.failure_rate_pct === undefined ? [] : [{
      claim: `failure_rate_pct=${row.failure_rate_pct}`,
      metric: 'failure_rate_pct',
      value: String(row.failure_rate_pct),
      confidence_level: 'low',
      caveat: 'Source row provided failure_rate_pct; source reference must be attached before external use.',
    }],
    unsupported_claim_flags: row.failure_rate_pct === null || row.failure_rate_pct === undefined ? [] : [{
      claim: `failure_rate_pct=${row.failure_rate_pct}`,
      reason: 'Genome row supplied a quantitative field without a structured source reference in the row fixture.',
      recommended_action: 'source_required',
    }],
  });
}

export function isMissingProvenance(draft: IndustryAIPatternDraft): boolean {
  return draft.missing_provenance;
}

export function missingFieldNames(draft: IndustryAIPatternDraft): string[] {
  return draft.missing_required_fields.map(String);
}

export function sourceBasisOrUnknown(draft: IndustryAIPatternDraft): CanonicalSourceBasis | 'missing' {
  return draft.source_basis ?? 'missing';
}

export function enterpriseAreaOrUndefined(draft: IndustryAIPatternDraft): CanonicalEnterpriseArea | undefined {
  return draft.enterprise_area;
}

export function confidenceOrUndefined(draft: IndustryAIPatternDraft): CanonicalConfidenceLevel | undefined {
  return draft.confidence_level;
}
