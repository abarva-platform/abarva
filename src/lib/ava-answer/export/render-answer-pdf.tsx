import "server-only";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  type DocumentProps,
} from "@react-pdf/renderer";
import type { ReactElement } from "react";

import { isVisibleAvaArtifact } from "@/lib/ava-answer/renderable-artifacts";
import { sanitizeAvaAnswerForRender } from "@/lib/intelligence/answer/answer-safety";
import type {
  AnswerChart,
  AnswerGraph,
  AnswerTable,
  AnswerTableColumn,
  AvaAnswerPacket,
} from "@/lib/ava-answer/contract";
import type { AvaChatSessionExport } from "@/lib/ava-answer/export/session-types";
import { cleanAvaExportText } from "@/lib/ava-answer/export/render-text";

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: "Helvetica",
    color: "#111827",
    backgroundColor: "#ffffff",
  },
  eyebrow: {
    fontSize: 8,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "#166534",
    fontWeight: 700,
    marginBottom: 6,
  },
  title: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
  },
  meta: {
    fontSize: 8,
    color: "#6b7280",
    marginBottom: 16,
  },
  prose: {
    fontSize: 10,
    lineHeight: 1.55,
    marginBottom: 12,
  },
  card: {
    borderColor: "#dedacf",
    borderWidth: 1,
    borderRadius: 4,
    padding: 10,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    borderBottomColor: "#e5e1d8",
    borderBottomWidth: 0.5,
  },
  headerCell: {
    flex: 1,
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#6b7280",
    padding: 5,
    textTransform: "uppercase",
  },
  cell: {
    flex: 1,
    fontSize: 8,
    padding: 5,
  },
  quadrantGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderColor: "#111827",
    borderWidth: 1,
  },
  quadrant: {
    width: "50%",
    minHeight: 92,
    padding: 8,
    borderColor: "#dedacf",
    borderWidth: 0.5,
  },
  quadrantTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  chartRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  chartLabel: {
    width: "31%",
    fontSize: 8,
    paddingRight: 6,
  },
  chartTrack: {
    width: "52%",
    height: 7,
    backgroundColor: "#edf1ee",
    borderRadius: 3,
  },
  chartBar: {
    height: 7,
    backgroundColor: "#166534",
    borderRadius: 3,
  },
  chartValue: {
    width: "17%",
    fontSize: 8,
    color: "#374151",
    textAlign: "right",
  },
  graphEdge: {
    borderBottomColor: "#e5e1d8",
    borderBottomWidth: 0.5,
    paddingBottom: 5,
    marginBottom: 5,
  },
  graphEdgeMain: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
  },
  graphEdgeLabel: {
    fontSize: 8,
    color: "#6b7280",
    marginTop: 2,
  },
  bullet: {
    fontSize: 8,
    marginBottom: 3,
  },
  note: {
    fontSize: 8,
    color: "#6b7280",
    marginTop: 6,
  },
  turn: {
    borderLeftColor: "#dedacf",
    borderLeftWidth: 3,
    paddingLeft: 10,
    marginBottom: 14,
  },
  userTurn: {
    borderLeftColor: "#111827",
  },
  agentTurn: {
    borderLeftColor: "#166534",
  },
  turnLabel: {
    fontSize: 7,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#6b7280",
    fontFamily: "Helvetica-Bold",
    marginBottom: 5,
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 14,
  },
  statBox: {
    width: "31%",
    borderColor: "#dedacf",
    borderWidth: 1,
    borderRadius: 4,
    padding: 7,
  },
  statNumber: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
  },
  statLabel: {
    fontSize: 7,
    color: "#6b7280",
    textTransform: "uppercase",
  },
});

function text(value: unknown): string {
  return cleanAvaExportText(value).replace(/\s+/g, " ").trim();
}

function paragraphs(value: string): string[] {
  return cleanAvaExportText(value)
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function parseNumericCellValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(/[$,\s]/g, "");
  if (!/^-?\d+(?:\.\d+)?$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function inferredCellFormat(
  column: AnswerTableColumn,
): "currency" | "percent" | "number" | null {
  if (column.format === "text") return null;
  if (
    column.format === "currency" ||
    column.format === "percent" ||
    column.format === "number"
  ) {
    return column.format;
  }
  const name = `${column.key} ${column.label}`.toLowerCase();
  if (/\b(usd|amount|budget|cost|spend|revenue|value|rate)\b/.test(name)) {
    return "currency";
  }
  if (/\b(percent|percentage|pct|share|ratio)\b/.test(name)) return "percent";
  if (/\b(count|employees?|users?|records?|volume|number)\b/.test(name)) {
    return "number";
  }
  return null;
}

function trimCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: Math.abs(value) >= 10 ? 1 : 2,
  }).format(value);
}

