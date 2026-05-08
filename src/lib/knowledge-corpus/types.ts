// Knowledge corpus types · matches the schema locked in
// docs/knowledge-corpus/KNOWLEDGE_CORPUS_SCHEMA.md (v1.0) +
// docs/knowledge-corpus/SCHEMA_EXTENSIONS_V1_1.md (v1.1).
//
// Used by Intelligence Map + Brief surfaces (and downstream by
// agent integration in PR-K3+). For PR-K2 these types are
// satisfied by fixtures; once corpus population lands the loader
// in this same dir will produce live entities.

// ── Shared primitives ──────────────────────────────────────────

export type Industry = 'retail' | 'healthcare' | 'finserv';
export type Office = 'front' | 'middle' | 'back';
export type LifecycleStage = 'emerging' | 'scaling' | 'mature' | 'declining';
export type ShareTrajectory = 'gaining' | 'holding' | 'losing' | 'retreating';
export type Reliability = 'HIGH' | 'MED' | 'LOW';
export type Confidence = 'HIGH' | 'MED' | 'LOW';
export type Severity = 'HIGH' | 'MED' | 'LOW';
export type EngagementState = 'not_started' | 'in_flight' | 'scaled' | 'failed' | 'at_risk';

export interface ProvenanceSource {
  source: string;
  currencyDate: string;       // YYYY-Qn or YYYY-MM
  reliability: Reliability;
  url?: string;
}

export interface Provenance {
  primarySources: ProvenanceSource[];
  supportingSources?: ProvenanceSource[];
  curationPass: string;
  notes?: string;
}

// ── Use Case (v1.0 + v1.1 fields) ──────────────────────────────

export interface UseCase {
  id: string;                 // e.g., "UC-HC-FRONT-001"
  name: string;
  displayNameShort?: string;
  industry: Industry;
  office: Office;
  domainTags: string[];
  problemStatement: string;
  artOfPossibleFraming: string;

  businessValueRanges: {
    perCompanySize: {
      small?: string;
      mid?: string;
      large?: string;
      veryLarge?: string;
    };
    timeToValueMonths: string;
    paybackMonths?: string;
    confidenceBand: Confidence;
  };

  /** v1.1 */
  lifecycleStage: LifecycleStage;
  lifecycleBasis?: string;
  positionHistory?: Array<{ quarter: string; stage: LifecycleStage }>;

  successPatterns: Array<{ patternId: string; relevance: 'HIGH' | 'MED' | 'LOW' }>;
  /** v1.1 — anti-patterns (cross-UC failure modes promoted) */
  antiPatterns?: Array<{ apId: string; severity: Severity }>;

  vendorLandscape: {
    incumbent: string[];
    challenger: string[];
    emerging: string[];
  };

  siLandscape: {
    crediblePractice: string[];
    emergingPractice: string[];
  };

  regulatoryContext: {
    applicable: string[];
    recentChanges?: string[];
    upcomingHeadwinds?: string[];
  };

  /** v1.1 */
  applicablePersonas?: Array<{ personaId: string; relevance: 'PRIMARY' | 'SECONDARY' | 'TANGENTIAL' }>;
  /** v1.1 */
  proofPoints?: string[];     // PP- IDs
  /** v1.1 */
  cascadesPosition?: Array<{ cascadeId: string; position: number }>;

  benchmarkMetrics?: {
    primary: Array<{ kpi: string; industryMedian?: string; topQuartile?: string; leadingIndicator?: boolean }>;
    secondary?: Array<{ kpi: string; industryMedian?: string; topQuartile?: string; leadingIndicator?: boolean }>;
  };

  provenance: Provenance;
  lastRefreshed: string;
  refreshCadence: 'monthly' | 'quarterly' | 'semi_annually' | 'annually';
}

// ── Pattern (v1.0 + v1.1 quantified_signal) ───────────────────

export interface Pattern {
  id: string;                 // "P-HC-005"
  name: string;
  scope: 'industry_specific' | 'cross_industry';
  applicableIndustries: Industry[];
  patternType: 'success' | 'failure' | 'mixed';
  description: string;

  evidenceBasis: {
    observedInUseCases: string[];
    observationCount: string;
    confidence: Confidence;
  };

  /** v1.1 — quantified with-vs-without numbers */
  quantifiedSignal?: {
    withPattern: { metric: string; valueRange: string; typicalValue?: string; n?: number };
    withoutPattern: { metric: string; valueRange: string; typicalValue?: string; n?: number };
    source: string;
    confidence: Confidence;
    caveats?: string;
  };

  failureConsequence?: string;
  recommendedResponse?: string;

