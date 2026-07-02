import type {
  HomeKnowChart,
  HomeKnowCitation,
  HomeKnowFact,
  HomeKnowGap,
  HomeKnowGraph,
  HomeKnowIntent,
  HomeKnowResponse,
  HomeKnowTable,
} from "@/lib/home/know/home-know-contract";
import { hasUsableDossierEvidence } from "@/lib/home/know/has-usable-dossier-evidence";
import {
  operationalEvidenceInsufficiencyLead,
  scrubHomePublicAnswerText,
} from "@/lib/home/know/home-public-answer-scrub";
import {
  composeDossierAnswer,
  type UniversalDimensionDossier,
} from "@/lib/semantic-dossiers";

function isLoadedContextOverview(question: string): boolean {
  return /\b(what.*context.*loaded|what.*loaded|context.*loaded|loaded.*tenant|what do we know|what is loaded)\b/i.test(
    question,
  );
}

function homeIntentForDossier(
  dossier: UniversalDimensionDossier,
): HomeKnowIntent {
  if (isLoadedContextOverview(dossier.route.question)) return "browse";
  if (
    dossier.answerBoundary.handoffTarget &&
    dossier.answerBoundary.handoffTarget !== "home"
  )
    return "decision_handoff";
  if (dossier.route.intent === "gap") return "gap";
  if (dossier.artifactPlan.includes("graph")) return "chart";
  if (dossier.artifactPlan.includes("table")) return "table";
  return "lookup";
}

function citationId(index: number): string {
  return `source-citation-${index + 1}`;
}

function citationsForDossier(
  dossier: UniversalDimensionDossier,
): HomeKnowCitation[] {
  return dossier.citations.map((citation, index) => ({
    id: citationId(index),
    label: citation.label,
    sourceClass: "tenant-source-file",
    sourceFile: citation.sourceKey,
    sourceRowNumber: null,
    excerpt: `${citation.count} source-backed item${citation.count === 1 ? "" : "s"} contributed to this answer context.`,
    confidence: citation.count > 0 ? "high" : "low",
  }));
}

function allCitationIds(citations: HomeKnowCitation[]): string[] {
  return citations.slice(0, 8).map((citation) => citation.id);
}

function factsForDossier(
  dossier: UniversalDimensionDossier,
  citations: HomeKnowCitation[],
): HomeKnowFact[] {
  const fallbackCitationIds = allCitationIds(citations);
  return dossier.facts.slice(0, 12).map((fact, index) => {
    const matchedCitationIds = citations
      .filter((citation) => citation.sourceFile === fact.sourceKey)
      .map((citation) => citation.id)
      .slice(0, 3);
    return {
      id: `source-fact-${index + 1}`,
      dimensionId: dossier.route.primaryDimension,
      label: fact.label,
      value: fact.value,
      citationIds:
        matchedCitationIds.length > 0
          ? matchedCitationIds
          : fallbackCitationIds,
    };
  });
}

function tablesForDossier(
  dossier: UniversalDimensionDossier,
  citations: HomeKnowCitation[],
): HomeKnowTable[] {
  if (isLoadedContextOverview(dossier.route.question)) return [];
  return [
    {
      id: "question-source-coverage",
      title: "Source coverage for this question",
      dimensionId: dossier.route.primaryDimension,
      columns: [
        { key: "section", label: "Section" },
        { key: "dimension", label: "Dimension" },
        { key: "records", label: "Records", align: "right", format: "number" },
        { key: "role", label: "Answer role" },
      ],
      rows: dossier.sections.slice(0, 18).map((section) => ({
        section: section.title,
        dimension: section.dimensionFamily.replaceAll("_", " "),
        records: section.recordCount,
        role:
          section.dimensionFamily === dossier.route.primaryDimension
            ? "primary"
            : "adjacent",
      })),
      citationIds: allCitationIds(citations),
      note: "This table shows the source areas attached to the Home answer.",
    },
  ];
}

