import type { AskSource } from "@/lib/intelligence/ask/types";
import { buildCorpusPatternDossier } from "./build-corpus-pattern-dossier";
import { buildDecisionOptionsDossier } from "./build-decision-options-dossier";
import { routeIntelligenceQuestion } from "./intelligence-intent-router";
import { selectExpertCouncil } from "./select-expert-council";
import type {
  BuildIntelligenceDossierInput,
  EvidenceBoundary,
  IntelligenceCitation,
  IntelligenceDossier,
  IntelligenceDossierQualityResult,
  RiskCaveatDossier,
  TenantEvidenceDossier,
} from "./types";

function compact(text: string, max = 360): string {
  const value = text.replace(/\s+/g, " ").trim();
  return value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value;
}

function sourceCitation(source: AskSource, index: number): IntelligenceCitation {
  const confidence = source.confidence ?? 0;
  return {
    id: `tenant-${index + 1}`,
    label: source.name || source.id || `Tenant source ${index + 1}`,
    sourceClass:
      source.type === "GRAPH"
        ? "graph"
        : source.type === "SURFACE" || source.type === "TENANT"
          ? "tenant-source"
          : "tenant-fact",
    sourceId: source.id,
    confidence: confidence >= 0.82 ? "high" : confidence >= 0.62 ? "medium" : "low",
  };
}

function isTenantEvidence(source: AskSource): boolean {
  return ["SURFACE", "TENANT", "GRAPH"].includes(source.type);
}

function buildTenantEvidenceDossier(sources: AskSource[]): TenantEvidenceDossier {
  const tenantSources = sources.filter(isTenantEvidence).slice(0, 12);
  const citations = tenantSources.map(sourceCitation);
  const citationIds = citations.map((citation) => citation.id);
  const sourceFamilies = [...new Set(tenantSources.map((source) => source.type))];
  const structuredTables = tenantSources.flatMap((source) => source.structured?.tables ?? []);
  const metricSources = tenantSources.filter((source) => /\$|\b\d+(?:\.\d+)?\s?(?:%|m|k|b|records?|rows?|systems?|vendors?|initiatives?)\b/i.test(source.detail));

  const gaps: TenantEvidenceDossier["gaps"] = [];
  if (tenantSources.length === 0) {
    gaps.push({
      id: "tenant-evidence-missing",
      label: "Tenant evidence was not retrieved for this question.",
      detail: "The answer may compare corpus patterns, but it must not state tenant-specific recommendations as proven.",
      severity: "critical",
    });
  }
  if (structuredTables.length === 0) {
    gaps.push({
      id: "structured-artifacts-thin",
      label: "No structured tenant table was retrieved.",
      detail: "Charts, graphs, and exact comparisons should stay caveated unless deterministic rows exist.",
      severity: "medium",
    });
  }

  return {
    sourceFamiliesIncluded: sourceFamilies,
    sections: tenantSources.map((source, index) => ({
      id: `tenant-section-${index + 1}`,
      label: source.name || source.type,
      sourceType: source.type,
      summary: compact(source.detail),
      factCount: source.structured?.tables.reduce((sum, table) => sum + table.rows.length, 0) ?? 1,
      citationIds: [citationIds[index]],
    })),
    rollups: {
      tenantSourceCount: tenantSources.length,
      structuredTableCount: structuredTables.length,
      metricBearingSourceCount: metricSources.length,
      sourceFamilies,
    },
    metrics: metricSources.slice(0, 8).map((source, index) => ({
      id: `metric-${index + 1}`,
      label: source.name || `Metric-bearing evidence ${index + 1}`,
      value: compact(source.detail, 180),
      basis: "retrieved tenant evidence",
      citationIds: [citationIds[tenantSources.indexOf(source)]].filter(Boolean),
    })),
    relationshipPaths: tenantSources
      .filter((source) => source.type === "GRAPH" || /\b(depends|supports|feeds|owned by|owner|integration|relationship)\b/i.test(source.detail))
      .slice(0, 6)
      .map((source, index) => ({
        id: `relationship-${index + 1}`,
        label: source.name || "Relationship evidence",
        from: "tenant evidence",
        relationship: "indicates",
        to: source.name || "related enterprise object",
        citationIds: [citationIds[tenantSources.indexOf(source)]].filter(Boolean),
        confidence: ((source.confidence ?? 0) >= 0.82 ? "high" : "medium") as "high" | "medium" | "low",
      })),
    gaps,
    citations,
    confidence: tenantSources.length >= 4 ? "strong" : tenantSources.length >= 1 ? "partial" : "thin",
  };
}

