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
  | 'PAT-SRC-EMERGENCY-001';

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
  patternId: SourceEventPatternId;
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

export interface PatternSeed {
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
