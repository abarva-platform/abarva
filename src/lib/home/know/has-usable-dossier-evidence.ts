import type { UniversalDimensionDossier } from "@/lib/semantic-dossiers";

export interface UsableDossierEvidenceChannels {
  facts: number;
  tables: number;
  charts: number;
  graphs: number;
  citations: number;
  sourceCoverage: number;
  sections: number;
  rollups: number;
  relationshipPaths: number;
  metrics: number;
  gaps: number;
}

export interface UsableDossierEvidenceResult {
  usable: boolean;
  evidenceChannels: UsableDossierEvidenceChannels;
  reason: string;
}

type EvidenceLike = {
  facts?: unknown[];
  tables?: unknown[];
  charts?: unknown[];
  graphs?: unknown[];
  citations?: unknown[];
  sourceCoverage?: UniversalDimensionDossier["sourceCoverage"];
  sections?: Array<Partial<UniversalDimensionDossier["sections"][number]>>;
  rollups?: UniversalDimensionDossier["rollups"];
  relationshipPaths?: unknown[];
  metrics?: UniversalDimensionDossier["metrics"];
  gaps?: unknown[];
  artifactPlan?: UniversalDimensionDossier["artifactPlan"];
  composerPacket?: Partial<
    Omit<
      UniversalDimensionDossier["composerPacket"],
      "facts" | "gaps" | "citations"
    > & {
      citations?: unknown[];
      gaps?: unknown[];
    }
  >;
};

export function hasUsableDossierEvidence(
  dossier: EvidenceLike,
): UsableDossierEvidenceResult {
  const channels: UsableDossierEvidenceChannels = {
    facts: countArray(dossier.facts),
    tables: countTables(dossier),
    charts: countCharts(dossier),
    graphs: countGraphs(dossier),
    citations: countCitations(dossier),
    sourceCoverage: countSourceCoverage(dossier),
    sections: countSections(dossier),
    rollups: countRollups(dossier),
    relationshipPaths: countArray(
      dossier.relationshipPaths ?? dossier.composerPacket?.relationshipPaths,
    ),
    metrics: countArray(dossier.metrics ?? dossier.composerPacket?.metrics),
    gaps: countGaps(dossier),
  };
  const populated = Object.entries(channels).filter(([, count]) => count > 0);
  return {
    usable: populated.length > 0,
    evidenceChannels: channels,
    reason:
      populated.length > 0
        ? `usable dossier evidence via ${populated
            .map(([channel, count]) => `${channel}:${count}`)
            .join(", ")}`
        : "empty dossier: no facts, artifacts, citations, source coverage, sections, rollups, relationships, metrics, or sourced gaps",
  };
}

function countArray(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

function countTables(dossier: EvidenceLike): number {
  if (Array.isArray(dossier.tables)) {
    return dossier.tables.filter((table) => arrayPropLength(table, "rows") > 0).length;
  }
  return dossier.artifactPlan?.includes("table") ? 1 : 0;
}

function countCharts(dossier: EvidenceLike): number {
  if (Array.isArray(dossier.charts)) {
    return dossier.charts.filter((chart) => arrayPropLength(chart, "data") > 0).length;
  }
  const metrics = dossier.metrics ?? dossier.composerPacket?.metrics ?? [];
  return dossier.artifactPlan?.includes("chart") &&
    metrics.some((metric) => typeof metric.value === "number")
    ? 1
    : 0;
}

function countGraphs(dossier: EvidenceLike): number {
  if (Array.isArray(dossier.graphs)) {
    return dossier.graphs.filter(
      (graph) =>
        arrayPropLength(graph, "nodes") > 0 && arrayPropLength(graph, "edges") > 0,
    ).length;
  }
  const paths =
    dossier.relationshipPaths ?? dossier.composerPacket?.relationshipPaths ?? [];
  return dossier.artifactPlan?.includes("graph") && paths.length > 0 ? 1 : 0;
}

function arrayPropLength(value: unknown, key: string): number {
  if (!value || typeof value !== "object") return 0;
  const maybeArray = (value as Record<string, unknown>)[key];
  return Array.isArray(maybeArray) ? maybeArray.length : 0;
}

function countCitations(dossier: EvidenceLike): number {
  const citations = dossier.citations ?? dossier.composerPacket?.citations;
  if (!Array.isArray(citations)) return 0;
  return citations.filter((citation) => {
    if (typeof citation !== "object" || citation === null) return false;
    const maybeCount = "count" in citation ? Number(citation.count) : 1;
    return Number.isFinite(maybeCount) ? maybeCount > 0 : true;
  }).length;
}

function countSourceCoverage(dossier: EvidenceLike): number {
  const coverage = dossier.sourceCoverage;
  if (!Array.isArray(coverage)) return 0;
  return coverage.filter((source) => source.loaded && source.count > 0).length;
}

function countSections(dossier: EvidenceLike): number {
  const sections = dossier.sections ?? dossier.composerPacket?.sections;
  if (!Array.isArray(sections)) return 0;
  return sections.filter(
    (section) =>
      Number(section.recordCount) > 0 ||
      (section.sample?.length ?? 0) > 0 ||
      (section.sourceKeys?.length ?? 0) > 0,
  ).length;
}

function countRollups(dossier: EvidenceLike): number {
  const rollups = dossier.rollups ?? dossier.composerPacket?.rollups;
  if (!rollups || typeof rollups !== "object") return 0;
  return Object.values(rollups).filter((value) => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== null && value !== undefined && value !== "";
  }).length;
}

function countGaps(dossier: EvidenceLike): number {
  const gaps = dossier.gaps ?? dossier.composerPacket?.gaps;
  if (!Array.isArray(gaps)) return 0;
  return gaps.filter((gap) => {
    if (typeof gap !== "object" || gap === null) return false;
    if ("citationIds" in gap && Array.isArray(gap.citationIds)) {
      return gap.citationIds.length > 0;
    }
    if ("neededEvidence" in gap && Array.isArray(gap.neededEvidence)) {
      return gap.neededEvidence.length > 0;
    }
    return "label" in gap && Boolean(gap.label);
  }).length;
}
