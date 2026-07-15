import type {
  CanonicalFact,
  ContextPack,
  TowerContextPack,
  TowerMetricRecord,
  TowerProjectionLineage,
  TowerProjectionStatus,
  TowerV3SourceDimensionKey,
  TowerV3SourceDimensionMapping,
  TowerValueClaim,
  TowerValueClaimKind,
  TowerValueRecord,
} from "../contracts";
import { evaluateTowerValueClaimGate } from "@/lib/tower/value-claim-gate";

type TowerContextPackFields = Pick<
  TowerContextPack,
  | "realizedValueRequiresMeasuredEvidence"
  | "sourceOfTruthPath"
  | "projectionPath"
  | "projectionStatus"
  | "v3SourceDimensions"
  | "derivedProjectionLineage"
  | "towerMetricRecords"
  | "towerValueRecords"
  | "towerValueClaims"
  | "blockedValueClaims"
  | "towerTruthCaveats"
>;

const TOWER_DIMENSION_DEFINITIONS: Omit<
  TowerV3SourceDimensionMapping,
  "recordCount" | "evidenceCount"
>[] = [
  {
    dimensionKey: "08_spend_value",
    label: "Spend and value",
    mappedDomains: ["programs", "metrics_outcomes"],
    towerUse: "budget_value",
  },
  {
    dimensionKey: "09_programs_initiatives",
    label: "Programs and initiatives",
    mappedDomains: ["programs", "use_cases"],
    towerUse: "portfolio_initiative",
  },
  {
    dimensionKey: "11_risks_controls",
    label: "Risks and controls",
    mappedDomains: ["risks_controls"],
    towerUse: "risk_control",
  },
  {
    dimensionKey: "14_metrics_outcomes",
    label: "Metrics and outcomes",
    mappedDomains: ["metrics_outcomes"],
    towerUse: "metric_outcome",
  },
  {
    dimensionKey: "17_service_scope_managed_services",
    label: "Service scope and managed services",
    mappedDomains: ["functions", "vendors_contracts"],
    towerUse: "service_scope",
  },
  {
    dimensionKey: "18_operational_process_evidence",
    label: "Operational process evidence",
    mappedDomains: ["processes", "relationships"],
    towerUse: "operational_evidence",
  },
];

export const TOWER_V3_SOURCE_DIMENSION_KEYS = TOWER_DIMENSION_DEFINITIONS.map(
  (dimension) => dimension.dimensionKey,
) as TowerV3SourceDimensionKey[];

function dimensionForFact(fact: CanonicalFact): TowerV3SourceDimensionKey {
  const predicate = fact.predicate.toLowerCase();
  if (
    predicate.includes("spend") ||
    predicate.includes("budget") ||
    predicate.includes("value") ||
    fact.valueType === "currency"
  ) {
    return "08_spend_value";
  }
  if (fact.domain === "programs" || fact.domain === "use_cases") {
    return "09_programs_initiatives";
  }
  if (fact.domain === "risks_controls") return "11_risks_controls";
  if (fact.domain === "metrics_outcomes" || fact.predicate === "metric") {
    return "14_metrics_outcomes";
  }
  if (fact.domain === "vendors_contracts" || fact.domain === "functions") {
    return "17_service_scope_managed_services";
  }
  if (fact.domain === "processes" || fact.domain === "relationships") {
    return "18_operational_process_evidence";
  }
  return "14_metrics_outcomes";
}

function projectionStatusForFacts(facts: readonly CanonicalFact[]): TowerProjectionStatus {
  if (facts.length === 0) return "not_v3_reconciled";
  return facts.every((fact) => fact.truthStatus === "active")
    ? "v3_context_pack_ready"
    : "bridge_only";
}

function businessLabel(fact: CanonicalFact, fallback: string): string {
  const value =
    typeof fact.value === "string" && fact.value.trim().length > 0
      ? fact.value.trim()
      : null;
  if (value && value.length < 80) return value;
  return fact.predicate.replace(/_/g, " ") || fallback;
}

function claimKindForFact(fact: CanonicalFact): TowerValueClaimKind {
  const predicate = fact.predicate.toLowerCase();
  if (predicate.includes("realized")) return "realized_value";
  if (predicate.includes("measured") || predicate.includes("actual")) return "measured_value";
  if (predicate.includes("promised") || predicate.includes("committed")) return "promised_value";
  if (predicate.includes("forecast") || predicate.includes("planned")) return "planned_value";
  return "value_hypothesis";
}

function claimBasisForFact(fact: CanonicalFact): TowerValueRecord["claimBasis"] {
  const predicate = fact.predicate.toLowerCase();
  if (predicate.includes("budget") || predicate.includes("spend")) return "budget";
  if (predicate.includes("baseline")) return "baseline";
  if (predicate.includes("forecast") || predicate.includes("planned")) return "forecast";
  if (predicate.includes("promised") || predicate.includes("committed")) return "business_case";
  if (predicate.includes("measured") || predicate.includes("actual") || predicate.includes("realized")) {
    return "measured_actual";
  }
  return "measurement_plan";
}