function buildRiskCaveatDossier(tenantEvidenceDossier: TenantEvidenceDossier): RiskCaveatDossier {
  const gaps = tenantEvidenceDossier.gaps.map((gap) => gap.label);
  return {
    tenantEvidenceGaps: gaps,
    dataReadinessGaps: gaps.filter((gap) => /data|structured|table|lineage|artifact/i.test(gap)),
    operatingModelRisks: ["Ownership, adoption, and handoff risk must be validated against loaded owner/process evidence."],
    governanceRisks: ["AI/control claims require tenant governance evidence or must stay as pattern-based caveats."],
    executionRisks: ["Recommendations should not outrun dependency, integration, or source-readiness evidence."],
    measurementRisks: ["ROI/value claims need measured tenant baselines or must be labeled directional."],
  };
}

function buildEvidenceBoundary(input: {
  tenantEvidenceDossier: TenantEvidenceDossier;
  corpusPatternDossier: IntelligenceDossier["corpusPatternDossier"];
  expertCouncilDossier: IntelligenceDossier["expertCouncilDossier"];
  benchmarkDossier: IntelligenceDossier["benchmarkDossier"];
}): EvidenceBoundary {
  return {
    tenantFacts: input.tenantEvidenceDossier.sections.map((section) => section.summary).slice(0, 8),
    corpusPatterns: input.corpusPatternDossier.patternsIncluded
      .flatMap((family) => family.patterns.map((pattern) => `${pattern.title}: ${pattern.summary}`))
      .slice(0, 8),
    expertInterpretations: input.expertCouncilDossier.selectedExperts
      .map((expert) => `${expert.nameOrRole}: ${expert.expectedContribution}`)
      .slice(0, 7),
    benchmarkClaims: input.benchmarkDossier.benchmarkSources.map((source) => source.claim).slice(0, 6),
    missingTenantEvidence: input.tenantEvidenceDossier.gaps.map((gap) => gap.label),
    cannotConclude: [
      "Exact ROI, savings, or value realization without cited tenant baselines.",
      "Tenant-specific relationships that are not present in retrieved evidence.",
      "Public or corpus claims as tenant facts.",
    ],
  };
}

function buildBenchmarkDossier(sources: AskSource[]): IntelligenceDossier["benchmarkDossier"] {
  const benchmarkSources = sources
    .filter((source) => ["BENCHMARK", "WORLDVIEW", "RESEARCH"].includes(source.type))
    .slice(0, 5)
    .map((source, index) => ({
      id: `benchmark-${index + 1}`,
      claim: compact(source.detail, 220),
      source: source.name || source.type,
      freshness: "source-provided; verify date before external publication",
      applicability: "Use to calibrate pattern confidence, not as tenant fact.",
      caveat: "Benchmark applicability depends on tenant maturity and source comparability.",
      citationIds: [`benchmark-${index + 1}`],
    }));
  return {
    benchmarkSources,
    peerExamples: benchmarkSources.map((source) => source.source),
    roiRanges: [],
    implementationCaveats:
      benchmarkSources.length > 0
        ? ["Benchmark claims are calibration only unless tenant baselines are cited."]
        : ["No benchmark source was retrieved; do not invent market statistics."],
    freshness: benchmarkSources.length > 0 ? "retrieved benchmark/worldview freshness varies by source" : "none retrieved",
    confidence: benchmarkSources.length > 1 ? "moderate" : benchmarkSources.length === 1 ? "directional" : "directional",
  };
}

