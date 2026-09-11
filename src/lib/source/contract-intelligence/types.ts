export type ContractIntelligenceReviewStatus =
  | "draft"
  | "reviewed"
  | "approved"
  | "blocked_missing_evidence";

export type ContractIntelligenceEvidenceState =
  | "loaded"
  | "partial"
  | "missing"
  | "not_required";

export interface ContractIntelligenceMetric {
  readonly key: string;
  readonly label: string;
  readonly value: string;
  readonly meaning: string;
  readonly sourceRefs: readonly string[];
}

export interface ContractIntelligenceFact {
  readonly key: string;
  readonly label: string;
  readonly value: string;
  readonly meaning: string;
  readonly sourceRefs: readonly string[];
  readonly confidence: "high" | "medium" | "low";
  readonly reviewStatus: ContractIntelligenceReviewStatus;
}

export interface ContractIntelligenceDerivedInsight {
  readonly key: string;
  readonly label: string;
  readonly statement: string;
  readonly whyItMatters: string;
  readonly sourceRefs: readonly string[];
  readonly confidence: "high" | "medium" | "low";
  readonly reviewStatus: ContractIntelligenceReviewStatus;
}

export interface ContractIntelligenceEvidenceLane {
  readonly key: string;
  readonly label: string;
  readonly state: ContractIntelligenceEvidenceState;
  readonly plainEnglish: string;
  readonly sourceRefs: readonly string[];
}

export interface ContractIntelligenceFinding {
  readonly findingId: string;
  readonly label: string;
  readonly statement: string;
  readonly implication: string;
  readonly recommendedAction: string;
  readonly annualImpact: string;
  readonly confidence: "high" | "medium" | "low";
  readonly sourceRefs: readonly string[];
}

export interface ContractIntelligenceLever {
  readonly leverId: string;
  readonly leverType: string;
  readonly label: string;
  readonly currentTerm: string;
  readonly targetTerm: string;
  readonly buyerAsk: string;
  readonly negotiationLanguage: string;
  readonly vendorGive: string;
  readonly valueBasis: string;
  readonly candidateRange: string;
  readonly timingDependency: string;
  readonly ownerRole: string;
  readonly priority: string;
  readonly riskIfIgnored: string;
  readonly sourceRefs: readonly string[];
}

export type ContractIntelligenceNodeKind =
  | "contract"
  | "vendor"
  | "archetype"
  | "scope"
  | "evidence_source"
  | "owner"
  | "opportunity"
  | "lever";

export interface ContractIntelligenceAnatomyNode {
  readonly id: string;
  readonly kind: ContractIntelligenceNodeKind;
  readonly label: string;
  readonly description: string;
  readonly sourceRefs: readonly string[];
}

export interface ContractIntelligenceAnatomyRelationship {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly type:
    | "provided_by"
    | "classified_as"
    | "covers"
    | "supported_by"
    | "owned_by"
    | "creates_opportunity"
    | "implemented_by";
  readonly label: string;
  readonly explanation: string;
  readonly sourceRefs: readonly string[];
  readonly confidence: "high" | "medium" | "low";
}

export interface ContractIntelligenceAnatomy {
  readonly plainEnglish: string;
  readonly nodes: readonly ContractIntelligenceAnatomyNode[];
  readonly relationships: readonly ContractIntelligenceAnatomyRelationship[];
}

export interface ContractIntelligenceReadout {
  readonly headline: string;
  readonly subhead: string;
  readonly metrics: readonly ContractIntelligenceMetric[];
  readonly interpretation: string;
  readonly nextQuestion: string;
  readonly sourceRefs: readonly string[];
}

export interface ContractIntelligenceRecord {
  readonly contractId: string;
  readonly vendorName: string;
  readonly contractName: string;
  readonly category: string;
  readonly archetype: string;
  readonly story: {
    readonly headline: string;
    readonly purpose: string;
    readonly scope: string;
    readonly decision: string;
    readonly evidenceBoundary: string;
  };
  readonly baseline: {
    readonly metrics: readonly ContractIntelligenceMetric[];
    readonly facts: readonly ContractIntelligenceFact[];
  };
  readonly evidenceLanes: readonly ContractIntelligenceEvidenceLane[];
  readonly anatomy: ContractIntelligenceAnatomy;
  readonly findings: readonly ContractIntelligenceFinding[];
  readonly levers: readonly ContractIntelligenceLever[];
  readonly derivedInsights: readonly ContractIntelligenceDerivedInsight[];
  readonly industryIntelligence: {
    readonly state: "archetype_play_available" | "missing_benchmark";
    readonly archetype: string;
    readonly plainEnglish: string;
    readonly benchmarkBoundary: string;
  };
  readonly review: {
    readonly status: ContractIntelligenceReviewStatus;
    readonly plainEnglish: string;
    readonly missingEvidence: readonly string[];
  };
  readonly provenance: {
    readonly tenantKey: string;
    readonly datasetVersion: string;
    readonly modelVersion: string;
    readonly sourceRefs: readonly string[];
    readonly loadRunId: string | null;
  };
}