function chartsForDossier(
  dossier: UniversalDimensionDossier,
  citations: HomeKnowCitation[],
): HomeKnowChart[] {
  if (isLoadedContextOverview(dossier.route.question)) return [];
  const numericMetrics = dossier.metrics
    .filter(
      (metric) =>
        typeof metric.value === "number" && Number.isFinite(metric.value),
    )
    .slice(0, 8);
  if (numericMetrics.length === 0) return [];
  if (!numericMetrics.some((metric) => Number(metric.value) !== 0)) return [];
  return [
    {
      id: "dimension-source-metrics",
      title: "Metric rollups from loaded sources",
      kind: "bar",
      type: "bar",
      dimensionId: dossier.route.primaryDimension,
      data: numericMetrics.map((metric) => ({
        label: metric.label,
        value: Number(metric.value),
      })),
      sourceIds: numericMetrics.flatMap((metric) => metric.sourceKeys),
      citationIds: allCitationIds(citations),
      caveats: numericMetrics.flatMap((metric) =>
        metric.caveat ? [metric.caveat] : [],
      ),
      status: "tenant-fact",
    },
  ];
}

function graphsForDossier(
  dossier: UniversalDimensionDossier,
  citations: HomeKnowCitation[],
): HomeKnowGraph[] {
  if (isLoadedContextOverview(dossier.route.question)) return [];
  if (dossier.relationshipPaths.length === 0) return [];
  const usablePaths = dossier.relationshipPaths
    .filter(
      (path) =>
        hasDisplayLabel(path.from) &&
        hasDisplayLabel(path.to) &&
        path.from.trim().toLowerCase() !== path.to.trim().toLowerCase(),
    )
    .slice(0, 8);
  if (usablePaths.length === 0) return [];
  const nodes = new Map<string, { id: string; label: string; type: string }>();
  const edges = usablePaths.map((path, index) => {
    const fromId = `node-from-${index + 1}`;
    const toId = `node-to-${index + 1}`;
    nodes.set(fromId, { id: fromId, label: path.from, type: path.from });
    nodes.set(toId, { id: toId, label: path.to, type: path.to });
    return {
      from: fromId,
      to: toId,
      label: path.relationship,
      type: path.pathKey,
      confidence: path.confidence,
    };
  });
  return [
    {
      id: "question-relationship-paths",
      title: "Relevant operating connections",
      nodes: [...nodes.values()],
      edges,
      nodeTypes: [...new Set([...nodes.values()].map((node) => node.type))],
      edgeTypes: [...new Set(edges.map((edge) => edge.type))],
      sourceIds: usablePaths.flatMap((path) => path.sourceKeys),
      citationIds: allCitationIds(citations),
      confidence: "medium",
      gaps: dossier.gaps.slice(0, 4).map((gap) => gap.label),
      inferredEdges: false,
    },
  ];
}

function hasDisplayLabel(value: string): boolean {
  const label = value.trim();
  if (!label) return false;
  if (/^(unnamed entity|business area|related|unknown|n\/a)$/i.test(label))
    return false;
  return true;
}

function gapsForDossier(
  dossier: UniversalDimensionDossier,
  citations: HomeKnowCitation[],
): HomeKnowGap[] {
  return dossier.gaps.slice(0, 8).map((gap, index) => ({
    id: `source-gap-${index + 1}`,
    dimensionId: dossier.route.primaryDimension,
    objectType: "source support",
    expectedField: gap.neededEvidence.join("; "),
    displayLabel: gap.label,
    severity: "medium",
    message: `${gap.impact} Remediation: ${gap.neededEvidence.join("; ")}.`,
    citationIds: allCitationIds(citations),
  }));
}

