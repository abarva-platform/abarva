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
import {
  classifyAbarvaAnswerMode,
  enforceDecisionGradeAnswer,
} from "@/lib/intelligence/ask/response-policy";
import { stripGovernedArtifactPayloadsFromText } from "@/lib/intelligence/answer/structured-fence-stream-filter";

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
  followups: string[];
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

const MOVES_PHASE_ROWS: AnswerTable["rows"] = [
  {
    phase: "P0 Originate",
    focus: "Frame the bet, sponsor, decision owner, and why-now logic.",
    artifact: "Bet slate and executive question",
    boundary: "No execution approval yet.",
  },
  {
    phase: "P1 Charter",
    focus:
      "Define scope, sponsor, success metric, decision cadence, and evidence gates.",
    artifact: "Sprint charter and governance path",
    boundary: "Accountable sponsor approves the charter.",
  },
  {
    phase: "P2 Discover & Diagnose",
    focus:
      "Ground systems, data, owners, contracts, gaps, and evidence boundaries.",
    artifact: "Current-state evidence pack",
    boundary: "Data and process owners validate the evidence.",
  },
  {
    phase: "P3 Design Future State",
    focus: "Compare options by value, readiness, risk, and dependency.",
    artifact: "Recommended approach and stop/go gate",
    boundary: "Executive owner chooses the path.",
  },
  {
    phase: "P4 Roadmap & Business Case",
    focus:
      "Turn the chosen approach into workstreams, milestones, risks, and funding asks.",
    artifact: "Roadmap and business case",
    boundary: "Finance and sponsor review the funding case.",
  },
  {
    phase: "P5 Approval & Mobilization",
    focus:
      "Confirm owners, controls, vendors, adoption plan, and launch readiness.",
    artifact: "Execution-ready plan",
    boundary: "Launch authority remains with accountable owners.",
  },
  {
    phase: "Tower Track Outcomes",
    focus: "Track adoption, KPI movement, benefits, risks, and funding gates.",
    artifact: "Value-realization scorecard",
    boundary:
      "Tower supports Finance or outcome-owner certification; it does not certify by itself.",
  },
];

function movesExecutionPhaseTable(citationIds: string[]): AnswerTable {
  return {
    id: "answer-moves-phase-plan",
    title: "Moves Phase Plan",
    columns: [
      { key: "phase", label: "Phase" },
      { key: "focus", label: "Focus" },
      { key: "artifact", label: "Governed artifact" },
      { key: "boundary", label: "Decision boundary" },
    ],
    rows: MOVES_PHASE_ROWS,
    note: "Assembled by the AbarVa answer-mode contract so the canonical P0-P5 plus Tower structure is always present.",
    citationIds,
  };
}

function hasMovesPhaseTable(tables: readonly AnswerTable[]): boolean {
  return tables.some((table) => {
    const text = [
      table.title,
      ...table.columns.map((column) => column.label),
      ...table.rows.flatMap((row) => Object.values(row).map(String)),
    ].join("\n");
    return (
      /P0 Originate/.test(text) &&
      /P5 Approval & Mobilization/.test(text) &&
      /Tower Track Outcomes/.test(text)
    );
  });
}