  relatedPatterns?: string[];
  /** v1.1 — anti-patterns this pattern prevents */
  preventsAntiPatterns?: string[];

  provenance: Provenance;
  lastRefreshed: string;
  refreshCadence: 'monthly' | 'quarterly' | 'semi_annually' | 'annually';
}

// ── Vendor (v1.0 + v1.1 share_trajectory) ─────────────────────

export interface Vendor {
  id: string;                 // "V-HC-001"
  name: string;
  productLines: Array<{
    productName: string;
    servesUseCases: string[];
  }>;
  vendorType: 'incumbent' | 'challenger' | 'emerging';
  financialHealth: 'strong' | 'moderate' | 'watch' | 'at_risk';

  /** v1.1 */
  shareTrajectory: ShareTrajectory;
  trajectorySignalBasis: string;
  trajectoryWindow?: string;

  customerRoster?: {
    publicReferences: Array<{ proofPointId?: string; customer?: string; useCase?: string; source?: string }>;
    generalMarketPosition?: string;
  };

  contractPatterns?: {
    pricingModels: string[];
    typicalTermsLength?: string;
    renewalPattern?: string;
    negotiationLevers?: string;
  };

  failureModes?: Array<{ mode: string; description: string }>;
  relatedSis?: string[];
  provenance: Provenance;
  lastRefreshed: string;
  refreshCadence: 'monthly' | 'quarterly' | 'semi_annually' | 'annually';
}

// ── Regulatory ─────────────────────────────────────────────────

export interface Regulatory {
  id: string;                 // "REG-US-005"
  name: string;
  jurisdiction: string;
  issuingBody: string;
  applicableIndustries: Industry[];
  applicableUseCases?: string[];
  summary: string;
  keyRequirements: string[];
  recentChanges?: Array<{ change: string; date: string; impact: string }>;
  provenance: Provenance;
  lastRefreshed: string;
  refreshCadence: 'monthly' | 'quarterly' | 'semi_annually' | 'annually';
}

// ── Proof Point (v1.1) ─────────────────────────────────────────

export interface ProofPoint {
  id: string;                 // "PP-HC-001"
  name: string;
  displayNameShort?: string;
  industry: Industry;
  useCaseId: string;
  vendorId?: string;
  siId?: string;

  customer: {
    name: string;
    type: string;
    size: 'small' | 'mid' | 'large' | 'very_large';
    geography?: string;
  };

  deployment: {
    startDate?: string;
    goLiveDate?: string;
    scope?: string;
    scale?: string;
  };

  measuredOutcomes: Array<{
    metric: string;
    value: string;
    period: string;
    confidence: Confidence;
  }>;

  successFactorsObserved?: string[];
  failureFactorsAvoided?: string[];
  artOfPossibleQuote?: string;

  provenance: Provenance;
  lastRefreshed: string;
  refreshCadence: 'monthly' | 'quarterly' | 'semi_annually' | 'annually';
}

// ── Persona (v1.1) ─────────────────────────────────────────────

export interface Persona {
  id: string;                 // "PER-CMIO-001"
  name: string;
  roleCanonical: string;
  industry: Industry | 'cross_industry';
  primaryConcerns: string[];
  typicalKpiFocus: string[];
  typicalObjections: Array<{
    objection: string;
    evidencedResponse: string;
    relevantProofPoints?: string[];
  }>;
  typicalHypotheses?: string[];
  primaryRelationships?: Array<{ otherRole: string; nature: string }>;
  provenance: Provenance;
  lastRefreshed: string;
}

// ── Move Cascade (v1.1) ────────────────────────────────────────

export interface MoveCascade {
  id: string;                 // "MC-HC-003"
  name: string;
  displayNameShort?: string;
  industry: Industry;
  applicablePersonas?: string[];
  applicableSubSegments?: string[];

  cascadeSteps: Array<{
    step: number;
    useCaseId: string;
    typicalDurationMonths: string;
    successThreshold?: string;
    enabledByStepNMinusOne?: string;
    enablesStepNPlusOneVia?: string;
  }>;

  cascadeEvidence: {
    observationCount: string;
    fullCascadeCompletionRate: string;
    partialCascadeObservations?: string[];
    confidence: Confidence;
  };

  failureModesAtHandoff?: Array<{
    betweenStep: string;
    mode: string;
    earlySignal: string;
    typicalRecovery: string;
  }>;

  relatedCascades?: string[];
  provenance: Provenance;
  lastRefreshed: string;
}

// ── Anti-Pattern (v1.1) ────────────────────────────────────────