export function buildHomeKnowResponseFromDossier(input: {
  tenantKey: string;
  question: string;
  dossier: UniversalDimensionDossier;
}): HomeKnowResponse {
  const answer = composeDossierAnswer(input.dossier);
  const overview = isLoadedContextOverview(input.question);
  const citations = citationsForDossier(input.dossier);
  const intent = homeIntentForDossier(input.dossier);
  const handoffTarget = input.dossier.answerBoundary.handoffTarget;
  const facts = factsForDossier(input.dossier, citations);
  const tables = tablesForDossier(input.dossier, citations);
  const charts = chartsForDossier(input.dossier, citations);
  const graphs = graphsForDossier(input.dossier, citations);
  const gaps = gapsForDossier(input.dossier, citations);
  const evidence = hasUsableDossierEvidence({
    ...input.dossier,
    facts,
    tables,
    charts,
    graphs,
    gaps,
    citations,
  });
  const contextOnlyFunctionLead = operationalEvidenceInsufficiencyLead(
    input.question,
  );
  const baseProse = overview
    ? composeBranchOverview(input.dossier, answer.directAnswer)
    : answer.directAnswer;
  const prose = scrubHomePublicAnswerText(
    contextOnlyFunctionLead
      ? `${contextOnlyFunctionLead}\n\n${baseProse}`
      : baseProse,
  );
  return {
    mode: "KNOW",
    tenantKey: input.tenantKey,
    question: input.question,
    intent,
    answerStatus:
      handoffTarget && handoffTarget !== "home"
        ? "handoff"
        : input.dossier.gaps.length > 0
          ? "partial"
          : "answered",
    prose,
    dimensionsUsed: [
      input.dossier.route.primaryDimension,
      ...input.dossier.route.relatedDimensions,
    ],
    facts,
    tables,
    charts,
    graphs,
    gaps,
    conflicts: [],
    citations,
    handoff:
      handoffTarget && handoffTarget !== "home"
        ? {
            target:
              handoffTarget === "tower" ||
              handoffTarget === "moves" ||
              handoffTarget === "intelligence"
                ? handoffTarget
                : "intelligence",
            label: `Continue in ${handoffTarget}`,
            reason:
              input.dossier.answerBoundary.handoffReason ??
              "The question needs judgment beyond Home KNOW.",
          }
        : null,
    safety: {
      serverValidated: true,
      blockedExperts: true,
      blockedDecisionFrames: true,
      blockedInternalCodes: true,
      unsupportedClaimsRemoved: answer.quality.issues.length,
      frontendTripwireShouldFire: false,
      usableEvidence: evidence.usable,
      evidenceStatus: evidence.usable ? "usable_dossier" : "empty_dossier",
      evidenceReason: evidence.reason,
      evidenceChannels: evidence.evidenceChannels,
      composerTrace: {
        route: "/api/home/know/ask",
        composer:
          handoffTarget && handoffTarget !== "home"
            ? "home_know_decision_handoff"
            : "golden_home_know_semantic_synthesis",
        goldenComposerAttempted: true,
        goldenComposerUsed: true,
        fallbackUsed: false,
        dimensionsUsed: [
          input.dossier.route.primaryDimension,
          ...input.dossier.route.relatedDimensions,
        ],
        factsBound: facts.length,
        tablesBound: tables.filter((table) => table.rows.length > 0).length,
        chartsBound: charts.filter((chart) => chart.data.length > 0).length,
        graphsBound: graphs.filter(
          (graph) => graph.nodes.length > 0 && graph.edges.length > 0,
        ).length,
        citationsBound: citations.length,
        sourceCoverageBound: input.dossier.sourceCoverage.filter(
          (source) => source.loaded && source.count > 0,
        ).length,
        sectionsBound: input.dossier.sections.filter(
          (section) => section.recordCount > 0,
        ).length,
        rollupsBound: Object.keys(input.dossier.rollups).length,
        relationshipPathsBound: input.dossier.relationshipPaths.length,
        metricsBound: input.dossier.metrics.length,
        gapsBound: gaps.length,
        usableEvidence: evidence.usable,
        evidenceChannels: evidence.evidenceChannels,
        answerStatus:
          handoffTarget && handoffTarget !== "home"
            ? "handoff"
            : input.dossier.gaps.length > 0
              ? "partial"
              : "answered",
      },
    },
  };
}

function composeBranchOverview(
  dossier: UniversalDimensionDossier,
  fallback: string,
): string {
  const options = (dossier.branchOptions ?? [])
    .filter((option) => option.factCount > 0 || option.entityCount > 0)
    .slice(0, 4);
  if (options.length === 0) return fallback;
  const tenantName = humanizeTenantKey(dossier.tenantKey);
  const caveat = dossier.gaps[0]?.label
    ? `One caveat up front: ${dossier.gaps[0].label}`
    : null;
  return [
    `${tenantName} has enough current picture material to orient a Home conversation across ${options.map((option) => option.label).join(", ")}.`,
    `There is more here than belongs in one answer. Where do you want to go deeper?\n${options.map((option) => `- ${option.label}: ${option.summary}`).join("\n")}`,
    caveat,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function humanizeTenantKey(tenantKey: string): string {
  const knownTenantNames: Record<string, string> = {
    skyharbor: "SkyHarbor",
    "skyharbor-air": "SkyHarbor Air",
    lakeshore: "Lakeshore Holdings",
    "lakeshore-holdings": "Lakeshore Holdings",
    apex: "Apex",
    "apex-retail": "Apex Retail",
    meridian: "Meridian",
    "first-capital": "First Capital",
  };
  if (knownTenantNames[tenantKey]) return knownTenantNames[tenantKey];
  return tenantKey
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .replace(/\bAi\b/g, "AI")
    .replace(/\bIt\b/g, "IT");
}