function needsMovesPhaseArtifact(query: string): boolean {
  return /\b(moves?|p0|p1|p2|p3|p4|p5|phase|phases|phase[-\s]?gate|execution|execute|tower outcomes?|tower track outcomes?|show tower)\b/i.test(
    query,
  );
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

const SUPPORTED_CHART_FENCE_TYPES = new Set([
  "bar",
  "horizontal-bar",
  "line",
  "area",
  "pie",
]);

function isSupportedChartFenceType(
  value: unknown,
): value is "bar" | "horizontal-bar" | "line" | "area" | "pie" {
  return typeof value === "string" && SUPPORTED_CHART_FENCE_TYPES.has(value);
}

function validChartFenceRows(
  value: unknown,
  xKey: string,
  yKey: string,
): Array<Record<string, string | number>> {
  if (!Array.isArray(value)) return [];
  return value
    .flatMap((row) => {
      if (typeof row !== "object" || row === null || Array.isArray(row)) {
        return [];
      }
      const record = row as Record<string, unknown>;
      const label = record[xKey];
      const numeric = exactCurrencyOrNumber(
        record[yKey] as string | number | null,
      );
      if (
        numeric === null ||
        (typeof label !== "string" && typeof label !== "number")
      ) {
        return [];
      }
      return [
        {
          ...Object.fromEntries(
            Object.entries(record).filter(
              (entry): entry is [string, string | number] =>
                typeof entry[1] === "string" || typeof entry[1] === "number",
            ),
          ),
          [xKey]: label,
          [yKey]: numeric,
        },
      ];
    })
    .slice(0, 12);
}

function chartFenceToArtifact(
  raw: string,
  index: number,
  citationIds: string[],
): AnswerChart | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return null;
  }
  const record = parsed as Record<string, unknown>;
  if (!isSupportedChartFenceType(record.type)) return null;
  const xKey = typeof record.xKey === "string" ? record.xKey : "";
  const yKey = typeof record.yKey === "string" ? record.yKey : "";
  if (!xKey || !yKey) return null;
  const rows = validChartFenceRows(record.data, xKey, yKey);
  if (rows.length < 2) return null;

  const type = record.type;
  const kind =
    type === "line" || type === "area"
      ? "line"
      : type === "horizontal-bar"
        ? "horizontal-bar"
        : "bar";
  return {
    id: `answer-chart-fence-${index + 1}`,
    kind,
    title:
      typeof record.title === "string" && record.title.trim()
        ? record.title.trim()
        : "Answer Chart",
    subtitle:
      typeof record.subtitle === "string" && record.subtitle.trim()
        ? record.subtitle.trim()
        : undefined,
    data: {
      type,
      title: typeof record.title === "string" ? record.title : undefined,
      subtitle:
        typeof record.subtitle === "string" ? record.subtitle : undefined,
      data: rows,
      xKey,
      yKey,
      yKey2: typeof record.yKey2 === "string" ? record.yKey2 : undefined,
      unit: typeof record.unit === "string" ? record.unit : undefined,
      note: typeof record.note === "string" ? record.note : undefined,
    },
    builder: "inlineChart",
    xKey,
    yKey,
    unit: typeof record.unit === "string" ? record.unit : undefined,
    sourceNote:
      typeof record.sourceNote === "string"
        ? record.sourceNote
        : typeof record.note === "string"
          ? record.note
          : undefined,
    citationIds,
  };
}