export interface AntiPattern {
  id: string;                 // "AP-HC-002"
  name: string;
  displayNameShort?: string;
  scope: 'industry_specific' | 'cross_industry';
  applicableIndustries: Industry[];
  relatedToPattern?: string;
  description: string;
  mechanism?: string;
  observedInUseCases: string[];
  observationCount: string;

  /** quantified with-anti vs without-anti */
  quantifiedSignal: {
    withAntiPattern: { metric: string; valueRange: string; typicalValue?: string };
    withoutAntiPattern: { metric: string; valueRange: string; typicalValue?: string };
    source: string;
    confidence: Confidence;
  };

  earlySignals: Array<{ signal: string; severity: Severity }>;
  typicalRecovery: string;
  preventionPatterns?: string[];
  relatedAntiPatterns?: string[];
  provenance: Provenance;
  lastRefreshed: string;
}

// ── Tenant overlay scoring (returned by tenant-overlay.ts) ────

export interface ScoreFactor {
  factor: string;
  impact: number;
  value?: string;
}

export interface ScoredUseCase {
  useCase: UseCase;
  score: number;
  maxPossible: number;
  factors: ScoreFactor[];
  /** Tenant's current engagement with this use case (from AI Initiatives Registry) */
  engagementState: EngagementState;
  /** When in_flight: the registry's measured value vs committed annual */
  measuredVsCommitted?: { measured: number | null; committed: number | null };
}

// ── The Map view-model (consumed by IntelligenceMap.tsx) ───────

export interface MapNode {
  useCase: UseCase;
  /** X (0-100): emerging → declining */
  x: number;
  /** Y (0-100): low → very high value-leverage */
  y: number;
  /** Node radius (8-22px) by typical value range */
  r: number;
  engagementState: EngagementState;
  initiativeDisplayId?: string;       // e.g., "MH-01" if in flight
  score?: number;                      // tenant overlay score
}

export interface MapEdge {
  fromUseCaseId: string;
  toUseCaseId: string;
  /** Why edge: pattern co-occurrence | cascade adjacency | anti-pattern shared */
  basis: 'pattern_cooccurrence' | 'cascade_adjacency' | 'anti_pattern_shared';
  patternId?: string;
  cascadeId?: string;
}

export interface MapData {
  tenantName: string;
  tenantBrandColor: string;
  industry: Industry;
  totalUseCases: number;
  inFlightCount: number;
  atRiskCount: number;
  candidateCount: number;
  refreshedLabel: string;
  whatChanged: Array<{
    entityId: string;
    entityType: 'regulatory' | 'vendor' | 'use_case' | 'pattern';
    summary: string;
    source: string;
  }>;
  nodes: MapNode[];
  edges: MapEdge[];
  /** The pre-selected node (defaults to highest-score candidate) */
  defaultSelectedId: string;
}

// ── The Brief view-model (consumed by IntelligenceBrief.tsx) ──

export interface BriefBet {
  rank: number;
  useCase: UseCase;
  score: number;
  scoreFactors: Array<{ name: string; delta: number; isFlag?: boolean; isWarning?: boolean }>;
  engagementState: EngagementState;
  initiativeDisplayId?: string;
  measuredVsCommitted?: { measured: number; committed: number };
  bindingPatterns: Array<{
    pattern: Pattern;
    quantifiedRow: { withLabel: string; withoutLabel: string; description: string; source: string };
  }>;
  antiPatterns: Array<{
    antiPattern: AntiPattern;
    description: string;
    source: string;
  }>;
  vendors: Array<{ vendor: Vendor; tier: 'incumbent' | 'challenger' | 'emerging'; healthLabel: string; isCurrent?: boolean }>;
  regulatory: Array<{ regulatory: Regulatory; currencyDate: string }>;
}

export interface BriefData {
  tenantName: string;
  tenantBrandColor: string;
  industry: Industry;
  composedAt: string;             // ISO
  bets: BriefBet[];
  patternsTriggered: Array<{
    pattern: Pattern;
    issue: string;
    recommendedAction: string;
    cta: { primary: { label: string; href: string }; secondary?: { label: string; href: string } };
  }>;
  cascadeIfSucceeds?: {
    cascade: MoveCascade;
    triggerInitiativeId: string;
    triggerInitiativeName: string;
    followOnUseCases: Array<{ useCaseId: string; useCaseName: string }>;
    evidenceLine: string;
  };
  proofPoints: ProofPoint[];
  totals: {
    totalUseCases: number;
    totalPatterns: number;
    totalVendors: number;
    totalRegulatory: number;
    refreshCadence: string;
    lastRefreshQuarter: string;
  };
}
