import type {
  CanonicalIndustry,
  CanonicalStrategicMovePhase,
  IndustryAIPattern,
} from '@/lib/intelligence/canonical/industry-ai-pattern';
import {
  buildAgentGroundingDisclosure,
  formatUnsupportedClaimFlag,
  type AgentGroundingDisclosure,
} from '@/lib/intelligence/canonical/agent-grounding-disclosure';
import type {
  CanonicalPatternIndexHit,
  CanonicalPatternIndexResult,
} from '@/lib/intelligence/canonical/runtime-pattern-index';
import type {
  PatternApplicableProgram,
  PatternManifestEntry,
} from '@/lib/intelligence/pattern-manifest';
import type {
  SentinelGroundingGap,
  SentinelGroundingGapSeverity,
  SentinelGroundingGapType,
  SentinelGroundingSummary,
} from '@/lib/sentinel/types';

export interface SentinelGroundingPatternInput {
  pattern: PatternManifestEntry;
  applicablePrograms: PatternApplicableProgram[];
}

export interface BuildSentinelGroundingSummaryArgs {
  canonicalResult: CanonicalPatternIndexResult;
  rankedPatterns: SentinelGroundingPatternInput[];
  tenantKey: string;
}

const KPI_FIELDS: Array<keyof IndustryAIPattern> = [
  'primary_kpis',
  'baseline_needed',
  'measurement_method',
  'value_levers',
];

const ARTIFACT_FIELDS: Array<keyof IndustryAIPattern> = [
  'recommended_artifacts',
  'gate_evidence_required',
  'entry_criteria',
  'exit_criteria',
];

const GUARDRAIL_FIELDS: Array<keyof IndustryAIPattern> = [
  'responsible_ai_guardrails',
  'autonomous_agent_action_boundaries',
  'escalation_points',
];

const FAILURE_MODE_FIELDS: Array<keyof IndustryAIPattern> = [
  'common_failure_modes',
  'failure_mode_mitigations',
  'anti_patterns',
  'intervention_options',
];

const PHASE_BY_PROGRAM_SPEC: Record<number, CanonicalStrategicMovePhase> = {
  1: 'originate',
  2: 'charter',
  3: 'diagnose_discover',
  4: 'design',
  5: 'roadmap_business_case_change_value_plan',
  6: 'mobilize_handoff',
};

export function normalizeCanonicalIndustry(
  industryCode: string | null | undefined,
): CanonicalIndustry | undefined {
  if (!industryCode) return undefined;
  const normalized = industryCode.trim().toLowerCase().replace(/-/g, '_');
  if (normalized === 'health' || normalized === 'healthcare_idn' || normalized === 'hc') return 'healthcare_provider';
  if (
    normalized === 'healthcare_medtech'
    || normalized === 'medtech'
    || normalized === 'medical_device'
    || normalized === 'clinical_technologies'
  ) return 'healthcare_medtech';
  if (normalized === 'retail_omni' || normalized === 'retail_cpg') return 'retail';
  if (normalized === 'finserv' || normalized === 'finance' || normalized === 'banking') return 'financial_services_banking';
  if (normalized === 'cross_sector' || normalized === 'cross_industry') return 'cross_industry';
  if (
    normalized === 'retail'
    || normalized === 'healthcare'
    || normalized === 'healthcare_provider'
    || normalized === 'healthcare_medtech'
    || normalized === 'financial_services'
    || normalized === 'financial_services_banking'
    || normalized === 'airline'
    || normalized === 'energy'
    || normalized === 'public_sector'
  ) {
    return normalized;
  }
  return 'other';
}

export function buildSentinelGroundingSummary(
  args: BuildSentinelGroundingSummaryArgs,
): SentinelGroundingSummary {
  const canonicalGaps = args.canonicalResult.patterns.flatMap((pattern) =>
    canonicalPatternGaps(pattern, args.tenantKey, args.rankedPatterns),
  );
  const manifestGaps = args.rankedPatterns.flatMap((ranked) => manifestPatternGaps(ranked));
  const indexGaps = canonicalIndexGaps(args.canonicalResult);

  return {
    source: 'canonical_pattern_index',
    status: args.canonicalResult.status,
    checkedPatternCount: args.canonicalResult.patterns.length,
    canonicalPatternIds: args.canonicalResult.patterns.map((pattern) => pattern.canonical_id),
    warnings: args.canonicalResult.warnings,
    gaps: dedupeGaps([...indexGaps, ...canonicalGaps, ...manifestGaps]),
  };
}