function chartFencesFromProse(
  prose: string,
  citationIds: string[],
): { prose: string; charts: AnswerChart[] } {
  const charts: AnswerChart[] = [];
  const fencedCleaned = prose.replace(
    /```chart\s*([\s\S]*?)```/gi,
    (_match, raw: string) => {
      const chart = chartFenceToArtifact(raw, charts.length, citationIds);
      if (chart) charts.push(chart);
      return "\n";
    },
  );
  const cleaned = fencedCleaned.replace(
    /(^|[\n\r])\s*chart\s*[\n\r]+\s*([\s\S]{0,5000}?)(?:`{3}|(?=[\n\r]\s*(?:Evidence boundary:|Decision boundary:|Next move:|$)))/gi,
    (_match, prefix: string, raw: string) => {
      const chart = chartFenceToArtifact(
        raw.trim(),
        charts.length,
        citationIds,
      );
      if (chart) charts.push(chart);
      return prefix || "\n";
    },
  );
  return {
    prose: cleaned.replace(/\n{3,}/g, "\n\n").trim(),
    charts,
  };
}

function followupsFenceFromProse(prose: string): {
  prose: string;
  followups: string[];
} {
  let followups: string[] = [];
  const cleaned = prose.replace(
    /```followups\s*([\s\S]*?)```/gi,
    (_match, raw: string) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        return "\n";
      }
      if (!Array.isArray(parsed)) return "\n";
      followups = parsed
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter((item) => item.length > 0 && item.length <= 200)
        .slice(0, 3);
      return "\n";
    },
  );
  return {
    prose: cleaned.replace(/\n{3,}/g, "\n\n").trim(),
    followups,
  };
}

// Governed decision-table exhibit — Fix Slice 1/2. Ranked-comparison answers
// (rank X vs Y vs Z by value/complexity/readiness) are steered by the
// synthesizer toward a ```decision-table fenced JSON block instead of relying
// on regex-parsed Markdown, so a real typed table + derived charts render
// even when the model's prose style drifts. See synthesizer.ts's
// isRankedDecisionAsk() repair pass for the prompt side of this contract.
export interface DecisionTableRow {
  initiative: string;
  value: string | null;
  valueScore: number | null;
  complexity: string | null;
  complexityScore: number | null;
  readiness: string | null;
  readinessScore: number | null;
  evidenceBasis: string | null;
  recommendation: string | null;
  nextAction: string | null;
  directional: boolean;
}

const DECISION_TABLE_COLUMNS: AnswerTableColumn[] = [
  { key: "initiative", label: "Initiative", format: "text", align: "left" },
  { key: "value", label: "Value", format: "text", align: "left" },
  { key: "complexity", label: "Complexity", format: "text", align: "left" },
  { key: "readiness", label: "Readiness", format: "text", align: "left" },
  {
    key: "evidenceBasis",
    label: "Evidence basis",
    format: "text",
    align: "left",
  },
  {
    key: "recommendation",
    label: "Recommendation",
    format: "text",
    align: "left",
  },
  { key: "nextAction", label: "Next action", format: "text", align: "left" },
];

function clampScore(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  if (value < 0 || value > 100) return null;
  return Math.round(value);
}

function textOrNull(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.slice(0, 240) : null;
}

function parseDecisionTableFenceRows(
  raw: string,
): { title: string | null; rows: DecisionTableRow[] } | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return null;
  }
  const record = parsed as Record<string, unknown>;
  const rawRows = Array.isArray(record.rows)
    ? record.rows
    : Array.isArray(record.records)
      ? record.records
      : null;
  if (!rawRows) return null;

  const rows: DecisionTableRow[] = rawRows
    .flatMap((entry): DecisionTableRow[] => {
      if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
        return [];
      }
      const row = entry as Record<string, unknown>;
      const initiative = textOrNull(row.initiative);
      if (!initiative) return [];
      return [
        {
          initiative,
          value: textOrNull(row.value),
          valueScore: clampScore(row.valueScore),
          complexity: textOrNull(row.complexity),
          complexityScore: clampScore(row.complexityScore),
          readiness: textOrNull(row.readiness),
          readinessScore: clampScore(row.readinessScore),
          evidenceBasis: textOrNull(row.evidenceBasis),
          recommendation: textOrNull(row.recommendation),
          nextAction: textOrNull(row.nextAction),
          directional: row.directional === true,
        },
      ];
    })
    .slice(0, 12);

  if (rows.length === 0) return null;
  return { title: textOrNull(record.title), rows };
}

function readBalancedJsonPayload(
  prose: string,
  startIndex: number,
): { raw: string; endIndex: number } | null {
  let cursor = startIndex;
  while (cursor < prose.length && /\s/.test(prose[cursor] ?? "")) {
    cursor += 1;
  }
  const open = prose[cursor];
  if (open !== "{" && open !== "[") return null;
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let insideString = false;
  let escaping = false;

  for (let index = cursor; index < prose.length; index += 1) {
    const char = prose[index] ?? "";
    if (insideString) {
      if (escaping) {
        escaping = false;
      } else if (char === "\\") {
        escaping = true;
      } else if (char === '"') {
        insideString = false;
      }
      continue;
    }
    if (char === '"') {
      insideString = true;
      continue;
    }
    if (char === open || char === "{" || char === "[") {
      depth += 1;
      continue;
    }
    if (char === close || char === "}" || char === "]") {
      depth -= 1;
      if (depth <= 0) {
        return {
          raw: prose.slice(cursor, index + 1),
          endIndex: index + 1,
        };
      }
    }
  }

  return null;
}

