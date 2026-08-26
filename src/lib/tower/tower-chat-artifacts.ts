import { composeAvaAnswer } from "@/lib/ava-answer/composeAvaAnswer";
import type {
  AnswerChart,
  AnswerChartKind,
  AnswerTable,
  AnswerTableColumn,
  AvaAnswerPacket,
  AvaArtifact,
  AvaMetricRef,
} from "@/lib/ava-answer/contract";
import {
  chartKindForTowerVisualContract,
  type TowerVisualContract,
} from "@/lib/tower/visual-contract";

export interface TowerChatVisibleTable {
  id: string;
  title: string;
  columns: string[];
  rows: string[][];
}

export interface TowerChatVisibleTab {
  id: string;
  label: string;
  prose: string;
  tables?: TowerChatVisibleTable[];
}

export interface TowerChatVisibleAnswer {
  version?: "cio_tower_visible_answer_v1";
  answer: string;
  tables?: TowerChatVisibleTable[];
  tabs?: TowerChatVisibleTab[];
  visualContract?: TowerVisualContract | null;
  followUpQuestion?: string | null;
}

export interface BuildTowerChatAvaAnswerPacketArgs {
  tenantKey: string;
  tenantName: string;
  question: string;
  modelOutput: TowerChatVisibleAnswer;
  response?: string | null;
  metricCards?: Array<{ label: string; value: string }>;
  gaps?: string[];
  validationStatus?: "passed" | "failed" | string | null;
  traceKey?: string | null;
}

function slugify(value: string, fallback: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 42);
  return normalized || fallback;
}

function uniqueColumnKey(
  label: string,
  index: number,
  used: Set<string>,
): string {
  const base = slugify(label, `column_${index + 1}`);
  let key = base;
  let suffix = 2;
  while (used.has(key)) {
    key = `${base}_${suffix}`;
    suffix += 1;
  }
  used.add(key);
  return key;
}

function parseNumeric(value: string): number | null {
  const raw = value.trim();
  if (!raw) return null;
  const compact = raw.replace(/[$,%\s,]/g, "");
  const multiplier = /b$/i.test(compact)
    ? 1_000_000_000
    : /m$/i.test(compact)
      ? 1_000_000
      : /k$/i.test(compact)
        ? 1_000
        : 1;
  const cleaned = compact.replace(/[bmk]$/i, "");
  if (!/^-?\d+(?:\.\d+)?$/.test(cleaned)) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed * multiplier : null;
}

function inferColumnFormat(
  label: string,
  values: string[],
): AnswerTableColumn["format"] {
  const text = label.toLowerCase();
  if (
    /\b(usd|amount|budget|cost|spend|value|revenue|renewal|exposure)\b/.test(
      text,
    )
  ) {
    return "currency";
  }
  if (
    /\b(percent|percentage|pct|share|ratio|confidence|readiness)\b/.test(text)
  ) {
    return "percent";
  }
  if (values.filter((value) => parseNumeric(value) !== null).length >= 2) {
    return "number";
  }
  return "text";
}

function visibleTableToAnswerTable(table: TowerChatVisibleTable): AnswerTable {
  const used = new Set<string>();
  const keys = table.columns.map((column, index) =>
    uniqueColumnKey(column, index, used),
  );
  const columns: AnswerTableColumn[] = table.columns.map((column, index) => {
    const values = table.rows.map((row) => row[index] ?? "");
    const format = inferColumnFormat(column, values);
    return {
      key: keys[index] ?? `column_${index + 1}`,
      label: column,
      format,
      align: format === "text" ? "left" : "right",
    };
  });

  return {
    id: slugify(table.id || table.title, "tower_table"),
    title: table.title,
    columns,
    rows: table.rows.map((row) =>
      Object.fromEntries(
        columns.map((column, index) => [column.key, row[index] ?? null]),
      ),
    ),
  };
}

function numericColumns(table: AnswerTable): AnswerTableColumn[] {
  return table.columns.filter((column) => {
    if (column.format === "text" || column.format === "date") return false;
    return (
      table.rows.filter(
        (row) => parseNumeric(String(row[column.key] ?? "")) !== null,
      ).length >= 2
    );
  });
}

function labelColumn(table: AnswerTable): AnswerTableColumn | null {
  return (
    table.columns.find((column) => column.format === "text") ??
    table.columns[0] ??
    null
  );
}

function visualKindFor(
  question: string,
  visualContract?: TowerVisualContract | null,
): AnswerChartKind {
  const contractedKind = chartKindForTowerVisualContract(visualContract);
  if (contractedKind) return contractedKind;
  const normalized = question.toLowerCase();
  if (/\b(2x2|2\s*x\s*2|quadrant|matrix)\b/.test(normalized))
    return "quadrant-matrix";
  if (/\b(trend|fy\d{2}|year|over time|trajectory)\b/.test(normalized))
    return "line";
  return "horizontal-bar";
}

function unitFor(column: AnswerTableColumn): string | undefined {
  if (column.format === "currency") return "usd";
  if (column.format === "percent") return "%";
  return undefined;
}

