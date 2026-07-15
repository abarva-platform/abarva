import { composeAvaAnswer } from "@/lib/ava-answer/composeAvaAnswer";
import type {
  AnswerChartKind,
  AvaAnswerPacket,
  AvaArtifact,
  AvaCitation,
  AvaFactRef,
  AvaGap,
} from "@/lib/ava-answer/contract";
import type {
  HomeKnowChartKind,
  HomeKnowCitationSourceClass,
  HomeKnowResponse,
} from "@/lib/home/know/home-know-contract";

export function composeHomeKnowAvaAnswer(
  response: HomeKnowResponse,
): AvaAnswerPacket {
  const artifacts: AvaArtifact[] = [
    ...response.tables.map((table) => ({
      artifact: "table" as const,
      id: table.id,
      title: table.title,
      columns: table.columns,
      rows: table.rows.map((row) =>
        Object.fromEntries(
          Object.entries(row).map(([key, value]) => [
            key,
            typeof value === "boolean" ? String(value) : value,
          ]),
        ),
      ),
      note: table.note,
      citationIds: table.citationIds,
    })),
    ...response.charts.map((chart) => ({
      artifact: "chart" as const,
      id: chart.id,
      kind: chartKind(chart.kind),
      title: chart.title,
      data: chart.data,
      citationIds: chart.citationIds,
    })),
    ...response.graphs.map((graph) => ({
      artifact: "graph" as const,
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
  ];

  const answer = composeAvaAnswer({
    surface: "home",
    mode: "KNOW",
    tenantKey: response.tenantKey,
    question: response.question,
    intent: response.intent,
    status: response.answerStatus,
    directAnswer: response.prose,
    interpretation: homeInterpretation(response),
    factsUsed: response.facts.map(
      (fact): AvaFactRef => ({
        id: fact.id,
        label: fact.label,
        value: fact.value,
        citationIds: fact.citationIds,
      }),
    ),
    artifacts,
    citations: response.citations.map(
      (citation): AvaCitation => ({
        id: citation.id,
        label: citation.label,
        sourceClass: citationSourceClass(citation.sourceClass),
        recordId: citation.recordId ?? undefined,
        excerpt: citation.excerpt ?? undefined,
        confidence: citation.confidence,
      }),
    ),
    gaps: response.gaps.map(
      (gap): AvaGap => ({
        id: gap.id,
        label: gap.displayLabel,
        detail: gap.message,
        severity: gap.severity,
        citationIds: gap.citationIds,
      }),
    ),
    caveats: [
      ...response.charts.flatMap((chart) =>
        chart.caveats.map((caveat, index) => ({
          id: `${chart.id}-caveat-${index + 1}`,
          label: "Chart caveat",
          detail: caveat,
        })),
      ),
      ...response.graphs.flatMap((graph) =>
        graph.gaps.map((gap, index) => ({
          id: `${graph.id}-gap-${index + 1}`,
          label: "Graph gap",
          detail: gap,
        })),
      ),
    ],
    nextSteps: response.handoff
      ? [
          {
            id: "home-know-handoff",
            label: response.handoff.label,
            rationale: response.handoff.reason,
            targetSurface: response.handoff.target ?? undefined,
          },
        ]
      : [],
    retrievalSummary: {
      substrate: "production_view",
      dimensions: response.dimensionsUsed,
      factCount: response.facts.length,
      relationshipCount: response.graphs.reduce(
        (sum, graph) => sum + graph.edges.length,
        0,
      ),
      sourceCount: response.citations.length,
      hasTenantFacts:
        response.citations.length > 0 || response.facts.length > 0,
    },
  });
  return {
    ...answer,
    prose: readableHomeKnowMirror(response.prose, answer.interpretation),
  };
}

function readableHomeKnowMirror(
  prose: string,
  interpretation?: string,
): string {
  const cleaned = prose
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
  if (!cleaned) return cleaned;

  const existingParagraphs = cleaned
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  if (existingParagraphs.length >= 3) return cleaned;

  const paragraphs = splitReadableHomeKnowParagraphs(cleaned);
  if (paragraphs.length < 3 && interpretation?.trim()) {
    paragraphs.push(interpretation.replace(/\s+/g, " ").trim());
  }
  return paragraphs.length >= 2 ? paragraphs.join("\n\n") : cleaned;
}

function splitReadableHomeKnowParagraphs(text: string): string[] {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  if (sentences.length >= 3) {
    return [
      sentences.slice(0, 2).join(" "),
      sentences.slice(2, Math.max(3, sentences.length - 1)).join(" "),
      sentences.slice(Math.max(3, sentences.length - 1)).join(" "),
    ].filter(Boolean);
  }

  const clauseBreaks = text
    .split(/(?<=;)\s+|(?<=:)\s+/)
    .map((clause) => clause.trim())
    .filter(Boolean);
  if (clauseBreaks.length >= 3) {
    const chunkSize = Math.ceil(clauseBreaks.length / 3);
    return [
      clauseBreaks.slice(0, chunkSize).join(" "),
      clauseBreaks.slice(chunkSize, chunkSize * 2).join(" "),
      clauseBreaks.slice(chunkSize * 2).join(" "),
    ].filter(Boolean);
  }

  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= 90) return [text];
  const chunkSize = Math.ceil(words.length / 3);
  return [
    words.slice(0, chunkSize).join(" "),
    words.slice(chunkSize, chunkSize * 2).join(" "),
    words.slice(chunkSize * 2).join(" "),
  ].filter(Boolean);
}

function homeInterpretation(response: HomeKnowResponse): string | undefined {
  if (response.answerStatus === "handoff") {
    return "Home can show what is loaded, but this question needs an advisory workspace before it becomes a recommendation.";
  }
  if (response.answerStatus === "no_data") {
    return "The useful result here is the gap itself: the requested field family is not available enough for a clean answer.";
  }
  if (response.gaps.length > 0) {
    return "The active enterprise context is directionally useful, but the named gaps limit precision.";
  }
  if (
    response.tables.length ||
    response.charts.length ||
    response.graphs.length
  ) {
    return "The supporting exhibit carries the detail while the lead answer stays focused on meaning.";
  }
  return undefined;
}

function chartKind(kind: HomeKnowChartKind): AnswerChartKind {
  return kind === "cost-stack" ? "cost-stack" : "bar";
}

function citationSourceClass(
  sourceClass: HomeKnowCitationSourceClass,
): AvaCitation["sourceClass"] {
  if (sourceClass === "tenant-relationship") return "graph";
  return "tenant-fact";
}