function evidenceIds(fact: CanonicalFact): string[] {
  return fact.evidenceRefs.map((ref) => ref.evidenceId);
}

export function buildTowerContextPackFields(pack: ContextPack): TowerContextPackFields {
  const towerFacts = pack.facts.filter((fact) =>
    TOWER_DIMENSION_DEFINITIONS.some((dimension) => dimension.mappedDomains.includes(fact.domain)) ||
    fact.valueType === "currency" ||
    fact.predicate.toLowerCase().includes("value") ||
    fact.predicate.toLowerCase().includes("spend"),
  );
  const factsByDimension = new Map<TowerV3SourceDimensionKey, CanonicalFact[]>();
  for (const fact of towerFacts) {
    const dimensionKey = dimensionForFact(fact);
    factsByDimension.set(dimensionKey, [...(factsByDimension.get(dimensionKey) ?? []), fact]);
  }

  const v3SourceDimensions = TOWER_DIMENSION_DEFINITIONS.map((dimension) => {
    const facts = factsByDimension.get(dimension.dimensionKey) ?? [];
    return {
      ...dimension,
      recordCount: facts.length,
      evidenceCount: new Set(facts.flatMap(evidenceIds)).size,
    };
  });

  const derivedProjectionLineage: TowerProjectionLineage[] = v3SourceDimensions.map((dimension) => {
    const facts = factsByDimension.get(dimension.dimensionKey) ?? [];
    return {
      lineageId: `tower-lineage-${dimension.dimensionKey}`,
      sourceDimension: dimension.dimensionKey,
      sourceFactIds: facts.map((fact) => fact.factId),
      evidenceIds: Array.from(new Set(facts.flatMap(evidenceIds))),
      projectionStatus: projectionStatusForFacts(facts),
      notes: facts.length
        ? [`Mapped ${facts.length} v3 context facts into Tower ${dimension.towerUse}.`]
        : [`No v3 context facts mapped for ${dimension.label}.`],
    };
  });

  const towerMetricRecords: TowerMetricRecord[] = towerFacts
    .filter((fact) => fact.domain === "metrics_outcomes" || fact.predicate === "metric")
    .map((fact) => ({
      metricId: fact.factId,
      label: businessLabel(fact, "Tower metric"),
      value: fact.value,
      valueType: fact.valueType,
      sourceDimension: dimensionForFact(fact),
      evidenceIds: evidenceIds(fact),
      projectionStatus: projectionStatusForFacts([fact]),
      safeToDisplay: fact.evidenceRefs.length > 0 && fact.truthStatus !== "excluded",
    }));

  const valueFacts = towerFacts.filter((fact) => {
    const predicate = fact.predicate.toLowerCase();
    return (
      fact.valueType === "currency" ||
      predicate.includes("value") ||
      predicate.includes("spend") ||
      predicate.includes("budget") ||
      predicate.includes("benefit")
    );
  });

  const towerValueRecords: TowerValueRecord[] = valueFacts.map((fact) => ({
    valueRecordId: fact.factId,
    label: businessLabel(fact, "Tower value record"),
    value: fact.value,
    valueType: fact.valueType,
    sourceDimension: dimensionForFact(fact),
    evidenceIds: evidenceIds(fact),
    claimBasis: claimBasisForFact(fact),
    projectionStatus: projectionStatusForFacts([fact]),
    safeToDisplay: fact.evidenceRefs.length > 0 && fact.truthStatus !== "excluded",
  }));

  const towerValueClaims: TowerValueClaim[] = valueFacts.map((fact) =>
    evaluateTowerValueClaimGate({
      claimId: `tower-claim-${fact.factId}`,
      claimKind: claimKindForFact(fact),
      label: businessLabel(fact, "Tower value claim"),
      value: fact.value,
      valueType: fact.valueType,
      sourceFactIds: [fact.factId],
      evidenceIds: evidenceIds(fact),
      evidenceAuthorities: fact.evidenceRefs.map((ref) => ref.authority),
      v3Reconciled: fact.truthStatus === "active",
    }),
  );

  const blockedValueClaims = towerValueClaims.filter((claim) => claim.gateStatus === "blocked");
  const projectionStatus = projectionStatusForFacts(towerFacts);

  return {
    realizedValueRequiresMeasuredEvidence: true,
    sourceOfTruthPath: "v3_enterprise_context_layer",
    projectionPath: "path_a_derived_projection",
    projectionStatus,
    v3SourceDimensions,
    derivedProjectionLineage,
    towerMetricRecords,
    towerValueRecords,
    towerValueClaims,
    blockedValueClaims,
    towerTruthCaveats: [
      "Tower consumes v3 enterprise context through a derived projection path.",
      "cio_tower remains a read model until every displayed row reconciles to v3 evidence, canonical facts, entity profiles, and relationships.",
      "Realized-value language is blocked unless measured evidence passes the TowerValueClaim gate.",
    ],
  };
}
