import type {
  AnswerChartKind,
  AgentAnswer,
  CitationSourceClass,
} from "@/lib/intelligence/answer/agent-answer";
import { buildHomeKnowResponse } from "@/lib/home/know/home-know-engine";
import type {
  HomeKnowAskRequest,
  HomeKnowChartKind,
  HomeKnowCitationSourceClass,
  HomeKnowResponse,
} from "@/lib/home/know/home-know-contract";
import type { AskSurfaceContext } from "@/lib/intelligence/ask";
import { enforceHomeKnowAgentAnswerDoctrine } from "@/lib/intelligence/answer/surface-doctrine";

export function shouldUseHomeKnowAgentAnswer(input: {
  query: string;
  surfaceContext: AskSurfaceContext | null;
}): boolean {
  if (input.surfaceContext?.activeTab !== "home") return false;
  return input.query.trim().length > 0;
}

export async function buildHomeKnowAgentAnswer(
  input: HomeKnowAskRequest,
): Promise<{ response: HomeKnowResponse; answer: AgentAnswer }> {
  const response = await buildHomeKnowResponse(input);
  return { response, answer: homeKnowResponseToAgentAnswer(response) };
}

export function homeKnowResponseToAgentAnswer(response: HomeKnowResponse): AgentAnswer {
  return enforceHomeKnowAgentAnswerDoctrine({
    engineVersion: "agent-answer/v1",
    surface: "home",
    expertId: null,
    contributingExperts: [],
    prose: response.prose,
    tables: response.tables.map((table) => ({
      id: table.id,
      title: table.title,
      columns: table.columns,
      rows: table.rows.map((row) => coerceTableRow(row)),
      note: table.note,
      citationIds: table.citationIds,
    })),
    charts: response.charts.map((chart) => ({
      id: chart.id,
      kind: chartKind(chart.kind),
      title: chart.title,
      data: chart.data,
      citationIds: chart.citationIds,
    })),
    graphs: response.graphs.map((graph) => ({
      id: graph.id,
      title: graph.title,
      nodes: graph.nodes.map((node) => ({
        id: node.id,
        label: node.label,
        kind: node.type,
      })),
      edges: graph.edges.map((edge) => ({
        from: edge.from,
        to: edge.to,
        label: edge.label,
        kind: edge.type,
      })),
      citationIds: graph.citationIds,
    })),
    citations: response.citations.map((citation) => ({
      id: citation.id,
      label: citation.label,
      sourceClass: citationSourceClass(citation.sourceClass),
      recordId: citation.recordId ?? undefined,
      excerpt: citation.excerpt ?? undefined,
      confidence: citation.confidence,
    })),
    gaps: [
      ...response.gaps.map((gap) => gap.message),
      ...response.charts.flatMap((chart) => chart.caveats),
      ...response.graphs.flatMap((graph) => graph.gaps),
    ].filter(Boolean),
    recommendedActions: response.handoff
      ? [
          {
            id: "home-know-handoff",
            label: response.handoff.label,
            rationale: response.handoff.reason,
            handoff: response.handoff.target ?? undefined,
          },
        ]
      : [],
    groundingMode: "tenant-evidence",
    confidence: response.answerStatus === "answered" ? "high" : "medium",
    limits: response.answerStatus === "partial" ? ["Some fields are missing and shown as gaps."] : [],
    crossTenantBlocked: false,
  });
}

function coerceTableRow(
  row: Record<string, string | number | boolean | null>,
): Record<string, string | number | null> {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      key,
      typeof value === "boolean" ? String(value) : value,
    ]),
  );
}

function chartKind(kind: HomeKnowChartKind): AnswerChartKind {
  return kind === "cost-stack" ? "cost-stack" : "bar";
}

function citationSourceClass(sourceClass: HomeKnowCitationSourceClass): CitationSourceClass {
  if (sourceClass === "tenant-relationship") return "graph";
  return "tenant-fact";
}
