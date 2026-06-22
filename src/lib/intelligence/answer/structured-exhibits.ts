import type { AskSource } from "@/lib/intelligence/ask/types";
import type { RoutingDecision } from "@/lib/intelligence/answer/router";
import type {
  AgentAnswer,
  AnswerChart,
  AnswerCitation,
  AnswerTable,
  AnswerTableColumn,
} from "@/lib/intelligence/answer/agent-answer";
import { CHART } from "@/lib/programs/expert-kernel/exports/board-grade/svg-charts";

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

function formatForColumn(label: string): AnswerTableColumn["format"] {
  const normalized = label.toLowerCase();
  if (/\b(cost|spend|investment|value|impact|exposure|benefit|amount|revenue|margin)\b/.test(normalized)) {
    return "currency";
  }
  if (/%|percent|rate|pct/.test(normalized)) return "percent";
  if (/\b(count|score|rank|integrations|records|items)\b/.test(normalized)) {
    return "number";
  }
  return "text";
}

function tableColumnsForHeader(header: string[]): AnswerTableColumn[] {
  return header.map((label, index) => {
    const format = formatForColumn(label);
    return {
      key: keyForColumn(label, index),
      label,
      format,
      align: format === "text" ? "left" : "right",
    };
  });
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
      const columns = tableColumnsForHeader(header);
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

function splitHeaderBeforeInlineTable(
  textBeforeSeparator: string,
  columnCount: number,
): { prefix: string; header: string[] } | null {
  const parts = textBeforeSeparator.split("|");
  while (parts.length > 0 && (parts[parts.length - 1] ?? "").trim() === "") {
    parts.pop();
  }
  if (parts.length < columnCount + 1) return null;
  const header = parts.slice(-columnCount).map((cell) => cell.trim());
  if (
    header.length !== columnCount ||
    header.some((cell) => cell.length === 0 || cell.length > 80)
  ) {
    return null;
  }
  return {
    prefix: parts.slice(0, -columnCount).join("|").trimEnd(),
    header,
  };
}

function readInlineTableRows(
  textAfterSeparator: string,
  columnCount: number,
  columns: AnswerTableColumn[],
): { rows: Array<Record<string, string>>; consumed: number } {
  const rows: Array<Record<string, string>> = [];
  let cursor = 0;

  for (;;) {
    for (;;) {
      while (cursor < textAfterSeparator.length && /\s/.test(textAfterSeparator[cursor] ?? "")) {
        cursor += 1;
      }
      if (textAfterSeparator[cursor] !== "|") break;
      const nextPipe = textAfterSeparator.indexOf("|", cursor + 1);
      if (
        nextPipe >= 0 &&
        textAfterSeparator.slice(cursor + 1, nextPipe).trim() === ""
      ) {
        cursor = nextPipe + 1;
        continue;
      }
      break;
    }
    if (textAfterSeparator[cursor] !== "|") break;
    cursor += 1;

    const cells: string[] = [];
    const rowStart = cursor;
    for (let index = 0; index < columnCount; index += 1) {
      const nextPipe = textAfterSeparator.indexOf("|", cursor);
      if (nextPipe < 0) {
        return { rows, consumed: rowStart - 1 };
      }
      cells.push(textAfterSeparator.slice(cursor, nextPipe).trim());
      cursor = nextPipe + 1;
    }

    if (cells.some((cell) => cell.length === 0) || isMarkdownSeparatorRow(cells)) {
      cursor = rowStart - 1;
      break;
    }

    rows.push(
      Object.fromEntries(
        columns.map((column, index) => [column.key, cells[index] ?? ""]),
      ),
    );
  }

  return { rows, consumed: cursor };
}

function inlineMarkdownTablesFromProse(
  prose: string,
  citationIds: string[],
): { prose: string; tables: AnswerTable[] } {
  const separatorPattern = /\|\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|/g;
  let cursor = 0;
  const keep: string[] = [];
  const tables: AnswerTable[] = [];

  for (;;) {
    separatorPattern.lastIndex = cursor;
    const match = separatorPattern.exec(prose);
    if (!match) break;

    const separator = splitMarkdownTableRow(match[0]);
    if (separator.length < 2 || !isMarkdownSeparatorRow(separator)) {
      cursor = match.index + match[0].length;
      continue;
    }

    const before = prose.slice(cursor, match.index);
    const headerInfo = splitHeaderBeforeInlineTable(before, separator.length);
    if (!headerInfo) {
      cursor = match.index + match[0].length;
      continue;
    }

    const columns = tableColumnsForHeader(headerInfo.header);
    const after = prose.slice(match.index + match[0].length);
    const { rows, consumed } = readInlineTableRows(
      after,
      separator.length,
      columns,
    );
    if (rows.length === 0 || consumed <= 0) {
      cursor = match.index + match[0].length;
      continue;
    }

    keep.push(headerInfo.prefix);
    tables.push({
      id: `answer-inline-table-${tables.length + 1}`,
      title: tables.length === 0 ? "Answer Table" : `Answer Table ${tables.length + 1}`,
      columns,
      rows,
      note:
        "Rendered from a table emitted by Ava's answer; values are row/column data, not inferred from surrounding prose.",
      citationIds,
    });
    cursor = match.index + match[0].length + consumed;
  }

  keep.push(prose.slice(cursor));
  return {
    prose: keep.join("").replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim(),
    tables,
  };
}

function exactCurrencyOrNumber(value: string | number | null): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/[–-]\s*\d/.test(trimmed) || /~|approx|about|directional/i.test(trimmed)) {
    return null;
  }
  const money = trimmed.match(/^\$?\s*([0-9]+(?:\.[0-9]+)?)\s*(k|m|b)?(?:\s*\/\s*(?:yr|year|annual))?$/i);
  if (!money) return null;
  const base = Number(money[1]);
  if (!Number.isFinite(base)) return null;
  const scale = (money[2] ?? "").toLowerCase();
  if (scale === "b") return base * 1_000_000_000;
  if (scale === "m") return base * 1_000_000;
  if (scale === "k") return base * 1_000;
  return base;
}

