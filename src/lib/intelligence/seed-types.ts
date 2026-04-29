export type PatternDomain =
  | 'meta'
  | 'sourcing'
  | 'cdp'
  | 'ai_programs'
  | 'architecture'
  | 'industry_specific'
  | 'compliance'
  | 'future_of_work';

export type PatternTier = 'M' | 'authoritative' | 'validated';

export type PatternStatus =
  | 'AUTHORED-DRAFT'
  | 'AUTHORED-REVIEWED'
  | 'AUTHORED-EXPERT'
  | 'IN-AUTHORING'
  | 'COMMISSIONED'
  | 'PROPOSED';

export type PatternCreatedFrom = 'human_authored' | 'deterministic_seed';

export type SourcingCategory =
  | 'enterprise_saas'
  | 'data_analytics'
  | 'ai_ml'
  | 'security_identity'
  | 'infrastructure'
  | 'customer_facing'
  | 'services'
  | 'hardware_capital'
  | 'contract_intelligence'
  | 'pricing_intelligence'
  | 'process_methodology'
  | 'industry_overlay'
  | 'regulatory_compliance'
  | 'risk';

export type VendorClass =
  | 'direct-tech'
  | 'service'
  | 'hardware'
  | 'professional-services';

export type VendorLandscapeTier = 'enterprise' | 'mid-market' | 'specialist' | 'emerging' | 'incumbent';
export type PricingModel = 'subscription' | 'usage-based' | 'perpetual' | 'hybrid' | 'time-and-materials' | 'fixed-fee' | 'outcome-based' | 'unknown';
export type RiskSeverity = 'low' | 'medium' | 'high' | 'critical';
export type SourceBasisType = 'public-disclosure' | 'analyst-report' | 'regulatory-document' | 'trade-publication' | 'industry-consortium' | 'abarva-observed' | 'founder-data-gap';
export type IndustryVariantKey =
  | 'healthcare'
  | 'financial_services'
  | 'retail_cpg'
  | 'manufacturing'
  | 'energy_utilities'
  | 'public_sector'
  | 'higher_education'
  | 'telecommunications'
  | 'insurance'
  | 'cross_industry';

export interface SourceBasisRef {
  type: SourceBasisType;
  label: string;
  url?: string;
  asOf?: string;
  note?: string;
}

export interface VendorLandscapeEntry {
  vendorName: string;
  tier: VendorLandscapeTier;
  positioning: string;
  strengths?: string[];
  cautions?: string[];
  sourceBasis?: SourceBasisRef[];
}

export interface PricingBenchmark {
  label: string;
  model: PricingModel;
  metric?: string;
  unit?: string;
  currency?: string;
  rangeLow?: number;
  rangeHigh?: number;
  median?: number;
  sourceBasis: SourceBasisRef[];
  confidence: number;
  notes?: string;
}

export interface ContractClauseTemplate {
  clauseArea: string;
  buyerPosition: string;
  fallbackPosition?: string;
  vendorPosition?: string;
  walkawayTriggers?: string[];
  sourceBasis?: SourceBasisRef[];
}

export interface NegotiationLever {
  lever: string;
  whenToUse: string;
  buyerAsk: string;
  vendorGive?: string;
  tradeoffs?: string[];
  evidenceBasis?: SourceBasisRef[];
}

export interface RiskFactor {
  id: string;
  label: string;
  severity: RiskSeverity;
  detectionSignals: string[];
  mitigations: string[];
  contractualRemedies?: string[];
  sourceBasis?: SourceBasisRef[];
}

export interface IndustryVariant {
  industry: IndustryVariantKey;
  modifier: string;
  additionalRequirements?: string[];
  regulatoryRefs?: string[];
  affectedStages?: StageId[];
}

/** Distinguishes knowledge patterns (reusable insights) from lifecycle patterns (typed procurement lifecycles). */
export type PatternKind = 'knowledge' | 'lifecycle';

/** Branded pattern IDs for typed source lifecycle patterns. */
export type SourceEventPatternId =
  | 'PAT-SRC-AMS-001'
  | 'PAT-SRC-RFP-001'
  | 'PAT-SRC-SOLE-001'
  | 'PAT-SRC-FRAMEWORK-001'
  | 'PAT-SRC-RENEWAL-001'
  | 'PAT-SRC-DECOM-001'
  | 'PAT-SRC-EMERGENCY-001'
  // Category patterns — 12 PAT-SRC-CAT lifecycle wrappers
  | 'PAT-SRC-CAT-CDW-001'
  | 'PAT-SRC-CAT-CDP-001'
  | 'PAT-SRC-CAT-LAKE-001'
  | 'PAT-SRC-CAT-ERP-001'
  | 'PAT-SRC-CAT-CRM-001'
  | 'PAT-SRC-CAT-HCM-001'
  | 'PAT-SRC-CAT-IAM-001'
  | 'PAT-SRC-CAT-ITSM-001'
  | 'PAT-SRC-CAT-BI-001'
  | 'PAT-SRC-CAT-LLM-001'
  | 'PAT-SRC-CAT-AGENT-001'
  | 'PAT-SRC-CAT-FINOPS-001';

