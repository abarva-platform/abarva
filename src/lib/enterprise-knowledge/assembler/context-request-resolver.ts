import type { ModuleContextRequest } from "../contracts";
import type {
  ContextAssemblyBlueprint,
  ContextAssemblyInput,
  IntentClassification,
  SemanticClusterInput,
} from "./fixture-input";

export interface ContextSourceCatalogEntry {
  blueprint: ContextAssemblyBlueprint;
  semanticCluster: SemanticClusterInput;
  inputSources: string[];
}

export interface ResolvedContextAssemblyInput extends ContextAssemblyInput {
  resolution: {
    selectedCatalogKey: string;
    score: number;
    matchedTokens: string[];
    consideredCatalogKeys: string[];
  };
}

export function resolveContextAssemblyInput(params: {
  request: ModuleContextRequest;
  intent: IntentClassification;
  catalog: ContextSourceCatalogEntry[];
  generatedAt: string;
}): ResolvedContextAssemblyInput {
  const requestTokens = tokenize([
    params.request.scope?.question,
    params.request.scope?.useCase,
    params.request.scope?.portfolioScope,
    params.intent.archetypeKey,
    params.intent.matchedSignals.join(" "),
    params.intent.requiredDomains.join(" "),
  ].join(" "));

  const ranked = params.catalog
    .filter((entry) => entry.blueprint.tenantKey === params.request.tenantKey)
    .map((entry) => {
      const catalogTokens = tokenize(catalogText(entry));
      const matchedTokens = Array.from(requestTokens).filter((token) =>
        catalogTokens.has(token),
      );
      const domainScore = params.intent.requiredDomains.reduce(
        (score, domain) => score + domainPresenceScore(entry.blueprint, domain),
        0,
      );
      const evidenceScore = Math.min(10, entry.semanticCluster.evidenceItems.length * 2);
      const relationshipScore = Math.min(10, entry.semanticCluster.relationshipsPresent);
      return {
        entry,
        score: matchedTokens.length * 4 + domainScore + evidenceScore + relationshipScore,
        matchedTokens,
      };
    })
    .sort((left, right) => right.score - left.score);

  const best = ranked[0];
  if (!best) {
    throw new Error(`No context catalog entry found for tenant ${params.request.tenantKey}`);
  }

  return {
    request: params.request,
    intent: params.intent,
    blueprint: best.entry.blueprint,
    semanticCluster: best.entry.semanticCluster,
    generatedAt: params.generatedAt,
    inputSources: best.entry.inputSources,
    resolution: {
      selectedCatalogKey: best.entry.blueprint.catalogKey,
      score: best.score,
      matchedTokens: best.matchedTokens,
      consideredCatalogKeys: ranked.map((item) => item.entry.blueprint.catalogKey),
    },
  };
}

function catalogText(entry: ContextSourceCatalogEntry): string {
  const blueprint = entry.blueprint;
  const cluster = entry.semanticCluster;
  return [
    blueprint.tenantKey,
    blueprint.tenantName,
    blueprint.clusterName,
    blueprint.contextTitle,
    blueprint.primaryFunction,
    blueprint.outcomeHypothesis,
    blueprint.systems.join(" "),
    blueprint.dataDomains.join(" "),
    blueprint.infrastructure.join(" "),
    blueprint.vendorsContracts.join(" "),
    blueprint.spendContext.join(" "),
    blueprint.programs.join(" "),
    blueprint.risksControls.join(" "),
    blueprint.metrics.join(" "),
    blueprint.sourceContext.join(" "),
    cluster.painPoints.join(" "),
    cluster.evidenceItems.join(" "),
    cluster.metrics.join(" "),
    cluster.issues.join(" "),
    cluster.modernizationDependencies.join(" "),
  ].join(" ");
}

function tokenize(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length > 2),
  );
}

function domainPresenceScore(
  blueprint: ContextAssemblyBlueprint,
  domain: string,
): number {
  const domainCounts: Record<string, number> = {
    enterprise_profile: 1,
    functions: blueprint.primaryFunction ? 1 : 0,
    applications_systems: blueprint.systems.length,
    data_domains: blueprint.dataDomains.length,
    infrastructure: blueprint.infrastructure.length,
    vendors_contracts: blueprint.vendorsContracts.length,
    programs: blueprint.programs.length,
    risks_controls: blueprint.risksControls.length,
    metrics_outcomes: blueprint.metrics.length + blueprint.spendContext.length,
    use_cases: blueprint.outcomeHypothesis ? 1 : 0,
    processes: blueprint.sourceContext.length,
    relationships: blueprint.systems.length + blueprint.dataDomains.length,
    evidence: 1,
  };
  return Math.min(4, domainCounts[domain] ?? 0);
}