export function buildIntelligenceDossier(input: BuildIntelligenceDossierInput): IntelligenceDossier {
  const tenantKey = input.tenantKey ?? "unknown-tenant";
  const route = routeIntelligenceQuestion({ tenantKey, question: input.question });
  const tenantEvidenceDossier = buildTenantEvidenceDossier(input.sources);
  const corpusPatternDossier = buildCorpusPatternDossier({ route, sources: input.sources });
  const expertCouncilDossier = selectExpertCouncil({
    route,
    question: input.question,
    tenantKey,
    contributingExperts: input.contributingExperts,
  });
  const benchmarkDossier = buildBenchmarkDossier(input.sources);
  const decisionOptionsDossier = buildDecisionOptionsDossier({
    route,
    tenantEvidenceDossier,
    corpusPatternDossier,
    expertCouncilDossier,
  });
  const riskCaveatDossier = buildRiskCaveatDossier(tenantEvidenceDossier);
  const evidenceBoundary = buildEvidenceBoundary({
    tenantEvidenceDossier,
    corpusPatternDossier,
    expertCouncilDossier,
    benchmarkDossier,
  });
  const citations = [
    ...tenantEvidenceDossier.citations,
    ...corpusPatternDossier.citations,
    ...expertCouncilDossier.citations,
    ...benchmarkDossier.benchmarkSources.map((source, index): IntelligenceCitation => ({
      id: `benchmark-${index + 1}`,
      label: source.source,
      sourceClass: "benchmark",
      sourceId: source.id,
      confidence: "medium",
    })),
  ];
  const quality = evaluateIntelligenceDossierQuality({
    tenantKey,
    tenantName: input.tenantName ?? tenantKey,
    question: input.question,
    intelligenceIntent: route.intelligenceIntent,
    primaryDimension: route.primaryDimension,
    relatedDimensions: route.relatedDimensions,
    tenantEvidenceDossier,
    corpusPatternDossier,
    expertCouncilDossier,
    benchmarkDossier,
    decisionOptionsDossier,
    riskCaveatDossier,
    evidenceBoundary,
    artifactPlan: route.expectedArtifacts,
    citations,
    qualityFlags: [],
  });

  return {
    tenantKey,
    tenantName: input.tenantName ?? tenantKey,
    question: input.question,
    intelligenceIntent: route.intelligenceIntent,
    primaryDimension: route.primaryDimension,
    relatedDimensions: route.relatedDimensions,
    tenantEvidenceDossier,
    corpusPatternDossier,
    expertCouncilDossier,
    benchmarkDossier,
    decisionOptionsDossier,
    riskCaveatDossier,
    evidenceBoundary,
    artifactPlan: route.expectedArtifacts,
    citations,
    qualityFlags: quality.issues,
  };
}

export function evaluateIntelligenceDossierQuality(dossier: IntelligenceDossier): IntelligenceDossierQualityResult {
  const issues: string[] = [];
  if (dossier.tenantEvidenceDossier.sections.length === 0) issues.push("no_tenant_evidence");
  if (dossier.corpusPatternDossier.patternsIncluded.length === 0) issues.push("no_corpus_pattern_context");
  if (dossier.expertCouncilDossier.selectedExperts.length === 0) issues.push("no_expert_lenses");
  if (dossier.expertCouncilDossier.selectedExperts.length > 7) issues.push("too_many_experts");
  if (dossier.decisionOptionsDossier.options.length === 0 && dossier.artifactPlan.includes("option_matrix")) {
    issues.push("no_decision_options");
  }
  if (dossier.evidenceBoundary.missingTenantEvidence.length === 0 && dossier.tenantEvidenceDossier.confidence !== "strong") {
    issues.push("thin_evidence_without_named_gap");
  }
  return {
    passed: !issues.includes("too_many_experts") && !issues.includes("no_expert_lenses"),
    critical: issues.includes("too_many_experts"),
    issues,
  };
}