function nearFencePayloadsFromProse(
  prose: string,
  label: "decision-table",
): string[] {
  const payloads: string[] = [];
  const pattern = new RegExp(`\`{1,3}\\s*${label}\\s*(?=[\\[{])`, "gi");
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(prose))) {
    const payload = readBalancedJsonPayload(
      prose,
      match.index + (match[0]?.length ?? 0),
    );
    if (!payload) continue;
    payloads.push(payload.raw);
    pattern.lastIndex = payload.endIndex;
  }
  return payloads;
}

function markDirectional(
  value: string | null,
  directional: boolean,
): string | null {
  if (!value) return directional ? "Directional estimate" : null;
  if (!directional) return value;
  return /directional/i.test(value) ? value : `${value} (directional)`;
}

function decisionTableFromRows(
  title: string | null,
  rows: DecisionTableRow[],
  citationIds: string[],
  index: number,
): AnswerTable {
  const anyDirectional = rows.some((row) => row.directional);
  return {
    id: `answer-decision-table-${index + 1}`,
    title: title ?? "Decision Table",
    columns: DECISION_TABLE_COLUMNS,
    rows: rows.map((row) => ({
      initiative: row.initiative,
      value: markDirectional(row.value, row.directional),
      complexity: markDirectional(row.complexity, row.directional),
      readiness: markDirectional(row.readiness, row.directional),
      evidenceBasis: row.evidenceBasis,
      recommendation: row.recommendation,
      nextAction: row.nextAction,
    })),
    note: anyDirectional
      ? "Ranked by aVa from the loaded evidence and cited context. Rows marked (directional) are professional-judgment estimates pending source validation, not invented values."
      : "Ranked by aVa from the loaded evidence and cited context.",
    citationIds,
  };
}

function decisionTableFencesFromProse(
  prose: string,
  citationIds: string[],
): {
  prose: string;
  tables: AnswerTable[];
  decisionRows: DecisionTableRow[];
} {
  const tables: AnswerTable[] = [];
  let decisionRows: DecisionTableRow[] = [];
  const parsedPayloads = new Set<string>();
  const cleaned = prose.replace(
    /```decision-table\s*([\s\S]*?)```/gi,
    (_match, raw: string) => {
      parsedPayloads.add(raw.trim());
      const parsedFence = parseDecisionTableFenceRows(raw);
      if (!parsedFence) return "\n";
      tables.push(
        decisionTableFromRows(
          parsedFence.title,
          parsedFence.rows,
          citationIds,
          tables.length,
        ),
      );
      if (decisionRows.length === 0) decisionRows = parsedFence.rows;
      return "\n";
    },
  );

  for (const raw of nearFencePayloadsFromProse(prose, "decision-table")) {
    const trimmed = raw.trim();
    if (parsedPayloads.has(trimmed)) continue;
    parsedPayloads.add(trimmed);
    const parsedFence = parseDecisionTableFenceRows(trimmed);
    if (!parsedFence) continue;
    tables.push(
      decisionTableFromRows(
        parsedFence.title,
        parsedFence.rows,
        citationIds,
        tables.length,
      ),
    );
    if (decisionRows.length === 0) decisionRows = parsedFence.rows;
  }

  return {
    prose: stripGovernedArtifactPayloadsFromText(cleaned),
    tables,
    decisionRows,
  };
}

function anyDirectionalRow(rows: DecisionTableRow[]): boolean {
  return rows.some((row) => row.directional);
}

function directionalSuffix(rows: DecisionTableRow[]): string {
  return anyDirectionalRow(rows) ? " (directional estimate)" : "";
}