function formatCompactUsd(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000)
    return `$${trimCompactNumber(value / 1_000_000_000)}B`;
  if (abs >= 1_000_000) return `$${trimCompactNumber(value / 1_000_000)}M`;
  if (abs >= 1_000) return `$${trimCompactNumber(value / 1_000)}K`;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number): string {
  const normalized = Math.abs(value) <= 1 ? value : value / 100;
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(normalized);
}

function formatCell(
  value: string | number | null,
  column: AnswerTableColumn,
): string {
  if (value === null) return "-";
  const numeric = parseNumericCellValue(value);
  const format = inferredCellFormat(column);
  if (numeric !== null && format === "currency") return formatCompactUsd(numeric);
  if (numeric !== null && format === "percent") return formatPercent(numeric);
  if (numeric !== null && format === "number") {
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(
      numeric,
    );
  }
  return text(value);
}

function tableBlock(table: AnswerTable): ReactElement {
  return (
    <View style={styles.card} wrap={false}>
      <Text style={styles.cardTitle}>{table.title ?? "Table"}</Text>
      <View style={styles.row}>
        {table.columns.slice(0, 5).map((column) => (
          <Text key={column.key} style={styles.headerCell}>
            {column.label}
          </Text>
        ))}
      </View>
      {table.rows.slice(0, 16).map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {table.columns.slice(0, 5).map((column) => (
            <Text key={column.key} style={styles.cell}>
              {formatCell(row[column.key] ?? null, column) || "-"}
            </Text>
          ))}
        </View>
      ))}
      {table.note ? <Text style={styles.note}>{table.note}</Text> : null}
    </View>
  );
}