export function buildSentinelGroundingDisclosure(
  canonicalResult: CanonicalPatternIndexResult,
): AgentGroundingDisclosure {
  return buildAgentGroundingDisclosure({
    source: canonicalResult.source,
    status: canonicalResult.status,
    warnings: canonicalResult.warnings,
    patterns: canonicalResult.patterns.map((pattern) => ({
      canonicalId: pattern.canonical_id,
      title: pattern.title,
      sourceBasis: pattern.source_basis,
      confidenceLevel: pattern.confidence_level,
      confidenceRationale: pattern.confidence_rationale,
      sourceReferenceCount: pattern.source_references.length,
      missingRequiredFields: pattern.missing_required_fields.map(String),
      missingProvenance: pattern.missing_provenance,
      unsupportedClaimFlags: pattern.unsupported_claim_flags.map(formatUnsupportedClaimFlag),
      quantitativeClaimCount: pattern.quantitative_claims.length,
      matchReasons: pattern.match_reasons,
    })),
  });
}

export function formatGroundingFlagText(summary: SentinelGroundingSummary): string | null {
  const materialGaps = summary.gaps
    .filter((gap) => gap.severity !== 'info')
    .slice(0, 3);

  if (materialGaps.length === 0) return null;

  const labels = materialGaps.map((gap) => gap.detail.replace(/\.$/, ''));
  return `Grounding check: ${labels.join('; ')}.`;
}

function canonicalIndexGaps(result: CanonicalPatternIndexResult): SentinelGroundingGap[] {
  if (result.status === 'error') {
    return [gap({
      type: 'canonical_index_unavailable',
      severity: 'warning',
      source: 'canonical_pattern_index',
      patternId: null,
      patternLabel: null,
      detail: 'Canonical pattern index was unavailable, so Sentinel cannot complete canonical grounding checks for this turn.',
      missing: result.error ? [result.error] : [],
    })];
  }

  if (result.status === 'empty' || result.status === 'no_match') {
    return [gap({
      type: 'canonical_pattern_no_match',
      severity: 'warning',
      source: 'canonical_pattern_index',
      patternId: null,
      patternLabel: null,
      detail: 'No canonical pattern matched the Sentinel turn, so any pattern recommendation remains ungrounded until the corpus supplies a match.',
      missing: result.warnings,
    })];
  }

  return [];
}

function canonicalPatternGaps(
  pattern: CanonicalPatternIndexHit,
  tenantKey: string,
  rankedPatterns: SentinelGroundingPatternInput[],
): SentinelGroundingGap[] {
  const gaps: SentinelGroundingGap[] = [];

  if (pattern.missing_provenance || pattern.source_references.length === 0 || pattern.unsupported_claim_flags.length > 0) {
    gaps.push(gap({
      type: 'pattern_to_evidence_gap',
      severity: pattern.unsupported_claim_flags.length > 0 ? 'critical' : 'warning',
      source: 'canonical_pattern_index',
      patternId: pattern.canonical_id,
      patternLabel: pattern.title,
      detail: `${pattern.title} has a pattern-to-evidence gap in the canonical corpus.`,
      missing: [
        ...(pattern.missing_provenance ? ['provenance'] : []),
        ...(pattern.source_references.length === 0 ? ['source_references'] : []),
        ...pattern.unsupported_claim_flags.map((flag) => `unsupported_claim:${flag.claim}`),
      ],
    }));
  }

  gaps.push(...missingFieldGap(pattern, 'kpi_gap', 'warning', KPI_FIELDS, 'KPI and measurement fields'));
  gaps.push(...missingFieldGap(pattern, 'artifact_gap', 'warning', ARTIFACT_FIELDS, 'artifact and gate-evidence fields'));
  gaps.push(...missingFieldGap(pattern, 'guardrail_gap', 'warning', GUARDRAIL_FIELDS, 'responsible-AI guardrail fields'));
  gaps.push(...missingFieldGap(pattern, 'failure_mode_gap', 'warning', FAILURE_MODE_FIELDS, 'failure-mode fields'));

  const requiredPhases = tenantPhases(rankedPatterns);
  const missingPhases = requiredPhases.filter((phase) => !pattern.strategic_move_phases.includes(phase));
  if (missingPhases.length > 0) {
    gaps.push(gap({
      type: 'phase_requirement_gap',
      severity: 'warning',
      source: 'canonical_pattern_index',
      patternId: pattern.canonical_id,
      patternLabel: pattern.title,
      detail: `${pattern.title} does not cover the tenant phase requirement Sentinel is applying.`,
      missing: missingPhases,
    }));
  }

  if (pattern.source_basis !== 'tenant_evidence') {
    gaps.push(gap({
      type: 'tenant_pattern_assumption_gap',
      severity: hasTenantProgramSupport(rankedPatterns) ? 'info' : 'warning',
      source: 'canonical_pattern_index',
      patternId: pattern.canonical_id,
      patternLabel: pattern.title,
      detail: `${pattern.title} is not grounded in tenant evidence for ${tenantKey}; tenant applicability is an assumption until tenant artifacts support it.`,
      missing: ['tenant_evidence'],
    }));
  }

  return gaps;
}

