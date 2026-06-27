import type {
  HomeKnowChart,
  HomeKnowCitation,
  HomeKnowGraph,
  HomeKnowResponse,
  HomeKnowTable,
} from "@/lib/home/know/home-know-contract";
import {
  businessLabel,
  compactCitations,
  renderedLayerLeakIssues,
  shapePublicText,
  shouldDropZeroCoverageRow,
} from "@/lib/ava-answer/render-layer-shaper";

function shapeCitation(citation: HomeKnowCitation): HomeKnowCitation {
  const sourceClass =
    citation.sourceClass === "tenant-source-file"
      ? "tenant-fact"
      : citation.sourceClass === "tenant-relationship"
        ? "graph"
        : "tenant-fact";
  const [shaped] = compactCitations([
    {
      id: citation.id,
      label: citation.label,
      sourceClass,
      recordId: citation.recordId ?? undefined,
      excerpt: citation.excerpt ?? undefined,
      confidence: citation.confidence,
    },
  ]);
  return {
    ...citation,
    label: shaped?.label ?? businessLabel(citation.label, "Tenant evidence"),
    excerpt: shaped?.excerpt ?? citation.excerpt,
  };
}

function shapeTable(table: HomeKnowTable): HomeKnowTable {
  return {
    ...table,
    title: shapePublicText(table.title, "Answer table"),
    dimensionId: businessLabel(table.dimensionId, "Context coverage"),
    columns: table.columns.map((column) => ({
      ...column,
      label: businessLabel(column.label, "Column"),
    })),
    rows: table.rows
      .filter((row) => !shouldDropZeroCoverageRow(row as Record<string, unknown>))
      .map((row) =>
        Object.fromEntries(
          Object.entries(row).map(([key, value]) => [
            key,
            typeof value === "string" ? shapePublicText(value, "") : value,
          ]),
        ),
      ),
    note: table.note ? shapePublicText(table.note, "") : table.note,
  };
}

function shapeChart(chart: HomeKnowChart): HomeKnowChart {
  return {
    ...chart,
    title: shapePublicText(chart.title, "Answer chart"),
    dimensionId: businessLabel(chart.dimensionId, "Context coverage"),
    data: chart.data.map((point) => ({
      ...point,
      label: shapePublicText(point.label, "Metric"),
    })),
    caveats: chart.caveats.map((caveat) => shapePublicText(caveat, "")),
  };
}

function shapeGraph(graph: HomeKnowGraph): HomeKnowGraph {
  const idMap = new Map(graph.nodes.map((node, index) => [node.id, `node-${index + 1}`]));
  return {
    ...graph,
    title: shapePublicText(graph.title, "Relationship graph"),
    nodeTypes: graph.nodeTypes.map((type) => businessLabel(type, "Business area")),
    edgeTypes: graph.edgeTypes.map((type) => businessLabel(type, "Connection")),
    nodes: graph.nodes.map((node, index) => ({
      ...node,
      id: `node-${index + 1}`,
      label: shapePublicText(node.label, "Business area"),
      type: businessLabel(node.type, "Business area"),
    })),
    edges: graph.edges.map((edge) => ({
      ...edge,
      from: idMap.get(edge.from) ?? "node-1",
      to: idMap.get(edge.to) ?? "node-1",
      label: shapePublicText(edge.label, "connects to"),
      type: businessLabel(edge.type, "Connection"),
    })),
    gaps: graph.gaps.map((gap) => shapePublicText(gap, "")),
    warning: graph.warning ? shapePublicText(graph.warning, "") : graph.warning,
  };
}

export function shapeHomeKnowResponseForRender(
  response: HomeKnowResponse,
): HomeKnowResponse {
  const citations = compactHomeCitations(response.citations);
  const citationIds = new Set(citations.map((citation) => citation.id));
  const shaped: HomeKnowResponse = {
    ...response,
    prose: shapePublicText(response.prose, ""),
    dimensionsUsed: response.dimensionsUsed.map((dimension) =>
      businessLabel(dimension, dimension),
    ),
    facts: response.facts.map((fact) => ({
      ...fact,
      dimensionId: businessLabel(fact.dimensionId, "Context"),
      label: shapePublicText(fact.label, "Fact"),
      value: typeof fact.value === "string" ? shapePublicText(fact.value, "") : fact.value,
      citationIds: fact.citationIds.filter((id) => citationIds.has(id)),
    })),
    tables: response.tables.map(shapeTable),
    charts: response.charts.map(shapeChart),
    graphs: response.graphs.map(shapeGraph),
    gaps: response.gaps.map((gap) => ({
      ...gap,
      dimensionId: businessLabel(gap.dimensionId, "Context"),
      objectType: shapePublicText(gap.objectType, "source area"),
      expectedField: shapePublicText(gap.expectedField, "needed field"),
      displayLabel: shapePublicText(gap.displayLabel, "Gap"),
      message: shapePublicText(gap.message, "Gap detail"),
      citationIds: gap.citationIds.filter((id) => citationIds.has(id)),
    })),
    conflicts: response.conflicts.map((conflict) => ({
      ...conflict,
      dimensionId: businessLabel(conflict.dimensionId, "Context"),
      label: shapePublicText(conflict.label, "Conflict"),
      description: shapePublicText(conflict.description, "Conflict detail"),
    })),
    citations,
    handoff: response.handoff
      ? {
          ...response.handoff,
          label: shapePublicText(response.handoff.label, "Open advisory workspace"),
          reason: shapePublicText(response.handoff.reason, ""),
        }
      : response.handoff,
  };
  const renderedText = JSON.stringify({
    prose: shaped.prose,
    tables: shaped.tables,
    charts: shaped.charts,
    graphs: shaped.graphs,
    gaps: shaped.gaps,
    citations: shaped.citations,
  });
  const leaks = renderedLayerLeakIssues(renderedText);
  return {
    ...shaped,
    safety: {
      ...shaped.safety,
      frontendTripwireShouldFire:
        shaped.safety.frontendTripwireShouldFire || leaks.length > 0,
      unsupportedClaimsRemoved:
        shaped.safety.unsupportedClaimsRemoved + leaks.length,
    },
  };
}

function compactHomeCitations(citations: HomeKnowCitation[]): HomeKnowCitation[] {
  const shaped = citations.map(shapeCitation);
  const seen = new Set<string>();
  const compact: HomeKnowCitation[] = [];
  for (const citation of shaped) {
    const key = `${citation.label}:${citation.sourceClass}`;
    if (seen.has(key)) continue;
    seen.add(key);
    compact.push(citation);
    if (compact.length >= 6) break;
  }
  return compact;
}