function quadrantPoints(chart: AnswerChart): Array<{ label: string; x: number; y: number }> {
  const data = chart.data as { points?: unknown };
  if (!Array.isArray(data?.points)) return [];
  return data.points.flatMap((point) => {
    if (typeof point !== "object" || point === null) return [];
    const record = point as Record<string, unknown>;
    const label = text(record.label);
    const x = typeof record.x === "number" ? record.x : null;
    const y = typeof record.y === "number" ? record.y : null;
    return label && x !== null && y !== null ? [{ label, x, y }] : [];
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function chartSeriesRows(chart: AnswerChart): Array<{
  label: string;
  value: number | null;
  displayValue: string;
}> {
  if (!isRecord(chart.data)) return [];
  const data = chart.data;
  const sourceRows = Array.isArray(chart.data.data)
    ? chart.data.data
    : Array.isArray(chart.data.points)
      ? chart.data.points
      : Array.isArray(chart.data.phases)
        ? chart.data.phases
        : Array.isArray(chart.data.steps)
          ? chart.data.steps
          : [];

  return sourceRows.flatMap((row) => {
    if (!isRecord(row)) return [];
    const labelKey =
      chart.xKey ||
      (typeof data.xKey === "string" ? data.xKey : null) ||
      ["label", "name", "phase", "workstream", "Year", "year", "category"].find(
        (key) => row[key] !== undefined,
      );
    const valueKey =
      chart.yKey ||
      (typeof data.yKey === "string" ? data.yKey : null) ||
      ["value", "Value", "amount", "cost", "spend", "Adoption", "y"].find(
        (key) => parseNumericCellValue(row[key]) !== null,
      );
    const label = text(labelKey ? row[labelKey] : "");
    if (!label) return [];
    const numeric = valueKey ? parseNumericCellValue(row[valueKey]) : null;
    const unit = chart.unit || (typeof data.unit === "string" ? data.unit : "");
    return [
      {
        label,
        value: numeric,
        displayValue:
          numeric === null
            ? text(valueKey ? row[valueKey] : "")
            : unit === "%"
              ? `${trimCompactNumber(numeric)}%`
              : trimCompactNumber(numeric),
      },
    ];
  });
}

function chartBlock(chart: AnswerChart): ReactElement {
  if (chart.kind !== "quadrant-matrix" && chart.kind !== "2x2-matrix") {
    const rows = chartSeriesRows(chart).slice(0, 12);
    const maxValue = Math.max(
      ...rows.flatMap((row) => (row.value !== null ? [Math.abs(row.value)] : [])),
      1,
    );
    return (
      <View style={styles.card} wrap={false}>
        <Text style={styles.cardTitle}>{chart.title ?? chart.kind}</Text>
        {chart.subtitle ? <Text style={styles.note}>{chart.subtitle}</Text> : null}
        {rows.length > 0 ? (
          <View>
            {rows.map((row) => (
              <View key={`${row.label}-${row.displayValue}`} style={styles.chartRow}>
                <Text style={styles.chartLabel}>{row.label}</Text>
                <View style={styles.chartTrack}>
                  <View
                    style={[
                      styles.chartBar,
                      {
                        width: `${Math.max(
                          6,
                          Math.min(
                            100,
                            row.value === null
                              ? 0
                              : (Math.abs(row.value) / maxValue) * 100,
                          ),
                        )}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.chartValue}>{row.displayValue}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.note}>
            Chart exhibit preserved with title and governed metadata; no compact
            tabular series was available for PDF rendering.
          </Text>
        )}
        {chart.sourceNote ? <Text style={styles.note}>{chart.sourceNote}</Text> : null}
      </View>
    );
  }
  const points = quadrantPoints(chart);
  const cells = [
    {
      title: "Quick wins",
      rows: points.filter((point) => point.y >= 50 && point.x < 50),
    },
    {
      title: "Strategic bets",
      rows: points.filter((point) => point.y >= 50 && point.x >= 50),
    },
    {
      title: "Monitor",
      rows: points.filter((point) => point.y < 50 && point.x < 50),
    },
    {
      title: "Defer",
      rows: points.filter((point) => point.y < 50 && point.x >= 50),
    },
  ];
  return (
    <View style={styles.card} wrap={false}>
      <Text style={styles.cardTitle}>{chart.title ?? "Value / Complexity Matrix"}</Text>
      <View style={styles.quadrantGrid}>
        {cells.map((cell) => (
          <View key={cell.title} style={styles.quadrant}>
            <Text style={styles.quadrantTitle}>{cell.title}</Text>
            {cell.rows.length > 0 ? (
              cell.rows.map((point) => (
                <Text key={point.label} style={styles.bullet}>
                  {point.label}
                </Text>
              ))
            ) : (
              <Text style={styles.note}>No ranked item</Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

function graphBlock(graph: AnswerGraph): ReactElement {
  const nodeLabelById = new Map(graph.nodes.map((node) => [node.id, node.label]));
  const edges = graph.edges.slice(0, 16);
  return (
    <View style={styles.card} wrap={false}>
      <Text style={styles.cardTitle}>{graph.title ?? "Relationship graph"}</Text>
      <Text style={styles.note}>
        {graph.nodes.length} nodes | {graph.edges.length} relationships
      </Text>
      {edges.length > 0 ? (
        edges.map((edge, index) => (
          <View key={`${edge.from}-${edge.to}-${index}`} style={styles.graphEdge}>
            <Text style={styles.graphEdgeMain}>
              {text(nodeLabelById.get(edge.from) ?? edge.from)}
              {" -> "}
              {text(nodeLabelById.get(edge.to) ?? edge.to)}
            </Text>
            {edge.label || edge.kind ? (
              <Text style={styles.graphEdgeLabel}>
                {[edge.label, edge.kind].filter(Boolean).join(" | ")}
              </Text>
            ) : null}
          </View>
        ))
      ) : (
        <Text style={styles.note}>No visible relationships available.</Text>
      )}
    </View>
  );
}

function answerBlocks(answer: AvaAnswerPacket): ReactElement[] {
  const display = sanitizeAvaAnswerForRender(answer);
  const artifacts = display.artifacts.filter(isVisibleAvaArtifact);
  const charts = artifacts.filter((artifact) => artifact.artifact === "chart");
  const tables = artifacts.filter((artifact) => artifact.artifact === "table");
  const graphs = artifacts.filter((artifact) => artifact.artifact === "graph");

  return [
    ...paragraphs(display.directAnswer).map((paragraph, index) => (
      <Text key={`p-${index}`} style={styles.prose}>
        {paragraph}
      </Text>
    )),
    ...charts.map((chart) => <View key={chart.id}>{chartBlock(chart)}</View>),
    ...graphs.map((graph) => <View key={graph.id}>{graphBlock(graph)}</View>),
    ...tables.map((table) => <View key={table.id}>{tableBlock(table)}</View>),
    ...(display.caveats.length > 0
      ? [
          <View key="caveats" style={styles.card} wrap={false}>
            <Text style={styles.cardTitle}>Caveats</Text>
            {display.caveats.slice(0, 8).map((caveat) => (
              <Text key={caveat.id} style={styles.bullet}>
                {[caveat.label, caveat.detail].filter(Boolean).join(" - ")}
              </Text>
            ))}
          </View>,
        ]
      : []),
    ...(display.nextSteps.length > 0
      ? [
          <View key="next-steps" style={styles.card} wrap={false}>
            <Text style={styles.cardTitle}>Recommended Next Moves</Text>
            {display.nextSteps.slice(0, 8).map((step) => (
              <Text key={step.id} style={styles.bullet}>
                {[step.label, step.rationale].filter(Boolean).join(" - ")}
              </Text>
            ))}
          </View>,
        ]
      : []),
  ];
}

export function buildAvaAnswerPdf(
  answer: AvaAnswerPacket,
): ReactElement<DocumentProps> {
  const display = sanitizeAvaAnswerForRender(answer);
  const generatedAt = new Date().toISOString();
  const surfaceLabel = display.surface.charAt(0).toUpperCase() + display.surface.slice(1);

  return (
    <Document
      title={`aVa answer export - ${display.tenantKey}`}
      author="AbarVa"
      creator="AbarVa"
      producer="AbarVa"
    >
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.eyebrow}>aVa {surfaceLabel} Export</Text>
        <Text style={styles.title}>{display.question}</Text>
        <Text style={styles.meta}>
          {display.tenantKey} | {display.status} | {display.quality.confidence} confidence | {generatedAt}
        </Text>
        {answerBlocks(display)}
      </Page>
    </Document>
  );
}

export function buildAvaChatSessionPdf(
  session: AvaChatSessionExport,
): ReactElement<DocumentProps> {
  const generatedAt = new Date().toISOString();
  const answers = session.turns.flatMap((turn) => (turn.answer ? [turn.answer] : []));
  const artifacts = answers.flatMap((answer) =>
    sanitizeAvaAnswerForRender(answer).artifacts.filter(isVisibleAvaArtifact),
  );
  const title = session.title?.trim() || "aVa Executive Session Export";
  const surfaceLabel =
    session.surface.charAt(0).toUpperCase() + session.surface.slice(1);
  const tenant =
    session.tenantKey?.trim() ||
    session.turns.find((turn) => turn.answer)?.answer?.tenantKey ||
    "tenant";
  const stats = [
    ["User turns", session.turns.filter((turn) => turn.role === "user").length],
    ["aVa turns", session.turns.filter((turn) => turn.role === "agent").length],
    ["Governed answers", answers.length],
    ["Visual artifacts", artifacts.length],
    ["Evidence refs", answers.reduce((sum, answer) => sum + answer.citations.length, 0)],
    ["Blocked answers", answers.filter((answer) => answer.status === "blocked").length],
  ] as const;

  return (
    <Document
      title={`aVa session export - ${tenant}`}
      author="AbarVa"
      creator="AbarVa"
      producer="AbarVa"
    >
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.eyebrow}>aVa {surfaceLabel} Session Export</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.meta}>
          {tenant} | {session.surface} | {session.turns.length} turns | {generatedAt}
        </Text>
        <View style={styles.statGrid}>
          {stats.map(([label, value]) => (
            <View key={label} style={styles.statBox}>
              <Text style={styles.statNumber}>{value}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </View>
        {session.turns.map((turn, index) => (
          <View
            key={turn.id || index}
            style={[
              styles.turn,
              turn.role === "user" ? styles.userTurn : styles.agentTurn,
            ]}
          >
            <Text style={styles.turnLabel}>
              {turn.role === "user" ? "User prompt" : "aVa response"} {index + 1}
            </Text>
            {turn.answer ? (
              answerBlocks(turn.answer)
            ) : (
              paragraphs(turn.body).map((paragraph, paragraphIndex) => (
                <Text key={paragraphIndex} style={styles.prose}>
                  {paragraph}
                </Text>
              ))
            )}
          </View>
        ))}
        <Text style={styles.note}>
          Decision-support artifact. Accountable owners remain responsible for
          review, approval, and external use.
        </Text>
      </Page>
    </Document>
  );
}