function findColumnByLabel(
  table: AnswerTable,
  pattern: RegExp,
): AnswerTableColumn | null {
  return (
    table.columns.find((column) => pattern.test(column.label.toLowerCase())) ??
    null
  );
}

// Reads the qualifier word(s) in one half of a quadrant label ("High Value",
// "Lower Evidence", "No Value Claim") and maps it to a 0-100 score, WITHOUT
// hardcoding which dimension name (value/complexity/evidence/readiness/risk/
// whatever) it's paired with. A live production eval found the previous
// version — which only recognized the literal words "value" and "complexity"
// — silently produced zero chartable points for a real answer whose axes
// were "value" and "evidence confidence" ("High Value / Lower Evidence"),
// because the regex required "complexity" specifically. "No X" (e.g. "No
// Value Claim") returns null on purpose — that means the model is saying
// there's no measurable position on this axis, not a low one; the caller
// should exclude that point from the plot rather than guess a coordinate.
function levelScoreFromText(
  text: string,
  scale: { high: number; moderate: number; low: number },
): number | null {
  if (/\bno\b/.test(text)) return null;
  if (/\bhigh(?:est|er)?\b|\bstrong\b|\bsignificant\b/.test(text))
    return scale.high;
  if (/\bmoderate\b|\bmedium\b|\bmid\b/.test(text)) return scale.moderate;
  if (/\blow(?:er)?\b|\bsmall\b|\bweak\b|\bminimal\b|\bcontained\b/.test(text))
    return scale.low;
  return null;
}

function scoreFromQuadrantLabel(value: string): { x: number; y: number } | null {
  const normalized = value.toLowerCase();
  const [yPart, xPart] = normalized.split("/").map((part) => part.trim());
  if (!yPart || !xPart) return null;
  // Same numeric scale as before this fix — only the word-matching
  // generalized, so labels using the original "value"/"complexity" wording
  // still plot at the exact same coordinates.
  const y = levelScoreFromText(yPart, { high: 82, moderate: 58, low: 35 });
  const x = levelScoreFromText(xPart, { high: 78, moderate: 58, low: 38 });
  if (x === null || y === null) return null;
  return { x, y };
}

function quadrantChartFromLabels(table: AnswerTable): AnswerChart | null {
  const quadrant = findColumnByLabel(table, /\bquadrant\b/);
  if (!quadrant) return null;
  const label = findColumnByLabel(table, /\b(program|initiative|move|lever)\b/);
  if (!label) return null;
  const points = table.rows
    .map((row) => {
      const score = scoreFromQuadrantLabel(String(row[quadrant.key] ?? ""));
      const pointLabel = String(row[label.key] ?? "").trim();
      return score && pointLabel ? { label: pointLabel, ...score } : null;
    })
    .filter((point): point is { label: string; x: number; y: number } =>
      Boolean(point),
    );
  if (points.length < 2) return null;
  return {
    id: `${table.id}_chart`,
    kind: "quadrant-matrix",
    title: table.title ?? "Tower decision matrix",
    subtitle: "Quadrant labels converted into value and complexity coordinates.",
    data: { points },
    sourceNote:
      "Visualized from the governed Tower answer contract; quadrant labels set the plotted position.",
  };
}

function chartFromTable(
  table: AnswerTable,
  question: string,
  visualContract?: TowerVisualContract | null,
): AnswerChart | null {
  const label = labelColumn(table);
  const numbers = numericColumns(table);

  const kind = visualKindFor(question, visualContract);
  if (kind === "quadrant-matrix") {
    const quadrant = quadrantChartFromLabels(table);
    if (quadrant) return enrichChartWithVisualContract(quadrant, visualContract);
  }

  if (!label || numbers.length === 0) return null;

  if (kind === "quadrant-matrix" && numbers.length >= 2) {
    return {
      id: `${table.id}_chart`,
      kind,
      title: table.title ?? "Tower decision matrix",
      subtitle: "Governed Tower answer data rendered as a visual decision aid.",
      data: {
        points: table.rows
          .map((row) => ({
            label: String(row[label.key] ?? ""),
            x: parseNumeric(String(row[numbers[0]?.key ?? ""] ?? "")) ?? 0,
            y: parseNumeric(String(row[numbers[1]?.key ?? ""] ?? "")) ?? 0,
          }))
          .filter(
            (point) =>
              point.label &&
              Number.isFinite(point.x) &&
              Number.isFinite(point.y),
          ),
      },
      sourceNote: sourceNoteForVisualContract(visualContract),
    };
  }

  const y = numbers[0];
  if (!y) return null;
  const y2 = numbers[1];
  // Reaching here with kind === "quadrant-matrix" means neither the
  // label-based nor the 2-numeric-column quadrant path above produced valid
  // points (e.g. no "quadrant" column and fewer than 2 numeric columns).
  // This branch's data shape ({data, xKey, yKey}) is a single-series bar/line
  // shape, not the {points} shape a quadrant-matrix renderer expects — tagging
  // it "quadrant-matrix" here would silently fail to render anything.
  // Downgrade to horizontal-bar so the shape and the kind stay consistent.
  const effectiveKind = kind === "quadrant-matrix" ? "horizontal-bar" : kind;
  return {
    id: `${table.id}_chart`,
    kind: effectiveKind,
    title: table.title ?? "Tower answer visual",
    subtitle:
      visualContract?.executiveTakeaway ??
      "Governed Tower answer data rendered as a visual decision aid.",
    data: {
      data: table.rows.map((row) => ({
        [label.key]: String(row[label.key] ?? ""),
        [y.key]: parseNumeric(String(row[y.key] ?? "")) ?? 0,
        ...(y2
          ? { [y2.key]: parseNumeric(String(row[y2.key] ?? "")) ?? 0 }
          : {}),
      })),
      xKey: label.key,
      yKey: y.key,
      ...(y2 ? { yKey2: y2.key } : {}),
      unit: unitFor(y),
    },
    xKey: label.key,
    yKey: y.key,
    unit: unitFor(y),
    sourceNote: sourceNoteForVisualContract(visualContract),
  };
}