/**
 * Branded pattern IDs for typed program lifecycle patterns.
 *
 * Mirrors the union exported from `@/lib/programs/program-instance` but is
 * declared locally here to avoid a circular dependency: program-instance.ts
 * imports from `@/lib/reasoning`, which transitively reaches the intelligence
 * layer. Keeping this declaration local keeps the seed-types module pure.
 */
export type ProgramLifecyclePatternId =
  | 'PAT-PRG-CDP-001'
  | 'PAT-PRG-AI-CODING-001'
  | 'PAT-PRG-COPILOT-001'
  | 'PAT-PRG-LOYALTY-001'
  | 'PAT-PRG-CC-AI-001'
  | 'PAT-PRG-DATA-FAB-001';

/** Either universe of lifecycle pattern IDs (source-events or programs). */
export type LifecyclePatternId = SourceEventPatternId | ProgramLifecyclePatternId;

/** Identifies a discrete phase within a lifecycle pattern. */
export type StageId = string; // e.g. 'Plan', 'RFI', 'BAFO'

export interface LifecycleStage {
  id: StageId;
  label: string;
  description: string;
  order: number;
}

export type GateType = 'hard' | 'soft';

export interface GateCriterion {
  id: string;
  description: string;
  gateType: GateType;
  /** Which stage this criterion guards entry to. */
  stageId: StageId;
  /** Human-readable evaluation hint — what evidence satisfies this criterion. */
  evaluationHint: string;
}

export type ArtifactRequirement = 'required' | 'recommended' | 'optional';

export interface ExpectedArtifact {
  id: string;
  label: string;
  stageId: StageId;
  requirement: ArtifactRequirement;
  /** hard = must exist before stage advance; soft = best-effort. */
  gateType: GateType;
  description: string;
}

export type PerStageGates = Partial<Record<StageId, GateCriterion[]>>;
export type PerStageArtifacts = Partial<Record<StageId, ExpectedArtifact[]>>;

export interface SourcingPatternExtensions {
  /** Category metadata for sourcing corpus patterns. */
  category?: SourcingCategory;
  vendorClass?: VendorClass;

  /** Lifecycle structure for category, process, contract, or risk patterns. */
  lifecycleStages?: LifecycleStage[];
  perStageGateCriteria?: PerStageGates;
  perStageExpectedArtifacts?: PerStageArtifacts;

  /** Market, pricing, contract, risk, and industry-specific knowledge. */
  vendorLandscape?: VendorLandscapeEntry[];
  pricingBenchmarks?: PricingBenchmark[];
  standardClauses?: ContractClauseTemplate[];
  negotiationLevers?: NegotiationLever[];
  riskFactors?: RiskFactor[];
  industryVariants?: IndustryVariant[];
}

export interface ContradictionTemplate {
  id: string;
  label: string;
  severity: 'low' | 'medium' | 'high';
  partyA: string;   // e.g. "Vendor claim"
  partyB: string;   // e.g. "Measured reality"
  /** Prose description of when this contradiction fires. */
  detectionHint: string;
  /** What to do when this contradiction is detected. */
  resolutionPath: string;
}

export interface FailureMode {
  id: string;
  label: string;
  description: string;
  /** Stages where this failure mode commonly manifests. */
  stages: StageId[];
  mitigations: string[];
}

export interface LifecyclePatternSeed extends PatternSeed {
  kind: 'lifecycle';
  patternId: LifecyclePatternId;
  stages: LifecycleStage[];
  gateCriteria: GateCriterion[];
  expectedArtifacts: ExpectedArtifact[];
  contradictionTemplates: ContradictionTemplate[];
  failureModes: FailureMode[];
  /** Cross-pattern dependencies — other patterns this commonly co-applies with. */
  coAppliesWithPatternIds: string[];
  /** Typical duration range in days. */
  typicalDurationDays: { min: number; max: number };
}

export interface PatternSeed extends SourcingPatternExtensions {
  id: string;
  slug: string;
  title: string;
  domain: PatternDomain;
  tier: PatternTier;
  vertical: string;
  thesis: string;
  applicability: string;
  status: PatternStatus;
  version: string;
  confidence: number;
  createdFrom: PatternCreatedFrom;
  createdBy: string;
  createdAt: string;
  instanceCount: number;
  sourceDocuments: string[];
  regulatoryChips: string[];
  relatedPatternIds: string[];
  derivedFromPatternIds: string[];
  taggedContradictionIds: string[];
  body: string;
  /** Defaults to 'knowledge' for back-compat with existing patterns. */
  kind?: PatternKind;
}
