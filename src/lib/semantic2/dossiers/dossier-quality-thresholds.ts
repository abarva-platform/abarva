export interface DossierDimensionThreshold {
  dimensionKey: string;
  minCoverage: number;
  minConfidence: number;
  minFacts: number;
  minEntities: number;
  minRelationships: number;
  minUsableCitations: number;
  requiredRelationshipGroups?: string[][];
  requiredFactHints?: string[];
}

export const DOSSIER_DIMENSION_THRESHOLDS: Record<
  string,
  DossierDimensionThreshold
> = {
  organization_leadership: {
    dimensionKey: "organization_leadership",
    minCoverage: 0.65,
    minConfidence: 0.65,
    minFacts: 25,
    minEntities: 5,
    minRelationships: 3,
    minUsableCitations: 3,
    requiredRelationshipGroups: [
      ["leader_owns_function", "leader owns function", "works in", "owns"],
      [
        "team_owns_system",
        "leader_owns_team",
        "team owns system",
        "leader owns team",
        "supports",
      ],
      [
        "function_supported_by_system",
        "team_supports_capability",
        "is supported by",
        "depends on",
      ],
    ],
  },
  application_systems: {
    dimensionKey: "application_systems",
    minCoverage: 0.7,
    minConfidence: 0.65,
    minFacts: 50,
    minEntities: 20,
    minRelationships: 10,
    minUsableCitations: 5,
    requiredRelationshipGroups: [
      ["owns", "supports"],
      ["depends on", "integrates with", "feeds"],
    ],
  },
  vendor_contracts: {
    dimensionKey: "vendor_contracts",
    minCoverage: 0.65,
    minConfidence: 0.62,
    minFacts: 35,
    minEntities: 10,
    minRelationships: 5,
    minUsableCitations: 4,
    requiredRelationshipGroups: [
      ["supports", "supplies"],
      ["contract covers", "renews", "owned by"],
    ],
  },
  budget_financials: {
    dimensionKey: "budget_financials",
    minCoverage: 0.62,
    minConfidence: 0.62,
    minFacts: 20,
    minEntities: 5,
    minRelationships: 2,
    minUsableCitations: 3,
    requiredFactHints: [
      "period",
      "amount",
      "currency",
      "classification",
      "confidence",
    ],
  },
  data_analytics: {
    dimensionKey: "data_analytics",
    minCoverage: 0.65,
    minConfidence: 0.62,
    minFacts: 30,
    minEntities: 8,
    minRelationships: 4,
    minUsableCitations: 4,
  },
  ai_value_governance: {
    dimensionKey: "ai_value_governance",
    minCoverage: 0.62,
    minConfidence: 0.62,
    minFacts: 25,
    minEntities: 6,
    minRelationships: 3,
    minUsableCitations: 3,
  },
  operations_process: {
    dimensionKey: "operations_process",
    minCoverage: 0.62,
    minConfidence: 0.62,
    minFacts: 30,
    minEntities: 8,
    minRelationships: 5,
    minUsableCitations: 4,
    requiredRelationshipGroups: [
      ["uses", "owned by", "assigned to"],
      ["automates", "bottleneck", "handoff", "supports"],
    ],
  },
  risk_compliance: {
    dimensionKey: "risk_compliance",
    minCoverage: 0.62,
    minConfidence: 0.62,
    minFacts: 20,
    minEntities: 5,
    minRelationships: 3,
    minUsableCitations: 3,
  },
  enterprise_profile: {
    dimensionKey: "enterprise_profile",
    minCoverage: 0.55,
    minConfidence: 0.6,
    minFacts: 8,
    minEntities: 1,
    minRelationships: 0,
    minUsableCitations: 2,
  },
  moves_evidence: {
    dimensionKey: "moves_evidence",
    minCoverage: 0.55,
    minConfidence: 0.6,
    minFacts: 12,
    minEntities: 2,
    minRelationships: 1,
    minUsableCitations: 2,
  },
};

export function thresholdForDimension(
  dimensionKey: string,
): DossierDimensionThreshold {
  return (
    DOSSIER_DIMENSION_THRESHOLDS[dimensionKey] ?? {
      dimensionKey,
      minCoverage: 0.6,
      minConfidence: 0.6,
      minFacts: 15,
      minEntities: 3,
      minRelationships: 1,
      minUsableCitations: 2,
    }
  );
}