function directionalChartSubtitle(
  rows: DecisionTableRow[],
  base?: string,
): string | undefined {
  if (!anyDirectionalRow(rows)) return base;
  const caveat = "Includes directional estimates pending source validation.";
  return base ? `${caveat} ${base}` : caveat;
}

function valueComplexityMatrixFromDecisionRows(
  rows: DecisionTableRow[],
  citationIds: string[],
): AnswerChart | null {
  const points = rows
    .filter((row) => row.valueScore !== null && row.complexityScore !== null)
    .map((row) => ({
      label:
        row.initiative.length > 42
          ? `${row.initiative.slice(0, 39)}...`
          : row.initiative,
      x: row.complexityScore as number,
      y: row.valueScore as number,
    }))
    .slice(0, 12);
  if (points.length < 2) return null;
  return {
    id: "answer-decision-table-quadrant-matrix",
    kind: "quadrant-matrix",
    title: `Value / Complexity 2x2 Matrix${directionalSuffix(rows)}`,
    subtitle: directionalChartSubtitle(rows),
    data: {
      title: "Value / Complexity 2x2 Matrix",
      xAxisLabel: "Implementation complexity",
      yAxisLabel: "Business value",
      points,
    },
    builder: "quadrantMatrix",
    citationIds,
  };
}

function readinessBarChartFromDecisionRows(
  rows: DecisionTableRow[],
  citationIds: string[],
): AnswerChart | null {
  const data = rows
    .filter((row) => row.readinessScore !== null)
    .map((row) => ({
      initiative:
        row.initiative.length > 32
          ? `${row.initiative.slice(0, 29)}...`
          : row.initiative,
      readiness: row.readinessScore as number,
    }))
    .slice(0, 8);
  if (data.length < 2) return null;
  return {
    id: "answer-decision-table-readiness-bar",
    kind: "horizontal-bar",
    title: `Readiness by Initiative${directionalSuffix(rows)}`,
    subtitle: directionalChartSubtitle(rows),
    data: {
      type: "horizontal-bar",
      title: "Readiness by Initiative",
      data,
      xKey: "initiative",
      yKey: "readiness",
      unit: "%",
    },
    builder: "inlineChart",
    citationIds,
  };
}

function priorityStackFromDecisionRows(
  rows: DecisionTableRow[],
  citationIds: string[],
): AnswerChart | null {
  const data = rows
    .filter(
      (row) =>
        row.valueScore !== null &&
        row.complexityScore !== null &&
        row.readinessScore !== null,
    )
    .map((row) => ({
      initiative:
        row.initiative.length > 32
          ? `${row.initiative.slice(0, 29)}...`
          : row.initiative,
      priority: Math.round(
        (row.valueScore as number) * 0.5 +
          (row.readinessScore as number) * 0.3 +
          (100 - (row.complexityScore as number)) * 0.2,
      ),
    }))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 8);
  if (data.length < 2) return null;
  return {
    id: "answer-decision-table-priority-stack",
    kind: "bar",
    title: `Priority Stack Ranking${directionalSuffix(rows)}`,
    subtitle: directionalChartSubtitle(
      rows,
      "Priority blends value (50%), readiness (30%), and inverse complexity (20%).",
    ),
    data: {
      type: "bar",
      title: "Priority Stack Ranking",
      subtitle: "Weighted by value, readiness, and inverse complexity",
      data,
      xKey: "initiative",
      yKey: "priority",
    },
    builder: "inlineChart",
    citationIds,
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

function ordinalScore(
  value: string | number | null | undefined,
): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    if (value >= 0 && value <= 5) return (value / 5) * 100;
    if (value >= 0 && value <= 10) return (value / 10) * 100;
    if (value >= 0 && value <= 100) return value;
    return null;
  }
  const text = String(value ?? "")
    .trim()
    .toLowerCase();
  if (!text) return null;
  const numeric = text.match(/\b([0-9]+(?:\.[0-9]+)?)\b/);
  if (numeric) {
    const parsed = Number(numeric[1]);
    if (Number.isFinite(parsed)) {
      if (parsed >= 0 && parsed <= 5) return (parsed / 5) * 100;
      if (parsed >= 0 && parsed <= 10) return (parsed / 10) * 100;
      if (parsed >= 0 && parsed <= 100) return parsed;
    }
  }
  if (/\b(very\s+high|highest|critical|transformational)\b/.test(text)) {
    return 92;
  }
  if (/\b(high|large|major|strong|significant)\b/.test(text)) return 78;
  if (/\b(medium|moderate|mid|balanced)\b/.test(text)) return 52;
  if (/\b(low|small|minor|limited|easy|simple)\b/.test(text)) return 24;
  return null;
}