const COST_STACK_COLORS: string[] = [
  CHART.accent,
  CHART.good,
  CHART.warn,
  CHART.bad,
  CHART.inkSoft,
  CHART.accentSoft,
];

function chartFromExtractedTable(
  table: AnswerTable,
  citationIds: string[],
): AnswerChart | null {
  const scoredColumns = table.columns
    .map((column, index) => {
      const values = table.rows.map((row) =>
        exactCurrencyOrNumber(row[column.key] ?? null),
      );
      const usable = values.filter((value): value is number => value !== null);
      const labelScore = /\b(cost|spend|investment|value|impact|exposure|benefit|amount|revenue)\b/i.test(
        column.label,
      )
        ? 2
        : 0;
      return {
        column,
        index,
        usable,
        score: usable.length + labelScore,
      };
    })
    .filter((candidate) => candidate.usable.length >= 2)
    .sort((a, b) => b.score - a.score);

  const valueColumn = scoredColumns[0]?.column;
  if (!valueColumn) return null;
  const labelColumn =
    table.columns.find((column) => column.key !== valueColumn.key && column.format === "text") ??
    table.columns.find((column) => column.key !== valueColumn.key);
  if (!labelColumn) return null;

  const segments = table.rows
    .map((row, index) => {
      const value = exactCurrencyOrNumber(row[valueColumn.key] ?? null);
      const label = String(row[labelColumn.key] ?? "").trim();
      if (value === null || value <= 0 || !label) return null;
      return {
        label: label.length > 32 ? `${label.slice(0, 29)}...` : label,
        value,
        color: COST_STACK_COLORS[index % COST_STACK_COLORS.length] ?? CHART.accent,
      };
    })
    .filter((segment): segment is { label: string; value: number; color: string } =>
      Boolean(segment),
    )
    .slice(0, 6);

  if (segments.length < 2) return null;
  return {
    id: "answer-table-chart-1",
    kind: "cost-stack",
    title: `${valueColumn.label} by ${labelColumn.label}`,
    data: segments,
    builder: "costStack",
    citationIds,
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
  const inline = inlineMarkdownTablesFromProse(
    markdown.prose,
    citations.map((citation) => citation.id),
  );
  const tables: AnswerTable[] = [];
  const charts: AnswerChart[] = [];
  tables.push(...markdown.tables);
  tables.push(...inline.tables);

  if (
    tables.length > 0 &&
    (input.routing.outputShape === "chart" ||
      input.routing.outputShape === "graph")
  ) {
    const chart = chartFromExtractedTable(
      tables[0],
      citations.map((citation) => citation.id),
    );
    if (chart) charts.push(chart);
  }

  if (tables.length === 0 && (
    input.routing.outputShape === "table" ||
    input.routing.outputShape === "chart" ||
    input.routing.outputShape === "graph"
  )) {
    const table =
      sourceRegisterTable(citations) ?? evidenceRequiredTable(citations);
    if (table) tables.push(table);
  }

  return { prose: inline.prose, citations, tables, charts };
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
