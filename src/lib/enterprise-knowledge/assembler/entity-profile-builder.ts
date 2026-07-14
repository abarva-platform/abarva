import type {
  CanonicalFact,
  ContextGap,
  EntityProfile,
  EvidenceRef,
} from "../contracts";
import type { ContextAssemblyBlueprint, ContextAssemblyInput } from "./fixture-input";

type ProfileSpec = {
  entityType: EntityProfile["entityType"];
  entityName: string;
};

export function buildCanonicalFacts(
  input: ContextAssemblyInput,
  evidenceRefs: EvidenceRef[],
): CanonicalFact[] {
  const subjectEntityId = `${input.blueprint.catalogKey}-function`;
  const items = [
    ...input.semanticCluster.painPoints.map((value) => ({
      predicate: "pain_point",
      value,
    })),
    ...input.semanticCluster.metrics.map((value) => ({
      predicate: "metric",
      value,
    })),
    ...input.semanticCluster.modernizationDependencies.map((value) => ({
      predicate: "modernization_dependency",
      value,
    })),
  ];
  return items.map((item, index) => ({
    factId: `${input.blueprint.catalogKey}-fact-${index + 1}`,
    tenantKey: input.blueprint.tenantKey,
    domain: item.predicate === "metric" ? "metrics_outcomes" : "functions",
    subjectEntityId,
    predicate: item.predicate,
    value: item.value,
    valueType: "string",
    evidenceRefs: [evidenceRefs[index % evidenceRefs.length]].filter(Boolean),
    truthStatus: "synthetic_review",
    confidence: "medium",
    caveats: ["Dry-run fixture fact; tenant validation required before active use."],
    inferred: false,
  }));
}

export function buildEntityProfiles(
  input: ContextAssemblyInput,
  facts: CanonicalFact[],
  evidenceRefs: EvidenceRef[],
  gaps: ContextGap[],
): EntityProfile[] {
  const specs = profileSpecs(input.blueprint);
  return specs.map((spec) => buildProfile(spec, input, facts, evidenceRefs, gaps));
}

function profileSpecs(blueprint: ContextAssemblyBlueprint): ProfileSpec[] {
  return [
    { entityType: "function", entityName: blueprint.primaryFunction },
    ...blueprint.systems.map((entityName) => ({
      entityType: "system" as const,
      entityName,
    })),
    ...blueprint.dataDomains.map((entityName) => ({
      entityType: "data_domain" as const,
      entityName,
    })),
    ...blueprint.infrastructure.map((entityName) => ({
      entityType: "infrastructure" as const,
      entityName,
    })),
    ...blueprint.vendorsContracts.map((entityName) => ({
      entityType: "vendor" as const,
      entityName,
    })),
    ...blueprint.spendContext.map((entityName) => ({
      entityType: "metric" as const,
      entityName,
    })),
    ...blueprint.programs.map((entityName) => ({
      entityType: "program" as const,
      entityName,
    })),
    ...blueprint.risksControls.map((entityName) => ({
      entityType: "risk" as const,
      entityName,
    })),
  ];
}

function buildProfile(
  spec: ProfileSpec,
  input: ContextAssemblyInput,
  facts: CanonicalFact[],
  evidenceRefs: EvidenceRef[],
  gaps: ContextGap[],
): EntityProfile {
  const id = `${input.blueprint.catalogKey}-${spec.entityType}-${slug(spec.entityName)}`;
  return {
    profileId: id,
    tenantKey: input.blueprint.tenantKey,
    entityType: spec.entityType,
    entityName: spec.entityName,
    businessMeaning: `${spec.entityName} is part of the ${input.blueprint.contextTitle} context for ${input.intent.archetypeKey}.`,
    currentStateSummary: `${input.blueprint.tenantName} has dry-run source-backed synthetic review context for ${spec.entityName}.`,
    targetStateDirection:
      "Validate the source evidence, relationships, and metric baselines before using this profile as active runtime truth.",
    operatingRole:
      spec.entityType === "function" ? input.blueprint.primaryFunction : undefined,
    relatedFunctions: [input.blueprint.primaryFunction],
    relatedSystems: input.blueprint.systems,
    relatedDataDomains: input.blueprint.dataDomains,
    relatedInfrastructure: input.blueprint.infrastructure,
    relatedVendorsContracts: input.blueprint.vendorsContracts,
    relatedSpend: input.blueprint.spendContext,
    relatedPrograms: input.blueprint.programs,
    relatedRisksControls: input.blueprint.risksControls,
    relatedMetricsOutcomes: input.blueprint.metrics,
    relatedUseCases: [input.blueprint.outcomeHypothesis, input.intent.archetypeKey],
    facts,
    relationships: [],
    evidenceRefs,
    confidence: 0.78,
    knownGaps: gaps,
    caveats: ["Assembler dry-run context; not active tenant truth."],
    truthStatus: "synthetic_review",
    sourceLineage: input.inputSources,
    asOfDate: "2026-07-14",
    moduleReadiness: "needs_review",
  };
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
