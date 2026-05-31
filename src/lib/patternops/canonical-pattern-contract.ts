export type PatternOpsLifecycleStatus = 'draft' | 'reviewed' | 'trusted' | 'retired' | 'superseded';

export type PatternOpsConfidenceTier = 'low' | 'medium' | 'high' | 'trusted';

export type PatternOpsEvidenceClass =
  | 'client_fact'
  | 'pattern_backed'
  | 'benchmark_backed'
  | 'inference'
  | 'missing_evidence';

export type PatternOpsEnterpriseArea =
  | 'front_office'
  | 'middle_office'
  | 'back_office'
  | 'enterprise';

export type PatternOpsPhase =
  | 'originate'
  | 'charter'
  | 'diagnose_discover'
  | 'design'
  | 'roadmap_business_case'
  | 'mobilize'
  | 'handoff';

export type PatternOpsSourceType =
  | 'genome_pattern'
  | 'canonical_pattern'
  | 'corpus_pattern'
  | 'tenant_move'
  | 'artifact'
  | 'benchmark'
  | 'external_source'
  | 'human_review';

export interface PatternOpsSourceBasis {
  sourceType: PatternOpsSourceType;
  sourceId: string;
  label: string;
  evidenceClass: PatternOpsEvidenceClass;
  confidence: PatternOpsConfidenceTier;
  reviewedAt?: string;
  reviewer?: string;
  url?: string;
}

export interface CanonicalPatternOpsPattern {
  canonicalPatternId: string;
  sourcePatternIds: string[];
  title: string;
  summary: string;
  industry: string;
  enterpriseArea: PatternOpsEnterpriseArea;
  function: string;
  processArea: string;
  useCase: string;
  aiAgenticArchitecturePattern: string;
  humanRole: string;
  agentRole: string;
  dataRequirements: string[];
  kpis: string[];
  valueLevers: string[];
  failureModes: string[];
  guardrails: string[];
  artifacts: string[];
  workshops: string[];
  applicablePhases: PatternOpsPhase[];
  sourceBasis: PatternOpsSourceBasis[];
  confidence: PatternOpsConfidenceTier;
  lastReviewedAt: string | null;
  owner: string;
  lifecycleStatus: PatternOpsLifecycleStatus;
  coverageTags: string[];
  retrievalPriority: number;
  supersedesPatternIds?: string[];
  supersededByPatternId?: string;
}

export interface PatternOpsCrosswalkEntry {
  sourcePatternId: string;
  canonicalPatternId: string;
  sourceType: PatternOpsSourceType;
  sourcePath?: string;
  duplicateRisk: 'none' | 'possible' | 'likely';
  confidence: PatternOpsConfidenceTier;
  owner: string;
  notes?: string;
}

export interface PatternOpsGroundingBasis {
  clientFacts: number;
  industryPatterns: number;
  priorMovePatterns: number;
  benchmarks: number;
  evidenceArtifacts: number;
  confidence: PatternOpsConfidenceTier;
  missingInputs: string[];
}

export const PATTERNOPS_PROMOTION_STATES: readonly PatternOpsLifecycleStatus[] = [
  'draft',
  'reviewed',
  'trusted',
  'retired',
  'superseded',
] as const;

export const PATTERNOPS_RETRIEVAL_ORDER = [
  'move_context',
  'client_facts_and_evidence',
  'phase_pack',
  'industry_function_use_case_patterns',
  'cross_industry_analogs',
  'architecture_patterns',
  'failure_modes_and_anti_patterns',
  'required_artifact_templates',
  'missing_inputs_and_confidence',
] as const;

export type PatternOpsRetrievalLane = (typeof PATTERNOPS_RETRIEVAL_ORDER)[number];

const TRUSTED_STATUSES = new Set<PatternOpsLifecycleStatus>(['reviewed', 'trusted']);
const TRUSTED_CONFIDENCE = new Set<PatternOpsConfidenceTier>(['high', 'trusted']);

export function patternOpsCoverageKey(input: {
  industry: string;
  enterpriseArea: PatternOpsEnterpriseArea;
  function: string;
  processArea?: string;
  useCase?: string;
}): string {
  return [
    input.industry,
    input.enterpriseArea,
    input.function,
    input.processArea || 'any_process',
    input.useCase || 'any_use_case',
  ]
    .map((part) => part.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, ''))
    .join(':');
}

export function isTrustedPatternOpsPattern(pattern: CanonicalPatternOpsPattern): boolean {
  return (
    TRUSTED_STATUSES.has(pattern.lifecycleStatus) &&
    TRUSTED_CONFIDENCE.has(pattern.confidence) &&
    pattern.sourceBasis.length > 0 &&
    pattern.dataRequirements.length > 0 &&
    pattern.failureModes.length > 0 &&
    pattern.artifacts.length > 0 &&
    pattern.applicablePhases.length > 0 &&
    pattern.lastReviewedAt !== null
  );
}

export function summarizeGroundingBasis(basis: PatternOpsGroundingBasis): string {
  const used = [
    `${basis.clientFacts} client facts`,
    `${basis.industryPatterns} industry patterns`,
    `${basis.priorMovePatterns} prior move patterns`,
    `${basis.benchmarks} benchmarks`,
    `${basis.evidenceArtifacts} evidence artifacts`,
  ].join(', ');
  const missing = basis.missingInputs.length > 0 ? ` Missing inputs: ${basis.missingInputs.join('; ')}.` : '';
  return `Grounding basis: ${used}. Confidence: ${basis.confidence}.${missing}`;
}
