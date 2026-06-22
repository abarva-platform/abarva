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
  prose: string;
  citations: AnswerCitation[];
  tables: AnswerTable[];
  charts: AnswerChart[];
}

function sourceClassForAskSource(
  source: AskSource,
): AnswerCitation["sourceClass"] {
  switch (source.type) {
    case "TENANT":
    case "SURFACE":
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

function splitMarkdownTableRow(line: string): string[] {
  const trimmed = line.trim();
  if (!trimmed.includes("|")) return [];
  return trimmed
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim())
    .filter((cell, index, cells) => cell.length > 0 || index < cells.length);
}

function isMarkdownSeparatorRow(cells: string[]): boolean {
  return (
    cells.length >= 2 &&
    cells.every((cell) => /^:?-{3,}:?$/.test(cell.replace(/\s+/g, "")))
  );
}

function keyForColumn(label: string, index: number): string {
  const key = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return key || `column_${index + 1}`;
}

function markdownTablesFromProse(
  prose: string,
  citationIds: string[],
): { prose: string; tables: AnswerTable[] } {
  const lines = prose.split(/\r?\n/);
  const tables: AnswerTable[] = [];
  const keep: string[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const header = splitMarkdownTableRow(lines[i] ?? "");
    const separator = splitMarkdownTableRow(lines[i + 1] ?? "");
    if (
      header.length >= 2 &&
      separator.length === header.length &&
      isMarkdownSeparatorRow(separator)
    ) {
      const rows: Record<string, string>[] = [];
      const columns = header.map((label, index) => ({
        key: keyForColumn(label, index),
        label,
      }));
      let cursor = i + 2;
      while (cursor < lines.length) {
        const cells = splitMarkdownTableRow(lines[cursor] ?? "");
        if (cells.length !== header.length) break;
        rows.push(
          Object.fromEntries(
            columns.map((column, index) => [
              column.key,
              cells[index] ?? "",
            ]),
          ),
        );
        cursor += 1;
      }
      if (rows.length > 0) {
        tables.push({
          id: `answer-markdown-table-${tables.length + 1}`,
          title: tables.length === 0 ? "Answer Table" : `Answer Table ${tables.length + 1}`,
          columns,
          rows,
          note:
            "Rendered from a Markdown table emitted in Ava's answer; values are not inferred from surrounding prose.",
          citationIds,
        });
        i = cursor - 1;
        continue;
      }
    }
    keep.push(lines[i] ?? "");
  }

  return {
    prose: keep.join("\n").replace(/\n{3,}/g, "\n\n").trim(),
    tables,
  };
}

export function buildStructuredExhibits(
  input: StructuredExhibitsInput,
): StructuredExhibits {
  const citations = answerCitationsFromAskSources(input.sources);
  const markdown = markdownTablesFromProse(
    input.prose,
    citations.map((citation) => citation.id),
  );
  const tables: AnswerTable[] = [];
  const charts: AnswerChart[] = [];
  tables.push(...markdown.tables);

  if (tables.length === 0 && (
    input.routing.outputShape === "table" ||
    input.routing.outputShape === "chart" ||
    input.routing.outputShape === "graph"
  )) {
    const table =
      sourceRegisterTable(citations) ?? evidenceRequiredTable(citations);
    if (table) tables.push(table);
  }

  return { prose: markdown.prose, citations, tables, charts };
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
