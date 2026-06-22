import type { AskSource } from "@/lib/intelligence/ask/types";
import type { RoutingDecision } from "@/lib/intelligence/answer/router";
import type {
  AgentAnswer,
  AnswerChart,
  AnswerCitation,
  AnswerTable,
} from "@/lib/intelligence/answer/agent-answer";

export interface StructuredExhibitsInput {
  prose: string;
  routing: RoutingDecision;
  sources: AskSource[];
}

export interface StructuredExhibits {
  citations: AnswerCitation[];
  tables: AnswerTable[];
  charts: AnswerChart[];
}

function sourceClassForAskSource(
  source: AskSource,
): AnswerCitation["sourceClass"] {
  switch (source.type) {
    case "TENANT":
      return "tenant-fact";
    case "GRAPH":
      return "graph";
    case "PATTERN":
      return "corpus-pattern";
    case "WORLDVIEW":
    case "RESEARCH":
    case "REGULATION":
    case "BENCHMARK":
      return "worldview";
    default:
      return "corpus-pattern";
  }
}

export function answerCitationsFromAskSources(
  sources: AskSource[],
): AnswerCitation[] {
  return sources.slice(0, 8).map((source, index) => ({
    id: `c${index + 1}`,
    label: source.name || source.id || `Source ${index + 1}`,
    sourceClass: sourceClassForAskSource(source),
    recordId: source.id ?? undefined,
    excerpt: source.detail,
    url: source.url,
    confidence:
      typeof source.confidence === "number"
        ? source.confidence >= 0.66
          ? "high"
          : source.confidence >= 0.33
            ? "medium"
            : "low"
        : undefined,
  }));
}

function sourceRegisterTable(citations: AnswerCitation[]): AnswerTable | null {
  if (citations.length === 0) return null;
  return {
    id: "answer-source-register",
    title: "Evidence Used",
    columns: [
      { key: "source", label: "Source" },
      { key: "class", label: "Class" },
      { key: "confidence", label: "Confidence" },
    ],
    rows: citations.slice(0, 5).map((citation) => ({
      source: citation.label,
      class: citation.sourceClass,
      confidence: citation.confidence ?? "not scored",
    })),
    note: "Generated from the sources retrieved for this answer.",
    citationIds: citations.map((citation) => citation.id),
  };
}

function evidenceRequiredTable(citations: AnswerCitation[]): AnswerTable {
  return {
    id: "answer-evidence-required",
    title: "Evidence Required",
    columns: [
      { key: "evidence", label: "Evidence" },
      { key: "status", label: "Status" },
      { key: "nextMove", label: "Next Move" },
    ],
    rows: [
      {
        evidence: "Tenant data extract for the requested comparison",
        status:
          citations.length > 0
            ? "Not present in the retrieved cited sources"
            : "No cited source available for the requested rows",
        nextMove:
          "Validate or load the source table before approving tenant-specific numbers.",
      },
    ],
    note: "Rendered because the user asked for a table, but Ava did not have enough connected data to populate tenant-specific rows without fabrication.",
    citationIds: citations.map((citation) => citation.id),
  };
}

export function buildStructuredExhibits(
  input: StructuredExhibitsInput,
): StructuredExhibits {
  const citations = answerCitationsFromAskSources(input.sources);
  const tables: AnswerTable[] = [];
  const charts: AnswerChart[] = [];

  if (input.routing.outputShape === "table") {
    const table =
      sourceRegisterTable(citations) ?? evidenceRequiredTable(citations);
    if (table) tables.push(table);
  }

  return { citations, tables, charts };
}

export function hasRenderableStructuredExhibits(
  exhibits: Pick<AgentAnswer, "tables" | "charts" | "graphs">,
): boolean {
  return (
    exhibits.tables.length > 0 ||
    exhibits.charts.length > 0 ||
    exhibits.graphs.length > 0
  );
}