function sourceNoteForVisualContract(
  visualContract?: TowerVisualContract | null,
): string {
  if (!visualContract) return "Visualized from the governed Tower answer contract.";
  const annotations = visualContract.annotations.length
    ? ` ${visualContract.annotations.slice(0, 2).join(" ")}`
    : "";
  return `${visualContract.sourceBoundary}${annotations}`;
}

function enrichChartWithVisualContract(
  chart: AnswerChart,
  visualContract?: TowerVisualContract | null,
): AnswerChart {
  if (!visualContract) return chart;
  return {
    ...chart,
    subtitle: visualContract.executiveTakeaway,
    sourceNote: sourceNoteForVisualContract(visualContract),
  };
}

function metricCardsToTable(
  metricCards: Array<{ label: string; value: string }> | undefined,
): AnswerTable | null {
  if (!metricCards?.length) return null;
  return {
    id: "tower_metric_cards",
    title: "Tower metrics referenced",
    columns: [
      { key: "metric", label: "Metric", format: "text", align: "left" },
      { key: "value", label: "Value", format: "text", align: "right" },
    ],
    rows: metricCards.map((card) => ({
      metric: card.label,
      value: card.value,
    })),
  };
}

function collectTables(modelOutput: TowerChatVisibleAnswer): AnswerTable[] {
  return [
    ...(modelOutput.tables ?? []),
    ...(modelOutput.tabs ?? []).flatMap((tab) => tab.tables ?? []),
  ].map(visibleTableToAnswerTable);
}

export function buildTowerChatAvaAnswerPacket({
  tenantKey,
  tenantName,
  question,
  modelOutput,
  response,
  metricCards,
  gaps,
  validationStatus,
  traceKey,
}: BuildTowerChatAvaAnswerPacketArgs): AvaAnswerPacket {
  const answerTables = collectTables(modelOutput);
  const metricTable = metricCardsToTable(metricCards);
  const tables = [...answerTables, ...(metricTable ? [metricTable] : [])];
  const charts = answerTables
    .map((table) => chartFromTable(table, question, modelOutput.visualContract))
    .filter((chart): chart is AnswerChart => chart !== null)
    .slice(0, 2);
  const artifacts: AvaArtifact[] = [
    ...charts.map((chart) => ({ ...chart, artifact: "chart" as const })),
    ...tables.map((table) => ({ ...table, artifact: "table" as const })),
  ];
  const metricsUsed: AvaMetricRef[] =
    metricCards?.map((card, index) => ({
      id: `tower_metric_${index + 1}`,
      label: card.label,
      value: card.value,
    })) ?? [];

  return composeAvaAnswer({
    surface: "tower",
    mode: "CONTROL",
    tenantKey,
    question,
    intent: "tower_governed_answer",
    status: validationStatus === "failed" ? "partial" : "answered",
    directAnswer: modelOutput.answer || response || "",
    interpretation: `This Tower answer is scoped to ${tenantName}'s governed performance and value-control context.`,
    artifacts,
    metricsUsed,
    gaps:
      gaps?.map((gap, index) => ({
        id: `tower_gap_${index + 1}`,
        label: "Tower evidence gap",
        detail: gap,
      })) ?? [],
    caveats: [
      {
        id: "tower-decision-support",
        label: "Decision-support boundary",
        detail:
          "Tower can structure the executive read and visual decision artifact; accountable owners remain responsible for review and approval.",
      },
    ],
    nextSteps: modelOutput.followUpQuestion
      ? [
          {
            id: "tower_follow_up",
            label: modelOutput.followUpQuestion,
            targetSurface: "tower",
          },
        ]
      : [],
    citations: traceKey
      ? [
          {
            id: "tower_trace",
            label: "Tower governed answer trace",
            sourceClass: "tenant-fact",
            recordId: traceKey,
            confidence: validationStatus === "failed" ? "medium" : "high",
          },
        ]
      : [],
    retrievalSummary: {
      substrate: "production_view",
      hasTenantFacts: true,
      metricCount: metricsUsed.length,
      sourceCount: traceKey ? 1 : 0,
    },
  });
}