function isQuadrantMatrixRequest(query: string): boolean {
  const q = query.toLowerCase();
  return (
    /\b(?:2\s*x\s*2|2x2|quadrant)\b/.test(q) ||
    /\bvalue\b[\s\S]{0,80}\bcomplexity\b/.test(q) ||
    /\bcomplexity\b[\s\S]{0,80}\bvalue\b/.test(q)
  );
}

function quadrantFromExtractedTable(
  table: AnswerTable,
  citationIds: string[],
): AnswerChart | null {
  const labelColumn =
    findColumnByLabel(
      table,
      /\b(use\s*case|initiative|opportunity|option|bet|investment|case)\b/i,
    ) ?? table.columns.find((column) => column.format === "text");
  const valueColumn = findColumnByLabel(
    table,
    /\b(value|impact|benefit|roi|upside|importance)\b/i,
  );
  const complexityColumn = findColumnByLabel(
    table,
    /\b(complexity|effort|difficulty|delivery|implementation|feasibility)\b/i,
  );
  if (!labelColumn || !valueColumn || !complexityColumn) return null;

  const points = table.rows
    .map((row) => {
      const label = textForCell(row[labelColumn.key]);
      const y = ordinalScore(row[valueColumn.key]);
      const x = ordinalScore(row[complexityColumn.key]);
      if (!label || y === null || x === null) return null;
      return {
        label: label.length > 42 ? `${label.slice(0, 39)}...` : label,
        x,
        y,
      };
    })
    .filter((point): point is { label: string; x: number; y: number } =>
      Boolean(point),
    )
    .slice(0, 12);

  if (points.length < 2) return null;
  return {
    id: `${table.id}-quadrant-matrix`,
    kind: "quadrant-matrix",
    title: "Value / Complexity 2x2 Matrix",
    data: {
      title: "Value / Complexity 2x2 Matrix",
      xAxisLabel: "Implementation complexity",
      yAxisLabel: "Business value",
      points,
    },
    builder: "quadrantMatrix",
    citationIds,
  };
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
  query: string,
): AnswerChart | null {
  if (isQuadrantMatrixRequest(query)) {
    const quadrant = quadrantFromExtractedTable(table, citationIds);
    if (quadrant) return quadrant;
  }
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
  const shouldRenderSourceTables =
    hasExplicitStructuredArtifactRequest(routing);

  sources.forEach((source, sourceIndex) => {
    const citationIds = [`c${sourceIndex + 1}`];
    for (const sourceTable of source.structured?.tables ?? []) {
      if (!shouldRenderSourceTables) continue;
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

function hasExplicitStructuredArtifactRequest(
  routing: RoutingDecision,
): boolean {
  const q = routing.query.toLowerCase();
  return (
    wantsGraphArtifact(q) || wantsChartArtifact(q) || wantsTableArtifact(q)
  );
}

function wantsGraphArtifact(query: string): boolean {
  return /\b(graph|map|network|relationship|relationships|dependenc|upstream|downstream)\b/.test(
    query,
  );
}

function wantsChartArtifact(query: string): boolean {
  return (
    /\b(chart|charts|visual|visually|visuali[sz]e|plot|graphically|trend|trends|over time|by month|by quarter|year over year|trajectory|2\s*x\s*2|2x2|quadrant)\b/.test(
      query,
    ) ||
    /\bvalue\b[\s\S]{0,80}\bcomplexity\b/.test(query) ||
    /\bcomplexity\b[\s\S]{0,80}\bvalue\b/.test(query)
  );
}

function wantsTableArtifact(query: string): boolean {
  return /\b(table|tables|tabular|matrix|scorecard|workbook|top\s+\d|rank|ranked|compare|comparison)\b/.test(
    query,
  );
}

export function buildStructuredExhibits(
  input: StructuredExhibitsInput,
): StructuredExhibits {
  const citations = answerCitationsFromAskSources(input.sources);
  const answerMode = classifyAbarvaAnswerMode(input.routing.query);
  const shouldRenderStructured =
    hasExplicitStructuredArtifactRequest(input.routing) ||
    answerMode === "strategy_to_moves_execution";
  const query = input.routing.query.toLowerCase();
  const shouldBuildChart =
    input.routing.outputShape === "chart" || wantsChartArtifact(query);
  const shouldBuildGraph =
    input.routing.outputShape === "graph" || wantsGraphArtifact(query);
  const sourceExhibits = structuredSourceExhibits(input.sources, input.routing);
  const followupsResult = followupsFenceFromProse(input.prose);
  const chartFences = chartFencesFromProse(
    followupsResult.prose,
    citations.map((citation) => citation.id),
  );
  const decisionFences = decisionTableFencesFromProse(
    chartFences.prose,
    citations.map((citation) => citation.id),
  );
  const markdown = markdownTablesFromProse(
    stripGovernedArtifactPayloadsFromText(decisionFences.prose),
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
  tables.push(...decisionFences.tables);
  charts.push(...sourceExhibits.charts);
  charts.push(...chartFences.charts);
  if (decisionFences.decisionRows.length > 0) {
    const decisionCitationIds = citations.map((citation) => citation.id);
    const matrix = valueComplexityMatrixFromDecisionRows(
      decisionFences.decisionRows,
      decisionCitationIds,
    );
    if (matrix) charts.push(matrix);
    const readinessBar = readinessBarChartFromDecisionRows(
      decisionFences.decisionRows,
      decisionCitationIds,
    );
    if (readinessBar) charts.push(readinessBar);
    const priorityStack = priorityStackFromDecisionRows(
      decisionFences.decisionRows,
      decisionCitationIds,
    );
    if (priorityStack) charts.push(priorityStack);
  }
  graphs.push(...sourceExhibits.graphs);
  if (
    shouldRenderStructured ||
    markdown.tables.length > 0 ||
    inline.tables.length > 0
  ) {
    tables.push(...markdown.tables);
    tables.push(...inline.tables);
  }
  if (
    answerMode === "strategy_to_moves_execution" &&
    needsMovesPhaseArtifact(input.routing.query) &&
    !hasMovesPhaseTable(tables)
  ) {
    tables.push(
      movesExecutionPhaseTable(citations.map((citation) => citation.id)),
    );
  }

  if (
    shouldRenderStructured &&
    charts.length === 0 &&
    tables.length > 0 &&
    shouldBuildChart
  ) {
    const chart = chartFromExtractedTable(
      tables[0],
      citations.map((citation) => citation.id),
      input.routing.query,
    );
    if (chart) charts.push(chart);
  }
  if (
    shouldRenderStructured &&
    graphs.length === 0 &&
    tables.length > 0 &&
    shouldBuildGraph
  ) {
    const graph = graphFromExtractedTable(
      tables[0],
      citations.map((citation) => citation.id),
    );
    if (graph) graphs.push(graph);
  }

  const cleanedProse = inline.prose
    ? enforceDecisionGradeAnswer(stripResidualTableFragments(inline.prose))
    : "";

  return {
    prose: cleanedProse,
    citations,
    tables,
    charts,
    graphs,
    followups: followupsResult.followups,
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