function manifestPatternGaps(ranked: SentinelGroundingPatternInput): SentinelGroundingGap[] {
  const gaps: SentinelGroundingGap[] = [];
  const { pattern, applicablePrograms } = ranked;

  if (pattern.evidenceCount <= 0 || pattern.evidenceRequirements.length === 0) {
    gaps.push(gap({
      type: 'pattern_to_evidence_gap',
      severity: 'warning',
      source: 'pattern_manifest',
      patternId: pattern.slug,
      patternLabel: pattern.name,
      detail: `${pattern.name} lacks manifest evidence or explicit evidence requirements.`,
      missing: [
        ...(pattern.evidenceCount <= 0 ? ['browsable_evidence'] : []),
        ...(pattern.evidenceRequirements.length === 0 ? ['evidence_requirements'] : []),
      ],
    }));
  }

  if (applicablePrograms.length === 0) {
    gaps.push(gap({
      type: 'tenant_pattern_assumption_gap',
      severity: 'warning',
      source: 'tenant_program_map',
      patternId: pattern.slug,
      patternLabel: pattern.name,
      detail: `${pattern.name} is ranked for the tenant but has no tenant program mapping.`,
      missing: ['tenant_program_mapping'],
    }));
  }

  const deliverableCount = applicablePrograms.reduce((sum, program) => sum + program.deliverables.length, 0);
  if (applicablePrograms.length > 0 && deliverableCount === 0) {
    gaps.push(gap({
      type: 'artifact_gap',
      severity: 'warning',
      source: 'tenant_program_map',
      patternId: pattern.slug,
      patternLabel: pattern.name,
      detail: `${pattern.name} is mapped to tenant programs but has no tenant artifacts to evidence it.`,
      missing: ['tenant_artifacts'],
    }));
  }

  return gaps;
}

function missingFieldGap(
  pattern: CanonicalPatternIndexHit,
  type: SentinelGroundingGapType,
  severity: SentinelGroundingGapSeverity,
  fields: Array<keyof IndustryAIPattern>,
  label: string,
): SentinelGroundingGap[] {
  const missing = pattern.missing_required_fields.filter((field) => fields.includes(field));
  if (missing.length === 0) return [];
  return [gap({
    type,
    severity,
    source: 'canonical_pattern_index',
    patternId: pattern.canonical_id,
    patternLabel: pattern.title,
    detail: `${pattern.title} is missing canonical ${label}.`,
    missing,
  })];
}

function tenantPhases(rankedPatterns: SentinelGroundingPatternInput[]): CanonicalStrategicMovePhase[] {
  const phases = rankedPatterns.flatMap(({ applicablePrograms }) =>
    applicablePrograms
      .map((program) => PHASE_BY_PROGRAM_SPEC[program.currentPhaseSpec])
      .filter((phase): phase is CanonicalStrategicMovePhase => Boolean(phase)),
  );
  return Array.from(new Set(phases));
}

function hasTenantProgramSupport(rankedPatterns: SentinelGroundingPatternInput[]): boolean {
  return rankedPatterns.some((ranked) => ranked.applicablePrograms.length > 0);
}

function dedupeGaps(gaps: SentinelGroundingGap[]): SentinelGroundingGap[] {
  const seen = new Set<string>();
  return gaps.filter((item) => {
    const key = [
      item.type,
      item.source,
      item.patternId ?? '',
      item.missing.join('|'),
    ].join('::');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function gap(input: SentinelGroundingGap): SentinelGroundingGap {
  return input;
}
