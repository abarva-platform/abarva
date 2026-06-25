import type {
  AskSource,
  AskStructuredChartHint,
  AskStructuredGraphHint,
  AskStructuredTable,
} from "@/lib/intelligence/ask/types";
import type { RoutingDecision } from "@/lib/intelligence/answer/router";
import type {
  AnswerChart,
  AnswerCitation,
  AnswerGraph,
  AnswerTable,
  AnswerTableColumn,
} from "@/lib/ava-answer/contract";
import { CHART } from "@/lib/programs/expert-kernel/exports/board-grade/svg-charts";
import { enforceDecisionGradeAnswer } from "@/lib/intelligence/ask/response-policy";

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
  graphs: AnswerGraph[];
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

function evidenceRequiredTable(
  citations: AnswerCitation[],
  outputShape: RoutingDecision["outputShape"] = "table",
): AnswerTable {
  const requestedEvidence =
    outputShape === "graph"
      ? "Source-to-target relationship edge pairs for the requested graph"
      : outputShape === "chart"
        ? "Connected numeric row/column source data for the requested chart"
        : "Tenant data extract for the requested comparison";
  const missingStatus =
    outputShape === "graph"
      ? "No defensible edge rows were present in the retrieved cited sources"
      : outputShape === "chart"
        ? "No exact comparable numeric rows were present in the retrieved cited sources"
        : citations.length > 0
          ? "Not present in the retrieved cited sources"
          : "No cited source available for the requested rows";
  const nextMove =
    outputShape === "graph"
      ? "Load or validate From / Relationship / To evidence before rendering a dependency graph."
      : outputShape === "chart"
        ? "Validate source rows with exact comparable values before rendering a chart."
        : "Validate or load the source table before approving tenant-specific numbers.";
  return {
    id: "answer-evidence-required",
    title:
      outputShape === "graph"
        ? "Graph Evidence Required"
        : outputShape === "chart"
          ? "Chart Evidence Required"
          : "Evidence Required",
    columns: [
      { key: "evidence", label: "Evidence" },
      { key: "status", label: "Status" },
      { key: "nextMove", label: "Next Move" },
    ],
    rows: [
      {
        evidence: requestedEvidence,
        status: citations.length > 0 ? missingStatus : "No cited source available for the requested rows",
        nextMove,
      },
    ],
    note:
      outputShape === "graph"
        ? "Rendered because the user asked for a graph, but aVa did not have enough connected edge data to populate a graph without fabrication."
        : outputShape === "chart"
          ? "Rendered because the user asked for a chart, but aVa did not have enough exact comparable values to populate a chart without fabrication."
          : "Rendered because the user asked for a table, but aVa did not have enough connected data to populate tenant-specific rows without fabrication.",
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
  if (
    /\b(cost|spend|investment|value|impact|exposure|benefit|amount|revenue|margin)\b/.test(
      normalized,
    )
  ) {
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
            columns.map((column, index) => [column.key, cells[index] ?? ""]),
          ),
        );
        cursor += 1;
      }
      if (rows.length > 0) {
        tables.push({
          id: `answer-markdown-table-${tables.length + 1}`,
          title:
            tables.length === 0
              ? "Answer Table"
              : `Answer Table ${tables.length + 1}`,
          columns,
          rows,
          note: "Rendered from a Markdown table emitted in aVa's answer; values are not inferred from surrounding prose.",
          citationIds,
        });
        i = cursor - 1;
        continue;
      }
    }
    keep.push(lines[i] ?? "");
  }

  return {
    prose: keep
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim(),
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
      while (
        cursor < textAfterSeparator.length &&
        /\s/.test(textAfterSeparator[cursor] ?? "")
      ) {
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

    if (
      cells.some((cell) => cell.length === 0) ||
      isMarkdownSeparatorRow(cells)
    ) {
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

    if (headerInfo.prefix.trim()) {
      keep.push(`${headerInfo.prefix.trimEnd()} `);
    }
    tables.push({
      id: `answer-inline-table-${tables.length + 1}`,
      title:
        tables.length === 0
          ? "Answer Table"
          : `Answer Table ${tables.length + 1}`,
      columns,
      rows,
      note: "Rendered from a table emitted by aVa's answer; values are row/column data, not inferred from surrounding prose.",
      citationIds,
    });
    cursor = match.index + match[0].length + consumed;
  }

  keep.push(prose.slice(cursor));
  return {
    prose: keep
      .join("")
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim(),
    tables,
  };
}

function stripResidualTableFragments(prose: string): string {
  const stripped = prose
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => {
      if (!line) return false;
      const pipeCount = (line.match(/\|/g) ?? []).length;
      if (pipeCount >= 2) return false;
      if (/^\|/.test(line) || /\|$/.test(line)) return false;
      if (/^(?:[A-Z]\.\s*){2,}$/i.test(line)) return false;
      return true;
    })
    .join("\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return stripped
    .replace(
      /\b(?:Named examples|Named Examples|ROI \/ value pool|ROI and value pool|Chart data)\s+Table\s*(?=\n{2,}(?:Evidence gap:|Next move:|This is|$))/g,
      "",
    )
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function artifactGapText(
  outputShape: RoutingDecision["outputShape"],
  citations: AnswerCitation[],
): string {
  const citedContext =
    citations.length > 0
      ? " The retrieved citations are still attached for source inspection."
      : "";
  if (outputShape === "chart") {
    return `Evidence gap: I do not see connected numeric row/column source data for a defensible chart.${citedContext} I am not rendering a visual from prose-only figures.`;
  }
  if (outputShape === "graph") {
    return `Evidence gap: I do not see source-to-target relationship edge pairs for a defensible graph.${citedContext} I am not rendering a graph from integration counts alone.`;
  }
  return "";
}

function exactCurrencyOrNumber(value: string | number | null): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (
    /[–-]\s*\d/.test(trimmed) ||
    /~|approx|about|directional/i.test(trimmed)
  ) {
    return null;
  }
  const percent = trimmed.match(/^([0-9]+(?:\.[0-9]+)?)\s*%$/);
  if (percent) {
    const value = Number(percent[1]);
    return Number.isFinite(value) ? value : null;
  }
  const money = trimmed.match(
    /^\$?\s*([0-9]+(?:\.[0-9]+)?)\s*(k|m|b)?(?:\s*\/\s*(?:yr|year|annual))?$/i,
  );
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
      const labelScore =
        /\b(cost|spend|investment|value|impact|exposure|benefit|amount|revenue)\b/i.test(
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
    table.columns.find(
      (column) => column.key !== valueColumn.key && column.format === "text",
    ) ?? table.columns.find((column) => column.key !== valueColumn.key);
  if (!labelColumn) return null;

  const segments = table.rows
    .map((row, index) => {
      const value = exactCurrencyOrNumber(row[valueColumn.key] ?? null);
      const label = String(row[labelColumn.key] ?? "").trim();
      if (value === null || value <= 0 || !label) return null;
      return {
        label: label.length > 32 ? `${label.slice(0, 29)}...` : label,
        value,
        color:
          COST_STACK_COLORS[index % COST_STACK_COLORS.length] ?? CHART.accent,
      };
    })
    .filter(
      (segment): segment is { label: string; value: number; color: string } =>
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

function findColumnByLabel(
  table: AnswerTable,
  pattern: RegExp,
): AnswerTableColumn | undefined {
  return table.columns.find((column) => pattern.test(column.label));
}

function textForCell(value: string | number | null | undefined): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function graphFromExtractedTable(
  table: AnswerTable,
  citationIds: string[],
): AnswerGraph | null {
  const fromColumn =
    findColumnByLabel(
      table,
      /\b(from|source|upstream|system|application|platform|vendor|capability|initiative)\b/i,
    ) ?? table.columns.find((column) => column.format === "text");
  const toColumn =
    findColumnByLabel(
      table,
      /\b(to|target|downstream|depends?\s*on|dependency|consumer|owner|function|outcome)\b/i,
    ) ??
    table.columns.find(
      (column) => column.key !== fromColumn?.key && column.format === "text",
    );
  if (!fromColumn || !toColumn || fromColumn.key === toColumn.key) return null;

  const relationshipColumn = findColumnByLabel(
    table,
    /\b(relationship|edge|link|dependency|risk|signal|evidence)\b/i,
  );
  const nodes = new Map<string, { id: string; label: string }>();
  const edges: AnswerGraph["edges"] = [];

  for (const row of table.rows) {
    const from = textForCell(row[fromColumn.key]);
    const to = textForCell(row[toColumn.key]);
    if (!from || !to || from === to) continue;
    const fromId = `n${nodes.size + 1}`;
    if (!nodes.has(from)) nodes.set(from, { id: fromId, label: from });
    const toId = `n${nodes.size + 1}`;
    if (!nodes.has(to)) nodes.set(to, { id: toId, label: to });
    const source = nodes.get(from);
    const target = nodes.get(to);
    if (!source || !target) continue;
    edges.push({
      from: source.id,
      to: target.id,
      label: relationshipColumn
        ? textForCell(row[relationshipColumn.key]).slice(0, 80)
        : undefined,
    });
  }

  if (nodes.size < 2 || edges.length < 1) return null;
  return {
    id: "answer-relationship-graph-1",
    title: table.title ?? "Relationship Graph",
    nodes: [...nodes.values()],
    edges: edges.slice(0, 12),
    citationIds,
  };
}

function tableFromStructuredSource(
  sourceTable: AskStructuredTable,
  citationIds: string[],
): AnswerTable {
  return {
    id: `source-${sourceTable.id}`,
    title: sourceTable.title,
    columns: sourceTable.columns,
    rows: sourceTable.rows,
    note:
      sourceTable.note ??
      "Rendered from structured retrieved source rows, not inferred from prose.",
    citationIds,
  };
}

function chartFromStructuredTable(
  table: AnswerTable,
  hint: AskStructuredChartHint | undefined,
  citationIds: string[],
): AnswerChart | null {
  if (!hint) return null;
  const labelColumn = table.columns.find(
    (column) => column.key === hint.labelKey,
  );
  const valueColumn = table.columns.find(
    (column) => column.key === hint.valueKey,
  );
  if (!labelColumn || !valueColumn) return null;

  const segments = table.rows
    .map((row, index) => {
      const value = exactCurrencyOrNumber(row[valueColumn.key] ?? null);
      const label = textForCell(row[labelColumn.key]);
      if (value === null || value <= 0 || !label) return null;
      return {
        label: label.length > 32 ? `${label.slice(0, 29)}...` : label,
        value,
        color:
          COST_STACK_COLORS[index % COST_STACK_COLORS.length] ?? CHART.accent,
      };
    })
    .filter(
      (segment): segment is { label: string; value: number; color: string } =>
        Boolean(segment),
    )
    .slice(0, 6);

  if (segments.length < 2) return null;
  return {
    id: `${table.id}-chart`,
    kind: "cost-stack",
    title: hint.title ?? `${valueColumn.label} by ${labelColumn.label}`,
    data: segments,
    builder: "costStack",
    citationIds,
  };
}

function graphFromStructuredTable(
  table: AnswerTable,
  hint: AskStructuredGraphHint | undefined,
  citationIds: string[],
): AnswerGraph | null {
  if (!hint) return null;
  const nodes = new Map<string, { id: string; label: string }>();
  const edges: AnswerGraph["edges"] = [];

  for (const row of table.rows) {
    const from = textForCell(row[hint.fromKey]);
    const to = textForCell(row[hint.toKey]);
    if (!from || !to || from === to) continue;
    if (!nodes.has(from))
      nodes.set(from, { id: `n${nodes.size + 1}`, label: from });
    if (!nodes.has(to)) nodes.set(to, { id: `n${nodes.size + 1}`, label: to });
    const source = nodes.get(from);
    const target = nodes.get(to);
    if (!source || !target) continue;
    edges.push({
      from: source.id,
      to: target.id,
      label: hint.labelKey
        ? textForCell(row[hint.labelKey]).slice(0, 80)
        : undefined,
    });
  }

  if (nodes.size < 2 || edges.length < 1) return null;
  return {
    id: `${table.id}-graph`,
    title: hint.title ?? table.title,
    nodes: [...nodes.values()],
    edges: edges.slice(0, 12),
    citationIds,
  };
}

function structuredSourceExhibits(
  sources: AskSource[],
  routing: RoutingDecision,
): Pick<StructuredExhibits, "tables" | "charts" | "graphs"> {
  const tables: AnswerTable[] = [];
  const charts: AnswerChart[] = [];
  const graphs: AnswerGraph[] = [];

  sources.forEach((source, sourceIndex) => {
    const citationIds = [`c${sourceIndex + 1}`];
    for (const sourceTable of source.structured?.tables ?? []) {
      if (sourceTable.rows.length === 0) continue;
      const table = tableFromStructuredSource(sourceTable, citationIds);
      tables.push(table);
      if (routing.outputShape === "chart") {
        const chart = chartFromStructuredTable(
          table,
          sourceTable.chart,
          citationIds,
        );
        if (chart) charts.push(chart);
      }
      if (routing.outputShape === "graph") {
        const graph = graphFromStructuredTable(
          table,
          sourceTable.graph,
          citationIds,
        );
        if (graph) graphs.push(graph);
      }
    }
  });

  return { tables, charts, graphs };
}

export function buildStructuredExhibits(
  input: StructuredExhibitsInput,
): StructuredExhibits {
  const citations = answerCitationsFromAskSources(input.sources);
  const sourceExhibits = structuredSourceExhibits(input.sources, input.routing);
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
  const graphs: AnswerGraph[] = [];
  tables.push(...sourceExhibits.tables);
  charts.push(...sourceExhibits.charts);
  graphs.push(...sourceExhibits.graphs);
  tables.push(...markdown.tables);
  tables.push(...inline.tables);

  if (
    charts.length === 0 &&
    tables.length > 0 &&
    input.routing.outputShape === "chart"
  ) {
    const chart = chartFromExtractedTable(
      tables[0],
      citations.map((citation) => citation.id),
    );
    if (chart) charts.push(chart);
  }
  if (
    graphs.length === 0 &&
    tables.length > 0 &&
    input.routing.outputShape === "graph"
  ) {
    const graph = graphFromExtractedTable(
      tables[0],
      citations.map((citation) => citation.id),
    );
    if (graph) graphs.push(graph);
  }

  if (
    tables.length === 0 &&
    (input.routing.outputShape === "table" ||
      input.routing.outputShape === "chart" ||
      input.routing.outputShape === "graph")
  ) {
    tables.push(evidenceRequiredTable(citations, input.routing.outputShape));
  }

  const artifactGap = artifactGapText(input.routing.outputShape, citations);
  const cleanedProse = inline.prose
    ? enforceDecisionGradeAnswer(stripResidualTableFragments(inline.prose))
    : "";

  return {
    prose: [cleanedProse, artifactGap].filter(Boolean).join("\n\n"),
    citations,
    tables,
    charts,
    graphs,
  };
}

export function hasRenderableStructuredExhibits(
  exhibits: Pick<StructuredExhibits, "tables" | "charts" | "graphs">,
): boolean {
  return (
    exhibits.tables.length > 0 ||
    exhibits.charts.length > 0 ||
    exhibits.graphs.length > 0
  );
}
